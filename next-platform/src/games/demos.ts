import type {
  DemoGame,
  ChoiceRound,
  MatchRound,
  OrderRound,
  SortRound,
} from "./types";
const choice = (
  prompt: string,
  options: string[],
  answer: string,
  explanation: string,
): ChoiceRound => ({ type: "choice", prompt, options, answer, explanation });
const match = (
  prompt: string,
  pairs: [string, string][],
  explanation: string,
): MatchRound => ({ type: "match", prompt, pairs, explanation });
const order = (
  prompt: string,
  items: string[],
  explanation: string,
): OrderRound => ({ type: "order", prompt, items, explanation });
const sort = (
  prompt: string,
  groups: string[],
  items: { label: string; group: string }[],
  explanation: string,
): SortRound => ({ type: "sort", prompt, groups, items, explanation });
export const demoGames: DemoGame[] = [
  {
    slug: "demo-kesir-mutfagi",
    title: "Kesir Mutfağı",
    subtitle: "Bir bütünden, bin keşif.",
    description:
      "Dilimleri paylaş, parçaları birleştir. Kesirleri küçük bir mutfak keşfiyle öğren.",
    subject: "matematik",
    grade: 4,
    minutes: 5,
    mechanic: "Seç ve keşfet",
    scene: "fractions",
    color: "#6643bd",
    background: "#efe7ff",
    objective:
      "Bir bütünün eş parçalarını kesirle ifade eder ve basit kesirleri karşılaştırır.",
    teacherNote:
      "Oyundan önce bir kâğıdı dört eş parçaya katlayın. Her soruda öğrencilerden yalnızca cevabı değil, bütünü nasıl paylaştıklarını da anlatmalarını isteyin.",
    rounds: [
      choice(
        "8 eş dilimden 3'ünü aldın. Bütünün ne kadarını aldın?",
        ["3/8", "5/8", "3/5"],
        "3/8",
        "Pay alınan 3 dilimi, payda bütündeki 8 eş dilimi gösterir.",
      ),
      choice(
        "Bir pizzanın yarısı, 8 eş dilimden kaçıdır?",
        ["2 dilim", "4 dilim", "6 dilim"],
        "4 dilim",
        "8 dilimi iki eş gruba ayırınca her grupta 4 dilim olur.",
      ),
      choice(
        "Aynı büyüklükteki pizzalardan hangi pay daha büyük?",
        ["1/4", "1/2", "1/8"],
        "1/2",
        "Bütün aynıysa yarım, çeyrekten ve sekizde birden büyüktür.",
      ),
    ],
  },
  {
    slug: "demo-sozcuk-esleri",
    title: "Sözcük Eşleri",
    subtitle: "Farklı sözcükler, aynı anlam.",
    description:
      "Anlam arkadaşlarını bul. Sözcük hazineni eşleştirerek genişlet.",
    subject: "turkce",
    grade: 3,
    minutes: 4,
    mechanic: "Eşleştir",
    scene: "words",
    color: "#a7464d",
    background: "#ffebe7",
    objective: "Sık kullanılan sözcüklerin eş anlamlılarını ayırt eder.",
    teacherNote:
      "Her eşleşmeden sonra iki sözcüğü de kullanarak birer cümle kurdurun. Eş anlamlıların her bağlamda birbirinin yerine geçmeyebileceğini konuşun.",
    rounds: [
      match(
        "Anlam arkadaşlarını eşleştir.",
        [
          ["Yanıt", "Cevap"],
          ["Öykü", "Hikâye"],
          ["Hediye", "Armağan"],
        ],
        "Bu sözcük çiftleri benzer anlamları ifade eder.",
      ),
      match(
        "Yeni sözcük çiftlerini bul.",
        [
          ["Hızlı", "Süratli"],
          ["Konuk", "Misafir"],
          ["Yıl", "Sene"],
        ],
        "Eş anlamlı sözcükler anlatımımıza çeşitlilik katar.",
      ),
    ],
  },
  {
    slug: "demo-gezegen-sirasi",
    title: "Gezegen Sırası",
    subtitle: "Güneş'ten başlayan bir yolculuk.",
    description:
      "Güneş Sistemi'nde yerini bul. Gezegenleri yakın olandan uzağa doğru sırala.",
    subject: "fen",
    grade: 6,
    minutes: 5,
    mechanic: "Sıraya koy",
    scene: "planets",
    color: "#d7caff",
    background: "#20234b",
    objective: "Gezegenlerin Güneş'e uzaklıklarına göre sırasını açıklar.",
    teacherNote:
      "Sıralama ile gezegen büyüklüklerinin farklı bilgiler olduğunu vurgulayın. Görselde boyut ve uzaklıkların ölçekli olmadığını öğrencilerle paylaşın.",
    rounds: [
      order(
        "İç gezegenleri Güneş'e yakın olandan uzağa sırala.",
        ["Merkür", "Venüs", "Dünya", "Mars"],
        "İlk dört gezegen Merkür, Venüs, Dünya ve Mars'tır.",
      ),
      order(
        "Dış gezegenleri Güneş'e yakın olandan uzağa sırala.",
        ["Jüpiter", "Satürn", "Uranüs", "Neptün"],
        "Jüpiter'den sonra Satürn, Uranüs ve Neptün gelir.",
      ),
    ],
  },
  {
    slug: "demo-yonunu-bul",
    title: "Yönünü Bul",
    subtitle: "Pusulan hazır. Haydi keşfe!",
    description:
      "Kuzeyden güneye, doğudan batıya. Yönler arasında küçük bir keşif turuna çık.",
    subject: "hayat",
    grade: 3,
    minutes: 4,
    mechanic: "Seç ve keşfet",
    scene: "compass",
    color: "#805517",
    background: "#fff0cd",
    objective: "Ana yönleri tanır ve bir plana göre konum tarif eder.",
    teacherNote:
      "Sınıfın basit bir krokisini çizin. Sabit bir kuzey oku ekleyerek öğrencilerden eşya konumlarını tarif etmelerini isteyin.",
    rounds: [
      choice(
        "Kuzeye bakıyorsun. Sağ kolun hangi yönü gösterir?",
        ["Batı", "Doğu", "Güney"],
        "Doğu",
        "Kuzeye bakarken sağımız doğu, solumuz batıdır.",
      ),
      choice(
        "Doğunun karşısındaki ana yön hangisidir?",
        ["Güney", "Kuzey", "Batı"],
        "Batı",
        "Doğu ve batı birbirinin karşısındadır.",
      ),
      choice(
        "Planda yukarısı kuzey. Aşağıya ilerlersen hangi yöne gidersin?",
        ["Güney", "Doğu", "Batı"],
        "Güney",
        "Kuzeyin karşısında güney bulunur.",
      ),
    ],
  },
  {
    slug: "demo-carpim-rotasi",
    title: "Çarpım Rotası",
    subtitle: "Her adımda yeni bir çarpım.",
    description:
      "Sayıların arasında yolunu bul. Çarpımları sonuçlarıyla buluştur.",
    subject: "matematik",
    grade: 3,
    minutes: 4,
    mechanic: "Eşleştir",
    scene: "multiply",
    color: "#6643bd",
    background: "#eae5ff",
    objective: "Çarpma işlemini eş gruplarla ilişkilendirir.",
    teacherNote:
      "İşlemleri önce küçük nesne gruplarıyla modelleyin. Aynı sonucu veren farklı çarpımları tartışın.",
    rounds: [
      match(
        "Çarpımları sonuçlarıyla eşleştir.",
        [
          ["3 × 4", "12"],
          ["5 × 5", "25"],
          ["6 × 3", "18"],
        ],
        "Çarpma, eş büyüklükteki grupların toplamını kısa yoldan bulur.",
      ),
      match(
        "Rotanın ikinci bölümünü tamamla.",
        [
          ["7 × 4", "28"],
          ["8 × 5", "40"],
          ["9 × 6", "54"],
        ],
        "Bir çarpımı bildiğin daha küçük çarpımlara ayırarak da bulabilirsin.",
      ),
    ],
  },
  {
    slug: "demo-cumle-ustasi",
    title: "Cümle Ustası",
    subtitle: "Sözcükleri bir araya getir.",
    description:
      "Dağınık sözcükleri düzenle. İstenen anlamı taşıyan cümleyi oluştur.",
    subject: "turkce",
    grade: 4,
    minutes: 4,
    mechanic: "Sıraya koy",
    scene: "sentence",
    color: "#a7464d",
    background: "#ffe9df",
    objective: "Verilen sözcüklerle kurallı ve anlamlı cümle kurar.",
    teacherNote:
      "Türkçede farklı sözcük dizilişlerinin mümkün olduğunu konuşun. Bu oyunda verilen başlangıç ve kurallı cümle koşuluna uyulduğunu hatırlatın.",
    rounds: [
      order(
        "“Bugün” ile başlayan kurallı cümleyi kur.",
        ["Bugün", "birlikte", "kitap", "okuduk."],
        "Kurallı cümlede yüklem sonda bulunur: Bugün birlikte kitap okuduk.",
      ),
      order(
        "“Minik” ile başlayan kurallı cümleyi kur.",
        ["Minik", "kuş", "ağaca", "kondu."],
        "Minik kuş ağaca kondu. Sözcükler birlikte tamamlanmış bir anlam oluşturur.",
      ),
    ],
  },
  {
    slug: "demo-devreyi-tamamla",
    title: "Devreyi Tamamla",
    subtitle: "Bir fikir, bir ışık.",
    description:
      "Pil, ampul ve anahtarın görevlerini keşfet. Basit bir elektrik devresini tanı.",
    subject: "fen",
    grade: 5,
    minutes: 5,
    mechanic: "Seç ve keşfet",
    scene: "circuit",
    color: "#126b68",
    background: "#dff3ed",
    objective:
      "Basit elektrik devresinin elemanlarını ve kapalı devrenin işlevini açıklar.",
    teacherNote:
      "Etkinliği pil kullanılan basit bir sınıf devresiyle ilişkilendirin. Ev prizleriyle deney yapılmayacağını belirtin.",
    rounds: [
      choice(
        "Devreye elektrik enerjisini hangi eleman sağlar?",
        ["Pil", "Anahtar", "Ampul"],
        "Pil",
        "Pil devrenin enerji kaynağıdır.",
      ),
      choice(
        "Diğer parçalar sağlamken anahtar açılırsa ne olur?",
        ["Ampul daha çok parlar", "Ampul söner", "Pil çoğalır"],
        "Ampul söner",
        "Açık anahtar devredeki yolu keser; ampul ışık vermez.",
      ),
      choice(
        "Devre elemanları arasındaki bağlantıyı hangisi sağlar?",
        ["Cam", "Bağlantı kablosu", "Tahta"],
        "Bağlantı kablosu",
        "İletken bağlantı kabloları kapalı bir yol oluşturur.",
      ),
    ],
  },
  {
    slug: "demo-geri-donusum",
    title: "Geri Dönüşüm",
    subtitle: "Küçük seçimler, büyük dönüşüm.",
    description:
      "Malzemeleri tanı, doğru gruba ayır. Yeniden kullanım üzerine düşün.",
    subject: "hayat",
    grade: 3,
    minutes: 4,
    mechanic: "Grupla",
    scene: "recycle",
    color: "#357052",
    background: "#e2f1d7",
    objective:
      "Temiz ve boş ambalajları yapıldıkları malzemeye göre sınıflandırır.",
    teacherNote:
      "Bu oyun malzemeleri tanıtır. Gerçek toplama kutularının etiketlerini ve yerel toplama kurallarını ayrıca inceleyin.",
    rounds: [
      sort(
        "Temiz ve boş ambalajları malzemesine göre ayır.",
        ["Kâğıt", "Cam", "Plastik"],
        [
          { label: "Gazete", group: "Kâğıt" },
          { label: "Cam kavanoz", group: "Cam" },
          { label: "Plastik şişe", group: "Plastik" },
        ],
        "Ambalajları malzemesine göre ayırmak geri dönüşümü kolaylaştırır.",
      ),
      sort(
        "Yeni malzemeleri doğru gruba yerleştir.",
        ["Kâğıt", "Cam", "Plastik"],
        [
          { label: "Karton kutu", group: "Kâğıt" },
          { label: "Cam şişe", group: "Cam" },
          { label: "Plastik kapak", group: "Plastik" },
        ],
        "Temiz ve boş malzemeleri ayırırken üzerlerindeki etiketlerden de yararlanabiliriz.",
      ),
    ],
  },
  {
    slug: "demo-geometri-dedektifi",
    title: "Geometri Dedektifi",
    subtitle: "Şekiller ipuçları bırakır.",
    description:
      "Kenarları ve köşeleri incele. Geometrik şekillerin ortak özelliklerini bul.",
    subject: "matematik",
    grade: 5,
    minutes: 5,
    mechanic: "Grupla",
    scene: "geometry",
    color: "#51419a",
    background: "#eee8ff",
    objective: "Çokgenleri kenar sayılarına göre sınıflandırır.",
    teacherNote:
      "Bir şeklin döndürüldüğünde adının değişmediğini gösterin. Yalnızca düzgün çokgen örnekleriyle sınırlı kalmayın.",
    rounds: [
      sort(
        "Şekilleri kenar sayılarına göre grupla.",
        ["3 kenar", "4 kenar", "5 kenar"],
        [
          { label: "Üçgen", group: "3 kenar" },
          { label: "Dikdörtgen", group: "4 kenar" },
          { label: "Beşgen", group: "5 kenar" },
        ],
        "Çokgenlerin kenar ve köşe sayıları eşittir.",
      ),
      sort(
        "Yeni şekillerin kenar sayısını bul.",
        ["4 kenar", "6 kenar", "8 kenar"],
        [
          { label: "Kare", group: "4 kenar" },
          { label: "Altıgen", group: "6 kenar" },
          { label: "Sekizgen", group: "8 kenar" },
        ],
        "Kare de bir dörtgendir; her dörtgenin dört kenarı vardır.",
      ),
    ],
  },
  {
    slug: "demo-paragraf-dedektifi",
    title: "Paragraf Dedektifi",
    subtitle: "Dikkatli okuyana her şey bir ipucu.",
    description: "Kısa metinleri oku, ipuçlarını birleştir. Ana düşünceyi bul.",
    subject: "turkce",
    grade: 7,
    minutes: 6,
    mechanic: "Seç ve keşfet",
    scene: "paragraph",
    color: "#944b41",
    background: "#ffede3",
    objective: "Kısa bir metindeki açık bilgileri ve ana düşünceyi belirler.",
    teacherNote:
      "Doğru cevaptan sonra metindeki kanıt cümlesini buldurun. Tahmin ile metinden çıkarılan bilgiyi ayırın.",
    rounds: [
      choice(
        "Ece her sabah saksısını kontrol etti. Toprak kuruduğunda suladı. Bir hafta sonra yeni bir yaprak gördü. Ece ne zaman suladı?",
        ["Her saat", "Toprak kuruduğunda", "Yaprak döküldüğünde"],
        "Toprak kuruduğunda",
        "Metin sulama zamanını açıkça söylüyor: Toprak kuruduğunda.",
      ),
      choice(
        "Sınıfımızda herkes farklı bir konuda iyi. Bir proje yaparken görevleri paylaşıyor, birbirimizden öğreniyoruz. Metnin ana düşüncesi nedir?",
        [
          "Herkes aynı işi yapmalı",
          "Projeler tek başına yapılır",
          "Farklı beceriler iş birliğini güçlendirir",
        ],
        "Farklı beceriler iş birliğini güçlendirir",
        "Metin, farklı becerilerin birlikte çalışmaya katkısını anlatır.",
      ),
    ],
  },
  {
    slug: "demo-besin-zinciri",
    title: "Besin Zinciri",
    subtitle: "Doğada her şey birbirine bağlı.",
    description:
      "Canlılar arasındaki beslenme ilişkilerini keşfet. Enerjinin izini sür.",
    subject: "fen",
    grade: 8,
    minutes: 5,
    mechanic: "Sıraya koy",
    scene: "chain",
    color: "#296b50",
    background: "#e5f2dc",
    objective: "Basit besin zincirlerinde üretici ve tüketicileri sıralar.",
    teacherNote:
      "Okların enerjinin aktarım yönünü gösterdiğini açıklayın. Doğadaki ilişkilerin tek bir zincirden daha karmaşık olduğunu tartışın.",
    rounds: [
      order(
        "Enerjinin aktarım yönüne göre, üreticiden başla.",
        ["Ot", "Çekirge", "Kurbağa", "Yılan"],
        "Ot üreticidir. Enerji, onu yiyen çekirgeye ve sonraki tüketicilere aktarılır.",
      ),
      order(
        "Bu basit zinciri üreticiden başlayarak kur.",
        ["Buğday", "Fare", "Baykuş"],
        "Buğday üretici, fare ve baykuş tüketicidir.",
      ),
    ],
  },
  {
    slug: "demo-mevsim-takvimi",
    title: "Mevsim Takvimi",
    subtitle: "Bir yıl, dört farklı renk.",
    description:
      "Ayları mevsimleriyle buluştur. Türkiye'deki mevsim takvimini keşfet.",
    subject: "hayat",
    grade: 3,
    minutes: 4,
    mechanic: "Eşleştir",
    scene: "seasons",
    color: "#8a5b19",
    background: "#fff1d4",
    objective: "Türkiye için ayları takvim mevsimleriyle ilişkilendirir.",
    teacherNote:
      "Bu sınıflandırmanın Türkiye'nin bulunduğu Kuzey Yarım Küre için olduğunu belirtin. Havanın her yıl aynı gün değişmediğini konuşun.",
    rounds: [
      match(
        "Türkiye'de bu ayları mevsimleriyle eşleştir.",
        [
          ["Ocak", "Kış"],
          ["Nisan", "İlkbahar"],
          ["Temmuz", "Yaz"],
          ["Ekim", "Sonbahar"],
        ],
        "Takvim mevsimleri üçer aydan oluşur.",
      ),
      match(
        "Diğer ayların mevsimlerini bul.",
        [
          ["Şubat", "Kış"],
          ["Mayıs", "İlkbahar"],
          ["Ağustos", "Yaz"],
          ["Kasım", "Sonbahar"],
        ],
        "Aynı mevsimdeki günlerde bile hava durumu değişebilir.",
      ),
    ],
  },
  {
    slug: "demo-ondalik-pazari",
    title: "Ondalık Pazarı",
    subtitle: "Sayıları günlük hayatta keşfet.",
    description:
      "Fiyat etiketlerini karşılaştır. Ondalık gösterimleri küçükten büyüğe sırala.",
    subject: "matematik",
    grade: 6,
    minutes: 5,
    mechanic: "Sıraya koy",
    scene: "decimals",
    color: "#6541a7",
    background: "#ede3f9",
    objective: "Ondalık gösterimleri basamak değerlerine göre karşılaştırır.",
    teacherNote:
      "Fiyatların örnek değerler olduğunu belirtin. Karşılaştırırken önce tam kısma, ardından ondalık basamaklara bakıldığını modelleyin.",
    rounds: [
      order(
        "Örnek fiyatları küçükten büyüğe sırala.",
        ["2,05 TL", "2,50 TL", "2,75 TL", "3,00 TL"],
        "Tam kısım aynıysa önce onda birler, sonra yüzde birler basamağı karşılaştırılır.",
      ),
      order(
        "Ondalık sayıları küçükten büyüğe sırala.",
        ["0,09", "0,25", "0,50", "0,90"],
        "0,09 dokuz yüzde birdir; 0,90 ise doksan yüzde birdir.",
      ),
    ],
  },
  {
    slug: "demo-noktalama-atolyesi",
    title: "Noktalama Atölyesi",
    subtitle: "Küçük işaretler, büyük anlamlar.",
    description:
      "Cümleleri dikkatle oku. Noktalama işaretlerinin anlatıma katkısını keşfet.",
    subject: "turkce",
    grade: 5,
    minutes: 4,
    mechanic: "Seç ve keşfet",
    scene: "punctuation",
    color: "#a74557",
    background: "#fce7ed",
    objective: "Nokta, soru işareti ve virgülün temel işlevlerini ayırt eder.",
    teacherNote:
      "Aynı cümleyi farklı vurgu ve duraklarla sesli okutun. Noktalamanın yalnızca duraklamak olmadığını örneklerle gösterin.",
    rounds: [
      choice(
        "“Bugün hangi kitabı okuyorsun” cümlesinin sonuna hangisi gelir?",
        ["Nokta (.)", "Soru işareti (?)", "Virgül (,)"],
        "Soru işareti (?)",
        "Bu cümle bir soru soruyor; sonuna soru işareti gelir.",
      ),
      choice(
        "“Çantama kitap, defter ve kalem koydum.” cümlesinde virgül neyi ayırır?",
        ["Sıralanan eşyaları", "İki soruyu", "Bir kelimenin hecelerini"],
        "Sıralanan eşyaları",
        "Virgül burada birbiri ardınca sıralanan eş görevli sözcükleri ayırır.",
      ),
      choice(
        "“Ders bitti” cümlesinin sonuna hangi işaret uygundur?",
        ["Virgül (,)", "Nokta (.)", "Soru işareti (?)"],
        "Nokta (.)",
        "Tamamlanmış bir yargı bildiren cümlenin sonunda nokta kullanılır.",
      ),
    ],
  },
  {
    slug: "demo-maddenin-halleri",
    title: "Maddenin Halleri",
    subtitle: "Aynı madde, farklı hâller.",
    description:
      "Katı, sıvı ve gaz örneklerini ayır. Maddenin değişen hâllerini tanı.",
    subject: "fen",
    grade: 4,
    minutes: 4,
    mechanic: "Grupla",
    scene: "states",
    color: "#126b78",
    background: "#e0f2f4",
    objective:
      "Günlük hayattaki maddeleri fiziksel hâllerine göre sınıflandırır.",
    teacherNote:
      "Görünür bulut ile gaz hâlindeki su buharının farklı olduğunu açıklayın. Sınıflandırmada belirtilen koşulları dikkate alın.",
    rounds: [
      sort(
        "Verilen örnekleri maddenin hâline göre ayır.",
        ["Katı", "Sıvı", "Gaz"],
        [
          { label: "Buz küpü", group: "Katı" },
          { label: "Bardaktaki su", group: "Sıvı" },
          { label: "Havadaki su buharı", group: "Gaz" },
        ],
        "Su; buz, sıvı su ve su buharı hâllerinde bulunabilir.",
      ),
      sort(
        "Oda koşullarındaki örnekleri grupla.",
        ["Katı", "Sıvı", "Gaz"],
        [
          { label: "Taş", group: "Katı" },
          { label: "Zeytinyağı", group: "Sıvı" },
          { label: "Oksijen", group: "Gaz" },
        ],
        "Maddeleri sınıflandırırken bulundukları koşulları da düşünürüz.",
      ),
    ],
  },
  {
    slug: "demo-guvenli-yol",
    title: "Güvenli Yol",
    subtitle: "Dikkat et, düşün, doğru yolu seç.",
    description:
      "Yaya olarak karşılaşabileceğin durumları düşün. Güvenli seçimleri ayırt et.",
    subject: "hayat",
    grade: 3,
    minutes: 4,
    mechanic: "Seç ve keşfet",
    scene: "crossing",
    color: "#82591b",
    background: "#fff0d5",
    objective: "Yaya güvenliğiyle ilgili temel davranışları ayırt eder.",
    teacherNote:
      "Etkinliği okul çevresinin koşullarıyla ilişkilendirin. Oyun, gerçek trafikte yetişkin rehberliğinin yerine geçmez.",
    rounds: [
      choice(
        "Yaya ışığı kırmızı yanıyor. Ne yapmalısın?",
        ["Koşarak geçmeliyim", "Kaldırımda beklemeliyim", "Yola inmeliyim"],
        "Kaldırımda beklemeliyim",
        "Kırmızı yaya ışığında kaldırımda güvenli bir yerde bekleriz.",
      ),
      choice(
        "Karşıya geçerken hangisi daha güvenlidir?",
        [
          "Telefona bakmak",
          "Çevreyi ve araçları kontrol etmek",
          "Gözleri kapatmak",
        ],
        "Çevreyi ve araçları kontrol etmek",
        "Geçiş izni olsa bile çevremizi ve araçları kontrol ederiz.",
      ),
      choice(
        "Yürürken hangi alanı tercih etmelisin?",
        ["Taşıt yolunu", "Park etmiş araçların arasını", "Kaldırımı"],
        "Kaldırımı",
        "Kaldırım yayaların yürümesi için ayrılmış alandır.",
      ),
    ],
  },
];
