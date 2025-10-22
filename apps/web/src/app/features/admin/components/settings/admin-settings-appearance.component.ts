import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-settings-appearance',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
      <i class="fa-solid fa-paint-roller text-gray-300 text-6xl mb-4"></i>
      <h2 class="text-xl font-semibold text-gray-900 mb-2">Apparence du site</h2>
      <p class="text-gray-600">Cette section sera bientôt disponible</p>
    </div>
  `,
})
export class AdminSettingsAppearanceComponent {}
