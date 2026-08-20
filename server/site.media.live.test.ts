import { v2 as cloudinary } from "cloudinary";
import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";

const transparentGif = "R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

function adminContext(): TrpcContext {
  return {
    user: {
      id: 999,
      openId: "cloudinary-verification-admin",
      name: "Cloudinary verification",
      email: "verify@example.com",
      loginMethod: "manual",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("admin media upload procedure", () => {
  it("returns a previewable Cloudinary URL for a file uploaded from the dashboard flow", async () => {
    const caller = appRouter.createCaller(adminContext());
    const uploaded = await caller.site.upload({
      fileName: "admin-upload-verification.gif",
      contentType: "image/gif",
      dataBase64: transparentGif,
    });

    expect(uploaded.key).toMatch(/^aladel-optics\/site-media\//);
    expect(uploaded.url).toMatch(/^https:\/\/res\.cloudinary\.com\//);

    const deleted = await cloudinary.uploader.destroy(uploaded.key, { resource_type: "image", invalidate: true });
    expect(["ok", "not found"]).toContain(deleted.result);
  }, 30_000);
});
