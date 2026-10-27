import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { twoFactor } from "better-auth/plugins";
import nodemailer from "nodemailer";
import { db } from "./db";
import * as schema from "./schema";
import { studentAuth } from "./student-auth";
import { settings } from "./env";
let instance: ReturnType<typeof createAuth>;
async function send(to: string, subject: string, url: string) {
  if (to.endsWith(".placeholder.invalid")) return;
  if (!process.env.SMTP_HOST)
    throw new Error("E-posta hizmeti yapılandırılmadı.");
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    ...(process.env.SMTP_USER
      ? {
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          },
        }
      : {}),
  });
  await transport.sendMail({
    from: process.env.MAIL_FROM || "DijitalAtölye <noreply@localhost>",
    to,
    subject,
    text: `${subject}\n\n${url}\n\nBu işlemi siz başlatmadıysanız bu mesajı yok sayabilirsiniz.`,
  });
}
function createAuth() {
  const env = settings();
  return betterAuth({
    appName: "DijitalAtölye",
    baseURL: env.appUrl,
    secret: env.secret,
    database: drizzleAdapter(db, { provider: "pg", schema }),
    trustedOrigins: [env.appUrl],
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      minPasswordLength: 12,
      sendResetPassword: async ({ user, url }) =>
        send(user.email, "Parolanızı yenileyin", url),
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: false,
      sendVerificationEmail: async ({ user, url }) =>
        send(user.email, "E-posta adresinizi doğrulayın", url),
    },
    user: {
      additionalFields: {
        role: { type: "string", defaultValue: "teacher", input: false },
      },
    },
    plugins: [twoFactor({ issuer: "DijitalAtölye" }), studentAuth()],
    rateLimit: { enabled: true, storage: "memory", window: 60, max: 30 },
    advanced: {
      useSecureCookies: env.production && env.gameProtocol === "https",
      ipAddress: { disableIpTracking: true },
    },
    session: { cookieCache: { enabled: false } },
  });
}
export const getAuth = () => (instance ??= createAuth());
