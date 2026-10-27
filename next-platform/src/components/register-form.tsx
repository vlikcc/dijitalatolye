"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { AuthForm } from "./auth-form";
import { StudentAuthForm } from "./learning-forms";
export function RegisterForm({ learning }: { learning: boolean }) {
  const params = useSearchParams(),
    id = useId();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const student = learning && params.get("tur") === "ogrenci";
  const next = params.get("next") ?? "";
  function select(index: number) {
    const query = new URLSearchParams(params.toString());
    if (index) query.set("tur", "ogrenci");
    else query.delete("tur");
    window.history.replaceState(
      null,
      "",
      "/kayit" + (query.size ? "?" + query.toString() : ""),
    );
    buttons.current[index]?.focus();
  }
  return (
    <>
      {learning && (
        <div className="account-tabs" role="tablist" aria-label="Hesap türü">
          {["Öğretmen", "Öğrenci"].map((label, i) => (
            <button
              key={label}
              ref={(el) => {
                buttons.current[i] = el;
              }}
              type="button"
              disabled={!ready}
              id={id + "-tab-" + i}
              role="tab"
              aria-label={label}
              aria-describedby={id + "-choice-help-" + i}
              aria-selected={Number(student) === i}
              aria-controls={id + "-panel-" + i}
              tabIndex={Number(student) === i ? 0 : -1}
              onClick={() => select(i)}
              onKeyDown={(e) => {
                if (
                  ["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)
                ) {
                  e.preventDefault();
                  select(e.key === "Home" ? 0 : e.key === "End" ? 1 : 1 - i);
                }
              }}
            >
              <span>{label}</span>
              <span
                id={id + "-choice-help-" + i}
                className="account-choice-help"
              >
                {i === 0 ? "Oyunlarını paylaş" : "Sınıfına katıl"}
              </span>
            </button>
          ))}
        </div>
      )}
      <div
        id={id + "-panel-0"}
        role={learning ? "tabpanel" : undefined}
        aria-labelledby={learning ? id + "-tab-0" : undefined}
        hidden={student}
      >
        <p className="auth-description">
          Oyunlarını paylaş, sınıfınla yeni keşifler başlat.
        </p>
        <AuthForm mode="register" embedded />
      </div>
      {learning && (
        <div
          id={id + "-panel-1"}
          role="tabpanel"
          aria-labelledby={id + "-tab-1"}
          hidden={!student}
        >
          <p className="auth-description">
            Öğretmeninden aldığın sınıf koduyla katıl. E-posta adresi gerekmez.
          </p>
          <StudentAuthForm mode="register" embedded next={next} />
        </div>
      )}
      <p className="auth-links">
        Zaten hesabın var mı?{" "}
        <Link
          href={"/giris" + (next ? "?next=" + encodeURIComponent(next) : "")}
        >
          Giriş yap
        </Link>
      </p>
    </>
  );
}
