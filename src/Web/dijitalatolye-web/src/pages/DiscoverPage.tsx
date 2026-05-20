import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';

interface SearchItem {
  id: string;
  contentId?: string;
  title: string;
  description?: string;
  slug: string;
  subject?: string;
  gradeLevel?: number;
  tags?: string[];
  views?: number;
  likes?: number;
}

interface FacetBucket {
  value: string | number;
  count: number;
}

interface SearchResponse {
  total: number;
  page: number;
  pageSize: number;
  items: SearchItem[];
  facets?: {
    subject: FacetBucket[];
    gradeLevel: FacetBucket[];
    tags: FacetBucket[];
  };
}

interface MoreLikeThisResponse {
  contentId: string;
  items: SearchItem[];
}

function useSearchParamsState() {
  const [params, setParams] = useSearchParams();
  return {
    q: params.get('q') ?? '',
    subject: params.get('subject') ?? '',
    grade: params.get('grade') ?? '',
    tag: params.get('tag') ?? '',
    setParams,
  };
}

export default function DiscoverPage() {
  const { q, subject, grade, tag, setParams } = useSearchParamsState();
  const [carouselIndex, setCarouselIndex] = useState(0);

  const searchQuery = useQuery({
    queryKey: ['search', 'contents', { q, subject, grade, tag }],
    queryFn: async () => {
      const { data } = await api.get<SearchResponse>('/search/contents', {
        params: {
          q: q || undefined,
          subject: subject || undefined,
          gradeLevel: grade || undefined,
          tag: tag || undefined,
          page: 1,
          pageSize: 24,
        },
      });
      return data;
    },
  });

  const items = searchQuery.data?.items ?? [];
  const facets = searchQuery.data?.facets;
  const total = searchQuery.data?.total ?? 0;

  const suggestionSourceId = items[0]?.id ?? items[0]?.contentId;

  const suggestionsQuery = useQuery({
    queryKey: ['search', 'more-like-this', suggestionSourceId],
    queryFn: async () => {
      const { data } = await api.get<MoreLikeThisResponse>(
        `/search/more-like-this/${suggestionSourceId}`,
        { params: { size: 8 } },
      );
      return data.items;
    },
    enabled: Boolean(suggestionSourceId),
  });

  const suggestions = suggestionsQuery.data ?? [];
  const visibleSuggestions = useMemo(() => {
    if (suggestions.length <= 3) return suggestions;
    const slice: SearchItem[] = [];
    for (let i = 0; i < 3; i += 1) {
      slice.push(suggestions[(carouselIndex + i) % suggestions.length]);
    }
    return slice;
  }, [suggestions, carouselIndex]);

  function toggleParam(key: 'subject' | 'grade' | 'tag', value: string) {
    setParams((p) => {
      const current = p.get(key === 'grade' ? 'grade' : key) ?? '';
      if (current === value) p.delete(key === 'grade' ? 'grade' : key);
      else p.set(key === 'grade' ? 'grade' : key, value);
      return p;
    });
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">İçerik Keşfi</h1>

      <div className="bg-white p-4 border rounded-lg flex flex-wrap gap-3 mb-6">
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
        {(subject || grade || tag) && (
          <button
            type="button"
            className="text-sm text-brand-700 hover:underline"
            onClick={() => setParams((p) => {
              p.delete('subject');
              p.delete('grade');
              p.delete('tag');
              return p;
            })}
          >
            Filtreleri temizle
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
        <aside className="space-y-4">
          <FacetGroup
            title="Ders"
            buckets={facets?.subject ?? []}
            active={subject}
            onSelect={(v) => toggleParam('subject', String(v))}
            linkPrefix="/category"
          />
          <FacetGroup
            title="Sınıf"
            buckets={facets?.gradeLevel ?? []}
            active={grade}
            onSelect={(v) => toggleParam('grade', String(v))}
            formatLabel={(v) => `${v}. sınıf`}
          />
          <FacetGroup
            title="Etiket"
            buckets={facets?.tags ?? []}
            active={tag}
            onSelect={(v) => toggleParam('tag', String(v))}
          />
        </aside>

        <section>
          <p className="text-sm text-gray-500 mb-4">{total} sonuç</p>

          {searchQuery.isLoading ? (
            <p>Yükleniyor…</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {items.map((it) => (
                <ContentCard key={it.id} item={it} />
              ))}
              {items.length === 0 && (
                <p className="text-slate-500 col-span-full">Sonuç bulunamadı.</p>
              )}
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="mt-10">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Önerilen içerikler</h2>
                {suggestions.length > 3 && (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      aria-label="Önceki öneriler"
                      className="p-2 rounded-lg border hover:bg-slate-50"
                      onClick={() => setCarouselIndex((i) => (i - 1 + suggestions.length) % suggestions.length)}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Sonraki öneriler"
                      className="p-2 rounded-lg border hover:bg-slate-50"
                      onClick={() => setCarouselIndex((i) => (i + 1) % suggestions.length)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {visibleSuggestions.map((it) => (
                  <ContentCard key={`suggestion-${it.id}`} item={it} compact />
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function FacetGroup({
  title,
  buckets,
  active,
  onSelect,
  formatLabel,
  linkPrefix,
}: {
  title: string;
  buckets: FacetBucket[];
  active: string;
  onSelect: (value: string | number) => void;
  formatLabel?: (value: string | number) => string;
  linkPrefix?: string;
}) {
  if (buckets.length === 0) return null;

  return (
    <div className="bg-white border rounded-lg p-4">
      <h3 className="text-sm font-semibold text-slate-800 mb-2">{title}</h3>
      <ul className="space-y-1 max-h-48 overflow-y-auto">
        {buckets.map((b) => {
          const value = String(b.value);
          const label = formatLabel ? formatLabel(b.value) : value;
          const isActive = active === value;
          return (
            <li key={value}>
              {linkPrefix ? (
                <Link
                  to={`${linkPrefix}/${encodeURIComponent(value)}`}
                  className={`flex items-center justify-between w-full text-sm px-2 py-1 rounded hover:bg-slate-50 ${isActive ? 'bg-brand-50 text-brand-800 font-medium' : 'text-slate-700'}`}
                >
                  <span>{label}</span>
                  <span className="text-xs text-slate-400">{b.count}</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => onSelect(b.value)}
                  className={`flex items-center justify-between w-full text-sm px-2 py-1 rounded hover:bg-slate-50 ${isActive ? 'bg-brand-50 text-brand-800 font-medium' : 'text-slate-700'}`}
                >
                  <span>{label}</span>
                  <span className="text-xs text-slate-400">{b.count}</span>
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ContentCard({ item, compact }: { item: SearchItem; compact?: boolean }) {
  return (
    <Link
      to={`/contents/${item.slug}`}
      className={`border rounded-lg p-4 hover:shadow transition bg-white block ${compact ? 'h-full' : ''}`}
    >
      <div className="text-xs text-gray-500 mb-1">
        {item.subject} {item.gradeLevel ? `· ${item.gradeLevel}. sınıf` : ''}
      </div>
      <h3 className={`font-semibold ${compact ? 'text-base' : 'text-lg'}`}>{item.title}</h3>
      {!compact && item.description && (
        <p className="text-sm text-gray-600 mt-2 line-clamp-3">{item.description}</p>
      )}
      <div className="flex flex-wrap gap-1 mt-3">
        {item.tags?.slice(0, compact ? 2 : 4).map((t) => (
          <span key={t} className="text-xs bg-gray-100 rounded px-2 py-0.5">{t}</span>
        ))}
      </div>
      <div className="text-xs text-gray-500 mt-3 flex gap-3">
        <span>👁 {item.views ?? 0}</span>
        <span>♥ {item.likes ?? 0}</span>
      </div>
    </Link>
  );
}
