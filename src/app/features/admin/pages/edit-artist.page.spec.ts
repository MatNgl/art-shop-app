import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { EditArtistPage } from './edit-artist.page';
import { Artist } from '../../catalog/models/product.model';
import { ArtistService } from '../../catalog/services/artist';
import { ToastService } from '../../../shared/services/toast.service';

describe('Page d’édition d’artiste (EditArtistPage)', () => {
    let component: EditArtistPage;

    let artistSvc: jasmine.SpyObj<Pick<ArtistService, 'getById' | 'update'>>;
    let toast: jasmine.SpyObj<ToastService>;
    let router: Router;

    const ARTIST: Artist = {
        id: 42,
        name: 'Banksy',
        bio: 'Street artist',
        profileImage: 'http://img',
    };

    function setupWithRouteId(idValue: string): void {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            imports: [EditArtistPage, RouterTestingModule],
            providers: [
                { provide: ArtistService, useValue: artistSvc },
                { provide: ToastService, useValue: toast },
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: { paramMap: convertToParamMap({ id: idValue }) },
                    },
                },
            ],
        });

        const fixture = TestBed.createComponent(EditArtistPage);
        component = fixture.componentInstance;

        router = TestBed.inject(Router);
        spyOn(router, 'navigate').and.resolveTo(true);
    }

    beforeEach(() => {
        artistSvc = jasmine.createSpyObj<Pick<ArtistService, 'getById' | 'update'>>(
            'ArtistService',
            ['getById', 'update']
        );
        toast = jasmine.createSpyObj<ToastService>('ToastService', ['success', 'error']);
    });

    it('le composant est défini', () => {
        expect(typeof EditArtistPage).toBe('function');
    });

    it('ngOnInit → ID invalide : affiche une erreur puis revient à la liste', async () => {
        setupWithRouteId('not-a-number');

        await component.ngOnInit();

        expect(toast.error).toHaveBeenCalledWith("Identifiant d'artiste invalide.");
        expect(router.navigate).toHaveBeenCalledWith(['/admin/artists']);
        expect(artistSvc.getById).not.toHaveBeenCalled();
    });

    it("ngOnInit → artiste introuvable : affiche une erreur, reste sur place et met 'initial' à null", async () => {
        setupWithRouteId('5');
        artistSvc.getById.and.resolveTo(null);

        await component.ngOnInit();

        expect(artistSvc.getById).toHaveBeenCalledWith(5);
        expect(toast.error).toHaveBeenCalledWith('Artiste introuvable.');
        expect((router.navigate as jasmine.Spy)).not.toHaveBeenCalled();
        expect(component.initial()).toBeNull();
        expect(component.loading()).toBeFalse();
    });

    it('ngOnInit → charge l’artiste et renseigne l’état initial', async () => {
        setupWithRouteId(String(ARTIST.id));
        artistSvc.getById.and.resolveTo(ARTIST);

        await component.ngOnInit();

        expect(artistSvc.getById).toHaveBeenCalledWith(ARTIST.id);
        expect(component.initial()?.id).toBe(ARTIST.id);
        expect(component.loading()).toBeFalse();
    });

    it('onSave → mise à jour réussie : affiche un succès et retourne à la liste', async () => {
        setupWithRouteId(String(ARTIST.id));
        artistSvc.getById.and.resolveTo(ARTIST);
        artistSvc.update.and.resolveTo();

        await component.ngOnInit();

        const payload = { name: 'Banksy (modifié)', bio: 'Updated bio' };
        await component.onSave(payload);

        expect(artistSvc.update).toHaveBeenCalledWith(ARTIST.id, payload);
        expect(toast.success).toHaveBeenCalledWith('Artiste modifié avec succès !');
        expect(router.navigate).toHaveBeenCalledWith(['/admin/artists']);
    });

    it('onSave → échec de mise à jour : affiche une erreur', async () => {
        setupWithRouteId(String(ARTIST.id));
        artistSvc.getById.and.resolveTo(ARTIST);
        artistSvc.update.and.rejectWith(new Error('boom'));

        await component.ngOnInit();
        await component.onSave({ name: 'X' });

        expect(artistSvc.update).toHaveBeenCalled();
        expect(toast.error).toHaveBeenCalledWith("La modification de l'artiste a échoué.");
    });

    it('onSave → aucun artiste chargé : affiche une erreur et ne tente pas d’update', async () => {
        // Cas volontairement sans initial : on force un ID invalide pour sortir tôt de ngOnInit
        setupWithRouteId('NaN');
        await component.ngOnInit();

        // On neutralise le spy de navigation pour ce scénario précis
        component.initial.set(null);
        (router.navigate as jasmine.Spy).calls.reset();

        await component.onSave({ name: 'X' });

        expect(artistSvc.update).not.toHaveBeenCalled();
        expect(toast.error).toHaveBeenCalledWith('Aucun artiste à modifier.');
        expect((router.navigate as jasmine.Spy)).not.toHaveBeenCalled();
    });

    it('onCancel → retourne simplement à la liste', () => {
        setupWithRouteId(String(ARTIST.id));
        component.onCancel();
        expect((router.navigate as jasmine.Spy)).toHaveBeenCalledWith(['/admin/artists']);
    });
});
