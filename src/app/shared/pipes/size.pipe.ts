import { Pipe, PipeTransform } from '@angular/core';

interface SizeObj { width: number; height: number; unit?: 'mm' | 'cm' | 'in' }

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
        // Handle null/undefined
        if (value === null) return '—';

        // String: A4 / A3 / ...
        if (typeof value === 'string') {
            const key = value.toUpperCase().trim();
            const s = ISO_SIZES[key];
            if (s) return this.format(s);
            // Free text -> display as-is
            return value;
        }

        // Number: treat as one side (e.g., 30 -> "30 cm")
        if (typeof value === 'number') {
            return `${this.trimZeros(value)} ${fallbackUnit}`;
        }

        // Object with width/height
        if (this.isSizeObj(value)) {
            const unit = value.unit ?? fallbackUnit;
            return this.format({ width: value.width, height: value.height, unit });
        }

        // Fallback
        return '—';
    }

    private isSizeObj(v: unknown): v is SizeObj {
        if (typeof v !== 'object' || v === null) return false;

        const obj = v as Record<string, unknown>;
        const width = obj['width'];
        const height = obj['height'];
        const unit = obj['unit'];

        const unitOk =
            unit === undefined ||
            (typeof unit === 'string' && (unit === 'mm' || unit === 'cm' || unit === 'in'));

        return typeof width === 'number' && typeof height === 'number' && unitOk;
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
