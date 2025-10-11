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
import { SidebarStateService } from './shared/services/sidebar-state.service';

type HeaderMode = 'site' | 'admin' | 'auth';
type AuthCta = 'login' | 'register' | null;

/** Type utilitaire pour l’état de navigation utilisé pour auto-ouvrir la sidebar */
type NavState = Readonly<{ openSidebar?: boolean }>;

function hasOpenSidebar(state: unknown): state is NavState {
  if (typeof state !== 'object' || state === null) return false;
  const val = (state as Record<string, unknown>)['openSidebar'];
  return val === undefined || typeof val === 'boolean';
}

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
  private sidebar = inject(SidebarStateService);

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
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((event) => {
        this.currentUrl.set(event.url);

        // Route feuille
        let r = this.route;
        while (r.firstChild) r = r.firstChild;
        const d: Record<string, unknown> = r.snapshot.data || {};

        // Flags
        this.hideFooter.set(Boolean(d['hideFooter']));
        this.hideHeader.set(Boolean(d['hideHeader']));
        this.hideSidebar.set(Boolean(d['hideSidebar']));

        // Header config
        this.updateHeaderConfig(event.url, d);

        // Auto-ouverture de la sidebar si demandé par l'état de navigation
        const st: unknown = history.state;
        if (!this.isAuthPage() && hasOpenSidebar(st) && st.openSidebar === true) {
          // Laisser le temps au DOM de monter la sidebar
          setTimeout(() => this.safeOpenSidebar(), 0);
        }
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

    // Cas de chargement initial avec demande d'ouverture
    const stInit: unknown = history.state;
    if (!this.isAuthPage() && hasOpenSidebar(stInit) && stInit.openSidebar === true) {
      setTimeout(() => this.safeOpenSidebar(), 0);
    }
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

  /** Ouvre la sidebar en s’appuyant uniquement sur l’API publique connue */
  private safeOpenSidebar(): void {
    if (this.isAuthPage()) return; // pas de sidebar montée
    // Hypothèse raisonnable: à l’arrivée depuis /auth, la sidebar est fermée.
    // Un simple toggle suffit donc à l’ouvrir, sans recourir à un cast "any".
    this.sidebar.toggle();
  }
}
