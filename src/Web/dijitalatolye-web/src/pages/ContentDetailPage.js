import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '@/lib/api';
import ShareButtons from '@/components/content/ShareButtons';
import QrCodeModal from '@/components/content/QrCodeModal';
import EmbedSnippetModal from '@/components/content/EmbedSnippetModal';
export default function ContentDetailPage() {
    const { slug } = useParams();
    const [content, setContent] = useState(null);
    const [notFound, setNotFound] = useState(false);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [busy, setBusy] = useState(false);
    const [rating, setRating] = useState(null);
    const [qrOpen, setQrOpen] = useState(false);
    const [embedOpen, setEmbedOpen] = useState(false);
    useEffect(() => {
        if (!slug)
            return;
        const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
        const url = isGuid ? `/contents/${slug}` : `/search/contents/${slug}`;
        setNotFound(false);
        api.get(url)
            .then(({ data }) => setContent(data))
            .catch(() => setNotFound(true));
    }, [slug]);
    useEffect(() => {
        if (!content)
            return;
        api.get(`/contents/${content.id}/comments`).then(({ data }) => setComments(data));
        api.get(`/contents/${content.id}/rating`).then(({ data }) => setRating(data)).catch(() => { });
    }, [content]);
    async function like() {
        if (!content)
            return;
        await api.post(`/contents/${content.id}/like`);
        setContent({ ...content, likes: (content.likes ?? 0) + 1 });
    }
    async function favorite() {
        if (!content)
            return;
        await api.post(`/contents/${content.id}/favorite`);
    }
    async function rate(score) {
        if (!content)
            return;
        await api.post(`/contents/${content.id}/rating`, { score });
        const { data } = await api.get(`/contents/${content.id}/rating`);
        setRating(data);
    }
    async function submitComment() {
        if (!content || !newComment.trim())
            return;
        setBusy(true);
        try {
            const { data } = await api.post(`/contents/${content.id}/comments`, { body: newComment });
            setComments([data, ...comments]);
            setNewComment('');
        }
        finally {
            setBusy(false);
        }
    }
    if (notFound)
        return _jsx("p", { className: "p-6 text-rose-700", children: "\u0130\u00E7erik bulunamad\u0131." });
    if (!content)
        return _jsx("p", { className: "p-6", children: "Y\u00FCkleniyor\u2026" });
    const pageUrl = window.location.href;
    return (_jsxs("div", { className: "max-w-4xl mx-auto p-6", children: [_jsxs(Helmet, { children: [_jsxs("title", { children: [content.title, " | DijitalAt\u00F6lye"] }), _jsx("meta", { name: "description", content: content.description ?? content.title }), _jsx("meta", { property: "og:title", content: content.title }), _jsx("meta", { property: "og:description", content: content.description ?? '' }), _jsx("meta", { property: "og:type", content: "article" }), _jsx("meta", { property: "og:url", content: pageUrl })] }), _jsxs("div", { className: "text-sm text-gray-500", children: [content.subject, " ", content.gradeLevel ? `· ${content.gradeLevel}. sınıf` : ''] }), _jsx("h1", { className: "text-3xl font-bold mt-1", children: content.title }), content.authorName && _jsxs("p", { className: "text-sm text-gray-600", children: ["Yazar: ", content.authorName] }), _jsx("div", { className: "mt-4 flex flex-wrap gap-2", children: content.tags?.map((t) => (_jsx("span", { className: "text-xs bg-gray-100 rounded px-2 py-0.5", children: t }, t))) }), content.description && _jsx("p", { className: "mt-4 text-gray-700", children: content.description }), rating && (_jsxs("div", { className: "mt-4 flex items-center gap-2 text-sm", children: [_jsxs("span", { className: "text-amber-500 font-medium", children: [rating.average.toFixed(1), " \u2605 (", rating.count, ")"] }), _jsx("span", { className: "text-gray-400", children: "|" }), [1, 2, 3, 4, 5].map((s) => (_jsx("button", { type: "button", onClick: () => rate(s), className: `text-lg ${rating.userScore === s ? 'text-amber-500' : 'text-gray-300 hover:text-amber-400'}`, "aria-label": `${s} yıldız`, children: "\u2605" }, s)))] })), _jsxs("div", { className: "mt-6 flex flex-wrap gap-3 items-center", children: [content.slug ? (_jsx(Link, { to: `/play/${content.slug}`, className: "btn-primary", children: "Oyna" })) : (_jsx("span", { className: "btn-primary opacity-50 cursor-not-allowed", title: "\u0130\u00E7erik hen\u00FCz yay\u0131nlanmad\u0131\u011F\u0131 i\u00E7in oynat\u0131lam\u0131yor", children: "Oyna" })), _jsxs("button", { type: "button", onClick: like, className: "btn-secondary", children: ["\u2665 ", content.likes ?? 0] }), _jsx("button", { type: "button", onClick: favorite, className: "btn-secondary", children: "\u2605 Favori" })] }), content.slug && (_jsxs("div", { className: "mt-4", children: [_jsx(ShareButtons, { title: content.title, url: pageUrl, onQr: () => setQrOpen(true), onEmbed: () => setEmbedOpen(true) }), _jsx(QrCodeModal, { open: qrOpen, onClose: () => setQrOpen(false), url: pageUrl, title: content.title }), _jsx(EmbedSnippetModal, { open: embedOpen, onClose: () => setEmbedOpen(false), slug: content.slug })] })), !content.slug && (_jsx("p", { className: "mt-3 text-xs text-amber-700", children: "Bu i\u00E7erik hen\u00FCz yay\u0131nda de\u011Fil; yay\u0131na al\u0131nd\u0131\u011F\u0131nda oynat\u0131labilir olacak." })), _jsx("h2", { className: "text-xl font-semibold mt-10 mb-3", children: "Yorumlar" }), _jsxs("div", { className: "bg-white border rounded-lg p-4", children: [_jsx("textarea", { className: "input", rows: 3, placeholder: "Yorumunuzu yaz\u0131n\u2026", value: newComment, onChange: (e) => setNewComment(e.target.value) }), _jsx("div", { className: "text-right mt-2", children: _jsx("button", { type: "button", onClick: submitComment, disabled: busy || !newComment.trim(), className: "btn-primary", children: "G\u00F6nder" }) })] }), _jsx("ul", { className: "mt-4 space-y-3", children: comments.map((c) => (_jsxs("li", { className: "bg-gray-50 border rounded p-3", children: [_jsx("p", { className: "text-sm", children: c.body }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: new Date(c.createdAt).toLocaleString('tr-TR') })] }, c.id))) })] }));
}
