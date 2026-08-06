# Changelog

All notable changes to `mailtea-mcp` are documented here.

## Unreleased
- Added: `site.asset_upload` and `site.asset_delete`. Until now `site.asset_list`
  was the only asset tool, so an agent could reference an image that already
  existed and could not add one — which made "design this newsletter, with
  images" impossible over MCP. Upload takes base64 bytes and returns the
  permanent URL for an image block's `src`. PNG/JPEG/GIF/WebP only, 5 MB max;
  SVG stays refused (it can carry script and would be served from our own
  origin), and the bytes are now checked against the declared type, so a
  mislabelled file is rejected instead of stored. Delete hides an asset from the
  library but KEEPS the file resolving, so already-sent emails do not break.
- Changed: `site.asset_list`'s description now names the metadata each entry
  carries (fileName, contentType, byteSize, width/height) so an agent picks an
  image by what it is rather than by position in the list.
- Added: `template.update` now reports `unpublished: true` (with a message) when the
  write took a published template back to draft. Changing a subject line is a
  content change, so it stops the sends — the response said nothing about that
  before, and an agent that did not diff `status` left the operator's template
  offline. Matches `template.restore_version`, which already reported it.
- Changed: `issue.apply_ops` `compose` now returns the document wrapped in the
  editor's root `container`, so the paths in its outline are `0.0`, `0.1`, … and
  they STAY that way. Previously a fresh draft composed flat and the wrapper
  appeared the first time a human opened the email, silently shifting every path
  the agent had been handed a turn earlier. **Read the outline from the response
  and address by that** — this was always the contract, and now it holds across
  a human opening the email.
- Fixed: `set_styles accentColor` now reaches buttons. A button carried a
  materialized `#000000` from the editor's schema default, which the renderer
  read as a deliberate per-button colour and preferred over the accent forever.
  An unset button is now genuinely unset. Buttons that already carry an explicit
  colour keep it — set one with `edit_block`'s `buttonColor`.
- Added: `issue.apply_ops` `set_styles` now takes `accentColor`, `linkColor` and
  `headingColor`. They are the brand: button fill, quote rule and section badges follow the accent,
  body links follow the link colour. Before this the ten style tokens were all
  `PageStyle` geometry, so an agent could set the card width and background but
  every email it composed came out in whatever accent the preset happened to
  carry — there was no way to state a brand at all. Both are read back by
  `issue.get_editor` in `styles`, so the read and write vocabularies match.

### Changed

- **`site.*` writes now require the `site:write` scope and an editor-or-above publication role.** Server-side change, no MCP code change — recorded because it is a new failure mode an agent will meet mid-task, and because it *removes* an ability some tokens had. The write tools (`site.page_upsert`, `site.apply_ops`, `site.design_brief_set`, `site.publish`, `site.discard_draft`) previously rode the same `issues:read` permission as every read, which meant a read-only key, a `sending_access` key, or a key belonging to a viewer-role member could rewrite and publish a publication's live public website. They now come back as `Insufficient role`. Reads (`site.get`, `site.pages_list`, `site.page_get`, `site.presets_list`, `site.design_brief_get`, `site.asset_list`) are unchanged. `full_access` keys carry `site:write` and keep working — including keys minted before this change, which a server-side migration backfills. A key whose scopes were narrowed by hand and never listed `site:write` loses Website Builder writes; mint a new one or widen the existing key in Settings → API keys.

- **Marketing tools are refused on a transactional-only plan.** Server-side change, no MCP code change — recorded because it is a new failure mode an agent will meet mid-task. `contact.*`, `contact_property.*`, `segment.*`, `topic.*`, `issue.*`, `analytics.*`, `automation.*`, `automation_run.*`, `monetize.*` and `site.*` now come back as a tool error whose message names the plan and the fix ("…require the Transactional + Marketing plan. Upgrade in Settings → Billing"), rather than an opaque 402 — an agent cannot see an upgrade dialog, so the message has to stand alone. `email.*`, `domain.*`, `event.*`, `event_definition.*`, `template.*`, `api_key.*`, `auth.me` and the inbound tools are unaffected on every plan.
  **Tool discovery is unchanged**: `tools/list` still advertises every tool regardless of plan, because the server has no billing context at listing time. An agent finds out at call time.

### Added

- **`issue.apply_ops` — surgical edits to a draft email.** Until now the only way for an agent to change an email was `issue.update_draft`, which replaces the whole document: "make the CTA green" meant regenerating the entire email and hoping the rest came back identical. `issue.apply_ops` applies a batch of declarative ops (`compose`, `insert_blocks`, `edit_text`, `edit_block`, `set_styles`, `arrange`, `set_headers`) against the stored document and answers with `{applied, skipped:[{opIndex, reason, path, detail}]}` — a partially-applied batch comes back describable instead of as a 400 that discards the ops that did land. The 16 skip reasons (`unknown_path`, `stale_address`, `unknown_block_kind`, `bad_attr_value`, `value_too_long` — refused, never truncated — `doc_full`, `not_email_safe`, `cycle`, …) are enumerated in the description so a model can self-correct on the next turn. This is the **same reducer the Visual Email Designer's own assistant runs**: `/ai/email/chat` streams these ops to the browser, which owns the live canvas; an agent has no canvas, so the server applies them instead. Both share one implementation precisely so a human's edit and an agent's identical edit cannot diverge.
- **The ops vocabulary is spelled out branch by branch** in `issue.apply_ops`'s `inputSchema` — seven `anyOf` variants with their own required fields, all 14 block kinds enumerated with their attributes, and the 10 style tokens enumerated with their meanings and ranges — rather than collapsed into a loose "array of objects". Addresses are dot-joined child-index paths minted by the outline (below); echo them back rather than computing them. `baseUpdatedAt` carries the `updatedAt` a batch was composed against; a mismatch is refused rather than silently overwriting an operator who has the editor open and autosaving every 2.5 seconds.
- **`issue.get_editor` now returns `outline`, `styles`, `headers` and `docBacked`.** The outline is the document as a flat list of addressable blocks (`{path, type, text}`) — the read half of the ops loop. Previously the tool returned raw `contentJson`, so an agent had to parse ProseMirror itself to discover what `2.1` addressed. `docBacked: false` means the draft holds raw HTML rather than an editable document (it was created with `contentHtml`/`contentSpec`, or imported): only a `compose` op can edit it, and `issue.apply_ops` says so in one clear error instead of returning one `unknown_path` skip per op.
- **`issue.apply_ops` works on a post that is open in the editor, and the change appears there live.** Collaborative editing is on by default, so once a post has been opened in the Visual Email Designer its live document is a Yjs room and the issue's saved content is only a seed and a send-time snapshot. Ops for such a post are applied **on the collab server, against the live document, inside one transaction**, and the reduced result is baked back into the saved content afterwards — so an agent edit reaches every connected editor immediately instead of being reverted by the next sync. An operator with the post open sees the agent's blocks appear without reloading, and can keep typing. A draft nobody has opened has no room and is reduced in the API exactly as before. If the collab service is unreachable the call fails rather than falling back to the saved content, because that fallback is precisely the write the room would revert.
- **`issue.apply_ops` and `issue.update_draft` take `baseUpdatedAt`** — the row version the write was composed against, enforced inside the UPDATE statement rather than by a read-then-compare, so it cannot race the writer it exists to catch. A mismatch is refused with the current version attached. `issue.apply_ops` also passes the version it read internally, closing its own read-apply-write window against a concurrent editor autosave. Omitting the field keeps the old last-write-wins behaviour.
- **`email.lint`** — check email HTML against the Can I Email support matrix for the clients Mailtea refuses to regress (Apple Mail, Gmail, Outlook desktop). Returns `{findings, failCount, warnCount, strictClients, linted}`; severity `fail` means the layout **breaks** when unsupported (flex/grid collapse, absolute positioning, CSS variables, viewport units), `warn` means it degrades gracefully (a gradient or shadow simply does not paint). An agent cannot see a rendered preview, so this is the feedback loop that replaces looking at the thing — the same lint the studio runs over its built-in template library. Takes `issueId` (lint what is saved) or `html` (lint before posting it).
- **Website Builder tools** — `site.get`, `site.pages_list`, `site.page_get`, `site.page_upsert`, `site.apply_ops`, `site.presets_list`, `site.design_brief_get`, `site.design_brief_set`, `site.publish`, `site.discard_draft`, `site.asset_list`. A publication's public website is now designable by an agent: read the site and the operator's design brief, compose pages from the curated Section Library, restyle the 12 theme tokens, preview the draft, and publish when asked. Auth and publication scoping ride the existing bearer token; the write tools additionally require the `site:write` scope and an editor-or-above publication role (see Changed, below).
- **`site.apply_ops` is the one to reach for, and its schema says why.** It applies a batch of declarative ops (`set_theme`, `compose_page`, `insert_section`, `swap_section`, `edit_copy`, `edit_style`, `arrange`) to the site DRAFT and answers with `{applied, skipped:[{opIndex, op, reason, detail}]}` — a partially-applied batch comes back describable instead of as a 400 that discards the ops that did land. The alternative, `site.page_upsert`, writes a whole document through a **total parser that repairs silently**: unknown properties dropped, values clamped, overflow past the 40-section / 50-child / 200-node caps discarded, all behind a success response. Both facts are in the tool descriptions, because an agent only discovers what the schema advertises and a `200` from the second tool is not evidence the document was stored as sent. The 17 skip reasons (`unknown_preset`, `unknown_node`, `unknown_slot_key`, `value_too_long` — refused, never truncated — `page_full`, `bad_token_value`, `cycle`, …) are enumerated in the description so a model can self-correct on the next turn.
- **The ops vocabulary is spelled out branch by branch** in `site.apply_ops`'s `inputSchema` — seven `anyOf` variants with their own required fields and per-property descriptions, and the 12 theme tokens enumerated with their meanings and ranges — rather than collapsed into a loose "array of objects". `baseVersion` carries the `draftVersion` a batch was composed against; a mismatch is refused with `site draft changed elsewhere` rather than overwriting another tab, device, or agent.
- **`site.presets_list` returns each preset's `slots` verbatim** — the copy contract. A value slot takes a string under its key; a repeat slot takes a list of item maps and declares its item keys and min/max. Without them an agent has to guess which copy keys a preset accepts, and a wrong guess comes back as `unknown_slot_key` after the write.
- **The `mailtea-site-builder` agent skill** (`skills/mailtea-site-builder/SKILL.md`) — the document model in one page, the 12 tokens, the workflow protocol (read the design brief and follow it, compose from presets, pass `baseVersion`, preview at `/site/preview`, never publish unasked), the total-parser warning, craft rules, and a constrained-target recipe for cloning the *style* of a reference site onto Mailtea's block system.

## 0.6.0 (2026-07-29)
### Changed

- **BREAKING — the `tag.*` tools are now `topic.*`** — `topic.create`, `topic.list`, `topic.update`, `topic.delete` — targeting `/v1/topics`. The old names are **gone**: they are neither advertised in `tools/list` nor dispatched, so a call to `tag.list` is now an unknown tool. An agent holding a tool list cached from before this release must reconnect to pick up the new names — upgrading the package does not refresh a live session's cached list.
- **`mailtea://automations/step-types` renames the audience vocabulary**: step types `topic_add` / `topic_remove` (config key `topic_id`), trigger types `topic.subscribed` / `topic.unsubscribed`, condition field `contact.topics`, validation codes `topic_not_found` / `topic_unverified`. The server accepts the old spellings on write forever and canonicalizes on read.
- **Webhook event names** offered by `webhook.create` are now `contact.topic_subscribed` / `contact.topic_unsubscribed`.
- Topic ids keep their `tag_` prefix — opaque and permanent. The `tags` argument on `template.create` / `template.update` and the `tag_name` / `tag_value` filters on `email.list` are a different concept and are **unchanged**.
- **`template.create` / `template.update` refuse a variable name that could never substitute.** `variables[].key` now advertises `pattern` `^[A-Za-z_$@][A-Za-z0-9_$@.-]*$` and `maxLength` 50, repeats the rule in its description (several clients drop `pattern` when they flatten a schema for the model), and is checked before the request goes out so the refusal names the offending key instead of arriving as a Zod path. The API refuses these too. Previously `key` was any string up to 50 characters: `2nd name`, `first name` and `first|name` were accepted, stored, and returned by `template.get` looking entirely declared — and then substituted **nowhere**, because a send resolves a variable by path. The template shipped `Hi {2nd name},` to a real inbox. This matters more for an agent than for an operator, who at least sees the chip turn red in the editor; an agent saw a `201` and moved on. Dots still address into send context (`contact.first_name`), and dashes are still legal (`plan-tier` resolves — only dots separate path segments); pipes are not, because `|` is the inline-fallback separator in `{key|fallback}`, so a name containing one is re-read at send time as a shorter, different name.

### Added

- **`segment_add` and `segment_remove` automation steps.** Both are in the `steps[].type` enum, in the per-type `config` help inlined into every graph-authoring tool description, and in the `mailtea://automations/step-types` resource with `config: { required: ["segment_id"] }` and `side_effecting: true`. They add and remove the enrolled contact from an audience segment, which is now what decides who a send targeting that segment reaches.
- **The member-list rule is stated in three places on purpose**, because an agent only discovers what the schema advertises and this one is not guessable from the config shape. A segment is a member list (no filter) or a filter (`status_filter` / `query_filter`), never both — so `segment_add` refuses a filter-backed segment with the new `segment_is_filter` code, at save time and again when the step runs. `segment_remove` takes either kind. `segment_not_found` and `segment_unverified` join the published `validation_codes`.
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
