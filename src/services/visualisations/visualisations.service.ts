import pool from "../../db/pool";
import { StabilityService } from "../stability/stability.service";

export type CreateVisualisationInput = {
  userId: number;
  style: string;
  description: string;
  title: string;
};

export type VisualisationRow = {
  vis_id: number;
  user_id: number;
  style: string;
  description: string;
  title: string;
  likes: number;
  is_public: boolean;
  author: string;
  date_of_creation: string;
  img1: Buffer;
  img2: Buffer;
  img3: Buffer;
};

function styleToPrompt(styleRaw: string): string {
  const s = styleRaw.trim().toLowerCase();
  if (s.includes("аниме")) return "anime style, clean lineart, vibrant colors";
  if (s.includes("фэнт")) return "fantasy illustration, epic lighting, magical atmosphere";
  if (s.includes("реал")) return "photorealistic, cinematic lighting, high detail";
  if (s.includes("сюр")) return "surrealism, dreamlike, unexpected juxtapositions, painterly";
  if (s.includes("псих")) return "psychedelic art, neon colors, fractal patterns, trippy, vibrant";
  return styleRaw;
}

function buildComicPrompts(description: string, style: string): [string, string, string] {
  const baseStyle = styleToPrompt(style);
  const base = description.trim();

  const p1 = [
    "Comic panel 1 of 3.",
    "Establish the scene and main character.",
    `Story: ${base}`,
    `Style: ${baseStyle}.`,
    "No text, no watermark.",
  ].join(" ");

  const p2 = [
    "Comic panel 2 of 3.",
    "Continue the same story and same character; coherent visual continuity.",
    `Story continuation: ${base}`,
    `Style: ${baseStyle}.`,
    "No watermark.",
  ].join(" ");

  const p3 = [
    "Comic panel 3 of 3.",
    "Conclude the same story; coherent visual continuity with previous panels.",
    `Story conclusion: ${base}`,
    `Style: ${baseStyle}.`,
    "No watermark.",
  ].join(" ");

  return [p1, p2, p3];
}

function normalizeSort(sortByRaw: string | undefined): "title" | "author" | "date" | "likes" {
  const s = (sortByRaw ?? "").toLowerCase();
  if (s === "title") return "title";
  if (s === "author") return "author";
  if (s === "likes") return "likes";
  if (s === "date" || s === "date_of_creation") return "date";
  return "date";
}

function normalizeOrder(orderRaw: string | undefined): "asc" | "desc" {
  return (orderRaw ?? "").toLowerCase() === "asc" ? "asc" : "desc";
}

export class VisualisationsService {
  static async create(input: CreateVisualisationInput): Promise<{ visId: number }> {
    const userId = Number(input.userId);
    if (!Number.isFinite(userId)) throw new Error("Invalid userId");
    if (!input.description?.trim()) throw new Error("Description required");
    if (!input.title?.trim()) throw new Error("Title required");
    if (!input.style?.trim()) throw new Error("Style required");

    const userRes = await pool.query<{ name: string }>(
      `SELECT name FROM users WHERE user_id = $1`,
      [userId]
    );
    const author = userRes.rows[0]?.name;
    if (!author) throw new Error("User not found");

    const [p1, p2, p3] = buildComicPrompts(input.description, input.style);

    const img1 = await StabilityService.generateImage({ prompt: p1, outputFormat: "webp" });
    const img2 = await StabilityService.generateImage({ prompt: p2, outputFormat: "webp" });
    const img3 = await StabilityService.generateImage({ prompt: p3, outputFormat: "webp" });

    const insertRes = await pool.query<{ vis_id: number }>(
      `
        INSERT INTO visualisations (user_id, style, description, title, likes, is_public, img1, img2, img3, author, date_of_creation)
        VALUES ($1, $2, $3, $4, 0, FALSE, $5, $6, $7, $8, CURRENT_DATE)
        RETURNING vis_id
      `,
      [userId, input.style, input.description, input.title, img1, img2, img3, author]
    );

    const visId = insertRes.rows[0]?.vis_id;
    if (!visId) throw new Error("Failed to create visualisation");
    return { visId };
  }

  static async getById(visId: number): Promise<VisualisationRow | null> {
    const res = await pool.query<VisualisationRow>(
      `SELECT * FROM visualisations WHERE vis_id = $1`,
      [visId]
    );
    return res.rows[0] ?? null;
  }

  static async listHistory(
    userId: number,
    sortByRaw?: string,
    orderRaw?: string
  ): Promise<Omit<VisualisationRow, "img1" | "img2" | "img3">[]> {
    const sortBy = normalizeSort(sortByRaw);
    const order = normalizeOrder(orderRaw);

    const sortSql =
      sortBy === "title"
        ? `title ${order}`
        : sortBy === "author"
          ? `author ${order}`
          : sortBy === "likes"
            ? `likes ${order}`
            : `date_of_creation ${order}`;

    const res = await pool.query<Omit<VisualisationRow, "img1" | "img2" | "img3">>(
      `
        SELECT vis_id, user_id, style, description, title, likes, is_public, author, date_of_creation
        FROM visualisations
        WHERE user_id = $1
        ORDER BY ${sortSql}
      `,
      [userId]
    );
    return res.rows;
  }

  static async listPublic(
    sortByRaw?: string,
    orderRaw?: string
  ): Promise<Omit<VisualisationRow, "img1" | "img2" | "img3">[]> {
    const sortBy = normalizeSort(sortByRaw);
    const order = normalizeOrder(orderRaw);

    const sortSql =
      sortBy === "title"
        ? `title ${order}`
        : sortBy === "author"
          ? `author ${order}`
          : sortBy === "likes"
            ? `likes ${order}`
            : `date_of_creation ${order}`;

    const res = await pool.query<Omit<VisualisationRow, "img1" | "img2" | "img3">>(
      `
        SELECT vis_id, user_id, style, description, title, likes, is_public, author, date_of_creation
        FROM visualisations
        WHERE is_public = TRUE
        ORDER BY ${sortSql}
      `
    );
    return res.rows;
  }

  static async delete(visId: number, userId: number): Promise<void> {
    const res = await pool.query<{ vis_id: number }>(
      `DELETE FROM visualisations WHERE vis_id = $1 AND user_id = $2 RETURNING vis_id`,
      [visId, userId]
    );
    if (!res.rows[0]) throw new Error("Not found or not owned");
  }

  static async setVisibility(visId: number, userId: number, isPublic: boolean): Promise<void> {
    const res = await pool.query<{ vis_id: number }>(
      `
        UPDATE visualisations
        SET is_public = $3
        WHERE vis_id = $1 AND user_id = $2
        RETURNING vis_id
      `,
      [visId, userId, isPublic]
    );
    if (!res.rows[0]) throw new Error("Not found or not owned");
  }

  static async toggleLike(visId: number, userId: number): Promise<{ liked: boolean; likes: number }> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const existsRes = await client.query<{ exists: boolean }>(
        `SELECT EXISTS(SELECT 1 FROM visualisation_likes WHERE user_id=$1 AND vis_id=$2) AS exists`,
        [userId, visId]
      );
      const exists = Boolean(existsRes.rows[0]?.exists);

      if (exists) {
        await client.query(`DELETE FROM visualisation_likes WHERE user_id=$1 AND vis_id=$2`, [
          userId,
          visId,
        ]);
        await client.query(`UPDATE visualisations SET likes = GREATEST(likes - 1, 0) WHERE vis_id=$1`, [
          visId,
        ]);
      } else {
        await client.query(`INSERT INTO visualisation_likes (user_id, vis_id) VALUES ($1, $2)`, [
          userId,
          visId,
        ]);
        await client.query(`UPDATE visualisations SET likes = likes + 1 WHERE vis_id=$1`, [visId]);
      }

      const likesRes = await client.query<{ likes: number }>(
        `SELECT likes FROM visualisations WHERE vis_id=$1`,
        [visId]
      );
      const likes = likesRes.rows[0]?.likes;
      if (likes == null) throw new Error("Visualisation not found");

      await client.query("COMMIT");
      return { liked: !exists, likes };
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  static async isLikedByUser(visId: number, userId: number): Promise<boolean> {
    const res = await pool.query<{ exists: boolean }>(
      `SELECT EXISTS(SELECT 1 FROM visualisation_likes WHERE user_id=$1 AND vis_id=$2) AS exists`,
      [userId, visId]
    );
    return Boolean(res.rows[0]?.exists);
  }
}

