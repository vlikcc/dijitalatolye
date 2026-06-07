# İçerik İzleme SDK'sı (Content Tracking SDK)

DijitalAtölye'de yayınlanan HTML içerikler (oyun, simülasyon, interaktif alıştırma) bir **izole iframe** içinde çalışır. İçeriğin öğrenci etkileşimini (ilerleme, tamamlama, skor) platforma bildirmesi için `postMessage` tabanlı hafif bir köprü vardır.

Bu sayede platform "içerik açıldı" yerine **"öğrenci ne öğrendi"** verisini toplar; bu veri kazanım (MEB) bazlı ilerleme panelleri ve AI önerileri için kullanılır.

## Hızlı başlangıç

İçerik bundle'ınıza SDK'yı ekleyin ve uygun anlarda olay gönderin:

```html
<script src="/da-sdk.js"></script>
<script>
  // Öğrenci bir bölümü bitirdiğinde:
  DijitalAtolye.progress({ outcomeCode: 'M.5.1.1', score: 40 });

  // İçerik tamamen bittiğinde:
  DijitalAtolye.complete({ outcomeCode: 'M.5.1.1', score: 90, durationSeconds: 180 });
</script>
```

> `da-sdk.js` platform tarafından kök yoldan (`/da-sdk.js`) servis edilir. Bundle'ınızda harici bağımlılık tutmanıza gerek yoktur; alternatif olarak içeriğine kopyalayabilirsiniz.

## API

| Çağrı | Açıklama |
|---|---|
| `DijitalAtolye.progress(opts)` | Ara ilerleme / kısmi tamamlama. |
| `DijitalAtolye.complete(opts)` | İçerik tamamlandı (final skor + süre). |
| `DijitalAtolye.score(opts)` | Yalnızca skor güncellemesi. |
| `DijitalAtolye.track(type, opts)` | Düşük seviye; `type` = `'progress' \| 'complete' \| 'score'`. |

### `opts` alanları (hepsi opsiyonel)

| Alan | Tip | Not |
|---|---|---|
| `outcomeCode` | `string` | İlişkili MEB kazanım kodu (örn. `M.5.1.1`). İçeriğin yüklenirken seçtiği kazanım kodlarıyla eşleşmeli. Max 32 karakter. |
| `score` | `number` | 0–100 arası. Host tarafında bu aralığa kısılır. |
| `durationSeconds` | `number` | İlgili etkinliğin süresi (saniye). |

## postMessage sözleşmesi (düşük seviye)

SDK kullanmadan doğrudan mesaj göndermek isterseniz, host yalnızca şu yapıdaki mesajları kabul eder:

```js
window.parent.postMessage({
  app: 'dijitalatolye',          // zorunlu marker
  type: 'complete',              // 'progress' | 'complete' | 'score'
  outcomeCode: 'M.5.1.1',        // opsiyonel
  score: 90,                     // opsiyonel (0–100)
  durationSeconds: 180           // opsiyonel
}, '*');
```

### Güvenlik

Host (`PlayComponent`) gelen her mesajı iki kademede doğrular:

1. **Kaynak penceresi:** mesaj yalnızca oynatılan içeriğin iframe'inden (`iframe.contentWindow`) geliyorsa kabul edilir — başka sekme/pencere/eklenti enjekte edemez.
2. **Marker:** `app === 'dijitalatolye'` olmayan mesajlar yok sayılır.

İçerik ayrı bir origin'de (object storage) servis edildiği için iframe `sandbox="allow-scripts allow-same-origin"` ile çalışır; bu, uygulama origin'ine erişim vermez.

## Davranış notları

- İçerik **hiç mesaj göndermezse** eski davranış korunur: açılışta `Play`, sayfa kapanışında geçen süreyle bir `Complete` olayı yazılır.
- İçerik açıkça bir `complete` mesajı gönderdiyse, host kapanıştaki otomatik `Complete` olayını **göndermez** (çift sayım önlenir).
- Öğrenci giriş yapmışsa olaylar kullanıcıya bağlanır; anonim öğrencilerde oturum bazlı kaydedilir.

## İlgili kod

- Host köprüsü: `src/Web/dijitalatolye-web-ng/src/app/features/public/play/play.component.ts`
- SDK: `src/Web/dijitalatolye-web-ng/public/da-sdk.js`
- Olay alımı: `POST /analytics/events` — `src/Services/Analytics/Analytics.API/Endpoints/AnalyticsEndpoints.cs`
