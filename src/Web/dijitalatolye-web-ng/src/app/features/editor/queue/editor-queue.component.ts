import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '@core/api/api.service';

interface QueueItem {
  id: string; contentId: string; versionId: string; title: string;
  aiScore: number; aiDecision: string; status: string; priority: number; enqueuedAtUtc: string;
}

@Component({
  selector: 'da-editor-queue',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h1 class="text-2xl font-bold mb-4 text-ink">İnceleme Kuyruğu</h1>
      @if (loading()) { <p class="text-dim">Yükleniyor...</p> }
      @else {
        <div class="bg-surface border border-line/10 rounded divide-y divide-line/10">
          @for (item of items(); track item.id) {
            <a [routerLink]="['/editor/review', item.id]"
              class="flex items-center justify-between px-4 py-3 hover:bg-panel">
              <div>
                <p class="font-medium text-ink">{{ item.title }}</p>
                <p class="text-xs text-dim">AI: {{ item.aiDecision }} · skor {{ item.aiScore }} · öncelik {{ item.priority }}</p>
              </div>
              <span class="text-xs text-dim">{{ formatDate(item.enqueuedAtUtc) }}</span>
            </a>
          }
          @if (items().length === 0) {
            <p class="px-4 py-6 text-dim text-sm">Kuyruk boş.</p>
          }
        </div>
      }
    </section>
  `,
})
export class EditorQueueComponent implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  readonly items = signal<QueueItem[]>([]);
  readonly loading = signal(true);
  private timer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.load();
    this.timer = setInterval(() => this.load(), 5000);
  }
  ngOnDestroy(): void { if (this.timer) clearInterval(this.timer); }

  private load(): void {
    this.api.get<QueueItem[]>('/review/queue').subscribe({
      next: (data) => { this.items.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  formatDate(iso: string): string { return new Date(iso).toLocaleString('tr-TR'); }
}
