---
name: "Dijital Oyun Atölyesi — Keşif Atlası"
description: "One neutral-paper and navy interface for discovery, play, accounts and role workspaces."
colors:
  primary: "#24344d"
  primary-hover: "#17263c"
  primary-foreground: "#fff"
  background: "#f6f7f9"
  foreground: "#24344d"
  muted: "#606a79"
  surface: "#fff"
  border: "#dde2e8"
  input-border: "#8a94a4"
  outline-border: "#dde2e8"
  interactive-hover: "#e8edf4"
  focus-ring: "#3b5f8c"
  scrollbar-thumb: "#8a94a4"
  danger: "#a53b40"
  math: "#7046d3"
  math-surface: "#eee7fc"
  turkish: "#a7464d"
  turkish-surface: "#fce9e7"
  science: "#0b7471"
  science-surface: "#dff2ed"
  life: "#865b18"
  life-surface: "#fcf0d8"
  other: "#62677c"
  other-surface: "#eeedf3"
  error-surface: "#f9e9e5"
  error-text: "#822f27"
  warning-surface: "#faefcf"
  warning-text: "#6e501c"
  badge-warning-surface: "#faedcb"
  badge-warning-text: "#644b13"
typography:
  display:
    fontFamily: "Manrope Variable, sans-serif"
    fontSize: "32px"
    fontWeight: 750
    lineHeight: 1.25
    letterSpacing: "-0.03em"
  display-mobile:
    fontFamily: "Manrope Variable, sans-serif"
    fontSize: "28px"
    fontWeight: 750
    lineHeight: 1.25
    letterSpacing: "-0.03em"
  brand-descriptor:
    fontFamily: "Manrope Variable, sans-serif"
    fontSize: "10px"
    fontWeight: 750
    lineHeight: 1.3
    letterSpacing: "0.16em"
  brand-name:
    fontFamily: "Manrope Variable, sans-serif"
    fontSize: "28px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Manrope Variable, sans-serif"
    fontSize: "27px"
    fontWeight: 750
    lineHeight: 1.3
    letterSpacing: "-0.025em"
  collection:
    fontFamily: "Manrope Variable, sans-serif"
    fontSize: "24px"
    fontWeight: 750
    lineHeight: 1.3
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Manrope Variable, sans-serif"
    fontSize: "19px"
    fontWeight: 750
    lineHeight: 1.35
    letterSpacing: "-0.02em"
  card-title:
    fontFamily: "Manrope Variable, sans-serif"
    fontSize: "18px"
    fontWeight: 750
    lineHeight: 1.35
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Source Sans 3, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.55
  card-body:
    fontFamily: "Source Sans 3, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Source Sans 3, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.55
  button:
    fontFamily: "Source Sans 3, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.55
  field:
    fontFamily: "Source Sans 3, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
  chip:
    fontFamily: "Source Sans 3, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.55
  meta:
    fontFamily: "Source Sans 3, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.55
  game-prompt:
    fontFamily: "Manrope Variable, sans-serif"
    fontSize: "23px"
    fontWeight: 700
    lineHeight: 1.4
  button-small:
    fontFamily: "Source Sans 3, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.55
rounded:
  demo-label: "4px"
  tag: "5px"
  field: "7px"
  chip: "8px"
  button: "9px"
  search: "10px"
  player-start: "12px"
  surface: "14px"
  circle: "50%"
spacing:
  "8": "8px"
  "12": "12px"
  "16": "16px"
  "18": "18px"
  "20": "20px"
  "22": "22px"
  "24": "24px"
  "28": "28px"
  "32": "32px"
  "40": "40px"
  "48": "48px"
  "64": "64px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.button}"
    rounded: "{rounded.button}"
    padding: "11px 20px"
  button-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    typography: "{typography.button}"
    rounded: "{rounded.button}"
    padding: "11px 20px"
  button-destructive:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.button}"
    rounded: "{rounded.button}"
    padding: "11px 20px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-outline-hover:
    backgroundColor: "{colors.interactive-hover}"
  button-ghost:
    textColor: "{colors.foreground}"
    typography: "{typography.button}"
    rounded: "{rounded.button}"
    padding: "11px 8px"
  button-ghost-hover:
    backgroundColor: "{colors.interactive-hover}"
  button-small:
    typography: "{typography.button-small}"
    padding: "6px 13px"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    typography: "{typography.field}"
    rounded: "{rounded.field}"
    padding: "11px 12px"
  shared-header:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    height: "76px"
  shared-header-mobile:
    height: "64px"
  catalog-search:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.search}"
    padding: "6px 7px 6px 16px"
    height: "56px"
  navigation:
    textColor: "{colors.foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.chip}"
    padding: "9px 14px"
  navigation-selected:
    backgroundColor: "{colors.interactive-hover}"
    textColor: "{colors.primary}"
  subject-tag:
    backgroundColor: "{colors.math-surface}"
    textColor: "{colors.math}"
    rounded: "{rounded.tag}"
    padding: "4px 10px"
  subject-tab:
    textColor: "{colors.muted}"
    typography: "{typography.chip}"
    padding: "9px 10px"
  subject-tab-selected:
    textColor: "{colors.foreground}"
  game-card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.surface}"
  save-button:
    textColor: "{colors.muted}"
    rounded: "{rounded.circle}"
    width: "44px"
    height: "44px"
  save-button-selected:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
  player:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.surface}"
  notice:
    backgroundColor: "{colors.interactive-hover}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.chip}"
    padding: "16px 18px"
    typography: "{typography.field}"
  notice-error:
    backgroundColor: "{colors.error-surface}"
    textColor: "{colors.error-text}"
  notice-warning:
    backgroundColor: "{colors.warning-surface}"
    textColor: "{colors.warning-text}"
  account-tabs:
    backgroundColor: "{colors.interactive-hover}"
    rounded: "{rounded.search}"
    padding: "4px"
  page-heading:
    textColor: "{colors.foreground}"
    typography: "{typography.display}"
---

# Design System: Dijital Oyun Atölyesi — Keşif Atlası

## Overview

**Creative North Star: "Keşif Atlası"**

Keşif Atlası is a bright, orderly workshop for finding, playing and managing short learning games. Neutral paper and navy ink now form one host interface across public discovery, game detail, accounts and every role workspace. White controls, real game scenes and written subject labels keep the next task visible.

Manrope gives headings and the live wordmark a clear, confident shape; Source Sans 3 keeps Turkish controls and explanations readable. The original four-piece circular puzzle mark remains the signature. Paper texture belongs to discovery, game detail and account introductions; operational workspaces stay flat. The host is light-only, including its short footer. Individual game documents retain their own content colours and layout.

**Key Characteristics:**

- One neutral ground, navy text and actions, white controls, and unchanged subject colour pairs across the host application.
- Locally served Manrope headings and brand lettering, with Source Sans 3 interface text and Turkish characters.
- Compact page headings, restrained game tools, flat task lists and selected workspace sections.
- Real game art, explicit Demo labels and the original puzzle signature with reduced-motion support.
- Visible keyboard focus, labelled navigation, preserved form drafts and responsive 4/2/1 catalogue columns.

This is the user-approved global extension of the accepted neutral-paper discovery world. Normative frontmatter is extracted from `src/app/globals.css`; `game-prompt` describes the unchanged bundled game document. The sidecar extends these tokens with source-derived behaviour and self-contained component previews. Its generated tonal ramps are display aids only. Current scope and verification are recorded in [docs/UNIFIED-EXPERIENCE.md](docs/UNIFIED-EXPERIENCE.md); older discovery and student-learning reviews remain historical evidence.

## Colors

### Primary

**Atlas navy** (`primary`, `primary-hover`) carries actions throughout the host application. `primary-foreground` is white text on the filled action. `focus-ring` is the shared visible keyboard outline. Root tokens now also cover portalled controls; catalogue-specific colour overrides are no longer a separate palette.

### Secondary

**Mathematics violet**, **Turkish coral**, **Science teal** and **Life Studies amber** retain their foreground/surface pairs (`math`, `turkish`, `science`, `life`). `other` and `other-surface` identify other subjects. These are content colours, not alternate account themes. The source applies them through `--subject` and `--subject-bg`. Bundled game answer states and the original puzzle pixels remain unchanged.

### Neutral

**Neutral paper** (`background`) is the shared canvas, including the footer. **White surface** (`surface`) holds controls, cards and the player. **Navy ink** (`foreground`) and **muted blue-grey** (`muted`) carry primary and supporting text. `border` and `outline-border` mark regions and outline actions; `input-border` marks editable controls. `interactive-hover` supplies selected navigation, notices and hovered controls; placeholders use `muted`.

`danger` belongs to destructive actions. Error, warning and warning-badge pairs retain their observed semantic colours and written messages. They do not replace the subject palette. The green publication and connection indicators remain local status treatments.

**The Subject Thread Rule.** Keep each subject’s colour and written label together across its tab, game card and detail metadata. Colour reinforces the label; it does not replace it.

**The Shared Ink Rule.** Use the same navy action and focus system in discovery, accounts and workspaces. Violet remains a Mathematics and bundled-game colour, not a second host theme.

## Typography

**Display and brand font:** Manrope Variable, with a generic sans-serif fallback. **Body and interface font:** Source Sans 3, with the same fallback. Existing technical identifiers use generic monospace.

The host imports local `@fontsource-variable/manrope` (5.3.0) and Source Sans 3 (5.3.1, 400/600), including Latin Extended. Bundled standalone demos embed these fonts and licences through `scripts/embed-demo-fonts.mjs` and `src/games/font-css.json`. The compatibility `--font-serif` alias points to the display font; the remaining Source Serif 4 dependency is not an active identity face.

### Hierarchy

- **Page/discovery/detail/account headings:** `display`, reduced to `display-mobile` at 600px. All use the compact 32/28px scale; the earlier large fluid h1 declaration is superseded by the shared application rule.
- **Wordmark:** `brand-descriptor` over `brand-name`; at 600px the descriptor/name become 8/23px, and the name becomes 21px at 360px. The footer uses a 22px navy name. The logo and live text keep fixed geometry during the signature.
- **Sections:** `headline` for general h2, `collection` for catalogue sections; workspace h2 is 22px and game information h2 is 17px. Body paragraphs cap at 72ch; metadata introductory copy at 65ch.
- **Titles:** `title` for h3 and `card-title` for desktop cards. Card titles become 16px at 1100px, 19px at 900px and 21px at 600px as the card grid changes.
- **Body and controls:** `body` is the page default; `card-body`, `button`, `button-small`, `field`, `label`, `chip` and `meta` describe the observed density. Compact size does not remove keyboard focus.
- **Game prompts:** `game-prompt` belongs to bundled iframe content; it is not the host page title scale. Uploaded packages retain their own typography.

## Layout

The centred container caps at 1400px with 48px horizontal padding, reducing to 32px at 1100px and 20px at 600px. The shared header is 76px tall, or 64px on phones. Below 1100px the labelled Menü contains both discovery links and the current role’s task links. The footer is a short light closure, stacking at 600px; the thin catalogue sharing invitation is shown only to anonymous visitors or accounts with creation capability.

Discovery preserves the compact title/search row, immediate grade/subject filters, result count and game cards. At 1024px and above the title and search share a row; the unfiltered introduction also shows up to three small real catalogue covers beside its copy. These decorative covers are absent below 1024px and for filtered, saved or empty results. Below 1024px the title and search stack. Below 768px two always-visible labelled selects replace desktop subject tabs. The game grid uses four columns, two at 900px and one at 600px; gaps are 25/22px, 20/16px at 1100px, 25px at 900px and 23px at 600px. The acceptance geometry is four full cards at 1440×900 and the first artwork/title at 390×844; counts come from actual filtered records.

The non-interactive paper layer is behind the header and introductory content of discovery, game detail and account forms. It repeats at 512×300px with grayscale, brightness 0.535, contrast 16, multiply blend, 5% opacity and a mask fading after 45%. Its normal height is 334px; discovery uses 450px at 1023px, 394px at 600px and 455px at 360px. A failed asset request leaves the plain neutral ground. Workspaces have no paper layer.

The shipping asset `public/textures/paper-001.webp` is 1024×600, 68,584 bytes, encoded at WebP quality 92 from ambientCG Paper001’s flat colour map without generative edits. CC0 provenance is in XMP and `public/textures/paper-001.webp.json`; preserve both. See the [recorded source](https://ambientcg.com/view?id=Paper001) and [recorded licence](https://docs.ambientcg.com/license/).

Login and registration share a composition capped at 1160px, with the introduction hidden below 1024px. Login opts into a white form surface and an inset navy showcase, using the existing radius and elevation. Its 36px desktop / 32px mobile heading and 52px fields support the compact form; the showcase uses white text, an amber heading accent and up to three layered real game covers. Native thumbnail buttons manually change the leading cover and its title/subject/grade/Demo caption without touching the form draft. They provide 48px targets, white focus outlines, aria-pressed and reduced-motion support. Unavailable artwork is omitted, including failures before hydration; the introduction and form remain. Registration now uses the same white form and navy showcase, with a single-line heading where space permits, tighter vertical rhythm for the longer teacher/student forms, and preserved role tabs and helper text. See [the current login delivery record](docs/LOGIN-SHOWCASE-DELIVERY.md) and [the account surface brief](.impeccable/surfaces/src-components-account-layout-tsx.md).

Game detail starts with the title and restrained save/share controls, followed by one wrapping metadata line; the heading aligns with the centred player at up to 1120px. A return link appears only when it preserves a search, filter or saved collection: “Sonuçlara dön” or “Kaydettiklerime dön”. Ordinary catalogue navigation uses the shared header. Cinema removes the player cap. Learning information follows in 2fr/1fr columns, becoming one column at 600px. Objectives and author appear only when supplied. The first teacher note stays visible; further notes use a native disclosure beneath it. There is no information sidebar or repeated header play CTA.

Workspaces use a 190px task navigation column and 44px gap. Below 1100px it is replaced by the same role links in the header menu. Content begins with a compact title, next action and the selected list/form. Forms cap at 720px; metadata forms allow 800px. Paired fields stack at 600px. Reports use explicitly labelled internal scrolling when their semantic tables exceed the available width. Admin sections fetch only selected data and retain server-side search and pagination.

## Elevation & Depth

White surfaces, neutral fills, thin borders and whitespace establish most depth. Catalogue cards stay flat and nested workspace report blocks use separators instead of stacked decorative panels.

- **Shared contained elevation:** `0 12px 28px rgb(36 52 77 / 9%)` is the root `--elevation`, used for menus, suggestions, player start panels, the requested login composition and transient feedback.
- **Bundled answer selection:** `inset 0 0 0 1px #7046d3` stays inside the existing demo documents. It is not a second host elevation token.

**The Contained Lift Rule.** Keep catalogue cards and workspaces flat at rest. Use the existing soft elevation for overlapping menus, the player start panel, the requested login composition and transient feedback.

## Shapes

The approved circular four-piece puzzle remains the signature. Rounded white surfaces use `surface`; fields, buttons and tags use the tighter component radii. Card artwork clips its top corners at 13px inside the 14px card; card save controls are circular. Boundaries are generally 1px, with dashed borders for empty states and file inputs. Interface icons remain inline SVG. Mathematical symbols and letters in educational scenes are content.

## Components

### Buttons and feedback

Primary, outline, ghost and destructive buttons use the normative assignments. Default buttons and form fields have 46px minimum heights, not fixed heights; compact variants override that minimum. The compact button family has 44px minimum height and width; its smaller text/padding remain `button-small`. Header navigation links, teacher-entry controls and menu toggles have 44px minimum targets. Card save controls are 44×44px; the password visibility control is 44px wide and fills the field inset by 1px per side. Account/review tabs and player toolbar controls also retain 44px minimum heights.

These measurements describe the documented family, not a universal target-size audit. Existing inline links/disclosures, search-clear, catalogue options and start controls have their own source sizing. Keep claims tied to the tested controls. The global focus outline is 3px in `focus-ring` with a 4px offset; clipped save/password/player tools use inward offsets. Disabled controls use 0.55 opacity and a not-allowed cursor. Button colour transitions use 160ms ease; the destructive variant has no separate hover colour. Notices are labelled text, with error alerts and status announcements in their owning components.

### Fields, search and account entry

Fields use white fill, an input stroke, `field` radius and padding. Textareas resize vertically. Labels remain visible; placeholders use muted ink. Search groups use a 2px focus ring with 2px offset and suppress the inner input outline. Suggestions combine a game image and readable metadata, open to the available side, and scroll within a bounded panel. Arrow keys move selection, Enter accepts and Escape dismisses without clearing the draft. Grade/subject changes apply immediately; text applies through Enter/Ara and retains unapplied text during filter changes.

Account forms are capped at 480px within the responsive login/registration composition described above; login and registration use the shared scoped white surface. `/giris` accepts email or student username; `/kayit` uses teacher/student tabs when learning is enabled. Tabs pair each role name with a short task explanation, keep their panels mounted, use arrow/Home/End keyboard selection, and retain draft fields. Registration feedback reflects the existing minimum of 12 password characters, and class-code help is associated with its field. Password visibility, busy states, duplicate-submit guards, verification/resend and recovery use the same field and feedback system. The role rules and safe return flow live in PRODUCT.md and the implementation record.

### Navigation and page headings

Desktop links use muted selected fills and navy text; state transitions take 180ms. The labelled mobile menu focuses the first link, returns focus with Escape and closes after outside interaction, focus departure, navigation or desktop reflow. The current workspace uses the same centrally defined role links on both sizes. PageHeading supplies the title, optional back link, description, status badge and actions; EmptyState supplies a short explanation of the next useful task.

Workspace review tabs keep hidden panels mounted so inspecting evidence does not discard assessment drafts. Student tasks select Ödevler, Oyunlar or Sınıflar; Hesap is a separate route. Admin tasks select users, definitions, publications, system operations or logs rather than showing every section on one page.

### Subject tags, cards, saving and sharing

Subject tabs pair a written label with a coloured icon and 2px underline; the all-games indicator is navy. Their current desktop minimum height is 42px; they become labelled selects below 768px. Small grade, Demo and operational badges are descriptive metadata. Cards show real game art, subject/grade information and a wrapping title, with duration when supplied and an aligned bottom metadata row. Long titles and metadata wrap without shrinking the direction arrow or merging the separate bookmark control into navigation. Hover and focus within the card emphasise its border and subject-coloured title without adding elevation; these short transitions are disabled for reduced motion.

Card bookmarks use a white circle and selected navy icon. Detail save/share actions are outlined compact controls with accessible names. Saving is browser-local storage for both visitors and signed-in users; Kaydettiklerim exposes that same browser's collection, not an account-synced profile list. Blocked storage shows a message. Paylaş opens a bounded nonmodal panel with link copying, WhatsApp and email composers, plus native device sharing when supported. Options retain the public game URL without search/return parameters; recipient and send remain the user's choice. The panel uses the existing surface, border, interactive-hover and focus tokens, 44px controls, Escape/outside/focus-leave dismissal and viewport-aware placement. Clipboard failure exposes a focused selectable link. Account-bound game progress is a separate SDK-backed feature.

### Player and motion

One start panel enters the player; standard, cinema and fullscreen modes retain the same iframe and progress. Legacy autostart still enters that session. The player has a 52px toolbar, subject-coloured stage and compact caption; height is bounded by the viewport: up to 620px desktop, 680px mobile, 820px cinema, with 16px space above and below. Fullscreen uses the viewport. Cinema dims the rest of the viewport with an 82% dark overlay while the player and its controls remain bright; exiting cinema or entering fullscreen removes the overlay. Cinema shows an X icon and a visible “Çıkış” label even on narrow screens. Clicking the dark overlay closes cinema and restores focus to the mode button without restarting the game; it does not activate the page beneath. The overlay is not printed. The stage keeps its height when play begins on desktop. On mobile, the non-playing preview is compact with the start action in normal flow; starting expands to the existing viewport-bounded playing height. Teacher information follows beneath it.

Preserve the original puzzle line-to-colour sequence once per document: tracing spans 0–300ms, colour reveals 200–800ms and the original raster returns at 900ms. Client navigation does not restart it; the footer is static. No-JavaScript and reduced-motion modes show the original mark. Existing control entrances use 150/160/180ms with `cubic-bezier(0.16, 1, 0.3, 1)`; reduced-motion CSS disables host animations and transitions. No decorative motion is added.

## Do's and Don'ts

### Do:

- Do use the shared neutral ground and navy controls for all host routes, while preserving subject and game colours.
- Do keep the original puzzle mark, once-per-document animation, real game captures and local CC0 paper asset with its provenance.
- Do use compact headings, written statuses, native form semantics, visible focus and the same role navigation in the sidebar and mobile menu.
- Do preserve mounted account/review panels, single-player continuity and the user’s draft while changing sections.
- Do distinguish browser-local bookmarks from account-bound game progress and provide a selectable link when copying fails.

### Don't:

- Don’t restore the superseded lavender/violet host palette, warm discovery palette, decorative puzzle gutters or Source Serif 4 headings.
- Don’t replace game scenes with invented covers or present bundled demos as published teacher uploads.
- Don’t introduce oversized workspace banners, nested decorative cards, a detail sidebar or a repeated play action.
- Don’t use Unicode glyphs or emoji as interface icons; keep the existing inline SVG vocabulary.
- Don’t treat preview tonal ramps as shipping tokens, impose host styling on uploaded games, or claim broad accessibility certification from the bounded checks.

## Non-home refinement · 27 October 2026

Recovery uses a compact white 480px form surface. Operational statuses pair a Lucide symbol with written state; positive, warning and error colours have dedicated `--status-*` tokens. Publication and draft state remain distinct. New action feedback follows actual request/clipboard completion, errors persist, and labels reserve their pending width. Long lists display their authorized total/range before rows. Existing FormOutline tracks the visible section without moving focus during scrolling. Cover previews reserve 720:440, and optional local selections are labelled as not uploaded. Workspace-only loading/error boundaries do not change the root homepage. The research and delivery records are in docs/21ST-NONHOME-RESEARCH-2026-10-27.md and docs/21ST-NONHOME-DELIVERY.md.
