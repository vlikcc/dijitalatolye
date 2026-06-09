import { ChangeDetectionStrategy, Component, Input, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'da-share-tools',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="inline-flex items-center gap-1.5">
      <button type="button" (click)="share()" title="Paylaş"
        class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-line/15 text-muted hover:text-brand-700 hover:border-brand-300 transition text-xs">
        <mat-icon style="font-size:14px;width:14px;height:14px">share</mat-icon> Paylaş
      </button>
      <button type="button" (click)="copy()" [title]="copied() ? 'Kopyalandı' : 'Bağlantıyı kopyala'"
        class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-line/15 text-muted hover:text-brand-700 hover:border-brand-300 transition text-xs">
        @if (copied()) {
          <mat-icon class="!text-emerald-600" style="font-size:14px;width:14px;height:14px">check</mat-icon> Kopyalandı
        } @else {
          <mat-icon style="font-size:14px;width:14px;height:14px">link</mat-icon> Kopyala
        }
      </button>
      <a [href]="twitterUrl()" target="_blank" rel="noreferrer" title="X'te paylaş"
        class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-line/15 text-muted hover:text-brand-700 hover:border-brand-300 transition text-xs">
        <mat-icon style="font-size:14px;width:14px;height:14px">close</mat-icon> X
      </a>
    </div>
  `,
})
export class ShareToolsComponent {
  @Input() url = '';
  @Input() title = '';

  readonly copied = signal(false);

  share(): void {
    const data: ShareData = { title: this.title, url: this.url || window.location.href };
    if (navigator.share) {
      navigator.share(data).catch(() => undefined);
    } else {
      this.copy();
    }
  }

  copy(): void {
    const url = this.url || window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1800);
    }).catch(() => undefined);
  }

  twitterUrl(): string {
    const u = encodeURIComponent(this.url || window.location.href);
    const t = encodeURIComponent(this.title);
    return `https://twitter.com/intent/tweet?url=${u}&text=${t}`;
  }
}
