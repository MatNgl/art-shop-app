import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'frPhone', standalone: true })
export class FrPhonePipe implements PipeTransform {
    transform(raw?: string | null): string {
        if (!raw) return '';
        // garde uniquement les chiffres
        let digits = (raw + '').replace(/\D/g, '');

        // +33xxxxxxxxx -> 0xxxxxxxxx
        if (digits.startsWith('33') && digits.length >= 11) {
            digits = '0' + digits.slice(2);
        }
        if (!digits.startsWith('0') && digits.length === 9) {
            digits = '0' + digits; // tolère 9 chiffres sans le 0
        }
        // tronque à 10 chiffres
        digits = digits.slice(0, 10);

        // regroupe par paires
        return digits.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
    }
}
