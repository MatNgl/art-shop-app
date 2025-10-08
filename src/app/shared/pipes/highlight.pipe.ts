// FILE: src/app/shared/pipes/highlight.pipe.ts
import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'highlight',
  standalone: true,
})
export class HighlightPipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);

  transform(value: string | null | undefined, query: string | null | undefined): SafeHtml {
    const text = (value ?? '').toString();
    const q = (query ?? '').trim();
    if (!q) {
      // Toujours renvoyer un SafeHtml pour rester typé strict
      return this.sanitizer.bypassSecurityTrustHtml(text);
    }
    try {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(escaped, 'gi');
      const html = text.replace(
        re,
        (m) => `<mark class="px-0.5 rounded bg-yellow-100">${m}</mark>`
      );
      return this.sanitizer.bypassSecurityTrustHtml(html);
    } catch {
      return this.sanitizer.bypassSecurityTrustHtml(text);
    }
  }
}
