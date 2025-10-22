import { Component, Input, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Category, SubCategory } from '../../../features/catalog/models/category.model';
import { ProductService } from '../../../features/catalog/services/product';

@Component({
  selector: 'app-category-tree',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./category-tree.component.scss'],
  template: `
    <div class="category-tree">
      <!-- Bouton principal "Catégories" -->
      <button
        type="button"
        class="category-toggle nav-item"
        (click)="toggleCategories()"
        (keyup.enter)="toggleCategories()"
        (keyup.space)="toggleCategories()"
        [attr.aria-expanded]="isExpanded()"
        aria-controls="categories-list"
        data-tooltip="Catégories"
      >
        <div class="nav-icon">
          <i class="fa-solid fa-tags" style="color:#8B5CF6" aria-hidden="true"></i>
        </div>
        <span class="nav-label">Catégories</span>
        <i
          class="chevron-icon fa-solid fa-chevron-down"
          [class.rotate-180]="isExpanded()"
          aria-hidden="true"
        ></i>
      </button>

      <!-- Liste des catégories -->
      <div
        id="categories-list"
        class="categories-list"
        [class.expanded]="isExpanded()"
        role="region"
        [attr.aria-hidden]="!isExpanded()"
      >
        <div *ngFor="let category of categories" class="category-item">
          <!-- Catégorie parente -->
          <div class="category-parent">
            <button
              type="button"
              class="category-link"
              (click)="navigateToCategory(category)"
              (keyup.enter)="navigateToCategory(category)"
              [class.active]="isCategoryActive(category)"
              [attr.aria-label]="'Voir tous les produits de ' + category.name"
            >
              <span class="category-label">{{ category.name }}</span>
            </button>

            <!-- Toggle sous-catégories -->
            <button
              *ngIf="hasSubCategories(category)"
              type="button"
              class="subcategory-toggle"
              (click)="toggleCategory(category.id)"
              (keyup.enter)="toggleCategory(category.id)"
              (keyup.space)="toggleCategory(category.id)"
              [attr.aria-expanded]="isCategoryExpanded(category.id)"
              [attr.aria-label]="'Afficher les sous-catégories de ' + category.name"
            >
              <i
                class="fa-solid fa-chevron-down text-xs"
                [class.rotate-180]="isCategoryExpanded(category.id)"
                aria-hidden="true"
              ></i>
            </button>
          </div>

          <!-- Sous-catégories -->
          <div
            *ngIf="hasSubCategories(category) && isCategoryExpanded(category.id)"
            class="subcategories"
            role="region"
          >
            <button
              *ngFor="let sub of getActiveSubCategories(category)"
              type="button"
              class="subcategory-link"
              (click)="navigateToSubCategory(category, sub)"
              (keyup.enter)="navigateToSubCategory(category, sub)"
              [class.active]="isSubCategoryActive(sub)"
              [attr.aria-label]="'Voir les produits de ' + sub.name"
            >
              <span class="subcategory-label">{{ sub.name }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class CategoryTreeComponent implements OnInit {
  @Input() categories: Category[] = [];
  @Input() closeMobileOnNav?: () => void;
  @Input() sidebarHovered = signal(false);

  private router = inject(Router);
  private productService = inject(ProductService);

  // État d'expansion du menu principal (FERMÉ par défaut)
  isExpanded = signal(false);

  // Mémorisation de l'état avant fermeture
  private wasExpandedBeforeCollapse = false;

  // État d'expansion par catégorie (Map<categoryId, boolean>)
  private expandedCategoriesMap = signal<Map<number, boolean>>(new Map());

  // Compteurs de produits
  subCategoryCounts = signal<Record<number, number>>({});

  async ngOnInit(): Promise<void> {
    await this.loadProductCounts();
  }

  private async loadProductCounts(): Promise<void> {
    try {
      const subCounts = await this.productService.getSubCategoryCounts();
      this.subCategoryCounts.set(subCounts);
    } catch (err) {
      console.error('Error loading counts:', err);
    }
  }

  toggleCategories(): void {
    this.isExpanded.update((v) => !v);
    this.wasExpandedBeforeCollapse = this.isExpanded();
  }

  // Appelé quand la sidebar entre/sort du hover
  onSidebarHoverChange(hovered: boolean): void {
    if (hovered) {
      // Restaurer l'état mémorisé
      if (this.wasExpandedBeforeCollapse) {
        this.isExpanded.set(true);
      }
    } else {
      // Mémoriser l'état actuel avant de fermer
      this.wasExpandedBeforeCollapse = this.isExpanded();
      // Fermer le menu quand on quitte la sidebar
      this.isExpanded.set(false);
    }
  }

  toggleCategory(categoryId: number): void {
    this.expandedCategoriesMap.update((map) => {
      const newMap = new Map(map);
      newMap.set(categoryId, !newMap.get(categoryId));
      return newMap;
    });
  }

  isCategoryExpanded(categoryId: number): boolean {
    return this.expandedCategoriesMap().get(categoryId) ?? false;
  }

  hasSubCategories(category: Category): boolean {
    return (category.subCategories?.length ?? 0) > 0;
  }

  getActiveSubCategories(category: Category): SubCategory[] {
    return (category.subCategories ?? []).filter(sub => sub.isActive);
  }

  // Le total de la catégorie = somme des sous-catégories
  getCategoryCount(category: Category): number {
    if (!category.subCategories || category.subCategories.length === 0) {
      return 0;
    }
    const subCounts = this.subCategoryCounts();
    return category.subCategories.reduce((sum, sub) => sum + (subCounts[sub.id] ?? 0), 0);
  }

  getSubCategoryCount(sub: SubCategory): number {
    return this.subCategoryCounts()[sub.id] ?? 0;
  }

  navigateToCategory(category: Category): void {
    void this.router.navigate(['/catalog'], {
      queryParams: { categorySlug: category.slug, page: 1 },
    });
    this.closeMobileOnNav?.();
  }

  navigateToSubCategory(category: Category, sub: SubCategory): void {
    void this.router.navigate(['/catalog'], {
      queryParams: { categorySlug: category.slug, subCategorySlug: sub.slug, page: 1 },
    });
    this.closeMobileOnNav?.();
  }

  isCategoryActive(category: Category): boolean {
    const url = this.router.url;
    return url.includes(`categorySlug=${category.slug}`) && !url.includes('subCategorySlug=');
  }

  isSubCategoryActive(sub: SubCategory): boolean {
    const url = this.router.url;
    return url.includes(`subCategorySlug=${sub.slug}`);
  }
}
