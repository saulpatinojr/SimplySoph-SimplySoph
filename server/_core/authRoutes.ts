import { COOKIE_NAME } from "@shared/const";
import type { Express, Request, Response } from "express";
import { z } from "zod";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

const SESSION_COOKIE_MAX_AGE = 14 * 24 * 60 * 60 * 1000; // 14 days

const createSessionSchema = z.object({
  idToken: z.string().min(10, "idToken is required"),
});

function handleInvalidRequest(res: Response, message: string) {
  res.status(400).json({ error: message });
}

export function registerAuthRoutes(app: Express) {
  app.post("/api/auth/session", async (req: Request, res: Response) => {
    const parseResult = createSessionSchema.safeParse(req.body);
    if (!parseResult.success) {
      const firstError =
        parseResult.error.issues[0]?.message ?? "Invalid request payload";
      handleInvalidRequest(res, firstError);
      return;
    }

    try {
      const { sessionCookie, user } = await sdk.createSessionFromIdToken(
        parseResult.data.idToken,
        { expiresInMs: SESSION_COOKIE_MAX_AGE }
      );

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionCookie, {
        ...cookieOptions,
        maxAge: SESSION_COOKIE_MAX_AGE,
      });

      res.status(200).json({ user });
    } catch (error) {
      console.error("[Auth] Failed to create Firebase session", error);
      res.status(401).json({ error: "Invalid Firebase ID token" });
    }
  });
}
