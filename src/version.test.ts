/**
 * `mailtea-mcp` must not introduce itself with the wrong version.
 *
 * The `initialize` handshake reports a version, and it sat at "0.2.0" while the
 * package shipped 0.3, 0.4, 0.5 and 0.6 — so every client that asked was told
 * something false, and nothing broke loudly enough for anyone to notice. Same
 * failure the CLI's version test exists to prevent, same fix.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { SERVER_VERSION } from "./index.js";

const manifest = JSON.parse(
  readFileSync(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../package.json"),
    "utf8"
  )
) as { version: string };

test("SERVER_VERSION matches package.json — npm publishes the manifest", () => {
  assert.equal(
    SERVER_VERSION,
    manifest.version,
    `index.ts SERVER_VERSION is ${SERVER_VERSION} but package.json says ${manifest.version}. ` +
      "npm publishes the manifest, so the manifest is right and the constant is stale."
  );
});
