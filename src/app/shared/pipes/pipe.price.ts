import { Pipe, PipeTransform } from '@angular/core';

export interface PriceOptions {
    currency?: string;        // 'EUR' par défaut
    locale?: string;          // 'fr-FR' par défaut
    minFrac?: number;         // 2 par défaut
    maxFrac?: number;         // 2 par défaut
    showSign?: boolean;       // affiche + pour les valeurs > 0
}

@Pipe({ name: 'price', standalone: true, pure: true })
export class PricePipe implements PipeTransform {
    transform(
        value: number | null | undefined,
        opts: PriceOptions = {}
    ): string {
        if (value === null) return '—';

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
        }).format(value);

        return showSign && value > 0 ? `+${out}` : out;
    }
}
