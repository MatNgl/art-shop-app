// src/app/features/admin/pages/user-details.page.spec.ts

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
  Order,
  OrderStatus,
  UserFavorite,
  UserExtended,
} from '../../auth/models/user-activity.model';

type TAuth = Pick<
  AuthService,
  | 'getCurrentUser'
  | 'getUserDetails'
  | 'updateUserRole'
  | 'deleteUser'
  | 'getUserActivity'
  | 'sendPasswordReset'
  | 'toggleUserSuspension'
  | 'getUserOrders'
  | 'getUserFavorites'
>;
type TToast = Pick<ToastService, 'success' | 'error' | 'info'>;
type TConfirm = Pick<ConfirmService, 'ask'>;

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
    id: `activity-${Date.now()}`,
    userId,
    type,
    action,
    details: `Test activity: ${action}`,
    timestamp: new Date(),
    ipAddress: '127.0.0.1',
    userAgent: 'Test Agent',
  };
}

function makeMockOrder(userId: number, status: OrderStatus, total: number): Order {
  return {
    id: `order-${Date.now()}`,
    userId,
    status,
    total,
    currency: 'EUR',
    items: [
      {
        id: 'item-1',
        productId: 1,
        productName: 'Test Product',
        quantity: 1,
        unitPrice: total,
        totalPrice: total,
      },
    ],
    shippingAddress: {
      street: '123 Test Street',
      city: 'Paris',
      postalCode: '75001',
      country: 'France',
    },
    paymentMethod: {
      id: 'pm-1',
      brand: 'visa',
      last4: '4242',
      expMonth: 12,
      expYear: 2025,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function makeMockFavorite(userId: number, productName: string, price: number): UserFavorite {
  return {
    id: `fav-${Date.now()}`,
    userId,
    productId: 1,
    productName,
    productPrice: price,
    addedAt: new Date(),
    isAvailable: true,
  };
}

describe('UserDetailsPage', () => {
  let component: UserDetailsPage;
  let router: Router;
  let mockRoute: MockActivatedRoute;
  let authSpy: jasmine.SpyObj<TAuth>;
  let toastSpy: jasmine.SpyObj<TToast>;
  let confirmSpy: jasmine.SpyObj<TConfirm>;

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj<TAuth>('AuthService', [
      'getCurrentUser',
      'getUserDetails',
      'updateUserRole',
      'deleteUser',
      'getUserActivity',
      'sendPasswordReset',
      'toggleUserSuspension',
      'getUserOrders',
      'getUserFavorites',
    ]);

    toastSpy = jasmine.createSpyObj<TToast>('ToastService', ['success', 'error', 'info']);
    confirmSpy = jasmine.createSpyObj<TConfirm>('ConfirmService', ['ask']);

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
        { provide: ActivatedRoute, useValue: mockRoute },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
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

    authSpy.getCurrentUser.and.returnValue(admin);
    authSpy.getUserDetails.and.resolveTo(targetUser);
    authSpy.getUserActivity.and.resolveTo([
      makeMockActivity(2, ActivityType.LOGIN, 'Connexion réussie'),
    ]);
    authSpy.getUserOrders.and.resolveTo([makeMockOrder(2, OrderStatus.DELIVERED, 299.99)]);
    authSpy.getUserFavorites.and.resolveTo([makeMockFavorite(2, 'Test Product', 99.99)]);

    mockRoute.snapshot.paramMap.get.and.returnValue('2');

    const fixture = TestBed.createComponent(UserDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.user()).toEqual(targetUser);
    expect(component.loading()).toBeFalse();
    expect(component.activities().length).toBe(1);
    expect(component.orders().length).toBe(1);
    expect(component.favorites().length).toBe(1);
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

    authSpy.getCurrentUser.and.returnValue(admin);
    authSpy.getUserDetails.and.resolveTo(targetUser);
    authSpy.getUserActivity.and.resolveTo([]);
    authSpy.getUserOrders.and.resolveTo([]);
    authSpy.getUserFavorites.and.resolveTo([]);
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
    authSpy.getUserOrders.and.resolveTo([]);
    authSpy.getUserFavorites.and.resolveTo([]);
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
    authSpy.getUserOrders.and.resolveTo([]);
    authSpy.getUserFavorites.and.resolveTo([]);
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
    authSpy.getUserOrders.and.resolveTo([]);
    authSpy.getUserFavorites.and.resolveTo([]);
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
    authSpy.getUserOrders.and.resolveTo([]);
    authSpy.getUserFavorites.and.resolveTo([]);
    mockRoute.snapshot.paramMap.get.and.returnValue('2');

    const fixture = TestBed.createComponent(UserDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.activities()).toEqual(activities);
    expect(component.loadingActivities()).toBeFalse();
  });

  it('charge les commandes utilisateur', async () => {
    const admin = makeUser(1, 'Admin', 'User', UserRole.ADMIN, new Date());
    const targetUser = makeUser(2, 'Target', 'User', UserRole.USER, new Date());
    const orders = [
      makeMockOrder(2, OrderStatus.DELIVERED, 299.99),
      makeMockOrder(2, OrderStatus.PROCESSING, 599.99),
    ];

    authSpy.getCurrentUser.and.returnValue(admin);
    authSpy.getUserDetails.and.resolveTo(targetUser);
    authSpy.getUserActivity.and.resolveTo([]);
    authSpy.getUserOrders.and.resolveTo(orders);
    authSpy.getUserFavorites.and.resolveTo([]);
    mockRoute.snapshot.paramMap.get.and.returnValue('2');

    const fixture = TestBed.createComponent(UserDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.orders()).toEqual(orders);
    expect(component.loadingOrders()).toBeFalse();
  });

  it('charge les favoris utilisateur', async () => {
    const admin = makeUser(1, 'Admin', 'User', UserRole.ADMIN, new Date());
    const targetUser = makeUser(2, 'Target', 'User', UserRole.USER, new Date());
    const favorites = [
      makeMockFavorite(2, 'Product A', 99.99),
      makeMockFavorite(2, 'Product B', 149.99),
    ];

    authSpy.getCurrentUser.and.returnValue(admin);
    authSpy.getUserDetails.and.resolveTo(targetUser);
    authSpy.getUserActivity.and.resolveTo([]);
    authSpy.getUserOrders.and.resolveTo([]);
    authSpy.getUserFavorites.and.resolveTo(favorites);
    mockRoute.snapshot.paramMap.get.and.returnValue('2');

    const fixture = TestBed.createComponent(UserDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.favorites()).toEqual(favorites);
    expect(component.loadingFavorites()).toBeFalse();
  });

  it('gère les erreurs de chargement des données secondaires', async () => {
    const admin = makeUser(1, 'Admin', 'User', UserRole.ADMIN, new Date());
    const targetUser = makeUser(2, 'Target', 'User', UserRole.USER, new Date());

    authSpy.getCurrentUser.and.returnValue(admin);
    authSpy.getUserDetails.and.resolveTo(targetUser);
    authSpy.getUserActivity.and.rejectWith(new Error('Activity error'));
    authSpy.getUserOrders.and.rejectWith(new Error('Orders error'));
    authSpy.getUserFavorites.and.rejectWith(new Error('Favorites error'));
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
      const admin = makeUser(1, 'Admin', 'User', UserRole.ADMIN, new Date());
      const targetUser = makeUser(2, 'John', 'Doe', UserRole.USER, new Date('2024-12-01'));

      authSpy.getCurrentUser.and.returnValue(admin);
      authSpy.getUserDetails.and.resolveTo(targetUser);
      authSpy.getUserActivity.and.resolveTo([]);
      authSpy.getUserOrders.and.resolveTo([]);
      authSpy.getUserFavorites.and.resolveTo([]);
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
      expect(component.formatDateTime(date)).toMatch(/01\/12\/2024.+10:30/);
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
      expect(component.getOrderStatusLabel(OrderStatus.PENDING)).toBe('En attente');
      expect(component.getOrderStatusClass(OrderStatus.PENDING)).toBe(
        'bg-yellow-100 text-yellow-800'
      );

      expect(component.getOrderStatusLabel(OrderStatus.DELIVERED)).toBe('Livrée');
      expect(component.getOrderStatusClass(OrderStatus.DELIVERED)).toBe(
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
      authSpy.getUserOrders.and.resolveTo([]);
      authSpy.getUserFavorites.and.resolveTo([]);
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
      authSpy.getUserOrders.and.resolveTo([]);
      authSpy.getUserFavorites.and.resolveTo([]);
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
