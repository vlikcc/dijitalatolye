import path from "node:path";
import { spawn } from "node:child_process";
try {
    process.loadEnvFile(".env");
} catch {}
if (process.env.DATA_DIR)
    process.env.DATA_DIR = path.resolve(process.env.DATA_DIR);
const child = spawn(process.argv[2], process.argv.slice(3), {
    stdio: "inherit",
    env: process.env,
});
for (const signal of ["SIGINT", "SIGTERM"])
    process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code ?? 1));
