import { TestBed } from '@angular/core/testing';
import { AuthStore } from './auth.store';

describe('AuthStore', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
  });

  it('boş başlangıç state ile init eder', () => {
    const store = TestBed.inject(AuthStore);
    expect(store.isAuthenticated()).toBeFalse();
    expect(store.accessToken()).toBeNull();
    expect(store.roles()).toEqual([]);
  });

  it('setSession sonrası signals güncellenir', () => {
    const store = TestBed.inject(AuthStore);
    store.setSession('access-1', ['Teacher'], 'teacher@example.com');

    expect(store.isAuthenticated()).toBeTrue();
    expect(store.accessToken()).toBe('access-1');
    expect(store.email()).toBe('teacher@example.com');
    expect(store.roles()).toEqual(['Teacher']);
    expect(store.isTeacher()).toBeTrue();
    expect(store.isEditor()).toBeFalse();
    expect(store.isAdmin()).toBeFalse();
  });

  it('Editor rolü teacher/editor true, admin false', () => {
    const store = TestBed.inject(AuthStore);
    store.setUser('editor@x', ['Editor']);
    expect(store.isTeacher()).toBeTrue();
    expect(store.isEditor()).toBeTrue();
    expect(store.isAdmin()).toBeFalse();
  });

  it('Admin rolü tüm seviyeleri true yapar', () => {
    const store = TestBed.inject(AuthStore);
    store.setUser('admin@x', ['Admin']);
    expect(store.isTeacher()).toBeTrue();
    expect(store.isEditor()).toBeTrue();
    expect(store.isAdmin()).toBeTrue();
  });

  it('logout state sıfırlar', () => {
    const store = TestBed.inject(AuthStore);
    store.setSession('a', ['Admin'], 'x');
    store.logout();
    expect(store.isAuthenticated()).toBeFalse();
    expect(store.email()).toBeNull();
    expect(store.roles()).toEqual([]);
    expect(store.hasSessionHint()).toBeFalse();
  });

  it('rol ve e-posta verilmezse token içeriğinden okunur', () => {
    const payload = btoa(JSON.stringify({ email: 'jwt@x', role: ['Editor'] })).replace(/=+$/, '');
    const store = TestBed.inject(AuthStore);
    store.setSession(`h.${payload}.s`);
    expect(store.email()).toBe('jwt@x');
    expect(store.roles()).toEqual(['Editor']);
  });

  it("token hiçbir zaman localStorage'a yazılmaz; yalnızca oturum ipucu kalır", () => {
    const store = TestBed.inject(AuthStore);
    store.setSession('secret-access-token', ['Teacher'], 'user@x');

    expect(store.hasSessionHint()).toBeTrue();
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)!;
      expect(localStorage.getItem(key)).not.toContain('secret-access-token');
    }

    // Yeni instance (sayfa yenileme) token'sız başlar; oturum AuthSession.restore() ile çerezden gelir
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const fresh = TestBed.inject(AuthStore);
    expect(fresh.accessToken()).toBeNull();
    expect(fresh.hasSessionHint()).toBeTrue();
  });

  it('hasAnyRole birden fazla rol kontrolünde true döner', () => {
    const store = TestBed.inject(AuthStore);
    store.setUser('x', ['Editor']);
    expect(store.hasAnyRole(['Teacher', 'Editor', 'Admin'])).toBeTrue();
    expect(store.hasAnyRole(['Admin', 'SuperAdmin'])).toBeFalse();
  });
});
