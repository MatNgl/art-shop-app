import { inject } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth';
import { ToastService } from '../../shared/services/toast.service';

export const suspensionInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 403 || err.status === 423) {
        toast.error('Session fermée : compte suspendu.');
        void auth.logout();
        void router.navigate(['/auth/login']);
      }
      return throwError(() => err);
    })
  );
};
