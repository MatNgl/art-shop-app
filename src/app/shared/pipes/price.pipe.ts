import { Pipe, PipeTransform } from '@angular/core';

export interface PriceOptions {
    currency?: string;  // 'EUR' by default
    locale?: string;    // 'fr-FR' by default
    minFrac?: number;   // 2 by default
    maxFrac?: number;   // 2 by default
    showSign?: boolean; // show + for positive values
}

@Pipe({ name: 'price', standalone: true, pure: true })
export class PricePipe implements PipeTransform {
    transform(value: number | null | undefined, opts: PriceOptions = {}): string {
        // Handle null/undefined or non-finite numbers
        if (value === null || !Number.isFinite(Number(value))) return '—';

        const amount = Number(value);

        const {
            currency = 'EUR',
            locale = 'fr-FR',
            minFrac = 2,
            maxFrac = 2,
            showSign = false,
        } = opts;

        const out = new Intl.NumberFormat(locale, {
            style: 'currency',
            currency,
            minimumFractionDigits: minFrac,
            maximumFractionDigits: maxFrac,
        }).format(amount);

        return showSign && amount > 0 ? `+${out}` : out;
    }
}
