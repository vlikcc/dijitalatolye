---
version: 1
slug: "src-components-metadata-editor-tsx"
primary_target: "src/components/metadata-editor.tsx"
related_targets: ["src/components/upload-form.tsx", "src/components/curriculum-review.tsx", "src/components/version-detail.tsx", "src/app/globals.css"]
---

# Teacher metadata and curriculum review

**Scoped supersession — 27 October 2026:** [src-app-globals-css.md](src-app-globals-css.md) and root [DESIGN.md](../../DESIGN.md) replace lavender/violet host colours with neutral/navy tokens, including upload-step emphasis. The 190px task navigation now moves into the header menu below 1100px; workspace reports are flat sections and review panels retain mounted drafts. The metadata/evidence workflow remains unchanged. Current technical captures and role boundaries are recorded in [UNIFIED-EXPERIENCE.md](../../docs/UNIFIED-EXPERIENCE.md); older palette and 900px-sidebar statements below describe the prior revision.

Mode: Operate. Ordinary extension of the incumbent Keşif Atlası system. Preserve the approved light palette, Manrope headings, Source Sans 3 interface text, native controls, and teacher workspace shell. This surface introduces no replacement world, image composition, or design seed.

## Task and flow

The teacher uploads an HTML or ZIP package first, checks the metadata read from its static contents after scanning, saves a draft or confirms it for editorial review. An optional screenshot remains a native file input. The three written upload steps identify the current step with violet, weight, underline, and `aria-current`.

The metadata editor shows title, teacher description, grade, and subject before the optional curriculum fieldset. Extraction evidence stays next to the relevant field as its source file and location. Program, school type, and curriculum applicability are explicit choices and statuses. An outcome relationship is optional; an unavailable program or unsuccessful search explains how to continue without one.

The editor review keeps official-source verification separate from the educational publication decision. Source inspection exposes program context, process components, PDF page references, the stored PDF, and the official source link. Verification requires a written note and confirmation. The later decision form records educational suitability and any excluded outcome relationships.

## Implemented states

- Upload: empty required package, optional screenshot, disabled fields while uploading, labelled progress, saving text, and inline failure feedback.
- Metadata: extracted or incomplete draft, expandable extraction warnings, curriculum loading, no available program, no results, candidate evidence and process details, selected outcomes with removal, draft saved, submit/save busy, and inline errors.
- Source status: candidates and selected outcomes share the same written labels. A package's “verified” status still says local source review is pending; only local editor verification receives the confirmed label. The selection list retains this distinction after search results disappear.
- Applicability: a catalog record may be in force, published but not yet in force, or unresolved for the selected scope. The wording describes the catalog evidence without claiming automatic educational approval.
- Review: no outcome selected, pending or locally verified source, expanded source evidence, source load/save feedback, relationship exclusion, and publication decision feedback. Native disabled states constrain the corresponding controls while a save is in progress.
- Version detail: written lifecycle status, scanner report, entrypoint choice when needed, teacher metadata editing, retained extraction evidence after submission, clean-scan preview, review controls, and collapsible file/version details.

These states are recorded from component source. The captures below demonstrate the rendered upload, populated draft with a selected pending outcome, and expanded source review; they do not independently demonstrate every transient state or replace interaction testing.

## Existing visual rules applied

Use `DESIGN.md` as the global token authority. This extension reuses the lavender canvas (`background`), navy ink (`foreground`), muted supporting text, white controls/surfaces, violet primary actions, and existing border and notice/error/warning pairs. It adds no palette or font family.

Headings inherit Manrope; body copy and controls inherit Source Sans 3. The established buttons retain their 46px minimum height, 9px radius, 16px semibold text, primary/outline hierarchy, and shared visible focus outline. Native form controls retain the white fill, stronger input stroke, and 7px radius. Disabled buttons retain the existing 0.55 opacity treatment.

The teacher workspace retains its 190px sidebar, 44px column gap, and collapse at 900px. The metadata form locally allows 800px width; other operational forms retain the existing 720px cap. Form gaps remain 22px, and paired fields stack at the existing 600px breakpoint. At that same breakpoint, upload steps stack and metadata actions become full-width rows.

The curriculum fieldset uses a quiet one-pixel input border, a 12px corner radius, 22px padding, and 18px internal gaps; mobile padding becomes 16px by 12px. Outcome rows use separators and whitespace. Evidence quotations use the existing canvas, border, 8px radius, and compact text. These are local surface arrangements, not new global component tokens.

Source links are underlined at rest, thicken their underline on hover, and use the shared keyboard focus treatment. Source certainty remains written text beside the outcome. No decorative elevation, new motion, or imagery is introduced by the host workflow. Uploaded game previews keep their own isolated presentation and do not define host-interface tokens.

## Evidence and documentation boundary

Checked `PRODUCT.md`, `DESIGN.md`, `.impeccable/design.json`, `.impeccable/direction.md`, the four component sources named above, shared form/control styles, and the metadata/curriculum rules at the end of `src/app/globals.css`.

Opened all eight supplied captures: `.impeccable/review/upload-mobile.png`, `metadata-360.png`, `metadata-768.png`, `metadata-1440.png`, `curriculum-review-360.png`, `curriculum-review-768.png`, `curriculum-review-1440.png`, and `teacher-desktop.png` (all under `.impeccable/review/`). The metadata and review captures cover 360px, 768px, and 1440px widths and show the incumbent palette, controls, and responsive layout.

The supplied independent verdict is `ship` at the scope of four corrections scored resolved: selected-outcome status, field provenance, source-link underline, and disabled save controls. This brief records that scope; it does not claim a new whole-surface review.

`DESIGN.md` and `.impeccable/design.json` are preserved. Pre-existing sidecar drift is not canonized or repaired here: its contained-elevation/featured-shadow descriptions still assign a hover shadow to the featured card, while current `DESIGN.md` describes a border-only hover. Refreshing that unrelated system documentation is outside this extension.
