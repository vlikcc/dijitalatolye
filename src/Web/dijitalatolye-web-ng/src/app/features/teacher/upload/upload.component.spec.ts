import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { UploadComponent } from './upload.component';
import { AiExtractResponse } from '@core/api/contracts';

describe('UploadComponent (AI destekli upload)', () => {
  let fixture: ComponentFixture<UploadComponent>;
  let component: UploadComponent;
  let http: HttpTestingController;

  const sampleExtract: AiExtractResponse = {
    bucket: 'dijitalatolye-content',
    key: 'u/abc/bundle.zip',
    manifestEntry: 'index.html',
    fileSizeBytes: 12345,
    sha256: 'deadbeef',
    filesScanned: 3,
    metadata: {
      title: 'Doğal Sayılar',
      description: 'Basamak değeri etkinliği',
      subject: 'Matematik',
      gradeLevel: 5,
      durationMinutes: 25,
      difficulty: 'Easy',
      outcomeCodes: ['M.5.1.1.1'],
      tags: ['matematik', 'doğal sayılar'],
      confidence: 0.82,
      candidateOutcomeCount: 2,
      rawDraftResponse: null,
      rawOutcomesResponse: null,
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [UploadComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimations(),
      ],
    });
    fixture = TestBed.createComponent(UploadComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('idle fazıyla başlar', () => {
    expect(component.phase()).toBe('idle');
    expect(component.extraction()).toBeNull();
  });

  it('izin verilmeyen uzantı reddedilir', () => {
    const f = new File(['x'], 'evil.exe', { type: 'application/octet-stream' });
    (component as any).handleFile(f);
    expect(component.phase()).toBe('idle');
    expect(component.uploadError()).toContain('Sadece');
  });

  it('50 MB üstü dosya reddedilir', () => {
    const big = new File([new Uint8Array(51 * 1024 * 1024)], 'big.zip', { type: 'application/zip' });
    (component as any).handleFile(big);
    expect(component.uploadError()).toContain('50 MB');
  });

  it('geçerli ZIP yüklendiğinde extracting → form fazına geçer', () => {
    const f = new File(['zipbytes'], 'bundle.zip', { type: 'application/zip' });
    (component as any).handleFile(f);

    expect(component.phase()).toBe('extracting');
    const req = http.expectOne('/api/contents/ai-extract');
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBeTrue();
    req.flush(sampleExtract);

    expect(component.phase()).toBe('form');
    expect(component.extraction()?.key).toBe('u/abc/bundle.zip');
    expect(component.form.value.title).toBe('Doğal Sayılar');
    expect(component.form.value.subject).toBe('Matematik');
    expect(component.outcomeCodes()).toEqual(['M.5.1.1.1']);
    expect(component.tags()).toEqual(['matematik', 'doğal sayılar']);
    expect(component.confidencePct()).toBe(82);
  });

  it('AI fill sonrası rozet "AI Önerisi" gösterir; manuel edit sonrası "Manuel"e döner', () => {
    const f = new File(['z'], 'b.zip');
    (component as any).handleFile(f);
    http.expectOne('/api/contents/ai-extract').flush(sampleExtract);

    expect(component.badgeLabel('title')).toBe('AI Önerisi');
    component.markManual('title');
    expect(component.badgeLabel('title')).toBe('Manuel');
  });

  it('extract başarısız olursa idle fazına geri döner ve hata gösterir', () => {
    const f = new File(['z'], 'b.zip');
    (component as any).handleFile(f);
    http.expectOne('/api/contents/ai-extract')
      .flush({ error: 'Sadece .zip, .html veya .htm yüklenebilir.' }, { status: 400, statusText: 'Bad Request' });

    expect(component.phase()).toBe('idle');
    expect(component.uploadError()).toContain('Sadece');
  });

  it('submit akışı: create → version → submit zinciri sırayla çağrılır', fakeAsync(() => {
    const f = new File(['z'], 'b.zip');
    (component as any).handleFile(f);
    http.expectOne('/api/contents/ai-extract').flush(sampleExtract);

    const router = TestBed.inject(Router);
    const navSpy = spyOn(router, 'navigate').and.resolveTo(true);

    component.onSubmit();

    const create = http.expectOne('/api/contents');
    expect(create.request.method).toBe('POST');
    expect(create.request.body.title).toBe('Doğal Sayılar');
    create.flush({ id: 'content-123' });
    tick();

    const version = http.expectOne('/api/contents/content-123/versions');
    expect(version.request.body.bucket).toBe('dijitalatolye-content');
    expect(version.request.body.key).toBe('u/abc/bundle.zip');
    version.flush({ id: 'v1' });
    tick();

    const submit = http.expectOne('/api/contents/content-123/submit');
    submit.flush({ id: 'content-123', state: 'Submitted' });
    tick();

    expect(navSpy).toHaveBeenCalledWith(['/teacher/contents']);
    expect(component.submitting()).toBeFalse();
  }));

  it('reset() formu ve faz state\'ini temizler', () => {
    const f = new File(['z'], 'b.zip');
    (component as any).handleFile(f);
    http.expectOne('/api/contents/ai-extract').flush(sampleExtract);
    expect(component.phase()).toBe('form');

    component.reset();
    expect(component.phase()).toBe('idle');
    expect(component.extraction()).toBeNull();
    expect(component.tags()).toEqual([]);
    expect(component.outcomeCodes()).toEqual([]);
  });
});
