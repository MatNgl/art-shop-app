import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { UserStatsWidgetComponent } from './user-stats-widget.component';
import { AuthService } from '../../../auth/services/auth';
import { ToastService } from '../../../../shared/services/toast.service';

describe('Widget Utilisateurs (UserStatsWidgetComponent)', () => {
    let fixture: ComponentFixture<UserStatsWidgetComponent>;
    let component: UserStatsWidgetComponent;

    let auth: jasmine.SpyObj<Pick<AuthService, 'getUserStats'>>;
    let toast: jasmine.SpyObj<Pick<ToastService, 'info'>>;

    beforeEach(async () => {
        auth = jasmine.createSpyObj<Pick<AuthService, 'getUserStats'>>('AuthService', ['getUserStats']);
        toast = jasmine.createSpyObj<Pick<ToastService, 'info'>>('ToastService', ['info']);

        await TestBed.configureTestingModule({
            imports: [UserStatsWidgetComponent],
            providers: [
                provideRouter([]),
                { provide: AuthService, useValue: auth },
                { provide: ToastService, useValue: toast },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(UserStatsWidgetComponent);
        component = fixture.componentInstance;
    });

    it('se crée correctement', () => {
        expect(component).toBeTruthy();
    });

    it('ngOnInit → charge les stats et met fin au loading', async () => {
        auth.getUserStats.and.resolveTo({
            total: 10,
            admins: 2,
            users: 8,
            recentRegistrations: 3,
            registrationsThisMonth: 4,
        });

        await component.ngOnInit();

        expect(auth.getUserStats).toHaveBeenCalled();
        expect(component.loading()).toBeFalse();
        expect(component.stats().total).toBe(10);

        // growthPercentage est calculé dans le composant
        const s = component.stats();
        // valeur déterministe selon la formule : round( registrationsThisMonth / max(total - registrationsThisMonth,1) * 100 )
        expect(s.growthPercentage).toBe(Math.round((4 / Math.max(10 - 4, 1)) * 100));
    });

    it('getAdminPercentage / getUserPercentage → calculent correctement les pourcentages', () => {
        component.stats.set({
            total: 20,
            admins: 5,
            users: 15,
            recentRegistrations: 0,
            registrationsThisMonth: 0,
            growthPercentage: 0,
        });

        expect(component.getAdminPercentage()).toBe(25);
        expect(component.getUserPercentage()).toBe(75);
    });

    it('getGrowthClass / getGrowthIconClass → classes adaptées au volume du mois', () => {
        component.stats.set({
            total: 20,
            admins: 2,
            users: 18,
            recentRegistrations: 0,
            registrationsThisMonth: 6, // >5
            growthPercentage: 0,
        });

        expect(component.getGrowthClass()).toBe('text-green-600');
        expect(component.getGrowthIconClass()).toBe('fa-arrow-up');

        component.stats.update(s => ({ ...s, registrationsThisMonth: 2 })); // >0
        expect(component.getGrowthClass()).toBe('text-blue-600');
        expect(component.getGrowthIconClass()).toBe('fa-arrow-right');

        component.stats.update(s => ({ ...s, registrationsThisMonth: 0 })); // =0
        expect(component.getGrowthClass()).toBe('text-gray-600');
        expect(component.getGrowthIconClass()).toBe('fa-minus');
    });

    it("exportUsers → affiche un toast d'info", () => {
        component.exportUsers();
        expect(toast.info).toHaveBeenCalledWith('Export des utilisateurs lancé');
    });
});
