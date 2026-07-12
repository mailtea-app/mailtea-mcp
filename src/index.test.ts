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
      params: { name: "email.list", arguments: { status: "sent", limit: 10, tag_name: "campaign" } }
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
    "tag.create", "api_key.create", "api_key.revoke"
  ]) {
    assert.ok(tools.includes(name), `missing tool ${name}`);
  }
});

test("tools/list includes the finalise verbs (template/email/issue)", async () => {
  const response = await handleMcpRequest({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} });
  const tools = (readJsonRpcResult(response).tools as Array<{ name: string }>).map((t) => t.name);
  for (const name of [
    "template.update", "template.publish", "template.duplicate", "template.delete",
    "email.resend", "issue.publish_to_web", "issue.unpublish_from_web"
  ]) {
    assert.ok(tools.includes(name), `missing tool ${name}`);
  }
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

test("tag.list/update/delete target /v1/tags", async () => {
  const list: FetchCall[] = [];
  await callTool("tag.list", { publicationId: "pub_1" }, async (u, i) => {
    list.push({ url: String(u), init: i });
    return restOk({ data: [] });
  });
  assert.equal(new URL(list[0]!.url).pathname, "/v1/tags");
  assert.equal(list[0]!.init?.method, "GET");

  const upd: FetchCall[] = [];
  await callTool("tag.update", { publicationId: "pub_1", tagId: "tag_1", name: "Renamed" }, async (u, i) => {
    upd.push({ url: String(u), init: i });
    return restOk({ id: "tag_1", name: "Renamed" });
  });
  assert.equal(new URL(upd[0]!.url).pathname, "/v1/tags/tag_1");
  assert.equal(upd[0]!.init?.method, "PATCH");

  const del: FetchCall[] = [];
  await callTool("tag.delete", { publicationId: "pub_1", tagId: "tag_1" }, async (u, i) => {
    del.push({ url: String(u), init: i });
    return restOk({ id: "tag_1" });
  });
  assert.equal(new URL(del[0]!.url).pathname, "/v1/tags/tag_1");
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

test("tag.create POSTs /v1/tags with required default_subscription", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return restOk({ id: "tag_1", name: "Weekly" });
  };
  await callTool(
    "tag.create",
    { publicationId: "pub_1", name: "Weekly", default_subscription: "opt_in" },
    fetchImpl
  );
  assert.equal(new URL(calls[0]!.url).pathname, "/v1/tags");
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
