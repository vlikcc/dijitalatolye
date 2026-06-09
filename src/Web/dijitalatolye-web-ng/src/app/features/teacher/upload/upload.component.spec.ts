import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { UploadComponent } from './upload.component';
import { AiExtractResponse, BundleUploadResponse, ContentProcessingStatusResponse, MetadataExtractResponse } from '@core/api/contracts';

describe('UploadComponent (Guard-önce upload)', () => {
  let fixture: ComponentFixture<UploadComponent>;
  let component: UploadComponent;
  let http: HttpTestingController;

  const sampleUpload: BundleUploadResponse = {
    contentId: 'content-123',
    versionId: 'v1',
    bucket: 'dijitalatolye-content',
    key: 'u/abc/bundle.zip',
    manifestEntry: 'index.html',
    fileSizeBytes: 12345,
    sha256: 'deadbeef',
    guardScanStatus: null,
    type: 'Game',
  };

  const sampleMetadata: MetadataExtractResponse = {
    bucket: sampleUpload.bucket,
    key: sampleUpload.key,
    manifestEntry: sampleUpload.manifestEntry,
    fileSizeBytes: sampleUpload.fileSizeBytes,
    sha256: sampleUpload.sha256,
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

  const guardClean: ContentProcessingStatusResponse = {
    contentId: 'content-123',
    state: 'Draft',
    guardScanStatus: 'clean',
    guardRejected: false,
    canExtractMetadata: true,
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
    http.expectOne('/api/catalog/subjects').flush([]);
  });

  afterEach(() => {
    for (const req of http.match(() => true)) {
      const url = req.request.url;
      if (url.includes('/catalog/outcomes/by-codes')) {
        req.flush([{ code: 'M.5.1.1.1', description: 'Doğal sayıları okur' }]);
      } else if (url.includes('/catalog/outcomes')) {
        req.flush([
          { code: 'M.5.1.1.1', description: 'Doğal sayıları okur' },
          { code: 'M.5.1.1.2', description: 'Basamak değerini anlar' },
        ]);
      } else if (url.includes('/catalog/subjects')) {
        req.flush([]);
      }
    }
    http.verify();
  });

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

  it('geçerli ZIP: upload → guard poll → metadata → form', fakeAsync(() => {
    const f = new File(['zipbytes'], 'bundle.zip', { type: 'application/zip' });
    (component as any).handleFile(f);

    expect(component.phase()).toBe('uploading');
    http.expectOne('/api/contents/bundle-upload').flush(sampleUpload);
    tick();

    expect(component.phase()).toBe('guardScanning');
    http.expectOne('/api/contents/content-123/processing-status').flush(guardClean);
    tick();

    expect(component.phase()).toBe('extracting');
    http.expectOne('/api/contents/content-123/metadata-extract').flush(sampleMetadata);
    tick();

    expect(component.phase()).toBe('form');
    expect(component.form.value.title).toBe('Doğal Sayılar');
    expect(component.draftContentId()).toBe('content-123');
  }));

  it('submit akışı: metadata PUT → submit', fakeAsync(() => {
    const f = new File(['z'], 'b.zip');
    (component as any).handleFile(f);
    http.expectOne('/api/contents/bundle-upload').flush(sampleUpload);
    tick();
    http.expectOne('/api/contents/content-123/processing-status').flush(guardClean);
    tick();
    http.expectOne('/api/contents/content-123/metadata-extract').flush(sampleMetadata);
    tick();

    const router = TestBed.inject(Router);
    const navSpy = spyOn(router, 'navigate').and.resolveTo(true);

    component.onSubmit();

    const meta = http.expectOne('/api/contents/content-123/metadata');
    expect(meta.request.method).toBe('PUT');
    meta.flush(null);
    tick();

    const submit = http.expectOne('/api/contents/content-123/submit');
    submit.flush({ id: 'content-123', state: 'Submitted' });
    tick();

    expect(navSpy).toHaveBeenCalledWith(['/teacher/contents']);
    expect(component.submitting()).toBeFalse();
  }));

  it('Guard reddi idle fazına döner', fakeAsync(() => {
    const f = new File(['z'], 'b.zip');
    (component as any).handleFile(f);
    http.expectOne('/api/contents/bundle-upload').flush(sampleUpload);
    tick();

    http.expectOne('/api/contents/content-123/processing-status').flush({
      ...guardClean,
      guardScanStatus: 'policy_rejected',
      guardRejected: true,
      canExtractMetadata: false,
    });
    tick();

    expect(component.phase()).toBe('idle');
    expect(component.uploadError()).toContain('Guard');
  }));

  it('ders ve sınıf seçilince katalog kazanımları yüklenir', fakeAsync(() => {
    const f = new File(['z'], 'b.zip');
    (component as any).handleFile(f);
    http.expectOne('/api/contents/bundle-upload').flush(sampleUpload);
    tick();
    http.expectOne('/api/contents/content-123/processing-status').flush(guardClean);
    tick();
    http.expectOne('/api/contents/content-123/metadata-extract').flush(sampleMetadata);
    tick();

    expect(component.canBrowseOutcomes()).toBeTrue();
    expect(component.isAiSuggestedOutcome('M.5.1.1.1')).toBeTrue();

    const byCodesReq = http.expectOne((r) => r.url.includes('/catalog/outcomes/by-codes'));
    byCodesReq.flush([{ code: 'M.5.1.1.1', description: 'Doğal sayıları okur' }]);
    tick();

    const catalogReq = http.expectOne((r) =>
      r.url.includes('/catalog/outcomes') &&
      !r.url.includes('by-codes') &&
      r.params.get('subject') === 'Matematik' &&
      r.params.get('grade') === '5',
    );
    catalogReq.flush([
      { code: 'M.5.1.1.1', description: 'Doğal sayıları okur' },
      { code: 'M.5.1.1.2', description: 'Basamak değerini anlar' },
    ]);
    tick();

    expect(component.selectedCatalogCount()).toBe(1);
    component.toggleOutcomeCatalog();
    expect(component.outcomeCatalogExpanded()).toBeTrue();

    component.toggleOutcome({ code: 'M.5.1.1.2', description: 'Basamak değerini anlar' });
    expect(component.outcomeCodes()).toEqual(['M.5.1.1.1', 'M.5.1.1.2']);
    expect(component.isOutcomeSelected('M.5.1.1.2')).toBeTrue();
  }));
});
