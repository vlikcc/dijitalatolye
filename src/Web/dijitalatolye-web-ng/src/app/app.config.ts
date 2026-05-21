import { ApplicationConfig, ErrorHandler, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { GlobalErrorHandler } from './shared/error-handler/global-error.handler';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideTranslateService, TranslateModule } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { APP_ROUTES } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      APP_ROUTES,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }),
    ),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideAnimations(),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideTranslateService({ defaultLanguage: 'tr' }),
    provideTranslateHttpLoader({ prefix: '/assets/i18n/', suffix: '.json' }),
    importProvidersFrom(TranslateModule),
  ],
};
