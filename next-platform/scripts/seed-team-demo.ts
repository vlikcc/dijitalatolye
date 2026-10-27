import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { pool, transaction } from "../src/server/db";

if (process.env.BUNDLED_DEMO_ONLY !== "true")
  throw new Error("Team demo bootstrap requires BUNDLED_DEMO_ONLY=true.");
const password = process.env.DEMO_TEACHER_PASSWORD;
const classCode = process.env.DEMO_CLASS_CODE;
if (
  !password ||
  password.length < 20 ||
  !classCode ||
  !/^[A-Z0-9]{8,16}$/.test(classCode)
)
  throw new Error("Set a random demo teacher password and class code.");
const email = "demo@doa.gorkem.io";
try {
  const passwordHash = await hashPassword(password);
  await transaction(async (_tx, client) => {
    await client.query("SELECT pg_advisory_xact_lock(726352)");
    const existing = await client.query("SELECT id FROM users WHERE email=$1", [
      email,
    ]);
    if (existing.rowCount) {
      console.log(
        "Team demo already initialized; accounts and classes unchanged.",
      );
      return;
    }
    const id = randomUUID();
    await client.query(
      "INSERT INTO users(id,name,email,email_verified,role) VALUES($1,$2,$3,true,'teacher')",
      [id, "Demo Öğretmen", email],
    );
    await client.query(
      "INSERT INTO accounts(id,account_id,provider_id,user_id,password) VALUES($1,$2,'credential',$2,$3)",
      [randomUUID(), id, passwordHash],
    );
    await client.query(
      "INSERT INTO classrooms(teacher_id,name,join_code) VALUES($1,$2,$3)",
      [id, "Atölye Demo Sınıfı", classCode],
    );
    await client.query(
      "INSERT INTO audit(actor_id,action,target_id) VALUES($1,'demo.bootstrapped',$1)",
      [id],
    );
    console.log("Team demo teacher and class initialized.");
  });
} finally {
  await pool.end();
}
