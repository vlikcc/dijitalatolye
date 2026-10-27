import { demoGames } from "@/games/demos";
import { demoDocument } from "@/games/demo-document";
export const dynamic = "force-dynamic";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  if (process.env.DEMO_CATALOG_ENABLED !== "true")
    return new Response("Bulunamadı", { status: 404 });
  const { slug } = await params;
  const selected = demoGames.find((g) => g.slug === slug);
  if (!selected) return new Response("Bulunamadı", { status: 404 });
  return new Response(
    demoDocument(
      selected,
      new URL(request.url).searchParams.get("cover") === "1",
    ),
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    },
  );
}
