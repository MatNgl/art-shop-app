import { Pipe, PipeTransform } from '@angular/core';

export interface SizeObj {
  width: number;
  height: number;
  unit?: 'mm' | 'cm' | 'in' | 'inches';
}

const ISO_SIZES: Record<string, SizeObj> = {
  A6: { width: 10.5, height: 14.8, unit: 'cm' },
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
    if (value === null || value === undefined) return '—';

    // "A3", "A4", ...
    if (typeof value === 'string') {
      const key = value.toUpperCase().trim();
      const s = ISO_SIZES[key];
      if (s) return this.format(s);
      return value;
    }

    // 30 -> "30 cm"
    if (typeof value === 'number') {
      return `${this.trimZeros(value)} ${fallbackUnit}`;
    }

    // { width, height, unit? }
    if (this.isSizeObj(value)) {
      const normalizedUnit = this.normalizeUnit(value.unit ?? fallbackUnit);
      return this.format({ width: value.width, height: value.height, unit: normalizedUnit });
    }

    return '—';
  }

  private normalizeUnit(unit: 'mm' | 'cm' | 'in' | 'inches'): 'mm' | 'cm' | 'in' {
    if (unit === 'inches') return 'in';
    return unit;
  }

  private isSizeObj(v: unknown): v is SizeObj {
    if (typeof v !== 'object' || v === null) return false;

    const obj = v as Record<string, unknown>;
    const width = obj['width'];
    const height = obj['height'];
    const unit = obj['unit'];

    const unitOk =
      unit === undefined ||
      (typeof unit === 'string' &&
        (unit === 'mm' || unit === 'cm' || unit === 'in' || unit === 'inches'));

    return typeof width === 'number' && typeof height === 'number' && unitOk;
  }

  private format(s: SizeObj): string {
    const w = this.trimZeros(s.width);
    const h = s.height !== undefined ? this.trimZeros(s.height) : '';
    const unit = this.normalizeUnit(s.unit ?? 'cm');
    return h ? `${w} × ${h} ${unit}` : `${w} ${unit}`;
  }

  private trimZeros(n: number): string {
    const str = n.toFixed(2);
    return str.replace(/(\.0+|0+)$/, '').replace(/\.$/, '');
  }
}
