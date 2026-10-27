import { redirect } from "next/navigation";
export default async function Play({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  redirect(`/icerik/${encodeURIComponent((await params).slug)}?oyna=1`);
}
