import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KpiData } from '../../models/dashboard.model';
import { InfoTooltipComponent } from '../info-tooltip/info-tooltip.component';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule, InfoTooltipComponent],
  templateUrl: './kpi-card.component.html',
})
export class KpiCardComponent {
  data = input.required<KpiData>();

  formatValue(value: number, unit?: 'currency' | 'number' | 'percentage'): string {
    switch (unit) {
      case 'currency':
        return new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR',
        }).format(value);
      case 'percentage':
        return `${value.toFixed(1)} %`;
      case 'number':
      default:
        return new Intl.NumberFormat('fr-FR').format(value);
    }
  }

  getTrendIcon(trend?: 'up' | 'down' | 'stable'): string {
    switch (trend) {
      case 'up':
        return 'fa-arrow-up';
      case 'down':
        return 'fa-arrow-down';
      case 'stable':
      default:
        return 'fa-arrow-right';
    }
  }

  getTrendColorClass(trend?: 'up' | 'down' | 'stable'): string {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      case 'stable':
      default:
        return 'text-gray-600';
    }
  }
}
