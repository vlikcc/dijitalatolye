import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '@/lib/api';

interface SearchItem {
  id: string;
  title: string;
  description?: string;
  slug: string;
  subject?: string;
  gradeLevel?: number;
  tags?: string[];
  views?: number;
  likes?: number;
}

export default function DiscoverPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const subject = params.get('subject') ?? '';
  const grade = params.get('grade') ?? '';
  const [items, setItems] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    api
      .get('/search/contents', {
        params: {
          q: q || undefined,
          subject: subject || undefined,
          gradeLevel: grade || undefined,
          page: 1,
          pageSize: 24,
        },
      })
      .then(({ data }) => {
        setItems(data.items ?? []);
        setTotal(data.total ?? 0);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [q, subject, grade]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">İçerik Keşfi</h1>

      <div className="bg-white p-4 border rounded-lg flex flex-wrap gap-3">
        <input
          className="input flex-1 min-w-[240px]"
          placeholder="Başlık, etiket veya açıklama ara…"
          defaultValue={q}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const v = (e.target as HTMLInputElement).value;
              setParams((p) => {
                if (v) p.set('q', v);
                else p.delete('q');
                return p;
              });
            }
          }}
        />
        <select
          className="input w-48"
          value={subject}
          onChange={(e) => setParams((p) => {
            if (e.target.value) p.set('subject', e.target.value);
            else p.delete('subject');
            return p;
          })}
        >
          <option value="">Tüm Dersler</option>
          {['Matematik', 'Türkçe', 'Fen', 'Sosyal Bilgiler', 'İngilizce'].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          className="input w-32"
          value={grade}
          onChange={(e) => setParams((p) => {
            if (e.target.value) p.set('grade', e.target.value);
            else p.delete('grade');
            return p;
          })}
        >
          <option value="">Tüm Sınıflar</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
            <option key={g} value={g}>{`${g}. Sınıf`}</option>
          ))}
        </select>
      </div>

      <p className="text-sm text-gray-500 mt-3">{total} sonuç</p>

      {loading ? (
        <p className="mt-6">Yükleniyor…</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((it) => (
            <Link
              key={it.id}
              to={`/contents/${it.slug}`}
              className="border rounded-lg p-4 hover:shadow transition bg-white"
            >
              <div className="text-xs text-gray-500 mb-1">
                {it.subject} {it.gradeLevel ? `· ${it.gradeLevel}. sınıf` : ''}
              </div>
              <h3 className="font-semibold text-lg">{it.title}</h3>
              {it.description && (
                <p className="text-sm text-gray-600 mt-2 line-clamp-3">{it.description}</p>
              )}
              <div className="flex flex-wrap gap-1 mt-3">
                {it.tags?.slice(0, 4).map((t) => (
                  <span key={t} className="text-xs bg-gray-100 rounded px-2 py-0.5">{t}</span>
                ))}
              </div>
              <div className="text-xs text-gray-500 mt-3 flex gap-3">
                <span>👁 {it.views ?? 0}</span>
                <span>♥ {it.likes ?? 0}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
