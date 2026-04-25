# ADR-007: Mono-Repo (V1)

- **Durum:** Accepted
- **Tarih:** 2026-04-25
- **Karar veren:** Veli Keçeci

## Bağlam

10 mikroservis + 1 frontend + ortak building blocks + helm + ansible + terraform. Tek geliştirici ile başlanıyor (Faz 2'de ekip büyüyecek). Repo stratejisi seçilmeli.

## Karar

**Mono-repo** (`dijitalatolye/dijitalatolye`). Tüm backend servisleri, frontend, deploy artifact'ları, dokümanlar ve ADR'lar tek depoda. CI yapısı path-filter ile değişen servise özel build/test çalıştırır.

## Gerekçe

- **Tek geliştirici için verim:** PR scope'u, IDE açma, refactor across services, atomic değişiklik (event şeması + producer + consumer aynı PR'da).
- **Building blocks paylaşımı:** `BuildingBlocks.EventBus` değiştiğinde tüm tüketiciler tek commit ile güncellenebilir.
- **Tek CI/CD pipeline'ı:** Ortak workflow, ortak secret yönetimi.
- **Ileride bölme kolay:** `git filter-repo` ile servisleri kendi repo'larına ayırmak mümkün; tersi (poly → mono birleştirme) zor.

## Sonuçlar

**Olumlu:** Hız, atomik değişiklik, kolay refactor.

**Olumsuz:**
- Repo zamanla şişer → CI cache, partial checkout (`git sparse-checkout`) gerekirse kullan.
- Hak yönetimi tüm repo seviyesinde — CODEOWNERS ile path bazlı reviewer ataması zorunlu.
- Build matrix path-filter olmadan tüm servisleri build etmeye çalışır → CI'da `paths-filter` action zorunlu.

**Strateji:**
- Faz 4'e kadar mono-repo
- Servis ekibi 10+ kişi olduğunda veya servis sayısı 20+ olduğunda poly-repo'ya geçişi değerlendir (ADR-007b)

## Alternatifler

- **Poly-repo:** Her servis ayrı repo. Net sınırlar ama çapraz değişiklikler için 5-10 PR gerekiyor; tek geliştiriciye verim katastrofu.
- **Hibrit (frontend ayrı, backend mono):** Faz 2'ye kadar gerek yok.
