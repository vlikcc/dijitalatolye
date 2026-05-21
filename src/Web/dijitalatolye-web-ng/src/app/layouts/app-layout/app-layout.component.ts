import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { AuthStore } from '@core/auth/auth.store';

@Component({
  selector: 'da-app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule, MatMenuModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`:host { display: block; min-height: 100%; }`],
  template: `
    <div class="min-h-full flex flex-col bg-slate-50">
      <header class="bg-white border-b border-brand-100/70 sticky top-0 z-30">
        <div class="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <a routerLink="/" class="flex items-center gap-2 font-bold text-brand-700 shrink-0">
            <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white">
              <mat-icon class="!text-white" style="font-size:16px;width:16px;height:16px">auto_awesome</mat-icon>
            </span>
            <span class="hidden sm:inline">DijitalAtölye</span>
          </a>

          <nav class="flex items-center gap-1 overflow-x-auto">
            @if (isTeacher()) {
              <a routerLink="/teacher/dashboard" routerLinkActive="bg-brand-100 !text-brand-700"
                 class="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-brand-700 hover:bg-brand-50 transition">Panel</a>
              <a routerLink="/teacher/contents" routerLinkActive="bg-brand-100 !text-brand-700"
                 class="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-brand-700 hover:bg-brand-50 transition">İçeriklerim</a>
              <a routerLink="/teacher/contents/new" routerLinkActive="bg-brand-100 !text-brand-700"
                 class="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-brand-700 hover:bg-brand-50 transition">Yükle</a>
            }
            @if (isEditor()) {
              <a routerLink="/editor" routerLinkActive="bg-brand-100 !text-brand-700" [routerLinkActiveOptions]="{ exact: true }"
                 class="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-brand-700 hover:bg-brand-50 transition">Editör</a>
              <a routerLink="/editor/queue" routerLinkActive="bg-brand-100 !text-brand-700"
                 class="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-brand-700 hover:bg-brand-50 transition">Kuyruk</a>
            }
            @if (isAdmin()) {
              <a routerLink="/admin" routerLinkActive="bg-brand-100 !text-brand-700" [routerLinkActiveOptions]="{ exact: true }"
                 class="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-brand-700 hover:bg-brand-50 transition">Yönetim</a>
            }
          </nav>

          <div class="flex items-center gap-2 shrink-0">
            <a routerLink="/notifications" routerLinkActive="bg-brand-100 !text-brand-700"
               class="inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-600 hover:bg-brand-50 hover:text-brand-700 transition"
               aria-label="Bildirimler">
              <mat-icon style="font-size:18px;width:18px;height:18px">notifications</mat-icon>
            </a>

            <button mat-button [matMenuTriggerFor]="userMenu" class="inline-flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-brand-50 text-slate-700">
              <div class="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white text-xs font-bold flex items-center justify-center">
                {{ initial() }}
              </div>
              <span class="hidden md:inline text-sm">{{ email() }}</span>
              <mat-icon style="font-size:14px;width:14px;height:14px">expand_more</mat-icon>
            </button>
            <mat-menu #userMenu="matMenu">
              <div class="px-4 py-3 border-b border-slate-100" style="min-width:220px">
                <p class="text-xs text-slate-500">Giriş yapan</p>
                <p class="text-sm font-medium text-slate-900 truncate">{{ email() }}</p>
                <p class="text-xs text-slate-500 mt-0.5">{{ rolesLabel() }}</p>
              </div>
              @if (isTeacher()) {
                <a mat-menu-item routerLink="/teacher/profile">Profilim</a>
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
  readonly initial = computed(() => (this.auth.email() ?? '?').charAt(0).toUpperCase());
  readonly rolesLabel = computed(() => this.auth.roles().join(', ') || '—');

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
