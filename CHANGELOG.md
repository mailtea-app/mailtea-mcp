# Changelog

All notable changes to `mailtea-mcp` are documented here.

## Unreleased

### Changed

- **The `tag.*` tools are now `topic.*`** — `topic.create`, `topic.list`, `topic.update`, `topic.delete` — targeting `/v1/topics`. The old `tag.*` names still **dispatch** so an agent holding a cached tool list keeps working, but they are no longer advertised in `tools/list`: two tools with identical descriptions measurably degrades model selection, so the compatibility is deliberately asymmetric (advertise new, accept old).
- **`mailtea://automations/step-types` renames the audience vocabulary**: step types `topic_add` / `topic_remove` (config key `topic_id`), trigger types `topic.subscribed` / `topic.unsubscribed`, condition field `contact.topics`, validation codes `topic_not_found` / `topic_unverified`. The server accepts the old spellings on write forever and canonicalizes on read.
- **Webhook event names** offered by `webhook.create` are now `contact.topic_subscribed` / `contact.topic_unsubscribed`.
- Topic ids keep their `tag_` prefix — opaque and permanent. The `tags` argument on `template.create` / `template.update` and the `tag_name` / `tag_value` filters on `email.list` are a different concept and are **unchanged**.

### Added

- **`segment_add` and `segment_remove` automation steps.** Both are in the `steps[].type` enum, in the per-type `config` help inlined into every graph-authoring tool description, and in the `mailtea://automations/step-types` resource with `config: { required: ["segment_id"] }` and `side_effecting: true`. They add and remove the enrolled contact from an audience segment, which is now what decides who a send targeting that segment reaches.
- **The member-list rule is stated in three places on purpose**, because an agent only discovers what the schema advertises and this one is not guessable from the config shape. A segment is a member list (no filter) or a filter (`status_filter` / `query_filter`), never both — so `segment_add` refuses a filter-backed segment with the new `segment_is_filter` code, at save time and again when the step runs. `segment_remove` takes either kind. `segment_not_found` and `segment_unverified` join the published `validation_codes`.

### Changed

- **`template.create` / `template.update` refuse a variable name that could never substitute.** `variables[].key` now advertises `pattern` `^[A-Za-z_$@][A-Za-z0-9_$@.-]*$` and `maxLength` 50, repeats the rule in its description (several clients drop `pattern` when they flatten a schema for the model), and is checked before the request goes out so the refusal names the offending key instead of arriving as a Zod path. The API refuses these too. Previously `key` was any string up to 50 characters: `2nd name`, `first name` and `first|name` were accepted, stored, and returned by `template.get` looking entirely declared — and then substituted **nowhere**, because a send resolves a variable by path. The template shipped `Hi {2nd name},` to a real inbox. This matters more for an agent than for an operator, who at least sees the chip turn red in the editor; an agent saw a `201` and moved on. Dots still address into send context (`contact.first_name`), and dashes are still legal (`plan-tier` resolves — only dots separate path segments); pipes are not, because `|` is the inline-fallback separator in `{key|fallback}`, so a name containing one is re-read at send time as a shorter, different name.

### Added

- **`template.versions`** — a template's design history, newest first: `version`, `origin` (`edit` / `publish` / `restore`), `restored_from_version`, `format`, `name`, `sealed`, `is_current`, timestamps and `author`. Metadata only, because one version row carries a whole design document and a fifty-entry list that shipped them all would be a multi-megabyte response rendered as a column of timestamps. `is_current` is computed against the live template rather than assumed to be the newest entry — a metadata-only update (renaming, retagging) touches the template without recording a version, so "newest" and "current" are not the same claim. The reply carries `retention`: only the newest `max_versions` are kept, and consecutive edits by the same author inside `coalesce_window_seconds` collapse into one entry.
- **`template.restore_version`** — put an older design back. Its description leads with the consequence, because an agent only discovers what the tool advertises and this one changes sending behaviour: **restoring is a content write, so the template returns to `draft`** — automations and the API STOP sending it until `template.publish` is called again, and the response's `unpublished` reports whether that just happened. The description also states that history is **forward-only** (the design being replaced is recorded as its own version first, then the restored design is appended, so a restore is undone by restoring the entry above it), that restoring the design that is already current writes nothing and returns `restored: false` with `reason: "identical"` rather than silently unpublishing a live template for no change, and that a version aged out of retention returns `404 template_version_not_found`.

## 0.5.0 (2026-07-28)

### Changed

- **`automation.metrics` describes how to READ its response, not just how to call it.** Agents only discover what the tool advertises, and every one of these three is a way to produce a confidently wrong answer from a correct response, so all three are now in the description: (1) `version`/`version_id` say what the numbers are **scoped** to and are `null` for an all-versions aggregate, while `graph_version`/`graph_version_id` say only where the step **labels** came from — quoting the second as the scope captions combined v1+v2 traffic as one version; (2) `steps[]` is keyed on (`step_key`, `step_type`), so an all-versions aggregate can hold two entries with the same `step_key` and they must not be merged by key; (3) `email.delivered` means *currently* delivered — accepted and not later bounced — so `delivered + bounced` never exceeds `sent`.
- **`automation.metrics`'s summary line reads the scope from the response instead of the request.** It now says "all versions, labels from vN" for an aggregate rather than naming a single version, which is the same mislabel the response split exists to prevent.
- **`automation_run.get` explains `recorded_after_run_ended`.** A step run carrying it finished *after* its run ended — cancelled, archived, or the contact unsubscribed while the step was in flight. Its `completed_at` is legitimately later than the run's own and the side effect really happened (the email was sent and billed), so an agent triaging a run should not report it as a data glitch. The run did not resume, and no `automation.step.completed` webhook fired for it.

## 0.4.0 (2026-07-27)

### Added

- **`template.create` / `template.update` can author a designed template.** Both now advertise `editor_doc` — the TipTap document the Visual Email Designer writes — and the server renders and stores the email HTML from it. An agent can build the same designed, sendable template an operator designs in Mailtea Studio, which it previously could not: the design source lived only in the operator's browser and the tools only offered raw `html` or a json-render `spec`.
- **The document vocabulary is in the descriptions, not just the schema.** Agents only discover what the schema advertises, so both tools spell out the node types that render (`paragraph`, `heading`, `bulletList`, `image`, `button`, `spacer`, `table`, the column wrappers, `linkCard`, `logo`, `footer`), the marks (`bold`, `italic`, `link`, `textStyle`, …), that `subtitle` on the doc root becomes the inbox preview text, and the node types that render to **nothing** in email (`youtube`, `xPost`, `threadsPost`, `codeBlock`) or lose their semantics (`repeat`, `showIfKey`). A document that renders to an empty email is refused with `editor_doc_unrenderable`, naming the offending types in `node_types`. Described in prose rather than as a nested `oneOf` per node type, for the same reason the automation step `config` stayed a flat object: MCP clients vary in how much JSON Schema they honour, and unions are where they break.
- **The fidelity sidecars and library metadata** — `style_profile`, `mailtea_theme`, `global_css`, `category`, `preview_image_url` and `tags` on both write tools. The three metadata fields are three-state on `template.update` (`["string", "null"]`): omit to leave alone, `null` to clear.
- **`template.unpublish`** — the retraction half of `template.publish`. Publishing was one-way: the only way to take a template out of circulation was to delete it or edit its body. The body is untouched and `published_at` is kept as history; unpublishing an already-draft template is a no-op rather than an error.
- `template.get`'s description now says it returns the `editor_doc` design source and its sidecars, and that `template.list` deliberately omits them — that pairing is the read half of editing a designed template.

### Changed

- `template.create` refuses `editor_doc` together with `html` before making a request. The server would silently ignore the `html`, so the caller would never learn the delivered email was not the one they sent.
- `template.render` now actually substitutes the `variables` map it has always accepted — the server parsed it and discarded it, so a preview came back full of raw `{{placeholders}}`.
- `template.render` now requires the `templates:read` scope; it was the only template route with no scope check. Keys minted from the `read_only` or `sending_access` presets hold no `templates:*` scope and will now receive a `403`.

## 0.3.0 (2026-07-27)

### Added

- **Automation authoring tools** — `automation.create`, `automation.list`, `automation.get`, `automation.update`, `automation.enable`, `automation.disable`, `automation.archive`, `automation.delete`, `automation.validate` and `automation.metrics`. An agent can now author, start, observe and tear down a journey end to end. Three schema affordances make graph authoring actually work rather than nominally work: `connections` is **optional** (omit it and the steps link in array order; it is required, and its absence coded, only when the graph branches), `validate_only: true` on `create` / `update` is a dry run that writes nothing and reports the same issues a real failure would (the dry run returns them as structured JSON; a genuine rejection flattens them to one `severity code [step.path]: message` line each, because the MCP error channel is a string — self-correctable either way, but only the dry run is machine-readable), and `steps[].config` is a **flat** `{"type": "object"}` with the required keys per step type enumerated in the tool description — not a nested `oneOf`, which is exactly where MCP clients break on discriminated unions.
- **`mailtea://automations/step-types` resource** — the machine-readable catalog behind those flat `config` objects: all nine trigger types (and which require a `trigger_key`), all ten step types with their required/optional config keys, branch labels and side-effecting flag, the graph limits, the full condition-operator and context-namespace reference, and the stable validation codes. An agent fetches exact shapes once instead of every `inputSchema` carrying the model.
- **Automation run tools** — `automation_run.list`, `automation_run.get` and `automation_run.cancel`. Run detail returns the graph the run is pinned to, so a replay is never rendered against a graph the run never traversed. There is deliberately no `automation.test` tool: a test run sends real, billed email.
- **Event tools** — `event.send` for custom event ingest (opt-in `create_contact`, `idempotency_key`, and the `enrolled_automations` / `resumed_runs` fan-out counts in the reply so an agent can verify its event did something without polling), plus `event_definition.list / get / create / update`. The definition detail carries `inferred_properties` with per-key coverage, which is what stops an agent building a condition on a key that appears in 3 % of events.
- **`search` on `email.list`** — a case-insensitive substring match over recipient, sender and subject, applied server-side before pagination rather than to the current page. Shipped server-side on 2026-07-22, one day after 0.2.0 went out, so this is the first published release that carries it.
- **Automation lifecycle events advertised on `webhook.create`** — `automation.run.started`, `automation.run.completed`, `automation.run.failed`, `automation.run.exited` and `automation.step.completed` are now named in the tool's `events` schema description. An agent only discovers what the schema advertises, so an unlisted event is an event no agent can subscribe to. `automation.run.exited` carries the reason a contact left a journey early; `automation.step.completed` fires for side-effecting steps only.
- **Per-topic subscription events advertised on `webhook.create`** — `contact.tag_subscribed` and `contact.tag_unsubscribed` are now named in the tool's `events` schema description, so an agent can discover and subscribe to them. Both fire only on a genuine change in effective tag membership: a tag with an `opt_out` default already counts as subscribed, so re-asserting that default emits nothing.

### Changed

- **The automation and event tools take snake_case arguments** (`publication_id`, `automation_id`, `run_id`), deviating from the camelCase house style of the older tools. The automations REST body is snake_case throughout and the graph passes through verbatim, so mixing `publicationId` with snake_case `steps[].config` keys inside one payload is a trap agents fall into. Internal consistency within a payload beats consistency across tools here; each affected tool description says so.

## 0.2.0 (2026-07-21)

### Added

- **Sender tools** — `sender.create / list / update / delete / set_default` for named from-identities on verified sending domains.
- **Suppression tools** — `suppression.add / remove / search` for the org-wide do-not-send list, plus `suppression.export` returning the full list as CSV.
- **`template.render`** — dry-run a template spec to email-safe HTML and plain text without creating a template.
- `template.create` accepts `text`, `from`, and `reply_to` (matching `template.update`).
- `suppression.search` supports `created_after` / `created_before` date filters and `starting_after` cursor pagination.

### Changed

- Domain tool descriptions explain the two-part verification gate: the ownership TXT record **and** the branded DKIM TXT record must both verify before a domain can send. `domain.verify` responses include `dkim_status` and `receiving_mx_found`.
- `webhook.create` lists the full 14-event catalog (delivery, engagement, and contact lifecycle events, including `email.received` for inbound).
- Public tags are described as reader-facing **topics** that act as unsubscribe groups.

## 0.1.2 (2026-07-14)

- Aligned tool schemas with the documented API surface.

## 0.1.1 (2026-07-13)

- Package metadata refresh alongside the SDK rename.

## 0.1.0 (2026-02-20)

- Initial public release of the Mailtea MCP server.
