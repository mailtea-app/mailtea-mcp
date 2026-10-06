# `mailtea-mcp`

Mailtea MCP server — let AI agents (Claude Code, Cursor, Codex, …) **send, schedule, and manage email** over the Model Context Protocol. MIT-licensed.

## Quick start

Connect Claude Code in one command:

```bash
claude mcp add mailtea \
  -e MAILTEA_API_TOKEN=mt_pat_xxxxxxxx \
  -- npx -y mailtea-mcp
```

Create the token in **Settings → API keys**, then ask your agent to send an email. It calls `email.send` and the message goes out through Mailtea.

A live key is prefixed `mt_pat_` or `mt_svc_`. A **test key** is prefixed `mt_test_`: the agent's sends are validated, recorded and emit webhooks, but nothing is delivered. See [Test mode](#test-mode).

The server defaults to the Mailtea cloud API. Self-hosting or running locally? Add `-e MAILTEA_API_BASE_URL=http://localhost:7787` (and optional `-e MAILTEA_PUBLICATION_ID=pub_demo`).

### Which publication a tool acts on

`publicationId` (spelled `publication_id` on the automation and event tools) is **optional** everywhere. Left out, it resolves to the publication the connection is already for: the one chosen on the consent screen after a browser sign-in, the one a publication-scoped API key was minted for, or `MAILTEA_PUBLICATION_ID` over stdio. A team-scoped personal API key (the default key Studio creates) uses the one publication its owner belongs to in the key's team, when there is exactly one; a service key takes no such default. Pass it explicitly when your credential reaches more than one publication; the error then lists the ids it can take. An explicit id is never widened: a credential scoped to one publication is still refused for any other.

## Tool families

- `email.*` — `email.send`, `email.batch`, `email.get`, `email.list`, `email.analytics`, `email.reschedule`, `email.cancel`, `email.resend` (transactional, one-shot to specific recipients; `resend` retries a failed/bounced email). `email.list` takes `mode` — `live` or `test`, with no mixed view
- `email.inbound_*` — received email: `inbound_list`, `inbound_get`, `inbound_list_attachments`, `inbound_get_attachment`, `inbound_reply` (auto-threaded; all but `inbound_list` resolve the publication from the email id, so they take no `publicationId` at all)
- `auth.*`
- `issue.*`: newsletter drafts and sends, plus `publish_to_web` / `unpublish_from_web`. A post goes to all active contacts unless `issue.create_draft` / `issue.update_draft` set `segmentId` (from `segment.list`, in the post's publication); `null` on `update_draft` clears it. The segment picks the recipients when the post is sent
- `template.*`: reusable email templates: `create`, `list`, `get`, `update`, `publish`, `unpublish`, `duplicate`, `delete`, plus `versions` / `restore_version`. Editing or restoring a published template no longer returns it to draft: the change, From and Reply-To included, is saved as a working copy (`has_unpublished_versions: true`) and the published version keeps sending until `publish` is called again. In `versions`, `is_current` marks the entry matching the working copy and `is_published` the one that is sending, and each entry carries its `from`, `reply_to` and `sender_recorded`: a sender-only change records a version (or folds into the open one, like any edit), and `restore_version` brings the sender back with the design, except for an entry with `sender_recorded: false`, which predates sender history and keeps the current sender. `unpublish` is now the only way to stop a published template sending, short of deleting it
- `publication.*`
- `domain.*` — sending domains: add, read DNS records, verify, then send from it; `claim` / `claim_get` / `claim_verify` / `claim_cancel` take over a domain another publication holds by proving DNS control
- `contact.*` — incl. `get`, `delete`, `get_properties`, `set_properties`. `import_csv` takes `enrollInAutomations` to put the imported contacts through matching `contact.created` / `contact.subscribed` automations — how an imported list starts a welcome series. It defaults to **false**, the same default as Studio's import checkbox. Above 500 rows it also needs `confirmLargeEnrollment: true` — the same acknowledgement a Studio operator gives on the confirm screen — or the import is refused with `enrollment_too_large` and stores nothing
- `contact_property.*` — custom contact fields
- `segment.*`: saved audience segments. Filters are `status_filter`, `query_filter` and `inactive_days` (no open or click in the last N days, 1 to 3650; a contact who never engaged counts as inactive, so it finds the silent cohort, not engaged readers). Engagement tracking is not backfilled, so contacts with no recorded engagement count as inactive. On `segment.update`, `null` clears a filter. `segment.delete` refuses a segment that a draft, scheduled or sending post targets (`segment_in_use`, and the error names the posts)
- `tag.*` — tag definitions
- `webhook.*` — outbound event subscriptions
- `api_key.*` — manage API keys (requires `settings:write`). `api_key.create` takes `mode: "test"` to mint a test key
- `analytics.*`
- `section.*`
- `automation.*`: multi-step contact journeys: `create`, `list`, `get`, `update`, `enable`, `disable`, `archive`, `delete`, `validate`, `metrics`. An automation is a versioned graph of `steps` + `connections`, so an agent can author one as data. `connections` is optional (steps link in array order) and becomes required only when the graph branches; `validate_only: true` on `create`/`update` is a dry run returning the same coded `issues[]` a real failure returns, so an agent can self-correct before committing. On an active automation, `update` is refused only when it adds an error the live version does not already have (`active_graph_invalid`), and changing its trigger needs a pause first (`trigger_locked_while_active`). These tools take **snake_case** arguments, unlike the older camelCase tools, because the graph payload is snake_case throughout and mixing the two inside one payload is a trap
- `automation_run.*` — `list`, `get`, `cancel`. Run detail returns the graph the run is pinned to, not the live one
- `event.*` / `event_definition.*` — `event.send` for custom event ingest (opt-in `create_contact`, `idempotency_key`, fan-out counts in the reply), plus `event_definition.list / get / create / update`

Current resources:

- `publication://current/brand-guidelines`
- `mailtea://capabilities`
- `analytics://current/latest-summary`
- `mailtea://automations/step-types` — the machine-readable automation catalog: trigger types, step config shapes, branch labels, limits, condition operators and validation codes. Fetch it once instead of carrying the model in every tool schema
- `mailtea://automations/condition-fields` — the rule DSL for `condition` steps and filters: operators, addressable field namespaces, `{"var": "…"}` value references, and how an unresolved path evaluates

Current prompts:

- `newsletter.draft_from_brief`: arguments `brief` (required), `audience`, `tone`, `call_to_action`
- `newsletter.subject_line_pack`: arguments `topic` (required), `count` (1 to 30, default 10), `audience`

No tool writes copy: no AI model runs on Mailtea's side. Write the email yourself and save it with `issue.create_draft`.

Every tool in `tools/list` carries a `title` and the four MCP tool annotations (`readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`), the same on stdio and on the hosted server. Every send (including `issue.schedule`, `event.send` and `automation.enable`), every delete, and every consent or suppression change is marked destructive; anything that emails recipients, changes the public website, looks up public DNS or points a webhook at an outside URL is marked open world. The full table and the rules behind it are in the [MCP server docs](https://docs.mailtea.app/docs/documentation/mcp-server#tool-safety-hints).

A tool that receives an argument it does not declare still runs, and its result adds a `Warning: Ignored unknown argument` item naming what it accepts.

## Build

```bash
pnpm --filter mailtea-mcp build
```

## Run locally over stdio

```bash
export MAILTEA_API_BASE_URL=http://localhost:7787
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
        "MAILTEA_API_BASE_URL": "http://localhost:7787",
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
      "url": "http://localhost:7787/mcp",
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
MAILTEA_API_BASE_URL=http://localhost:7787 \
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

## Test mode

A test key (`mt_test_…`) sends nothing. Every message the agent creates is
validated, recorded and emits webhooks, but is never handed to a provider — so
an agent can exercise the whole send path, and a CI run can point at production
Mailtea, without a single message reaching an inbox.

Mint one with `api_key.create` (`{ "name": "CI", "mode": "test" }`), or in
**Settings → API keys**, and connect the server with it in place of the live
token.

Reserved recipients on `test.mailtea.email` force the outcome. The first `to`
recipient decides:

| Recipient | Result |
| --- | --- |
| `delivered@test.mailtea.email` | sent, then delivered |
| `bounced@test.mailtea.email` | sent, then bounced |
| `complained@test.mailtea.email` | sent, then a spam complaint |
| `delayed@test.mailtea.email` | sent, delayed, then delivered |
| `failed@test.mailtea.email` | fails outright, never sent |
| anything else | sent, then delivered |

`email.list` takes `mode` to read test mail back, and every row it returns
carries its own mode — a test row is marked `[test]` in the summary. A test key
reads only test mail and a live key only live mail; there is no mixed view.

A test key is **not** a data sandbox. It reads and writes the real contacts,
templates, senders and webhooks. Only delivery is simulated. Newsletter sends,
"send me a copy" and automation enrollment are refused with a test key.

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
