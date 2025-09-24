import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';

import { CreateArtistPage } from './create-artist.page';
import { ArtistService } from '../../catalog/services/artist';
import { ToastService } from '../../../shared/services/toast.service';
import { Artist } from '../../catalog/models/product.model';

interface ArtistCreatePayload {
    name: string;
    bio?: string;
    profileImage?: string;
}

describe('Page de création d’artiste (CreateArtistPage)', () => {
    let fixture: ComponentFixture<CreateArtistPage>;
    let component: CreateArtistPage;

    let artistSvc: jasmine.SpyObj<Pick<ArtistService, 'create'>>;
    let toast: jasmine.SpyObj<Pick<ToastService, 'success' | 'error'>>;
    let router: Router;

    beforeEach(async () => {
        artistSvc = jasmine.createSpyObj<Pick<ArtistService, 'create'>>('ArtistService', ['create']);
        toast = jasmine.createSpyObj<Pick<ToastService, 'success' | 'error'>>('ToastService', [
            'success',
            'error',
        ]);

        await TestBed.configureTestingModule({
            imports: [CreateArtistPage],
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
        // Pas de detectChanges ici : on teste la logique TS seulement
    });

    it('se crée correctement', () => {
        expect(component).toBeTruthy();
    });

    it('enregistre → succès : appelle le service, affiche un succès et revient à la liste', async () => {
        artistSvc.create.and.callFake(async (data: Omit<Artist, 'id'>): Promise<Artist> => {
            return { id: 1, ...data };
        });

        const payload: ArtistCreatePayload = { name: 'Banksy', bio: 'Street artist' };
        await component.onSave(payload);

        expect(artistSvc.create).toHaveBeenCalledWith(payload);
        expect(toast.success).toHaveBeenCalledWith('Artiste créé avec succès !');
        expect(router.navigate).toHaveBeenCalledWith(['/admin/artists']);
    });

    it('enregistre → échec : affiche une erreur', async () => {
        artistSvc.create.and.rejectWith(new Error('fail'));

        const payload: ArtistCreatePayload = { name: 'Shepard Fairey' };
        await component.onSave(payload);

        expect(artistSvc.create).toHaveBeenCalled();
        // Autorise les deux variantes (avec ou sans apostrophe)
        expect(toast.error).toHaveBeenCalledWith(
            jasmine.stringMatching(/La création de l'?artiste a échoué\./)
        );
    });

    it('annuler : retourne à la liste', () => {
        component.onCancel();
        expect(router.navigate).toHaveBeenCalledWith(['/admin/artists']);
    });
});
