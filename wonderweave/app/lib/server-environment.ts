import { env } from "cloudflare:workers";

export const REQUIRED_SERVER_SECRETS = ["ANTHROPIC_API_KEY", "OPENAI_API_KEY"] as const;
export const SERVER_SETTINGS = ["LEARNING_MODEL", "REALTIME_MODEL"] as const;

export type ServerSecretName = typeof REQUIRED_SERVER_SECRETS[number];
export type ServerSettingName = typeof SERVER_SETTINGS[number];

const PLACEHOLDER_SECRET = /^(?:change[-_ ]?me|example|replace[-_ ]?me|test|your[-_ ])/i;

/**
 * Reads a server-only secret from Cloudflare/Sites bindings first and the
 * process environment second. Never add a NEXT_PUBLIC_ fallback here.
 */
export function readServerSecret(name: ServerSecretName) {
  const value = readRuntimeValue(name)?.trim();
  if (!value || value.length < 20 || PLACEHOLDER_SECRET.test(value)) return null;
  return value;
}

export function readServerSetting(name: ServerSettingName, fallback: string) {
  return readRuntimeValue(name)?.trim() || fallback;
}

function readRuntimeValue(name: ServerSecretName | ServerSettingName) {
  const bindings = env as unknown as Record<string, unknown>;
  const binding = bindings[name];
  if (typeof binding === "string") return binding;
  return process.env[name];
}
