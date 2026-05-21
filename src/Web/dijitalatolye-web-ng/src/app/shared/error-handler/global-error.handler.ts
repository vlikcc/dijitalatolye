import { ErrorHandler, Injectable, NgZone, inject } from '@angular/core';

/**
 * React'taki ErrorBoundary'nin Angular karşılığı.
 * Yakalanmamış component hatalarını konsola logger, geliştirme/üretim'de hatayı
 * sessiz yutmaz — uygulamayı çökertir veya raporlama servisine iletir.
 *
 * Kullanım: app.config.ts içinde
 *   providers: [{ provide: ErrorHandler, useClass: GlobalErrorHandler }]
 */
@Injectable({ providedIn: 'root' })
export class GlobalErrorHandler implements ErrorHandler {
  private readonly zone = inject(NgZone);

  handleError(error: unknown): void {
    // Üretimde Sentry/AppInsights vb. SDK çağrısı buraya eklenir.
    this.zone.run(() => {
      // eslint-disable-next-line no-console
      console.error('[GlobalErrorHandler]', error);
    });
  }
}
