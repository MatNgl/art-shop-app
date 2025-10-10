import { Pipe, PipeTransform, inject } from '@angular/core';
import { FormatService } from '../../features/catalog/services/format.service';

export interface SizeObj {
  width: number;
  height: number;
  unit?: 'mm' | 'cm' | 'in' | 'inches';
}

@Pipe({ name: 'size', standalone: true, pure: false }) // pure: false car dépend du service
export class SizePipe implements PipeTransform {
  private readonly formatService = inject(FormatService);
  transform(
    value: SizeObj | string | number | null | undefined,
    fallbackUnit: 'mm' | 'cm' | 'in' = 'cm'
  ): string {
    if (value === null || value === undefined) return '—';

    // Si c'est un ID de format, le résoudre
    if (typeof value === 'number') {
      const formats = this.formatService.formats();
      const fmt = formats.find(f => f.id === value);
      if (fmt) {
        return `${this.trimZeros(fmt.width)} × ${this.trimZeros(fmt.height)} ${fmt.unit}`;
      }
      return `${this.trimZeros(value)} ${fallbackUnit}`;
    }

    // Si c'est un nom de format (A3, A4...), chercher dans le service
    if (typeof value === 'string') {
      const formats = this.formatService.formats();
      const fmt = formats.find(f =>
        f.slug === value.toLowerCase() ||
        f.name.toUpperCase() === value.toUpperCase()
      );
      if (fmt) {
        return `${this.trimZeros(fmt.width)} × ${this.trimZeros(fmt.height)} ${fmt.unit}`;
      }
      return value;
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
