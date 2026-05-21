import { Injectable, computed, signal, effect } from '@angular/core';

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  email: string | null;
  roles: string[];
}

const STORAGE_KEY = 'dijitalatolye-auth';

function loadInitial(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    // zustand-persist uyumlu format: { state: {...}, version: ... }
    const state = parsed?.state ?? parsed;
    return {
      accessToken: state?.accessToken ?? null,
      refreshToken: state?.refreshToken ?? null,
      email: state?.email ?? null,
      roles: Array.isArray(state?.roles) ? state.roles : [],
    };
  } catch {
    return emptyState();
  }
}

function emptyState(): AuthState {
  return { accessToken: null, refreshToken: null, email: null, roles: [] };
}

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly _state = signal<AuthState>(loadInitial());

  readonly state = this._state.asReadonly();
  readonly accessToken = computed(() => this._state().accessToken);
  readonly refreshToken = computed(() => this._state().refreshToken);
  readonly email = computed(() => this._state().email);
  readonly roles = computed(() => this._state().roles);
  readonly isAuthenticated = computed(() => !!this._state().accessToken);
  readonly isTeacher = computed(() => this.hasAnyRole(['Teacher', 'Editor', 'Admin', 'SuperAdmin']));
  readonly isEditor = computed(() => this.hasAnyRole(['Editor', 'Admin', 'SuperAdmin']));
  readonly isAdmin = computed(() => this.hasAnyRole(['Admin', 'SuperAdmin']));

  constructor() {
    effect(() => {
      const s = this._state();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: s, version: 0 }));
      } catch {
        /* sessiz */
      }
    });
  }

  setTokens(accessToken: string, refreshToken: string): void {
    this._state.update((s) => ({ ...s, accessToken, refreshToken }));
  }

  setUser(email: string, roles: string[]): void {
    this._state.update((s) => ({ ...s, email, roles: roles ?? [] }));
  }

  logout(): void {
    this._state.set(emptyState());
  }

  hasAnyRole(required: string[]): boolean {
    const r = this._state().roles ?? [];
    return required.some((x) => r.includes(x));
  }
}
