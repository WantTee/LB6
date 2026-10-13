import type { Request, Response, NextFunction } from "express";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const session = req.cookies.session;

  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  req.userId = session; // добавим userId в объект запроса
  next();
}
