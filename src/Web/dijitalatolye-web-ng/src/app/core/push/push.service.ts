import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '@core/api/api.service';

/** Tarayıcı web-push abonelik yönetimi (VAPID). SW yalnızca kullanıcı etkinleştirince kaydedilir. */
@Injectable({ providedIn: 'root' })
export class PushService {
  private readonly api = inject(ApiService);

  readonly supported = signal(this.isSupported());
  readonly enabled = signal(false);
  readonly busy = signal(false);

  private isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serviceWorker' in navigator
      && typeof window !== 'undefined' && 'PushManager' in window && 'Notification' in window;
  }

  /** Mevcut abonelik durumunu kontrol eder (uygulama açılışında çağrılabilir). */
  async refresh(): Promise<void> {
    if (!this.supported()) return;
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw-push.js');
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      this.enabled.set(!!sub);
    } catch { /* yoksay */ }
  }

  async enable(): Promise<boolean> {
    if (!this.supported() || this.busy()) return false;
    this.busy.set(true);
    try {
      const { publicKey, enabled } = await firstValueFrom(
        this.api.get<{ publicKey: string; enabled: boolean }>('/notifications/push/public-key'));
      if (!enabled || !publicKey) return false;

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return false;

      const reg = await navigator.serviceWorker.register('/sw-push.js');
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const json = sub.toJSON();
      await firstValueFrom(this.api.post('/notifications/push/subscribe', {
        endpoint: sub.endpoint,
        p256dh: json.keys?.['p256dh'],
        auth: json.keys?.['auth'],
      }));
      this.enabled.set(true);
      return true;
    } catch {
      return false;
    } finally {
      this.busy.set(false);
    }
  }

  async disable(): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw-push.js');
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub) {
        await firstValueFrom(this.api.post('/notifications/push/unsubscribe', { endpoint: sub.endpoint }));
        await sub.unsubscribe();
      }
      this.enabled.set(false);
    } catch { /* yoksay */ } finally {
      this.busy.set(false);
    }
  }
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const buffer = new ArrayBuffer(raw.length);
  const out = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
