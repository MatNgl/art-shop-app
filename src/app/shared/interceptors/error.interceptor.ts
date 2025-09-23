import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { ToastService } from '../../shared/services/toast.service';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const toast = inject(ToastService);

    return next(req).pipe(
        catchError((err: unknown) => {
            if (err instanceof HttpErrorResponse) {
                const apiMsg =
                    (typeof err.error === 'string' && err.error) ||
                    (typeof err.error === 'object' && err.error?.message) ||
                    err.message ||
                    'Erreur réseau';
                toast.error(apiMsg);
            } else {
                toast.error('Une erreur inattendue est survenue.');
            }
            return throwError(() => err);
        })
    );
};
