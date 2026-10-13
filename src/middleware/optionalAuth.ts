import type { Request, Response, NextFunction } from "express";

/**
 * Same as authMiddleware, but doesn't block unauthenticated users.
 * Useful for endpoints that are public, but need user context when available.
 */
export function optionalAuthMiddleware(req: Request, _res: Response, next: NextFunction) {
  const session = req.cookies?.session;
  if (session) {
    req.userId = session;
  }
  next();
}

