import { Directive, HostListener, Input, inject } from '@angular/core';
import { NgModel } from '@angular/forms';

@Directive({
  selector: '[appDigitsOnly]',
  standalone: true,
})
export class DigitsOnlyDirective {
  @Input() appDigitsOnlyMax?: number;

  private readonly ngModel = inject(NgModel);

  @HostListener('input', ['$event'])
  onInput(e: Event): void {
    const input = e.target as HTMLInputElement;
    let next = (input.value || '').replace(/\D+/g, '');
    if (this.appDigitsOnlyMax && next.length > this.appDigitsOnlyMax) {
      next = next.slice(0, this.appDigitsOnlyMax);
    }
    if (next !== input.value) {
      input.value = next;
      this.ngModel.control.setValue(next);
    }
  }
}
