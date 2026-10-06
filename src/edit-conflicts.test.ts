import assert from "node:assert/strict";
import test from "node:test";
import { MCP_TOOLS, handleMcpRequest } from "./index.js";

type JsonRpcResponse = Awaited<ReturnType<typeof handleMcpRequest>>;

/**
 * A tool failure: the isError result MCP reports tool errors as, or the
 * JSON-RPC error a protocol fault (unknown tool, malformed request) still is.
 */
function toolFailure(response: JsonRpcResponse): { message: string; data?: Record<string, unknown> } | undefined {
  if (response.error) return { message: response.error.message, data: response.error.data as Record<string, unknown> | undefined };
  const result = response.result as
    | { isError?: boolean; content?: Array<{ text?: string }>; structuredContent?: Record<string, unknown> }
    | undefined;
  if (!result?.isError) return undefined;
  const { error: _message, ...data } = result.structuredContent ?? {};
  return { message: result.content?.[0]?.text ?? "", data: Object.keys(data).length > 0 ? data : undefined };
}

/**
 * Agents and people editing the same thing (QA run 0924a, D2: mcp/F02, F03,
 * F04). An agent only discovers what the tool schema advertises, so each of the
 * three whole-object writers must ADVERTISE its compare-and-set token, say to
 * read first and to re-read on a conflict, pass the token through, and turn the
 * server's 409 into an instruction the agent can act on without looping.
 */

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}

type Tool = {
  name: string;
  description: string;
  inputSchema: { properties?: Record<string, { type?: unknown; description?: string }> };
};

function findTool(name: string): Tool {
  const tool = MCP_TOOLS.find((candidate) => candidate.name === name);
  assert.ok(tool, `expected an MCP tool named ${name}`);
  return tool as unknown as Tool;
}

let tokenCounter = 0;
function recording(respond: (url: string, init?: RequestInit) => Response) {
  const calls: Array<{ url: string; body: Record<string, unknown> | null }> = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), body: init?.body ? JSON.parse(String(init.body)) : null });
    return respond(String(url), init);
  };
  return { calls, fetchImpl };
}

async function callTool(name: string, args: Record<string, unknown>, fetchImpl: typeof fetch) {
  tokenCounter += 1;
  return handleMcpRequest(
    { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } },
    {
      apiBaseUrl: "https://api.test",
      token: `mt_pat_conflicts_${tokenCounter}`,
      publicationId: "pub_1",
      envPublicationFallback: false,
      fetchImpl
    }
  );
}

const ADVERTISED: Array<[tool: string, argument: string, reread: string]> = [
  ["template.update", "base_revision", "template.get"],
  ["template.publish", "base_revision", "template.get"],
  ["automation.update", "base_version", "automation.get"],
  ["issue.update_draft", "baseUpdatedAt", "issue.get_editor"]
];

for (const [toolName, argument, reread] of ADVERTISED) {
  test(`${toolName} advertises ${argument}, and says to read first and re-read on a conflict`, () => {
    const tool = findTool(toolName);
    const property = tool.inputSchema.properties?.[argument];
    assert.ok(property, `${toolName} must advertise ${argument}`);
    const described = `${property.description ?? ""}`;
    assert.match(described, /Read first/);
    assert.match(described, new RegExp(reread.replace(".", "\\.")));
    assert.match(described, /Never resend/);
    assert.match(tool.description, new RegExp(argument));
  });
}

test("template.update sends base_revision and turns stale_write into a re-read instruction", async () => {
  const { calls, fetchImpl } = recording(() =>
    json(409, {
      error: "This template was changed elsewhere since you read it",
      code: "stale_write",
      current_revision: 7
    })
  );
  const response = await callTool(
    "template.update",
    { templateId: "etpl_1", subject: "New", base_revision: 6 },
    fetchImpl
  );
  const patch = calls.find((call) => new URL(call.url).pathname === "/v1/templates/etpl_1");
  assert.equal(patch?.body?.base_revision, 6);
  const message = toolFailure(response)?.message ?? "";
  assert.match(message, /Changed elsewhere/);
  assert.match(message, /template\.get/);
  assert.match(message, /base_revision 7/);
  assert.match(message, /Do not resend/);
  assert.equal((toolFailure(response)?.data as { current_revision?: number } | undefined)?.current_revision, 7);
});

test("automation.update sends base_version and turns stale_version into a re-read instruction", async () => {
  const { calls, fetchImpl } = recording(() =>
    json(409, {
      error: "This automation's steps were changed elsewhere",
      code: "stale_version",
      current_version: 3
    })
  );
  const response = await callTool(
    "automation.update",
    {
      automation_id: "aut_1",
      base_version: 2,
      steps: [{ key: "start", type: "trigger", config: { trigger_type: "contact.created" } }]
    },
    fetchImpl
  );
  const patch = calls.find((call) => new URL(call.url).pathname === "/v1/automations/aut_1");
  assert.equal(patch?.body?.base_version, 2);
  const message = toolFailure(response)?.message ?? "";
  assert.match(message, /automation\.get/);
  assert.match(message, /base_version 3/);
});

test("issue.update_draft sends baseUpdatedAt and turns the conflict into a re-read instruction", async () => {
  const { calls, fetchImpl } = recording(() =>
    json(409, {
      error: {
        message:
          "This post changed elsewhere. Reload before saving again, or your edits will overwrite the newer version.",
        code: -32603,
        data: { code: "CONFLICT" }
      }
    })
  );
  const response = await callTool(
    "issue.update_draft",
    { issueId: "iss_1", contentHtml: "<p>x</p>", baseUpdatedAt: "2026-09-27T00:00:00.000Z" },
    fetchImpl
  );
  const update = calls.find((call) => new URL(call.url).pathname === "/trpc/issue.updateDraft");
  assert.equal(update?.body?.baseUpdatedAt, "2026-09-27T00:00:00.000Z");
  const message = toolFailure(response)?.message ?? "";
  assert.match(message, /issue\.get_editor/);
  assert.match(message, /baseUpdatedAt/);
  assert.doesNotMatch(message, /reload/i, "an agent has no page to reload");
});

test("a write with no token still goes out unconditionally, as before", async () => {
  const { calls, fetchImpl } = recording(() =>
    json(200, { object: "template", id: "etpl_1", revision: 1, has_unpublished_versions: false })
  );
  const response = await callTool("template.update", { templateId: "etpl_1", subject: "New" }, fetchImpl);
  assert.equal(toolFailure(response), undefined, JSON.stringify(toolFailure(response)));
  const patch = calls.find((call) => new URL(call.url).pathname === "/v1/templates/etpl_1");
  assert.equal(patch?.body && "base_revision" in patch.body, false);
});

test("template.publish sends base_revision as a JSON body, and nothing without it", async () => {
  const { calls, fetchImpl } = recording(() =>
    json(200, { object: "template", id: "etpl_1", status: "published", revision: 4 })
  );
  await callTool("template.publish", { templateId: "etpl_1", base_revision: 4 }, fetchImpl);
  await callTool("template.publish", { templateId: "etpl_1" }, fetchImpl);
  const publishes = calls.filter((call) => new URL(call.url).pathname === "/v1/templates/etpl_1/publish");
  assert.equal(publishes.length, 2);
  assert.deepEqual(publishes[0]!.body, { base_revision: 4 });
  assert.equal(publishes[1]!.body, null, "a bare POST, as before");
});

test("issue.apply_ops points the agent at the live document's outline when the server sends one", async () => {
  const outline = { blocks: [{ path: "0", type: "container" }, { path: "0.1", type: "paragraph", text: "Two" }] };
  const { fetchImpl } = recording(() =>
    json(200, {
      result: {
        data: {
          issueId: "iss_1",
          title: "T",
          updatedAt: "2026-09-28T00:00:00.000Z",
          report: { applied: 0, skipped: [{ opIndex: 0, reason: "unknown_path", path: "1" }], outline }
        }
      }
    })
  );
  const response = await callTool(
    "issue.apply_ops",
    { issueId: "iss_1", ops: [{ op: "edit_text", edits: [{ path: "1", text: "x" }] }] },
    fetchImpl
  );
  const result = response.result as { content: Array<{ text: string }> };
  assert.match(result.content[0]!.text, /report\.outline is the document as it stands now/);
});
