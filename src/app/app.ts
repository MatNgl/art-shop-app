// src/app/app.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

import { HeaderComponent } from './shared/components/header/header.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { BackToTopComponent } from './shared/components/back-to-top/back-to-top.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    BackToTopComponent,
    SidebarComponent,
  ],
  template: `
    <div class="min-h-screen flex flex-col">
      <app-header *ngIf="!hideHeader()"></app-header>

      <main class="flex-1" [class.pt-16]="!hideHeader()">
        <!-- layout avec sidebar uniquement si non masquée -->
        <div *ngIf="!hideSidebar(); else noSidebar" class="flex">
          <app-sidebar class="hidden md:block"></app-sidebar>
          <div class="flex-1">
            <router-outlet></router-outlet>
          </div>
        </div>
        <ng-template #noSidebar>
          <router-outlet></router-outlet>
        </ng-template>
      </main>

      <app-back-to-top></app-back-to-top>
      <app-footer *ngIf="!hideFooter()"></app-footer>
    </div>
  `,
})
export class AppComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  hideFooter = signal(false);
  hideHeader = signal(false);
  hideSidebar = signal(false);

  constructor() {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      let r = this.route;
      while (r.firstChild) r = r.firstChild;
      const d = r.snapshot.data || {};
      this.hideFooter.set(!!d['hideFooter']);
      this.hideHeader.set(!!d['hideHeader']);
      this.hideSidebar.set(!!d['hideSidebar']);
    });
  }
}
