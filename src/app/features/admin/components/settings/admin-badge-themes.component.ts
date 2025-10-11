import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BadgeThemeService } from '../../../../shared/services/badge-theme.service';
import { BadgeTheme } from '../../../../shared/models/badge-theme.model';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmService } from '../../../../shared/services/confirm.service';
import { AuthService } from '../../../auth/services/auth';

interface GradientStop {
  color: string;
  position: number;
}

@Component({
  selector: 'app-admin-badge-themes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Stats avec bordures colorées -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Thèmes disponibles</p>
            <p class="text-3xl font-bold text-gray-900 mt-2">{{ allThemes().length }}</p>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <i class="fa-solid fa-palette text-blue-600 text-xl"></i>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Badges créés</p>
            <p class="text-3xl font-bold text-gray-900 mt-2">{{ createdThemesCount() }}</p>
          </div>
          <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <i class="fa-solid fa-wand-magic-sparkles text-purple-600 text-xl"></i>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Badge actif</p>
            <p class="text-xl font-bold text-gray-900 mt-2 truncate">{{ currentTheme().name }}</p>
          </div>
          <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <i class="fa-solid fa-circle-check text-green-600 text-xl"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Titre de la section -->
    <div class="mb-6">
      <h2 class="text-xl font-bold text-gray-900">Tous les badges</h2>
      <p class="text-sm text-gray-600 mt-1">
        Gérez vos badges utilisateurs. Modifiez, supprimez ou créez-en de nouveaux.
      </p>
    </div>

    <!-- Liste unique de tous les badges -->
    <div class="bg-white rounded-xl shadow-sm border p-6">
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        @for (theme of allThemes(); track theme.id) {
          <div
            class="theme-card group relative bg-gray-50 rounded-lg p-4 hover:shadow-md transition-all border-2"
            [class.border-blue-500]="currentTheme().id === theme.id"
            [class.border-gray-200]="currentTheme().id !== theme.id"
          >
            <button type="button" class="w-full" (click)="selectTheme(theme)">
              <div class="flex flex-col items-center gap-3">
                <div
                  class="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold shadow-md text-sm"
                  [style.background]="theme.gradient"
                >
                  {{ getInitials() }}
                </div>
                <div class="text-center w-full">
                  <p class="text-sm font-medium text-gray-900 truncate">{{ theme.name }}</p>
                  <p class="text-xs text-gray-500 mt-1 font-mono truncate">{{ theme.primary }}</p>
                </div>
              </div>
            </button>

            @if (currentTheme().id === theme.id) {
              <div
                class="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow z-10"
              >
                <i class="fa-solid fa-check text-white text-xs"></i>
              </div>
            }

            <!-- Actions -->
            <div
              class="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <button
                type="button"
                class="w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center text-xs shadow"
                (click)="editTheme(theme)"
                title="Modifier"
              >
                <i class="fa-solid fa-pen"></i>
              </button>
              <button
                type="button"
                class="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs shadow"
                (click)="deleteTheme(theme)"
                title="Supprimer"
              >
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
        }
      </div>
    </div>

    <!-- Modal création/édition avec générateur -->
    @if (showModal()) {
      <div
        class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        (click)="closeModal()"
      >
        <div
          class="bg-white rounded-xl shadow-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto"
          (click)="$event.stopPropagation()"
        >
          <h3 class="text-xl font-bold text-gray-900 mb-4">
            {{ isEditMode() ? 'Modifier le badge' : 'Créer un badge' }}
          </h3>

          <form (submit)="saveBadge($event)">
            <div class="space-y-6">
              <!-- Nom -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nom du badge</label>
                <input
                  type="text"
                  [(ngModel)]="formData.name"
                  name="name"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Ex: Coucher de soleil"
                />
              </div>

              <!-- Générateur de dégradé -->
              <div class="bg-gray-50 rounded-lg p-4 border">
                <h4 class="text-sm font-semibold text-gray-900 mb-3">
                  <i class="fa-solid fa-wand-magic-sparkles text-purple-500 mr-2"></i>
                  Générateur de dégradé radial
                </h4>

                <!-- Présets et génération aléatoire -->
                <div class="mb-4">
                  <div class="flex items-center justify-between mb-2">
                    <p class="text-xs font-medium text-gray-600">Présets rapides :</p>
                    <button
                      type="button"
                      class="px-3 py-1 text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-sm font-medium"
                      (click)="generateRandomGradient()"
                      title="Générer un dégradé aléatoire"
                    >
                      🎲 Aléatoire
                    </button>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <button
                      type="button"
                      class="px-3 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition"
                      (click)="applyPreset('sunset')"
                    >
                      🌅 Sunset
                    </button>
                    <button
                      type="button"
                      class="px-3 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition"
                      (click)="applyPreset('ocean')"
                    >
                      🌊 Ocean
                    </button>
                    <button
                      type="button"
                      class="px-3 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition"
                      (click)="applyPreset('forest')"
                    >
                      🌲 Forest
                    </button>
                    <button
                      type="button"
                      class="px-3 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition"
                      (click)="applyPreset('candy')"
                    >
                      🍬 Candy
                    </button>
                    <button
                      type="button"
                      class="px-3 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition"
                      (click)="applyPreset('fire')"
                    >
                      🔥 Fire
                    </button>
                    <button
                      type="button"
                      class="px-3 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition"
                      (click)="applyPreset('lavender')"
                    >
                      💜 Lavender
                    </button>
                  </div>
                </div>

                <!-- Aperçu GRAND avec style actuel des badges -->
                <div class="text-center mb-4">
                  <p class="text-sm font-medium text-gray-700 mb-3">Aperçu du badge :</p>
                  <div class="inline-block">
                    <div
                      class="w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-xl border-4 border-white"
                      [style.background]="generatedGradient()"
                    >
                      {{ getInitials() }}
                    </div>
                  </div>
                </div>

                <!-- Couleurs ajustables -->
                <div class="grid grid-cols-2 gap-4 mb-4">
                  @for (stop of gradientStops; track $index; let i = $index) {
                    <div>
                      <label class="block text-xs font-medium text-gray-600 mb-1"
                        >Couleur {{ i + 1 }} ({{ stop.position }}%)</label
                      >
                      <div class="flex gap-2">
                        <input
                          type="color"
                          [(ngModel)]="stop.color"
                          [name]="'color' + i"
                          (change)="updateGradient()"
                          class="w-12 h-9 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          [(ngModel)]="stop.color"
                          [name]="'colorText' + i"
                          (change)="updateGradient()"
                          class="flex-1 px-2 py-1 border border-gray-300 rounded text-xs font-mono"
                        />
                      </div>
                    </div>
                  }
                </div>

                <!-- Code CSS généré -->
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1"
                    >CSS généré (copier dans badge-theme.scss) :</label
                  >
                  <div class="relative">
                    <textarea
                      [value]="getCSSCode()"
                      readonly
                      class="w-full px-2 py-2 text-xs font-mono bg-gray-900 text-green-400 rounded border border-gray-700"
                      rows="2"
                    ></textarea>
                    <button
                      type="button"
                      class="absolute top-2 right-2 px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded"
                      (click)="copyCSS()"
                    >
                      <i class="fa-solid fa-copy mr-1"></i> Copier
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex gap-3 mt-6">
              <button
                type="button"
                (click)="closeModal()"
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                class="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
              >
                <i class="fa-solid fa-check mr-2"></i>
                {{ isEditMode() ? 'Mettre à jour' : 'Créer le badge' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .theme-card {
        transition: all 0.2s ease;
      }
      .theme-card:hover {
        transform: translateY(-2px);
      }
    `,
  ],
})
export class AdminBadgeThemesComponent implements OnInit, OnDestroy {
  readonly themeService = inject(BadgeThemeService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly auth = inject(AuthService);

  readonly allThemes = computed(() => this.themeService.listThemes());
  readonly currentTheme = computed(() => this.themeService.getCurrentTheme());
  readonly createdThemesCount = computed(() => {
    return this.allThemes().filter((t) => !t.id.startsWith('avatar-grad-')).length;
  });

  showModal = signal(false);
  isEditMode = signal(false);
  editingThemeId = signal<string | null>(null);

  private createBadgeListener = () => this.openCreateModal();

  ngOnInit(): void {
    window.addEventListener('createBadge', this.createBadgeListener);
  }

  ngOnDestroy(): void {
    window.removeEventListener('createBadge', this.createBadgeListener);
  }

  formData = {
    name: '',
    className: '',
    primary: '',
  };

  gradientStops: GradientStop[] = [
    { color: '#ffd1dc', position: 0 },
    { color: '#f9e2af', position: 35 },
    { color: '#d1f8ff', position: 70 },
    { color: '#e6e0ff', position: 100 },
  ];

  gradientPosition = signal('10% 0%');
  generatedGradient = signal('');

  constructor() {
    this.updateGradient();
  }

  getInitials(): string {
    const user = this.auth.getCurrentUser();
    if (!user) return 'AS';
    const a = (user.firstName?.[0] || '').toUpperCase();
    const b = (user.lastName?.[0] || '').toUpperCase();
    return `${a}${b}`.trim() || 'AS';
  }

  selectTheme(theme: BadgeTheme): void {
    this.themeService.setThemeById(theme.id);
    this.toast.success(`Badge "${theme.name}" appliqué !`);
  }

  openCreateModal(): void {
    this.isEditMode.set(false);
    this.editingThemeId.set(null);
    this.resetForm();
    this.showModal.set(true);
  }

  editTheme(theme: BadgeTheme): void {
    this.isEditMode.set(true);
    this.editingThemeId.set(theme.id);
    this.formData.name = theme.name;
    this.formData.primary = theme.primary;

    // Essayer de récupérer les couleurs du CSS existant (simplifié ici)
    this.gradientStops = [
      { color: theme.primary, position: 0 },
      { color: '#f9e2af', position: 35 },
      { color: '#d1f8ff', position: 70 },
      { color: '#e6e0ff', position: 100 },
    ];

    this.updateGradient();
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.resetForm();
  }

  updateGradient(): void {
    const stops = this.gradientStops.map((s) => `${s.color} ${s.position}%`).join(', ');
    const gradient = `radial-gradient(120% 120% at ${this.gradientPosition()}, ${stops})`;
    this.generatedGradient.set(gradient);
  }

  applyPreset(preset: string): void {
    const presets: Record<string, { name: string; stops: GradientStop[] }> = {
      sunset: {
        name: 'Coucher de soleil',
        stops: [
          { color: '#ff6b6b', position: 0 },
          { color: '#ffd93d', position: 35 },
          { color: '#ff8b94', position: 70 },
          { color: '#ffaaa5', position: 100 },
        ],
      },
      ocean: {
        name: 'Océan',
        stops: [
          { color: '#4facfe', position: 0 },
          { color: '#00f2fe', position: 35 },
          { color: '#43e97b', position: 70 },
          { color: '#38f9d7', position: 100 },
        ],
      },
      forest: {
        name: 'Forêt',
        stops: [
          { color: '#56ab2f', position: 0 },
          { color: '#a8e063', position: 35 },
          { color: '#7ed56f', position: 70 },
          { color: '#28b485', position: 100 },
        ],
      },
      candy: {
        name: 'Bonbon',
        stops: [
          { color: '#f093fb', position: 0 },
          { color: '#f5576c', position: 35 },
          { color: '#ffecd2', position: 70 },
          { color: '#fcb69f', position: 100 },
        ],
      },
      fire: {
        name: 'Feu',
        stops: [
          { color: '#ff512f', position: 0 },
          { color: '#dd2476', position: 35 },
          { color: '#f09819', position: 70 },
          { color: '#ff5858', position: 100 },
        ],
      },
      lavender: {
        name: 'Lavande',
        stops: [
          { color: '#a8c0ff', position: 0 },
          { color: '#c3b7f0', position: 35 },
          { color: '#fbc2eb', position: 70 },
          { color: '#f5d7ff', position: 100 },
        ],
      },
    };

    const p = presets[preset];
    if (p) {
      this.formData.name = p.name;
      this.gradientStops = p.stops;
      this.updateGradient();
    }
  }

  generateRandomGradient(): void {
    // Génère 4 couleurs pastels aléatoires
    const pastelColors: string[] = [];
    for (let i = 0; i < 4; i++) {
      // Générer des couleurs pastels (HSL avec saturation moyenne et luminosité élevée)
      const hue = Math.floor(Math.random() * 360); // 0-360
      const saturation = 60 + Math.floor(Math.random() * 30); // 60-90%
      const lightness = 75 + Math.floor(Math.random() * 15); // 75-90%

      // Convertir HSL en HEX
      const color = this.hslToHex(hue, saturation, lightness);
      pastelColors.push(color);
    }

    // Appliquer les couleurs aux stops
    this.gradientStops = [
      { color: pastelColors[0], position: 0 },
      { color: pastelColors[1], position: 35 },
      { color: pastelColors[2], position: 70 },
      { color: pastelColors[3], position: 100 },
    ];

    // Générer une position aléatoire pour le gradient (comme les badges existants)
    const positions = ['10% 0%', '90% 10%', '0% 90%', '100% 100%', '20% 80%', '80% 20%', '50% 0%', '0% 50%'];
    const randomPosition = positions[Math.floor(Math.random() * positions.length)];
    this.gradientPosition.set(randomPosition);

    // Générer un nom aléatoire
    const names = [
      'Aurore', 'Crépuscule', 'Arc-en-ciel', 'Nuage', 'Étoile',
      'Galaxie', 'Cosmos', 'Licorne', 'Rêve', 'Magie',
      'Perle', 'Cristal', 'Diamant', 'Opale', 'Saphir',
      'Papillon', 'Fleur', 'Printemps', 'Été', 'Douceur'
    ];
    const randomName = names[Math.floor(Math.random() * names.length)];
    this.formData.name = randomName;

    this.updateGradient();
    this.toast.success('Dégradé aléatoire généré ! 🎨');
  }

  private hslToHex(h: number, s: number, l: number): string {
    s /= 100;
    l /= 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;

    if (0 <= h && h < 60) {
      r = c; g = x; b = 0;
    } else if (60 <= h && h < 120) {
      r = x; g = c; b = 0;
    } else if (120 <= h && h < 180) {
      r = 0; g = c; b = x;
    } else if (180 <= h && h < 240) {
      r = 0; g = x; b = c;
    } else if (240 <= h && h < 300) {
      r = x; g = 0; b = c;
    } else if (300 <= h && h < 360) {
      r = c; g = 0; b = x;
    }

    const rHex = Math.round((r + m) * 255).toString(16).padStart(2, '0');
    const gHex = Math.round((g + m) * 255).toString(16).padStart(2, '0');
    const bHex = Math.round((b + m) * 255).toString(16).padStart(2, '0');

    return `#${rHex}${gHex}${bHex}`;
  }

  saveBadge(event: Event): void {
    event.preventDefault();

    if (!this.formData.name.trim()) {
      this.toast.error('Veuillez saisir un nom pour le badge');
      return;
    }

    const timestamp = Date.now();
    const className = this.isEditMode()
      ? this.editingThemeId() || `avatar-custom-${timestamp}`
      : `avatar-custom-${timestamp}`;

    this.formData.primary = this.gradientStops[0].color;

    const theme: BadgeTheme = {
      id: this.isEditMode() ? this.editingThemeId()! : `custom-${timestamp}`,
      name: this.formData.name,
      className: className.replace('avatar-', '').replace('custom-', 'avatar-custom-'),
      primary: this.formData.primary,
      gradient: this.generatedGradient(),
    };

    if (this.isEditMode()) {
      this.themeService.updateCustomTheme(theme.id, theme);
      this.toast.success(`Badge "${theme.name}" modifié !`);
    } else {
      this.themeService.addCustomTheme(theme);
      this.toast.success(`Badge "${theme.name}" créé !`);
    }

    console.log(`%c📋 CSS à ajouter dans badge-theme.scss :`, 'font-weight: bold; color: #8B5CF6;');
    console.log(this.getCSSCode());

    this.closeModal();
  }

  async deleteTheme(theme: BadgeTheme): Promise<void> {
    const confirmed = await this.confirm.ask({
      title: 'Supprimer le badge ?',
      message: `Êtes-vous sûr de vouloir supprimer "${theme.name}" ?`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      variant: 'danger',
    });

    if (!confirmed) return;

    this.themeService.deleteCustomTheme(theme.id);
    this.toast.success(`Badge "${theme.name}" supprimé`);
  }

  getCSSCode(): string {
    const className = this.isEditMode()
      ? this.editingThemeId() || 'avatar-custom-new'
      : 'avatar-custom-new';
    return `.${className} { background: ${this.generatedGradient()}; }`;
  }

  async copyCSS(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.getCSSCode());
      this.toast.success('CSS copié dans le presse-papier !');
    } catch {
      this.toast.error('Erreur lors de la copie');
    }
  }

  private resetForm(): void {
    this.formData = {
      name: '',
      className: '',
      primary: '',
    };
    this.gradientStops = [
      { color: '#ffd1dc', position: 0 },
      { color: '#f9e2af', position: 35 },
      { color: '#d1f8ff', position: 70 },
      { color: '#e6e0ff', position: 100 },
    ];
    this.gradientPosition.set('10% 0%');
    this.updateGradient();
  }
}
