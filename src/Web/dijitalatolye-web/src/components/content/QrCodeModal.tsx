import Modal from '@/components/ui/Modal';

interface QrCodeModalProps {
  open: boolean;
  onClose: () => void;
  url: string;
  title: string;
}

export default function QrCodeModal({ open, onClose, url, title }: QrCodeModalProps) {
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}`;

  return (
    <Modal open={open} onClose={onClose} title="QR Kod">
      <p className="text-sm text-gray-600 mb-3">{title}</p>
      <div className="flex justify-center">
        <img src={qrSrc} alt="QR kod" width={220} height={220} className="border rounded" />
      </div>
      <p className="text-xs text-gray-500 mt-3 break-all">{url}</p>
    </Modal>
  );
}
