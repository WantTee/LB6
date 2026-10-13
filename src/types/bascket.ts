import type { Product } from "./product.ts";

export interface BasketProduct {
  id: string | number;
  count: number;
  product: Product;
}

export interface Basket {
  id: string | number;
  userId: string | number;
  basket: BasketProduct[];
  totalPrice?: number;
}
