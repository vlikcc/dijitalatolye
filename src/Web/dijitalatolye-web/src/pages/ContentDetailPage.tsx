import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '@/lib/api';

interface ContentDetail {
  id: string;
  title: string;
  description?: string;
  slug?: string | null;
  subject?: string;
  gradeLevel?: number;
  tags?: string[];
  authorName?: string;
  views?: number;
  likes?: number;
  state?: string;
}

interface Comment {
  id: string;
  body: string;
  userId: string;
  createdAt: string;
}

export default function ContentDetailPage() {
  const { slug } = useParams();
  const [content, setContent] = useState<ContentDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    const url = isGuid ? `/contents/${slug}` : `/search/contents/${slug}`;
    setNotFound(false);
    api.get<ContentDetail>(url)
      .then(({ data }) => setContent(data))
      .catch(() => setNotFound(true));
  }, [slug]);

  useEffect(() => {
    if (!content) return;
    api.get<Comment[]>(`/contents/${content.id}/comments`).then(({ data }) => setComments(data));
  }, [content]);

  async function like() {
    if (!content) return;
    await api.post(`/contents/${content.id}/like`);
    setContent({ ...content, likes: (content.likes ?? 0) + 1 });
  }

  async function favorite() {
    if (!content) return;
    await api.post(`/contents/${content.id}/favorite`);
  }

  async function submitComment() {
    if (!content || !newComment.trim()) return;
    setBusy(true);
    try {
      const { data } = await api.post<Comment>(`/contents/${content.id}/comments`, { body: newComment });
      setComments([data, ...comments]);
      setNewComment('');
    } finally {
      setBusy(false);
    }
  }

  function share() {
    const url = window.location.href;
    if (navigator.share) void navigator.share({ title: content?.title, url });
    else void navigator.clipboard.writeText(url);
  }

  if (notFound) return <p className="p-6 text-rose-700">İçerik bulunamadı.</p>;
  if (!content) return <p className="p-6">Yükleniyor…</p>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <head>
        <title>{content.title} | DijitalAtölye</title>
        <meta name="description" content={content.description ?? content.title} />
        <meta property="og:title" content={content.title} />
        <meta property="og:description" content={content.description ?? ''} />
      </head>

      <div className="text-sm text-gray-500">
        {content.subject} {content.gradeLevel ? `· ${content.gradeLevel}. sınıf` : ''}
      </div>
      <h1 className="text-3xl font-bold mt-1">{content.title}</h1>
      {content.authorName && <p className="text-sm text-gray-600">Yazar: {content.authorName}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        {content.tags?.map((t) => (
          <span key={t} className="text-xs bg-gray-100 rounded px-2 py-0.5">{t}</span>
        ))}
      </div>

      {content.description && <p className="mt-4 text-gray-700">{content.description}</p>}

      <div className="mt-6 flex gap-3 items-center">
        {content.slug ? (
          <Link to={`/play/${content.slug}`} className="btn-primary">Oyna</Link>
        ) : (
          <span
            className="btn-primary opacity-50 cursor-not-allowed"
            title="İçerik henüz yayınlanmadığı için oynatılamıyor"
          >
            Oyna
          </span>
        )}
        <button onClick={like} className="btn-secondary">♥ {content.likes ?? 0}</button>
        <button onClick={favorite} className="btn-secondary">★ Favori</button>
        <button onClick={share} className="btn-secondary">Paylaş</button>
        {!content.slug && (
          <span className="text-xs text-amber-700">
            Bu içerik henüz yayında değil; yayına alındığında oynatılabilir olacak.
          </span>
        )}
      </div>

      <h2 className="text-xl font-semibold mt-10 mb-3">Yorumlar</h2>
      <div className="bg-white border rounded-lg p-4">
        <textarea
          className="input"
          rows={3}
          placeholder="Yorumunuzu yazın…"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <div className="text-right mt-2">
          <button onClick={submitComment} disabled={busy || !newComment.trim()} className="btn-primary">
            Gönder
          </button>
        </div>
      </div>

      <ul className="mt-4 space-y-3">
        {comments.map((c) => (
          <li key={c.id} className="bg-gray-50 border rounded p-3">
            <p className="text-sm">{c.body}</p>
            <p className="text-xs text-gray-500 mt-1">{new Date(c.createdAt).toLocaleString('tr-TR')}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
