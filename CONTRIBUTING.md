# Katkı Rehberi

DijitalAtölye'ye katkıda bulunduğunuz için teşekkürler!

## Geliştirme Akışı

1. **Issue açın** — Yeni bir özellik veya hata için önce issue açın.
2. **Branch oluşturun** — `feature/`, `fix/`, `chore/`, `docs/` öneklerini kullanın. Örn: `feature/identity-google-oauth`.
3. **Conventional Commits** — Commit mesajlarınız `commitlint` tarafından kontrol edilir.
4. **Test yazın** — Yeni kod için unit + (uygunsa) integration test.
5. **PR açın** — PR template'ini doldurun, ilgili issue'yu link'leyin.

## Branch Stratejisi: Trunk-Based

- `main` daima deploy edilebilir olmalı.
- Kısa ömürlü feature branch'ler (≤ 3 gün ideal).
- Büyük değişiklikler için **feature flag** kullanın.
- Hotfix'ler doğrudan `main` üzerinden, sonra çift yönlü merge.

## Conventional Commits

```
<tip>(<scope>): <konu>

[opsiyonel gövde]

[opsiyonel footer]
```

**Tipler:** `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `revert`

**Scope örnekleri:** `identity`, `content`, `ai-moderation`, `gateway`, `web`, `infra`, `eventbus`

**Örnekler:**
```
feat(identity): add google oauth provider
fix(content): version increment on revision
docs(adr): add ADR-010 for license decision
chore(deps): bump masstransit to 8.3.0
ci: add trivy container scan
```

**Breaking change:**
```
feat(content)!: rename ContentSubmitted event to ContentVersionSubmitted

BREAKING CHANGE: Consumers of ContentSubmitted must update.
```

## Kod Standartları

### .NET / C#

- **.NET 10**, file-scoped namespace, nullable enabled, implicit usings off (açık import tercih edilir).
- **Async** her zaman `Async` ekiyle.
- **Result Pattern** — Exception sadece exceptional case'lerde; iş mantığı hataları `Result<T>` ile döner.
- **Test:** xUnit + FluentAssertions + NSubstitute. Integration test için Testcontainers.
- **Roslyn analizleri** — `.editorconfig`'deki kurallar warning olarak çalışır, CI'da fail eder.

### TypeScript / React

- **Strict TS**, `unknown` > `any`.
- React **fonksiyonel komponent** + hook.
- Form: React Hook Form + Zod.
- Server state: TanStack Query. Client state: Zustand.
- Komponent dosyaları PascalCase, hook'lar `useXxx`.

### Genel

- **No inline imports** — Import'lar dosya başında. (workspace rule)
- **Exhaustive switch** — TypeScript union/enum için `never` ile exhaustive check. (workspace rule)
- Açıklayıcı isim. Yorumlar `niye` için, `ne` için değil.

## Pre-commit Hooks

Repo'yu klonladıktan sonra:

```bash
# pip ile pre-commit yükle (https://pre-commit.com)
pip install pre-commit
pre-commit install --install-hooks
pre-commit install --hook-type commit-msg
```

Hook'lar:
- `gitleaks` — secret tarama
- `dotnet format` — C# format
- `prettier` — JS/TS/JSON/MD format
- `commitlint` — commit mesaj kontrolü

## Pull Request

PR template'i ([`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md)) otomatik açılır. CI yeşil olmadan merge edilemez.

CI gereksinimleri:
- `dotnet build` başarılı
- `dotnet test` tüm testler geçer
- `npm run lint && npm run typecheck && npm run test` (web)
- Trivy container scan: kritik/yüksek bulunamadı
- Gitleaks: yeni secret yok

## Sorular

Issue açın veya `docs/` altındaki rehberleri inceleyin.
