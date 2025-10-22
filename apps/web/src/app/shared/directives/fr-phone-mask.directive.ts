import { Directive, HostListener, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
    selector: '[appFrPhoneMask]', // usage : <input appFrPhoneMask>
    standalone: true,
})
export class FrPhoneMaskDirective {
    private readonly ngControl = inject(NgControl);

    @HostListener('input', ['$event'])
    onInput(e: Event) {
        const el = e.target as HTMLInputElement;
        let digits = el.value.replace(/\D/g, '');

        if (digits.startsWith('33') && digits.length >= 11) {
            digits = '0' + digits.slice(2);
        }
        if (!digits.startsWith('0') && digits.length > 0) {
            digits = '0' + digits;
        }
        digits = digits.slice(0, 10);

        const formatted = digits.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
        this.ngControl.control?.setValue(formatted, { emitEvent: true });
    }
}
