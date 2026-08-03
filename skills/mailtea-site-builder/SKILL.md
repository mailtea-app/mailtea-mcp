---
name: mailtea-site-builder
description: Design and build a newsletter's public website with Mailtea's Website Builder over MCP — compose pages from section presets, set the theme, follow the operator's design brief, clone the style of a reference site, and preview before publishing. Use when the user wants to build, redesign, restyle, or clone the look of their Mailtea site.
---

# Mailtea Website Builder

Every Mailtea publication has exactly one public website — a home page, an
archive, a post layout, and whatever custom pages the operator adds. This skill
is how you design it.

You are editing a **structured document**, not HTML. There is no CSS file, no
class names, no markup. A page is a tree of typed blocks, and every visual
property is either linked to a theme token or set to a literal. That constraint
is the point: the operator can keep editing everything you build in the visual
builder, and re-theming the site later re-themes your work with it.

Two rules before anything else:

1. **Read `site.get` first.** It carries the operator's **design brief** — their
   standing instruction for how this site should look. Follow it strictly. It
   outranks your own taste and anything in the "craft rules" below.
2. **Never call `site.publish` unless the user explicitly asked to publish.**
   All your writes land on the draft. The operator previews and ships it.

## The document model

```
Account → Team → Publication → one Site → pages → sections → blocks
```

A page document:

```json
{ "version": 3, "sections": [ { "id": "sec_1", "type": "section", "blocks": [ ... ] } ] }
```

- **Sections** are the horizontal bands of the page, top to bottom. A section is
  `{id, type:"section", blocks:[]}` plus optional `style` / `layout`.
- **Blocks** are discriminated on `type`. There are 18:
  - text: `heading` (`level` 1-6, `text`), `text` (`text`), `richText` (`html`)
  - action: `button` (`label`, `href`), `link` (`label`, `href`)
  - media: `image` (`src`, `alt`, `href?`), `embed` (`html`, sandboxed), `icon` (`name`, `sizePx`)
  - spacing: `divider`, `spacer` (`heightPx`)
  - forms: `subscribeForm` (`headline`, `body`, `buttonText`, `placeholder`, `successMessage`),
    `contactForm`, `unsubscribeForm`
  - posts: `postCollection` (the feed — `arrangement`, `limit`, `columns`, `dataSource`,
    `card`), `postHeader`, `postBody` (both only meaningful on the post layout page)
  - containers: `group` (`direction`, `children[]`), `columns` (`columns[i].widthFr`,
    `columns[i].blocks[]`)
- **Containers** are the only nesting: `section.blocks`, `group.children`,
  `columns.columns[i].blocks`. Everything else is a leaf.
- **Every style/layout property is a themed value**: `{"ref":"palette.accent"}`
  links it to the theme, `{"value":24}` pins it to a literal.
  **Prefer `{ref}`** — a site built on refs re-themes coherently; a site built on
  literals is a pile of hardcoded colors that drift the moment the palette changes.
- `style` holds text/surface properties (textColor, fontFamily, fontSizePx,
  fontWeight, lineHeightPct, letterSpacingPx, textAlign, textTransform,
  highlightColor, background). `layout` holds the box (paddingTop/Right/Bottom/LeftPx,
  align, widthMode, widthPx, maxWidthPx, gapPx, borderColor, borderWidthPx, radiusPx).
- **Limits**: 40 sections per page, 50 children per container, 200 nodes per page.
  Exceeding them is refused, not silently trimmed.

Page `kind` matters: `home`, `archive`, `custom` are ordinary pages; `post` is the
**layout frame** wrapped around every published post (edit it to restyle all
posts at once, don't put one post's content in it); `unsubscribe` and
`unsubscribe_success` are system pages that must keep their `unsubscribeForm`.

## The 12 theme tokens

These are the entire theme. `set_theme` writes them; every `{ref}` reads them.

| Token | Meaning |
|---|---|
| `palette.pageBg` | Page background, `#rrggbb`. |
| `palette.surfaceBg` | Card/band surface background, `#rrggbb`. |
| `palette.text` | Primary body text, `#rrggbb`. |
| `palette.muted` | Secondary/muted text, `#rrggbb`. |
| `palette.accent` | Accent for buttons and links, `#rrggbb`. |
| `palette.accentText` | Text drawn on top of the accent, `#rrggbb`. |
| `palette.border` | Hairline border, `#rrggbb`. |
| `typography.headingFont` | Heading font stack, e.g. `'Source Serif 4', Georgia, serif`. |
| `typography.bodyFont` | Body font stack, e.g. `'Space Grotesk', system-ui, sans-serif`. |
| `typography.baseSizePx` | Base body size in px (12-22). |
| `theme.radiusPx` | Corner radius in px (0-48). |
| `theme.contentWidthPx` | Content column width in px (480-1280). |

Font stacks must read well **on their system fallback alone** — the preview does
not load webfonts. Always end a stack with a real system family. The pairings the
product ships (safe defaults to copy):

`'Source Serif 4', Georgia, serif` + `'Space Grotesk', system-ui, sans-serif` ·
all-sans `'Space Grotesk'` + `'Inter'` · all-serif `'Source Serif 4'` ·
mono-accent `'JetBrains Mono', ui-monospace, Menlo, monospace` + `'Inter'` ·
editorial `Georgia, 'Times New Roman', serif` + `ui-sans-serif, system-ui` ·
bookish `Palatino, 'Book Antiqua', Georgia, serif` · humanist `'Trebuchet MS', Verdana`.

## Workflow protocol

1. **`site.get`** — read the design brief (follow it), the current design, and
   `draftVersion`. Every write passes the last `draftVersion` back as `baseVersion`.
2. **`site.pages_list` / `site.page_get`** — see what exists before changing it.
   `site.page_get` returns the draft-coalesced document with real node ids; those
   ids are what `edit_copy`, `edit_style` and `arrange` address.
3. **`site.presets_list`** — the curated Section Library, with each preset's
   **slots**. Compose from presets. Hand-authoring raw blocks through
   `site.page_upsert` is the fallback for what presets genuinely cannot express,
   not the default — presets are designed, responsive, and theme-linked already.
4. **`site.apply_ops`** — every change. Pass `baseVersion` on every write.
   **Read the report.** On `CONFLICT` ("site draft changed elsewhere") someone
   wrote in between: re-read with `site.get` + `site.page_get`, rebuild the batch
   against the new document, and only then retry. Never retry a batch blind — its
   node ids may no longer exist.
5. **Preview.** All writes are on the DRAFT; the public site is unchanged.
   The authenticated preview is `/site/preview` in Mailtea Studio
   (`https://studio.mailtea.app/site/preview`, or `http://localhost:3052/site/preview`
   in dev); a specific page is `/site/preview/<slug>`. Screenshot it and look at it.
6. **Stop.** Tell the user what you built and let them publish — unless they
   explicitly asked you to publish, in which case `site.publish`.

`site.discard_draft` throws away **everyone's** unpublished work, not just yours.
Confirm before calling it.

### Composing does not tell you the node ids

`insert_section` and `compose_page` mint fresh ids for everything they create.
The report does not list them. To edit what you just composed, call
`site.page_get` again and read the ids out of the document.

## The total-parser gotcha — read this twice

`site.page_upsert` writes a whole document through a **total parser**: it accepts
anything and returns something valid. Unknown properties are dropped, out-of-range
values are clamped, overflow past the caps is discarded, malformed blocks vanish —
**silently, with a 200 response**. A successful `site.page_upsert` is *not*
evidence that your document was stored as sent. If you use it, read the page back
with `site.page_get` and diff it against what you sent, and say so in your report
to the user.

`site.apply_ops` is the safe path, and the reason is exactly this. Its report
names what happened:

```json
{ "applied": 2,
  "skipped": [ { "opIndex": 1, "op": "insert_section",
                 "reason": "unknown_preset", "detail": "no section preset \"hero-big\"" } ] }
```

A skip is not an error — `applied: 2` with one skip means two ops landed and one
did not, and the response is still a success. **The report is the only place a
refused edit is named.** If you ignore it, you will tell the user you built
something you did not build.

Skip reasons and what each is telling you:

| Reason | Fix |
|---|---|
| `unknown_preset` | The id isn't in the library. Call `site.presets_list`. |
| `unknown_node` | That node id isn't in the document. Re-read `site.page_get`. |
| `unknown_slot_key` | The preset declares no such copy slot. Read its `slots`. |
| `unknown_slot_field` | That node has no such writable field (e.g. `href` on a heading). |
| `copy_shape_mismatch` | A string for a repeat slot, or item maps for a value slot. |
| `repeat_out_of_bounds` | Item count outside the repeat slot's min/max; it was clamped. |
| `value_too_long` | Over the field's limit. **Refused, never truncated** — shorten it. |
| `bad_index` | Index outside the destination list. |
| `page_full` | At the 40-section / 50-child / 200-node cap. Remove before adding. |
| `unknown_token` / `bad_token_value` | Not one of the 12 tokens, or not a valid color / font stack / in-range number. |
| `unknown_style_prop` | Not a real style/layout property. See the model above. |
| `not_a_container` / `cycle` | Illegal move target, or a move into the node's own subtree. |
| `extract_failed` | `swap_section` carried no copy across — pass `fromPresetId`. |
| `invalid_op` | The op didn't parse. `detail` has the field trail. |

## Craft rules

- **One idea per section.** If a section needs two headlines, it is two sections.
- **Typographic hierarchy is the design.** One `h1` per page, and a real size and
  weight gap between levels — not 32px next to 28px.
- **Whitespace carries rhythm.** Generous, *consistent* section padding
  (64-96px vertical on desktop-width content) beats decorative dividers. Vary
  spacing to group related things, not at random.
- **Token refs over literals** — always, unless the design genuinely needs a
  one-off. Literal colors are how a site stops being re-themeable.
- **Restrained palette.** One accent. Status and emphasis come from weight and
  spacing before color.
- **Concrete, active copy.** "Weekly field notes on shipping infrastructure" beats
  "Welcome to my newsletter". No hype words, no exclamation marks, no
  "revolutionary". Say what the reader gets and how often.
- **Fewer, better sections.** A home page that lands is usually hero → posts →
  subscribe, maybe with about or a quote. Five strong sections beat eleven filler
  ones; length is not effort.
- **Every image needs real `alt`.** Use `site.asset_list` for URLs that exist —
  never invent an image URL, it will render broken.
- **One clear primary action per screenful**, and it is almost always "subscribe".
- **Check the small viewport.** `columns` stack on mobile; a four-column row of
  long headings is unreadable there.

## Cloning a reference site

When the user points at a site they want theirs to look like: this is **style
transfer onto Mailtea's block system, not pixel cloning**. You extract the visual
direction — palette, type, density, section rhythm — and rebuild it from presets.
The result looks like the reference and stays fully editable in the builder.
Say that plainly to the user up front; do not promise a pixel copy.

Do not copy their content. Copy the *look*; write the words for this publication.

1. **Recon.** Use your own browser/screenshot tools on the reference. Capture the
   home page at desktop and mobile width, plus one inner page. Extract computed
   values, don't eyeball them: background and text colors, the accent used on
   buttons and links, border color, `font-family` on headings vs body, base font
   size, border radius, and the max width of the content column.
2. **Map onto the 12 tokens.** Backgrounds → `palette.pageBg` / `palette.surfaceBg`;
   body copy → `palette.text`, secondary → `palette.muted`; the button fill →
   `palette.accent` with its label color → `palette.accentText`; hairlines →
   `palette.border`. Fonts → the **nearest shipped stack** (a webfont you cannot
   load renders as its fallback anyway, so pick the pairing whose *character*
   matches: serif display, all-sans, mono headings, bookish). Radius and content
   width → `theme.radiusPx` / `theme.contentWidthPx`, clamped to their ranges.
3. **Map sections to presets.** Walk the reference top to bottom and pick the
   closest preset per band (big statement + CTA → a hero; a feed of cards →
   `posts-grid` / `posts-list-*` / `posts-magazine`; a quote wall →
   `testimonial-trio`; a logo strip → `logos-row`; a sign-up band →
   `subscribe-centered` / `subscribe-band`). Fill each preset's copy slots. Where
   the reference has something with no preset, use the closest one rather than
   hand-authoring — or drop the band if it carries no meaning for a newsletter.
4. **Write the direction into the design brief** with `site.design_brief_set`:
   the palette hexes and what each is for, the font pairing, the spacing feel, the
   section order, and what to avoid. Clone once, stay on-brand forever — every
   later design turn reads this brief instead of re-deriving it.
5. **Compose** with `site.apply_ops` (`set_theme` first, then `compose_page`).
6. **Compare.** Screenshot `/site/preview` at the same widths and put it beside
   the reference. Fix the biggest gap first — usually type scale or section
   padding, rarely color. Iterate two or three passes, then stop and show the user.

## Worked example: a home page from scratch

```jsonc
// 1. Read the site. → draftVersion 4, designBrief "Warm, editorial, one accent.
//    Serif headlines. No stock photography." — that brief now governs every choice.
site.get { "publicationId": "pub_123" }

// 2. Read the library and note the slot keys you'll fill.
site.presets_list { "publicationId": "pub_123" }
// → hero-centered  slots: eyebrow, headline, body, ctaLabel, ctaHref
//   posts-grid     slots: headline
//   subscribe-centered slots: headline, body, formHeadline, formBody, ctaLabel
//   faq-list       slots: headline, items (repeat 2-8, item keys: question, answer)

// 3. Theme + compose in ONE batch, ops applied in order.
site.apply_ops {
  "publicationId": "pub_123",
  "baseVersion": 4,
  "ops": [
    { "op": "set_theme", "tokens": {
        "palette.pageBg": "#faf7f2", "palette.surfaceBg": "#ffffff",
        "palette.text": "#241f1b", "palette.muted": "#7b7369",
        "palette.accent": "#9a3412", "palette.accentText": "#ffffff",
        "palette.border": "#e7dfd4",
        "typography.headingFont": "'Source Serif 4', Georgia, serif",
        "typography.bodyFont": "'Space Grotesk', system-ui, sans-serif",
        "typography.baseSizePx": "17",
        "theme.radiusPx": "6", "theme.contentWidthPx": "760" } },
    { "op": "compose_page", "sections": [
        { "presetId": "hero-centered", "copy": {
            "eyebrow": "Every Tuesday",
            "headline": "Field notes on shipping infrastructure",
            "body": "One deep read a week on the systems behind working software — what broke, what fixed it, and what it cost.",
            "ctaLabel": "Read the latest", "ctaHref": "/archive" } },
        { "presetId": "posts-grid", "copy": { "headline": "Recent issues" } },
        { "presetId": "subscribe-centered", "copy": {
            "headline": "Get it in your inbox",
            "body": "Free, weekly, and easy to leave.",
            "formHeadline": "Join 4,200 engineers",
            "formBody": "No spam. Unsubscribe in one click.",
            "ctaLabel": "Subscribe" } } ] }
  ]
}
// → { "report": { "applied": 2, "skipped": [] },
//     "draftVersion": 5, "pageId": "sitep_home" }
// Two ops, no skips: the theme and all three sections landed. Carry
// draftVersion 5 into the next write.

// 4. Refine copy on a node you now need the id of.
site.page_get { "publicationId": "pub_123" }   // → real ids for every block

site.apply_ops {
  "publicationId": "pub_123", "baseVersion": 5,
  "ops": [ { "op": "edit_copy", "edits": [
      { "nodeId": "node_a1b2c3d4", "text": "Read the archive" } ] } ]
}
// → { "report": { "applied": 1, "skipped": [] }, "draftVersion": 6, ... }

// 5. Screenshot https://studio.mailtea.app/site/preview and look at it.
// 6. Report to the user: what you built, that it is on the DRAFT, and that
//    publishing is theirs to do.
```

A batch that comes back honest about a failure looks like this — and is still a
success response:

```jsonc
// → { "report": { "applied": 1, "skipped": [
//       { "opIndex": 1, "op": "insert_section", "reason": "unknown_preset",
//         "detail": "no section preset \"hero-massive\"" },
//       { "opIndex": 2, "op": "edit_copy", "reason": "value_too_long",
//         "detail": "button label max 120" } ] }, "draftVersion": 7 }
```

One section went in. The second preset does not exist — call `site.presets_list`
and pick a real one. The button label was **refused, not truncated** — shorten it
and send it again. Tell the user both things happened.

## Tools

| Tool | Use |
|---|---|
| `site.get` | Settings, design, **design brief**, `draftVersion`. Start here. |
| `site.pages_list` | Pages with ids, kinds, slugs, status. |
| `site.page_get` | One page's full draft document — the source of node ids. |
| `site.apply_ops` | Every edit: `set_theme`, `compose_page`, `insert_section`, `swap_section`, `edit_copy`, `edit_style`, `arrange`. |
| `site.presets_list` | The Section Library with slots. Read before composing. |
| `site.page_upsert` | Whole-document write. Last resort — see the parser warning. |
| `site.asset_list` | Real image URLs from the publication's library. |
| `site.design_brief_get` / `site.design_brief_set` | Read / write the standing design brief. |
| `site.publish` | Draft → live. **Only when explicitly asked.** |
| `site.discard_draft` | Throw away all unpublished edits. Confirm first. |

Setup, if the MCP server isn't connected yet:

```bash
claude mcp add mailtea -e MAILTEA_API_TOKEN=mt_pat_xxx -- npx -y mailtea-mcp
```

The token needs the **`site:write`** scope and an **editor, admin, or owner** role on the publication — a full-access key has both. Reading (`site.get`, `site.pages_list`, `site.presets_list`, `site.asset_list`) needs neither. If a write comes back `Insufficient role`, the token is read-only, send-only, or tied to a viewer-role member: say so and ask the operator for a key with Website Builder access rather than retrying.

Sending email rather than designing the site? Use the `mailtea` skill.
