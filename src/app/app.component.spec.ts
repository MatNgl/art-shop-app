// src/app/app.spec.ts
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AppComponent } from './app';

describe('Application (AppComponent)', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AppComponent],
            providers: [provideRouter([])],
        }).compileComponents();
    });

    it('se crée correctement', () => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.componentInstance;
        expect(app).toBeTruthy();
    });

    it('expose bien les flags du shell (header/footer/sidebar)', () => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.componentInstance;

        expect(app.hideHeader).toBeDefined();
        expect(app.hideFooter).toBeDefined();
        expect(app.hideSidebar).toBeDefined();
    });
});
