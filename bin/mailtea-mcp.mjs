#!/usr/bin/env node
// Executable entry for `npx mailtea-mcp` / the `mailtea-mcp` bin. Importing the
// built stdio server starts it (it wires up the readline JSON-RPC loop on load).
import "../dist/stdio.js";
