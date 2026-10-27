import type { NextConfig } from "next";
const config: NextConfig = {
  output: "standalone",
  distDir: process.env.NEXT_DIST_DIR || ".next",
  serverExternalPackages: ["pg", "pg-boss", "yauzl", "yara"],
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: `frame-src 'self' http://*.${process.env.GAME_BASE_DOMAIN || "games.localhost"}:* https://*.${process.env.GAME_BASE_DOMAIN || "games.localhost"}; object-src 'none'; base-uri 'self'; frame-ancestors 'none'`,
          },
        ],
      },
      {
        source: "/demo-games/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; font-src data:; frame-ancestors 'self'; base-uri 'none'; form-action 'none'; sandbox allow-scripts",
          },
        ],
      },
    ];
  },
};
export default config;
