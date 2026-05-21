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
      <h1 class="text-2xl font-bold mb-4 text-slate-900">İnceleme Kuyruğu</h1>
      @if (loading()) { <p class="text-slate-500">Yükleniyor...</p> }
      @else {
        <div class="bg-white border border-slate-200 rounded divide-y divide-slate-100">
          @for (item of items(); track item.id) {
            <a [routerLink]="['/editor/review', item.id]"
              class="flex items-center justify-between px-4 py-3 hover:bg-slate-50">
              <div>
                <p class="font-medium text-slate-900">{{ item.title }}</p>
                <p class="text-xs text-slate-500">AI: {{ item.aiDecision }} · skor {{ item.aiScore }} · öncelik {{ item.priority }}</p>
              </div>
              <span class="text-xs text-slate-400">{{ formatDate(item.enqueuedAtUtc) }}</span>
            </a>
          }
          @if (items().length === 0) {
            <p class="px-4 py-6 text-slate-500 text-sm">Kuyruk boş.</p>
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
