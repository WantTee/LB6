import type { Request, Response } from "express";
import { VisualisationsService } from "../../services/visualisations/visualisations.service";

function parseId(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) throw new Error("Invalid id");
  return n;
}

function toDataUrl(buf: Buffer): string {
  if (
    buf.length >= 12 &&
    buf.subarray(0, 4).toString("ascii") === "RIFF" &&
    buf.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return `data:image/webp;base64,${buf.toString("base64")}`;
  }
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xd8) {
    return `data:image/jpeg;base64,${buf.toString("base64")}`;
  }
  return `data:image/png;base64,${buf.toString("base64")}`;
}

export class VisualisationsController {
  static async create(req: Request, res: Response) {
    try {
      const userId = parseId(req.userId);
      const { style, description, title } = req.body ?? {};

      const created = await VisualisationsService.create({
        userId,
        style,
        description,
        title,
      });

      res.json({ success: true, visId: created.visId });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  static async getOne(req: Request, res: Response) {
    try {
      const visId = parseId(req.params.visId);
      const row = await VisualisationsService.getById(visId);
      if (!row) return res.status(404).json({ error: "Not found" });

      // If not public, only owner can view
      if (!row.is_public) {
        const userId = req.userId != null ? Number(req.userId) : NaN;
        if (!Number.isFinite(userId) || userId !== row.user_id) {
          return res.status(403).json({ error: "Forbidden" });
        }
      }

      const userId = req.userId != null ? Number(req.userId) : NaN;
      const liked = Number.isFinite(userId) ? await VisualisationsService.isLikedByUser(visId, userId) : false;

      res.json({
        vis_id: row.vis_id,
        user_id: row.user_id,
        style: row.style,
        description: row.description,
        title: row.title,
        likes: row.likes,
        is_public: row.is_public,
        author: row.author,
        date_of_creation: row.date_of_creation,
        img1: toDataUrl(row.img1),
        img2: toDataUrl(row.img2),
        img3: toDataUrl(row.img3),
        liked,
      });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  static async listHistory(req: Request, res: Response) {
    try {
      const userId = parseId(req.userId);
      const { sortBy, order } = req.query as Record<string, string | undefined>;
      const rows = await VisualisationsService.listHistory(userId, sortBy, order);
      res.json(rows);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  static async listPublic(req: Request, res: Response) {
    try {
      const { sortBy, order } = req.query as Record<string, string | undefined>;
      const rows = await VisualisationsService.listPublic(sortBy, order);
      res.json(rows);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const userId = parseId(req.userId);
      const visId = parseId(req.params.visId);
      await VisualisationsService.delete(visId, userId);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  static async setVisibility(req: Request, res: Response) {
    try {
      const userId = parseId(req.userId);
      const visId = parseId(req.params.visId);
      const { is_public } = req.body ?? {};
      await VisualisationsService.setVisibility(visId, userId, Boolean(is_public));
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  static async toggleLike(req: Request, res: Response) {
    try {
      const userId = parseId(req.userId);
      const visId = parseId(req.params.visId);
      const result = await VisualisationsService.toggleLike(visId, userId);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }
}

