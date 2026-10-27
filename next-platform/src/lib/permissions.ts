/** One policy for navigation, page guards and API authorization. Wire roles stay unchanged. */
export const roles = ["student", "teacher", "editor", "admin"] as const;
export type Role = (typeof roles)[number];
export type Capability =
  | "learn"
  | "create"
  | "teach"
  | "review"
  | "inspect"
  | "administer"
  | "recover";
const policy: Record<Role, readonly Capability[]> = {
  student: ["learn"],
  teacher: ["create", "teach", "inspect", "recover"],
  editor: ["create", "teach", "review", "inspect", "recover"],
  admin: ["inspect", "administer", "recover"],
};
export function can(role: string | undefined, capability: Capability) {
  return Boolean(
    role &&
    roles.includes(role as Role) &&
    policy[role as Role].includes(capability),
  );
}
export const rolesFor = (capability: Capability): string[] =>
  roles.filter((role) => can(role, capability));
export const roleLabel = (role: string) =>
  ({
    student: "Öğrenci",
    teacher: "Öğretmen",
    editor: "Yönetici",
    admin: "Admin",
  })[role] ?? "Hesap";
export function roleHome(role: string | undefined) {
  return (
    {
      student: "/ogrenci",
      teacher: "/ogretmen",
      editor: "/editor",
      admin: "/yonetim",
    }[role ?? ""] ?? "/giris"
  );
}
export type WorkspaceLink = { href: string; label: string; exact?: boolean };
export function workspaceLinks(
  role: string,
  learning = false,
): WorkspaceLink[] {
  if (role === "student")
    return [
      { href: "/ogrenci", label: "Ödevler", exact: true },
      { href: "/ogrenci?bolum=oyunlar", label: "Oyunlar" },
      { href: "/ogrenci?bolum=siniflar", label: "Sınıflar" },
      { href: "/hesap", label: "Hesap" },
    ];
  return [
    ...(can(role, "review")
      ? [{ href: "/editor", label: "İnceleme kuyruğu" }]
      : []),
    ...(can(role, "create")
      ? [
          { href: "/ogretmen", label: "İçeriklerim", exact: true },
          { href: "/ogretmen/yeni", label: "Oyun paylaş" },
        ]
      : []),
    ...(can(role, "teach") && learning
      ? [
          { href: "/ogretmen/siniflar", label: "Sınıflar" },
          { href: "/ogretmen/odevler", label: "Ödevler ve raporlar" },
        ]
      : []),
    ...(can(role, "administer")
      ? [
          { href: "/yonetim", label: "Kullanıcılar", exact: true },
          { href: "/yonetim?bolum=tanimlar", label: "Tanımlar" },
          { href: "/yonetim?bolum=yayinlar", label: "Yayınlar" },
          { href: "/yonetim?bolum=sistem", label: "Sistem işlemleri" },
          { href: "/yonetim?bolum=kayitlar", label: "İşlem kayıtları" },
        ]
      : []),
    { href: "/hesap", label: "Hesap" },
  ];
}
export function workspaceLinkActive(
  link: WorkspaceLink,
  pathname: string,
  section: string | null,
) {
  const [path, query] = link.href.split("?");
  if (query)
    return (
      pathname === path && section === new URLSearchParams(query).get("bolum")
    );
  if (path === "/ogrenci" || path === "/yonetim")
    return (
      pathname === path &&
      (!section ||
        section === (path === "/ogrenci" ? "odevler" : "kullanicilar"))
    );
  return link.exact
    ? pathname === path
    : pathname === path || pathname.startsWith(path + "/");
}
/** Reject external, encoded-path tricks and destinations outside the account's role. Ownership is checked by the destination. */
export function safeReturn(value: string | null | undefined, role: string) {
  if (
    typeof value !== "string" ||
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\x00-\x20]/.test(value)
  )
    return roleHome(role);
  let url: URL;
  try {
    url = new URL(value, "https://local.invalid");
  } catch {
    return roleHome(role);
  }
  const path = url.pathname;
  if (url.origin !== "https://local.invalid" || /%/i.test(path))
    return roleHome(role);
  const allowed =
    path === "/" ||
    path === "/kesfet" ||
    path === "/hesap" ||
    path.startsWith("/icerik/") ||
    (can(role, "create") &&
      (path === "/ogretmen" || path.startsWith("/ogretmen/"))) ||
    (can(role, "review") &&
      (path === "/editor" || path.startsWith("/editor/"))) ||
    (can(role, "administer") &&
      (path === "/yonetim" || /^\/editor\/[^/]+$/.test(path))) ||
    (can(role, "learn") &&
      (path === "/ogrenci" || path.startsWith("/ogrenci/oyna/")));
  return allowed ? url.pathname + url.search + url.hash : roleHome(role);
}
