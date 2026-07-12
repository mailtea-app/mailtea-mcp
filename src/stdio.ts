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

  const response = await handleMcpRequest(request, runtimeOptions);
  writeResponse(response);
}

rl.on("line", (line) => {
  void handleLine(line);
});
