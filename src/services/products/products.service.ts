import { readJSON } from "../../utils/file";
import type { Product } from "../../types/product";
import path from "path";

const PRODUCTS_PATH = path.join(process.cwd(), "database", "products.json");

export class ProductsService {
  static async getProducts(query: any): Promise<Product[]> {
    let products = await readJSON<Product[]>(PRODUCTS_PATH);

    // Поиск
    if (query.q) {
      const q = query.q.toLowerCase();
      products = products.filter(
        p =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    // Фильтр по категории
    if (query.category) {
      products = products.filter(p =>
        p.categories.includes(query.category)
      );
    }

    // Фильтр по доступности
    if (query.available) {
      const isAvailable = query.available === "true";
      products = products.filter(p => p.isAvailable === isAvailable);
    }

    // Сортировка
    if (query.sort) {
      if (query.sort === "price_asc") {
        products = products.sort((a, b) => a.price - b.price);
      }
      if (query.sort === "price_desc") {
        products = products.sort((a, b) => b.price - a.price);
      }
    }

    return products;
  }
}
