---
version: 1
slug: "src-components-cover-editor-tsx"
primary_target: "src/components/cover-editor.tsx"
related_targets: ["src/components/assessment-form.tsx", "src/components/technical-report.tsx", "src/components/metadata-editor.tsx", "src/components/curriculum-review.tsx", "src/components/version-detail.tsx", "src/app/globals.css"]
---

# Teacher covers and human technical review

**Scoped supersession — 27 October 2026:** [src-app-globals-css.md](src-app-globals-css.md) and root [DESIGN.md](../../DESIGN.md) replace lavender/violet host colours with neutral/navy tokens and flat task sections. Review tabs keep assessment panels mounted. Yönetici (`editor`) retains teacher capabilities plus explicit review; Admin (`admin`) is inspection/administration/recovery only and cannot edit or approve. Cover provenance, subject colours, scan safety and human assessment requirements below remain unchanged. Current evidence is linked in [UNIFIED-EXPERIENCE.md](../../docs/UNIFIED-EXPERIENCE.md).

Mode: Operate. Ordinary extension of the incumbent Keşif Atlası system. Preserve the lavender canvas, navy text, violet actions, local Manrope headings, Source Sans 3 interface text, native controls, and existing teacher/editor workspace. The approved implementation is code-led; there is no separate comp, replacement visual world, or new design seed.

This brief extends `src-components-metadata-editor-tsx.md` for cover selection, static technical reports, and the required human assessment. Its cover flow records the current implementation where the older brief mentions an optional screenshot. Unrelated discovery, student-learning, and legacy application surfaces remain outside this brief.

## Task and flow

The teacher checks metadata extracted from the scanned package, optionally selects curriculum relationships, and chooses the game's cover before submitting that version. The cover fieldset follows the curriculum fields and precedes the version-freezing notice and save/submit actions. A current preview and written source label remain beside the available choices: upload a raster image, select a supported package image, or use the automatic information cover.

Cover precedence and processing are defined in `docs/TECHNICAL-REVIEW.md`: an explicit teacher choice precedes the manifest cover, a single supported root cover, and the information-cover fallback. The native upload control states PNG/JPG/WebP, a 5 MB limit, and no animated images. Package selection appears only when candidates exist; its action remains disabled until a file is selected. The automatic cover is a typographic representation of title, subject, and grade, with the existing subject colour and fixed subject icon. Its source is labelled “Otomatik kapak”; it is not presented as a gameplay screenshot. No AI image or browser execution of uploaded game code is part of cover generation.

Draft saving remains separate from submitting for review. Submission saves the current metadata, waits for the current cover, then submits the version. The nearby notice states that submitted information is frozen and later cover changes need a new review version. If rendering fails or remains unfinished, the written result explains how to continue; it must not suggest that submission completed.

The editor first sees the security scan and automatic technical report, then the submitted cover with its source label, retained extraction evidence, and isolated game preview. Curriculum source verification remains separate from assessment of the game's educational suitability. The publication form records five human judgments, each report-warning disposition, each selected outcome's game relationship, and the final decision with a teacher-facing note.

## Report and assessment hierarchy

The technical report uses a written complete, blocked, or incomplete status, followed by rule version, checked-file count, and the limits of the result. Native disclosures group findings into malware, package, resources, code policy, static accessibility, and coverage. Groups containing a blocking finding open initially. Each finding exposes a written severity, message, file/location/rule, available evidence, and remedy. A separate disclosure carries completed checks and limitations. This reporting surface describes static evidence; it does not award educational approval or an absolute safety/accessibility guarantee.

The “Eğitimsel değerlendirme” fieldset explicitly asks the editor to play the preview and states that the automatic report cannot replace these decisions. Its five judgments are:

- Bilimsel doğruluk.
- Yaşa ve sınıfa uygunluk.
- Eğitimsel kalite.
- Kullanılabilirlik ve erişilebilirlik.
- Kapak uygunluğu.

Each judgment has a native select and a labelled review-note textarea. All begin as “Değerlendirilemedi”; available decisions include suitable and revision required. Only scientific accuracy offers “Uygulanamaz: bilimsel iddia yok”. The accessibility hint names keyboard use, focus, readability, and dynamic screens as manual inspection tasks.

“Teknik rapor uyarıları” follows those five judgments. Each warning rule has its message, finding count, rule identifier, decision, and written reason. The decision begins as revision required; the alternatives record that the preview did not confirm the issue or that an explained limitation was accepted. A warning rationale belongs to its rule rather than to one generic accessibility note. The feature contract requires these dispositions and reasons and does not permit overriding a security block.

Each outcome then receives its own game-suitability fieldset and evidence/exclusion reason. Source verification is still a separate action with its own confirmation and note. The final decision begins as “Düzeltme iste”; “Onayla ve yayımla” remains an explicit choice. The documented publication contract requires suitable human judgments, with the scoped scientific-claim exception, and does not treat a package's source label as editor verification.

## Implemented states

- Cover: initial loading, no artifact/preparing placeholder, ready preview, generated/package/upload source labels, available or absent package candidates, pending render notice, warning, and inline error with selection/retry guidance. The fieldset is disabled during loading, an active selection request, or a parent save.
- Metadata submission: draft saved, save/submit busy, waiting for the latest cover, cover failure, render timeout with the saved-draft explanation, and submitted/frozen version. Cover selection and metadata actions share the busy boundary.
- Report: complete, blocked, or incomplete checks; optional finding groups and evidence; completed-check and limitation disclosures; complete or incomplete static accessibility inspection with manual review still required.
- Assessment: unassessed, suitable, revision required, the scientific-claim exception, rule-level warning dispositions and reasons, outcome inclusion/exclusion evidence, saving, and inline decision failure. Native disabled states apply while the decision is saved.
- Version detail: editable cover within metadata preparation; source-labelled submitted cover outside that state; human review controls when the version is in review and has a technical report and cover artifact.

These states are recorded from component source and the feature contract. The supplied captures demonstrate a populated metadata draft, a generated cover, a populated editor assessment with a canvas warning, and expanded curriculum-source evidence. They do not independently demonstrate every transient/error state, backend enforcement, or successful publication.

## Existing visual rules applied

`DESIGN.md` remains the global token authority. This surface uses its existing palette, typography, button hierarchy, visible focus treatment, semantic notices, white controls, and quiet borders. It introduces no global token, font family, decorative motion, or elevation pattern. Uploaded game presentation remains isolated from host-interface styling.

The workspace keeps its existing sidebar and responsive navigation, the metadata form's local 800px cap, and the publication form's existing 720px cap. Cover, assessment, and outcome fieldsets use a one-pixel input-colour border, a 12px radius, and 22px padding. Their padding becomes 16px by 12px at 600px. Legends use semibold interface type with horizontal breathing room.

The cover preview and controls use two equal flexible columns with a 24px gap, becoming one column at 768px and below. The image preserves its full aspect ratio, uses a 12px radius, and cannot exceed 720px. Controls have 18px internal spacing. The source label remains directly beneath the image. Mobile retains the entire preview, instructions, native file input, package choice, and automatic-cover action.

Assessment judgments and warnings use a single-column reading order at every width, with 14px internal gaps, 22px vertical padding, and quiet row separators. Their note fields have an 82px minimum height. Outcome fieldsets use a 16px internal gap. Long labels wrap; narrow widths do not hide the judgment name or its written reason.

Technical disclosures use an 18px top separation. Finding rows use 20px vertical padding and a quiet divider. Evidence uses a pale canvas, compact monospace text, an 8px radius, and wrapping for long paths or snippets. These are local arrangements of the incumbent system, not new global design primitives.

## Evidence and documentation boundary

Checked `PRODUCT.md`, `DESIGN.md`, `.impeccable/design.json`, the preceding metadata surface brief, `docs/TECHNICAL-REVIEW.md`, all six component sources named above, and the corresponding technical-review rules in `src/app/globals.css`.

Opened all twelve supplied captures under `.impeccable/review/`: `technical-metadata-{360,768,1440}.png`, `technical-editor-{360,768,1440}.png`, `cover-detail-{360,768,1440}.png`, and `assessment-detail-{360,768,1440}.png`. The full pages establish workspace order and responsive context; the six component crops show readable controls and wrapping. Also opened `cover-long-title.webp`, which demonstrates a long Turkish title and literal markup characters fitting within the information cover. The closed game preview is the captured state. The English native file-chooser text in these Chromium captures is distinct from the Turkish application labels.

The supplied independent verdict is `ship` in `.impeccable/review/technical-finish-review.md`, with no material visual/UX fixes remaining in that scope. This documentation pass records that finding and its limits; it does not replace the finish review, run the detector again, or certify backend authorization, scanner effectiveness, or publication enforcement.

`DESIGN.md` and `.impeccable/design.json` are preserved byte-for-byte, with before/after SHA-256 evidence in `.impeccable/review/technical-documentation.md`. Pre-existing sidecar drift remains outside this extension: its featured-card hover shadow and motion descriptions differ from the current global design's flat card treatment. The supplied review also records existing PRODUCT schema drift; this pass does not run a schema migration or repair unrelated documentation.
