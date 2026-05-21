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

  it('setTokens ve setUser sonrası signals güncellenir', () => {
    const store = TestBed.inject(AuthStore);
    store.setTokens('access-1', 'refresh-1');
    store.setUser('teacher@example.com', ['Teacher']);

    expect(store.isAuthenticated()).toBeTrue();
    expect(store.accessToken()).toBe('access-1');
    expect(store.refreshToken()).toBe('refresh-1');
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
    store.setTokens('a', 'r');
    store.setUser('x', ['Admin']);
    store.logout();
    expect(store.isAuthenticated()).toBeFalse();
    expect(store.email()).toBeNull();
    expect(store.roles()).toEqual([]);
  });

  it('localStorage persistence — yeniden init okuduğu state ile gelir', async () => {
    const store = TestBed.inject(AuthStore);
    store.setTokens('persisted-token', 'persisted-refresh');
    store.setUser('user@x', ['Teacher']);

    // effect senkron çalışmadığı için flush
    await Promise.resolve();
    TestBed.flushEffects();

    const raw = localStorage.getItem('dijitalatolye-auth');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.state.accessToken).toBe('persisted-token');

    // Yeni TestBed instance — disk'ten okumalı
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const fresh = TestBed.inject(AuthStore);
    expect(fresh.accessToken()).toBe('persisted-token');
    expect(fresh.roles()).toEqual(['Teacher']);
  });

  it('bozuk localStorage payload — boş state ile fallback', () => {
    localStorage.setItem('dijitalatolye-auth', '{not-json');
    const store = TestBed.inject(AuthStore);
    expect(store.isAuthenticated()).toBeFalse();
  });

  it('hasAnyRole birden fazla rol kontrolünde true döner', () => {
    const store = TestBed.inject(AuthStore);
    store.setUser('x', ['Editor']);
    expect(store.hasAnyRole(['Teacher', 'Editor', 'Admin'])).toBeTrue();
    expect(store.hasAnyRole(['Admin', 'SuperAdmin'])).toBeFalse();
  });
});
