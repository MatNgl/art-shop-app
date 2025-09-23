import { ApplicationConfig, ErrorHandler } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { errorInterceptor } from './shared/interceptors/error.interceptor';
import { GlobalErrorHandler } from './shared/handlers/global-error.handler';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withFetch(),
      withInterceptors([errorInterceptor])
    ),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
  ],
};
