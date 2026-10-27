import Link from "next/link";
export default function NotFound() {
  return (
    <div className="empty" style={{ marginTop: 48 }}>
      <h1>Bu içerik burada değil.</h1>
      <p>Bağlantı değişmiş veya içerik yayından kaldırılmış olabilir.</p>
      <Link className="button button-primary" href="/kesfet">
        Oyunları keşfet
      </Link>
    </div>
  );
}
