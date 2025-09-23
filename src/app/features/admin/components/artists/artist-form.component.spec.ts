import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { ArtistFormComponent } from './artist-form.component';
import { Artist } from '../../../catalog/models/product.model';

describe('ArtistFormComponent', () => {
    let fixture: ComponentFixture<ArtistFormComponent>;
    let component: ArtistFormComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ArtistFormComponent], // standalone component
        }).compileComponents();

        fixture = TestBed.createComponent(ArtistFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('shows validation error when name is invalid on submit and does not emit save', () => {
        // nom vide par défaut → invalid
        const emitSpy = spyOn(component.save, 'emit');

        component.submit();      // déclenche markAllAsTouched + validation
        fixture.detectChanges(); // refléter le DOM

        const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
        expect(text).toContain('Le nom est requis (2 à 80 caractères).');
        expect(emitSpy).not.toHaveBeenCalled();
    });

    it('emits payload on valid submit (only name when bio/profileImage are empty)', () => {
        const emitSpy = spyOn(component.save, 'emit');

        component.form.controls.name.setValue('Banksy');
        fixture.detectChanges();

        component.submit();
        expect(emitSpy).toHaveBeenCalledTimes(1);
        expect(emitSpy).toHaveBeenCalledWith({ name: 'Banksy' });
    });

    it('resets form from @Input() initial and reflects values', () => {
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

    it('addImageByUrl() accepts a valid URL and includes it in emitted payload', () => {
        const emitSpy = spyOn(component.save, 'emit');

        // Remplir un name valide
        component.form.controls.name.setValue('Shepard Fairey');

        // Stub prompt → URL valide
        spyOn(window, 'prompt').and.returnValue('https://img.test/x.png');
        // On évite tout alert parasite dans ce test
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

    it('click on "Annuler" emits formCancel', () => {
        const cancelSpy = spyOn(component.formCancel, 'emit');

        const btn = fixture.debugElement.queryAll(By.css('button'))
            .find(el => (el.nativeElement as HTMLButtonElement).textContent?.includes('Annuler'));
        expect(btn).toBeTruthy();

        btn!.nativeElement.click();
        expect(cancelSpy).toHaveBeenCalled();
    });
});
