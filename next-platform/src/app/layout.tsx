import type { Metadata } from "next";
import "./globals.css";
import { Header, Footer } from "@/components/shell";
import { SavedGameFeedbackProvider } from "@/components/saved-game-feedback";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  robots: { index: false, follow: false, noarchive: true },
  title: {
    default: "Dijital Oyun Atölyesi — Her oyunda yeni bir keşif.",
    template: "%s · Dijital Oyun Atölyesi",
  },
  description:
    "Öğrenciler ve öğretmenler için eğitici oyunlar. Sınıfta veya evde keşfet, oyna ve öğren; hazırladığın oyunları paylaş.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" data-scroll-behavior="smooth">
      <body>
        <a href="#main" className="skip-link">
          İçeriğe geç
        </a>
        <Header />
        <main id="main" className="container">
          <SavedGameFeedbackProvider>{children}</SavedGameFeedbackProvider>
        </main>
        <Footer />
      </body>
    </html>
  );
}
