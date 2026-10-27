---
version: 1
slug: "src-components-upload-form-tsx"
primary_target: "src/components/upload-form.tsx"
related_targets: ["src/components/package-file-picker.tsx", "src/components/publication-progress.tsx", "src/components/version-detail.tsx", "src/components/metadata-editor.tsx", "src/app/ogretmen/page.tsx", "src/app/globals.css"]
---

# Teacher upload and publication pilot

Mode: Operate. 27 October 2026 extension of the existing neutral/navy workspace. Preserve Manrope, Source Sans 3, shared Button, focus ring and notices. This scoped brief supersedes the older three-step upload notes in the metadata surface brief. Metadata fields, drafts, saving and curriculum review are unchanged.

A controlled single-file picker accepts HTML/HTM/ZIP, offers a native file dialog and drag/drop, and retains valid selection after invalid input. It owns no network or preview behavior. The form owns real XHR transfer progress, a synchronous submit latch, retained content ID and secondary cover handling.

The semantic ordered list has five always-labelled stages: Dosya, Güvenlik, Bilgiler, İnceleme, Yayın. It is horizontal from 768px and vertical below. Steps do not navigate. Current/complete/waiting/error/retired states are written as text. Live status requires matching current publication ID, published state and no revocation. Prior publication remains separately visible while a new draft is reviewed. No fabricated timeline, scanning percentage or timing promises.

Use the existing 22px workspace heading scale and color tokens. File names and descriptions wrap. Picker controls are at least 44px; existing global reduced-motion rules suppress transitions. Drag highlight only changes the input boundary and neutral surface.

Source commits and full MIT notices: [source record](../../docs/third-party/21st-pilot.md). Behavior, actual pipeline and four-width render evidence: [verification record](../../docs/21ST-PILOT-VALIDATION.md). No paid service or new runtime package.
