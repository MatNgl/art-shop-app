import { Component, OnInit, signal, inject, OnDestroy, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ProductService } from '../../catalog/services/product';
import { Artist, Product } from '../../catalog/models/product.model';
import { FavoritesStore } from '../../favorites/services/favorites-store';
import { AuthService } from '../../auth/services/auth';
import { ToastService } from '../../../shared/services/toast.service';
import { CategoryService } from '../../catalog/services/category';
// import { Category } from '../../catalog/models/category.model';
import { ArtistService } from '../../catalog/services/artist';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';

type CarouselId = 'featured' | 'nouveautes' | 'promotions' | 'photographie' | 'dessin';
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ProductCardComponent, RouterLink],
  styleUrls: ['./home.component.scss'],
  template: `
    <div class="home-container">
      <!-- HERO -->
      <section class="hero-section">
        <div class="hero-carousel">
          @for (image of heroImages; track $index) {
          <div
            class="hero-slide"
            [class.active]="currentHeroSlide() === $index"
            [style.background-image]="'url(' + image.url + ')'"
          ></div>
          }
        </div>
        <div class="hero-content"><h1 class="brand-script">Art Shop</h1></div>
        <div class="scroll-indicator">
          <button type="button" class="scroll-arrow" (click)="scrollToSection('featured')">
            <i class="fas fa-chevron-down" aria-hidden="true"></i>
            <span class="sr-only">Aller à la section mise en avant</span>
          </button>
        </div>
      </section>

      <!-- ========== FEATURED ========= -->
      <section id="featured" class="carousel-section revealable">
        <div class="section-header left">
          <h2>
            <a [routerLink]="['/catalog']">Catalogue <span class="arrow">→</span></a>
          </h2>
        </div>

        <div class="carousel-container">
          <button
            class="carousel-nav prev"
            *ngIf="nav.featured.canLeft()"
            (click)="scrollCarousel('featured', -1)"
          >
            <i class="fas fa-chevron-left"></i>
          </button>

          <div class="carousel-track" #featuredTrack (scroll)="onTrackScroll('featured')">
            @if (loading()) { @for (i of [1,2,3,4,5,6,7,8]; track $index) {
            <div class="product-card skeleton"></div>
            } } @else { @for (product of featuredProducts(); track product.id) {
            <app-product-card
              [product]="product"
              [artistName]="getArtistName(product)"
              [isFavorite]="isFavorite(product.id)"
              (toggleFavorite)="toggleFavorite($event)"
              (view)="viewProduct($event)"
            >
            </app-product-card>
            } }
          </div>

          <button
            class="carousel-nav next"
            *ngIf="nav.featured.canRight()"
            (click)="scrollCarousel('featured', 1)"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </section>

      <!-- ========== NOUVEAUTÉS ========= -->
      <section id="nouveautes" class="carousel-section revealable alt-bg">
        <div class="section-header left">
          <h2>
            <a [routerLink]="['/catalog']" [queryParams]="{ sort: 'new' }"
              >Nouveautés <span class="arrow">→</span></a
            >
          </h2>
        </div>

        <div class="carousel-container">
          <button
            class="carousel-nav prev"
            *ngIf="nav.nouveautes.canLeft()"
            (click)="scrollCarousel('nouveautes', -1)"
          >
            <i class="fas fa-chevron-left"></i>
          </button>

          <div class="carousel-track" #nouveautes (scroll)="onTrackScroll('nouveautes')">
            @if (loadingNewProducts()) { @for (i of [1,2,3,4,5,6,7]; track $index) {
            <div class="product-card skeleton"></div>
            } } @else { @for (product of newProducts(); track product.id) {
            <app-product-card
              [product]="product"
              [artistName]="getArtistName(product)"
              [isFavorite]="isFavorite(product.id)"
              [showNew]="true"
              (toggleFavorite)="toggleFavorite($event)"
              (view)="viewProduct($event)"
            >
            </app-product-card>
            } }
          </div>

          <button
            class="carousel-nav next"
            *ngIf="nav.nouveautes.canRight()"
            (click)="scrollCarousel('nouveautes', 1)"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </section>

      <!-- ========== PROMOS ========= -->
      <section id="promotions" class="carousel-section revealable">
        <div class="section-header left">
          <h2>
            <a [routerLink]="['/catalog']" [queryParams]="{ promo: true }"
              >Promotions <span class="arrow">→</span></a
            >
          </h2>
        </div>

        <div class="carousel-container">
          <button
            class="carousel-nav prev"
            *ngIf="nav.promotions.canLeft()"
            (click)="scrollCarousel('promotions', -1)"
          >
            <i class="fas fa-chevron-left"></i>
          </button>

          <div class="carousel-track" #promotionsTrack (scroll)="onTrackScroll('promotions')">
            @if (loadingPromotions()) { @for (i of [1,2,3,4,5,6]; track $index) {
            <div class="product-card skeleton"></div>
            } } @else { @for (product of promotionProducts(); track product.id) {
            <app-product-card
              [product]="product"
              [artistName]="getArtistName(product)"
              [isFavorite]="isFavorite(product.id)"
              (toggleFavorite)="toggleFavorite($event)"
              (view)="viewProduct($event)"
            >
            </app-product-card>
            } }
          </div>

          <button
            class="carousel-nav next"
            *ngIf="nav.promotions.canRight()"
            (click)="scrollCarousel('promotions', 1)"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </section>

      <!-- ========== PHOTO ========= -->
      <section id="photographie" class="carousel-section revealable alt-bg">
        <div class="section-header left">
          <h2>
            <a [routerLink]="['/catalog']" [queryParams]="{ category: 'photographie' }"
              >Photographie <span class="arrow">→</span></a
            >
          </h2>
        </div>

        <div class="carousel-container">
          <button
            class="carousel-nav prev"
            *ngIf="nav.photographie.canLeft()"
            (click)="scrollCarousel('photographie', -1)"
          >
            <i class="fas fa-chevron-left"></i>
          </button>

          <div class="carousel-track" #photographieTrack (scroll)="onTrackScroll('photographie')">
            @if (loadingPhotography()) { @for (i of [1,2,3,4,5,6]; track $index) {
            <div class="product-card skeleton"></div>
            } } @else { @for (product of photographyProducts(); track product.id) {
            <app-product-card
              [product]="product"
              [artistName]="getArtistName(product)"
              [isFavorite]="isFavorite(product.id)"
              (toggleFavorite)="toggleFavorite($event)"
              (view)="viewProduct($event)"
            >
            </app-product-card>
            } }
          </div>

          <button
            class="carousel-nav next"
            *ngIf="nav.photographie.canRight()"
            (click)="scrollCarousel('photographie', 1)"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </section>

      <!-- ========== DESSIN ========= -->
      <section id="dessin" class="carousel-section revealable">
        <div class="section-header left">
          <h2>
            <a [routerLink]="['/catalog']" [queryParams]="{ category: 'dessin' }"
              >Dessin &amp; Illustration <span class="arrow">→</span></a
            >
          </h2>
          <p>L'art du trait, l'expression pure</p>
        </div>

        <div class="carousel-container">
          <button
            class="carousel-nav prev"
            *ngIf="nav.dessin.canLeft()"
            (click)="scrollCarousel('dessin', -1)"
          >
            <i class="fas fa-chevron-left"></i>
          </button>

          <div class="carousel-track" #dessinTrack (scroll)="onTrackScroll('dessin')">
            @if (loadingDrawing()) { @for (i of [1,2,3,4,5,6]; track $index) {
            <div class="product-card skeleton"></div>
            } } @else { @for (product of drawingProducts(); track product.id) {
            <app-product-card
              [product]="product"
              [artistName]="getArtistName(product)"
              [isFavorite]="isFavorite(product.id)"
              (toggleFavorite)="toggleFavorite($event)"
              (view)="viewProduct($event)"
            >
            </app-product-card>
            } }
          </div>

          <button
            class="carousel-nav next"
            *ngIf="nav.dessin.canRight()"
            (click)="scrollCarousel('dessin', 1)"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </section>
    </div>
  `,
})
export class HomeComponent implements OnInit, OnDestroy {
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly artistService = inject(ArtistService);
  private readonly fav = inject(FavoritesStore);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  private artistCache = new Map<number, Artist>();

  heroImages = [
    { url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&h=600&fit=crop' },
    { url: 'https://images.unsplash.com/photo-1526498460520-4c246339dccb?w=1200&h=600&fit=crop' },
    { url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&h=600&fit=crop' },
  ];
  currentHeroSlide = signal(0);
  private heroInterval?: ReturnType<typeof setInterval>;

  // loading signals
  loading = signal(true);
  loadingNewProducts = signal(true);
  loadingPromotions = signal(true);
  loadingPhotography = signal(true);
  loadingDrawing = signal(true);

  // data
  featuredProducts = signal<Product[]>([]);
  newProducts = signal<Product[]>([]);
  promotionProducts = signal<Product[]>([]);
  photographyProducts = signal<Product[]>([]);
  drawingProducts = signal<Product[]>([]);

  // nav (flèches intelligentes)
  nav: Record<CarouselId, { canLeft: WritableSignal<boolean>; canRight: WritableSignal<boolean> }> =
    {
      featured: { canLeft: signal(false), canRight: signal(false) },
      nouveautes: { canLeft: signal(false), canRight: signal(false) },
      promotions: { canLeft: signal(false), canRight: signal(false) },
      photographie: { canLeft: signal(false), canRight: signal(false) },
      dessin: { canLeft: signal(false), canRight: signal(false) },
    };

  // Ajout d'une propriété pour stocker la référence de la fonction de resize
  private resizeHandler = () => this.updateAllNavStates();

  async ngOnInit(): Promise<void> {
    this.startHeroCarousel();
    this.initRevealOnScroll();
    await this.loadAllData();
    await this.preloadArtists();
    // calcule l'état des flèches une fois les listes présentes
    setTimeout(() => this.updateAllNavStates(), 0);
    window.addEventListener('resize', this.resizeHandler);
  }

  ngOnDestroy(): void {
    if (this.heroInterval) clearInterval(this.heroInterval);
    window.removeEventListener('resize', this.resizeHandler);
    if (this.sectionObserver) this.sectionObserver.disconnect();
  }

  private startHeroCarousel(): void {
    this.heroInterval = setInterval(
      () => this.currentHeroSlide.update((i) => (i + 1) % this.heroImages.length),
      5000
    );
  }

  // === Révélation au scroll ===
  private sectionObserver?: IntersectionObserver;
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

    document
      .querySelectorAll<HTMLElement>('.revealable')
      .forEach((el) => this.sectionObserver!.observe(el));
  }

  // === Data ===
  private async loadAllData(): Promise<void> {
    try {
      await Promise.all([
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

  private async loadFeaturedProducts() {
    try {
      this.featuredProducts.set(await this.productService.getFeaturedProducts(12));
    } finally {
      this.loading.set(false);
    }
  }
  private async loadNewProducts() {
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
  private async loadPromotionProducts() {
    try {
      this.promotionProducts.set(await this.productService.getPromotionProducts(12));
    } finally {
      this.loadingPromotions.set(false);
    }
  }
  private async loadPhotographyProducts() {
    try {
      const cats = await this.categoryService.getAll();
      const cat = cats.find(
        (c) => c.slug === 'photographie' || c.name.toLowerCase().includes('photo')
      );
      if (cat)
        this.photographyProducts.set(await this.productService.getProductsByCategory(cat.id, 12));
    } finally {
      this.loadingPhotography.set(false);
    }
  }
  private async loadDrawingProducts() {
    try {
      const cats = await this.categoryService.getAll();
      const cat = cats.find((c) => c.slug === 'dessin' || c.name.toLowerCase().includes('dessin'));
      if (cat)
        this.drawingProducts.set(await this.productService.getProductsByCategory(cat.id, 12));
    } finally {
      this.loadingDrawing.set(false);
    }
  }
  private async preloadArtists() {
    try {
      (await this.artistService.getAll()).forEach((a) => this.artistCache.set(a.id, a));
    } catch {
      /* ignore */
    }
  }

  // === UI helpers ===
  scrollToSection(id: string) {
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
    (['featured', 'nouveautes', 'promotions', 'photographie', 'dessin'] as CarouselId[]).forEach(
      this.updateNavState
    );
  };

  onTrackScroll(id: CarouselId): void {
    this.updateNavState(id);
  }

  scrollCarousel(id: CarouselId, dir: number) {
    const el = this.trackEl(id);
    if (!el) return;
    const card = el.querySelector<HTMLElement>('.product-card');
    const step = (card ? card.getBoundingClientRect().width + 24 : 340) * 2;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
    // petite mise à jour après l’animation
    setTimeout(() => this.updateNavState(id), 350);
  }

  getArtistName(p: Product): string {
    return this.artistCache.get(p.artistId)?.name ?? 'Artiste inconnu';
  }

  toggleFavorite(productId: number) {
    if (!this.auth.isAuthenticated()) return this.toast.requireAuth('favorites');
    const added = this.fav.toggle(productId);
    this.toast.success(added ? 'Ajouté aux favoris' : 'Retiré des favoris');
  }
  isFavorite(id: number) {
    return this.fav.has(id);
  }
  viewProduct(id: number) {
    this.router.navigate(['/product', id]);
  }
}
