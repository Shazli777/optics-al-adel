import { ADMIN_SESSION_COOKIE } from "@shared/const";
import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { getExternalAdmin } from "./adminAuth";
import { appRouter } from "./routers";

type CookieWrite = { name: string; value: string; options: Record<string, unknown> };

describe("admin.login endpoint", () => {
  it("accepts the configured password, writes an admin session cookie, and restores an administrator", async () => {
    const writes: CookieWrite[] = [];
    const context: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { cookie: (name: string, value: string, options: Record<string, unknown>) => writes.push({ name, value, options }) } as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(context);
    const result = await caller.admin.login({ password: process.env.ADMIN_PASSWORD! });

    expect(result).toEqual({ success: true });
    expect(writes).toHaveLength(1);
    expect(writes[0]?.name).toBe(ADMIN_SESSION_COOKIE);
    expect(writes[0]?.options).toMatchObject({ httpOnly: true, secure: true, sameSite: "none", path: "/" });

    const admin = await getExternalAdmin({ headers: { cookie: `${ADMIN_SESSION_COOKIE}=${writes[0]?.value}` } } as any);
    expect(admin).toMatchObject({ role: "admin", openId: "external-admin" });
  });
});
