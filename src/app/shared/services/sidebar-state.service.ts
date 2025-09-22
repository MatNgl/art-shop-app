import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SidebarStateService {
    readonly isOpen = signal(false);

    open() {
        this.isOpen.set(true);
        document.body.style.overflow = 'hidden';
    }

    close() {
        this.isOpen.set(false);
        document.body.style.overflow = '';
    }

    toggle() {
        const next = !this.isOpen();
        this.isOpen.set(next);
        document.body.style.overflow = next ? 'hidden' : '';
    }
}
