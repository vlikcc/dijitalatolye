---
version: 1
slug: "src-components-account-layout-tsx"
primary_target: "src/components/account-layout.tsx"
related_targets: ["src/app/giris/page.tsx","src/app/kayit/page.tsx","src/components/register-form.tsx","src/components/game-information.tsx","src/app/icerik/[slug]/page.tsx","src/app/globals.css"]
---

# Keşif Atlası — account and game information extension

27 October 2026. Mode: Operate, code-led. This is the approved bounded frontend extension of [DESIGN.md](../../DESIGN.md), with the companion catalogue composition in [src-app-page-tsx.md](src-app-page-tsx.md). It supersedes the centred desktop login/registration composition and the previous always-open sequence of teacher notes. It preserves the incumbent identity and product truth; no new world, QUALITY BAR card, seed, direction roll or approved image comp was created for this extension.

## Direction contract

THESIS: Keep account entry direct while showing the real learning games it leads to; make game suitability readable beneath the existing player.
OWN-WORLD: Preserve Keşif Atlası's neutral paper, navy text/actions, white controls, local Manrope and Source Sans 3, original puzzle signature and subject colours. Game art supplies its own colour; no account palette or display face is introduced.
STORY: Enter or create the appropriate account, with its actual task explained. On a game, read the objectives, author and first teaching note, then open further notes as needed without disturbing play.
FIRST VIEWPORT: At 1024px and above, login and registration place the form on the left and the existing discovery phrase with genuine catalogue artwork on the right. Below 1024px the introduction is hidden and the form remains. Game heading and facts align with the existing centred player; information follows beneath it.
FORM: A precise user-approved composition extension of the accepted world. Existing controls, role tabs and native disclosure provide the interaction language; references informed layout ideas without copied third-party component code or runtime dependencies.
FINISH: The independent frontend review returned SHIP with no material fixes. This brief records the implementation and its bounded evidence rather than a new design-system choice.

## Login refinement — 27 October 2026

The user subsequently requested a more premium login. `/giris` now opts into a white form surface and an inset navy manual cover showcase, with the existing amber accent and real catalogue art. The form itself and registration logic are unchanged. Below 1024px only the form is visible; unavailable covers are omitted. This supersedes the plain login styling described in the original composition below; registration retains that original layout. The current implementation and bounded checks are in [LOGIN-SHOWCASE-DELIVERY.md](../../docs/LOGIN-SHOWCASE-DELIVERY.md). The earlier independent SHIP review refers to the original pilot, not this later refinement.

## Account composition

The shared account container caps at 1160px. Desktop uses a form column up to 480px and a flexible introduction column, separated by a 1px existing divider and a 40–72px responsive gap. The introductory heading is 28px Manrope; this is a local composition value, not a new global type token. The plain form retains the shared field, button, focus and feedback treatments. Narrow screens show the form alone.

The gallery is capped at 420px and displays up to three existing public catalogue covers: the first spans both columns, with the next two beneath it. Images retain their 720:440 ratio with contained artwork, existing subject backgrounds and 12px corners. Captions show the genuine title, subject, grade and Demo label where applicable. Missing covers are skipped, duplicate cover URLs are avoided and distinct subjects are preferred. An empty or failed catalogue yields no gallery; the introductory copy and account form remain. No placeholder game or stock image is invented.

Teacher/student tabs retain the existing learning flag, mounted panels and arrow/Home/End keyboard selection. Each tab adds a short description of its actual task. Registration exposes live feedback only for the existing minimum of 12 password characters; associated class-code help explains the student input. Existing login, verification, recovery, safe return and role rules remain the authority in [PRODUCT.md](../../PRODUCT.md).

## Game information composition

The heading and wrapping facts align with the 1120px player width. Objectives and author appear only when nonempty. The first teacher-note paragraph is visible, while subsequent paragraphs sit in native `details`/`summary` labelled “Diğer öğretmen notları”. The disclosure has a minimum 44px summary target, inherits visible focus and uses a text underline on hover. Long content wraps within the information columns; empty sections are omitted.

User refinement, 27 October 2026: the generic “Oyunlara dön” row was removed because it duplicated the shared header. Only a meaningful catalogue context keeps a return link: search/grade/subject uses “Sonuçlara dön”, and a saved collection uses “Kaydettiklerime dön”. The original safe return URL preserves that context.

The existing 2fr/1fr information grid becomes one column at 600px. The teacher notes span the information width below objectives and author. Opening notes does not recreate the iframe or add a second player. Start, cinema, fullscreen, save/share and progress behavior remain those of the existing player.

## Source and review evidence

Sources checked: `src/components/account-layout.tsx`, `src/components/register-form.tsx`, `src/components/auth-form.tsx`, `src/components/password-field.tsx`, `src/components/game-information.tsx`, `src/lib/catalog-artwork.ts`, the login/registration/detail route composition and the scoped frontend block in `src/app/globals.css`.

The [delivery and verification record](../../docs/21ST-FRONTEND-PILOT.md) reports TypeScript, production build, 98 unit tests and 34 distinct browser cases passing, plus targeted Safari checks. The [independent finish review](../review/21st-frontend/finish-review.md) inspected before/after evidence and returned SHIP. Current captures in `.impeccable/review/21st-frontend/after/` include login, registration and game at 320/390/600/768/1024/1440px; active player, 200% CSS-zoom equivalent, Safari and empty-catalogue/learning-off states. `additional-notes-fixture.png` uses explicitly synthetic multi-note content rendered by the real component, not a user testimonial or live game record. These checks do not establish broad screen-reader certification.

[Source provenance](../../docs/third-party/21st-frontend.md) records the reference layouts and authentic catalogue art. This extension does not change `PRODUCT.md`, global token primitives, the token sidecar, workspace design, backend contracts or deployment. Existing detector advisory drift remains outside its scope.

## Registration follow-up — 27 October 2026

The user requested the same new appearance on account creation. `/kayit` now opts into the shared showcase with registration-specific spacing, preserving teacher/student tabs, feature flags, helper text and mounted drafts. This supersedes the earlier instruction to retain plain registration. The existing account regression exercises both registration roles and login across six viewport widths.
