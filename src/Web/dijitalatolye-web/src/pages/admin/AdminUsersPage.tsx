import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface UserRow {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
  isVerified: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    setLoading(true);
    api
      .get<UserRow[]>(`/admin/users${q ? `?q=${encodeURIComponent(q)}` : ''}`)
      .then(({ data }) => setUsers(data))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [q]);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Kullanicilar</h1>
      <input
        className="border rounded px-3 py-2 w-80 mb-4"
        placeholder="E-posta veya isim..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {loading ? (
        <p>Yukleniyor...</p>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left">
                <th className="p-3">Ad</th>
                <th className="p-3">E-posta</th>
                <th className="p-3">Roller</th>
                <th className="p-3">Dogrulanmis</th>
                <th className="p-3">Kayit</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="p-3">{u.displayName || '-'}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3 text-xs">{u.roles.join(', ')}</td>
                  <td className="p-3">{u.isVerified ? 'Evet' : 'Hayir'}</td>
                  <td className="p-3 text-gray-500">
                    {new Date(u.createdAt).toLocaleDateString('tr-TR')}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-500">
                    Kullanici bulunamadi.
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
