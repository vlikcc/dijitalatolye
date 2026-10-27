import { rolesFor } from "../lib/permissions";
import { learningEnabled } from "./learning-feature";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { getAuth } from "./auth";
export async function pageUser(
  roles = rolesFor("inspect"),
  need2fa = true,
  returnTo?: string,
) {
  const s = await getAuth().api.getSession({ headers: await headers() });
  if (!s)
    redirect(
      "/giris" + (returnTo ? "?next=" + encodeURIComponent(returnTo) : ""),
    );
  if (!roles.includes(s.user.role)) notFound();
  if (s.user.role === "student" && !learningEnabled()) notFound();
  if (s.user.role !== "student" && !s.user.emailVerified)
    redirect("/giris?verify=1");
  if (
    need2fa &&
    ["editor", "admin"].includes(s.user.role) &&
    !s.user.twoFactorEnabled
  )
    redirect(
      "/hesap" + (returnTo ? "?next=" + encodeURIComponent(returnTo) : ""),
    );
  return s.user;
}
