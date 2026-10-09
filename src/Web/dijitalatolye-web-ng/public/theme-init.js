// İlk boyamadan önce tema tercihini uygula (FOUC önleme).
// index.html'de satır içi değil harici dosya: CSP script-src 'self' ('unsafe-inline' yok).
(function () {
  try {
    var t = localStorage.getItem('da-theme');
    if (!t) t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', t);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
