import { useState } from 'react';
import api from '@/lib/api';

export default function KvkkPage() {
  const [busy, setBusy] = useState<'export' | 'anonymize' | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleExport() {
    setBusy('export');
    setMessage(null);
    try {
      const { data } = await api.get('/users/me/kvkk/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dijitalatolye-veri-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage('Veri export tamamlandi.');
    } catch {
      setMessage('Export sirasinda hata olustu.');
    } finally {
      setBusy(null);
    }
  }

  async function handleAnonymize() {
    if (!confirm('Profil bilgileriniz anonimlestirilecek. Devam edilsin mi?')) return;
    setBusy('anonymize');
    setMessage(null);
    try {
      await api.post('/users/me/kvkk/anonymize');
      setMessage('Profiliniz anonimlestirildi.');
    } catch {
      setMessage('Islem sirasinda hata olustu.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">KVKK Haklarim</h1>
      <p className="text-gray-600 mb-6">
        6698 sayili KVKK kapsaminda kisisel verilerinize iliskin haklarinizi buradan
        kullanabilirsiniz. Detayli aydinlatma metni icin{' '}
        <a className="text-blue-600 underline" href="/legal/privacy">
          Gizlilik Politikasi
        </a>{' '}
        sayfasini ziyaret edin.
      </p>

      <section className="space-y-4">
        <div className="border rounded-lg p-5 bg-white">
          <h2 className="font-semibold text-lg mb-1">Verilerimi Indir</h2>
          <p className="text-sm text-gray-600 mb-3">
            Profilinize ait kayitli verileri JSON olarak indirebilirsiniz.
          </p>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            onClick={handleExport}
            disabled={busy !== null}
          >
            {busy === 'export' ? 'Hazirlaniyor...' : 'Indir'}
          </button>
        </div>

        <div className="border rounded-lg p-5 bg-white">
          <h2 className="font-semibold text-lg mb-1">Profilimi Anonimlestir</h2>
          <p className="text-sm text-gray-600 mb-3">
            Ad, soyad, biyografi gibi kisisel alanlar anonimlestirilir. Yayinlanmis
            icerikleriniz ve etkilesim verileriniz icin ayri talep gereklidir.
          </p>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50"
            onClick={handleAnonymize}
            disabled={busy !== null}
          >
            {busy === 'anonymize' ? 'Isleniyor...' : 'Anonimlestir'}
          </button>
        </div>
      </section>

      {message && (
        <p className="mt-6 p-3 bg-green-50 text-green-800 rounded">{message}</p>
      )}
    </div>
  );
}
