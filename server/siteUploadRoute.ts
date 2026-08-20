import type { Request, Response } from "express";
import { TRPCError } from "@trpc/server";
import { getExternalAdmin } from "./adminAuth";
import { mediaInput, uploadSiteMedia } from "./siteMedia";

type SiteUploadHandler = (request: Request, response: Response) => Promise<void>;
type RouteRegistrar = { post: (path: string, handler: SiteUploadHandler) => unknown };

export function registerSiteUploadRoute(app: RouteRegistrar) {
  app.post("/api/site-upload", async (req, res) => {
    const admin = await getExternalAdmin(req);
    if (!admin) {
      res.status(401).json({ message: "يلزم تسجيل دخول المدير لرفع الوسائط." });
      return;
    }
    const parsed = mediaInput.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "بيانات الوسيط المرفوع غير مكتملة أو غير صالحة." });
      return;
    }
    try {
      const result = await uploadSiteMedia(parsed.data, admin.id);
      res.status(201).json(result);
    } catch (error) {
      const status = error instanceof TRPCError && error.code === "PAYLOAD_TOO_LARGE" ? 413 : 400;
      const message = error instanceof Error ? error.message : "تعذر رفع الوسيط الآن.";
      res.status(status).json({ message });
    }
  });
}
