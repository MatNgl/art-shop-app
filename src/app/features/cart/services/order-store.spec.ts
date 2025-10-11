import { TestBed } from '@angular/core/testing';
import { OrderStore } from './order-store';
import { CartStore } from './cart-store';
import { AuthService } from '../../auth/services/auth';
import { ProductService } from '../../catalog/services/product';
import { ToastService } from '../../../shared/services/toast.service';

class CartStoreMock {
  private _items: {
    productId: number;
    variantId?: number;
    qty: number;
    title: string;
    unitPrice: number;
    imageUrl: string;
    variantLabel?: string;
  }[] = [];

  items() {
    return this._items;
  }

  add(item: {
    productId: number;
    variantId?: number;
    qty: number;
    title: string;
    unitPrice: number;
    imageUrl: string;
    variantLabel?: string;
  }) {
    this._items.push(item);
  }

  subtotal() {
    return this._items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  }

  taxes() {
    return 0;
  }

  total() {
    return this.subtotal();
  }

  empty() {
    return this._items.length === 0;
  }

  async decreaseStockAfterOrder(): Promise<void> {
    // UI sync only (noop for tests)
  }

  clear() {
    this._items = [];
  }

  formatPrice(v: number) {
    return `${v.toFixed(2)} €`;
  }
}

class AuthServiceMock {
  currentUser$() {
    return { id: 1, email: 'test@example.com' };
  }
}

interface PVariant {
  id: number;
  stock: number;
}
interface P {
  id: number;
  stock: number;
  variants?: PVariant[];
  isAvailable: boolean;
}

class ProductServiceMock {
  private map = new Map<number, P>();

  setProduct(p: P) {
    this.map.set(p.id, p);
  }

  async getProductById(id: number): Promise<P | null> {
    return this.map.get(id) ?? null;
  }

  async updateProduct(productId: number, patch: Partial<P>): Promise<P> {
    const p = this.map.get(productId);
    if (!p) throw new Error('not found');
    const next = { ...p, ...patch };
    const stock = typeof next.stock === 'number' ? next.stock : p.stock;
    next.isAvailable = stock > 0;
    this.map.set(productId, next);
    return next;
  }

  async updateVariantStock(productId: number, variantId: number, newStock: number): Promise<P> {
    const p = this.map.get(productId);
    if (!p) throw new Error('variant host not found');
    const variants = [...(p.variants ?? [])];
    const idx = variants.findIndex((v) => v.id === variantId);
    if (idx === -1) throw new Error('variant not found');
    variants[idx] = { ...variants[idx], stock: newStock };
    const total = variants.reduce((s, v) => s + Math.max(0, v.stock), 0);
    const next = { ...p, variants, stock: total, isAvailable: total > 0 };
    this.map.set(productId, next);
    return next;
  }
}

class ToastServiceMock {
  success(): void {
    // noop
  }
  error(): void {
    // noop
  }
  info(): void {
    // noop
  }
  warning(): void {
    // noop
  }
}

describe('OrderStore stock management', () => {
  let store: OrderStore;
  let cart: CartStoreMock;
  let products: ProductServiceMock;

  beforeEach(() => {
    cart = new CartStoreMock();
    products = new ProductServiceMock();

    TestBed.configureTestingModule({
      providers: [
        OrderStore,
        { provide: CartStore, useValue: cart },
        { provide: AuthService, useClass: AuthServiceMock },
        { provide: ProductService, useValue: products },
        { provide: ToastService, useClass: ToastServiceMock },
      ],
    });

    localStorage.clear();
    store = TestBed.inject(OrderStore);
  });

  it('creates order as pending then debits stocks on processing', async () => {
    products.setProduct({ id: 10, stock: 5, isAvailable: true });

    cart.add({ productId: 10, qty: 3, title: 'Item', unitPrice: 100, imageUrl: '' });

    const order = await store.placeOrder(
      {
        firstName: 'A',
        lastName: 'B',
        email: 'test@example.com',
        address: { street: '1', city: 'C', zip: '00000', country: 'FR' },
      },
      { method: 'card', last4: '4242', brand: 'visa' },
      0
    );

    expect(order.status).toBe('pending');

    const updated = await store.updateStatus(order.id, 'processing');
    expect(updated.status).toBe('processing');

    const p = await products.getProductById(10);
    expect(p?.stock).toBe(2);
    expect(p?.isAvailable).toBeTrue();
  });

  it('rolls back all stocks if a decrement fails', async () => {
    // Setup: deux produits, l'un avec stock suffisant au moment de placeOrder
    // mais qui sera réduit à 0 avant le passage à processing
    products.setProduct({ id: 20, stock: 2, isAvailable: true });
    products.setProduct({ id: 21, stock: 10, isAvailable: true });

    cart.add({ productId: 20, qty: 1, title: 'A', unitPrice: 50, imageUrl: '' });
    cart.add({ productId: 21, qty: 5, title: 'B', unitPrice: 30, imageUrl: '' });

    // Créer la commande (stocks suffisants)
    const order = await store.placeOrder(
      {
        firstName: 'A',
        lastName: 'B',
        email: 'test@example.com',
        address: { street: '1', city: 'C', zip: '00000', country: 'FR' },
      },
      { method: 'card' },
      0
    );

    // Simuler une réduction de stock externe (autre commande, admin, etc.)
    await products.updateProduct(20, { stock: 0, isAvailable: false });

    // Tenter de passer à processing → devrait échouer et ne pas toucher au stock de B
    await expectAsync(store.updateStatus(order.id, 'processing')).toBeRejected();

    // Vérifier que le stock de B n'a pas été touché (rollback atomique)
    const pB = await products.getProductById(21);
    expect(pB?.stock).toBe(10);
  });

  it('restores stocks when moved to refused from processing', async () => {
    products.setProduct({ id: 30, stock: 4, isAvailable: true });
    cart.add({ productId: 30, qty: 2, title: 'C', unitPrice: 10, imageUrl: '' });

    const order = await store.placeOrder(
      {
        firstName: 'A',
        lastName: 'B',
        email: 'test@example.com',
        address: { street: '1', city: 'C', zip: '00000', country: 'FR' },
      },
      { method: 'card' },
      0
    );

    await store.updateStatus(order.id, 'processing'); // debit -> stock 2
    let p = await products.getProductById(30);
    expect(p?.stock).toBe(2);

    await store.updateStatus(order.id, 'refused'); // restore -> stock 4
    p = await products.getProductById(30);
    expect(p?.stock).toBe(4);
  });

  it('blocks placeOrder when pre-validation fails', async () => {
    products.setProduct({ id: 40, stock: 1, isAvailable: true });
    cart.add({ productId: 40, qty: 3, title: 'D', unitPrice: 10, imageUrl: '' });

    await expectAsync(
      store.placeOrder(
        {
          firstName: 'A',
          lastName: 'B',
          email: 'test@example.com',
          address: { street: '1', city: 'C', zip: '00000', country: 'FR' },
        },
        { method: 'card' },
        0
      )
    ).toBeRejected();
  });
});
