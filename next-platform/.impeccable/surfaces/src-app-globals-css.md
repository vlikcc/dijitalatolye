---
version: 1
slug: "src-app-globals-css"
primary_target: "src/app/globals.css"
related_targets: ["src/app/page.tsx","src/app/kesfet/page.tsx","src/app/icerik/[slug]/page.tsx","src/app/giris/page.tsx","src/app/kayit/page.tsx","src/app/hesap/page.tsx","src/app/ogrenci/page.tsx","src/app/ogretmen/page.tsx","src/app/editor/page.tsx","src/app/yonetim/page.tsx","src/components/shell.tsx","src/components/version-detail.tsx"]
---

# Unified discovery, play and role workspaces

Mode: Operate. Code-led extension of the accepted neutral-paper Keşif Atlası. The user's approved plan explicitly expands the home palette to every application screen and fixes role permissions; no new visual direction or comp is required.

## Direction contract
THESIS: One workshop, with a clear next task for each role. Discovery shows games immediately; detail prioritizes play; account screens use one entry; workspaces show only the chosen task.
OWN-WORLD: #F6F7F9 ground, #FFFFFF controls, #24344D ink/actions, #606A79 supporting text, #17263C hover, #E8EDF4 selected fill, #DDE2E8 dividers, #8A94A4 input stroke and #3B5F8C focus. Locally served Manrope headings and Source Sans 3 controls. Puzzle colours, subject colours and real game art remain unchanged. Paper is limited to discovery, game and account introductions; workspaces stay flat.
STORY: Search/filter, inspect and play. Teachers upload, manage classes and assign games; Yönetici also reviews and may explicitly approve their own compliant submission; Admin manages users, definitions, system operations, logs, recovery and unpublishing but cannot create, teach, edit or approve. Students select assignments, games, classes or account instead of traversing one long dashboard.
FIRST VIEWPORT: Preserve the 76/64px shared header and compact discovery search/filter arrangement. Four cards fit at 1440×900; first image/title fit at 390×844. Detail has a short back link, 32/28px title and restrained tools, one metadata line, then a centered player up to 1120px; no sidebar or repeated play CTA. Account uses a compact plain form and keyboard teacher/student tabs. Workspace has a 190px task nav at desktop; below 1100px the same links live in the labelled header Menu. Content title, next action and actual list/form appear first. Footer is a short light closure; only eligible catalogue audiences see the thin game-sharing invitation.
FORM: Common PageHeading, EmptyState, form controls, status messages, list/search/pagination and panel navigation. Review tabs preserve mounted form state. Admin sections query only selected data with server-side search and pagination. No nested decorative cards, oversized banner, new fonts, decorative icons, gradients or motion.
SIGNATURE: Existing once-per-document puzzle line-to-colour signature remains. Player stays mounted through standard/cinema/fullscreen; keyboard focus and motion preferences take precedence over animation.
QUALITY BAR: Correct Turkish type and 44px controls; no horizontal overflow at 320/390/600/768/1024/1440; visible focus, Escape menu return, preserved draft data, errors and empty states. Existing APIs/SDK/data/ownership stay intact. Authorization is enforced centrally on server as well as UI. Production student feature default stays false; role fixtures are isolated local test records.
FINISH: Independent Impeccable render review, material fixes, token-bearing DESIGN.md and .impeccable/design.json, fresh desktop/mobile evidence and documented functional verification are required. No new raster assets are introduced.

## Verification scope
Use `.impeccable/review/unified/` for current captures. Older paper-discovery and learning records are historical unless recaptured in this implementation. No approved pixel comp exists: accepted user plan, incumbent home and this contract are the reference. Browser testing uses an isolated local database, local mail catcher, real scanner/worker and production build; no production deployment or data migration is included.
