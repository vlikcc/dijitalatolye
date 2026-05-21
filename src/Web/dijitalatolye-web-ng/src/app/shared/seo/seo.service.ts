import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

export interface SeoConfig {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
}

const DEFAULT_TITLE = 'DijitalAtölye';
const DEFAULT_SUFFIX = ' | DijitalAtölye';
const BASE_URL = (typeof window !== 'undefined' && window.location?.origin) || 'https://dijitalatolye.tr';

/**
 * React'taki SeoHead component'inin Angular karşılığı: Title + Meta tag güncelleme.
 * Component'lerden çağırmak için bir servis (helmet benzeri tek tek tag injection yerine
 * Angular'ın native Meta/Title API'leri).
 *
 * Kullanım:
 *   constructor(private seo: SeoService) {}
 *   ngOnInit() { this.seo.update({ title: 'Keşfet', description: '...', path: '/discover' }); }
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  update(cfg: SeoConfig): void {
    const finalTitle = cfg.title ? `${cfg.title}${DEFAULT_SUFFIX}` : DEFAULT_TITLE;
    this.title.setTitle(finalTitle);

    if (cfg.description) {
      this.meta.updateTag({ name: 'description', content: cfg.description });
      this.meta.updateTag({ property: 'og:description', content: cfg.description });
    }
    this.meta.updateTag({ property: 'og:title', content: finalTitle });
    this.meta.updateTag({ property: 'og:type', content: 'website' });

    if (cfg.path) {
      const url = `${BASE_URL}${cfg.path}`;
      this.meta.updateTag({ property: 'og:url', content: url });
      this.setCanonical(url);
    }
    if (cfg.image) {
      this.meta.updateTag({ property: 'og:image', content: cfg.image });
    }
  }

  private setCanonical(url: string): void {
    if (typeof document === 'undefined') return;
    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = url;
  }
}
