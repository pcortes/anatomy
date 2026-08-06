import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const signatures = [
  ["OpenAI API key", /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g],
  ["Anthropic API key", /\bsk-ant-[A-Za-z0-9_-]{20,}\b/g],
  ["GitHub token", /\bgh[pousr]_[A-Za-z0-9]{30,}\b/g],
  ["AWS access key", /\bAKIA[0-9A-Z]{16}\b/g],
  ["private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
  ["Sites bypass bearer", /\bSITES_BYPASS_BEARER\s*=\s*[^\s'"$]{20,}/g],
];
const skippedExtensions = /\.(?:gif|glb|ico|jpe?g|mp4|pdf|png|wasm|webm|webp|zip)$/i;
const output = execFileSync(
  "git",
  ["ls-files", "-z", "--cached", "--others", "--exclude-standard"],
  { encoding: "buffer" },
);
const files = output.toString("utf8").split("\0").filter(Boolean);
const violations = [];
let historyBlobCount = 0;

for (const file of files) {
  if (skippedExtensions.test(file)) continue;
  const absolute = resolve(file);
  let contents;
  try {
    if (statSync(absolute).size > 5_000_000) continue;
    contents = readFileSync(absolute);
  } catch {
    continue;
  }
  if (contents.includes(0)) continue;
  scanText(contents.toString("utf8"), file);
}

if (process.argv.includes("--history")) {
  const objects = execFileSync("git", ["rev-list", "--objects", "--all"], { encoding: "utf8" });
  const seen = new Set();
  for (const entry of objects.split("\n").filter(Boolean)) {
    const separator = entry.indexOf(" ");
    if (separator < 0) continue;
    const objectId = entry.slice(0, separator);
    const path = entry.slice(separator + 1);
    if (seen.has(objectId) || skippedExtensions.test(path)) continue;
    seen.add(objectId);
    let type;
    try {
      type = execFileSync("git", ["cat-file", "-t", objectId], { encoding: "utf8" }).trim();
    } catch {
      continue;
    }
    if (type !== "blob") continue;
    const size = Number(execFileSync("git", ["cat-file", "-s", objectId], { encoding: "utf8" }));
    if (!Number.isFinite(size) || size > 5_000_000) continue;
    const contents = execFileSync("git", ["cat-file", "blob", objectId], { encoding: "buffer", maxBuffer: 6_000_000 });
    if (contents.includes(0)) continue;
    historyBlobCount += 1;
    scanText(contents.toString("utf8"), `history:${objectId.slice(0, 12)}:${path}`);
  }
}

function scanText(text, location) {
  for (const [label, signature] of signatures) {
    signature.lastIndex = 0;
    for (const match of text.matchAll(signature)) {
      const line = text.slice(0, match.index).split("\n").length;
      violations.push(`${location}:${line} (${label})`);
    }
  }
}

if (violations.length) {
  console.error("Potential committed secret material detected (values withheld):");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

const historyResult = historyBlobCount ? ` and ${historyBlobCount} reachable historical blobs` : "";
console.log(`Secret scan OK: ${files.length} tracked and non-ignored files${historyResult} checked; no credential signatures found.`);
