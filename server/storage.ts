// Uploads use Cloudinary when CLOUDINARY_URL is configured (for Railway and
// other external hosts), with the managed project storage as a local fallback.

import { v2 as cloudinary } from "cloudinary";
import { ENV } from "./_core/env";

function getCloudinaryClient() {
  const rawUrl = process.env.CLOUDINARY_URL;
  if (!rawUrl) return null;

  const cloudinaryUrl = new URL(rawUrl);
  if (cloudinaryUrl.protocol !== "cloudinary:" || !cloudinaryUrl.hostname || !cloudinaryUrl.username || !cloudinaryUrl.password) {
    throw new Error("Cloudinary config is invalid: set CLOUDINARY_URL as cloudinary://API_KEY:API_SECRET@CLOUD_NAME");
  }

  cloudinary.config({
    cloud_name: cloudinaryUrl.hostname,
    api_key: decodeURIComponent(cloudinaryUrl.username),
    api_secret: decodeURIComponent(cloudinaryUrl.password),
    secure: true,
  });
  return cloudinary;
}

function getForgeConfig() {
  const forgeUrl = ENV.forgeApiUrl;
  const forgeKey = ENV.forgeApiKey;

  if (!forgeUrl || !forgeKey) {
    throw new Error(
      "Storage config missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY",
    );
  }

  return { forgeUrl: forgeUrl.replace(/\/+$/, ""), forgeKey };
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const cloudinaryClient = getCloudinaryClient();
  if (cloudinaryClient) {
    const bytes = typeof data === "string" ? Buffer.from(data) : Buffer.from(data);
    const resourceType = contentType.startsWith("video/") ? "video" : "image";
    const result = await new Promise<{ public_id: string; secure_url: string }>((resolve, reject) => {
      const stream = cloudinaryClient.uploader.upload_stream(
        {
          folder: "aladel-optics/site-media",
          resource_type: resourceType,
          use_filename: true,
          unique_filename: true,
          overwrite: false,
        },
        (error, uploadResult) => {
          if (error || !uploadResult?.secure_url || !uploadResult.public_id) {
            reject(error ?? new Error("Cloudinary returned an incomplete upload response"));
            return;
          }
          resolve({ public_id: uploadResult.public_id, secure_url: uploadResult.secure_url });
        },
      );
      stream.end(bytes);
    });

    return { key: result.public_id, url: result.secure_url };
  }

  const { forgeUrl, forgeKey } = getForgeConfig();
  const key = appendHashSuffix(normalizeKey(relKey));

  // 1. Get presigned PUT URL from Forge
  const presignUrl = new URL("v1/storage/presign/put", forgeUrl + "/");
  presignUrl.searchParams.set("path", key);

  const presignResp = await fetch(presignUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` },
  });

  if (!presignResp.ok) {
    const msg = await presignResp.text().catch(() => presignResp.statusText);
    throw new Error(`Storage presign failed (${presignResp.status}): ${msg}`);
  }

  const { url: s3Url } = (await presignResp.json()) as { url: string };
  if (!s3Url) throw new Error("Forge returned empty presign URL");

  // 2. PUT file directly to S3
  const blob =
    typeof data === "string"
      ? new Blob([data], { type: contentType })
      : new Blob([data as any], { type: contentType });

  const uploadResp = await fetch(s3Url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: blob,
  });

  if (!uploadResp.ok) {
    throw new Error(`Storage upload to S3 failed (${uploadResp.status})`);
  }

  return { key, url: `/manus-storage/${key}` };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: `/manus-storage/${key}` };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const { forgeUrl, forgeKey } = getForgeConfig();
  const key = normalizeKey(relKey);

  const getUrl = new URL("v1/storage/presign/get", forgeUrl + "/");
  getUrl.searchParams.set("path", key);

  const resp = await fetch(getUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` },
  });

  if (!resp.ok) {
    const msg = await resp.text().catch(() => resp.statusText);
    throw new Error(`Storage signed URL failed (${resp.status}): ${msg}`);
  }

  const { url } = (await resp.json()) as { url: string };
  return url;
}
