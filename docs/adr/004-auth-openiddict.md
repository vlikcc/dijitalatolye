# ADR-004: Auth — OpenIddict

- **Durum:** Accepted
- **Tarih:** 2026-04-25
- **Karar veren:** Veli Keçeci

## Bağlam

PRD §6.1: e-posta/şifre, Google OAuth, refresh token, 2FA, MEB SSO (ileride). OAuth2 / OIDC standartlarına uyumlu, self-hosted bir auth server gerekli.

## Karar

**OpenIddict 6** + **ASP.NET Core Identity** kullanılacak.

## Gerekçe

- **Açık kaynak ve ücretsiz:** Duende IdentityServer ticari lisans gerektiriyor (>$1500/yıl > 1M req); V1 bütçesi için OpenIddict daha uygun.
- **OAuth2 / OIDC tam uyumlu:** Authorization code, password, refresh token, client credentials, device flow.
- **ASP.NET Core Identity** ile entegre: kullanıcı/rol/claim/lockout altyapısı hazır, EF Core üzerinde.
- **Aktif geliştirme:** Kévin Chalet tarafından bakım altında, .NET 10 desteği günü gününe.

## Sonuçlar

**Olumlu:** Lisans maliyeti yok, .NET 10 native, OAuth standartlarına uyum.

**Olumsuz:** Duende'nin admin UI'ı ve dokümantasyonunun zenginliği yok — admin işlemleri için kendi panelimizi yazmamız gerekecek (PRD §6.10 zaten gerektiriyor). Toplulukta Duende kadar geniş örnek havuzu yok.

## Alternatifler

- **Duende IdentityServer:** En olgun .NET çözümü, harika dokümantasyon. Ancak ticari lisans → reddedildi (V1 bütçesi).
- **Keycloak:** Java tabanlı, çok güçlü; ancak ayrı runtime, ekipte JVM operasyonu yok.
- **Auth0 / Clerk / Supabase Auth:** SaaS — ADR-008'in self-hosted kararıyla çelişiyor; KVKK için veri rezidansı tercih edilir.
- **Authelia / Ory Kratos:** Kullanım için zayıf .NET entegrasyonu.
