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
  publicationId?: string | null;
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
  createdAt: string;
  updatedAt: string;
  scheduledAt: string | null;
  sentAt: string | null;
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
  range: "24h" | "7d" | "30d" | "all";
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
  range: "24h" | "7d" | "30d" | "all";
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

type IssueAnalyticsRange = "24h" | "7d" | "30d" | "all";

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
  presetId: string;
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

type TrpcProcedureType = "query" | "mutation";

// Defaults to Mailtea cloud so `npx mailtea-mcp` works with just a token.
// Self-hosters and local dev override via MAILTEA_API_BASE_URL.
const DEFAULT_API_BASE_URL = "https://api.mailtea.app";

export const MCP_TOOLS = [
  {
    name: "auth.me",
    description: "Return auth identity for current token",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "issue.create_draft",
    description: "Create a marketing email draft. Set kind to 'newsletter' (default) for recurring content that can publish to the public site, or 'broadcast' for a one-time email-only send (promotion, launch, announcement). Provide content one of three ways: templateId (seed from a published server template — use template.list/template.get to find one — with {{variables}} substituted), contentHtml (raw HTML), or contentSpec (json-render spec). Spec is recommended for AI agents — use components: Html, Head, Body, Container, Section, Row, Column, Heading, Text, Link, Button, Image, Hr, Preview, Markdown, MailteaHeader, MailteaFooter, MailteaSpacer, MailteaContentBlock.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        title: { type: "string" },
        kind: { type: "string", enum: ["newsletter", "broadcast"], description: "Email kind. 'newsletter' (default) can publish to the public site; 'broadcast' is one-time email-only." },
        templateId: { type: "string", description: "Seed the draft from a published server template (see template.list). Takes precedence over contentHtml/contentSpec." },
        variables: { type: "object", description: "Key/value map substituted into the template's {{variable}} placeholders when templateId is set." },
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
      required: ["publicationId", "title"]
    }
  },
  {
    name: "issue.get_editor",
    description: "Load issue editor payload for a draft or scheduled issue",
    inputSchema: {
      type: "object",
      properties: {
        issueId: { type: "string" }
      },
      required: ["issueId"]
    }
  },
  {
    name: "issue.update_draft",
    description: "Update an existing draft issue. Provide contentHtml (raw HTML) or contentSpec (json-render spec).",
    inputSchema: {
      type: "object",
      properties: {
        issueId: { type: "string" },
        title: { type: "string" },
        contentHtml: { type: "string", description: "Raw HTML content (use this OR contentSpec)" },
        contentSpec: {
          type: "object",
          description: "json-render spec (flat element map). Use this OR contentHtml.",
          properties: {
            root: { type: "string" },
            elements: { type: "object" }
          },
          required: ["root", "elements"]
        }
      },
      required: ["issueId", "title"]
    }
  },
  {
    name: "issue.remove_draft",
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
    description: "List recent issues for a publication",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        limit: { type: "number" }
      },
      required: ["publicationId"]
    }
  },
  {
    name: "publication.list",
    description: "List publication workspaces available to current user/token",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "publication.create",
    description: "Create a publication workspace and attach owner membership",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        name: { type: "string" },
        timezone: { type: "string" }
      },
      required: ["name"]
    }
  },
  {
    name: "publication.domain_list",
    description: "List custom domains connected to a publication",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        limit: { type: "number" }
      },
      required: ["publicationId"]
    }
  },
  {
    name: "publication.domain_upsert",
    description: "Create or update a publication custom domain",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        host: { type: "string" },
        isPrimary: { type: "boolean" },
        proxyTarget: { type: "string" }
      },
      required: ["publicationId", "host"]
    }
  },
  {
    name: "publication.domain_verify",
    description: "Mark a publication domain as verified",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        domainId: { type: "string" },
        verificationValue: { type: "string" }
      },
      required: ["publicationId", "domainId"]
    }
  },
  {
    name: "publication.domain_set_primary",
    description: "Set an existing publication domain as primary",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        domainId: { type: "string" }
      },
      required: ["publicationId", "domainId"]
    }
  },
  {
    name: "publication.domain_remove",
    description: "Remove a publication custom domain",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        domainId: { type: "string" }
      },
      required: ["publicationId", "domainId"]
    }
  },
  {
    name: "publication.domain_traefik_preview",
    description: "Generate Traefik dynamic-file preview for publication domains",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" }
      },
      required: ["publicationId"]
    }
  },
  {
    name: "sender.list",
    description: "List named from-identities (senders) for a publication",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        limit: { type: "number" }
      },
      required: ["publicationId"]
    }
  },
  {
    name: "sender.create",
    description:
      "Create a named sender. The email domain must be a verified, DKIM-verified sending domain of the publication.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        name: { type: "string" },
        email: { type: "string" },
        replyTo: { type: "string" },
        isDefault: { type: "boolean" }
      },
      required: ["publicationId", "name", "email"]
    }
  },
  {
    name: "sender.update",
    description: "Update a sender's name, reply-to, or default flag. Email is immutable.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        senderId: { type: "string" },
        name: { type: "string" },
        replyTo: { type: "string" },
        isDefault: { type: "boolean" }
      },
      required: ["publicationId", "senderId"]
    }
  },
  {
    name: "sender.set_default",
    description: "Make a sender the publication's default from-identity",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        senderId: { type: "string" }
      },
      required: ["publicationId", "senderId"]
    }
  },
  {
    name: "sender.delete",
    description: "Remove a named sender",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        senderId: { type: "string" }
      },
      required: ["publicationId", "senderId"]
    }
  },
  {
    name: "suppression.search",
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
    description:
      "Export the organization's entire suppression list as CSV (columns: email, reason, source, created_at). Returns the CSV text in 'csv'.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "suppression.add",
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
    description: "List contacts for a publication",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        status: {
          type: "string",
          enum: ["active", "unsubscribed", "suppressed"]
        },
        query: { type: "string" },
        limit: { type: "number" }
      },
      required: ["publicationId"]
    }
  },
  {
    name: "contact.upsert",
    description: "Create or reactivate a contact by email",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        email: { type: "string" },
        referrerContactId: { type: "string" }
      },
      required: ["publicationId", "email"]
    }
  },
  {
    name: "contact.set_status",
    description: "Set contact status (active, unsubscribed, suppressed)",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        contactId: { type: "string" },
        status: {
          type: "string",
          enum: ["active", "unsubscribed", "suppressed"]
        }
      },
      required: ["publicationId", "contactId", "status"]
    }
  },
  {
    name: "contact.import_csv",
    description: "Import contacts from CSV text payload",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        csvText: { type: "string" }
      },
      required: ["publicationId", "csvText"]
    }
  },
  {
    name: "contact.referral_summary",
    description: "Load referral conversion leaderboard for a publication",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        limit: { type: "number" }
      },
      required: ["publicationId"]
    }
  },
  {
    name: "contact.referral_milestones",
    description: "List referral milestone rules for a publication",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        limit: { type: "number" }
      },
      required: ["publicationId"]
    }
  },
  {
    name: "contact.referral_milestone_upsert",
    description: "Create or update a referral milestone rule",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        milestoneId: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        referralCount: { type: "number" }
      },
      required: ["publicationId", "title", "referralCount"]
    }
  },
  {
    name: "contact.referral_milestone_remove",
    description: "Delete a referral milestone rule",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        milestoneId: { type: "string" }
      },
      required: ["publicationId", "milestoneId"]
    }
  },
  {
    name: "contact.referral_rewards",
    description: "List awarded referral rewards for a publication",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        contactId: { type: "string" },
        limit: { type: "number" }
      },
      required: ["publicationId"]
    }
  },
  {
    name: "monetize.offer_list",
    description: "List sponsor offers for a publication",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        status: {
          type: "string",
          enum: ["draft", "active", "paused", "archived"]
        },
        limit: { type: "number" }
      },
      required: ["publicationId"]
    }
  },
  {
    name: "monetize.offer_upsert",
    description: "Create or update a sponsor offer",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
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
      required: ["publicationId", "title", "sponsorName", "pricingModel", "rateCents"]
    }
  },
  {
    name: "monetize.offer_remove",
    description: "Delete a sponsor offer",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        offerId: { type: "string" }
      },
      required: ["publicationId", "offerId"]
    }
  },
  {
    name: "section.list",
    description: "List reusable editor sections for a publication",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        limit: { type: "number" }
      },
      required: ["publicationId"]
    }
  },
  {
    name: "section.catalog",
    description: "List shared marketplace section packs",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: {
          type: "string",
          description: "Optional publication id to include custom packs"
        }
      }
    }
  },
  {
    name: "section.pack_create",
    description: "Create a custom marketplace pack for a publication",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
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
      required: ["publicationId", "title", "sections"]
    }
  },
  {
    name: "section.pack_update",
    description: "Update a custom marketplace pack",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
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
      required: ["publicationId", "packId", "title", "sections"]
    }
  },
  {
    name: "section.pack_remove",
    description: "Delete a custom marketplace pack",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        packId: { type: "string" }
      },
      required: ["publicationId", "packId"]
    }
  },
  {
    name: "section.pack_revisions",
    description: "List version history for a custom marketplace pack",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        packId: { type: "string" },
        limit: { type: "number" }
      },
      required: ["publicationId", "packId"]
    }
  },
  {
    name: "section.pack_restore_revision",
    description: "Restore a custom marketplace pack to a specific revision",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        packId: { type: "string" },
        revisionId: { type: "string" }
      },
      required: ["publicationId", "packId", "revisionId"]
    }
  },
  {
    name: "section.import_pack",
    description: "Import a marketplace pack into reusable sections",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        presetId: { type: "string" }
      },
      required: ["publicationId", "presetId"]
    }
  },
  {
    name: "section.create",
    description: "Create a reusable section snippet",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        name: { type: "string" },
        contentJson: {
          type: "array",
          items: { type: "object" },
          minItems: 1
        }
      },
      required: ["publicationId", "name", "contentJson"]
    }
  },
  {
    name: "section.update",
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
    description: "Preview newsletter HTML/text for unsaved draft content",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        title: { type: "string" },
        html: { type: "string" },
        plainText: { type: "string" },
        styleProfile: {
          type: "object",
          description: "Optional React Email style profile overrides."
        }
      },
      required: ["publicationId", "title", "html"]
    }
  },
  {
    name: "issue.delivery_progress",
    description: "Fetch send progress snapshot for an issue",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        issueId: { type: "string" }
      },
      required: ["publicationId", "issueId"]
    }
  },
  {
    name: "issue.wait_delivery",
    description: "Poll issue send progress until sent/failed or timeout",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
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
      required: ["publicationId", "issueId"]
    }
  },
  {
    name: "analytics.poll_results",
    description: "Fetch poll vote totals for a specific issue",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        issueId: { type: "string" }
      },
      required: ["publicationId", "issueId"]
    }
  },
  {
    name: "analytics.issue_performance",
    description: "Fetch open/click delivery analytics for an issue",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        issueId: { type: "string" },
        range: {
          type: "string",
          enum: ["24h", "7d", "30d", "all"],
          description: "Analytics window. Defaults to all."
        }
      },
      required: ["publicationId", "issueId"]
    }
  },
  {
    name: "analytics.issue_trend",
    description: "Fetch daily open/click trend buckets for an issue",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        issueId: { type: "string" },
        range: {
          type: "string",
          enum: ["24h", "7d", "30d", "all"],
          description: "Analytics window. Defaults to all."
        }
      },
      required: ["publicationId", "issueId"]
    }
  },
  {
    name: "analytics.latest_summary",
    description: "Fetch latest issue analytics snapshot for a publication",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: {
          type: "string",
          description: "Optional publication id. Falls back to MAILTEA_PUBLICATION_ID."
        },
        range: {
          type: "string",
          enum: ["24h", "7d", "30d", "all"],
          description: "Analytics window. Defaults to 7d."
        }
      }
    }
  },
  {
    name: "analytics.issue_export_csv",
    description: "Export issue performance and poll analytics as CSV",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        issueId: { type: "string" },
        range: {
          type: "string",
          enum: ["24h", "7d", "30d", "all"],
          description: "Analytics window. Defaults to all."
        },
        exportType: {
          type: "string",
          enum: ["combined", "performance", "polls"],
          description: "CSV type. Defaults to combined."
        }
      },
      required: ["publicationId", "issueId"]
    }
  },
  {
    name: "analytics.issue_export_performance_csv",
    description: "Export issue performance-only analytics as CSV",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        issueId: { type: "string" },
        range: {
          type: "string",
          enum: ["24h", "7d", "30d", "all"],
          description: "Analytics window. Defaults to all."
        }
      },
      required: ["publicationId", "issueId"]
    }
  },
  {
    name: "analytics.issue_export_polls_csv",
    description: "Export issue poll-only analytics as CSV",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        issueId: { type: "string" },
        range: {
          type: "string",
          enum: ["24h", "7d", "30d", "all"],
          description: "Analytics window. Defaults to all."
        }
      },
      required: ["publicationId", "issueId"]
    }
  },
  {
    name: "issue.schedule",
    description: "Schedule an issue for delivery",
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
    description:
      "Publish an issue to the publication's public website, making it readable on the web (typically a sent issue).",
    inputSchema: {
      type: "object",
      properties: { issueId: { type: "string" } },
      required: ["issueId"]
    }
  },
  {
    name: "issue.unpublish_from_web",
    description: "Remove an issue from the publication's public website.",
    inputSchema: {
      type: "object",
      properties: { issueId: { type: "string" } },
      required: ["issueId"]
    }
  },
  {
    name: "issue.send_now",
    description: "Send an issue immediately",
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
    description: "Generate a draft from a prompt",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        prompt: { type: "string" },
        tone: {
          type: "string",
          enum: ["neutral", "friendly", "formal"]
        }
      },
      required: ["publicationId", "prompt"]
    }
  },
  {
    name: "template.create",
    description: "Create an email template. Provide html (raw HTML) or spec (json-render spec). Spec is recommended — the platform renders email-safe HTML server-side. Available spec components: Html, Head, Body, Container, Section, Row, Column, Heading, Text, Link, Button, Image, Hr, Preview, Markdown, MailteaHeader, MailteaFooter, MailteaSpacer, MailteaContentBlock.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string", description: "Publication to create template in" },
        name: { type: "string", description: "Template name (max 120 chars)" },
        html: { type: "string", description: "Raw HTML content (use this OR spec)" },
        spec: {
          type: "object",
          description: "json-render spec (flat element map). Use this OR html.",
          properties: {
            root: { type: "string" },
            elements: { type: "object" }
          },
          required: ["root", "elements"]
        },
        description: { type: "string", description: "Template description (max 500 chars)" },
        text: { type: "string", description: "Plain-text body." },
        subject: { type: "string", description: "Default email subject line" },
        from: { type: "string", description: "Default sender address." },
        reply_to: { type: "string" },
        variables: {
          type: "array",
          description: "Template variables with fallback values",
          items: {
            type: "object",
            properties: {
              key: { type: "string" },
              type: { type: "string", enum: ["string", "number"] },
              fallback_value: {}
            },
            required: ["key", "type"]
          }
        }
      },
      required: ["publicationId", "name"]
    }
  },
  {
    name: "template.list",
    description: "List email templates for a publication",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        limit: { type: "number", description: "Max results (1-100, default 20)" }
      },
      required: ["publicationId"]
    }
  },
  {
    name: "template.get",
    description: "Get a single email template by ID, including its spec and rendered HTML",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        templateId: { type: "string" }
      },
      required: ["publicationId", "templateId"]
    }
  },
  {
    name: "template.update",
    description:
      "Update an email template. Pass only the fields to change. Providing spec re-renders email-safe HTML server-side; providing html switches the template to raw HTML.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        templateId: { type: "string" },
        name: { type: "string" },
        html: { type: "string", description: "Raw HTML content (switches the template to raw HTML)." },
        spec: {
          type: "object",
          description: "json-render spec (flat element map). Re-renders email-safe HTML server-side.",
          properties: { root: { type: "string" }, elements: { type: "object" } },
          required: ["root", "elements"]
        },
        description: { type: "string" },
        text: { type: "string", description: "Plain-text body." },
        subject: { type: "string" },
        from: { type: "string", description: "Default sender address." },
        reply_to: { type: "string" },
        variables: {
          type: "array",
          items: {
            type: "object",
            properties: {
              key: { type: "string" },
              type: { type: "string", enum: ["string", "number"] },
              fallback_value: {}
            },
            required: ["key", "type"]
          }
        }
      },
      required: ["publicationId", "templateId"]
    }
  },
  {
    name: "template.publish",
    description: "Publish a draft email template, making it the active version for sends.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        templateId: { type: "string" }
      },
      required: ["publicationId", "templateId"]
    }
  },
  {
    name: "template.duplicate",
    description: "Duplicate an email template into a new draft copy.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        templateId: { type: "string" }
      },
      required: ["publicationId", "templateId"]
    }
  },
  {
    name: "template.delete",
    description: "Delete an email template.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        templateId: { type: "string" }
      },
      required: ["publicationId", "templateId"]
    }
  },
  {
    name: "template.render",
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
    description:
      "Send a transactional email to one or more specific recipients. Provide inline content (html and/or text) OR a template reference — not both. Unlike issue.send_now (which sends a newsletter to the WHOLE publication list), this delivers a one-shot email to the exact addresses in 'to'. Set scheduled_at to send later. Returns the new email's id.",
    inputSchema: {
      type: "object",
      properties: {
        from: {
          type: "string",
          description:
            "Sender, e.g. 'Acme <hello@acme.com>'. Must use a verified domain. Provide this OR sender_id, not both."
        },
        sender_id: {
          type: "string",
          description: "Send as a named sender (alternative to from)."
        },
        to: {
          type: ["string", "array"],
          items: { type: "string" },
          description: "Recipient address, or array of up to 50 addresses."
        },
        subject: { type: "string", description: "Subject line (max 998 chars)." },
        html: { type: "string", description: "HTML body. Use this OR template, not both." },
        text: { type: "string", description: "Plain-text body." },
        template: {
          type: "object",
          description: "Stored template reference to render instead of inline html.",
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
      // Exactly one of from / sender_id is required; enforced in runTool since
      // JSON Schema `required` can't express "exactly one of".
      required: ["to", "subject"]
    }
  },
  {
    name: "email.batch",
    description:
      "Send up to 100 transactional emails in one request. Each item is shaped like email.send but WITHOUT attachments or scheduled_at. Returns the ids in request order.",
    inputSchema: {
      type: "object",
      properties: {
        emails: {
          type: "array",
          description:
            "1-100 email objects: { from, to, subject, html?|text?|template?, cc?, bcc?, reply_to?, tags?, headers? }.",
          items: { type: "object" }
        }
      },
      required: ["emails"]
    }
  },
  {
    name: "email.get",
    description:
      "Retrieve a transactional email by id with its delivery status (last_event) and tracking counters (open_count, click_count).",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"]
    }
  },
  {
    name: "email.reschedule",
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
    description: "Cancel a scheduled transactional email before it sends.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"]
    }
  },
  {
    name: "email.resend",
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
    description:
      "List transactional emails (most recent first). Filter by status and tags; paginate with limit/offset. Returns id, status, subject, recipient per email.",
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
        from_date: { type: "string", description: "ISO 8601 lower bound on created_at." },
        to_date: { type: "string", description: "ISO 8601 upper bound on created_at." }
      }
    }
  },
  {
    name: "email.analytics",
    description:
      "Aggregate transactional email metrics over an optional date window: totals, delivered/bounced/opened/clicked counts, per-status counts, and delivery/open/click/bounce rates.",
    inputSchema: {
      type: "object",
      properties: {
        from_date: { type: "string", description: "ISO 8601 lower bound on created_at." },
        to_date: { type: "string", description: "ISO 8601 upper bound on created_at." }
      }
    }
  },
  // --- Inbound email (REST /v1/emails/inbound) -----------------------------
  // Only inbound_list takes a publicationId; get/attachments/reply resolve
  // tenancy from the inbound email id.
  {
    name: "email.inbound_list",
    description:
      "List inbound (received) emails for a publication, most recent first; paginate with limit/cursor. Only this inbound tool needs publicationId — email.inbound_get/list_attachments/get_attachment/reply resolve tenancy from the email id.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        limit: { type: "number", description: "Max results (1-100, default 20)." },
        cursor: { type: "string", description: "Opaque pagination cursor from a prior response's next_cursor." }
      },
      required: ["publicationId"]
    }
  },
  {
    name: "email.inbound_get",
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
    description:
      "Reply to an inbound email. The reply threads automatically — In-Reply-To, References, and the To (reply target) are all derived by the server from the original, so they are NOT inputs. Provide html and/or text. Omit `from` to send from the verified domain the mail was delivered to. Tenancy is resolved from the email id (no publicationId). Returns the resulting transactional email id (txemail_) with its status.",
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
    description:
      "Send a TEST copy of a newsletter draft to specific recipients (yourself/teammates) to check it before subscribers see it. Renders the issue exactly as a subscriber would receive it and delivers it as a one-shot email with a '[TEST]' subject prefix. This does NOT send to the publication's audience — use issue.send_now for the real send.",
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
          description: "Sender, e.g. 'Acme <hello@acme.com>'. Must use a verified domain."
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
    description:
      "Register an email sending domain for a publication. Returns the DNS records (in 'records') the operator must add — an ownership TXT record, a branded DKIM TXT record, and (for email domains) a receiving MX record. Set purpose to 'email' (or 'both') to use it as a sending 'from' domain; both the ownership TXT and the DKIM TXT must verify before the domain can send.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        name: { type: "string", description: "Domain host, e.g. 'mail.acme.com'." },
        purpose: {
          type: "string",
          enum: ["email", "site", "both"],
          description: "Use 'email' or 'both' for a sending domain. Defaults to 'site'."
        },
        is_primary: { type: "boolean" }
      },
      required: ["publicationId", "name"]
    }
  },
  {
    name: "domain.list",
    description: "List email/site domains for a publication.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        limit: { type: "number", description: "Max results (1-100, default 20)." }
      },
      required: ["publicationId"]
    }
  },
  {
    name: "domain.get",
    description: "Get a single domain including the DNS 'records' to add for verification.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        domainId: { type: "string" }
      },
      required: ["publicationId", "domainId"]
    }
  },
  {
    name: "domain.verify",
    description:
      "Check a domain's DNS and report its verification state. Sending is gated on two parts: the ownership TXT record must verify (which sets status to 'verified') AND the branded DKIM TXT record must verify. Ownership verification alone does NOT make a domain sendable. The response now includes 'dkim_status' and 'receiving_mx_found' so you can confirm both before sending.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        domainId: { type: "string" }
      },
      required: ["publicationId", "domainId"]
    }
  },
  {
    name: "domain.update",
    description: "Update a domain's purpose (email/site/both) or primary flag.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        domainId: { type: "string" },
        purpose: { type: "string", enum: ["email", "site", "both"] },
        is_primary: { type: "boolean" }
      },
      required: ["publicationId", "domainId"]
    }
  },
  {
    name: "domain.delete",
    description: "Remove a domain from a publication.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        domainId: { type: "string" }
      },
      required: ["publicationId", "domainId"]
    }
  },
  // --- Tracking sub-domains (CNAME, under a domain) -------------------------
  {
    name: "domain.tracking_create",
    description:
      "Add a tracking sub-domain (CNAME) under a domain — used to serve open-pixel/click-tracking links from your own domain. Returns the CNAME record to add, then call domain.tracking_verify.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        domainId: { type: "string", description: "Parent domain ID." },
        subdomain: {
          type: "string",
          description: "Sub-domain label (lowercase alphanumeric and hyphens), e.g. 'links'."
        }
      },
      required: ["publicationId", "domainId", "subdomain"]
    }
  },
  {
    name: "domain.tracking_list",
    description: "List tracking sub-domains for a domain.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        domainId: { type: "string" }
      },
      required: ["publicationId", "domainId"]
    }
  },
  {
    name: "domain.tracking_verify",
    description:
      "Verify a tracking sub-domain by checking its CNAME record; status becomes 'verified'.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        domainId: { type: "string" },
        trackingDomainId: { type: "string" }
      },
      required: ["publicationId", "domainId", "trackingDomainId"]
    }
  },
  {
    name: "domain.tracking_delete",
    description: "Remove a tracking sub-domain.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        domainId: { type: "string" },
        trackingDomainId: { type: "string" }
      },
      required: ["publicationId", "domainId", "trackingDomainId"]
    }
  },
  // --- Outbound webhooks (REST /v1/webhooks/endpoints) ----------------------
  {
    name: "webhook.create",
    description:
      "Register an outbound webhook endpoint that receives delivery/engagement events. Returns a signing_secret (shown only once) used to verify payloads.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        endpoint: { type: "string", description: "HTTPS URL to deliver events to." },
        events: {
          type: "array",
          items: { type: "string" },
          description:
            "Event types to subscribe to. One or more of: email.received, email.sent, email.delivered, email.delivery_delayed, email.bounced, email.complained, email.opened, email.clicked, email.failed, email.suppressed, contact.created, contact.updated, contact.deleted, contact.unsubscribed."
        }
      },
      required: ["publicationId", "endpoint", "events"]
    }
  },
  {
    name: "webhook.list",
    description: "List outbound webhooks for a publication (signing secrets omitted).",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        limit: { type: "number", description: "Max results (1-100, default 20)." }
      },
      required: ["publicationId"]
    }
  },
  {
    name: "webhook.get",
    description: "Get a single outbound webhook by ID.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        webhookId: { type: "string" }
      },
      required: ["publicationId", "webhookId"]
    }
  },
  {
    name: "webhook.update",
    description: "Update a webhook's endpoint, subscribed events, or enabled/disabled status.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        webhookId: { type: "string" },
        endpoint: { type: "string" },
        events: { type: "array", items: { type: "string" } },
        status: { type: "string", enum: ["enabled", "disabled"] }
      },
      required: ["publicationId", "webhookId"]
    }
  },
  {
    name: "webhook.delete",
    description: "Delete an outbound webhook.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        webhookId: { type: "string" }
      },
      required: ["publicationId", "webhookId"]
    }
  },
  // --- Audience segments (REST /v1/segments) --------------------------------
  {
    name: "segment.create",
    description:
      "Create a saved audience segment defined by a status filter and/or a query filter (filter-based, not manual membership).",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        name: { type: "string" },
        description: { type: "string" },
        status_filter: { type: "string", enum: ["active", "unsubscribed", "suppressed"] },
        query_filter: { type: "string", description: "Search/filter expression over contacts." }
      },
      required: ["publicationId", "name"]
    }
  },
  {
    name: "segment.list",
    description: "List saved audience segments for a publication.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        limit: { type: "number", description: "Max results (1-100, default 20)." }
      },
      required: ["publicationId"]
    }
  },
  {
    name: "segment.get",
    description: "Get a single audience segment by ID.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        segmentId: { type: "string" }
      },
      required: ["publicationId", "segmentId"]
    }
  },
  {
    name: "segment.update",
    description: "Update an audience segment's name, description, or filters.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
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
        }
      },
      required: ["publicationId", "segmentId"]
    }
  },
  {
    name: "segment.delete",
    description: "Delete an audience segment.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        segmentId: { type: "string" }
      },
      required: ["publicationId", "segmentId"]
    }
  },
  // --- Contact custom properties (REST /v1/contact-properties; team-scoped) -
  {
    name: "contact_property.create",
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
    description: "Get a single contact by its ID or email address.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        idOrEmail: { type: "string", description: "Contact ID or email address." }
      },
      required: ["publicationId", "idOrEmail"]
    }
  },
  {
    name: "contact.delete",
    description: "Permanently delete a contact by its ID or email address.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        idOrEmail: { type: "string", description: "Contact ID or email address." }
      },
      required: ["publicationId", "idOrEmail"]
    }
  },
  {
    name: "contact.get_properties",
    description: "Read a contact's custom property values.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        contactId: { type: "string" }
      },
      required: ["publicationId", "contactId"]
    }
  },
  {
    name: "contact.set_properties",
    description:
      "Set a contact's custom property values. Each value references a property by propertyId (from contact_property.list/create).",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        contactId: { type: "string" },
        values: {
          type: "array",
          items: {
            type: "object",
            properties: {
              propertyId: { type: "string" },
              value: { type: "string" }
            },
            required: ["propertyId", "value"]
          }
        }
      },
      required: ["publicationId", "contactId", "values"]
    }
  },
  // --- Tag definitions (REST /v1/tags) -------------------------------------
  {
    name: "tag.create",
    description:
      "Create a tag definition. NOTE: tags cannot yet be assigned to individual contacts via the API — this manages tag definitions only.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
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
            "public = the tag becomes a reader-facing topic (an unsubscribe group) on the preferences page, using its description as the reader-facing copy; private = internal only, never shown to readers."
        }
      },
      required: ["publicationId", "name", "default_subscription"]
    }
  },
  {
    name: "tag.list",
    description: "List tag definitions for a publication.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        limit: { type: "number", description: "Max results (1-100, default 20)." }
      },
      required: ["publicationId"]
    }
  },
  {
    name: "tag.update",
    description: "Update a tag definition's name, description, default subscription, or visibility.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        tagId: { type: "string" },
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
            "public = the tag becomes a reader-facing topic (an unsubscribe group) on the preferences page, using its description as the reader-facing copy; private = internal only, never shown to readers."
        }
      },
      required: ["publicationId", "tagId"]
    }
  },
  {
    name: "tag.delete",
    description: "Delete a tag definition.",
    inputSchema: {
      type: "object",
      properties: {
        publicationId: { type: "string" },
        tagId: { type: "string" }
      },
      required: ["publicationId", "tagId"]
    }
  },
  // --- API keys (REST /v1/api-keys; requires settings:write) ----------------
  {
    name: "api_key.create",
    description:
      "Create an API key (PAT). Requires the calling token to hold settings:write AND every scope the new key would grant. The token value is returned ONCE — store it securely. 'full_access' grants all scopes; 'sending_access' grants issue read/write/send only.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Human label for the key (max 50 chars)." },
        permission: {
          type: "string",
          enum: ["full_access", "sending_access"],
          description: "Defaults to full_access."
        },
        domain_id: { type: "string", description: "Optional publication scope for sending_access." }
      },
      required: ["name"]
    }
  },
  {
    name: "api_key.list",
    description: "List the team's API keys (token values are never returned).",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "api_key.revoke",
    description: "Revoke (delete) an API key by its ID.",
    inputSchema: {
      type: "object",
      properties: {
        keyId: { type: "string" }
      },
      required: ["keyId"]
    }
  }
] as const;

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
  }
] as const;

export const MCP_PROMPTS = [
  {
    name: "newsletter.draft_from_brief",
    description: "Create a newsletter draft from a short brief"
  },
  {
    name: "newsletter.subject_line_pack",
    description: "Generate subject line variants"
  }
] as const;

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

  if (value === "24h" || value === "7d" || value === "30d" || value === "all") {
    return value;
  }

  throw new Error(`Argument ${key} must be one of: 24h, 7d, 30d, all`);
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
  return (
    asOptionalString(options.publicationId ?? undefined) ??
    asOptionalString(process.env.MAILTEA_PUBLICATION_ID) ??
    null
  );
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
    throw new Error(
      (payload as any)?.error ?? `${httpResponse.status} ${httpResponse.statusText}`
    );
  }

  return payload as T;
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
  "scheduled_at",
  "tags",
  "headers",
  "attachments"
] as const;

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
    const publicationId = readRequiredString(args, "publicationId");
    const title = readRequiredString(args, "title");
    const kind = args.kind === "broadcast" ? "broadcast" : args.kind === "newsletter" ? "newsletter" : undefined;
    const templateId = asOptionalString(args.templateId);
    const variables = args.variables as Record<string, unknown> | undefined;
    const contentHtml = asOptionalString(args.contentHtml);
    const contentSpec = args.contentSpec as Record<string, unknown> | undefined;

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

    const draft = await callTrpc<IssueRecord>(
      "issue.createDraft",
      {
        publicationId,
        title,
        ...(kind ? { kind } : {}),
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

    return makeToolResult(`Loaded editor state for ${issue.id} (${issue.status})`, { issue });
  }

  if (toolName === "issue.update_draft") {
    const issueId = readRequiredString(args, "issueId");
    const title = readRequiredString(args, "title");
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
        title,
        ...(resolvedHtml
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
    const publicationId = readRequiredString(args, "publicationId");
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
    const publicationId = readRequiredString(args, "publicationId");
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
    const publicationId = readRequiredString(args, "publicationId");
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
    const publicationId = readRequiredString(args, "publicationId");
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
    const publicationId = readRequiredString(args, "publicationId");
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
    const publicationId = readRequiredString(args, "publicationId");
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
    const publicationId = readRequiredString(args, "publicationId");

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
    const publicationId = readRequiredString(args, "publicationId");
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
    const publicationId = readRequiredString(args, "publicationId");
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
    const publicationId = readRequiredString(args, "publicationId");
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
    const publicationId = readRequiredString(args, "publicationId");
    const senderId = readRequiredString(args, "senderId");

    const result = await callTrpc<SenderMutationResult>(
      "publication.senderSetDefault",
      { publicationId, senderId },
      options
    );

    return makeToolResult(`Default sender set: ${result.sender?.email ?? senderId}`, result);
  }

  if (toolName === "sender.delete") {
    const publicationId = readRequiredString(args, "publicationId");
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
    const publicationId = readRequiredString(args, "publicationId");
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
    const publicationId = readRequiredString(args, "publicationId");
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
    const publicationId = readRequiredString(args, "publicationId");
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
    const publicationId = readRequiredString(args, "publicationId");
    const csvText = readRequiredString(args, "csvText");

    const result = await callTrpc<ContactImportCsvResult>(
      "contact.importCsv",
      {
        publicationId,
        csvText
      },
      options
    );

    return makeToolResult(
      `Contact import complete for ${publicationId}: +${result.createdCount} new, ${result.reactivatedCount} reactivated, ${result.invalidCount} invalid`,
      result
    );
  }

  if (toolName === "contact.referral_summary") {
    const publicationId = readRequiredString(args, "publicationId");
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
    const publicationId = readRequiredString(args, "publicationId");
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
    const publicationId = readRequiredString(args, "publicationId");
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
    const publicationId = readRequiredString(args, "publicationId");
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
    const publicationId = readRequiredString(args, "publicationId");
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
    const publicationId = readRequiredString(args, "publicationId");
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
    const publicationId = readRequiredString(args, "publicationId");
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
    const publicationId = readRequiredString(args, "publicationId");
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
    const publicationId = readRequiredString(args, "publicationId");
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
    const publicationId = readRequiredString(args, "publicationId");
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
    const publicationId = readRequiredString(args, "publicationId");
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
    const publicationId = readRequiredString(args, "publicationId");
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
    const publicationId = readRequiredString(args, "publicationId");
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
    const publicationId = readRequiredString(args, "publicationId");
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
    const publicationId = readRequiredString(args, "publicationId");
    const presetId = readRequiredString(args, "presetId");

    const result = await callTrpc<SectionImportResult>(
      "section.importPack",
      {
        publicationId,
        presetId
      },
      options
    );

    return makeToolResult(
      `Imported pack ${result.presetId}: ${result.createdCount} created, ${result.updatedCount} updated`,
      result
    );
  }

  if (toolName === "section.create") {
    const publicationId = readRequiredString(args, "publicationId");
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
    const publicationId = readRequiredString(args, "publicationId");
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
    const publicationId = readRequiredString(args, "publicationId");
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
    const publicationId = readRequiredString(args, "publicationId");
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
    const publicationId = readRequiredString(args, "publicationId");
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
    const publicationId = readRequiredString(args, "publicationId");
    const issueId = readRequiredString(args, "issueId");
    const range = readIssueAnalyticsRange(args, "range") ?? "all";
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
    const publicationId = readRequiredString(args, "publicationId");
    const issueId = readRequiredString(args, "issueId");
    const range = readIssueAnalyticsRange(args, "range") ?? "all";
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
    const publicationId = readRequiredString(args, "publicationId");
    const issueId = readRequiredString(args, "issueId");
    const range = readIssueAnalyticsRange(args, "range") ?? "all";
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
    const publicationId = readRequiredString(args, "publicationId");
    const issueId = readRequiredString(args, "issueId");
    const range = readIssueAnalyticsRange(args, "range") ?? "all";
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
    const publicationId = readRequiredString(args, "publicationId");
    const issueId = readRequiredString(args, "issueId");
    const range = readIssueAnalyticsRange(args, "range") ?? "all";
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
            issue,
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
            issue,
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
    const publicationId = readRequiredString(args, "publicationId");
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

    return makeToolResult("AI draft generated", draft);
  }

  if (toolName === "template.create") {
    const publicationId = readRequiredString(args, "publicationId");
    const name = readRequiredString(args, "name");
    const html = asOptionalString(args.html);
    const spec = args.spec as Record<string, unknown> | undefined;
    const description = asOptionalString(args.description);
    const text = asOptionalString(args.text);
    const subject = asOptionalString(args.subject);
    const from = asOptionalString(args.from);
    const replyTo = asOptionalString(args.reply_to);
    const variables = args.variables as Array<{ key: string; type: string; fallback_value?: unknown }> | undefined;

    if (!html && !spec) {
      throw new Error("Either 'html' or 'spec' must be provided");
    }

    const body: Record<string, unknown> = {
      publication_id: publicationId,
      name,
      ...(html ? { html } : {}),
      ...(spec ? { spec } : {}),
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
    const publicationId = readRequiredString(args, "publicationId");
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
    const publicationId = readRequiredString(args, "publicationId");
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
    const publicationId = readRequiredString(args, "publicationId");
    const templateId = readRequiredString(args, "templateId");
    const name = asOptionalString(args.name);
    const html = asOptionalString(args.html);
    const spec = args.spec as Record<string, unknown> | undefined;
    const description = asOptionalString(args.description);
    const text = asOptionalString(args.text);
    const subject = asOptionalString(args.subject);
    const from = asOptionalString(args.from);
    const replyTo = asOptionalString(args.reply_to);
    const variables = args.variables as Array<{ key: string; type: string; fallback_value?: unknown }> | undefined;

    const body: Record<string, unknown> = {
      ...(name ? { name } : {}),
      ...(html ? { html } : {}),
      ...(spec ? { spec } : {}),
      ...(description ? { description } : {}),
      ...(text ? { text } : {}),
      ...(subject ? { subject } : {}),
      ...(from ? { from } : {}),
      ...(replyTo ? { reply_to: replyTo } : {}),
      ...(variables ? { variables } : {})
    };

    const template = await callRestApi<Record<string, unknown>>(
      "PATCH",
      `/v1/templates/${encodeURIComponent(templateId)}?publication_id=${encodeURIComponent(publicationId)}`,
      body,
      options
    );

    return makeToolResult(`Template updated: ${template.id}`, { template });
  }

  if (toolName === "template.publish") {
    const publicationId = readRequiredString(args, "publicationId");
    const templateId = readRequiredString(args, "templateId");

    const template = await callRestApi<Record<string, unknown>>(
      "POST",
      `/v1/templates/${encodeURIComponent(templateId)}/publish?publication_id=${encodeURIComponent(publicationId)}`,
      undefined,
      options
    );

    return makeToolResult(`Template published: ${template.id} (${template.status})`, { template });
  }

  if (toolName === "template.duplicate") {
    const publicationId = readRequiredString(args, "publicationId");
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
    const publicationId = readRequiredString(args, "publicationId");
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
    for (const required of ["to", "subject"] as const) {
      if (body[required] === undefined) {
        throw new Error(`Missing required field: ${required}`);
      }
    }
    // Exactly one of from / sender_id (mirrors sendEmailSchema's refine in
    // packages/contracts). Caught here so an agent gets a clear message before
    // the round-trip instead of a generic 400 from the REST endpoint.
    if ((body.from === undefined) === (body.sender_id === undefined)) {
      throw new Error("Provide exactly one of 'from' or 'sender_id'.");
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

    return makeToolResult(
      `Email ${id}: ${String(email.last_event ?? "unknown")} (opens ${String(
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
    for (const key of ["status", "tag_name", "tag_value", "from_date", "to_date"] as const) {
      const value = asOptionalString(args[key]);
      if (value) params.set(key, value);
    }

    const qs = params.toString();
    const result = await callRestApi<{
      data: Array<Record<string, unknown>>;
      total: number;
      has_more: boolean;
    }>("GET", `/v1/emails${qs ? `?${qs}` : ""}`, undefined, options);

    const lines = result.data.map(
      (email) =>
        `${String(email.id)}: ${String(email.last_event)} — ${String(email.subject)} → ${String(email.to)}`
    );
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
    const publicationId = readRequiredString(args, "publicationId");
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
    const publicationId = readRequiredString(args, "publicationId");
    const name = readRequiredString(args, "name");
    const purpose = asOptionalString(args.purpose);
    const isPrimary = readOptionalBoolean(args, "is_primary");
    const result = await callRestApi<{ id: string; name: string; status: string; records: unknown[] }>(
      "POST",
      "/v1/domains",
      {
        publication_id: publicationId,
        name,
        ...(purpose ? { purpose } : {}),
        ...(isPrimary !== undefined ? { is_primary: isPrimary } : {})
      },
      options
    );
    return makeToolResult(
      `Domain ${result.name} created (${result.status}). Add the DNS records, then call domain.verify.`,
      result
    );
  }

  if (toolName === "domain.list") {
    const publicationId = readRequiredString(args, "publicationId");
    const limit = readOptionalNumber(args, "limit");
    const params = new URLSearchParams({ publication_id: publicationId });
    if (limit !== undefined) params.set("limit", String(limit));
    const result = await callRestApi<{ data: unknown[] }>(
      "GET",
      `/v1/domains?${params.toString()}`,
      undefined,
      options
    );
    return makeToolResult(`${result.data.length} domain(s).`, result);
  }

  if (toolName === "domain.get") {
    const publicationId = readRequiredString(args, "publicationId");
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
    const publicationId = readRequiredString(args, "publicationId");
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
    const publicationId = readRequiredString(args, "publicationId");
    const domainId = readRequiredString(args, "domainId");
    const purpose = asOptionalString(args.purpose);
    const isPrimary = readOptionalBoolean(args, "is_primary");
    const result = await callRestApi<{ id: string; name: string; purpose: string }>(
      "PATCH",
      `/v1/domains/${encodeURIComponent(domainId)}?publication_id=${encodeURIComponent(publicationId)}`,
      {
        ...(purpose ? { purpose } : {}),
        ...(isPrimary !== undefined ? { is_primary: isPrimary } : {})
      },
      options
    );
    return makeToolResult(`Domain ${result.name} updated (purpose: ${result.purpose}).`, result);
  }

  if (toolName === "domain.delete") {
    const publicationId = readRequiredString(args, "publicationId");
    const domainId = readRequiredString(args, "domainId");
    const result = await callRestApi<{ id: string }>(
      "DELETE",
      `/v1/domains/${encodeURIComponent(domainId)}?publication_id=${encodeURIComponent(publicationId)}`,
      undefined,
      options
    );
    return makeToolResult(`Domain ${result.id} deleted.`, result);
  }

  // --- Tracking sub-domains -------------------------------------------------
  if (toolName === "domain.tracking_create") {
    const publicationId = readRequiredString(args, "publicationId");
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
    const publicationId = readRequiredString(args, "publicationId");
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
    const publicationId = readRequiredString(args, "publicationId");
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
    const publicationId = readRequiredString(args, "publicationId");
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
    const publicationId = readRequiredString(args, "publicationId");
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
    const publicationId = readRequiredString(args, "publicationId");
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
    const publicationId = readRequiredString(args, "publicationId");
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
    const publicationId = readRequiredString(args, "publicationId");
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
    const publicationId = readRequiredString(args, "publicationId");
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
    const publicationId = readRequiredString(args, "publicationId");
    const name = readRequiredString(args, "name");
    const description = asOptionalString(args.description);
    const statusFilter = asOptionalString(args.status_filter);
    const queryFilter = asOptionalString(args.query_filter);
    const result = await callRestApi<{ id: string; name: string }>(
      "POST",
      "/v1/segments",
      {
        publication_id: publicationId,
        name,
        ...(description !== undefined ? { description } : {}),
        ...(statusFilter ? { status_filter: statusFilter } : {}),
        ...(queryFilter !== undefined ? { query_filter: queryFilter } : {})
      },
      options
    );
    return makeToolResult(`Segment ${result.name} created (${result.id}).`, result);
  }

  if (toolName === "segment.list") {
    const publicationId = readRequiredString(args, "publicationId");
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
    const publicationId = readRequiredString(args, "publicationId");
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
    const publicationId = readRequiredString(args, "publicationId");
    const segmentId = readRequiredString(args, "segmentId");
    const name = asOptionalString(args.name);
    const description = asOptionalString(args.description);
    const result = await callRestApi<{ id: string; name: string }>(
      "PATCH",
      `/v1/segments/${encodeURIComponent(segmentId)}?publication_id=${encodeURIComponent(publicationId)}`,
      {
        ...(name ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        // status_filter / query_filter are nullable: forward an explicit null
        // to CLEAR the filter, a value to set it, and omit the key entirely
        // (absent from args) to leave it unchanged.
        ...("status_filter" in args ? { status_filter: args.status_filter } : {}),
        ...("query_filter" in args ? { query_filter: args.query_filter } : {})
      },
      options
    );
    return makeToolResult(`Segment ${result.id} updated.`, result);
  }

  if (toolName === "segment.delete") {
    const publicationId = readRequiredString(args, "publicationId");
    const segmentId = readRequiredString(args, "segmentId");
    const result = await callRestApi<{ id: string }>(
      "DELETE",
      `/v1/segments/${encodeURIComponent(segmentId)}?publication_id=${encodeURIComponent(publicationId)}`,
      undefined,
      options
    );
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
    const publicationId = readRequiredString(args, "publicationId");
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
    const publicationId = readRequiredString(args, "publicationId");
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
    const publicationId = readRequiredString(args, "publicationId");
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
    const publicationId = readRequiredString(args, "publicationId");
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

  // --- Tag definitions ------------------------------------------------------
  if (toolName === "tag.create") {
    const publicationId = readRequiredString(args, "publicationId");
    const name = readRequiredString(args, "name");
    const defaultSubscription = asOptionalString(args.default_subscription);
    if (defaultSubscription !== "opt_in" && defaultSubscription !== "opt_out") {
      throw new Error("'default_subscription' must be 'opt_in' or 'opt_out'.");
    }
    const description = asOptionalString(args.description);
    const visibility = asOptionalString(args.visibility);
    const result = await callRestApi<{ id: string; name: string }>(
      "POST",
      "/v1/tags",
      {
        publication_id: publicationId,
        name,
        default_subscription: defaultSubscription,
        ...(description !== undefined ? { description } : {}),
        ...(visibility ? { visibility } : {})
      },
      options
    );
    return makeToolResult(`Tag ${result.name} created (${result.id}).`, result);
  }

  if (toolName === "tag.list") {
    const publicationId = readRequiredString(args, "publicationId");
    const limit = readOptionalNumber(args, "limit");
    const params = new URLSearchParams({ publication_id: publicationId });
    if (limit !== undefined) params.set("limit", String(limit));
    const result = await callRestApi<{ data: unknown[] }>(
      "GET",
      `/v1/tags?${params.toString()}`,
      undefined,
      options
    );
    return makeToolResult(`${result.data.length} tag(s).`, result);
  }

  if (toolName === "tag.update") {
    const publicationId = readRequiredString(args, "publicationId");
    const tagId = readRequiredString(args, "tagId");
    const name = asOptionalString(args.name);
    const description = asOptionalString(args.description);
    const defaultSubscription = asOptionalString(args.default_subscription);
    const visibility = asOptionalString(args.visibility);
    const result = await callRestApi<{ id: string; name: string }>(
      "PATCH",
      `/v1/tags/${encodeURIComponent(tagId)}?publication_id=${encodeURIComponent(publicationId)}`,
      {
        ...(name ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(defaultSubscription ? { default_subscription: defaultSubscription } : {}),
        ...(visibility ? { visibility } : {})
      },
      options
    );
    return makeToolResult(`Tag ${result.id} updated.`, result);
  }

  if (toolName === "tag.delete") {
    const publicationId = readRequiredString(args, "publicationId");
    const tagId = readRequiredString(args, "tagId");
    const result = await callRestApi<{ id: string }>(
      "DELETE",
      `/v1/tags/${encodeURIComponent(tagId)}?publication_id=${encodeURIComponent(publicationId)}`,
      undefined,
      options
    );
    return makeToolResult(`Tag ${result.id} deleted.`, result);
  }

  // --- API keys (requires settings:write; cannot exceed caller's scopes) ----
  if (toolName === "api_key.create") {
    const name = readRequiredString(args, "name");
    const permission = asOptionalString(args.permission);
    const domainId = asOptionalString(args.domain_id);
    const result = await callRestApi<{ id: string; token: string }>(
      "POST",
      "/v1/api-keys",
      {
        name,
        ...(permission ? { permission } : {}),
        ...(domainId ? { domain_id: domainId } : {})
      },
      options
    );
    return makeToolResult(
      `API key ${result.id} created. Store this token now — it won't be shown again: ${result.token}`,
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

function readPrompt(name: string) {
  if (name === "newsletter.draft_from_brief") {
    return {
      description: "Create a newsletter draft from a short brief",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: "Write a concise newsletter with clear sections and one CTA."
          }
        }
      ]
    };
  }

  if (name === "newsletter.subject_line_pack") {
    return {
      description: "Generate subject line variants",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: "Generate 10 subject lines with varied tone and urgency."
          }
        }
      ]
    };
  }

  throw new Error(`Unknown prompt: ${name}`);
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
            version: "0.2.0"
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

        return response(id, readPrompt(promptName));
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
        const result = await runTool(toolName, args, options);
        return response(id, result);
      }

      case "notifications/initialized":
        return response(id, {});

      default:
        return error(id, -32601, "Method not found", { method: request.method });
    }
  } catch (err) {
    return error(id, -32000, toErrorMessage(err));
  }
}
