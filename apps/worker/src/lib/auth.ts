/* Operator session cookie + PIN login rate limit */

export type Env = {
  DB: D1Database;
  QUEUE_DO: DurableObjectNamespace;
  ENVIRONMENT: string;
  OPERATOR_PIN?: string;
  SESSION_SECRET?: string;
};

const COOKIE_NAME = "ql_op_session";
const SESSION_TTL_S = 12 * 60 * 60; // 12h
const LOGIN_WINDOW_MS = 60_000;
const LOGIN_MAX = 10;

/** Per-isolate IP → timestamps of failed login attempts. */
const loginHits = new Map<string, number[]>();

function pinKey(env: Env): string {
  return env.SESSION_SECRET || env.OPERATOR_PIN || "queueless-dev-pin";
}

async function hmacSign(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

function encodeSession(exp: number): string {
  return `${exp}.${crypto.randomUUID()}`;
}

export function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k) out[k] = decodeURIComponent(v.join("="));
  }
  return out;
}

export async function signSession(env: Env): Promise<string> {
  const payload = encodeSession(Math.floor(Date.now() / 1000) + SESSION_TTL_S);
  const sig = await hmacSign(pinKey(env), payload);
  return `${payload}.${sig}`;
}

export async function verifySession(env: Env, cookie: string | undefined): Promise<boolean> {
  if (!cookie) return false;
  const parts = cookie.split(".");
  if (parts.length !== 3) return false;
  const [expStr, , sig] = parts;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return false;
  const expected = await hmacSign(pinKey(env), `${expStr}.${parts[1]}`);
  // constant-ish compare
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}

export function sessionCookie(value: string | null): string {
  if (value === null) {
    return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;
  }
  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_TTL_S}`;
}

export function getOperatorCookie(header: string | undefined): string | undefined {
  return parseCookies(header)[COOKIE_NAME];
}

export function loginRateLimited(ip: string): { limited: boolean; retryAfterSec: number } {
  const now = Date.now();
  const windowStart = now - LOGIN_WINDOW_MS;
  const hits = (loginHits.get(ip) || []).filter((t) => t > windowStart);
  if (hits.length >= LOGIN_MAX) {
    const retryAfterSec = Math.ceil((hits[0] + LOGIN_WINDOW_MS - now) / 1000);
    return { limited: true, retryAfterSec: Math.max(retryAfterSec, 1) };
  }
  return { limited: false, retryAfterSec: 0 };
}

export function recordLoginFailure(ip: string): void {
  const now = Date.now();
  const hits = (loginHits.get(ip) || []).filter((t) => t > now - LOGIN_WINDOW_MS);
  hits.push(now);
  loginHits.set(ip, hits);
}

export function clearLoginFailures(ip: string): void {
  loginHits.delete(ip);
}

export async function pinMatches(env: Env, pin: string): Promise<boolean> {
  const expected = env.OPERATOR_PIN;
  if (!expected) return false;
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(pin)),
    crypto.subtle.digest("SHA-256", enc.encode(expected)),
  ]);
  const ab = new Uint8Array(a);
  const bb = new Uint8Array(b);
  if (ab.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i];
  return diff === 0;
}

export function clientIp(c: any): string {
  return (
    c.req.header("CF-Connecting-IP") ||
    c.req.header("X-Real-IP") ||
    c.req.header("X-Forwarded-For")?.split(",")[0]?.trim() ||
    "0.0.0.0"
  );
}
