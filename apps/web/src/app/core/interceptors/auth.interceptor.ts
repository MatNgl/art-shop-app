import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthHttpService } from '../../features/auth/services/auth-http.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthHttpService);
  const token = authService.getToken();

  // Si un token existe, ajouter le header Authorization
  if (token && !req.headers.has('Authorization')) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(req);
};
