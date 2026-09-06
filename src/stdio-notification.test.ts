// The two transports must agree on what a message without an id MEANS.
//
// JSON-RPC calls that a notification, and a notification is fire-and-forget:
// no reply, and — the part that was wrong here — no execution of anything the
// caller cannot be told the result of. The HTTP transport answers 202 and
// dispatches nothing. stdio suppressed the REPLY but ran the call first, so
// `tools/call` with the id left off performed a real write against the API over
// one transport and did nothing over the other. This spawns the real entrypoint
// against a stub API and checks that nothing reaches it.
import assert from "node:assert/strict";
import test from "node:test";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { fileURLToPath } from "node:url";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));

function line(message: unknown): string {
  return `${JSON.stringify(message)}\n`;
}

test("a tools/call with no id is neither answered NOR executed", async () => {
  const received: string[] = [];
  const api = createServer((req, res) => {
    received.push(`${req.method} ${req.url}`);
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
  });
  api.listen(0, "127.0.0.1");
  await once(api, "listening");
  const { port } = api.address() as AddressInfo;

  const child = spawn(
    process.execPath,
    ["--import", "./node_modules/tsx/dist/loader.mjs", "src/stdio.ts"],
    {
      cwd: packageRoot,
      env: {
        ...process.env,
        MAILTEA_API_BASE_URL: `http://127.0.0.1:${port}`,
        MAILTEA_API_TOKEN: "mt_pat_stdio_test"
      },
      stdio: ["pipe", "pipe", "pipe"]
    }
  );

  try {
    const replies: string[] = [];
    let buffered = "";
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      buffered += chunk;
      const parts = buffered.split("\n");
      buffered = parts.pop() ?? "";
      replies.push(...parts.filter((part) => part.trim() !== ""));
    });

    // The notification first. `auth.me` is a plain call against the API, so a
    // dispatch would show up in `received` immediately.
    child.stdin.write(
      line({ jsonrpc: "2.0", method: "tools/call", params: { name: "auth.me", arguments: {} } })
    );
    // Then a real request. Its answer is the barrier: the process has read
    // stdin past the notification by the time this comes back, and `initialize`
    // is answered locally so it adds no traffic of its own.
    child.stdin.write(line({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} }));

    const deadline = Date.now() + 20_000;
    while (replies.length === 0 && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    assert.ok(replies.length > 0, "the stdio server must answer a request that has an id");

    const answered = JSON.parse(replies[0] as string) as { id?: unknown };
    assert.equal(answered.id, 1, replies[0]);
    // Exactly one reply: the notification got none, which is the half that was
    // already right.
    assert.equal(replies.length, 1, replies.join(" | "));

    // Grace for a dispatch that started late. Before the fix this window was
    // not needed — the call had already been made.
    await new Promise((resolve) => setTimeout(resolve, 250));
    assert.deepEqual(received, [], "a notification must not reach the API at all");
  } finally {
    child.kill("SIGKILL");
    api.close();
  }
});
