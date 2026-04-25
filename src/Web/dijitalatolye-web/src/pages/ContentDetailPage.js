import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '@/lib/api';
export default function ContentDetailPage() {
    const { slug } = useParams();
    const [content, setContent] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [busy, setBusy] = useState(false);
    useEffect(() => {
        if (!slug)
            return;
        api.get(`/search/contents/${slug}`).then(({ data }) => setContent(data));
    }, [slug]);
    useEffect(() => {
        if (!content)
            return;
        api.get(`/contents/${content.id}/comments`).then(({ data }) => setComments(data));
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
    function share() {
        const url = window.location.href;
        if (navigator.share)
            void navigator.share({ title: content?.title, url });
        else
            void navigator.clipboard.writeText(url);
    }
    if (!content)
        return _jsx("p", { className: "p-6", children: "Y\u00FCkleniyor\u2026" });
    return (_jsxs("div", { className: "max-w-4xl mx-auto p-6", children: [_jsxs("head", { children: [_jsxs("title", { children: [content.title, " | DijitalAt\u00F6lye"] }), _jsx("meta", { name: "description", content: content.description ?? content.title }), _jsx("meta", { property: "og:title", content: content.title }), _jsx("meta", { property: "og:description", content: content.description ?? '' })] }), _jsxs("div", { className: "text-sm text-gray-500", children: [content.subject, " ", content.gradeLevel ? `· ${content.gradeLevel}. sınıf` : ''] }), _jsx("h1", { className: "text-3xl font-bold mt-1", children: content.title }), content.authorName && _jsxs("p", { className: "text-sm text-gray-600", children: ["Yazar: ", content.authorName] }), _jsx("div", { className: "mt-4 flex flex-wrap gap-2", children: content.tags?.map((t) => (_jsx("span", { className: "text-xs bg-gray-100 rounded px-2 py-0.5", children: t }, t))) }), content.description && _jsx("p", { className: "mt-4 text-gray-700", children: content.description }), _jsxs("div", { className: "mt-6 flex gap-3", children: [_jsx(Link, { to: `/play/${content.slug}`, className: "btn-primary", children: "Oyna" }), _jsxs("button", { onClick: like, className: "btn-secondary", children: ["\u2665 ", content.likes ?? 0] }), _jsx("button", { onClick: favorite, className: "btn-secondary", children: "\u2605 Favori" }), _jsx("button", { onClick: share, className: "btn-secondary", children: "Payla\u015F" })] }), _jsx("h2", { className: "text-xl font-semibold mt-10 mb-3", children: "Yorumlar" }), _jsxs("div", { className: "bg-white border rounded-lg p-4", children: [_jsx("textarea", { className: "input", rows: 3, placeholder: "Yorumunuzu yaz\u0131n\u2026", value: newComment, onChange: (e) => setNewComment(e.target.value) }), _jsx("div", { className: "text-right mt-2", children: _jsx("button", { onClick: submitComment, disabled: busy || !newComment.trim(), className: "btn-primary", children: "G\u00F6nder" }) })] }), _jsx("ul", { className: "mt-4 space-y-3", children: comments.map((c) => (_jsxs("li", { className: "bg-gray-50 border rounded p-3", children: [_jsx("p", { className: "text-sm", children: c.body }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: new Date(c.createdAt).toLocaleString('tr-TR') })] }, c.id))) })] }));
}
