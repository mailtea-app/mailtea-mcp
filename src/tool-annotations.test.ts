import assert from "node:assert/strict";
import test from "node:test";
import { MCP_TOOLS, handleMcpRequest } from "./index.js";

/**
 * The behaviour hints every tool advertises (MCP `ToolAnnotations`).
 *
 * Clients act on these without reading the code: ChatGPT and Claude decide
 * what needs a confirmation from them, and the OpenAI plugin directory review
 * scans the served list and checks each hint against what the tool does. A
 * send marked non-destructive is the failure that matters most, so the sends,
 * the deletes and the consent changes are named here one by one, and the name
 * patterns below catch a new tool that joins one of those families without
 * saying so. Any other write that changes existing data is destructive too:
 * only a purely additive create is not (Anthropic connector review, audit
 * 2026-10-06).
 *
 * Self-contained on purpose (no `-parity` suffix, nothing read from outside the
 * package), so it ships with the standalone mailtea-mcp mirror.
 */

type Hints = {
  readOnlyHint: boolean;
  destructiveHint: boolean;
  idempotentHint: boolean;
  openWorldHint: boolean;
};

type AnnotatedTool = {
  name: string;
  title?: unknown;
  annotations?: Partial<Hints> & { title?: unknown };
};

const TOOLS = MCP_TOOLS as unknown as ReadonlyArray<AnnotatedTool>;
const HINT_KEYS = ["readOnlyHint", "destructiveHint", "idempotentHint", "openWorldHint"] as const;

/** The four hints alone (annotations also carries the title). */
function hints(name: string): Hints {
  const tool = TOOLS.find((candidate) => candidate.name === name);
  assert.ok(tool, `expected an MCP tool named ${name}`);
  const annotations = (tool.annotations ?? {}) as Hints;
  return {
    readOnlyHint: annotations.readOnlyHint,
    destructiveHint: annotations.destructiveHint,
    idempotentHint: annotations.idempotentHint,
    openWorldHint: annotations.openWorldHint
  };
}

/** The part after the family: `send_now` for `issue.send_now`. */
function action(name: string): string {
  return name.slice(name.indexOf(".") + 1);
}

/** Every tool that puts email in someone's inbox, now or later. */
const SENDS = [
  "email.send",
  "email.batch",
  "email.resend",
  "email.inbound_reply",
  "issue.send_now",
  "issue.send_and_wait",
  "issue.send_test",
  "issue.schedule",
  // Starts automations, whose send_email steps mail the contact.
  "event.send"
];

/** Tools that change whether a person can be emailed. */
const CONSENT_CHANGES = [
  "suppression.add",
  "suppression.remove",
  "contact.set_status",
  // Reactivates an unsubscribed contact and clears the opt out.
  "contact.upsert",
  "contact.import_csv"
];

/** Tools that look records up in public DNS. */
const DNS_CHECKS = [
  "publication.domain_verify",
  "domain.verify",
  "domain.claim_verify",
  "domain.tracking_verify"
];

/** Tools that change what the public website serves. */
const PUBLIC_WEB = [
  "issue.publish_to_web",
  "issue.unpublish_from_web",
  "site.publish",
  "site.page_upsert"
];

/**
 * Tools that overwrite or clear saved work with no history to get it back
 * from: publishing replaces live content, a brief has no versions, an
 * unpublish loses the archive order, a tracking verify deletes the other
 * tracking subdomains, an import overwrites sections of the same name.
 */
const HIGH_STAKES = [
  "site.publish",
  "site.design_brief_set",
  "issue.unpublish_from_web",
  "domain.tracking_verify",
  "section.import_pack",
  "template.unpublish"
];

/** Tools that append a revision or version row on every call. */
const APPENDS_HISTORY = [
  "section.pack_update",
  "section.pack_restore_revision"
];

/**
 * Reads by name that are NOT read only: the first page read for a publication
 * seeds its reserved pages with their default documents, which is a write.
 */
const READS_THAT_WRITE = ["site.pages_list", "site.page_get"];

/**
 * The only writes that are not destructive: each creates something new and
 * touches nothing that already exists. Anthropic's connector review wants
 * "destructiveHint true for tools that modify or delete data", and the MCP
 * spec reads false as "only additive updates", so everything else that writes
 * is destructive. `sender.create` is not here: isDefault demotes the current
 * default sender.
 */
const PURELY_ADDITIVE = [
  "issue.create_draft",
  "publication.create",
  "section.pack_create",
  "section.create",
  "template.create",
  "template.duplicate",
  "domain.create",
  "domain.claim",
  "domain.tracking_create",
  "webhook.create",
  "segment.create",
  "contact_property.create",
  "topic.create",
  "api_key.create",
  "automation.create",
  "event_definition.create",
  "site.asset_upload",
  ...READS_THAT_WRITE
];

const READ_ACTION = /(^|_)(list|get|search|export|preview|render|validate|lint)(_|$)/;
const WRITE_ACTION =
  /(^|_)(create|update|upsert|set|add|import|upload|duplicate|restore|apply|publish|unpublish|schedule|unschedule|enable|disable|verify|claim|send|resend|reply|delete|remove|revoke|cancel|archive|discard)(_|$)/;
const REMOVAL_ACTION = /(^|_)(delete|remove|revoke|cancel|archive|discard)(_|$)/;
const SEND_ACTION = /^(re)?send(_|$)/;

test("every tool states a title and all four hints as booleans", () => {
  assert.ok(TOOLS.length > 0);
  for (const tool of TOOLS) {
    assert.equal(typeof tool.title, "string", `${tool.name} has no title`);
    assert.ok((tool.title as string).trim().length > 0, `${tool.name} has an empty title`);
    assert.ok(tool.annotations, `${tool.name} has no annotations`);
    assert.equal(
      tool.annotations.title,
      tool.title,
      `${tool.name}: annotations.title must match the top-level title`
    );
    for (const key of HINT_KEYS) {
      assert.equal(
        typeof tool.annotations[key],
        "boolean",
        `${tool.name} does not state ${key}; an absent hint means the spec default, which is the least safe reading`
      );
    }
  }
});

test("titles are unique, so a client listing tools can tell them apart", () => {
  const seen = new Map<string, string>();
  for (const tool of TOOLS) {
    const title = tool.title as string;
    assert.ok(!seen.has(title), `${tool.name} and ${seen.get(title)} share the title "${title}"`);
    seen.set(title, tool.name);
  }
});

test("no tool is both read only and destructive", () => {
  for (const tool of TOOLS) {
    const { readOnlyHint, destructiveHint } = hints(tool.name);
    assert.ok(!(readOnlyHint && destructiveHint), `${tool.name} is marked both read only and destructive`);
  }
});

test("a read-only tool is idempotent and not destructive", () => {
  for (const tool of TOOLS) {
    const h = hints(tool.name);
    if (!h.readOnlyHint) continue;
    assert.equal(h.idempotentHint, true, `${tool.name} is read only, so repeating it changes nothing`);
    assert.equal(h.destructiveHint, false, `${tool.name} is read only`);
  }
});

test("every write is destructive unless it only adds something new", () => {
  const additive = new Set(PURELY_ADDITIVE);
  for (const tool of TOOLS) {
    const h = hints(tool.name);
    if (h.readOnlyHint) continue;
    assert.equal(
      h.destructiveHint,
      !additive.has(tool.name),
      additive.has(tool.name)
        ? `${tool.name} only creates something new, so it is not destructive`
        : `${tool.name} changes or deletes existing data, so it must be marked destructive`
    );
  }
  // Each family the audit found marked non-destructive, by name.
  for (const name of [
    "issue.update_draft",
    "issue.apply_ops",
    "issue.unschedule",
    "issue.publish_to_web",
    "template.update",
    "template.publish",
    "template.restore_version",
    "site.apply_ops",
    "sender.update",
    "sender.set_default",
    "sender.create",
    "email.reschedule",
    "domain.verify",
    "publication.domain_verify",
    "contact.set_properties",
    "automation.update",
    "monetize.offer_upsert"
  ]) {
    assert.equal(hints(name).destructiveHint, true, name);
  }
});

test("a tool named like an update, upsert, set, restore, publish or verify is destructive", () => {
  const modifying = /(^|_)(update|upsert|set|restore|apply|publish|unschedule|reschedule|verify)(_|$)/;
  const named = TOOLS.map((tool) => tool.name).filter((name) => modifying.test(action(name)));
  assert.ok(named.includes("template.update") && named.includes("site.apply_ops"));
  for (const name of named) {
    assert.equal(hints(name).destructiveHint, true, `${name} modifies existing data`);
  }
});

test("every send is destructive, open world and not idempotent", () => {
  for (const name of SENDS) {
    assert.deepEqual(
      hints(name),
      { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true },
      `${name} sends email that cannot be recalled`
    );
  }
  // Switches sending on rather than sending once: enabling twice changes
  // nothing more, but every contact it enrolls from then on is emailed.
  assert.deepEqual(
    hints("automation.enable"),
    { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true }
  );
});

test("a tool named like a send is on the send list", () => {
  const named = TOOLS.map((tool) => tool.name).filter((name) => SEND_ACTION.test(action(name)));
  // A pattern that quietly matched nothing would make this test a no-op.
  assert.ok(named.includes("email.send") && named.includes("issue.send_now"));
  for (const name of named) {
    assert.ok(SENDS.includes(name), `${name} looks like a send; add it to SENDS and mark it destructive`);
  }
});

test("every delete, remove, revoke, cancel, archive or discard is destructive", () => {
  const removals = TOOLS.map((tool) => tool.name).filter((name) => REMOVAL_ACTION.test(action(name)));
  for (const expected of [
    "contact.delete",
    "template.delete",
    "domain.delete",
    "api_key.revoke",
    "email.cancel",
    "automation_run.cancel",
    "automation.archive",
    "site.discard_draft",
    "issue.remove_draft"
  ]) {
    assert.ok(removals.includes(expected), `the removal pattern no longer matches ${expected}`);
  }
  for (const name of removals) {
    const h = hints(name);
    assert.equal(h.readOnlyHint, false, `${name} removes something`);
    assert.equal(h.destructiveHint, true, `${name} removes something and must be marked destructive`);
    // A second delete finds nothing to delete: no further effect.
    assert.equal(h.idempotentHint, true, `${name}: repeating a removal has no further effect`);
  }
});

test("suppressions, bans and unsubscribes are destructive", () => {
  for (const name of CONSENT_CHANGES) {
    assert.equal(hints(name).destructiveHint, true, `${name} changes whether someone can be emailed`);
    assert.equal(hints(name).readOnlyHint, false, name);
  }
});

test("public DNS checks and public website changes are open world", () => {
  for (const name of [...DNS_CHECKS, ...PUBLIC_WEB]) {
    assert.equal(hints(name).openWorldHint, true, `${name} reaches outside Mailtea`);
    assert.equal(hints(name).readOnlyHint, false, name);
  }
  const verifies = TOOLS.map((tool) => tool.name).filter((name) => /(^|_)verify$/.test(action(name)));
  for (const name of verifies) {
    assert.ok(DNS_CHECKS.includes(name), `${name} looks like a DNS check; add it to DNS_CHECKS`);
  }
});

test("reads are read only and writes are not, by name", () => {
  for (const tool of TOOLS) {
    const verb = action(tool.name);
    const { readOnlyHint } = hints(tool.name);
    if (READS_THAT_WRITE.includes(tool.name)) {
      assert.equal(readOnlyHint, false, `${tool.name} creates the reserved pages on first read`);
    } else if (READ_ACTION.test(verb)) {
      assert.equal(readOnlyHint, true, `${tool.name} reads, so it should be read only`);
    } else if (WRITE_ACTION.test(verb)) {
      assert.equal(readOnlyHint, false, `${tool.name} writes, so it cannot be read only`);
    }
  }
});

test("tools that overwrite or clear work without history are destructive", () => {
  for (const name of HIGH_STAKES) {
    assert.equal(hints(name).destructiveHint, true, `${name} overwrites or clears work with no way back`);
  }
});

test("tools that append a revision on every call are not idempotent", () => {
  for (const name of APPENDS_HISTORY) {
    assert.equal(hints(name).idempotentHint, false, `${name} adds a revision each call`);
  }
  // Checks RDAP and public DNS, then provisions with outside providers.
  assert.equal(hints("domain.create").openWorldHint, true);
  // A purpose change attaches or detaches the public site edge; delete also removes the sending identity.
  assert.equal(hints("domain.update").openWorldHint, true);
  assert.equal(hints("domain.delete").openWorldHint, true);
  // An identical restore writes nothing; an import upserts by name.
  assert.equal(hints("template.restore_version").idempotentHint, true);
  assert.equal(hints("section.import_pack").idempotentHint, true);
});

test("pinned judgment calls", () => {
  // Scheduling is a send, just a later one: nothing checks again at send time.
  assert.equal(hints("issue.schedule").destructiveHint, true);
  // Publishing replaces live content that history never saved.
  assert.equal(hints("site.publish").destructiveHint, true);
  // Changes what the public archive shows for an existing post.
  assert.equal(hints("issue.publish_to_web").destructiveHint, true);
  // Writes the LIVE row of a published page, not the draft.
  assert.equal(hints("site.page_upsert").destructiveHint, true);
  // Mutations that persist nothing.
  assert.equal(hints("issue.preview_draft").readOnlyHint, true);
  assert.equal(hints("automation.validate").readOnlyHint, true);
  assert.equal(hints("template.render").readOnlyHint, true);
  // A webhook sends event data to a URL outside Mailtea.
  assert.equal(hints("webhook.create").openWorldHint, true);
  // Website domains provision and detach outside providers, as domain.create and domain.delete do.
  assert.equal(hints("publication.domain_upsert").openWorldHint, true);
  assert.equal(hints("publication.domain_remove").openWorldHint, true);
  // Detaches the tracking host from the edge that serves it.
  assert.equal(hints("domain.tracking_delete").openWorldHint, true);
  // A steps update to an active automation goes live at once and can email contacts.
  assert.equal(hints("automation.update").openWorldHint, true);
  // Draft edits overwrite saved work, so they are destructive, but they stay
  // inside Mailtea until something sends or publishes them.
  for (const name of ["issue.update_draft", "issue.apply_ops", "site.apply_ops", "template.update"]) {
    assert.equal(hints(name).destructiveHint, true, name);
    assert.equal(hints(name).openWorldHint, false, name);
  }
});

test("tools/list serves every tool with its title and hints", async () => {
  const reply = await handleMcpRequest({ jsonrpc: "2.0", id: 1, method: "tools/list" });
  // Through JSON, as a client receives it.
  const served = JSON.parse(JSON.stringify(reply)) as {
    result: { tools: Array<{ name: string; title?: string; annotations?: Record<string, unknown> }> };
  };
  assert.equal(served.result.tools.length, TOOLS.length);
  for (const tool of TOOLS) {
    const listed = served.result.tools.find((candidate) => candidate.name === tool.name);
    assert.ok(listed, `${tool.name} missing from tools/list`);
    assert.equal(listed.title, tool.title, tool.name);
    assert.deepEqual(listed.annotations, tool.annotations, tool.name);
  }
});
