import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-info-tooltip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative inline-block group">
      <button
        type="button"
        class="w-5 h-5 rounded-full bg-gray-200 hover:bg-indigo-100 text-gray-600 hover:text-indigo-600 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
        [attr.aria-label]="'Information sur ' + (label() || 'cette donnée')"
      >
        <i class="fa-solid fa-info text-xs"></i>
      </button>

      <!-- Tooltip -->
      <div
        class="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none"
        role="tooltip"
      >
        <div class="relative">
          {{ text() }}
          <!-- Arrow -->
          <div class="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
        </div>
      </div>
    </div>
  `,
})
export class InfoTooltipComponent {
  text = input.required<string>();
  label = input<string>();
}
