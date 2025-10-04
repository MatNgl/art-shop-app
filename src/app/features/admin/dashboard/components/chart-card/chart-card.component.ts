import { Component, input, output, contentChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartCardConfig } from '../../models/dashboard.model';

@Component({
  selector: 'app-chart-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chart-card.component.html',
})
export class ChartCardComponent {
  config = input.required<ChartCardConfig>();
  loading = input<boolean>(false);
  isEmpty = input<boolean>(false);

  toggleChange = output<boolean>();
  filterChange = output<string>();

  headerActions = contentChild<TemplateRef<unknown>>('headerActions');
  footer = contentChild<TemplateRef<unknown>>('footer');

  toggleValue = false;

  onToggleChange(): void {
    this.toggleValue = !this.toggleValue;
    this.toggleChange.emit(this.toggleValue);
  }

  onFilterClick(event: Event): void {
    const target = event.target as HTMLButtonElement;
    this.filterChange.emit(target.value);
  }

  handleKeydown(event: KeyboardEvent, callback: () => void): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      callback();
    }
  }
}
