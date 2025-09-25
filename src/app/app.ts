import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

import { HeaderComponent } from './shared/components/header/header.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { BackToTopComponent } from './shared/components/back-to-top/back-to-top.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { ToastContainerComponent } from './shared/components/toast/toast-container.component';
import { ConfirmDialogComponent } from './shared/components/confirm-dialog/confirm-dialog.component';

type HeaderMode = 'site' | 'admin' | 'auth';
type AuthCta = 'login' | 'register' | null;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    BackToTopComponent,
    SidebarComponent,
    ToastContainerComponent,
    ConfirmDialogComponent,
  ],
  template: `
    <div class="min-h-screen flex flex-col">
      <app-header
        *ngIf="!hideHeader()"
        [mode]="headerMode()"
        [authCta]="authCta()"
        [glass]="glass()"
      ></app-header>

      <main class="flex-1" [class.pt-16]="!hideHeader()">
        <div *ngIf="!hideSidebar(); else noSidebar" class="flex">
          <app-sidebar></app-sidebar>
          <div class="flex-1">
            <router-outlet></router-outlet>
          </div>
        </div>
        <ng-template #noSidebar>
          <router-outlet></router-outlet>
        </ng-template>
      </main>

      <app-back-to-top></app-back-to-top>
      <app-footer *ngIf="!hideFooter()"></app-footer>

      <app-toast-container></app-toast-container>
      <app-confirm-dialog />
    </div>
  `,
})
export class AppComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  hideFooter = signal(false);
  hideHeader = signal(false);
  hideSidebar = signal(false);

  // Inputs du header (par défaut)
  headerMode = signal<HeaderMode>('site');
  authCta = signal<AuthCta>(null);
  glass = signal<boolean>(false);

  constructor() {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      // Trouve la route feuille
      let r = this.route;
      while (r.firstChild) r = r.firstChild;
      const d = r.snapshot.data || {};

      // Flags d’affichage
      this.hideFooter.set(!!d['hideFooter']);
      this.hideHeader.set(!!d['hideHeader']);   // <-- assure-toi qu'il est FALSE sur login/register
      this.hideSidebar.set(!!d['hideSidebar']);

      // Inputs header (facultatifs)
      this.headerMode.set((d['headerMode'] as HeaderMode) ?? 'site');
      this.authCta.set((d['authCta'] as AuthCta) ?? null);
      this.glass.set(!!d['headerGlass']);
    });
  }
}
