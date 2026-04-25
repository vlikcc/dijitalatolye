import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';

interface DashboardStats {
  totalContents: number;
  pendingReview: number;
  publishedToday: number;
  activeEditors: number;
  totalUsers: number;
  llmDailyCostUsd: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<DashboardStats>('/admin/dashboard')
      .then(({ data }) => setStats(data))
      .catch(() =>
        setStats({
          totalContents: 0,
          pendingReview: 0,
          publishedToday: 0,
          activeEditors: 0,
          totalUsers: 0,
          llmDailyCostUsd: 0,
        }),
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="p-6">Yükleniyor…</p>;
  if (!stats) return <p className="p-6">Veri yok.</p>;

  const cards = [
    { label: 'Toplam İçerik', value: stats.totalContents },
    { label: 'İncelemede', value: stats.pendingReview },
    { label: 'Bugün Yayınlanan', value: stats.publishedToday },
    { label: 'Aktif Editör', value: stats.activeEditors },
    { label: 'Kullanıcı', value: stats.totalUsers },
    { label: 'AI Maliyeti (bugün)', value: `$${stats.llmDailyCostUsd.toFixed(2)}` },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Yönetim Paneli</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white border rounded-lg p-5">
            <p className="text-sm text-gray-500">{c.label}</p>
            <p className="text-2xl font-bold mt-2">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4 mt-8">
        <AdminQuickLink href="/admin/contents" label="İçerik Yönetimi" />
        <AdminQuickLink href="/admin/users" label="Kullanıcılar" />
        <AdminQuickLink href="/admin/catalog" label="Müfredat / Kazanım" />
        <AdminQuickLink href="/admin/audit" label="Audit Log" />
        <AdminQuickLink href="/admin/ai" label="AI Konfigürasyon" />
      </div>
    </div>
  );
}

function AdminQuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link to={href} className="block bg-white border rounded-lg p-5 hover:shadow transition">
      <span className="font-medium">{label}</span>
    </Link>
  );
}
