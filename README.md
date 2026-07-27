# `mailtea-mcp`

Mailtea MCP server — let AI agents (Claude Code, Cursor, Codex, …) **send, schedule, and manage email** over the Model Context Protocol. MIT-licensed.

## Quick start

Connect Claude Code in one command:

```bash
claude mcp add mailtea \
  -e MAILTEA_API_TOKEN=mt_pat_xxxxxxxx \
  -- npx -y mailtea-mcp
```

Create the token (prefix `mt_pat_`) in **Settings → API keys**, then ask your agent to send an email. It calls `email.send` and the message goes out through Mailtea.

The server defaults to the Mailtea cloud API. Self-hosting or running locally? Add `-e MAILTEA_API_BASE_URL=http://localhost:8787` (and optional `-e MAILTEA_PUBLICATION_ID=pub_demo`).

## Tool families

- `email.*` — `email.send`, `email.batch`, `email.get`, `email.list`, `email.analytics`, `email.reschedule`, `email.cancel`, `email.resend` (transactional, one-shot to specific recipients; `resend` retries a failed/bounced email)
- `email.inbound_*` — received email: `inbound_list`, `inbound_get`, `inbound_list_attachments`, `inbound_get_attachment`, `inbound_reply` (auto-threaded; only `inbound_list` needs publicationId)
- `auth.*`
- `issue.*` — newsletter drafts + sends to the whole list, plus `publish_to_web` / `unpublish_from_web`
- `template.*` — reusable email templates: `create`, `list`, `get`, `update`, `publish`, `duplicate`, `delete`
- `publication.*`
- `domain.*` — sending domains: add, read DNS records, verify, then send from it
- `contact.*` — incl. `get`, `delete`, `get_properties`, `set_properties`
- `contact_property.*` — custom contact fields
- `segment.*` — saved, filter-based audience segments
- `tag.*` — tag definitions
- `webhook.*` — outbound event subscriptions
- `api_key.*` — manage API keys (requires `settings:write`)
- `analytics.*`
- `section.*`
- `automation.*` — multi-step contact journeys: `create`, `list`, `get`, `update`, `enable`, `disable`, `archive`, `delete`, `validate`, `metrics`. An automation is a versioned graph of `steps` + `connections`, so an agent can author one as data. `connections` is optional (steps link in array order) and becomes required only when the graph branches; `validate_only: true` on `create`/`update` is a dry run returning the same coded `issues[]` a real failure returns, so an agent can self-correct before committing. These tools take **snake_case** arguments, unlike the older camelCase tools — the graph payload is snake_case throughout and mixing the two inside one payload is a trap
- `automation_run.*` — `list`, `get`, `cancel`. Run detail returns the graph the run is pinned to, not the live one
- `event.*` / `event_definition.*` — `event.send` for custom event ingest (opt-in `create_contact`, `idempotency_key`, fan-out counts in the reply), plus `event_definition.list / get / create / update`

Current resources:

- `publication://current/brand-guidelines`
- `mailtea://capabilities`
- `analytics://current/latest-summary`
- `mailtea://automations/step-types` — the machine-readable automation catalog: trigger types, step config shapes, branch labels, limits, condition operators and validation codes. Fetch it once instead of carrying the model in every tool schema
- `mailtea://automations/condition-fields` — the rule DSL for `condition` steps and filters: operators, addressable field namespaces, `{"var": "…"}` value references, and how an unresolved path evaluates

Current prompts:

- `newsletter.draft_from_brief`
- `newsletter.subject_line_pack`

## Build

```bash
pnpm --filter mailtea-mcp build
```

## Run locally over stdio

```bash
export MAILTEA_API_BASE_URL=http://localhost:8787
export MAILTEA_API_TOKEN=<BETTER_AUTH_SESSION_OR_PAT_TOKEN>
export MAILTEA_PUBLICATION_ID=pub_demo

node packages/mcp/dist/stdio.js
```

Required env:

- `MAILTEA_API_BASE_URL`
- `MAILTEA_API_TOKEN`

Optional env:

- `MAILTEA_PUBLICATION_ID`

## Copy-paste stdio config pattern

If your MCP client accepts a stdio server definition, this is the minimal pattern:

```json
{
  "mcpServers": {
    "mailtea": {
      "command": "node",
      "args": ["/absolute/path/to/mailtea/packages/mcp/dist/stdio.js"],
      "env": {
        "MAILTEA_API_BASE_URL": "http://localhost:8787",
        "MAILTEA_API_TOKEN": "<BETTER_AUTH_SESSION_OR_PAT_TOKEN>",
        "MAILTEA_PUBLICATION_ID": "pub_demo"
      }
    }
  }
}
```

Use this as the starting point for:

- Codex-style MCP clients
- Claude Code-style MCP clients
- Cursor/OpenCode-style MCP clients
- internal agent launchers

The exact config file location varies by client, but the process contract above stays the same.

## Copy-paste remote MCP pattern

If your client supports remote MCP over HTTP, point it at Mailtea API:

```json
{
  "mcpServers": {
    "mailtea": {
      "url": "http://localhost:8787/mcp",
      "headers": {
        "Authorization": "Bearer <BETTER_AUTH_SESSION_OR_PAT_TOKEN>"
      }
    }
  }
}
```

Remote MCP is useful when:

- the agent runtime cannot launch a local stdio process
- you want one shared Mailtea control plane for multiple clients
- you are testing integrations from another machine or container

Safe remote smoke:

```bash
MAILTEA_API_BASE_URL=http://localhost:8787 \
MAILTEA_API_TOKEN=<BETTER_AUTH_SESSION_OR_PAT_TOKEN> \
pnpm deploy:smoke:mcp
```

## First useful calls

Start with this sequence:

1. `email.send`
2. `publication.list`
3. `issue.create_draft`
4. `issue.update_draft`
5. `contact.list`
6. `analytics.latest_summary`

That verifies the full loop:

- discover workspace
- draft content
- inspect audience
- inspect outcomes

## When to use MCP instead of direct API calls

Use `mailtea-mcp` when you want:

- a compact tool catalog
- prompt and resource support
- less custom tool-wrapping work
- better interoperability across coding agents

Use the API directly when you need:

- a browser action layer
- a non-MCP builder
- full transport control
- custom HTTP orchestration
