import { DEFAULT_SITE_CONTENT } from "@shared/siteContent";
import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  getSiteContent: vi.fn(),
  saveSiteContent: vi.fn(),
}));

import { getSiteContent, saveSiteContent } from "./db";
import { appRouter } from "./routers";

type UserContext = NonNullable<TrpcContext["user"]>;

function context(role: "admin" | "user"): TrpcContext {
  const user: UserContext = {
    id: role === "admin" ? 1 : 2,
    openId: `${role}-open-id`,
    name: role,
    email: `${role}@example.com`,
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return { user, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("site content procedures", () => {
  it("returns the default public content when no saved record exists", async () => {
    vi.mocked(getSiteContent).mockResolvedValueOnce(null);
    const caller = appRouter.createCaller({ user: null, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] });
    await expect(caller.site.get()).resolves.toEqual(DEFAULT_SITE_CONTENT);
  });

  it("rejects a save attempt from a non-admin user", async () => {
    const caller = appRouter.createCaller(context("user"));
    await expect(caller.site.save(DEFAULT_SITE_CONTENT)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows an administrator to save valid content", async () => {
    vi.mocked(saveSiteContent).mockResolvedValueOnce(undefined);
    const caller = appRouter.createCaller(context("admin"));
    await expect(caller.site.save(DEFAULT_SITE_CONTENT)).resolves.toEqual({ success: true });
    expect(saveSiteContent).toHaveBeenCalledWith(DEFAULT_SITE_CONTENT, "admin-open-id");
  });

  it("saves and returns every independently configured section button color", async () => {
    const customized = structuredClone(DEFAULT_SITE_CONTENT);
    customized.textColors = {
      ...customized.textColors,
      collectionAction: "#AA3300",
      productsAction: "#114477",
      offerAction: "#225588",
      contactReturn: "#336699",
      customAction: "#4477AA",
    };
    vi.mocked(saveSiteContent).mockResolvedValueOnce(undefined);
    vi.mocked(getSiteContent).mockResolvedValueOnce(customized);
    const caller = appRouter.createCaller(context("admin"));

    await expect(caller.site.save(customized)).resolves.toEqual({ success: true });
    await expect(caller.site.get()).resolves.toMatchObject({ textColors: customized.textColors });
    expect(saveSiteContent).toHaveBeenCalledWith(customized, "admin-open-id");
  });
});
