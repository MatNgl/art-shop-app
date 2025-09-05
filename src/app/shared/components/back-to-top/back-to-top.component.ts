import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, Input, signal } from '@angular/core';

@Component({
    selector: 'app-back-to-top',
    standalone: true,
    imports: [CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <button
      type="button"
      class="fixed bottom-5 right-5 z-[60] rounded-full shadow-lg bg-blue-600 text-white p-3 md:p-3.5
             transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300
             hover:bg-blue-700"
      [class.opacity-0]="!visible()"
      [class.translate-y-2]="!visible()"
      [class.pointer-events-none]="!visible()"
      aria-label="Revenir en haut"
      (click)="goTop()"
    >
      <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <!-- chevron up -->
        <path d="M7.41 15.41 12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
      </svg>
    </button>
  `,
})
export class BackToTopComponent {
    /** Pixels à scroller avant d'afficher la flèche */
    @Input() threshold = 400;

    /** Visibilité pilotée par le scroll */
    visible = signal(false);

    @HostListener('window:scroll')
    onScroll() {
        this.visible.set(window.scrollY > this.threshold);
    }

    goTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}
