// Launches the vendored Plant_Growth Flask app (plant-growth/) alongside
// Next.js, so a single deployment/dev command runs both. Flask binds to
// 127.0.0.1 only — it's never exposed directly, only reachable through the
// authenticated proxy at app/dashboard/services/plant-growth. See
// app/dashboard/services/plant-growth/[[...path]]/route.ts for the proxy and
// plant-growth/app.py for the shared-secret check this depends on.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const rootDir = path.resolve(import.meta.dirname, "..");
const plantGrowthDir = path.join(rootDir, "plant-growth");
const port = process.env.PLANT_GROWTH_INTERNAL_PORT || "8091";

function resolvePython() {
  const venvPython =
    process.platform === "win32"
      ? path.join(plantGrowthDir, ".venv", "Scripts", "python.exe")
      : path.join(plantGrowthDir, ".venv", "bin", "python");
  if (existsSync(venvPython)) return venvPython;
  return process.platform === "win32" ? "python" : "python3";
}

const nextMode = process.argv[2] === "start" ? "start" : "dev";
const nextArgs = nextMode === "start" ? ["start"] : ["dev", "-p", "3002"];

const flask = spawn(resolvePython(), ["app.py"], {
  cwd: plantGrowthDir,
  env: { ...process.env, PORT: port, PROXY_SHARED_SECRET: process.env.PLANT_GROWTH_PROXY_SECRET },
  stdio: "inherit",
});
flask.on("exit", (code) => {
  console.error(`[plant-growth] Flask process exited with code ${code}`);
});

const next = spawn(["npx", "next", ...nextArgs].join(" "), {
  cwd: rootDir,
  env: process.env,
  stdio: "inherit",
  shell: true,
});

function shutdown(signal) {
  flask.kill(signal);
  next.kill(signal);
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

next.on("exit", (code) => {
  flask.kill("SIGTERM");
  process.exit(code ?? 0);
});
