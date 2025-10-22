import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { routes } from './app/app.routes';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';
import { errorInterceptor } from './app/core/interceptors/error.interceptor';
import { suspensionInterceptor } from './app/core/interceptors/suspension.interceptor';
import { ErrorHandler, LOCALE_ID } from '@angular/core';
import { GlobalErrorHandler } from './app/core/handlers/global-error.handler';

import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
registerLocaleData(localeFr, 'fr');

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled',
      })
    ),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, errorInterceptor, suspensionInterceptor])),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },

    { provide: LOCALE_ID, useValue: 'fr' },
  ],
});
