import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white shadow-sm border-b border-gray-200 mb-8">
      <div class="container-wide py-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <!-- Logo avec fond dégradé -->
            <div
              class="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg"
              [ngClass]="gradientClass"
            >
              <i [class]="'fa-solid ' + icon + ' text-white text-2xl'"></i>
            </div>

            <div>
              <h1 class="text-2xl font-bold text-gray-900">{{ title }}</h1>
              <p class="text-gray-600 mt-1 text-sm">{{ description }}</p>
            </div>
          </div>

          <!-- Actions à droite -->
          <div class="flex items-center gap-3">
            <ng-content select="[actions]"></ng-content>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class AdminHeaderComponent {
  @Input() title = '';
  @Input() description = '';
  @Input() icon = 'fa-cog';
  @Input() gradientClass = 'bg-gradient-to-br from-purple-500 to-blue-500';
}
