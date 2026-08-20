import { v2 as cloudinary } from "cloudinary";
import { describe, expect, it } from "vitest";
import { storagePut } from "./storage";

const transparentGif = Buffer.from("R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==", "base64");

describe("Cloudinary live upload", () => {
  it("uploads and removes a tiny verification image", async () => {
    const uploaded = await storagePut("verification.gif", transparentGif, "image/gif");
    expect(uploaded.url).toMatch(/^https:\/\/res\.cloudinary\.com\//);

    const deleted = await cloudinary.uploader.destroy(uploaded.key, { resource_type: "image", invalidate: true });
    expect(["ok", "not found"]).toContain(deleted.result);
  }, 30_000);
});
