import { useParams } from "react-router-dom";

export default function PlayPage() {
  const { slug } = useParams<{ slug: string }>();
  // V1: gateway'den /api/contents/by-slug/{slug} ile play URL alınır.
  // Şimdilik placeholder iframe.
  const playUrl = `/api/contents/by-slug/${slug}/play`;
  return (
    <section className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-4">Oynat: {slug}</h1>
      <iframe
        src={playUrl}
        sandbox="allow-scripts allow-same-origin"
        className="w-full h-[640px] border rounded bg-white"
        title="play"
      />
    </section>
  );
}
