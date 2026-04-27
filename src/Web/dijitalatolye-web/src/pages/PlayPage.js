import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { api } from "@/lib/api";
export default function PlayPage() {
    const { slug } = useParams();
    const playStartTime = useRef(Date.now());
    const playUrl = `/api/contents/by-slug/${slug}/play`;
    useEffect(() => {
        if (!slug)
            return;
        // Resolve slug to Content ID to track play event.
        // For simplicity in this demo, we'll try tracking with slug or pass an empty GUID if not available.
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
    return (_jsxs("section", { className: "max-w-5xl mx-auto px-4 py-6", children: [_jsxs("h1", { className: "text-xl font-bold mb-4", children: ["Oynat: ", slug] }), _jsx("iframe", { src: playUrl, sandbox: "allow-scripts allow-same-origin", className: "w-full h-[640px] border rounded bg-white", title: "play" })] }));
}
