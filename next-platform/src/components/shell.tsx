import { can, roleHome } from "@/lib/permissions";
import { learningEnabled } from "@/server/learning-feature";
import Link from "next/link";
import { headers } from "next/headers";
import { getAuth } from "@/server/auth";
import { HeaderNavigation } from "./header-navigation";
import { PuzzleMark } from "./puzzle-mark";
export function Logo({ animated = false }: { animated?: boolean }) {
  return (
    <Link
      href="/"
      className="brand"
      aria-label="Dijital Oyun Atölyesi ana sayfa"
    >
      {animated ? (
        <PuzzleMark />
      ) : (
        <img src="/brand/puzzle-mark.webp" width={48} height={48} alt="" />
      )}
      <span className="brand-wordmark">
        <span className="brand-descriptor">Dijital Oyun</span>
        <span className="brand-name">atölyesi</span>
      </span>
    </Link>
  );
}
export async function Header() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  return (
    <header className="header-shell">
      <div className="site-header container">
        <Logo animated />
        <HeaderNavigation
          signedIn={Boolean(session)}
          role={session?.user.role}
          learning={learningEnabled()}
        />
      </div>
    </header>
  );
}
export async function Footer() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  return (
    <footer className="footer-shell">
      <div className="footer container">
        <Logo />
        <nav className="footer-links" aria-label="Alt menü">
          <Link href="/kesfet">Oyunlar</Link>
          <Link href="/kesfet?saved=1">Kaydettiklerim</Link>
          <Link href="/nasil-kullanilir">Nasıl kullanılır?</Link>
          {session && can(session.user.role, "create") && (
            <Link href="/ogretmen/yeni">Oyun paylaş</Link>
          )}
          <Link href={session ? roleHome(session.user.role) : "/giris"}>
            {session ? "Çalışma alanım" : "Giriş yap"}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
