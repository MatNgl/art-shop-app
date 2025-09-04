import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/components/header/header.component';
import { ToastContainerComponent } from './shared/components/toast/toast-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, ToastContainerComponent],
  template: `
    <app-header></app-header>
    <app-toast-container />
    <main class="container mx-auto p-4">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [],
})
export class AppComponent {
  title = 'art-shop-app';
}
