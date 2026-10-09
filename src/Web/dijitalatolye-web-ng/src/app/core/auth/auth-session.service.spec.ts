import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthSession } from './auth-session.service';
import { AuthStore } from './auth.store';

describe('AuthSession', () => {
  let session: AuthSession;
  let store: AuthStore;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    session = TestBed.inject(AuthSession);
    store = TestBed.inject(AuthStore);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('oturum ipucu yoksa açılışta istek atmaz', async () => {
    await session.restore();
    httpMock.expectNone('/api/auth/refresh');
    expect(store.isAuthenticated()).toBeFalse();
  });

  it('oturum ipucu varsa çerezle oturumu geri yükler', async () => {
    localStorage.setItem('da-session', '1');
    const done = session.restore();
    const req = httpMock.expectOne('/api/auth/refresh');
    expect(req.request.body).toEqual({});
    req.flush({ accessToken: 'restored', roles: ['Editor'] });
    await done;
    expect(store.accessToken()).toBe('restored');
    expect(store.isEditor()).toBeTrue();
  });

  it('eski localStorage token\'ını tek seferlik çereze taşır ve siler', async () => {
    localStorage.setItem('dijitalatolye-auth', JSON.stringify({
      state: { accessToken: 'old-a', refreshToken: 'legacy-r', email: 'x', roles: [] }, version: 0,
    }));
    const done = session.restore();
    const req = httpMock.expectOne('/api/auth/refresh');
    expect(req.request.body).toEqual({ refreshToken: 'legacy-r' });
    req.flush({ accessToken: 'migrated', roles: ['Teacher'] });
    await done;
    expect(store.accessToken()).toBe('migrated');
    expect(localStorage.getItem('dijitalatolye-auth')).toBeNull();
  });

  it('logout sunucuda iptal eder ve yerel durumu temizler', () => {
    store.setSession('a', ['Teacher']);
    session.logout();
    httpMock.expectOne((r) => r.url === '/api/auth/logout' && r.method === 'POST').flush(null);
    expect(store.isAuthenticated()).toBeFalse();
    expect(store.hasSessionHint()).toBeFalse();
  });
});
