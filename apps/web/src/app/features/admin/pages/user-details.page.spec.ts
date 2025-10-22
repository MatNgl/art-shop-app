import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserDetailsPage } from './user-details.page';
import { AuthService } from '../../auth/services/auth';
import { ToastService } from '../../../shared/services/toast.service';
import { ConfirmService } from '../../../shared/services/confirm.service';
import { UserRole } from '../../auth/models/user.model';
import {
  UserActivity,
  ActivityType,
  OrderStatus as AdminOrderStatus,
  UserExtended,
} from '../../auth/models/user-activity.model';
import { OrderService } from '../../../features/orders/services/order';
import type { Product } from '../../../features/catalog/models/product.model';
import { ProductService } from '../../../features/catalog/services/product';

// Utilitaire: reset localStorage entre tests
function resetStorage() {
  try {
    localStorage.clear();
  } catch {
    // ignore in CI if not available
  }
}

type TAuth = Pick<
  AuthService,
  | 'getCurrentUser'
  | 'getUserDetails'
  | 'updateUserRole'
  | 'deleteUser'
  | 'getUserActivity'
  | 'sendPasswordReset'
  | 'toggleUserSuspension'
>;
type TToast = Pick<ToastService, 'success' | 'error' | 'info'>;
type TConfirm = Pick<ConfirmService, 'ask'>;
interface TOrder {
  getAll: () => Promise<unknown>;
}

interface MockActivatedRoute {
  snapshot: {
    paramMap: {
      get: jasmine.Spy;
    };
  };
}

function makeUser(
  id: number,
  firstName: string,
  lastName: string,
  role: UserRole,
  createdAt: Date | string,
  extra?: Partial<UserExtended>
): UserExtended {
  const base: UserExtended = {
    id,
    firstName,
    lastName,
    email: `${firstName}.${lastName}@ex.fr`.toLowerCase(),
    role,
    phone: undefined,
    createdAt: typeof createdAt === 'string' ? new Date(createdAt) : createdAt,
    updatedAt: typeof createdAt === 'string' ? new Date(createdAt) : createdAt,
    isActive: true,
    loginAttempts: 0,
    addresses: [
      {
        street: '123 Test Street',
        city: 'Paris',
        postalCode: '75001',
        country: 'France',
      },
    ],
  };
  return { ...base, ...extra };
}

function makeMockActivity(userId: number, type: ActivityType, action: string): UserActivity {
  return {
    id: `activity-${Math.random().toString(36).slice(2)}`,
    userId,
    type,
    action,
    details: `Test activity: ${action}`,
    timestamp: new Date(),
    ipAddress: '127.0.0.1',
    userAgent: 'Test Agent',
  };
}

// StoreOrder shape pour getAll() (doit matcher le guard isStoreOrder)
function makeStoreOrder(params: {
  id: string;
  userId: number;
  status: string;
  total: number;
  createdAt?: string;
  updatedAt?: string;
}) {
  return {
    id: params.id,
    userId: params.userId,
    status: params.status,
    total: params.total,
    createdAt: params.createdAt ?? new Date().toISOString(),
    updatedAt: params.updatedAt ?? new Date().toISOString(),
    items: [
      {
        id: 'it-1',
        productId: 1,
        productName: 'Produit Test',
        quantity: 1,
        unitPrice: params.total,
        totalPrice: params.total,
      },
    ],
    shippingAddress: { street: 'rue', city: 'Paris', postalCode: '75001', country: 'FR' },
    payment: { brand: 'visa', last4: '4242' },
  };
}

function makeMockFavorite(
  userId: number,
  productId: number,
  addedAt: Date
): { productId: number; addedAt: string } {
  return { productId, addedAt: addedAt.toISOString() };
}

describe('UserDetailsPage', () => {
  let component: UserDetailsPage;
  let router: Router;
  let mockRoute: MockActivatedRoute;
  let authSpy: jasmine.SpyObj<TAuth>;
  let toastSpy: jasmine.SpyObj<TToast>;
  let confirmSpy: jasmine.SpyObj<TConfirm>;
  let orderSpy: jasmine.SpyObj<TOrder>;
  let productServiceSpy: {
    getByIds: jasmine.Spy<(ids: number[]) => Promise<Product[]>>;
    getAll?: jasmine.Spy<() => Promise<Product[]>>;
    getProductById?: jasmine.Spy<(id: number) => Promise<Product | null>>;
  };

  beforeEach(async () => {
    resetStorage();
    orderSpy = jasmine.createSpyObj<TOrder>('OrderService', ['getAll']);
    authSpy = jasmine.createSpyObj<TAuth>('AuthService', [
      'getCurrentUser',
      'getUserDetails',
      'updateUserRole',
      'deleteUser',
      'getUserActivity',
      'sendPasswordReset',
      'toggleUserSuspension',
    ]);

    toastSpy = jasmine.createSpyObj<TToast>('ToastService', ['success', 'error', 'info']);
    confirmSpy = jasmine.createSpyObj<TConfirm>('ConfirmService', ['ask']);
    orderSpy = jasmine.createSpyObj<TOrder>('OrderService', ['getAll']);

    // ProductServiceLike mock
    productServiceSpy = {
      getByIds: jasmine.createSpy('getByIds'),
    };

    mockRoute = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get'),
        },
      },
    };

    await TestBed.configureTestingModule({
      imports: [CommonModule, FormsModule, UserDetailsPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authSpy },
        { provide: ToastService, useValue: toastSpy },
        { provide: ConfirmService, useValue: confirmSpy },
        { provide: OrderService, useValue: orderSpy },
        { provide: ProductService, useValue: productServiceSpy },
        { provide: ActivatedRoute, useValue: mockRoute },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  });

  afterEach(() => {
    resetStorage();
  });

  it('redirige vers / si non admin', async () => {
    const user = makeUser(1, 'Bob', 'User', UserRole.USER, new Date());
    authSpy.getCurrentUser.and.returnValue(user);
    mockRoute.snapshot.paramMap.get.and.returnValue('2');

    const fixture = TestBed.createComponent(UserDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('redirige vers /admin/users si userId invalide', async () => {
    const admin = makeUser(1, 'Admin', 'User', UserRole.ADMIN, new Date());
    authSpy.getCurrentUser.and.returnValue(admin);
    mockRoute.snapshot.paramMap.get.and.returnValue(null);

    const fixture = TestBed.createComponent(UserDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(router.navigate).toHaveBeenCalledWith(['/admin/users']);
  });

  it('charge les détails utilisateur et toutes les données', async () => {
    const admin = makeUser(1, 'Admin', 'User', UserRole.ADMIN, new Date());
    const targetUser = makeUser(2, 'Target', 'User', UserRole.USER, new Date());

    // localStorage favoris
    const favs = [
      makeMockFavorite(2, 10, new Date()),
      makeMockFavorite(2, 11, new Date(Date.now() - 3600_000)),
    ];
    localStorage.setItem('favorites:2', JSON.stringify(favs));

    // produits pour enrichir favoris
    productServiceSpy.getByIds.and.resolveTo([
      { id: 10, title: 'P1', imageUrl: 'img', originalPrice: 100, isAvailable: true } as Product,
      { id: 11, title: 'P2', imageUrl: 'img2', originalPrice: 200, isAvailable: false } as Product,
    ]);

    // commandes (store)
    orderSpy.getAll.and.resolveTo([
      makeStoreOrder({ id: 'o-1', userId: 2, status: 'delivered', total: 123.45 }),
    ]);

    // activités
    authSpy.getCurrentUser.and.returnValue(admin);
    authSpy.getUserDetails.and.resolveTo(targetUser);
    authSpy.getUserActivity.and.resolveTo([
      makeMockActivity(2, ActivityType.LOGIN, 'Connexion OK'),
    ]);
    mockRoute.snapshot.paramMap.get.and.returnValue('2');

    const fixture = TestBed.createComponent(UserDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.user()).toEqual(targetUser);
    expect(component.loading()).toBeFalse();
    expect(component.activities().length).toBeGreaterThan(0);
    expect(component.orders().length).toBe(1);
    expect(component.favorites().length).toBe(2);
  });

  it('gère les erreurs de chargement utilisateur', async () => {
    const admin = makeUser(1, 'Admin', 'User', UserRole.ADMIN, new Date());
    authSpy.getCurrentUser.and.returnValue(admin);
    authSpy.getUserDetails.and.rejectWith(new Error('User not found'));
    mockRoute.snapshot.paramMap.get.and.returnValue('999');

    const fixture = TestBed.createComponent(UserDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.user()).toBeNull();
    expect(component.loading()).toBeFalse();
    expect(toastSpy.error).toHaveBeenCalledWith(
      'Impossible de charger les détails de cet utilisateur'
    );
  });

  it('actualise toutes les données', async () => {
    const admin = makeUser(1, 'Admin', 'User', UserRole.ADMIN, new Date());
    const targetUser = makeUser(2, 'Target', 'User', UserRole.USER, new Date());

    // initial
    authSpy.getCurrentUser.and.returnValue(admin);
    authSpy.getUserDetails.and.resolveTo(targetUser);
    authSpy.getUserActivity.and.resolveTo([]);
    orderSpy.getAll.and.resolveTo([]);
    productServiceSpy.getByIds.and.resolveTo([]);
    localStorage.setItem('favorites:2', JSON.stringify([]));
    mockRoute.snapshot.paramMap.get.and.returnValue('2');

    const fixture = TestBed.createComponent(UserDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    authSpy.getUserDetails.calls.reset();
    authSpy.getUserActivity.calls.reset();
    toastSpy.success.calls.reset();

    await component.refreshData();

    expect(authSpy.getUserDetails).toHaveBeenCalledWith(2);
    expect(authSpy.getUserActivity).toHaveBeenCalledWith(2);
    expect(toastSpy.success).toHaveBeenCalledWith('Données actualisées');
  });

  it('envoie un email de réinitialisation de mot de passe', async () => {
    const admin = makeUser(1, 'Admin', 'User', UserRole.ADMIN, new Date());
    const targetUser = makeUser(2, 'Target', 'User', UserRole.USER, new Date());

    authSpy.getCurrentUser.and.returnValue(admin);
    authSpy.getUserDetails.and.resolveTo(targetUser);
    authSpy.getUserActivity.and.resolveTo([]);
    orderSpy.getAll.and.resolveTo([]);
    productServiceSpy.getByIds.and.resolveTo([]);
    localStorage.setItem('favorites:2', JSON.stringify([]));
    authSpy.sendPasswordReset.and.resolveTo();
    confirmSpy.ask.and.resolveTo(true);
    mockRoute.snapshot.paramMap.get.and.returnValue('2');

    const fixture = TestBed.createComponent(UserDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    await component.sendResetPasswordEmail();

    expect(confirmSpy.ask).toHaveBeenCalled();
    expect(authSpy.sendPasswordReset).toHaveBeenCalledWith(2);
    expect(toastSpy.success).toHaveBeenCalledWith(
      `Email de réinitialisation envoyé à ${targetUser.email}`
    );
  });

  it('suspend un compte utilisateur', async () => {
    const admin = makeUser(1, 'Admin', 'User', UserRole.ADMIN, new Date());
    const targetUser = makeUser(2, 'Target', 'User', UserRole.USER, new Date());
    const suspendedUser = { ...targetUser, isActive: false, suspendedAt: new Date() };

    authSpy.getCurrentUser.and.returnValue(admin);
    authSpy.getUserDetails.and.resolveTo(targetUser);
    authSpy.getUserActivity.and.resolveTo([]);
    orderSpy.getAll.and.resolveTo([]);
    productServiceSpy.getByIds.and.resolveTo([]);
    localStorage.setItem('favorites:2', JSON.stringify([]));
    authSpy.toggleUserSuspension.and.resolveTo(suspendedUser);
    mockRoute.snapshot.paramMap.get.and.returnValue('2');

    const fixture = TestBed.createComponent(UserDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    component.suspensionReason.set('Violation des conditions');
    await component.confirmSuspension();

    expect(authSpy.toggleUserSuspension).toHaveBeenCalledWith(2, 'Violation des conditions');
    expect(component.user()).toEqual(suspendedUser);
    expect(toastSpy.success).toHaveBeenCalledWith(
      `Le compte de ${targetUser.firstName} ${targetUser.lastName} a été suspendu`
    );
  });

  it('réactive un compte suspendu', async () => {
    const admin = makeUser(1, 'Admin', 'User', UserRole.ADMIN, new Date());
    const suspendedUser = makeUser(2, 'Target', 'User', UserRole.USER, new Date(), {
      isActive: false,
      suspendedAt: new Date(),
    });
    const reactivatedUser = { ...suspendedUser, isActive: true, suspendedAt: undefined };

    authSpy.getCurrentUser.and.returnValue(admin);
    authSpy.getUserDetails.and.resolveTo(suspendedUser);
    authSpy.getUserActivity.and.resolveTo([]);
    orderSpy.getAll.and.resolveTo([]);
    productServiceSpy.getByIds.and.resolveTo([]);
    localStorage.setItem('favorites:2', JSON.stringify([]));

    // IMPORTANT : on renvoie l'utilisateur réactivé
    authSpy.toggleUserSuspension.and.resolveTo(reactivatedUser);

    mockRoute.snapshot.paramMap.get.and.returnValue('2');

    const fixture = TestBed.createComponent(UserDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    await component.confirmSuspension();

    expect(authSpy.toggleUserSuspension).toHaveBeenCalledWith(2, '');
    expect(component.user()).toEqual(reactivatedUser);
    expect(toastSpy.success).toHaveBeenCalledWith(
      `Le compte de ${suspendedUser.firstName} ${suspendedUser.lastName} a été réactivé`
    );
  });

  it('charge les activités utilisateur', async () => {
    const admin = makeUser(1, 'Admin', 'User', UserRole.ADMIN, new Date());
    const targetUser = makeUser(2, 'Target', 'User', UserRole.USER, new Date());
    const activities = [
      makeMockActivity(2, ActivityType.LOGIN, 'Connexion'),
      makeMockActivity(2, ActivityType.PROFILE_UPDATE, 'Profil modifié'),
    ];

    authSpy.getCurrentUser.and.returnValue(admin);
    authSpy.getUserDetails.and.resolveTo(targetUser);
    authSpy.getUserActivity.and.resolveTo(activities);
    orderSpy.getAll.and.resolveTo([]);
    productServiceSpy.getByIds.and.resolveTo([]);
    localStorage.setItem('favorites:2', JSON.stringify([]));
    mockRoute.snapshot.paramMap.get.and.returnValue('2');

    const fixture = TestBed.createComponent(UserDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.activities().length).toBeGreaterThan(0);
    expect(component.loadingActivities()).toBeFalse();
  });

  it('charge les commandes utilisateur', async () => {
    const admin = makeUser(1, 'Admin', 'User', UserRole.ADMIN, new Date());
    const targetUser = makeUser(2, 'Target', 'User', UserRole.USER, new Date());
    const storeOrders = [
      makeStoreOrder({ id: 'o-1', userId: 2, status: 'delivered', total: 299.99 }),
      makeStoreOrder({ id: 'o-2', userId: 2, status: 'processing', total: 599.99 }),
    ];

    authSpy.getCurrentUser.and.returnValue(admin);
    authSpy.getUserDetails.and.resolveTo(targetUser);
    authSpy.getUserActivity.and.resolveTo([]);
    orderSpy.getAll.and.resolveTo(storeOrders);
    productServiceSpy.getByIds.and.resolveTo([]);
    localStorage.setItem('favorites:2', JSON.stringify([]));
    mockRoute.snapshot.paramMap.get.and.returnValue('2');

    const fixture = TestBed.createComponent(UserDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.orders().length).toBe(2);
    expect(component.loadingOrders()).toBeFalse();
  });

  it('charge les favoris utilisateur', async () => {
    const admin = makeUser(1, 'Admin', 'User', UserRole.ADMIN, new Date());
    const targetUser = makeUser(2, 'Target', 'User', UserRole.USER, new Date());

    // 2 favoris dans le storage
    const favs = [
      makeMockFavorite(2, 101, new Date()),
      makeMockFavorite(2, 102, new Date(Date.now() - 1_000_000)),
    ];
    localStorage.setItem('favorites:2', JSON.stringify(favs));

    // produits correspondants
    productServiceSpy.getByIds.and.resolveTo([
      { id: 101, title: 'Prod 101', imageUrl: '', originalPrice: 10, isAvailable: true } as Product,
      { id: 102, title: 'Prod 102', imageUrl: '', originalPrice: 20, isAvailable: true } as Product,
    ]);

    authSpy.getCurrentUser.and.returnValue(admin);
    authSpy.getUserDetails.and.resolveTo(targetUser);
    authSpy.getUserActivity.and.resolveTo([]);
    orderSpy.getAll.and.resolveTo([]);
    mockRoute.snapshot.paramMap.get.and.returnValue('2');

    const fixture = TestBed.createComponent(UserDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.favorites().length).toBe(2);
    expect(component.loadingFavorites()).toBeFalse();
  });

  it('gère les erreurs de chargement des données secondaires', async () => {
    const admin = makeUser(1, 'Admin', 'User', UserRole.ADMIN, new Date());
    const targetUser = makeUser(2, 'Target', 'User', UserRole.USER, new Date());

    authSpy.getCurrentUser.and.returnValue(admin);
    authSpy.getUserDetails.and.resolveTo(targetUser);
    authSpy.getUserActivity.and.rejectWith(new Error('Activity error'));
    orderSpy.getAll.and.rejectWith(new Error('Orders error'));
    productServiceSpy.getByIds.and.rejectWith(new Error('Favorites error'));
    localStorage.setItem(
      'favorites:2',
      JSON.stringify([{ productId: 1, addedAt: new Date().toISOString() }])
    );
    mockRoute.snapshot.paramMap.get.and.returnValue('2');

    const fixture = TestBed.createComponent(UserDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(toastSpy.error).toHaveBeenCalledWith("Impossible de charger l'activité utilisateur");
    expect(toastSpy.error).toHaveBeenCalledWith('Impossible de charger les commandes');
    expect(toastSpy.error).toHaveBeenCalledWith('Impossible de charger les favoris');
  });

  describe('Méthodes helpers', () => {
    let fixture: ComponentFixture<UserDetailsPage>;

    beforeEach(async () => {
      resetStorage();
      const admin = makeUser(1, 'Admin', 'User', UserRole.ADMIN, new Date());
      const targetUser = makeUser(2, 'John', 'Doe', UserRole.USER, new Date('2024-12-01'));

      authSpy.getCurrentUser.and.returnValue(admin);
      authSpy.getUserDetails.and.resolveTo(targetUser);
      authSpy.getUserActivity.and.resolveTo([]);
      orderSpy.getAll.and.resolveTo([]);
      productServiceSpy.getByIds.and.resolveTo([]);
      mockRoute.snapshot.paramMap.get.and.returnValue('2');

      fixture = TestBed.createComponent(UserDetailsPage);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('calcule les initiales correctement', () => {
      expect(component.getInitials()).toBe('JD');
    });

    it("génère une classe d'avatar basée sur l'ID", () => {
      const avatarClass = component.getAvatarClass();
      expect(avatarClass).toMatch(/^bg-(blue|green|purple|pink|indigo|yellow|red|gray)-500$/);
    });

    it('retourne la classe de badge de rôle correcte', () => {
      expect(component.getRoleBadgeClass()).toBe('bg-green-100 text-green-800');
    });

    it('formate les dates correctement', () => {
      const date = new Date('2024-12-01T10:30:00Z');
      expect(component.formatDate(date)).toMatch(/01\/12\/2024/);
      // l'heure affichée dépend des locales; on vérifie présence HH:MM
      expect(component.formatDateTime(date)).toMatch(/01\/12\/2024.*10:30/);
    });

    it("calcule le label d'inscription", () => {
      const label = component.getRegistrationLabel();
      expect(label).toMatch(/Inscrit il y a \d+ jours?/);
    });

    it('retourne les bonnes icônes et classes pour les activités', () => {
      expect(component.getActivityIcon(ActivityType.LOGIN)).toBe('fa-sign-in-alt');
      expect(component.getActivityIconClass(ActivityType.LOGIN)).toBe('bg-green-500');

      expect(component.getActivityIcon(ActivityType.ORDER_PLACED)).toBe('fa-shopping-cart');
      expect(component.getActivityIconClass(ActivityType.ORDER_PLACED)).toBe('bg-purple-500');
    });

    it('retourne les bons labels et classes pour les statuts de commande', () => {
      expect(component.getOrderStatusLabel(AdminOrderStatus.PENDING)).toBe('En attente');
      expect(component.getOrderStatusClass(AdminOrderStatus.PENDING)).toBe(
        'bg-yellow-100 text-yellow-800'
      );

      expect(component.getOrderStatusLabel(AdminOrderStatus.DELIVERED)).toBe('Livrée');
      expect(component.getOrderStatusClass(AdminOrderStatus.DELIVERED)).toBe(
        'bg-green-100 text-green-800'
      );
    });
  });

  describe('Permissions', () => {
    it('empêche la modification de son propre rôle admin', async () => {
      const admin = makeUser(1, 'Admin', 'User', UserRole.ADMIN, new Date());

      authSpy.getCurrentUser.and.returnValue(admin);
      authSpy.getUserDetails.and.resolveTo(admin); // Même utilisateur
      authSpy.getUserActivity.and.resolveTo([]);
      orderSpy.getAll.and.resolveTo([]);
      productServiceSpy.getByIds.and.resolveTo([]);
      mockRoute.snapshot.paramMap.get.and.returnValue('1');

      const fixture = TestBed.createComponent(UserDetailsPage);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.canModifyAdmin()).toBeFalse();
      expect(component.canDeleteAdmin()).toBeFalse();
    });

    it("permet la modification d'autres admins", async () => {
      const currentAdmin = makeUser(1, 'Admin1', 'User', UserRole.ADMIN, new Date());
      const otherAdmin = makeUser(2, 'Admin2', 'User', UserRole.ADMIN, new Date());

      authSpy.getCurrentUser.and.returnValue(currentAdmin);
      authSpy.getUserDetails.and.resolveTo(otherAdmin);
      authSpy.getUserActivity.and.resolveTo([]);
      orderSpy.getAll.and.resolveTo([]);
      productServiceSpy.getByIds.and.resolveTo([]);
      mockRoute.snapshot.paramMap.get.and.returnValue('2');

      const fixture = TestBed.createComponent(UserDetailsPage);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.canModifyAdmin()).toBeTrue();
      expect(component.canDeleteAdmin()).toBeTrue();
    });
  });
});
