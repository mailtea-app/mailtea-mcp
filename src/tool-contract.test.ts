import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { MCP_TOOLS, handleMcpRequest } from "./index.js";

/**
 * The contract an agent actually meets: what a tool's schema and description
 * promise against what the tool then does. Each case here is a mismatch a real
 * agent hit during the 2026-09-24 user-testing run (run 0924a), pinned so the
 * schema and the behaviour cannot drift apart again.
 */

type FetchCall = { url: string; init?: RequestInit };

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}

function trpcOk(data: unknown): Response {
  return json(200, { result: { data } });
}

function findTool(name: string) {
  const tool = MCP_TOOLS.find((candidate) => candidate.name === name);
  assert.ok(tool, `expected an MCP tool named ${name}`);
  return tool as unknown as {
    name: string;
    description: string;
    inputSchema: {
      properties?: Record<string, { description?: string; enum?: string[]; type?: unknown }>;
      required?: string[];
    };
  };
}

let tokenCounter = 0;

async function callTool(
  name: string,
  args: Record<string, unknown>,
  fetchImpl: typeof fetch,
  extra: {
    publicationId?: string | null;
    envPublicationFallback?: boolean;
    /** Reuse one token across calls. Each call gets its own by default, so the
     *  runtime's per-token discovery cache never carries between tests. */
    token?: string;
    reachablePublications?: ReadonlyArray<{ id: string; name: string }> | null;
  } = {}
) {
  tokenCounter += 1;
  return handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: { name, arguments: args }
    },
    {
      apiBaseUrl: "https://api.test",
      token: extra.token ?? `mt_pat_test_${tokenCounter}`,
      publicationId: extra.publicationId ?? null,
      envPublicationFallback: extra.envPublicationFallback,
      ...("reachablePublications" in extra ? { reachablePublications: extra.reachablePublications } : {}),
      fetchImpl
    }
  );
}

function recording(respond: (call: FetchCall) => Response | Promise<Response>) {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    const call = { url: String(url), init };
    calls.push(call);
    return respond(call);
  };
  return { calls, fetchImpl };
}

// --- mcp/F22: event.send schema errors -------------------------------------

test("event.send lists property-schema issues without a literal 'undefined'", async () => {
  // Event property issues carry {code, path, message} and no severity. The
  // automation formatter printed `issue.severity` unconditionally, so every
  // line read "- undefined missing_required_property [...]".
  const { fetchImpl } = recording(() =>
    json(422, {
      error: "Event properties do not match the event's schema",
      issues: [
        {
          code: "missing_required_property",
          path: "properties.plan",
          message: 'Required property "plan" is missing.'
        },
        {
          code: "property_type_mismatch",
          path: "properties.seats",
          message: 'Property "seats" must be number (got string).'
        }
      ]
    })
  );

  const response = await callTool(
    "event.send",
    { publication_id: "pub_1", event_name: "qa.upgraded", email: "a@example.com" },
    fetchImpl
  );

  const message = response.error?.message ?? "";
  assert.doesNotMatch(message, /undefined/);
  assert.match(message, /- missing_required_property \[properties\.plan\]: Required property "plan" is missing\./);
  assert.match(message, /- property_type_mismatch \[properties\.seats\]/);
});

test("automation issues that DO carry a severity still print it", async () => {
  const { fetchImpl } = recording(() =>
    json(422, {
      error: "Automation cannot be started until its errors are fixed",
      code: "automation_invalid",
      issues: [
        { code: "missing_template", severity: "error", step_key: "send", message: "Pick a template." }
      ]
    })
  );

  const response = await callTool(
    "automation.enable",
    { publication_id: "pub_1", automation_id: "aut_1" },
    fetchImpl
  );

  assert.match(response.error?.message ?? "", /- error missing_template \[send\]: Pick a template\./);
});

// --- mcp/F20: site.asset_upload and SVG -------------------------------------

test("site.asset_upload describes SVG the way the server treats it", () => {
  const tool = findTool("site.asset_upload");
  const contentType = tool.inputSchema.properties?.contentType;
  assert.ok(contentType?.enum?.includes("image/svg+xml"), "the server accepts SVG, so the enum offers it");
  assert.doesNotMatch(tool.description, /SVG is refused/i);
  assert.match(tool.description, /SVG/);
  // Accepted is not the same as renders everywhere: an agent putting an SVG
  // into an EMAIL needs to know most inboxes drop it.
  assert.match(tool.description, /Gmail/);
  assert.match(tool.description, /Outlook/);
});

// --- mcp/F12: REST error details --------------------------------------------

test("issue.create_draft passes the renderer's reason through, not just 'Spec rendering failed'", async () => {
  // The API answers `{error: "Spec rendering failed", details: "<why>"}`. The
  // MCP layer kept only `error`, so an agent saw the headline and never the
  // one sentence that said what to change.
  const { fetchImpl } = recording(() =>
    json(400, {
      error: "Spec rendering failed",
      details: 'Root element type "Teleporter" is not a known component, so the spec renders to an empty document.'
    })
  );

  const response = await callTool(
    "issue.create_draft",
    {
      publicationId: "pub_1",
      title: "Hello",
      contentSpec: { root: "a", elements: { a: { type: "Teleporter" } } }
    },
    fetchImpl
  );

  const message = response.error?.message ?? "";
  assert.match(message, /^Spec rendering failed/);
  assert.match(message, /Teleporter" is not a known component/);
});

test("a REST validation failure names the fields zod rejected", async () => {
  const { fetchImpl } = recording(() =>
    json(400, {
      error: "Validation failed",
      details: [
        { path: ["spec", "root"], message: "Required" },
        { path: ["name"], message: "String must contain at least 1 character(s)" }
      ]
    })
  );

  const response = await callTool(
    "template.render",
    { spec: { root: "", elements: {} } },
    fetchImpl
  );

  const message = response.error?.message ?? "";
  assert.match(message, /^Validation failed/);
  assert.match(message, /spec\.root: Required/);
  assert.match(message, /name: String must contain/);
});

// --- mcp/F16: automation.enable refusals carry their codes -------------------

test("automation.enable shows the refusal's code, reason and steps, as its description promises", async () => {
  const { fetchImpl } = recording(() =>
    json(422, {
      error:
        "This automation emails your contacts, and your team has no verified sending domain yet. Verify a domain under Domains, then start it again.",
      code: "no_verified_sender",
      reason: "CUSTOM_DOMAIN_REQUIRED",
      steps: ["welcome", "follow_up"]
    })
  );

  const response = await callTool(
    "automation.enable",
    { publication_id: "pub_1", automation_id: "aut_1" },
    fetchImpl
  );

  const message = response.error?.message ?? "";
  assert.match(message, /no verified sending domain yet/);
  assert.match(message, /code: no_verified_sender/);
  assert.match(message, /reason: CUSTOM_DOMAIN_REQUIRED/);
  assert.match(message, /steps: welcome, follow_up/);
  assert.deepEqual(
    response.error?.data,
    {
      status: 422,
      code: "no_verified_sender",
      reason: "CUSTOM_DOMAIN_REQUIRED",
      steps: ["welcome", "follow_up"]
    },
    "the same fields travel as structured data"
  );

  const described = findTool("automation.enable").description;
  for (const reason of ["CUSTOM_DOMAIN_REQUIRED", "BUILT_IN_SENDER"]) {
    assert.match(described, new RegExp(reason), `${reason} is a reason the tool can return, so its description names it`);
  }
});

// --- mcp/F21: domain.list region filter and domain.create purpose -----------

test("domain.list accepts the region it reports, not only the catalog", () => {
  // A domain with no stored region reports the deployment's default region,
  // which is outside the catalog in local development (us-east-1) and on
  // self-host. An enum of catalog codes told an agent it could not filter by
  // the very value domain.list had just printed.
  const region = findTool("domain.list").inputSchema.properties?.region;
  assert.ok(region, "domain.list still takes a region filter");
  assert.equal(region.enum, undefined, "the filter must not be closed to the catalog");
  assert.match(region.description ?? "", /as domain\.list reports it/);
});

test("domain.create says what an omitted purpose means", () => {
  const tool = findTool("domain.create");
  // It used to open "Register an email sending domain" while an omitted
  // purpose made a 'site' domain that can never send.
  assert.doesNotMatch(tool.description, /^Register an email sending domain/);
  assert.match(tool.description, /purpose/);
  const purpose = tool.inputSchema.properties?.purpose?.description ?? "";
  assert.match(purpose, /Defaults to 'site'/);
  assert.match(purpose, /cannot send/);
});

// --- mcp/F13: ai.generate_draft and the newsletter.* prompts ----------------

test("ai.generate_draft says it returns a scaffold and that no model runs", () => {
  const { description } = findTool("ai.generate_draft");
  assert.match(description, /scaffold/i);
  assert.match(description, /No AI model runs/);
  assert.match(description, /issue\.create_draft/);
});

test("ai.generate_draft's result is labelled a scaffold, not a generated draft", async () => {
  const { fetchImpl } = recording(() =>
    trpcOk({
      title: "Draft: A short newsletter announcing",
      content: [{ type: "paragraph", text: "Placeholder" }]
    })
  );

  const response = await callTool(
    "ai.generate_draft",
    { publicationId: "pub_1", prompt: "A short newsletter announcing agent tools", tone: "friendly" },
    fetchImpl
  );

  assert.equal(response.error, undefined);
  const result = response.result as {
    content: Array<{ text: string }>;
    structuredContent: Record<string, unknown>;
  };
  assert.doesNotMatch(result.content[0]!.text, /AI draft generated/);
  assert.match(result.content[0]!.text, /scaffold/i);
  assert.match(result.content[0]!.text, /nothing was saved/i);
  assert.equal(result.structuredContent.scaffold, true);
  assert.equal(result.structuredContent.saved, false);
  assert.equal(result.structuredContent.title, "Draft: A short newsletter announcing");
});

async function rpc(method: string, params: Record<string, unknown>) {
  return handleMcpRequest({ jsonrpc: "2.0", id: 1, method, params });
}

test("the newsletter.* prompts declare the arguments they use", async () => {
  const listed = await rpc("prompts/list", {});
  const prompts = (listed.result as {
    prompts: Array<{ name: string; arguments?: Array<{ name: string; required?: boolean }> }>;
  }).prompts;

  const draft = prompts.find((prompt) => prompt.name === "newsletter.draft_from_brief");
  assert.ok(draft?.arguments, "draft_from_brief must declare arguments");
  assert.deepEqual(
    draft.arguments.find((argument) => argument.name === "brief")?.required,
    true
  );

  const subjects = prompts.find((prompt) => prompt.name === "newsletter.subject_line_pack");
  assert.ok(subjects?.arguments, "subject_line_pack must declare arguments");
  assert.equal(subjects.arguments.find((argument) => argument.name === "topic")?.required, true);
});

test("newsletter.draft_from_brief embeds the brief it is given", async () => {
  const response = await rpc("prompts/get", {
    name: "newsletter.draft_from_brief",
    arguments: { brief: "Launch of agent tools", audience: "developers", call_to_action: "Read the docs" }
  });
  const text = (response.result as { messages: Array<{ content: { text: string } }> }).messages[0]!
    .content.text;
  assert.match(text, /Launch of agent tools/);
  assert.match(text, /developers/);
  assert.match(text, /Read the docs/);
  assert.match(text, /issue\.create_draft/);
});

test("newsletter.subject_line_pack embeds its topic and count", async () => {
  const response = await rpc("prompts/get", {
    name: "newsletter.subject_line_pack",
    arguments: { topic: "Spring sale", count: "5" }
  });
  const text = (response.result as { messages: Array<{ content: { text: string } }> }).messages[0]!
    .content.text;
  assert.match(text, /Spring sale/);
  assert.match(text, /\b5 subject lines\b/);
});

test("a prompt argument outside its range is refused as invalid params", async () => {
  const response = await rpc("prompts/get", {
    name: "newsletter.subject_line_pack",
    arguments: { topic: "Spring sale", count: "500" }
  });
  assert.equal(response.error?.code, -32602);
});

test("a prompt called without its brief still answers, and asks for one", async () => {
  // Older clients call prompts/get with no arguments at all; they get a usable
  // message rather than an error.
  const response = await rpc("prompts/get", { name: "newsletter.draft_from_brief" });
  assert.equal(response.error, undefined);
  const text = (response.result as { messages: Array<{ content: { text: string } }> }).messages[0]!
    .content.text;
  assert.match(text, /brief/i);
});

// --- mcp/F23: contact.import_csv columns ------------------------------------

test("contact.import_csv says which column it reads", () => {
  const tool = findTool("contact.import_csv");
  assert.match(tool.description, /Only the email column is read/);
  assert.match(tool.description, /contact\.set_properties/);
  assert.match(tool.inputSchema.properties?.csvText?.description ?? "", /header named email/);
});

test("contact.import_csv names the columns it ignored", async () => {
  const { fetchImpl } = recording(() =>
    trpcOk({
      publicationId: "pub_1",
      sourceRowCount: 2,
      validUniqueCount: 2,
      createdCount: 2,
      reactivatedCount: 0,
      alreadyActiveCount: 0,
      suppressedCount: 0,
      invalidCount: 0,
      blankCount: 0,
      duplicateCount: 0,
      invalidSamples: [],
      ignoredColumns: ["first_name"]
    })
  );

  const response = await callTool(
    "contact.import_csv",
    { publicationId: "pub_1", csvText: "email,first_name\na@example.com,Ada\nb@example.com,Bo\n" },
    fetchImpl
  );

  const result = response.result as { content: Array<{ text: string }> };
  assert.match(result.content[0]!.text, /Ignored column: first_name/);
});

// --- mcp/F25: unknown arguments, and send_and_wait's final state ------------

test("issue.send_and_wait reports the final status and leaves the document out", async () => {
  // issue.sendNow answers with the issue as it was when the send STARTED
  // ('sending') plus its whole contentJson. Handing that back beside a 'sent'
  // progress contradicted itself and cost an agent ~21 KB per call.
  const { fetchImpl } = recording((call) => {
    const path = new URL(call.url).pathname;
    if (path === "/trpc/issue.sendNow") {
      return trpcOk({
        id: "iss_1",
        publicationId: "pub_1",
        title: "Launch",
        status: "sending",
        createdAt: "2026-09-24T00:00:00.000Z",
        updatedAt: "2026-09-24T00:00:01.000Z",
        scheduledAt: null,
        sentAt: null,
        contentJson: { type: "doc", content: [{ type: "paragraph", text: "x".repeat(20_000) }] },
        contentHtml: "<p>big</p>"
      });
    }
    return trpcOk({
      issueId: "iss_1",
      publicationId: "pub_1",
      status: "sent",
      updatedAt: "2026-09-24T00:00:09.000Z",
      sentAt: "2026-09-24T00:00:09.000Z",
      delivery: {
        total: 2,
        sent: 2,
        failed: 0,
        pending: 0,
        processed: 2,
        completionPercent: 100,
        hasSnapshot: true,
        isPreparing: false
      }
    });
  });

  const response = await callTool("issue.send_and_wait", { issueId: "iss_1", pollIntervalMs: 250 }, fetchImpl);
  const result = response.result as { structuredContent: { issue: Record<string, unknown> } };
  const issue = result.structuredContent.issue;
  assert.equal(issue.status, "sent", "the top-level status must match the final progress");
  assert.equal(issue.sentAt, "2026-09-24T00:00:09.000Z");
  assert.equal(issue.updatedAt, "2026-09-24T00:00:09.000Z");
  assert.equal(issue.id, "iss_1");
  assert.equal(issue.title, "Launch");
  assert.equal("contentJson" in issue, false, "the document is not echoed back");
  assert.equal("contentHtml" in issue, false);
  assert.ok(JSON.stringify(response).length < 4_000, "the reply stays small");
});

test("an unknown argument is named in a warning, and the call still runs", async () => {
  // email.list {tags: [...]} silently returned the unfiltered list: the real
  // keys are tag_name and tag_value. Rejecting unknown keys outright could
  // break agents that send extra fields today, so the call runs and says what
  // it ignored.
  const { calls, fetchImpl } = recording(() => json(200, { data: [], total: 0, has_more: false }));

  const response = await callTool("email.list", { tags: ["source=mcp-qa"], limit: 5 }, fetchImpl);

  assert.equal(response.error, undefined);
  assert.equal(calls.length, 1, "the call is not refused");
  const content = (response.result as { content: Array<{ type: string; text: string }> }).content;
  const warning = content.find((item) => /ignored/i.test(item.text));
  assert.ok(warning, "a warning names what was ignored");
  assert.match(warning.text, /\btags\b/);
  assert.match(warning.text, /tag_name/, "and lists what the tool does accept");
  assert.match(content[0]!.text, /^Loaded|email/i, "the tool's own summary stays first");
});

test("a near-miss argument name gets a suggestion", async () => {
  const { fetchImpl } = recording(() => trpcOk([]));

  const response = await callTool(
    "sender.list",
    { publication_id: "pub_other" },
    fetchImpl,
    { publicationId: "pub_granted" }
  );

  const content = (response.result as { content: Array<{ text: string }> }).content;
  const warning = content.map((item) => item.text).join("\n");
  assert.match(warning, /publication_id \(did you mean publicationId\?\)/);
});

test("an error also says which arguments were ignored", async () => {
  const { fetchImpl } = recording(() => json(404, { error: "Automation not found" }));

  const response = await callTool(
    "automation.get",
    { publication_id: "pub_1", automation_id: "aut_x", automationId: "aut_x" },
    fetchImpl
  );

  const message = response.error?.message ?? "";
  assert.match(message, /^Automation not found/);
  assert.match(message, /automationId \(did you mean automation_id\?\)/);
});

test("a call with only declared arguments carries no warning", async () => {
  const { fetchImpl } = recording(() => json(200, { data: [], total: 0, has_more: false }));
  const response = await callTool("email.list", { tag_name: "source", tag_value: "mcp-qa" }, fetchImpl);
  const content = (response.result as { content: Array<{ text: string }> }).content;
  assert.equal(content.length, 1);
});

test("email.send advertises every field it forwards", () => {
  // The warning above would otherwise call tracking_open "ignored" while the
  // tool forwards it: schema and behaviour must name the same keys.
  const properties = findTool("email.send").inputSchema.properties ?? {};
  assert.ok(properties.tracking_open, "email.send forwards tracking_open, so it must advertise it");
  assert.ok(properties.tracking_click, "email.send forwards tracking_click, so it must advertise it");
});

/**
 * Strip comments, keeping string and template literals intact, so a comment
 * that mentions `args` is not read as code and a `//` inside a URL string is
 * not read as a comment.
 */
function stripComments(source: string): string {
  let out = "";
  let index = 0;
  let quote: string | null = null;
  while (index < source.length) {
    const char = source[index]!;
    const next = source[index + 1];
    if (quote) {
      out += char;
      if (char === "\\") {
        out += next ?? "";
        index += 2;
        continue;
      }
      if (char === quote) quote = null;
      index += 1;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      out += char;
      index += 1;
      continue;
    }
    if (char === "/" && next === "/") {
      while (index < source.length && source[index] !== "\n") index += 1;
      continue;
    }
    if (char === "/" && next === "*") {
      const close = source.indexOf("*/", index + 2);
      index = close === -1 ? source.length : close + 2;
      continue;
    }
    out += char;
    index += 1;
  }
  return out;
}

/**
 * Every argument key one tool branch reads, and every use of `args` the scan
 * could not classify. Strict on purpose: a read the scan does not understand
 * (destructuring, `args?.`, a spread, `args` handed to an arbitrary helper, a
 * computed key) is one it cannot check against the schema, so it fails rather
 * than passing silently (review of batch D1, M3). The recognised forms:
 *
 * - `args.key` and `args["key"]`
 * - `"key" in args`
 * - `readSomething(args, "key", ...)`
 * - `readPublicationId(args, options)` and `readPublicationId(args, options, "key")`
 * - `args[key]` where `key` is the variable of `for (const key of [...literals])`
 *   or `for (const key of EMAIL_SEND_FIELDS)` in the same branch
 */
function scanArgumentReads(
  segment: string,
  constants: Record<string, string[]> = {}
): { keys: Set<string>; unrecognised: string[] } {
  const keys = new Set<string>();
  const unrecognised: string[] = [];

  // Keyed by POSITION, not by name: a name reused by two loops in one branch
  // must resolve each read to the loop it sits in, the nearest one declared
  // before it. By name alone, every read mapped to the last list.
  const loops: Array<{ at: number; name: string; keys: string[] }> = [];
  for (const loop of segment.matchAll(/for \(const (\w+) of (?:\[([^\]]*)\](?:\s+as\s+const)?|(\w+))\)/g)) {
    const listed = loop[2] !== undefined
      ? [...loop[2].matchAll(/"([^"]+)"/g)].map((match) => match[1]!)
      : constants[loop[3]!];
    if (listed) loops.push({ at: loop.index!, name: loop[1]!, keys: listed });
  }
  const loopKeysAt = (name: string, at: number): string[] | undefined => {
    let nearest: { at: number; keys: string[] } | undefined;
    for (const loop of loops) {
      if (loop.name === name && loop.at < at && (!nearest || loop.at > nearest.at)) nearest = loop;
    }
    return nearest?.keys;
  };

  for (const match of segment.matchAll(/\bargs\b/g)) {
    const at = match.index!;
    const before = segment.slice(Math.max(0, at - 80), at);
    const after = segment.slice(at + 4, at + 120);
    const excerpt = `${before.slice(-30)}args${after.slice(0, 30)}`.replace(/\s+/g, " ");

    let found = after.match(/^\.([A-Za-z_$][\w$]*)/);
    if (found) {
      keys.add(found[1]!);
      continue;
    }
    found = after.match(/^\[\s*"([^"]+)"\s*\]/);
    if (found) {
      keys.add(found[1]!);
      continue;
    }
    found = after.match(/^\[\s*([A-Za-z_$][\w$]*)\s*\]/);
    const loopKeys = found ? loopKeysAt(found[1]!, at) : undefined;
    if (loopKeys) {
      for (const key of loopKeys) keys.add(key);
      continue;
    }
    found = before.match(/"([^"]+)"\s+in\s+$/);
    if (found) {
      keys.add(found[1]!);
      continue;
    }
    const helper = before.match(/([A-Za-z_$][\w$]*)\(\s*$/)?.[1];
    if (helper === "readPublicationId") {
      found = after.match(/^\s*,\s*options\s*(?:,\s*"([^"]+)"\s*)?\)/);
      if (found) {
        keys.add(found[1] ?? "publicationId");
        continue;
      }
    } else if (helper && /^read[A-Z]\w*$/.test(helper)) {
      found = after.match(/^\s*,\s*"([^"]+)"/);
      if (found) {
        keys.add(found[1]!);
        continue;
      }
    }
    unrecognised.push(excerpt);
  }

  return { keys, unrecognised };
}

test("the argument scan refuses every access it cannot classify", () => {
  // The guard below is only as good as this classifier, so its failure modes
  // are pinned: each of these must come back unrecognised, not ignored.
  for (const snippet of [
    "const { tags } = args;",
    "const value = args?.tags;",
    "doSomething(args);",
    "doSomething(args, options);",
    "readOptionalNumber(args, keyName);",
    "const value = args[keyName];",
    "const all = { ...args };",
    "Object.keys(args);"
  ]) {
    const { unrecognised } = scanArgumentReads(snippet);
    assert.equal(unrecognised.length, 1, `not flagged: ${snippet}`);
  }

  const known = scanArgumentReads(
    'args.a; args["b"]; readOptionalNumber(args, "c"); readPublicationId(args, options, "publication_id"); ' +
      '"d" in args; for (const key of ["e", "f"]) { args[key]; } for (const other of ["g"] as const) { args[other]; }'
  );
  assert.deepEqual(known.unrecognised, []);
  assert.deepEqual([...known.keys].sort(), ["a", "b", "c", "d", "e", "f", "g", "publication_id"]);

  // One loop variable name reused by two loops in the same branch: each read
  // belongs to the loop it sits in. Resolved by name alone, both reads mapped
  // to the LAST list, and "first" was never checked against the schema.
  const reused = scanArgumentReads(
    'for (const key of ["first"]) { args[key]; } for (const key of ["second"]) { args[key]; }'
  );
  assert.deepEqual(reused.unrecognised, []);
  assert.deepEqual([...reused.keys].sort(), ["first", "second"]);

  // A computed key read before any loop has declared its variable is not a
  // loop read at all.
  assert.equal(
    scanArgumentReads('args[key]; for (const key of ["late"]) { args[key]; }').unrecognised.length,
    1
  );

  // A comment that mentions args is not code.
  assert.deepEqual(scanArgumentReads(stripComments("// leave it absent from args\nargs.a;")).unrecognised, []);
});

test("contact.import_csv says how many more columns it ignored than it names", async () => {
  const { fetchImpl } = recording(() =>
    trpcOk({
      publicationId: "pub_1",
      sourceRowCount: 1,
      validUniqueCount: 1,
      createdCount: 1,
      reactivatedCount: 0,
      alreadyActiveCount: 0,
      suppressedCount: 0,
      invalidCount: 0,
      blankCount: 0,
      duplicateCount: 0,
      invalidSamples: [],
      ignoredColumns: Array.from({ length: 20 }, (_, index) => `col_${index + 1}`),
      ignoredColumnCount: 25
    })
  );
  const response = await callTool(
    "contact.import_csv",
    { publicationId: "pub_1", csvText: "email,col_1\na@example.com,x\n" },
    fetchImpl
  );
  const text = (response.result as { content: Array<{ text: string }> }).content[0]!.text;
  assert.match(text, /col_20 and 5 more \(only the email column/);
});

test("every argument a tool reads is one its schema declares", () => {
  // The other half of the unknown-argument warning. A key a tool reads but
  // does not declare is a capability no agent can discover, and the warning
  // would wrongly tell the agent it was ignored. Read from source: the tool
  // bodies are one long if-chain in runTool.
  const source = stripComments(readFileSync(new URL("./index.ts", import.meta.url), "utf8"));
  const start = source.indexOf("async function runTool(");
  const end = source.indexOf("throw new Error(`Unknown tool", start);
  assert.ok(start !== -1 && end > start, "runTool or its Unknown tool fallthrough moved; point this check at it");
  const body = source.slice(start, end);

  const sendFields = source.match(/const EMAIL_SEND_FIELDS = \[([\s\S]*?)\] as const;/);
  assert.ok(sendFields, "EMAIL_SEND_FIELDS moved; point this check at it");
  const constants = {
    EMAIL_SEND_FIELDS: [...sendFields[1]!.matchAll(/"([^"]+)"/g)].map((match) => match[1]!)
  };

  const branches = [...body.matchAll(/if \(toolName === "([^"]+)"\)/g)];
  assert.ok(branches.length > 100, `parsed ${branches.length} tool branches; the parse is wrong`);
  assert.equal(
    branches.length,
    MCP_TOOLS.length,
    "every tool has exactly one branch, and nothing but branches reads args"
  );

  const offenders: string[] = [];
  branches.forEach((branch, index) => {
    const name = branch[1]!;
    // The LAST branch ends at the Unknown tool fallthrough, not at the end of
    // the file, so nothing after runTool is scanned as part of it.
    const segmentEnd = index + 1 < branches.length ? branches[index + 1]!.index : body.length;
    const { keys, unrecognised } = scanArgumentReads(body.slice(branch.index, segmentEnd), constants);
    for (const excerpt of unrecognised) {
      offenders.push(`${name}: unrecognised use of args: ${excerpt}`);
    }
    const declared = new Set(Object.keys(findTool(name).inputSchema.properties ?? {}));
    for (const key of keys) {
      if (!declared.has(key)) offenders.push(`${name} reads ${key} but does not declare it`);
    }
  });

  // Nothing between the function head and the first branch may read args.
  const head = body.slice(body.indexOf(")", body.indexOf("options")) + 1, branches[0]!.index);
  for (const excerpt of scanArgumentReads(head).unrecognised) {
    offenders.push(`runTool head: unrecognised use of args: ${excerpt}`);
  }

  assert.deepEqual(offenders, []);
});

// --- mcp/F10: publicationId with a team-wide key ------------------------------
//
// Every tool advertises publicationId as optional, "defaults to the
// publication this connection is authorized for". The default Studio API key
// is TEAM-scoped (a full-access key is always minted for the team, not a
// publication), so nothing named a publication and 125 tools failed with a
// bare "Missing required string argument". The runtime now asks auth.me which
// publications the key reaches: exactly one becomes the default; otherwise the
// error lists them and names the fix.

function authMe(overrides: Record<string, unknown>) {
  return {
    userId: "user_1",
    role: "owner",
    tokenType: "pat",
    scopes: ["*"],
    organizationId: "org_1",
    credentialOrganizationId: "org_1",
    credentialPublicationId: null,
    publicationMemberships: [],
    ...overrides
  };
}

function membership(publicationId: string, publicationName: string, organizationId = "org_1") {
  return { publicationId, publicationName, organizationId, role: "owner" };
}

/** A transport that answers auth.me with `me` and every other call with `rest`. */
function withAuthMe(me: unknown, rest: () => Response = () => trpcOk({ id: "iss_1", status: "draft" })) {
  return recording((call) => (new URL(call.url).pathname === "/trpc/auth.me" ? trpcOk(me) : rest()));
}

test("a team-wide key that reaches ONE publication uses it as the default", async () => {
  const { calls, fetchImpl } = withAuthMe(
    authMe({ publicationMemberships: [membership("pub_only", "The Only One")] })
  );

  const response = await callTool("issue.create_draft", { title: "Hello" }, fetchImpl, {
    envPublicationFallback: false
  });

  assert.equal(response.error, undefined, JSON.stringify(response.error));
  const created = calls.find((call) => new URL(call.url).pathname === "/trpc/issue.createDraft");
  assert.ok(created, "the tool ran");
  assert.equal(JSON.parse(String(created.init?.body)).publicationId, "pub_only");
});

test("a team-wide key that reaches several publications is told which ids it can pass", async () => {
  const { calls, fetchImpl } = withAuthMe(
    authMe({
      publicationMemberships: [membership("pub_a", "Alpha News"), membership("pub_b", "Beta Weekly")]
    })
  );

  const response = await callTool("sender.list", {}, fetchImpl, { envPublicationFallback: false });

  const message = response.error?.message ?? "";
  // Kept as the first words: every client and doc so far has matched on it.
  assert.match(message, /^Missing required string argument: publicationId\./);
  assert.match(message, /reaches 2 publications/);
  assert.match(message, /pub_a \(Alpha News\)/);
  assert.match(message, /pub_b \(Beta Weekly\)/);
  assert.match(message, /publication\.list/);
  assert.deepEqual(
    calls.map((call) => new URL(call.url).pathname),
    ["/trpc/auth.me"],
    "nothing but the lookup may run without a publication"
  );
});

test("the snake_case tools name the key their callers pass", async () => {
  const { fetchImpl } = withAuthMe(
    authMe({ publicationMemberships: [membership("pub_a", "A"), membership("pub_b", "B")] })
  );
  const response = await callTool("automation.get", { automation_id: "aut_1" }, fetchImpl, {
    envPublicationFallback: false
  });
  assert.match(response.error?.message ?? "", /^Missing required string argument: publication_id\./);
  assert.match(response.error?.message ?? "", /pass publication_id/);
});

test("a publication-scoped key is its own default even when its person has more", async () => {
  // stdio has no connection publication unless MAILTEA_PUBLICATION_ID is set,
  // so the key's own scope comes back from auth.me.
  const { calls, fetchImpl } = withAuthMe(
    authMe({
      credentialPublicationId: "pub_key",
      publicationMemberships: [membership("pub_key", "Keyed"), membership("pub_other", "Other")]
    }),
    () => trpcOk([])
  );

  const response = await callTool("sender.list", {}, fetchImpl, { envPublicationFallback: false });
  assert.equal(response.error, undefined, JSON.stringify(response.error));
  const listed = calls.find((call) => new URL(call.url).pathname === "/trpc/publication.senderList");
  assert.ok(listed, `expected the sender list call, got ${calls.map((call) => call.url).join(", ")}`);
  assert.equal(JSON.parse(new URL(listed.url).searchParams.get("input") ?? "{}").publicationId, "pub_key");
});

test("a key that reaches no publication is told to create one", async () => {
  const { fetchImpl } = withAuthMe(authMe({ publicationMemberships: [] }));
  const response = await callTool("sender.list", {}, fetchImpl, { envPublicationFallback: false });
  assert.match(response.error?.message ?? "", /^Missing required string argument: publicationId\./);
  assert.match(response.error?.message ?? "", /publication\.create/);
});

test("memberships in another team do not count toward the default", async () => {
  const { fetchImpl } = withAuthMe(
    authMe({
      organizationId: "org_1",
      publicationMemberships: [membership("pub_here", "Here"), membership("pub_there", "There", "org_2")]
    })
  );
  const response = await callTool("issue.create_draft", { title: "Hi" }, fetchImpl, {
    envPublicationFallback: false
  });
  assert.equal(response.error, undefined, JSON.stringify(response.error));
});

test("when the lookup itself fails, the error says why and how to proceed", async () => {
  const { fetchImpl } = recording(() => json(401, { error: { message: "Unauthorized" } }));
  const response = await callTool("sender.list", {}, fetchImpl, { envPublicationFallback: false });
  assert.match(response.error?.message ?? "", /^Missing required string argument: publicationId\./);
  assert.match(response.error?.message ?? "", /\(Unauthorized\)/, "the lookup's own failure is named");
  assert.match(response.error?.message ?? "", /publication\.list/);
});

// Review of batch D1, H2. auth.me's organizationId is the request's ACTIVE
// team; for a person removed from the key's team it falls back to another of
// their teams. Defaulting from it put a team-A key to work in team B.
test("no default when the active team is not the key's own team", async () => {
  const { calls, fetchImpl } = withAuthMe(
    authMe({
      organizationId: "org_b",
      credentialOrganizationId: "org_a",
      publicationMemberships: [membership("pub_b1", "Team B", "org_b")]
    })
  );
  const response = await callTool("sender.list", {}, fetchImpl, { envPublicationFallback: false });
  assert.match(response.error?.message ?? "", /^Missing required string argument: publicationId\./);
  assert.doesNotMatch(response.error?.message ?? "", /pub_b1/, "another team's publication is never offered");
  assert.deepEqual(calls.map((call) => new URL(call.url).pathname), ["/trpc/auth.me"]);
});

test("no default from a server that does not say which team the key belongs to", async () => {
  const { fetchImpl } = withAuthMe(
    authMe({ credentialOrganizationId: undefined, publicationMemberships: [membership("pub_only", "Only")] })
  );
  const response = await callTool("sender.list", {}, fetchImpl, { envPublicationFallback: false });
  assert.match(response.error?.message ?? "", /^Missing required string argument: publicationId\./);
});

test("a service key takes no membership default", async () => {
  const { fetchImpl } = withAuthMe(
    authMe({ tokenType: "service", publicationMemberships: [membership("pub_only", "Only")] })
  );
  const response = await callTool("sender.list", {}, fetchImpl, { envPublicationFallback: false });
  assert.match(response.error?.message ?? "", /^Missing required string argument: publicationId\./);
  assert.doesNotMatch(response.error?.message ?? "", /pub_only/);
});

test("a discovered default is reused for the same token instead of asking auth.me again", async () => {
  const { calls, fetchImpl } = withAuthMe(
    authMe({ publicationMemberships: [membership("pub_only", "Only")] }),
    () => trpcOk([])
  );
  const token = "mt_pat_cache_hit";
  await callTool("sender.list", {}, fetchImpl, { envPublicationFallback: false, token });
  await callTool("sender.list", {}, fetchImpl, { envPublicationFallback: false, token });
  const lookups = calls.filter((call) => new URL(call.url).pathname === "/trpc/auth.me");
  assert.equal(lookups.length, 1, "one auth.me for two calls on the same token");
});

test("a failed discovery is not cached", async () => {
  let memberships: unknown[] = [];
  const { calls, fetchImpl } = recording((call) =>
    new URL(call.url).pathname === "/trpc/auth.me"
      ? trpcOk(authMe({ publicationMemberships: memberships }))
      : trpcOk([])
  );
  const token = "mt_pat_cache_miss";
  const first = await callTool("sender.list", {}, fetchImpl, { envPublicationFallback: false, token });
  assert.match(first.error?.message ?? "", /publication\.create/);

  // The operator follows the advice and creates a publication.
  memberships = [membership("pub_new", "New")];
  const second = await callTool("sender.list", {}, fetchImpl, { envPublicationFallback: false, token });
  assert.equal(second.error, undefined, JSON.stringify(second.error));
  assert.equal(calls.filter((call) => new URL(call.url).pathname === "/trpc/auth.me").length, 2);
});

test("a host that already resolved the credential is never asked back through the API", async () => {
  const { calls, fetchImpl } = recording(() => trpcOk([]));
  const listed = await callTool("sender.list", {}, fetchImpl, {
    envPublicationFallback: false,
    reachablePublications: [
      { id: "pub_a", name: "Alpha" },
      { id: "pub_b", name: "Beta" }
    ]
  });
  assert.match(listed.error?.message ?? "", /pub_a \(Alpha\), pub_b \(Beta\)/);

  const nothing = await callTool("sender.list", {}, fetchImpl, {
    envPublicationFallback: false,
    reachablePublications: null
  });
  assert.match(nothing.error?.message ?? "", /^Missing required string argument: publicationId\. Pass the id/);
  assert.deepEqual(calls, [], "no auth.me, and no tool call, without a publication");
});

test("an explicit publicationId never triggers the lookup", async () => {
  const { calls, fetchImpl } = recording(() => trpcOk([]));
  await callTool("sender.list", { publicationId: "pub_explicit" }, fetchImpl);
  assert.deepEqual(
    calls.map((call) => new URL(call.url).pathname),
    ["/trpc/publication.senderList"]
  );
});

test("the shared publicationId description names the team-key default", () => {
  const description = findTool("sender.list").inputSchema.properties?.publicationId?.description ?? "";
  assert.match(description, /personal/);
  assert.match(description, /only publication/);
  assert.match(description, /lists the ids/);
});

// ---------------------------------------------------------------------------
// A post's internal name, From and Reply-To (API migration 0127). The draft
// tools advertise them, forward them, and ask the server to check them now
// (`strictHeaders`), so an agent hears about a From it cannot send from at
// write time, the way REST answers 422.
// ---------------------------------------------------------------------------

test("issue.create_draft and issue.update_draft advertise name, from and replyTo", () => {
  for (const name of ["issue.create_draft", "issue.update_draft"]) {
    const properties = (findTool(name).inputSchema as { properties: Record<string, { description?: string }> })
      .properties;
    for (const key of ["name", "from", "replyTo"]) {
      assert.ok(properties[key], `${name} advertises ${key}`);
    }
    assert.match(properties.from?.description ?? "", /verified/i, `${name} says from must pass the domain gate`);
    assert.match(properties.title?.description ?? "", /subject/i, `${name} says title is the subject`);
  }
  const update = findTool("issue.update_draft").inputSchema as { required?: string[] };
  assert.deepEqual(update.required, ["issueId"], "a rename or a From change needs no title");
});

test("issue.create_draft forwards name, from and replyTo with strictHeaders", async () => {
  const { calls, fetchImpl } = recording(() => trpcOk({ id: "iss_1", status: "draft" }));
  const response = await callTool(
    "issue.create_draft",
    {
      publicationId: "pub_1",
      title: "Pulse is live",
      name: "Internal: launch",
      from: "Sam <sam@acme.com>",
      replyTo: "help@acme.com"
    },
    fetchImpl
  );
  assert.equal(response.error, undefined, JSON.stringify(response.error));
  const created = calls.find((call) => new URL(call.url).pathname === "/trpc/issue.createDraft");
  assert.ok(created);
  const body = JSON.parse(String(created.init?.body));
  assert.equal(body.title, "Pulse is live");
  assert.equal(body.name, "Internal: launch");
  assert.equal(body.fromAddress, "Sam <sam@acme.com>");
  assert.equal(body.replyTo, "help@acme.com");
  assert.equal(body.strictHeaders, true);
});

test("issue.update_draft sends only what the agent passed", async () => {
  const { calls, fetchImpl } = recording(() => trpcOk({ id: "iss_1", status: "draft" }));
  const response = await callTool("issue.update_draft", { issueId: "iss_1", name: "Renamed", from: "" }, fetchImpl);
  assert.equal(response.error, undefined, JSON.stringify(response.error));
  const updated = calls.find((call) => new URL(call.url).pathname === "/trpc/issue.updateDraft");
  assert.ok(updated);
  const body = JSON.parse(String(updated.init?.body));
  assert.deepEqual(body, { issueId: "iss_1", name: "Renamed", fromAddress: "", strictHeaders: true });
});
