import { Directive, ElementRef, Renderer2, HostListener, OnInit, inject } from '@angular/core';

@Directive({
    selector: '[appKeyClick]',
    standalone: true,
})
export class KeyClickDirective implements OnInit {
    private el = inject(ElementRef<HTMLElement>);
    private rd = inject(Renderer2);

    ngOnInit(): void {
        const element = this.el.nativeElement;
        // Si l'élément n'est pas naturellement focusable, on le rend focusable + role=button
        const tag = element.tagName.toLowerCase();
        const naturallyFocusable = ['a', 'button', 'input', 'select', 'textarea', 'summary'].includes(tag);
        if (!naturallyFocusable && !element.hasAttribute('tabindex')) {
            this.rd.setAttribute(element, 'tabindex', '0');
        }
        if (!naturallyFocusable && !element.hasAttribute('role')) {
            this.rd.setAttribute(element, 'role', 'button');
        }
    }

    @HostListener('keydown.enter', ['$event'])
    onEnter(e: KeyboardEvent) {
        this.triggerClick(e);
    }

    @HostListener('keydown.space', ['$event'])
    onSpace(e: KeyboardEvent) {
        this.triggerClick(e);
    }

    private triggerClick(e: KeyboardEvent) {
        e.preventDefault();
        this.el.nativeElement.click();
    }
}