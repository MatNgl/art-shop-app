import { Injectable, signal, computed } from '@angular/core';

export interface SizeOption {
  value: string;
  label: string;
  order: number;
}

@Injectable({
  providedIn: 'root',
})
export class SizeService {
  // Formats disponibles (signal pour permettre des modifications futures via admin)
  private availableSizes = signal<SizeOption[]>([
    { value: 'A3', label: 'A3 (29.7 × 42 cm)', order: 1 },
    { value: 'A4', label: 'A4 (21 × 29.7 cm)', order: 2 },
    { value: 'A5', label: 'A5 (14.8 × 21 cm)', order: 3 },
    { value: 'A6', label: 'A6 (10.5 × 14.8 cm)', order: 4 },
  ]);

  // Expose les tailles via computed pour l'immutabilité
  sizes = computed(() => this.availableSizes());

  // Récupérer toutes les tailles
  getAllSizes(): SizeOption[] {
    return this.availableSizes();
  }

  // Récupérer une taille par sa valeur
  getSizeByValue(value: string): SizeOption | undefined {
    return this.availableSizes().find((s) => s.value === value);
  }

  // Récupérer le label d'une taille
  getSizeLabel(value: string): string {
    const size = this.getSizeByValue(value);
    return size ? size.label : value;
  }

  // Récupérer uniquement les valeurs (pour les formulaires)
  getSizeValues(): string[] {
    return this.availableSizes().map((s) => s.value);
  }

  // Ajouter une nouvelle taille (pour administration future)
  addSize(size: SizeOption): void {
    this.availableSizes.update((sizes) => [...sizes, size].sort((a, b) => a.order - b.order));
  }

  // Supprimer une taille
  removeSize(value: string): void {
    this.availableSizes.update((sizes) => sizes.filter((s) => s.value !== value));
  }

  // Mettre à jour une taille
  updateSize(value: string, updates: Partial<SizeOption>): void {
    this.availableSizes.update((sizes) =>
      sizes.map((s) => (s.value === value ? { ...s, ...updates } : s)).sort((a, b) => a.order - b.order)
    );
  }
}
