import { Component, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { fromEvent } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';

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
      <!-- Sidebar (affichée sauf sur auth/pages spéciales) -->
      <app-sidebar *ngIf="showSidebar()" />

      <!-- Header -->
      <app-header
        *ngIf="!hideHeader()"
        [mode]="headerMode()"
        [authCta]="authCta()"
        [glass]="glass()"
      ></app-header>

      <!-- Contenu principal -->
      <main
        class="flex-1 transition-all duration-300"
        [class.pt-16]="!hideHeader()"
        [ngClass]="{ 'pl-[70px]': showSidebar() && isDesktop() }"
      >
        <router-outlet></router-outlet>
      </main>

      <!-- Composants flottants -->
      <app-back-to-top></app-back-to-top>
      <app-footer *ngIf="!hideFooter()"></app-footer>

      <!-- Overlays -->
      <app-toast-container></app-toast-container>
      <app-confirm-dialog />
    </div>
  `,
})
export class AppComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  // Flags d'affichage
  hideFooter = signal(false);
  hideHeader = signal(false);
  hideSidebar = signal(false);

  // Inputs du header
  headerMode = signal<HeaderMode>('site');
  authCta = signal<AuthCta>(null);
  glass = signal<boolean>(false);

  // URL actuelle
  private currentUrl = signal<string>('');

  // Breakpoint réactif
  private viewportW = signal<number>(typeof window !== 'undefined' ? window.innerWidth : 1024);
  isAuthPage = computed(() => this.currentUrl().startsWith('/auth'));
  isAdminPage = computed(() => this.currentUrl().startsWith('/admin'));
  isDesktop = computed(() => this.viewportW() >= 768);

  // Affichage sidebar
  showSidebar = computed(() => !this.hideSidebar() && !this.isAuthPage());

  constructor() {
    // Écoute les changements de route
    const navSub = this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentUrl.set(event.url);

        // Route feuille
        let r = this.route;
        while (r.firstChild) r = r.firstChild;
        const d: Record<string, unknown> = r.snapshot.data || {};

        // Flags
        this.hideFooter.set(!!d['hideFooter']);
        this.hideHeader.set(!!d['hideHeader']);
        this.hideSidebar.set(!!d['hideSidebar']);

        // Header config
        this.updateHeaderConfig(event.url, d);
      });

    // Resize réactif
    const resizeSub = fromEvent(window, 'resize')
      .pipe(
        map(() => window.innerWidth),
        startWith(window.innerWidth)
      )
      .subscribe((w) => this.viewportW.set(w));

    this.destroyRef.onDestroy(() => {
      navSub.unsubscribe();
      resizeSub.unsubscribe();
    });

    // Config initiale
    this.currentUrl.set(this.router.url);
    this.updateHeaderConfig(this.router.url, {});
  }

  private updateHeaderConfig(url: string, routeData: Record<string, unknown>): void {
    let mode: HeaderMode = 'site';
    let cta: AuthCta = null;
    let useGlass = false;

    if (url.startsWith('/auth')) {
      mode = 'auth';
      useGlass = true;
      if (url.includes('/login')) cta = 'register';
      else if (url.includes('/register')) cta = 'login';
    } else if (url.startsWith('/admin')) {
      mode = 'admin';
    } else {
      mode = 'site';
    }

    this.headerMode.set((routeData['headerMode'] as HeaderMode | undefined) ?? mode);
    this.authCta.set((routeData['authCta'] as AuthCta | undefined) ?? cta);
    this.glass.set((routeData['headerGlass'] as boolean | undefined) ?? useGlass);
  }
}
