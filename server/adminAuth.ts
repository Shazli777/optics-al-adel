import { timingSafeEqual } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { parse as parseCookieHeader } from "cookie";
import type { Request, Response } from "express";
import type { User } from "../drizzle/schema";
import { ADMIN_SESSION_COOKIE, ONE_YEAR_MS } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";

const ADMIN_OPEN_ID = "external-admin";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function sessionSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is required for the admin session");
  return new TextEncoder().encode(secret);
}

export function verifyAdminPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !password) return false;
  const supplied = Buffer.from(password);
  const configured = Buffer.from(expected);
  return supplied.length === configured.length && timingSafeEqual(supplied, configured);
}

export async function createAdminSession() {
  const expiresAt = Math.floor((Date.now() + SESSION_DURATION_MS) / 1000);
  return new SignJWT({ scope: "admin", name: "مدير بصريات العادل" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(ADMIN_OPEN_ID)
    .setExpirationTime(expiresAt)
    .sign(sessionSecret());
}

export function setAdminSession(res: Response, token: string, req: Request) {
  res.cookie(ADMIN_SESSION_COOKIE, token, { ...getSessionCookieOptions(req), maxAge: SESSION_DURATION_MS });
}

export function clearAdminSession(res: Response, req: Request) {
  res.clearCookie(ADMIN_SESSION_COOKIE, { ...getSessionCookieOptions(req), maxAge: -1 });
}

export async function getExternalAdmin(req: Request): Promise<User | null> {
  const token = parseCookieHeader(req.headers.cookie ?? "")[ADMIN_SESSION_COOKIE];
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, sessionSecret(), { algorithms: ["HS256"] });
    if (payload.sub !== ADMIN_OPEN_ID || payload.scope !== "admin") return null;
    const now = new Date();
    return { id: 0, openId: ADMIN_OPEN_ID, name: "مدير بصريات العادل", email: null, loginMethod: "password", role: "admin", createdAt: now, updatedAt: now, lastSignedIn: now };
  } catch {
    return null;
  }
}

export const externalAdminSessionLifetimeMs = SESSION_DURATION_MS;
