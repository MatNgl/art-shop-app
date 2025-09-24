import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminOrdersComponent } from './admin-orders.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmService } from '../../../../shared/services/confirm.service';
import { OrderService } from '../../../orders/services/order';
import { AuthService } from '../../../auth/services/auth';
import type { Order, OrderStatus } from '../../../orders/models/order.model';
import { User, UserRole } from '../../../auth/models/user.model';

type TAuth = Pick<AuthService, 'getCurrentUser'>;
type TToast = Pick<ToastService, 'success' | 'error' | 'info' | 'warning'>;
type TConfirm = Pick<ConfirmService, 'ask'>;
type TOrders = Pick<OrderService, 'getAll' | 'updateStatus' | 'delete'>;

// Using the real `User` model in tests to match AuthService expectations

function makeOrder(
    id: string,
    status: OrderStatus,
    total = 100,
    createdAt: Date | string = new Date(),
    extra?: Partial<Order>
): Order {
    const d = typeof createdAt === 'string' ? createdAt : createdAt.toISOString();
    return {
        id,
        status,
        total,
        createdAt: d,
        items: [{ productId: 1, title: 'Affiche', qty: 1, unitPrice: total }],
        // minimal customer info matching CustomerInfo
        customer: {
            firstName: 'Alice',
            lastName: 'Durand',
            email: 'alice@ex.fr',
            address: { street: '-', city: '-', zip: '00000', country: 'FR' },
        },
        payment: { method: 'card', last4: '4242' },
        // shipping cost numeric, subtotal/taxes included for Order shape
        subtotal: total,
        taxes: 0,
        shipping: 0,
        ...extra,
    } as Order;
}

describe('Page admin commandes (AdminOrdersComponent)', () => {
    let router: Router;
    let authSpy: jasmine.SpyObj<TAuth>;
    let toastSpy: jasmine.SpyObj<TToast>;
    let confirmSpy: jasmine.SpyObj<TConfirm>;
    let ordersSpy: jasmine.SpyObj<TOrders>;

    beforeEach(async () => {
        authSpy = jasmine.createSpyObj<TAuth>('AuthService', ['getCurrentUser']);
        toastSpy = jasmine.createSpyObj<TToast>('ToastService', ['success', 'error', 'info', 'warning']);
        confirmSpy = jasmine.createSpyObj<TConfirm>('ConfirmService', ['ask']);
        ordersSpy = jasmine.createSpyObj<TOrders>('OrderService', ['getAll', 'updateStatus', 'delete']);

        await TestBed.configureTestingModule({
            imports: [CommonModule, FormsModule, AdminOrdersComponent],
            providers: [
                provideRouter([]),
                { provide: AuthService, useValue: authSpy },
                { provide: ToastService, useValue: toastSpy },
                { provide: ConfirmService, useValue: confirmSpy },
                { provide: OrderService, useValue: ordersSpy },
            ],
        }).compileComponents();

        router = TestBed.inject(Router);
        spyOn(router, 'navigate').and.resolveTo(true);
    });

    it('redirige vers la page d’accueil si utilisateur non admin', async () => {
        const user: User = {
            id: 2,
            email: 'user@example.com',
            firstName: 'U',
            lastName: 'ser',
            role: UserRole.USER,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        authSpy.getCurrentUser.and.returnValue(user);

        const fixture = TestBed.createComponent(AdminOrdersComponent);
        fixture.detectChanges();

        await fixture.whenStable();
        expect(router.navigate).toHaveBeenCalledWith(['/']);
    });

    it('charge la liste et calcule les stats (total, en cours, livrées, CA 7j)', async () => {
        const admin: User = {
            id: 1,
            email: 'admin@example.com',
            firstName: 'Admin',
            lastName: 'Istrator',
            role: UserRole.ADMIN,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        authSpy.getCurrentUser.and.returnValue(admin);
        const now = new Date();
        const lastWeek = new Date(now.getTime() - 6 * 24 * 3600 * 1000);
        ordersSpy.getAll.and.resolveTo([
            makeOrder('A', 'pending', 50, now),
            makeOrder('B', 'processing', 70, lastWeek),
            makeOrder('C', 'delivered', 120, now),
            makeOrder('D', 'refused', 60, now),
        ]);

        const fixture = TestBed.createComponent(AdminOrdersComponent);
        const comp = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();

        expect(comp.loading()).toBeFalse();
        expect(comp.orders().length).toBe(4);

        const s = comp.stats();
        expect(s.total).toBe(4);
        expect(s.inProgress).toBe(2); // pending + processing
        expect(s.delivered).toBe(1);
        // CA 7j = toutes sauf refusées
        expect(s.revenue7d).toBeCloseTo(50 + 70 + 120, 6);
    });

    it('filtre par recherche, statut et trie par montant décroissant', async () => {
        const admin: User = {
            id: 1,
            email: 'admin@example.com',
            firstName: 'Admin',
            lastName: 'Istrator',
            role: UserRole.ADMIN,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        authSpy.getCurrentUser.and.returnValue(admin);
        ordersSpy.getAll.and.resolveTo([
            makeOrder('o-1', 'pending', 100, new Date(), {
                customer: { firstName: 'Zoé', lastName: 'Zed', email: 'zoe@ex.fr', address: { street: '-', city: '-', zip: '00000', country: 'FR' } },
            }),
            makeOrder('o-2', 'delivered', 200, new Date(), {
                customer: { firstName: 'Ben', lastName: 'Bar', email: 'ben@ex.fr', address: { street: '-', city: '-', zip: '00000', country: 'FR' } },
            }),
            makeOrder('o-3', 'delivered', 150, new Date(), {
                customer: { firstName: 'Ana', lastName: 'Ars', email: 'ana@ex.fr', address: { street: '-', city: '-', zip: '00000', country: 'FR' } },
            }),
        ]);

        const fixture = TestBed.createComponent(AdminOrdersComponent);
        const comp = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();

        comp.search = 'o-';
        comp.applyFilters();
        expect(comp.filtered().length).toBe(3);

        comp.onStatusChange('delivered');
        expect(comp.status()).toBe('delivered');
        expect(comp.filtered().length).toBe(2);

        comp.onSortChange('total_desc');
        const arr = comp.filtered();
        expect(arr[0].total).toBe(200);
        expect(arr[1].total).toBe(150);
    });

    it('met à jour le statut et notifie le succès', async () => {
        const admin: User = {
            id: 1,
            email: 'admin@example.com',
            firstName: 'Admin',
            lastName: 'Istrator',
            role: UserRole.ADMIN,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        authSpy.getCurrentUser.and.returnValue(admin);
        ordersSpy.getAll.and.resolveTo([makeOrder('X', 'pending')]);
        ordersSpy.updateStatus.and.resolveTo();

        const fixture = TestBed.createComponent(AdminOrdersComponent);
        const comp = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();

        await comp.changeStatus(comp.orders()[0], 'delivered');
        expect(ordersSpy.updateStatus).toHaveBeenCalledWith('X', 'delivered');
        expect(ordersSpy.getAll).toHaveBeenCalledTimes(2); // load initial + reload
        expect(toastSpy.success).toHaveBeenCalledWith(
            jasmine.stringMatching(/#X mis à jour en Livrée/)
        );
    });

    it('affiche une erreur si la MAJ du statut échoue', async () => {
        const admin: User = {
            id: 1,
            email: 'admin@example.com',
            firstName: 'Admin',
            lastName: 'Istrator',
            role: UserRole.ADMIN,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        authSpy.getCurrentUser.and.returnValue(admin);
        ordersSpy.getAll.and.resolveTo([makeOrder('X', 'pending')]);
        ordersSpy.updateStatus.and.rejectWith(new Error('boom'));

        const fixture = TestBed.createComponent(AdminOrdersComponent);
        const comp = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();

        await comp.changeStatus(comp.orders()[0], 'refused');
        expect(toastSpy.error).toHaveBeenCalledWith('Impossible de mettre à jour le statut');
    });

    it('supprime une commande après confirmation et recharge la liste', async () => {
        const admin: User = {
            id: 1,
            email: 'admin@example.com',
            firstName: 'Admin',
            lastName: 'Istrator',
            role: UserRole.ADMIN,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        authSpy.getCurrentUser.and.returnValue(admin);
        ordersSpy.getAll.and.resolveTo([makeOrder('Y', 'pending')]);
        confirmSpy.ask.and.resolveTo(true);
        ordersSpy.delete.and.resolveTo();

        const fixture = TestBed.createComponent(AdminOrdersComponent);
        const comp = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();

        await comp.remove(comp.orders()[0]);
        expect(confirmSpy.ask).toHaveBeenCalled();
        expect(ordersSpy.delete).toHaveBeenCalledWith('Y');
        expect(ordersSpy.getAll).toHaveBeenCalledTimes(2);
        expect(toastSpy.success).toHaveBeenCalledWith('Commande #Y supprimée');
    });

    it('ne supprime pas si la confirmation est annulée', async () => {
        const admin: User = {
            id: 1,
            email: 'admin@example.com',
            firstName: 'Admin',
            lastName: 'Istrator',
            role: UserRole.ADMIN,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        authSpy.getCurrentUser.and.returnValue(admin);
        ordersSpy.getAll.and.resolveTo([makeOrder('Y', 'pending')]);
        confirmSpy.ask.and.resolveTo(false);

        const fixture = TestBed.createComponent(AdminOrdersComponent);
        const comp = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();

        await comp.remove(comp.orders()[0]);
        expect(ordersSpy.delete).not.toHaveBeenCalled();
    });

    it('exporte un CSV et confirme la génération', async () => {
        const admin: User = {
            id: 1,
            email: 'admin@example.com',
            firstName: 'Admin',
            lastName: 'Istrator',
            role: UserRole.ADMIN,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        authSpy.getCurrentUser.and.returnValue(admin);
        ordersSpy.getAll.and.resolveTo([
            makeOrder('csv-1', 'delivered', 123.45, new Date('2025-01-01T10:00:00Z')),
        ]);

        // Sauvegarde des refs natives AVANT les spies
        const origCreateElement = document.createElement.bind(document);
        const origCreateObjectURL = URL.createObjectURL;

        // Stubs
        spyOn(URL, 'createObjectURL').and.returnValue('blob:csv');

        const createEl = spyOn(document, 'createElement').and.callFake((tag: string) => {
            const el = origCreateElement(tag);
            (el as HTMLAnchorElement).click = jasmine.createSpy('click');
            return el;
        });

        const bodyAppend = spyOn(document.body, 'appendChild').and.callThrough();
        const removeChild = spyOn(document.body, 'removeChild').and.callThrough();

        const fixture = TestBed.createComponent(AdminOrdersComponent);
        const comp = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable(); // attendre le load()

        comp.exportCsv();

        expect(createEl).toHaveBeenCalledWith('a');
        expect(bodyAppend).toHaveBeenCalled();
        expect(removeChild).toHaveBeenCalled();
        expect(toastSpy.success).toHaveBeenCalledWith('Export CSV des commandes généré');

        // cleanup
        URL.createObjectURL = origCreateObjectURL;
    });
});
