import type { User } from "../../types/user";
import nodemailer from "nodemailer";
import crypto from "crypto";
import pool from "../../db/pool";

const codes: Record<string, string> = {};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export class AuthService {
  static async register(data: User): Promise<User> {
    // Legacy method (was JSON). Not used by current client.
    // Keep for compatibility, but route should be migrated if needed.
    throw new Error("Not implemented. Use email code login.");
  }

  static async login(data: { login: string; password: string }): Promise<User> {
    // Legacy method (was JSON). Not used by current client.
    throw new Error("Not implemented. Use email code login.");
  }

  static async findOrCreateByEmail(email: string): Promise<User> {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) throw new Error("Email required");

    const name = trimmed.split("@")[0] || "";

    const result = await pool.query<{ user_id: number; email: string; name: string }>(
      `
        INSERT INTO users (email, name)
        VALUES ($1, $2)
        ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
        RETURNING user_id, email, name
      `,
      [trimmed, name]
    );

    const row = result.rows[0];
    if (!row) throw new Error("Failed to create or load user");

    return {
      id: row.user_id,
      name: row.name,
      login: row.email,
      email: row.email,
      phone: "",
      password: "",
    };
  }

  static async sendCode(email: string) {
    if (!email) throw new Error("Email required");

    const code = crypto.randomInt(100000, 999999).toString();
    codes[email] = code;

    setTimeout(() => delete codes[email], 5 * 60 * 1000);

    try {
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: "Ваш код для входа",
        text: `Ваш код: ${code}`,
      });

      console.log("Письмо отправлено:", email);
    } catch (err) {
      console.error("Ошибка отправки письма:", err);
      throw new Error("Не удалось отправить письмо");
    }
  }

  static async verifyCode(email: string, code: string) {
    if (codes[email] === code) {
      delete codes[email];
      await this.findOrCreateByEmail(email);
      return true;
    }
    return false;
  }
}
