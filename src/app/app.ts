import { Component, inject, signal, computed } from '@angular/core';
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
      <!-- Sidebar flottante (toujours affichée sauf sur auth/pages spéciales) -->
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
        [class.pl-[70px]]="showSidebar() && isDesktop()"
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

  // Signals pour les flags d'affichage
  hideFooter = signal(false);
  hideHeader = signal(false);
  hideSidebar = signal(false);

  // Inputs du header
  headerMode = signal<HeaderMode>('site');
  authCta = signal<AuthCta>(null);
  glass = signal<boolean>(false);

  // URL actuelle pour déterminer les modes
  private currentUrl = signal<string>('');

  // Computed properties
  isAuthPage = computed(() => this.currentUrl().startsWith('/auth'));
  isAdminPage = computed(() => this.currentUrl().startsWith('/admin'));
  isDesktop = computed(() => {
    // On considère desktop si l'écran est > 768px
    // En réalité, on peut utiliser un service pour détecter la taille d'écran
    // Pour simplifier, on assume que c'est desktop par défaut
    return typeof window !== 'undefined' && window.innerWidth >= 768;
  });

  // Contrôle de l'affichage de la sidebar
  showSidebar = computed(() => {
    // Masquer la sidebar si :
    // - Explicitement demandé via les données de route
    // - Page d'authentification
    // - Mobile (< 768px)
    return !this.hideSidebar() && !this.isAuthPage() && this.isDesktop();
  });

  constructor() {
    // Écoute les changements de route
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        // Met à jour l'URL actuelle
        this.currentUrl.set(event.url);

        // Trouve la route feuille pour récupérer les données
        let r = this.route;
        while (r.firstChild) r = r.firstChild;
        const d: Record<string, unknown> = r.snapshot.data || {};

        // Met à jour les flags d'affichage
        this.hideFooter.set(!!d['hideFooter']);
        this.hideHeader.set(!!d['hideHeader']);
        this.hideSidebar.set(!!d['hideSidebar']);

        // Met à jour les paramètres du header
        this.updateHeaderConfig(event.url, d);
      });

    // Configuration initiale
    this.currentUrl.set(this.router.url);
    this.updateHeaderConfig(this.router.url, {});
  }

  private updateHeaderConfig(url: string, routeData: Record<string, unknown>): void {
    // Mode du header basé sur l'URL et les données de route
    let mode: HeaderMode = 'site';
    let cta: AuthCta = null;
    let useGlass = false;

    // Détermination automatique du mode basé sur l'URL
    if (url.startsWith('/auth')) {
      mode = 'auth';
      useGlass = true;

      // CTA contextuel pour les pages auth
      if (url.includes('/login')) {
        cta = 'register'; // Sur login, proposer register
      } else if (url.includes('/register')) {
        cta = 'login'; // Sur register, proposer login
      }
    } else if (url.startsWith('/admin')) {
      mode = 'admin';
    } else {
      mode = 'site';
    }

    // Override avec les données de route si présentes
    this.headerMode.set((routeData['headerMode'] as HeaderMode | undefined) ?? mode);
    this.authCta.set((routeData['authCta'] as AuthCta | undefined) ?? cta);
    this.glass.set((routeData['headerGlass'] as boolean | undefined) ?? useGlass);
  }
}
