import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderPlus, Trash2 } from 'lucide-react';
import api from '@/lib/api';

interface Collection {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  items: { id: string; contentId: string }[];
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Collection[]>('/users/me/collections')
      .then(({ data }) => setCollections(data))
      .finally(() => setLoading(false));
  }, []);

  async function createCollection(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const { data } = await api.post<Collection>('/users/me/collections', { name: name.trim(), isPublic: false });
    setCollections([data, ...collections]);
    setName('');
  }

  async function removeCollection(id: string) {
    if (!confirm('Koleksiyon silinsin mi?')) return;
    await api.delete(`/users/me/collections/${id}`);
    setCollections(collections.filter((c) => c.id !== id));
  }

  if (loading) return <p className="p-6">Yükleniyor…</p>;

  return (
    <div className="max-w-3xl">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold">Koleksiyonlarım</h1>
        <p className="text-sm text-slate-600 mt-1">İçerikleri gruplayın ve daha sonra kolayca bulun.</p>
      </header>

      <form onSubmit={createCollection} className="flex gap-2 mb-6">
        <input
          className="input flex-1"
          placeholder="Yeni koleksiyon adı"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit" className="btn-primary inline-flex items-center gap-1">
          <FolderPlus className="w-4 h-4" /> Oluştur
        </button>
      </form>

      <ul className="space-y-3">
        {collections.map((c) => (
          <li key={c.id} className="bg-white border rounded-lg p-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold">{c.name}</h2>
              {c.description && <p className="text-sm text-gray-600">{c.description}</p>}
              <p className="text-xs text-gray-500 mt-1">{c.items.length} içerik · {c.isPublic ? 'Herkese açık' : 'Özel'}</p>
            </div>
            <button type="button" onClick={() => removeCollection(c.id)} className="text-red-600 p-2 hover:bg-red-50 rounded" aria-label="Sil">
              <Trash2 className="w-4 h-4" />
            </button>
          </li>
        ))}
        {collections.length === 0 && (
          <li className="text-sm text-gray-500 border border-dashed rounded-lg p-6 text-center">
            Henüz koleksiyon yok. İçerik detay sayfasından koleksiyona ekleyebilirsiniz.
          </li>
        )}
      </ul>

      <p className="mt-4 text-sm">
        <Link to="/discover" className="text-brand-600 hover:underline">Keşfet →</Link>
      </p>
    </div>
  );
}
