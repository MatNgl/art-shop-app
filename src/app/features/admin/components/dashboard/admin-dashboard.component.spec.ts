import { TestBed, ComponentFixture, fakeAsync, tick, flushMicrotasks } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { AdminDashboardComponent } from './admin-dashboard.component';
import { AuthService } from '../../../auth/services/auth';
import { CartStore } from '../../../cart/services/cart-store';
import { OrderStore } from '../../../cart/services/order-store';
import { ProductService } from '../../../catalog/services/product';
import { ArtistService } from '../../../catalog/services/artist';
import { ToastService } from '../../../../shared/services/toast.service';

import { User, UserRole } from '../../../auth/models/user.model';
import { Product, Artist } from '../../../catalog/models/product.model';

describe('Page Dashboard Admin (AdminDashboardComponent)', () => {
    let fixture: ComponentFixture<AdminDashboardComponent>;
    let component: AdminDashboardComponent;
    let router: Router;

    // Spies stricts
    let auth: jasmine.SpyObj<Pick<AuthService, 'getCurrentUser'>>;
    let productSvc: jasmine.SpyObj<Pick<ProductService, 'getAllProducts'>>;
    let artistSvc: jasmine.SpyObj<Pick<ArtistService, 'getAll'>>;
    let toast: jasmine.SpyObj<Pick<ToastService, 'info'>>;

    const ADMIN: User = {
        id: 1,
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'Root',
        role: UserRole.ADMIN,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-06-01'),
    };

    // ---- Fixtures strictes Product/Artist ----
    function makeProduct(
        id: number,
        title: string,
        opts?: {
            artistId?: number;
            images?: string[];
            price?: number;
            isAvailable?: boolean;
            categoryId?: number;
            originalPrice?: number;
            stock?: number;
            technique?: string;
            dimensions?: { width: number; height: number; depth?: number; unit: 'cm' | 'inches' };
            isLimitedEdition?: boolean;
        }
    ): Product {
        const images = opts?.images ?? [];
        const price = opts?.price ?? 100;
        const now = new Date();
        const artistId = opts?.artistId ?? 10;

        const base: Product = {
            id,
            title,
            description: 'Description courte',
            price,
            tags: [],
            imageUrl: images[0] ?? '',
            images,
            artistId,
            technique: opts?.technique ?? 'Technique',
            dimensions: opts?.dimensions ?? { width: 10, height: 10, unit: 'cm' },
            isAvailable: opts?.isAvailable ?? true,
            stock: opts?.stock ?? 10,
            isLimitedEdition: opts?.isLimitedEdition ?? false,
            createdAt: now,
            updatedAt: now,
        };

        if (typeof opts?.categoryId === 'number') base.categoryId = opts.categoryId;
        if (typeof opts?.originalPrice === 'number') base.originalPrice = opts.originalPrice;

        return base;
    }

    const PRODUCTS: Product[] = [
        makeProduct(1, 'Prod A', { images: ['a.jpg'], categoryId: 2 }),
        makeProduct(2, 'Prod B', { images: ['b.jpg'], categoryId: 1 }),
        makeProduct(3, 'Prod C', { images: [], categoryId: 3 }),
        makeProduct(4, 'Prod D', { categoryId: 2 }),
        makeProduct(5, 'Prod E', { images: ['e.jpg'], categoryId: 4 }),
        makeProduct(6, 'Prod F', { images: ['f.jpg'], categoryId: 4 }),
    ];

    const ARTISTS: Artist[] = [
        { id: 10, name: 'Alice' },
        { id: 11, name: 'Bob' },
    ];

    // Types locaux pour accéder proprement au signal privé dans 1 test
    interface SalesDataT { date: string; revenue: number; orders: number }
    interface Privates { _salesChartData: { set: (v: SalesDataT[]) => void } }

    beforeEach(async () => {
        auth = jasmine.createSpyObj<Pick<AuthService, 'getCurrentUser'>>('AuthService', ['getCurrentUser']);
        productSvc = jasmine.createSpyObj<Pick<ProductService, 'getAllProducts'>>('ProductService', ['getAllProducts']);
        artistSvc = jasmine.createSpyObj<Pick<ArtistService, 'getAll'>>('ArtistService', ['getAll']);
        toast = jasmine.createSpyObj<Pick<ToastService, 'info'>>('ToastService', ['info']);

        await TestBed.configureTestingModule({
            imports: [AdminDashboardComponent],
            providers: [
                provideRouter([]),
                { provide: AuthService, useValue: auth },
                // IMPORTANT : pas de createSpyObj vide → on injecte de simples objets
                { provide: CartStore, useValue: {} as CartStore },
                { provide: OrderStore, useValue: {} as OrderStore },
                { provide: ProductService, useValue: productSvc },
                { provide: ArtistService, useValue: artistSvc },
                { provide: ToastService, useValue: toast },
            ],
        }).compileComponents();

        router = TestBed.inject(Router);
        spyOn(router, 'navigate').and.resolveTo(true);

        fixture = TestBed.createComponent(AdminDashboardComponent);
        component = fixture.componentInstance;
    });

    it('se crée correctement', () => {
        expect(component).toBeTruthy();
    });

    it('ngOnInit → non admin → redirige vers \'/\' et ne charge pas les données', async () => {
        auth.getCurrentUser.and.returnValue(null);
        const spyLoad = spyOn(component, 'loadDashboardData').and.resolveTo();

        await component.ngOnInit();

        expect(router.navigate).toHaveBeenCalledWith(['/']);
        expect(spyLoad).not.toHaveBeenCalled();
        expect(toast.info).not.toHaveBeenCalled();
    });

    it('ngOnInit → admin connecté → appelle loadDashboardData + toast de bienvenue', async () => {
        auth.getCurrentUser.and.returnValue(ADMIN);
        const spyLoad = spyOn(component, 'loadDashboardData').and.resolveTo();

        await component.ngOnInit();

        expect(spyLoad).toHaveBeenCalled();
        expect(toast.info).toHaveBeenCalledWith('Bienvenue sur le dashboard administrateur !');
    });

    it('loadDashboardData → remplit les signaux (stats, courbes, catégories, top) et coupe le loading', fakeAsync(() => {
        // mocks de services
        productSvc.getAllProducts.and.resolveTo(PRODUCTS);
        artistSvc.getAll.and.resolveTo(ARTISTS);

        component.selectedPeriod = '7';

        // lance le chargement
        const p = component.loadDashboardData();

        // setTimeout(1000) interne
        tick(1000);
        // résoudre les Promises de nos spies
        flushMicrotasks();

        // invariants attendus
        expect(component.loading()).toBeFalse();
        expect(component.stats().totalProducts).toBe(PRODUCTS.length);
        expect(component.salesChartData().length).toBe(7);
        expect(component.categoryStats().length).toBe(5);
        expect(component.topProducts().length).toBe(5);

        // termine proprement (optionnel)
        p.then(() => void 0);
        flushMicrotasks();
    }));

    it('toggleSeries → bascule revenu / commandes', () => {
        expect(component.showRevenue()).toBeTrue();
        component.toggleSeries('revenue');
        expect(component.showRevenue()).toBeFalse();

        expect(component.showOrders()).toBeTrue();
        component.toggleSeries('orders');
        expect(component.showOrders()).toBeFalse();
    });

    it('helpers Y → yRevenue/yOrders restent dans le viewBox quand on force des données', () => {
        // on pousse des données déterministes via le signal privé (cast typé)
        (component as unknown as Privates)._salesChartData.set([
            { date: '2025-01-01', revenue: 1000, orders: 10 },
            { date: '2025-01-02', revenue: 2000, orders: 20 },
            { date: '2025-01-03', revenue: 3000, orders: 5 },
        ]);

        const y1 = component.yRevenue(0);
        const y2 = component.yRevenue(3000);
        expect(y1).toBeGreaterThanOrEqual(0);
        expect(y1).toBeLessThanOrEqual(component.CHART_H);
        expect(y2).toBeGreaterThanOrEqual(0);
        expect(y2).toBeLessThanOrEqual(component.CHART_H);

        const o1 = component.yOrders(0);
        const o2 = component.yOrders(20);
        expect(o1).toBeGreaterThanOrEqual(0);
        expect(o2).toBeLessThanOrEqual(component.CHART_H);
    });

    it('onPeriodChange → relance le chargement des données pour la nouvelle période', () => {
        const spyLoad = spyOn(component, 'loadDashboardData').and.resolveTo();
        component.selectedPeriod = '30';

        component.onPeriodChange();

        expect(spyLoad).toHaveBeenCalled();
    });

    it('refreshData → relance le chargement + toast d\'info', () => {
        const spyLoad = spyOn(component, 'loadDashboardData').and.resolveTo();

        component.refreshData();

        expect(spyLoad).toHaveBeenCalled();
        expect(toast.info).toHaveBeenCalledWith('Données du dashboard actualisées.');
    });
});
