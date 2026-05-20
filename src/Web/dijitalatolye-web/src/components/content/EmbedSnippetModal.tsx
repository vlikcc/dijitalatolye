import { useState } from 'react';
import Modal from '@/components/ui/Modal';

interface EmbedSnippetModalProps {
  open: boolean;
  onClose: () => void;
  slug: string;
}

export default function EmbedSnippetModal({ open, onClose, slug }: EmbedSnippetModalProps) {
  const playUrl = `${window.location.origin}/play/${slug}`;
  const snippet = `<iframe src="${playUrl}" width="800" height="600" frameborder="0" sandbox="allow-scripts allow-same-origin" title="${slug}"></iframe>`;
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Modal open={open} onClose={onClose} title="Gömme Kodu">
      <p className="text-sm text-gray-600 mb-2">Bu kodu web sitenize yapıştırarak içeriği gömebilirsiniz.</p>
      <pre className="text-xs bg-gray-50 border rounded p-3 overflow-x-auto whitespace-pre-wrap">{snippet}</pre>
      <button type="button" onClick={copy} className="btn-secondary mt-3">
        {copied ? 'Kopyalandı ✓' : 'Kodu kopyala'}
      </button>
    </Modal>
  );
}
