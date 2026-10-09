import { Injectable, computed, signal } from '@angular/core';
import { emailFromJwt, rolesFromJwt } from './jwt';

export interface AuthState {
  accessToken: string | null;
  email: string | null;
  roles: string[];
}

/**
 * Yalnızca "bu tarayıcıda açık oturum var" ipucu saklanır (token değil). Access token sadece
 * bellekte yaşar; refresh token HttpOnly çerezdedir ve JavaScript tarafından okunamaz.
 * İpucu, oturumu olmayan ziyaretçiler için açılışta gereksiz /auth/refresh çağrısını önler.
 */
const SESSION_HINT_KEY = 'da-session';

function emptyState(): AuthState {
  return { accessToken: null, email: null, roles: [] };
}

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly _state = signal<AuthState>(emptyState());

  readonly state = this._state.asReadonly();
  readonly accessToken = computed(() => this._state().accessToken);
  readonly email = computed(() => this._state().email);
  readonly roles = computed(() => this._state().roles);
  readonly isAuthenticated = computed(() => !!this._state().accessToken);
  readonly isTeacher = computed(() => this.hasAnyRole(['Teacher', 'Editor', 'Admin', 'SuperAdmin']));
  readonly isEditor = computed(() => this.hasAnyRole(['Editor', 'Admin', 'SuperAdmin']));
  readonly isAdmin = computed(() => this.hasAnyRole(['Admin', 'SuperAdmin']));
  readonly isStudent = computed(() => this.hasAnyRole(['Student']));

  /** Giriş / yenileme sonrası. Rol ve e-posta verilmezse token'dan okunur. */
  setSession(accessToken: string, roles?: string[] | null, email?: string | null): void {
    this._state.set({
      accessToken,
      roles: roles ?? rolesFromJwt(accessToken),
      email: email ?? emailFromJwt(accessToken),
    });
    writeHint(true);
  }

  setUser(email: string, roles: string[]): void {
    this._state.update((s) => ({ ...s, email, roles: roles ?? [] }));
  }

  /** Yalnızca istemci durumunu temizler; sunucu tarafı iptal için AuthSession.logout() kullanın. */
  logout(): void {
    this._state.set(emptyState());
    writeHint(false);
  }

  hasSessionHint(): boolean {
    try {
      return localStorage.getItem(SESSION_HINT_KEY) === '1';
    } catch {
      return false;
    }
  }

  hasAnyRole(required: string[]): boolean {
    const r = this._state().roles ?? [];
    return required.some((x) => r.includes(x));
  }
}

function writeHint(on: boolean): void {
  try {
    if (on) localStorage.setItem(SESSION_HINT_KEY, '1');
    else localStorage.removeItem(SESSION_HINT_KEY);
  } catch {
    /* sessiz */
  }
}
