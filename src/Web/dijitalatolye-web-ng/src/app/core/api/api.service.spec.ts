import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiService } from './api.service';

describe('ApiService', () => {
  let api: ApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(ApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('GET path /api prefix ile gider', () => {
    api.get('/contents/mine').subscribe();
    const req = http.expectOne('/api/contents/mine');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('leading slash olmadan da çağrılabilir', () => {
    api.get('catalog/subjects').subscribe();
    const req = http.expectOne('/api/catalog/subjects');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('params null/undefined değerleri atlar', () => {
    api.get('/x', { a: 1, b: undefined, c: null, d: 'foo' }).subscribe();
    const req = http.expectOne((r) => r.url === '/api/x');
    expect(req.request.params.get('a')).toBe('1');
    expect(req.request.params.get('d')).toBe('foo');
    expect(req.request.params.has('b')).toBeFalse();
    expect(req.request.params.has('c')).toBeFalse();
    req.flush({});
  });

  it('POST body iletir', () => {
    api.post('/auth/login', { email: 'a', password: 'b' }).subscribe();
    const req = http.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'a', password: 'b' });
    req.flush({});
  });

  it('postFormData multipart isteği gönderir', () => {
    const fd = new FormData();
    fd.append('file', new Blob(['x']), 'bundle.zip');
    api.postFormData('/contents/ai-extract', fd).subscribe();
    const req = http.expectOne('/api/contents/ai-extract');
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBeTrue();
    req.flush({});
  });

  it('PUT/PATCH/DELETE doğru method ile gider', () => {
    api.put('/users/me', { displayName: 'x' }).subscribe();
    http.expectOne((r) => r.method === 'PUT' && r.url === '/api/users/me').flush({});
    api.patch('/x', { a: 1 }).subscribe();
    http.expectOne((r) => r.method === 'PATCH').flush({});
    api.delete('/x/1').subscribe();
    http.expectOne((r) => r.method === 'DELETE').flush({});
  });
});
