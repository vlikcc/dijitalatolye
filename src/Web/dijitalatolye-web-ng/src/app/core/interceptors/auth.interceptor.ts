import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthSession } from '../auth/auth-session.service';
import { AuthStore } from '../auth/auth.store';

// 401'i "oturum süresi doldu" değil "kimlik bilgisi hatalı" anlamında dönen uçlar: yenileme denenmez.
const NO_REFRESH_SUFFIXES = ['/auth/refresh', '/auth/login', '/auth/logout', '/auth/register'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthStore);
  const session = inject(AuthSession);
  const router = inject(Router);

  const withAuth = attachToken(req, auth.accessToken());

  return next(withAuth).pipe(
    catchError((err: HttpErrorResponse) => {
      const skip = NO_REFRESH_SUFFIXES.some((s) => req.url.endsWith(s));
      if (err.status !== 401 || skip || (!auth.isAuthenticated() && !auth.hasSessionHint())) {
        return throwError(() => err);
      }
      return session.refresh().pipe(
        switchMap((token) => {
          if (!token) {
            auth.logout();
            const returnUrl = router.url;
            if (!returnUrl.startsWith('/login')) {
              void router.navigate(['/login'], { queryParams: { returnUrl } });
            }
            return throwError(() => err);
          }
          return next(attachToken(req, token));
        }),
      );
    }),
  );
};

function attachToken(req: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  if (!token) return req;
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}
