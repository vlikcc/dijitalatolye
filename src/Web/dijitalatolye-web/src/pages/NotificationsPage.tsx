import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Notification {
  id: string;
  title: string;
  body: string;
  url?: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await api.get<Notification[]>('/notifications');
    setItems(data);
    setLoading(false);
  }

  async function markRead(id: string) {
    await api.post(`/notifications/${id}/read`);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  }

  useEffect(() => {
    void load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Bildirimler</h1>
      {loading && <p>Yükleniyor…</p>}
      {!loading && items.length === 0 && <p className="text-gray-500">Bildirim yok.</p>}
      <ul className="space-y-2">
        {items.map((n) => (
          <li
            key={n.id}
            className={`p-4 border rounded ${n.isRead ? 'bg-white' : 'bg-blue-50 border-blue-200'}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{n.title}</p>
                <p className="text-sm text-gray-600 mt-1">{n.body}</p>
                {n.url && (
                  <a href={n.url} className="text-blue-600 text-sm mt-2 inline-block">
                    Aç →
                  </a>
                )}
              </div>
              <div className="flex flex-col items-end gap-2 ml-3">
                <span className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleString('tr-TR')}</span>
                {!n.isRead && (
                  <button onClick={() => markRead(n.id)} className="text-xs text-blue-600">
                    Okundu işaretle
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
