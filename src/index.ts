/**
 * Analytics windows the server accepts, and the default when a tool omits one.
 *
 * LITERALS, not an import. `packages/mcp` deliberately takes no runtime
 * dependency on `@mailtea/contracts` — it is mirrored to a standalone repo that
 * has no workspace to resolve, and importing one here breaks that mirror's
 * build ("src/index.ts imports a workspace package"). These must be updated in
 * lockstep with `ISSUE_ANALYTICS_RANGES` / `DEFAULT_ISSUE_ANALYTICS_RANGE`
 * there; `mcp-range-parity.test.ts` imports the real ones and fails on drift,
 * and tests are stripped from the mirror so it may import freely.
 */
export const ISSUE_ANALYTICS_RANGES = ["24h", "7d", "30d"] as const;
export const DEFAULT_ISSUE_ANALYTICS_RANGE = "30d" as const;

export type JsonRpcId = string | number | null;

export type JsonRpcRequest = {
  jsonrpc: "2.0";
  id?: JsonRpcId;
  method: string;
  params?: Record<string, unknown>;
};

export type JsonRpcResponse = {
  jsonrpc: "2.0";
  id: JsonRpcId;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
};

export type McpRuntimeOptions = {
  apiBaseUrl?: string;
  token?: string | null;
  /**
   * The publication this connection is for — the OAuth grant's publication over
   * the hosted endpoint, or the one a publication-scoped key was minted for.
   * Tools that take a `publicationId` fall back to it when the caller omits one.
   */
  publicationId?: string | null;
  /**
   * May `MAILTEA_PUBLICATION_ID` in this process supply that default?
   *
   * TRUE for stdio and the CLI, where the process belongs to one person and the
   * variable is how they say which publication they mean. FALSE for the hosted
   * server, where ONE process answers for every tenant: a variable set there
   * (copied from a smoke-test env, say) would silently become the default
   * publication for callers who have nothing to do with it, and a team-scoped
   * key — which passes the publication check precisely because it is scoped to
   * none — would read it without being refused. Such a caller must keep naming
   * the publication it means.
   *
   * Defaults to true, so every existing embedder keeps the behaviour it has.
   */
  envPublicationFallback?: boolean;
  /**
   * Set by a host that has already resolved the caller's credential, and read
   * only when a tool call names no publication and `publicationId` is empty.
   *
   * - Omitted (stdio, the CLI): the runtime asks `auth.me` with the caller's
   *   token, once per token per minute.
   * - An array (the hosted endpoint, for a team-scoped personal key): the
   *   publications the error may list so the agent can pick one. No request
   *   is made; the host already chose the default when there was exactly one.
   * - null: the host found nothing it may offer (a service key, or a key whose
   *   person no longer belongs to the key's team). The error just says to pass
   *   the id.
   *
   * A host answering for many tenants sets this so the runtime never calls
   * back into the API about a caller through its own base URL.
   */
  reachablePublications?: ReadonlyArray<{ id: string; name: string }> | null;
  fetchImpl?: typeof fetch;
};

type TrpcEnvelope<T> = {
  result?: { data?: T };
  error?: { message?: string; data?: unknown };
};

type IssueRecord = {
  id: string;
  publicationId: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  scheduledAt?: string | null;
  sentAt?: string | null;
  deliveryTotal?: number;
  deliverySent?: number;
  deliveryFailed?: number;
};

type IssuePreview = {
  issueId: string;
  title: string;
  html: string;
};

type IssueDraftPreview = {
  publicationId: string;
  publicationName: string;
  title: string;
  html: string;
  text: string;
};

type IssueEditor = {
  id: string;
  publicationId: string;
  title: string;
  status: string;
  contentJson: Record<string, unknown>;
  /** Addressable blocks — the paths `issue.apply_ops` takes. */
  outline: Array<{ path: string; type: string; text?: string }>;
  styles: Record<string, string>;
  headers: { subject?: string; previewText?: string };
  docBacked: boolean;
  createdAt: string;
  updatedAt: string;
  scheduledAt: string | null;
  sentAt: string | null;
};

type EmailOpsSkipRecord = {
  opIndex: number;
  reason: string;
  path?: string;
  detail?: string;
};

type EmailOpsReportRecord = {
  applied: number;
  skipped: EmailOpsSkipRecord[];
  outline?: { blocks: Array<{ path: string; type: string; text?: string }> };
};

type EmailLintFinding = {
  slug: string;
  severity: "fail" | "warn";
  feature: string;
  clients: string[];
};

type IssueDraftRemoveResult = {
  removed: boolean;
  issueId: string;
  publicationId: string;
};

type IssueDeliveryProgress = {
  issueId: string;
  publicationId: string;
  status: string;
  updatedAt: string;
  sentAt: string | null;
  delivery: {
    total: number;
    sent: number;
    failed: number;
    pending: number;
    processed: number;
    completionPercent: number;
    hasSnapshot: boolean;
    isPreparing: boolean;
  };
};

type ContactReferralSummary = {
  publicationId: string;
  totalReferrals: number;
  leaders: Array<{
    contactId: string;
    email: string;
    referralCount: number;
    latestReferralAt: string | null;
  }>;
};

type ContactStatus = "active" | "unsubscribed" | "suppressed";

type ContactRecord = {
  id: string;
  email: string;
  status: ContactStatus;
  createdAt: string;
  updatedAt: string;
};

type ContactImportCsvResult = {
  publicationId: string;
  sourceRowCount: number;
  validUniqueCount: number;
  createdCount: number;
  reactivatedCount: number;
  alreadyActiveCount: number;
  suppressedCount: number;
  invalidCount: number;
  blankCount: number;
  duplicateCount: number;
  invalidSamples: string[];
  /** Enrollments the import created. 0 unless `enrollInAutomations` was true. */
  enrolledAutomations?: number;
  /** Header names of columns the import did not read, at most 20. Absent on older servers. */
  ignoredColumns?: string[];
  /** How many columns were ignored in all, when there were more than it names. */
  ignoredColumnCount?: number;
};

type ReferralMilestoneRecord = {
  id: string;
  publicationId: string;
  title: string;
  description: string;
  referralCount: number;
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

type ReferralRewardRecord = {
  id: string;
  publicationId: string;
  contactId: string;
  contactEmail: string;
  milestoneId: string;
  milestoneTitle: string;
  milestoneDescription: string;
  milestoneReferralCount: number;
  awardedAt: string;
};

type SponsorOfferStatus = "draft" | "active" | "paused" | "archived";
type SponsorOfferPricingModel = "flat" | "cpm";

type SponsorOfferRecord = {
  id: string;
  publicationId: string;
  createdByUserId: string | null;
  title: string;
  sponsorName: string;
  description: string;
  pricingModel: SponsorOfferPricingModel;
  rateCents: number;
  estimatedPlacements: number;
  status: SponsorOfferStatus;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type SponsorOfferUpsertResult = {
  offer: SponsorOfferRecord;
};

type SponsorOfferRemoveResult = {
  removed: boolean;
  offerId: string;
};

type IssuePollResults = {
  issueId: string;
  publicationId: string;
  polls: Array<{
    pollId: string;
    question: string;
    totalVotes: number;
    options: Array<{
      option: string;
      votes: number;
    }>;
  }>;
};

type IssueAnalytics = {
  issueId: string;
  publicationId: string;
  range: IssueAnalyticsRange;
  since: string | null;
  opens: {
    total: number;
    unique: number;
  };
  clicks: {
    total: number;
    unique: number;
  };
  topLinks: Array<{
    url: string;
    clicks: number;
  }>;
};

type IssueAnalyticsCsv = {
  exportType: "combined" | "performance" | "polls";
  filename: string;
  rowCount: number;
  csv: string;
};

type IssueAnalyticsTrend = {
  issueId: string;
  publicationId: string;
  range: IssueAnalyticsRange;
  since: string | null;
  points: Array<{
    date: string;
    opens: {
      total: number;
      unique: number;
    };
    clicks: {
      total: number;
      unique: number;
    };
  }>;
};

type LatestAnalyticsSummary =
  | {
      status: "missing_publication_context";
      message: string;
      exampleUri: string;
    }
  | {
      status: "no_issues";
      generatedAt: string;
      publicationId: string;
      range: IssueAnalyticsRange;
    }
  | {
      status: "ok";
      generatedAt: string;
      publicationId: string;
      range: IssueAnalyticsRange;
      issue: {
        id: string;
        title: string;
        status: string;
        sentAt: string | null;
        updatedAt: string;
      };
      analytics: IssueAnalytics;
      polls: {
        pollCount: number;
        totalVotes: number;
        polls: IssuePollResults["polls"];
      };
    };

type LatestAnalyticsSummaryApi = Exclude<
  LatestAnalyticsSummary,
  { status: "missing_publication_context" }
>;

type IssueAnalyticsExportType = "combined" | "performance" | "polls";

type ReusableSectionRecord = {
  id: string;
  publicationId: string;
  userId: string;
  name: string;
  contentJson: unknown;
  createdAt: string;
  updatedAt: string;
};

type SectionPackRecord = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  source: "builtin" | "custom";
  createdByUserId: string | null;
  styleProfile?: Record<string, unknown>;
  sections: Array<{
    name: string;
    contentJson: unknown;
  }>;
};

type SectionPackCreateResult = {
  pack: SectionPackRecord;
};

type SectionPackRemoveResult = {
  removed: boolean;
  packId: string;
};

type SectionPackRevisionRecord = {
  id: string;
  packId: string;
  publicationId: string;
  version: number;
  title: string;
  description: string;
  tags: string[];
  styleProfile?: Record<string, unknown>;
  sections: Array<{
    name: string;
    contentJson: unknown;
  }>;
  createdByUserId: string | null;
  createdAt: string;
};

/**
 * Imported, not restated. MCP kept its own copy of this union; when `all` was
 * removed from the server's enum the copy kept it, and five tools defaulted to
 * a value the server rejects for nine releases. A shared constant makes that a
 * compile error instead of a 400 an agent discovers at runtime.
 */
type IssueAnalyticsRange = (typeof ISSUE_ANALYTICS_RANGES)[number];

type PublicationDomainRecord = {
  id: string;
  publicationId: string;
  host: string;
  status: "pending" | "verified";
  isPrimary: boolean;
  verificationTxtName: string;
  verificationTxtValue: string;
  proxyTarget: string;
  verifiedAt: string | null;
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

type PublicationDomainUpsertResult = {
  domain: PublicationDomainRecord;
};

type SenderRecord = {
  id: string;
  publicationId: string;
  name: string;
  email: string;
  replyTo: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

type SenderMutationResult = {
  sender: SenderRecord | null;
};

type SenderRemoveResult = {
  removed: boolean;
  senderId: string;
};

type SuppressionListResponse = {
  object: "list";
  data: Array<{
    object: "suppression";
    id: string;
    email: string;
    reason: string;
    source: string;
    publication_id: string | null;
    created_at: string;
  }>;
  has_more: boolean;
  next_cursor?: string;
};

type PublicationWorkspaceRecord = {
  id: string;
  name: string;
  timezone: string;
  memberRole: "owner" | "admin" | "editor" | "viewer";
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
};

type PublicationCreateResult = {
  publication: PublicationWorkspaceRecord;
};

type PublicationDomainRemoveResult = {
  removed: boolean;
  domainId: string;
};

type PublicationDomainTraefikPreview = {
  publicationId: string;
  generatedAt: string;
  configYaml: string;
  entries: Array<{
    id: string;
    host: string;
    status: "pending" | "verified";
    isPrimary: boolean;
    proxyTarget: string;
    traefikRouterKey: string;
    traefikRule: string;
  }>;
};

type SectionPackRestoreRevisionResult = {
  pack: SectionPackRecord;
  restoredFrom: SectionPackRevisionRecord;
  createdRevision: SectionPackRevisionRecord;
};

type SectionImportResult = {
  templateId: string;
  createdCount: number;
  updatedCount: number;
  imported: ReusableSectionRecord[];
};

type AiDraft = {
  title?: string;
  content?: Array<{ type?: string; text?: string }>;
};

type AuthMe = {
  userId: string | null;
  role: "owner" | "admin" | "editor" | "viewer";
  tokenType: "bootstrap" | "session" | "pat" | "service" | null;
  scopes: string[];
};

/** A row from `publication.sitePages`. `contentJson` is the LIVE document. */
type SitePageRecord = {
  id: string;
  publicationId: string;
  kind: string;
  status: string;
  slug: string;
  title: string;
  contentJson: unknown;
  draftContentJson?: unknown;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoOgImageUrl?: string | null;
  updatedAt?: string;
};

type SiteSettingsRecord = {
  settings:
    | (Record<string, unknown> & {
        siteDesign?: unknown;
        draftSiteDesign?: unknown;
        designBrief?: string | null;
      })
    | null;
  hasUnpublishedChanges?: boolean;
  designBrief: string | null;
  draftVersion: number;
};

/**
 * The site-ops reducer's verdict. `skipped` is the honesty layer — it names
 * every edit that did NOT apply and why, and it is handed to the model
 * verbatim, so it must never be summarized away in a tool result.
 */
type SiteOpsReportRecord = {
  applied: number;
  skipped: Array<{
    opIndex: number;
    op: string;
    reason: string;
    detail?: string;
  }>;
};

type SiteTemplateRecord = {
  id: string;
  category: string;
  name: string;
  description: string;
  slots: Array<Record<string, unknown>>;
};

type TrpcProcedureType = "query" | "mutation";

// Defaults to Mailtea cloud so `npx mailtea-mcp` works with just a token.
// Self-hosters and local dev override via MAILTEA_API_BASE_URL.
const DEFAULT_API_BASE_URL = "https://api.mailtea.app";

// --- Automations -----------------------------------------------------------
// The automation/event tools take snake_case arguments (publication_id,
// automation_id, …) rather than the camelCase used by every other tool here.
// The graph is forwarded to the REST API verbatim and its own keys are
// snake_case, so mixing the two casings inside one payload is a trap.

/** Required/optional `config` keys per step type. Inlined into tool descriptions. */
const AUTOMATION_STEP_CONFIG_HELP =
  "Step config by type. trigger: {trigger_type, trigger_key?, filter?}; delay: {duration, unit} (unit: seconds|minutes|hours|days|weeks, max 365 days); condition: {rule}; wait_for_event: {event_name, timeout_seconds, filter?} (max 90 days); send_email: {template_id, sender_id?, subject?, reply_to?, variables?}; topic_add: {topic_id}; topic_remove: {topic_id}; segment_add: {segment_id} (member-list segments only: a segment with a status_filter, query_filter or inactive_days is refused with segment_is_filter); segment_remove: {segment_id}; contact_update: {properties}; http_request: {url, method?, headers?, body?, timeout_seconds?}; exit: {reason?}.";

/** Trigger catalog, inlined into the graph-authoring tool descriptions. */
const AUTOMATION_TRIGGER_HELP =
  "Trigger types: contact.created, contact.subscribed, contact.unsubscribed, topic.subscribed, topic.unsubscribed, event, email.opened, email.clicked, email.received — topic.subscribed and topic.unsubscribed take trigger_key = topic id, event takes trigger_key = event name.";

// Two resources, because they answer different questions and an agent pointed at
// only the first has to guess the rule node shape — it lives exclusively in the
// second.
const AUTOMATION_CATALOG_HELP =
  "Two machine-readable resources back these tools: mailtea://automations/step-types is the catalog of trigger types, step types, config shapes, branch labels, limits and validation codes; mailtea://automations/condition-fields is the rule DSL a condition step's config.rule and any filter must follow — operators, addressable field namespaces, value references and the rule node shapes themselves. Read both before authoring a branching graph.";

const AUTOMATION_SNAKE_CASE_HELP =
  "Arguments are snake_case — a deliberate deviation from the camelCase used by other Mailtea MCP tools, because the graph is forwarded to the REST API verbatim.";

/**
 * The `schema_json` grammar, inlined into both event_definition write tools and
 * served in the condition-fields resource. It mirrors `EventSchemaDocument` and
 * `validateEventSchemaDocument` in `@mailtea/contracts`, which reject every key
 * outside this vocabulary — so an agent that reaches for JSON Schema by reflex
 * gets a 400, and the description is the only place it can learn otherwise.
 */
const EVENT_SCHEMA_DOCUMENT_HELP = `schema_json is a Mailtea event schema document, NOT JSON Schema: the reflex attempt {"type": "object", "properties": {...}, "required": [...]} is refused with invalid_event_schema (Unknown schema key "type", Unknown schema key "required") — "type" and "required" belong on each PROPERTY, never at the top level. The only top-level keys are "properties" (an object keyed by property name, max 200) and "additional_properties" (boolean, DEFAULT TRUE — a schema documents what it knows about without closing the payload; set it false to reject undeclared keys). Each declared property accepts only {type?, required?, description?}: "type" is one of string, number, boolean, object, array, null — or an ARRAY of those, the same shape event_definition.get returns in inferred_properties; "required" is a boolean; "description" is a string. Example: {"properties": {"plan": {"type": "string", "required": true, "description": "Plan the contact bought"}, "seats": {"type": ["number", "null"]}}, "additional_properties": false}.`;

/**
 * The `editor_doc` vocabulary, inlined into both template write tools.
 *
 * `format: "editor"` is the format the Visual Email Designer writes, and an
 * agent can only reach it if the schema says so — the whole point of this
 * surface is that a template authored by an agent and one designed by an
 * operator are the same row. The node list is deliberately concrete: a TipTap
 * document is structurally uniform, so an agent that only knows "pass a doc"
 * guesses node types that render to nothing and gets an empty email.
 *
 * Described in prose rather than as a nested `oneOf` per node type, for the same
 * reason `AUTOMATION_STEPS_SCHEMA` keeps `config` flat: MCP clients vary in how
 * much JSON Schema they honour, and discriminated unions are where they break.
 */
const EDITOR_DOC_HELP = `editor_doc is a TipTap/ProseMirror document — {"type":"doc","content":[ ...block nodes ]} — and the server renders the email HTML from it and stores that, so do NOT send html alongside it. Every node is {"type":"...","attrs":{...},"content":[...]}. Block nodes that render: paragraph, heading (attrs.level 1-6), bulletList / orderedList / listItem, blockquote, horizontalRule, image (attrs.src, attrs.alt), button (attrs.href, attrs.variant "filled"|"outline", attrs.alignment "left"|"center"|"right", attrs.fullWidth), spacer (attrs.height "sm"|"md"|"lg"|"xl"), table, twoColumns / threeColumns / fourColumns each wrapping columnsColumn children, linkCard, logo, footer, htmlCodeBlock, section. Text is {"type":"text","text":"..."} carrying optional marks: bold, italic, underline, strike, code, sub, sup, textStyle, and link (attrs.href). A "subtitle" string on the doc root becomes the inbox preview text. Minimal example: {"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Hello"}]},{"type":"paragraph","content":[{"type":"text","text":"Welcome aboard."}]}]}. These node types render to NOTHING in email and their content is lost: youtube, xPost, threadsPost, codeBlock (use htmlCodeBlock for raw HTML); repeat and showIfKey render their content once, without the repetition or the condition. A document that renders to an empty email is refused with 400 editor_doc_unrenderable, and the response names the offending types in node_types. Bounds: 512 KB serialized, 256 KB per string, 40 levels deep.`;

/**
 * `editor_doc` plus the fidelity sidecars that `html` alone cannot carry. Shared
 * verbatim by `template.create` and `template.update` so the two can never
 * advertise different fields for the same column set.
 */
const TEMPLATE_EDITOR_PROPERTIES = {
  editor_doc: {
    type: "object",
    description:
      'Visual Email Designer document, {"type":"doc","content":[...]}. Use INSTEAD OF html/spec — the server renders and stores the email HTML from it. See the tool description for the node vocabulary.',
    properties: {
      type: { type: "string", description: 'Always "doc".' },
      content: {
        type: "array",
        description: "Ordered block nodes. Must not be empty.",
        items: { type: "object" }
      },
      subtitle: { type: "string", description: "Inbox preview text (preheader)." }
    },
    required: ["type", "content"]
  },
  style_profile: {
    type: "object",
    description:
      "Colors, fonts and widths the design renders against: fontFamily, bodyBackground, cardBackground, textColor, headingColor, accentColor, textOnAccentColor, secondaryColor, linkColor, titleFontSizePx, bodyFontSizePx, borderRadiusPx, contentWidthPx, contentPaddingPx. Omit for the default profile."
  },
  mailtea_theme: {
    type: "object",
    description:
      "Editor theme stored alongside the design so reopening it in the Visual Email Designer is lossless. Nothing to author by hand — pass back what template.get returned."
  },
  global_css: {
    type: "string",
    description: "Custom CSS applied to the rendered email."
  },
  category: {
    type: "string",
    description: "Gallery category, max 80 chars. Library metadata; does not affect rendering."
  },
  preview_image_url: {
    type: "string",
    description: "Thumbnail shown in the template gallery, max 2048 chars."
  },
  tags: {
    type: "array",
    items: { type: "string" },
    description:
      "Gallery tags for filtering the template library. Max 50, each 1-60 chars. NOT audience topics — these never reach a contact."
  }
} as const;

/**
 * What a declared variable may be NAMED.
 *
 * A literal, not an import, because `packages/mcp` takes no runtime dependency
 * on `@mailtea/contracts` — the same arrangement as the automation catalog
 * above. `template-variable-key-parity.test.ts` asserts this string is byte-
 * identical to `TEMPLATE_VARIABLE_KEY_PATTERN` there, so the two cannot drift.
 *
 * This matters more for an agent than for a person at a keyboard. The server
 * looks a variable up by path at send time, so `2nd name` or `first|name` is
 * stored, echoed back by template.get, and then substitutes nowhere — the
 * braces reach the inbox. An operator would at least see a red chip in the
 * editor; an agent sees a 200 and moves on. Hence both halves: the `pattern`
 * below, since a tool only advertises what its schema says, and the local check
 * in the handler, so the refusal names the offending key instead of arriving as
 * a Zod path.
 */
const TEMPLATE_VARIABLE_KEY_PATTERN = "^[A-Za-z_$@][A-Za-z0-9_$@.-]*$";
const TEMPLATE_VARIABLE_KEY_MAX_LENGTH = 50;
const TEMPLATE_VARIABLE_KEY_RE = new RegExp(TEMPLATE_VARIABLE_KEY_PATTERN, "u");

/** Shared by template.create and template.update so they advertise one rule. */
const TEMPLATE_VARIABLES_SCHEMA = {
  type: "array",
  description:
    "Variables this template declares, each with an optional fallback_value used when a send supplies no value. Declaring one is what lets a send fill it in; an undeclared {{token}} is delivered verbatim.",
  items: {
    type: "object",
    properties: {
      key: {
        type: "string",
        maxLength: TEMPLATE_VARIABLE_KEY_MAX_LENGTH,
        pattern: TEMPLATE_VARIABLE_KEY_PATTERN,
        description: `Variable name, pattern ${TEMPLATE_VARIABLE_KEY_PATTERN}, max ${TEMPLATE_VARIABLE_KEY_MAX_LENGTH} chars — letters, numbers, dots, dashes and underscores, starting with a letter, "_", "$" or "@". Dots address into send context ("contact.first_name"). A name outside this shape is refused: it would store fine and then never substitute, delivering its own braces to a subscriber.`
      },
      type: { type: "string", enum: ["string", "number"] },
      fallback_value: {}
    },
    required: ["key", "type"]
  }
} as const;

/**
 * Refuse an unusable key before the round trip, naming it.
 *
 * The API refuses these too; doing it here as well is what turns a Zod path
 * like `variables.3.key` into a sentence an agent can act on in one step.
 */
function assertTemplateVariableKeys(
  variables: Array<{ key?: unknown }> | undefined
): void {
  if (!variables) return;
  for (const variable of variables) {
    const key = variable?.key;
    if (typeof key === "string" && TEMPLATE_VARIABLE_KEY_RE.test(key.trim())) {
      if (key.trim().length <= TEMPLATE_VARIABLE_KEY_MAX_LENGTH) continue;
    }
    throw new Error(
      `Invalid variable key ${JSON.stringify(key)} — must match ${TEMPLATE_VARIABLE_KEY_PATTERN} and be at most ${TEMPLATE_VARIABLE_KEY_MAX_LENGTH} characters. A key outside this shape is stored but never substituted, so the template would send "{${String(key)}}" to subscribers as written.`
    );
  }
}

// `config` is deliberately a flat `{ type: "object" }` rather than a discriminated
// oneOf: MCP clients vary in how much JSON Schema they honour, and unions are
// exactly where they break. The per-type shape lives in the description instead.
const AUTOMATION_STEPS_SCHEMA = {
  type: "array",
  description: `Ordered list of steps. Exactly one step must have type "trigger". Max 100 steps. ${AUTOMATION_STEP_CONFIG_HELP}`,
  items: {
    type: "object",
    properties: {
      key: {
        type: "string",
        description: `Stable step key, pattern ^[a-z0-9_-]{1,64}$. "__proto__", "constructor" and "prototype" are reserved and refused. Renaming a key orphans that step's metrics history.`
      },
      type: {
        type: "string",
        enum: [
          "trigger",
          "delay",
          "condition",
          "wait_for_event",
          "send_email",
          "topic_add",
          "topic_remove",
          "segment_add",
          "segment_remove",
          "contact_update",
          "http_request",
          "exit"
        ]
      },
      label: { type: "string", description: "Optional display label (max 80 chars)." },
      config: {
        type: "object",
        description: AUTOMATION_STEP_CONFIG_HELP
      }
    },
    required: ["key", "type"]
  }
} as const;

const AUTOMATION_CONNECTIONS_SCHEMA = {
  type: "array",
  description: `Optional. Omit it and the server links "steps" in array order with branch "next", rooted at the trigger wherever it sits. It is REQUIRED when any step is a "condition" or "wait_for_event" — omitting it there fails with connections_required_for_branching. Max 200 connections.`,
  items: {
    type: "object",
    properties: {
      from: { type: "string", description: "Source step key." },
      to: { type: "string", description: "Target step key." },
      branch: {
        type: "string",
        enum: ["next", "condition_met", "condition_not_met", "event_received", "timeout"],
        description: `Branch label leaving "from". Defaults to "next". condition emits condition_met/condition_not_met, wait_for_event emits event_received/timeout, every other step emits next, and exit is terminal.`
      }
    },
    required: ["from", "to"]
  }
} as const;

const AUTOMATION_VALIDATE_ONLY_SCHEMA = {
  type: "boolean",
  description:
    "Dry run (default false). Writes nothing and answers the way the real request would, with the same structured issues[], so you can self-correct before committing. On an ACTIVE automation that includes the 422 trigger_locked_while_active and 422 active_graph_invalid refusals.",
  default: false
} as const;

/**
 * Machine-readable automation catalog served at `mailtea://automations/step-types`.
 * Values are literals rather than imports because `packages/mcp` deliberately
 * takes no runtime dependency on `@mailtea/contracts` — they mirror
 * `AUTOMATION_TRIGGER_TYPES`, `STEP_CONFIG_FIELDS`, `AUTOMATION_VALIDATION_CODES`
 * and `RULE_OPERATORS` and must be updated in lockstep with them.
 */
const AUTOMATION_STEP_TYPE_CATALOG = {
  trigger_types: [
    {
      type: "contact.created",
      requires_trigger_key: false,
      description: "A contact record is created in the publication."
    },
    {
      type: "contact.subscribed",
      requires_trigger_key: false,
      description: "A contact becomes subscribed."
    },
    {
      type: "contact.unsubscribed",
      requires_trigger_key: false,
      description: "A contact unsubscribes."
    },
    {
      type: "topic.subscribed",
      requires_trigger_key: true,
      description: "A contact subscribes to a topic. trigger_key is the topic id."
    },
    {
      type: "topic.unsubscribed",
      requires_trigger_key: true,
      description: "A contact unsubscribes from a topic. trigger_key is the topic id."
    },
    {
      type: "event",
      requires_trigger_key: true,
      description:
        "A custom event is ingested via POST /v1/events (event.send). trigger_key is the event name."
    },
    {
      type: "email.opened",
      requires_trigger_key: false,
      description: "A recipient opens an email."
    },
    {
      type: "email.clicked",
      requires_trigger_key: false,
      description:
        "A recipient clicks a link. event.link is recipient-supplied — never render it as trusted HTML."
    },
    {
      type: "email.received",
      requires_trigger_key: false,
      description: "An inbound email is received for the publication."
    }
  ],
  step_types: [
    {
      type: "trigger",
      config: { required: ["trigger_type"], optional: ["trigger_key", "filter"] },
      branches: ["next"],
      side_effecting: false,
      description:
        "Entry point. Exactly one per graph, and nothing may connect into it. It must lead to at least one step on its next branch: a trigger with nothing after it is a missing_branch error (path branches.next) and blocks Start."
    },
    {
      type: "delay",
      config: { required: ["duration", "unit"], optional: [] },
      branches: ["next"],
      side_effecting: false,
      description:
        "Wait for a relative duration. unit is seconds|minutes|hours|days|weeks; total must be <= 365 days. Time-of-day and timezone keys are refused with not_yet_supported."
    },
    {
      type: "condition",
      config: { required: ["rule"], optional: [] },
      branches: ["condition_met", "condition_not_met"],
      side_effecting: false,
      description:
        "Branch on a rule tree. Requires explicit connections; branches never rejoin."
    },
    {
      type: "wait_for_event",
      config: { required: ["event_name", "timeout_seconds"], optional: ["filter"] },
      branches: ["event_received", "timeout"],
      side_effecting: false,
      description:
        "Pause until a matching event arrives or the timeout elapses (<= 90 days). BOTH branches are required — a missing timeout branch strands the contact."
    },
    {
      type: "send_email",
      config: {
        required: ["template_id"],
        optional: ["sender_id", "subject", "reply_to", "variables"]
      },
      branches: ["next"],
      side_effecting: true,
      description:
        "Send a published server template. Unresolvable variables fall back to the template's fallback_value, or an empty string when none is declared."
    },
    {
      type: "topic_add",
      config: { required: ["topic_id"], optional: [] },
      branches: ["next"],
      side_effecting: true,
      description: "Subscribe the enrolled contact to a topic."
    },
    {
      type: "topic_remove",
      config: { required: ["topic_id"], optional: [] },
      branches: ["next"],
      side_effecting: true,
      description: "Unsubscribe the enrolled contact from a topic."
    },
    {
      type: "segment_add",
      config: { required: ["segment_id"], optional: [] },
      branches: ["next"],
      side_effecting: true,
      description:
        "Add the enrolled contact to an audience segment. Only a MEMBER-LIST segment accepts this. One with a status_filter, query_filter or inactive_days resolves its audience from that filter instead, and targeting one is refused with segment_is_filter at save time and again when the step runs."
    },
    {
      type: "segment_remove",
      config: { required: ["segment_id"], optional: [] },
      branches: ["next"],
      side_effecting: true,
      description:
        "Remove the enrolled contact from an audience segment. Accepts either kind of segment; on a filter-backed one it deletes any stray membership row and changes no audience."
    },
    {
      type: "contact_update",
      config: { required: ["properties"], optional: [] },
      branches: ["next"],
      side_effecting: true,
      description: "Merge properties onto the enrolled contact."
    },
    {
      type: "http_request",
      config: {
        required: ["url"],
        optional: ["method", "headers", "body", "timeout_seconds"]
      },
      branches: ["next"],
      side_effecting: true,
      description:
        "Call an external endpoint. timeout_seconds <= 30 (default 10), <= 20 headers, <= 4 KB of headers, <= 64 KB body, 8 KB of the response captured. http:// URLs are refused when deployed (insecure_http_url)."
    },
    {
      type: "exit",
      config: { required: [], optional: ["reason"] },
      branches: [],
      side_effecting: false,
      description: "Terminal step. Ends the run; nothing may leave it."
    }
  ],
  branches: ["next", "condition_met", "condition_not_met", "event_received", "timeout"],
  limits: {
    max_steps: 100,
    max_connections: 200,
    max_delay_seconds: 31536000,
    max_wait_timeout_seconds: 7776000,
    max_step_label_length: 80,
    step_key_pattern: "^[a-z0-9_-]{1,64}$",
    reserved_step_keys: ["__proto__", "constructor", "prototype"],
    event_name_pattern: "^[a-z0-9][a-z0-9._-]{0,63}$"
  },
  condition: {
    operators: [
      "eq",
      "neq",
      "gt",
      "gte",
      "lt",
      "lte",
      "contains",
      "starts_with",
      "ends_with",
      "exists",
      "is_empty",
      "in",
      "not_in"
    ],
    presence_operators: ["exists", "is_empty"],
    set_operators: ["in", "not_in"],
    context_roots: ["contact", "event", "steps"],
    known_fields: [
      "contact.email",
      "contact.status",
      "contact.created_at",
      "contact.unsubscribed_at",
      "contact.topics",
      "event.name",
      "event.occurred_at"
    ],
    open_namespaces: ["contact.properties.*", "event.properties.*", "steps.<step_key>.*"],
    max_depth: 10,
    value_refs: `Rule values may be {"var": "<path>"} for field-to-field comparison`,
    step_refs: `steps.<step_key>.* (in a rule field or a {"var": ...} value) must name a step that is in this automation. A missing one is unknown_step_ref, an error that blocks Start; a {"var": ..., "default": ...} with a default is only a warning, because it always renders the default.`,
    event_refs: `event.properties.* holds the payload of your app's event. When the trigger is not "event", reading it (in a condition rule or a {"var": ...} value) is the warning event_field_without_event_trigger: it resolves to nothing. A wait_for_event filter is exempt, because there event is the awaited event.`
  },
  validation_codes: [
    "invalid_graph",
    "empty_graph",
    "missing_trigger",
    "multiple_triggers",
    "trigger_has_inbound",
    "invalid_step",
    "invalid_step_key",
    "duplicate_step_key",
    "unknown_step_type",
    "invalid_step_label",
    "duplicate_step_label",
    "too_many_steps",
    "too_many_connections",
    "invalid_connection",
    "unknown_step_ref",
    "self_connection",
    "unknown_branch",
    "branch_not_allowed",
    "duplicate_branch",
    "duplicate_connection",
    "terminal_step_has_outbound",
    "branch_rejoin",
    "cycle_detected",
    "unreachable_step",
    "missing_branch",
    "empty_branch",
    "unconfigured_step",
    "invalid_step_config",
    "unknown_config_field",
    "event_name_unverified",
    "not_yet_supported",
    "delay_out_of_range",
    "timeout_out_of_range",
    "invalid_rule",
    "rule_too_deep",
    "empty_rule_group",
    "empty_rule_value_set",
    "unknown_condition_field",
    "unknown_variable_path",
    "event_field_without_event_trigger",
    "connections_required_for_branching",
    "no_send_email_step",
    "template_not_found",
    "template_not_published",
    "template_unverified",
    "topic_not_found",
    "topic_unverified",
    "segment_not_found",
    "segment_unverified",
    "segment_is_filter",
    "contact_property_not_found",
    "contact_property_unverified",
    "insecure_http_url",
    "body_ignored_for_method"
  ],
  notes: [
    `connections is optional: omit it and the server links steps in array order with branch "next". A graph containing a condition or wait_for_event step is REJECTED with connections_required_for_branching, so branching graphs must pass connections explicitly.`,
    "automation.create and automation.update accept validate_only: true: a dry run that writes nothing and answers the way the real request would. On an ACTIVE automation that includes its refusals (422 trigger_locked_while_active, or 422 active_graph_invalid listing only the problems the change adds); when neither applies, issues[] come back with pre_existing marked against the version live now. automation.validate checks a graph with no automation in existence yet.",
    "Failures return coded issues[] ({code, severity, step_key?, path?, field?, message}), not zod paths. field is what a rule reads (e.g. steps.welcome.opened) when the issue is about one. Read the codes, fix the graph, retry.",
    "Saving is never blocked for draft/paused/archived automations: issues ride along informationally. A graph update to an ACTIVE automation is refused (422 active_graph_invalid) only when it ADDS an error the live version does not already have; issues[] then lists just those new problems. Fix them, or pause, save, then start again.",
    "Changing the trigger (its trigger_type or trigger_key) of an ACTIVE automation is refused with 422 trigger_locked_while_active. Pause it first; contacts already on their way keep going. Draft and paused automations can change their trigger.",
    "Issues may carry pre_existing: true, meaning the version this automation last ran on already had that problem (same code and step_key, and the same field, or path when there is no field; an error counts only if that version had an error there). Moving a rule, by removing a sibling or grouping it, does not make its problem new. Start refuses every error EXCEPT a pre_existing unknown_step_ref at a config.* path or a pre_existing missing_branch on the trigger (branches.next), so pausing and starting an unchanged automation keeps working. A never-started draft is blocked by those too.",
    "Each step's outputs are addressable from later conditions as steps.<step_key>.*, where <step_key> must be a step in this automation (else unknown_step_ref). The trigger's event payload is steps.<trigger_step_key>.event.*, which is the correlation namespace for wait_for_event and event triggers. The trigger itself needs a next step (else missing_branch).",
    "http_request sends Mailtea-Automation-Run, Mailtea-Automation-Step and Mailtea-Automation-Attempt headers. Delivery is AT-LEAST-ONCE; the (run, step) pair is stable across attempts and is the receiver's dedupe key.",
    "There is deliberately no test tool: a test run sends real, billed email. Test runs are excluded from every metric.",
    "Metrics are keyed by step_key, so renaming a step key orphans that step's history.",
    "event.send is idempotent on idempotency_key: a replay returns the ORIGINAL event id with enrolled_automations: 0, resumed_runs: 0, replayed: true. resumed_runs: 0 does not prove the event matched nothing — read the run, not the counter."
  ]
} as const;

/**
 * Website Builder — the document model an agent has to hold in its head before
 * it writes anything. Kept in one string so every site tool description can
 * point at the same vocabulary.
 */
const SITE_DOC_HELP = `A publication has exactly ONE site, made of pages. A page document is {"version":3,"sections":[...]}; a section is {"id","type":"section","blocks":[...]}. Blocks are discriminated on "type": heading, text, richText, button, link, image, embed, logo (src ""=publication logo, heightPx, href), icon, divider, spacer, subscribeForm, contactForm, unsubscribeForm, postHeader, postBody, postCollection, group (children[]), columns (columns[i].blocks[]). Every style/layout property is {"ref":"palette.accent"} (linked to the theme) or {"value":24} (a literal override) — PREFER refs so the site re-themes coherently. Limits: 40 sections/page, 50 children per container, 200 nodes/page. Writes land on the DRAFT; the public site keeps serving the live version until site.publish.`;

/** The 12 theme tokens, mirrored from SITE_THEME_TOKEN_SPECS in @mailtea/contracts. */
const SITE_THEME_TOKEN_PROPERTIES = {
  "palette.pageBg": { type: "string", description: "Page background, #rrggbb." },
  "palette.surfaceBg": { type: "string", description: "Card/band surface background, #rrggbb." },
  "palette.text": { type: "string", description: "Primary body text, #rrggbb." },
  "palette.muted": { type: "string", description: "Secondary/muted text, #rrggbb." },
  "palette.accent": { type: "string", description: "Accent for buttons and links, #rrggbb." },
  "palette.accentText": { type: "string", description: "Text drawn on top of the accent, #rrggbb." },
  "palette.border": { type: "string", description: "Hairline border, #rrggbb." },
  "typography.headingFont": {
    type: "string",
    description: "Heading font stack, e.g. \"'Source Serif 4', Georgia, serif\"."
  },
  "typography.bodyFont": {
    type: "string",
    description: "Body font stack, e.g. \"'Space Grotesk', system-ui, sans-serif\"."
  },
  "typography.baseSizePx": { type: "string", description: "Base body size in px (12-22)." },
  "theme.radiusPx": { type: "string", description: "Corner radius in px (0-48)." },
  "theme.contentWidthPx": { type: "string", description: "Content column width in px (480-1280)." }
} as const;

/**
 * Copy for a template's slots, keyed by slot key. A value slot takes a string; a
 * repeat slot takes a list of item maps. site.section_templates_list is the authority on
 * which keys a given template declares.
 */
const SITE_COPY_MAP_SCHEMA = {
  type: "object",
  description:
    "Copy for the template's slots, keyed by slot key (headline, body, ctaLabel, ctaHref, imageSrc, items, …). A value slot takes text; a repeat slot takes a list of item maps. Keys the template does not declare come back as unknown_slot_key; omitted slots keep the template's authored placeholder copy.",
  additionalProperties: {
    anyOf: [
      { type: "string" },
      { type: "array", items: { type: "object", additionalProperties: { type: "string" } } }
    ]
  }
} as const;

/**
 * Every email block kind, mirrored by hand from `EMAIL_BLOCK_SPECS` in
 * @mailtea/contracts. `email-ops-catalog-parity.test.ts` fails if the two drift.
 *
 * A block spec is a flat `{kind, ...attrs}` bag rather than a per-kind union for
 * the same reason `edit_block`'s attrs are flat: MCP clients vary in how much
 * JSON Schema they honour, and unions are where they break. The per-kind
 * vocabulary is spelled out in the description instead, because an agent only
 * discovers what the schema advertises.
 */
const EMAIL_BLOCK_SPEC_SCHEMA = {
  type: "object",
  description:
    "One block. `kind` picks the type; the remaining keys are that kind's attributes. " +
    "heading: text, level (1|2|3). " +
    "text: text. " +
    "bulletList / numberedList: items (1-50 strings). " +
    "quote: text. " +
    "button: label, href, alignment (left|center|right), variant (filled|outline), fullWidth. " +
    "image: src (absolute URL), alt, alignment. " +
    "divider: no attrs. " +
    "spacer: height (sm|md|lg|xl). " +
    "columns: columns (2-4 strings, one per column). " +
    "section: heading, text — a container; fill it with insert_blocks position \"append-into\". " +
    "footer: text, alignment — fine print and the unsubscribe link. " +
    "html: html (raw markup, sanitized to email-safe on render; use only when no other block fits). " +
    "variable: key, fallback, before, after — a personalization token, e.g. \"Hi {contact.first_name},\". " +
    "Text fields take inline markup: **bold**, *italic*, [label](https://url).",
  properties: {
    kind: {
      type: "string",
      enum: [
        "heading",
        "text",
        "bulletList",
        "numberedList",
        "quote",
        "button",
        "image",
        "divider",
        "spacer",
        "columns",
        "section",
        "footer",
        "html",
        "variable"
      ]
    }
  },
  required: ["kind"]
} as const;

/**
 * The email style tokens, mirrored by hand from `EMAIL_STYLE_TOKEN_SPECS`.
 * Enumerated rather than a loose record so the model reads the legal names
 * instead of guessing. Values are strings; the reducer range-checks the numeric
 * ones and reports `bad_attr_value` rather than silently swapping in a default.
 */
const EMAIL_STYLE_TOKEN_PROPERTIES = {
  pageBackground: {
    type: "string",
    description: "Colour behind the email body card, e.g. #f5f4f2."
  },
  bodyBackground: {
    type: "string",
    description: "The email body card's own background, usually #ffffff."
  },
  bodyText: { type: "string", description: "Default body text colour." },
  bodyBorderColor: { type: "string", description: "Body card border colour." },
  accentColor: {
    type: "string",
    description:
      "The brand colour: button fill, quote rule, section badges. Text on it is drawn in the profile's on-accent colour, so keep it dark enough for white text."
  },
  linkColor: {
    type: "string",
    description:
      "Colour for links in body copy. Keep at least 4.5:1 against the body background — an accent that reads well as a button fill is often too light as link text."
  },
  headingColor: {
    type: "string",
    description:
      "Colour for headings. Often the body colour or a shade darker; a heading in the accent competes with the button for attention."
  },
  textOnAccentColor: {
    type: "string",
    description:
      "Colour of the label drawn ON the accent — button text. Set it with accentColor: white on a pale accent is unreadable, and this is the only way to fix it."
  },
  bodyFontSizePx: {
    type: "string",
    description:
      "Body copy size in px (14-24). 16-18 reads comfortably on a phone; below 14 is refused because it is unreadable in an inbox."
  },
  titleFontSizePx: {
    type: "string",
    description:
      "Size of the h1 in px (16-72). Section headings derive from it, so this sets the whole heading scale rather than one heading."
  },
  linkDecoration: {
    type: "string",
    description:
      "Whether body links are underlined: `underline` or `none`. Default `none` matches the template corpus, but a link told apart by colour alone fails WCAG 1.4.1 — set `underline` when contrast is the only other cue."
  },
  fontFamily: {
    type: "string",
    description:
      "Font stack, e.g. \"'Inter', 'Segoe UI', sans-serif\". Email clients only reliably render web-safe families, so keep a system fallback last."
  },
  bodyWidth: {
    type: "string",
    description: "Body card width in px (320-900). 600 is the email convention."
  },
  bodyPadding: {
    type: "string",
    description: "Padding inside the body card, px on all four sides (0-96)."
  },
  pagePadding: {
    type: "string",
    description: "Padding around the body card, px on all four sides (0-96)."
  },
  bodyCornerRadius: { type: "string", description: "Body card corner radius in px (0-48)." },
  bodyBorder: { type: "string", description: "Body card border width in px (0-8)." }
} as const;

/**
 * One email op, mirrored by hand from `EmailOpSchema` (a zod discriminated
 * union) in @mailtea/contracts, for the same reason as `SITE_OP_SCHEMA` below:
 * agents only discover what the schema advertises.
 *
 * Addresses are dot-joined child-index paths ("2.1" = second child of the third
 * top-level block), minted by the outline `issue.get_editor` returns. Echo those
 * back rather than computing them; a path that no longer resolves comes back
 * skipped as unknown_path or stale_address, with a fresh outline attached.
 */
const EMAIL_OP_SCHEMA = {
  anyOf: [
    {
      type: "object",
      description:
        "compose — replace the email body wholesale. The only op that works on a draft created with contentHtml/contentSpec, because it never reads the old document.",
      properties: {
        op: { type: "string", enum: ["compose"] },
        blocks: {
          type: "array",
          description: "The email's new body, top to bottom. Replaces everything there.",
          items: EMAIL_BLOCK_SPEC_SCHEMA
        }
      },
      required: ["op", "blocks"]
    },
    {
      type: "object",
      description: "insert_blocks — add blocks at a position relative to an existing node.",
      properties: {
        op: { type: "string", enum: ["insert_blocks"] },
        blocks: {
          type: "array",
          description: "Blocks to insert, in order.",
          items: EMAIL_BLOCK_SPEC_SCHEMA
        },
        path: {
          type: "string",
          description:
            "The node to insert relative to, copied from the outline. Omit to append at the end of the email."
        },
        position: {
          type: "string",
          enum: ["before", "after", "append-into"],
          description:
            'Where the blocks land relative to `path`. "append-into" puts them inside a container (a section, or one column of a columns row) and is refused on anything else. Defaults to "after".'
        },
        expectType: {
          type: "string",
          description:
            "The node type you believe `path` addresses. Mismatch is refused as stale_address rather than edited blind."
        }
      },
      required: ["op", "blocks"]
    },
    {
      type: "object",
      description: "edit_text — rewrite the copy or link target on existing blocks.",
      properties: {
        op: { type: "string", enum: ["edit_text"] },
        edits: {
          type: "array",
          description:
            "Copy edits, applied in order. Paths are read against the document as it stands when this op runs, after any earlier op in the batch.",
          items: {
            type: "object",
            properties: {
              path: { type: "string", description: "The node to rewrite." },
              text: { type: "string", description: "Replacement copy. Inline markup allowed." },
              href: {
                type: "string",
                description:
                  "Replacement link target. Only a button (href) or a link card (url) has one; anything else is refused as unknown_attr."
              },
              expectType: { type: "string", description: "The node type you believe `path` is." }
            },
            required: ["path"]
          }
        }
      },
      required: ["op", "edits"]
    },
    {
      type: "object",
      description: "edit_block — patch one block's attributes.",
      properties: {
        op: { type: "string", enum: ["edit_block"] },
        path: { type: "string", description: "The block to restyle." },
        attrs: {
          type: "object",
          description:
            "Attributes to set, keyed by name. Per node type — heading: level, textAlign; paragraph/footer: textAlign; button: href, variant, alignment, fullWidth, buttonColor, textColor, borderRadius, padding{Top,Right,Bottom,Left}; image: src, alt, alignment, width, height; logo: src, alt, size, width, alignment; spacer: height; htmlCodeBlock: code; linkCard: title, subtitle, description, imageSrc, imageAlt, url, urlTitle, badge; variable: key, fallback; columns rows: stackOnMobile.",
          additionalProperties: {
            anyOf: [{ type: "string" }, { type: "number" }, { type: "boolean" }]
          }
        },
        expectType: { type: "string", description: "The node type you believe `path` is." }
      },
      required: ["op", "path", "attrs"]
    },
    {
      type: "object",
      description: "set_styles — restyle the whole email: colours, font, width, padding.",
      properties: {
        op: { type: "string", enum: ["set_styles"] },
        tokens: {
          type: "object",
          description: "Style tokens to change. Omitted tokens keep their current value.",
          properties: EMAIL_STYLE_TOKEN_PROPERTIES,
          additionalProperties: false
        }
      },
      required: ["op", "tokens"]
    },
    {
      type: "object",
      description:
        "arrange: reorder and delete blocks. Every address in this op resolves against the document as it stands when this op runs, so an earlier op in the same batch that inserted, moved or deleted blocks has already shifted the paths you read. Moves run first, then deletes. Pass expectType on every move and delete: if any address in the op turns out stale, the WHOLE op is refused as stale_address and nothing moves or is deleted.",
      properties: {
        op: { type: "string", enum: ["arrange"] },
        moves: {
          type: "array",
          items: {
            type: "object",
            properties: {
              from: { type: "string", description: "The node to move." },
              to: { type: "string", description: "The node to move it relative to." },
              position: { type: "string", enum: ["before", "after", "append-into"] },
              expectType: { type: "string", description: "The node type you believe `from` is." }
            },
            required: ["from", "to", "position"]
          }
        },
        deletes: {
          type: "array",
          description:
            "Nodes to remove, each with everything inside it. Applied after every move. Each item is a path, or {path, expectType}. Prefer the object form: a delete whose path now holds a different node type is refused as stale_address instead of removing the wrong block.",
          items: {
            anyOf: [
              { type: "string", description: "Path of the node to delete." },
              {
                type: "object",
                properties: {
                  path: { type: "string", description: "Path of the node to delete." },
                  expectType: {
                    type: "string",
                    description: "The node type you believe is at `path`, copied from the outline."
                  }
                },
                required: ["path"]
              }
            ]
          }
        }
      },
      required: ["op"]
    },
    {
      type: "object",
      description:
        "set_headers — set the subject line and the inbox preview text. The subject is the issue's title.",
      properties: {
        op: { type: "string", enum: ["set_headers"] },
        subject: { type: "string", description: "Subject line. Plain text." },
        previewText: {
          type: "string",
          description:
            "Inbox preview text (the preheader) shown next to the subject. Say something the subject does not."
        }
      },
      required: ["op"]
    }
  ]
} as const;

/**
 * One site op, mirrored by hand from `SiteOpSchema` (a zod discriminated union)
 * in @mailtea/contracts. Agents only discover what the schema advertises, so
 * every branch is spelled out with its own descriptions rather than collapsed
 * into a loose bag of optional keys.
 */
const SITE_OP_SCHEMA = {
  anyOf: [
    {
      type: "object",
      description: "set_theme — restyle the whole site: palette, typography, radius, content width.",
      properties: {
        op: { type: "string", enum: ["set_theme"] },
        tokens: {
          type: "object",
          description: "Theme tokens to change. Omitted tokens keep their current value.",
          properties: SITE_THEME_TOKEN_PROPERTIES,
          additionalProperties: false
        }
      },
      required: ["op", "tokens"]
    },
    {
      type: "object",
      description:
        "compose_page — replace the page's sections wholesale. The 'design me a page' op; the page is left untouched if none of the templates resolve.",
      properties: {
        op: { type: "string", enum: ["compose_page"] },
        sections: {
          type: "array",
          description: "The page's new sections, top to bottom (1-40).",
          items: {
            type: "object",
            properties: {
              templateId: {
                type: "string",
                description: "Id of a section template from the curated Section Library (site.section_templates_list)."
              },
              copy: SITE_COPY_MAP_SCHEMA
            },
            required: ["templateId"]
          }
        }
      },
      required: ["op", "sections"]
    },
    {
      type: "object",
      description: "insert_section — insert one template section at a position in the page.",
      properties: {
        op: { type: "string", enum: ["insert_section"] },
        templateId: {
          type: "string",
          description: "Id of a section template from the curated Section Library (site.section_templates_list)."
        },
        index: {
          type: "number",
          description:
            "0-based position among the page's sections. Equal to the section count appends."
        },
        copy: SITE_COPY_MAP_SCHEMA
      },
      required: ["op", "templateId", "index"]
    },
    {
      type: "object",
      description:
        "swap_section — replace an existing section with a different template, carrying its copy across.",
      properties: {
        op: { type: "string", enum: ["swap_section"] },
        sectionId: { type: "string", description: "Id of the section being replaced." },
        templateId: { type: "string", description: "Template to swap in." },
        fromTemplateId: {
          type: "string",
          description:
            "Template the section was originally built from. Pass it when known — copy then transfers exactly, by slot key."
        }
      },
      required: ["op", "sectionId", "templateId"]
    },
    {
      type: "object",
      description: "edit_copy — rewrite copy on existing nodes, addressed by id.",
      properties: {
        op: { type: "string", enum: ["edit_copy"] },
        edits: {
          type: "array",
          description: "1-100 edits. Each must set at least one of text, href or level.",
          items: {
            type: "object",
            properties: {
              nodeId: {
                type: "string",
                description: "Id of an existing node (section or block) in the page document."
              },
              text: {
                type: "string",
                description:
                  "New text for the node's primary text field (heading/text → text, button/link → label, image → alt, subscribeForm → headline)."
              },
              href: { type: "string", description: "New link target (button, link, image)." },
              level: {
                type: "integer",
                minimum: 1,
                maximum: 6,
                description:
                  "Heading level, 1-6. Heading nodes only. Use it to repair an outline that skips a level — a section headed h2 whose items are h4 reads to a screen reader as a missing section. Level is structure, not size: restyle with fontSizePx if you only want it bigger."
              }
            },
            required: ["nodeId"]
          }
        }
      },
      required: ["op", "edits"]
    },
    {
      type: "object",
      description:
        "edit_style — restyle one node. A property value naming a theme token (e.g. \"palette.accent\") LINKS the property to the theme; anything else becomes a literal override.",
      properties: {
        op: { type: "string", enum: ["edit_style"] },
        nodeId: {
          type: "string",
          description:
            "Id of an existing node — from the page document, or the shared navbar/footer chrome."
        },
        part: {
          type: "string",
          enum: ["band", "inner"],
          description:
            "Restyle a sub-element instead of the node itself. \"band\" is the full-bleed strip, \"inner\" the centred content column. On the navbar or footer this is the difference between a full-width bar and a floating pill: set the band to background \"transparent\", then give the node itself a background, radiusPx and maxWidthPx. Omit to style the node."
        },
        style: {
          type: "object",
          description:
            "Text/surface properties: textColor, textOpacityPct, fontFamily, fontSizePx, fontWeight, lineHeightPct, letterSpacingPx, textAlign, textTransform, background. `background` takes a #rrggbb hex, \"transparent\", or a gradient — linear-gradient(...) / radial-gradient(...) built from hex colours, percentage stops, angles and side keywords.",
          additionalProperties: {
            anyOf: [{ type: "string" }, { type: "number" }, { type: "boolean" }]
          }
        },
        layout: {
          type: "object",
          description:
            "Box properties: paddingTopPx, paddingRightPx, paddingBottomPx, paddingLeftPx, align, widthMode, widthPx, maxWidthPx, gapPx, borderColor, borderWidthPx, radiusPx, shadow (a named elevation step: none, sm, md or lg — not a raw shadow string; none is how you remove one that base chrome applied).",
          additionalProperties: {
            anyOf: [{ type: "string" }, { type: "number" }, { type: "boolean" }]
          }
        }
      },
      required: ["op", "nodeId"]
    },
    {
      type: "object",
      description: "arrange — reorder, reparent and delete nodes. Moves apply first, then deletes.",
      properties: {
        op: { type: "string", enum: ["arrange"] },
        moves: {
          type: "array",
          description: "Up to 100 moves.",
          items: {
            type: "object",
            properties: {
              nodeId: {
                type: "string",
                description: "Node to move — a section, or a block anywhere in the tree."
              },
              parentId: {
                type: "string",
                description:
                  "New parent (section, group, or column id). Omit to reorder within the node's current parent. A SECTION always lives at page level: omit parentId entirely to move one, and pass an index alone. Any parentId on a section move is refused — including the literal string \"page\", which is not a node — because a section cannot be nested inside a block."
              },
              index: {
                type: "number",
                description:
                  "0-based position in the destination list, after the node is removed from its old one."
              }
            },
            required: ["nodeId", "index"]
          }
        },
        deletes: {
          type: "array",
          description: "Ids to remove, each with its whole subtree (max 100).",
          items: { type: "string" }
        }
      },
      required: ["op"]
    },
    {
      type: "object",
      description:
        "set_footer_template — replace the whole footer with one from the curated library (see site.footer_templates_list). The shipped default footer is a single empty text node, so this is usually the first thing a new site needs. Every template except \"footer-simple\" carries an unsubscribe link, which a footer is obliged to have. It REPLACES the existing footer.",
      properties: {
        op: { type: "string", enum: ["set_footer_template"] },
        templateId: {
          type: "string",
          description:
            "Id of a footer template from site.footer_templates_list, e.g. \"footer-split\"."
        },
        brand: {
          type: "string",
          description:
            "The name the footer spells: its wordmark, where it has one, and its legal line. Omitted, the publication's own name is used."
        }
      },
      required: ["op", "templateId"]
    },
    {
      type: "object",
      description:
        "set_navbar_template — replace the whole navbar with one from the curated library (see site.navbar_templates_list). Prefer this over hand-assembling a navbar node by node: a template is theme-linked, responsive, and carries its own mobile menu. It REPLACES the existing navbar.",
      properties: {
        op: { type: "string", enum: ["set_navbar_template"] },
        templateId: {
          type: "string",
          description:
            "Id of a navbar template from site.navbar_templates_list, e.g. \"navbar-classic\"."
        },
        brand: {
          type: "string",
          description:
            "Wordmark text. Omitted, the publication's own name is used."
        }
      },
      required: ["op", "templateId"]
    },
    {
      type: "object",
      description:
        "rename_nodes — label nodes in the builder's layer tree. Editor metadata only: visitors never see these names and the rendered page is unchanged. Worth doing after compose_page — a generated navbar is several nested groups, and an operator opening the builder otherwise sees \"Group, Group, Group\" with no way to tell which holds what.",
      properties: {
        op: { type: "string", enum: ["rename_nodes"] },
        renames: {
          type: "array",
          description: "Up to 100 renames.",
          items: {
            type: "object",
            properties: {
              nodeId: {
                type: "string",
                description:
                  "Node to label — a section, or a block anywhere in the page, navbar or footer. Column slots have no layer row and come back skipped."
              },
              layerName: {
                type: "string",
                description:
                  "Label shown in the layer tree, e.g. \"Left group\" (max 80 chars). Empty string clears it and the tree falls back to the node's type."
              }
            },
            required: ["nodeId", "layerName"]
          }
        }
      },
      required: ["op", "renames"]
    }
  ]
} as const;

/**
 * What the server calls itself in the `initialize` handshake.
 *
 * Written twice — here and in `package.json` — because importing the manifest
 * from source would need a JSON import assertion and resolves differently once
 * bundled to `dist`. It was left at "0.2.0" through five releases, so every
 * client that asked was told the wrong number; `version.test.ts` now ties the
 * two together.
 */
export const SERVER_VERSION = "0.21.0";

/**
 * The publication a tool acts on — advertised as OPTIONAL on every tool that
 * takes one.
 *
 * A credential almost always already names the publication. The hosted OAuth
 * grant names exactly one (the operator picked it on the consent screen, and
 * `assertPublicationAccess` refuses every other one for the life of the token);
 * a publication-scoped key is the same; stdio has `MAILTEA_PUBLICATION_ID`.
 * Demanding the id again bought no authority — the only value the server would
 * accept is the one it already holds — while `required` made agents fail the
 * call outright rather than omit it, because a tool schema is the only thing an
 * agent can read.
 *
 * Shared object, referenced by every tool rather than copied, so the sentence
 * an agent reads cannot drift between two tools that mean the same thing.
 */
const PUBLICATION_ID_SCHEMA = {
  type: "string",
  description:
    "Publication to act on. Optional: defaults to the publication this connection is authorized for (the OAuth grant's publication, a publication-scoped API key, MAILTEA_PUBLICATION_ID, or, for a team-scoped personal API key, the only publication its owner belongs to in that team). Service keys take no such default. Pass it when the key reaches more than one publication; the error then lists the ids it can take."
} as const;

/**
 * A post's internal name and sender headers (API migration 0127), shared by
 * issue.create_draft and issue.update_draft. The server checks `from` and
 * `replyTo` when the tool writes them (`strictHeaders`), the same checks
 * POST/PATCH /v1/posts make, so a bad value is refused now rather than
 * quietly replaced when the post is sent.
 */
const POST_HEADER_PROPERTIES = {
  name: {
    type: "string",
    description:
      "The post's internal name in Mailtea Studio. Kept apart from the subject: renaming never changes what subscribers see. Omit to leave it; \"\" clears it so the post is listed under its subject."
  },
  from: {
    type: "string",
    description:
      "The From for this post, as an email or `Name <email>`. It must be on one of the publication's verified sending domains, or the call is refused with the reason. A From on the built-in *.mailtea.email address is kept for test emails, but the post itself sends from the publication's default sender. Omit to leave it; \"\" clears it so the named sender or publication default decides."
  },
  replyTo: {
    type: "string",
    description:
      "The Reply-To for this post: a valid email address, on any domain. It replaces the sender's Reply-To. Omit to leave it; \"\" clears it."
  }
} as const;

/**
 * Which segment a post goes to, shared by issue.create_draft and
 * issue.update_draft. The server checks the id belongs to the post's
 * publication when the tool writes it, and resolves the audience at send time.
 */
const POST_SEGMENT_HELP =
  "The segment picks the recipients when the post is sent, not now: a filter segment (status_filter, query_filter or inactive_days) is resolved at send time, and a member list sends to whoever is on it then. Use segment.list to find an id. It must be a segment in the same publication as the post, or the call is refused.";

/**
 * `inactive_days` on segment.create and segment.update. It selects the SILENT
 * cohort (`contacts.last_engaged_at`, migration 0097, not backfilled).
 */
const SEGMENT_INACTIVE_DAYS_HELP =
  "Contacts with no open or click in the last N days (1 to 3650). A contact who never engaged counts as inactive. This selects the SILENT cohort, for a sunset or re-engagement send; it is not an engaged readers filter. Engagement tracking is not backfilled, so contacts with no recorded engagement count as inactive, including some who opened or clicked before tracking began. Setting it makes the segment a filter segment; with status_filter or query_filter, a contact must match all of them.";

/**
 * The four MCP tool behaviour hints (spec 2025-06-18, `ToolAnnotations`).
 *
 * Every tool in MCP_TOOLS states all four, each audited against what the tool's
 * handler and the API behind it actually do, not guessed from the name. The
 * hosted endpoint (`POST /mcp` in apps/api) serves this same array through
 * handleMcpRequest, so stdio and hosted clients read identical hints. Clients
 * such as ChatGPT use them to decide what needs a confirmation, and directory
 * reviews check them against behaviour, so a wrong hint is a real defect.
 *
 * - readOnlyHint: true only when the call changes nothing (reads, previews,
 *   dry runs). A read that creates rows on first use is not read only.
 * - destructiveHint: true when the call deletes or removes something, revokes
 *   access, cancels, discards unsaved work, changes a contact's consent or
 *   suppression, replaces live public content, or sends email (now, at a
 *   scheduled time, or by starting automations). Setting fields to new values
 *   is not destructive: the change is visible and can be set back.
 * - idempotentHint: true when repeating the call with the same arguments has
 *   no further effect: reads, set-to-value updates, upserts on a natural key,
 *   and deletes (the second finds nothing). Creates and sends are false, also
 *   when an idempotency_key is accepted, because the key is optional.
 * - openWorldHint: true when the call reaches outside Mailtea: email to
 *   recipients (directly or through automations), the public website, public
 *   DNS lookups, or a webhook URL the caller chooses.
 *
 * `tool-annotations.test.ts` pins the rules above for every tool and names the
 * high-stakes ones (sends, deletes, consent changes) explicitly.
 */
export type McpToolHints = {
  readOnlyHint: boolean;
  destructiveHint: boolean;
  idempotentHint: boolean;
  openWorldHint: boolean;
};

export type McpToolAnnotations = McpToolHints & { title: string };

/** The shape every entry of MCP_TOOLS must have (checked with `satisfies`). */
export type McpToolDefinition = {
  name: string;
  title: string;
  description: string;
  inputSchema: { readonly type: "object"; readonly [key: string]: unknown };
  annotations: McpToolAnnotations;
};

/**
 * A tool's display title and its hints, spread into its MCP_TOOLS entry. The
 * title goes in both places the spec reads it from: the top-level `title`
 * (2025-06-18) and `annotations.title` (2025-03-26 clients). One argument
 * feeds both, so they cannot disagree.
 */
function toolHints(title: string, hints: McpToolHints) {
  return { title, annotations: { title, ...hints } };
}

export const MCP_TOOLS = [
  {
    name: "auth.me",
    ...toolHints("Get current identity", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: "Return auth identity for current token",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "issue.create_draft",
    ...toolHints("Create email draft", { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }),
    // name/from/replyTo: see POST_HEADER_PROPERTIES.
    description: "Create a marketing email draft. Set kind to 'newsletter' (default) for recurring content that can publish to the public site, or 'broadcast' for a one-time email-only send (promotion, launch, announcement). Provide content one of three ways: templateId (seed from a published server template's PUBLISHED version; use template.list/template.get to find one, and template.publish first if it has unpublished changes), contentHtml (raw HTML), or contentSpec (json-render spec). Spec is recommended for AI agents; use components: Html, Head, Body, Container, Section, Row, Column, Heading, Text, Link, Button, Image, Hr, Preview, Markdown, MailteaHeader, MailteaFooter, MailteaSpacer, MailteaContentBlock. Seeding from a template fills in the variables you pass (both {{key}} and Visual Email Designer {key} forms) and leaves everything else for the broadcast to fill per recipient: a declared variable you do not pass keeps its fallback_value for recipients with no value, and undeclared tokens like {{contact.first_name}} are left as they are. The draft keeps the template's published page style, is wrapped in that page when it is sent, and has its show-if blocks decided per recipient then. The draft's subject is always the title you pass here, never the template's own subject line. The template's preview text is part of its rendered HTML and does reach the inbox, but the draft's own preview text field stays empty. Pass segmentId to send to one audience segment instead of all active contacts.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        title: { type: "string", description: "The subject line subscribers see." },
        ...POST_HEADER_PROPERTIES,
        kind: { type: "string", enum: ["newsletter", "broadcast"], description: "Email kind. 'newsletter' (default) can publish to the public site; 'broadcast' is one-time email-only." },
        segmentId: {
          type: "string",
          description: `Send this post to one audience segment. Omit it to send to all active contacts in the publication. ${POST_SEGMENT_HELP}`
        },
        templateId: { type: "string", description: "Seed the draft from a published server template's published version (see template.list). Takes precedence over contentHtml/contentSpec." },
        variables: { type: "object", description: "Key/value map substituted into the template's variable placeholders when templateId is set (both {{key}} and Visual Email Designer {key} forms). Values are HTML-escaped; use {{{key}}} in the template for raw HTML." },
        contentHtml: { type: "string", description: "Raw HTML content (use this OR contentSpec OR templateId)" },
        contentSpec: {
          type: "object",
          description: "json-render spec (flat element map). Use this OR contentHtml OR templateId. Properties: root (string, element key), elements (record of {type, props?, children?})",
          properties: {
            root: { type: "string" },
            elements: { type: "object" }
          },
          required: ["root", "elements"]
        }
      },
      required: ["title"]
    }
  },
  {
    name: "issue.get_editor",
    ...toolHints("Get draft editor state", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description:
      "Load the editor payload for a draft or scheduled issue. Returns `outline` — the document as a flat list of addressable blocks ({path, type, text}) — plus `styles` (current style tokens), `headers` (subject, previewText), `docBacked`, and `updatedAt`. READ THIS BEFORE issue.apply_ops: the paths in the outline are the addresses ops take, and `updatedAt` is what you pass as baseUpdatedAt. `docBacked: false` means the draft holds raw HTML, not an editable document — only a `compose` op can edit it.",
    inputSchema: {
      type: "object",
      properties: {
        issueId: { type: "string" }
      },
      required: ["issueId"]
    }
  },
  {
    name: "issue.apply_ops",
    // Not idempotent: ops can insert or move blocks, and baseUpdatedAt is optional, so a repeat can apply them twice.
    ...toolHints("Edit draft with operations", { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }),
    description:
      "Apply a batch of declarative edits to a draft email — the surgical alternative to issue.update_draft, which replaces the whole document. Use this to change one button's colour, rewrite a paragraph, reorder sections, or restyle the email without regenerating it. Every op is applied in order and answered with a report: {applied, skipped:[{opIndex, reason, path, detail}]}. A success with skips is the normal, honest outcome — READ THE REPORT, it is the only place a refused edit is named. Reasons: invalid_op, unknown_path, stale_address, unknown_block_kind, unknown_attr, bad_attr_value, unknown_style_token, bad_index, not_a_container, cycle, empty_edit, value_too_long (refused, never truncated), doc_full, not_email_safe, out_of_scope, internal_error. A structural op returns a fresh `outline` in the report — use it, every path you held may have moved. Call issue.get_editor first for the outline and updatedAt.",
    inputSchema: {
      type: "object",
      properties: {
        issueId: { type: "string" },
        ops: {
          type: "array",
          description: "1-100 ops, applied in order.",
          items: EMAIL_OP_SCHEMA
        },
        baseUpdatedAt: {
          type: "string",
          description:
            "The issue's updatedAt when you composed this batch (from issue.get_editor). On a mismatch the write is refused rather than silently overwriting an edit made meanwhile — an operator with the editor open autosaves every 2.5s. Re-read and rebuild the batch instead of retrying blind."
        }
      },
      required: ["issueId", "ops"]
    }
  },
  {
    name: "email.lint",
    ...toolHints("Lint email HTML", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description:
      "Check email HTML against the Can I Email support matrix for the clients Mailtea refuses to regress (Apple Mail, Gmail, Outlook desktop). Returns {findings:[{slug, severity, feature, clients}], failCount, warnCount, strictClients, linted}. severity 'fail' means the layout BREAKS when unsupported (flex/grid collapse, absolute positioning, CSS variables, viewport units); 'warn' means it degrades gracefully (a gradient or shadow simply does not paint; a color-mix() color is dropped by Outlook desktop, so use a plain hex). Run this after writing an email. You cannot see the rendered result, and this is the check that catches what a preview would have shown you. Pass exactly one of issueId (lint what is saved) or html (lint before you post it).",
    inputSchema: {
      type: "object",
      properties: {
        issueId: {
          type: "string",
          description: "Lint the saved HTML snapshot of this issue."
        },
        html: {
          type: "string",
          description: "Lint this raw HTML instead. Use before creating or updating a draft."
        }
      }
    }
  },
  {
    name: "issue.update_draft",
    ...toolHints("Update email draft", { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description:
      "Update an existing draft issue. Only the fields you pass change: pass title to change the subject, name to rename the post, from/replyTo to set its sender headers, segmentId to choose its audience (null sends it to all active contacts again), or contentHtml/contentSpec to replace the whole document (use issue.apply_ops for targeted edits). Pass baseUpdatedAt (from issue.get_editor) so your write never overwrites a change someone made since; on a 'changed elsewhere' conflict, re-read with issue.get_editor and retry. A draft replaced with contentHtml stays HTML: the Visual Email Designer shows it read-only until the operator chooses Edit as blocks, and opening it changes nothing.",
    inputSchema: {
      type: "object",
      properties: {
        issueId: { type: "string" },
        title: { type: "string", description: "The subject line subscribers see. Omit to leave it unchanged." },
        ...POST_HEADER_PROPERTIES,
        segmentId: {
          type: ["string", "null"],
          description: `Send this post to one audience segment, or null to clear it so the post goes to all active contacts. Omit to leave it unchanged. ${POST_SEGMENT_HELP}`
        },
        contentHtml: { type: "string", description: "Raw HTML content (use this OR contentSpec)" },
        contentSpec: {
          type: "object",
          description: "json-render spec (flat element map). Use this OR contentHtml.",
          properties: {
            root: { type: "string" },
            elements: { type: "object" }
          },
          required: ["root", "elements"]
        },
        baseUpdatedAt: {
          type: "string",
          format: "date-time",
          description:
            "The draft's `updatedAt` as you read it (issue.get_editor, or your last write). Read first, then send it: the update is applied only if nobody changed the draft since (a person typing in the Visual Email Designer, another agent). Otherwise it fails with a 'changed elsewhere' conflict and NOTHING is saved; on that, call issue.get_editor again, re-apply your change to what it returns, and retry with the new updatedAt. Never resend the same body unchanged. Omit it for an unconditional write that can overwrite someone else's edit."
        }
      },
      required: ["issueId"]
    }
  },
  {
    name: "issue.remove_draft",
    ...toolHints("Delete email draft", { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false }),
    description: "Delete an existing draft issue",
    inputSchema: {
      type: "object",
      properties: {
        issueId: { type: "string" }
      },
      required: ["issueId"]
    }
  },
  {
    name: "issue.list_recent",
    ...toolHints("List recent issues", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: "List recent issues for a publication",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        limit: { type: "number" }
      }
    }
  },
  {
    name: "publication.list",
    ...toolHints("List publications", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: "List publication workspaces available to current user/token",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "publication.create",
    ...toolHints("Create publication", { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }),
    description: "Create a publication workspace and attach owner membership",
    inputSchema: {
      type: "object",
      properties: {
        // NOT the connected publication: the id to give the publication being
        // created. Spelled out because every other tool's `publicationId` now
        // defaults, and an agent that carried that habit here would try to
        // create a publication on top of the one it is connected to.
        publicationId: {
          type: "string",
          description:
            "Optional id to assign the NEW publication. It must start with pub_; leave it out and one is generated. An id that is already taken is refused as not available. This is not the publication to act on: publication.create always creates one."
        },
        name: { type: "string" },
        timezone: { type: "string" }
      },
      required: ["name"]
    }
  },
  {
    name: "publication.domain_list",
    ...toolHints("List website domains", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: "List custom domains connected to a publication",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        limit: { type: "number" }
      }
    }
  },
  {
    name: "publication.domain_upsert",
    // Open world, like domain.create: provisions the sending identity, checks RDAP and public DNS, and attaches the public site edge.
    ...toolHints("Add or update website domain", { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true }),
    description: "Create or update a publication custom domain",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        host: { type: "string" },
        isPrimary: { type: "boolean" },
        proxyTarget: { type: "string" }
      },
      required: ["host"]
    }
  },
  {
    name: "publication.domain_verify",
    // Open world: without a verificationValue it looks the TXT record up in public DNS.
    ...toolHints("Verify website domain", { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true }),
    description: "Mark a publication domain as verified",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        domainId: { type: "string" },
        verificationValue: { type: "string" }
      },
      required: ["domainId"]
    }
  },
  {
    name: "publication.domain_set_primary",
    ...toolHints("Set primary website domain", { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: "Set an existing publication domain as primary",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        domainId: { type: "string" }
      },
      required: ["domainId"]
    }
  },
  {
    name: "publication.domain_remove",
    // Open world, like domain.delete: detaches the tracking and site edges and deletes the sending identity.
    ...toolHints("Remove website domain", { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true }),
    description: "Remove a publication custom domain",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        domainId: { type: "string" }
      },
      required: ["domainId"]
    }
  },
  {
    name: "publication.domain_traefik_preview",
    ...toolHints("Preview domain routing config", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: "Generate Traefik dynamic-file preview for publication domains",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA
      }
    }
  },
  {
    name: "sender.list",
    ...toolHints("List senders", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: "List named from-identities (senders) for a publication",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        limit: { type: "number" }
      }
    }
  },
  {
    name: "sender.create",
    // Idempotent: (publication, email) is unique, so a repeat is refused and changes nothing.
    ...toolHints("Create sender", { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description:
      "Create a named sender. The email domain must be a verified, DKIM-verified sending domain of the publication. The built-in '{slug}.mailtea.email' host is REFUSED here: it can only ever email verified members of the team, so a sender on it would be refused on every real send. Verify a domain first (domain.create).",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        name: { type: "string" },
        email: { type: "string" },
        replyTo: { type: "string" },
        isDefault: { type: "boolean" }
      },
      required: ["name", "email"]
    }
  },
  {
    name: "sender.update",
    ...toolHints("Update sender", { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: "Update a sender's name, reply-to, or default flag. Email is immutable.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        senderId: { type: "string" },
        name: { type: "string" },
        replyTo: { type: "string" },
        isDefault: { type: "boolean" }
      },
      required: ["senderId"]
    }
  },
  {
    name: "sender.set_default",
    ...toolHints("Set default sender", { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: "Make a sender the publication's default from-identity",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        senderId: { type: "string" }
      },
      required: ["senderId"]
    }
  },
  {
    name: "sender.delete",
    ...toolHints("Delete sender", { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false }),
    description: "Remove a named sender",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        senderId: { type: "string" }
      },
      required: ["senderId"]
    }
  },
  {
    name: "suppression.search",
    ...toolHints("Search suppression list", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description:
      "Search the organization's suppression list (addresses that will never be emailed). Filter by reason, email substring, or creation-date window; paginate with starting_after.",
    inputSchema: {
      type: "object",
      properties: {
        reason: {
          type: "string",
          enum: ["bounced", "complained", "manual", "unsubscribed", "invalid", "unknown"]
        },
        query: { type: "string", description: "Email substring to match." },
        created_after: {
          type: "string",
          description: "ISO 8601 datetime; only entries created at or after this time."
        },
        created_before: {
          type: "string",
          description: "ISO 8601 datetime; only entries created before this time."
        },
        starting_after: {
          type: "string",
          description: "Pagination cursor from a previous response's next_cursor."
        },
        limit: { type: "number" }
      }
    }
  },
  {
    name: "suppression.export",
    ...toolHints("Export suppression list", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description:
      "Export the organization's entire suppression list as CSV (columns: email, reason, source, created_at). Returns the CSV text in 'csv'.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "suppression.add",
    ...toolHints("Suppress email addresses", { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false }),
    description:
      "Add addresses to the organization's suppression list. They will be excluded from all sends across every publication.",
    inputSchema: {
      type: "object",
      properties: {
        emails: { type: "array", items: { type: "string" } },
        reason: {
          type: "string",
          enum: ["bounced", "complained", "manual", "unsubscribed", "invalid", "unknown"]
        }
      },
      required: ["emails"]
    }
  },
  {
    name: "suppression.remove",
    // Destructive: drops the suppression record and returns matching contacts to active or unsubscribed.
    ...toolHints("Unsuppress email addresses", { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false }),
    description:
      "Remove addresses from the organization's suppression list. Matching contacts are restored to active/unsubscribed.",
    inputSchema: {
      type: "object",
      properties: {
        emails: { type: "array", items: { type: "string" } }
      },
      required: ["emails"]
    }
  },
  {
    name: "contact.list",
    ...toolHints("List contacts", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: "List contacts for a publication",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        status: {
          type: "string",
          enum: ["active", "unsubscribed", "suppressed"]
        },
        query: {
          type: "string",
          description:
            "Part of an email address to search for. Or several whole addresses separated by commas, spaces or line breaks, to get exactly those contacts (up to 320 characters). A list with an entry that is not a whole address is refused with the entry named, rather than searched as one piece of text."
        },
        limit: { type: "number" }
      }
    }
  },
  {
    name: "contact.upsert",
    // Destructive and open world: an unsubscribed contact is reactivated (its opt out is cleared), and a new or reactivated contact enters any active contact.created or contact.subscribed automation, which emails them.
    ...toolHints("Add or reactivate contact", { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true }),
    description: "Create or reactivate a contact by email",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        email: { type: "string" },
        referrerContactId: { type: "string" }
      },
      required: ["email"]
    }
  },
  {
    name: "contact.set_status",
    // Destructive and open world: changes consent (unsubscribe, suppress, reactivate), and a status change can enroll the contact in subscribed or unsubscribed automations.
    ...toolHints("Set contact status", { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true }),
    description: "Set contact status (active, unsubscribed, suppressed)",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        contactId: { type: "string" },
        status: {
          type: "string",
          enum: ["active", "unsubscribed", "suppressed"]
        }
      },
      required: ["contactId", "status"]
    }
  },
  {
    name: "contact.import_csv",
    // Destructive and open world: reactivates unsubscribed contacts in the file, and with enrollInAutomations every row can be emailed by an automation.
    ...toolHints("Import contacts from CSV", { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true }),
    description:
      "Import contacts from CSV text. Only the email column is read: names and any other columns are not imported, and the result lists them in ignoredColumns. To store a name or another field, import first, then call contact.set_properties per contact. Returns per-outcome counts plus enrolledAutomations, the number of automation enrollments the import created (always 0 unless enrollInAutomations is true).",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        csvText: {
          type: "string",
          description:
            "CSV text, one contact per row. With a header named email (any case), that column is read; without one, the first non-empty column is read as the address. Every other column is ignored."
        },
        enrollInAutomations: {
          type: "boolean",
          description:
            // The 500 and the code are LITERALS, not imports: `@mailtea/contracts`
            // is a devDependency here, so nothing from it may reach the published
            // bundle. `import-enrollment-parity.test.ts` fails if either drifts
            // from the server's value.
            "Enroll the imported contacts in matching contact.created / contact.subscribed automations, so an imported list can start a welcome series. DEFAULTS TO FALSE, the same default as the Studio import checkbox: importing a list is bringing existing subscribers in, not watching them sign up, so a publication with an active welcome automation would otherwise email every imported row. Opting in has to be a decision someone made. Above 500 rows this additionally needs confirmLargeEnrollment — see that field."
        },
        confirmLargeEnrollment: {
          type: "boolean",
          description:
            "Acknowledges the blast radius of a LARGE enrolling import. Above 500 rows, an import with enrollInAutomations true is refused with `enrollment_too_large` and NOTHING is stored unless this is also true; the refusal message names this field and says how many contacts are involved, so send the same request again with it set once you have decided to go ahead. DEFAULTS TO FALSE. This is the same acknowledgement a Studio operator gives on the confirm screen, not a way around the check — everyone in the file will receive the automation's emails and they cannot be recalled. Ignored without enrollInAutomations, since a plain import enrolls nobody and is never limited by size."
        }
      },
      required: ["csvText"]
    }
  },
  {
    name: "contact.referral_summary",
    ...toolHints("Get referral leaderboard", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: "Load referral conversion leaderboard for a publication",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        limit: { type: "number" }
      }
    }
  },
  {
    name: "contact.referral_milestones",
    ...toolHints("List referral milestones", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: "List referral milestone rules for a publication",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        limit: { type: "number" }
      }
    }
  },
  {
    name: "contact.referral_milestone_upsert",
    ...toolHints("Create or update referral milestone", { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }),
    description: "Create or update a referral milestone rule",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        milestoneId: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        referralCount: { type: "number" }
      },
      required: ["title", "referralCount"]
    }
  },
  {
    name: "contact.referral_milestone_remove",
    ...toolHints("Delete referral milestone", { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false }),
    description: "Delete a referral milestone rule",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        milestoneId: { type: "string" }
      },
      required: ["milestoneId"]
    }
  },
  {
    name: "contact.referral_rewards",
    ...toolHints("List referral rewards", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: "List awarded referral rewards for a publication",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        contactId: { type: "string" },
        limit: { type: "number" }
      }
    }
  },
  {
    name: "monetize.offer_list",
    ...toolHints("List sponsor offers", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: "List sponsor offers for a publication",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        status: {
          type: "string",
          enum: ["draft", "active", "paused", "archived"]
        },
        limit: { type: "number" }
      }
    }
  },
  {
    name: "monetize.offer_upsert",
    ...toolHints("Create or update sponsor offer", { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }),
    description: "Create or update a sponsor offer",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        offerId: { type: "string" },
        title: { type: "string" },
        sponsorName: { type: "string" },
        description: { type: "string" },
        pricingModel: {
          type: "string",
          enum: ["flat", "cpm"]
        },
        rateCents: { type: "number" },
        estimatedPlacements: { type: "number" },
        status: {
          type: "string",
          enum: ["draft", "active", "paused", "archived"]
        },
        startsAt: {
          type: "string",
          description: "Optional ISO start timestamp."
        },
        endsAt: {
          type: "string",
          description: "Optional ISO end timestamp."
        }
      },
      required: ["title", "sponsorName", "pricingModel", "rateCents"]
    }
  },
  {
    name: "monetize.offer_remove",
    ...toolHints("Delete sponsor offer", { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false }),
    description: "Delete a sponsor offer",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        offerId: { type: "string" }
      },
      required: ["offerId"]
    }
  },
  {
    name: "section.list",
    ...toolHints("List saved sections", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: "List reusable editor sections for a publication",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        limit: { type: "number" }
      }
    }
  },
  {
    name: "section.catalog",
    ...toolHints("List section pack catalog", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: "List shared marketplace section packs",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: {
          type: "string",
          description:
            "Optional. Include this publication's custom packs alongside the shared ones; omit for the shared catalog only. Unlike other tools this does NOT default to the connected publication — omitting it means something."
        }
      }
    }
  },
  {
    name: "section.pack_create",
    ...toolHints("Create section pack", { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }),
    description: "Create a custom marketplace pack for a publication",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        title: { type: "string" },
        description: { type: "string" },
        styleProfile: {
          type: "object",
          description: "Optional React Email style profile for this template pack."
        },
        sections: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              contentJson: {
                type: "array",
                items: { type: "object" },
                minItems: 1
              }
            },
            required: ["name", "contentJson"]
          },
          minItems: 1
        }
      },
      required: ["title", "sections"]
    }
  },
  {
    name: "section.pack_update",
    ...toolHints("Update section pack", { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }),
    description: "Update a custom marketplace pack",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        packId: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        styleProfile: {
          type: "object",
          description: "Optional React Email style profile for this template pack."
        },
        sections: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              contentJson: {
                type: "array",
                items: { type: "object" },
                minItems: 1
              }
            },
            required: ["name", "contentJson"]
          },
          minItems: 1
        }
      },
      required: ["packId", "title", "sections"]
    }
  },
  {
    name: "section.pack_remove",
    ...toolHints("Delete section pack", { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false }),
    description: "Delete a custom marketplace pack",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        packId: { type: "string" }
      },
      required: ["packId"]
    }
  },
  {
    name: "section.pack_revisions",
    ...toolHints("List section pack revisions", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: "List version history for a custom marketplace pack",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        packId: { type: "string" },
        limit: { type: "number" }
      },
      required: ["packId"]
    }
  },
  {
    name: "section.pack_restore_revision",
    ...toolHints("Restore section pack revision", { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }),
    description: "Restore a custom marketplace pack to a specific revision",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        packId: { type: "string" },
        revisionId: { type: "string" }
      },
      required: ["packId", "revisionId"]
    }
  },
  {
    name: "section.import_pack",
    ...toolHints("Import section pack", { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false }),
    description: "Import a marketplace pack into reusable sections",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        templateId: { type: "string" }
      },
      required: ["templateId"]
    }
  },
  {
    name: "section.create",
    ...toolHints("Create saved section", { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }),
    description: "Create a reusable section snippet",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        name: { type: "string" },
        contentJson: {
          type: "array",
          items: { type: "object" },
          minItems: 1
        }
      },
      required: ["name", "contentJson"]
    }
  },
  {
    name: "section.update",
    ...toolHints("Update saved section", { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: "Update a reusable section snippet",
    inputSchema: {
      type: "object",
      properties: {
        sectionId: { type: "string" },
        name: { type: "string" },
        contentJson: {
          type: "array",
          items: { type: "object" },
          minItems: 1
        }
      },
      required: ["sectionId", "name", "contentJson"]
    }
  },
  {
    name: "section.remove",
    ...toolHints("Delete saved section", { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false }),
    description: "Delete a reusable section snippet",
    inputSchema: {
      type: "object",
      properties: {
        sectionId: { type: "string" }
      },
      required: ["sectionId"]
    }
  },
  {
    name: "issue.preview",
    ...toolHints("Preview issue", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: "Preview newsletter HTML for an issue",
    inputSchema: {
      type: "object",
      properties: {
        issueId: { type: "string" }
      },
      required: ["issueId"]
    }
  },
  {
    name: "issue.preview_draft",
    ...toolHints("Preview unsaved draft", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: "Preview newsletter HTML/text for unsaved draft content",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        title: { type: "string" },
        html: { type: "string" },
        plainText: { type: "string" },
        styleProfile: {
          type: "object",
          description: "Optional React Email style profile overrides."
        }
      },
      required: ["title", "html"]
    }
  },
  {
    name: "issue.delivery_progress",
    ...toolHints("Get delivery progress", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: "Fetch send progress snapshot for an issue",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        issueId: { type: "string" }
      },
      required: ["issueId"]
    }
  },
  {
    name: "issue.wait_delivery",
    ...toolHints("Wait for delivery", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: "Poll issue send progress until sent/failed or timeout",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        issueId: { type: "string" },
        timeoutMs: {
          type: "number",
          description: "Optional timeout in milliseconds. Defaults to 60000."
        },
        pollIntervalMs: {
          type: "number",
          description: "Optional polling interval in milliseconds. Defaults to 2000."
        }
      },
      required: ["issueId"]
    }
  },
  {
    name: "analytics.poll_results",
    ...toolHints("Get poll results", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: "Fetch poll vote totals for a specific issue",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        issueId: { type: "string" }
      },
      required: ["issueId"]
    }
  },
  {
    name: "analytics.issue_performance",
    ...toolHints("Get issue performance", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: "Fetch open/click delivery analytics for an issue",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        issueId: { type: "string" },
        range: {
          type: "string",
          enum: [...ISSUE_ANALYTICS_RANGES],
          description: "Analytics window. Defaults to 30d."
        }
      },
      required: ["issueId"]
    }
  },
  {
    name: "analytics.issue_trend",
    ...toolHints("Get issue trend", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: "Fetch daily open/click trend buckets for an issue",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        issueId: { type: "string" },
        range: {
          type: "string",
          enum: [...ISSUE_ANALYTICS_RANGES],
          description: "Analytics window. Defaults to 30d."
        }
      },
      required: ["issueId"]
    }
  },
  {
    name: "analytics.latest_summary",
    ...toolHints("Get latest analytics summary", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: "Fetch latest issue analytics snapshot for a publication",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        range: {
          type: "string",
          enum: [...ISSUE_ANALYTICS_RANGES],
          description: "Analytics window. Defaults to 7d."
        }
      }
    }
  },
  {
    name: "analytics.issue_export_csv",
    ...toolHints("Export issue analytics CSV", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: "Export issue performance and poll analytics as CSV",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        issueId: { type: "string" },
        range: {
          type: "string",
          enum: [...ISSUE_ANALYTICS_RANGES],
          description: "Analytics window. Defaults to 30d."
        },
        exportType: {
          type: "string",
          enum: ["combined", "performance", "polls"],
          description: "CSV type. Defaults to combined."
        }
      },
      required: ["issueId"]
    }
  },
  {
    name: "analytics.issue_export_performance_csv",
    ...toolHints("Export issue performance CSV", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: "Export issue performance-only analytics as CSV",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        issueId: { type: "string" },
        range: {
          type: "string",
          enum: [...ISSUE_ANALYTICS_RANGES],
          description: "Analytics window. Defaults to 30d."
        }
      },
      required: ["issueId"]
    }
  },
  {
    name: "analytics.issue_export_polls_csv",
    ...toolHints("Export issue poll CSV", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: "Export issue poll-only analytics as CSV",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        issueId: { type: "string" },
        range: {
          type: "string",
          enum: [...ISSUE_ANALYTICS_RANGES],
          description: "Analytics window. Defaults to 30d."
        }
      },
      required: ["issueId"]
    }
  },
  {
    name: "issue.schedule",
    // Destructive and open world: scheduling is a send, just a later one. At the scheduled time the worker mails the audience, and publishes a newsletter to the web, with no further check. Not idempotent: on a failed issue it arms a retry.
    ...toolHints("Schedule issue send", { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true }),
    description:
      "Schedule an issue for delivery. A newsletter is also published to the public website when it has been delivered; a broadcast is email only and never is. The send is refused, with the reason, when the team has no verified sending domain and the audience includes anyone outside the team.",
    inputSchema: {
      type: "object",
      properties: {
        issueId: { type: "string" },
        scheduledFor: {
          type: "string",
          description: "ISO timestamp (optional). Defaults to now."
        }
      },
      required: ["issueId"]
    }
  },
  {
    name: "issue.unschedule",
    ...toolHints("Unschedule issue", { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: "Cancel an issue schedule and move it back to draft",
    inputSchema: {
      type: "object",
      properties: {
        issueId: { type: "string" }
      },
      required: ["issueId"]
    }
  },
  {
    name: "issue.publish_to_web",
    // Open world: the post becomes public. Not destructive: issue.unpublish_from_web takes it down again.
    ...toolHints("Publish issue to website", { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true }),
    description:
      "Publish an issue to the publication's public website, making it readable on the web (typically a sent issue). Newsletters only: a broadcast is email only, and publishing one is refused.",
    inputSchema: {
      type: "object",
      properties: { issueId: { type: "string" } },
      required: ["issueId"]
    }
  },
  {
    name: "issue.unpublish_from_web",
    // Open world: changes the public website. Destructive: it loses the post's place in the archive order, which publishing again does not restore.
    ...toolHints("Unpublish issue from website", { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true }),
    description: "Remove an issue from the publication's public website.",
    inputSchema: {
      type: "object",
      properties: { issueId: { type: "string" } },
      required: ["issueId"]
    }
  },
  {
    name: "issue.send_now",
    // Not idempotent: a repeat on a sending or sent issue is refused, but on a failed issue it sends again.
    ...toolHints("Send issue now", { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true }),
    description:
      "Send an issue immediately. A newsletter is also published to the public website; a broadcast is email only and never is. The send is refused, with the reason, when the team has no verified sending domain and the audience includes anyone outside the team.",
    inputSchema: {
      type: "object",
      properties: {
        issueId: { type: "string" }
      },
      required: ["issueId"]
    }
  },
  {
    name: "issue.send_and_wait",
    ...toolHints("Send issue and wait", { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true }),
    description: "Send an issue now and poll until sent/failed or timeout",
    inputSchema: {
      type: "object",
      properties: {
        issueId: { type: "string" },
        timeoutMs: {
          type: "number",
          description: "Optional timeout in milliseconds. Defaults to 60000."
        },
        pollIntervalMs: {
          type: "number",
          description: "Optional polling interval in milliseconds. Defaults to 2000."
        }
      },
      required: ["issueId"]
    }
  },
  {
    name: "ai.generate_draft",
    // Read only: returns a placeholder scaffold, runs no model and saves nothing.
    ...toolHints("Generate draft scaffold", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description:
      "Return a placeholder scaffold for a draft: a title taken from the prompt and one placeholder paragraph. No AI model runs on Mailtea's side, it does not write copy, and nothing is saved. To make a real draft, write the email yourself (the newsletter.draft_from_brief prompt sets that up) and save it with issue.create_draft.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        prompt: { type: "string", description: "What the email is about. Used for the scaffold's title." },
        tone: {
          type: "string",
          enum: ["neutral", "friendly", "formal"],
          description: "Accepted for compatibility. The scaffold does not change with it."
        }
      },
      required: ["prompt"]
    }
  },
  {
    name: "template.create",
    ...toolHints("Create template", { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }),
    description: `Create an email template. Exactly ONE content source: editor_doc, spec, or html. editor_doc (format "editor") is the same designed template the Visual Email Designer produces and the one to reach for when composing a real email. ${EDITOR_DOC_HELP} spec (format "spec") is the programmatic alternative for generated layouts; available components: Html, Head, Body, Container, Section, Row, Column, Heading, Text, Link, Button, Image, Hr, Preview, Markdown, MailteaHeader, MailteaFooter, MailteaSpacer, MailteaContentBlock. html (format "html") stores raw HTML verbatim. Whichever you use, the template ends up with stored html, so it is sendable from all three. Templates start as draft, so call template.publish before an automation or issue can use one. Sends read the PUBLISHED version (the content, From and Reply-To as of the last template.publish), never later unpublished edits.`,
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        name: { type: "string", description: "Template name (max 120 chars)" },
        html: { type: "string", description: "Raw HTML content (use this OR spec OR editor_doc)" },
        spec: {
          type: "object",
          description: "json-render spec (flat element map). Use this OR html OR editor_doc.",
          properties: {
            root: { type: "string" },
            elements: { type: "object" }
          },
          required: ["root", "elements"]
        },
        ...TEMPLATE_EDITOR_PROPERTIES,
        description: { type: "string", description: "Template description (max 500 chars)" },
        text: { type: "string", description: "Plain-text body." },
        subject: { type: "string", description: "Default email subject line" },
        from: { type: "string", description: "Default sender address." },
        reply_to: { type: "string" },
        variables: TEMPLATE_VARIABLES_SCHEMA
      },
      required: ["name"]
    }
  },
  {
    name: "template.list",
    ...toolHints("List templates", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: "List email templates for a publication",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        limit: { type: "number", description: "Max results (1-100, default 20)" }
      }
    }
  },
  {
    name: "template.get",
    ...toolHints("Get template", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description:
      'Get a single email template by ID, including its rendered html, its spec, and, for format "editor", the editor_doc design source plus style_profile, mailtea_theme and global_css. These fields are the working copy (the latest saved design), which may not be what is sending: has_unpublished_versions: true means it differs from the published version. This is the read half of editing a designed template: get it, change the doc, send it back through template.update. template.list omits all of those (a page of full documents would be a very different response size) and returns only category, preview_image_url and tags alongside the summary.',
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        templateId: { type: "string" }
      },
      required: ["templateId"]
    }
  },
  {
    name: "template.update",
    ...toolHints("Update template", { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: `Update an email template. Pass only the fields to change. Providing spec re-renders email-safe HTML server-side; providing html switches the template to raw HTML; providing editor_doc switches it to format "editor" and re-renders. ${EDITOR_DOC_HELP} Sending html for a template that is ALREADY format "editor" is refused with 400 editor_template_html_not_accepted, since its html is derived and accepting raw html would orphan the design source; send editor_doc instead. The sidecars are sticky: a patch carrying only editor_doc keeps the stored style_profile / mailtea_theme / global_css, and a patch carrying only a sidecar re-bakes the html from the STORED doc, so the rendered email never drifts from the stored styling. Call template.get first to read the current editor_doc. Editing a PUBLISHED template no longer unpublishes it: the change is saved as the working copy and the template keeps its published status and its published version keeps sending, with has_unpublished_versions: true on the response. That includes from, reply_to and style_profile: they are part of the published version too, so a new sender, reply-to address or page style reaches sends only after the next publish. Call template.publish to make the edit live. Pass base_revision (the revision from your last read) so your edit never overwrites a change someone made since; on a 409 stale_write, re-read with template.get and retry.`,
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        templateId: { type: "string" },
        name: { type: "string" },
        html: { type: "string", description: "Raw HTML content (switches the template to raw HTML). Refused for a template that is already format \"editor\"." },
        spec: {
          type: "object",
          description: "json-render spec (flat element map). Re-renders email-safe HTML server-side.",
          properties: { root: { type: "string" }, elements: { type: "object" } },
          required: ["root", "elements"]
        },
        ...TEMPLATE_EDITOR_PROPERTIES,
        // The library metadata is clearable, so it is three-state here where it
        // is two-state on create: omit to leave alone, null to clear.
        global_css: {
          type: ["string", "null"],
          description: "Custom CSS applied to the rendered email, or null to clear it."
        },
        category: {
          type: ["string", "null"],
          description: "Gallery category (max 80 chars), or null to clear it."
        },
        preview_image_url: {
          type: ["string", "null"],
          description: "Gallery thumbnail (max 2048 chars), or null to clear it."
        },
        tags: {
          type: ["array", "null"],
          items: { type: "string" },
          description:
            "Gallery tags (max 50, each 1-60 chars), or null to clear them. NOT audience topics."
        },
        description: { type: "string" },
        text: { type: "string", description: "Plain-text body." },
        subject: { type: "string" },
        from: { type: "string", description: "Default sender address." },
        reply_to: { type: "string" },
        variables: TEMPLATE_VARIABLES_SCHEMA,
        base_revision: {
          type: "integer",
          minimum: 0,
          description:
            "The template's `revision` as you read it (template.get, template.create, or your last template.update). Read first, then send it: the update is applied only if nobody changed what the template sends since (a person editing it in Mailtea Studio, another agent). Otherwise it fails with code stale_write and NOTHING is saved; on that 409, call template.get again, re-apply your change to what it returns, and retry with the new revision. Never resend the same body unchanged. Omit it for an unconditional write that can overwrite someone else's edit."
        }
      },
      required: ["templateId"]
    }
  },
  {
    name: "template.publish",
    // Not destructive: every version is kept (template.versions), and template.unpublish reverses it.
    ...toolHints("Publish template", { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description:
      "Publish an email template: its saved changes, including from and reply_to, become the version that sends. Only a published template can seed an issue, a post, or an automation's send_email step. Calling this on a template that is ALREADY published is how saved edits go live: editing or restoring a published template no longer publishes automatically (see template.update, template.restore_version). The change is saved with has_unpublished_versions: true, and this call is what promotes it. Reversible with template.unpublish. Pass base_revision to publish only the revision you read, never a change someone made since.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        templateId: { type: "string" },
        base_revision: {
          type: "integer",
          minimum: 0,
          description:
            "The template's `revision` as you read it (template.get, or your last template.update). Read first, then send it: the template is published only if nobody changed what it sends since, so you never ship an edit you have not seen. Otherwise it fails with code stale_write and NOTHING is published; on that 409, call template.get again, check the content, and retry with the new revision. Never resend the same request unchanged. Omit it to publish whatever is saved."
        }
      },
      required: ["templateId"]
    }
  },
  {
    name: "template.unpublish",
    ...toolHints("Unpublish template", { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false }),
    description:
      "Return a published email template to draft, taking it out of circulation without deleting it. The body is untouched and published_at is kept as history, and only sendability is retracted, so anything that seeds from this template stops finding it. This is the ONLY way to stop a published template from sending (short of deleting it): editing or restoring it no longer does that on its own. It also drops the published version, so the next template.publish starts from the current (working) content, not the old live one. Unpublishing a template that is already a draft is a no-op, not an error, and template.publish puts it back.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        templateId: { type: "string" }
      },
      required: ["templateId"]
    }
  },
  {
    name: "template.versions",
    ...toolHints("List template versions", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description:
      "List an email template's design history, newest first. Metadata only: one version row carries a whole design document, so the list returns version (integer), origin (\"edit\" | \"publish\" | \"restore\"), restored_from_version, format, name, from, reply_to, sender_recorded, sealed, is_current, is_published, created_at, updated_at and author (or null), never the document itself. from and reply_to are the sender the version holds, and a change to only From or Reply-To records a version (or folds into the open one, like any edit). sender_recorded says what a null means: true, the version had no From or Reply-To and restoring it clears them; false, the version was recorded before versions kept the sender, and restoring it leaves the current ones alone. is_current marks the entry that matches the working copy (the saved design you are editing), NOT necessarily what is sending, and not always the newest entry either: a metadata-only update (renaming, retagging) touches the template without recording a version. is_published marks the entry automations and the API are sending now; the two differ while the template has unpublished changes. is_published is false on every entry of a draft, and on every entry of a template published before the field existed until it is published again. The reply also carries retention: { max_versions, coalesce_window_seconds }. Only the newest max_versions per template are kept, and consecutive edits by the same author through the same channel (Studio, or one API key) inside the coalesce window collapse into one entry, so this is a history of saved designs, not a keystroke log. Feed a version number to template.restore_version to put that design, and its From and Reply-To, back.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        templateId: { type: "string" },
        limit: {
          type: "number",
          description:
            "Max entries (positive integer). Omit for the full retained history; the server caps this at the retention maximum reported in retention.max_versions."
        }
      },
      required: ["templateId"]
    }
  },
  {
    name: "template.restore_version",
    ...toolHints("Restore template version", { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description:
      "Put an older design from template.versions back onto the template, with the version's from and reply_to: the From and Reply-To come back too, including a null that clears them. A version with sender_recorded: false was recorded before versions kept the sender and leaves the current From and Reply-To as they are. ON A LIVE TEMPLATE: restoring is a content write, but it no longer returns the template to draft or stops it sending. The template stays published, the restored design is saved as its working copy (has_unpublished_versions: true on the returned template), and automations, issues and the API keep sending the CURRENTLY PUBLISHED version until template.publish is called to make the restored design live. The unpublished field on the response is kept for older clients and is always false now; read has_unpublished_versions or message instead. History is FORWARD-ONLY: a restore never rewinds, truncates or reorders the list. It first records the design it is about to replace as its own version, then appends the restored design as the new newest version, so a restore is itself undoable: restore the entry directly above the one you just restored. Restoring the design that is already current is a no-op: nothing is written, and the reply is restored: false with reason \"identical\" and unpublished: false. Only the newest versions are kept (see retention on template.versions) and consecutive edits by the same author through the same channel (Studio, or one API key) inside the coalesce window collapse into one entry, so a version can age out of history: asking for one that has returns 404 with code template_version_not_found. Returns { restored, restored_from_version, unpublished, message, template }.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        templateId: { type: "string" },
        version: {
          type: "number",
          description:
            "Version number to restore (a positive integer), as returned by template.versions."
        }
      },
      required: ["templateId", "version"]
    }
  },
  {
    name: "template.duplicate",
    ...toolHints("Duplicate template", { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }),
    description: "Duplicate an email template into a new draft copy.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        templateId: { type: "string" }
      },
      required: ["templateId"]
    }
  },
  {
    name: "template.delete",
    ...toolHints("Delete template", { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false }),
    description: "Delete an email template.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        templateId: { type: "string" }
      },
      required: ["templateId"]
    }
  },
  {
    name: "template.render",
    ...toolHints("Render template spec", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description:
      "Render a json-render spec to email-safe HTML and plain text without creating a template — a dry run for previewing a spec before template.create. Returns { html, text }. Available spec components: Html, Head, Body, Container, Section, Row, Column, Heading, Text, Link, Button, Image, Hr, Preview, Markdown, MailteaHeader, MailteaFooter, MailteaSpacer, MailteaContentBlock.",
    inputSchema: {
      type: "object",
      properties: {
        spec: {
          type: "object",
          description: "json-render spec (flat element map).",
          properties: { root: { type: "string" }, elements: { type: "object" } },
          required: ["root", "elements"]
        },
        variables: {
          type: "object",
          description: "Optional variable values to substitute during render."
        }
      },
      required: ["spec"]
    }
  },
  {
    name: "email.send",
    ...toolHints("Send email", { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true }),
    description:
      "Send a transactional email to one or more specific recipients. Provide inline content (html and/or text) OR a template reference — not both. Unlike issue.send_now (which sends a newsletter to the WHOLE publication list), this delivers a one-shot email to the exact addresses in 'to'. Set scheduled_at to send later. Returns the new email's id. ON MAILTEA CLOUD, UNTIL THE TEAM VERIFIES A SENDING DOMAIN OF ITS OWN, this only delivers to verified members of that team (a self-hosted install is exempt) — whatever 'from' you use. Any other recipient in to/cc/bcc is refused with 403 and reason 'system_domain_recipient_restricted'. Verifying one domain (domain.create, then domain.verify) lifts it for the whole team; the built-in '{slug}.mailtea.email' address stays team-only even then.",
    inputSchema: {
      type: "object",
      properties: {
        from: {
          type: "string",
          description:
            "Sender, e.g. 'Acme <hello@acme.com>'. Must be on a domain the TEAM has verified — any publication of it counts, and a domain nobody on the team verified (a Mailtea address, or another customer's) is refused with 422 and reason 'DOMAIN_NOT_VERIFIED'. Note also the recipient restriction on email.send: a team with no verified domain, and the built-in '{slug}.mailtea.email' address at any time, can only reach verified members of the team. Provide this OR sender_id, not both."
        },
        sender_id: {
          type: "string",
          description:
            "Send as a named sender (alternative to from). With a template, from and sender_id may both be omitted: the publication's default sender is used, then the template's own From."
        },
        to: {
          type: ["string", "array"],
          items: { type: "string" },
          description: "Recipient address, or array of up to 50 addresses."
        },
        subject: {
          type: "string",
          description:
            "Subject line (max 998 chars). Required unless you send a template, whose published subject is then used. With a template, {{variables}} in the subject are filled with the same values and fallbacks as the body."
        },
        html: { type: "string", description: "HTML body. Use this OR template, not both." },
        text: { type: "string", description: "Plain-text body." },
        template: {
          type: "object",
          description:
            "Stored template reference to render instead of inline html. Its published subject, sender and reply-to are the defaults for this send. A template built in the Visual Email Designer is delivered inside its designed page background and card; raw HTML templates are sent exactly as stored.",
          properties: {
            id: { type: "string" },
            variables: { type: "object", description: "Template variable values." }
          },
          required: ["id"]
        },
        cc: { type: ["string", "array"], items: { type: "string" }, description: "CC address(es)." },
        bcc: { type: ["string", "array"], items: { type: "string" }, description: "BCC address(es)." },
        reply_to: {
          type: ["string", "array"],
          items: { type: "string" },
          description: "Reply-To address(es)."
        },
        scheduled_at: {
          type: "string",
          description: "ISO 8601 datetime to schedule the send. Omit to send immediately."
        },
        tags: {
          type: "array",
          description: "Custom tags for filtering/analytics.",
          items: {
            type: "object",
            properties: { name: { type: "string" }, value: { type: "string" } },
            required: ["name", "value"]
          }
        },
        headers: { type: "object", description: "Custom email headers (string values)." },
        tracking_open: {
          type: "boolean",
          description:
            "Set false to send without an open pixel. A domain with open tracking switched off cannot be overridden here."
        },
        tracking_click: {
          type: "boolean",
          description:
            "Set false to send without rewritten links. A domain with click tracking switched off cannot be overridden here."
        },
        attachments: {
          type: "array",
          description: "File attachments.",
          items: {
            type: "object",
            properties: {
              filename: { type: "string" },
              content: { type: "string", description: "Base64-encoded file content." },
              content_type: { type: "string" },
              content_id: { type: "string", description: "For inline images (cid:)." }
            },
            required: ["filename", "content"]
          }
        }
      },
      // subject and one of from / sender_id are required UNLESS a template is
      // sent (it supplies both); enforced in runTool, since JSON Schema
      // `required` can't express either rule.
      required: ["to"]
    }
  },
  {
    name: "email.batch",
    ...toolHints("Send email batch", { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true }),
    description:
      "Send up to 100 transactional emails in one request. Each item is shaped like email.send but WITHOUT attachments or scheduled_at. Returns the ids in request order. The send allowance is measured against the WHOLE batch, not per message: if the batch does not fit in what is left, the request is refused with 403 and NOTHING is created — the error names how many emails the batch needed and how many of the limit are already used. Re-sending the same batch fails identically, so split it into smaller batches or wait for the limit to reset. The recipient restriction applies here too: until the team verifies a sending domain, one item addressing anyone but a verified team member refuses the WHOLE batch with 403 and reason 'system_domain_recipient_restricted' — as does any item sent from the built-in '{slug}.mailtea.email' address.",
    inputSchema: {
      type: "object",
      properties: {
        emails: {
          type: "array",
          description:
            "1-100 email objects: { from, to, subject, html?|text?|template?, cc?, bcc?, reply_to?, tracking_open?, tracking_click?, tags?, headers? }. Every item needs html, text or a template; an item with none of them refuses the WHOLE batch with 400. Every item's `from` must be on a domain the team has verified; one that is not refuses the WHOLE batch with 422 and creates nothing. Set tracking_open/tracking_click false to send without an open pixel or rewritten links; a domain with tracking switched off cannot be overridden here.",
          items: { type: "object" }
        }
      },
      required: ["emails"]
    }
  },
  {
    name: "email.get",
    ...toolHints("Get email", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description:
      "Retrieve a transactional email by id with its delivery status (last_event), the reason it failed if it did (error, failed_at), tracking counters (open_count, click_count), and dropped_recipients — anyone the message did not reach and why. to/cc/bcc are what was ASKED for; a partially-delivered send looks identical to a fully-delivered one unless you read dropped_recipients. Also returns mode; a test-mode row is marked [test] in the summary and was never delivered.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"]
    }
  },
  {
    name: "email.reschedule",
    ...toolHints("Reschedule email", { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: "Reschedule a still-scheduled transactional email to a new time.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        scheduled_at: { type: "string", description: "New ISO 8601 datetime." }
      },
      required: ["id", "scheduled_at"]
    }
  },
  {
    name: "email.cancel",
    ...toolHints("Cancel scheduled email", { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false }),
    description: "Cancel a scheduled transactional email before it sends.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"]
    }
  },
  {
    name: "email.resend",
    ...toolHints("Resend failed email", { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true }),
    description:
      "Resend a failed or bounced transactional email — creates a fresh copy with the same content. Only emails whose status is 'failed' or 'bounced' can be resent; others return an error.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"]
    }
  },
  {
    name: "email.list",
    ...toolHints("List emails", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description:
      "List transactional emails (most recent first). Filter by status, mode (live or test), tags, or a search substring over recipient/sender/subject; paginate with limit/offset. Returns id, status, subject, recipient per email; test-mode rows are marked [test].",
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: [
            "queued",
            "sent",
            "delivered",
            "bounced",
            "complained",
            "failed",
            "scheduled",
            "canceled"
          ],
          description: "Filter by delivery status."
        },
        limit: { type: "number", description: "Max results 1-100 (default 50)." },
        offset: { type: "number", description: "Pagination offset (default 0)." },
        tag_name: { type: "string", description: "Filter by a custom tag name." },
        tag_value: { type: "string", description: "Filter by a custom tag value (use with tag_name)." },
        search: { type: "string", description: "Case-insensitive substring match on recipient, sender, or subject." },
        from_date: {
          type: "string",
          description:
            "ISO 8601 lower bound on created_at. Clamped to the plan's analytics retention window (30 days on most plans, 90 on Scale/Enterprise); reaching further back returns data from the start of that window, and omitting this returns the window rather than all time."
        },
        to_date: { type: "string", description: "ISO 8601 upper bound on created_at." },
        mode: {
          type: "string",
          enum: ["live", "test"],
          description:
            "Which mail to return: 'live' real mail, or 'test' messages sent with a test key (mt_test_...), which are recorded and emit webhooks but are never delivered. There is no mixed view. A test key reads only test mail and a live key only live mail, so this matters to a session-backed credential; asking for the mode your key is not in is an error, not an empty list."
        }
      }
    }
  },
  {
    name: "email.analytics",
    ...toolHints("Get email analytics", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description:
      "Aggregate transactional email metrics over an optional date window: totals, delivered/bounced/opened/clicked counts, per-status counts, and delivery/open/click/bounce rates. Delivery and bounce rates are measured against everything sent; open and click rates exclude bounced mail, which was never open-able.",
    inputSchema: {
      type: "object",
      properties: {
        from_date: {
          type: "string",
          description:
            "ISO 8601 lower bound on created_at. Clamped to the plan's analytics retention window (30 days on most plans, 90 on Scale/Enterprise); reaching further back returns data from the start of that window, and omitting this returns the window rather than all time."
        },
        to_date: { type: "string", description: "ISO 8601 upper bound on created_at." }
      }
    }
  },
  // --- Inbound email (REST /v1/emails/inbound) -----------------------------
  // Only inbound_list takes a publicationId; get/attachments/reply resolve
  // tenancy from the inbound email id.
  {
    name: "email.inbound_list",
    ...toolHints("List inbound emails", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description:
      "List inbound (received) emails for a publication, most recent first; paginate with limit/cursor. Only this inbound tool needs publicationId — email.inbound_get/list_attachments/get_attachment/reply resolve tenancy from the email id.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        limit: { type: "number", description: "Max results (1-100, default 20)." },
        cursor: { type: "string", description: "Opaque pagination cursor from a prior response's next_cursor." }
      }
    }
  },
  {
    name: "email.inbound_get",
    ...toolHints("Get inbound email", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description:
      "Retrieve a single inbound email by id (rxemail_) — headers, html/text body, a signed download URL for the raw message, and its attachments. Tenancy is resolved from the id, so no publicationId is needed.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "Inbound email id (rxemail_)." } },
      required: ["id"]
    }
  },
  {
    name: "email.inbound_list_attachments",
    ...toolHints("List inbound attachments", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description:
      "List the attachments of an inbound email, each with a signed download URL. Tenancy is resolved from the email id, so no publicationId is needed.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "Inbound email id (rxemail_)." } },
      required: ["id"]
    }
  },
  {
    name: "email.inbound_get_attachment",
    ...toolHints("Get inbound attachment", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description:
      "Get a single inbound-email attachment (rxatt_) with a signed download URL. Tenancy is resolved from the parent email id, so no publicationId is needed.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Inbound email id (rxemail_)." },
        attachmentId: { type: "string", description: "Attachment id (rxatt_)." }
      },
      required: ["id", "attachmentId"]
    }
  },
  {
    name: "email.inbound_reply",
    // Not idempotent: idempotency_key is optional, and a repeat without it sends again.
    ...toolHints("Reply to inbound email", { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true }),
    description:
      "Reply to an inbound email. On Mailtea Cloud, a team with no verified sending domain may reply to THE PERSON WHO WROTE (the original's From) or to its own verified members — so answering a customer works — but cc/bcc get no such allowance, and an original whose Reply-To points elsewhere is refused rather than sent to either address (403, reason/code 'system_domain_recipient_restricted'). Verify a domain to lift all of it. The reply threads automatically — In-Reply-To, References, and the To (reply target) are all derived by the server from the original, so they are NOT inputs. Provide html and/or text. Omit `from` to send from the verified domain the mail was delivered to. Tenancy is resolved from the email id (no publicationId). Returns the resulting transactional email id (txemail_) with its status.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Inbound email id (rxemail_) to reply to." },
        from: {
          type: "object",
          description: "Sender override. Omit to send from the verified domain the original was delivered to.",
          properties: {
            email: { type: "string" },
            name: { type: "string" }
          },
          required: ["email"]
        },
        subject: { type: "string", description: "Defaults to the original subject with a single 'Re: ' prefix." },
        html: { type: "string", description: "HTML body (provide html and/or text)." },
        text: { type: "string", description: "Plain-text body (provide html and/or text)." },
        cc: { type: "array", items: { type: "string" }, description: "CC addresses." },
        bcc: { type: "array", items: { type: "string" }, description: "BCC addresses." },
        idempotency_key: { type: "string", description: "Optional key to make the reply idempotent (the Idempotency-Key header wins when both are set)." }
      },
      required: ["id"]
    }
  },
  {
    name: "issue.send_test",
    ...toolHints("Send test email", { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true }),
    description:
      "Send a TEST copy of a newsletter draft to specific recipients (yourself/teammates) to check it before subscribers see it. Renders the issue exactly as a subscriber would receive it and delivers it as a one-shot email with a '[TEST]' subject prefix. This does NOT send to the publication's audience — use issue.send_now for the real send. Until the team verifies a sending domain of its own — and always with a built-in '{slug}.mailtea.email' from — every recipient must be a verified member of the team, or the send is refused with 403 and reason 'system_domain_recipient_restricted'.",
    inputSchema: {
      type: "object",
      properties: {
        issueId: { type: "string" },
        recipients: {
          type: ["string", "array"],
          items: { type: "string" },
          description: "Test recipient address, or array of addresses."
        },
        from: {
          type: "string",
          description:
            "Sender, e.g. 'Acme <hello@acme.com>'. Must use a verified domain; the built-in '{slug}.mailtea.email' address can only reach verified members of the team."
        }
      },
      required: ["issueId", "recipients", "from"]
    }
  },
  // --- Email sending domains (REST /v1/domains) ----------------------------
  // Provision and verify the 'from' domain that email.send / issue.send_test
  // require. (Distinct from publication.domain_* which manage the Traefik
  // website surface of the same publication.)
  {
    name: "domain.create",
    // Idempotent: a repeat for a host this publication already holds is an update of the same row.
    ...toolHints("Add domain", { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true }),
    description:
      "Register a domain for a publication: a sending domain (purpose 'email', or 'both' to also serve the site) or a website domain (purpose 'site', the default). An omitted purpose makes a 'site' domain, which cannot send email, so pass purpose 'email' for a domain you want to send from. Returns the DNS records (in 'records') the operator must add. Each row's 'record' names what it is for (Ownership, DKIM, SPF, MX, Return-Path, Tracking), 'type' is the DNS type, and 'status' is that record's own state. Set purpose to 'email' (or 'both') to use it as a sending 'from' domain; both the ownership TXT and the DKIM TXT must verify before the domain can send. Pick the region closest to your recipients: it is fixed at creation, and moving a domain means deleting and re-adding it.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        name: { type: "string", description: "Domain host, e.g. 'mail.acme.com'." },
        purpose: {
          type: "string",
          enum: ["email", "site", "both"],
          description: "Use 'email' or 'both' for a sending domain. Defaults to 'site', a website-only domain that cannot send email."
        },
        is_primary: { type: "boolean" },
        // Hand-written rather than imported: this package ships with zero
        // runtime dependencies. `domain-region-parity.test.ts` fails if this
        // enum and the platform catalog ever drift apart.
        region: {
          type: "string",
          enum: ["us-west-1", "eu-west-1", "ap-southeast-1", "ap-southeast-2"],
          description:
            "Where this domain's mail is sent from. Defaults to the deployment's default region. CANNOT be changed later — to move a domain, delete it and add it again. A region this deployment has not enabled is refused with code 'region_not_available'."
        },
        tls: {
          type: "string",
          enum: ["opportunistic", "enforced"],
          description:
            "'enforced' means a recipient server that will not negotiate TLS gets a bounce instead of a plaintext delivery. Deliberately trades a little deliverability for the guarantee. Defaults to 'opportunistic'. A region that cannot enforce it refuses with code 'tls_not_available'."
        },
        tracking_subdomain: {
          type: "string",
          description:
            "Serve open-pixel and click-tracking links from your own domain, e.g. 'links' gives links.acme.com. Adds a Tracking CNAME to 'records'; links stay on the platform host until it verifies. Letters, digits and hyphens only; a reserved label, or the one the return-path uses, is refused with code 'tracking_subdomain_invalid'. Unlike domain.update, null is NOT accepted here — a create has nothing to clear, and it is refused as a validation error. Leave the field out to create the domain without a tracking subdomain."
        }
      },
      required: ["name"]
    }
  },
  {
    name: "domain.list",
    ...toolHints("List domains", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: "List email/site domains for a publication, optionally filtered by region or status.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        limit: { type: "number", description: "Max results (1-100, default 20)." },
        // No enum, unlike domain.create: a filter must accept every region
        // the list itself reports, and a domain with no stored region reports
        // the deployment's default, which is outside the catalog in local
        // development (us-east-1) and on self-host. `domain-region-parity.test.ts`
        // checks that this description still names every catalog region.
        region: {
          type: "string",
          description:
            "Only domains sending from this region, as domain.list reports it: one of us-west-1, eu-west-1, ap-southeast-1, ap-southeast-2, or this deployment's default region."
        },
        status: {
          type: "string",
          enum: ["pending", "verified"],
          description: "Only domains in this state."
        }
      }
    }
  },
  {
    name: "domain.get",
    ...toolHints("Get domain", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: "Get a single domain including the DNS 'records' to add for verification.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        domainId: { type: "string" }
      },
      required: ["domainId"]
    }
  },
  {
    name: "domain.verify",
    // Open world: looks the domain's records up in public DNS.
    ...toolHints("Verify domain", { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true }),
    description:
      "Check a domain's DNS and report its verification state. Sending is gated on two parts: the ownership TXT record must verify (which sets status to 'verified') AND the branded DKIM TXT record must verify. Ownership verification alone does NOT make a domain sendable. The response now includes 'dkim_status' and 'receiving_mx_found' so you can confirm both before sending. Verify is also what settles the MX row in 'records': the answer is stored, so every later read of the domain reports what this verify found rather than 'pending'. The response also carries 'receiving_identity_status' (pending, verified, failed, or null when not started): whether the domain is registered to RECEIVE mail at Mailtea's inbound endpoint. Tell the user to point their MX at Mailtea only once it reads 'verified'.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        domainId: { type: "string" }
      },
      required: ["domainId"]
    }
  },
  {
    name: "domain.update",
    // Destructive: removing a tracking subdomain (tracking_subdomain: null) cannot be undone for links already sent.
    ...toolHints("Update domain settings", { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true }),
    description:
      "Update a domain's purpose (email/site/both), primary flag, tracking policy, TLS policy, tracking subdomain, or custom return-path. A domain's REGION cannot be changed — delete it and add it again in the new region. Turning open_tracking or click_tracking off stops Mailtea measuring opens or clicks for EVERY message from this domain — a single send cannot re-enable it. Setting custom_return_path delegates a subdomain as the envelope sender so SPF aligns with this domain; it requires two DNS records and reports back in the domain's records list. Pass tracking_subdomain: null to REMOVE a tracking subdomain — this is not reversible for links already sent.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        domainId: { type: "string" },
        purpose: { type: "string", enum: ["email", "site", "both"] },
        is_primary: { type: "boolean" },
        open_tracking: {
          type: "boolean",
          description: "Whether mail from this domain may carry an open-tracking pixel."
        },
        click_tracking: {
          type: "boolean",
          description: "Whether links in mail from this domain are rewritten for click tracking."
        },
        custom_return_path: {
          description:
            "Custom return-path (MAIL FROM). true delegates the conventional bounce.<domain> subdomain; a string names the subdomain explicitly and must sit under this domain; false reverts to the default return-path. Until the delegated subdomain's DNS resolves, mail still sends on the default return-path — this never blocks delivery.",
          anyOf: [{ type: "boolean" }, { type: "string" }, { type: "null" }]
        },
        // Deliberately no `region`: it is immutable, and advertising it would
        // teach every agent to earn a 400.
        tls: {
          type: "string",
          enum: ["opportunistic", "enforced"],
          description:
            "'enforced' means a recipient server that will not negotiate TLS gets a bounce instead of a plaintext delivery. Refused with code 'tls_not_available' when this domain's region cannot enforce it."
        },
        tracking_subdomain: {
          description:
            "Serve tracked links from your own domain, e.g. 'links' gives links.acme.com. Replaces any subdomain already chosen; links already sent on the old host keep working only while its DNS stays. Pass null to remove it: the domain's links go back to being served from the Mailtea host, and links in mail already sent point at the old hostname and stop resolving — there is no way to reinstate them. An empty string is not a second spelling of null; it is refused with code 'tracking_subdomain_invalid', as is a reserved label or the one the return-path uses.",
          anyOf: [{ type: "string" }, { type: "null" }]
        }
      },
      required: ["domainId"]
    }
  },
  {
    name: "domain.delete",
    ...toolHints("Delete domain", { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true }),
    description: "Remove a domain from a publication.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        domainId: { type: "string" }
      },
      required: ["domainId"]
    }
  },
  // --- Domain claiming (REST /v1/domains/claim) ----------------------------
  // The recovery path for `domain.create` refused with code
  // 'domain_held_elsewhere': another publication holds this host. Claiming
  // needs control of the domain's DNS and nothing else.
  {
    name: "domain.claim",
    // Idempotent: a second claim while one is pending is refused.
    ...toolHints("Claim domain", { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description:
      "Claim a domain that another publication currently holds. Use this ONLY after domain.create was refused with code 'domain_held_elsewhere'. Returns one TXT record in 'records' — the operator must publish it in the domain's DNS to prove they control it, then call domain.claim_verify. The claim expires if it is not verified within 72 hours. Completing a claim releases the other publication's domain: their sending stops, and they are notified by email that the host was released and told how to claim it back. Do not open one for a domain you do not control.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        name: { type: "string", description: "Domain host to claim, e.g. 'acme.com'." },
        region: {
          type: "string",
          enum: ["us-west-1", "eu-west-1", "ap-southeast-1", "ap-southeast-2"],
          description:
            "Where the claimed domain will send from once the claim completes. Fixed at that point, like any domain's region."
        },
        purpose: {
          type: "string",
          enum: ["email", "site", "both"],
          description:
            "What the claimed domain is for: 'email' (sending), 'site' (serving the publication's website) or 'both'. Defaults to 'email'. A 'site' domain gets no sending identity, so pick it when the domain only serves the website."
        }
      },
      required: ["name"]
    }
  },
  {
    name: "domain.claim_get",
    ...toolHints("Get domain claim", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description:
      "Poll a domain claim. 'status' is 'pending', 'completed' or 'failed'; a failed claim carries a machine-readable 'failure_reason' and a completed one carries 'domain_id', the new domain it created.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        claimId: { type: "string" }
      },
      required: ["claimId"]
    }
  },
  {
    name: "domain.claim_verify",
    // Destructive and open world: checks public DNS, and on success releases the other publication's domain (their sending stops) and emails them.
    ...toolHints("Verify domain claim", { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true }),
    description:
      "Check the claim's TXT record and complete the claim if it is there. Safe to call repeatedly: a record that has not propagated yet returns code 'claim_txt_not_found' and leaves the claim pending with the SAME record, so nothing has to be republished. On success the previous holder's domain is released — they are emailed that the host went and how to claim it back — and a new sending domain is created for this publication, returned in full as 'domain' so its DNS records can be published without a second call.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        claimId: { type: "string" }
      },
      required: ["claimId"]
    }
  },
  {
    name: "domain.claim_cancel",
    ...toolHints("Cancel domain claim", { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false }),
    description:
      "Withdraw a pending domain claim. Only a pending claim can be cancelled; a completed or failed one returns code 'claim_not_pending'.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        claimId: { type: "string" }
      },
      required: ["claimId"]
    }
  },
  // --- Tracking sub-domains (CNAME, under a domain) -------------------------
  {
    name: "domain.tracking_create",
    ...toolHints("Add tracking subdomain", { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }),
    description:
      "Add a tracking sub-domain (CNAME) under a domain — used to serve open-pixel/click-tracking links from your own domain. Returns the CNAME record to add, then call domain.tracking_verify.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        domainId: { type: "string", description: "Parent domain ID." },
        subdomain: {
          type: "string",
          description: "Sub-domain label (lowercase alphanumeric and hyphens), e.g. 'links'."
        }
      },
      required: ["domainId", "subdomain"]
    }
  },
  {
    name: "domain.tracking_list",
    ...toolHints("List tracking subdomains", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: "List tracking sub-domains for a domain.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        domainId: { type: "string" }
      },
      required: ["domainId"]
    }
  },
  {
    name: "domain.tracking_verify",
    // Open world: looks the CNAME up in public DNS.
    ...toolHints("Verify tracking subdomain", { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true }),
    description:
      "Verify a tracking sub-domain by checking its CNAME record; status becomes 'verified'. It removes every other tracking subdomain on the domain and detaches their edge hosts.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        domainId: { type: "string" },
        trackingDomainId: { type: "string" }
      },
      required: ["domainId", "trackingDomainId"]
    }
  },
  {
    name: "domain.tracking_delete",
    // Open world: detaches the tracking host from the edge that serves it.
    ...toolHints("Delete tracking subdomain", { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true }),
    description: "Remove a tracking sub-domain.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        domainId: { type: "string" },
        trackingDomainId: { type: "string" }
      },
      required: ["domainId", "trackingDomainId"]
    }
  },
  // --- Outbound webhooks (REST /v1/webhooks/endpoints) ----------------------
  {
    name: "webhook.create",
    // Open world: from now on, event data goes to the endpoint URL, which is outside Mailtea.
    ...toolHints("Create webhook", { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }),
    description:
      "Register an outbound webhook endpoint that receives delivery/engagement events. Returns a signing_secret (shown only once) used to verify payloads.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        endpoint: { type: "string", description: "HTTPS URL to deliver events to." },
        events: {
          type: "array",
          items: { type: "string" },
          description:
            "Event types to subscribe to. One or more of: email.received, email.sent, email.delivered, email.delivery_delayed, email.bounced, email.complained, email.opened, email.clicked, email.failed, email.suppressed, contact.created, contact.updated, contact.deleted, contact.unsubscribed, contact.topic_subscribed, contact.topic_unsubscribed, automation.run.started, automation.run.completed, automation.run.failed, automation.run.exited, automation.step.completed. automation.run.exited is distinct from completed: it means the contact left the journey early (unsubscribed, suppressed, archived) and carries the reason. automation.step.completed fires for side-effecting steps only. contact.topic_subscribed and contact.topic_unsubscribed fire only on a genuine change in effective topic membership, so re-asserting an opt-out topic's default emits nothing."
        }
      },
      required: ["endpoint", "events"]
    }
  },
  {
    name: "webhook.list",
    ...toolHints("List webhooks", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: "List outbound webhooks for a publication (signing secrets omitted).",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        limit: { type: "number", description: "Max results (1-100, default 20)." }
      }
    }
  },
  {
    name: "webhook.get",
    ...toolHints("Get webhook", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: "Get a single outbound webhook by ID.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        webhookId: { type: "string" }
      },
      required: ["webhookId"]
    }
  },
  {
    name: "webhook.update",
    // Open world: can point event data at a different outside URL.
    ...toolHints("Update webhook", { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true }),
    description: "Update a webhook's endpoint, subscribed events, or enabled/disabled status.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        webhookId: { type: "string" },
        endpoint: { type: "string" },
        events: { type: "array", items: { type: "string" } },
        status: { type: "string", enum: ["enabled", "disabled"] }
      },
      required: ["webhookId"]
    }
  },
  {
    name: "webhook.delete",
    ...toolHints("Delete webhook", { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false }),
    description: "Delete an outbound webhook.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        webhookId: { type: "string" }
      },
      required: ["webhookId"]
    }
  },
  // --- Audience segments (REST /v1/segments) --------------------------------
  {
    name: "segment.create",
    ...toolHints("Create segment", { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }),
    description:
      "Create a saved audience segment defined by filters: status_filter, query_filter and/or inactive_days (filter-based, not manual membership).",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        name: { type: "string" },
        description: { type: "string" },
        status_filter: { type: "string", enum: ["active", "unsubscribed", "suppressed"] },
        query_filter: { type: "string", description: "Search/filter expression over contacts." },
        inactive_days: {
          type: "integer",
          minimum: 1,
          maximum: 3650,
          description: SEGMENT_INACTIVE_DAYS_HELP
        }
      },
      required: ["name"]
    }
  },
  {
    name: "segment.list",
    ...toolHints("List segments", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: "List saved audience segments for a publication.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        limit: { type: "number", description: "Max results (1-100, default 20)." }
      }
    }
  },
  {
    name: "segment.get",
    ...toolHints("Get segment", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: "Get a single audience segment by ID.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        segmentId: { type: "string" }
      },
      required: ["segmentId"]
    }
  },
  {
    name: "segment.update",
    ...toolHints("Update segment", { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: "Update an audience segment's name, description, or filters.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        segmentId: { type: "string" },
        name: { type: "string" },
        description: { type: "string" },
        status_filter: {
          type: ["string", "null"],
          enum: ["active", "unsubscribed", "suppressed", null],
          description: "Filter by contact status, or null to clear it."
        },
        query_filter: {
          type: ["string", "null"],
          description: "Search/filter expression, or null to clear it."
        },
        inactive_days: {
          type: ["integer", "null"],
          minimum: 1,
          maximum: 3650,
          description: `${SEGMENT_INACTIVE_DAYS_HELP} Pass null to clear it; omit it to leave it unchanged. A segment with contacts added to it cannot take a filter.`
        }
      },
      required: ["segmentId"]
    }
  },
  {
    name: "segment.delete",
    ...toolHints("Delete segment", { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false }),
    description:
      "Delete an audience segment. A segment that a draft, scheduled or sending post targets cannot be deleted: the call is refused with segment_in_use and lists those posts. Point each draft at another segment with issue.update_draft (segmentId), or pass null there to send it to all active contacts; unschedule a scheduled post first (issue.unschedule). A post that is sending frees the segment when it finishes.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        segmentId: { type: "string" }
      },
      required: ["segmentId"]
    }
  },
  // --- Contact custom properties (REST /v1/contact-properties; team-scoped) -
  {
    name: "contact_property.create",
    ...toolHints("Create contact property", { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }),
    description:
      "Define a custom contact property (custom field) for the team. Property values are set per-contact via contact.set_properties.",
    inputSchema: {
      type: "object",
      properties: {
        key: {
          type: "string",
          description: "Property key (starts with a letter; letters, numbers, underscores)."
        },
        type: { type: "string", enum: ["string", "number"] },
        fallback_value: { description: "Default value when a contact has none (matches type)." },
        description: { type: "string" }
      },
      required: ["key", "type"]
    }
  },
  {
    name: "contact_property.list",
    ...toolHints("List contact properties", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: "List the team's custom contact property definitions.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Max results (1-100, default 20)." }
      }
    }
  },
  {
    name: "contact_property.update",
    ...toolHints("Update contact property", { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: "Update a custom contact property's fallback value or description.",
    inputSchema: {
      type: "object",
      properties: {
        propertyId: { type: "string" },
        fallback_value: {},
        description: { type: "string" }
      },
      required: ["propertyId"]
    }
  },
  {
    name: "contact_property.delete",
    ...toolHints("Delete contact property", { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false }),
    description: "Delete a custom contact property definition.",
    inputSchema: {
      type: "object",
      properties: {
        propertyId: { type: "string" }
      },
      required: ["propertyId"]
    }
  },
  // --- Contact completeness (REST GET/DELETE + tRPC property values) --------
  {
    name: "contact.get",
    ...toolHints("Get contact", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: "Get a single contact by its ID or email address.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        idOrEmail: { type: "string", description: "Contact ID or email address." }
      },
      required: ["idOrEmail"]
    }
  },
  {
    name: "contact.delete",
    ...toolHints("Delete contact", { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false }),
    description: "Permanently delete a contact by its ID or email address.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        idOrEmail: { type: "string", description: "Contact ID or email address." }
      },
      required: ["idOrEmail"]
    }
  },
  {
    name: "contact.get_properties",
    ...toolHints("Get contact properties", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: "Read a contact's custom property values.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        contactId: { type: "string" }
      },
      required: ["contactId"]
    }
  },
  {
    name: "contact.set_properties",
    ...toolHints("Set contact properties", { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description:
      "Set a contact's custom property values — the data behind {{contact.<key>}} merge tags. " +
      "Defining a property (contact_property.create) only creates the field; this puts a value on a contact. " +
      "Identify each value by `key` (the name you write in the template) or by `propertyId` — exactly one. " +
      "An empty `value` CLEARS the property, which makes its fallback_value apply again on the next send.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        contactId: { type: "string" },
        values: {
          type: "array",
          items: {
            type: "object",
            properties: {
              key: {
                type: "string",
                description:
                  "The property key, e.g. `first_name` — the same name used in the template as {{contact.first_name}}. Give this OR propertyId, not both."
              },
              propertyId: {
                type: "string",
                description: "The property's id, from contact_property.list/create. Give this OR key, not both."
              },
              value: {
                type: "string",
                description: "The value to store. Empty string clears it and restores the fallback."
              }
            },
            required: ["value"]
          }
        }
      },
      required: ["contactId", "values"]
    }
  },
  // --- Topic definitions (REST /v1/topics) ---------------------------------
  {
    name: "topic.create",
    ...toolHints("Create topic", { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }),
    description:
      "Create a topic definition. NOTE: topics cannot yet be assigned to individual contacts via the API — this manages topic definitions only.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        name: { type: "string" },
        default_subscription: {
          type: "string",
          enum: ["opt_in", "opt_out"],
          description:
            "opt_out = subscribed by default (recipients may opt out); opt_in = only explicitly opted-in recipients receive it."
        },
        description: { type: "string" },
        visibility: {
          type: "string",
          enum: ["public", "private"],
          description:
            "public = the topic appears on the reader preference page as its own subscription (what the industry calls an unsubscribe group), using its description as the reader-facing copy; private = internal only, never shown to readers."
        }
      },
      required: ["name", "default_subscription"]
    }
  },
  {
    name: "topic.list",
    ...toolHints("List topics", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: "List topic definitions for a publication.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        limit: { type: "number", description: "Max results (1-100, default 20)." }
      }
    }
  },
  {
    name: "topic.update",
    ...toolHints("Update topic", { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: "Update a topic definition's name, description, default subscription, or visibility.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        topicId: { type: "string" },
        name: { type: "string" },
        description: { type: "string" },
        default_subscription: {
          type: "string",
          enum: ["opt_in", "opt_out"],
          description:
            "opt_out = subscribed by default (recipients may opt out); opt_in = only explicitly opted-in recipients receive it."
        },
        visibility: {
          type: "string",
          enum: ["public", "private"],
          description:
            "public = the topic appears on the reader preference page as its own subscription (what the industry calls an unsubscribe group), using its description as the reader-facing copy; private = internal only, never shown to readers."
        }
      },
      required: ["topicId"]
    }
  },
  {
    name: "topic.delete",
    ...toolHints("Delete topic", { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false }),
    description: "Delete a topic definition.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        topicId: { type: "string" }
      },
      required: ["topicId"]
    }
  },
  // --- API keys (REST /v1/api-keys; requires settings:write) ----------------
  {
    name: "api_key.create",
    ...toolHints("Create API key", { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }),
    description:
      "Create an API key (PAT). Requires the calling token to hold settings:write AND every scope the new key would grant. The token value is returned ONCE — store it securely. 'full_access' grants all scopes; 'sending_access' grants issue read/write/send only. Pass mode 'test' for a key whose sends are simulated rather than delivered.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Human label for the key (max 50 chars)." },
        permission: {
          type: "string",
          enum: ["full_access", "sending_access"],
          description: "Defaults to full_access."
        },
        domain_id: { type: "string", description: "Optional publication scope for sending_access." },
        mode: {
          type: "string",
          enum: ["live", "test"],
          description:
            "Defaults to live. A test key is prefixed mt_test_: its sends are validated, recorded and emit webhooks but are never delivered, and it reads only test mail. It is NOT a data sandbox — it reads and writes the real contacts, templates, senders and webhooks. Only delivery is simulated."
        }
      },
      required: ["name"]
    }
  },
  {
    name: "api_key.list",
    ...toolHints("List API keys", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: "List the team's API keys (token values are never returned).",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "api_key.revoke",
    ...toolHints("Revoke API key", { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false }),
    description: "Revoke (delete) an API key by its ID.",
    inputSchema: {
      type: "object",
      properties: {
        keyId: { type: "string" }
      },
      required: ["keyId"]
    }
  },
  {
    name: "automation.create",
    ...toolHints("Create automation", { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }),
    description: `Create an automation — a triggered email journey graph — in draft status. ${AUTOMATION_SNAKE_CASE_HELP} ${AUTOMATION_TRIGGER_HELP} ${AUTOMATION_STEP_CONFIG_HELP} Failures come back as coded issues[], not zod errors; pass validate_only to rehearse a graph before committing it. ${AUTOMATION_CATALOG_HELP}`,
    inputSchema: {
      type: "object",
      properties: {
        publication_id: PUBLICATION_ID_SCHEMA,
        name: { type: "string", description: "Automation name (max 120 chars)." },
        description: { type: "string", description: "Optional description (max 500 chars)." },
        steps: AUTOMATION_STEPS_SCHEMA,
        connections: AUTOMATION_CONNECTIONS_SCHEMA,
        reentry_policy: {
          type: "string",
          enum: ["once", "once_per_window", "always"],
          description:
            "How often one contact may enter. Default once. once_per_window REQUIRES reentry_window_seconds, which is rejected on any other policy."
        },
        reentry_window_seconds: {
          type: ["number", "null"],
          description:
            "Re-entry window in seconds. Valid only with reentry_policy once_per_window; pass null to leave it unset."
        },
        on_step_failure: {
          type: "string",
          enum: ["fail", "continue"],
          description: "What a failing step does to the run. Default fail."
        },
        validate_only: AUTOMATION_VALIDATE_ONLY_SCHEMA
      },
      required: ["name", "steps"]
    }
  },
  {
    name: "automation.list",
    ...toolHints("List automations", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: `List automations for a publication. List items omit steps, connections, valid and issues — call automation.get for the graph. ${AUTOMATION_SNAKE_CASE_HELP}`,
    inputSchema: {
      type: "object",
      properties: {
        publication_id: PUBLICATION_ID_SCHEMA,
        status: {
          type: "string",
          enum: ["draft", "active", "paused", "archived"],
          description: "Filter by lifecycle status."
        },
        limit: { type: "number", description: "Max results (1-100, default 20)." },
        after: { type: "string", description: "Cursor from a previous page." }
      }
    }
  },
  {
    name: "automation.get",
    ...toolHints("Get automation", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: `Get one automation with its full graph (steps, connections) plus valid and issues[]. There is deliberately no automation.test tool — a test run sends real, billed email, so it is not exposed to agents. ${AUTOMATION_SNAKE_CASE_HELP}`,
    inputSchema: {
      type: "object",
      properties: {
        publication_id: PUBLICATION_ID_SCHEMA,
        automation_id: { type: "string" }
      },
      required: ["automation_id"]
    }
  },
  {
    name: "automation.update",
    // Open world: a steps update to an ACTIVE automation goes live at once and can email contacts.
    ...toolHints("Update automation", { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true }),
    description: `Update an automation. Pass only the fields to change; passing steps replaces the whole graph and cuts a new version. Fields you omit keep their STORED value, so reentry_window_seconds must be sent as null to clear it. Switching reentry_policy from once_per_window to once or always without doing so fails with "reentry_window_seconds is only valid when reentry_policy is once_per_window" on this and every later call. Saving is never blocked for draft/paused/archived automations: issues ride along informationally. A graph update to an ACTIVE automation is refused with 422 active_graph_invalid only when it adds an error the live version does not already have (issues[] lists just those new ones; issues already live carry pre_existing: true and do not block). Changing the trigger (trigger_type or trigger_key) of an ACTIVE automation is refused with 422 trigger_locked_while_active: pause it first, then change the trigger. Pass base_version with steps (the version from your last read) so your graph never overwrites steps someone saved since; on a 409 stale_version, re-read with automation.get and retry. ${AUTOMATION_SNAKE_CASE_HELP} ${AUTOMATION_STEP_CONFIG_HELP} ${AUTOMATION_CATALOG_HELP}`,
    inputSchema: {
      type: "object",
      properties: {
        publication_id: PUBLICATION_ID_SCHEMA,
        automation_id: { type: "string" },
        name: { type: "string", description: "Automation name (max 120 chars)." },
        description: { type: "string", description: "Description (max 500 chars)." },
        steps: AUTOMATION_STEPS_SCHEMA,
        connections: AUTOMATION_CONNECTIONS_SCHEMA,
        reentry_policy: {
          type: "string",
          enum: ["once", "once_per_window", "always"],
          description:
            "once_per_window REQUIRES reentry_window_seconds, which is rejected on any other policy."
        },
        reentry_window_seconds: {
          type: ["number", "null"],
          description:
            "Re-entry window in seconds. A PATCH merges with the STORED value, so moving off once_per_window means clearing this in the SAME call — pass null. Omitting it keeps the stored window, which the server then rejects against the new policy."
        },
        on_step_failure: { type: "string", enum: ["fail", "continue"] },
        validate_only: AUTOMATION_VALIDATE_ONLY_SCHEMA,
        base_version: {
          type: "integer",
          minimum: 1,
          description:
            "The automation's `version` as you read it (automation.get, or your last create/update), sent with steps. Read first, then send it: the new steps are saved only if nobody saved a different graph since (a person in the Mailtea Studio builder, another agent). Otherwise it fails with code stale_version, NOTHING is saved and no version is cut; on that 409, call automation.get again, rebuild your change on the steps it returns, and retry with the new version. Never resend the same steps unchanged. Steps identical to the live graph are accepted whatever the version. Ignored without steps. Omit it for an unconditional write that can overwrite someone else's steps."
        }
      },
      required: ["automation_id"]
    }
  },
  {
    name: "automation.validate",
    ...toolHints("Validate automation graph", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: `Validate a graph without creating anything — the standalone dry run for a graph with no automation in existence yet. Returns {valid, issues[]} with the same coded issues a create or update failure returns. ${AUTOMATION_SNAKE_CASE_HELP} ${AUTOMATION_STEP_CONFIG_HELP} ${AUTOMATION_CATALOG_HELP}`,
    inputSchema: {
      type: "object",
      properties: {
        publication_id: PUBLICATION_ID_SCHEMA,
        steps: AUTOMATION_STEPS_SCHEMA,
        connections: AUTOMATION_CONNECTIONS_SCHEMA
      },
      required: ["steps"]
    }
  },
  {
    name: "automation.enable",
    // Destructive and open world: from now on the automation emails every contact it enrolls, and sent mail cannot be recalled.
    ...toolHints("Enable automation", { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true }),
    description: `Activate an automation so it starts enrolling contacts. Refused with coded issues[] when the graph has errors, except an unknown_step_ref at a config.* path or a trigger missing_branch that the version it last ran on already had (pre_existing: true); a never-started draft is blocked by those too. Also refused with code no_verified_sender when a send_email step has no sender it can send from: reason is NO_SENDER (no step sender, no publication default, no template from_address), DOMAIN_NOT_VERIFIED, WRONG_PURPOSE, DKIM_NOT_VERIFIED, INVALID_FROM, CUSTOM_DOMAIN_REQUIRED or BUILT_IN_SENDER, and steps[] names every blocking step key. Add a sender or verify its sending domain, then enable again. Two reasons are Mailtea Cloud only, because an automation emails contacts and some sends only reach the team's own members: CUSTOM_DOMAIN_REQUIRED means the team has not verified a sending domain of its own, so verify one (domain.create with purpose 'email', then domain.verify); BUILT_IN_SENDER means the step sends from the built-in {slug}.mailtea.email address, so give it a sender or template From on the team's verified domain. Then enable again. There is deliberately no automation.test tool: a test run sends real, billed email, so it is not exposed to agents. ${AUTOMATION_SNAKE_CASE_HELP}`,
    inputSchema: {
      type: "object",
      properties: {
        publication_id: PUBLICATION_ID_SCHEMA,
        automation_id: { type: "string" }
      },
      required: ["automation_id"]
    }
  },
  {
    name: "automation.disable",
    // Destructive: with cancel_runs true, in-flight runs are canceled for good. Without it, pausing is reversible.
    ...toolHints("Pause automation", { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false }),
    description: `Pause an automation: it stops enrolling new contacts. In-flight runs are LEFT RUNNING unless cancel_runs is true. ${AUTOMATION_SNAKE_CASE_HELP}`,
    inputSchema: {
      type: "object",
      properties: {
        publication_id: PUBLICATION_ID_SCHEMA,
        automation_id: { type: "string" },
        cancel_runs: {
          type: "boolean",
          description: "Also cancel in-flight runs. Defaults to false for pause.",
          default: false
        }
      },
      required: ["automation_id"]
    }
  },
  {
    name: "automation.archive",
    ...toolHints("Archive automation", { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false }),
    description: `Archive an automation. In-flight runs are canceled unless cancel_runs is false. Returns canceled_runs. ${AUTOMATION_SNAKE_CASE_HELP}`,
    inputSchema: {
      type: "object",
      properties: {
        publication_id: PUBLICATION_ID_SCHEMA,
        automation_id: { type: "string" },
        cancel_runs: {
          type: "boolean",
          description: "Cancel in-flight runs. Defaults to true for archive.",
          default: true
        }
      },
      required: ["automation_id"]
    }
  },
  {
    name: "automation.delete",
    ...toolHints("Delete automation", { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false }),
    description: `Permanently delete an automation. Deleting an ACTIVE automation is refused with automation_active and its active_run_count — pause or archive it first. ${AUTOMATION_SNAKE_CASE_HELP}`,
    inputSchema: {
      type: "object",
      properties: {
        publication_id: PUBLICATION_ID_SCHEMA,
        automation_id: { type: "string" }
      },
      required: ["automation_id"]
    }
  },
  {
    name: "automation.versions",
    ...toolHints("List automation versions", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: `List an automation's graph versions, newest first — version number, graph_hash, trigger, is_live and created_at, without the graph itself. Versions are not cosmetic: an in-flight run is PINNED to the version it started on, so updating steps cuts a new version and leaves every running contact executing the old graph. Call automation.version for one version's steps and connections. ${AUTOMATION_SNAKE_CASE_HELP}`,
    inputSchema: {
      type: "object",
      properties: {
        publication_id: PUBLICATION_ID_SCHEMA,
        automation_id: { type: "string" },
        limit: { type: "number", description: "Max results (1-100, default 20)." },
        after: { type: "string", description: "Cursor from a previous page." }
      },
      required: ["automation_id"]
    }
  },
  {
    name: "automation.version",
    ...toolHints("Get automation version", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: `Get one historical graph version in full, including its steps and connections. This is the graph a run pinned to that version is actually executing, so read it — not the live automation — when explaining what an in-flight or completed run did. ${AUTOMATION_SNAKE_CASE_HELP}`,
    inputSchema: {
      type: "object",
      properties: {
        publication_id: PUBLICATION_ID_SCHEMA,
        automation_id: { type: "string" },
        version: {
          type: "number",
          description:
            "Version number (a positive integer), as returned by automation.versions or as run.version on a run."
        }
      },
      required: ["automation_id", "version"]
    }
  },
  {
    name: "automation.metrics",
    ...toolHints("Get automation metrics", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: `Per-step performance for an automation: run totals plus entered/succeeded/failed/skipped/waiting per step, branch splits for condition and wait_for_event, and email counters for send_email. Test runs are excluded. Metrics are keyed by step_key, so renaming a step orphans its history.

READING THE RESPONSE — three points, each of which otherwise produces a confidently wrong answer:
- version vs graph_version. \`version\`/\`version_id\` say what the numbers are SCOPED to, and are NULL whenever no \`version\` was passed, because the aggregate then spans every version. \`graph_version\`/\`graph_version_id\` say only which graph supplied the step LABELS (the live version). State the scope from \`version\`, and say "all versions" when it is null — quoting \`graph_version\` as the scope captions combined v1+v2 traffic as a single version.
- \`steps[]\` is keyed on (step_key, step_type), NOT on step_key alone. A key deleted as one step type and later re-added as another appears as two entries with the same \`step_key\` in an all-versions aggregate. Do not merge or de-duplicate them by key; they are different steps.
- \`email.delivered\` means CURRENTLY delivered — accepted and not subsequently bounced — so delivered + bounced never exceeds sent. It is not a running total of everything ever accepted. ${AUTOMATION_SNAKE_CASE_HELP}`,
    inputSchema: {
      type: "object",
      properties: {
        publication_id: PUBLICATION_ID_SCHEMA,
        automation_id: { type: "string" },
        version: {
          type: "number",
          description:
            "Restrict to one graph version. Omit to aggregate across ALL versions — the response then reports version: null, since no single version scopes those counts."
        },
        since: { type: "string", description: "ISO 8601 lower bound." },
        until: { type: "string", description: "ISO 8601 upper bound." }
      },
      required: ["automation_id"]
    }
  },
  {
    name: "automation_run.list",
    ...toolHints("List automation runs", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: `List runs of an automation. Each run pins the graph version it started on. ${AUTOMATION_SNAKE_CASE_HELP}`,
    inputSchema: {
      type: "object",
      properties: {
        publication_id: PUBLICATION_ID_SCHEMA,
        automation_id: { type: "string" },
        status: {
          type: "string",
          description:
            "Comma-separated run statuses: scheduled, executing, waiting_event, completed, failed, canceled, exited."
        },
        contact_id: { type: "string", description: "Only runs for this contact." },
        is_test: { type: "boolean", description: "Filter test runs in or out." },
        limit: { type: "number", description: "Max results (1-100, default 20)." },
        after: { type: "string", description: "Cursor from a previous page." }
      },
      required: ["automation_id"]
    }
  },
  {
    name: "automation_run.get",
    ...toolHints("Get automation run", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: `Get one run in full: the PINNED graph it is executing (not the live one), current step, waiting state, last error, and per-step step_runs.

A step_run whose output carries \`recorded_after_run_ended: true\` finished AFTER the run itself ended — the run was canceled, archived, or the contact unsubscribed while that step was in flight. Its \`completed_at\` is legitimately later than the run's own, and the side effect really happened (the email was sent and billed), so it is not an error and not a data glitch. The run did not resume, and no automation.step.completed webhook fired for it. ${AUTOMATION_SNAKE_CASE_HELP}`,
    inputSchema: {
      type: "object",
      properties: {
        publication_id: PUBLICATION_ID_SCHEMA,
        automation_id: { type: "string" },
        run_id: { type: "string" }
      },
      required: ["automation_id", "run_id"]
    }
  },
  {
    name: "automation_run.cancel",
    ...toolHints("Cancel automation run", { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false }),
    description: `Cancel one in-flight run. Returns the run in full. ${AUTOMATION_SNAKE_CASE_HELP}`,
    inputSchema: {
      type: "object",
      properties: {
        publication_id: PUBLICATION_ID_SCHEMA,
        automation_id: { type: "string" },
        run_id: { type: "string" }
      },
      required: ["automation_id", "run_id"]
    }
  },
  {
    name: "event.send",
    // Destructive and open world: the event enrolls contacts in automations and resumes waiting runs, which send email. Not idempotent: idempotency_key is optional.
    ...toolHints("Send custom event", { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true }),
    description: `Ingest a custom event. Enrolls contacts into automations triggered on that event name and resumes runs waiting for it. Provide exactly one of contact_id or email. Idempotent on idempotency_key: a replay returns the ORIGINAL event id with enrolled_automations: 0, resumed_runs: 0, replayed: true. resumed_runs: 0 does not prove nothing matched — read the run, not the counter. ${AUTOMATION_SNAKE_CASE_HELP}`,
    inputSchema: {
      type: "object",
      properties: {
        publication_id: PUBLICATION_ID_SCHEMA,
        event_name: {
          type: "string",
          description: "Event name, pattern ^[a-z0-9][a-z0-9._-]{0,63}$. Sent as `name` to the API."
        },
        contact_id: { type: "string", description: "Contact to attribute the event to. Provide this OR email." },
        email: { type: "string", description: "Contact email. Provide this OR contact_id." },
        create_contact: {
          type: "boolean",
          description:
            "Create the contact when the email resolves to nobody. Opt-in: without it an unresolvable contact is a 404.",
          default: false
        },
        properties: {
          type: "object",
          description:
            "Event payload, readable from conditions as event.properties.*. Max 32 KB serialized, 8 levels deep. `__proto__` keys are refused."
        },
        occurred_at: { type: "string", description: "ISO 8601 timestamp. Defaults to now." },
        idempotency_key: { type: "string", description: "Replay guard; see the description." }
      },
      required: ["event_name"]
    }
  },
  {
    name: "event_definition.list",
    ...toolHints("List event definitions", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: `List declared event definitions for a publication. ${AUTOMATION_SNAKE_CASE_HELP}`,
    inputSchema: {
      type: "object",
      properties: {
        publication_id: PUBLICATION_ID_SCHEMA,
        limit: { type: "number", description: "Max results (1-100, default 20)." },
        after: { type: "string", description: "Cursor from a previous page." }
      }
    }
  },
  {
    name: "event_definition.get",
    ...toolHints("Get event definition", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: `Get one event definition, including inferred_properties computed over the last 500 events. Watch the coverage figure: a condition on a key present in 3% of events will almost never match. ${AUTOMATION_SNAKE_CASE_HELP}`,
    inputSchema: {
      type: "object",
      properties: {
        publication_id: PUBLICATION_ID_SCHEMA,
        definition_id: { type: "string" }
      },
      required: ["definition_id"]
    }
  },
  {
    name: "event_definition.create",
    ...toolHints("Create event definition", { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }),
    description: `Declare an event name and its optional property schema so operators and agents can discover it. ${EVENT_SCHEMA_DOCUMENT_HELP} ${AUTOMATION_SNAKE_CASE_HELP}`,
    inputSchema: {
      type: "object",
      properties: {
        publication_id: PUBLICATION_ID_SCHEMA,
        event_name: {
          type: "string",
          description: "Event name, pattern ^[a-z0-9][a-z0-9._-]{0,63}$. Sent as `name` to the API."
        },
        description: { type: "string" },
        schema_json: {
          type: "object",
          description:
            "Event schema document — NOT JSON Schema. Only the keys {properties, additional_properties} are accepted; see the tool description for the grammar and an example."
        }
      },
      required: ["event_name"]
    }
  },
  {
    name: "event_definition.update",
    ...toolHints("Update event definition", { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: `Update an event definition's description or schema. The event name is immutable — renaming is refused with event_name_immutable. Omitting schema_json leaves the stored schema untouched; passing schema_json: null CLEARS it and returns the event to free-form. ${EVENT_SCHEMA_DOCUMENT_HELP} ${AUTOMATION_SNAKE_CASE_HELP}`,
    inputSchema: {
      type: "object",
      properties: {
        publication_id: PUBLICATION_ID_SCHEMA,
        definition_id: { type: "string" },
        description: { type: "string" },
        schema_json: {
          type: ["object", "null"],
          description:
            "Event schema document — NOT JSON Schema. Only the keys {properties, additional_properties} are accepted; see the tool description for the grammar and an example. Pass null to clear the stored schema, or omit the key to leave it alone."
        }
      },
      required: ["definition_id"]
    }
  },
  {
    name: "event_definition.delete",
    ...toolHints("Delete event definition", { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false }),
    description: `Delete an event definition. This removes the DECLARATION only: past events are not deleted and ingest is not stopped — the next event of this name recreates the definition with source "auto", losing the description and schema_json. To stop enforcing a schema while keeping the declaration, call event_definition.update with schema_json: null instead. ${AUTOMATION_SNAKE_CASE_HELP}`,
    inputSchema: {
      type: "object",
      properties: {
        publication_id: PUBLICATION_ID_SCHEMA,
        definition_id: { type: "string" }
      },
      required: ["definition_id"]
    }
  },
  {
    name: "site.get",
    ...toolHints("Get website", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: `Load the publication's website: settings, the v3 design (theme tokens, navbar, footer), the operator's design brief, and draftVersion. The navbar and footer node ids it returns are addressable by edit_copy and edit_style, so this is where you find them — but both trees are shared by EVERY page, so never put page-specific copy in them, and arrange refuses them. START HERE — the design brief is the operator's standing instruction for how the site should look and MUST be followed, and draftVersion is the token every write passes back as baseVersion. ${SITE_DOC_HELP}`,
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA
      }
    }
  },
  {
    name: "site.pages_list",
    // Not read only: the first call for a publication seeds its reserved pages with their default documents; nothing visible changes.
    ...toolHints("List website pages", { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description:
      "List the site's pages (id, kind, slug, title, status). kind is one of home, archive, post, custom, unsubscribe, unsubscribe_success — 'post' is the LAYOUT frame wrapped around every published post, not a single post. Reserved system pages are seeded on first call.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA
      }
    }
  },
  {
    name: "site.page_get",
    // Not read only: reads through the same page list, which creates the reserved pages on first use.
    ...toolHints("Get website page", { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description: `Load one page with its full document, draft-coalesced (what the builder shows, not what the public site serves). Address it by pageId, slug, or kind. Read this before addressing nodes by id in site.apply_ops. ${SITE_DOC_HELP}`,
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        pageId: { type: "string", description: "Page id. Takes precedence over slug and kind." },
        slug: { type: "string", description: "Page slug, e.g. \"home\"." },
        kind: {
          type: "string",
          enum: ["home", "archive", "post", "subscribe", "unsubscribe", "unsubscribe_success"],
          description: "Page kind. Defaults to \"home\" when no pageId or slug is given."
        }
      }
    }
  },
  {
    name: "site.page_upsert",
    // Destructive and open world: writes the page's LIVE row, not the draft, so a published page changes for visitors at once and its old document is replaced.
    ...toolHints("Create or replace website page", { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true }),
    description: `Create or replace a WHOLE page document. Reserved kinds are home, archive, post, subscribe and the unsubscribe pair; anything else is kind "custom" — an ordinary page at a slug of your choosing. (/subscribe is served from a built-in document and needs no page.) A custom page is created as a DRAFT unless you pass status "published", because building is unlimited on every plan while PUBLISHING is capped by plan (free 1, hobby 5, pro 25) — an over-cap publish is refused with a message naming the limit. A custom page also may not take a reserved slug: the public route resolves by slug alone, so "archive" would collide with the real archive. Prefer site.apply_ops for edits — this write goes through a total parser that silently REPAIRS what it cannot accept (clamping values, dropping unknown properties and overflow past the 40-section / 50-child / 200-node caps), so a success response does NOT mean the document was stored as sent. Read the page back with site.page_get and diff it. Note this writes the LIVE row for content ('draft' status keeps a page off the public site), not the draft column. ${SITE_DOC_HELP}`,
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        id: { type: "string", description: "Existing page id. Omit to create a new page." },
        kind: {
          type: "string",
          enum: [
            "home",
            "archive",
            "post",
            "subscribe",
            "unsubscribe",
            "unsubscribe_success",
            "custom"
          ]
        },
        slug: { type: "string" },
        title: { type: "string" },
        status: {
          type: "string",
          enum: ["draft", "published", "disabled"],
          description:
            "Omit on a NEW custom page to create a draft; omit on an existing page to keep the status it has."
        },
        contentJson: {
          type: "object",
          description:
            "The page document: {\"version\":3,\"sections\":[...]}. Omit to leave the stored document untouched."
        },
        hideNavbar: {
          type: "boolean",
          description: "Omit the site navbar on this page."
        },
        hideFooter: {
          type: "boolean",
          description: "Omit the site footer on this page."
        },
        seoTitle: { type: ["string", "null"] },
        seoDescription: { type: ["string", "null"] },
        seoOgImageUrl: { type: ["string", "null"] }
      },
      required: ["kind", "slug", "title"]
    }
  },
  {
    name: "site.apply_ops",
    // Not idempotent: ops can insert or move nodes, and baseVersion is optional.
    ...toolHints("Edit website draft", { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }),
    description: `Apply a batch of declarative edits to the site DRAFT — the safe way to design a site. Every op is applied in order and answered with a report: {applied, skipped:[{opIndex, op, reason, detail}]}. A 200 with skips is the normal, honest outcome — READ THE REPORT, it is the only place a refused edit is named. Reasons: unknown_template, unknown_node, unknown_slot_key, unknown_slot_field, copy_shape_mismatch, repeat_out_of_bounds, value_too_long (refused, never truncated), bad_index, page_full, no_design, unknown_token, bad_token_value, unknown_style_prop, empty_edit, not_a_container, cycle, extract_failed, invalid_op. Compose from templates (site.section_templates_list) rather than hand-authoring blocks. ${SITE_DOC_HELP}`,
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        pageId: {
          type: "string",
          description:
            "Page the ops edit. Defaults to the home page; the response echoes back which page was written. Ops that need a page when the site has none come back skipped, not as an error."
        },
        slug: {
          type: "string",
          description:
            "Page slug, e.g. \"changelog\" — the same addressing site.page_get and site.page_upsert accept. Use this OR pageId; omit both to edit the home page."
        },
        ops: {
          type: "array",
          description: "1-100 ops, applied in order.",
          items: SITE_OP_SCHEMA
        },
        baseVersion: {
          type: "number",
          description:
            "The draftVersion this batch was composed against (from site.get). On a mismatch the write is refused with 'site draft changed elsewhere' — re-read the site and rebuild the batch rather than retrying it blind."
        }
      },
      required: ["ops"]
    }
  },
    {
    name: "site.footer_templates_list",
    ...toolHints("List footer templates", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description:
      "The curated footer library: every footer template with its id, name and description. Apply one with the `set_footer_template` op in site.apply_ops. The shipped default footer is a single empty text node and structural ops do not address the chrome, so hand-assembling a footer means building every node — including the unsubscribe link. Templates are theme-linked and stack on a phone without per-template configuration.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA
      }
    }
  },
{
    name: "site.navbar_templates_list",
    ...toolHints("List navbar templates", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description:
      "The curated navbar library: every navbar template with its id, name, description, and mobile behaviour. Apply one with the `set_navbar_template` op in site.apply_ops. Prefer this over hand-assembling a navbar node by node — structural ops do not address the site chrome, and a hand-built navbar has no distribution control, so it tends to rely on fixed-width spacers that break on a phone. A template is theme-linked and carries its own mobile menu.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA
      }
    }
  },
{
    name: "site.section_templates_list",
    ...toolHints("List section templates", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description:
      "The curated Section Library: every insertable section template with its id, category, name, description, and slots. Slots are the contract for copy — a value slot takes a string under its key, a repeat slot takes a list of item maps (its itemSlots name the per-item keys, min/max bound the count). A template with no slots is a structural scaffold, inserted as authored. Read this before composing with site.apply_ops; a templateId not in this list is skipped as unknown_template.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA
      }
    }
  },
  {
    name: "site.design_brief_get",
    ...toolHints("Get design brief", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description:
      "Read the operator's design brief — standing brand and layout guardrails in markdown that every design change must respect. Empty means no brief has been written yet.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA
      }
    }
  },
  {
    name: "site.design_brief_set",
    ...toolHints("Set design brief", { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false }),
    description:
      "Write the operator's design brief (markdown, max 10000 chars) — the durable record of the site's visual direction, read on every later design turn. Pass null to clear it. Replaces the whole brief: read it first and edit, don't overwrite work you did not author.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        designBrief: {
          type: ["string", "null"],
          description: "Markdown brief, or null to clear."
        }
      },
      required: ["designBrief"]
    }
  },
  {
    name: "site.publish",
    // Open world: puts the draft live for visitors. Destructive: it replaces the live pages and design that visitors see.
    ...toolHints("Publish website", { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true }),
    description:
      "Publish the site: promote every pending draft page and the draft design to live, for real visitors. Call this ONLY when the user has explicitly asked to publish — design work belongs on the draft, which the operator previews and approves first. Refused if publishing would put more CUSTOM pages live than the plan allows (free 1, hobby 5, pro 25): the whole publish is refused rather than a subset going live, and the message names the limit. Unpublish or delete a custom page and call again.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA
      }
    }
  },
  {
    name: "site.discard_draft",
    ...toolHints("Discard website draft", { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false }),
    description:
      "Throw away every unpublished draft edit across the whole site and revert to the live version. Destructive and not undoable — it discards the operator's pending work as well as yours. Confirm with the user first.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA
      }
    }
  },
  {
    name: "site.asset_list",
    ...toolHints("List images", { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }),
    description:
      "List images in the publication's asset library, newest first, with the absolute URLs to use as an image block's src or a template's imageSrc slot. Each entry carries fileName, contentType, byteSize and width/height, so pick by what the image IS rather than by position. Use a real asset instead of inventing an image URL.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        search: { type: "string", description: "Filter by file name." },
        limit: { type: "number", description: "Max assets to return (1-200, default 50)." }
      }
    }
  },
  {
    name: "site.asset_upload",
    ...toolHints("Upload image", { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }),
    description:
      "Upload an image into the publication's asset library and get back the permanent URL to use as an image block's src. This is the ONLY way to put a picture that is not already in the library into an email, a template, or a site page: an image block needs an absolute URL, and hot-linking somebody else's host breaks the moment they move it. PNG, JPEG, GIF, WebP or SVG, 5 MB max. SVG is accepted for site pages (it is served with a sandbox policy so it cannot run script), but Gmail and Outlook do not show SVG images in email, so use PNG or JPEG for any image that goes into an email or template. The bytes must really be the format you declare. Send `width`/`height` when you know them: the editor uses them to reserve space so the layout does not jump.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        contentType: {
          type: "string",
          enum: ["image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"],
          description: "The image's real MIME type. Checked against the file's magic bytes."
        },
        dataBase64: {
          type: "string",
          description:
            "The raw image bytes, base64-encoded, WITHOUT any `data:image/png;base64,` prefix."
        },
        fileName: {
          type: "string",
          description:
            "A human-readable name for the library, e.g. `two-doors-hero.png`. Cosmetic — the stored key is always a fresh random id."
        },
        width: { type: "number", description: "Pixel width, when known." },
        height: { type: "number", description: "Pixel height, when known." }
      },
      required: ["contentType", "dataBase64"]
    }
  },
  {
    name: "site.asset_delete",
    ...toolHints("Delete image", { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false }),
    description:
      "Remove an image from the publication's asset library. The stored file is KEPT and its URL keeps resolving, so images inside already-sent emails do not break — this only hides the asset from the library. Deleting an asset does NOT remove it from any email, template or page that references it; fix those first or they will keep showing it.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: PUBLICATION_ID_SCHEMA,
        assetId: { type: "string", description: "The asset's id, from site.asset_list." }
      },
      required: ["assetId"]
    }
  }
] as const satisfies ReadonlyArray<McpToolDefinition>;

export const MCP_RESOURCES = [
  {
    uri: "publication://current/brand-guidelines",
    name: "Brand Guidelines",
    description: "Publication writing style and visual preferences",
    mimeType: "application/json"
  },
  {
    uri: "mailtea://capabilities",
    name: "Mailtea MCP Capabilities",
    description: "Tool and endpoint capabilities for this MCP runtime",
    mimeType: "application/json"
  },
  {
    uri: "analytics://current/latest-summary",
    name: "Latest Analytics Summary",
    description: "Most recent newsletter engagement snapshot",
    mimeType: "application/json"
  },
  {
    uri: "mailtea://automations/step-types",
    name: "Automation Step Types",
    description:
      "Machine-readable catalog of automation trigger types, step types, config shapes, branch labels and validation codes",
    mimeType: "application/json"
  },
  {
    uri: "mailtea://automations/condition-fields",
    name: "Automation Condition Fields",
    description:
      "Rule DSL for condition steps and filters: operators, addressable field namespaces, value references, rule node shapes, and the event schema_json document vocabulary",
    mimeType: "application/json"
  }
] as const;

export const MCP_PROMPTS = [
  {
    name: "newsletter.draft_from_brief",
    description:
      "Write a newsletter email from a short brief, then save it as a draft with issue.create_draft. Nothing is sent.",
    arguments: [
      {
        name: "brief",
        description: "What the email is about, in a sentence or a paragraph.",
        required: true
      },
      {
        name: "audience",
        description: "Who reads it, for example 'customers on the free plan'.",
        required: false
      },
      {
        name: "tone",
        description: "How it should sound: friendly, neutral or formal.",
        required: false
      },
      {
        name: "call_to_action",
        description: "The one thing a reader should do, with its link if there is one.",
        required: false
      }
    ]
  },
  {
    name: "newsletter.subject_line_pack",
    description: "Write subject line and preview text pairs for an email.",
    arguments: [
      {
        name: "topic",
        description: "What the email is about.",
        required: true
      },
      {
        name: "count",
        description: "How many subject lines to write, from 1 to 30. Defaults to 10.",
        required: false
      },
      {
        name: "audience",
        description: "Who reads it.",
        required: false
      }
    ]
  }
] as const;

/** A request the client can fix by changing its params: JSON-RPC -32602. */
class InvalidParamsError extends Error {}

function response(id: JsonRpcId, result: unknown): JsonRpcResponse {
  return {
    jsonrpc: "2.0",
    id,
    result
  };
}

function error(id: JsonRpcId, code: number, message: string, data?: unknown): JsonRpcResponse {
  return {
    jsonrpc: "2.0",
    id,
    error: {
      code,
      message,
      data
    }
  };
}

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

/**
 * A post header argument (name, from, replyTo): a string is forwarded as given,
 * including "" which clears it; anything else means "not passed".
 */
function readPostHeaderArgs(
  nameArg: unknown,
  fromArg: unknown,
  replyToArg: unknown
): {
  name?: string;
  fromAddress?: string;
  replyTo?: string;
} {
  const pick = (value: unknown) => (typeof value === "string" ? value : undefined);
  const name = pick(nameArg);
  const fromAddress = pick(fromArg);
  const replyTo = pick(replyToArg);
  return {
    ...(name !== undefined ? { name } : {}),
    ...(fromAddress !== undefined ? { fromAddress } : {}),
    ...(replyTo !== undefined ? { replyTo } : {})
  };
}

function asOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function readRequiredString(args: Record<string, unknown>, key: string): string {
  const value = asOptionalString(args[key]);
  if (!value) {
    throw new Error(`Missing required string argument: ${key}`);
  }

  return value;
}

function readIssueAnalyticsRange(
  args: Record<string, unknown>,
  key: string
): IssueAnalyticsRange | undefined {
  const value = asOptionalString(args[key]);
  return parseIssueAnalyticsRange(value, key);
}

function readIssueAnalyticsExportType(
  args: Record<string, unknown>,
  key: string
): IssueAnalyticsExportType | undefined {
  const value = asOptionalString(args[key]);
  if (!value) {
    return undefined;
  }

  if (value === "combined" || value === "performance" || value === "polls") {
    return value;
  }

  throw new Error(`Argument ${key} must be one of: combined, performance, polls`);
}

function parseIssueAnalyticsRange(
  value: string | undefined,
  key: string
): IssueAnalyticsRange | undefined {
  if (!value) {
    return undefined;
  }

  // Narrowed through the shared list rather than an `||` chain: a value added
  // or removed there changes what this accepts with no edit here.
  const match = ISSUE_ANALYTICS_RANGES.find((range) => range === value);
  if (match) {
    return match;
  }

  throw new Error(`Argument ${key} must be one of: ${ISSUE_ANALYTICS_RANGES.join(", ")}`);
}

function readContactStatus(
  args: Record<string, unknown>,
  key: string
): ContactStatus | undefined {
  const value = asOptionalString(args[key]);
  if (!value) {
    return undefined;
  }

  if (value === "active" || value === "unsubscribed" || value === "suppressed") {
    return value;
  }

  throw new Error(`Argument ${key} must be one of: active, unsubscribed, suppressed`);
}

function readSponsorOfferStatus(
  args: Record<string, unknown>,
  key: string
): SponsorOfferStatus | undefined {
  const value = asOptionalString(args[key]);
  if (!value) {
    return undefined;
  }

  if (value === "draft" || value === "active" || value === "paused" || value === "archived") {
    return value;
  }

  throw new Error(`Argument ${key} must be one of: draft, active, paused, archived`);
}

function readSponsorOfferPricingModel(
  args: Record<string, unknown>,
  key: string
): SponsorOfferPricingModel | undefined {
  const value = asOptionalString(args[key]);
  if (!value) {
    return undefined;
  }

  if (value === "flat" || value === "cpm") {
    return value;
  }

  throw new Error(`Argument ${key} must be one of: flat, cpm`);
}

function readOptionalNumber(args: Record<string, unknown>, key: string): number | undefined {
  const value = args[key];
  if (value === undefined) {
    return undefined;
  }

  // Some MCP/LLM clients serialize numbers as strings ("50"); accept those too.
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Argument ${key} must be a finite number`);
  }

  return value;
}

/**
 * Three-state reader: absent stays `undefined`, an EXPLICIT null survives as
 * `null`, anything else goes through `readOptionalNumber`. Callers must forward
 * `null` and omit `undefined` — a PATCH merges with stored values, so an
 * automation moved off `once_per_window` can only shed its stored
 * `reentry_window_seconds` by clearing it, and conflating the two states either
 * strands it on a permanent 400 or wipes a field nobody asked to change.
 */
function readNullableNumber(
  args: Record<string, unknown>,
  key: string
): number | null | undefined {
  if (args[key] === null) {
    return null;
  }

  return readOptionalNumber(args, key);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function readOptionalBoolean(args: Record<string, unknown>, key: string): boolean | undefined {
  const value = args[key];
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "boolean") {
    throw new Error(`Argument ${key} must be a boolean`);
  }

  return value;
}

function readOptionalJsonObject(
  args: Record<string, unknown>,
  key: string
): Record<string, unknown> | undefined {
  const value = args[key];
  if (value === undefined) {
    return undefined;
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Argument ${key} must be a JSON object`);
  }

  return value as Record<string, unknown>;
}

/**
 * Three-state counterpart to `asOptionalString`; see `readNullableNumber`.
 *
 * `asOptionalString` folds null, undefined and "" all into undefined, which is
 * right for a create but wrong for a patch: "omit" and "clear" are different
 * instructions and only null means the second.
 */
function readNullableString(
  args: Record<string, unknown>,
  key: string
): string | null | undefined {
  if (args[key] === null) {
    return null;
  }

  return asOptionalString(args[key]);
}

/**
 * `segmentId` on the draft tools. Absent means "all active contacts" on
 * create_draft and "leave it" on update_draft; null clears it, on update_draft
 * only. Anything else that is not a non-empty string is refused rather than
 * dropped: dropping it on create_draft would target every active contact and
 * report success, and on update_draft it would be a silent no-op.
 */
function readPostSegmentId(
  args: Record<string, unknown>,
  key: string,
  allowNull: boolean
): string | null | undefined {
  const value = args[key];
  if (value === undefined) {
    return undefined;
  }

  if (value === null && allowNull) {
    return null;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  throw new Error(
    `Argument ${key} must be a segment id from segment.list. Omit segmentId to send to all active contacts; pass null on issue.update_draft to clear it.`
  );
}

function readOptionalStringArray(
  args: Record<string, unknown>,
  key: string
): string[] | undefined {
  const value = args[key];
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`Argument ${key} must be an array of strings`);
  }

  return value as string[];
}

/** Three-state counterpart to `readOptionalStringArray`; see `readNullableNumber`. */
function readNullableStringArray(
  args: Record<string, unknown>,
  key: string
): string[] | null | undefined {
  if (args[key] === null) {
    return null;
  }

  return readOptionalStringArray(args, key);
}

/** Three-state counterpart to `readOptionalJsonObject`; see `readNullableNumber`. */
function readNullableJsonObject(
  args: Record<string, unknown>,
  key: string
): Record<string, unknown> | null | undefined {
  if (args[key] === null) {
    return null;
  }

  return readOptionalJsonObject(args, key);
}

function readRequiredJsonObjectArray(
  args: Record<string, unknown>,
  key: string
): Array<Record<string, unknown>> {
  const value = args[key];
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`Argument ${key} must be a non-empty array of objects`);
  }

  return value.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(`Argument ${key} must be a non-empty array of objects`);
    }

    return item as Record<string, unknown>;
  });
}

function readOptionalJsonObjectArray(
  args: Record<string, unknown>,
  key: string
): Array<Record<string, unknown>> | undefined {
  const value = args[key];
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    throw new Error(`Argument ${key} must be an array of objects`);
  }

  return value.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(`Argument ${key} must be an array of objects`);
    }

    return item as Record<string, unknown>;
  });
}

/** Build `path?a=1&b=2`, skipping every argument the caller omitted. */
function withQuery(
  path: string,
  params: Record<string, string | number | boolean | undefined>
): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) {
      continue;
    }

    query.set(key, String(value));
  }

  const serialized = query.toString();
  return serialized ? `${path}?${serialized}` : path;
}

function readRequiredPackSections(
  args: Record<string, unknown>,
  key: string
): Array<{ name: string; contentJson: Array<Record<string, unknown>> }> {
  const rows = readRequiredJsonObjectArray(args, key);

  return rows.map((row) => {
    const name = asOptionalString(row.name);
    if (!name) {
      throw new Error(`Argument ${key} item requires a non-empty name`);
    }

    const contentJson = row.contentJson;
    if (!Array.isArray(contentJson) || contentJson.length === 0) {
      throw new Error(`Argument ${key} item requires non-empty contentJson`);
    }

    const nodes = contentJson.flatMap((node) => {
      if (!node || typeof node !== "object" || Array.isArray(node)) {
        return [];
      }

      return [node as Record<string, unknown>];
    });

    if (nodes.length === 0) {
      throw new Error(`Argument ${key} item requires non-empty contentJson`);
    }

    return {
      name,
      contentJson: nodes
    };
  });
}

function resolveApiBaseUrl(options: McpRuntimeOptions): string {
  return (options.apiBaseUrl ?? process.env.MAILTEA_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/+$/, "");
}

function resolveToken(options: McpRuntimeOptions): string | null {
  return options.token ?? process.env.MAILTEA_API_TOKEN ?? null;
}

function resolvePublicationId(options: McpRuntimeOptions): string | null {
  const connected = asOptionalString(options.publicationId ?? undefined);
  if (connected) {
    return connected;
  }

  if (options.envPublicationFallback === false) {
    return null;
  }

  return asOptionalString(process.env.MAILTEA_PUBLICATION_ID) ?? null;
}

/**
 * The publication a tool call acts on: the explicit argument, else the one this
 * connection is already authorized for, else the only one the key reaches.
 *
 * `options.publicationId` is the connection's publication — the hosted endpoint
 * fills it from the OAuth grant, stdio from `MAILTEA_PUBLICATION_ID`. Using it
 * as a default widens nothing: the server refuses any publication but the
 * credential's own, so the only id an agent could successfully have typed is
 * the one substituted here. An explicit argument still wins, and an explicit
 * argument naming a DIFFERENT publication still travels to the server and is
 * still rejected there — this resolves an id, it does not authorize one.
 *
 * THE TEAM-SCOPED PERSONAL KEY. The default key Studio mints is scoped to the
 * TEAM (a full-access key is always minted for the team, never a publication),
 * so no connection publication exists and every tool that advertises
 * `publicationId` as optional refused it (user-testing 0924a, mcp/F10). For
 * such a key the default is the only publication its person belongs to in the
 * KEY'S OWN team: decided by the hosted endpoint server-side
 * (`options.reachablePublications`), or over stdio by asking `auth.me` with the
 * caller's own token. None or several is an error that lists what to pass. A
 * service key takes no such default, and no default is taken at all when the
 * request's active team is not the key's own (review of batch D1, H2).
 * Still defaulting, not authorizing: the id travels to the server and is
 * checked there like any other.
 *
 * The message keeps the words it has always started with, "Missing required
 * string argument: <key>", and adds the fix after them.
 */
async function readPublicationId(
  args: Record<string, unknown>,
  options: McpRuntimeOptions,
  // The automation and event tools spell their arguments snake_case; the error
  // has to name the key the caller actually passes.
  key: "publicationId" | "publication_id" = "publicationId"
): Promise<string> {
  const explicit = asOptionalString(args[key]);
  if (explicit) {
    return explicit;
  }

  const connected = resolvePublicationId(options);
  if (connected) {
    return connected;
  }

  if (options.reachablePublications !== undefined) {
    return chooseReachablePublication(options.reachablePublications, key);
  }

  return discoverPublicationId(options, key);
}

type AuthMePublicationScope = {
  tokenType?: string | null;
  organizationId?: string | null;
  credentialOrganizationId?: string | null;
  credentialPublicationId?: string | null;
  publicationMemberships?: Array<{
    publicationId?: string;
    publicationName?: string;
    organizationId?: string;
  }>;
};

function missingPublicationMessage(key: "publicationId" | "publication_id"): string {
  return `Missing required string argument: ${key}.`;
}

/**
 * The default from a list of publications the credential reaches, or the error
 * that says what to pass. Null means there is nothing that may be offered.
 */
function chooseReachablePublication(
  reachable: ReadonlyArray<{ id: string; name: string }> | null,
  key: "publicationId" | "publication_id"
): string {
  const missing = missingPublicationMessage(key);
  if (reachable === null) {
    throw new Error(
      `${missing} Pass the id of the publication to act on; publication.list shows the ones this key can reach.`
    );
  }

  if (reachable.length === 1) {
    return reachable[0]!.id;
  }

  if (reachable.length === 0) {
    throw new Error(
      `${missing} This key reaches no publication yet: create one with publication.create, then pass its id as ${key}.`
    );
  }

  const shown = reachable
    .slice(0, 5)
    .map((publication) => `${publication.id} (${publication.name})`)
    .join(", ");
  const more = reachable.length > 5 ? ` and ${reachable.length - 5} more` : "";
  throw new Error(
    `${missing} This key reaches ${reachable.length} publications, so say which one: pass ${key} as one of ${shown}${more}. publication.list shows them all, and a key scoped to one publication makes it the default.`
  );
}

/** How long a discovered default is reused for the same token and API. */
const PUBLICATION_DISCOVERY_TTL_MS = 60_000;

/**
 * Successful stdio discoveries, keyed by API base URL and token, so one agent
 * turn of ten tool calls asks auth.me once rather than ten times. Only a
 * RESOLVED id is kept: an error is never cached, because the fix it names
 * (create a publication, say) should take effect on the very next call.
 */
const discoveredPublications = new Map<string, { publicationId: string; expiresAt: number }>();

/** The only publication this credential reaches, or an error that names the fix. */
async function discoverPublicationId(
  options: McpRuntimeOptions,
  key: "publicationId" | "publication_id"
): Promise<string> {
  const cacheKey = `${resolveApiBaseUrl(options)}\n${resolveToken(options) ?? ""}`;
  const cached = discoveredPublications.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.publicationId;
  }
  discoveredPublications.delete(cacheKey);

  let me: AuthMePublicationScope;
  try {
    me = asObject(await callTrpc<unknown>("auth.me", {}, options, "query")) as AuthMePublicationScope;
  } catch (err) {
    throw new Error(
      `${missingPublicationMessage(key)} Could not look up which publications this key reaches (${toErrorMessage(err)}). Pass the id of the publication to act on; publication.list shows the ones this key can reach.`
    );
  }

  const publicationId = publicationFromAuthMe(me, key);
  if (discoveredPublications.size > 100) {
    discoveredPublications.clear();
  }
  discoveredPublications.set(cacheKey, {
    publicationId,
    expiresAt: Date.now() + PUBLICATION_DISCOVERY_TTL_MS
  });
  return publicationId;
}

function publicationFromAuthMe(
  me: AuthMePublicationScope,
  key: "publicationId" | "publication_id"
): string {
  // A publication-scoped key names its publication. Over the hosted endpoint
  // that already arrived as `options.publicationId`; stdio only learns it here.
  const scoped = asOptionalString(me.credentialPublicationId ?? undefined);
  if (scoped) {
    return scoped;
  }

  // A service key acts for the team, not for the person who minted it, so that
  // person's memberships say nothing about which publication it means.
  if (me.tokenType !== "pat") {
    return chooseReachablePublication(null, key);
  }

  // Only inside the key's OWN team, and only when that is also the team this
  // request resolved to. `organizationId` is the ACTIVE team, which falls back
  // to another of the person's teams once they are removed from the key's, so
  // defaulting from it put a team-A key to work in team B (review of batch D1,
  // H2). An older server that does not report `credentialOrganizationId` gets
  // no default either: refusing is the safe reading of not knowing.
  const keyTeam = asOptionalString(me.credentialOrganizationId ?? undefined);
  if (!keyTeam || keyTeam !== asOptionalString(me.organizationId ?? undefined)) {
    return chooseReachablePublication(null, key);
  }

  const seen = new Set<string>();
  const reachable: Array<{ id: string; name: string }> = [];
  for (const membership of Array.isArray(me.publicationMemberships) ? me.publicationMemberships : []) {
    const id = asOptionalString(membership?.publicationId);
    if (!id || seen.has(id)) continue;
    if (membership.organizationId !== keyTeam) {
      continue;
    }
    seen.add(id);
    reachable.push({ id, name: asOptionalString(membership.publicationName) ?? id });
  }

  return chooseReachablePublication(reachable, key);
}

function parseAnalyticsSummaryUri(uri: string): { publicationId?: string; range: IssueAnalyticsRange } | null {
  let parsed: URL;
  try {
    parsed = new URL(uri);
  } catch {
    return null;
  }

  if (parsed.protocol !== "analytics:" || parsed.hostname !== "current" || parsed.pathname !== "/latest-summary") {
    return null;
  }

  const publicationId = asOptionalString(parsed.searchParams.get("publicationId"));
  const range = parseIssueAnalyticsRange(asOptionalString(parsed.searchParams.get("range")), "range") ?? "7d";
  return { publicationId, range };
}

async function loadLatestAnalyticsSummary(
  options: McpRuntimeOptions,
  input: { publicationId?: string | null; range: IssueAnalyticsRange }
): Promise<LatestAnalyticsSummary> {
  const publicationId = input.publicationId ?? resolvePublicationId(options);
  if (!publicationId) {
    return {
      status: "missing_publication_context",
      message: "Set MAILTEA_PUBLICATION_ID or pass publicationId in the request.",
      exampleUri: "analytics://current/latest-summary?publicationId=pub_demo"
    };
  }

  const summary = await callTrpc<LatestAnalyticsSummaryApi>(
    "issue.latestSummary",
    {
      publicationId,
      range: input.range
    },
    options,
    "query"
  );

  return summary;
}

function makeToolResult(text: string, structuredContent?: unknown) {
  return {
    content: [
      {
        type: "text",
        text
      }
    ],
    ...(structuredContent ? { structuredContent } : {})
  };
}

function toErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Internal error";
}

async function callTrpc<T>(
  path: string,
  input: unknown,
  options: McpRuntimeOptions,
  procedureType: TrpcProcedureType = "mutation"
): Promise<T> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const apiBaseUrl = resolveApiBaseUrl(options);
  const token = resolveToken(options);

  if (!token) {
    throw new Error(
      "Missing API token. Set MAILTEA_API_TOKEN or pass Authorization header when using /mcp."
    );
  }

  const headers: Record<string, string> = {
    authorization: `Bearer ${token}`
  };

  const request =
    procedureType === "query"
      ? {
          url: `${apiBaseUrl}/trpc/${path}?input=${encodeURIComponent(
            JSON.stringify(input ?? {})
          )}`,
          init: {
            method: "GET",
            headers
          }
        }
      : {
          url: `${apiBaseUrl}/trpc/${path}`,
          init: {
            method: "POST",
            headers: {
              ...headers,
              "content-type": "application/json"
            },
            body: JSON.stringify(input)
          }
        };

  const httpResponse = await fetchImpl(request.url, request.init);

  const payload = (await httpResponse.json().catch(() => null)) as TrpcEnvelope<T> | null;

  if (!httpResponse.ok || payload?.error) {
    throw new Error(
      payload?.error?.message ?? `${httpResponse.status} ${httpResponse.statusText}`
    );
  }

  if (!payload?.result || typeof payload.result !== "object" || !("data" in payload.result)) {
    throw new Error(`Malformed tRPC response for ${path}`);
  }

  return payload.result.data as T;
}

async function callRestApi<T>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body: unknown | undefined,
  options: McpRuntimeOptions
): Promise<T> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const apiBaseUrl = resolveApiBaseUrl(options);
  const token = resolveToken(options);

  if (!token) {
    throw new Error("Missing API token.");
  }

  const headers: Record<string, string> = {
    authorization: `Bearer ${token}`
  };

  const init: RequestInit = { method, headers };
  if (body !== undefined) {
    headers["content-type"] = "application/json";
    init.body = JSON.stringify(body);
  }

  const httpResponse = await fetchImpl(`${apiBaseUrl}${path}`, init);
  const payload = (await httpResponse.json().catch(() => null)) as T & { error?: string } | null;

  if (!httpResponse.ok) {
    const failure = new Error(
      describeRestFailure(payload, `${httpResponse.status} ${httpResponse.statusText}`)
    ) as Error & { issues?: unknown; data?: unknown };
    // Automations answer a bad graph with coded `issues[]` alongside `error`. An
    // agent that can only see "400" cannot self-correct, so carry them along.
    if (Array.isArray((payload as any)?.issues)) {
      failure.issues = (payload as any).issues;
    }
    const data = restFailureData(payload, httpResponse.status);
    if (data) failure.data = data;
    throw failure;
  }

  return payload as T;
}

/**
 * The one-line message for a failed REST call: the API's `error`, then the
 * parts of the body that say WHY and what to branch on.
 *
 * Only `error` used to survive. The API also sends `details` (the renderer's
 * reason behind "Spec rendering failed", or zod's field list behind
 * "Validation failed") and `code`/`reason` (which many tool descriptions tell
 * the agent to branch on, e.g. `no_verified_sender`, `region_not_available`),
 * so an agent was told to act on fields it was never shown (run 0924a, mcp/F12
 * and mcp/F16).
 */
function describeRestFailure(payload: unknown, fallback: string): string {
  const body = asObject(payload);
  const headline = asOptionalString(body.error) ?? fallback;
  let message = headline;

  const details = body.details;
  if (typeof details === "string" && details.trim() && details.trim() !== headline) {
    message += `: ${details.trim()}`;
  } else if (Array.isArray(details) && details.length > 0) {
    const fields = details
      .slice(0, 5)
      .map((item) => {
        const entry = asObject(item);
        const path = Array.isArray(entry.path) ? entry.path.join(".") : asOptionalString(entry.path);
        const text = asOptionalString(entry.message);
        if (!text) return null;
        return path ? `${path}: ${text}` : text;
      })
      .filter((line): line is string => line !== null);
    if (fields.length > 0) {
      message += `: ${fields.join("; ")}${details.length > 5 ? ` (and ${details.length - 5} more)` : ""}`;
    }
  }

  const facts: string[] = [];
  const code = asOptionalString(body.code);
  const reason = asOptionalString(body.reason);
  if (code) facts.push(`code: ${code}`);
  if (reason && reason !== code) facts.push(`reason: ${reason}`);
  if (Array.isArray(body.steps) && body.steps.every((step) => typeof step === "string") && body.steps.length > 0) {
    facts.push(`steps: ${(body.steps as string[]).join(", ")}`);
  }
  if (facts.length > 0) {
    message += ` (${facts.join("; ")})`;
  }

  return message;
}

/**
 * A write refused because the resource changed since the agent read it
 * (`stale_write` / `stale_version`, QA 0924a D2). The REST message names REST
 * routes; an agent needs the TOOL to re-read with and the argument to retry
 * with, and must be told not to loop on the same request. Anything else is
 * rethrown untouched.
 */
function rethrowChangedElsewhere(
  error: unknown,
  rereadTool: string,
  tokenArgument: string,
  currentKey: string
): never {
  const data = (error as { data?: Record<string, unknown> } | null)?.data;
  const code = data?.code;
  if (code === "stale_write" || code === "stale_version") {
    const current = data?.[currentKey];
    const failure = new Error(
      `Changed elsewhere since you read it, so nothing was saved (code: ${code}). Call ${rereadTool} to re-read it, apply your change to what it returns, and retry with ${tokenArgument} ${
        current === undefined || current === null ? "from that read" : String(current)
      }. Do not resend the same request unchanged.`
    ) as Error & { data?: unknown };
    failure.data = data;
    throw failure;
  }
  throw error;
}

/** The machine-readable half of a REST failure, for the JSON-RPC `error.data`. */
function restFailureData(payload: unknown, status: number): Record<string, unknown> | null {
  const body = asObject(payload);
  const data: Record<string, unknown> = { status };
  for (const key of [
    "code",
    "reason",
    "steps",
    "details",
    "issues",
    "restriction",
    "domain",
    // What a "changed elsewhere" 409 says the resource is at now.
    "current_revision",
    "current_version",
    "current_updated_at",
    // Which posts hold a segment that a segment_in_use 409 refused to delete.
    "posts"
  ]) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  return Object.keys(data).length > 1 ? data : null;
}

type AutomationValidationIssue = {
  code: string;
  /**
   * Automation graph issues carry one; event property issues (event.send
   * against a schema) do not. Printed only when present.
   */
  severity?: string;
  step_key?: string;
  path?: string;
  message: string;
};

/**
 * `automation` or `automation_validation` — create/update return either,
 * depending on `validate_only`.
 */
type AutomationResponse = {
  object?: string;
  id?: string;
  name?: string;
  status?: string;
  version?: number;
  trigger?: unknown;
  steps?: unknown;
  canceled_runs?: number;
  active_run_count?: number;
  valid?: boolean;
  issues?: AutomationValidationIssue[];
  [key: string]: unknown;
};

function formatAutomationIssues(issues: AutomationValidationIssue[]): string {
  return issues
    .map((issue) => {
      const where = issue.step_key
        ? ` [${issue.step_key}${issue.path ? `.${issue.path}` : ""}]`
        : issue.path
          ? ` [${issue.path}]`
          : "";
      // `severity` is optional: printing it unconditionally put a literal
      // "undefined" in front of every event property issue.
      const severity = issue.severity ? `${issue.severity} ` : "";
      return `- ${severity}${issue.code}${where}: ${issue.message}`;
    })
    .join("\n");
}

/**
 * `callRestApi` for the automation endpoints. Re-throws a graph rejection with
 * the coded `issues[]` serialized into the message — an agent that cannot see
 * them cannot fix the graph, which is the whole point of the codes.
 */
async function callAutomationApi<T>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body: unknown | undefined,
  options: McpRuntimeOptions
): Promise<T> {
  try {
    return await callRestApi<T>(method, path, body, options);
  } catch (err) {
    const issues = (err as { issues?: unknown }).issues;
    if (Array.isArray(issues) && issues.length > 0) {
      const rethrown = new Error(
        `${toErrorMessage(err)}\n${formatAutomationIssues(issues as AutomationValidationIssue[])}`
      ) as Error & { data?: unknown };
      rethrown.data = (err as { data?: unknown }).data;
      throw rethrown;
    }

    throw err;
  }
}

/** Summarize `{valid, issues}` for the human-readable half of a tool result. */
function describeAutomationIssues(result: {
  valid?: boolean;
  issues?: AutomationValidationIssue[];
}): string {
  const issues = result.issues ?? [];
  if (issues.length === 0) {
    return result.valid === false ? "invalid" : "valid";
  }

  return `${result.valid ? "valid" : "invalid"}, ${issues.length} issue(s):\n${formatAutomationIssues(issues)}`;
}

// REST endpoints that respond with text/csv (e.g. /v1/suppressions/export) can't
// go through callRestApi, which parses JSON. Return the raw body instead.
async function callRestApiText(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  options: McpRuntimeOptions
): Promise<string> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const apiBaseUrl = resolveApiBaseUrl(options);
  const token = resolveToken(options);

  if (!token) {
    throw new Error("Missing API token.");
  }

  const httpResponse = await fetchImpl(`${apiBaseUrl}${path}`, {
    method,
    headers: { authorization: `Bearer ${token}` }
  });
  const text = await httpResponse.text().catch(() => "");

  if (!httpResponse.ok) {
    // Error responses are JSON; surface the `error` field when present.
    let message = text || `${httpResponse.status} ${httpResponse.statusText}`;
    try {
      const parsed = JSON.parse(text) as { error?: string };
      if (parsed?.error) message = parsed.error;
    } catch {
      // Non-JSON body — keep the raw text.
    }
    throw new Error(message);
  }

  return text;
}

/** Fields forwarded verbatim from email.send args to POST /v1/emails. */
const EMAIL_SEND_FIELDS = [
  "from",
  "sender_id",
  "to",
  "subject",
  "html",
  "text",
  "template",
  "cc",
  "bcc",
  "reply_to",
  "tracking_open",
  "tracking_click",
  "scheduled_at",
  "tags",
  "headers",
  "attachments"
] as const;

/**
 * The issue as it stands once delivery progress has been read.
 *
 * `issue.sendNow` answers with the row as it was when the send STARTED
 * (`status: "sending"`) and with its whole document. send_and_wait handed that
 * back beside a `progress.status` of "sent", so the reply contradicted itself
 * and carried ~21 KB of contentJson nobody asked for (user-testing 0924a,
 * mcp/F25). The summary keeps the identifying fields and takes status and
 * timestamps from the progress read, which is the later fact.
 */
function issueStateAfterProgress(
  issue: IssueRecord,
  progress: IssueDeliveryProgress
): Record<string, unknown> {
  return {
    id: issue.id,
    publicationId: issue.publicationId,
    title: issue.title,
    status: progress.status,
    createdAt: issue.createdAt,
    updatedAt: progress.updatedAt ?? issue.updatedAt,
    scheduledAt: issue.scheduledAt ?? null,
    sentAt: progress.sentAt ?? issue.sentAt ?? null
  };
}

/** Every argument name each tool's inputSchema declares, by tool name. */
const TOOL_ARGUMENT_NAMES: ReadonlyMap<string, readonly string[]> = new Map(
  (MCP_TOOLS as ReadonlyArray<{ name: string; inputSchema: { properties?: Record<string, unknown> } }>).map(
    (tool) => [tool.name, Object.keys(tool.inputSchema.properties ?? {})]
  )
);

function editDistance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let previous = row[0]!;
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const current = row[j]!;
      row[j] = Math.min(row[j]! + 1, row[j - 1]! + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = current;
    }
  }
  return row[b.length]!;
}

/** The declared name an unknown one was probably meant to be, if any. */
function closestArgumentName(unknown: string, declared: readonly string[]): string | null {
  const squash = (value: string) => value.toLowerCase().replace(/[_-]/g, "");
  const exact = declared.find((name) => squash(name) === squash(unknown));
  if (exact) return exact;
  if (unknown.length < 4) return null;
  let best: { name: string; distance: number } | null = null;
  for (const name of declared) {
    const distance = editDistance(squash(unknown), squash(name));
    if (distance <= 2 && (!best || distance < best.distance)) best = { name, distance };
  }
  return best?.name ?? null;
}

/**
 * A sentence naming the arguments this call passed that the tool does not
 * declare, or null when there are none.
 *
 * WARN, NOT REFUSE. Every tool used to drop an unknown key without a word, so
 * `email.list {tags: [...]}` returned the whole unfiltered list and the agent
 * believed it had filtered (user-testing 0924a, mcp/F25). Refusing unknown
 * keys (`additionalProperties: false`) would turn every agent that sends one
 * harmless extra field today into a failed call, so the call still runs and
 * the result says what was ignored and what the tool does accept.
 * `tool-contract.test.ts` pins that every key a tool reads is declared, so
 * this never calls a key "ignored" that was used.
 */
function unknownArgumentsWarning(toolName: string, args: Record<string, unknown>): string | null {
  const declared = TOOL_ARGUMENT_NAMES.get(toolName);
  if (!declared) return null;
  const unknown = Object.keys(args).filter((key) => !declared.includes(key));
  if (unknown.length === 0) return null;
  const named = unknown.map((key) => {
    const suggestion = closestArgumentName(key, declared);
    return suggestion ? `${key} (did you mean ${suggestion}?)` : key;
  });
  const accepts = declared.length > 0 ? declared.join(", ") : "no arguments";
  return `Ignored unknown argument${unknown.length === 1 ? "" : "s"}: ${named.join(", ")}. ${toolName} accepts: ${accepts}.`;
}

async function runTool(
  toolName: string,
  args: Record<string, unknown>,
  options: McpRuntimeOptions
) {
  if (toolName === "auth.me") {
    const me = await callTrpc<AuthMe>("auth.me", {}, options, "query");
    return makeToolResult(
      me.userId
        ? `Authenticated as ${me.role} (${me.userId})`
        : "Not authenticated",
      me
    );
  }

  if (toolName === "issue.create_draft") {
    const publicationId = await readPublicationId(args, options);
    const title = readRequiredString(args, "title");
    const kind = args.kind === "broadcast" ? "broadcast" : args.kind === "newsletter" ? "newsletter" : undefined;
    const templateId = asOptionalString(args.templateId);
    const variables = args.variables as Record<string, unknown> | undefined;
    const contentHtml = asOptionalString(args.contentHtml);
    const contentSpec = args.contentSpec as Record<string, unknown> | undefined;
    const segmentId = readPostSegmentId(args, "segmentId", false);

    let resolvedHtml = contentHtml;
    // templateId takes precedence — the server renders it; skip inline content.
    if (!templateId && contentSpec && typeof contentSpec === "object" && contentSpec.root) {
      // Render spec to HTML via the render endpoint
      const rendered = await callRestApi<{ html: string; text: string }>(
        "POST",
        "/v1/templates/render",
        { spec: contentSpec },
        options
      );
      resolvedHtml = rendered.html;
    }

    const headers = readPostHeaderArgs(args.name, args.from, args.replyTo);
    const draft = await callTrpc<IssueRecord>(
      "issue.createDraft",
      {
        publicationId,
        title,
        ...headers,
        ...(Object.keys(headers).length > 0 ? { strictHeaders: true } : {}),
        ...(kind ? { kind } : {}),
        ...(segmentId ? { segmentId } : {}),
        ...(templateId
          ? { templateId, ...(variables ? { variables } : {}) }
          : resolvedHtml
            ? {
                contentJson: {
                  type: "mailtea.rich.v1",
                  html: resolvedHtml
                }
              }
            : {})
      },
      options
    );

    return makeToolResult(`Draft created: ${draft.id}`, { issue: draft });
  }

  if (toolName === "issue.get_editor") {
    const issueId = readRequiredString(args, "issueId");

    const issue = await callTrpc<IssueEditor>(
      "issue.getEditor",
      { issueId },
      options,
      "query"
    );

    return makeToolResult(
      `Loaded editor state for ${issue.id} (${issue.status}) — ${issue.outline?.length ?? 0} addressable blocks, updatedAt ${issue.updatedAt}.${
        issue.docBacked === false
          ? " This draft holds raw HTML, not an editable document: only a `compose` op can edit it."
          : ""
      }`,
      { issue }
    );
  }

  if (toolName === "issue.apply_ops") {
    const issueId = readRequiredString(args, "issueId");
    const ops = readRequiredJsonObjectArray(args, "ops");
    const baseUpdatedAt = asOptionalString(args.baseUpdatedAt);

    const result = await callTrpc<{
      report: EmailOpsReportRecord;
      issueId: string;
      title: string;
      updatedAt: string;
    }>(
      "issue.applyOps",
      {
        issueId,
        ops,
        ...(baseUpdatedAt ? { baseUpdatedAt } : {})
      },
      options
    );

    const skipped = result.report.skipped ?? [];
    const summary = skipped
      .map(
        (skip) =>
          `op ${skip.opIndex}: ${skip.reason}${skip.path ? ` at ${skip.path}` : ""}${
            skip.detail ? ` — ${skip.detail}` : ""
          }`
      )
      .join("; ");

    // The paths an agent should use next, when the server sent them: after a
    // structural op, or when every address missed because the live document
    // is shaped differently from what issue.get_editor showed.
    const outlineNote = result.report.outline
      ? " report.outline is the document as it stands now: take paths from it, not from an earlier issue.get_editor."
      : "";
    return makeToolResult(
      (skipped.length === 0
        ? `Applied ${result.report.applied}/${ops.length} ops to ${result.issueId}. Pass updatedAt ${result.updatedAt} as baseUpdatedAt on the next write.`
        : `Applied ${result.report.applied}/${ops.length} ops to ${result.issueId} (updatedAt ${result.updatedAt}). ${skipped.length} SKIPPED: ${summary}`) +
        outlineNote,
      {
        issueId: result.issueId,
        title: result.title,
        updatedAt: result.updatedAt,
        report: result.report
      }
    );
  }

  if (toolName === "email.lint") {
    const issueId = asOptionalString(args.issueId);
    const html = asOptionalString(args.html);

    const result = await callTrpc<{
      findings: EmailLintFinding[];
      failCount: number;
      warnCount: number;
      strictClients: string[];
      linted: boolean;
    }>(
      "issue.lint",
      {
        ...(issueId ? { issueId } : {}),
        ...(html !== undefined ? { html } : {})
      },
      options,
      "query"
    );

    const detail = result.findings
      .map(
        (finding) =>
          `${finding.severity === "fail" ? "FAIL" : "warn"} ${finding.feature} — unsupported in ${finding.clients.join(", ")}`
      )
      .join("; ");

    return makeToolResult(
      !result.linted
        ? "Nothing to lint — this draft has no rendered HTML yet."
        : result.findings.length === 0
          ? `Clean: no email-unsafe CSS found for ${result.strictClients.join(", ")}.`
          : `${result.failCount} failing, ${result.warnCount} warning — ${detail}`,
      result
    );
  }

  if (toolName === "issue.update_draft") {
    const issueId = readRequiredString(args, "issueId");
    const baseUpdatedAt = asOptionalString(args.baseUpdatedAt);
    const title = asOptionalString(args.title);
    const headers = readPostHeaderArgs(args.name, args.from, args.replyTo);
    // Three-state: a string targets that segment, null clears it (all active
    // contacts), absent leaves the post's targeting as it is.
    const segmentId = readPostSegmentId(args, "segmentId", true);
    const contentHtml = asOptionalString(args.contentHtml);
    const contentSpec = args.contentSpec as Record<string, unknown> | undefined;

    let resolvedHtml = contentHtml;
    if (contentSpec && typeof contentSpec === "object" && contentSpec.root) {
      const rendered = await callRestApi<{ html: string; text: string }>(
        "POST",
        "/v1/templates/render",
        { spec: contentSpec },
        options
      );
      resolvedHtml = rendered.html;
    }

    const draft = await callTrpc<IssueRecord>(
      "issue.updateDraft",
      {
        issueId,
        ...(title ? { title } : {}),
        ...headers,
        ...(Object.keys(headers).length > 0 ? { strictHeaders: true } : {}),
        ...(segmentId !== undefined ? { segmentId } : {}),
        ...(resolvedHtml
          ? {
              contentJson: {
                type: "mailtea.rich.v1",
                html: resolvedHtml
              }
            }
          : {}),
        ...(baseUpdatedAt ? { baseUpdatedAt } : {})
      },
      options
    ).catch((error: unknown) => {
      // tRPC carries no code over this transport, only the message, which says
      // "changed elsewhere" for exactly this refusal.
      if (error instanceof Error && /changed elsewhere/i.test(error.message)) {
        throw new Error(
          "This draft was changed elsewhere since you read it, so nothing was saved. Call issue.get_editor to re-read it, apply your change to what it returns, and retry with its updatedAt as baseUpdatedAt. Do not resend the same request unchanged."
        );
      }
      throw error;
    });

    return makeToolResult(`Draft updated: ${draft.id}`, { issue: draft });
  }

  if (toolName === "issue.remove_draft") {
    const issueId = readRequiredString(args, "issueId");
    const removed = await callTrpc<IssueDraftRemoveResult>(
      "issue.removeDraft",
      { issueId },
      options
    );

    return makeToolResult(`Draft removed: ${removed.issueId}`, removed);
  }

  if (toolName === "issue.list_recent") {
    const publicationId = await readPublicationId(args, options);
    const requestedLimit = readOptionalNumber(args, "limit");
    const limit = Math.max(1, Math.min(50, Math.trunc(requestedLimit ?? 10)));

    const rows = await callTrpc<IssueRecord[]>(
      "issue.listRecent",
      { publicationId, limit },
      options,
      "query"
    );

    return makeToolResult(
      rows.length === 0
        ? `No issues found for ${publicationId}`
        : `Loaded ${rows.length} issues for ${publicationId}`,
      {
        publicationId,
        issues: rows
      }
    );
  }

  if (toolName === "publication.list") {
    const workspaces = await callTrpc<PublicationWorkspaceRecord[]>(
      "publication.listMine",
      {},
      options,
      "query"
    );

    return makeToolResult(
      workspaces.length === 0
        ? "No publication workspaces available for this identity yet"
        : `Loaded ${workspaces.length} publication workspaces`,
      {
        publications: workspaces
      }
    );
  }

  if (toolName === "publication.create") {
    const publicationId = asOptionalString(args.publicationId);
    const name = readRequiredString(args, "name");
    const timezone = asOptionalString(args.timezone);

    const result = await callTrpc<PublicationCreateResult>(
      "publication.create",
      {
        ...(publicationId ? { publicationId } : {}),
        name,
        ...(timezone ? { timezone } : {})
      },
      options
    );

    return makeToolResult(`Publication created: ${result.publication.id}`, result);
  }

  if (toolName === "publication.domain_list") {
    const publicationId = await readPublicationId(args, options);
    const requestedLimit = readOptionalNumber(args, "limit");
    const limit = Math.max(1, Math.min(100, Math.trunc(requestedLimit ?? 50)));

    const domains = await callTrpc<PublicationDomainRecord[]>(
      "publication.domains",
      {
        publicationId,
        limit
      },
      options,
      "query"
    );

    return makeToolResult(
      domains.length === 0
        ? `No custom domains configured for ${publicationId}`
        : `Loaded ${domains.length} custom domains for ${publicationId}`,
      { publicationId, domains }
    );
  }

  if (toolName === "publication.domain_upsert") {
    const publicationId = await readPublicationId(args, options);
    const host = readRequiredString(args, "host");
    const isPrimary = readOptionalBoolean(args, "isPrimary");
    const proxyTarget = asOptionalString(args.proxyTarget);

    const result = await callTrpc<PublicationDomainUpsertResult>(
      "publication.domainUpsert",
      {
        publicationId,
        host,
        ...(typeof isPrimary === "boolean" ? { isPrimary } : {}),
        ...(proxyTarget ? { proxyTarget } : {})
      },
      options
    );

    return makeToolResult(
      `Publication domain saved: ${result.domain.host} (${result.domain.status})`,
      result
    );
  }

  if (toolName === "publication.domain_verify") {
    const publicationId = await readPublicationId(args, options);
    const domainId = readRequiredString(args, "domainId");
    const verificationValue = asOptionalString(args.verificationValue);

    const result = await callTrpc<PublicationDomainUpsertResult>(
      "publication.domainVerify",
      {
        publicationId,
        domainId,
        ...(verificationValue ? { verificationValue } : {})
      },
      options
    );

    return makeToolResult(
      `Publication domain verified: ${result.domain.host}`,
      result
    );
  }

  if (toolName === "publication.domain_set_primary") {
    const publicationId = await readPublicationId(args, options);
    const domainId = readRequiredString(args, "domainId");

    const result = await callTrpc<PublicationDomainUpsertResult>(
      "publication.domainSetPrimary",
      {
        publicationId,
        domainId
      },
      options
    );

    return makeToolResult(`Primary domain set: ${result.domain.host}`, result);
  }

  if (toolName === "publication.domain_remove") {
    const publicationId = await readPublicationId(args, options);
    const domainId = readRequiredString(args, "domainId");

    const result = await callTrpc<PublicationDomainRemoveResult>(
      "publication.domainRemove",
      {
        publicationId,
        domainId
      },
      options
    );

    return makeToolResult(`Publication domain removed: ${result.domainId}`, result);
  }

  if (toolName === "publication.domain_traefik_preview") {
    const publicationId = await readPublicationId(args, options);

    const preview = await callTrpc<PublicationDomainTraefikPreview>(
      "publication.domainTraefikPreview",
      {
        publicationId
      },
      options,
      "query"
    );

    return makeToolResult(
      `Generated Traefik preview for ${publicationId} (${preview.entries.length} domains)`,
      preview
    );
  }

  if (toolName === "sender.list") {
    const publicationId = await readPublicationId(args, options);
    const requestedLimit = readOptionalNumber(args, "limit");
    const limit = Math.max(1, Math.min(100, Math.trunc(requestedLimit ?? 100)));

    const senders = await callTrpc<SenderRecord[]>(
      "publication.senderList",
      { publicationId, limit },
      options,
      "query"
    );

    return makeToolResult(
      senders.length === 0
        ? `No senders configured for ${publicationId}`
        : `Loaded ${senders.length} sender(s) for ${publicationId}`,
      { publicationId, senders }
    );
  }

  if (toolName === "sender.create") {
    const publicationId = await readPublicationId(args, options);
    const name = readRequiredString(args, "name");
    const email = readRequiredString(args, "email");
    const replyTo = asOptionalString(args.replyTo);
    const isDefault = readOptionalBoolean(args, "isDefault");

    const result = await callTrpc<SenderMutationResult>(
      "publication.senderCreate",
      {
        publicationId,
        name,
        email,
        ...(replyTo ? { replyTo } : {}),
        ...(typeof isDefault === "boolean" ? { isDefault } : {})
      },
      options
    );

    return makeToolResult(
      `Sender created: ${result.sender?.name} <${result.sender?.email}>`,
      result
    );
  }

  if (toolName === "sender.update") {
    const publicationId = await readPublicationId(args, options);
    const senderId = readRequiredString(args, "senderId");
    const name = asOptionalString(args.name);
    const replyTo = asOptionalString(args.replyTo);
    const isDefault = readOptionalBoolean(args, "isDefault");

    const result = await callTrpc<SenderMutationResult>(
      "publication.senderUpdate",
      {
        publicationId,
        senderId,
        ...(name ? { name } : {}),
        ...(replyTo !== undefined ? { replyTo } : {}),
        ...(typeof isDefault === "boolean" ? { isDefault } : {})
      },
      options
    );

    return makeToolResult(`Sender updated: ${result.sender?.email ?? senderId}`, result);
  }

  if (toolName === "sender.set_default") {
    const publicationId = await readPublicationId(args, options);
    const senderId = readRequiredString(args, "senderId");

    const result = await callTrpc<SenderMutationResult>(
      "publication.senderSetDefault",
      { publicationId, senderId },
      options
    );

    return makeToolResult(`Default sender set: ${result.sender?.email ?? senderId}`, result);
  }

  if (toolName === "sender.delete") {
    const publicationId = await readPublicationId(args, options);
    const senderId = readRequiredString(args, "senderId");

    const result = await callTrpc<SenderRemoveResult>(
      "publication.senderDelete",
      { publicationId, senderId },
      options
    );

    return makeToolResult(`Sender removed: ${result.senderId}`, result);
  }

  if (toolName === "suppression.search") {
    // Re-backed onto REST GET /v1/suppressions so the REST-only filters
    // (created_after / created_before / starting_after) are reachable. The
    // legacy `query` arg maps to the REST `q` param for backward compatibility.
    const reason = asOptionalString(args.reason);
    const query = asOptionalString(args.query);
    const createdAfter = asOptionalString(args.created_after);
    const createdBefore = asOptionalString(args.created_before);
    const startingAfter = asOptionalString(args.starting_after);
    const requestedLimit = readOptionalNumber(args, "limit");
    const limit = Math.max(1, Math.min(100, Math.trunc(requestedLimit ?? 20)));

    const params = new URLSearchParams();
    if (reason) params.set("reason", reason);
    if (query) params.set("q", query);
    if (createdAfter) params.set("created_after", createdAfter);
    if (createdBefore) params.set("created_before", createdBefore);
    if (startingAfter) params.set("starting_after", startingAfter);
    params.set("limit", String(limit));

    const result = await callRestApi<SuppressionListResponse>(
      "GET",
      `/v1/suppressions?${params.toString()}`,
      undefined,
      options
    );

    return makeToolResult(
      result.data.length === 0
        ? "No suppression entries matched"
        : `Loaded ${result.data.length} suppression entr${result.data.length === 1 ? "y" : "ies"}`,
      result
    );
  }

  if (toolName === "suppression.export") {
    const csv = await callRestApiText("GET", "/v1/suppressions/export", options);
    // Data rows only: drop the header line and any trailing blank line.
    const rowCount = Math.max(0, csv.split("\n").filter((line) => line.length > 0).length - 1);

    return makeToolResult(
      `Suppression list exported: ${rowCount} entr${rowCount === 1 ? "y" : "ies"}`,
      { csv, filename: "suppressions.csv", rowCount }
    );
  }

  if (toolName === "suppression.add") {
    const emails = Array.isArray(args.emails)
      ? args.emails.filter((email): email is string => typeof email === "string")
      : [];
    const reason = asOptionalString(args.reason);

    const result = await callTrpc<{ added: number }>(
      "org.suppressionAdd",
      { emails, ...(reason ? { reason } : {}) },
      options
    );

    return makeToolResult(`Added ${result.added} suppression entr${result.added === 1 ? "y" : "ies"}`, result);
  }

  if (toolName === "suppression.remove") {
    const emails = Array.isArray(args.emails)
      ? args.emails.filter((email): email is string => typeof email === "string")
      : [];

    const result = await callTrpc<{ removed: number }>(
      "org.suppressionRemove",
      { emails },
      options
    );

    return makeToolResult(`Removed ${result.removed} suppression entr${result.removed === 1 ? "y" : "ies"}`, result);
  }

  if (toolName === "contact.list") {
    const publicationId = await readPublicationId(args, options);
    const status = readContactStatus(args, "status");
    const query = asOptionalString(args.query);
    const requestedLimit = readOptionalNumber(args, "limit");
    const limit = Math.max(1, Math.min(500, Math.trunc(requestedLimit ?? 200)));

    const contacts = await callTrpc<ContactRecord[]>(
      "contact.list",
      {
        publicationId,
        ...(status ? { status } : {}),
        ...(query ? { query } : {}),
        limit
      },
      options,
      "query"
    );

    return makeToolResult(
      contacts.length === 0
        ? `No contacts found for ${publicationId}`
        : `Loaded ${contacts.length} contacts for ${publicationId}`,
      {
        publicationId,
        contacts
      }
    );
  }

  if (toolName === "contact.upsert") {
    const publicationId = await readPublicationId(args, options);
    const email = readRequiredString(args, "email");
    const referrerContactId = asOptionalString(args.referrerContactId);

    const contact = await callTrpc<ContactRecord>(
      "contact.upsert",
      {
        publicationId,
        email,
        ...(referrerContactId ? { referrerContactId } : {})
      },
      options
    );

    return makeToolResult(`Contact saved: ${contact.id} (${contact.status})`, {
      contact
    });
  }

  if (toolName === "contact.set_status") {
    const publicationId = await readPublicationId(args, options);
    const contactId = readRequiredString(args, "contactId");
    const status = readContactStatus(args, "status");
    if (!status) {
      throw new Error("status is required");
    }

    const contact = await callTrpc<ContactRecord>(
      "contact.setStatus",
      {
        publicationId,
        contactId,
        status
      },
      options
    );

    return makeToolResult(`Contact status updated: ${contact.id} -> ${contact.status}`, {
      contact
    });
  }

  if (toolName === "contact.import_csv") {
    const publicationId = await readPublicationId(args, options);
    const csvText = readRequiredString(args, "csvText");
    // Both omitted rather than sent as false: the procedure defaults both to
    // false, and an absent key keeps the payload identical to what every
    // existing caller sends.
    const enrollInAutomations = readOptionalBoolean(args, "enrollInAutomations");
    const confirmLargeEnrollment = readOptionalBoolean(args, "confirmLargeEnrollment");

    const result = await callTrpc<ContactImportCsvResult>(
      "contact.importCsv",
      {
        publicationId,
        csvText,
        ...(enrollInAutomations === undefined ? {} : { enrollInAutomations }),
        ...(confirmLargeEnrollment === undefined ? {} : { confirmLargeEnrollment })
      },
      options
    );

    // Named in the text as well as the structure: a column that did nothing
    // is exactly what an agent needs to notice before it sends a newsletter
    // that greets everyone as "friend" (user-testing 0924a, mcp/F23).
    const ignored = (result.ignoredColumns ?? []).slice(0, 20);
    const ignoredTotal = Math.max(result.ignoredColumnCount ?? 0, ignored.length);
    const ignoredMore = ignoredTotal > ignored.length ? ` and ${ignoredTotal - ignored.length} more` : "";
    const ignoredNote =
      ignored.length > 0
        ? `. Ignored column${ignoredTotal === 1 ? "" : "s"}: ${ignored.join(", ")}${ignoredMore} (only the email column is imported; use contact.set_properties to store other fields).`
        : "";
    return makeToolResult(
      `Contact import complete for ${publicationId}: +${result.createdCount} new, ${result.reactivatedCount} reactivated, ${result.invalidCount} invalid, ${result.enrolledAutomations ?? 0} enrolled in automations${ignoredNote}`,
      result
    );
  }

  if (toolName === "contact.referral_summary") {
    const publicationId = await readPublicationId(args, options);
    const requestedLimit = readOptionalNumber(args, "limit");
    const limit = Math.max(1, Math.min(100, Math.trunc(requestedLimit ?? 20)));

    const summary = await callTrpc<ContactReferralSummary>(
      "contact.referralSummary",
      {
        publicationId,
        limit
      },
      options,
      "query"
    );

    return makeToolResult(
      summary.totalReferrals === 0
        ? `No referrals tracked yet for ${publicationId}`
        : `Loaded referral summary for ${publicationId}: ${summary.totalReferrals} total referrals`,
      summary
    );
  }

  if (toolName === "contact.referral_milestones") {
    const publicationId = await readPublicationId(args, options);
    const requestedLimit = readOptionalNumber(args, "limit");
    const limit = Math.max(1, Math.min(200, Math.trunc(requestedLimit ?? 100)));

    const milestones = await callTrpc<ReferralMilestoneRecord[]>(
      "contact.referralMilestones",
      {
        publicationId,
        limit
      },
      options,
      "query"
    );

    return makeToolResult(
      milestones.length === 0
        ? `No referral milestones configured for ${publicationId}`
        : `Loaded ${milestones.length} referral milestones for ${publicationId}`,
      { publicationId, milestones }
    );
  }

  if (toolName === "contact.referral_milestone_upsert") {
    const publicationId = await readPublicationId(args, options);
    const title = readRequiredString(args, "title");
    const description = asOptionalString(args.description);
    const milestoneId = asOptionalString(args.milestoneId);
    const referralCountInput = readOptionalNumber(args, "referralCount");
    if (typeof referralCountInput !== "number" || !Number.isFinite(referralCountInput)) {
      throw new Error("referralCount is required and must be a number");
    }
    const referralCount = Math.max(1, Math.trunc(referralCountInput));

    const result = await callTrpc<{
      milestone: ReferralMilestoneRecord;
      rewardedCount: number;
    }>(
      "contact.upsertReferralMilestone",
      {
        publicationId,
        ...(milestoneId ? { milestoneId } : {}),
        title,
        ...(description ? { description } : {}),
        referralCount
      },
      options
    );

    return makeToolResult(
      `Referral milestone saved: ${result.milestone.id} (${result.rewardedCount} rewards granted)`,
      result
    );
  }

  if (toolName === "contact.referral_milestone_remove") {
    const publicationId = await readPublicationId(args, options);
    const milestoneId = readRequiredString(args, "milestoneId");

    const result = await callTrpc<{ removed: boolean; milestoneId: string }>(
      "contact.removeReferralMilestone",
      {
        publicationId,
        milestoneId
      },
      options
    );

    return makeToolResult(`Referral milestone removed: ${result.milestoneId}`, result);
  }

  if (toolName === "contact.referral_rewards") {
    const publicationId = await readPublicationId(args, options);
    const contactId = asOptionalString(args.contactId);
    const requestedLimit = readOptionalNumber(args, "limit");
    const limit = Math.max(1, Math.min(500, Math.trunc(requestedLimit ?? 100)));

    const rewards = await callTrpc<ReferralRewardRecord[]>(
      "contact.referralRewards",
      {
        publicationId,
        ...(contactId ? { contactId } : {}),
        limit
      },
      options,
      "query"
    );

    return makeToolResult(
      rewards.length === 0
        ? `No referral rewards found for ${publicationId}`
        : `Loaded ${rewards.length} referral rewards for ${publicationId}`,
      { publicationId, rewards }
    );
  }

  if (toolName === "monetize.offer_list") {
    const publicationId = await readPublicationId(args, options);
    const status = readSponsorOfferStatus(args, "status");
    const requestedLimit = readOptionalNumber(args, "limit");
    const limit = Math.max(1, Math.min(200, Math.trunc(requestedLimit ?? 100)));

    const offers = await callTrpc<SponsorOfferRecord[]>(
      "monetize.listOffers",
      {
        publicationId,
        ...(status ? { status } : {}),
        limit
      },
      options,
      "query"
    );

    return makeToolResult(
      offers.length === 0
        ? `No sponsor offers found for ${publicationId}`
        : `Loaded ${offers.length} sponsor offers for ${publicationId}`,
      { publicationId, offers }
    );
  }

  if (toolName === "monetize.offer_upsert") {
    const publicationId = await readPublicationId(args, options);
    const offerId = asOptionalString(args.offerId);
    const title = readRequiredString(args, "title");
    const sponsorName = readRequiredString(args, "sponsorName");
    const description = asOptionalString(args.description);
    const pricingModel = readSponsorOfferPricingModel(args, "pricingModel");
    if (!pricingModel) {
      throw new Error("pricingModel is required");
    }
    const rateCentsInput = readOptionalNumber(args, "rateCents");
    if (typeof rateCentsInput !== "number" || !Number.isFinite(rateCentsInput)) {
      throw new Error("rateCents is required and must be a number");
    }
    const rateCents = Math.max(1, Math.trunc(rateCentsInput));
    const estimatedPlacementsInput = readOptionalNumber(args, "estimatedPlacements");
    const estimatedPlacements =
      typeof estimatedPlacementsInput === "number" && Number.isFinite(estimatedPlacementsInput)
        ? Math.max(1, Math.trunc(estimatedPlacementsInput))
        : undefined;
    const status = readSponsorOfferStatus(args, "status");
    const startsAt = asOptionalString(args.startsAt);
    const endsAt = asOptionalString(args.endsAt);

    const result = await callTrpc<SponsorOfferUpsertResult>(
      "monetize.upsertOffer",
      {
        publicationId,
        ...(offerId ? { offerId } : {}),
        title,
        sponsorName,
        ...(description ? { description } : {}),
        pricingModel,
        rateCents,
        ...(typeof estimatedPlacements === "number" ? { estimatedPlacements } : {}),
        ...(status ? { status } : {}),
        ...(startsAt ? { startsAt } : {}),
        ...(endsAt ? { endsAt } : {})
      },
      options
    );

    return makeToolResult(`Sponsor offer saved: ${result.offer.id}`, result);
  }

  if (toolName === "monetize.offer_remove") {
    const publicationId = await readPublicationId(args, options);
    const offerId = readRequiredString(args, "offerId");

    const result = await callTrpc<SponsorOfferRemoveResult>(
      "monetize.removeOffer",
      {
        publicationId,
        offerId
      },
      options
    );

    return makeToolResult(`Sponsor offer removed: ${result.offerId}`, result);
  }

  if (toolName === "section.list") {
    const publicationId = await readPublicationId(args, options);
    const requestedLimit = readOptionalNumber(args, "limit");
    const limit = Math.max(1, Math.min(200, Math.trunc(requestedLimit ?? 100)));

    const rows = await callTrpc<ReusableSectionRecord[]>(
      "section.list",
      { publicationId, limit },
      options,
      "query"
    );

    return makeToolResult(
      rows.length === 0
        ? `No reusable sections found for ${publicationId}`
        : `Loaded ${rows.length} reusable sections for ${publicationId}`,
      {
        publicationId,
        sections: rows
      }
    );
  }

  if (toolName === "section.catalog") {
    const publicationId = asOptionalString(args.publicationId);
    const packs = await callTrpc<SectionPackRecord[]>(
      "section.catalog",
      publicationId ? { publicationId } : {},
      options,
      "query"
    );

    return makeToolResult(
      packs.length === 0
        ? "No marketplace packs available"
        : `Loaded ${packs.length} marketplace packs`,
      { packs }
    );
  }

  if (toolName === "section.pack_create") {
    const publicationId = await readPublicationId(args, options);
    const title = readRequiredString(args, "title");
    const description = asOptionalString(args.description);
    const styleProfile = readOptionalJsonObject(args, "styleProfile");
    const sections = readRequiredPackSections(args, "sections");

    const result = await callTrpc<SectionPackCreateResult>(
      "section.createPack",
      {
        publicationId,
        title,
        ...(description ? { description } : {}),
        ...(styleProfile ? { styleProfile } : {}),
        sections
      },
      options
    );

    return makeToolResult(`Marketplace pack created: ${result.pack.id}`, result);
  }

  if (toolName === "section.pack_update") {
    const publicationId = await readPublicationId(args, options);
    const packId = readRequiredString(args, "packId");
    const title = readRequiredString(args, "title");
    const description = asOptionalString(args.description);
    const styleProfile = readOptionalJsonObject(args, "styleProfile");
    const sections = readRequiredPackSections(args, "sections");

    const result = await callTrpc<SectionPackCreateResult>(
      "section.updatePack",
      {
        publicationId,
        packId,
        title,
        ...(description ? { description } : {}),
        ...(styleProfile ? { styleProfile } : {}),
        sections
      },
      options
    );

    return makeToolResult(`Marketplace pack updated: ${result.pack.id}`, result);
  }

  if (toolName === "section.pack_remove") {
    const publicationId = await readPublicationId(args, options);
    const packId = readRequiredString(args, "packId");

    const result = await callTrpc<SectionPackRemoveResult>(
      "section.removePack",
      {
        publicationId,
        packId
      },
      options
    );

    return makeToolResult(`Marketplace pack removed: ${result.packId}`, result);
  }

  if (toolName === "section.pack_revisions") {
    const publicationId = await readPublicationId(args, options);
    const packId = readRequiredString(args, "packId");
    const requestedLimit = readOptionalNumber(args, "limit");
    const limit = Math.max(1, Math.min(100, Math.trunc(requestedLimit ?? 30)));

    const result = await callTrpc<SectionPackRevisionRecord[]>(
      "section.revisions",
      {
        publicationId,
        packId,
        limit
      },
      options,
      "query"
    );

    return makeToolResult(
      result.length === 0
        ? `No revisions found for ${packId}`
        : `Loaded ${result.length} revisions for ${packId}`,
      {
        publicationId,
        packId,
        revisions: result
      }
    );
  }

  if (toolName === "section.pack_restore_revision") {
    const publicationId = await readPublicationId(args, options);
    const packId = readRequiredString(args, "packId");
    const revisionId = readRequiredString(args, "revisionId");

    const result = await callTrpc<SectionPackRestoreRevisionResult>(
      "section.restorePackRevision",
      {
        publicationId,
        packId,
        revisionId
      },
      options
    );

    return makeToolResult(
      `Marketplace pack restored: ${result.pack.id} (from v${result.restoredFrom.version} -> v${result.createdRevision.version})`,
      result
    );
  }

  if (toolName === "section.import_pack") {
    const publicationId = await readPublicationId(args, options);
    const templateId = readRequiredString(args, "templateId");

    const result = await callTrpc<SectionImportResult>(
      "section.importPack",
      {
        publicationId,
        templateId
      },
      options
    );

    return makeToolResult(
      `Imported pack ${result.templateId}: ${result.createdCount} created, ${result.updatedCount} updated`,
      result
    );
  }

  if (toolName === "section.create") {
    const publicationId = await readPublicationId(args, options);
    const name = readRequiredString(args, "name");
    const contentJson = readRequiredJsonObjectArray(args, "contentJson");

    const section = await callTrpc<ReusableSectionRecord>(
      "section.create",
      {
        publicationId,
        name,
        contentJson
      },
      options
    );

    return makeToolResult(`Reusable section saved: ${section.id}`, { section });
  }

  if (toolName === "section.update") {
    const sectionId = readRequiredString(args, "sectionId");
    const name = readRequiredString(args, "name");
    const contentJson = readRequiredJsonObjectArray(args, "contentJson");

    const section = await callTrpc<ReusableSectionRecord>(
      "section.update",
      {
        sectionId,
        name,
        contentJson
      },
      options
    );

    return makeToolResult(`Reusable section updated: ${section.id}`, { section });
  }

  if (toolName === "section.remove") {
    const sectionId = readRequiredString(args, "sectionId");
    const result = await callTrpc<{ removed: boolean; sectionId: string }>(
      "section.remove",
      { sectionId },
      options
    );

    return makeToolResult(`Reusable section removed: ${result.sectionId}`, result);
  }

  if (toolName === "issue.preview") {
    const issueId = readRequiredString(args, "issueId");
    const preview = await callTrpc<IssuePreview>(
      "issue.preview",
      { issueId },
      options,
      "query"
    );

    return makeToolResult(`Preview generated for ${preview.issueId}`, preview);
  }

  if (toolName === "issue.preview_draft") {
    const publicationId = await readPublicationId(args, options);
    const title = readRequiredString(args, "title");
    const html = readRequiredString(args, "html");
    const plainText = asOptionalString(args.plainText);
    const styleProfile = readOptionalJsonObject(args, "styleProfile");

    const preview = await callTrpc<IssueDraftPreview>(
      "issue.previewDraft",
      {
        publicationId,
        title,
        html,
        ...(plainText ? { plainText } : {}),
        ...(styleProfile ? { styleProfile } : {})
      },
      options
    );

    return makeToolResult(
      `Draft preview generated for ${preview.publicationId}: ${preview.title}`,
      preview
    );
  }

  if (toolName === "issue.delivery_progress") {
    const publicationId = await readPublicationId(args, options);
    const issueId = readRequiredString(args, "issueId");
    const progress = await callTrpc<IssueDeliveryProgress>(
      "issue.deliveryProgress",
      {
        publicationId,
        issueId
      },
      options,
      "query"
    );

    if (progress.delivery.isPreparing) {
      return makeToolResult(
        `Issue ${progress.issueId} is preparing delivery (status: ${progress.status})`,
        progress
      );
    }

    return makeToolResult(
      `Issue ${progress.issueId} delivery: ${progress.delivery.processed}/${progress.delivery.total} processed (${progress.delivery.completionPercent}%)`,
      progress
    );
  }

  if (toolName === "issue.wait_delivery") {
    const publicationId = await readPublicationId(args, options);
    const issueId = readRequiredString(args, "issueId");
    const timeoutMs = Math.max(1_000, Math.min(300_000, Math.trunc(readOptionalNumber(args, "timeoutMs") ?? 60_000)));
    const pollIntervalMs = Math.max(250, Math.min(10_000, Math.trunc(readOptionalNumber(args, "pollIntervalMs") ?? 2_000)));
    const startedAt = Date.now();

    while (true) {
      const progress = await callTrpc<IssueDeliveryProgress>(
        "issue.deliveryProgress",
        {
          publicationId,
          issueId
        },
        options,
        "query"
      );

      if (progress.status === "sent" || progress.status === "failed") {
        return makeToolResult(
          `Issue ${progress.issueId} delivery finished with status ${progress.status}: ${progress.delivery.processed}/${progress.delivery.total} processed (${progress.delivery.completionPercent}%)`,
          {
            timedOut: false,
            elapsedMs: Date.now() - startedAt,
            progress
          }
        );
      }

      const elapsedMs = Date.now() - startedAt;
      if (elapsedMs >= timeoutMs) {
        return makeToolResult(
          `Issue ${progress.issueId} delivery still in status ${progress.status} after ${elapsedMs}ms`,
          {
            timedOut: true,
            elapsedMs,
            progress
          }
        );
      }

      await sleep(pollIntervalMs);
    }
  }

  if (toolName === "analytics.poll_results") {
    const publicationId = await readPublicationId(args, options);
    const issueId = readRequiredString(args, "issueId");
    const analytics = await callTrpc<IssuePollResults>(
      "issue.pollResults",
      {
        publicationId,
        issueId
      },
      options,
      "query"
    );

    return makeToolResult(
      analytics.polls.length === 0
        ? `No poll results yet for ${issueId}`
        : `Loaded ${analytics.polls.length} polls for ${issueId}`,
      analytics
    );
  }

  if (toolName === "analytics.issue_performance") {
    const publicationId = await readPublicationId(args, options);
    const issueId = readRequiredString(args, "issueId");
    const range = readIssueAnalyticsRange(args, "range") ?? DEFAULT_ISSUE_ANALYTICS_RANGE;
    const analytics = await callTrpc<IssueAnalytics>(
      "issue.analytics",
      {
        publicationId,
        issueId,
        range
      },
      options,
      "query"
    );

    return makeToolResult(
      `Issue analytics loaded for ${issueId}: ${analytics.opens.unique} unique opens, ${analytics.clicks.unique} unique clicks`,
      analytics
    );
  }

  if (toolName === "analytics.issue_export_csv") {
    const publicationId = await readPublicationId(args, options);
    const issueId = readRequiredString(args, "issueId");
    const range = readIssueAnalyticsRange(args, "range") ?? DEFAULT_ISSUE_ANALYTICS_RANGE;
    const exportType = readIssueAnalyticsExportType(args, "exportType") ?? "combined";
    const exported = await callTrpc<IssueAnalyticsCsv>(
      "issue.analyticsExportCsv",
      {
        publicationId,
        issueId,
        range,
        exportType
      },
      options,
      "query"
    );

    return makeToolResult(
      `Issue analytics ${exported.exportType} CSV ready for ${issueId}: ${exported.filename} (${exported.rowCount} rows)`,
      exported
    );
  }

  if (toolName === "analytics.issue_export_performance_csv") {
    const publicationId = await readPublicationId(args, options);
    const issueId = readRequiredString(args, "issueId");
    const range = readIssueAnalyticsRange(args, "range") ?? DEFAULT_ISSUE_ANALYTICS_RANGE;
    const exported = await callTrpc<IssueAnalyticsCsv>(
      "issue.analyticsExportCsv",
      {
        publicationId,
        issueId,
        range,
        exportType: "performance"
      },
      options,
      "query"
    );

    return makeToolResult(
      `Issue performance CSV ready for ${issueId}: ${exported.filename} (${exported.rowCount} rows)`,
      exported
    );
  }

  if (toolName === "analytics.issue_export_polls_csv") {
    const publicationId = await readPublicationId(args, options);
    const issueId = readRequiredString(args, "issueId");
    const range = readIssueAnalyticsRange(args, "range") ?? DEFAULT_ISSUE_ANALYTICS_RANGE;
    const exported = await callTrpc<IssueAnalyticsCsv>(
      "issue.analyticsExportCsv",
      {
        publicationId,
        issueId,
        range,
        exportType: "polls"
      },
      options,
      "query"
    );

    return makeToolResult(
      `Issue poll CSV ready for ${issueId}: ${exported.filename} (${exported.rowCount} rows)`,
      exported
    );
  }

  if (toolName === "analytics.issue_trend") {
    const publicationId = await readPublicationId(args, options);
    const issueId = readRequiredString(args, "issueId");
    const range = readIssueAnalyticsRange(args, "range") ?? DEFAULT_ISSUE_ANALYTICS_RANGE;
    const trend = await callTrpc<IssueAnalyticsTrend>(
      "issue.analyticsTrend",
      {
        publicationId,
        issueId,
        range
      },
      options,
      "query"
    );

    return makeToolResult(
      `Issue trend loaded for ${issueId}: ${trend.points.length} daily points`,
      trend
    );
  }

  if (toolName === "analytics.latest_summary") {
    const publicationId = asOptionalString(args.publicationId);
    const range = readIssueAnalyticsRange(args, "range") ?? "7d";
    const summary = await loadLatestAnalyticsSummary(options, {
      publicationId,
      range
    });

    if (summary.status === "missing_publication_context") {
      return makeToolResult("Missing publication context for analytics.latest_summary", summary);
    }

    if (summary.status === "no_issues") {
      return makeToolResult(`No issues found for ${summary.publicationId}`, summary);
    }

    return makeToolResult(
      `Latest analytics loaded for ${summary.issue.id}: ${summary.analytics.opens.unique} unique opens, ${summary.analytics.clicks.unique} unique clicks`,
      summary
    );
  }

  if (toolName === "issue.schedule") {
    const issueId = readRequiredString(args, "issueId");
    const scheduledFor = asOptionalString(args.scheduledFor);

    const issue = await callTrpc<IssueRecord>(
      "issue.schedule",
      {
        issueId,
        ...(scheduledFor ? { scheduledFor } : {})
      },
      options
    );

    return makeToolResult(`Issue scheduled: ${issue.id}`, { issue });
  }

  if (toolName === "issue.unschedule") {
    const issueId = readRequiredString(args, "issueId");

    const issue = await callTrpc<IssueRecord>(
      "issue.unschedule",
      { issueId },
      options
    );

    return makeToolResult(`Issue unscheduled: ${issue.id}`, { issue });
  }

  if (toolName === "issue.publish_to_web") {
    const issueId = readRequiredString(args, "issueId");

    const issue = await callTrpc<IssueRecord>(
      "issue.publishToWeb",
      { issueId },
      options
    );

    return makeToolResult(`Issue published to web: ${issue.id}`, { issue });
  }

  if (toolName === "issue.unpublish_from_web") {
    const issueId = readRequiredString(args, "issueId");

    const issue = await callTrpc<IssueRecord>(
      "issue.unpublishFromWeb",
      { issueId },
      options
    );

    return makeToolResult(`Issue unpublished from web: ${issue.id}`, { issue });
  }

  if (toolName === "issue.send_now") {
    const issueId = readRequiredString(args, "issueId");

    const issue = await callTrpc<IssueRecord>(
      "issue.sendNow",
      { issueId },
      options
    );

    return makeToolResult(`Issue sent: ${issue.id}`, { issue });
  }

  if (toolName === "issue.send_and_wait") {
    const issueId = readRequiredString(args, "issueId");
    const timeoutMs = Math.max(1_000, Math.min(300_000, Math.trunc(readOptionalNumber(args, "timeoutMs") ?? 60_000)));
    const pollIntervalMs = Math.max(250, Math.min(10_000, Math.trunc(readOptionalNumber(args, "pollIntervalMs") ?? 2_000)));

    const issue = await callTrpc<IssueRecord>(
      "issue.sendNow",
      { issueId },
      options
    );
    const startedAt = Date.now();

    while (true) {
      const progress = await callTrpc<IssueDeliveryProgress>(
        "issue.deliveryProgress",
        {
          publicationId: issue.publicationId,
          issueId: issue.id
        },
        options,
        "query"
      );

      if (progress.status === "sent" || progress.status === "failed") {
        return makeToolResult(
          `Issue ${issue.id} send-and-wait finished with status ${progress.status}: ${progress.delivery.processed}/${progress.delivery.total} processed (${progress.delivery.completionPercent}%)`,
          {
            issue: issueStateAfterProgress(issue, progress),
            timedOut: false,
            elapsedMs: Date.now() - startedAt,
            progress
          }
        );
      }

      const elapsedMs = Date.now() - startedAt;
      if (elapsedMs >= timeoutMs) {
        return makeToolResult(
          `Issue ${issue.id} queued but still ${progress.status} after ${elapsedMs}ms`,
          {
            issue: issueStateAfterProgress(issue, progress),
            timedOut: true,
            elapsedMs,
            progress
          }
        );
      }

      await sleep(pollIntervalMs);
    }
  }

  if (toolName === "ai.generate_draft") {
    const publicationId = await readPublicationId(args, options);
    const prompt = readRequiredString(args, "prompt");
    const tone = asOptionalString(args.tone);

    if (tone && tone !== "neutral" && tone !== "friendly" && tone !== "formal") {
      throw new Error("tone must be one of: neutral, friendly, formal");
    }

    const draft = await callTrpc<AiDraft>(
      "ai.generateDraft",
      {
        publicationId,
        prompt,
        ...(tone ? { tone } : {})
      },
      options
    );

    // Honest about what this is (user-testing 0924a, mcp/F13): the server
    // returns a fixed scaffold with no model call, and it used to come back as
    // "AI draft generated", which an agent reasonably took as finished copy.
    return makeToolResult(
      "Scaffold only: no AI model ran and nothing was saved. Write the email yourself and save it with issue.create_draft.",
      { ...draft, scaffold: true, saved: false, next: "issue.create_draft" }
    );
  }

  if (toolName === "template.create") {
    const publicationId = await readPublicationId(args, options);
    const name = readRequiredString(args, "name");
    const html = asOptionalString(args.html);
    const spec = args.spec as Record<string, unknown> | undefined;
    const editorDoc = readOptionalJsonObject(args, "editor_doc");
    const styleProfile = readOptionalJsonObject(args, "style_profile");
    const mailteaTheme = readOptionalJsonObject(args, "mailtea_theme");
    const globalCss = asOptionalString(args.global_css);
    const category = asOptionalString(args.category);
    const previewImageUrl = asOptionalString(args.preview_image_url);
    const tags = readOptionalStringArray(args, "tags");
    const description = asOptionalString(args.description);
    const text = asOptionalString(args.text);
    const subject = asOptionalString(args.subject);
    const from = asOptionalString(args.from);
    const replyTo = asOptionalString(args.reply_to);
    const variables = args.variables as Array<{ key: string; type: string; fallback_value?: unknown }> | undefined;
    assertTemplateVariableKeys(variables);

    if (!html && !spec && !editorDoc) {
      throw new Error("One of 'editor_doc', 'spec' or 'html' must be provided");
    }
    // The server would silently ignore the html rather than reject it, so the
    // caller would never learn that the email they get is not the one they sent.
    if (editorDoc && html) {
      throw new Error(
        "'editor_doc' templates render their own HTML server-side — send 'editor_doc' without 'html'"
      );
    }

    const body: Record<string, unknown> = {
      publication_id: publicationId,
      name,
      ...(html ? { html } : {}),
      ...(spec ? { spec } : {}),
      ...(editorDoc ? { editor_doc: editorDoc } : {}),
      ...(styleProfile ? { style_profile: styleProfile } : {}),
      ...(mailteaTheme ? { mailtea_theme: mailteaTheme } : {}),
      ...(globalCss ? { global_css: globalCss } : {}),
      ...(category ? { category } : {}),
      ...(previewImageUrl ? { preview_image_url: previewImageUrl } : {}),
      ...(tags ? { tags } : {}),
      ...(description ? { description } : {}),
      ...(text ? { text } : {}),
      ...(subject ? { subject } : {}),
      ...(from ? { from } : {}),
      ...(replyTo ? { reply_to: replyTo } : {}),
      ...(variables ? { variables } : {})
    };

    const template = await callRestApi<Record<string, unknown>>(
      "POST",
      "/v1/templates",
      body,
      options
    );

    return makeToolResult(
      `Template created: ${template.id} (${template.format})`,
      { template }
    );
  }

  if (toolName === "template.list") {
    const publicationId = await readPublicationId(args, options);
    const limit = readOptionalNumber(args, "limit") ?? 20;

    const result = await callRestApi<{ data: Array<Record<string, unknown>>; has_more: boolean }>(
      "GET",
      `/v1/templates?publication_id=${encodeURIComponent(publicationId)}&limit=${limit}`,
      undefined,
      options
    );

    const names = result.data.map((t) => `${t.id}: ${t.name} (${t.format}, ${t.status})`);
    return makeToolResult(
      result.data.length > 0
        ? `${result.data.length} template(s):\n${names.join("\n")}`
        : "No templates found",
      result
    );
  }

  if (toolName === "template.get") {
    const publicationId = await readPublicationId(args, options);
    const templateId = readRequiredString(args, "templateId");

    const template = await callRestApi<Record<string, unknown>>(
      "GET",
      `/v1/templates/${encodeURIComponent(templateId)}?publication_id=${encodeURIComponent(publicationId)}`,
      undefined,
      options
    );

    return makeToolResult(
      `Template: ${template.name} (${template.format}, ${template.status})`,
      { template }
    );
  }

  if (toolName === "template.update") {
    const publicationId = await readPublicationId(args, options);
    const templateId = readRequiredString(args, "templateId");
    const name = asOptionalString(args.name);
    const html = asOptionalString(args.html);
    const spec = args.spec as Record<string, unknown> | undefined;
    const editorDoc = readOptionalJsonObject(args, "editor_doc");
    const styleProfile = readOptionalJsonObject(args, "style_profile");
    const mailteaTheme = readOptionalJsonObject(args, "mailtea_theme");
    // Three-state: undefined leaves the stored value alone, null clears it.
    const globalCss = readNullableString(args, "global_css");
    const category = readNullableString(args, "category");
    const previewImageUrl = readNullableString(args, "preview_image_url");
    const tags = readNullableStringArray(args, "tags");
    const description = asOptionalString(args.description);
    const text = asOptionalString(args.text);
    const subject = asOptionalString(args.subject);
    const from = asOptionalString(args.from);
    const replyTo = asOptionalString(args.reply_to);
    const variables = args.variables as Array<{ key: string; type: string; fallback_value?: unknown }> | undefined;
    assertTemplateVariableKeys(variables);
    const baseRevision = readOptionalNumber(args, "base_revision");

    if (editorDoc && html) {
      throw new Error(
        "'editor_doc' templates render their own HTML server-side — send 'editor_doc' without 'html'"
      );
    }

    const body: Record<string, unknown> = {
      ...(name ? { name } : {}),
      ...(html ? { html } : {}),
      ...(spec ? { spec } : {}),
      ...(editorDoc ? { editor_doc: editorDoc } : {}),
      ...(styleProfile ? { style_profile: styleProfile } : {}),
      ...(mailteaTheme ? { mailtea_theme: mailteaTheme } : {}),
      ...(globalCss === undefined ? {} : { global_css: globalCss }),
      ...(category === undefined ? {} : { category }),
      ...(previewImageUrl === undefined ? {} : { preview_image_url: previewImageUrl }),
      ...(tags === undefined ? {} : { tags }),
      ...(description ? { description } : {}),
      ...(text ? { text } : {}),
      ...(subject ? { subject } : {}),
      ...(from ? { from } : {}),
      ...(replyTo ? { reply_to: replyTo } : {}),
      ...(variables ? { variables } : {}),
      ...(baseRevision !== undefined ? { base_revision: baseRevision } : {})
    };

    const template = await callRestApi<Record<string, unknown>>(
      "PATCH",
      `/v1/templates/${encodeURIComponent(templateId)}?publication_id=${encodeURIComponent(publicationId)}`,
      body,
      options
    ).catch((error: unknown) =>
      rethrowChangedElsewhere(error, "template.get", "base_revision", "current_revision")
    );

    // Whether the edit is live is the part an agent most needs, so it is said in
    // the summary line and not only in the structured `has_unpublished_versions`.
    return makeToolResult(
      `Template updated: ${template.id}${
        template.has_unpublished_versions
          ? ". Saved, not published yet: automations and the API keep sending the published version until template.publish is called."
          : ""
      }`,
      { template }
    );
  }

  if (toolName === "template.publish") {
    const publicationId = await readPublicationId(args, options);
    const templateId = readRequiredString(args, "templateId");
    const baseRevision = readOptionalNumber(args, "base_revision");

    const template = await callRestApi<Record<string, unknown>>(
      "POST",
      `/v1/templates/${encodeURIComponent(templateId)}/publish?publication_id=${encodeURIComponent(publicationId)}`,
      baseRevision !== undefined ? { base_revision: baseRevision } : undefined,
      options
    ).catch((error: unknown) =>
      rethrowChangedElsewhere(error, "template.get", "base_revision", "current_revision")
    );

    return makeToolResult(`Template published: ${template.id} (${template.status})`, { template });
  }

  if (toolName === "template.unpublish") {
    const publicationId = await readPublicationId(args, options);
    const templateId = readRequiredString(args, "templateId");

    const template = await callRestApi<Record<string, unknown>>(
      "POST",
      `/v1/templates/${encodeURIComponent(templateId)}/unpublish?publication_id=${encodeURIComponent(publicationId)}`,
      undefined,
      options
    );

    return makeToolResult(`Template unpublished: ${template.id} (${template.status})`, { template });
  }

  if (toolName === "template.versions") {
    const publicationId = await readPublicationId(args, options);
    const templateId = readRequiredString(args, "templateId");
    const limit = readOptionalNumber(args, "limit");

    const result = await callRestApi<{
      data: Array<Record<string, unknown>>;
      retention: { max_versions: number; coalesce_window_seconds: number };
    }>(
      "GET",
      withQuery(`/v1/templates/${encodeURIComponent(templateId)}/versions`, {
        publication_id: publicationId,
        limit
      }),
      undefined,
      options
    );

    const lines = result.data.map((version) => {
      const author = version.author as { name?: string; email?: string } | null;
      const who = author?.name ?? author?.email ?? "unknown";
      // The sender, when the version holds one: a sender-only change can be an
      // entry of its own, and without it two such entries read the same. A
      // version from before sender history says so, because its missing From
      // does not mean "none" and a restore of it keeps the current sender.
      const sender =
        version.sender_recorded === false
          ? "sender not recorded"
          : [
              typeof version.from === "string" ? `from ${version.from}` : null,
              typeof version.reply_to === "string" ? `reply-to ${version.reply_to}` : null
            ]
              .filter(Boolean)
              .join(", ");
      return `v${version.version}${version.is_current ? " (current)" : ""}${version.is_published ? " (published)" : ""}: ${version.origin} by ${who} at ${version.created_at}${sender ? ` (${sender})` : ""}`;
    });
    return makeToolResult(
      result.data.length > 0
        ? `${result.data.length} version(s):\n${lines.join("\n")}`
        : "No versions found",
      result
    );
  }

  if (toolName === "template.restore_version") {
    const publicationId = await readPublicationId(args, options);
    const templateId = readRequiredString(args, "templateId");
    const version = readOptionalNumber(args, "version");
    if (version === undefined) {
      throw new Error("Missing required number argument: version");
    }

    const result = await callRestApi<{
      restored: boolean;
      restored_from_version?: number;
      reason?: string;
      unpublished: boolean;
      message: string;
      template: Record<string, unknown>;
    }>(
      "POST",
      withQuery(
        `/v1/templates/${encodeURIComponent(templateId)}/versions/${encodeURIComponent(String(version))}/restore`,
        { publication_id: publicationId }
      ),
      undefined,
      options
    );

    // Whether the restored design is live yet is the part a caller most needs
    // to hear about, so it is said in the summary line too, not just in the
    // structured `template.has_unpublished_versions`.
    const restoredTemplate = result.template as { has_unpublished_versions?: boolean } | undefined;
    return makeToolResult(
      result.restored
        ? `Restored version ${version} onto template ${templateId}. The design it replaced was kept as its own version, so this restore can be undone by restoring the entry above it.${
            restoredTemplate?.has_unpublished_versions
              ? " Your changes are saved but not published: automations and the API keep sending the published version until template.publish is called again."
              : ""
          }`
        : `Nothing restored: ${result.message}`,
      result
    );
  }

  if (toolName === "template.duplicate") {
    const publicationId = await readPublicationId(args, options);
    const templateId = readRequiredString(args, "templateId");

    const template = await callRestApi<Record<string, unknown>>(
      "POST",
      `/v1/templates/${encodeURIComponent(templateId)}/duplicate?publication_id=${encodeURIComponent(publicationId)}`,
      undefined,
      options
    );

    return makeToolResult(`Template duplicated: new template ${template.id}`, { template });
  }

  if (toolName === "template.delete") {
    const publicationId = await readPublicationId(args, options);
    const templateId = readRequiredString(args, "templateId");

    const result = await callRestApi<{ id: string; deleted: boolean }>(
      "DELETE",
      `/v1/templates/${encodeURIComponent(templateId)}?publication_id=${encodeURIComponent(publicationId)}`,
      undefined,
      options
    );

    return makeToolResult(`Template deleted: ${result.id}`, result);
  }

  if (toolName === "template.render") {
    const spec = args.spec as Record<string, unknown> | undefined;
    if (!spec) {
      throw new Error("'spec' is required");
    }
    const variables = args.variables as Record<string, unknown> | undefined;

    const body: Record<string, unknown> = {
      spec,
      ...(variables ? { variables } : {})
    };

    const rendered = await callRestApi<{ html: string; text: string }>(
      "POST",
      "/v1/templates/render",
      body,
      options
    );

    return makeToolResult("Template spec rendered", rendered);
  }

  if (toolName === "email.send") {
    // Thin pass-through to the validated REST endpoint (POST /v1/emails), which
    // sanitizes HTML, resolves templates, and dispatches to the worker. We only
    // forward recognized fields; sendEmailSchema does the real validation.
    const body: Record<string, unknown> = {};
    for (const key of EMAIL_SEND_FIELDS) {
      if (args[key] !== undefined) body[key] = args[key];
    }
    // A template carries its own subject and sender, which the API uses when
    // the request leaves them out (mirrors sendEmailSchema's refines in
    // packages/contracts). Caught here so an agent gets a clear message before
    // the round-trip instead of a generic 400 from the REST endpoint.
    const templated = body.template !== undefined;
    if (body.to === undefined) throw new Error("Missing required field: to");
    if (body.subject === undefined && !templated) {
      throw new Error("Missing required field: subject (or send a template, whose published subject is used)");
    }
    if (body.from !== undefined && body.sender_id !== undefined) {
      throw new Error("Provide exactly one of 'from' or 'sender_id'.");
    }
    if (body.from === undefined && body.sender_id === undefined && !templated) {
      throw new Error(
        "Provide exactly one of 'from' or 'sender_id', or send a template, whose published sender is used."
      );
    }
    if (!body.html && !body.text && !templated) {
      throw new Error("Provide 'html', 'text' or a 'template'. An email with no body is not sent.");
    }

    const result = await callRestApi<{ id: string }>(
      "POST",
      "/v1/emails",
      body,
      options
    );

    return makeToolResult(
      body.scheduled_at
        ? `Email scheduled (${result.id}) for ${String(body.scheduled_at)}`
        : `Email queued for delivery (${result.id})`,
      result
    );
  }

  if (toolName === "email.batch") {
    const emails = args.emails;
    if (!Array.isArray(emails) || emails.length === 0) {
      throw new Error("'emails' must be a non-empty array of email objects.");
    }

    // The batch endpoint takes a bare array as its body (batchSchema).
    const result = await callRestApi<{ data: Array<{ id: string }> }>(
      "POST",
      "/v1/emails/batch",
      emails,
      options
    );

    return makeToolResult(
      `Batch queued: ${result.data?.length ?? 0} email(s).`,
      result
    );
  }

  if (toolName === "email.get") {
    const id = readRequiredString(args, "id");
    const email = await callRestApi<Record<string, unknown>>(
      "GET",
      `/v1/emails/${encodeURIComponent(id)}`,
      undefined,
      options
    );

    // A failed send says why in the summary line, not only in the payload: the
    // reason is the whole point of asking, and an agent reading the first line
    // should not have to go digging to find it.
    const failure = email.error ? ` — ${String(email.error)}` : "";
    // The same marker `email.list` puts on a test row, for the same reason and
    // more urgently: a retrieve is what an agent calls to confirm one specific
    // send landed, and that answer is the one most likely to be repeated to a
    // human as "your email was delivered".
    const marker = email.mode === "test" ? " [test]" : "";
    return makeToolResult(
      `Email ${id}: ${String(email.last_event ?? "unknown")}${marker}${failure} (opens ${String(
        email.open_count ?? 0
      )}, clicks ${String(email.click_count ?? 0)})`,
      { email }
    );
  }

  if (toolName === "email.reschedule") {
    const id = readRequiredString(args, "id");
    const scheduledAt = readRequiredString(args, "scheduled_at");
    const result = await callRestApi<{ id: string }>(
      "PATCH",
      `/v1/emails/${encodeURIComponent(id)}`,
      { scheduled_at: scheduledAt },
      options
    );

    return makeToolResult(`Email ${id} rescheduled for ${scheduledAt}.`, result);
  }

  if (toolName === "email.cancel") {
    const id = readRequiredString(args, "id");
    const result = await callRestApi<{ id: string }>(
      "POST",
      `/v1/emails/${encodeURIComponent(id)}/cancel`,
      undefined,
      options
    );

    return makeToolResult(`Email ${id} canceled.`, result);
  }

  if (toolName === "email.resend") {
    const id = readRequiredString(args, "id");
    const result = await callTrpc<{ email: { id: string; status: string } }>(
      "email.resend",
      { id },
      options
    );

    return makeToolResult(`Email ${id} resent as ${result.email.id}.`, result);
  }

  if (toolName === "email.list") {
    const params = new URLSearchParams();
    const limit = readOptionalNumber(args, "limit");
    const offset = readOptionalNumber(args, "offset");
    if (limit !== undefined) params.set("limit", String(limit));
    if (offset !== undefined) params.set("offset", String(offset));
    // `mode` belongs here, not only in the inputSchema: a key missing from this
    // list is accepted by the schema, advertised to agents and then silently
    // dropped before the request — the filter appears to do nothing.
    for (const key of [
      "status",
      "tag_name",
      "tag_value",
      "search",
      "from_date",
      "to_date",
      "mode"
    ] as const) {
      const value = asOptionalString(args[key]);
      if (value) params.set(key, value);
    }

    const qs = params.toString();
    const result = await callRestApi<{
      data: Array<Record<string, unknown>>;
      total: number;
      has_more: boolean;
    }>("GET", `/v1/emails${qs ? `?${qs}` : ""}`, undefined, options);

    const lines = result.data.map((email) => {
      // Marked only when it is test mail. A live list is the common case and
      // stays unlabelled; the label exists so an agent reading a summary cannot
      // report a simulated send as a real delivery.
      const marker = email.mode === "test" ? " [test]" : "";
      return `${String(email.id)}: ${String(email.last_event)}${marker} — ${String(email.subject)} → ${String(email.to)}`;
    });
    return makeToolResult(
      result.data.length > 0
        ? `${result.data.length} of ${result.total} email(s):\n${lines.join("\n")}`
        : "No emails found.",
      result
    );
  }

  if (toolName === "email.analytics") {
    const params = new URLSearchParams();
    for (const key of ["from_date", "to_date"] as const) {
      const value = asOptionalString(args[key]);
      if (value) params.set(key, value);
    }

    const qs = params.toString();
    const result = await callRestApi<{
      total: number;
      sent: number;
      delivered: number;
      bounced: number;
      opened: number;
      clicked: number;
      rates: {
        delivery_rate: number;
        open_rate: number;
        click_rate: number;
        bounce_rate: number;
      };
    }>("GET", `/v1/emails/analytics${qs ? `?${qs}` : ""}`, undefined, options);

    const pct = (rate: number) => `${(rate * 100).toFixed(1)}%`;
    return makeToolResult(
      `${result.sent} sent (of ${result.total}): delivered ${result.delivered} (${pct(result.rates.delivery_rate)}), ` +
        `opened ${result.opened} (${pct(result.rates.open_rate)}), ` +
        `clicked ${result.clicked} (${pct(result.rates.click_rate)}), ` +
        `bounced ${result.bounced} (${pct(result.rates.bounce_rate)})`,
      result
    );
  }

  // --- Inbound email --------------------------------------------------------
  if (toolName === "email.inbound_list") {
    const publicationId = await readPublicationId(args, options);
    const limit = readOptionalNumber(args, "limit");
    const cursor = asOptionalString(args.cursor);
    const params = new URLSearchParams({ publication_id: publicationId });
    if (limit !== undefined) params.set("limit", String(limit));
    if (cursor) params.set("cursor", cursor);
    const result = await callRestApi<{ data: unknown[]; has_more: boolean }>(
      "GET",
      `/v1/emails/inbound?${params.toString()}`,
      undefined,
      options
    );
    return makeToolResult(`${result.data.length} inbound email(s).`, result);
  }

  if (toolName === "email.inbound_get") {
    const id = readRequiredString(args, "id");
    const result = await callRestApi<Record<string, unknown>>(
      "GET",
      `/v1/emails/inbound/${encodeURIComponent(id)}`,
      undefined,
      options
    );
    return makeToolResult(
      `Inbound email ${id}: ${String(result.subject ?? "(no subject)")} from ${String(
        result.from ?? "unknown"
      )}.`,
      result
    );
  }

  if (toolName === "email.inbound_list_attachments") {
    const id = readRequiredString(args, "id");
    const result = await callRestApi<{ data: unknown[] }>(
      "GET",
      `/v1/emails/inbound/${encodeURIComponent(id)}/attachments`,
      undefined,
      options
    );
    return makeToolResult(`${result.data.length} attachment(s).`, result);
  }

  if (toolName === "email.inbound_get_attachment") {
    const id = readRequiredString(args, "id");
    const attachmentId = readRequiredString(args, "attachmentId");
    const result = await callRestApi<{ id: string; filename: string }>(
      "GET",
      `/v1/emails/inbound/${encodeURIComponent(id)}/attachments/${encodeURIComponent(attachmentId)}`,
      undefined,
      options
    );
    return makeToolResult(`Attachment ${result.id} (${result.filename}).`, result);
  }

  if (toolName === "email.inbound_reply") {
    const id = readRequiredString(args, "id");
    // Threading (In-Reply-To/References), the reply target, and the Re: subject
    // default are all derived server-side — the caller only supplies content and
    // optional sender/cc/bcc. Forward just the recognized keys that are defined;
    // inboundReplySchema does the real validation.
    const body: Record<string, unknown> = {};
    for (const key of ["from", "subject", "html", "text", "cc", "bcc", "idempotency_key"] as const) {
      if (args[key] !== undefined) body[key] = args[key];
    }
    if (body.html === undefined && body.text === undefined) {
      throw new Error("Provide 'html' and/or 'text' for the reply body.");
    }
    const result = await callRestApi<{ id: string; status: string }>(
      "POST",
      `/v1/emails/inbound/${encodeURIComponent(id)}/reply`,
      body,
      options
    );
    return makeToolResult(`Reply queued as ${result.id} (${result.status}).`, result);
  }

  if (toolName === "issue.send_test") {
    const issueId = readRequiredString(args, "issueId");
    const from = readRequiredString(args, "from");
    const recipients = args.recipients;
    if (
      !recipients ||
      (typeof recipients !== "string" && !Array.isArray(recipients)) ||
      (Array.isArray(recipients) && recipients.length === 0)
    ) {
      throw new Error("'recipients' must be an email address or a non-empty array of addresses.");
    }

    // Renders the saved draft server-side and delivers a one-shot [TEST] copy
    // via POST /v1/posts/:id/test, which enforces the verified-from-domain gate
    // (422 otherwise) — same path as the SDK/CLI and the dashboard.
    const recipientList = Array.isArray(recipients) ? recipients : [recipients];
    const result = await callRestApi<{
      id: string;
      sent_to: string[];
      failed_to: Array<{ address: string; reason: string }>;
    }>(
      "POST",
      `/v1/posts/${encodeURIComponent(issueId)}/test`,
      { recipients: recipientList, from },
      options
    );

    const failedNote = result.failed_to.length ? `, ${result.failed_to.length} failed` : "";
    return makeToolResult(
      `Test of ${issueId} sent to ${result.sent_to.length} recipient(s)${failedNote}.`,
      result
    );
  }

  // --- Email sending domains -----------------------------------------------
  if (toolName === "domain.create") {
    const publicationId = await readPublicationId(args, options);
    const name = readRequiredString(args, "name");
    const purpose = asOptionalString(args.purpose);
    const isPrimary = readOptionalBoolean(args, "is_primary");
    const region = asOptionalString(args.region);
    const tls = asOptionalString(args.tls);
    // Read raw for the same reason `domain.update` does: `asOptionalString`
    // maps `""` to `undefined`, so an empty subdomain dropped the key and the
    // agent got a created domain with no tracking host and no error — while
    // this tool's own schema says `""` is refused with
    // `tracking_subdomain_invalid`. Only `undefined` omits; everything else,
    // including a wrong type, goes to the wire and the API is the judge.
    const trackingSubdomain =
      args.tracking_subdomain === undefined ? undefined : args.tracking_subdomain;
    const result = await callRestApi<{ id: string; name: string; status: string; records: unknown[] }>(
      "POST",
      "/v1/domains",
      {
        publication_id: publicationId,
        name,
        ...(purpose ? { purpose } : {}),
        ...(isPrimary !== undefined ? { is_primary: isPrimary } : {}),
        // Only sent when named: the API's own defaults (the deployment region,
        // opportunistic TLS, no tracking subdomain) are the right answer, and
        // sending them explicitly would freeze today's defaults into every
        // agent-created domain.
        ...(region ? { region } : {}),
        ...(tls ? { tls } : {}),
        ...(trackingSubdomain !== undefined ? { tracking_subdomain: trackingSubdomain } : {})
      },
      options
    );
    return makeToolResult(
      `Domain ${result.name} created (${result.status}). Add the DNS records, then call domain.verify.`,
      result
    );
  }

  if (toolName === "domain.list") {
    const publicationId = await readPublicationId(args, options);
    const limit = readOptionalNumber(args, "limit");
    const params = new URLSearchParams({ publication_id: publicationId });
    if (limit !== undefined) params.set("limit", String(limit));
    const region = asOptionalString(args.region);
    if (region) params.set("region", region);
    const status = asOptionalString(args.status);
    if (status) params.set("status", status);
    const result = await callRestApi<{ data: unknown[] }>(
      "GET",
      `/v1/domains?${params.toString()}`,
      undefined,
      options
    );
    return makeToolResult(`${result.data.length} domain(s).`, result);
  }

  if (toolName === "domain.get") {
    const publicationId = await readPublicationId(args, options);
    const domainId = readRequiredString(args, "domainId");
    const result = await callRestApi<{ id: string; name: string; status: string; records: unknown[] }>(
      "GET",
      `/v1/domains/${encodeURIComponent(domainId)}?publication_id=${encodeURIComponent(publicationId)}`,
      undefined,
      options
    );
    return makeToolResult(`Domain ${result.name} (${result.status}).`, result);
  }

  if (toolName === "domain.verify") {
    const publicationId = await readPublicationId(args, options);
    const domainId = readRequiredString(args, "domainId");
    const result = await callRestApi<{ id: string; name: string; status: string }>(
      "POST",
      `/v1/domains/${encodeURIComponent(domainId)}/verify?publication_id=${encodeURIComponent(publicationId)}`,
      undefined,
      options
    );
    return makeToolResult(`Domain ${result.name} is now ${result.status}.`, result);
  }

  if (toolName === "domain.update") {
    const publicationId = await readPublicationId(args, options);
    const domainId = readRequiredString(args, "domainId");
    const purpose = asOptionalString(args.purpose);
    const isPrimary = readOptionalBoolean(args, "is_primary");
    const openTracking = readOptionalBoolean(args, "open_tracking");
    const clickTracking = readOptionalBoolean(args, "click_tracking");
    const tls = asOptionalString(args.tls);
    // Three states, not two: absent leaves the subdomain alone, `null` removes
    // it, a value sets it. `asOptionalString` collapsed the first two, which is
    // why an agent could not clear one at all.
    //
    // It is deliberately not used for the value either. It maps `""` to
    // `undefined`, so an empty subdomain dropped the key and the agent got a
    // 200 that changed nothing — while this tool's own schema says `""` is
    // refused with `tracking_subdomain_invalid`. Only `undefined` omits here;
    // everything else goes to the wire and the API is the judge, which is how
    // every other client behaves. A wrong TYPE has to reach the API too:
    // mapping it to `null` the way `custom_return_path` does would turn a stray
    // number into the silent removal of a live tracking host.
    const trackingSubdomain =
      args.tracking_subdomain === undefined ? undefined : args.tracking_subdomain;
    // Accepts a boolean OR the subdomain by name, so an agent can either take
    // the conventional `bounce.<domain>` or place it deliberately.
    const rawReturnPath = args.custom_return_path;
    const customReturnPath =
      rawReturnPath === undefined
        ? undefined
        : typeof rawReturnPath === "string" || typeof rawReturnPath === "boolean"
          ? rawReturnPath
          : null;
    const result = await callRestApi<{
      id: string;
      name: string;
      purpose: string;
      open_tracking?: boolean;
      click_tracking?: boolean;
      custom_return_path?: string | null;
      custom_return_path_status?: string | null;
      records?: Array<{
        record: string;
        type: string;
        name: string;
        value: string;
        purpose?: string;
      }>;
    }>(
      "PATCH",
      `/v1/domains/${encodeURIComponent(domainId)}?publication_id=${encodeURIComponent(publicationId)}`,
      {
        ...(purpose ? { purpose } : {}),
        ...(isPrimary !== undefined ? { is_primary: isPrimary } : {}),
        // Only sent when named, so updating the purpose never silently
        // re-enables tracking someone switched off.
        ...(openTracking !== undefined ? { open_tracking: openTracking } : {}),
        ...(clickTracking !== undefined ? { click_tracking: clickTracking } : {}),
        ...(customReturnPath !== undefined ? { custom_return_path: customReturnPath } : {}),
        ...(tls ? { tls } : {}),
        // `!== undefined`, not truthiness: `null` is the removal, and a falsy
        // check would silently turn it into leaving the subdomain in place.
        ...(trackingSubdomain !== undefined ? { tracking_subdomain: trackingSubdomain } : {})
      },
      options
    );
    // Tracking is stated back only when it was the thing being changed —
    // an agent that just set it should see it took, without every unrelated
    // purpose change reciting the whole policy.
    const trackingNote =
      openTracking !== undefined || clickTracking !== undefined
        ? `, tracking: opens ${result.open_tracking ? "on" : "off"}, clicks ${result.click_tracking ? "on" : "off"}`
        : "";
    // An agent that just enabled this cannot act on it without the DNS records,
    // and it has no other way to discover them — so they are stated inline
    // rather than left for a follow-up domain.get.
    const returnPathNote =
      customReturnPath !== undefined && result.custom_return_path
        ? `. Return-path ${result.custom_return_path} is ${result.custom_return_path_status ?? "pending"} — publish these records: ${(
            result.records ?? []
          )
            .filter((record) => record.purpose === "return-path")
            // `type`, never `record`: since the record reshape `record` holds
            // the ROLE ("Return-Path", "SPF"), and printing it here told an
            // operator to create a DNS record of type "Return-Path".
            .map((record) => `${record.type} ${record.name} -> ${record.value}`)
            .join("; ")}. Mail keeps sending on the default return-path until they resolve`
        : customReturnPath !== undefined
          ? ". Return-path reverted to the default"
          : "";
    return makeToolResult(
      `Domain ${result.name} updated (purpose: ${result.purpose}${trackingNote})${returnPathNote}.`,
      result
    );
  }

  if (toolName === "domain.delete") {
    const publicationId = await readPublicationId(args, options);
    const domainId = readRequiredString(args, "domainId");
    const result = await callRestApi<{ id: string }>(
      "DELETE",
      `/v1/domains/${encodeURIComponent(domainId)}?publication_id=${encodeURIComponent(publicationId)}`,
      undefined,
      options
    );
    return makeToolResult(`Domain ${result.id} deleted.`, result);
  }

  // --- Domain claiming ------------------------------------------------------
  if (toolName === "domain.claim") {
    const publicationId = await readPublicationId(args, options);
    const name = readRequiredString(args, "name");
    const region = asOptionalString(args.region);
    const purpose = asOptionalString(args.purpose);
    const result = await callRestApi<{
      id: string;
      name: string;
      status: string;
      expires_at: string | null;
      records?: Array<{ type: string; name: string; value: string }>;
    }>(
      "POST",
      "/v1/domains/claim",
      {
        publication_id: publicationId,
        name,
        ...(region ? { region } : {}),
        ...(purpose ? { purpose } : {})
      },
      options
    );
    // The record is stated inline, not left for a follow-up call: it is the one
    // thing the operator has to act on, and an agent that only reports "claim
    // opened" has told them nothing they can do.
    // Optional-chained on purpose: this is a network boundary, and a claim that
    // came back without its record must still report the claim id rather than
    // dying on a TypeError the caller cannot read.
    const record = result.records?.[0];
    return makeToolResult(
      `Claim ${result.id} opened for ${result.name} (${result.status}). Publish this DNS record to prove control: ${
        record ? `${record.type} ${record.name} -> ${record.value}` : "(none returned)"
      }. Then call domain.claim_verify.${
        result.expires_at ? ` The claim expires at ${result.expires_at}.` : ""
      }`,
      result
    );
  }

  if (toolName === "domain.claim_get") {
    const publicationId = await readPublicationId(args, options);
    const claimId = readRequiredString(args, "claimId");
    const result = await callRestApi<{
      id: string;
      name: string;
      status: string;
      failure_reason: string | null;
      domain_id: string | null;
    }>(
      "GET",
      `/v1/domains/claims/${encodeURIComponent(claimId)}?publication_id=${encodeURIComponent(publicationId)}`,
      undefined,
      options
    );
    return makeToolResult(
      `Claim ${result.id} for ${result.name} is ${result.status}${
        result.failure_reason ? ` (${result.failure_reason})` : ""
      }${result.domain_id ? `. New domain: ${result.domain_id}` : ""}.`,
      result
    );
  }

  if (toolName === "domain.claim_verify") {
    const publicationId = await readPublicationId(args, options);
    const claimId = readRequiredString(args, "claimId");
    const result = await callRestApi<{
      id: string;
      name: string;
      status: string;
      domain_id: string | null;
      // The claimed domain in full, so the DNS it needs is one call away rather
      // than two. Nullable: it only exists once the claim completed.
      domain?: { id: string; records?: unknown[] } | null;
    }>(
      "POST",
      `/v1/domains/claims/${encodeURIComponent(claimId)}/verify?publication_id=${encodeURIComponent(publicationId)}`,
      undefined,
      options
    );
    return makeToolResult(
      result.status === "completed"
        ? `Claim ${result.id} completed. ${result.name} is now yours as domain ${
            result.domain_id ?? "(pending lookup)"
          }. Publish its DNS records (in 'domain.records') before sending from it.`
        : `Claim ${result.id} for ${result.name} is still ${result.status}.`,
      result
    );
  }

  if (toolName === "domain.claim_cancel") {
    const publicationId = await readPublicationId(args, options);
    const claimId = readRequiredString(args, "claimId");
    const result = await callRestApi<{ id: string }>(
      "DELETE",
      `/v1/domains/claims/${encodeURIComponent(claimId)}?publication_id=${encodeURIComponent(publicationId)}`,
      undefined,
      options
    );
    return makeToolResult(`Claim ${result.id} withdrawn.`, result);
  }

  // --- Tracking sub-domains -------------------------------------------------
  if (toolName === "domain.tracking_create") {
    const publicationId = await readPublicationId(args, options);
    const domainId = readRequiredString(args, "domainId");
    const subdomain = readRequiredString(args, "subdomain");
    const result = await callRestApi<{ id: string; full_name: string; status: string }>(
      "POST",
      `/v1/domains/${encodeURIComponent(domainId)}/tracking-domains?publication_id=${encodeURIComponent(publicationId)}`,
      { subdomain },
      options
    );
    return makeToolResult(
      `Tracking domain ${result.full_name} created (${result.status}). Add the CNAME record, then call domain.tracking_verify.`,
      result
    );
  }

  if (toolName === "domain.tracking_list") {
    const publicationId = await readPublicationId(args, options);
    const domainId = readRequiredString(args, "domainId");
    const result = await callRestApi<{ data: unknown[] }>(
      "GET",
      `/v1/domains/${encodeURIComponent(domainId)}/tracking-domains?publication_id=${encodeURIComponent(publicationId)}`,
      undefined,
      options
    );
    return makeToolResult(`${result.data.length} tracking domain(s).`, result);
  }

  if (toolName === "domain.tracking_verify") {
    const publicationId = await readPublicationId(args, options);
    const domainId = readRequiredString(args, "domainId");
    const trackingDomainId = readRequiredString(args, "trackingDomainId");
    const result = await callRestApi<{ id: string; full_name: string; status: string }>(
      "POST",
      `/v1/domains/${encodeURIComponent(domainId)}/tracking-domains/${encodeURIComponent(trackingDomainId)}/verify?publication_id=${encodeURIComponent(publicationId)}`,
      undefined,
      options
    );
    return makeToolResult(`Tracking domain ${result.full_name} is now ${result.status}.`, result);
  }

  if (toolName === "domain.tracking_delete") {
    const publicationId = await readPublicationId(args, options);
    const domainId = readRequiredString(args, "domainId");
    const trackingDomainId = readRequiredString(args, "trackingDomainId");
    const result = await callRestApi<{ id: string }>(
      "DELETE",
      `/v1/domains/${encodeURIComponent(domainId)}/tracking-domains/${encodeURIComponent(trackingDomainId)}?publication_id=${encodeURIComponent(publicationId)}`,
      undefined,
      options
    );
    return makeToolResult(`Tracking domain ${result.id} deleted.`, result);
  }

  // --- Outbound webhooks ----------------------------------------------------
  if (toolName === "webhook.create") {
    const publicationId = await readPublicationId(args, options);
    const endpoint = readRequiredString(args, "endpoint");
    const events = args.events;
    if (!Array.isArray(events) || events.length === 0 || !events.every((e) => typeof e === "string")) {
      throw new Error("'events' must be a non-empty array of event-type strings.");
    }
    const result = await callRestApi<{ id: string; endpoint: string; signing_secret: string }>(
      "POST",
      "/v1/webhooks/endpoints",
      { publication_id: publicationId, endpoint, events },
      options
    );
    return makeToolResult(
      `Webhook ${result.id} created for ${result.endpoint}. Store the signing_secret now — it won't be shown again.`,
      result
    );
  }

  if (toolName === "webhook.list") {
    const publicationId = await readPublicationId(args, options);
    const limit = readOptionalNumber(args, "limit");
    const params = new URLSearchParams({ publication_id: publicationId });
    if (limit !== undefined) params.set("limit", String(limit));
    const result = await callRestApi<{ data: unknown[] }>(
      "GET",
      `/v1/webhooks/endpoints?${params.toString()}`,
      undefined,
      options
    );
    return makeToolResult(`${result.data.length} webhook(s).`, result);
  }

  if (toolName === "webhook.get") {
    const publicationId = await readPublicationId(args, options);
    const webhookId = readRequiredString(args, "webhookId");
    const result = await callRestApi<{ id: string; endpoint: string; status: string }>(
      "GET",
      `/v1/webhooks/endpoints/${encodeURIComponent(webhookId)}?publication_id=${encodeURIComponent(publicationId)}`,
      undefined,
      options
    );
    return makeToolResult(`Webhook ${result.id} (${result.status}) -> ${result.endpoint}.`, result);
  }

  if (toolName === "webhook.update") {
    const publicationId = await readPublicationId(args, options);
    const webhookId = readRequiredString(args, "webhookId");
    const endpoint = asOptionalString(args.endpoint);
    const status = asOptionalString(args.status);
    const events = args.events;
    if (
      events !== undefined &&
      (!Array.isArray(events) || !events.every((e) => typeof e === "string"))
    ) {
      throw new Error("'events' must be an array of event-type strings.");
    }
    const result = await callRestApi<{ id: string; status: string }>(
      "PATCH",
      `/v1/webhooks/endpoints/${encodeURIComponent(webhookId)}?publication_id=${encodeURIComponent(publicationId)}`,
      {
        ...(endpoint ? { endpoint } : {}),
        ...(events !== undefined ? { events } : {}),
        ...(status ? { status } : {})
      },
      options
    );
    return makeToolResult(`Webhook ${result.id} updated (${result.status}).`, result);
  }

  if (toolName === "webhook.delete") {
    const publicationId = await readPublicationId(args, options);
    const webhookId = readRequiredString(args, "webhookId");
    const result = await callRestApi<{ id: string }>(
      "DELETE",
      `/v1/webhooks/endpoints/${encodeURIComponent(webhookId)}?publication_id=${encodeURIComponent(publicationId)}`,
      undefined,
      options
    );
    return makeToolResult(`Webhook ${result.id} deleted.`, result);
  }

  // --- Audience segments ----------------------------------------------------
  if (toolName === "segment.create") {
    const publicationId = await readPublicationId(args, options);
    const name = readRequiredString(args, "name");
    const description = asOptionalString(args.description);
    const statusFilter = asOptionalString(args.status_filter);
    const queryFilter = asOptionalString(args.query_filter);
    const inactiveDays = readOptionalNumber(args, "inactive_days");
    const result = await callRestApi<{ id: string; name: string }>(
      "POST",
      "/v1/segments",
      {
        publication_id: publicationId,
        name,
        ...(description !== undefined ? { description } : {}),
        ...(statusFilter ? { status_filter: statusFilter } : {}),
        ...(queryFilter !== undefined ? { query_filter: queryFilter } : {}),
        ...(inactiveDays !== undefined ? { inactive_days: inactiveDays } : {})
      },
      options
    );
    return makeToolResult(`Segment ${result.name} created (${result.id}).`, result);
  }

  if (toolName === "segment.list") {
    const publicationId = await readPublicationId(args, options);
    const limit = readOptionalNumber(args, "limit");
    const params = new URLSearchParams({ publication_id: publicationId });
    if (limit !== undefined) params.set("limit", String(limit));
    const result = await callRestApi<{ data: unknown[] }>(
      "GET",
      `/v1/segments?${params.toString()}`,
      undefined,
      options
    );
    return makeToolResult(`${result.data.length} segment(s).`, result);
  }

  if (toolName === "segment.get") {
    const publicationId = await readPublicationId(args, options);
    const segmentId = readRequiredString(args, "segmentId");
    const result = await callRestApi<{ id: string; name: string }>(
      "GET",
      `/v1/segments/${encodeURIComponent(segmentId)}?publication_id=${encodeURIComponent(publicationId)}`,
      undefined,
      options
    );
    return makeToolResult(`Segment ${result.name} (${result.id}).`, result);
  }

  if (toolName === "segment.update") {
    const publicationId = await readPublicationId(args, options);
    const segmentId = readRequiredString(args, "segmentId");
    const name = asOptionalString(args.name);
    const description = asOptionalString(args.description);
    const inactiveDays = readNullableNumber(args, "inactive_days");
    const result = await callRestApi<{ id: string; name: string }>(
      "PATCH",
      `/v1/segments/${encodeURIComponent(segmentId)}?publication_id=${encodeURIComponent(publicationId)}`,
      {
        ...(name ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        // status_filter / query_filter / inactive_days are nullable: forward an
        // explicit null to CLEAR the filter, a value to set it, and omit the key
        // entirely (absent from args) to leave it unchanged.
        ...("status_filter" in args ? { status_filter: args.status_filter } : {}),
        ...("query_filter" in args ? { query_filter: args.query_filter } : {}),
        ...(inactiveDays !== undefined ? { inactive_days: inactiveDays } : {})
      },
      options
    );
    return makeToolResult(`Segment ${result.id} updated.`, result);
  }

  if (toolName === "segment.delete") {
    const publicationId = await readPublicationId(args, options);
    const segmentId = readRequiredString(args, "segmentId");
    const result = await callRestApi<{ id: string }>(
      "DELETE",
      `/v1/segments/${encodeURIComponent(segmentId)}?publication_id=${encodeURIComponent(publicationId)}`,
      undefined,
      options
    ).catch((error: unknown) => {
      // Refused because posts still target it. Name them and the tool that
      // frees the segment, so the agent does not retry the delete blind.
      const data = (error as { data?: Record<string, unknown> } | null)?.data;
      if (data?.code !== "segment_in_use" || !Array.isArray(data.posts)) throw error;
      const held = (data.posts as Array<Record<string, unknown>>)
        .map((post) => `${String(post.id)} (${String(post.status)}, "${String(post.title ?? "")}")`)
        .join(", ");
      const failure = new Error(
        `${(error as Error).message} Posts holding it: ${held}. Point each draft at another segment with issue.update_draft (segmentId), or pass null there to send it to all active contacts; unschedule a scheduled post first. Then delete again.`
      ) as Error & { data?: unknown };
      failure.data = data;
      throw failure;
    });
    return makeToolResult(`Segment ${result.id} deleted.`, result);
  }

  // --- Contact custom properties (team-scoped) ------------------------------
  if (toolName === "contact_property.create") {
    const key = readRequiredString(args, "key");
    const type = asOptionalString(args.type);
    if (type !== "string" && type !== "number") {
      throw new Error("'type' must be 'string' or 'number'.");
    }
    const description = asOptionalString(args.description);
    const fallback = args.fallback_value;
    const result = await callRestApi<{ id: string; key: string }>(
      "POST",
      "/v1/contact-properties",
      {
        key,
        type,
        ...(fallback !== undefined ? { fallback_value: fallback } : {}),
        ...(description !== undefined ? { description } : {})
      },
      options
    );
    return makeToolResult(`Contact property ${result.key} created (${result.id}).`, result);
  }

  if (toolName === "contact_property.list") {
    const limit = readOptionalNumber(args, "limit");
    const qs = limit !== undefined ? `?limit=${limit}` : "";
    const result = await callRestApi<{ data: unknown[] }>(
      "GET",
      `/v1/contact-properties${qs}`,
      undefined,
      options
    );
    return makeToolResult(`${result.data.length} contact propert(ies).`, result);
  }

  if (toolName === "contact_property.update") {
    const propertyId = readRequiredString(args, "propertyId");
    const description = asOptionalString(args.description);
    const fallback = args.fallback_value;
    const result = await callRestApi<{ id: string }>(
      "PATCH",
      `/v1/contact-properties/${encodeURIComponent(propertyId)}`,
      {
        ...(fallback !== undefined ? { fallback_value: fallback } : {}),
        ...(description !== undefined ? { description } : {})
      },
      options
    );
    return makeToolResult(`Contact property ${result.id} updated.`, result);
  }

  if (toolName === "contact_property.delete") {
    const propertyId = readRequiredString(args, "propertyId");
    const result = await callRestApi<{ id: string }>(
      "DELETE",
      `/v1/contact-properties/${encodeURIComponent(propertyId)}`,
      undefined,
      options
    );
    return makeToolResult(`Contact property ${result.id} deleted.`, result);
  }

  // --- Contact completeness -------------------------------------------------
  if (toolName === "contact.get") {
    const publicationId = await readPublicationId(args, options);
    const idOrEmail = readRequiredString(args, "idOrEmail");
    const result = await callRestApi<{ id: string; email: string; status: string }>(
      "GET",
      `/v1/contacts/${encodeURIComponent(idOrEmail)}?publication_id=${encodeURIComponent(publicationId)}`,
      undefined,
      options
    );
    return makeToolResult(`Contact ${result.email} (${result.status}).`, result);
  }

  if (toolName === "contact.delete") {
    const publicationId = await readPublicationId(args, options);
    const idOrEmail = readRequiredString(args, "idOrEmail");
    const result = await callRestApi<{ id: string }>(
      "DELETE",
      `/v1/contacts/${encodeURIComponent(idOrEmail)}?publication_id=${encodeURIComponent(publicationId)}`,
      undefined,
      options
    );
    return makeToolResult(`Contact ${result.id} deleted.`, result);
  }

  if (toolName === "contact.get_properties") {
    const publicationId = await readPublicationId(args, options);
    const contactId = readRequiredString(args, "contactId");
    const result = await callTrpc<unknown>(
      "contact.getPropertyValues",
      { publicationId, contactId },
      options,
      "query"
    );
    return makeToolResult(`Property values for contact ${contactId}.`, result);
  }

  if (toolName === "contact.set_properties") {
    const publicationId = await readPublicationId(args, options);
    const contactId = readRequiredString(args, "contactId");
    const values = args.values;
    if (!Array.isArray(values) || values.length === 0) {
      throw new Error("'values' must be a non-empty array of { propertyId, value }.");
    }
    const result = await callTrpc<{ updated: boolean }>(
      "contact.setPropertyValues",
      { publicationId, contactId, values },
      options,
      "mutation"
    );
    return makeToolResult(
      `Set ${values.length} property value(s) for contact ${contactId}.`,
      result
    );
  }

  // --- Topic definitions ----------------------------------------------------
  if (toolName === "topic.create") {
    const publicationId = await readPublicationId(args, options);
    const name = readRequiredString(args, "name");
    const defaultSubscription = asOptionalString(args.default_subscription);
    if (defaultSubscription !== "opt_in" && defaultSubscription !== "opt_out") {
      throw new Error("'default_subscription' must be 'opt_in' or 'opt_out'.");
    }
    const description = asOptionalString(args.description);
    const visibility = asOptionalString(args.visibility);
    const result = await callRestApi<{ id: string; name: string }>(
      "POST",
      "/v1/topics",
      {
        publication_id: publicationId,
        name,
        default_subscription: defaultSubscription,
        ...(description !== undefined ? { description } : {}),
        ...(visibility ? { visibility } : {})
      },
      options
    );
    return makeToolResult(`Topic ${result.name} created (${result.id}).`, result);
  }

  if (toolName === "topic.list") {
    const publicationId = await readPublicationId(args, options);
    const limit = readOptionalNumber(args, "limit");
    const params = new URLSearchParams({ publication_id: publicationId });
    if (limit !== undefined) params.set("limit", String(limit));
    const result = await callRestApi<{ data: unknown[] }>(
      "GET",
      `/v1/topics?${params.toString()}`,
      undefined,
      options
    );
    return makeToolResult(`${result.data.length} topic(s).`, result);
  }

  if (toolName === "topic.update") {
    const publicationId = await readPublicationId(args, options);
    const topicId = readRequiredString(args, "topicId");
    const name = asOptionalString(args.name);
    const description = asOptionalString(args.description);
    const defaultSubscription = asOptionalString(args.default_subscription);
    const visibility = asOptionalString(args.visibility);
    const result = await callRestApi<{ id: string; name: string }>(
      "PATCH",
      `/v1/topics/${encodeURIComponent(topicId)}?publication_id=${encodeURIComponent(publicationId)}`,
      {
        ...(name ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(defaultSubscription ? { default_subscription: defaultSubscription } : {}),
        ...(visibility ? { visibility } : {})
      },
      options
    );
    return makeToolResult(`Topic ${result.id} updated.`, result);
  }

  if (toolName === "topic.delete") {
    const publicationId = await readPublicationId(args, options);
    const topicId = readRequiredString(args, "topicId");
    const result = await callRestApi<{ id: string }>(
      "DELETE",
      `/v1/topics/${encodeURIComponent(topicId)}?publication_id=${encodeURIComponent(publicationId)}`,
      undefined,
      options
    );
    return makeToolResult(`Topic ${result.id} deleted.`, result);
  }

  // --- API keys (requires settings:write; cannot exceed caller's scopes) ----
  if (toolName === "api_key.create") {
    const name = readRequiredString(args, "name");
    const permission = asOptionalString(args.permission);
    const domainId = asOptionalString(args.domain_id);
    const mode = asOptionalString(args.mode);
    const result = await callRestApi<{ id: string; token: string; mode: string }>(
      "POST",
      "/v1/api-keys",
      {
        name,
        ...(permission ? { permission } : {}),
        ...(domainId ? { domain_id: domainId } : {}),
        ...(mode ? { mode } : {})
      },
      options
    );
    return makeToolResult(
      `API key ${result.id} created in ${result.mode} mode. Store this token now — it won't be shown again: ${result.token}`,
      result
    );
  }

  if (toolName === "api_key.list") {
    const result = await callRestApi<{ data: unknown[] }>(
      "GET",
      "/v1/api-keys",
      undefined,
      options
    );
    return makeToolResult(`${result.data.length} API key(s).`, result);
  }

  if (toolName === "api_key.revoke") {
    const keyId = readRequiredString(args, "keyId");
    await callRestApi<unknown>(
      "DELETE",
      `/v1/api-keys/${encodeURIComponent(keyId)}`,
      undefined,
      options
    );
    return makeToolResult(`API key ${keyId} revoked.`, { id: keyId, revoked: true });
  }

  // --- Automations & events (snake_case arguments on purpose) ---------------
  if (toolName === "automation.create") {
    const publicationId = await readPublicationId(args, options, "publication_id");
    const name = readRequiredString(args, "name");
    const steps = readRequiredJsonObjectArray(args, "steps");
    const connections = readOptionalJsonObjectArray(args, "connections");
    const description = asOptionalString(args.description);
    const reentryPolicy = asOptionalString(args.reentry_policy);
    const reentryWindowSeconds = readNullableNumber(args, "reentry_window_seconds");
    const onStepFailure = asOptionalString(args.on_step_failure);
    const validateOnly = readOptionalBoolean(args, "validate_only");

    const body: Record<string, unknown> = {
      publication_id: publicationId,
      name,
      steps,
      // Forward `connections` ONLY when the caller supplied it. Sending `[]` for
      // an omitted argument would suppress the server's array-order inference.
      ...(connections !== undefined ? { connections } : {}),
      ...(description ? { description } : {}),
      ...(reentryPolicy ? { reentry_policy: reentryPolicy } : {}),
      // Explicit null is forwarded, absent is omitted — the two mean different
      // things to the server and only the caller can tell them apart.
      ...(reentryWindowSeconds !== undefined
        ? { reentry_window_seconds: reentryWindowSeconds }
        : {}),
      ...(onStepFailure ? { on_step_failure: onStepFailure } : {}),
      ...(validateOnly !== undefined ? { validate_only: validateOnly } : {})
    };

    const result = await callAutomationApi<AutomationResponse>(
      "POST",
      "/v1/automations",
      body,
      options
    );

    if (result.object === "automation_validation") {
      return makeToolResult(
        `Dry run — nothing written. Graph is ${describeAutomationIssues(result)}`,
        result
      );
    }

    return makeToolResult(
      `Automation created: ${result.id} (${result.status}). Graph is ${describeAutomationIssues(result)}`,
      { automation: result }
    );
  }

  if (toolName === "automation.list") {
    const publicationId = await readPublicationId(args, options, "publication_id");
    const status = asOptionalString(args.status);
    const limit = readOptionalNumber(args, "limit");
    const after = asOptionalString(args.after);

    const result = await callAutomationApi<{
      data: Array<Record<string, unknown>>;
      has_more: boolean;
    }>(
      "GET",
      withQuery("/v1/automations", {
        publication_id: publicationId,
        status,
        limit,
        after
      }),
      undefined,
      options
    );

    const lines = result.data.map(
      (automation) => `${automation.id}: ${automation.name} (${automation.status})`
    );
    return makeToolResult(
      result.data.length > 0
        ? `${result.data.length} automation(s):\n${lines.join("\n")}`
        : "No automations found",
      result
    );
  }

  if (toolName === "automation.get") {
    const publicationId = await readPublicationId(args, options, "publication_id");
    const automationId = readRequiredString(args, "automation_id");

    const automation = await callAutomationApi<AutomationResponse>(
      "GET",
      withQuery(`/v1/automations/${encodeURIComponent(automationId)}`, {
        publication_id: publicationId
      }),
      undefined,
      options
    );

    const steps = Array.isArray(automation.steps) ? automation.steps.length : 0;
    return makeToolResult(
      `Automation ${automation.name} (${automation.status}, v${automation.version}, ${steps} step(s)). Graph is ${describeAutomationIssues(automation)}`,
      { automation }
    );
  }

  if (toolName === "automation.update") {
    const publicationId = await readPublicationId(args, options, "publication_id");
    const automationId = readRequiredString(args, "automation_id");
    const name = asOptionalString(args.name);
    const steps = readOptionalJsonObjectArray(args, "steps");
    const connections = readOptionalJsonObjectArray(args, "connections");
    const description = asOptionalString(args.description);
    const reentryPolicy = asOptionalString(args.reentry_policy);
    const reentryWindowSeconds = readNullableNumber(args, "reentry_window_seconds");
    const onStepFailure = asOptionalString(args.on_step_failure);
    const validateOnly = readOptionalBoolean(args, "validate_only");
    const baseVersion = readOptionalNumber(args, "base_version");

    const body: Record<string, unknown> = {
      ...(name ? { name } : {}),
      ...(steps !== undefined ? { steps } : {}),
      ...(baseVersion !== undefined ? { base_version: baseVersion } : {}),
      // Same rule as create: an omitted `connections` must stay omitted.
      ...(connections !== undefined ? { connections } : {}),
      ...(description ? { description } : {}),
      ...(reentryPolicy ? { reentry_policy: reentryPolicy } : {}),
      // A PATCH merges with stored values, so null is the only way to shed a
      // stored window when the policy moves off once_per_window.
      ...(reentryWindowSeconds !== undefined
        ? { reentry_window_seconds: reentryWindowSeconds }
        : {}),
      ...(onStepFailure ? { on_step_failure: onStepFailure } : {}),
      ...(validateOnly !== undefined ? { validate_only: validateOnly } : {})
    };

    const result = await callAutomationApi<AutomationResponse>(
      "PATCH",
      withQuery(`/v1/automations/${encodeURIComponent(automationId)}`, {
        publication_id: publicationId
      }),
      body,
      options
    ).catch((error: unknown) =>
      rethrowChangedElsewhere(error, "automation.get", "base_version", "current_version")
    );

    if (result.object === "automation_validation") {
      return makeToolResult(
        `Dry run — nothing written. Graph is ${describeAutomationIssues(result)}`,
        result
      );
    }

    return makeToolResult(
      `Automation updated: ${result.id} (${result.status}, v${result.version}). Graph is ${describeAutomationIssues(result)}`,
      { automation: result }
    );
  }

  if (toolName === "automation.validate") {
    const publicationId = await readPublicationId(args, options, "publication_id");
    const steps = readRequiredJsonObjectArray(args, "steps");
    const connections = readOptionalJsonObjectArray(args, "connections");

    const result = await callAutomationApi<AutomationResponse>(
      "POST",
      "/v1/automations/validate",
      {
        publication_id: publicationId,
        steps,
        ...(connections !== undefined ? { connections } : {})
      },
      options
    );

    return makeToolResult(`Graph is ${describeAutomationIssues(result)}`, result);
  }

  if (toolName === "automation.enable") {
    const publicationId = await readPublicationId(args, options, "publication_id");
    const automationId = readRequiredString(args, "automation_id");

    const automation = await callAutomationApi<AutomationResponse>(
      "POST",
      withQuery(`/v1/automations/${encodeURIComponent(automationId)}/activate`, {
        publication_id: publicationId
      }),
      undefined,
      options
    );

    return makeToolResult(
      `Automation ${automation.id} is now ${automation.status} — it will enroll contacts on ${(automation.trigger as { trigger_type?: string } | undefined)?.trigger_type}.`,
      { automation }
    );
  }

  if (toolName === "automation.disable") {
    const publicationId = await readPublicationId(args, options, "publication_id");
    const automationId = readRequiredString(args, "automation_id");
    const cancelRuns = readOptionalBoolean(args, "cancel_runs");

    const automation = await callAutomationApi<AutomationResponse>(
      "POST",
      withQuery(`/v1/automations/${encodeURIComponent(automationId)}/pause`, {
        publication_id: publicationId
      }),
      cancelRuns !== undefined ? { cancel_runs: cancelRuns } : {},
      options
    );

    return makeToolResult(
      `Automation ${automation.id} is now ${automation.status}. ${automation.canceled_runs ?? 0} run(s) canceled, ${automation.active_run_count ?? 0} still in flight.`,
      { automation }
    );
  }

  if (toolName === "automation.archive") {
    const publicationId = await readPublicationId(args, options, "publication_id");
    const automationId = readRequiredString(args, "automation_id");
    const cancelRuns = readOptionalBoolean(args, "cancel_runs");

    const automation = await callAutomationApi<AutomationResponse>(
      "POST",
      withQuery(`/v1/automations/${encodeURIComponent(automationId)}/archive`, {
        publication_id: publicationId
      }),
      cancelRuns !== undefined ? { cancel_runs: cancelRuns } : {},
      options
    );

    return makeToolResult(
      `Automation ${automation.id} archived. ${automation.canceled_runs ?? 0} run(s) canceled.`,
      { automation }
    );
  }

  if (toolName === "automation.delete") {
    const publicationId = await readPublicationId(args, options, "publication_id");
    const automationId = readRequiredString(args, "automation_id");

    const result = await callAutomationApi<{ id: string; deleted: boolean }>(
      "DELETE",
      withQuery(`/v1/automations/${encodeURIComponent(automationId)}`, {
        publication_id: publicationId
      }),
      undefined,
      options
    );

    return makeToolResult(`Automation deleted: ${result.id}`, result);
  }

  if (toolName === "automation.versions") {
    const publicationId = await readPublicationId(args, options, "publication_id");
    const automationId = readRequiredString(args, "automation_id");
    const limit = readOptionalNumber(args, "limit");
    const after = asOptionalString(args.after);

    const result = await callAutomationApi<{
      data: Array<Record<string, unknown>>;
      has_more: boolean;
    }>(
      "GET",
      withQuery(`/v1/automations/${encodeURIComponent(automationId)}/versions`, {
        publication_id: publicationId,
        limit,
        after
      }),
      undefined,
      options
    );

    const lines = result.data.map(
      (version) =>
        `v${version.version}${version.is_live ? " (live)" : ""}: ${version.graph_hash} created ${version.created_at}`
    );
    return makeToolResult(
      result.data.length > 0
        ? `${result.data.length} version(s):\n${lines.join("\n")}`
        : "No versions found",
      result
    );
  }

  if (toolName === "automation.version") {
    const publicationId = await readPublicationId(args, options, "publication_id");
    const automationId = readRequiredString(args, "automation_id");
    const version = readOptionalNumber(args, "version");
    if (version === undefined) {
      throw new Error("Missing required number argument: version");
    }

    const automationVersion = await callAutomationApi<Record<string, unknown>>(
      "GET",
      withQuery(
        `/v1/automations/${encodeURIComponent(automationId)}/versions/${encodeURIComponent(String(version))}`,
        { publication_id: publicationId }
      ),
      undefined,
      options
    );

    const steps = Array.isArray(automationVersion.steps) ? automationVersion.steps.length : 0;
    return makeToolResult(
      `Automation ${automationId} v${automationVersion.version}${automationVersion.is_live ? " (live)" : ""}: ${steps} step(s), graph_hash ${automationVersion.graph_hash}. Runs pinned to this version execute THIS graph, not the live one.`,
      { automation_version: automationVersion }
    );
  }

  if (toolName === "automation.metrics") {
    const publicationId = await readPublicationId(args, options, "publication_id");
    const automationId = readRequiredString(args, "automation_id");
    const version = readOptionalNumber(args, "version");
    const since = asOptionalString(args.since);
    const until = asOptionalString(args.until);

    const metrics = await callAutomationApi<{
      // `version` is the SCOPE and is null for an all-versions aggregate;
      // `graph_version` is only where the labels came from. Summarising from
      // the wrong one captions combined traffic with a single version number.
      version?: number | null;
      graph_version?: number | null;
      runs?: { active?: number; waiting?: number };
      steps?: Array<Record<string, unknown>>;
    }>(
      "GET",
      withQuery(`/v1/automations/${encodeURIComponent(automationId)}/metrics`, {
        publication_id: publicationId,
        version,
        since,
        until
      }),
      undefined,
      options
    );

    // Scope from `version` (null => every version), labels from `graph_version`.
    const scope =
      typeof metrics.version === "number"
        ? `v${metrics.version}`
        : `all versions${typeof metrics.graph_version === "number" ? `, labels from v${metrics.graph_version}` : ""}`;
    return makeToolResult(
      `Metrics for ${automationId} (${scope}, test runs excluded): ${metrics.runs?.active ?? 0} active, ${metrics.runs?.waiting ?? 0} waiting, ${metrics.steps?.length ?? 0} step(s) reported.`,
      metrics
    );
  }

  if (toolName === "automation_run.list") {
    const publicationId = await readPublicationId(args, options, "publication_id");
    const automationId = readRequiredString(args, "automation_id");
    const status = asOptionalString(args.status);
    const contactId = asOptionalString(args.contact_id);
    const isTest = readOptionalBoolean(args, "is_test");
    const limit = readOptionalNumber(args, "limit");
    const after = asOptionalString(args.after);

    const result = await callAutomationApi<{
      data: Array<Record<string, unknown>>;
      has_more: boolean;
    }>(
      "GET",
      withQuery(`/v1/automations/${encodeURIComponent(automationId)}/runs`, {
        publication_id: publicationId,
        status,
        contact_id: contactId,
        is_test: isTest,
        limit,
        after
      }),
      undefined,
      options
    );

    const lines = result.data.map((run) => {
      const contact = run.contact as { email?: string } | null;
      return `${run.id}: ${run.status} at ${run.current_step_key ?? "-"} (${contact?.email ?? "no contact"})`;
    });
    return makeToolResult(
      result.data.length > 0
        ? `${result.data.length} run(s):\n${lines.join("\n")}`
        : "No runs found",
      result
    );
  }

  if (toolName === "automation_run.get") {
    const publicationId = await readPublicationId(args, options, "publication_id");
    const automationId = readRequiredString(args, "automation_id");
    const runId = readRequiredString(args, "run_id");

    const run = await callAutomationApi<Record<string, unknown>>(
      "GET",
      withQuery(
        `/v1/automations/${encodeURIComponent(automationId)}/runs/${encodeURIComponent(runId)}`,
        { publication_id: publicationId }
      ),
      undefined,
      options
    );

    const waiting = run.waiting as { resume_at?: string | null; waiting_event_name?: string | null } | undefined;
    const waitingSuffix = waiting?.resume_at
      ? ` Resumes at ${waiting.resume_at}.`
      : waiting?.waiting_event_name
        ? ` Waiting for event ${waiting.waiting_event_name}.`
        : "";
    return makeToolResult(
      `Run ${run.id}: ${run.status} at ${run.current_step_key ?? "-"} on pinned v${run.version}.${waitingSuffix}`,
      { automation_run: run }
    );
  }

  if (toolName === "automation_run.cancel") {
    const publicationId = await readPublicationId(args, options, "publication_id");
    const automationId = readRequiredString(args, "automation_id");
    const runId = readRequiredString(args, "run_id");

    const run = await callAutomationApi<Record<string, unknown>>(
      "POST",
      withQuery(
        `/v1/automations/${encodeURIComponent(automationId)}/runs/${encodeURIComponent(runId)}/cancel`,
        { publication_id: publicationId }
      ),
      undefined,
      options
    );

    return makeToolResult(`Run ${run.id} is now ${run.status}.`, { automation_run: run });
  }

  if (toolName === "event.send") {
    const publicationId = await readPublicationId(args, options, "publication_id");
    const eventName = readRequiredString(args, "event_name");
    const contactId = asOptionalString(args.contact_id);
    const email = asOptionalString(args.email);
    const createContact = readOptionalBoolean(args, "create_contact");
    const properties = readOptionalJsonObject(args, "properties");
    const occurredAt = asOptionalString(args.occurred_at);
    const idempotencyKey = asOptionalString(args.idempotency_key);

    // XOR on contact_id / email, caught here so an agent gets a clear message
    // instead of a contact_reference_conflict round-trip.
    if ((contactId === undefined) === (email === undefined)) {
      throw new Error("Provide exactly one of 'contact_id' or 'email'.");
    }

    const result = await callAutomationApi<{
      id: string;
      name: string;
      enrolled_automations?: number;
      resumed_runs?: number;
      replayed?: boolean;
    }>(
      "POST",
      "/v1/events",
      {
        publication_id: publicationId,
        name: eventName,
        ...(contactId ? { contact_id: contactId } : {}),
        ...(email ? { email } : {}),
        ...(createContact !== undefined ? { create_contact: createContact } : {}),
        ...(properties ? { properties } : {}),
        ...(occurredAt ? { occurred_at: occurredAt } : {}),
        ...(idempotencyKey ? { idempotency_key: idempotencyKey } : {})
      },
      options
    );

    return makeToolResult(
      result.replayed
        ? `Event ${eventName} replayed — idempotency_key already used, returning the original event ${result.id}. Nothing was enrolled or resumed.`
        : `Event ${eventName} ingested as ${result.id}: ${result.enrolled_automations ?? 0} automation(s) enrolled, ${result.resumed_runs ?? 0} run(s) resumed. A resumed_runs of 0 does not prove nothing matched — read the run.`,
      result
    );
  }

  if (toolName === "event_definition.list") {
    const publicationId = await readPublicationId(args, options, "publication_id");
    const limit = readOptionalNumber(args, "limit");
    const after = asOptionalString(args.after);

    const result = await callAutomationApi<{
      data: Array<Record<string, unknown>>;
      has_more: boolean;
    }>(
      "GET",
      withQuery("/v1/event-definitions", {
        publication_id: publicationId,
        limit,
        after
      }),
      undefined,
      options
    );

    const lines = result.data.map(
      (definition) => `${definition.id}: ${definition.name} (${definition.source})`
    );
    return makeToolResult(
      result.data.length > 0
        ? `${result.data.length} event definition(s):\n${lines.join("\n")}`
        : "No event definitions found",
      result
    );
  }

  if (toolName === "event_definition.get") {
    const publicationId = await readPublicationId(args, options, "publication_id");
    const definitionId = readRequiredString(args, "definition_id");

    const definition = await callAutomationApi<Record<string, unknown>>(
      "GET",
      withQuery(`/v1/event-definitions/${encodeURIComponent(definitionId)}`, {
        publication_id: publicationId
      }),
      undefined,
      options
    );

    const inferred = definition.inferred_properties;
    const inferredCount = Array.isArray(inferred)
      ? inferred.length
      : inferred && typeof inferred === "object"
        ? Object.keys(inferred).length
        : 0;
    return makeToolResult(
      `Event definition ${definition.name} (${definition.source}); ${inferredCount} inferred propert(ies) from ${definition.inference_sample_size ?? 0} sampled event(s) — check each one's coverage before conditioning on it.`,
      { event_definition: definition }
    );
  }

  if (toolName === "event_definition.create") {
    const publicationId = await readPublicationId(args, options, "publication_id");
    const eventName = readRequiredString(args, "event_name");
    const description = asOptionalString(args.description);
    // Nothing is stored yet, so null and absent both mean "no schema" here.
    const schemaJson = readNullableJsonObject(args, "schema_json");

    const definition = await callAutomationApi<Record<string, unknown>>(
      "POST",
      "/v1/event-definitions",
      {
        publication_id: publicationId,
        name: eventName,
        ...(description ? { description } : {}),
        ...(schemaJson ? { schema_json: schemaJson } : {})
      },
      options
    );

    return makeToolResult(
      `Event definition created: ${definition.id} (${definition.name})`,
      { event_definition: definition }
    );
  }

  if (toolName === "event_definition.update") {
    const publicationId = await readPublicationId(args, options, "publication_id");
    const definitionId = readRequiredString(args, "definition_id");
    const description = asOptionalString(args.description);
    const schemaJson = readNullableJsonObject(args, "schema_json");

    const definition = await callAutomationApi<Record<string, unknown>>(
      "PATCH",
      withQuery(`/v1/event-definitions/${encodeURIComponent(definitionId)}`, {
        publication_id: publicationId
      }),
      {
        ...(description ? { description } : {}),
        // The server keys off hasOwnProperty here: an absent schema_json leaves
        // the stored schema alone, an explicit null clears it. Sending null for
        // an omitted argument would wipe schemas nobody asked to change.
        ...(schemaJson !== undefined ? { schema_json: schemaJson } : {})
      },
      options
    );

    return makeToolResult(
      `Event definition updated: ${definition.id} (${definition.name})`,
      { event_definition: definition }
    );
  }

  if (toolName === "event_definition.delete") {
    const publicationId = await readPublicationId(args, options, "publication_id");
    const definitionId = readRequiredString(args, "definition_id");

    const result = await callAutomationApi<{ id: string; deleted: boolean }>(
      "DELETE",
      withQuery(`/v1/event-definitions/${encodeURIComponent(definitionId)}`, {
        publication_id: publicationId
      }),
      undefined,
      options
    );

    return makeToolResult(
      `Event definition deleted: ${result.id}. Past events are kept and ingest continues — the next event of this name recreates the definition as source "auto", without the description or schema.`,
      result
    );
  }

  // --- Website Builder ------------------------------------------------------
  // Site tools ride the same bearer token and publication resolution as every
  // other tRPC-backed tool. The write tools additionally need the `site:write`
  // scope and an editor-or-above publication role; the server enforces both, so
  // there is nothing to check here — a token that lacks either gets
  // "Insufficient role" back from the tRPC call.

  if (toolName === "site.get") {
    const publicationId = await readPublicationId(args, options);

    const site = await callTrpc<SiteSettingsRecord>(
      "publication.siteSettings",
      { publicationId },
      options,
      "query"
    );

    // Draft over live: the design an agent edits is the one the operator is
    // looking at in the builder, not the one visitors currently see.
    const design = site.settings?.draftSiteDesign ?? site.settings?.siteDesign ?? null;
    return makeToolResult(
      `Loaded site for ${publicationId} (draftVersion ${site.draftVersion}${
        site.hasUnpublishedChanges ? ", unpublished changes pending" : ""
      }${site.designBrief ? ", design brief set — follow it" : ", no design brief"})`,
      {
        publicationId,
        settings: site.settings,
        design,
        designBrief: site.designBrief,
        draftVersion: site.draftVersion,
        hasUnpublishedChanges: site.hasUnpublishedChanges ?? false
      }
    );
  }

  if (toolName === "site.pages_list") {
    const publicationId = await readPublicationId(args, options);

    const result = await callTrpc<{ pages: SitePageRecord[] }>(
      "publication.sitePages",
      { publicationId },
      options,
      "query"
    );

    return makeToolResult(
      `Loaded ${result.pages.length} site pages for ${publicationId}`,
      {
        publicationId,
        // Documents are omitted here — they are large, and site.page_get is the
        // way to read one.
        pages: result.pages.map((page) => ({
          id: page.id,
          kind: page.kind,
          slug: page.slug,
          title: page.title,
          status: page.status,
          hasDraft: page.draftContentJson != null
        }))
      }
    );
  }

  if (toolName === "site.page_get") {
    const publicationId = await readPublicationId(args, options);
    const pageId = asOptionalString(args.pageId);
    const slug = asOptionalString(args.slug);
    const kind = asOptionalString(args.kind);

    // No single-page procedure exists; the list is small (40 pages max) and
    // carries both columns, so the selection happens here.
    const result = await callTrpc<{ pages: SitePageRecord[] }>(
      "publication.sitePages",
      { publicationId },
      options,
      "query"
    );

    const page = pageId
      ? result.pages.find((candidate) => candidate.id === pageId)
      : slug
        ? result.pages.find((candidate) => candidate.slug === slug)
        : result.pages.find((candidate) => candidate.kind === (kind ?? "home"));

    if (!page) {
      const wanted = pageId ?? slug ?? kind ?? "home";
      throw new Error(
        `No site page matching "${wanted}". Available: ${
          result.pages.map((candidate) => `${candidate.kind}:${candidate.slug}`).join(", ") ||
          "none"
        }`
      );
    }

    const hasDraft = page.draftContentJson != null;
    return makeToolResult(
      `Loaded site page ${page.id} (${page.kind}:${page.slug}, ${
        hasDraft ? "draft" : "live"
      } document)`,
      {
        publicationId,
        page: {
          id: page.id,
          kind: page.kind,
          slug: page.slug,
          title: page.title,
          status: page.status,
          hasDraft,
          seoTitle: page.seoTitle ?? null,
          seoDescription: page.seoDescription ?? null,
          seoOgImageUrl: page.seoOgImageUrl ?? null
        },
        // Draft-coalesced, matching what the builder and site.apply_ops edit.
        contentJson: page.draftContentJson ?? page.contentJson
      }
    );
  }

  if (toolName === "site.page_upsert") {
    const publicationId = await readPublicationId(args, options);
    const kind = readRequiredString(args, "kind");
    const slug = readRequiredString(args, "slug");
    const title = readRequiredString(args, "title");
    const id = asOptionalString(args.id);
    const status = asOptionalString(args.status);
    const contentJson = readOptionalJsonObject(args, "contentJson");
    const seoTitle = readNullableString(args, "seoTitle");
    const seoDescription = readNullableString(args, "seoDescription");
    const seoOgImageUrl = readNullableString(args, "seoOgImageUrl");
    const hideNavbar = typeof args.hideNavbar === "boolean" ? args.hideNavbar : undefined;
    const hideFooter = typeof args.hideFooter === "boolean" ? args.hideFooter : undefined;

    const result = await callTrpc<{ page: SitePageRecord }>(
      "publication.sitePageUpsert",
      {
        publicationId,
        kind,
        slug,
        title,
        ...(id ? { id } : {}),
        ...(status ? { status } : {}),
        ...(contentJson !== undefined ? { contentJson } : {}),
        ...(seoTitle !== undefined ? { seoTitle } : {}),
        ...(seoDescription !== undefined ? { seoDescription } : {}),
        ...(seoOgImageUrl !== undefined ? { seoOgImageUrl } : {}),
        ...(hideNavbar !== undefined ? { hideNavbar } : {}),
        ...(hideFooter !== undefined ? { hideFooter } : {})
      },
      options
    );

    return makeToolResult(
      `Site page saved: ${result.page.id} (${result.page.kind}:${result.page.slug}).${
        contentJson
          ? " The server's total parser may have repaired the document silently — read it back with site.page_get and diff before reporting success."
          : ""
      }`,
      { publicationId, page: result.page }
    );
  }

  if (toolName === "site.apply_ops") {
    const publicationId = await readPublicationId(args, options);
    const pageId = asOptionalString(args.pageId);
    const slug = asOptionalString(args.slug);
    const ops = readRequiredJsonObjectArray(args, "ops");
    const baseVersion = readOptionalNumber(args, "baseVersion");

    const result = await callTrpc<{
      report: SiteOpsReportRecord;
      draftVersion: number;
      pageId: string | null;
    }>(
      "publication.siteApplyOps",
      {
        publicationId,
        ops,
        ...(pageId ? { pageId } : {}),
        ...(slug ? { slug } : {}),
        ...(baseVersion !== undefined ? { baseVersion } : {})
      },
      options
    );

    const skipped = result.report.skipped;
    const summary = skipped
      .map(
        (skip) =>
          `op ${skip.opIndex} (${skip.op}): ${skip.reason}${
            skip.detail ? ` — ${skip.detail}` : ""
          }`
      )
      .join("; ");

    return makeToolResult(
      skipped.length === 0
        ? `Applied ${result.report.applied}/${ops.length} ops to the site draft (page ${
            result.pageId ?? "none"
          }, draftVersion ${result.draftVersion}). Pass draftVersion as baseVersion on the next write.`
        : `Applied ${result.report.applied}/${ops.length} ops to the site draft (page ${
            result.pageId ?? "none"
          }, draftVersion ${result.draftVersion}). ${skipped.length} SKIPPED — ${summary}`,
      {
        publicationId,
        pageId: result.pageId,
        draftVersion: result.draftVersion,
        report: result.report
      }
    );
  }

  if (toolName === "site.section_templates_list") {
    const publicationId = await readPublicationId(args, options);

    const result = await callTrpc<{ templates: SiteTemplateRecord[] }>(
      "publication.siteSectionTemplates",
      { publicationId },
      options,
      "query"
    );

    return makeToolResult(
      `Loaded ${result.templates.length} section templates`,
      { templates: result.templates }
    );
  }

  if (toolName === "site.footer_templates_list") {
    const publicationId = await readPublicationId(args, options);
    const result = await callTrpc<{
      templates: Array<{ id: string; name: string; description: string }>;
    }>("publication.siteFooterTemplates", { publicationId }, options, "query");

    return makeToolResult(
      `Loaded ${result.templates.length} footer templates. Apply one with the set_footer_template op.`,
      { templates: result.templates }
    );
  }

  if (toolName === "site.navbar_templates_list") {
    const publicationId = await readPublicationId(args, options);
    const result = await callTrpc<{
      templates: Array<{
        id: string;
        name: string;
        description: string;
        navbarMobile: string;
      }>;
    }>("publication.siteNavbarTemplates", { publicationId }, options, "query");

    return makeToolResult(
      `Loaded ${result.templates.length} navbar templates. Apply one with the set_navbar_template op.`,
      { templates: result.templates }
    );
  }

  if (toolName === "site.design_brief_get") {
    const publicationId = await readPublicationId(args, options);

    const site = await callTrpc<SiteSettingsRecord>(
      "publication.siteSettings",
      { publicationId },
      options,
      "query"
    );

    return makeToolResult(
      site.designBrief
        ? `Design brief for ${publicationId} (${site.designBrief.length} chars) — treat it as binding on every design change`
        : `No design brief set for ${publicationId}`,
      { publicationId, designBrief: site.designBrief }
    );
  }

  if (toolName === "site.design_brief_set") {
    const publicationId = await readPublicationId(args, options);
    // Three-state on purpose: null clears the brief, a string replaces it.
    const designBrief = readNullableString(args, "designBrief");
    if (designBrief === undefined) {
      throw new Error(
        "Missing required argument: designBrief (a markdown string, or null to clear)"
      );
    }

    await callTrpc<{ settings: unknown }>(
      "publication.siteSettingsUpdate",
      { publicationId, designBrief },
      options
    );

    return makeToolResult(
      designBrief === null
        ? `Design brief cleared for ${publicationId}`
        : `Design brief saved for ${publicationId} (${designBrief.length} chars)`,
      { publicationId, designBrief }
    );
  }

  if (toolName === "site.publish") {
    const publicationId = await readPublicationId(args, options);

    const result = await callTrpc<{
      publishedAt: string;
      draftVersion: number;
      pages: SitePageRecord[];
    }>("publication.sitePublish", { publicationId }, options);

    return makeToolResult(
      `Site published for ${publicationId} at ${result.publishedAt} — the draft is now live (draftVersion ${result.draftVersion})`,
      {
        publicationId,
        publishedAt: result.publishedAt,
        draftVersion: result.draftVersion,
        pageCount: result.pages.length
      }
    );
  }

  if (toolName === "site.discard_draft") {
    const publicationId = await readPublicationId(args, options);

    const result = await callTrpc<{ draftVersion: number; pages: SitePageRecord[] }>(
      "publication.siteDiscardDraft",
      { publicationId },
      options
    );

    return makeToolResult(
      `Discarded the site draft for ${publicationId} — every unpublished edit is gone and the live site is unchanged (draftVersion ${result.draftVersion})`,
      {
        publicationId,
        draftVersion: result.draftVersion,
        revertedPages: result.pages.length
      }
    );
  }

  if (toolName === "site.asset_list") {
    const publicationId = await readPublicationId(args, options);
    const search = asOptionalString(args.search);
    const requestedLimit = readOptionalNumber(args, "limit");
    const limit = Math.max(1, Math.min(200, Math.trunc(requestedLimit ?? 50)));

    const result = await callTrpc<{ assets: Array<Record<string, unknown>> }>(
      "publication.siteAssetList",
      { publicationId, limit, ...(search ? { search } : {}) },
      options,
      "query"
    );

    return makeToolResult(
      result.assets.length === 0
        ? `No images in the asset library for ${publicationId}`
        : `Loaded ${result.assets.length} images from the asset library for ${publicationId}`,
      { publicationId, assets: result.assets }
    );
  }

  if (toolName === "site.asset_upload") {
    const publicationId = await readPublicationId(args, options);
    const contentType = readRequiredString(args, "contentType");
    const dataBase64 = readRequiredString(args, "dataBase64");
    const fileName = asOptionalString(args.fileName);
    const width = readOptionalNumber(args, "width");
    const height = readOptionalNumber(args, "height");

    // Strip a data-URL prefix rather than letting the server reject the upload:
    // pasting `data:image/png;base64,…` is the single most likely way to get
    // this wrong, and the fix is unambiguous.
    const comma = dataBase64.indexOf(",");
    const payload =
      dataBase64.startsWith("data:") && comma > 0
        ? dataBase64.slice(comma + 1)
        : dataBase64;

    const result = await callTrpc<{ url: string; asset: Record<string, unknown> }>(
      "publication.siteAssetUpload",
      {
        publicationId,
        contentType,
        dataBase64: payload,
        ...(fileName ? { fileName } : {}),
        ...(width !== undefined ? { width: Math.trunc(width) } : {}),
        ...(height !== undefined ? { height: Math.trunc(height) } : {})
      },
      options,
      "mutation"
    );

    return makeToolResult(
      `Uploaded ${fileName ?? "image"} to the asset library. Use this URL as the image block's src: ${result.url}`,
      { publicationId, url: result.url, asset: result.asset }
    );
  }

  if (toolName === "site.asset_delete") {
    const publicationId = await readPublicationId(args, options);
    const assetId = readRequiredString(args, "assetId");

    const result = await callTrpc<{ deleted: boolean }>(
      "publication.siteAssetDelete",
      { publicationId, assetId },
      options,
      "mutation"
    );

    return makeToolResult(
      result.deleted
        ? `Removed ${assetId} from the asset library. Anything already referencing its URL still renders.`
        : `No asset ${assetId} in ${publicationId}`,
      { publicationId, assetId, deleted: result.deleted }
    );
  }

  throw new Error(`Unknown tool: ${toolName}`);
}

async function readResource(uri: string, options: McpRuntimeOptions) {
  if (uri === "publication://current/brand-guidelines") {
    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(
            {
              tone: ["clear", "friendly", "direct"],
              style: "short paragraphs, concrete statements, one CTA",
              banned: ["vague hype", "unverifiable claims"]
            },
            null,
            2
          )
        }
      ]
    };
  }

  if (uri === "mailtea://capabilities") {
    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(
            {
              apiBaseUrl: resolveApiBaseUrl(options),
              hasToken: Boolean(resolveToken(options)),
              tools: MCP_TOOLS.map((tool) => tool.name),
              notes: [
                "All tools call Mailtea API endpoints.",
                "Use a PAT or Better Auth session token in Authorization header."
              ]
            },
            null,
            2
          )
        }
      ]
    };
  }

  if (uri === "mailtea://automations/step-types") {
    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(AUTOMATION_STEP_TYPE_CATALOG, null, 2)
        }
      ]
    };
  }

  if (uri === "mailtea://automations/condition-fields") {
    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(
            {
              ...AUTOMATION_STEP_TYPE_CATALOG.condition,
              rule_node_shapes: [
                `{"type": "and" | "or", "rules": [...]}`,
                `{"type": "rule", "field": "<path>", "operator": "<operator>", "value": <literal | array | {"var": "<path>"}>}`
              ],
              // event.properties.* is an open namespace; this is the vocabulary
              // that declares what lives in it, and it is NOT JSON Schema.
              event_schema_document: {
                applies_to: "event_definition.create / event_definition.update schema_json",
                not_json_schema:
                  `Top-level {"type", "required"} are REFUSED with invalid_event_schema — they belong on each property.`,
                top_level_keys: ["properties", "additional_properties"],
                property_keys: ["type", "required", "description"],
                property_types: ["string", "number", "boolean", "object", "array", "null"],
                max_properties: 200,
                additional_properties_default: true,
                example: {
                  properties: {
                    plan: { type: "string", required: true, description: "Plan the contact bought" },
                    seats: { type: ["number", "null"] }
                  },
                  additional_properties: false
                }
              },
              notes: [
                "Presence operators (exists, is_empty) ignore value entirely; set operators (in, not_in) require an array.",
                "A path that does not resolve makes neq and not_in TRUE and every other operator FALSE; exists is false and is_empty is true.",
                `and over an empty rules array is TRUE (vacuous), or over an empty array is FALSE. Malformed nodes, unknown operators and over-depth trees all evaluate FALSE.`,
                "Fields outside the known catalog and open namespaces are a warning (unknown_condition_field), not an error — the namespace grows over time.",
                "event.properties.* is free-form until a schema is declared. event_definition.create and event_definition.update take schema_json in the event_schema_document vocabulary above — it is NOT JSON Schema, and every unrecognised key is rejected."
              ]
            },
            null,
            2
          )
        }
      ]
    };
  }

  const analyticsUri = parseAnalyticsSummaryUri(uri);
  if (analyticsUri) {
    const summary = await loadLatestAnalyticsSummary(options, {
      publicationId: analyticsUri.publicationId,
      range: analyticsUri.range
    });

    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(summary, null, 2)
        }
      ]
    };
  }

  throw new Error(`Unknown resource: ${uri}`);
}

/**
 * The two prompts take arguments and put them in the message (user-testing
 * 0924a, mcp/F13). They used to declare none and return fixed text, so a brief
 * passed to newsletter.draft_from_brief was silently thrown away.
 *
 * A missing required argument is NOT an error: clients that predate the
 * arguments call prompts/get with none, and they get a message that asks for
 * the brief instead of a failure. A value that is present but unusable is
 * refused as invalid params.
 */
function readPrompt(name: string, rawArguments: Record<string, unknown>) {
  const argument = (key: string): string | undefined => {
    const value = rawArguments[key];
    if (typeof value === "number") return String(value);
    return asOptionalString(value);
  };

  if (name === "newsletter.draft_from_brief") {
    const brief = argument("brief");
    const audience = argument("audience");
    const tone = argument("tone");
    const callToAction = argument("call_to_action");

    const context = [
      brief ? `Brief: ${brief}` : "Brief: not given yet. Ask me what the email is about before you write anything.",
      audience ? `Audience: ${audience}` : null,
      tone ? `Tone: ${tone}` : null,
      callToAction ? `Call to action: ${callToAction}` : null
    ].filter((line): line is string => line !== null);

    return {
      description: "Write a newsletter email from a short brief, then save it as a draft",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              "Write a newsletter email from this brief.",
              "",
              ...context,
              "",
              "Keep it concise: a subject line, a preview text that says something the subject does not, two to four short sections with clear headings, and exactly one call to action.",
              "Then save it as a draft with issue.create_draft (contentSpec or contentHtml), check it with email.lint, and show me the subject and a short summary. Do not send it."
            ].join("\n")
          }
        }
      ]
    };
  }

  if (name === "newsletter.subject_line_pack") {
    const topic = argument("topic");
    const audience = argument("audience");
    const countText = argument("count");
    let count = 10;
    if (countText !== undefined) {
      const parsed = Number(countText);
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 30) {
        throw new InvalidParamsError("Prompt argument count must be a whole number from 1 to 30");
      }
      count = parsed;
    }

    return {
      description: "Write subject line and preview text pairs for an email",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              topic
                ? `Write ${count} subject lines for an email about: ${topic}`
                : `Write ${count} subject lines for an email. Ask me what the email is about first.`,
              audience ? `Audience: ${audience}` : null,
              "",
              "Vary the tone and the urgency. Keep each one under 60 characters, with no all caps and no misleading urgency. Give each a preview text that adds something the subject does not say. Return them as a numbered list."
            ]
              .filter((line): line is string => line !== null)
              .join("\n")
          }
        }
      ]
    };
  }

  throw new InvalidParamsError(`Unknown prompt: ${name}`);
}

export async function handleMcpRequest(
  request: JsonRpcRequest,
  options: McpRuntimeOptions = {}
): Promise<JsonRpcResponse> {
  const id = request.id ?? null;

  try {
    switch (request.method) {
      case "initialize":
        return response(id, {
          protocolVersion: "2025-06-18",
          serverInfo: {
            name: "mailtea-mcp",
            version: SERVER_VERSION
          },
          capabilities: {
            tools: {},
            resources: {},
            prompts: {}
          }
        });

      case "tools/list":
        return response(id, { tools: MCP_TOOLS });

      case "resources/list":
        return response(id, { resources: MCP_RESOURCES });

      case "resources/read": {
        const uri = asOptionalString(request.params?.uri);
        if (!uri) {
          return error(id, -32602, "Missing required param: uri");
        }

        return response(id, await readResource(uri, options));
      }

      case "prompts/list":
        return response(id, { prompts: MCP_PROMPTS });

      case "prompts/get": {
        const promptName = asOptionalString(request.params?.name);
        if (!promptName) {
          return error(id, -32602, "Missing required param: name");
        }

        return response(id, readPrompt(promptName, asObject(request.params?.arguments)));
      }

      case "tools/call": {
        const params = asObject(request.params);
        const toolName = asOptionalString(params.name);
        if (!toolName) {
          return error(id, -32602, "Missing required param: name");
        }

        const argumentsValue = params.arguments;
        if (
          argumentsValue !== undefined &&
          (!argumentsValue || typeof argumentsValue !== "object" || Array.isArray(argumentsValue))
        ) {
          return error(id, -32602, "Param arguments must be an object");
        }

        const args = (argumentsValue ?? {}) as Record<string, unknown>;
        const warning = unknownArgumentsWarning(toolName, args);
        let result: Awaited<ReturnType<typeof runTool>>;
        try {
          result = await runTool(toolName, args, options);
        } catch (err) {
          // A failure is often CAUSED by the ignored key (publication_id sent
          // to a camelCase tool, say), so the error names it too.
          if (warning && err instanceof Error) {
            err.message = `${err.message}\n${warning}`;
          }
          throw err;
        }
        if (warning && result && Array.isArray((result as { content?: unknown }).content)) {
          // A separate content item, never appended to the first: some tools
          // return machine-readable text there (a CSV export, say).
          (result as { content: Array<{ type: string; text: string }> }).content.push({
            type: "text",
            text: `Warning: ${warning}`
          });
        }
        return response(id, result);
      }

      default:
        // Every `notifications/*` method is one-way: the client is telling us
        // something, not asking. "Method not found" for one we don't act on —
        // `notifications/cancelled`, say — turns a routine message into an
        // error a strict client treats as a failed session, so they all no-op.
        if (request.method.startsWith("notifications/")) {
          return response(id, {});
        }

        return error(id, -32601, "Method not found", { method: request.method });
    }
  } catch (err) {
    if (err instanceof InvalidParamsError) {
      return error(id, -32602, err.message);
    }
    // A REST failure carries its machine-readable fields (code, reason, steps,
    // issues) as `data`, so a client that reads structure need not parse text.
    const data = err instanceof Error ? (err as Error & { data?: unknown }).data : undefined;
    return error(id, -32000, toErrorMessage(err), data);
  }
}
