import { readJSON, writeJSON } from "../../utils/file";
import type { Basket } from "../../types/bascket";
import type { Product } from "../../types/product";
import path from "path";

const BASKET_PATH = path.join(process.cwd(), "database", "basket.json");
const PRODUCTS_PATH = path.join(process.cwd(), "database", "products.json");

export class BasketService {
  private static withTotals(basket: Basket): Basket {
    const totalPrice = basket.basket.reduce((sum, item) => {
      const price = item?.product?.price ?? 0;
      return sum + price * item.count;
    }, 0);

    return { ...basket, totalPrice };
  }

  static async getUserBasket(userId: string | number): Promise<Basket> {
    const baskets = await readJSON<Basket[]>(BASKET_PATH);

    let basket = baskets.find(b => b.userId == userId);

    if (!basket) {
      // корзина "принадлежит" пользователю и имеет тот же id
      basket = { id: userId, userId, basket: [] };
      baskets.push(basket);
      await writeJSON(BASKET_PATH, baskets);
    }

    return this.withTotals(basket);
  }

  static async addProduct(userId: string | number, productId: string | number, count: number) {
    const baskets = await readJSON<Basket[]>(BASKET_PATH);
    const products = await readJSON<Product[]>(PRODUCTS_PATH);

    let basket = baskets.find(b => b.userId == userId);
    if (!basket) {
      basket = { id: userId, userId, basket: [] };
      baskets.push(basket);
    }

    const product = products.find(p => p.id == productId);
    if (!product) throw new Error("Product not found");

    const existing = basket.basket.find(item => item.product.id == productId);

    if (existing) {
      existing.count += count;
    } else {
      basket.basket.push({ id: Date.now(), count, product });
    }

    await writeJSON(BASKET_PATH, baskets);
    return this.withTotals(basket);
  }

  static async updateCount(userId: string | number, productId: string | number, count: number) {
    const baskets = await readJSON<Basket[]>(BASKET_PATH);

    const basket = baskets.find(b => b.userId == userId);
    if (!basket) throw new Error("Basket not found");

    const item = basket.basket.find(i => i.product.id == productId);
    if (!item) throw new Error("Product not in basket");

    item.count = count;

    await writeJSON(BASKET_PATH, baskets);
    return this.withTotals(basket);
  }

  static async removeProduct(userId: string | number, productId: string | number) {
    const baskets = await readJSON<Basket[]>(BASKET_PATH);

    const basket = baskets.find(b => b.userId == userId);
    if (!basket) throw new Error("Basket not found");

    basket.basket = basket.basket.filter(i => i.product.id != productId);

    await writeJSON(BASKET_PATH, baskets);
    return this.withTotals(basket);
  }

  static async clearBasket(userId: string | number) {
    const baskets = await readJSON<Basket[]>(BASKET_PATH);

    const basket = baskets.find(b => b.userId == userId);
    if (!basket) throw new Error("Basket not found");

    basket.basket = [];

    await writeJSON(BASKET_PATH, baskets);
    return this.withTotals(basket);
  }
}
