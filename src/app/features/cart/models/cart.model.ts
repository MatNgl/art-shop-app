export interface CartItem {
  productId: number;
  variantId?: number;
  title: string;
  imageUrl: string;
  variantLabel?: string; // ex: "A4" (juste la taille)
  unitPrice: number;
  qty: number;
  maxStock: number;
  artistName?: string;
}

export interface CartTotals {
  count: number;
  subtotal: number;
  taxes: number;
  total: number;
}
