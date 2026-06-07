/*!
 * DijitalAtölye İçerik İzleme SDK'sı (da-sdk.js)
 * ------------------------------------------------------------------
 * Öğretmenlerin hazırladığı HTML içeriklerin (oyun/simülasyon) öğrenci
 * etkileşimini platforma bildirmesi için kullanılır. İçerik bir iframe
 * içinde izole çalışır; bu SDK `postMessage` ile host sayfaya konuşur.
 *
 * Kullanım (içerik bundle'ınıza ekleyin):
 *   <script src="/da-sdk.js"></script>
 *   DijitalAtolye.progress({ outcomeCode: 'M.5.1.1', score: 40 });
 *   DijitalAtolye.complete({ outcomeCode: 'M.5.1.1', score: 90, durationSeconds: 120 });
 *
 * Tüm alanlar opsiyoneldir. score 0–100 arası beklenir (host tarafında kısılır).
 */
(function (w) {
  'use strict';

  function send(type, opts) {
    opts = opts || {};
    var payload = {
      app: 'dijitalatolye',
      type: type,
      outcomeCode: opts.outcomeCode,
      score: typeof opts.score === 'number' ? opts.score : undefined,
      durationSeconds: typeof opts.durationSeconds === 'number' ? opts.durationSeconds : undefined,
    };
    // Host (PlayComponent) gelen mesajı kaynak penceresi + 'app' marker'ı ile doğrular.
    try {
      w.parent.postMessage(payload, '*');
    } catch (_) {
      /* iframe dışında / parent yoksa sessizce yut */
    }
  }

  w.DijitalAtolye = {
    /** Ham olay gönderimi: type 'progress' | 'complete' | 'score'. */
    track: function (type, opts) { send(type, opts); },
    /** Ara ilerleme (kısmi tamamlama / ara skor). */
    progress: function (opts) { send('progress', opts); },
    /** İçerik tamamlandı (final skor + süre). */
    complete: function (opts) { send('complete', opts); },
    /** Yalnızca skor güncellemesi. */
    score: function (opts) { send('score', opts); },
  };
})(window);
