import { describe, expect, it } from "vitest";
import { createAdminSession, getExternalAdmin, verifyAdminPassword } from "./adminAuth";

describe("external admin password authentication", () => {
  it("accepts the configured administrator password without exposing it", () => {
    const configuredPassword = process.env.ADMIN_PASSWORD;
    expect(configuredPassword).toBeTruthy();
    expect(verifyAdminPassword(configuredPassword!)).toBe(true);
    expect(verifyAdminPassword("incorrect-password")).toBe(false);
  });

  it("creates and verifies an HTTP-only admin session token", async () => {
    const token = await createAdminSession();
    const admin = await getExternalAdmin({ headers: { cookie: `__Host-aladel_admin=${token}` } } as any);
    expect(admin).toMatchObject({ role: "admin", openId: "external-admin" });
  });
});
