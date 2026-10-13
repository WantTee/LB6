import type { Request, Response } from "express";
import { ProductsService } from "../../services/products/products.service";

export class ProductsController {
  static async getProducts(req: Request, res: Response) {
    try {
      const products = await ProductsService.getProducts(req.query);
      res.json(products);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
}
