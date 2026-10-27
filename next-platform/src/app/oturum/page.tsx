import { redirect } from "next/navigation";
import { pageUser } from "@/server/page-access";
import { roles, safeReturn } from "@/lib/permissions";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const user = await pageUser([...roles], true, next);
  redirect(safeReturn(next, user.role));
}
