# Changelog

All notable changes to `mailtea-mcp` are documented here.

## Unreleased

- Changed: `issue.send_now`, `issue.schedule` and `issue.publish_to_web` say
  that a broadcast is email only. The API no longer publishes a broadcast to
  the website when `issue.send_now` or `issue.schedule` is called without
  `publishToWeb` (which defaults to true), and `issue.publish_to_web` on a
  broadcast is refused with a message. `issue.send_now` and `issue.schedule`
  also say that a send from a team with no verified sending domain to anyone
  outside the team is refused with the reason; it used to be accepted and fail
  a moment later. These are API changes, live when the API deploys; the new
  descriptions come with the next release of this package.

## 0.20.0 (2026-10-01)

- Changed: `contact.list` takes several whole email addresses in `query`,
  separated by commas, spaces or line breaks, and returns exactly those
  contacts. A list used to be matched as one piece of text and found nothing.
  A single term is still a substring search. A list with an entry that is
  not a whole address is refused with that entry named. The `query` field
  now says so.
  Needs the API deployed with this change.
- Changed: `email.send` refuses a send with no `html`, `text` or `template`
  before any request, with the same message the API now returns: "Provide
  'html', 'text' or a 'template'. An email with no body is not sent." The API
  used to accept such a send and deliver an empty email; it now answers 400.
  An empty string is no body. The `email.batch` description says every item
  needs one, since one bodyless item refuses the whole batch.
- Changed: `publication.create` refuses a `publicationId` that does not start
  with `pub_`, and a taken id is refused with the same "not available" message
  whoever holds it (it used to say the id "already exists", which confirmed
  another team's publication). The `publicationId` description says both.
  Needs the API deployed with this change.
- Changed: in `site.apply_ops`, `set_navbar_template` and
  `set_footer_template` write the publication's own name into the template's
  wordmark and legal line when `brand` is omitted. They used to leave the
  library's "Your publication" placeholder on the site. Needs the API deployed
  with this change.
- Added: `domain.claim` takes `purpose` (`email`, `site` or `both`, default
  `email`), so an agent can claim a domain that only serves the website without
  changing its purpose afterwards. A `site` claim gets no sending identity. The
  claim replies carry `purpose`. Needs the API deployed with this change.
- Added: `issue.create_draft` takes `segmentId` and `issue.update_draft` takes
  `segmentId` (`null` clears it), so an agent can send a post to one audience
  segment instead of all active contacts. Omitted, a post still goes to all
  active contacts. The id must be a segment in the post's publication (find it
  with `segment.list`), or the call is refused. The segment picks the
  recipients when the post is sent: a filter segment is resolved then, and a
  send to a segment that cannot be resolved or matches nobody is refused
  rather than widened to the whole list. An empty, blank or non-string
  `segmentId` is refused instead of being dropped.
- Changed: `segment.delete` says, and its error shows, that a segment a
  draft, scheduled or sending post targets cannot be deleted. The API refuses
  with `segment_in_use`; the tool error names the posts (also in
  `error.data.posts`) and says to point them at another segment with
  `issue.update_draft` or clear it first. Deleting one used to send those
  posts to everyone.
- Added: `segment.create` and `segment.update` take `inactive_days` (an
  integer, 1 to 3650; `null` clears it on update): contacts with no open or
  click in the last N days, counting contacts who never engaged. It selects
  the silent cohort for a sunset or re-engagement send, not engaged readers.
  Engagement tracking is not backfilled, so contacts with no recorded
  engagement count as inactive, and both tool descriptions say so. The
  automation step help and the step catalog now name
  `inactive_days` among the filters that make a segment refuse `segment_add`.
  Both additions need the API deployed with this change.

## 0.19.0 (2026-09-29)

- Changed: template history records the sender. `template.versions` returns
  each version's `from`, `reply_to` and `sender_recorded` (and shows the
  sender in its summary line), an update that changes only From or Reply-To
  records a version (or folds into the open one, like any edit), and
  `template.restore_version` brings the version's From and Reply-To back with
  the design. `sender_recorded: false` marks a version recorded before this
  change: its line says "sender not recorded", and restoring it leaves the
  current From and Reply-To alone. Both tool descriptions say so. The
  behaviour comes from the API, so it reaches every MCP version on deploy;
  this release updates what the tools advertise.

## 0.18.0 (2026-09-28)

- Added: `template.update` and `template.publish` take `base_revision`, `automation.update` takes
  `base_version` (with `steps`), and `issue.update_draft` takes `baseUpdatedAt`.
  Send the value from your last read: the write then lands only if nobody
  changed the template, automation or draft since, for example a person
  editing it in Mailtea Studio. Otherwise nothing is saved and the tool fails
  with `stale_write` or `stale_version` (the post's error says "changed
  elsewhere"), and the message says which tool to re-read with and what to
  retry with. Leave the argument out and the write is unconditional, as before.
  Template responses now carry `revision`; `template.update` and
  `automation.update` failures carry `current_revision` / `current_version` in
  the error data.
- Changed: when every op in an `issue.apply_ops` batch misses its path because
  the post's live document is shaped differently from what `issue.get_editor`
  showed, the report now carries `outline` for the live document, and the
  tool's text says to take paths from it. If the ops reached the live
  document but could not be saved into the draft yet, the error says not to
  apply them again.
- Changed: `issue.apply_ops` on a draft that holds raw HTML now tells you to
  send a `compose` op or ask the operator to choose Edit as blocks in the
  Visual Email Designer. Opening the draft no longer converts it.

- Added: `issue.create_draft` and `issue.update_draft` take a post's `name`,
  `from` and `replyTo`. `title` is the subject subscribers see; `name` is only
  the post's internal name in Mailtea Studio and never changes the subject.
  `from` must be on one of the publication's verified sending domains and
  `replyTo` must be a valid address: the tools ask the server to check both
  when they write, so a bad value is refused with the reason instead of being
  swapped for the default sender at send time. A From on the built-in
  `*.mailtea.email` address is kept for test emails, but the post itself sends
  from the publication's default sender. `""` clears a field.
- Changed: `issue.update_draft` no longer requires `title`. Only the fields you
  pass change, and an update that leaves out the content keeps the body (the
  API used to empty it).

Fixes from the 2026-09-24 user-testing run, where an agent drove every tool
through the default Studio key.

- Fixed: a team-scoped personal API key (the default key Studio creates) now
  works with every tool that takes `publicationId` / `publication_id`. Left
  out, the id defaults to the one publication the key's owner belongs to in
  the key's own team, when there is exactly one. When there are several, the
  error still starts `Missing required string argument: publicationId.` and
  now lists the ids and names to pass. A service key, or a key whose owner is
  no longer in its team, gets no default. Over stdio the runtime asks
  `auth.me` with the caller's own token and reuses a resolved id for 60
  seconds per token (never an error); a publication-scoped key is its own
  default without `MAILTEA_PUBLICATION_ID`. The hosted server decides this
  itself and makes no extra request. An explicit id is still sent as typed and
  checked by the server.
- Added: `McpRuntimeOptions.reachablePublications`, for a host that has
  already resolved the caller's credential: the runtime then never asks
  `auth.me` about the caller.
- Changed: an argument a tool does not declare is no longer silently dropped.
  The call still runs (nothing that worked before is refused), and the result
  adds a second text item, `Warning: Ignored unknown argument: ...`, listing
  what the tool accepts, with a suggestion for a near miss such as
  `publication_id` on a camelCase tool. A failed call names them in its error.
- Fixed: REST failures now show the API's `details` (the reason behind "Spec
  rendering failed", or the fields behind "Validation failed") and its `code`,
  `reason` and `steps`, in the message and as JSON-RPC `error.data`. Tool
  descriptions that tell an agent to branch on a code (for example
  `automation.enable` with `no_verified_sender`) can now be followed.
- Fixed: `issue.apply_ops` `arrange` deletes accept `{path, expectType}`, like
  every other address, and a stale one is refused as `stale_address`. If any
  address in an `arrange` op is stale the whole op is refused, so a stale path
  can no longer delete the wrong block while the op reports success. The op's
  description no longer claims addresses resolve against the document as it
  was when the batch started; they resolve when the op runs.
- Fixed: a `contentSpec` / `template.render` spec whose elements leave out
  `props` renders, as the schema always said it could. It used to fail with a
  bare "Spec rendering failed".
- Changed: `ai.generate_draft` says what it is: a placeholder scaffold. No AI
  model runs and nothing is saved; the result is marked `scaffold: true` and
  `saved: false`.
- Changed: the `newsletter.draft_from_brief` prompt takes `brief` (required),
  `audience`, `tone` and `call_to_action`, and `newsletter.subject_line_pack`
  takes `topic` (required), `count` and `audience`. Both embed what they are
  given. Called with no arguments they still answer, asking for the brief.
- Fixed: `issue.send_and_wait` returns the issue's final `status`, `sentAt` and
  `updatedAt` from the last progress read instead of the `sending` row it
  started from, and no longer echoes the whole `contentJson`.
- Fixed: `event.send` schema errors no longer print a literal `undefined`
  before each issue code.
- Changed: `domain.list` takes any region the list reports as its `region`
  filter, including a deployment's default region outside the catalog (for
  example `us-east-1` locally). `domain.create` says that an omitted `purpose`
  makes a `site` domain, which cannot send.
- Changed: `contact.import_csv` says that only the email column is read, and
  its result names any other column in `ignoredColumns` (at most 20 names;
  `ignoredColumnCount` is the full count).
- Changed: `site.asset_upload` no longer says SVG is refused (it is accepted
  and served under a sandbox policy) and warns that Gmail and Outlook do not
  show SVG in email.
- Changed: `automation.enable` names `CUSTOM_DOMAIN_REQUIRED` and the new
  `BUILT_IN_SENDER` among its refusal reasons, and `email.send` advertises
  `tracking_open` and `tracking_click`, which it already forwarded.
- Fixed (server): an automation whose step sends from the built-in
  `{slug}.mailtea.email` address is now refused at Start with `code:
  "no_verified_sender"`, `reason: "BUILT_IN_SENDER"` and the step keys, when
  the team has a verified domain of its own. It used to start and then have
  every send to a contact refused at runtime. Mailtea Cloud only.
- Changed: `email.lint` now warns about `color-mix()`, which Outlook desktop
  drops (a divider coloured with it disappears). Mailtea's own renderer no
  longer emits it, so this flags HTML written by hand or by an agent. The tool
  description says so.
- Changed: `email.send` with a `template` may leave out `subject`, `from` and
  `sender_id`. The input schema now requires only `to`, and says so: the
  template's published subject is used, and its sender is the publication's default
  sender, then the template's own From. Without a template the tool still
  refuses a missing `subject`, and a missing or doubled sender, before any
  request.
- Behaviour (API): a template's `{{variables}}` in the subject are now filled
  with the same values and fallbacks as the body, on `email.send` and on
  automation emails. An agent that sent `"Hi {{first_name}}"` used to deliver
  the braces.
- Breaking: `issue.create_draft` seeding from `templateId` now HTML-escapes
  the `variables` you pass, the same as every other send. HTML passed in a
  `{{key}}` value now arrives as visible text, and a value you escaped
  yourself arrives double-escaped. Put `{{{key}}}` in the template where a
  value is meant to be raw HTML. Variables are now filled in both the
  `{{key}}` and Visual Email Designer `{key}` forms. A declared variable you
  do not pass stays in the post with its `fallback_value`, so the broadcast
  gives each recipient their own value or that fallback, and undeclared tokens
  like `{{contact.first_name}}` are left for the broadcast too. The post keeps
  the template's published page style, is wrapped in that page, and has its
  show-if blocks decided per recipient when it is sent. Before, only the
  variables you passed were replaced, raw, and only in `{{key}}` form. It uses
  the template's published version; Mailtea Studio's "Use template" starts
  from the latest saved design instead.
- Changed: `template.update` and `template.restore_version` no longer move a
  published template back to draft. The template keeps its published status,
  and automations, issues and the API keep sending its published version until
  `template.publish` is called again. The template's `from` and `reply_to` are
  part of the published version too, so a new sender or reply-to address
  reaches sends only after the next publish. `template.unpublish` is now the
  only way to stop a published template sending, short of deleting it, and it
  drops the stored published version so the next publish starts from the
  current content.
- Added: `has_unpublished_versions` on every returned template. True only when
  the template is published and its saved content (From, Reply-To and the style profile included)
  differs from the published version.
- Added: `template.versions` reports `is_published` for the entry that is
  sending now and marks it "(published)" in its summary, next to "(current)"
  for the entry that matches the working copy. Its description no longer says
  `is_current` is what the template is serving.
- Changed: `template.update`'s summary line says "Saved, not published yet"
  when the edit is not live, so an agent that reads only that line still
  learns it has to call `template.publish`.
- Changed: the `template.create`, `template.get`, `template.update`,
  `template.publish` and `template.restore_version` descriptions now say that
  sends read the published version (From, Reply-To and the style profile included), that
  `template.get` returns the working copy, and that a restore no longer
  returns a template to draft.
- Changed: the `unpublished` field on the update and restore replies is kept
  for compatibility and is now always `false`. Check
  `has_unpublished_versions` (or the reply's `message`) instead.
- Changed (API behavior): a template variable's `fallback_value` can no longer
  contain `{` or `}`. Creating a template with one, or changing a fallback
  to one on update, is a 400 ("Fallbacks can't contain { or }."). A value
  the template already stores is accepted unchanged, so a template saved
  before the rule keeps saving. Inline chip fallbacks such as
  `{first_name|Mom & Pop}` now render as written instead of double-escaped.
- Changed: the `mailtea://automations/step-types` catalog lists the new
  `event_field_without_event_trigger` code, says the trigger needs a step on
  its next branch, and adds `step_refs` and `event_refs` to its condition
  section (also served by `mailtea://automations/condition-fields`): a
  `steps.<key>` reference must name a step in the automation, and
  `event.properties.*` needs an app event trigger. Its notes and the
  `automation.update` and `automation.enable` descriptions explain the
  live-edit rules below.
- Changed (API behavior): saving an active automation is refused only when the
  edit adds an error the live version does not already have. The 422
  `active_graph_invalid` reply's `issues` lists just those new problems.
  Before, any error refused the save, even one the live version already had.
  Starting refuses every error as before, except an `unknown_step_ref` at a
  `config.*` path or a trigger `missing_branch` that the version the
  automation last ran on already had, so pausing and starting an unchanged
  automation keeps working. Issues the last live version already had come back
  with `pre_existing: true`.
- Added (API behavior): issue objects carry `field`, what a rule reads (the
  rule's `field`, or the path in a `{"var": ...}` value, e.g.
  `steps.welcome.opened`) when the issue is about one.
- Changed (API behavior): two issues are the same problem when their code and
  step match, and their `field` or, when there is none, their `path`. Moving
  a rule, by removing a rule beside it or putting it in a group, no longer
  makes a problem the live version already had look new. An error is
  `pre_existing` only if the live version had an error there, not a warning.
- Changed (API behavior): `validate_only` on an active automation answers the
  way the save would. A trigger change is a 422 `trigger_locked_while_active`,
  a change that adds a problem is a 422 `active_graph_invalid` listing only
  the new problems, and otherwise issues come back with `pre_existing` marked
  against the version live now. Before, it returned every issue unmarked.
- Changed (API behavior): changing the trigger (its type or key) of an active
  automation is now refused with 422 `trigger_locked_while_active`. Pause it
  first; draft and paused automations can still change their trigger. Before,
  the change was accepted.
- Added (API behavior): new validation rules. A trigger with nothing after it
  is a `missing_branch` error at `branches.next`. A rule or `{"var": ...}`
  value that reads `steps.<key>.*` for a step that isn't in the automation is
  an `unknown_step_ref` error at that `config.*` path, or a warning when the
  `{"var": ...}` has a `default`. A rule or value that reads
  `event.properties.*` when the automation does not start from an app event is
  the new warning `event_field_without_event_trigger`.

## 0.17.0 (2026-09-19)

- Changed: `email.send`, `email.batch`, `issue.send_test` and `email.reply` now
  advertise that a team which has verified no sending domain of its own can only
  reach verified members of that team — whatever `from` is used. Any other
  recipient in `to`, `cc` or `bcc` refuses the whole send, and for `email.batch`
  the whole batch, with `403` and
  `reason: "system_domain_recipient_restricted"`. Verifying one domain lifts it
  for the whole team; the built-in `{slug}.mailtea.email` address stays
  team-only even afterwards. The schemas say so because an agent can only
  anticipate what the schema tells it; otherwise this arrives as an unexplained
  403 mid-task.
- Changed: `email.reply` describes the one allowance the recipient rule makes —
  a team with no verified domain may still reply to the person who wrote (the
  original's `From`), though `cc`/`bcc` get no such allowance and an original
  whose `Reply-To` points elsewhere is refused.
- `POST /v1/emails` and `/v1/emails/batch` now send the same string in `code` as
  in `reason` on every refusal. No MCP change was needed for that — the server
  relays the API body — but it is recorded because it is a new field an agent
  can branch on.
- Both rules the descriptions now state are MAILTEA CLOUD only; a self-hosted
  install sends through its own provider on its own domains and is exempt.
- Changed: `email.send` and `email.batch` say that `from` must be on a domain
  the TEAM has verified, and that an unverified one is refused with `422` and
  `reason: "DOMAIN_NOT_VERIFIED"`. The check now runs on every key, including a
  team-scoped one that names no publication — an agent that used to get a `202`
  for such a send now gets a `422`, and the schema says why.
- Changed: `sender.create` now says the built-in `{slug}.mailtea.email` host is
  refused outright. It used to be accepted and then behave like a broken sender,
  because the send gate passes it while every real send through it is refused.

## 0.16.0 (2026-09-16)

- Changed: `email.batch` now advertises how the send allowance is measured. It
  is checked against the **whole batch**, not per message — a batch that does
  not fit in what is left is refused with `403` and **nothing is created**, and
  the error names how many emails the batch needed and how many of the limit are
  already used. Re-sending the same batch fails identically, so split it or wait
  for the limit to reset rather than retrying. The server behaviour changed on
  2026-09-16: before that the check asked for a single message regardless of
  batch size, so a batch could exceed the allowance. The tool schema says so now
  because an agent can only act on what the schema tells it.

## 0.15.0 (2026-09-15)

- Added: `api_key.create` takes `mode` (`live` or `test`). A test key is
  prefixed `mt_test_` and its sends are validated, recorded and webhook-emitting
  but never delivered — so an agent can exercise the whole send path without a
  message reaching an inbox. It is **not** a data sandbox: it reads and writes
  the real contacts, templates, senders and webhooks. Only delivery is
  simulated.
- Added: `email.list` takes `mode` (`live` or `test`). There is no mixed view; a
  test key reads only test mail and a live key only live mail. A test row is
  marked `[test]` in the list summary, so a summarized list cannot report a
  simulated send as a real delivery.
- Reserved recipients on `test.mailtea.email` force an outcome: `delivered@`,
  `bounced@`, `complained@`, `delayed@`, `failed@`. The first `to` recipient
  decides; anything else is delivered.
- Note: `mode` is never accepted on `email.send` or `email.batch`. The key
  decides.

## 0.14.0 (2026-09-11)

- Fixed: `publicationId` is no longer a required argument on any tool, and
  `publication_id` is no longer required on the automation and event tools. It
  now defaults to the publication the connection is already for — the
  publication named by the OAuth consent grant over the hosted endpoint, the one
  a publication-scoped API key was minted for, or `MAILTEA_PUBLICATION_ID` over
  stdio. Through the hosted server this made calls such as `sender.list {}` and
  `publication.domain_list {}` fail with `Missing required string argument:
  publicationId`, which an agent could not act on: a consent grant names exactly
  one publication and the server refuses every other one, so the id the agent
  was being asked to supply was the only one that could ever have worked, and
  the tool schema advertised it as required so the agent had no way to learn it
  could be omitted. Every affected tool's schema now describes the default.
  Nothing is widened — an explicit `publicationId` still travels as typed and is
  still refused when it names a publication the credential does not cover, and a
  call with no argument and nothing to default to still fails with the same
  message as before.
- Added: `envPublicationFallback` on the runtime options. Set it to `false` and
  `MAILTEA_PUBLICATION_ID` in the surrounding process is ignored as a default.
  The hosted server sets it, because one process there answers for every tenant
  and a variable set on it would otherwise become the default publication for
  callers it has nothing to do with — including a team-scoped key, which passes
  the publication check precisely because it is scoped to none. Defaults to
  `true`, so stdio and the CLI are unchanged.
- Changed: `publication.create`'s `publicationId` now says in its schema that it
  names the publication being created rather than one to act on, so an agent
  carrying the new defaulting habit does not mistake it for the connected
  publication. `section.catalog`'s says that omitting it means the shared
  catalog only, which is a real choice rather than a missing argument.

## 0.13.0 (2026-09-10)

- Changed: `domain.verify` (and every domain read) now reports
  `receiving_identity_status`, so an agent can tell whether a domain is
  registered to receive mail before advising an `MX` change.
- Fixed: over stdio, a message with no `id` is no longer executed. JSON-RPC
  calls such a message a notification; the hosted HTTP endpoint answers one
  with `202` and dispatches nothing, while stdio ran the call and merely
  withheld the reply — so a `tools/call` that omitted its `id` performed a real
  write on one transport and nothing on the other.
- Fixed: a `notifications/*` method the server does not act on —
  `notifications/cancelled`, say — is accepted as the one-way message it is
  instead of answered with `-32601 Method not found`, which a strict client
  reads as a failed session.
- Changed: `automation.enable`'s description now names the second way an
  activation is refused. When a `send_email` step cannot resolve a sender the
  server answers `no_verified_sender` with a `reason` — `NO_SENDER`,
  `DOMAIN_NOT_VERIFIED`, `WRONG_PURPOSE`, `DKIM_NOT_VERIFIED` or `INVALID_FROM`
  — and `steps[]` naming every blocking step. The tool only advertised
  `automation_invalid` and its `issues[]`, so an agent hitting a publication
  with no verified sender had nothing in the schema to explain the refusal and
  no way to know that adding a sender, or verifying its domain, is the fix.
- Added: `contact.import_csv` takes `enrollInAutomations`, which enrolls the
  imported contacts in matching `contact.created` / `contact.subscribed`
  automations — so an agent can start an imported list on a welcome series.
  Previously impossible: the tool neither advertised nor forwarded the flag, so
  the answer was always no and the import had to be redone by hand in Studio. It
  defaults to **false**, the same default as Studio's import checkbox, because
  importing a list is bringing existing subscribers in, not watching them sign
  up. The argument is camelCase, matching this tool's other arguments and the
  procedure behind it. The result now also carries `enrolledAutomations`, the
  number of enrollments the import created.
- Added: `contact.import_csv` takes `confirmLargeEnrollment`. Above **500 rows**,
  an import with `enrollInAutomations` true is refused with
  `enrollment_too_large` and nothing is stored unless this is also true. It is a
  confirmation, not a cap: an acknowledged import of any size goes through, which
  is the same deal a Studio operator gets from the confirm screen. Defaults to
  **false**, and an explicit `false` acknowledges nothing. The refusal message
  names the field and the row count, and it arrives in `error.message` — the only
  part of a tRPC error an agent can read — so a tool that hits it can correct
  itself in one step. A plain import is never limited by size, because it
  enrolls nobody.
- Added: `domain.update` takes `tracking_subdomain: null` to remove a tracking
  subdomain. The domain's links go back to being served from the Mailtea host.
  Links in mail you have already sent point at the old hostname and stop
  resolving — there is no way to reinstate them. An empty string is not the same
  thing: it is refused with `tracking_subdomain_invalid`. `domain.create`'s
  schema is unchanged — a create has nothing to clear.
- Changed: the `MX` row in `records` now reports what the last verify found,
  instead of reading `pending` on every request but the verify itself. A domain
  nobody has verified reads `not_started`.
- Fixed: `domain.create` sends `tracking_subdomain` as you gave it, so an empty
  string is refused with `tracking_subdomain_invalid` — as the tool's own schema
  says it is — instead of being dropped. It used to be read through a helper
  that treats `""` as "not named", so the create went through as though you had
  never asked for a tracking subdomain: a 200, a domain with no tracking host,
  and nothing to say why. A wrong type reaches the API too and earns a 400
  rather than being ignored. Only leaving the field out omits it now, which is
  the same rule `domain.update` follows.

## 0.12.0 (2026-09-03)

- Added: `domain.claim`, `domain.claim_get`, `domain.claim_verify` and
  `domain.claim_cancel`. When `domain.create` is refused with code
  `domain_held_elsewhere`, another publication holds the host — publish one TXT record
  to prove you control its DNS and the domain moves to you. The claim expires
  after 72 hours, and verifying before the record has propagated is safe: the
  claim stays pending with the same record.
- Added: `domain.create` advertises `region`, `tls` and `tracking_subdomain`.
  A domain's region is fixed at creation and picks where its mail is sent from;
  `tls: "enforced"` bounces rather than delivering in the clear; a tracking
  subdomain serves opens and clicks from your own domain. Agents only discover
  what the schema advertises, and none of this existed for them before.
- Added: `domain.update` takes `tls` and `tracking_subdomain`. It deliberately
  does NOT take `region` — changing it is refused, and the fix is to delete the
  domain and add it again.
- Added: `domain.list` filters on `region` and `status`.
- Changed: each row in a domain's `records` now says what it is FOR in `record`
  (`Ownership`, `DKIM`, `SPF`, `MX`, `Return-Path`, `Tracking`), carries
  `ttl: "Auto"`, and reports its OWN status rather than the domain's. `type`
  still holds the DNS type and `purpose` is unchanged.
- Fixed: `domain.update`'s return-path note printed the record's role where the
  DNS type belonged, so an operator was told to create a record of type
  "Return-Path". It now names the type.
- Fixed: `site.publish` now enforces the published-custom-page cap too. It
  promoted every draft page with no cap check at all, so the limit `site.page_upsert`
  enforces was bypassable by building custom pages as drafts and publishing them —
  which is the normal workflow. An over-cap publish is refused whole, so no subset
  goes live, and the message names the limit.
- Fixed: `site.page_upsert` can create custom pages. Custom pages shipped on
  2026-08-18 and the tool never learned about them — `kind` had no `custom`
  value and the description said flatly that free landing pages did not exist —
  so an agent could not make one at all, for a fortnight after operators could.
  Agents only discover what the schema advertises.
- Changed: a NEW custom page created without `status` is now a DRAFT. It was
  published, because the column defaults that way — which also let it slip past
  the plan's published-page cap. Building stays unlimited on every plan;
  publishing is capped (free 1, hobby 5, pro 25) and an over-cap publish is
  refused with a message naming the limit. Pass `status: "published"` for the
  old behaviour, and expect a refusal once you are at your plan's limit.
- Changed: `contact.set_properties` now accepts `key` as well as `propertyId` on
  each value, and its description explains what the tool is for. Agents only
  discover what the schema advertises, and requiring an opaque id lookup first
  was the friction that kept this tool unused. An empty `value` clears the
  property and restores its fallback.

## 0.11.2 (2026-08-25)

- Documented: the API now enforces your plan's analytics retention window on
  `from_date`. It is clamped to 30 days on most plans and 90 on Scale and
  Enterprise; a value reaching further back returns data from the start of that
  window rather than an error, and omitting it returns the window rather than
  all time. No code change is required — this release only makes the behaviour
  visible where you read it.
- Changed: the list and analytics responses now report the window actually used
  in `from_date`, so a clamped request is visible rather than silently short.
- Changed: the `from_date` description on `email.list` and `email.analytics`
  says so, because an agent only discovers what the schema advertises.

## 0.11.1 (2026-08-25)

- Fixed: `analytics.issue_performance`, `analytics.issue_trend` and the three
  issue CSV exports failed for every call that did not pass `range`. They
  defaulted to `all`, which the server stopped accepting — so an agent using the
  documented default got a validation error, and the tool schemas advertised
  `all` as a legal choice on top of that. The default is now `30d`, and `all` is
  gone from the type, the parser, its error message, the schemas and their
  descriptions. Present since 0.1.0 — `?? "all"` landed 2026-02-20 and the server
  dropped `all` on 2026-06-20, while this package was still 0.1.0. Every
  published version has carried it: 0.1.0, 0.1.1, 0.1.2, 0.2.0 and onward.

## 0.11.0 (2026-08-24)

- Changed: `email.get` returns `dropped_recipients`, naming any recipient the
  message did not reach and why, so an agent can tell a partially-delivered
  send from a fully-delivered one. `to`/`cc`/`bcc` remain what was asked for.

- Added: `custom_return_path` on `domain.update`. An agent can delegate a
  subdomain as the envelope sender so SPF aligns with the customer's own domain
  rather than ours. The tool states the DNS records to publish inline, since an
  agent has no other way to discover them, and mail keeps sending on the default
  return-path until they resolve.

- Changed: `email.send` and `email.batch` validate `to` / `cc` / `bcc` as email
  addresses and answer `400` on a malformed one, rather than accepting it and
  failing at the provider. `"Name" <address>` still works, and an empty `cc` or
  `bcc` array still means "no cc".

- Added: `tracking_open` and `tracking_click` on `email.send` and `email.batch`,
  and `open_tracking` / `click_tracking` on `domain.update`. An agent can now
  send an untracked message, or turn tracking off for a whole sending domain —
  which governs campaigns as well as transactional mail, and cannot be undone by
  an individual send.

## 0.10.0 (2026-08-22)

- Changed: `email.analytics` reports `open_rate` and `click_rate` against
  delivered mail (`sent - bounced`) rather than everything sent, so both read
  higher than before for the same data. `delivery_rate` and `bounce_rate` are
  unchanged. The tool description now states which denominator each rate uses.

- Added: `email.get` reports why a send failed. The retrieved email carries
  `error` and `failed_at`, and a failure now appears in the tool's summary line
  rather than only in the payload, so an agent asking about a failed send reads
  the reason first.

- Added: `image/svg+xml` is an accepted asset type for `assets.upload` — SVG
  logos and marks upload like any raster. The public asset route serves every
  asset with `Content-Security-Policy: sandbox`, which is what makes hosting
  SVGs safe: scripts inside one never execute, in an `<img>` or navigated to
  directly.

- Added: the `logo` site block is documented in the site-document help text.
  An empty `src` inherits the publication's own logo at render; `heightPx`
  sizes it and `href` (default `/`) links it. Agents discover blocks from that
  help, so without this entry the block existed and no agent could know.

- Added: `rename_nodes` op on `site.apply_ops` — labels nodes in the builder's
  layer tree (`renames: [{ nodeId, layerName }]`). Editor metadata only: the
  rendered page is byte-identical, so this changes nothing a visitor sees. It
  earns its place after `compose_page`, where a generated navbar is several
  nested groups and the operator otherwise opens the builder to a column of
  identical "Group" rows.

  The field is `layerName`, not `name`, because `icon` blocks already have a
  `name` that says WHICH glyph to draw. Sharing the key would have let renaming
  an icon's layer silently change the icon on the live site.

- Fixed: `set_navbar_template` is now advertised in the `site.apply_ops`
  schema. The op shipped in the reducer and `site.navbar_templates_list`
  described it ("apply one with the `set_navbar_template` op") while no tool
  schema ever declared it — so the tool recommending it pointed at something no
  agent could discover. The op-kind guard now derives from contracts instead of
  a hand-written list, which is what let it drift.

- **BREAKING — renamed: `preset` is now `template` across every site tool.**
  `site.presets_list` → `site.section_templates_list`, `site.navbar_presets_list` →
  `site.navbar_templates_list`, and the `presetId` / `fromPresetId` arguments on
  `site.apply_ops` (`insert_section`, `swap_section`, `compose_page`,
  `set_navbar_preset` → `set_navbar_template`) are now `templateId` /
  `fromTemplateId`. The `unknown_preset` skip reason is now `unknown_template`.
  There is no alias: calls using the old names fail validation.

  Why: operators read "template" everywhere in Mailtea — it names the `/templates`
  route and the site-setup gallery — while agents wrote `presetId`. One concept
  with a different word per persona is a tax the docs cannot pay off, so the
  agent surface moves to the word the product already uses.

  Migrating: rename the argument keys and tool names. Nothing else changes —
  the ids themselves (`hero-split`, `posts-grid`, …) are untouched, and no
  stored document carried a preset id, so existing sites are unaffected.

- Changed: `site.get` now states that the navbar and footer node ids it returns
  are addressable by `edit_copy` and `edit_style`. The capability shipped and
  the ids were already in the response, but nothing connected the two — an
  agent had to infer from the `nodeId` description that the chrome it had just
  read was editable.

- Changed: the `arrange` op's `parentId` description now says plainly that a
  SECTION move must omit it. In a design-eval run 17 of 19 skipped ops were
  section moves carrying a parent — 5 passing the literal string `"page"`,
  which is not a node, and 12 naming a real block id. Both were correctly
  refused; the schema simply never said which shape was expected.

- Added: `navStyle` on a `postHeader` — `"links" | "breadcrumb"`. A breadcrumb
  is a claim about STRUCTURE rather than a back button: it says where the post
  sits, so a reader can leave sideways instead of only retracing. Adjacent-issue
  links and the keyboard hint that promises them are dropped when it is on,
  because a path is not a pager. `eyebrow` also takes `"none"`, since a crumb
  already says where the reader is.

- Added: `align` and `eyebrow` on a `postHeader` block — `"left" | "center"` and
  `"text" | "chip"`. Together they are the article treatment: a label, a large
  title and its date on the page's axis, rather than a heading stacked at the
  left of a column. Both default to what every existing post page already
  renders, so turning it on is a choice rather than a migration.

- Added: `shadow` on the layout bag — `"none" | "sm" | "md" | "lg"`. A named
  elevation step rather than a raw shadow string, because an arbitrary offset
  and blur reads as a bug and there is no useful way to reason about
  `0 22px 50px -42px`. It also makes `"none"` mean something: base chrome puts a
  shadow on a post card, and until now no operator or agent could take it off,
  because the vocabulary had no property for it.

- Added: `tagFilter` on a `postCollection` — `{ mode: "none" | "chips",
  allLabel }`, reader-facing chips that narrow what is already on the page.
  Distinct from `categoryIds`, which is an AUTHORING filter deciding which posts
  are fetched: the author picks the pool, the reader picks within it. Offered
  only when the rendered posts carry more than one tag, so the chips can never
  be a control that changes nothing.

- Added: `pagination` on a `postCollection` — `{ mode: "none" | "loadMore",
  pageSize, buttonText }`. Reveal-style: the server renders every post the block
  asks for and the client collapses the list, so a reader without JavaScript
  sees them all rather than a truncated list behind a button that cannot work,
  and a crawler indexes them. It pages what is already on the page, so the
  ceiling is the block's `limit`; fetching past that needs a route and is a
  different feature.

- Added: `emptyState` on a `postCollection` — `{ headline, body, hidden }`.
  With no posts the block rendered its heading over an empty grid, which reads
  as broken rather than as waiting, and every brand-new publication starts
  there. Absent, a sensible default is rendered rather than nothing; `hidden`
  is the opt-out for a collection whose absence should be silent.

- Added: gradients. A `background` value may now be a `linear-gradient(...)` or
  `radial-gradient(...)` as well as a hex colour or `transparent`. Matched by an
  allowlist grammar — hex colours, percentage stops, angles and side keywords,
  and no parenthesis may appear inside, which rules out `url()`, `var()` and
  `expression()` without enumerating them. Previously a fill was one flat
  colour, so any brief asking for a wash or a fade was silently flattened.

- Added: `level` on `site.apply_ops` `edit_copy` edits. A heading's level was
  reachable by no op at all, so an agent handed a page whose h2 section holds h4
  items — which a screen reader reads as a missing section — could see the
  defect and had no way to repair it.

- Added: `site.footer_templates_list` and the `set_footer_template` op — a
  curated footer library, the counterpart to the navbar one. The shipped
  default footer is a single empty text node, and because structural ops do not
  address the chrome, an agent asked for a real footer had to hand-assemble
  every node, including the unsubscribe link a footer is obliged to carry.
  Every template but `footer-simple` ships that link.

- Added: eight more navbar templates (12 total), covering the trailing group
  (`navbar-split`, `navbar-links-right`, `navbar-center-links`), the bar
  treatment (`navbar-pill`, `navbar-inverted`) and wordmark position and row
  count (`navbar-brand-only`, `navbar-utility-bar`, `navbar-centered-cta`).

- Added: `part` on `site.edit_style`, taking `"band"` (the full-bleed strip) or
  `"inner"` (the centred content column). Without it a node could only be
  styled as a single box, so chrome that does not span the full width — a
  floating pill navbar — was inexpressible: set the band to `transparent`, then
  give the node itself a background, `radiusPx` and `maxWidthPx`.
- Changed: `site.edit_style` and `site.edit_copy` now accept the shared
  navbar/footer node ids, which `site.read_page` reports alongside the page
  sections. Previously the reducer indexed the page only and rejected them as
  `unknown_node`, so every generated design inherited the previous site's
  chrome. Both trees are site-wide — a change shows on every page — and
  `site.arrange` still refuses them, since neither root sits in the page's
  section list.
- Removed: `highlightColor` from the `site.edit_style` property list. It was
  declared in the site document schema and advertised in the tool description
  from the first Website Builder V3 commit, but the renderer never emitted it —
  an agent that set it got a silent no-op and no `unknown_path` skip to learn
  from, because the reducer recognised the key. Nothing in the shipped
  templates or any stored document used it. Removing it means an agent setting
  `highlightColor` now gets a proper skip report instead of silence.

## 0.8.0 (2026-08-06)

- Added: `set_styles` reaches the typography an agent could not state before —
  `bodyFontSizePx` (14-24), `titleFontSizePx` (16-72, which sets the whole
  heading scale), `textOnAccentColor` (the label drawn on the button), and
  `linkDecoration` (`underline` | `none`). Sizes are range-checked rather than
  clamped, so a refusal names the range instead of silently shipping a size
  nobody asked for. `linkDecoration` exists because a link told apart by colour
  alone fails WCAG 1.4.1 and there was no way to fix that from an op.

## 0.7.0 (2026-08-06)

- Fixed: the server reported `"version": "0.2.0"` in the `initialize`
  handshake, and had done through five releases — every client that asked was
  told something false. It now reports the package version, and a test ties the
  two together so it cannot drift again.
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
