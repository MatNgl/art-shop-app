export interface CartItem {
  productId: number;
  title: string;
  imageUrl: string;
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
