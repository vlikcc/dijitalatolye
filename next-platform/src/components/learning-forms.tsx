"use client";
import { ActionButton, ActionFeedback } from "./action-feedback";
import { GamePicker, StudentPicker } from "./learning-selectors";
import type {
  MemberOption,
  GameOption,
  AssignmentReuseSeed,
} from "@/lib/learning-workspace";
import { PasswordField } from "./password-field";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "./ui/button";
export async function learningRequest(path: string, body: unknown) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => {
    throw new Error(
      "Sunucuya ulaşılamadı. İnternet bağlantını kontrol edip yeniden dene.",
    );
  });
  const data = await response.json().catch(() => {
    throw new Error(
      "Sunucudan geçerli bir yanıt alınamadı. Biraz sonra yeniden dene.",
    );
  });
  if (!response.ok)
    throw new Error(
      data?.error || data?.message || "İşlem tamamlanamadı. Yeniden deneyin.",
    );
  return data;
}
export function LearningAction({
  endpoint,
  body,
  label,
  confirmation,
  successMessage = "İşlem tamamlandı.",
}: {
  endpoint: string;
  body: unknown;
  label: string;
  confirmation?: string;
  successMessage?: string;
}) {
  const router = useRouter();
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  return (
    <div className="learning-action">
      <ActionButton
        type="button"
        variant="outline"
        busy={busy}
        label={label}
        onClick={async () => {
          if (lock.current || (confirmation && !window.confirm(confirmation)))
            return;
          lock.current = true;
          setBusy(true);
          setMessage("");
          setFailed(false);
          try {
            const r = await learningRequest(endpoint, body);
            setMessage(
              r.code
                ? `15 dakika geçerli yenileme kodu: ${r.code}`
                : successMessage,
            );
            router.refresh();
          } catch (e) {
            setFailed(true);
            setMessage((e as Error).message);
          } finally {
            lock.current = false;
            setBusy(false);
          }
        }}
      />
      {message && <ActionFeedback error={failed}>{message}</ActionFeedback>}
    </div>
  );
}
export function SimpleLearningForm({
  endpoint,
  label,
  field,
  button,
  successMessage = "İşlem tamamlandı.",
}: {
  endpoint: string;
  label: string;
  field: string;
  button: string;
  successMessage?: string;
}) {
  const router = useRouter();
  const lock = useRef(false);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(false);
  return (
    <form
      className="form learning-inline"
      onChange={() => setSuccess(false)}
      onSubmit={async (e) => {
        e.preventDefault();
        if (lock.current) return;
        const form = e.currentTarget;
        const body = Object.fromEntries(new FormData(form));
        lock.current = true;
        setBusy(true);
        setError("");
        setSuccess(false);
        try {
          await learningRequest(endpoint, body);
          form.reset();
          setSuccess(true);
          router.refresh();
        } catch (e) {
          setError((e as Error).message);
        } finally {
          lock.current = false;
          setBusy(false);
        }
      }}
    >
      <label>
        {label}
        <input
          name={field}
          className={field === "classCode" ? "code-field" : undefined}
          required
          maxLength={field === "name" ? 120 : 32}
          autoComplete="off"
        />
      </label>
      <ActionButton busy={busy} label={button} />
      {error && <ActionFeedback error>{error}</ActionFeedback>}
      {success && <ActionFeedback>{successMessage}</ActionFeedback>}
    </form>
  );
}
export function StudentAuthForm({
  mode,
  embedded = false,
  next = "",
}: {
  mode: "login" | "register" | "reset";
  embedded?: boolean;
  next?: string;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const submitting = useRef(false);
  const [usernameInvalid, setUsernameInvalid] = useState(false);
  return (
    <>
      <form
        className="form"
        method="post"
        onSubmit={async (e) => {
          e.preventDefault();
          if (submitting.current) return;
          submitting.current = true;
          setBusy(true);
          setError("");
          try {
            await learningRequest(
              `/api/auth/student/${mode}`,
              Object.fromEntries(new FormData(e.currentTarget)),
            );
            window.location.assign(
              mode === "reset"
                ? "/giris?reset=1"
                : "/oturum" + (next ? "?next=" + encodeURIComponent(next) : ""),
            );
          } catch (e) {
            setError((e as Error).message);
            setBusy(false);
            submitting.current = false;
          }
        }}
      >
        {mode === "register" && (
          <label>
            Görünen adın
            <input
              name="name"
              autoComplete="name"
              minLength={2}
              maxLength={80}
              required
            />
          </label>
        )}
        <label>
          Kullanıcı adı
          <input
            name="username"
            aria-invalid={usernameInvalid || undefined}
            onBlur={(e) =>
              setUsernameInvalid(
                mode === "register" &&
                  !!e.currentTarget.value &&
                  !e.currentTarget.validity.valid,
              )
            }
            onChange={() => setUsernameInvalid(false)}
            aria-label="Kullanıcı adı"
            aria-describedby="student-username-help"
            autoComplete="username"
            pattern="[A-Za-z0-9_]{3,30}"
            minLength={3}
            maxLength={30}
            required
          />
          <span className="form-help" id="student-username-help">
            {usernameInvalid
              ? "Kullanıcı adını kontrol et: 3–30 karakter, a–z, rakam ve alt çizgi kullan."
              : "3–30 karakter: a–z, rakam ve alt çizgi."}
          </span>
        </label>
        {mode === "register" && (
          <label>
            Sınıf kodu
            <input
              name="classCode"
              className="code-field"
              aria-label="Sınıf kodu"
              aria-describedby="student-class-code-help"
              autoComplete="off"
              maxLength={32}
              required
            />
            <span className="form-help" id="student-class-code-help">
              Öğretmeninden aldığın sınıf kodu.
            </span>
          </label>
        )}
        {mode === "reset" && (
          <label>
            Yenileme kodu
            <input
              name="code"
              className="code-field"
              autoComplete="one-time-code"
              required
            />
          </label>
        )}
        <PasswordField
          label={mode === "reset" ? "Yeni parola" : "Parola"}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          minLength={mode === "login" ? 1 : 12}
          showRequirementFeedback={mode !== "login"}
        />
        {error && (
          <p className="notice error" role="alert">
            {error}
          </p>
        )}
        <Button disabled={!ready || busy}>
          {busy
            ? "Lütfen bekle…"
            : mode === "register"
              ? "Hesabımı oluştur"
              : mode === "reset"
                ? "Parolamı yenile"
                : "Giriş yap"}
        </Button>
      </form>
      {!embedded && (
        <div className="auth-links">
          <Link href="/giris">Giriş yap</Link>
          <Link href="/kayit?tur=ogrenci">Öğrenci hesabı oluştur</Link>
        </div>
      )}
    </>
  );
}
type ClassOption = { id: string; name: string; archived: boolean };
export function AssignmentForm({
  classes,
  members,
  games,
  selectedGame,
  seed,
}: {
  classes: ClassOption[];
  members: MemberOption[];
  games: GameOption[];
  selectedGame?: string;
  seed?: AssignmentReuseSeed;
}) {
  const router = useRouter();
  const lock = useRef(false);
  const [classId, setClassId] = useState(
    seed ? "" : (classes.find((c) => !c.archived)?.id ?? ""),
  );
  const [all, setAll] = useState(!seed);
  const [gameId, setGameId] = useState(
    selectedGame
      ? games.some((g) => g.id === selectedGame)
        ? selectedGame
        : ""
      : (games[0]?.id ?? ""),
  );
  const [selected, setSelected] = useState<string[]>([]);
  const [dueAt, setDueAt] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const available = members.filter(
    (m) => m.class_id === classId && m.status === "active",
  );
  const recipients = available.filter(
    (m) => all || selected.includes(m.student_id),
  );
  const game = games.find((g) => g.id === gameId);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (!classes.some((c) => !c.archived))
    return (
      <p className="notice">
        Ödev vermek için önce{" "}
        <Link href="/ogretmen/siniflar">sınıf oluşturun</Link>.
      </p>
    );
  return (
    <form
      className="form"
      aria-busy={busy}
      onSubmit={async (e) => {
        e.preventDefault();
        if (lock.current || !game || !recipients.length) return;
        const f = new FormData(e.currentTarget);
        lock.current = true;
        setBusy(true);
        setError("");
        try {
          const r = await learningRequest("/api/learning/assignments", {
            classId,
            contentId: game.id,
            title: f.get("title"),
            instructions: f.get("instructions"),
            dueAt: dueAt ? new Date(dueAt).toISOString() : null,
            ...(!all
              ? { studentIds: recipients.map((m) => m.student_id) }
              : {}),
          });
          router.push(`/ogretmen/odevler/${r.id}`);
          router.refresh();
        } catch (e) {
          setError((e as Error).message);
        } finally {
          lock.current = false;
          setBusy(false);
        }
      }}
    >
      {seed && (
        <p className="notice">
          <Link href={`/ogretmen/odevler/${seed.sourceId}`}>
            Kaynak ödevi gör
          </Link>
          {" · "}Başlık ve yönerge alındı. Yeni sınıfınızı, alıcıları ve varsa
          son tarihi seçin.
          {seed.gameAvailable &&
            seed.gameUpdated &&
            " Oyun güncellenmiş; yeni ödev yayındaki güncel sürümü kullanacak."}
        </p>
      )}
      <fieldset disabled={busy} className="form-fields">
        <label>
          Sınıf
          <select
            aria-label="Sınıf"
            required
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value);
              setSelected([]);
              if (seed) setAll(false);
            }}
          >
            <option value="" disabled>
              Sınıf seçin
            </option>
            {classes
              .filter((c) => !c.archived)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
        </label>
        {selectedGame && !games.some((g) => g.id === selectedGame) && (
          <p className="notice">
            Bağlantıdaki oyun artık atanamıyor. Listeden başka bir oyun seçin.
          </p>
        )}
        <GamePicker games={games} value={gameId} onChange={setGameId} />
        {!games.length && (
          <p className="notice">
            Henüz ödev verilebilecek yayımlanmış oyun yok.
          </p>
        )}
        {game && !game.tracking && (
          <p className="notice">
            Bu oyunda yalnızca açılma bilgisi izlenebilir. Kayıt, puan ve
            tamamlanma desteği yok.
          </p>
        )}
        <label>
          Ödev başlığı
          <input
            name="title"
            maxLength={120}
            required
            defaultValue={seed?.title}
          />
        </label>
        <label>
          Yönerge
          <textarea
            name="instructions"
            maxLength={3000}
            rows={3}
            defaultValue={seed?.instructions}
          />
        </label>
        <label>
          Son tarih (isteğe bağlı)
          <input
            name="dueAt"
            type="datetime-local"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
          />
          <span className="form-help">
            Cihazınızın saat dilimi kullanılır. Süre geçse de siz kapatana kadar
            ödev yapılabilir.
          </span>
        </label>
        <label className="learning-check">
          <input
            type="checkbox"
            checked={all}
            disabled={!classId}
            onChange={(e) => setAll(e.target.checked)}
          />
          Sınıfın tüm onaylı öğrencileri ({available.length})
        </label>
        {!all && classId && (
          <StudentPicker
            key={classId}
            members={available}
            selected={selected}
            onChange={setSelected}
          />
        )}
        {classId && !available.length && (
          <p className="notice">
            Önce sınıfınıza katılan öğrencileri onaylayın.
          </p>
        )}
      </fieldset>
      <section className="assignment-summary" aria-label="Gönderim özeti">
        <h3>Gönderim özeti</h3>
        <dl className="workspace-facts">
          <div>
            <dt>Sınıf</dt>
            <dd>
              {classes.find((c) => c.id === classId)?.name ?? "Sınıf seçilmedi"}
            </dd>
          </div>
          <div>
            <dt>Oyun</dt>
            <dd>{game?.title ?? "Oyun seçilmedi"}</dd>
          </div>
          <div>
            <dt>Alıcı</dt>
            <dd>
              <strong className="recipient-count">
                {recipients.length} öğrenci
              </strong>
              {all ? " · Tüm onaylı öğrenciler" : " · Seçilen öğrenciler"}
            </dd>
          </div>
          <div>
            <dt>Son tarih</dt>
            <dd>
              {dueAt
                ? `${new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(dueAt))} (${timeZone})`
                : "Son tarih yok"}
            </dd>
          </div>
          <div>
            <dt>Takip kapsamı</dt>
            <dd>
              {game
                ? game.tracking
                  ? "Oyunun bildirdiği ilerleme, puan ve tamamlanma"
                  : "Yalnızca açılma bilgisi"
                : "Oyun seçildiğinde görünür"}
            </dd>
          </div>
        </dl>
        {recipients.length > 0 && (
          <details>
            <summary>Alıcıları gör ({recipients.length})</summary>
            <ul>
              {recipients.map((m) => (
                <li key={m.student_id}>{m.name}</li>
              ))}
            </ul>
          </details>
        )}
      </section>
      {error && (
        <p role="alert" className="notice error">
          {error}
        </p>
      )}
      <Button disabled={busy || !game || !recipients.length}>
        {busy ? "Atanıyor…" : "Ödevi ver"}
      </Button>
    </form>
  );
}
export function AddRecipients({
  id,
  members,
}: {
  id: string;
  members: MemberOption[];
}) {
  const router = useRouter();
  const lock = useRef(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const valid = selected.filter((id) =>
    members.some((m) => m.student_id === id),
  );
  if (!members.length) return null;
  return (
    <form
      className="form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (lock.current || !valid.length) return;
        lock.current = true;
        setBusy(true);
        setError("");
        try {
          await learningRequest(`/api/learning/assignments/${id}`, {
            action: "add",
            studentIds: valid,
          });
          setSelected([]);
          router.refresh();
        } catch (e) {
          setError((e as Error).message);
        } finally {
          lock.current = false;
          setBusy(false);
        }
      }}
    >
      <fieldset disabled={busy} className="form-fields">
        <StudentPicker
          members={members}
          selected={valid}
          onChange={setSelected}
          label="Ödeve öğrenci ekle"
        />
      </fieldset>
      {error && (
        <p role="alert" className="notice error">
          {error}
        </p>
      )}
      <Button disabled={busy || !valid.length}>
        {busy ? "Ekleniyor…" : "Seçilenleri ekle"}
      </Button>
    </form>
  );
}
