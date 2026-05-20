import { useEffect, useState } from 'react';

const STORAGE_KEY = 'dijitalatolye-cookie-consent';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4">
      <div className="max-w-4xl mx-auto bg-white border shadow-lg rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <p className="text-sm text-slate-700">
          Deneyiminizi iyileştirmek için çerezler kullanıyoruz.{' '}
          <a href="/kvkk" className="text-brand-600 underline">KVKK</a>
        </p>
        <button type="button" onClick={accept} className="btn-primary shrink-0">
          Kabul et
        </button>
      </div>
    </div>
  );
}
