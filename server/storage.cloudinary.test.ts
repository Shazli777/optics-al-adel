import { afterEach, describe, expect, it, vi } from "vitest";

const cloudinaryMocks = vi.hoisted(() => ({
  config: vi.fn(),
  uploadStream: vi.fn(),
}));

vi.mock("cloudinary", () => ({
  v2: {
    config: cloudinaryMocks.config,
    uploader: { upload_stream: cloudinaryMocks.uploadStream },
  },
}));

import { storagePut } from "./storage";

describe("Cloudinary storage adapter", () => {
  const originalUrl = process.env.CLOUDINARY_URL;

  afterEach(() => {
    process.env.CLOUDINARY_URL = originalUrl;
    cloudinaryMocks.config.mockClear();
    cloudinaryMocks.uploadStream.mockReset();
  });

  it("uploads an image to Cloudinary and returns its secure delivery URL", async () => {
    process.env.CLOUDINARY_URL = "cloudinary://api-key:api-secret@demo-cloud";
    cloudinaryMocks.uploadStream.mockImplementation((_options, callback) => ({
      end: () => callback(undefined, { public_id: "aladel-optics/site-media/frame-123", secure_url: "https://res.cloudinary.com/demo-cloud/image/upload/frame-123.jpg" }),
    }));

    await expect(storagePut("site-media/frame.jpg", Buffer.from("image-bytes"), "image/jpeg")).resolves.toEqual({
      key: "aladel-optics/site-media/frame-123",
      url: "https://res.cloudinary.com/demo-cloud/image/upload/frame-123.jpg",
    });
    expect(cloudinaryMocks.config).toHaveBeenCalledWith(expect.objectContaining({ cloud_name: "demo-cloud", api_key: "api-key", api_secret: "api-secret" }));
    expect(cloudinaryMocks.uploadStream).toHaveBeenCalledWith(expect.objectContaining({ resource_type: "image", folder: "aladel-optics/site-media" }), expect.any(Function));
  });
});
