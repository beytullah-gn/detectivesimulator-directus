const DIRECTUS_URL = (process.env.DIRECTUS_URL || "http://127.0.0.1:8057").replace(/\/$/, "");
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN || process.env.BOOTSTRAP_TOKEN || "";

if (!DIRECTUS_TOKEN) {
  throw new Error("DIRECTUS_TOKEN or BOOTSTRAP_TOKEN must be provided.");
}

function log(message) {
  console.log(`[catalog] ${message}`);
}

async function api(path, { method = "GET", body } = {}) {
  const response = await fetch(`${DIRECTUS_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${DIRECTUS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(
      `${method} ${path} failed: ${payload?.errors?.[0]?.message || payload?.error || response.statusText}`
    );
  }

  return payload;
}

function encode(value) {
  return encodeURIComponent(String(value || ""));
}

const categorySeeds = [
  {
    title: "Kurumsal Sabotaj",
    slug: "kurumsal-sabotaj",
    description:
      "Yatirim baskisi, veri sizintisi ve beyaz yaka gerilimleri etrafinda kurulan ic tehdit vakalari.",
    theme_statement:
      "Ofis koridorlari sakin gorunur ama en kirli izler genelde yonetim katindan cikar.",
    seo_title:
      "Kurumsal sabotaj vakalari | Startup, finans ve ofis ici dedektif dosyalari",
    seo_description:
      "Kurumsal sabotaj kategorisinde veri sizintisi, ic tehdit ve yonetim baskisi merkezli dedektif vakalarini inceleyin.",
    landing_narrative:
      "Kurumsal sabotaj vakalari, gorunurde duzenli calisan ekiplerin icinde saklanan kisa vadeli cikarlari, baski altindaki yoneticileri ve kolayca ortadan kaybolabilen dijital izleri merkeze alir.\n\nBu kategoride oyuncu sadece kim yalan soyluyor sorusuna degil, hangi kisinin kurumsal proseduru kendi lehine buktugune de bakar. Takvim bosluklari, rapor sapmalari ve ofis ici guc dengeleri ayni anda okunur.\n\nSEO tarafinda bu kategori; startup suclari, sirket ici veri sizintisi, ofis ici hirsizlik senaryolari ve beyaz yaka gerilimleri gibi daha hedefli arama niyetlerini yakalamak icin kullanilir.",
    faq_items: [
      {
        question: "Kurumsal sabotaj vakalarinda oyuncu neye odaklanir?",
        answer:
          "En kritik sinyal; prosedur, yetki ve zamanlama ucgeninin bir kisi lehine bükulmesidir. Log bosluklari, finansal baski ve savunmaci alibiler birlikte okunur.",
      },
      {
        question: "Bu kategori neden SEO icin guclu?",
        answer:
          "Startup veri sizintisi, ic tehdit ve kurumsal hirsizlik gibi daha spesifik arama kaliplarina cevap verir; bu da landing sayfalarini tekil vaka sluglarindan daha genis bir niyet katmanina tasir.",
      },
      {
        question: "Zorluk seviyesi neden daha analitik hissedilir?",
        answer:
          "Fiziksel kanit kadar dijital is akisi, takim ici guven iliskisi ve yonetsel baski da okunmak zorundadir; oyuncu motiveyi sadece kisilikten degil is akislardan cikarir.",
      },
    ],
    accent_color: "#BA7D2F",
    status: "published",
  },
  {
    title: "Sanat ve Muzayede",
    slug: "sanat-ve-muzayede",
    description:
      "Galeriler, ozel gosterimler ve koleksiyonerler arasinda gecen prestij odakli hirsizlik vakalari.",
    theme_statement:
      "Bir eserin degeri sadece tablodaki boya degil, onu kimin ne zaman gordugudur.",
    seo_title:
      "Sanat ve muzayede vakalari | Galeri hirsizligi ve koleksiyoner dosyalari",
    seo_description:
      "Sanat ve muzayede kategorisinde galeri geceleri, replika oyunlari ve prestij odakli eser hirsizliklarini konu alan dedektif vakalarini kesfedin.",
    landing_narrative:
      "Sanat ve muzayede vakalari, bir eserin piyasadaki degeri ile sahadaki hareketi arasindaki gerilimi takip eder. Burada fail sadece kilidi acan kisi olmayabilir; deger algisini, kalabaligi ve dikkat daginikligini yoneten kisi de oyunun merkezindedir.\n\nGaleri katinda guvenlik tek basina yeterli degildir. Kime ne zaman bakildigi, kimin odadan ne zaman kayboldugu ve orijinal ile replika arasindaki ince farklar bir araya gelmeden resim tamamlanmaz.\n\nKategori landing'i; galeri hirsizligi oyunu, muzayede dedektif senaryosu, sanat eseri replika degisimi gibi daha niyet odakli sorgulara dogrudan cevap vermek icin kullanilir.",
    faq_items: [
      {
        question: "Sanat kategorisindeki vakalarin digerlerinden farki nedir?",
        answer:
          "Bu dosyalarda fail genelde fiziksel kuvvetle degil algi yonetimi, sahneleme ve kalabalik icinde zaman penceresi yaratarak hareket eder.",
      },
      {
        question: "Oyuncu hangi kanitlara daha dikkat etmeli?",
        answer:
          "Sigorta klasorleri, kasa erisim akisi, eser rotalari ve etkinlik sirasinda olusan dikkat bosluklari burada temel kanit gruplaridir.",
      },
      {
        question: "Bu kategori SEO tarafinda ne kazandirir?",
        answer:
          "Sanat eseri hirsizligi, galeri gizemi ve muzayede dedektif oyunu gibi aramalar tekil senaryolardan daha genis bir toplama sayfa ihtiyaci dogurur.",
      },
    ],
    accent_color: "#8E5E4A",
    status: "published",
  },
  {
    title: "Liman ve Kacakcilik",
    slug: "liman-ve-kacakcilik",
    description:
      "Manifestolar, gumruk aciklari ve sevkiyat sapmalari uzerinden kurulan lojistik suc dosyalari.",
    theme_statement:
      "Limanlarda gec kalan her konteyner sadece trafik degil, bazen planlanmis bir sessizliktir.",
    seo_title:
      "Liman ve kacakcilik vakalari | Gumruk, manifesto ve sevkiyat gizemleri",
    seo_description:
      "Liman ve kacakcilik kategorisinde manifesto degisikligi, gumruk bosluklari ve sevkiyat sapmalarini konu alan dedektif vakalarini inceleyin.",
    landing_narrative:
      "Liman ve kacakcilik vakalari, fiziksel sevkiyat ile evrak zincirinin ayni anda manipule edildigi daha soguk ve sistematik dosyalari toplar. Burada bir kasa eksikligi tek basina bir sonuc degil, once evrakta acilan bir gedigin yansimasidir.\n\nOyuncu; vardiya degisimi, uzaktan erisim, seal numarasi ve manifesto versiyonlari gibi birbirinden kopuk gorunen detaylari ayni anlatida birlestirmek zorundadir. Bu da kategoriye daha prosedurel ve zincir bazli bir ritim verir.\n\nSEO acisindan kategori; liman dedektif oyunu, gumruk kacakcilik senaryosu, konteyner manifesto gizemi gibi arama niyetlerini hedefler.",
    faq_items: [
      {
        question: "Liman dosyalarinda ilk bakilacak katman nedir?",
        answer:
          "Genelde ilk kirilan halka fiziksel depo degil, evrak akisidir. Manifesto versiyonlari ile vardiya notlari once yan yana okunmalidir.",
      },
      {
        question: "Bu vakalar neden daha sistem odakli hissedilir?",
        answer:
          "Fail, tek bir alan yerine depo, beyan ve onay zincirinin farkli noktalarini kullanir. Bu da sucu kisi davranisindan cok akisin kendi icinden cikarir.",
      },
      {
        question: "Kategori sayfasi ne islev gorur?",
        answer:
          "Ayni tema altindaki konteyner, gumruk ve transit odakli vakalari tek yerde toplar; hem kullaniciya secim zemini saglar hem de arama motoru icin konu otoritesi uretir.",
      },
    ],
    accent_color: "#3F6B78",
    status: "published",
  },
];

const scenarioSeeds = [
  {
    categorySlug: "kurumsal-sabotaj",
    scenario: {
      title: "Galata Patent Dosyası",
      slug: "galata-patent-dosyasi",
      teaser: "Bir startup ofisinde yatirim sunumu oncesi kritik patent dosyasi kaybolur.",
      description:
        "Yatirimci sunumundan saatler once sirketin en degerli patent dosyasi sirket arsivinden silinmistir. Dosyayi disariya satan kisi iceriden biridir.",
      estimated_duration: 25,
      difficulty: "normal",
      popularity_score: 182,
      summary_for_ai:
        "Culprit is Bora Demir. He sold the patent summary to pay gambling debts. He deleted access logs, blamed a security issue, and used Elif's meeting window as cover.",
      scenario_answer_rule:
        "The correct culprit is Bora Demir. A complete explanation should mention financial motive, access log deletion, Bora's inconsistent alibi, and the timing gap during Elif's investor meeting.",
      status: "published",
    },
    characters: [
      {
        name: "Elif",
        surname: "Arman",
        role: "CEO",
        age: 34,
        description: "Sirketin kurucusu. Sunum oncesi yatirimcilarla kapali toplantidaydi.",
        background: "Ekibi bir arada tutmaya calisan, sonuc odakli bir yonetici.",
        personality: "Kontrollu, baski altinda sogukkanli.",
        alibi: "Sunum provasi sirasinda yatirimcilarla toplantidaydi.",
        question_prompts: [
          "Yatirimci toplantisi baslamadan once kimlerle gorustun?",
          "Bora'nin son haftalardaki tavrinda seni rahatsiz eden neydi?",
          "Arsiv koridorundaki bosluk sence tesaduf olabilir mi?",
        ],
        behavior_during_incident: "Patent dosyasi kaybolunca hizla guvenlik kaydini istedi.",
        motive: "Sirketi kurtarmak istiyor ama dosyayi satmasinin ona dogrudan faydasi yok.",
        secret_info: "Bora'nin son haftalarda finansal raporlarda agresif davrandigini fark etti.",
        is_guilty: false,
        status: "published",
      },
      {
        name: "Bora",
        surname: "Demir",
        role: "Finans Direktoru",
        age: 39,
        description: "Sirket butcesini yoneten, rakamlari iyi bilen deneyimli yonetici.",
        background: "Yatirim baskisi arttikca riskli kisisel borclar aldi.",
        personality: "Soguk, savunmaci, ikna kabiliyeti yuksek.",
        alibi: "Dosya kayboldugunda arsiv odasinda olmadigini soyluyor.",
        question_prompts: [
          "Dosya silindigi saatlerde tam olarak hangi isle ilgileniyordun?",
          "Dis saldiri ihtimalinden neden bu kadar eminsin?",
          "Son gunlerdeki finansal baskini nasil yonettigini anlatir misin?",
        ],
        behavior_during_incident: "Surekli konuyu dis saldiri ihtimaline cekmeye calisti.",
        motive: "Ciddi kumar borcunu kapatmak icin dosyayi sizdirdi.",
        secret_info: "Elif'in toplanti takvimini kullanarak bosluk yaratti ve loglari sildi.",
        is_guilty: true,
        status: "published",
      },
      {
        name: "Zeynep",
        surname: "Kaya",
        role: "Lead Engineer",
        age: 29,
        description: "Patent dosyasinin teknik kismini hazirlayan ekip lideri.",
        background: "Aylardir urun uzerinde calisti ve fikri mulkiyet konusuna hassas.",
        personality: "Titiz, ice donuk, prensipli.",
        alibi: "Laboratuvarda son testleri tamamladigini soyluyor.",
        question_prompts: [
          "Log boslugunu ilk fark ettiginde aklina kim geldi?",
          "Bora ile butce tartismalariniz ne kadar siddetliydi?",
          "Patent dosyasina erisimi olan ekip icinde kimi riskli goruyorsun?",
        ],
        behavior_during_incident: "Arsiv erisim loglarinin eksik oldugunu ilk fark eden kisi oldu.",
        motive: "Emek verdigi urunu korumak istiyor; sizdirmak icin nedeni yok.",
        secret_info: "Bora'yi arsiv koridorunda gormedi ama dosya sonrasi panikledigini sezdi.",
        is_guilty: false,
        status: "published",
      },
      {
        name: "Derya",
        surname: "Acar",
        role: "Guvenlik Sorumlusu",
        age: 42,
        description: "Ofis ici erisim sisteminden ve kamera kayitlarindan sorumlu.",
        background: "Eski ozel guvenlik uzmani, prosedurlere bagli.",
        personality: "Dikkatli, supheci, kuralci.",
        alibi: "Sunum hazirligi nedeniyle giris cikislari kontrol ediyordu.",
        question_prompts: [
          "Guvenlik odasinda o gun seni en cok sasirtan sey neydi?",
          "Hangi kayitlar manuel mudahaleye isaret ediyor?",
          "Bora'nin guvenlik odasina sik gelmesini nasil yorumladin?",
        ],
        behavior_during_incident: "Silinen loglarin manuel mudahaleyle kaybedildigini dusundu.",
        motive: "Itibari prosedurlerin duzgun islemesine bagli; dosyayi satmasi mantikli degil.",
        secret_info: "Bora'nin guvenlik odasina normalden fazla ugradigini hatirliyor.",
        is_guilty: false,
        status: "published",
      },
    ],
    media: [
      {
        type: "Belge",
        title: "Erisim Kaydi Raporu",
        description: "Arsiv odasindaki erisim kaydinda 14:12 ile 14:19 arasi bosluk bulunuyor.",
        content: "Kart erisim sistemi belirli bir pencerede manuel olarak devre disi birakilmis gorunuyor.",
        is_key_evidence: true,
        status: "published",
      },
      {
        type: "Not",
        title: "Finans Uyarisi",
        description: "Bora'nin kisisel hesabina gelen yuksek tutarli haciz bildirimi.",
        content: "Gizli muhasebe notunda Bora'nin acil likidite baskisi altinda oldugu yaziyor.",
        is_key_evidence: true,
        status: "published",
      },
      {
        type: "Rapor",
        title: "Toplanti Takvimi",
        description: "Elif'in yatirimci toplantisi sirasinda ofis koridorunda kor nokta olusuyor.",
        content: "Toplanti odasi cevresi bosalinca arsiv koridoru birkac dakika gozetimsiz kalmis.",
        is_key_evidence: false,
        status: "published",
      },
    ],
    hints: [
      {
        title: "Eksik Kayit",
        text: "Silinen erisim araligi rastgele degil; toplanti baslangiciyla cakisiyor.",
        type: "zamanlama",
        reveal_order: 1,
        status: "published",
      },
      {
        title: "Finansal Baski",
        text: "Sirket icinden sadece bir kisinin disariya para yetistirme zorunlulugu vardi.",
        type: "motivasyon",
        reveal_order: 2,
        status: "published",
      },
      {
        title: "Yanlis Yonlendirme",
        text: "Suclu kisi konusurken surekli dis saldiri ihtimalini one cikariyor.",
        type: "davranis",
        reveal_order: 3,
        status: "published",
      },
    ],
    relations: [
      ["Elif Arman", "Bora Demir", "Elif son haftalarda Bora'nin butce tablolarini savunmaci bicimde kapattigini dusunuyor.", "medium"],
      ["Bora Demir", "Elif Arman", "Bora, Elif'in yatirim baskisini kendi hatalarini gizlemek icin kullanabilecegini dusunuyor.", "medium"],
      ["Zeynep Kaya", "Bora Demir", "Zeynep teknik butce taleplerinde Bora ile sik sik gerilim yasadi.", "medium"],
      ["Derya Acar", "Bora Demir", "Derya, Bora'nin guvenlik odasina gerekenden fazla ugramasini tuhaf buluyor.", "medium"],
      ["Elif Arman", "Zeynep Kaya", "Elif, Zeynep'e en guvendigi ekip lideri gibi davraniyor.", "low"],
      ["Zeynep Kaya", "Derya Acar", "Zeynep ve Derya olay sonrasi log boslugunu birlikte fark etti.", "low"],
    ],
  },
  {
    categorySlug: "sanat-ve-muzayede",
    scenario: {
      title: "Pera Galeri Gecesi",
      slug: "pera-galeri-gecesi",
      teaser: "Ozel on izleme gecesinde muzayedeye cikacak orijinal cizim kasadan kaybolur.",
      description:
        "Pera'daki ozel bir galeride, acilis gecesinden dakikalar once en degerli eskiz orijinali kaybolur. Yerine bir replika yerlestirilmistir ve ekip icerisinden biri buna zaman penceresi yaratmistir.",
      estimated_duration: 35,
      difficulty: "hard",
      popularity_score: 149,
      summary_for_ai:
        "Culprit is Kerem Sonmez. He sold the original sketch to a private collector to escape blackmail tied to event cashflow gaps. He triggered a false humidity alarm, used Asli's walkthrough to clear the vault corridor, and swapped the piece during the confusion.",
      scenario_answer_rule:
        "The correct culprit is Kerem Sonmez. A strong answer must mention the fake humidity alarm, Kerem's access to the vault workflow, the replica swap, and his blackmail-driven motive linked to missing event cash.",
      status: "published",
    },
    characters: [
      {
        name: "Asli",
        surname: "Yalcin",
        role: "Bas Kurator",
        age: 37,
        description: "Gecenin kurgu ve eser akisini yoneten bas kurator.",
        background: "Galeri itibarini her seyin ustunde tutan disiplinli bir curator.",
        personality: "Keskin, kontrolcu, panik aninda otoriter.",
        alibi: "Acilis turu icin bagiscilarla ana salondaydi.",
        question_prompts: [
          "Kasa koridoru bosaldiginda kimin eksik oldugunu fark ettin mi?",
          "Kerem'in acilis aksami uzerindeki kontrolu sence normal miydi?",
          "Eser replika ile degistirilmis olsaydi bunu kimler anlayabilirdi?",
        ],
        behavior_during_incident: "Alarm calmadan once eser etiketlerini son kez kontrol etti.",
        motive: "Galeri itibarini korumak ister; eseri satmasi kariyerini bitirirdi.",
        secret_info: "Kerem'in gun icinde sigorta klasorunu iki kez istemesi dikkatini cekti.",
        is_guilty: false,
        status: "published",
      },
      {
        name: "Kerem",
        surname: "Sonmez",
        role: "Operasyon Yoneticisi",
        age: 41,
        description: "Etkinlik lojistigi, kasa gecisleri ve tedarikci akisindan sorumlu.",
        background: "Bir suredir galeri adina yaptigi nakit avans aciklarini gizlemeye calisiyor.",
        personality: "Rahat gorunen ama baski altinda surekli kontrol arayan biri.",
        alibi: "Alarm calmadan hemen once teknik ekiple oldugunu soyluyor.",
        question_prompts: [
          "Nem alarmi neden sadece bir kez calisti?",
          "Kasa gecis protokollerini senin disinda kim degistirebilir?",
          "Sigorta degerini acilis aksami neden tekrar teyit ettin?",
        ],
        behavior_during_incident: "Alarmdan sonra herkesi yanlis salona yonlendirdi.",
        motive: "Ozel bir koleksiyoncunun santaji altinda, aciklarini kapatmak icin eseri satmaya razi oldu.",
        secret_info: "Replika kutusunu teknik ekip adina kendi teslim aldi.",
        is_guilty: true,
        status: "published",
      },
      {
        name: "Mina",
        surname: "Erdem",
        role: "Restorasyon Uzmani",
        age: 32,
        description: "Eserin yuzey analizini yapan ve orijinallik raporunu hazirlayan uzman.",
        background: "Gecmise dair tum restorasyon zincirini ezbere bilen takintili bir uzman.",
        personality: "Detayci, sessiz, teknik olarak cok net.",
        alibi: "Arka ofiste son UV raporlarini kilitliyordu.",
        question_prompts: [
          "Replika ile orijinal arasindaki ilk fark neydi?",
          "Kerem'in kasa teslim zincirine mudahalesi olur muydu?",
          "Alarmdan hemen sonra hangi teknik iz sana sahte degisimi dusundurdu?",
        ],
        behavior_during_incident: "Cam liflerinde farkli bir toz yapisi gordugunu soyledi.",
        motive: "Teknik emegini sabote edecek bir hirsizlik ona zarar verir, fayda saglamaz.",
        secret_info: "Kerem'in etiket kapsullerine normalde sahip olmamasi gereken bir anahtara eristigini biliyor.",
        is_guilty: false,
        status: "published",
      },
      {
        name: "Cem",
        surname: "Talu",
        role: "Koleksiyoner Sponsor",
        age: 48,
        description: "Acilis gecesinin ana sponsoru ve esere ozel ilgi gosteren koleksiyoner.",
        background: "Piyasada sert pazarliklariyla taninan varlikli bir koleksiyoner.",
        personality: "Kendinden emin, manipule etmeyi seven, sabirsiz.",
        alibi: "Konuklarla birlikte on izleme salonunda sampanya servisi sirasinda goruldu.",
        question_prompts: [
          "Bu eseri almak icin galeriyi ne kadar zorladin?",
          "Kerem ile acilis oncesi neden ozel gorusme yaptin?",
          "Alarmdan sonra neden hemen sigorta bedelini sordun?",
        ],
        behavior_during_incident: "Kaybolma aciklanmadan once sigorta limitini sordu.",
        motive: "Eseri istiyor ama acik bir hirsizlik onu dogrudan hedef yapardi.",
        secret_info: "Kerem'in para sikisikligini kullanabilecek kadar firsatci ama swap planinin sahadaki faili degil.",
        is_guilty: false,
        status: "published",
      },
    ],
    media: [
      {
        type: "Rapor",
        title: "Nem Alarmi Kaydi",
        description: "Kasadaki alarm tek seferlik manuel override ile susturulmus.",
        content: "Alarm 20:11'de calmis, 23 saniye icinde Kerem'in panelinden sifirlanmis.",
        is_key_evidence: true,
        status: "published",
      },
      {
        type: "Belge",
        title: "Sigorta Ek Protokolu",
        description: "Eser tasima ve kasa cikislarinda iki imza zorunlu gorunuyor.",
        content: "Operasyon yoneticisi tek basina kasa kutusu teslim alamaz; ikinci imza eksik.",
        is_key_evidence: true,
        status: "published",
      },
      {
        type: "Liste",
        title: "Konuk Akis Cizelgesi",
        description: "Asli'nin VIP turu ile kasa koridorunun bosaldigi pencere ayni ana denk geliyor.",
        content: "Bagiscilar ana salona alininca arka koridorda dort dakikalik bir bosluk olusmus.",
        is_key_evidence: false,
        status: "published",
      },
    ],
    hints: [
      {
        title: "Sahte Alarm",
        text: "Sorun alarmda degil, alarmi kimin kontrollu bicimde susturdugunda gizli.",
        type: "teknik",
        reveal_order: 1,
        status: "published",
      },
      {
        title: "Teslim Zinciri",
        text: "Kayip eser, prosedure gore tek kisinin tasiyamayacagi bir noktadan cikti.",
        type: "prosedur",
        reveal_order: 2,
        status: "published",
      },
      {
        title: "Yanlis Yon",
        text: "Panik aninda kalabaligi baska yone suren kisi, koridoru bilincli bosaltmis olabilir.",
        type: "davranis",
        reveal_order: 3,
        status: "published",
      },
    ],
    relations: [
      ["Asli Yalcin", "Kerem Sonmez", "Asli, Kerem'in organizasyon disiplinini gerekli bulsa da fazla kontrolcu oldugunu dusunuyor.", "medium"],
      ["Kerem Sonmez", "Cem Talu", "Kerem, Cem'in baskisini maddi cikisa cevirmek icin tehlikeli bir yakinlik kurdu.", "high"],
      ["Mina Erdem", "Kerem Sonmez", "Mina, Kerem'in teknik alana fazla mudahale etmesinden rahatsiz.", "medium"],
      ["Cem Talu", "Asli Yalcin", "Cem, Asli'nin sanat hassasiyetini yavas buluyor ve surekli baski kuruyor.", "medium"],
      ["Mina Erdem", "Asli Yalcin", "Mina, Asli'ya teknik olarak guveniyor ama panik aninda onu fazla siyasi buluyor.", "low"],
      ["Cem Talu", "Kerem Sonmez", "Cem, Kerem'in nakit akis sikisikligini bildigi icin onu kolay yonlendirebildi.", "high"],
    ],
  },
  {
    categorySlug: "liman-ve-kacakcilik",
    scenario: {
      title: "Karakoy Konteyner Dosyasi",
      slug: "karakoy-konteyner-dosyasi",
      teaser: "Bonded depoda muayene bekleyen konteynerin manifestosu degistirilir ve yuk kaybolur.",
      description:
        "Karakoy limanindaki bagli depoda kontrol bekleyen konteynerin manifestosu gece yarisi degistirilir. Icindeki tibbi sensor kasalari sabah acildiginda eksiktir ve sevkiyat zincirinden biri bilincli bir gecikme yaratmistir.",
      estimated_duration: 30,
      difficulty: "normal",
      popularity_score: 167,
      summary_for_ai:
        "Culprit is Seda Alkan. She altered the customs manifest for a smuggling network, delayed inspection paperwork, and redirected suspicion to Yusuf's shift confusion. The motive was debt leverage from a logistics ring tied to her brother's case.",
      scenario_answer_rule:
        "The correct culprit is Seda Alkan. A complete answer should mention the forged manifest version, the delayed inspection approval, Seda's outside leverage, and how she used Yusuf's shift change as cover.",
      status: "published",
    },
    characters: [
      {
        name: "Ece",
        surname: "Gur",
        role: "Liman Operasyon Sefi",
        age: 36,
        description: "Gece vardiyasinda depolama ve sevkiyat akislarini koordine ediyor.",
        background: "Liman sahasinda buyumus, disiplin konusunda taviz vermeyen bir yonetici.",
        personality: "Pratik, sert, kriz aninda cok hizli.",
        alibi: "Gece 01:00 civari sahadaki vinc arizasiyla ilgilendigini soyluyor.",
        question_prompts: [
          "Manifesto degisikligini ilk ne zaman fark ettin?",
          "Seda'nin onay akisina gece mudahale etmesi normal miydi?",
          "Yusuf'un vardiya degisimi sence neyi perdeledi?",
        ],
        behavior_during_incident: "Eksik kasalari gorur gormez gumruk terminaline haber verdi.",
        motive: "Operasyon itibarini kaybetmek istemez; kasitli kayip yaratmasi kendi pozisyonunu yakar.",
        secret_info: "Seda'nin gece sistemine uzaktan baglandigini rapordan gordu.",
        is_guilty: false,
        status: "published",
      },
      {
        name: "Yusuf",
        surname: "Koral",
        role: "Depo Vardiya Sorumlusu",
        age: 44,
        description: "Konteyner acilis-kapanis ve seal kontrolunu yapan saha sorumlusu.",
        background: "Yillardir limanda calisiyor, prosedurleri ezbere biliyor.",
        personality: "Yorgun, temkinli, bazen savunmaci.",
        alibi: "Vardiya tesliminde bir saatlik personel eksigiyle ugrastigini anlatiyor.",
        question_prompts: [
          "Seal numarasindaki tutarsizligi neden hemen raporlamadin?",
          "Seda ile gece gelen ek belgeyi kim teslim aldi?",
          "Senin vardiya degisimin neden tam muayene oncesine geldi?",
        ],
        behavior_during_incident: "Eksik kasalar cikinca ilk refleksi kendi evrakini savunmak oldu.",
        motive: "Hatali gorunmekten korkuyor ama yuk kaybindan dogrudan kazanci yok.",
        secret_info: "Seda'nin 'evrak ben hallettim' diyerek onu sistemden uzak tuttugunu biliyor.",
        is_guilty: false,
        status: "published",
      },
      {
        name: "Seda",
        surname: "Alkan",
        role: "Gumruk Musteri Temsilcisi",
        age: 33,
        description: "Muayene evraklari ve beyan surecini yoneten dis aracilik uzmanı.",
        background: "Ailesinin eski borclari yuzunden karanlik lojistik cevrelere bagimlilik gelistirdi.",
        personality: "Akici konusur, sakin gorunur, zor anlarda anlatilari degistirir.",
        alibi: "Belge onayi icin sadece uzaktan sisteme girdigini soyluyor.",
        question_prompts: [
          "Manifestonun ikinci versiyonu neden gece yarisindan sonra sisteme dustu?",
          "Disaridaki ag ile iletisimin bu sevkiyatla ilgisi var mi?",
          "Yusuf'un vardiya kargasasini neden surekli one cikariyorsun?",
        ],
        behavior_during_incident: "Sorular derinlestikce mevzuati kalkan gibi kullanmaya basladi.",
        motive: "Kardesinin davasinda kullanilan borc leverage'i yuzunden ag icin sahte beyan hazirladi.",
        secret_info: "Muayene zamanini kaydirmak icin ikinci manifestoyu kendisi yukledi.",
        is_guilty: true,
        status: "published",
      },
      {
        name: "Mert",
        surname: "Kaan",
        role: "Rota Analisti",
        age: 28,
        description: "Konteyner hareketleri ve GPS sapmalarini raporlayan veri analisti.",
        background: "Eski denizcilik yazilimcisiydi; sahadaki usulsuzluklari veriden okur.",
        personality: "Merakli, teknik, dogrudan.",
        alibi: "Gece ofiste rota panelini izledigini ve saha kamera raporu bekledigini soyluyor.",
        question_prompts: [
          "GPS hattinda seni suphelendiren ilk veri neydi?",
          "Seda'nin uzaktan baglantisi kayitlara nasil yansidi?",
          "Yuk kaybi fiziksel mi yoksa kagit ustunde mi basladi?",
        ],
        behavior_during_incident: "Manifesto versiyonlari arasindaki zaman farkini ilk o cikardi.",
        motive: "Usulsuzlugu ifsa etmek onun cikarina; ortbas etmesi icin neden yok.",
        secret_info: "Seda'nin onay kullanicisi ile gece iki farkli IP kaydi goruyor.",
        is_guilty: false,
        status: "published",
      },
    ],
    media: [
      {
        type: "Belge",
        title: "Manifesto Versiyon Karsilastirmasi",
        description: "Ayni konteyner icin gece iki farkli beyan kaydi acilmis.",
        content: "Ikinci versiyonda tibbi sensor kasalarinin adet bilgisi eksik girilmis.",
        is_key_evidence: true,
        status: "published",
      },
      {
        type: "Rapor",
        title: "Uzaktan Giris Kaydi",
        description: "Gumruk paneline muayene saatinden hemen once uzaktan baglanti kurulmus.",
        content: "Seda'nin kullanici hesabi ile gece 00:47'de farkli bir IP'den baglanti var.",
        is_key_evidence: true,
        status: "published",
      },
      {
        type: "Tutanak",
        title: "Vardiya Teslim Notu",
        description: "Yusuf'un teslim tutanaginda seal numarasi el yazisiyla duzeltilmis.",
        content: "Duzeltme saati, resmi manifestonun ikinci versiyonundan sonra eklenmis gorunuyor.",
        is_key_evidence: false,
        status: "published",
      },
    ],
    hints: [
      {
        title: "Iki Beyan",
        text: "Kayip fiziksel alandan once kagit uzerinde basliyor; ikinci manifesto kilit nokta.",
        type: "evrak",
        reveal_order: 1,
        status: "published",
      },
      {
        title: "Uzaktan Onay",
        text: "Gece yapilan tek uzaktan baglanti, depodaki kargasa ile ayni pencereye denk geliyor.",
        type: "zamanlama",
        reveal_order: 2,
        status: "published",
      },
      {
        title: "Hazir Gunah Kecisi",
        text: "Herkesin once Yusuf'a bakmasi, bunu planlayan biri olduguna isaret ediyor olabilir.",
        type: "algı",
        reveal_order: 3,
        status: "published",
      },
    ],
    relations: [
      ["Ece Gur", "Yusuf Koral", "Ece, Yusuf'un saha tecrubesine guveniyor ama evrak disiplinini zayif buluyor.", "medium"],
      ["Yusuf Koral", "Seda Alkan", "Yusuf, Seda'nin sahaya inmeden emir vermesinden rahatsiz.", "medium"],
      ["Seda Alkan", "Mert Kaan", "Seda, Mert'in veri raporlarini kendi anlatisini bozdugu icin sevmez.", "high"],
      ["Mert Kaan", "Ece Gur", "Mert, Ece'nin saha sezgisine teknik kanitlarla destek verdigini dusunuyor.", "low"],
      ["Ece Gur", "Seda Alkan", "Ece, Seda'nin gece gelen belge baskilarini prosedur disi buluyor.", "high"],
      ["Mert Kaan", "Yusuf Koral", "Mert, Yusuf'un hata yapabilecegini dusunse de onu dogrudan fail gormuyor.", "low"],
    ],
  },
  {
    categorySlug: "kurumsal-sabotaj",
    scenario: {
      title: "Maslak Veri Sizintisi",
      slug: "maslak-veri-sizintisi",
      teaser: "Satinalma gorusmesi oncesi musteri segmentasyon modeli rakip sirketin eline gecer.",
      description:
        "Maslak'taki bir SaaS sirketinde satinalma sunumu oncesi en kritik musteri segmentasyon dosyasi disariya sizdirilir. Rakibin ayni veri modelini sabah toplantisinda kullanmasi, sizintinin iceriden yonetildigini gosterir.",
      estimated_duration: 28,
      difficulty: "hard",
      popularity_score: 121,
      summary_for_ai:
        "Culprit is Okan Vural. He exported the segmentation file to a rival contact to cover hidden freelance debts and used a server patch window as cover. He redirected suspicion toward Emre's admin credentials and downplayed the timing mismatch.",
      scenario_answer_rule:
        "The correct culprit is Okan Vural. A strong answer should mention the server patch window, Okan's hidden debt motive, the exported client cohort file, and his attempt to frame Emre through admin access noise.",
      status: "published",
    },
    characters: [
      {
        name: "Rana",
        surname: "Cetin",
        role: "COO",
        age: 36,
        description: "Satinalma surecini yuruten ve ekipler arasi koordinasyonu saglayan operasyon lideri.",
        background: "Buyumeyi hizlandirmak icin veriye dayali hareket eden sert bir yonetici.",
        personality: "Net, hizli karar veren, baski altinda sogukkanli.",
        alibi: "Sunum akisini revize etmek icin yonetim odasindaydi.",
        question_prompts: [
          "Patch penceresi acildiginda ekipte kimlere guveniyordun?",
          "Okan'in son iki haftadaki davranisinda seni tedirgin eden neydi?",
          "Rakip sirketin bu kadar hizli reaksiyon vermesini nasil yorumladin?",
        ],
        behavior_during_incident: "Veri sizintisi netlesince once admin loglarini istedi.",
        motive: "Sirket degerlemesini korumak ister; sizinti ona dogrudan zarar verir.",
        secret_info: "Okan'in raporlarin son halini herkesten sonra tekrar acmasini fark etti.",
        is_guilty: false,
        status: "published",
      },
      {
        name: "Okan",
        surname: "Vural",
        role: "Data Operations Lead",
        age: 32,
        description: "Segmentasyon modelini urun, satis ve gelir verisiyle birlestiren veri operasyon sorumlusu.",
        background: "Gizli freelance isler ve kisisel borclar yuzunden ek gelire ihtiyac duyuyor.",
        personality: "Sakin gorunur, hesapci, zor sorularda teknik detaylara saklanir.",
        alibi: "Patch sirasinda sadece dashboard raporlarini duzelttigini soyluyor.",
        question_prompts: [
          "Patch penceresinde hangi tablo ve cohort dosyalarini acmistin?",
          "Rakipte gordugumuz model neden senin kullandigin etiketlerle birebir uyusuyor?",
          "Emre'nin admin hesabini neden bu kadar erken supheli gosterdin?",
        ],
        behavior_during_incident: "Konuyu surekli teknik gurultuye ve admin izinlerine cekti.",
        motive: "Borclarini kapatmak icin modeli rakipteki bir baglantiya sizdirdi.",
        secret_info: "Export islemini patch saati icinde yapip Emre'nin credential gurultusunu kalkan olarak kullandi.",
        is_guilty: true,
        status: "published",
      },
      {
        name: "Melis",
        surname: "Tanyel",
        role: "Legal Counsel",
        age: 38,
        description: "Satinalma ve KVKK risklerini yoneten hukuk danismani.",
        background: "Onceki sirketinde veri ihlali davalariyla ugrasmis deneyimli avukat.",
        personality: "Olculu, supheci, kelimeleri dikkatle secer.",
        alibi: "NDA eklerini duzeltmek icin hukuk odasindaydi.",
        question_prompts: [
          "Sizinti halinde en cok hangi ekibin paniye kapilacagini dusundun?",
          "Okan'in soylemindeki hukuki aciklari fark ettin mi?",
          "Musteri cohort dosyasinin hassasiyetini ekipte kimler gercekten anliyordu?",
        ],
        behavior_during_incident: "Sozlesme akisina donup kimin neye eristigini not etti.",
        motive: "Sizinti hukuki riski buyutur; bunu istemesi rasyonel degil.",
        secret_info: "Okan'in veri modelinin ticari degerini beklenenden fazla vurguladigini not etti.",
        is_guilty: false,
        status: "published",
      },
      {
        name: "Emre",
        surname: "Polat",
        role: "IT Admin",
        age: 30,
        description: "Sunucu bakimlari, yedekleme ve erisim anahtarlarindan sorumlu sistem yoneticisi.",
        background: "Daginiq gorunse de altyapiyi tek basina ayakta tutuyor.",
        personality: "Savunmaci, hizli konusur, teknik detayla nefes alir.",
        alibi: "Patch notlarini kapatmak icin server odasinda oldugunu soyluyor.",
        question_prompts: [
          "Patch sirasinda hangi credential hareketleri seni sasirtti?",
          "Okan'in export islemini teknik gurultu icinde saklamasi mumkun muydu?",
          "Admin loglarinda seni aklayan kritik fark neydi?",
        ],
        behavior_during_incident: "Ilk anda gereksiz panik yapti ama log farklarini aciklayabildi.",
        motive: "Yetersiz gorunmekten korkar ama sizintidan kazanci yok.",
        secret_info: "Export isteginin admin panelden degil veri araci uzerinden yapildigini biliyor.",
        is_guilty: false,
        status: "published",
      },
    ],
    media: [
      {
        type: "Rapor",
        title: "Cohort Export Kaydi",
        description: "Patch penceresi icinde cohort segmentasyon dosyasinin export alindigi goruluyor.",
        content: "Export istegi admin panelinden degil veri operasyon aracindan tetiklenmis.",
        is_key_evidence: true,
        status: "published",
      },
      {
        type: "Not",
        title: "Freelance Odeme Akisi",
        description: "Okan'in kisisel hesabina bagli duzensiz freelance tahsilatlari listelenmis.",
        content: "Kayitlarin bir bolumu kapanmamis borc baskisina isaret ediyor.",
        is_key_evidence: true,
        status: "published",
      },
      {
        type: "Belge",
        title: "Patch Penceresi Ozeti",
        description: "Sunucu bakimi sirasinda kisa sureli erisim karmasasi olustugu kayitli.",
        content: "Ayni zaman araliginda admin gurultusu olusurken veri araci export gecisi gizlenmis.",
        is_key_evidence: false,
        status: "published",
      },
    ],
    hints: [
      {
        title: "Gurultu Perdesi",
        text: "Gercek hareket, admin panelindeki gurultunun arkasina gizlenmis olabilir.",
        type: "teknik",
        reveal_order: 1,
        status: "published",
      },
      {
        title: "Ticari Motivasyon",
        text: "Dosyanin ticari degerini ekipte en yuksek sesle savunan kisiye tekrar bak.",
        type: "motivasyon",
        reveal_order: 2,
        status: "published",
      },
      {
        title: "Export Yolu",
        text: "Yetki sorusu kadar hangi arac uzerinden export alindigi da belirleyici.",
        type: "kanit",
        reveal_order: 3,
        status: "published",
      },
    ],
    relations: [
      ["Rana Cetin", "Okan Vural", "Rana, Okan'in rapor kontrolunu gereksiz uzatmasindan rahatsiz.", "medium"],
      ["Okan Vural", "Emre Polat", "Okan, Emre'nin daginiq gorunumunu suclama zemini olarak kullaniyor.", "high"],
      ["Melis Tanyel", "Rana Cetin", "Melis, Rana'nin hiz baskisinin ekipte acele kararlar dogurdugunu dusunuyor.", "low"],
      ["Emre Polat", "Okan Vural", "Emre, Okan'in teknik terimlerle iz kapattigini seziyor.", "high"],
      ["Melis Tanyel", "Okan Vural", "Melis, Okan'in veri degerini hukuki riskten daha cok onemsediğini fark ediyor.", "medium"],
      ["Rana Cetin", "Emre Polat", "Rana, Emre'ye guvenmek istiyor ama panik hali onu zorluyor.", "low"],
    ],
  },
  {
    categorySlug: "sanat-ve-muzayede",
    scenario: {
      title: "Nisantasi Heykel Degisimi",
      slug: "nisantasi-heykel-degisimi",
      teaser: "Sponsor brunch'i sirasinda bronz calisma replika ile degistirilir.",
      description:
        "Nisantasi'ndaki ozel bir koleksiyon evinde, sponsorlar icin duzenlenen kapali brunch sirasinda genc bir heykeltirasin bronz eskizi replika ile degistirilir. Kalabalik dagilmadan once birisi guvenlik akisini kendi lehine bükmustur.",
      estimated_duration: 32,
      difficulty: "normal",
      popularity_score: 109,
      summary_for_ai:
        "Culprit is Levent Ersoy. He swapped the bronze study with a prepared replica to settle a private debt with a collector. He used the sponsor walkthrough and Tarik's service corridor confusion as cover, then blamed conservation handling.",
      scenario_answer_rule:
        "The correct culprit is Levent Ersoy. A complete answer should mention the prepared replica, the sponsor walkthrough gap, Levent's collector debt motive, and his attempt to shift suspicion onto conservation handling.",
      status: "published",
    },
    characters: [
      {
        name: "Defne",
        surname: "Ileri",
        role: "Ev Kuratoru",
        age: 35,
        description: "Heykelin sunum senaryosunu ve mekan akislarini hazirlayan kurator.",
        background: "Butik koleksiyon evlerinde eser yerlesimi konusunda uzman.",
        personality: "Zevk sahibi, dikkatli, kontrol kaybina tahammulsuz.",
        alibi: "Sponsor turu basladiginda ana salonda koleksiyonerleri gezdiriyordu.",
        question_prompts: [
          "Brunch sirasinda heykel standi hangi anlarda yalniz kaldi?",
          "Levent'in sponsorlar uzerindeki hakimiyetini normal buldun mu?",
          "Replika kullanilmis olsaydi bunu ilk kim fark ederdi?",
        ],
        behavior_during_incident: "Eserin taban cizigindeki ufak farki ilk o sezdi.",
        motive: "Mekanin itibari onun uzerinden okunuyor; degisim ona zarar verir.",
        secret_info: "Levent'in eserin sigorta limitini gereksiz yere iki kez sordugunu hatirliyor.",
        is_guilty: false,
        status: "published",
      },
      {
        name: "Levent",
        surname: "Ersoy",
        role: "Private Sales Director",
        age: 43,
        description: "Koleksiyoner iliskileri ve satis gorusmelerini yurüten yonetici.",
        background: "Birkac yan anlasma yuzunden ozel borc baskisi altinda.",
        personality: "Karizmatik, akici, hikaye kurmayi bilen biri.",
        alibi: "Sponsor masalari arasinda surekli dolaştigini ve eserden uzak oldugunu soyluyor.",
        question_prompts: [
          "Sponsor turu sirasinda servis koridoruna neden iki kez girdin?",
          "Sigorta limitine olan ilgin sadece satis hazirligi miydi?",
          "Koruma ekibini neden bu kadar erken hedef gosterdin?",
        ],
        behavior_during_incident: "Konuyu hizla tasima ve sigorta prosedurune cevirmeye calisti.",
        motive: "Borcu kapatmak icin onceden hazirlanmis replikayi kullanarak orijinali koleksiyoncuya yonlendirdi.",
        secret_info: "Tarik'in servis koridorundaki kargasa anini kullanip degisimi o yapti.",
        is_guilty: true,
        status: "published",
      },
      {
        name: "Mina",
        surname: "Aksoy",
        role: "Konservator",
        age: 31,
        description: "Heykelin yuzey kontrolu ve isik altindaki korunmasindan sorumlu uzman.",
        background: "Restorasyon laboratuvarindan cikip bagimsiz koleksiyon projelerine gecmis.",
        personality: "Sessiz, ayrinti takintili, gozlemci.",
        alibi: "Brunch oncesi eser yuzeyini kontrol edip arka odaya paket materyali almaya gitti.",
        question_prompts: [
          "Replika ile orijinal arasindaki ilk somut fark neydi?",
          "Levent'in eser elleme bicimi sende ne his uyandirdi?",
          "Defne'nin kurdugu akista hangi bosluk degisime izin verdi?",
        ],
        behavior_during_incident: "Yuzey patinasindaki taze farki gorur gormez degisim suphelendi.",
        motive: "Uzmanligi eser korumak uzerine; degisimden kazanci yok.",
        secret_info: "Levent'in standa beklenenden yakin temas ettigini gordu ama o an onemsemedi.",
        is_guilty: false,
        status: "published",
      },
      {
        name: "Tarik",
        surname: "Unal",
        role: "Etkinlik Produksiyoncusu",
        age: 39,
        description: "Servis akisi, personel dolaşimi ve davet duzenini yoneten organizator.",
        background: "Prestij etkinliklerinde kaosu sakin goruntunun arkasinda yoneten isim.",
        personality: "Pratik, hizli, bazen savruk.",
        alibi: "Servis koridorunda catering ekibiyle ugraştigini soyluyor.",
        question_prompts: [
          "Servis koridorundaki kargasa ne zaman zirveye cikti?",
          "Levent'in koridoru kullanmasi program disi miydi?",
          "Mekandaki en buyuk dikkat daginikligi hangi anda oldu?",
        ],
        behavior_during_incident: "Kendi kismini savunurken detaylari atladi ama zaman cizgisi tutarli kaldı.",
        motive: "Dağınık gorunmekten korkar ama eseri hedef almak icin nedeni yok.",
        secret_info: "Levent'in servis kapisini kullanip ana salona farkli yonden dondugunu hatirliyor.",
        is_guilty: false,
        status: "published",
      },
    ],
    media: [
      {
        type: "Belge",
        title: "Heykel Taban Fotoğrafi",
        description: "Bronz calismanin tabanindaki imza izi replika ile uyusmuyor.",
        content: "Orijinal parca daha derin oyulmus imza izine sahipken standdaki eser yuzeysel bir kopya tasiyor.",
        is_key_evidence: true,
        status: "published",
      },
      {
        type: "Not",
        title: "Sigorta Limit Notu",
        description: "Levent'in sabah iki kez sigorta degeri sordugunu gosteren ic not.",
        content: "Deger araligina dair soru sayisi, satis hazirliginin otesinde bir plan ihtimalini kuvvetlendiriyor.",
        is_key_evidence: true,
        status: "published",
      },
      {
        type: "Rapor",
        title: "Servis Koridoru Akisi",
        description: "Brunch sirasinda servis koridorunda uc dakikalik kontrol boslugu olusuyor.",
        content: "Kalabalik salona donerken arka koridor kisa sureli gozetimsiz kaliyor.",
        is_key_evidence: false,
        status: "published",
      },
    ],
    hints: [
      {
        title: "Hazir Replika",
        text: "Bu degisim son dakika degil; onceden hazirlanmis bir replika gerektiriyor.",
        type: "hazirlik",
        reveal_order: 1,
        status: "published",
      },
      {
        title: "Yan Koridor",
        text: "Ana salon degil, servis koridoru ustunden yaratilan kisa bosluk belirleyici olabilir.",
        type: "zamanlama",
        reveal_order: 2,
        status: "published",
      },
      {
        title: "Deger Bilgisi",
        text: "Eserin sigorta ve koleksiyoner degeriyle yakindan ilgilenen kisiye tekrar bak.",
        type: "motivasyon",
        reveal_order: 3,
        status: "published",
      },
    ],
    relations: [
      ["Defne Ileri", "Levent Ersoy", "Defne, Levent'in etkinlik ritmini satis hikayesine gore zorladigini dusunuyor.", "medium"],
      ["Levent Ersoy", "Mina Aksoy", "Levent, Mina'nin teknik ayrintilarini ticari akis icin problem goruyor.", "medium"],
      ["Mina Aksoy", "Defne Ileri", "Mina, Defne'nin duzenine guvenir ama kalabalik baskisini fazla riskli bulur.", "low"],
      ["Tarik Unal", "Levent Ersoy", "Tarik, Levent'in servis koridorunu kullanmasini program disi buldu.", "high"],
      ["Defne Ileri", "Tarik Unal", "Defne, Tarik'in akisi toparladigini ama bazen fazla acik kapı biraktigini biliyor.", "medium"],
      ["Mina Aksoy", "Levent Ersoy", "Mina, Levent'in esere gereksiz yakinlastigini acikca supheli buluyor.", "high"],
    ],
  },
  {
    categorySlug: "liman-ve-kacakcilik",
    scenario: {
      title: "Ambar 17 Sapmasi",
      slug: "ambar-17-sapmasi",
      teaser: "Transit soguk zincir paletleri bonded alan yerine Ambar 17'ye kaydirilir.",
      description:
        "Bir soguk zincir sevkiyatinda transit paletler resmi kayitlara gore bonded depoda bekler gorunurken gece vardiyasinda Ambar 17'ye yonlendirilir. Sabah sayiminda yukun kritik bolumu eksiktir ve zincirdeki biri rotayi bilerek esnetmistir.",
      estimated_duration: 34,
      difficulty: "hard",
      popularity_score: 96,
      summary_for_ai:
        "Culprit is Burak Sefer. He redirected the cold-chain pallets to Warehouse 17 for a smuggling contact, then manipulated dispatch notes to make the move look like a refrigeration emergency. He used Aylin's shift handover and Cihan's inspection backlog as cover.",
      scenario_answer_rule:
        "The correct culprit is Burak Sefer. A complete explanation should mention the false refrigeration alert, the dispatch note edit, the reroute to Warehouse 17, and Burak's outside logistics contact motive.",
      status: "published",
    },
    characters: [
      {
        name: "Aylin",
        surname: "Kara",
        role: "Operasyon Sefi",
        age: 40,
        description: "Gece-gunduz devir teslimini ve depo kapasitesini yoneten saha sorumlusu.",
        background: "Yillardir liman operasyonlarini kriz cikmadan yonetmesiyle biliniyor.",
        personality: "Dengeli, disiplinli, sahayi iyi okur.",
        alibi: "Vardiya degisiminde merkezi kontrol noktasindaydi.",
        question_prompts: [
          "Ambar 17'ye sapma ilk hangi raporda kendini ele verdi?",
          "Burak'in gece icindeki karar degisiklikleri sana normal geldi mi?",
          "Soguk zincir alarmi prosedurunde hangi adim eksikti?",
        ],
        behavior_during_incident: "Sayim farki cikinca once dispatch notlarini toplatti.",
        motive: "Hatayi gizlemek yerine sureci toparlamak ister; sapmadan kazanci yok.",
        secret_info: "Burak'in acil sogutma bahanesini kanitsiz hizla kabul ettirmeye calistigini gordu.",
        is_guilty: false,
        status: "published",
      },
      {
        name: "Burak",
        surname: "Sefer",
        role: "Gece Dispatch Supervisor",
        age: 37,
        description: "Rota dagilimi ve ambar yonlendirmelerini gece vardiyasinda onaylayan supervisor.",
        background: "Dis lojistik aglariyla tehlikeli iliskiler kurmus ve borc baskisi altinda.",
        personality: "Kisa konusur, baski aninda emrivaki yapar, sogukkanli gorunur.",
        alibi: "Sadece sogutma riski yuzunden gecici ambar degisikligi yaptigini soyluyor.",
        question_prompts: [
          "Sogutma alarmi hangi sensor kaydina dayaniyordu?",
          "Dispatch notunu neden vardiya kapanisindan sonra duzelttin?",
          "Ambar 17 secimi gercekten en hizli cozum muydu?",
        ],
        behavior_during_incident: "Her seyi prosedurel aciliyet gibi anlatmaya calisti.",
        motive: "Dis baglantiya yuk cikarmak icin paletleri kontrollu sekilde Ambar 17'ye yonlendirdi.",
        secret_info: "Sahte sogutma alarmini gerekce yapip notlari sonradan duzeltti.",
        is_guilty: true,
        status: "published",
      },
      {
        name: "Cihan",
        surname: "Ozturk",
        role: "Gumruk Kontrol Memuru",
        age: 45,
        description: "Muayene sirasi ve resmi onay akisindan sorumlu kontrol memuru.",
        background: "Evrak tarafinda sert, saha tarafinda yavas bulunur.",
        personality: "Kurala bagli, inatci, savunmaci.",
        alibi: "Geceden kalan muayene yigilmasini kapatmaya calistigini soyluyor.",
        question_prompts: [
          "Resmi kayitlarda Ambar 17 sapmasini hangi an gormediniz?",
          "Burak'in aciliyet anlatisi mevzuata gore tutuyor muydu?",
          "Onay zincirindeki eksik halka hangi formda kaldi?",
        ],
        behavior_during_incident: "Kendi birikmis dosyalarinin ustunu kapatmamak icin mesafeli davrandi.",
        motive: "Yavaslik ona zarar verse de sapmadan dogrudan cikar saglamiyor.",
        secret_info: "Burak'in yazili onay gelmeden sevki durumu degistirdigini fark etti.",
        is_guilty: false,
        status: "published",
      },
      {
        name: "Nisa",
        surname: "Yurdan",
        role: "Cold-Chain Analyst",
        age: 29,
        description: "Isi takibi ve sicaklik sensor raporlarini yorumlayan analist.",
        background: "Lojistikte veri okuma becerisiyle hizla one cikti.",
        personality: "Analitik, net, detaydan kopmayan.",
        alibi: "Merkez panelde sensor grafikleri uzerinde calisiyordu.",
        question_prompts: [
          "Sogutma alarminin sahte oldugunu gosteren ilk veri neydi?",
          "Burak'in anlattigi aciliyetle sensor eğrileri arasinda nasil bir uyumsuzluk var?",
          "Ambar 17 rotasinin sistemde iz birakmamasini nasil aciklarsin?",
        ],
        behavior_during_incident: "Alarm grafiginin manuel tetiklenmis olabilecegini sakin sekilde anlatti.",
        motive: "Veri tutarliligi onun cikarina; kaybi ortbas etmek icin nedeni yok.",
        secret_info: "Alarmi tetikleyen sensor resetinin fiziksel degil yazilim tarafli oldugunu biliyor.",
        is_guilty: false,
        status: "published",
      },
    ],
    media: [
      {
        type: "Rapor",
        title: "Sogutma Alarm Grafiği",
        description: "Alarm egriisi fiziksel ariza yerine manuel reset izine benziyor.",
        content: "Sensor grafigi ani dusus yerine yapay bir kopus ve ayni dakika icinde reset kaydi gosteriyor.",
        is_key_evidence: true,
        status: "published",
      },
      {
        type: "Belge",
        title: "Dispatch Duzeltme Notu",
        description: "Ambar degisikligi vardiya kapandiktan sonra notlara eklenmis.",
        content: "Burak'in duzeltme girdisi, resmi devir teslim saatinden sonra sisteme dusuyor.",
        is_key_evidence: true,
        status: "published",
      },
      {
        type: "Tutanak",
        title: "Ambar 17 Giris Cizelgesi",
        description: "Transit paletler kisa sureli olarak Ambar 17'ye alinmis gorunuyor.",
        content: "Kayit, bonded depo rotasindan farkli bir yan giris kullanildigini gosteriyor.",
        is_key_evidence: false,
        status: "published",
      },
    ],
    hints: [
      {
        title: "Sahte Alarm",
        text: "Gercek ariza ile manuel reset izinin grafikteki davranisi ayni degildir.",
        type: "teknik",
        reveal_order: 1,
        status: "published",
      },
      {
        title: "Gecikmeli Not",
        text: "Ambar karari once alinmis, sonra notlara uydurulmus olabilir.",
        type: "evrak",
        reveal_order: 2,
        status: "published",
      },
      {
        title: "Yan Giris",
        text: "Resmi rota kadar gayriresmi girislerin acildigi an da onemli.",
        type: "rota",
        reveal_order: 3,
        status: "published",
      },
    ],
    relations: [
      ["Aylin Kara", "Burak Sefer", "Aylin, Burak'in gece kararlarini fazla kapali buluyor.", "medium"],
      ["Burak Sefer", "Cihan Ozturk", "Burak, Cihan'in birikmis onaylarindan faydalanabilecegini biliyor.", "high"],
      ["Nisa Yurdan", "Burak Sefer", "Nisa, Burak'in alarm anlatisinin veriyle uyusmadigini dusunuyor.", "high"],
      ["Cihan Ozturk", "Aylin Kara", "Cihan, Aylin'in saha hizini bazen prosedure aykiri derecede agresif buluyor.", "low"],
      ["Aylin Kara", "Nisa Yurdan", "Aylin, Nisa'nin sensor okumalarina guveniyor ve ona alan aciyor.", "low"],
      ["Nisa Yurdan", "Cihan Ozturk", "Nisa, Cihan'in evrak odagini sahadaki gercegi gec okumasina bagliyor.", "medium"],
    ],
  },
];

async function findSingle(collection, filters, fields) {
  const params = new URLSearchParams({
    limit: "1",
    fields,
  });

  Object.entries(filters).forEach(([key, value]) => {
    params.set(`filter[${key}][_eq]`, value);
  });

  const response = await api(`/items/${collection}?${params.toString()}`);
  return response.data?.[0] || null;
}

async function upsertCategory(category) {
  const existingCategory = await findSingle(
    "scenario_categories",
    { slug: category.slug },
    "id,title,slug,description,theme_statement,seo_title,seo_description,landing_narrative,faq_items,accent_color,status"
  );

  if (existingCategory) {
    await api(`/items/scenario_categories/${existingCategory.id}`, {
      method: "PATCH",
      body: category,
    });
    log(`Updated category: ${category.slug}`);
    return existingCategory.id;
  }

  const response = await api("/items/scenario_categories", {
    method: "POST",
    body: category,
  });

  log(`Created category: ${category.slug}`);
  return response.data?.id || response.data;
}

async function upsertScenario(seed, categoryId) {
  const payload = {
    ...seed.scenario,
    category: categoryId,
  };

  const existingScenario = await findSingle(
    "scenarios",
    { slug: seed.scenario.slug },
    "id,slug,category"
  );

  if (existingScenario) {
    await api(`/items/scenarios/${existingScenario.id}`, {
      method: "PATCH",
      body: payload,
    });
    log(`Updated scenario: ${seed.scenario.slug}`);
    return existingScenario.id;
  }

  const response = await api("/items/scenarios", {
    method: "POST",
    body: payload,
  });

  log(`Created scenario: ${seed.scenario.slug}`);
  return response.data?.id || response.data;
}

async function upsertCharacters(seed, scenarioId) {
  const characterIds = new Map();

  for (const character of seed.characters) {
    const existingCharacter = await findSingle(
      "characters",
      {
        related_scenario: scenarioId,
        name: character.name,
        surname: character.surname,
      },
      "id,name,surname"
    );

    const payload = {
      ...character,
      related_scenario: scenarioId,
    };

    if (existingCharacter) {
      await api(`/items/characters/${existingCharacter.id}`, {
        method: "PATCH",
        body: payload,
      });
      characterIds.set(`${character.name} ${character.surname}`.trim(), existingCharacter.id);
      continue;
    }

    const response = await api("/items/characters", {
      method: "POST",
      body: payload,
    });

    const characterId = response.data?.id || response.data;
    characterIds.set(`${character.name} ${character.surname}`.trim(), characterId);
  }

  return characterIds;
}

async function upsertMedia(seed, scenarioId) {
  for (const item of seed.media) {
    const existingItem = await findSingle(
      "scenario_media",
      { related_scenario: scenarioId, title: item.title },
      "id,title"
    );

    const payload = {
      ...item,
      related_scenario: scenarioId,
    };

    if (existingItem) {
      await api(`/items/scenario_media/${existingItem.id}`, {
        method: "PATCH",
        body: payload,
      });
      continue;
    }

    await api("/items/scenario_media", {
      method: "POST",
      body: payload,
    });
  }
}

async function upsertHints(seed, scenarioId) {
  for (const item of seed.hints) {
    const existingItem = await findSingle(
      "hints",
      { related_scenario: scenarioId, title: item.title },
      "id,title"
    );

    const payload = {
      ...item,
      related_scenario: scenarioId,
    };

    if (existingItem) {
      await api(`/items/hints/${existingItem.id}`, {
        method: "PATCH",
        body: payload,
      });
      continue;
    }

    await api("/items/hints", {
      method: "POST",
      body: payload,
    });
  }
}

async function upsertRelations(seed, scenarioId, characterIds) {
  for (const [fromName, toName, relationText, tensionLevel] of seed.relations) {
    const fromId = characterIds.get(fromName);
    const toId = characterIds.get(toName);

    if (!fromId || !toId) {
      throw new Error(`Missing character reference for relation ${fromName} -> ${toName}`);
    }

    const existingRelation = await findSingle(
      "relations",
      {
        related_scenario: scenarioId,
        character: fromId,
        related_character: toId,
      },
      "id"
    );

    const payload = {
      related_scenario: scenarioId,
      character: fromId,
      related_character: toId,
      relation: relationText,
      tension_level: tensionLevel,
    };

    if (existingRelation) {
      await api(`/items/relations/${existingRelation.id}`, {
        method: "PATCH",
        body: payload,
      });
      continue;
    }

    await api("/items/relations", {
      method: "POST",
      body: payload,
    });
  }
}

async function main() {
  const categoryIdBySlug = new Map();

  for (const category of categorySeeds) {
    const id = await upsertCategory(category);
    categoryIdBySlug.set(category.slug, id);
  }

  for (const seed of scenarioSeeds) {
    const categoryId = categoryIdBySlug.get(seed.categorySlug);
    if (!categoryId) {
      throw new Error(`Missing category for ${seed.scenario.slug}`);
    }

    const scenarioId = await upsertScenario(seed, categoryId);
    const characterIds = await upsertCharacters(seed, scenarioId);
    await upsertMedia(seed, scenarioId);
    await upsertHints(seed, scenarioId);
    await upsertRelations(seed, scenarioId, characterIds);
  }

  log("Catalog seed completed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
