import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';

import { OrderDetailsPage } from './order-details.page';
import { OrderService } from '../../orders/services/order';
import type { Order, OrderStatus } from '../../orders/models/order.model';
import { ToastService } from '../../../shared/services/toast.service';
import { ConfirmService } from '../../../shared/services/confirm.service';
import { AuthService } from '../../auth/services/auth';

describe('Page de détails de commande (OrderDetailsPage)', () => {
    let component: OrderDetailsPage;

    let router: Router;

    let orders: jasmine.SpyObj<Pick<
        OrderService,
        'getById' | 'updateStatus' | 'updateNotes' | 'delete'
    >>;
    let toast: jasmine.SpyObj<Pick<ToastService, 'success' | 'error' | 'warning'>>;
    let confirm: jasmine.SpyObj<Pick<ConfirmService, 'ask'>>;

    // Stub minimal et typé pour AuthService (sans any)
    interface AuthStub { getCurrentUser: () => { role: 'admin' | 'user' } | null }

    const ORDER: Order = {
        id: 'ord-1',
        createdAt: new Date().toISOString(),
        status: 'pending',
        customer: {
            firstName: 'Alice',
            lastName: 'Martin',
            email: 'alice@example.com',
            address: {
                street: '1 rue de la Paix',
                zip: '75001',
                city: 'Paris',
                country: 'FR',
            },
            phone: '0600000000',
        },
        items: [
            { productId: 10, title: 'Affiche A', qty: 2, unitPrice: 15 },
            { productId: 11, title: 'Affiche B', qty: 1, unitPrice: 25 },
        ],
        subtotal: 55,
        shipping: 5,
        taxes: 11,
        total: 71,
        payment: { method: 'card', last4: '4242' },
        notes: 'Livrer le samedi matin',
    };

    function setup(options: { idParam?: string | null; userRole?: 'admin' | 'user' | null }) {
        const { idParam = ORDER.id, userRole = 'admin' } = options;

        const routeStub: Pick<ActivatedRoute, 'snapshot'> = {
            snapshot: {
                paramMap: idParam
                    ? convertToParamMap({ id: idParam })
                    : convertToParamMap({}), // → get('id') => null
            } as ActivatedRoute['snapshot'],
        };

        const authStub: AuthStub = {
            getCurrentUser: () => (userRole ? { role: userRole } : null),
        };

        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            imports: [OrderDetailsPage],
            providers: [
                provideRouter([]),
                { provide: ActivatedRoute, useValue: routeStub },
                { provide: AuthService, useValue: authStub as unknown as AuthService },
                { provide: OrderService, useValue: orders },
                { provide: ToastService, useValue: toast },
                { provide: ConfirmService, useValue: confirm },
            ],
        });

        router = TestBed.inject(Router);
        spyOn(router, 'navigate').and.resolveTo(true);

        const fixture = TestBed.createComponent(OrderDetailsPage);
        component = fixture.componentInstance;
    }

    beforeEach(() => {
        orders = jasmine.createSpyObj<Pick<
            OrderService,
            'getById' | 'updateStatus' | 'updateNotes' | 'delete'
        >>('OrderService', ['getById', 'updateStatus', 'updateNotes', 'delete']);
        toast = jasmine.createSpyObj<Pick<ToastService, 'success' | 'error' | 'warning'>>(
            'ToastService',
            ['success', 'error', 'warning']
        );
        confirm = jasmine.createSpyObj<Pick<ConfirmService, 'ask'>>('ConfirmService', ['ask']);
    });

    it('est défini', () => {
        setup({});
        expect(typeof OrderDetailsPage).toBe('function');
    });

    it('refuse l’accès si l’utilisateur n’est pas admin (redirige vers /)', async () => {
        setup({ userRole: 'user' });

        await component.ngOnInit();

        expect(router.navigate).toHaveBeenCalledWith(['/']);
        expect(orders.getById).not.toHaveBeenCalled();
    });

    it("redirige vers la liste si l'ID est absent dans l’URL", async () => {
        setup({ idParam: null, userRole: 'admin' });

        await component.ngOnInit();

        expect(router.navigate).toHaveBeenCalledWith(['/admin/orders']);
        expect(orders.getById).not.toHaveBeenCalled();
    });

    it('charge la commande, alimente `order` et désactive le chargement', async () => {
        setup({ idParam: ORDER.id, userRole: 'admin' });
        orders.getById.and.resolveTo(ORDER);

        await component.ngOnInit();

        expect(orders.getById).toHaveBeenCalledWith(ORDER.id);
        expect(component.order()?.id).toBe(ORDER.id);
        expect(component.loading()).toBeFalse();
        expect(component.notes).toBe(ORDER.notes ?? '');
    });

    it('affiche une erreur si le chargement échoue et met `order` à null', async () => {
        setup({ idParam: ORDER.id, userRole: 'admin' });
        orders.getById.and.rejectWith(new Error('fail'));

        await component.ngOnInit();

        expect(toast.error).toHaveBeenCalledWith('Impossible de charger la commande');
        expect(component.order()).toBeNull();
        expect(component.loading()).toBeFalse();
    });

    it('changeStatus → succès : met à jour le statut + toast succès', async () => {
        setup({});
        component.order.set(ORDER);
        const next: OrderStatus = 'accepted';
        orders.updateStatus.and.resolveTo({ ...ORDER, status: next });

        await component.changeStatus(next);

        expect(orders.updateStatus).toHaveBeenCalledWith(ORDER.id, next);
        expect(component.order()!.status).toBe(next);
        expect(toast.success).toHaveBeenCalled(); // message déjà vérifié dans le composant
    });

    it('changeStatus → échec : toast erreur', async () => {
        setup({});
        component.order.set(ORDER);
        orders.updateStatus.and.rejectWith(new Error('nope'));

        await component.changeStatus('refused');

        expect(orders.updateStatus).toHaveBeenCalled();
        expect(toast.error).toHaveBeenCalledWith('Mise à jour du statut impossible');
    });

    it('saveNotes → succès : met à jour les notes + toast succès', async () => {
        setup({});
        component.order.set(ORDER);
        component.notes = 'Nouvelles notes';
        orders.updateNotes.and.resolveTo({ ...ORDER, notes: 'Nouvelles notes' });

        await component.saveNotes();

        expect(orders.updateNotes).toHaveBeenCalledWith(ORDER.id, 'Nouvelles notes');
        expect(component.order()!.notes).toBe('Nouvelles notes');
        expect(toast.success).toHaveBeenCalledWith('Notes enregistrées');
    });

    it("saveNotes → échec : toast erreur (l'ordre reste inchangé)", async () => {
        setup({});
        component.order.set(ORDER);
        component.notes = '…';
        orders.updateNotes.and.rejectWith(new Error('nope'));

        await component.saveNotes();

        expect(orders.updateNotes).toHaveBeenCalled();
        expect(toast.error).toHaveBeenCalledWith("Impossible d'enregistrer les notes");
        expect(component.order()!.id).toBe(ORDER.id);
    });

    it('remove → annulation par l’utilisateur : ne supprime pas', async () => {
        setup({});
        component.order.set(ORDER);
        confirm.ask.and.resolveTo(false);

        await component.remove();

        expect(confirm.ask).toHaveBeenCalled();
        expect(orders.delete).not.toHaveBeenCalled();
        expect(toast.success).not.toHaveBeenCalled();
        expect((router.navigate as jasmine.Spy)).not.toHaveBeenCalled();
    });

    it('remove → confirmé et succès : supprime + toast succès + retourne à la liste', async () => {
        setup({});
        component.order.set(ORDER);
        confirm.ask.and.resolveTo(true);
        orders.delete.and.resolveTo();

        await component.remove();

        expect(orders.delete).toHaveBeenCalledWith(ORDER.id);
        expect(toast.success).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(['/admin/orders']);
    });

    it('remove → confirmé mais échec : toast erreur, pas de navigation', async () => {
        setup({});
        component.order.set(ORDER);
        confirm.ask.and.resolveTo(true);
        orders.delete.and.rejectWith(new Error('boom'));

        await component.remove();

        expect(orders.delete).toHaveBeenCalledWith(ORDER.id);
        expect(toast.error).toHaveBeenCalledWith('Suppression impossible');
        expect((router.navigate as jasmine.Spy)).not.toHaveBeenCalled();
    });
});
