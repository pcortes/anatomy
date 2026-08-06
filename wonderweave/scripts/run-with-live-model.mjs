import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";

const envFile = process.env.LIVE_MODEL_ENV_FILE;
const realtimeEnvFile = process.env.LIVE_REALTIME_ENV_FILE;
const [command, ...args] = process.argv.slice(2);

if (!envFile) {
  console.error("LIVE_MODEL_ENV_FILE must point to an approved local env file.");
  process.exit(2);
}
if (!command) {
  console.error("Usage: node scripts/run-with-live-model.mjs <command> [args...]");
  process.exit(2);
}

let source;
try {
  source = readFileSync(envFile, "utf8");
} catch {
  console.error("The approved live-model env file could not be read.");
  process.exit(2);
}

const match = source.match(/^ANTHROPIC_API_KEY\s*=\s*(.+)$/m);
const apiKey = match?.[1].trim().replace(/^(["'])|(["'])$/g, "");
if (!apiKey) {
  console.error("ANTHROPIC_API_KEY is missing from the approved env file.");
  process.exit(2);
}

let realtimeSource = source;
if (realtimeEnvFile && realtimeEnvFile !== envFile) {
  try {
    realtimeSource = readFileSync(realtimeEnvFile, "utf8");
  } catch {
    console.error("The approved Realtime env file could not be read.");
    process.exit(2);
  }
}
const realtimeMatch = realtimeSource.match(/^OPENAI_API_KEY\s*=\s*(.+)$/m);
const realtimeApiKey = realtimeMatch?.[1].trim().replace(/^(["'])|(["'])$/g, "");

const child = spawn(command, args, {
  stdio: "inherit",
  env: {
    ...process.env,
    LIVE_E2E: process.env.LIVE_E2E || "1",
    ANTHROPIC_API_KEY: apiKey,
    LEARNING_MODEL: process.env.LEARNING_MODEL || "claude-sonnet-5",
    ...(realtimeApiKey ? { OPENAI_API_KEY: realtimeApiKey } : {}),
    REALTIME_MODEL: process.env.REALTIME_MODEL || "gpt-realtime-2.1",
  },
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("error", () => {
  console.error("The requested command could not be started.");
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
