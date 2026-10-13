import type { Request, Response } from "express";
import { BasketService } from "../../services/bascket/bascket.service.ts";

export class BasketController {
  static async getBasket(req: Request, res: Response) {
    try {
      const basket = await BasketService.getUserBasket(req.userId!);
      res.json(basket);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  static async add(req: Request, res: Response) {
    try {
      const { productId, count } = req.body;
      const basket = await BasketService.addProduct(req.userId!, productId, count);
      res.json(basket);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { productId, count } = req.body;
      const basket = await BasketService.updateCount(req.userId!, productId, count);
      res.json(basket);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  static async remove(req: Request, res: Response) {
    try {
      const productId = Array.isArray(req.params.productId)
  ? req.params.productId[0]
  : req.params.productId;

const basket = await BasketService.removeProduct(req.userId!, productId as string);

      res.json(basket);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }
}
