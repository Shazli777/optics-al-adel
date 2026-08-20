import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { storagePut } from "./storage";

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export const mediaInput = z.object({
  fileName: z.string().min(1).max(180),
  contentType: z.string().min(1).max(120),
  dataBase64: z.string().min(1).max(36_000_000),
});

export type SiteMediaInput = z.infer<typeof mediaInput>;

export async function uploadSiteMedia(input: SiteMediaInput, userId: number) {
  if (!input.contentType.startsWith("image/") && !input.contentType.startsWith("video/")) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "يسمح برفع الصور والفيديوهات فقط." });
  }
  const bytes = Buffer.from(input.dataBase64, "base64");
  if (bytes.byteLength > MAX_UPLOAD_BYTES) {
    throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "حجم الملف أكبر من 25 ميغابايت." });
  }
  const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
  return storagePut(`site-media/${userId}/${Date.now()}-${safeName}`, bytes, input.contentType);
}
