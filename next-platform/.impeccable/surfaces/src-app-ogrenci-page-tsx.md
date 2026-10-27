---
version: 1
slug: "src-app-ogrenci-page-tsx"
primary_target: "src/app/ogrenci/page.tsx"
related_targets: ["src/app/ogretmen/siniflar/page.tsx","src/app/ogretmen/odevler/page.tsx","src/components/learning-forms.tsx"]
---

# Öğrenci ve sınıf çalışma alanları

**Scoped supersession — 27 October 2026:** [src-app-globals-css.md](src-app-globals-css.md) and root [DESIGN.md](../../DESIGN.md) replace the lavender/violet host palette with shared neutral/navy tokens. Student work is selected as Ödevler, Oyunlar or Sınıflar with a separate Hesap route; below 1100px task navigation lives in the header menu. Shared `/giris` and `/kayit?tur=ogrenci`, Yönetici teacher capabilities and Admin recovery takeover follow [the current record](../../docs/UNIFIED-EXPERIENCE.md). SDK, progress and ownership constraints below remain intact; earlier captures are historical unless named in the unified review packet.

Mode: Operate. Extend the established Keşif Atlası panel and player. The approved implementation plan fixes the tasks and composition; no new visual identity.

## Direction contract
THESIS: A student resumes one concrete task; a teacher follows a class roster. Prioritize the next action and actual records.
OWN-WORLD: Existing pale lavender background, navy text, violet actions, Manrope headings, Source Sans 3 forms, white panels and explicit status text.
STORY: Students see assigned work and saved games before class membership. Teachers create classes, approve learners, assign published games and read individual results.
FIRST VIEWPORT: Existing site header and panel navigation; page title then assignment list with game, due date and a visible Continue action. Teacher class pages begin with a short create form and roster sections. Reports use a horizontally scrollable semantic table.
FORM: Precisely specified extension of existing panel composition; no surface concept round. Mobile sections stack and controls retain 44px targets.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
