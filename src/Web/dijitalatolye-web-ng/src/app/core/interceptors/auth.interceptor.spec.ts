import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';
import { AuthStore } from '../auth/auth.store';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let auth: AuthStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthStore);
  });

  afterEach(() => httpMock.verify());

  it('token yokken Authorization header eklemez', () => {
    http.get('/api/contents/mine').subscribe();
    const req = httpMock.expectOne('/api/contents/mine');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush([]);
  });

  it('token varsa Bearer header ekler', () => {
    auth.setTokens('abc', 'r');
    http.get('/api/contents/mine').subscribe();
    const req = httpMock.expectOne('/api/contents/mine');
    expect(req.request.headers.get('Authorization')).toBe('Bearer abc');
    req.flush([]);
  });

  it('401 yanıtında refresh akışı çalışır ve isteği yeni token ile tekrar dener', (done) => {
    auth.setTokens('old-access', 'good-refresh');
    http.get('/api/contents/mine').subscribe({
      next: (data) => { expect(data).toEqual({ ok: true }); done(); },
    });

    const first = httpMock.expectOne('/api/contents/mine');
    expect(first.request.headers.get('Authorization')).toBe('Bearer old-access');
    first.flush(null, { status: 401, statusText: 'Unauthorized' });

    const refresh = httpMock.expectOne('/api/auth/refresh');
    expect(refresh.request.method).toBe('POST');
    expect(refresh.request.body).toEqual({ refreshToken: 'good-refresh' });
    refresh.flush({ accessToken: 'new-access', refreshToken: 'new-refresh' });

    const retry = httpMock.expectOne('/api/contents/mine');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer new-access');
    retry.flush({ ok: true });
  });

  it('refresh endpoint kendisi 401 alırsa logout edilir', () => {
    auth.setTokens('old', 'bad');
    http.get('/api/x').subscribe({ next: () => undefined, error: () => undefined });

    httpMock.expectOne('/api/x').flush(null, { status: 401, statusText: 'Unauthorized' });
    const refresh = httpMock.expectOne('/api/auth/refresh');
    refresh.flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(auth.isAuthenticated()).toBeFalse();
  });
});
