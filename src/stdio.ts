import readline from "node:readline";
import {
  handleMcpRequest,
  type JsonRpcRequest,
  type JsonRpcResponse,
  type McpRuntimeOptions
} from "./index.js";

const runtimeOptions: McpRuntimeOptions = {
  apiBaseUrl: process.env.MAILTEA_API_BASE_URL,
  token: process.env.MAILTEA_API_TOKEN ?? null,
  publicationId: process.env.MAILTEA_PUBLICATION_ID ?? null
};

if (!runtimeOptions.token) {
  console.error(
    "[mailtea-mcp] MAILTEA_API_TOKEN is not set. Tool calls will fail until a token is provided."
  );
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

function writeResponse(message: JsonRpcResponse): void {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

async function handleLine(line: string): Promise<void> {
  const text = line.trim();
  if (!text) {
    return;
  }

  let request: JsonRpcRequest;

  try {
    request = JSON.parse(text) as JsonRpcRequest;
  } catch {
    writeResponse({
      jsonrpc: "2.0",
      id: null,
      error: {
        code: -32700,
        message: "Parse error"
      }
    });
    return;
  }

  // Checked BEFORE the dispatch, not after. JSON-RPC: a notification (no id)
  // and a client-to-server response (no method) get no reply — and must not be
  // EXECUTED either. With the check after the call, a `tools/call` that omitted
  // its id still ran here while the HTTP transport answered 202 and dispatched
  // nothing, so one message meant two different things depending on how the
  // server was reached. Strict clients (Codex, Grok Build via rmcp) also drop
  // the connection when an unsolicited `{id: null}` message arrives.
  if (request.id === undefined || typeof request.method !== "string") {
    return;
  }

  writeResponse(await handleMcpRequest(request, runtimeOptions));
}

rl.on("line", (line) => {
  void handleLine(line);
});
