import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

// AI Oyun Stüdyosu (Content.API /contents/studio) kontratları.

export type StudioKeySource = 'Platform' | 'User';
export type StudioTurnStatus = 'Queued' | 'Running' | 'Succeeded' | 'Failed';

export interface StudioModel { id: string; label: string; description: string; }

export interface StudioModelsResponse {
  models: StudioModel[];
  defaultModel: string;
  platformKeyConfigured: boolean;
  hasUserKey: boolean;
  userKeyLast4?: string | null;
  dailyLimit: number;
  usedToday: number;
}

export interface StudioCredential { hasKey: boolean; last4?: string | null; updatedAtUtc?: string | null; }

export interface StudioTurn {
  id: string;
  seq: number;
  userPrompt: string;
  status: StudioTurnStatus;
  model: string;
  keySource: StudioKeySource;
  changeSummary?: string | null;
  error?: string | null;
  progressChars: number;
  promptTokens: number;
  completionTokens: number;
  previewUrl?: string | null;
  createdAtUtc: string;
  startedAtUtc?: string | null;
  completedAtUtc?: string | null;
}

export interface StudioSessionSummary {
  id: string;
  title: string;
  model: string;
  contentId?: string | null;
  latestStatus?: StudioTurnStatus | null;
  previewUrl?: string | null;
  updatedAtUtc: string;
  turnCount: number;
}

export interface StudioSessionDetail {
  id: string;
  title: string;
  idea: string;
  subjects: string[];
  gradeLevels: number[];
  outcomeCodes: string[];
  model: string;
  keySource: StudioKeySource;
  selectedTurnId?: string | null;
  contentId?: string | null;
  createdAtUtc: string;
  updatedAtUtc: string;
  turns: StudioTurn[];
}

export interface CreateStudioSessionRequest {
  title: string;
  idea: string;
  subjects: string[];
  gradeLevels: number[];
  outcomeCodes: string[];
  model: string;
  keySource: StudioKeySource;
}

export interface CreateStudioTurnRequest { prompt: string; model?: string | null; keySource?: StudioKeySource | null; }

/** Backend `{ error: "..." }` gövdesinden kullanıcıya gösterilecek mesajı çıkarır. */
export function studioErrorMessage(e: unknown, fallback = 'İşlem başarısız.'): string {
  const body = (e as { error?: { error?: string; detail?: string; title?: string } | string })?.error;
  if (typeof body === 'string' && body.trim()) return body;
  if (body && typeof body === 'object') return body.error ?? body.detail ?? body.title ?? fallback;
  if ((e as { status?: number })?.status === 429) return 'Çok fazla istek. Biraz bekleyip tekrar deneyin.';
  return fallback;
}

export function isTurnActive(t: StudioTurn): boolean {
  return t.status === 'Queued' || t.status === 'Running';
}

@Injectable({ providedIn: 'root' })
export class StudioService {
  private readonly api = inject(ApiService);
  private readonly base = '/contents/studio';

  models(): Observable<StudioModelsResponse> { return this.api.get(`${this.base}/models`); }

  credential(): Observable<StudioCredential> { return this.api.get(`${this.base}/credential`); }
  saveCredential(apiKey: string): Observable<StudioCredential> { return this.api.put(`${this.base}/credential`, { apiKey }); }
  deleteCredential(): Observable<void> { return this.api.delete(`${this.base}/credential`); }

  sessions(): Observable<StudioSessionSummary[]> { return this.api.get(`${this.base}/sessions`); }
  session(id: string): Observable<StudioSessionDetail> { return this.api.get(`${this.base}/sessions/${id}`); }
  createSession(body: CreateStudioSessionRequest): Observable<StudioSessionDetail> {
    return this.api.post(`${this.base}/sessions`, body);
  }
  deleteSession(id: string): Observable<void> { return this.api.delete(`${this.base}/sessions/${id}`); }

  addTurn(sessionId: string, body: CreateStudioTurnRequest): Observable<StudioTurn> {
    return this.api.post(`${this.base}/sessions/${sessionId}/turns`, body);
  }
  selectTurn(sessionId: string, turnId: string): Observable<void> {
    return this.api.post(`${this.base}/sessions/${sessionId}/turns/${turnId}/select`, {});
  }
  submit(sessionId: string): Observable<{ contentId: string }> {
    return this.api.post(`${this.base}/sessions/${sessionId}/submit`, {});
  }
}
