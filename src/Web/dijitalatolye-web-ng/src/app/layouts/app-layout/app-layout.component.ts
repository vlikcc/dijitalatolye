import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { AuthStore } from '@core/auth/auth.store';

type Theme = 'light' | 'dark';

@Component({
  selector: 'da-app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule, MatMenuModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`:host { display: block; min-height: 100%; }`],
  template: `
    <div class="min-h-full flex flex-col bg-bg text-ink">
      <header class="bg-bg/80 backdrop-blur-xl border-b border-line/10 sticky top-0 z-30">
        <div class="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <a routerLink="/" class="flex items-center gap-2 font-display font-bold text-ink shrink-0">
            <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent2 text-white shadow-lg shadow-accent/25">
              <mat-icon class="!text-white" style="font-size:16px;width:16px;height:16px">sports_esports</mat-icon>
            </span>
            <span class="hidden sm:inline">Dijital<span class="text-accent">Atölye</span></span>
          </a>

          <nav class="flex items-center gap-1 overflow-x-auto">
            @if (isTeacher()) {
              <a routerLink="/teacher/dashboard" routerLinkActive="!bg-accent/10 !text-accent"
                 class="px-3 py-1.5 rounded-lg text-sm font-medium text-muted hover:text-accent hover:bg-accent/5 transition">Panel</a>
              <a routerLink="/teacher/contents" routerLinkActive="!bg-accent/10 !text-accent"
                 class="px-3 py-1.5 rounded-lg text-sm font-medium text-muted hover:text-accent hover:bg-accent/5 transition">İçeriklerim</a>
              <a routerLink="/teacher/contents/new" routerLinkActive="!bg-accent/10 !text-accent"
                 class="px-3 py-1.5 rounded-lg text-sm font-medium text-muted hover:text-accent hover:bg-accent/5 transition">Yükle</a>
              <a routerLink="/teacher/assignments" routerLinkActive="!bg-accent/10 !text-accent"
                 class="px-3 py-1.5 rounded-lg text-sm font-medium text-muted hover:text-accent hover:bg-accent/5 transition">Ödevler</a>
              <a routerLink="/teacher/classes" routerLinkActive="!bg-accent/10 !text-accent"
                 class="px-3 py-1.5 rounded-lg text-sm font-medium text-muted hover:text-accent hover:bg-accent/5 transition">Sınıflarım</a>
            }
            @if (isEditor()) {
              <a routerLink="/editor" routerLinkActive="!bg-accent/10 !text-accent" [routerLinkActiveOptions]="{ exact: true }"
                 class="px-3 py-1.5 rounded-lg text-sm font-medium text-muted hover:text-accent hover:bg-accent/5 transition">Editör</a>
              <a routerLink="/editor/queue" routerLinkActive="!bg-accent/10 !text-accent"
                 class="px-3 py-1.5 rounded-lg text-sm font-medium text-muted hover:text-accent hover:bg-accent/5 transition">Kuyruk</a>
            }
            @if (isAdmin()) {
              <a routerLink="/admin" routerLinkActive="!bg-accent/10 !text-accent" [routerLinkActiveOptions]="{ exact: true }"
                 class="px-3 py-1.5 rounded-lg text-sm font-medium text-muted hover:text-accent hover:bg-accent/5 transition">Yönetim</a>
            }
            @if (isStudent()) {
              <a routerLink="/assignments" routerLinkActive="!bg-accent/10 !text-accent"
                 class="px-3 py-1.5 rounded-lg text-sm font-medium text-muted hover:text-accent hover:bg-accent/5 transition">Ödevlerim</a>
              <a routerLink="/progress" routerLinkActive="!bg-accent/10 !text-accent"
                 class="px-3 py-1.5 rounded-lg text-sm font-medium text-muted hover:text-accent hover:bg-accent/5 transition">İlerlemem</a>
            }
          </nav>

          <div class="flex items-center gap-2 shrink-0">
            <button type="button" (click)="toggleTheme()"
              class="inline-flex items-center justify-center w-9 h-9 rounded-lg text-muted hover:bg-accent/5 hover:text-accent transition"
              [attr.aria-label]="theme() === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç'">
              <mat-icon style="font-size:18px;width:18px;height:18px">{{ theme() === 'dark' ? 'light_mode' : 'dark_mode' }}</mat-icon>
            </button>
            <a routerLink="/notifications" routerLinkActive="!bg-accent/10 !text-accent"
               class="inline-flex items-center justify-center w-9 h-9 rounded-lg text-muted hover:bg-accent/5 hover:text-accent transition"
               aria-label="Bildirimler">
              <mat-icon style="font-size:18px;width:18px;height:18px">notifications</mat-icon>
            </a>

            <button mat-button [matMenuTriggerFor]="userMenu" class="inline-flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent/5 text-ink">
              <div class="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-accent2 text-white text-xs font-bold flex items-center justify-center">
                {{ initial() }}
              </div>
              <span class="hidden md:inline text-sm">{{ email() }}</span>
              <mat-icon style="font-size:14px;width:14px;height:14px">expand_more</mat-icon>
            </button>
            <mat-menu #userMenu="matMenu">
              <div class="px-4 py-3 border-b border-line/10" style="min-width:220px">
                <p class="text-xs text-dim">Giriş yapan</p>
                <p class="text-sm font-medium text-ink truncate">{{ email() }}</p>
                <p class="text-xs text-dim mt-0.5">{{ rolesLabel() }}</p>
              </div>
              @if (isTeacher()) {
                <a mat-menu-item routerLink="/teacher/profile">Profilim</a>
              }
              @if (isStudent()) {
                <a mat-menu-item routerLink="/progress">İlerlemem</a>
              }
              @if (isAdmin()) {
                <a mat-menu-item routerLink="/admin/reports">Raporlar</a>
              }
              <button mat-menu-item (click)="logout()" class="!text-rose-700">
                <mat-icon class="!text-rose-700">logout</mat-icon>
                <span>Çıkış</span>
              </button>
            </mat-menu>
          </div>
        </div>
      </header>
      <main class="flex-1 max-w-7xl w-full mx-auto px-4 py-6"><router-outlet /></main>
    </div>
  `,
})
export class AppLayoutComponent {
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  readonly email = this.auth.email;
  readonly isAdmin = this.auth.isAdmin;
  readonly isEditor = this.auth.isEditor;
  readonly isTeacher = this.auth.isTeacher;
  readonly isStudent = this.auth.isStudent;
  readonly initial = computed(() => (this.auth.email() ?? '?').charAt(0).toUpperCase());
  readonly rolesLabel = computed(() => this.auth.roles().join(', ') || '—');

  readonly theme = signal<Theme>(this.readTheme());

  private readTheme(): Theme {
    if (typeof document === 'undefined') return 'light';
    return (document.documentElement.getAttribute('data-theme') as Theme) || 'light';
  }

  toggleTheme(): void {
    const next: Theme = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('da-theme', next); } catch { /* yoksay */ }
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
