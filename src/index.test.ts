import assert from "node:assert/strict";
import test from "node:test";
import { handleMcpRequest } from "./index.js";

type FetchCall = {
  url: string;
  init?: RequestInit;
};

function trpcOk(data: unknown): Response {
  return new Response(JSON.stringify({ result: { data } }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
}

function readJsonRpcResult(response: Awaited<ReturnType<typeof handleMcpRequest>>) {
  assert.equal(response.error, undefined);
  assert.ok(response.result);
  return response.result as Record<string, unknown>;
}

test("tools/list includes reusable section MCP tools", async () => {
  const response = await handleMcpRequest({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list",
    params: {}
  });

  const result = readJsonRpcResult(response);
  const tools = result.tools as Array<{ name: string }>;
  const toolNames = tools.map((tool) => tool.name);

  assert.ok(toolNames.includes("contact.referral_summary"));
  assert.ok(toolNames.includes("contact.referral_milestones"));
  assert.ok(toolNames.includes("contact.referral_milestone_upsert"));
  assert.ok(toolNames.includes("contact.referral_milestone_remove"));
  assert.ok(toolNames.includes("contact.referral_rewards"));
  assert.ok(toolNames.includes("monetize.offer_list"));
  assert.ok(toolNames.includes("monetize.offer_upsert"));
  assert.ok(toolNames.includes("monetize.offer_remove"));
  assert.ok(toolNames.includes("section.list"));
  assert.ok(toolNames.includes("section.catalog"));
  assert.ok(toolNames.includes("section.pack_create"));
  assert.ok(toolNames.includes("section.pack_update"));
  assert.ok(toolNames.includes("section.pack_remove"));
  assert.ok(toolNames.includes("section.pack_revisions"));
  assert.ok(toolNames.includes("section.pack_restore_revision"));
  assert.ok(toolNames.includes("section.import_pack"));
  assert.ok(toolNames.includes("section.create"));
  assert.ok(toolNames.includes("section.update"));
  assert.ok(toolNames.includes("section.remove"));
  assert.ok(toolNames.includes("issue.get_editor"));
  assert.ok(toolNames.includes("issue.update_draft"));
  assert.ok(toolNames.includes("issue.remove_draft"));
  assert.ok(toolNames.includes("issue.preview_draft"));
  assert.ok(toolNames.includes("issue.delivery_progress"));
  assert.ok(toolNames.includes("issue.wait_delivery"));
  assert.ok(toolNames.includes("issue.unschedule"));
  assert.ok(toolNames.includes("issue.send_and_wait"));
  assert.ok(toolNames.includes("contact.list"));
  assert.ok(toolNames.includes("contact.upsert"));
  assert.ok(toolNames.includes("contact.set_status"));
  assert.ok(toolNames.includes("contact.import_csv"));
  assert.ok(toolNames.includes("publication.list"));
  assert.ok(toolNames.includes("publication.create"));
  assert.ok(toolNames.includes("publication.domain_list"));
  assert.ok(toolNames.includes("publication.domain_upsert"));
  assert.ok(toolNames.includes("publication.domain_verify"));
  assert.ok(toolNames.includes("publication.domain_set_primary"));
  assert.ok(toolNames.includes("publication.domain_remove"));
  assert.ok(toolNames.includes("publication.domain_traefik_preview"));
  assert.ok(toolNames.includes("analytics.poll_results"));
  assert.ok(toolNames.includes("analytics.issue_performance"));
  assert.ok(toolNames.includes("analytics.issue_trend"));
  assert.ok(toolNames.includes("analytics.latest_summary"));
  assert.ok(toolNames.includes("analytics.issue_export_csv"));
  assert.ok(toolNames.includes("analytics.issue_export_performance_csv"));
  assert.ok(toolNames.includes("analytics.issue_export_polls_csv"));
  assert.ok(toolNames.includes("template.render"));
  assert.ok(toolNames.includes("suppression.export"));
});

test("tools/list includes the automation and event MCP tools", async () => {
  const response = await handleMcpRequest({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list",
    params: {}
  });

  const result = readJsonRpcResult(response);
  const tools = result.tools as Array<{ name: string }>;
  const toolNames = tools.map((tool) => tool.name);

  assert.ok(toolNames.includes("automation.create"));
  assert.ok(toolNames.includes("automation.list"));
  assert.ok(toolNames.includes("automation.get"));
  assert.ok(toolNames.includes("automation.update"));
  assert.ok(toolNames.includes("automation.enable"));
  assert.ok(toolNames.includes("automation.disable"));
  assert.ok(toolNames.includes("automation.archive"));
  assert.ok(toolNames.includes("automation.delete"));
  assert.ok(toolNames.includes("automation.validate"));
  assert.ok(toolNames.includes("automation.versions"));
  assert.ok(toolNames.includes("automation.version"));
  assert.ok(toolNames.includes("automation.metrics"));
  assert.ok(toolNames.includes("automation_run.list"));
  assert.ok(toolNames.includes("automation_run.get"));
  assert.ok(toolNames.includes("automation_run.cancel"));
  assert.ok(toolNames.includes("event.send"));
  assert.ok(toolNames.includes("event_definition.list"));
  assert.ok(toolNames.includes("event_definition.get"));
  assert.ok(toolNames.includes("event_definition.create"));
  assert.ok(toolNames.includes("event_definition.update"));
  assert.ok(toolNames.includes("event_definition.delete"));

  // A test run sends real, billed email, so it is deliberately not exposed.
  assert.ok(!toolNames.includes("automation.test"));
});

test("resources/list and resources/read expose the automation step-type catalog", async () => {
  const listResponse = await handleMcpRequest({
    jsonrpc: "2.0",
    id: 1,
    method: "resources/list",
    params: {}
  });

  const listResult = readJsonRpcResult(listResponse);
  const resources = listResult.resources as Array<{ uri: string; mimeType: string }>;
  const uris = resources.map((resource) => resource.uri);
  assert.ok(uris.includes("mailtea://automations/step-types"));

  const readResponse = await handleMcpRequest({
    jsonrpc: "2.0",
    id: 2,
    method: "resources/read",
    params: {
      uri: "mailtea://automations/step-types"
    }
  });

  const readResult = readJsonRpcResult(readResponse);
  const contents = readResult.contents as Array<{ uri: string; mimeType: string; text: string }>;
  assert.equal(contents[0]!.mimeType, "application/json");

  const catalog = JSON.parse(contents[0]!.text) as {
    trigger_types: Array<{ type: string; requires_trigger_key: boolean }>;
    step_types: Array<{ type: string; branches: string[] }>;
    branches: string[];
    limits: Record<string, unknown>;
    condition: { operators: string[]; max_depth: number };
    validation_codes: string[];
    notes: string[];
  };

  assert.equal(catalog.step_types.length, 12);
  assert.equal(catalog.trigger_types.length, 9);
  assert.equal(catalog.branches.length, 5);
  assert.equal(catalog.condition.operators.length, 13);
  assert.equal(catalog.condition.max_depth, 10);
  assert.equal(catalog.limits.step_key_pattern, "^[a-z0-9_-]{1,64}$");
  assert.ok(catalog.validation_codes.includes("connections_required_for_branching"));
  assert.ok(catalog.notes.length > 0);

  const condition = catalog.step_types.find((step) => step.type === "condition");
  assert.deepEqual(condition?.branches, ["condition_met", "condition_not_met"]);

  const eventTrigger = catalog.trigger_types.find((trigger) => trigger.type === "event");
  assert.equal(eventTrigger?.requires_trigger_key, true);
});

test("issue.delivery_progress calls query endpoint", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return trpcOk({
      issueId: "iss_123",
      publicationId: "pub_demo",
      status: "sending",
      updatedAt: "2026-02-20T03:15:00.000Z",
      sentAt: null,
      delivery: {
        total: 25,
        sent: 10,
        failed: 2,
        pending: 13,
        processed: 12,
        completionPercent: 48,
        hasSnapshot: true,
        isPreparing: false
      }
    });
  };

  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 1.1,
      method: "tools/call",
      params: {
        name: "issue.delivery_progress",
        arguments: {
          publicationId: "pub_demo",
          issueId: "iss_123"
        }
      }
    },
    {
      apiBaseUrl: "http://localhost:8787",
      token: "pat_test_token",
      fetchImpl
    }
  );

  assert.equal(calls.length, 1);
  const request = calls[0]!;
  const requestUrl = new URL(request.url);
  assert.equal(requestUrl.pathname, "/trpc/issue.deliveryProgress");
  assert.equal(request.init?.method, "GET");

  const inputParam = requestUrl.searchParams.get("input");
  assert.ok(inputParam);
  assert.deepEqual(JSON.parse(inputParam), {
    publicationId: "pub_demo",
    issueId: "iss_123"
  });

  const result = readJsonRpcResult(response);
  const content = result.content as Array<{ type: string; text: string }>;
  assert.equal(content[0]?.text, "Issue iss_123 delivery: 12/25 processed (48%)");
});

test("issue.wait_delivery polls until issue reaches terminal status", async () => {
  const calls: FetchCall[] = [];
  let attempt = 0;
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    attempt += 1;

    if (attempt === 1) {
      return trpcOk({
        issueId: "iss_123",
        publicationId: "pub_demo",
        status: "sending",
        updatedAt: "2026-02-20T03:15:00.000Z",
        sentAt: null,
        delivery: {
          total: 25,
          sent: 10,
          failed: 0,
          pending: 15,
          processed: 10,
          completionPercent: 40,
          hasSnapshot: true,
          isPreparing: false
        }
      });
    }

    return trpcOk({
      issueId: "iss_123",
      publicationId: "pub_demo",
      status: "sent",
      updatedAt: "2026-02-20T03:15:05.000Z",
      sentAt: "2026-02-20T03:15:05.000Z",
      delivery: {
        total: 25,
        sent: 24,
        failed: 1,
        pending: 0,
        processed: 25,
        completionPercent: 100,
        hasSnapshot: true,
        isPreparing: false
      }
    });
  };

  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 1.2,
      method: "tools/call",
      params: {
        name: "issue.wait_delivery",
        arguments: {
          publicationId: "pub_demo",
          issueId: "iss_123",
          timeoutMs: 2_000,
          pollIntervalMs: 25
        }
      }
    },
    {
      apiBaseUrl: "http://localhost:8787",
      token: "pat_test_token",
      fetchImpl
    }
  );

  assert.equal(calls.length, 2);
  const firstRequest = new URL(calls[0]!.url);
  const secondRequest = new URL(calls[1]!.url);
  assert.equal(firstRequest.pathname, "/trpc/issue.deliveryProgress");
  assert.equal(secondRequest.pathname, "/trpc/issue.deliveryProgress");

  const result = readJsonRpcResult(response);
  const content = result.content as Array<{ type: string; text: string }>;
  assert.equal(
    content[0]?.text,
    "Issue iss_123 delivery finished with status sent: 25/25 processed (100%)"
  );

  const structured = result.structuredContent as {
    timedOut: boolean;
    elapsedMs: number;
    progress: { status: string };
  };
  assert.equal(structured.timedOut, false);
  assert.equal(structured.progress.status, "sent");
  assert.equal(structured.elapsedMs > 0, true);
});

test("issue.wait_delivery returns timeout details when issue remains sending", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return trpcOk({
      issueId: "iss_slow",
      publicationId: "pub_demo",
      status: "sending",
      updatedAt: "2026-02-20T03:15:00.000Z",
      sentAt: null,
      delivery: {
        total: 50,
        sent: 5,
        failed: 0,
        pending: 45,
        processed: 5,
        completionPercent: 10,
        hasSnapshot: true,
        isPreparing: false
      }
    });
  };

  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 1.21,
      method: "tools/call",
      params: {
        name: "issue.wait_delivery",
        arguments: {
          publicationId: "pub_demo",
          issueId: "iss_slow",
          timeoutMs: 10,
          pollIntervalMs: 5
        }
      }
    },
    {
      apiBaseUrl: "http://localhost:8787",
      token: "pat_test_token",
      fetchImpl
    }
  );

  assert.equal(calls.length >= 2, true);
  for (const call of calls) {
    const requestUrl = new URL(call.url);
    assert.equal(requestUrl.pathname, "/trpc/issue.deliveryProgress");
  }

  const result = readJsonRpcResult(response);
  const content = result.content as Array<{ type: string; text: string }>;
  assert.equal(content[0]?.text.includes("delivery still in status sending"), true);

  const structured = result.structuredContent as {
    timedOut: boolean;
    elapsedMs: number;
    progress: { status: string };
  };
  assert.equal(structured.timedOut, true);
  assert.equal(structured.progress.status, "sending");
  assert.equal(structured.elapsedMs >= 1_000, true);
});

test("issue.get_editor calls query endpoint", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return trpcOk({
      id: "iss_123",
      publicationId: "pub_demo",
      title: "Weekly update",
      status: "draft",
      contentJson: {
        type: "mailtea.rich.v1",
        html: "<p>Hello draft</p>"
      },
      createdAt: "2026-02-20T03:00:00.000Z",
      updatedAt: "2026-02-20T03:05:00.000Z",
      scheduledAt: null,
      sentAt: null
    });
  };

  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 1.3,
      method: "tools/call",
      params: {
        name: "issue.get_editor",
        arguments: {
          issueId: "iss_123"
        }
      }
    },
    {
      apiBaseUrl: "http://localhost:8787",
      token: "pat_test_token",
      fetchImpl
    }
  );

  assert.equal(calls.length, 1);
  const request = calls[0]!;
  const requestUrl = new URL(request.url);
  assert.equal(requestUrl.pathname, "/trpc/issue.getEditor");
  assert.equal(request.init?.method, "GET");

  const inputParam = requestUrl.searchParams.get("input");
  assert.ok(inputParam);
  assert.deepEqual(JSON.parse(inputParam), { issueId: "iss_123" });

  const result = readJsonRpcResult(response);
  const content = result.content as Array<{ type: string; text: string }>;
  assert.equal(content[0]?.text, "Loaded editor state for iss_123 (draft)");
});

test("issue.update_draft sends mutation payload", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return trpcOk({
      id: "iss_123",
      publicationId: "pub_demo",
      title: "Weekly update v2",
      status: "draft",
      createdAt: "2026-02-20T03:00:00.000Z",
      updatedAt: "2026-02-20T03:10:00.000Z",
      scheduledAt: null,
      sentAt: null
    });
  };

  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 1.4,
      method: "tools/call",
      params: {
        name: "issue.update_draft",
        arguments: {
          issueId: "iss_123",
          title: "Weekly update v2",
          contentHtml: "<p>Updated content</p>"
        }
      }
    },
    {
      apiBaseUrl: "http://localhost:8787",
      token: "pat_test_token",
      fetchImpl
    }
  );

  assert.equal(calls.length, 1);
  const request = calls[0]!;
  assert.equal(request.url, "http://localhost:8787/trpc/issue.updateDraft");
  assert.equal(request.init?.method, "POST");

  const body = request.init?.body as string;
  assert.ok(body);
  assert.deepEqual(JSON.parse(body), {
    issueId: "iss_123",
    title: "Weekly update v2",
    contentJson: {
      type: "mailtea.rich.v1",
      html: "<p>Updated content</p>"
    }
  });

  const result = readJsonRpcResult(response);
  const content = result.content as Array<{ type: string; text: string }>;
  assert.equal(content[0]?.text, "Draft updated: iss_123");
});

test("issue.remove_draft sends mutation payload", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return trpcOk({
      removed: true,
      issueId: "iss_123",
      publicationId: "pub_demo"
    });
  };

  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 1.5,
      method: "tools/call",
      params: {
        name: "issue.remove_draft",
        arguments: {
          issueId: "iss_123"
        }
      }
    },
    {
      apiBaseUrl: "http://localhost:8787",
      token: "pat_test_token",
      fetchImpl
    }
  );

  assert.equal(calls.length, 1);
  const request = calls[0]!;
  assert.equal(request.url, "http://localhost:8787/trpc/issue.removeDraft");
  assert.equal(request.init?.method, "POST");

  const body = request.init?.body as string;
  assert.ok(body);
  assert.deepEqual(JSON.parse(body), { issueId: "iss_123" });

  const result = readJsonRpcResult(response);
  const content = result.content as Array<{ type: string; text: string }>;
  assert.equal(content[0]?.text, "Draft removed: iss_123");
});

test("issue.preview_draft sends mutation payload", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return trpcOk({
      publicationId: "pub_demo",
      publicationName: "Demo Publication",
      title: "Weekly update draft",
      html: "<html><body><h1>Weekly update draft</h1></body></html>",
      text: "Weekly update draft"
    });
  };

  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 1.55,
      method: "tools/call",
      params: {
        name: "issue.preview_draft",
        arguments: {
          publicationId: "pub_demo",
          title: "Weekly update draft",
          html: "<h1>Weekly update draft</h1>",
          plainText: "Weekly update draft",
          styleProfile: {
            presetId: "modern-slate",
            accentColor: "#2563eb"
          }
        }
      }
    },
    {
      apiBaseUrl: "http://localhost:8787",
      token: "pat_test_token",
      fetchImpl
    }
  );

  assert.equal(calls.length, 1);
  const request = calls[0]!;
  assert.equal(request.url, "http://localhost:8787/trpc/issue.previewDraft");
  assert.equal(request.init?.method, "POST");
  const body = request.init?.body as string;
  assert.ok(body);
  assert.deepEqual(JSON.parse(body), {
    publicationId: "pub_demo",
    title: "Weekly update draft",
    html: "<h1>Weekly update draft</h1>",
    plainText: "Weekly update draft",
    styleProfile: {
      presetId: "modern-slate",
      accentColor: "#2563eb"
    }
  });

  const result = readJsonRpcResult(response);
  const content = result.content as Array<{ type: string; text: string }>;
  assert.equal(
    content[0]?.text,
    "Draft preview generated for pub_demo: Weekly update draft"
  );
});

test("issue.unschedule sends mutation payload", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return trpcOk({
      id: "iss_123",
      publicationId: "pub_demo",
      title: "Weekly update",
      status: "draft",
      createdAt: "2026-02-20T01:00:00.000Z",
      updatedAt: "2026-02-20T01:10:00.000Z",
      scheduledAt: null,
      sentAt: null
    });
  };

  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 1.551,
      method: "tools/call",
      params: {
        name: "issue.unschedule",
        arguments: {
          issueId: "iss_123"
        }
      }
    },
    {
      apiBaseUrl: "http://localhost:8787",
      token: "pat_test_token",
      fetchImpl
    }
  );

  assert.equal(calls.length, 1);
  const request = calls[0]!;
  assert.equal(request.url, "http://localhost:8787/trpc/issue.unschedule");
  assert.equal(request.init?.method, "POST");
  const body = request.init?.body as string;
  assert.ok(body);
  assert.deepEqual(JSON.parse(body), { issueId: "iss_123" });

  const result = readJsonRpcResult(response);
  const content = result.content as Array<{ type: string; text: string }>;
  assert.equal(content[0]?.text, "Issue unscheduled: iss_123");
});

test("issue.send_and_wait sends now then polls delivery progress", async () => {
  const calls: FetchCall[] = [];
  let progressReadCount = 0;
  const fetchImpl: typeof fetch = async (url, init) => {
    const requestUrl = new URL(String(url));
    calls.push({ url: requestUrl.toString(), init });

    if (requestUrl.pathname === "/trpc/issue.sendNow") {
      return trpcOk({
        id: "iss_123",
        publicationId: "pub_demo",
        title: "Weekly update",
        status: "sending",
        createdAt: "2026-02-20T01:00:00.000Z",
        updatedAt: "2026-02-20T01:05:00.000Z",
        scheduledAt: null,
        sentAt: null
      });
    }

    if (requestUrl.pathname === "/trpc/issue.deliveryProgress") {
      progressReadCount += 1;
      if (progressReadCount === 1) {
        return trpcOk({
          issueId: "iss_123",
          publicationId: "pub_demo",
          status: "sending",
          updatedAt: "2026-02-20T01:06:00.000Z",
          sentAt: null,
          delivery: {
            total: 25,
            sent: 10,
            failed: 0,
            pending: 15,
            processed: 10,
            completionPercent: 40,
            hasSnapshot: true,
            isPreparing: false
          }
        });
      }

      return trpcOk({
        issueId: "iss_123",
        publicationId: "pub_demo",
        status: "sent",
        updatedAt: "2026-02-20T01:07:00.000Z",
        sentAt: "2026-02-20T01:07:00.000Z",
        delivery: {
          total: 25,
          sent: 24,
          failed: 1,
          pending: 0,
          processed: 25,
          completionPercent: 100,
          hasSnapshot: true,
          isPreparing: false
        }
      });
    }

    return new Response("unexpected request", { status: 500 });
  };

  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 1.56,
      method: "tools/call",
      params: {
        name: "issue.send_and_wait",
        arguments: {
          issueId: "iss_123",
          timeoutMs: 2_000,
          pollIntervalMs: 25
        }
      }
    },
    {
      apiBaseUrl: "http://localhost:8787",
      token: "pat_test_token",
      fetchImpl
    }
  );

  assert.equal(calls.length, 3);
  const firstRequest = calls[0]!;
  assert.equal(firstRequest.url, "http://localhost:8787/trpc/issue.sendNow");
  assert.equal(firstRequest.init?.method, "POST");
  const firstBody = firstRequest.init?.body as string;
  assert.ok(firstBody);
  assert.deepEqual(JSON.parse(firstBody), { issueId: "iss_123" });

  const secondRequestUrl = new URL(calls[1]!.url);
  const thirdRequestUrl = new URL(calls[2]!.url);
  assert.equal(secondRequestUrl.pathname, "/trpc/issue.deliveryProgress");
  assert.equal(thirdRequestUrl.pathname, "/trpc/issue.deliveryProgress");

  const secondInput = secondRequestUrl.searchParams.get("input");
  const thirdInput = thirdRequestUrl.searchParams.get("input");
  assert.ok(secondInput);
  assert.ok(thirdInput);
  assert.deepEqual(JSON.parse(secondInput), {
    publicationId: "pub_demo",
    issueId: "iss_123"
  });
  assert.deepEqual(JSON.parse(thirdInput), {
    publicationId: "pub_demo",
    issueId: "iss_123"
  });

  const result = readJsonRpcResult(response);
  const content = result.content as Array<{ type: string; text: string }>;
  assert.equal(
    content[0]?.text,
    "Issue iss_123 send-and-wait finished with status sent: 25/25 processed (100%)"
  );
});

test("issue.send_and_wait returns timeout details when delivery stays sending", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    const requestUrl = new URL(String(url));
    calls.push({ url: requestUrl.toString(), init });

    if (requestUrl.pathname === "/trpc/issue.sendNow") {
      return trpcOk({
        id: "iss_timeout",
        publicationId: "pub_demo",
        title: "Long running issue",
        status: "sending",
        createdAt: "2026-02-20T01:00:00.000Z",
        updatedAt: "2026-02-20T01:05:00.000Z",
        scheduledAt: null,
        sentAt: null
      });
    }

    if (requestUrl.pathname === "/trpc/issue.deliveryProgress") {
      return trpcOk({
        issueId: "iss_timeout",
        publicationId: "pub_demo",
        status: "sending",
        updatedAt: "2026-02-20T01:06:00.000Z",
        sentAt: null,
        delivery: {
          total: 100,
          sent: 15,
          failed: 0,
          pending: 85,
          processed: 15,
          completionPercent: 15,
          hasSnapshot: true,
          isPreparing: false
        }
      });
    }

    return new Response("unexpected request", { status: 500 });
  };

  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 1.57,
      method: "tools/call",
      params: {
        name: "issue.send_and_wait",
        arguments: {
          issueId: "iss_timeout",
          timeoutMs: 10,
          pollIntervalMs: 5
        }
      }
    },
    {
      apiBaseUrl: "http://localhost:8787",
      token: "pat_test_token",
      fetchImpl
    }
  );

  assert.equal(calls[0]?.url, "http://localhost:8787/trpc/issue.sendNow");
  assert.equal(calls.length >= 2, true);
  for (let index = 1; index < calls.length; index += 1) {
    const requestUrl = new URL(calls[index]!.url);
    assert.equal(requestUrl.pathname, "/trpc/issue.deliveryProgress");
  }

  const result = readJsonRpcResult(response);
  const content = result.content as Array<{ type: string; text: string }>;
  assert.equal(content[0]?.text.includes("queued but still sending"), true);

  const structured = result.structuredContent as {
    timedOut: boolean;
    elapsedMs: number;
    progress: { status: string };
  };
  assert.equal(structured.timedOut, true);
  assert.equal(structured.progress.status, "sending");
  assert.equal(structured.elapsedMs >= 1_000, true);
});

test("contact.list calls query endpoint", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return trpcOk([
      {
        id: "sub_1",
        email: "alice@example.com",
        status: "active",
        createdAt: "2026-02-20T01:00:00.000Z",
        updatedAt: "2026-02-20T01:05:00.000Z"
      }
    ]);
  };

  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 1.6,
      method: "tools/call",
      params: {
        name: "contact.list",
        arguments: {
          publicationId: "pub_demo",
          status: "active",
          query: "alice",
          limit: 50
        }
      }
    },
    {
      apiBaseUrl: "http://localhost:8787",
      token: "pat_test_token",
      fetchImpl
    }
  );

  assert.equal(calls.length, 1);
  const request = calls[0]!;
  const requestUrl = new URL(request.url);
  assert.equal(requestUrl.pathname, "/trpc/contact.list");
  assert.equal(request.init?.method, "GET");
  const inputParam = requestUrl.searchParams.get("input");
  assert.ok(inputParam);
  assert.deepEqual(JSON.parse(inputParam), {
    publicationId: "pub_demo",
    status: "active",
    query: "alice",
    limit: 50
  });

  const result = readJsonRpcResult(response);
  const content = result.content as Array<{ type: string; text: string }>;
  assert.equal(content[0]?.text, "Loaded 1 contacts for pub_demo");
});

test("contact.upsert sends mutation payload", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return trpcOk({
      id: "sub_1",
      email: "alice@example.com",
      status: "active",
      createdAt: "2026-02-20T01:00:00.000Z",
      updatedAt: "2026-02-20T01:05:00.000Z"
    });
  };

  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 1.7,
      method: "tools/call",
      params: {
        name: "contact.upsert",
        arguments: {
          publicationId: "pub_demo",
          email: "alice@example.com",
          referrerContactId: "sub_ref_1"
        }
      }
    },
    {
      apiBaseUrl: "http://localhost:8787",
      token: "pat_test_token",
      fetchImpl
    }
  );

  assert.equal(calls.length, 1);
  const request = calls[0]!;
  assert.equal(request.url, "http://localhost:8787/trpc/contact.upsert");
  assert.equal(request.init?.method, "POST");
  const body = request.init?.body as string;
  assert.ok(body);
  assert.deepEqual(JSON.parse(body), {
    publicationId: "pub_demo",
    email: "alice@example.com",
    referrerContactId: "sub_ref_1"
  });

  const result = readJsonRpcResult(response);
  const content = result.content as Array<{ type: string; text: string }>;
  assert.equal(content[0]?.text, "Contact saved: sub_1 (active)");
});

test("contact.set_status sends mutation payload", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return trpcOk({
      id: "sub_1",
      email: "alice@example.com",
      status: "suppressed",
      createdAt: "2026-02-20T01:00:00.000Z",
      updatedAt: "2026-02-20T01:10:00.000Z"
    });
  };

  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 1.8,
      method: "tools/call",
      params: {
        name: "contact.set_status",
        arguments: {
          publicationId: "pub_demo",
          contactId: "sub_1",
          status: "suppressed"
        }
      }
    },
    {
      apiBaseUrl: "http://localhost:8787",
      token: "pat_test_token",
      fetchImpl
    }
  );

  assert.equal(calls.length, 1);
  const request = calls[0]!;
  assert.equal(request.url, "http://localhost:8787/trpc/contact.setStatus");
  assert.equal(request.init?.method, "POST");
  const body = request.init?.body as string;
  assert.ok(body);
  assert.deepEqual(JSON.parse(body), {
    publicationId: "pub_demo",
    contactId: "sub_1",
    status: "suppressed"
  });

  const result = readJsonRpcResult(response);
  const content = result.content as Array<{ type: string; text: string }>;
  assert.equal(content[0]?.text, "Contact status updated: sub_1 -> suppressed");
});

test("contact.import_csv sends mutation payload", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return trpcOk({
      publicationId: "pub_demo",
      sourceRowCount: 4,
      validUniqueCount: 3,
      createdCount: 2,
      reactivatedCount: 1,
      alreadyActiveCount: 0,
      suppressedCount: 0,
      invalidCount: 1,
      blankCount: 0,
      duplicateCount: 0,
      invalidSamples: ["bad-email"]
    });
  };

  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 1.9,
      method: "tools/call",
      params: {
        name: "contact.import_csv",
        arguments: {
          publicationId: "pub_demo",
          csvText: "email\nalice@example.com\nbob@example.com\nbad-email"
        }
      }
    },
    {
      apiBaseUrl: "http://localhost:8787",
      token: "pat_test_token",
      fetchImpl
    }
  );

  assert.equal(calls.length, 1);
  const request = calls[0]!;
  assert.equal(request.url, "http://localhost:8787/trpc/contact.importCsv");
  assert.equal(request.init?.method, "POST");
  const body = request.init?.body as string;
  assert.ok(body);
  assert.deepEqual(JSON.parse(body), {
    publicationId: "pub_demo",
    csvText: "email\nalice@example.com\nbob@example.com\nbad-email"
  });

  const result = readJsonRpcResult(response);
  const content = result.content as Array<{ type: string; text: string }>;
  assert.equal(
    content[0]?.text,
    "Contact import complete for pub_demo: +2 new, 1 reactivated, 1 invalid"
  );
});

test("resources/read analytics summary aggregates latest issue metrics", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    const requestUrl = new URL(String(url));
    calls.push({ url: requestUrl.toString(), init });
    assert.equal(requestUrl.pathname, "/trpc/issue.latestSummary");
    return trpcOk({
      status: "ok",
      generatedAt: "2026-02-19T11:00:00.000Z",
      publicationId: "pub_demo",
      range: "30d",
      issue: {
        id: "iss_123",
        title: "Weekly product update",
        status: "sent",
        sentAt: "2026-02-19T10:05:00.000Z",
        updatedAt: "2026-02-19T10:05:00.000Z"
      },
      analytics: {
        issueId: "iss_123",
        publicationId: "pub_demo",
        range: "30d",
        since: "2026-01-20T00:00:00.000Z",
        opens: { total: 120, unique: 89 },
        clicks: { total: 42, unique: 31 },
        topLinks: [{ url: "https://example.com/new", clicks: 20 }]
      },
      polls: {
        pollCount: 1,
        totalVotes: 18,
        polls: [
          {
            pollId: "weekly_vote",
            question: "What should ship next?",
            totalVotes: 18,
            options: [
              { option: "A", votes: 11 },
              { option: "B", votes: 7 }
            ]
          }
        ]
      }
    });
  };

  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 2,
      method: "resources/read",
      params: {
        uri: "analytics://current/latest-summary?publicationId=pub_demo&range=30d"
      }
    },
    {
      apiBaseUrl: "http://localhost:8787",
      token: "pat_test_token",
      fetchImpl
    }
  );

  assert.equal(calls.length, 1);
  const request = calls[0]!;
  const requestUrl = new URL(request.url);
  assert.equal(requestUrl.pathname, "/trpc/issue.latestSummary");
  assert.equal(request.init?.method, "GET");
  const inputParam = requestUrl.searchParams.get("input");
  assert.ok(inputParam);
  assert.deepEqual(JSON.parse(inputParam), {
    publicationId: "pub_demo",
    range: "30d"
  });

  const result = readJsonRpcResult(response);
  const contents = result.contents as Array<{ type: string; text: string }>;
  const summary = JSON.parse(contents[0]!.text) as {
    status: string;
    publicationId: string;
    range: string;
    issue: { id: string };
    analytics: { opens: { total: number } };
    polls: { totalVotes: number };
  };
  assert.equal(summary.status, "ok");
  assert.equal(summary.publicationId, "pub_demo");
  assert.equal(summary.range, "30d");
  assert.equal(summary.issue.id, "iss_123");
  assert.equal(summary.analytics.opens.total, 120);
  assert.equal(summary.polls.totalVotes, 18);
});

test("resources/read analytics summary returns missing context without publication", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return trpcOk([]);
  };

  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 3,
      method: "resources/read",
      params: {
        uri: "analytics://current/latest-summary"
      }
    },
    {
      fetchImpl
    }
  );

  assert.equal(calls.length, 0);
  const result = readJsonRpcResult(response);
  const contents = result.contents as Array<{ type: string; text: string }>;
  const summary = JSON.parse(contents[0]!.text) as {
    status: string;
    exampleUri: string;
  };
  assert.equal(summary.status, "missing_publication_context");
  assert.equal(summary.exampleUri, "analytics://current/latest-summary?publicationId=pub_demo");
});

test("contact.referral_summary calls query endpoint", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return trpcOk({
      publicationId: "pub_demo",
      totalReferrals: 3,
      leaders: [
        {
          contactId: "sub_ref_1",
          email: "referrer@example.com",
          referralCount: 3,
          latestReferralAt: "2026-02-19T18:30:00.000Z"
        }
      ]
    });
  };

  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: {
        name: "contact.referral_summary",
        arguments: {
          publicationId: "pub_demo",
          limit: 5
        }
      }
    },
    {
      apiBaseUrl: "http://localhost:8787",
      token: "pat_test_token",
      fetchImpl
    }
  );

  assert.equal(calls.length, 1);
  const request = calls[0]!;
  const requestUrl = new URL(request.url);
  assert.equal(requestUrl.pathname, "/trpc/contact.referralSummary");
  assert.equal(request.init?.method, "GET");

  const inputParam = requestUrl.searchParams.get("input");
  assert.ok(inputParam);
  assert.deepEqual(JSON.parse(inputParam), { publicationId: "pub_demo", limit: 5 });

  const result = readJsonRpcResult(response);
  const content = result.content as Array<{ type: string; text: string }>;
  assert.equal(content[0]?.text, "Loaded referral summary for pub_demo: 3 total referrals");
});

test("contact.referral_milestones calls query endpoint", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return trpcOk([
      {
        id: "rms_1",
        publicationId: "pub_demo",
        title: "Starter",
        description: "First milestone",
        referralCount: 3,
        createdByUserId: "usr_1",
        createdAt: "2026-02-19T18:00:00.000Z",
        updatedAt: "2026-02-19T18:00:00.000Z"
      }
    ]);
  };

  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 4.1,
      method: "tools/call",
      params: {
        name: "contact.referral_milestones",
        arguments: {
          publicationId: "pub_demo",
          limit: 10
        }
      }
    },
    {
      apiBaseUrl: "http://localhost:8787",
      token: "pat_test_token",
      fetchImpl
    }
  );

  assert.equal(calls.length, 1);
  const request = calls[0]!;
  const requestUrl = new URL(request.url);
  assert.equal(requestUrl.pathname, "/trpc/contact.referralMilestones");
  assert.equal(request.init?.method, "GET");

  const inputParam = requestUrl.searchParams.get("input");
  assert.ok(inputParam);
  assert.deepEqual(JSON.parse(inputParam), { publicationId: "pub_demo", limit: 10 });

  const result = readJsonRpcResult(response);
  const content = result.content as Array<{ type: string; text: string }>;
  assert.equal(content[0]?.text, "Loaded 1 referral milestones for pub_demo");
});

test("contact.referral_milestone_upsert sends mutation payload", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return trpcOk({
      milestone: {
        id: "rms_1",
        publicationId: "pub_demo",
        title: "Starter",
        description: "First milestone",
        referralCount: 3,
        createdByUserId: "usr_1",
        createdAt: "2026-02-19T18:00:00.000Z",
        updatedAt: "2026-02-19T18:00:00.000Z"
      },
      rewardedCount: 2
    });
  };

  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 4.2,
      method: "tools/call",
      params: {
        name: "contact.referral_milestone_upsert",
        arguments: {
          publicationId: "pub_demo",
          title: "Starter",
          description: "First milestone",
          referralCount: 3
        }
      }
    },
    {
      apiBaseUrl: "http://localhost:8787",
      token: "pat_test_token",
      fetchImpl
    }
  );

  assert.equal(calls.length, 1);
  const request = calls[0]!;
  assert.equal(request.url, "http://localhost:8787/trpc/contact.upsertReferralMilestone");
  assert.equal(request.init?.method, "POST");

  const body = request.init?.body as string;
  assert.ok(body);
  assert.deepEqual(JSON.parse(body), {
    publicationId: "pub_demo",
    title: "Starter",
    description: "First milestone",
    referralCount: 3
  });

  const result = readJsonRpcResult(response);
  const content = result.content as Array<{ type: string; text: string }>;
  assert.equal(content[0]?.text, "Referral milestone saved: rms_1 (2 rewards granted)");
});

test("contact.referral_rewards calls query endpoint", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return trpcOk([
      {
        id: "rwd_1",
        publicationId: "pub_demo",
        contactId: "sub_ref_1",
        contactEmail: "referrer@example.com",
        milestoneId: "rms_1",
        milestoneTitle: "Starter",
        milestoneDescription: "First milestone",
        milestoneReferralCount: 3,
        awardedAt: "2026-02-19T18:45:00.000Z"
      }
    ]);
  };

  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 4.3,
      method: "tools/call",
      params: {
        name: "contact.referral_rewards",
        arguments: {
          publicationId: "pub_demo",
          limit: 10
        }
      }
    },
    {
      apiBaseUrl: "http://localhost:8787",
      token: "pat_test_token",
      fetchImpl
    }
  );

  assert.equal(calls.length, 1);
  const request = calls[0]!;
  const requestUrl = new URL(request.url);
  assert.equal(requestUrl.pathname, "/trpc/contact.referralRewards");
  assert.equal(request.init?.method, "GET");

  const inputParam = requestUrl.searchParams.get("input");
  assert.ok(inputParam);
  assert.deepEqual(JSON.parse(inputParam), { publicationId: "pub_demo", limit: 10 });

  const result = readJsonRpcResult(response);
  const content = result.content as Array<{ type: string; text: string }>;
  assert.equal(content[0]?.text, "Loaded 1 referral rewards for pub_demo");
});

test("section.list calls query endpoint and returns structured sections", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });

    return trpcOk([
      {
        id: "sec_123",
        publicationId: "pub_demo",
        userId: "usr_123",
        name: "Hero Intro",
        contentJson: [{ type: "paragraph", content: [{ type: "text", text: "Hello" }] }],
        createdAt: "2026-02-18T19:30:00.000Z",
        updatedAt: "2026-02-18T19:30:00.000Z"
      }
    ]);
  };

  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "section.list",
        arguments: {
          publicationId: "pub_demo",
          limit: 5
        }
      }
    },
    {
      apiBaseUrl: "http://localhost:8787",
      token: "pat_test_token",
      fetchImpl
    }
  );

  assert.equal(calls.length, 1);
  const request = calls[0]!;
  const requestUrl = new URL(request.url);
  assert.equal(requestUrl.origin, "http://localhost:8787");
  assert.equal(requestUrl.pathname, "/trpc/section.list");
  assert.equal(request.init?.method, "GET");

  const headers = request.init?.headers as Record<string, string> | undefined;
  assert.equal(headers?.authorization, "Bearer pat_test_token");

  const inputParam = requestUrl.searchParams.get("input");
  assert.ok(inputParam);
  assert.deepEqual(JSON.parse(inputParam), { publicationId: "pub_demo", limit: 5 });

  const result = readJsonRpcResult(response);
  const content = result.content as Array<{ type: string; text: string }>;
  assert.equal(content[0]?.text, "Loaded 1 reusable sections for pub_demo");

  const structuredContent = result.structuredContent as {
    publicationId: string;
    sections: Array<{ id: string }>;
  };
  assert.equal(structuredContent.publicationId, "pub_demo");
  assert.equal(structuredContent.sections.length, 1);
  assert.equal(structuredContent.sections[0]?.id, "sec_123");
});

test("section.create sends mutation payload and returns saved section", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });

    return trpcOk({
      id: "sec_555",
      publicationId: "pub_demo",
      userId: "usr_123",
      name: "CTA Block",
      contentJson: [{ type: "paragraph", content: [{ type: "text", text: "Click here" }] }],
      createdAt: "2026-02-18T19:31:00.000Z",
      updatedAt: "2026-02-18T19:31:00.000Z"
    });
  };

  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "section.create",
        arguments: {
          publicationId: "pub_demo",
          name: "CTA Block",
          contentJson: [{ type: "paragraph", content: [{ type: "text", text: "Click here" }] }]
        }
      }
    },
    {
      apiBaseUrl: "http://localhost:8787",
      token: "pat_test_token",
      fetchImpl
    }
  );

  assert.equal(calls.length, 1);
  const request = calls[0]!;
  assert.equal(request.url, "http://localhost:8787/trpc/section.create");
  assert.equal(request.init?.method, "POST");

  const headers = request.init?.headers as Record<string, string> | undefined;
  assert.equal(headers?.authorization, "Bearer pat_test_token");
  assert.equal(headers?.["content-type"], "application/json");

  const body = request.init?.body as string;
  assert.ok(body);
  assert.deepEqual(JSON.parse(body), {
    publicationId: "pub_demo",
    name: "CTA Block",
    contentJson: [{ type: "paragraph", content: [{ type: "text", text: "Click here" }] }]
  });

  const result = readJsonRpcResult(response);
  const content = result.content as Array<{ type: string; text: string }>;
  assert.equal(content[0]?.text, "Reusable section saved: sec_555");
});

test("section.catalog calls query endpoint", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return trpcOk([
      {
        id: "product-weekly-core",
        title: "Product Weekly Core",
        description: "Weekly shipping preset",
        source: "builtin",
        createdByUserId: null,
        sections: [{ name: "Issue Header", contentJson: [] }]
      }
    ]);
  };

  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 5,
      method: "tools/call",
      params: {
        name: "section.catalog",
        arguments: {
          publicationId: "pub_demo"
        }
      }
    },
    {
      apiBaseUrl: "http://localhost:8787",
      token: "pat_test_token",
      fetchImpl
    }
  );

  assert.equal(calls.length, 1);
  const request = calls[0]!;
  const requestUrl = new URL(request.url);
  assert.equal(requestUrl.pathname, "/trpc/section.catalog");
  assert.equal(request.init?.method, "GET");
  const inputParam = requestUrl.searchParams.get("input");
  assert.ok(inputParam);
  assert.deepEqual(JSON.parse(inputParam), { publicationId: "pub_demo" });

  const result = readJsonRpcResult(response);
  const content = result.content as Array<{ type: string; text: string }>;
  assert.equal(content[0]?.text, "Loaded 1 marketplace packs");
});

test("section.pack_create sends mutation payload", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return trpcOk({
      pack: {
        id: "pack_123",
        title: "Weekly Ops Pack",
        description: "Ops preset",
        source: "custom",
        createdByUserId: "usr_123",
        sections: [{ name: "Ops Header", contentJson: [{ type: "paragraph" }] }]
      }
    });
  };

  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 7,
      method: "tools/call",
      params: {
        name: "section.pack_create",
        arguments: {
          publicationId: "pub_demo",
          title: "Weekly Ops Pack",
          description: "Ops preset",
          styleProfile: {
            presetId: "warm-editorial",
            accentColor: "#ea580c"
          },
          sections: [{ name: "Ops Header", contentJson: [{ type: "paragraph" }] }]
        }
      }
    },
    {
      apiBaseUrl: "http://localhost:8787",
      token: "pat_test_token",
      fetchImpl
    }
  );

  assert.equal(calls.length, 1);
  const request = calls[0]!;
  assert.equal(request.url, "http://localhost:8787/trpc/section.createPack");
  assert.equal(request.init?.method, "POST");

  const body = request.init?.body as string;
  assert.ok(body);
  assert.deepEqual(JSON.parse(body), {
    publicationId: "pub_demo",
    title: "Weekly Ops Pack",
    description: "Ops preset",
    styleProfile: {
      presetId: "warm-editorial",
      accentColor: "#ea580c"
    },
    sections: [{ name: "Ops Header", contentJson: [{ type: "paragraph" }] }]
  });

  const result = readJsonRpcResult(response);
  const content = result.content as Array<{ type: string; text: string }>;
  assert.equal(content[0]?.text, "Marketplace pack created: pack_123");
});

test("section.pack_update sends mutation payload", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return trpcOk({
      pack: {
        id: "pack_123",
        title: "Weekly Ops Pack v2",
        description: "Updated ops preset",
        source: "custom",
        createdByUserId: "usr_123",
        sections: [{ name: "Ops Header", contentJson: [{ type: "paragraph" }] }]
      }
    });
  };

  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 8,
      method: "tools/call",
      params: {
        name: "section.pack_update",
        arguments: {
          publicationId: "pub_demo",
          packId: "pack_123",
          title: "Weekly Ops Pack v2",
          description: "Updated ops preset",
          styleProfile: {
            presetId: "high-contrast",
            accentColor: "#22c55e"
          },
          sections: [{ name: "Ops Header", contentJson: [{ type: "paragraph" }] }]
        }
      }
    },
    {
      apiBaseUrl: "http://localhost:8787",
      token: "pat_test_token",
      fetchImpl
    }
  );

  assert.equal(calls.length, 1);
  const request = calls[0]!;
  assert.equal(request.url, "http://localhost:8787/trpc/section.updatePack");
  assert.equal(request.init?.method, "POST");

  const body = request.init?.body as string;
  assert.ok(body);
  assert.deepEqual(JSON.parse(body), {
    publicationId: "pub_demo",
    packId: "pack_123",
    title: "Weekly Ops Pack v2",
    description: "Updated ops preset",
    styleProfile: {
      presetId: "high-contrast",
      accentColor: "#22c55e"
    },
    sections: [{ name: "Ops Header", contentJson: [{ type: "paragraph" }] }]
  });

  const result = readJsonRpcResult(response);
  const content = result.content as Array<{ type: string; text: string }>;
  assert.equal(content[0]?.text, "Marketplace pack updated: pack_123");
});

test("section.pack_remove sends mutation payload", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return trpcOk({ removed: true, packId: "pack_123" });
  };

  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 9,
      method: "tools/call",
      params: {
        name: "section.pack_remove",
        arguments: {
          publicationId: "pub_demo",
          packId: "pack_123"
        }
      }
    },
    {
      apiBaseUrl: "http://localhost:8787",
      token: "pat_test_token",
      fetchImpl
    }
  );

  assert.equal(calls.length, 1);
  const request = calls[0]!;
  assert.equal(request.url, "http://localhost:8787/trpc/section.removePack");
  assert.equal(request.init?.method, "POST");

  const body = request.init?.body as string;
  assert.ok(body);
  assert.deepEqual(JSON.parse(body), {
    publicationId: "pub_demo",
    packId: "pack_123"
  });

  const result = readJsonRpcResult(response);
  const content = result.content as Array<{ type: string; text: string }>;
  assert.equal(content[0]?.text, "Marketplace pack removed: pack_123");
});

test("section.pack_revisions calls query endpoint", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return trpcOk([
      {
        id: "prev_2",
        packId: "pack_123",
        publicationId: "pub_demo",
        version: 2,
        title: "Weekly Ops Pack v2",
        description: "Updated pack",
        sections: [{ name: "Header", contentJson: [{ type: "paragraph" }] }],
        createdByUserId: "usr_123",
        createdAt: "2026-02-18T20:00:00.000Z"
      },
      {
        id: "prev_1",
        packId: "pack_123",
        publicationId: "pub_demo",
        version: 1,
        title: "Weekly Ops Pack",
        description: "Initial pack",
        sections: [{ name: "Header", contentJson: [{ type: "paragraph" }] }],
        createdByUserId: "usr_123",
        createdAt: "2026-02-18T19:55:00.000Z"
      }
    ]);
  };

  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 10,
      method: "tools/call",
      params: {
        name: "section.pack_revisions",
        arguments: {
          publicationId: "pub_demo",
          packId: "pack_123",
          limit: 5
        }
      }
    },
    {
      apiBaseUrl: "http://localhost:8787",
      token: "pat_test_token",
      fetchImpl
    }
  );

  assert.equal(calls.length, 1);
  const request = calls[0]!;
  const requestUrl = new URL(request.url);
  assert.equal(requestUrl.pathname, "/trpc/section.revisions");
  assert.equal(request.init?.method, "GET");
  const inputParam = requestUrl.searchParams.get("input");
  assert.ok(inputParam);
  assert.deepEqual(JSON.parse(inputParam), {
    publicationId: "pub_demo",
    packId: "pack_123",
    limit: 5
  });

  const result = readJsonRpcResult(response);
  const content = result.content as Array<{ type: string; text: string }>;
  assert.equal(content[0]?.text, "Loaded 2 revisions for pack_123");
});

test("section.pack_restore_revision sends mutation payload", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return trpcOk({
      pack: {
        id: "pack_123",
        title: "Weekly Ops Pack",
        description: "Initial pack",
        source: "custom",
        createdByUserId: "usr_123",
        sections: [{ name: "Header", contentJson: [{ type: "paragraph" }] }]
      },
      restoredFrom: {
        id: "prev_1",
        packId: "pack_123",
        publicationId: "pub_demo",
        version: 1,
        title: "Weekly Ops Pack",
        description: "Initial pack",
        sections: [{ name: "Header", contentJson: [{ type: "paragraph" }] }],
        createdByUserId: "usr_123",
        createdAt: "2026-02-18T19:55:00.000Z"
      },
      createdRevision: {
        id: "prev_3",
        packId: "pack_123",
        publicationId: "pub_demo",
        version: 3,
        title: "Weekly Ops Pack",
        description: "Initial pack",
        sections: [{ name: "Header", contentJson: [{ type: "paragraph" }] }],
        createdByUserId: "usr_123",
        createdAt: "2026-02-18T20:05:00.000Z"
      }
    });
  };

  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 11,
      method: "tools/call",
      params: {
        name: "section.pack_restore_revision",
        arguments: {
          publicationId: "pub_demo",
          packId: "pack_123",
          revisionId: "prev_1"
        }
      }
    },
    {
      apiBaseUrl: "http://localhost:8787",
      token: "pat_test_token",
      fetchImpl
    }
  );

  assert.equal(calls.length, 1);
  const request = calls[0]!;
  assert.equal(request.url, "http://localhost:8787/trpc/section.restorePackRevision");
  assert.equal(request.init?.method, "POST");
  const body = request.init?.body as string;
  assert.ok(body);
  assert.deepEqual(JSON.parse(body), {
    publicationId: "pub_demo",
    packId: "pack_123",
    revisionId: "prev_1"
  });

  const result = readJsonRpcResult(response);
  const content = result.content as Array<{ type: string; text: string }>;
  assert.equal(
    content[0]?.text,
    "Marketplace pack restored: pack_123 (from v1 -> v3)"
  );
});

test("section.import_pack sends mutation payload", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return trpcOk({
      presetId: "product-weekly-core",
      createdCount: 2,
      updatedCount: 1,
      imported: []
    });
  };

  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 6,
      method: "tools/call",
      params: {
        name: "section.import_pack",
        arguments: {
          publicationId: "pub_demo",
          presetId: "product-weekly-core"
        }
      }
    },
    {
      apiBaseUrl: "http://localhost:8787",
      token: "pat_test_token",
      fetchImpl
    }
  );

  assert.equal(calls.length, 1);
  const request = calls[0]!;
  assert.equal(request.url, "http://localhost:8787/trpc/section.importPack");
  assert.equal(request.init?.method, "POST");

  const body = request.init?.body as string;
  assert.ok(body);
  assert.deepEqual(JSON.parse(body), {
    publicationId: "pub_demo",
    presetId: "product-weekly-core"
  });

  const result = readJsonRpcResult(response);
  const content = result.content as Array<{ type: string; text: string }>;
  assert.equal(content[0]?.text, "Imported pack product-weekly-core: 2 created, 1 updated");
});

test("section.update validates contentJson as object array", async () => {
  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: {
        name: "section.update",
        arguments: {
          sectionId: "sec_123",
          name: "Hero Intro",
          contentJson: ["invalid"]
        }
      }
    },
    {
      apiBaseUrl: "http://localhost:8787",
      token: "pat_test_token",
      fetchImpl: async () => {
        throw new Error("fetch should not be called for invalid input");
      }
    }
  );

  assert.ok(response.error);
  assert.equal(response.error.code, -32000);
  assert.equal(
    response.error.message,
    "Argument contentJson must be a non-empty array of objects"
  );
});

test("analytics.poll_results calls query endpoint", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return trpcOk({
      issueId: "iss_123",
      publicationId: "pub_demo",
      polls: [
        {
          pollId: "roadmap_2026",
          question: "What should we build next?",
          totalVotes: 3,
          options: [
            { option: "AI drafting", votes: 2 },
            { option: "Audience segmentation", votes: 1 }
          ]
        }
      ]
    });
  };

  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 12,
      method: "tools/call",
      params: {
        name: "analytics.poll_results",
        arguments: {
          publicationId: "pub_demo",
          issueId: "iss_123"
        }
      }
    },
    {
      apiBaseUrl: "http://localhost:8787",
      token: "pat_test_token",
      fetchImpl
    }
  );

  assert.equal(calls.length, 1);
  const request = calls[0]!;
  const requestUrl = new URL(request.url);
  assert.equal(requestUrl.pathname, "/trpc/issue.pollResults");
  assert.equal(request.init?.method, "GET");
  const inputParam = requestUrl.searchParams.get("input");
  assert.ok(inputParam);
  assert.deepEqual(JSON.parse(inputParam), {
    publicationId: "pub_demo",
    issueId: "iss_123"
  });

  const result = readJsonRpcResult(response);
  const content = result.content as Array<{ type: string; text: string }>;
  assert.equal(content[0]?.text, "Loaded 1 polls for iss_123");
});

test("analytics.issue_performance calls query endpoint", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return trpcOk({
      issueId: "iss_123",
      publicationId: "pub_demo",
      range: "7d",
      since: "2026-02-12T00:00:00.000Z",
      opens: { total: 10, unique: 7 },
      clicks: { total: 4, unique: 3 },
      topLinks: [{ url: "https://example.com/a", clicks: 3 }]
    });
  };

  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 13,
      method: "tools/call",
      params: {
        name: "analytics.issue_performance",
        arguments: {
          publicationId: "pub_demo",
          issueId: "iss_123",
          range: "7d"
        }
      }
    },
    {
      apiBaseUrl: "http://localhost:8787",
      token: "pat_test_token",
      fetchImpl
    }
  );

  assert.equal(calls.length, 1);
  const request = calls[0]!;
  const requestUrl = new URL(request.url);
  assert.equal(requestUrl.pathname, "/trpc/issue.analytics");
  assert.equal(request.init?.method, "GET");
  const inputParam = requestUrl.searchParams.get("input");
  assert.ok(inputParam);
  assert.deepEqual(JSON.parse(inputParam), {
    publicationId: "pub_demo",
    issueId: "iss_123",
    range: "7d"
  });

  const result = readJsonRpcResult(response);
  const content = result.content as Array<{ type: string; text: string }>;
  assert.equal(
    content[0]?.text,
    "Issue analytics loaded for iss_123: 7 unique opens, 3 unique clicks"
  );
});

test("analytics.latest_summary calls query endpoints and returns aggregated snapshot", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    const requestUrl = new URL(String(url));
    calls.push({ url: requestUrl.toString(), init });
    assert.equal(requestUrl.pathname, "/trpc/issue.latestSummary");
    return trpcOk({
      status: "ok",
      generatedAt: "2026-02-19T11:00:00.000Z",
      publicationId: "pub_demo",
      range: "7d",
      issue: {
        id: "iss_200",
        title: "Shipping weekly",
        status: "sent",
        sentAt: "2026-02-18T10:06:00.000Z",
        updatedAt: "2026-02-18T10:05:00.000Z"
      },
      analytics: {
        issueId: "iss_200",
        publicationId: "pub_demo",
        range: "7d",
        since: "2026-02-12T00:00:00.000Z",
        opens: { total: 16, unique: 10 },
        clicks: { total: 6, unique: 4 },
        topLinks: [{ url: "https://example.com/weekly", clicks: 4 }]
      },
      polls: {
        pollCount: 1,
        totalVotes: 9,
        polls: [
          {
            pollId: "priority",
            question: "Top priority?",
            totalVotes: 9,
            options: [
              { option: "Editor", votes: 5 },
              { option: "Automation", votes: 4 }
            ]
          }
        ]
      }
    });
  };

  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 30,
      method: "tools/call",
      params: {
        name: "analytics.latest_summary",
        arguments: {
          publicationId: "pub_demo",
          range: "7d"
        }
      }
    },
    {
      apiBaseUrl: "http://localhost:8787",
      token: "pat_test_token",
      fetchImpl
    }
  );

  assert.equal(calls.length, 1);
  const request = calls[0]!;
  const requestUrl = new URL(request.url);
  assert.equal(requestUrl.pathname, "/trpc/issue.latestSummary");
  assert.equal(request.init?.method, "GET");
  const inputParam = requestUrl.searchParams.get("input");
  assert.ok(inputParam);
  assert.deepEqual(JSON.parse(inputParam), {
    publicationId: "pub_demo",
    range: "7d"
  });

  const result = readJsonRpcResult(response);
  const content = result.content as Array<{ type: string; text: string }>;
  assert.equal(
    content[0]?.text,
    "Latest analytics loaded for iss_200: 10 unique opens, 4 unique clicks"
  );

  const structured = result.structuredContent as {
    status: string;
    publicationId: string;
    range: string;
    issue: { id: string };
    polls: { totalVotes: number };
  };
  assert.equal(structured.status, "ok");
  assert.equal(structured.publicationId, "pub_demo");
  assert.equal(structured.range, "7d");
  assert.equal(structured.issue.id, "iss_200");
  assert.equal(structured.polls.totalVotes, 9);
});

test("analytics.latest_summary returns missing context when publication is unresolved", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return trpcOk([]);
  };

  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 31,
      method: "tools/call",
      params: {
        name: "analytics.latest_summary",
        arguments: {}
      }
    },
    {
      apiBaseUrl: "http://localhost:8787",
      token: "pat_test_token",
      fetchImpl
    }
  );

  assert.equal(calls.length, 0);
  const result = readJsonRpcResult(response);
  const content = result.content as Array<{ type: string; text: string }>;
  assert.equal(content[0]?.text, "Missing publication context for analytics.latest_summary");

  const structured = result.structuredContent as {
    status: string;
    message: string;
  };
  assert.equal(structured.status, "missing_publication_context");
  assert.equal(
    structured.message,
    "Set MAILTEA_PUBLICATION_ID or pass publicationId in the request."
  );
});

test("publication.list calls query endpoint", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return trpcOk([
      {
        id: "pub_demo",
        name: "Demo Publication",
        timezone: "UTC",
        memberRole: "owner",
        joinedAt: "2026-02-20T00:00:00.000Z",
        createdAt: "2026-02-20T00:00:00.000Z",
        updatedAt: "2026-02-20T00:00:00.000Z"
      }
    ]);
  };

  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 31.1,
      method: "tools/call",
      params: {
        name: "publication.list",
        arguments: {}
      }
    },
    {
      apiBaseUrl: "http://localhost:8787",
      token: "pat_test_token",
      fetchImpl
    }
  );

  assert.equal(calls.length, 1);
  const request = calls[0]!;
  const requestUrl = new URL(request.url);
  assert.equal(requestUrl.pathname, "/trpc/publication.listMine");
  assert.equal(request.init?.method, "GET");
  const inputParam = requestUrl.searchParams.get("input");
  assert.ok(inputParam);
  assert.deepEqual(JSON.parse(inputParam), {});

  const result = readJsonRpcResult(response);
  const content = result.content as Array<{ type: string; text: string }>;
  assert.equal(content[0]?.text, "Loaded 1 publication workspaces");
});

test("publication.create sends mutation payload", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return trpcOk({
      publication: {
        id: "pub_growth",
        name: "Growth Notes",
        timezone: "UTC",
        memberRole: "owner",
        joinedAt: "2026-02-20T00:00:00.000Z",
        createdAt: "2026-02-20T00:00:00.000Z",
        updatedAt: "2026-02-20T00:00:00.000Z"
      }
    });
  };

  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 31.2,
      method: "tools/call",
      params: {
        name: "publication.create",
        arguments: {
          publicationId: "pub_growth",
          name: "Growth Notes",
          timezone: "UTC"
        }
      }
    },
    {
      apiBaseUrl: "http://localhost:8787",
      token: "pat_test_token",
      fetchImpl
    }
  );

  assert.equal(calls.length, 1);
  const request = calls[0]!;
  assert.equal(request.url, "http://localhost:8787/trpc/publication.create");
  assert.equal(request.init?.method, "POST");
  const body = request.init?.body as string;
  assert.ok(body);
  assert.deepEqual(JSON.parse(body), {
    publicationId: "pub_growth",
    name: "Growth Notes",
    timezone: "UTC"
  });

  const result = readJsonRpcResult(response);
  const content = result.content as Array<{ type: string; text: string }>;
  assert.equal(content[0]?.text, "Publication created: pub_growth");
});

test("publication.domain_list calls query endpoint", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return trpcOk([
      {
        id: "dom_1",
        publicationId: "pub_demo",
        host: "news.example.com",
        status: "pending",
        isPrimary: true,
        verificationTxtName: "_mailtea.news.example.com",
        verificationTxtValue: "mailtea-verify=abc",
        proxyTarget: "web.internal:3000",
        verifiedAt: null,
        createdByUserId: "usr_1",
        createdAt: "2026-02-19T18:00:00.000Z",
        updatedAt: "2026-02-19T18:00:00.000Z"
      }
    ]);
  };

  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 32,
      method: "tools/call",
      params: {
        name: "publication.domain_list",
        arguments: {
          publicationId: "pub_demo",
          limit: 10
        }
      }
    },
    {
      apiBaseUrl: "http://localhost:8787",
      token: "pat_test_token",
      fetchImpl
    }
  );

  assert.equal(calls.length, 1);
  const request = calls[0]!;
  const requestUrl = new URL(request.url);
  assert.equal(requestUrl.pathname, "/trpc/publication.domains");
  assert.equal(request.init?.method, "GET");
  const inputParam = requestUrl.searchParams.get("input");
  assert.ok(inputParam);
  assert.deepEqual(JSON.parse(inputParam), {
    publicationId: "pub_demo",
    limit: 10
  });

  const result = readJsonRpcResult(response);
  const content = result.content as Array<{ type: string; text: string }>;
  assert.equal(content[0]?.text, "Loaded 1 custom domains for pub_demo");
});

test("publication.domain_upsert sends mutation payload", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return trpcOk({
      domain: {
        id: "dom_1",
        publicationId: "pub_demo",
        host: "news.example.com",
        status: "pending",
        isPrimary: true,
        verificationTxtName: "_mailtea.news.example.com",
        verificationTxtValue: "mailtea-verify=abc",
        proxyTarget: "web.internal:3000",
        verifiedAt: null,
        createdByUserId: "usr_1",
        createdAt: "2026-02-19T18:00:00.000Z",
        updatedAt: "2026-02-19T18:00:00.000Z"
      }
    });
  };

  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 33,
      method: "tools/call",
      params: {
        name: "publication.domain_upsert",
        arguments: {
          publicationId: "pub_demo",
          host: "news.example.com",
          isPrimary: true,
          proxyTarget: "web.internal:3000"
        }
      }
    },
    {
      apiBaseUrl: "http://localhost:8787",
      token: "pat_test_token",
      fetchImpl
    }
  );

  assert.equal(calls.length, 1);
  const request = calls[0]!;
  assert.equal(request.url, "http://localhost:8787/trpc/publication.domainUpsert");
  assert.equal(request.init?.method, "POST");
  const body = request.init?.body as string;
  assert.ok(body);
  assert.deepEqual(JSON.parse(body), {
    publicationId: "pub_demo",
    host: "news.example.com",
    isPrimary: true,
    proxyTarget: "web.internal:3000"
  });

  const result = readJsonRpcResult(response);
  const content = result.content as Array<{ type: string; text: string }>;
  assert.equal(content[0]?.text, "Publication domain saved: news.example.com (pending)");
});

test("publication.domain_traefik_preview calls query endpoint", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return trpcOk({
      publicationId: "pub_demo",
      generatedAt: "2026-02-19T18:00:00.000Z",
      configYaml: "http:\n  routers:\n    demo:\n      rule: \"Host(`news.example.com`)\"",
      entries: [
        {
          id: "dom_1",
          host: "news.example.com",
          status: "pending",
          isPrimary: true,
          proxyTarget: "web.internal:3000",
          traefikRouterKey: "mailtea-pub_demo-1",
          traefikRule: "Host(`news.example.com`)"
        }
      ]
    });
  };

  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 34,
      method: "tools/call",
      params: {
        name: "publication.domain_traefik_preview",
        arguments: {
          publicationId: "pub_demo"
        }
      }
    },
    {
      apiBaseUrl: "http://localhost:8787",
      token: "pat_test_token",
      fetchImpl
    }
  );

  assert.equal(calls.length, 1);
  const request = calls[0]!;
  const requestUrl = new URL(request.url);
  assert.equal(requestUrl.pathname, "/trpc/publication.domainTraefikPreview");
  assert.equal(request.init?.method, "GET");

  const inputParam = requestUrl.searchParams.get("input");
  assert.ok(inputParam);
  assert.deepEqual(JSON.parse(inputParam), { publicationId: "pub_demo" });

  const result = readJsonRpcResult(response);
  const content = result.content as Array<{ type: string; text: string }>;
  assert.equal(content[0]?.text, "Generated Traefik preview for pub_demo (1 domains)");
});

test("analytics.issue_export_csv calls query endpoint", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return trpcOk({
      exportType: "combined",
      filename: "issue-iss_123-analytics-7d.csv",
      rowCount: 6,
      csv: "record_type,issue_id\nopens,iss_123"
    });
  };

  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 14,
      method: "tools/call",
      params: {
        name: "analytics.issue_export_csv",
        arguments: {
          publicationId: "pub_demo",
          issueId: "iss_123",
          range: "7d"
        }
      }
    },
    {
      apiBaseUrl: "http://localhost:8787",
      token: "pat_test_token",
      fetchImpl
    }
  );

  assert.equal(calls.length, 1);
  const request = calls[0]!;
  const requestUrl = new URL(request.url);
  assert.equal(requestUrl.pathname, "/trpc/issue.analyticsExportCsv");
  assert.equal(request.init?.method, "GET");
  const inputParam = requestUrl.searchParams.get("input");
  assert.ok(inputParam);
  assert.deepEqual(JSON.parse(inputParam), {
    publicationId: "pub_demo",
    issueId: "iss_123",
    range: "7d",
    exportType: "combined"
  });

  const result = readJsonRpcResult(response);
  const content = result.content as Array<{ type: string; text: string }>;
  assert.equal(
    content[0]?.text,
    "Issue analytics combined CSV ready for iss_123: issue-iss_123-analytics-7d.csv (6 rows)"
  );
});

test("analytics.issue_export_performance_csv calls query endpoint", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return trpcOk({
      exportType: "performance",
      filename: "issue-iss_123-analytics-7d-performance.csv",
      rowCount: 3,
      csv: "record_type,issue_id\nopens,iss_123"
    });
  };

  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 16,
      method: "tools/call",
      params: {
        name: "analytics.issue_export_performance_csv",
        arguments: {
          publicationId: "pub_demo",
          issueId: "iss_123",
          range: "7d"
        }
      }
    },
    {
      apiBaseUrl: "http://localhost:8787",
      token: "pat_test_token",
      fetchImpl
    }
  );

  assert.equal(calls.length, 1);
  const request = calls[0]!;
  const requestUrl = new URL(request.url);
  assert.equal(requestUrl.pathname, "/trpc/issue.analyticsExportCsv");
  assert.equal(request.init?.method, "GET");
  const inputParam = requestUrl.searchParams.get("input");
  assert.ok(inputParam);
  assert.deepEqual(JSON.parse(inputParam), {
    publicationId: "pub_demo",
    issueId: "iss_123",
    range: "7d",
    exportType: "performance"
  });

  const result = readJsonRpcResult(response);
  const content = result.content as Array<{ type: string; text: string }>;
  assert.equal(
    content[0]?.text,
    "Issue performance CSV ready for iss_123: issue-iss_123-analytics-7d-performance.csv (3 rows)"
  );
});

test("analytics.issue_export_polls_csv calls query endpoint", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return trpcOk({
      exportType: "polls",
      filename: "issue-iss_123-analytics-7d-polls.csv",
      rowCount: 2,
      csv: "record_type,issue_id\npoll_option,iss_123"
    });
  };

  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 17,
      method: "tools/call",
      params: {
        name: "analytics.issue_export_polls_csv",
        arguments: {
          publicationId: "pub_demo",
          issueId: "iss_123",
          range: "7d"
        }
      }
    },
    {
      apiBaseUrl: "http://localhost:8787",
      token: "pat_test_token",
      fetchImpl
    }
  );

  assert.equal(calls.length, 1);
  const request = calls[0]!;
  const requestUrl = new URL(request.url);
  assert.equal(requestUrl.pathname, "/trpc/issue.analyticsExportCsv");
  assert.equal(request.init?.method, "GET");
  const inputParam = requestUrl.searchParams.get("input");
  assert.ok(inputParam);
  assert.deepEqual(JSON.parse(inputParam), {
    publicationId: "pub_demo",
    issueId: "iss_123",
    range: "7d",
    exportType: "polls"
  });

  const result = readJsonRpcResult(response);
  const content = result.content as Array<{ type: string; text: string }>;
  assert.equal(
    content[0]?.text,
    "Issue poll CSV ready for iss_123: issue-iss_123-analytics-7d-polls.csv (2 rows)"
  );
});

test("analytics.issue_trend calls query endpoint", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return trpcOk({
      issueId: "iss_123",
      publicationId: "pub_demo",
      range: "7d",
      since: "2026-02-12T00:00:00.000Z",
      points: [
        {
          date: "2026-02-12",
          opens: { total: 1, unique: 1 },
          clicks: { total: 0, unique: 0 }
        },
        {
          date: "2026-02-13",
          opens: { total: 2, unique: 2 },
          clicks: { total: 1, unique: 1 }
        }
      ]
    });
  };

  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 15,
      method: "tools/call",
      params: {
        name: "analytics.issue_trend",
        arguments: {
          publicationId: "pub_demo",
          issueId: "iss_123",
          range: "7d"
        }
      }
    },
    {
      apiBaseUrl: "http://localhost:8787",
      token: "pat_test_token",
      fetchImpl
    }
  );

  assert.equal(calls.length, 1);
  const request = calls[0]!;
  const requestUrl = new URL(request.url);
  assert.equal(requestUrl.pathname, "/trpc/issue.analyticsTrend");
  assert.equal(request.init?.method, "GET");
  const inputParam = requestUrl.searchParams.get("input");
  assert.ok(inputParam);
  assert.deepEqual(JSON.parse(inputParam), {
    publicationId: "pub_demo",
    issueId: "iss_123",
    range: "7d"
  });

  const result = readJsonRpcResult(response);
  const content = result.content as Array<{ type: string; text: string }>;
  assert.equal(content[0]?.text, "Issue trend loaded for iss_123: 2 daily points");
});

test("monetize.offer_list calls query endpoint", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return trpcOk([
      {
        id: "so_1",
        publicationId: "pub_demo",
        createdByUserId: "usr_1",
        title: "Launch bundle",
        sponsorName: "Acme Corp",
        description: "",
        pricingModel: "flat",
        rateCents: 125000,
        estimatedPlacements: 2,
        status: "active",
        startsAt: null,
        endsAt: null,
        createdAt: "2026-02-20T03:00:00.000Z",
        updatedAt: "2026-02-20T03:05:00.000Z"
      }
    ]);
  };

  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 18,
      method: "tools/call",
      params: {
        name: "monetize.offer_list",
        arguments: {
          publicationId: "pub_demo",
          status: "active"
        }
      }
    },
    {
      apiBaseUrl: "http://localhost:8787",
      token: "pat_test_token",
      fetchImpl
    }
  );

  assert.equal(calls.length, 1);
  const request = calls[0]!;
  const requestUrl = new URL(request.url);
  assert.equal(requestUrl.pathname, "/trpc/monetize.listOffers");
  assert.equal(request.init?.method, "GET");
  const inputParam = requestUrl.searchParams.get("input");
  assert.ok(inputParam);
  assert.deepEqual(JSON.parse(inputParam), {
    publicationId: "pub_demo",
    status: "active",
    limit: 100
  });

  const result = readJsonRpcResult(response);
  const content = result.content as Array<{ type: string; text: string }>;
  assert.equal(content[0]?.text, "Loaded 1 sponsor offers for pub_demo");
});

test("monetize.offer_upsert sends mutation payload", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return trpcOk({
      offer: {
        id: "so_1",
        publicationId: "pub_demo",
        createdByUserId: "usr_1",
        title: "Launch bundle",
        sponsorName: "Acme Corp",
        description: "Top placement",
        pricingModel: "flat",
        rateCents: 125000,
        estimatedPlacements: 2,
        status: "draft",
        startsAt: null,
        endsAt: null,
        createdAt: "2026-02-20T03:00:00.000Z",
        updatedAt: "2026-02-20T03:05:00.000Z"
      }
    });
  };

  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 19,
      method: "tools/call",
      params: {
        name: "monetize.offer_upsert",
        arguments: {
          publicationId: "pub_demo",
          title: "Launch bundle",
          sponsorName: "Acme Corp",
          description: "Top placement",
          pricingModel: "flat",
          rateCents: 125000,
          estimatedPlacements: 2,
          status: "draft"
        }
      }
    },
    {
      apiBaseUrl: "http://localhost:8787",
      token: "pat_test_token",
      fetchImpl
    }
  );

  assert.equal(calls.length, 1);
  const request = calls[0]!;
  assert.equal(request.url, "http://localhost:8787/trpc/monetize.upsertOffer");
  assert.equal(request.init?.method, "POST");

  const body = request.init?.body as string;
  assert.ok(body);
  assert.deepEqual(JSON.parse(body), {
    publicationId: "pub_demo",
    title: "Launch bundle",
    sponsorName: "Acme Corp",
    description: "Top placement",
    pricingModel: "flat",
    rateCents: 125000,
    estimatedPlacements: 2,
    status: "draft"
  });

  const result = readJsonRpcResult(response);
  const content = result.content as Array<{ type: string; text: string }>;
  assert.equal(content[0]?.text, "Sponsor offer saved: so_1");
});

// --- Transactional email tools (email.*) ---------------------------------

/** A plain REST JSON response (callRestApi reads the body directly, unwrapped). */
function restOk(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" }
  });
}

test("tools/list includes transactional email tools", async () => {
  const response = await handleMcpRequest({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list",
    params: {}
  });

  const result = readJsonRpcResult(response);
  const toolNames = (result.tools as Array<{ name: string }>).map((t) => t.name);

  for (const name of [
    "email.send",
    "email.batch",
    "email.get",
    "email.reschedule",
    "email.cancel",
    "email.list",
    "email.analytics",
    "email.inbound_list",
    "email.inbound_get",
    "email.inbound_list_attachments",
    "email.inbound_get_attachment",
    "email.inbound_reply"
  ]) {
    assert.ok(toolNames.includes(name), `missing tool: ${name}`);
  }
});

test("email.send POSTs the forwarded body to /v1/emails with a Bearer token", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk({ id: "email_abc123" });
  };

  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "email.send",
        arguments: {
          from: "Acme <hello@acme.com>",
          to: "user@example.com",
          subject: "Hi",
          html: "<p>Hello</p>",
          // an unrecognized field must be dropped, not forwarded
          bogus: "nope"
        }
      }
    },
    { apiBaseUrl: "http://localhost:8787", token: "pat_test_token", fetchImpl }
  );

  assert.equal(calls.length, 1);
  const request = calls[0]!;
  assert.equal(new URL(request.url).pathname, "/v1/emails");
  assert.equal(request.init?.method, "POST");
  const headers = new Headers(request.init?.headers);
  assert.equal(headers.get("authorization"), "Bearer pat_test_token");
  assert.deepEqual(JSON.parse(String(request.init?.body)), {
    from: "Acme <hello@acme.com>",
    to: "user@example.com",
    subject: "Hi",
    html: "<p>Hello</p>"
  });

  const result = readJsonRpcResult(response);
  const content = result.content as Array<{ type: string; text: string }>;
  assert.equal(content[0]?.text, "Email queued for delivery (email_abc123)");
  assert.deepEqual(result.structuredContent, { id: "email_abc123" });
});

test("email.send rejects a missing required field before any request", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk({ id: "should_not_happen" });
  };

  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "email.send",
        arguments: { from: "hello@acme.com", to: "user@example.com" }
      }
    },
    { apiBaseUrl: "http://localhost:8787", token: "pat_test_token", fetchImpl }
  );

  assert.equal(calls.length, 0);
  assert.ok(response.error);
  assert.match(response.error!.message, /Missing required field: subject/);
});

test("email.send forwards sender_id when used instead of from", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk({ id: "email_sid" });
  };

  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 5,
      method: "tools/call",
      params: {
        name: "email.send",
        arguments: {
          sender_id: "snd_123",
          to: "user@example.com",
          subject: "Hi",
          html: "<p>Hello</p>"
        }
      }
    },
    { apiBaseUrl: "http://localhost:8787", token: "pat_test_token", fetchImpl }
  );

  assert.equal(calls.length, 1);
  assert.deepEqual(JSON.parse(String(calls[0]!.init?.body)), {
    sender_id: "snd_123",
    to: "user@example.com",
    subject: "Hi",
    html: "<p>Hello</p>"
  });
  const result = readJsonRpcResult(response);
  assert.deepEqual(result.structuredContent, { id: "email_sid" });
});

test("email.send rejects providing both from and sender_id before any request", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk({ id: "should_not_happen" });
  };

  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 6,
      method: "tools/call",
      params: {
        name: "email.send",
        arguments: {
          from: "Acme <hello@acme.com>",
          sender_id: "snd_123",
          to: "user@example.com",
          subject: "Hi",
          html: "<p>Hello</p>"
        }
      }
    },
    { apiBaseUrl: "http://localhost:8787", token: "pat_test_token", fetchImpl }
  );

  assert.equal(calls.length, 0);
  assert.ok(response.error);
  assert.match(response.error!.message, /exactly one of 'from' or 'sender_id'/);
});

test("email.send rejects providing neither from nor sender_id", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk({ id: "should_not_happen" });
  };

  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 7,
      method: "tools/call",
      params: {
        name: "email.send",
        arguments: { to: "user@example.com", subject: "Hi", html: "<p>Hello</p>" }
      }
    },
    { apiBaseUrl: "http://localhost:8787", token: "pat_test_token", fetchImpl }
  );

  assert.equal(calls.length, 0);
  assert.ok(response.error);
  assert.match(response.error!.message, /exactly one of 'from' or 'sender_id'/);
});

test("email.batch sends a bare array body to /v1/emails/batch", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk({ data: [{ id: "e1" }, { id: "e2" }] });
  };

  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: {
        name: "email.batch",
        arguments: {
          emails: [
            { from: "a@acme.com", to: "x@example.com", subject: "1", html: "<p>1</p>" },
            { from: "a@acme.com", to: "y@example.com", subject: "2", html: "<p>2</p>" }
          ]
        }
      }
    },
    { apiBaseUrl: "http://localhost:8787", token: "pat_test_token", fetchImpl }
  );

  assert.equal(calls.length, 1);
  assert.equal(new URL(calls[0]!.url).pathname, "/v1/emails/batch");
  const body = JSON.parse(String(calls[0]!.init?.body));
  assert.ok(Array.isArray(body), "batch body must be a bare array");
  assert.equal(body.length, 2);

  const result = readJsonRpcResult(response);
  const content = result.content as Array<{ type: string; text: string }>;
  assert.equal(content[0]?.text, "Batch queued: 2 email(s).");
});

test("email.cancel POSTs to the cancel endpoint", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk({ object: "email", id: "email_abc123" });
  };

  await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 5,
      method: "tools/call",
      params: { name: "email.cancel", arguments: { id: "email_abc123" } }
    },
    { apiBaseUrl: "http://localhost:8787", token: "pat_test_token", fetchImpl }
  );

  assert.equal(calls.length, 1);
  assert.equal(new URL(calls[0]!.url).pathname, "/v1/emails/email_abc123/cancel");
  assert.equal(calls[0]!.init?.method, "POST");
});

test("email.list GETs /v1/emails with status + pagination filters", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk({
      object: "list",
      data: [{ id: "e1", last_event: "sent", subject: "Hi", to: "a@example.com" }],
      total: 1,
      has_more: false
    });
  };

  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 6,
      method: "tools/call",
      params: {
        name: "email.list",
        arguments: { status: "sent", limit: 10, tag_name: "campaign", search: "admin@somi.ai" }
      }
    },
    { apiBaseUrl: "http://localhost:8787", token: "pat_test_token", fetchImpl }
  );

  assert.equal(calls.length, 1);
  const url = new URL(calls[0]!.url);
  assert.equal(url.pathname, "/v1/emails");
  assert.equal(calls[0]!.init?.method, "GET");
  assert.equal(url.searchParams.get("status"), "sent");
  assert.equal(url.searchParams.get("limit"), "10");
  assert.equal(url.searchParams.get("tag_name"), "campaign");
  assert.equal(url.searchParams.get("search"), "admin@somi.ai");

  const result = readJsonRpcResult(response);
  const content = result.content as Array<{ type: string; text: string }>;
  assert.match(content[0]!.text, /1 of 1 email/);
});

test("email.list coerces string limit/offset (clients that send numbers as strings)", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk({ object: "list", data: [], total: 0, has_more: false });
  };

  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 7,
      method: "tools/call",
      params: { name: "email.list", arguments: { limit: "10", offset: "0" } }
    },
    { apiBaseUrl: "http://localhost:8787", token: "pat_test_token", fetchImpl }
  );

  assert.equal(response.error, undefined);
  assert.equal(calls.length, 1);
  const url = new URL(calls[0]!.url);
  assert.equal(url.searchParams.get("limit"), "10");
  assert.equal(url.searchParams.get("offset"), "0");
});

test("email.analytics GETs /v1/emails/analytics and summarizes rates", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk({
      object: "analytics",
      total: 10,
      sent: 10,
      delivered: 9,
      bounced: 1,
      opened: 4,
      clicked: 2,
      rates: { delivery_rate: 0.9, open_rate: 0.4, click_rate: 0.2, bounce_rate: 0.1 }
    });
  };

  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 8,
      method: "tools/call",
      params: { name: "email.analytics", arguments: { from_date: "2026-06-01" } }
    },
    { apiBaseUrl: "http://localhost:8787", token: "pat_test_token", fetchImpl }
  );

  assert.equal(calls.length, 1);
  const url = new URL(calls[0]!.url);
  assert.equal(url.pathname, "/v1/emails/analytics");
  assert.equal(url.searchParams.get("from_date"), "2026-06-01");

  const result = readJsonRpcResult(response);
  const content = result.content as Array<{ type: string; text: string }>;
  assert.match(content[0]!.text, /delivered 9 \(90\.0%\)/);
});

test("issue.send_test POSTs the gated /v1/posts/:id/test endpoint", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk({
      object: "test_send",
      id: "iss_1",
      sent_at: "2026-06-23T00:00:00.000Z",
      from: "Acme <a@acme.com>",
      sent_to: ["me@example.com", "team@example.com"],
      failed_to: []
    });
  };

  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 9,
      method: "tools/call",
      params: {
        name: "issue.send_test",
        arguments: {
          issueId: "iss_1",
          recipients: ["me@example.com", "team@example.com"],
          from: "Acme <a@acme.com>"
        }
      }
    },
    { apiBaseUrl: "http://localhost:8787", token: "pat_test_token", fetchImpl }
  );

  assert.equal(calls.length, 1);
  const sendCall = calls[0]!;
  assert.equal(new URL(sendCall.url).pathname, "/v1/posts/iss_1/test");
  assert.equal(sendCall.init?.method, "POST");
  const body = JSON.parse(String(sendCall.init?.body));
  assert.deepEqual(body.recipients, ["me@example.com", "team@example.com"]);
  assert.equal(body.from, "Acme <a@acme.com>");

  const result = readJsonRpcResult(response);
  const content = result.content as Array<{ type: string; text: string }>;
  assert.match(content[0]!.text, /sent to 2 recipient/);
});

test("issue.send_test wraps a single string recipient into an array", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk({ id: "iss_1", sent_to: ["solo@example.com"], failed_to: [] });
  };
  await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 10,
      method: "tools/call",
      params: {
        name: "issue.send_test",
        arguments: { issueId: "iss_1", recipients: "solo@example.com", from: "a@acme.com" }
      }
    },
    { apiBaseUrl: "http://localhost:8787", token: "pat_test_token", fetchImpl }
  );
  assert.deepEqual(JSON.parse(String(calls[0]!.init?.body)).recipients, ["solo@example.com"]);
});

// --- Resend-parity wrappers (domains, webhooks, segments, properties, tags, api keys) ---

async function callTool(name: string, args: Record<string, unknown>, fetchImpl: typeof fetch) {
  return handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 99,
      method: "tools/call",
      params: { name, arguments: args }
    },
    { apiBaseUrl: "http://localhost:8787", token: "pat_test_token", fetchImpl }
  );
}

test("tools/list includes the new Resend-parity tool groups", async () => {
  const response = await handleMcpRequest({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} });
  const tools = (readJsonRpcResult(response).tools as Array<{ name: string }>).map((t) => t.name);
  for (const name of [
    "domain.create", "domain.verify", "domain.delete",
    "webhook.create", "webhook.list",
    "segment.create", "segment.list",
    "contact_property.create", "contact.get", "contact.set_properties",
    "topic.create", "api_key.create", "api_key.revoke"
  ]) {
    assert.ok(tools.includes(name), `missing tool ${name}`);
  }
});

test("tools/list includes the finalise verbs (template/email/issue)", async () => {
  const response = await handleMcpRequest({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} });
  const tools = (readJsonRpcResult(response).tools as Array<{ name: string }>).map((t) => t.name);
  for (const name of [
    "template.update", "template.publish", "template.unpublish",
    "template.duplicate", "template.delete",
    "email.resend", "issue.publish_to_web", "issue.unpublish_from_web"
  ]) {
    assert.ok(tools.includes(name), `missing tool ${name}`);
  }
});

// --- the editor-doc path must be DISCOVERABLE ------------------------------
//
// An agent only ever knows what the inputSchema and the description advertise.
// `format: "editor"` is the format the Visual Email Designer writes, so if these
// assertions ever go quiet, agents silently lose the ability to author a
// designed template and fall back to raw html.

test("template.create/update advertise editor_doc and its sidecars", async () => {
  const response = await handleMcpRequest({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} });
  const tools = readJsonRpcResult(response).tools as Array<{
    name: string;
    description: string;
    inputSchema: { properties: Record<string, { type?: unknown; items?: unknown }> };
  }>;

  for (const name of ["template.create", "template.update"]) {
    const tool = tools.find((t) => t.name === name);
    assert.ok(tool, `missing tool ${name}`);
    for (const field of [
      "editor_doc",
      "style_profile",
      "mailtea_theme",
      "global_css",
      "category",
      "preview_image_url",
      "tags"
    ]) {
      assert.ok(tool.inputSchema.properties[field], `${name} does not advertise ${field}`);
    }
    // Naming the shape and the failure is what makes the path usable without
    // reading our source.
    assert.match(tool.description, /"type":"doc"/);
    assert.match(tool.description, /editor_doc_unrenderable/);
    assert.match(tool.description, /youtube/, "the lossy node types must be named");
  }
});

// Discriminated unions are exactly where MCP clients break — the automations
// sweep learned this and kept step `config` a flat object. The editor document
// is described in prose for the same reason, and this pins it.
test("no template tool schema uses a discriminated union", async () => {
  const response = await handleMcpRequest({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} });
  const tools = readJsonRpcResult(response).tools as Array<{ name: string; inputSchema: unknown }>;

  for (const tool of tools.filter((t) => t.name.startsWith("template."))) {
    const serialized = JSON.stringify(tool.inputSchema);
    for (const keyword of ['"oneOf"', '"anyOf"', '"allOf"', '"discriminator"']) {
      assert.ok(
        !serialized.includes(keyword),
        `${tool.name} inputSchema uses ${keyword}`
      );
    }
  }
});

// The three metadata fields are clearable, so update advertises them as
// nullable where create does not. A schema that says plain "string" makes a
// validating client reject the only value that means "clear this".
test("template.update advertises the clearable fields as nullable", async () => {
  const response = await handleMcpRequest({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} });
  const tools = readJsonRpcResult(response).tools as Array<{
    name: string;
    inputSchema: { properties: Record<string, { type?: unknown }> };
  }>;

  const update = tools.find((t) => t.name === "template.update");
  assert.ok(update);
  for (const field of ["global_css", "category", "preview_image_url"]) {
    assert.deepEqual(update.inputSchema.properties[field]?.type, ["string", "null"], field);
  }
  assert.deepEqual(update.inputSchema.properties.tags?.type, ["array", "null"]);

  const create = tools.find((t) => t.name === "template.create");
  assert.ok(create);
  assert.equal(create.inputSchema.properties.global_css?.type, "string");
});

// --- template.create / template.list must NOT use a trailing slash --------
// (Hono treats /v1/templates and /v1/templates/ differently — the latter 404s.)

test("template.create POSTs /v1/templates with no trailing slash", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk({ id: "tmpl_1", format: "html" });
  };
  await callTool("template.create", { publicationId: "pub_1", name: "T", html: "<p>x</p>" }, fetchImpl);
  assert.equal(new URL(calls[0]!.url).pathname, "/v1/templates");
  assert.equal(calls[0]!.init?.method, "POST");
});

test("template.list GETs /v1/templates with no trailing slash", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk({ data: [], has_more: false });
  };
  await callTool("template.list", { publicationId: "pub_1" }, fetchImpl);
  const url = new URL(calls[0]!.url);
  assert.equal(url.pathname, "/v1/templates");
  assert.equal(url.searchParams.get("publication_id"), "pub_1");
});

// --- Part A: newly wrapped verbs ------------------------------------------

test("template.update PATCHes /v1/templates/:id forwarding only provided fields", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk({ id: "tmpl_1", name: "Renamed", format: "html", status: "draft" });
  };
  await callTool("template.update", { publicationId: "pub_1", templateId: "tmpl_1", name: "Renamed" }, fetchImpl);
  const url = new URL(calls[0]!.url);
  assert.equal(url.pathname, "/v1/templates/tmpl_1");
  assert.equal(url.searchParams.get("publication_id"), "pub_1");
  assert.equal(calls[0]!.init?.method, "PATCH");
  // publicationId/templateId are routing inputs — only changed fields go in the body.
  assert.deepEqual(JSON.parse(String(calls[0]!.init?.body)), { name: "Renamed" });
});

test("template.publish POSTs /v1/templates/:id/publish", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk({ id: "tmpl_1", status: "published" });
  };
  await callTool("template.publish", { publicationId: "pub_1", templateId: "tmpl_1" }, fetchImpl);
  const url = new URL(calls[0]!.url);
  assert.equal(url.pathname, "/v1/templates/tmpl_1/publish");
  assert.equal(url.searchParams.get("publication_id"), "pub_1");
  assert.equal(calls[0]!.init?.method, "POST");
});

test("template.unpublish POSTs /v1/templates/:id/unpublish", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk({ id: "tmpl_1", status: "draft" });
  };
  const response = await callTool(
    "template.unpublish",
    { publicationId: "pub_1", templateId: "tmpl_1" },
    fetchImpl
  );
  const url = new URL(calls[0]!.url);
  assert.equal(url.pathname, "/v1/templates/tmpl_1/unpublish");
  assert.equal(url.searchParams.get("publication_id"), "pub_1");
  assert.equal(calls[0]!.init?.method, "POST");
  assert.equal(calls[0]!.init?.body, undefined, "unpublish carries no body");

  const content = readJsonRpcResult(response).content as Array<{ text: string }>;
  assert.match(content[0]!.text, /Template unpublished: tmpl_1 \(draft\)/);
});

test("template.versions GETs /v1/templates/:id/versions and forwards limit", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk({
      object: "list",
      data: [
        {
          id: "etv_2",
          version: 2,
          origin: "edit",
          restored_from_version: null,
          format: "editor",
          name: "Weekly digest",
          sealed: true,
          is_current: true,
          created_at: "2026-07-28T10:00:00.000Z",
          updated_at: "2026-07-28T10:09:00.000Z",
          author: { id: "usr_1", name: "Dave", email: "d@x.com", image: null }
        }
      ],
      retention: { max_versions: 50, coalesce_window_seconds: 600 }
    });
  };
  const response = await callTool(
    "template.versions",
    { publicationId: "pub_1", templateId: "tmpl_1", limit: 10 },
    fetchImpl
  );
  const url = new URL(calls[0]!.url);
  assert.equal(url.pathname, "/v1/templates/tmpl_1/versions");
  assert.equal(url.searchParams.get("publication_id"), "pub_1");
  assert.equal(url.searchParams.get("limit"), "10");
  assert.equal(calls[0]!.init?.method, "GET");

  const content = readJsonRpcResult(response).content as Array<{ text: string }>;
  assert.match(content[0]!.text, /v2 \(current\): edit by Dave/);
});

// A restore returns the template to draft, and an agent that reads only the
// summary line must still learn that its sends have stopped.
test("template.restore_version POSTs the restore route and says it unpublished", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk({
      restored: true,
      restored_from_version: 3,
      unpublished: true,
      message: "Restored version 3.",
      template: { id: "tmpl_1", status: "draft" }
    });
  };
  const response = await callTool(
    "template.restore_version",
    { publicationId: "pub_1", templateId: "tmpl_1", version: 3 },
    fetchImpl
  );
  const url = new URL(calls[0]!.url);
  assert.equal(url.pathname, "/v1/templates/tmpl_1/versions/3/restore");
  assert.equal(url.searchParams.get("publication_id"), "pub_1");
  assert.equal(calls[0]!.init?.method, "POST");
  assert.equal(calls[0]!.init?.body, undefined, "restore carries no body");

  const content = readJsonRpcResult(response).content as Array<{ text: string }>;
  assert.match(content[0]!.text, /now a DRAFT/);
  assert.match(content[0]!.text, /STOPPED sending/);
});

test("template.restore_version reports an identical version as nothing restored", async () => {
  const fetchImpl: typeof fetch = async () =>
    restOk({
      restored: false,
      reason: "identical",
      unpublished: false,
      message: "Version 3 is already the current design, so nothing was changed.",
      template: { id: "tmpl_1", status: "published" }
    });
  const response = await callTool(
    "template.restore_version",
    { publicationId: "pub_1", templateId: "tmpl_1", version: 3 },
    fetchImpl
  );
  const content = readJsonRpcResult(response).content as Array<{ text: string }>;
  assert.match(content[0]!.text, /Nothing restored: Version 3 is already the current design/);
});

// The unpublish is the whole reason this tool needs a description an agent
// cannot skim past, so pin that the words are actually advertised.
test("template.restore_version advertises the unpublish and the forward-only history", async () => {
  const response = await handleMcpRequest({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} });
  const tools = readJsonRpcResult(response).tools as Array<{
    name: string;
    description: string;
    inputSchema: { required?: string[] };
  }>;

  const restore = tools.find((t) => t.name === "template.restore_version");
  assert.ok(restore, "template.restore_version must be advertised");
  assert.match(restore.description, /RETURNS TO DRAFT/);
  assert.match(restore.description, /FORWARD-ONLY/);
  assert.match(restore.description, /template_version_not_found/);
  assert.deepEqual(restore.inputSchema.required, ["publicationId", "templateId", "version"]);
});

// --- the editor-doc path, end to end -------------------------------------

const EDITOR_DOC = {
  type: "doc",
  content: [
    { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Hello" }] },
    { type: "paragraph", content: [{ type: "text", text: "Welcome aboard." }] }
  ]
};

test("template.create forwards editor_doc, its sidecars and the library metadata", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk({ id: "tmpl_1", format: "editor" });
  };
  const response = await callTool(
    "template.create",
    {
      publicationId: "pub_1",
      name: "Designed",
      editor_doc: EDITOR_DOC,
      style_profile: { textColor: "#111111" },
      mailtea_theme: { mode: "light" },
      global_css: ".x{color:red}",
      category: "Newsletter",
      preview_image_url: "https://cdn.acme.com/p.png",
      tags: ["welcome", "onboarding"]
    },
    fetchImpl
  );
  assert.equal(new URL(calls[0]!.url).pathname, "/v1/templates");
  // No `html`: the server renders it from the doc, and a planted html would
  // never match the stored design.
  assert.deepEqual(JSON.parse(String(calls[0]!.init?.body)), {
    publication_id: "pub_1",
    name: "Designed",
    editor_doc: EDITOR_DOC,
    style_profile: { textColor: "#111111" },
    mailtea_theme: { mode: "light" },
    global_css: ".x{color:red}",
    category: "Newsletter",
    preview_image_url: "https://cdn.acme.com/p.png",
    tags: ["welcome", "onboarding"]
  });

  const content = readJsonRpcResult(response).content as Array<{ text: string }>;
  assert.match(content[0]!.text, /Template created: tmpl_1 \(editor\)/);
});

test("template.create refuses editor_doc together with html, without calling the API", async () => {
  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 99,
      method: "tools/call",
      params: {
        name: "template.create",
        arguments: {
          publicationId: "pub_1",
          name: "Designed",
          editor_doc: EDITOR_DOC,
          html: "<p>planted</p>"
        }
      }
    },
    {
      apiBaseUrl: "http://localhost:8787",
      token: "pat_test_token",
      fetchImpl: async () => {
        throw new Error("fetch should not be called for invalid input");
      }
    }
  );

  assert.ok(response.error);
  assert.match(response.error.message, /send 'editor_doc' without 'html'/);
});

test("template.create still requires one content source, now naming all three", async () => {
  const response = await handleMcpRequest(
    {
      jsonrpc: "2.0",
      id: 99,
      method: "tools/call",
      params: { name: "template.create", arguments: { publicationId: "pub_1", name: "Empty" } }
    },
    {
      apiBaseUrl: "http://localhost:8787",
      token: "pat_test_token",
      fetchImpl: async () => {
        throw new Error("fetch should not be called for invalid input");
      }
    }
  );

  assert.ok(response.error);
  assert.equal(
    response.error.message,
    "One of 'editor_doc', 'spec' or 'html' must be provided"
  );
});

test("template.update forwards editor_doc alone, leaving the stored sidecars untouched", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk({ id: "tmpl_1", format: "editor" });
  };
  await callTool(
    "template.update",
    { publicationId: "pub_1", templateId: "tmpl_1", editor_doc: EDITOR_DOC },
    fetchImpl
  );
  assert.equal(new URL(calls[0]!.url).pathname, "/v1/templates/tmpl_1");
  assert.deepEqual(JSON.parse(String(calls[0]!.init?.body)), { editor_doc: EDITOR_DOC });
});

// "Omit" and "clear" are different instructions, and only an explicit null means
// the second. `asOptionalString` folds null into undefined, which is why the
// update handler reads these three-state.
test("template.update sends explicit nulls for the clearable library fields", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk({ id: "tmpl_1" });
  };
  await callTool(
    "template.update",
    {
      publicationId: "pub_1",
      templateId: "tmpl_1",
      global_css: null,
      category: null,
      preview_image_url: null,
      tags: null
    },
    fetchImpl
  );
  assert.deepEqual(JSON.parse(String(calls[0]!.init?.body)), {
    global_css: null,
    category: null,
    preview_image_url: null,
    tags: null
  });
});

test("template.update omits the clearable fields entirely when they are not passed", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk({ id: "tmpl_1" });
  };
  await callTool(
    "template.update",
    { publicationId: "pub_1", templateId: "tmpl_1", name: "Renamed" },
    fetchImpl
  );
  assert.deepEqual(JSON.parse(String(calls[0]!.init?.body)), { name: "Renamed" });
});

test("template.create rejects a non-object editor_doc and a non-string tag", async () => {
  const badArgs: Array<[Record<string, unknown>, RegExp]> = [
    [{ publicationId: "p", name: "n", editor_doc: "not an object" }, /must be a JSON object/],
    [{ publicationId: "p", name: "n", editor_doc: EDITOR_DOC, tags: ["ok", 7] }, /must be an array of strings/]
  ];
  for (const [args, expected] of badArgs) {
    const response = await handleMcpRequest(
      {
        jsonrpc: "2.0",
        id: 99,
        method: "tools/call",
        params: { name: "template.create", arguments: args }
      },
      {
        apiBaseUrl: "http://localhost:8787",
        token: "pat_test_token",
        fetchImpl: async () => {
          throw new Error("fetch should not be called for invalid input");
        }
      }
    );
    assert.ok(response.error, JSON.stringify(args));
    assert.match(response.error.message, expected);
  }
});

test("template.duplicate POSTs /v1/templates/:id/duplicate", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk({ id: "tmpl_2", status: "draft" });
  };
  await callTool("template.duplicate", { publicationId: "pub_1", templateId: "tmpl_1" }, fetchImpl);
  const url = new URL(calls[0]!.url);
  assert.equal(url.pathname, "/v1/templates/tmpl_1/duplicate");
  assert.equal(url.searchParams.get("publication_id"), "pub_1");
  assert.equal(calls[0]!.init?.method, "POST");
});

test("template.delete DELETEs /v1/templates/:id", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk({ object: "template", id: "tmpl_1", deleted: true });
  };
  await callTool("template.delete", { publicationId: "pub_1", templateId: "tmpl_1" }, fetchImpl);
  const url = new URL(calls[0]!.url);
  assert.equal(url.pathname, "/v1/templates/tmpl_1");
  assert.equal(url.searchParams.get("publication_id"), "pub_1");
  assert.equal(calls[0]!.init?.method, "DELETE");
});

test("template.create forwards text/from/reply_to alongside html", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk({ id: "tmpl_1", format: "html" });
  };
  await callTool(
    "template.create",
    {
      publicationId: "pub_1",
      name: "T",
      html: "<p>x</p>",
      text: "x",
      from: "Acme <hello@acme.com>",
      reply_to: "support@acme.com"
    },
    fetchImpl
  );
  assert.equal(new URL(calls[0]!.url).pathname, "/v1/templates");
  assert.equal(calls[0]!.init?.method, "POST");
  assert.deepEqual(JSON.parse(String(calls[0]!.init?.body)), {
    publication_id: "pub_1",
    name: "T",
    html: "<p>x</p>",
    text: "x",
    from: "Acme <hello@acme.com>",
    reply_to: "support@acme.com"
  });
});

test("template.render POSTs /v1/templates/render with spec and variables", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk({ html: "<p>Hello</p>", text: "Hello" });
  };
  const spec = { root: "body", elements: { body: { type: "Body" } } };
  const response = await callTool(
    "template.render",
    { spec, variables: { name: "Ada" } },
    fetchImpl
  );
  const url = new URL(calls[0]!.url);
  assert.equal(url.pathname, "/v1/templates/render");
  assert.equal(calls[0]!.init?.method, "POST");
  assert.deepEqual(JSON.parse(String(calls[0]!.init?.body)), {
    spec,
    variables: { name: "Ada" }
  });

  const result = readJsonRpcResult(response);
  const content = result.content as Array<{ type: string; text: string }>;
  assert.equal(content[0]?.text, "Template spec rendered");
  const structured = result.structuredContent as { html: string; text: string };
  assert.equal(structured.html, "<p>Hello</p>");
  assert.equal(structured.text, "Hello");
});

test("suppression.search GETs /v1/suppressions mapping query->q and the date/cursor filters", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk({
      object: "list",
      data: [
        {
          object: "suppression",
          id: "sup_1",
          email: "bounced@example.com",
          reason: "bounced",
          source: "system",
          publication_id: null,
          created_at: "2026-02-20T01:00:00.000Z"
        }
      ],
      has_more: false
    });
  };
  const response = await callTool(
    "suppression.search",
    {
      reason: "bounced",
      query: "bounced",
      created_after: "2026-02-01T00:00:00.000Z",
      created_before: "2026-03-01T00:00:00.000Z",
      starting_after: "cursor_abc",
      limit: 50
    },
    fetchImpl
  );
  const url = new URL(calls[0]!.url);
  assert.equal(url.pathname, "/v1/suppressions");
  assert.equal(calls[0]!.init?.method, "GET");
  assert.equal(url.searchParams.get("reason"), "bounced");
  assert.equal(url.searchParams.get("q"), "bounced");
  assert.equal(url.searchParams.get("created_after"), "2026-02-01T00:00:00.000Z");
  assert.equal(url.searchParams.get("created_before"), "2026-03-01T00:00:00.000Z");
  assert.equal(url.searchParams.get("starting_after"), "cursor_abc");
  assert.equal(url.searchParams.get("limit"), "50");

  const result = readJsonRpcResult(response);
  const content = result.content as Array<{ type: string; text: string }>;
  assert.equal(content[0]?.text, "Loaded 1 suppression entry");
  const structured = result.structuredContent as { data: unknown[]; has_more: boolean };
  assert.equal(structured.data.length, 1);
  assert.equal(structured.has_more, false);
});

test("suppression.export GETs /v1/suppressions/export and returns the CSV text", async () => {
  const calls: FetchCall[] = [];
  const csv =
    "email,reason,source,created_at\n" +
    "a@example.com,bounced,system,2026-02-20T01:00:00.000Z\n" +
    "b@example.com,manual,api,2026-02-21T01:00:00.000Z\n";
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return new Response(csv, {
      status: 200,
      headers: { "content-type": "text/csv; charset=utf-8" }
    });
  };
  const response = await callTool("suppression.export", {}, fetchImpl);
  const url = new URL(calls[0]!.url);
  assert.equal(url.pathname, "/v1/suppressions/export");
  assert.equal(calls[0]!.init?.method, "GET");

  const result = readJsonRpcResult(response);
  const content = result.content as Array<{ type: string; text: string }>;
  assert.equal(content[0]?.text, "Suppression list exported: 2 entries");
  const structured = result.structuredContent as {
    csv: string;
    filename: string;
    rowCount: number;
  };
  assert.equal(structured.csv, csv);
  assert.equal(structured.filename, "suppressions.csv");
  assert.equal(structured.rowCount, 2);
});

test("email.resend POSTs the tRPC mutation /trpc/email.resend with {id}", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return trpcOk({ email: { id: "email_2", status: "queued" } });
  };
  await callTool("email.resend", { id: "email_1" }, fetchImpl);
  assert.equal(new URL(calls[0]!.url).pathname, "/trpc/email.resend");
  assert.equal(calls[0]!.init?.method, "POST");
  assert.deepEqual(JSON.parse(String(calls[0]!.init?.body)), { id: "email_1" });
});

test("issue.publish_to_web POSTs the tRPC mutation /trpc/issue.publishToWeb", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return trpcOk({ id: "iss_1", publicationId: "pub_1", status: "sent" });
  };
  await callTool("issue.publish_to_web", { issueId: "iss_1" }, fetchImpl);
  assert.equal(new URL(calls[0]!.url).pathname, "/trpc/issue.publishToWeb");
  assert.equal(calls[0]!.init?.method, "POST");
  assert.deepEqual(JSON.parse(String(calls[0]!.init?.body)), { issueId: "iss_1" });
});

test("issue.unpublish_from_web POSTs the tRPC mutation /trpc/issue.unpublishFromWeb", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return trpcOk({ id: "iss_1", publicationId: "pub_1", status: "sent" });
  };
  await callTool("issue.unpublish_from_web", { issueId: "iss_1" }, fetchImpl);
  assert.equal(new URL(calls[0]!.url).pathname, "/trpc/issue.unpublishFromWeb");
  assert.equal(calls[0]!.init?.method, "POST");
  assert.deepEqual(JSON.parse(String(calls[0]!.init?.body)), { issueId: "iss_1" });
});

// --- Part B: smoke coverage for the remaining verbs -----------------------

test("webhook.list/get/update/delete target /v1/webhooks/endpoints", async () => {
  const list: FetchCall[] = [];
  await callTool("webhook.list", { publicationId: "pub_1" }, async (u, i) => {
    list.push({ url: String(u), init: i });
    return restOk({ data: [] });
  });
  assert.equal(new URL(list[0]!.url).pathname, "/v1/webhooks/endpoints");
  assert.equal(new URL(list[0]!.url).searchParams.get("publication_id"), "pub_1");
  assert.equal(list[0]!.init?.method, "GET");

  const get: FetchCall[] = [];
  await callTool("webhook.get", { publicationId: "pub_1", webhookId: "wh_1" }, async (u, i) => {
    get.push({ url: String(u), init: i });
    return restOk({ id: "wh_1", endpoint: "https://x.test", status: "enabled" });
  });
  assert.equal(new URL(get[0]!.url).pathname, "/v1/webhooks/endpoints/wh_1");

  const upd: FetchCall[] = [];
  await callTool("webhook.update", { publicationId: "pub_1", webhookId: "wh_1", status: "disabled" }, async (u, i) => {
    upd.push({ url: String(u), init: i });
    return restOk({ id: "wh_1", status: "disabled" });
  });
  assert.equal(new URL(upd[0]!.url).pathname, "/v1/webhooks/endpoints/wh_1");
  assert.equal(upd[0]!.init?.method, "PATCH");

  const del: FetchCall[] = [];
  await callTool("webhook.delete", { publicationId: "pub_1", webhookId: "wh_1" }, async (u, i) => {
    del.push({ url: String(u), init: i });
    return restOk({ id: "wh_1" });
  });
  assert.equal(new URL(del[0]!.url).pathname, "/v1/webhooks/endpoints/wh_1");
  assert.equal(del[0]!.init?.method, "DELETE");
});

test("segment.create/get/delete target /v1/segments", async () => {
  const create: FetchCall[] = [];
  await callTool("segment.create", { publicationId: "pub_1", name: "VIPs" }, async (u, i) => {
    create.push({ url: String(u), init: i });
    return restOk({ id: "seg_1", name: "VIPs" });
  });
  assert.equal(new URL(create[0]!.url).pathname, "/v1/segments");
  assert.equal(create[0]!.init?.method, "POST");

  const get: FetchCall[] = [];
  await callTool("segment.get", { publicationId: "pub_1", segmentId: "seg_1" }, async (u, i) => {
    get.push({ url: String(u), init: i });
    return restOk({ id: "seg_1", name: "VIPs" });
  });
  assert.equal(new URL(get[0]!.url).pathname, "/v1/segments/seg_1");

  const del: FetchCall[] = [];
  await callTool("segment.delete", { publicationId: "pub_1", segmentId: "seg_1" }, async (u, i) => {
    del.push({ url: String(u), init: i });
    return restOk({ id: "seg_1" });
  });
  assert.equal(new URL(del[0]!.url).pathname, "/v1/segments/seg_1");
  assert.equal(del[0]!.init?.method, "DELETE");
});

test("topic.list/update/delete target /v1/topics", async () => {
  const list: FetchCall[] = [];
  await callTool("topic.list", { publicationId: "pub_1" }, async (u, i) => {
    list.push({ url: String(u), init: i });
    return restOk({ data: [] });
  });
  assert.equal(new URL(list[0]!.url).pathname, "/v1/topics");
  assert.equal(list[0]!.init?.method, "GET");

  const upd: FetchCall[] = [];
  await callTool("topic.update", { publicationId: "pub_1", topicId: "tag_1", name: "Renamed" }, async (u, i) => {
    upd.push({ url: String(u), init: i });
    return restOk({ id: "tag_1", name: "Renamed" });
  });
  assert.equal(new URL(upd[0]!.url).pathname, "/v1/topics/tag_1");
  assert.equal(upd[0]!.init?.method, "PATCH");

  const del: FetchCall[] = [];
  await callTool("topic.delete", { publicationId: "pub_1", topicId: "tag_1" }, async (u, i) => {
    del.push({ url: String(u), init: i });
    return restOk({ id: "tag_1" });
  });
  assert.equal(new URL(del[0]!.url).pathname, "/v1/topics/tag_1");
  assert.equal(del[0]!.init?.method, "DELETE");
});

test("contact_property.list/update/delete target /v1/contact-properties (team-scoped)", async () => {
  const list: FetchCall[] = [];
  await callTool("contact_property.list", {}, async (u, i) => {
    list.push({ url: String(u), init: i });
    return restOk({ data: [] });
  });
  assert.equal(new URL(list[0]!.url).pathname, "/v1/contact-properties");
  assert.equal(list[0]!.init?.method, "GET");

  const upd: FetchCall[] = [];
  await callTool("contact_property.update", { propertyId: "prop_1", fallback_value: "pro" }, async (u, i) => {
    upd.push({ url: String(u), init: i });
    return restOk({ id: "prop_1" });
  });
  assert.equal(new URL(upd[0]!.url).pathname, "/v1/contact-properties/prop_1");
  assert.equal(upd[0]!.init?.method, "PATCH");

  const del: FetchCall[] = [];
  await callTool("contact_property.delete", { propertyId: "prop_1" }, async (u, i) => {
    del.push({ url: String(u), init: i });
    return restOk({ id: "prop_1" });
  });
  assert.equal(new URL(del[0]!.url).pathname, "/v1/contact-properties/prop_1");
  assert.equal(del[0]!.init?.method, "DELETE");
});

test("api_key.list GETs /v1/api-keys", async () => {
  const calls: FetchCall[] = [];
  await callTool("api_key.list", {}, async (u, i) => {
    calls.push({ url: String(u), init: i });
    return restOk({ data: [] });
  });
  assert.equal(new URL(calls[0]!.url).pathname, "/v1/api-keys");
  assert.equal(calls[0]!.init?.method, "GET");
});

test("domain.list/get/update/delete target /v1/domains", async () => {
  const list: FetchCall[] = [];
  await callTool("domain.list", { publicationId: "pub_1" }, async (u, i) => {
    list.push({ url: String(u), init: i });
    return restOk({ data: [] });
  });
  assert.equal(new URL(list[0]!.url).pathname, "/v1/domains");
  assert.equal(new URL(list[0]!.url).searchParams.get("publication_id"), "pub_1");

  const get: FetchCall[] = [];
  await callTool("domain.get", { publicationId: "pub_1", domainId: "dom_1" }, async (u, i) => {
    get.push({ url: String(u), init: i });
    return restOk({ id: "dom_1", name: "mail.acme.com", status: "verified", records: [] });
  });
  assert.equal(new URL(get[0]!.url).pathname, "/v1/domains/dom_1");

  const upd: FetchCall[] = [];
  await callTool("domain.update", { publicationId: "pub_1", domainId: "dom_1", purpose: "both" }, async (u, i) => {
    upd.push({ url: String(u), init: i });
    return restOk({ id: "dom_1", name: "mail.acme.com", purpose: "both" });
  });
  assert.equal(new URL(upd[0]!.url).pathname, "/v1/domains/dom_1");
  assert.equal(upd[0]!.init?.method, "PATCH");

  const del: FetchCall[] = [];
  await callTool("domain.delete", { publicationId: "pub_1", domainId: "dom_1" }, async (u, i) => {
    del.push({ url: String(u), init: i });
    return restOk({ id: "dom_1" });
  });
  assert.equal(new URL(del[0]!.url).pathname, "/v1/domains/dom_1");
  assert.equal(del[0]!.init?.method, "DELETE");
});

test("domain.create POSTs /v1/domains with the publication and purpose", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk({ id: "dom_1", name: "mail.acme.com", status: "pending", records: [] });
  };
  await callTool("domain.create", { publicationId: "pub_1", name: "mail.acme.com", purpose: "email" }, fetchImpl);
  assert.equal(new URL(calls[0]!.url).pathname, "/v1/domains");
  assert.equal(calls[0]!.init?.method, "POST");
  assert.deepEqual(JSON.parse(String(calls[0]!.init?.body)), {
    publication_id: "pub_1",
    name: "mail.acme.com",
    purpose: "email"
  });
});

test("domain.verify POSTs /v1/domains/:id/verify with publication_id query", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk({ id: "dom_1", name: "mail.acme.com", status: "verified" });
  };
  await callTool("domain.verify", { publicationId: "pub_1", domainId: "dom_1" }, fetchImpl);
  const url = new URL(calls[0]!.url);
  assert.equal(url.pathname, "/v1/domains/dom_1/verify");
  assert.equal(url.searchParams.get("publication_id"), "pub_1");
  assert.equal(calls[0]!.init?.method, "POST");
});

test("domain.tracking_create POSTs the tracking-domains sub-resource with subdomain", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk({ id: "trk_1", full_name: "links.mail.acme.com", status: "pending" });
  };
  await callTool(
    "domain.tracking_create",
    { publicationId: "pub_1", domainId: "dom_1", subdomain: "links" },
    fetchImpl
  );
  const url = new URL(calls[0]!.url);
  assert.equal(url.pathname, "/v1/domains/dom_1/tracking-domains");
  assert.equal(url.searchParams.get("publication_id"), "pub_1");
  assert.equal(calls[0]!.init?.method, "POST");
  assert.deepEqual(JSON.parse(String(calls[0]!.init?.body)), { subdomain: "links" });
});

test("domain.tracking_verify POSTs the nested verify path", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk({ id: "trk_1", full_name: "links.mail.acme.com", status: "verified" });
  };
  await callTool(
    "domain.tracking_verify",
    { publicationId: "pub_1", domainId: "dom_1", trackingDomainId: "trk_1" },
    fetchImpl
  );
  const url = new URL(calls[0]!.url);
  assert.equal(url.pathname, "/v1/domains/dom_1/tracking-domains/trk_1/verify");
  assert.equal(url.searchParams.get("publication_id"), "pub_1");
  assert.equal(calls[0]!.init?.method, "POST");
});

test("domain.tracking_list and tracking_delete target the nested paths", async () => {
  const listCalls: FetchCall[] = [];
  await callTool("domain.tracking_list", { publicationId: "pub_1", domainId: "dom_1" }, async (url, init) => {
    listCalls.push({ url: String(url), init });
    return restOk({ object: "list", data: [] });
  });
  assert.equal(new URL(listCalls[0]!.url).pathname, "/v1/domains/dom_1/tracking-domains");

  const delCalls: FetchCall[] = [];
  await callTool(
    "domain.tracking_delete",
    { publicationId: "pub_1", domainId: "dom_1", trackingDomainId: "trk_1" },
    async (url, init) => {
      delCalls.push({ url: String(url), init });
      return restOk({ object: "tracking_domain", id: "trk_1", deleted: true });
    }
  );
  assert.equal(new URL(delCalls[0]!.url).pathname, "/v1/domains/dom_1/tracking-domains/trk_1");
  assert.equal(delCalls[0]!.init?.method, "DELETE");
});

test("webhook.create POSTs /v1/webhooks/endpoints with events", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk({ id: "wh_1", endpoint: "https://x.test/hook", signing_secret: "whsec_x" });
  };
  await callTool(
    "webhook.create",
    { publicationId: "pub_1", endpoint: "https://x.test/hook", events: ["email.delivered"] },
    fetchImpl
  );
  assert.equal(new URL(calls[0]!.url).pathname, "/v1/webhooks/endpoints");
  assert.deepEqual(JSON.parse(String(calls[0]!.init?.body)), {
    publication_id: "pub_1",
    endpoint: "https://x.test/hook",
    events: ["email.delivered"]
  });
});

test("webhook.create rejects empty events before any request", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk({});
  };
  const response = await callTool(
    "webhook.create",
    { publicationId: "pub_1", endpoint: "https://x.test/hook", events: [] },
    fetchImpl
  );
  assert.equal(calls.length, 0);
  assert.ok(response.error);
});

test("segment.list GETs /v1/segments with publication_id", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk({ object: "list", data: [], has_more: false });
  };
  await callTool("segment.list", { publicationId: "pub_1" }, fetchImpl);
  const url = new URL(calls[0]!.url);
  assert.equal(url.pathname, "/v1/segments");
  assert.equal(url.searchParams.get("publication_id"), "pub_1");
  assert.equal(calls[0]!.init?.method, "GET");
});

test("segment.update forwards an explicit null to clear a nullable filter", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk({ id: "seg_1", name: "Seg" });
  };
  await callTool(
    "segment.update",
    { publicationId: "pub_1", segmentId: "seg_1", status_filter: null, query_filter: "vip" },
    fetchImpl
  );
  assert.equal(new URL(calls[0]!.url).pathname, "/v1/segments/seg_1");
  assert.equal(calls[0]!.init?.method, "PATCH");
  const body = JSON.parse(String(calls[0]!.init?.body));
  // null is forwarded (clears the filter); the string sets the other.
  assert.deepEqual(body, { status_filter: null, query_filter: "vip" });
});

test("segment.update omits filters absent from args (leaves them unchanged)", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk({ id: "seg_1", name: "Renamed" });
  };
  await callTool("segment.update", { publicationId: "pub_1", segmentId: "seg_1", name: "Renamed" }, fetchImpl);
  const body = JSON.parse(String(calls[0]!.init?.body));
  assert.deepEqual(body, { name: "Renamed" });
});

test("contact_property.create POSTs /v1/contact-properties (team-scoped, no publication)", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk({ id: "prop_1", key: "plan" });
  };
  await callTool("contact_property.create", { key: "plan", type: "string", fallback_value: "free" }, fetchImpl);
  assert.equal(new URL(calls[0]!.url).pathname, "/v1/contact-properties");
  assert.deepEqual(JSON.parse(String(calls[0]!.init?.body)), {
    key: "plan",
    type: "string",
    fallback_value: "free"
  });
});

test("contact.get GETs /v1/contacts/:idOrEmail with publication_id", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk({ id: "sub_1", email: "a@b.com", status: "active" });
  };
  await callTool("contact.get", { publicationId: "pub_1", idOrEmail: "a@b.com" }, fetchImpl);
  const url = new URL(calls[0]!.url);
  assert.equal(url.pathname, "/v1/contacts/a%40b.com");
  assert.equal(url.searchParams.get("publication_id"), "pub_1");
});

test("contact.set_properties calls the tRPC mutation with values", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return trpcOk({ updated: true });
  };
  await callTool(
    "contact.set_properties",
    { publicationId: "pub_1", contactId: "sub_1", values: [{ propertyId: "prop_1", value: "pro" }] },
    fetchImpl
  );
  assert.equal(new URL(calls[0]!.url).pathname, "/trpc/contact.setPropertyValues");
  assert.deepEqual(JSON.parse(String(calls[0]!.init?.body)), {
    publicationId: "pub_1",
    contactId: "sub_1",
    values: [{ propertyId: "prop_1", value: "pro" }]
  });
});

test("topic.create POSTs /v1/topics with required default_subscription", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk({ id: "tag_1", name: "Weekly" });
  };
  await callTool(
    "topic.create",
    { publicationId: "pub_1", name: "Weekly", default_subscription: "opt_in" },
    fetchImpl
  );
  assert.equal(new URL(calls[0]!.url).pathname, "/v1/topics");
  assert.deepEqual(JSON.parse(String(calls[0]!.init?.body)), {
    publication_id: "pub_1",
    name: "Weekly",
    default_subscription: "opt_in"
  });
});

test("api_key.create POSTs /v1/api-keys and surfaces the one-time token", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk({ id: "key_1", token: "mt_pat_secret" });
  };
  const response = await callTool("api_key.create", { name: "CI", permission: "sending_access" }, fetchImpl);
  assert.equal(new URL(calls[0]!.url).pathname, "/v1/api-keys");
  assert.deepEqual(JSON.parse(String(calls[0]!.init?.body)), { name: "CI", permission: "sending_access" });
  const content = readJsonRpcResult(response).content as Array<{ text: string }>;
  assert.match(content[0]!.text, /mt_pat_secret/);
});

test("api_key.revoke DELETEs /v1/api-keys/:id even with an empty body", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return new Response(null, { status: 200 });
  };
  const response = await callTool("api_key.revoke", { keyId: "key_1" }, fetchImpl);
  assert.equal(new URL(calls[0]!.url).pathname, "/v1/api-keys/key_1");
  assert.equal(calls[0]!.init?.method, "DELETE");
  assert.equal(response.error, undefined);
});

// --- Inbound email (email.inbound_*) --------------------------------------

test("email.inbound_list GETs /v1/emails/inbound with publication_id + limit + cursor", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk({ object: "list", data: [{ id: "rxemail_1" }], has_more: false });
  };
  await callTool(
    "email.inbound_list",
    { publicationId: "pub_1", limit: 10, cursor: "cur_abc" },
    fetchImpl
  );
  assert.equal(calls.length, 1);
  const url = new URL(calls[0]!.url);
  assert.equal(url.pathname, "/v1/emails/inbound");
  assert.equal(calls[0]!.init?.method, "GET");
  assert.equal(url.searchParams.get("publication_id"), "pub_1");
  assert.equal(url.searchParams.get("limit"), "10");
  assert.equal(url.searchParams.get("cursor"), "cur_abc");
});

test("email.inbound_get GETs /v1/emails/inbound/:id with an encoded id", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk({ object: "email", id: "rxemail_a/b", subject: "Hi", from: "s@x.com" });
  };
  await callTool("email.inbound_get", { id: "rxemail_a/b" }, fetchImpl);
  assert.equal(new URL(calls[0]!.url).pathname, "/v1/emails/inbound/rxemail_a%2Fb");
  assert.equal(calls[0]!.init?.method, "GET");
});

test("email.inbound_list_attachments GETs /v1/emails/inbound/:id/attachments", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk({ object: "list", data: [{ id: "rxatt_1" }], has_more: false });
  };
  await callTool("email.inbound_list_attachments", { id: "rxemail_1" }, fetchImpl);
  assert.equal(new URL(calls[0]!.url).pathname, "/v1/emails/inbound/rxemail_1/attachments");
  assert.equal(calls[0]!.init?.method, "GET");
});

test("email.inbound_get_attachment GETs the attachment path with both ids encoded", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk({ object: "attachment", id: "rxatt_1", filename: "a.pdf" });
  };
  await callTool(
    "email.inbound_get_attachment",
    { id: "rxemail_1", attachmentId: "rxatt_a/b" },
    fetchImpl
  );
  assert.equal(
    new URL(calls[0]!.url).pathname,
    "/v1/emails/inbound/rxemail_1/attachments/rxatt_a%2Fb"
  );
  assert.equal(calls[0]!.init?.method, "GET");
});

test("email.inbound_reply POSTs the forwarded snake_case body and drops unknown keys", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk({ id: "txemail_1", status: "queued" }, 202);
  };
  const response = await callTool(
    "email.inbound_reply",
    {
      id: "rxemail_1",
      from: { email: "hello@acme.com", name: "Acme" },
      subject: "Re: Hi",
      html: "<p>Thanks</p>",
      cc: ["cc@example.com"],
      bcc: ["bcc@example.com"],
      idempotency_key: "idem_1",
      // routing/derived inputs must never be forwarded
      to: "nope@example.com",
      in_reply_to: "<spoof>",
      bogus: "drop-me"
    },
    fetchImpl
  );
  assert.equal(calls.length, 1);
  assert.equal(new URL(calls[0]!.url).pathname, "/v1/emails/inbound/rxemail_1/reply");
  assert.equal(calls[0]!.init?.method, "POST");
  assert.deepEqual(JSON.parse(String(calls[0]!.init?.body)), {
    from: { email: "hello@acme.com", name: "Acme" },
    subject: "Re: Hi",
    html: "<p>Thanks</p>",
    cc: ["cc@example.com"],
    bcc: ["bcc@example.com"],
    idempotency_key: "idem_1"
  });
  const content = readJsonRpcResult(response).content as Array<{ text: string }>;
  assert.match(content[0]!.text, /txemail_1/);
});

test("email.inbound_reply with neither html nor text errors before any request", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk({ id: "should_not_happen", status: "queued" }, 202);
  };
  const response = await callTool("email.inbound_reply", { id: "rxemail_1" }, fetchImpl);
  assert.equal(calls.length, 0);
  assert.ok(response.error);
  assert.match(response.error!.message, /html.*text|text.*html/i);
});

test("automation.create omits connections entirely when the caller omitted it", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk({
      object: "automation",
      id: "auto_1",
      status: "draft",
      valid: true,
      issues: []
    });
  };

  const response = await callTool(
    "automation.create",
    {
      publication_id: "pub_demo",
      name: "Welcome",
      steps: [
        { key: "start", type: "trigger", config: { trigger_type: "contact.subscribed" } },
        { key: "welcome", type: "send_email", config: { template_id: "tmpl_1" } }
      ]
    },
    fetchImpl
  );

  assert.equal(calls.length, 1);
  assert.equal(new URL(calls[0]!.url).pathname, "/v1/automations");
  const body = JSON.parse(String(calls[0]!.init?.body)) as Record<string, unknown>;
  // Sending `connections: []` would defeat the server's array-order inference.
  assert.ok(!("connections" in body));
  assert.ok(!("validate_only" in body));

  const content = readJsonRpcResult(response).content as Array<{ text: string }>;
  assert.match(content[0]!.text, /auto_1/);
});

test("automation.create forwards connections and validate_only when supplied", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk({ object: "automation_validation", valid: true, issues: [] });
  };

  const response = await callTool(
    "automation.create",
    {
      publication_id: "pub_demo",
      name: "Branching",
      steps: [
        { key: "start", type: "trigger", config: { trigger_type: "contact.subscribed" } },
        {
          key: "is_pro",
          type: "condition",
          config: {
            rule: { type: "rule", field: "contact.status", operator: "eq", value: "subscribed" }
          }
        },
        { key: "welcome", type: "send_email", config: { template_id: "tmpl_1" } }
      ],
      connections: [
        { from: "start", to: "is_pro" },
        { from: "is_pro", to: "welcome", branch: "condition_met" }
      ],
      validate_only: true
    },
    fetchImpl
  );

  const body = JSON.parse(String(calls[0]!.init?.body)) as Record<string, unknown>;
  assert.equal(body.validate_only, true);
  assert.deepEqual(body.connections, [
    { from: "start", to: "is_pro" },
    { from: "is_pro", to: "welcome", branch: "condition_met" }
  ]);

  const content = readJsonRpcResult(response).content as Array<{ text: string }>;
  assert.match(content[0]!.text, /Dry run/);
});

test("a rejected graph surfaces the coded issues, not just the status", async () => {
  const fetchImpl: typeof fetch = async () =>
    restOk(
      {
        error: "Automation graph is invalid",
        issues: [
          {
            code: "connections_required_for_branching",
            severity: "error",
            step_key: "is_pro",
            message: "A graph with a condition step must declare connections."
          }
        ]
      },
      400
    );

  const response = await callTool(
    "automation.create",
    {
      publication_id: "pub_demo",
      name: "Branching",
      steps: [{ key: "start", type: "trigger", config: { trigger_type: "contact.subscribed" } }]
    },
    fetchImpl
  );

  assert.ok(response.error);
  assert.match(response.error!.message, /connections_required_for_branching/);
  assert.match(response.error!.message, /is_pro/);
});

test("event.send maps event_name to name and rejects an ambiguous contact reference", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk(
      {
        object: "event",
        id: "evt_1",
        name: "order.placed",
        enrolled_automations: 2,
        resumed_runs: 1
      },
      202
    );
  };

  const response = await callTool(
    "event.send",
    {
      publication_id: "pub_demo",
      event_name: "order.placed",
      email: "user@example.com",
      properties: { total: 42 }
    },
    fetchImpl
  );

  assert.equal(calls.length, 1);
  assert.equal(new URL(calls[0]!.url).pathname, "/v1/events");
  assert.deepEqual(JSON.parse(String(calls[0]!.init?.body)), {
    publication_id: "pub_demo",
    name: "order.placed",
    email: "user@example.com",
    properties: { total: 42 }
  });
  const content = readJsonRpcResult(response).content as Array<{ text: string }>;
  assert.match(content[0]!.text, /evt_1/);

  const conflict = await callTool(
    "event.send",
    {
      publication_id: "pub_demo",
      event_name: "order.placed",
      contact_id: "con_1",
      email: "user@example.com"
    },
    fetchImpl
  );
  assert.equal(calls.length, 1);
  assert.ok(conflict.error);
  assert.match(conflict.error!.message, /contact_id.*email|email.*contact_id/i);
});

test("automation.disable and automation.archive hit pause and archive", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk({ object: "automation", id: "auto_1", status: "paused", canceled_runs: 0 });
  };

  await callTool(
    "automation.disable",
    { publication_id: "pub_demo", automation_id: "auto_1" },
    fetchImpl
  );
  await callTool(
    "automation.archive",
    { publication_id: "pub_demo", automation_id: "auto_1", cancel_runs: false },
    fetchImpl
  );
  await callTool(
    "automation.enable",
    { publication_id: "pub_demo", automation_id: "auto_1" },
    fetchImpl
  );

  assert.deepEqual(
    calls.map((call) => new URL(call.url).pathname),
    [
      "/v1/automations/auto_1/pause",
      "/v1/automations/auto_1/archive",
      "/v1/automations/auto_1/activate"
    ]
  );
  assert.deepEqual(JSON.parse(String(calls[1]!.init?.body)), { cancel_runs: false });
  assert.equal(
    new URL(calls[0]!.url).searchParams.get("publication_id"),
    "pub_demo"
  );
});

test("automation.update forwards an explicit reentry_window_seconds null", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk({ object: "automation", id: "auto_1", status: "draft", version: 2 });
  };

  await callTool(
    "automation.update",
    {
      publication_id: "pub_demo",
      automation_id: "auto_1",
      reentry_policy: "once",
      reentry_window_seconds: null
    },
    fetchImpl
  );

  const body = JSON.parse(String(calls[0]!.init?.body)) as Record<string, unknown>;
  // Without this the stored window survives the merge and the server refuses
  // every later call with reentry_window_seconds_not_allowed.
  assert.ok("reentry_window_seconds" in body);
  assert.equal(body.reentry_window_seconds, null);
  assert.equal(body.reentry_policy, "once");
});

test("automation.update omits reentry_window_seconds entirely when the caller omitted it", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk({ object: "automation", id: "auto_1", status: "draft", version: 2 });
  };

  await callTool(
    "automation.update",
    { publication_id: "pub_demo", automation_id: "auto_1", name: "Renamed" },
    fetchImpl
  );

  const body = JSON.parse(String(calls[0]!.init?.body)) as Record<string, unknown>;
  assert.ok(!("reentry_window_seconds" in body));
  assert.equal(body.name, "Renamed");
});

test("automation.versions and automation.version hit the versions routes", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return calls.length === 1
      ? restOk({
          object: "list",
          data: [
            {
              object: "automation_version",
              version: 2,
              graph_hash: "sha_2",
              is_live: true,
              created_at: "2026-07-20T00:00:00.000Z"
            }
          ],
          has_more: false
        })
      : restOk({
          object: "automation_version",
          version: 1,
          graph_hash: "sha_1",
          is_live: false,
          steps: [{ key: "start", type: "trigger" }],
          connections: []
        });
  };

  const list = await callTool(
    "automation.versions",
    { publication_id: "pub_demo", automation_id: "auto_1", limit: 5 },
    fetchImpl
  );
  assert.equal(new URL(calls[0]!.url).pathname, "/v1/automations/auto_1/versions");
  assert.equal(new URL(calls[0]!.url).searchParams.get("publication_id"), "pub_demo");
  assert.equal(new URL(calls[0]!.url).searchParams.get("limit"), "5");
  assert.match(
    (readJsonRpcResult(list).content as Array<{ text: string }>)[0]!.text,
    /v2 \(live\)/
  );

  const one = await callTool(
    "automation.version",
    { publication_id: "pub_demo", automation_id: "auto_1", version: 1 },
    fetchImpl
  );
  assert.equal(new URL(calls[1]!.url).pathname, "/v1/automations/auto_1/versions/1");
  assert.equal(new URL(calls[1]!.url).searchParams.get("publication_id"), "pub_demo");
  assert.match(
    (readJsonRpcResult(one).content as Array<{ text: string }>)[0]!.text,
    /v1.*1 step/
  );
});

test("event_definition.update forwards an explicit schema_json null and omits an absent one", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk({ object: "event_definition", id: "evtdef_1", name: "order.placed" });
  };

  await callTool(
    "event_definition.update",
    { publication_id: "pub_demo", definition_id: "evtdef_1", schema_json: null },
    fetchImpl
  );
  const cleared = JSON.parse(String(calls[0]!.init?.body)) as Record<string, unknown>;
  assert.ok("schema_json" in cleared);
  assert.equal(cleared.schema_json, null);

  await callTool(
    "event_definition.update",
    { publication_id: "pub_demo", definition_id: "evtdef_1", description: "Checkout completed" },
    fetchImpl
  );
  const untouched = JSON.parse(String(calls[1]!.init?.body)) as Record<string, unknown>;
  // The server keys off hasOwnProperty, so sending null here would wipe a schema
  // the caller never mentioned.
  assert.ok(!("schema_json" in untouched));
  assert.equal(untouched.description, "Checkout completed");
});

test("event_definition.delete hits the delete route and says what survives", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk({ object: "event_definition", id: "evtdef_1", deleted: true });
  };

  const response = await callTool(
    "event_definition.delete",
    { publication_id: "pub_demo", definition_id: "evtdef_1" },
    fetchImpl
  );

  assert.equal(new URL(calls[0]!.url).pathname, "/v1/event-definitions/evtdef_1");
  assert.equal(calls[0]!.init?.method, "DELETE");
  assert.equal(new URL(calls[0]!.url).searchParams.get("publication_id"), "pub_demo");
  const content = readJsonRpcResult(response).content as Array<{ text: string }>;
  assert.match(content[0]!.text, /auto/);
});

test("event_definition write tools describe schema_json as the Mailtea document, not JSON Schema", async () => {
  const response = await handleMcpRequest({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list",
    params: {}
  });
  const tools = readJsonRpcResult(response).tools as Array<{
    name: string;
    description: string;
  }>;

  for (const name of ["event_definition.create", "event_definition.update"]) {
    const tool = tools.find((candidate) => candidate.name === name);
    assert.ok(tool, `${name} missing`);
    assert.match(tool!.description, /NOT JSON Schema/);
    assert.match(tool!.description, /additional_properties/);
  }
});
