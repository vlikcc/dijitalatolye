import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthStore } from '../auth/auth.store';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let auth: AuthStore;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthStore);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  });

  afterEach(() => httpMock.verify());

  it('token yokken Authorization header eklemez', () => {
    http.get('/api/contents/mine').subscribe();
    const req = httpMock.expectOne('/api/contents/mine');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush([]);
  });

  it('token varsa Bearer header ekler', () => {
    auth.setSession('abc', ['Teacher']);
    http.get('/api/contents/mine').subscribe();
    const req = httpMock.expectOne('/api/contents/mine');
    expect(req.request.headers.get('Authorization')).toBe('Bearer abc');
    req.flush([]);
  });

  it('401 yanıtında çerezle refresh yapar ve isteği yeni token ile tekrar dener', (done) => {
    auth.setSession('old-access', ['Teacher']);
    http.get('/api/contents/mine').subscribe({
      next: (data) => { expect(data).toEqual({ ok: true }); done(); },
    });

    const first = httpMock.expectOne('/api/contents/mine');
    expect(first.request.headers.get('Authorization')).toBe('Bearer old-access');
    first.flush(null, { status: 401, statusText: 'Unauthorized' });

    // Refresh token gövdede gönderilmez; tarayıcı HttpOnly çerezi kendisi ekler
    const refresh = httpMock.expectOne('/api/auth/refresh');
    expect(refresh.request.method).toBe('POST');
    expect(refresh.request.body).toEqual({});
    refresh.flush({ accessToken: 'new-access', roles: ['Teacher'] });

    const retry = httpMock.expectOne('/api/contents/mine');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer new-access');
    retry.flush({ ok: true });
    expect(auth.accessToken()).toBe('new-access');
  });

  it('refresh iki kez başarısız olursa logout edilir ve login sayfasına yönlendirilir', fakeAsync(() => {
    auth.setSession('old', ['Teacher']);
    http.get('/api/x').subscribe({ next: () => undefined, error: () => undefined });

    httpMock.expectOne('/api/x').flush(null, { status: 401, statusText: 'Unauthorized' });
    httpMock.expectOne('/api/auth/refresh').flush(null, { status: 401, statusText: 'Unauthorized' });
    // Sekmeler arası rotasyon yarışı için bir kez daha denenir
    tick(400);
    httpMock.expectOne('/api/auth/refresh').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(auth.isAuthenticated()).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: '/' } });
  }));

  it('login 401 (hatalı şifre) için refresh denenmez', () => {
    auth.setSession('a', ['Teacher']);
    http.post('/api/auth/login', {}).subscribe({ error: () => undefined });
    httpMock.expectOne('/api/auth/login').flush(null, { status: 401, statusText: 'Unauthorized' });
    httpMock.expectNone('/api/auth/refresh');
  });

  it('oturumu olmayan ziyaretçinin 401 almasında refresh denenmez', () => {
    http.get('/api/x').subscribe({ error: () => undefined });
    httpMock.expectOne('/api/x').flush(null, { status: 401, statusText: 'Unauthorized' });
    httpMock.expectNone('/api/auth/refresh');
  });
});
