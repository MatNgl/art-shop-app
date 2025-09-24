import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { ArtistFormComponent } from './artist-form.component';
import { Artist } from '../../../catalog/models/product.model';

describe('Formulaire artiste (ArtistFormComponent)', () => {
    let fixture: ComponentFixture<ArtistFormComponent>;
    let component: ArtistFormComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ArtistFormComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ArtistFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('se crée correctement', () => {
        expect(component).toBeTruthy();
    });

    it('soumission invalide → affiche l’erreur et n’émet pas', () => {
        const emitSpy = spyOn(component.save, 'emit');

        component.submit();
        fixture.detectChanges();

        const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
        expect(text).toContain('Le nom est requis (2 à 80 caractères).');
        expect(emitSpy).not.toHaveBeenCalled();
    });

    it('soumission valide → émet uniquement le nom (bio et image absentes)', () => {
        const emitSpy = spyOn(component.save, 'emit');

        component.form.controls.name.setValue('Banksy');
        fixture.detectChanges();

        component.submit();
        expect(emitSpy).toHaveBeenCalledTimes(1);
        expect(emitSpy).toHaveBeenCalledWith({ name: 'Banksy' });
    });

    it('réinitialise depuis @Input() initial et reflète les valeurs', () => {
        const initial: Artist = {
            id: 42,
            name: 'Alice',
            bio: 'Bio courte',
            profileImage: 'https://example.com/p.png',
        };
        component.initial = initial;
        fixture.detectChanges();

        expect(component.form.controls.name.value).toBe('Alice');
        expect(component.form.controls.bio.value).toBe('Bio courte');
        expect(component.form.controls.profileImage.value).toBe('https://example.com/p.png');
    });

    it('addImageByUrl() → accepte une URL valide et l’inclut au payload émis', () => {
        const emitSpy = spyOn(component.save, 'emit');

        component.form.controls.name.setValue('Shepard Fairey');
        spyOn(window, 'prompt').and.returnValue('https://img.test/x.png');
        spyOn(window, 'alert').and.stub();

        component.addImageByUrl();
        fixture.detectChanges();

        expect(component.form.controls.profileImage.value).toBe('https://img.test/x.png');

        component.submit();
        expect(emitSpy).toHaveBeenCalledWith({
            name: 'Shepard Fairey',
            profileImage: 'https://img.test/x.png',
        });
    });

    it('clic sur “Annuler” → émet formCancel', () => {
        const cancelSpy = spyOn(component.formCancel, 'emit');

        const btn = fixture
            .debugElement
            .queryAll(By.css('button'))
            .find(el => (el.nativeElement as HTMLButtonElement).textContent?.includes('Annuler'));
        expect(btn).toBeTruthy();

        btn!.nativeElement.click();
        expect(cancelSpy).toHaveBeenCalled();
    });
});
