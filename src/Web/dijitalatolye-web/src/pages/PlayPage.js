import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useParams } from "react-router-dom";
export default function PlayPage() {
    const { slug } = useParams();
    // V1: gateway'den /api/contents/by-slug/{slug} ile play URL alınır.
    // Şimdilik placeholder iframe.
    const playUrl = `/api/contents/by-slug/${slug}/play`;
    return (_jsxs("section", { className: "max-w-5xl mx-auto px-4 py-6", children: [_jsxs("h1", { className: "text-xl font-bold mb-4", children: ["Oynat: ", slug] }), _jsx("iframe", { src: playUrl, sandbox: "allow-scripts allow-same-origin", className: "w-full h-[640px] border rounded bg-white", title: "play" })] }));
}
