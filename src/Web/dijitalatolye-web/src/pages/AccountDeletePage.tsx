import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';

export default function AccountDeletePage() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestDelete() {
    if (!confirm('Hesap silme talebi gönderilecek. Devam edilsin mi?')) return;
    setBusy(true);
    setError(null);
    try {
      await api.post('/users/me/kvkk/delete-request');
      setDone(true);
    } catch {
      setError('Talep gönderilemedi. Giriş yaptığınızdan emin olun.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Hesap Silme Talebi</h1>
      <p className="text-gray-600 mb-6">
        KVKK kapsamında hesabınızın ve kişisel verilerinizin silinmesini talep edebilirsiniz.
        Talebiniz 30 gün içinde işleme alınır.
      </p>

      {done ? (
        <div className="p-4 bg-green-50 text-green-800 rounded-lg">
          Talebiniz alındı. E-posta adresinize onay gönderilecektir.
        </div>
      ) : (
        <button
          type="button"
          onClick={requestDelete}
          disabled={busy}
          className="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50"
        >
          {busy ? 'Gönderiliyor…' : 'Hesap silme talebi gönder'}
        </button>
      )}

      {error && <p className="mt-4 text-red-700 text-sm">{error}</p>}

      <p className="mt-6 text-sm">
        <Link to="/kvkk" className="text-brand-600 hover:underline">← KVKK sayfasına dön</Link>
      </p>
    </div>
  );
}
