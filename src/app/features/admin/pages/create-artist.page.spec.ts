// src/app/features/admin/pages/create-artist.page.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { provideRouter } from '@angular/router';

import { CreateArtistPage } from './create-artist.page';
import { ArtistService } from '../../catalog/services/artist';
import { ToastService } from '../../../shared/services/toast.service';
import { Artist } from '../../catalog/models/product.model';

interface ArtistCreatePayload { name: string; bio?: string; profileImage?: string }

describe('CreateArtistPage', () => {
    let fixture: ComponentFixture<CreateArtistPage>;
    let component: CreateArtistPage;
    let artistSvc: jasmine.SpyObj<ArtistService>;
    let toast: jasmine.SpyObj<ToastService>;
    let router: Router;

    beforeEach(async () => {
        artistSvc = jasmine.createSpyObj<ArtistService>('ArtistService', ['create']);
        toast = jasmine.createSpyObj<ToastService>('ToastService', ['success', 'error']);

        await TestBed.configureTestingModule({
            imports: [CreateArtistPage, RouterTestingModule],
            providers: [
                provideRouter([]),
                { provide: ArtistService, useValue: artistSvc },
                { provide: ToastService, useValue: toast },
            ],
        }).compileComponents();

        router = TestBed.inject(Router);
        spyOn(router, 'navigate').and.resolveTo(true);

        fixture = TestBed.createComponent(CreateArtistPage);
        component = fixture.componentInstance;
        // do not trigger change detection immediately to avoid template ngModel registration errors
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('onSave: calls service, shows success, navigates on success', async () => {
        artistSvc.create.and.callFake(
            async (data: Omit<Artist, 'id'>): Promise<Artist> => ({ id: 1, ...data } as Artist)
        );

        const payload: ArtistCreatePayload = { name: 'Banksy', bio: 'Street artist' };
        await component.onSave(payload);

        expect(artistSvc.create).toHaveBeenCalledWith(payload);
        expect(toast.success).toHaveBeenCalledWith('Artiste créé avec succès !');
        expect(router.navigate).toHaveBeenCalledWith(['/admin/artists']);
    });

    it('onSave: shows error toast on failure', async () => {
        artistSvc.create.and.callFake(async () => { throw new Error('fail'); });

        const payload: ArtistCreatePayload = { name: 'Shepard Fairey' };
        await component.onSave(payload);

        expect(artistSvc.create).toHaveBeenCalled();
        expect(toast.error).toHaveBeenCalledWith(
            jasmine.stringMatching(/La création de l'?artiste a échoué\./)
        );
    });

    it('onCancel: navigates back to list', () => {
        component.onCancel();
        expect(router.navigate).toHaveBeenCalledWith(['/admin/artists']);
    });
});
