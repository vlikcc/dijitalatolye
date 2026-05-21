import { HttpClient, HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, from, switchMap, throwError } from 'rxjs';
import { AuthStore } from '../auth/auth.store';

let refreshing: Promise<string | null> | null = null;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthStore);
  const http = inject(HttpClient);

  const withAuth = attachToken(req, auth.accessToken());

  return next(withAuth).pipe(
    catchError((err: HttpErrorResponse) => {
      const isRefresh = req.url.endsWith('/auth/refresh');
      if (err.status !== 401 || isRefresh || !auth.refreshToken()) {
        return throwError(() => err);
      }
      if (!refreshing) {
        refreshing = refreshAccessToken(http, auth);
      }
      return from(refreshing).pipe(
        switchMap((token) => {
          refreshing = null;
          if (!token) {
            auth.logout();
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

async function refreshAccessToken(http: HttpClient, auth: AuthStore): Promise<string | null> {
  const refresh = auth.refreshToken();
  if (!refresh) return null;
  try {
    const data = await new Promise<{ accessToken: string; refreshToken: string }>((resolve, reject) => {
      http.post<{ accessToken: string; refreshToken: string }>('/api/auth/refresh', { refreshToken: refresh })
        .subscribe({ next: resolve, error: reject });
    });
    auth.setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

// Observable<HttpEvent<unknown>> bağımlılığını minimize etmek için bağımsız tutuldu.
// Eğer tree-shaking için harici kullanımı kapatmak istersek bu satır kaldırılabilir.
export type _AuthInterceptorObservable = Observable<unknown>;
