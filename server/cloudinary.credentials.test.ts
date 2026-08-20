import { describe, expect, it } from "vitest";

describe("Cloudinary credentials", () => {
  it("authenticates against the Cloudinary Admin API", async () => {
    const rawUrl = process.env.CLOUDINARY_URL;
    expect(rawUrl).toBeTruthy();

    const cloudinaryUrl = new URL(rawUrl!);
    expect(cloudinaryUrl.protocol).toBe("cloudinary:");
    expect(cloudinaryUrl.hostname).toBeTruthy();
    expect(cloudinaryUrl.username).toBeTruthy();
    expect(cloudinaryUrl.password).toBeTruthy();

    const credentials = Buffer.from(`${cloudinaryUrl.username}:${cloudinaryUrl.password}`).toString("base64");
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryUrl.hostname}/resources/image?max_results=1`, {
      headers: { Authorization: `Basic ${credentials}` },
    });

    expect(response.ok).toBe(true);
  }, 20_000);
});
