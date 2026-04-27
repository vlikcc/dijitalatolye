import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';

interface UserRow {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
  isVerified: boolean;
  mebVerified: boolean;
  createdAt: string;
}

type RoleFilter = 'all' | 'Teacher' | 'Editor' | 'Student';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (roleFilter !== 'all') params.set('role', roleFilter);
    api
      .get<UserRow[]>(`/admin/users${params.toString() ? `?${params}` : ''}`)
      .then(({ data }) => setUsers(data))
      .catch((e) => {
        setUsers([]);
        setError(
          e?.response?.status === 403
            ? 'Bu sayfa için Admin yetkisi gerekli.'
            : 'Kullanıcılar yüklenemedi.',
        );
      })
      .finally(() => setLoading(false));
  }, [q, roleFilter, reloadKey]);

  const onToggleEditor = async (u: UserRow) => {
    const isEditor = u.roles.includes('Editor');
    const action = isEditor ? 'revoke' : 'grant';
    const confirmMsg = isEditor
      ? `${u.email} kullanıcısının Editör yetkisini kaldırmak istediğinize emin misiniz?`
      : `${u.email} kullanıcısına Editör yetkisi vermek istediğinize emin misiniz?`;
    if (!window.confirm(confirmMsg)) return;

    setPendingId(u.id);
    setError(null);
    try {
      await api.post(`/admin/users/${u.id}/roles/${action}`, { role: 'Editor' });
      setReloadKey((k) => k + 1);
    } catch (e: unknown) {
      const detail =
        (e as { response?: { data?: { detail?: string; title?: string } } })?.response?.data;
      setError(detail?.detail || detail?.title || 'İşlem başarısız.');
    } finally {
      setPendingId(null);
    }
  };

  const counts = useMemo(() => {
    const c = { total: users.length, teacher: 0, editor: 0 };
    for (const u of users) {
      if (u.roles.includes('Teacher')) c.teacher++;
      if (u.roles.includes('Editor')) c.editor++;
    }
    return c;
  }, [users]);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <header className="flex items-end justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Kullanıcılar</h1>
          <p className="text-sm text-gray-500 mt-1">
            Toplam {counts.total} · Öğretmen {counts.teacher} · Editör {counts.editor}. Editör ataması
            yalnızca kayıtlı öğretmenlere yapılabilir.
          </p>
        </div>
      </header>

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          className="border rounded px-3 py-2 w-80"
          placeholder="E-posta veya isim..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="border rounded px-3 py-2"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
        >
          <option value="all">Tüm roller</option>
          <option value="Teacher">Öğretmenler</option>
          <option value="Editor">Editörler</option>
          <option value="Student">Öğrenciler</option>
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-3 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p>Yükleniyor...</p>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left">
                <th className="p-3">Ad</th>
                <th className="p-3">E-posta</th>
                <th className="p-3">Roller</th>
                <th className="p-3">Doğrulanmış</th>
                <th className="p-3">Kayıt</th>
                <th className="p-3 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isEditor = u.roles.includes('Editor');
                const isAdmin =
                  u.roles.includes('Admin') || u.roles.includes('SuperAdmin');
                const isTeacher = u.roles.includes('Teacher');
                const canGrantEditor = !isAdmin && isTeacher && !isEditor;
                const canRevokeEditor = !isAdmin && isEditor;
                return (
                  <tr key={u.id} className="border-t">
                    <td className="p-3">{u.displayName || '-'}</td>
                    <td className="p-3">{u.email}</td>
                    <td className="p-3 text-xs">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map((r) => (
                          <span
                            key={r}
                            className={`px-2 py-0.5 rounded ${
                              r === 'Editor'
                                ? 'bg-indigo-100 text-indigo-800'
                                : r === 'Admin' || r === 'SuperAdmin'
                                  ? 'bg-amber-100 text-amber-800'
                                  : r === 'Teacher'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3">
                      {u.isVerified ? 'Evet' : 'Hayır'}
                      {u.mebVerified && (
                        <span className="ml-1 text-xs text-emerald-600">(MEB)</span>
                      )}
                    </td>
                    <td className="p-3 text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="p-3 text-right">
                      {isAdmin ? (
                        <span className="text-xs text-gray-400">—</span>
                      ) : canRevokeEditor ? (
                        <button
                          type="button"
                          disabled={pendingId === u.id}
                          onClick={() => onToggleEditor(u)}
                          className={`px-3 py-1.5 rounded text-xs font-medium border transition bg-white text-red-700 border-red-300 hover:bg-red-50 ${
                            pendingId === u.id ? 'opacity-50 cursor-wait' : ''
                          }`}
                        >
                          {pendingId === u.id ? 'İşleniyor...' : 'Editör Yetkisini Al'}
                        </button>
                      ) : canGrantEditor ? (
                        <button
                          type="button"
                          disabled={pendingId === u.id}
                          onClick={() => onToggleEditor(u)}
                          className={`px-3 py-1.5 rounded text-xs font-medium border transition bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 ${
                            pendingId === u.id ? 'opacity-50 cursor-wait' : ''
                          }`}
                        >
                          {pendingId === u.id ? 'İşleniyor...' : 'Editör Yap'}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400" title="Editör yalnızca öğretmen hesaplarına atanır">
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-500">
                    Kullanıcı bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
