import { Link2, Share2 } from 'lucide-react';

interface ShareButtonsProps {
  title: string;
  url: string;
  onQr: () => void;
  onEmbed: () => void;
}

export default function ShareButtons({ title, url, onQr, onEmbed }: ShareButtonsProps) {
  const encoded = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  async function copyLink() {
    await navigator.clipboard.writeText(url);
  }

  function nativeShare() {
    if (navigator.share) void navigator.share({ title, url });
    else void copyLink();
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <button type="button" onClick={nativeShare} className="btn-secondary inline-flex items-center gap-1">
        <Share2 className="w-4 h-4" /> Paylaş
      </button>
      <a
        href={`https://twitter.com/intent/tweet?url=${encoded}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-secondary text-sm"
      >
        X
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encoded}`}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-secondary text-sm"
      >
        Facebook
      </a>
      <a
        href={`https://wa.me/?text=${encodedTitle}%20${encoded}`}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-secondary text-sm"
      >
        WhatsApp
      </a>
      <button type="button" onClick={onQr} className="btn-secondary text-sm">QR</button>
      <button type="button" onClick={onEmbed} className="btn-secondary text-sm inline-flex items-center gap-1">
        <Link2 className="w-4 h-4" /> Göm
      </button>
      <button type="button" onClick={copyLink} className="btn-secondary text-sm">Link kopyala</button>
    </div>
  );
}
