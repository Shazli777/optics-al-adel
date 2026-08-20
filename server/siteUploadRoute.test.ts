import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./adminAuth", () => ({ getExternalAdmin: vi.fn() }));
vi.mock("./siteMedia", async () => {
  const actual = await vi.importActual<typeof import("./siteMedia")>("./siteMedia");
  return { ...actual, uploadSiteMedia: vi.fn() };
});

import { getExternalAdmin } from "./adminAuth";
import { uploadSiteMedia } from "./siteMedia";
import { registerSiteUploadRoute } from "./siteUploadRoute";

describe("site upload HTTP route", () => {
  const createResponse = () => {
    const response = { status: vi.fn(), json: vi.fn() };
    response.status.mockReturnValue(response);
    return response;
  };

  const getHandler = () => {
    let handler: ((request: Request, response: Response) => Promise<void>) | undefined;
    registerSiteUploadRoute({ post: (_path, routeHandler) => { handler = routeHandler; } });
    return handler!;
  };

  beforeEach(() => vi.clearAllMocks());

  it("rejects a request without an active administrator session", async () => {
    vi.mocked(getExternalAdmin).mockResolvedValue(null);
    const response = createResponse();
    await getHandler()({ body: {} } as Request, response as unknown as Response);
    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({ message: "يلزم تسجيل دخول المدير لرفع الوسائط." });
  });

  it("uploads authenticated image data and returns its preview URL", async () => {
    vi.mocked(getExternalAdmin).mockResolvedValue({ id: 13 } as Awaited<ReturnType<typeof getExternalAdmin>>);
    vi.mocked(uploadSiteMedia).mockResolvedValue({ key: "site-media/13/frame.png", url: "https://res.cloudinary.com/demo/image/upload/frame.png" });
    const response = createResponse();
    await getHandler()({ body: { fileName: "frame.png", contentType: "image/png", dataBase64: "aW1hZ2U=" } } as Request, response as unknown as Response);
    expect(uploadSiteMedia).toHaveBeenCalledWith({ fileName: "frame.png", contentType: "image/png", dataBase64: "aW1hZ2U=" }, 13);
    expect(response.status).toHaveBeenCalledWith(201);
    expect(response.json).toHaveBeenCalledWith({ key: "site-media/13/frame.png", url: "https://res.cloudinary.com/demo/image/upload/frame.png" });
  });
});
