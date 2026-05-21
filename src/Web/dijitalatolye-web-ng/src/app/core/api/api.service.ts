import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export const API_BASE = '/api';

/**
 * HttpClient sarmalayıcı: tüm istek yolları "/api/..." prefix'iyle gider.
 * authInterceptor JWT bearer ekler, 401 olursa refresh akışını tetikler.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  get<T>(path: string, params?: Record<string, string | number | boolean | undefined | null>): Observable<T> {
    return this.http.get<T>(this.url(path), { params: this.toParams(params) });
  }

  post<T>(path: string, body: unknown, params?: Record<string, string | number | boolean | undefined | null>): Observable<T> {
    return this.http.post<T>(this.url(path), body, { params: this.toParams(params) });
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.http.put<T>(this.url(path), body);
  }

  patch<T>(path: string, body: unknown): Observable<T> {
    return this.http.patch<T>(this.url(path), body);
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(this.url(path));
  }

  postFormData<T>(path: string, formData: FormData): Observable<T> {
    return this.http.post<T>(this.url(path), formData);
  }

  private url(path: string): string {
    const clean = path.startsWith('/') ? path : `/${path}`;
    return `${API_BASE}${clean}`;
  }

  private toParams(p?: Record<string, string | number | boolean | undefined | null>): HttpParams | undefined {
    if (!p) return undefined;
    let params = new HttpParams();
    for (const [k, v] of Object.entries(p)) {
      if (v === undefined || v === null) continue;
      params = params.set(k, String(v));
    }
    return params;
  }
}
