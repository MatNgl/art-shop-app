import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastService } from '../../shared/services/toast.service';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const toast = inject(ToastService);
    const router = inject(Router);

    return next(req).pipe(
        catchError((err: unknown) => {
            if (err instanceof HttpErrorResponse) {
                // Gérer 401 Unauthorized (token invalide/expiré)
                if (err.status === 401) {
                    localStorage.removeItem('currentUser');
                    localStorage.removeItem('accessToken');
                    router.navigate(['/auth/login']);
                    toast.error('Session expirée, veuillez vous reconnecter');
                    return throwError(() => err);
                }

                // Gérer 403 Forbidden (pas les permissions)
                if (err.status === 403) {
                    toast.error('Accès refusé : permissions insuffisantes');
                    return throwError(() => err);
                }

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
