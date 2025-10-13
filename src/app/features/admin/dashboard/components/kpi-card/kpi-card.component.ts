import { Component, input, computed } from '@angular/core';
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

  /** Détecte si l'icon string correspond à Font Awesome */
  readonly isFaIcon = computed<boolean>(() => {
    const icon = this.data().icon?.trim() ?? '';
    // true si on trouve un token qui commence par fa-
    return /\bfa-[\w-]+/.test(icon);
  });

  /** Retourne les classes FA complètes. Si pas de style fourni, on préfixe avec fa-solid. */
  readonly faIconClasses = computed<string>(() => {
    const icon = (this.data().icon ?? '').trim();
    if (!this.isFaIcon()) return '';
    const hasStyle = /\bfa-(solid|regular|light|thin|duotone|brands)\b/.test(icon);
    return hasStyle ? icon : `fa-solid ${icon}`;
  });

  formatValue(value: number, unit?: 'currency' | 'number' | 'percentage'): string {
    switch (unit) {
      case 'currency':
        return new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR',
        }).format(value);
      case 'percentage':
        return `${value.toFixed(2)} %`;
      case 'number':
      default:
        return new Intl.NumberFormat('fr-FR').format(value);
    }
  }

  // flèches unicode (pour matcher tes tests)
  getTrendIcon(trend?: 'up' | 'down' | 'stable'): string {
    switch (trend) {
      case 'up':
        return '↑';
      case 'down':
        return '↓';
      case 'stable':
      default:
        return '→';
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
