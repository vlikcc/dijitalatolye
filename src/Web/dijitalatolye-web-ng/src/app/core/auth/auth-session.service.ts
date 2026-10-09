import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  Observable, catchError, finalize, firstValueFrom, map, of, shareReplay, switchMap, timeout, timer,
} from 'rxjs';
import { AuthSessionResponse } from '../api/contracts';
import { AuthStore } from './auth.store';

/** Eski sürümlerin access + refresh token'ı düz metin sakladığı anahtar (yalnızca tek seferlik geçiş için okunur). */
const LEGACY_STORAGE_KEY = 'dijitalatolye-auth';

/**
 * Aynı çerezi aynı anda gönderen iki sekmeden biri rotasyon yarışını kaybedip 401 alır; kısa
 * bir beklemeden sonra (diğer sekmenin yazdığı yeni çerezle) bir kez daha denenir.
 */
const REFRESH_RETRY_DELAY_MS = 400;
const RESTORE_TIMEOUT_MS = 8000;

@Injectable({ providedIn: 'root' })
export class AuthSession {
  private readonly http = inject(HttpClient);
  private readonly store = inject(AuthStore);

  private refreshing$: Observable<string | null> | null = null;

  /**
   * HttpOnly çerezdeki refresh token ile yeni access token alır. Eş zamanlı çağrılar tek isteği paylaşır.
   * Başarısızlıkta null döner; oturumu kapatıp kapatmamak çağırana kalır.
   */
  refresh(): Observable<string | null> {
    this.refreshing$ ??= this.requestRefresh().pipe(
      catchError(() => timer(REFRESH_RETRY_DELAY_MS).pipe(switchMap(() => this.requestRefresh()))),
      map((res) => {
        this.store.setSession(res.accessToken, res.roles);
        return res.accessToken as string | null;
      }),
      catchError(() => of(null)),
      finalize(() => (this.refreshing$ = null)),
      shareReplay(1),
    );
    return this.refreshing$;
  }

  /** Uygulama açılışında: önceki oturumu çerezden geri yükler (sayfa yenilemede tekrar giriş gerekmez). */
  async restore(): Promise<void> {
    const legacyRefreshToken = takeLegacyRefreshToken();
    if (legacyRefreshToken) {
      // Eski istemciden geçiş: sunucu token'ı doğrulayıp HttpOnly çereze taşır.
      try {
        const res = await firstValueFrom(
          this.requestRefresh({ refreshToken: legacyRefreshToken }).pipe(timeout(RESTORE_TIMEOUT_MS)),
        );
        this.store.setSession(res.accessToken, res.roles);
        return;
      } catch {
        /* çerez yoluna düş */
      }
    }

    if (!this.store.hasSessionHint()) return;
    const token = await firstValueFrom(
      this.refresh().pipe(timeout(RESTORE_TIMEOUT_MS), catchError(() => of(null))),
    );
    if (!token) this.store.logout();
  }

  /** Sunucuda refresh token'ı iptal eder, çerezi siler ve istemci durumunu temizler. */
  logout(): void {
    this.http.post('/api/auth/logout', {}).subscribe({ error: () => undefined });
    this.store.logout();
  }

  private requestRefresh(body: object = {}): Observable<AuthSessionResponse> {
    return this.http.post<AuthSessionResponse>('/api/auth/refresh', body);
  }
}

function takeLegacyRefreshToken(): string | null {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    const parsed = JSON.parse(raw);
    const token = (parsed?.state ?? parsed)?.refreshToken;
    return typeof token === 'string' && token ? token : null;
  } catch {
    return null;
  }
}
