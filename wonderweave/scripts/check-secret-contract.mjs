import { readFileSync } from "node:fs";

const requiredSecrets = ["ANTHROPIC_API_KEY", "OPENAI_API_KEY"];
const requiredSettings = ["LEARNING_MODEL", "REALTIME_MODEL"];
const failures = [];

const envExample = readFileSync(".env.example", "utf8");
const gitignore = readFileSync(".gitignore", "utf8");
const hosting = JSON.parse(readFileSync(".openai/hosting.json", "utf8"));

for (const key of [...requiredSecrets, ...requiredSettings]) {
  if (!new RegExp(`^${key}=`, "m").test(envExample)) {
    failures.push(`.env.example is missing ${key}`);
  }
}

for (const key of requiredSecrets) {
  if (Object.hasOwn(hosting, key)) failures.push(`.openai/hosting.json must not contain ${key}`);
  if (envExample.includes(`NEXT_PUBLIC_${key}`)) failures.push(`${key} must never be public`);
}

if (!gitignore.includes(".env*")) failures.push(".gitignore must ignore .env files");
if (!gitignore.includes(".dev.vars*")) failures.push(".gitignore must ignore Wrangler .dev.vars files");
if (!gitignore.includes(".secrets/")) failures.push(".gitignore must ignore local secret directories");

if (process.argv.includes("--runtime")) {
  for (const key of requiredSecrets) {
    const value = process.env[key]?.trim();
    if (!value || value.length < 20) failures.push(`runtime secret ${key} is not configured`);
  }
}

if (failures.length) {
  console.error("Secret contract failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Secret contract OK: ${requiredSecrets.length} server secrets and ${requiredSettings.length} non-secret settings.`);
