import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { api } from "@/lib/api";
import ShareButtons from "@/components/content/ShareButtons";
import QrCodeModal from "@/components/content/QrCodeModal";
import EmbedSnippetModal from "@/components/content/EmbedSnippetModal";
export default function PlayPage() {
    const { slug } = useParams();
    const playStartTime = useRef(Date.now());
    const playUrl = `/api/contents/by-slug/${slug}/play`;
    const [qrOpen, setQrOpen] = useState(false);
    const [embedOpen, setEmbedOpen] = useState(false);
    const pageUrl = typeof window !== "undefined" ? window.location.href : "";
    useEffect(() => {
        if (!slug)
            return;
        api.get(`/search/contents/${slug}`).then(({ data }) => {
            if (data && data.id) {
                api.post("/analytics/events", {
                    contentId: data.id,
                    type: "Play",
                    durationSeconds: 0,
                    source: "web"
                }).catch(() => { });
            }
        }).catch(() => { });
        return () => {
            const durationSeconds = Math.round((Date.now() - playStartTime.current) / 1000);
            api.get(`/search/contents/${slug}`).then(({ data }) => {
                if (data && data.id) {
                    api.post("/analytics/events", {
                        contentId: data.id,
                        type: "Complete",
                        durationSeconds,
                        source: "web"
                    }).catch(() => { });
                }
            }).catch(() => { });
        };
    }, [slug]);
    return (_jsxs("section", { className: "max-w-5xl mx-auto px-4 py-6", children: [_jsxs(Helmet, { children: [_jsxs("title", { children: ["Oynat: ", slug, " | DijitalAt\u00F6lye"] }), _jsx("meta", { property: "og:title", content: `Oynat: ${slug}` }), _jsx("meta", { property: "og:type", content: "video.other" })] }), _jsxs("h1", { className: "text-xl font-bold mb-4", children: ["Oynat: ", slug] }), slug && (_jsxs("div", { className: "mb-4", children: [_jsx(ShareButtons, { title: `Oynat: ${slug}`, url: pageUrl, onQr: () => setQrOpen(true), onEmbed: () => setEmbedOpen(true) }), _jsx(QrCodeModal, { open: qrOpen, onClose: () => setQrOpen(false), url: pageUrl, title: slug }), _jsx(EmbedSnippetModal, { open: embedOpen, onClose: () => setEmbedOpen(false), slug: slug })] })), _jsx("iframe", { src: playUrl, sandbox: "allow-scripts allow-same-origin", className: "w-full h-[640px] border rounded bg-white", title: "play" })] }));
}
