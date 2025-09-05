// src/app/app.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

// Header / Footer standalone déjà créés dans ton app
import { HeaderComponent } from './shared/components/header/header.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { BackToTopComponent } from './shared/components/back-to-top/back-to-top.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent, BackToTopComponent],
  template: `
    <div class="min-h-screen flex flex-col">
      <app-header></app-header>

      <main class="flex-1">
        <router-outlet></router-outlet>
      </main>
<app-back-to-top></app-back-to-top>
      <app-footer *ngIf="!hideFooter()"></app-footer>
    </div>
  `,
})
export class AppComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // signal pour piloter l’affichage du footer
  hideFooter = signal(false);
  title = 'Art Shop';
  constructor() {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      // on descend jusqu’à la route la plus profonde
      let r = this.route;
      while (r.firstChild) r = r.firstChild;
      this.hideFooter.set(!!r.snapshot.data['hideFooter']);
    });
  }
}
