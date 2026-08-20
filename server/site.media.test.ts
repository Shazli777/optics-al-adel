import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  getSiteContent: vi.fn(),
  saveSiteContent: vi.fn(),
}));

vi.mock("./storage", () => ({ storagePut: vi.fn() }));

import { appRouter } from "./routers";
import { storagePut } from "./storage";

function adminContext(): TrpcContext {
  return {
    user: {
      id: 7,
      openId: "owner-open-id",
      name: "Owner",
      email: "owner@example.com",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("site media upload", () => {
  it("stores an image uploaded by an administrator and returns its public storage URL", async () => {
    vi.mocked(storagePut).mockResolvedValueOnce({ key: "site-media/7/frame.png", url: "/manus-storage/site-media/7/frame.png" });
    const caller = appRouter.createCaller(adminContext());
    const result = await caller.site.upload({
      fileName: "frame image.png",
      contentType: "image/png",
      dataBase64: Buffer.from("image-bytes").toString("base64"),
    });
    expect(result.url).toBe("/manus-storage/site-media/7/frame.png");
    expect(storagePut).toHaveBeenCalledWith(expect.stringMatching(/^site-media\/7\/\d+-frame-image\.png$/), expect.any(Buffer), "image/png");
  });

  it("rejects a non-image and non-video upload", async () => {
    const caller = appRouter.createCaller(adminContext());
    await expect(caller.site.upload({ fileName: "notes.txt", contentType: "text/plain", dataBase64: "dGVzdA==" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
