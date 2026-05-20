import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

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

interface SearchResponse {
  total: number;
  items: SearchItem[];
}

export default function CategoryPage() {
  const { subject = '' } = useParams();
  const decodedSubject = decodeURIComponent(subject);
  const [params] = useSearchParams();
  const grade = params.get('grade') ?? '';

  const { data, isLoading } = useQuery({
    queryKey: ['search', 'category', decodedSubject, grade],
    queryFn: async () => {
      const { data: resp } = await api.get<SearchResponse>('/search/contents', {
        params: {
          subject: decodedSubject,
          gradeLevel: grade || undefined,
          page: 1,
          pageSize: 24,
        },
      });
      return resp;
    },
    enabled: Boolean(decodedSubject),
  });

  return (
    <div className="max-w-6xl mx-auto p-6">
      <nav className="text-sm text-slate-500 mb-4">
        <Link to="/discover" className="hover:text-brand-700">Keşfet</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-800">{decodedSubject}</span>
      </nav>

      <h1 className="text-3xl font-bold mb-2">{decodedSubject} içerikleri</h1>
      <p className="text-sm text-gray-500 mb-6">{data?.total ?? 0} sonuç</p>

      {isLoading ? (
        <p>Yükleniyor…</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(data?.items ?? []).map((it) => (
            <Link
              key={it.id}
              to={`/contents/${it.slug}`}
              className="border rounded-lg p-4 hover:shadow transition bg-white"
            >
              <div className="text-xs text-gray-500 mb-1">
                {it.gradeLevel ? `${it.gradeLevel}. sınıf` : ''}
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
            </Link>
          ))}
          {(data?.items ?? []).length === 0 && (
            <p className="text-slate-500 col-span-full">Bu kategoride henüz içerik yok.</p>
          )}
        </div>
      )}

      <p className="mt-8 text-sm">
        <Link to={`/discover?subject=${encodeURIComponent(decodedSubject)}`} className="text-brand-700 hover:underline">
          Gelişmiş filtrelerle ara →
        </Link>
      </p>
    </div>
  );
}
