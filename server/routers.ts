import { COOKIE_NAME } from "@shared/const";
import { DEFAULT_SITE_CONTENT, siteContentSchema } from "@shared/siteContent";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { getSiteContent, saveSiteContent } from "./db";
import { clearAdminSession, createAdminSession, setAdminSession, verifyAdminPassword } from "./adminAuth";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { mediaInput, uploadSiteMedia } from "./siteMedia";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      clearAdminSession(ctx.res, ctx.req);
      return {
        success: true,
      } as const;
    }),
  }),
  admin: router({
    login: publicProcedure.input(z.object({ password: z.string().min(1).max(256) })).mutation(async ({ input, ctx }) => {
      if (!verifyAdminPassword(input.password)) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "كلمة المرور غير صحيحة." });
      }
      const token = await createAdminSession();
      setAdminSession(ctx.res, token, ctx.req);
      return { success: true } as const;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      clearAdminSession(ctx.res, ctx.req);
      return { success: true } as const;
    }),
  }),
  site: router({
    get: publicProcedure.query(async () => (await getSiteContent()) ?? DEFAULT_SITE_CONTENT),
    save: adminProcedure.input(siteContentSchema).mutation(async ({ input, ctx }) => {
      await saveSiteContent(input, ctx.user.openId);
      return { success: true } as const;
    }),
    upload: adminProcedure.input(mediaInput).mutation(async ({ input, ctx }) => {
      return uploadSiteMedia(input, ctx.user.id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
