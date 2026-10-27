"use client";
import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ActionButton, ActionFeedback } from "./action-feedback";
import { CopyButton } from "./copy-button";
import { MailCheck, ShieldCheck } from "lucide-react";
import { PasswordField } from "./password-field";
import { Button } from "./ui/button";
export const authClient = createAuthClient({ plugins: [twoFactorClient()] });
export function AuthForm({
  mode,
  embedded = false,
}: {
  mode: "login" | "register" | "reset" | "new-password";
  embedded?: boolean;
}) {
  const params = useSearchParams();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const next = params.get("next") ?? "";
  const suffix = next ? "?next=" + encodeURIComponent(next) : "";
  const callbackURL =
    "/giris?verified=1" + (next ? "&next=" + encodeURIComponent(next) : "");
  const submitting = useRef(false);
  const [needsVerification, setNeedsVerification] = useState(
    params.get("verify") === "1",
  );
  const [error, setError] = useState("");
  const [message, setMessage] = useState(
    mode === "login" && params.get("verified") === "1"
      ? "E-posta adresiniz doğrulandı. Giriş yapabilirsiniz."
      : mode === "login" && params.get("reset") === "1"
        ? "Parolanız yenilendi. Yeni parolanızla giriş yapabilirsiniz."
        : "",
  );
  const [busy, setBusy] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);
  const [backup, setBackup] = useState(false);
  const codeField = useRef<HTMLInputElement>(null);
  const [completed, setCompleted] = useState(false);
  useEffect(() => {
    if (twoFactor) codeField.current?.focus();
  }, [twoFactor, backup]);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    const f = new FormData(e.currentTarget);
    try {
      let result;
      if (twoFactor)
        result = backup
          ? await authClient.twoFactor.verifyBackupCode({
              code: String(f.get("code")),
            })
          : await authClient.twoFactor.verifyTotp({
              code: String(f.get("code")),
            });
      else if (mode === "register")
        result = await authClient.signUp.email({
          email: String(f.get("email")),
          name: String(f.get("name")),
          password: String(f.get("password")),
          callbackURL,
        });
      else if (mode === "reset")
        result = await authClient.requestPasswordReset({
          email: String(f.get("email")),
          redirectTo: "/parola-yenile" + suffix,
        });
      else if (mode === "new-password")
        result = await authClient.resetPassword({
          newPassword: String(f.get("password")),
          token: new URLSearchParams(window.location.search).get("token") || "",
        });
      else {
        const identifier = String(f.get("email")).trim();
        if (!identifier.includes("@")) {
          const response = await fetch("/api/auth/student/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: identifier,
              password: String(f.get("password")),
            }),
          });
          if (!response.ok)
            throw Error(
              "Giriş yapılamadı. Kullanıcı adını ve parolanı kontrol et.",
            );
          window.location.assign("/oturum" + suffix);
          return;
        }
        result = await authClient.signIn.email({
          email: identifier,
          password: String(f.get("password")),
        });
      }
      if (result.error) {
        if (result.error.code === "EMAIL_NOT_VERIFIED")
          setNeedsVerification(true);
        throw new Error(
          result.error.code === "EMAIL_NOT_VERIFIED"
            ? "E-posta adresinizi doğrulayın. Gerekirse aşağıdan yeni bağlantı isteyin."
            : "Bilgiler doğrulanamadı. E-posta, parola veya doğrulama kodunu kontrol edin.",
        );
      }
      if ((result.data as any)?.twoFactorRedirect) {
        setTwoFactor(true);
        return;
      }
      if (mode === "register") {
        setCompleted(true);
        setMessage(
          "Doğrulama bağlantısı e-posta adresinize gönderildi. Bağlantıyı açtıktan sonra giriş yapabilirsiniz.",
        );
      } else if (mode === "reset")
        setMessage(
          "Bu adresle kayıtlı bir hesap varsa parola yenileme bağlantısı gönderildi.",
        );
      else if (mode === "new-password") {
        setCompleted(true);
        setMessage("Parolan güncellendi. Yeni parolanla giriş yapabilirsin.");
      } else window.location.assign("/oturum" + suffix);
    } catch (e) {
      setError(e instanceof Error ? e.message : "İşlem tamamlanamadı.");
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  return (
    <>
      <form className="form" method="post" onSubmit={submit}>
        {twoFactor && (
          <div className="verification-heading">
            <ShieldCheck size={21} aria-hidden="true" />
            <div>
              <h2>Doğrulama kodunu gir</h2>
              <p className="form-help">
                {backup
                  ? "Güvenli bir yerde sakladığın yedek kodlardan birini kullan."
                  : "Doğrulayıcı uygulamandaki 6 haneli kodu kullan."}
              </p>
            </div>
          </div>
        )}
        {twoFactor ? (
          <label>
            {backup ? "Yedek doğrulama kodu" : "Doğrulama kodu"}
            <input
              ref={codeField}
              name="code"
              autoComplete="one-time-code"
              inputMode={backup ? "text" : "numeric"}
              pattern={backup ? undefined : "[0-9]{6}"}
              required
            />
          </label>
        ) : (
          <>
            {mode === "register" && (
              <label>
                Adınız ve soyadınız
                <input name="name" autoComplete="name" required minLength={2} />
              </label>
            )}
            {mode !== "new-password" && (
              <label>
                {mode === "login"
                  ? "E-posta veya kullanıcı adı"
                  : "E-posta adresi"}
                <input
                  type={mode === "login" ? "text" : "email"}
                  name="email"
                  autoComplete={mode === "login" ? "username" : "email"}
                  required
                />
              </label>
            )}
            {mode !== "reset" && (
              <PasswordField
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                minLength={mode === "login" ? 1 : 12}
                showRequirementFeedback={mode !== "login"}
              />
            )}
          </>
        )}
        {error && <ActionFeedback error>{error}</ActionFeedback>}
        {message && (
          <div className={completed ? "auth-complete" : "auth-feedback"}>
            {completed && mode === "register" && (
              <h2>
                <MailCheck size={20} aria-hidden="true" />
                E-postanı kontrol et
              </h2>
            )}
            <ActionFeedback>{message}</ActionFeedback>
          </div>
        )}
        <ActionButton
          busy={busy}
          disabled={!ready || completed}
          label={
            twoFactor
              ? "Kodu doğrula"
              : mode === "register"
                ? "Hesap oluştur"
                : mode === "reset"
                  ? "Yenileme bağlantısı gönder"
                  : mode === "new-password"
                    ? "Parolayı güncelle"
                    : "Giriş yap"
          }
          pendingLabel={
            twoFactor
              ? "Kod doğrulanıyor…"
              : mode === "login"
                ? "Giriş yapılıyor…"
                : mode === "register"
                  ? "Hesap oluşturuluyor…"
                  : mode === "reset"
                    ? "Bağlantı gönderiliyor…"
                    : "Parola güncelleniyor…"
          }
          success={completed}
          successLabel={
            mode === "register" ? "Hesap oluşturuldu" : "Parola güncellendi"
          }
        />
        {twoFactor && (
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={() => {
              setBackup(!backup);
              setError("");
            }}
          >
            {backup ? "Doğrulayıcı kodu kullan" : "Yedek kod kullan"}
          </Button>
        )}
        {!twoFactor && mode === "login" && needsVerification && (
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={async (e) => {
              const form = e.currentTarget.closest("form")!;
              const input = form.elements.namedItem(
                "email",
              ) as HTMLInputElement;
              if (
                !input.reportValidity() ||
                !input.value.includes("@") ||
                submitting.current
              )
                return;
              submitting.current = true;
              setBusy(true);
              try {
                const result = await authClient.sendVerificationEmail({
                  email: input.value,
                  callbackURL,
                });
                if (result.error) throw Error();
                setMessage(
                  "Doğrulanmamış bir hesap varsa yeni bağlantı e-posta adresine gönderildi.",
                );
              } catch {
                setError(
                  "Bağlantı gönderilemedi. Lütfen daha sonra tekrar deneyin.",
                );
              } finally {
                submitting.current = false;
                setBusy(false);
              }
            }}
          >
            Doğrulama bağlantısını yeniden gönder
          </Button>
        )}
      </form>
      {!embedded && (
        <div className="auth-links">
          {mode !== "login" && <Link href={"/giris" + suffix}>Giriş yap</Link>}
          {mode === "login" && (
            <>
              <Link
                href={
                  "/kayit" +
                  suffix +
                  (next === "/ogrenci" ? "&tur=ogrenci" : "")
                }
              >
                Hesap oluştur
              </Link>
              <Link href={"/parolami-unuttum" + suffix}>Hesabımı kurtar</Link>
            </>
          )}
        </div>
      )}
    </>
  );
}
export function SecurityForm() {
  const [uri, setUri] = useState("");
  const [codes, setCodes] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  return (
    <>
      <form
        className="form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (submitting.current) return;
          submitting.current = true;
          setBusy(true);
          const f = new FormData(e.currentTarget);
          try {
            if (!uri) {
              const r = await authClient.twoFactor.enable({
                password: String(f.get("password")),
              });
              if (r.error) throw Error(r.error.message);
              if (r.data?.method !== "totp")
                throw Error("Doğrulayıcı uygulama kurulumu başlatılamadı.");
              setUri(r.data.totpURI);
              setCodes(r.data.backupCodes);
            } else {
              const r = await authClient.twoFactor.verifyTotp({
                code: String(f.get("code")),
              });
              if (r.error) throw Error(r.error.message);
              setMessage("İki aşamalı doğrulama etkinleştirildi.");
              window.location.assign("/oturum" + window.location.search);
            }
          } catch (e) {
            setMessage(e instanceof Error ? e.message : "İşlem başarısız.");
          } finally {
            submitting.current = false;
            setBusy(false);
          }
        }}
      >
        <ol className="security-steps" aria-label="Doğrulama kurulumu">
          <li aria-current={!uri ? "step" : undefined}>Uygulamaya ekle</li>
          <li aria-current={uri ? "step" : undefined}>Kodu doğrula</li>
        </ol>
        {!uri ? (
          <label>
            Mevcut parolanız
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
            />
          </label>
        ) : (
          <>
            <p>
              Kimlik doğrulayıcı uygulamanıza aşağıdaki kurulum bağlantısını
              ekleyin. Bu bilgileri yalnızca kendiniz saklayın.
            </p>
            <a href={uri}>Doğrulayıcı uygulamasında aç</a>
            <details>
              <summary>Manuel kurulum anahtarı</summary>
              <p className="mono">{new URL(uri).searchParams.get("secret")}</p>
            </details>
            <label>
              Uygulamadaki 6 haneli kod
              <input
                name="code"
                inputMode="numeric"
                pattern="[0-9]{6}"
                autoComplete="one-time-code"
                required
              />
            </label>
            <details open>
              <summary>Yedek kodlarınızı güvenli bir yerde saklayın</summary>
              <pre className="backup-codes">{codes.join("\n")}</pre>
              <CopyButton
                value={codes.join("\n")}
                label="Yedek kodları kopyala"
              />
            </details>
          </>
        )}
        {message && (
          <p role="status" className="notice">
            {message}
          </p>
        )}
        <Button disabled={busy}>
          {busy
            ? "İşleniyor…"
            : uri
              ? "Kodu doğrula ve etkinleştir"
              : "İki aşamalı doğrulamayı kur"}
        </Button>
      </form>
    </>
  );
}
export function SignOut({ className }: { className?: string } = {}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <>
      <Button
        type="button"
        variant="outline"
        className={className}
        disabled={busy}
        onClick={async () => {
          if (busy) return;
          setBusy(true);
          setError("");
          try {
            const result = await authClient.signOut();
            if (result.error) throw new Error("sign-out failed");
            window.location.assign("/");
          } catch {
            setError("Çıkış yapılamadı. Yeniden deneyebilirsin.");
            setBusy(false);
          }
        }}
      >
        {busy ? "Çıkış yapılıyor…" : "Çıkış yap"}
      </Button>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </>
  );
}
