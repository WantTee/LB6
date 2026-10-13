export type Address = {
  country?: string;
  town?: string;
  street?: string;
  houseNumber?: string;
};

export interface Product {
  id: string | number;
  title: string;
  price: number;
  isAvailable: boolean;
  description: string;
  categories: string[];
  images: {
    preview: string;
    gallery?: string[];
  };
  discount?: number;
}
