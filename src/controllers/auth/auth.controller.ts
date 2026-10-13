import type { Request, Response } from "express";
import { AuthService } from "../../services/auth/auth.service";

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const user = await AuthService.register(req.body);

      res.cookie("session", user.id, {
        httpOnly: true,
        maxAge: 25 * 60 * 1000 // 25 минут
      });

      res.json({ message: "User registered", user });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const user = await AuthService.login(req.body);

      res.cookie("session", user.id, {
        httpOnly: true,
        maxAge: 10 * 60 * 1000
      });

      res.json({ message: "Logged in", user });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  static async sendCode(req: Request, res: Response) {
    try {
      const { email } = req.body;
      await AuthService.sendCode(email);
      res.json({ message: "Код отправлен" });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  static async verifyCode(req: Request, res: Response) {
    try {
      const { email, code } = req.body;
      const success = await AuthService.verifyCode(email, code);
      if (!success) {
        return res.json({ success: false });
      }

      const user = await AuthService.findOrCreateByEmail(email);

      res.cookie("session", user.id, {
        httpOnly: true,
        maxAge: 10 * 60 * 1000
      });

      res.json({ success: true, user });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  static async logout(req: Request, res: Response) {
    res.clearCookie("session", { httpOnly: true });
    res.json({ success: true });
  }
}
