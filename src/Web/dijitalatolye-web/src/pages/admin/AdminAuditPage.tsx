import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface AuditEntry {
  id: string;
  occurredAt: string;
  serviceName: string;
  userId?: string | null;
  userName?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  ipAddress?: string | null;
  severity: string;
  payloadJson?: string | null;
}

interface AuditList {
  total: number;
  page: number;
  pageSize: number;
  items: AuditEntry[];
}

const SEVERITY_COLORS: Record<string, string> = {
  Info: 'bg-blue-50 text-blue-700',
  Warning: 'bg-amber-50 text-amber-700',
  Error: 'bg-red-50 text-red-700',
  Critical: 'bg-red-100 text-red-900',
};

export default function AdminAuditPage() {
  const [data, setData] = useState<AuditList | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState('');
  const [severity, setSeverity] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), pageSize: '50' });
    if (action) params.set('action', action);
    if (severity) params.set('severity', severity);
    api
      .get<AuditList>(`/admin/audit?${params.toString()}`)
      .then(({ data }) => setData(data))
      .catch(() => setData({ total: 0, page: 1, pageSize: 50, items: [] }))
      .finally(() => setLoading(false));
  }, [action, severity, page]);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Audit Log</h1>

      <div className="flex gap-3 mb-4">
        <input
          className="border rounded px-3 py-2"
          placeholder="Eylem (ör. content.published)"
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setPage(1);
          }}
        />
        <select
          className="border rounded px-3 py-2"
          value={severity}
          onChange={(e) => {
            setSeverity(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Tum Seviyeler</option>
          <option value="Info">Info</option>
          <option value="Warning">Warning</option>
          <option value="Error">Error</option>
          <option value="Critical">Critical</option>
        </select>
      </div>

      {loading ? (
        <p>Yukleniyor...</p>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left">
                <th className="p-3">Zaman</th>
                <th className="p-3">Servis</th>
                <th className="p-3">Eylem</th>
                <th className="p-3">Kullanici</th>
                <th className="p-3">Entity</th>
                <th className="p-3">IP</th>
                <th className="p-3">Seviye</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((e) => (
                <tr key={e.id} className="border-t">
                  <td className="p-3 whitespace-nowrap text-gray-500">
                    {new Date(e.occurredAt).toLocaleString('tr-TR')}
                  </td>
                  <td className="p-3">{e.serviceName}</td>
                  <td className="p-3 font-mono text-xs">{e.action}</td>
                  <td className="p-3">{e.userName ?? e.userId?.slice(0, 8) ?? '-'}</td>
                  <td className="p-3 text-xs">
                    {e.entityType ? `${e.entityType}/${e.entityId?.slice(0, 8) ?? ''}` : '-'}
                  </td>
                  <td className="p-3 text-xs">{e.ipAddress ?? '-'}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        SEVERITY_COLORS[e.severity] ?? 'bg-gray-100'
                      }`}
                    >
                      {e.severity}
                    </span>
                  </td>
                </tr>
              ))}
              {data && data.items.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-500">
                    Kayit bulunamadi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {data && (
            <div className="flex items-center justify-between p-3 border-t bg-gray-50 text-sm">
              <span>
                Toplam: {data.total} | Sayfa: {data.page}
              </span>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 border rounded disabled:opacity-50"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Onceki
                </button>
                <button
                  className="px-3 py-1 border rounded disabled:opacity-50"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={data.items.length < data.pageSize}
                >
                  Sonraki
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
