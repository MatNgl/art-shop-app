import { Pipe, PipeTransform } from '@angular/core';

type SizeObj = { width: number; height: number; unit?: 'mm' | 'cm' | 'in' };

const ISO_SIZES: Record<string, SizeObj> = {
    A5: { width: 14.8, height: 21, unit: 'cm' },
    A4: { width: 21, height: 29.7, unit: 'cm' },
    A3: { width: 29.7, height: 42, unit: 'cm' },
};

@Pipe({ name: 'size', standalone: true, pure: true })
export class SizePipe implements PipeTransform {
    transform(
        value: SizeObj | string | number | null | undefined,
        fallbackUnit: 'mm' | 'cm' | 'in' = 'cm'
    ): string {
        if (value == null) return '—';

        // String: A4 / A3 / ...
        if (typeof value === 'string') {
            const key = value.toUpperCase().trim();
            const s = ISO_SIZES[key];
            if (s) return this.format(s);
            // string libre -> on affiche la valeur telle quelle
            return value;
        }

        // Nombre: on considère que c'est un côté (ex: 30 -> "30 cm")
        if (typeof value === 'number') {
            return `${this.trimZeros(value)} ${fallbackUnit}`;
        }

        // Objet { width, height, unit? }
        const unit = value.unit ?? fallbackUnit;
        return this.format({ width: value.width, height: value.height, unit });
    }

    private format(s: SizeObj): string {
        const w = this.trimZeros(s.width);
        const h = this.trimZeros(s.height);
        return `${w} × ${h} ${s.unit ?? 'cm'}`;
    }

    private trimZeros(n: number): string {
        const str = n.toFixed(2);
        return str.replace(/(\.0+|0+)$/, '').replace(/\.$/, '');
    }
}
