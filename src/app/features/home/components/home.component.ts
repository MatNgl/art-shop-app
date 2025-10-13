import {
  Component,
  OnInit,
  signal,
  inject,
  OnDestroy,
  WritableSignal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { ProductService } from '../../catalog/services/product';
import { Product } from '../../catalog/models/product.model';
import { FavoritesStore } from '../../favorites/services/favorites-store';
import { AuthService } from '../../auth/services/auth';
import { ToastService } from '../../../shared/services/toast.service';
import { CategoryService } from '../../catalog/services/category';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';

type CarouselId = 'recent' | 'featured' | 'nouveautes' | 'promotions' | 'photographie' | 'dessin';

interface StoredRecent {
  id: number;
  title: string;
  image?: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ProductCardComponent, RouterLink],
  styleUrls: ['./home.component.scss'],
  template: `
    <div class="container-wide--full">
      <!-- HERO -->
      <section class="hero-section revealed">
        <!-- Plus de carrousel : le fond est géré en CSS -->
        <div class="hero-content">
          <h1 class="brand-script">Art Shop</h1>
        </div>

        <div class="scroll-indicator">
          <button
            type="button"
            class="scroll-arrow"
            (click)="scrollToSection('recent')"
            (keyup.enter)="scrollToSection('recent')"
            (keyup.space)="scrollToSection('recent')"
            tabindex="0"
            aria-label="Aller à la section vu récemment"
          >
            <i class="fas fa-chevron-down" aria-hidden="true"></i>
          </button>
        </div>
      </section>

      <!-- VU RÉCEMMENT (en premier) -->
      @if (loadingRecent() || hasRecent()) {
      <section id="recent" class="carousel-section revealable alt-bg" [class.revealed]="true">
        <div class="section-header left">
          <h2>Vu récemment</h2>
        </div>

        <div class="carousel-container">
          <button
            class="carousel-nav prev"
            *ngIf="nav.recent.canLeft()"
            (click)="scrollCarousel('recent', -1)"
            (keyup.enter)="scrollCarousel('recent', -1)"
            (keyup.space)="scrollCarousel('recent', -1)"
            tabindex="0"
            aria-label="Faire défiler vers la gauche"
          >
            <i class="fas fa-chevron-left"></i>
          </button>

          <div class="carousel-track" #recentTrack (scroll)="onTrackScroll('recent')">
            @if (loadingRecent()) {
              @for (i of [1,2,3,4,5]; track $index) {
                <div class="product-card skeleton"></div>
              }
            } @else {
              @for (product of recentProducts(); track product.id) {
                <app-product-card
                  [product]="product"
                  [isFavorite]="isFavorite(product.id)"
                  [showNewBadge]="false"
                  (toggleFavorite)="toggleFavorite($event)"
                  (view)="viewProduct($event)"
                />
              }
            }
          </div>

          <button
            class="carousel-nav next"
            *ngIf="nav.recent.canRight()"
            (click)="scrollCarousel('recent', 1)"
            (keyup.enter)="scrollCarousel('recent', 1)"
            (keyup.space)="scrollCarousel('recent', 1)"
            tabindex="0"
            aria-label="Faire défiler vers la droite"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </section>
      }

      <!-- FEATURED -->
      @if (loading() || hasFeatured()) {
      <section id="featured" class="carousel-section revealable" [class.revealed]="true">
        <div class="section-header left">
          <h2>
            <a class="section-link" [routerLink]="['/catalog']"
              >Tous nos produits <span class="arrow">→</span></a
            >
          </h2>
        </div>

        <div class="carousel-container">
          <button
            class="carousel-nav prev"
            *ngIf="nav.featured.canLeft()"
            (click)="scrollCarousel('featured', -1)"
            (keyup.enter)="scrollCarousel('featured', -1)"
            (keyup.space)="scrollCarousel('featured', -1)"
            tabindex="0"
            aria-label="Faire défiler vers la gauche"
          >
            <i class="fas fa-chevron-left"></i>
          </button>

          <div class="carousel-track" #featuredTrack (scroll)="onTrackScroll('featured')">
            @if (loading()) { @for (i of [1,2,3,4,5,6,7,8]; track $index) {
            <div class="product-card skeleton"></div>
            } } @else { @for (product of featuredProducts(); track product.id) {
            <app-product-card
              [product]="product"
              [isFavorite]="isFavorite(product.id)"
              (toggleFavorite)="toggleFavorite($event)"
              (view)="viewProduct($event)"
            />
            } }
          </div>

          <button
            class="carousel-nav next"
            *ngIf="nav.featured.canRight()"
            (click)="scrollCarousel('featured', 1)"
            (keyup.enter)="scrollCarousel('featured', 1)"
            (keyup.space)="scrollCarousel('featured', 1)"
            tabindex="0"
            aria-label="Faire défiler vers la droite"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </section>
      }

      <!-- NOUVEAUTÉS -->
      @if (loadingNewProducts() || hasNew()) {
      <section id="nouveautes" class="carousel-section revealable alt-bg" [class.revealed]="true">
        <div class="section-header left">
          <h2>
            <a class="section-link" [routerLink]="['/catalog']" [queryParams]="{ sort: 'new' }"
              >Nouveautés <span class="arrow">→</span></a
            >
          </h2>
        </div>

        <div class="carousel-container">
          <button
            class="carousel-nav prev"
            *ngIf="nav.nouveautes.canLeft()"
            (click)="scrollCarousel('nouveautes', -1)"
            (keyup.enter)="scrollCarousel('nouveautes', -1)"
            (keyup.space)="scrollCarousel('nouveautes', -1)"
            tabindex="0"
            aria-label="Faire défiler vers la gauche"
          >
            <i class="fas fa-chevron-left"></i>
          </button>

          <div class="carousel-track" #nouveautes (scroll)="onTrackScroll('nouveautes')">
            @if (loadingNewProducts()) { @for (i of [1,2,3,4,5,6,7]; track $index) {
            <div class="product-card skeleton"></div>
            } } @else { @for (product of newProducts(); track product.id) {
            <app-product-card
              [product]="product"
              [isFavorite]="isFavorite(product.id)"
              (toggleFavorite)="toggleFavorite($event)"
              (view)="viewProduct($event)"
            />
            } }
          </div>

          <button
            class="carousel-nav next"
            *ngIf="nav.nouveautes.canRight()"
            (click)="scrollCarousel('nouveautes', 1)"
            (keyup.enter)="scrollCarousel('nouveautes', 1)"
            (keyup.space)="scrollCarousel('nouveautes', 1)"
            tabindex="0"
            aria-label="Faire défiler vers la droite"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </section>
      }

      <!-- PROMOS -->
      @if (loadingPromotions() || hasPromos()) {
      <section id="promotions" class="carousel-section revealable" [class.revealed]="true">
        <div class="section-header left">
          <h2>
            <a class="section-link" [routerLink]="['/catalog']" [queryParams]="{ promo: true }"
              >Promotions <span class="arrow">→</span></a
            >
          </h2>
        </div>

        <div class="carousel-container">
          <button
            class="carousel-nav prev"
            *ngIf="nav.promotions.canLeft()"
            (click)="scrollCarousel('promotions', -1)"
            (keyup.enter)="scrollCarousel('promotions', -1)"
            (keyup.space)="scrollCarousel('promotions', -1)"
            tabindex="0"
            aria-label="Faire défiler vers la gauche"
          >
            <i class="fas fa-chevron-left"></i>
          </button>

          <div class="carousel-track" #promotionsTrack (scroll)="onTrackScroll('promotions')">
            @if (loadingPromotions()) { @for (i of [1,2,3,4,5,6]; track $index) {
            <div class="product-card skeleton"></div>
            } } @else { @for (product of promotionProducts(); track product.id) {
            <app-product-card
              [product]="product"
              [isFavorite]="isFavorite(product.id)"
              (toggleFavorite)="toggleFavorite($event)"
              (view)="viewProduct($event)"
            />
            } }
          </div>

          <button
            class="carousel-nav next"
            *ngIf="nav.promotions.canRight()"
            (click)="scrollCarousel('promotions', 1)"
            (keyup.enter)="scrollCarousel('promotions', 1)"
            (keyup.space)="scrollCarousel('promotions', 1)"
            tabindex="0"
            aria-label="Faire défiler vers la droite"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </section>
      }

      <!-- PHOTOGRAPHIE -->
      @if (loadingPhotography() || hasPhoto()) {
      <section id="photographie" class="carousel-section revealable alt-bg" [class.revealed]="true">
        <div class="section-header left">
          <h2>
            <a
              class="section-link"
              [routerLink]="['/catalog']"
              [queryParams]="{ categorySlug: 'photographie' }"
              >Photographie <span class="arrow">→</span></a
            >
          </h2>
        </div>

        <div class="carousel-container">
          <button
            class="carousel-nav prev"
            *ngIf="nav.photographie.canLeft()"
            (click)="scrollCarousel('photographie', -1)"
            (keyup.enter)="scrollCarousel('photographie', -1)"
            (keyup.space)="scrollCarousel('photographie', -1)"
            tabindex="0"
            aria-label="Faire défiler vers la gauche"
          >
            <i class="fas fa-chevron-left"></i>
          </button>

          <div class="carousel-track" #photographieTrack (scroll)="onTrackScroll('photographie')">
            @if (loadingPhotography()) { @for (i of [1,2,3,4,5,6]; track $index) {
            <div class="product-card skeleton"></div>
            } } @else { @for (product of photographyProducts(); track product.id) {
            <app-product-card
              [product]="product"
              [isFavorite]="isFavorite(product.id)"
              (toggleFavorite)="toggleFavorite($event)"
              (view)="viewProduct($event)"
            />
            } }
          </div>

          <button
            class="carousel-nav next"
            *ngIf="nav.photographie.canRight()"
            (click)="scrollCarousel('photographie', 1)"
            (keyup.enter)="scrollCarousel('photographie', 1)"
            (keyup.space)="scrollCarousel('photographie', 1)"
            tabindex="0"
            aria-label="Faire défiler vers la droite"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </section>
      }

      <!-- DESSIN -->
      @if (loadingDrawing() || hasDessin()) {
      <section id="dessin" class="carousel-section revealable" [class.revealed]="true">
        <div class="section-header left">
          <h2>
            <a
              class="section-link"
              [routerLink]="['/catalog']"
              [queryParams]="{ categorySlug: 'dessin' }"
              >Dessins <span class="arrow">→</span></a
            >
          </h2>
          <p>L'art du trait, l'expression pure</p>
        </div>

        <div class="carousel-container">
          <button
            class="carousel-nav prev"
            *ngIf="nav.dessin.canLeft()"
            (click)="scrollCarousel('dessin', -1)"
            (keyup.enter)="scrollCarousel('dessin', -1)"
            (keyup.space)="scrollCarousel('dessin', -1)"
            tabindex="0"
            aria-label="Faire défiler vers la gauche"
          >
            <i class="fas fa-chevron-left"></i>
          </button>

        <div class="carousel-track" #dessinTrack (scroll)="onTrackScroll('dessin')">
            @if (loadingDrawing()) { @for (i of [1,2,3,4,5,6]; track $index) {
            <div class="product-card skeleton"></div>
            } } @else { @for (product of drawingProducts(); track product.id) {
            <app-product-card
              [product]="product"
              [isFavorite]="isFavorite(product.id)"
              (toggleFavorite)="toggleFavorite($event)"
              (view)="viewProduct($event)"
            />
            } }
          </div>

          <button
            class="carousel-nav next"
            *ngIf="nav.dessin.canRight()"
            (click)="scrollCarousel('dessin', 1)"
            (keyup.enter)="scrollCarousel('dessin', 1)"
            (keyup.space)="scrollCarousel('dessin', 1)"
            tabindex="0"
            aria-label="Faire défiler vers la droite"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </section>
      }
    </div>
  `,
})
export class HomeComponent implements OnInit, OnDestroy {
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly fav = inject(FavoritesStore);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  // loading signals
  loading = signal(true);
  loadingRecent = signal(true);
  loadingNewProducts = signal(true);
  loadingPromotions = signal(true);
  loadingPhotography = signal(true);
  loadingDrawing = signal(true);

  // data
  recentProducts = signal<Product[]>([]);
  featuredProducts = signal<Product[]>([]);
  newProducts = signal<Product[]>([]);
  promotionProducts = signal<Product[]>([]);
  photographyProducts = signal<Product[]>([]);
  drawingProducts = signal<Product[]>([]);

  // computed presence flags
  hasRecent = computed(() => !this.loadingRecent() && this.recentProducts().length > 0);
  hasFeatured = computed(() => !this.loading() && this.featuredProducts().length > 0);
  hasNew = computed(() => !this.loadingNewProducts() && this.newProducts().length > 0);
  hasPromos = computed(() => !this.loadingPromotions() && this.promotionProducts().length > 0);
  hasPhoto = computed(() => !this.loadingPhotography() && this.photographyProducts().length > 0);
  hasDessin = computed(() => !this.loadingDrawing() && this.drawingProducts().length > 0);

  // nav signals
  nav: Record<CarouselId, { canLeft: WritableSignal<boolean>; canRight: WritableSignal<boolean> }> =
    {
      recent: { canLeft: signal(false), canRight: signal(false) },
      featured: { canLeft: signal(false), canRight: signal(false) },
      nouveautes: { canLeft: signal(false), canRight: signal(false) },
      promotions: { canLeft: signal(false), canRight: signal(false) },
      photographie: { canLeft: signal(false), canRight: signal(false) },
      dessin: { canLeft: signal(false), canRight: signal(false) },
    };

  private resizeHandler = () => this.updateAllNavStates();
  private sectionObserver?: IntersectionObserver;

  async ngOnInit(): Promise<void> {
    this.initRevealOnScroll();
    await this.loadAllData();

    setTimeout(() => this.updateAllNavStates(), 0);
    window.addEventListener('resize', this.resizeHandler);
  }

  ngOnDestroy(): void {
    if (this.sectionObserver) this.sectionObserver.disconnect();
  }

  private initRevealOnScroll(): void {
    this.sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add('revealed');
            this.sectionObserver?.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    // Observe ce qui existe déjà
    document
      .querySelectorAll<HTMLElement>('.revealable')
      .forEach((el) => this.sectionObserver!.observe(el));

    // Observe les sections ajoutées après coup (via @if)
    const mo = new MutationObserver(() => {
      document.querySelectorAll<HTMLElement>('.revealable:not(.__observed)').forEach((el) => {
        el.classList.add('__observed');
        this.sectionObserver!.observe(el);
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  private async loadAllData(): Promise<void> {
    try {
      await Promise.all([
        this.loadRecentProducts(),
        this.loadFeaturedProducts(),
        this.loadNewProducts(),
        this.loadPromotionProducts(),
        this.loadPhotographyProducts(),
        this.loadDrawingProducts(),
      ]);
    } catch {
      this.toast.error('Erreur lors du chargement des données');
    }
  }

  /** Lit localStorage['recent_products'] (écrit par le header / recherche) et charge les produits. */
  private async loadRecentProducts(): Promise<void> {
    try {
      const raw = localStorage.getItem('recent_products');
      if (!raw) {
        this.recentProducts.set([]);
        return;
      }
      let arr: StoredRecent[] = [];
      try {
        arr = JSON.parse(raw) as StoredRecent[];
      } catch {
        arr = [];
      }
      const ids = arr.map((x) => Number(x.id)).filter((id) => Number.isFinite(id));
      if (ids.length === 0) {
        this.recentProducts.set([]);
        return;
      }

      // On récupère tous les produits publics et on sélectionne ceux des IDs (ordre conservé)
      const all = await this.productService.getAllProducts();
      const byId = new Map<number, Product>(all.map((p) => [p.id, p]));
      const ordered: Product[] = ids
        .map((id) => byId.get(id))
        .filter((p): p is Product => !!p)
        .slice(0, 12);

      this.recentProducts.set(ordered);
    } finally {
      this.loadingRecent.set(false);
    }
  }

  private async loadFeaturedProducts(): Promise<void> {
    try {
      this.featuredProducts.set(await this.productService.getFeaturedProducts(12));
    } finally {
      this.loading.set(false);
    }
  }

  private async loadNewProducts(): Promise<void> {
    try {
      const since = new Date();
      since.setMonth(since.getMonth() - 1);
      this.newProducts.set(
        await this.productService.getProductsByDateRange(
          since.toISOString(),
          new Date().toISOString(),
          12
        )
      );
    } catch {
      this.newProducts.set(await this.productService.getRecentProducts(12));
    } finally {
      this.loadingNewProducts.set(false);
    }
  }

  private async loadPromotionProducts(): Promise<void> {
    try {
      this.promotionProducts.set(await this.productService.getPromotionProducts(12));
    } finally {
      this.loadingPromotions.set(false);
    }
  }

  private async loadPhotographyProducts(): Promise<void> {
    try {
      const cats = await this.categoryService.getAll();
      const cat = cats.find(
        (c) => c.isActive && (c.slug === 'photographie' || c.name.toLowerCase().includes('photo'))
      );
      this.photographyProducts.set(
        cat ? await this.productService.getProductsByCategory(cat.id, 12) : []
      );
    } finally {
      this.loadingPhotography.set(false);
    }
  }

  private async loadDrawingProducts(): Promise<void> {
    try {
      const cats = await this.categoryService.getAll();
      const cat = cats.find(
        (c) => c.isActive && (c.slug === 'dessin' || c.name.toLowerCase().includes('dessin'))
      );
      this.drawingProducts.set(
        cat ? await this.productService.getProductsByCategory(cat.id, 12) : []
      );
    } finally {
      this.loadingDrawing.set(false);
    }
  }

  /** Ajoute à la liste récente côté localStorage quand on clique depuis la Home. */
  private addToRecentLocal(productId: number): void {
    try {
      const all = [
        ...this.featuredProducts(),
        ...this.newProducts(),
        ...this.promotionProducts(),
        ...this.photographyProducts(),
        ...this.drawingProducts(),
        ...this.recentProducts(),
      ];
      const p = all.find((x) => x.id === productId);
      if (!p) return;

      const entry: StoredRecent = { id: p.id, title: p.title, image: (p as Product).imageUrl };
      const raw = localStorage.getItem('recent_products');
      let arr: StoredRecent[] = [];
      if (raw) {
        try {
          arr = JSON.parse(raw) as StoredRecent[];
        } catch {
          arr = [];
        }
      }
      // LRU sans doublon, max 20
      const next = [entry, ...arr.filter((x) => x.id !== entry.id)].slice(0, 20);
      localStorage.setItem('recent_products', JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  scrollToSection(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private trackEl(id: CarouselId): HTMLElement | null {
    return document.querySelector<HTMLElement>(`#${id} .carousel-track`);
  }

  private updateNavState: (id: CarouselId) => void = (id: CarouselId) => {
    const el = this.trackEl(id);
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth - 2;
    this.nav[id].canLeft.set(el.scrollLeft > 2);
    this.nav[id].canRight.set(el.scrollLeft < max);
  };

  updateAllNavStates: () => void = () => {
    (['recent', 'featured', 'nouveautes', 'promotions', 'photographie', 'dessin'] as CarouselId[]).forEach(
      this.updateNavState
    );
  };

  onTrackScroll(id: CarouselId): void {
    this.updateNavState(id);
  }

  scrollCarousel(id: CarouselId, dir: number): void {
    const el = this.trackEl(id);
    if (!el) return;
    const card = el.querySelector<HTMLElement>('.product-card');
    const step = (card ? card.getBoundingClientRect().width + 24 : 340) * 2;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
    setTimeout(() => this.updateNavState(id), 350);
  }

  toggleFavorite(productId: number): void {
    if (!this.auth.isAuthenticated()) {
      this.toast.requireAuth('favorites');
      return;
    }
    const added = this.fav.toggle(productId);
    this.toast.success(added ? 'Ajouté aux favoris' : 'Retiré des favoris');
  }

  isFavorite(id: number): boolean {
    return this.fav.has(id);
  }

  viewProduct(id: number): void {
    // On alimente la liste locale pour "Vu récemment" lorsqu'on vient de la Home
    this.addToRecentLocal(id);
    this.router.navigate(['/product', id]);
  }
}
