/**
 * Mavzuga 100% mos yuqori sifatli fotosuratlarni qidiradi va yuklaydi.
 * 1-bosqich: Unsplash Search (haqiqiy, professional, mavzuga to'liq mos 4K fotosuratlar).
 * 2-bosqich: Wikimedia Commons (ilmiy, texnik, tibbiy va ta'limiy fotosuratlar).
 * 3-bosqich: Pollinations AI (mavzuga mos 4K fotorealistik generatsiya).
 * Hech qachon mavzuga aloqasiz tasodifiy rasm chiqarmaydi!
 */

// Kirill harflarini lotinlashtirish xaritasi (ruscha/tojikcha so'zlar uchun)
const CYRILLIC_TO_LATIN = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
  'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
  'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
  'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu',
  'я': 'ya', 'ғ': 'gh', 'ӣ': 'i', 'ӯ': 'u', 'ҳ': 'h', 'ҷ': 'j', 'қ': 'q'
};

export function transliterateCyrillic(text) {
  if (!text) return '';
  return text.toLowerCase().split('').map(char => CYRILLIC_TO_LATIN[char] || char).join('');
}

// Kengaytirilgan o'zbekcha, ruscha va tojikcha so'zlarni professional inglizcha vizual kalit so'zlarga o'tkazish lug'ati
const DICTIONARY = {
  // Operatsion tizimlar, IT va Kompyuter arxitekturasi
  operatsion: 'operating system computer interface',
  operatsionka: 'operating system computer desktop software',
  tizim: 'operating system software architecture',
  tizimlar: 'operating system software technology',
  tizimlari: 'operating system technology architecture',
  tizimi: 'operating system software computer',
  windows: 'windows 11 operating system desktop computer',
  macos: 'macos apple macbook computer desktop',
  linux: 'linux open source terminal computer code',
  unix: 'unix terminal server system computer',
  ubuntu: 'ubuntu linux desktop computer software',
  android: 'android mobile smartphone operating system',
  ios: 'ios apple iphone mobile screen',
  protsessor: 'computer cpu processor hardware microchip',
  yadro: 'processor microchip cpu computer kernel',
  xotira: 'computer ram memory hardware chips',
  drayver: 'computer hardware components technology',
  drayverlar: 'computer hardware technology drivers',
  interfeys: 'user interface computer screen desktop',
  fayl: 'data files digital storage computer',
  fayllar: 'file system computer storage data',
  klaster: 'computer cluster server datacenter racks',
  mikrokontroller: 'microcontroller electronic circuit board chip',
  superkompyuter: 'supercomputer datacenter technology server',
  dasturlash: 'programming software coding developer',
  dasturchi: 'software developer coding computer',
  kompyuter: 'computer technology laptop modern workspace',
  kompyuterlar: 'computers modern office technology',
  kiber: 'cyber security technology code',
  kiberxavfsizlik: 'cyber security technology shield protection',
  xavfsizlik: 'security technology protection shield',
  malumotlar: 'data analytics server cloud',
  baza: 'database analytics server',
  bulutli: 'cloud computing datacenter server',
  texnologiya: 'technology innovation modern tech',
  texnologiyalar: 'technology digital innovation',
  innovatsiya: 'innovation creative technology future',
  algoritm: 'algorithm digital logic code',
  veb: 'web technology digital modern',
  mobil: 'mobile smartphone digital app',
  suniy: 'artificial intelligence robot',
  intellekt: 'intelligence algorithm neural',
  ai: 'artificial intelligence futuristic technology',
  neyron: 'neural network deep learning',
  tarmoq: 'network cyber digital data',
  tarmoqlari: 'neural network data infrastructure',
  robot: 'robot robotics automation machine',
  robototexnika: 'robotics automation industry',

  // Ruscha IT va Operatsion tizimlar (Kirill)
  операционная: 'operating system computer interface',
  операционные: 'operating system computer software interface',
  операционных: 'operating system software computer desktop',
  операционка: 'operating system computer desktop software',
  система: 'system technology architecture software',
  системы: 'operating system technology architecture software',
  системах: 'operating system computer software interface',
  систем: 'systems computer software architecture',
  виндовс: 'windows 11 operating system desktop computer',
  линукс: 'linux open source terminal server computer',
  макос: 'macos apple computer desktop operating system',
  юникс: 'unix terminal server system computer',
  андроид: 'android mobile smartphone operating system',
  ядро: 'processor microchip cpu computer kernel',
  процессы: 'computer processing multitasking software',
  процесс: 'computer processing workflow technology',
  процессор: 'computer cpu processor hardware microchip',
  память: 'computer ram memory hardware chip',
  драйверы: 'computer hardware components technology',
  интерфейс: 'computer desktop user interface technology',
  многозадачность: 'multitasking computer software technology',
  виртуализация: 'cloud virtualization server technology',
  файловая: 'data storage file system technology',
  серверы: 'datacenter server room technology cloud',
  сервер: 'server datacenter hardware technology cloud',
  компьютер: 'modern computer desktop workspace tech',
  компьютеры: 'desktop computer office technology modern',
  ноутбук: 'modern laptop computer workspace tech',
  программирование: 'software coding developer computer',
  программист: 'software developer coding computer office',
  разработка: 'software development programming code',
  код: 'programming code software developer screen',
  безопасность: 'cyber security technology protection',
  кибербезопасность: 'cyber security shield digital lock',
  данные: 'big data analytics server screen',
  база: 'database server analytics datacenter',
  облако: 'cloud computing digital datacenter',
  облачные: 'cloud computing server technology',
  искусственный: 'artificial intelligence futuristic robot',
  интеллект: 'intelligence neural network technology',
  нейросеть: 'neural network deep learning technology',
  нейросети: 'neural network deep learning technology',
  алгоритмы: 'algorithms code logic technology',
  технологии: 'modern technology innovation digital',
  технология: 'technology innovation modern tech',
  инновации: 'innovation creative technology future',

  // Tojikcha IT va Ta'lim (Kirill)
  системаҳои: 'operating system computer software interface',
  низомҳои: 'operating system software architecture',
  амалиётӣ: 'operating system computer interface technology',
  низом: 'system technology architecture',
  компютер: 'computer modern workspace technology',
  барномасозӣ: 'software programming coding computer',

  // Psixologiya va inson idroki / Психология
  psixologiya: 'psychology human brain',
  psixologik: 'psychological mental mind',
  kognitiv: 'cognitive brain neuroscience',
  xotira: 'memory brain recall',
  xotirasi: 'memory brain mind',
  inson: 'human mind philosophy',
  ong: 'consciousness human brain',
  miya: 'human brain neuroscience',
  ruhiyat: 'psychology emotional mental',
  emotsiya: 'emotion feeling expressive',
  xulq: 'behavior psychological society',
  idrok: 'perception cognitive brain',
  tafakkur: 'thinking reasoning intellect',
  психология: 'psychology human brain mind',
  психологический: 'psychological mental mind emotion',
  когнитивный: 'cognitive brain neuroscience mind',
  мозг: 'human brain neuroscience intellect',
  сознание: 'consciousness human mind philosophy',
  мышление: 'thinking brain intellect philosophy',
  память: 'memory human brain cognition',
  эмоции: 'emotion human feelings expressive',
  поведение: 'human behavior society psychology',

  // Iqtisodiyot, Biznes va Moliya / Экономика и Бизнес
  iqtisod: 'economy finance market business',
  iqtisodiyot: 'economy finance industry business',
  iqtisodiyoti: 'economy market business corporate',
  moliya: 'finance banking investment currency',
  moliyaviy: 'finance investment stock banking',
  biznes: 'business corporate office teamwork',
  tadbirkorlik: 'entrepreneurship startup office business',
  investitsiya: 'investment financial growth capital',
  investor: 'investor finance banking business',
  bank: 'banking financial economy money',
  bozor: 'market economy trade business',
  savdo: 'trade commercial retail business',
  eksport: 'export trade logistics transport',
  import: 'import cargo shipping logistics',
  daromad: 'revenue profit financial growth',
  soliq: 'tax finance governance economy',
  boshqaruv: 'management leadership corporate team',
  menejment: 'management leadership business strategy',
  marketing: 'marketing digital branding advertising',
  strategiya: 'strategy business planning roadmap',
  reja: 'planning strategy business roadmap',
  акции: 'stock market exchange financial trading',
  криптовалюта: 'cryptocurrency blockchain financial tech',
  экономика: 'economy finance business growth',
  экономический: 'economy financial industry corporate',
  финансы: 'finance banking investment currency',
  финансовый: 'finance investment stock banking',
  бизнес: 'business corporate office teamwork modern',
  предпринимательство: 'entrepreneurship startup modern office',
  инвестиции: 'investment financial growth charts money',
  банк: 'banking finance economy architecture',
  рынок: 'market stock exchange financial business',
  торговля: 'commerce trade retail logistics business',
  экспорт: 'export cargo ship logistics container',
  импорт: 'import freight shipping transport container',
  менеджмент: 'corporate management leadership office',
  маркетинг: 'digital marketing social branding business',
  стратегия: 'strategy business roadmap chess planning',

  // Tibbiyot va Salomatlik / Медицина
  tibbiyot: 'medicine doctor hospital healthcare',
  tibbiy: 'medical clinic healthcare doctor',
  shifokor: 'doctor hospital healthcare clinic',
  hamshira: 'nurse hospital medical care',
  salomatlik: 'healthcare wellness medical fitness',
  kasallik: 'medical disease therapy laboratory',
  davolash: 'treatment medical healthcare therapy',
  dorilar: 'medicine pharmacy pharmaceutical pills',
  farmatsevtika: 'pharmaceutical medicine research lab',
  anatomiya: 'human anatomy medical science',
  jarrohlik: 'surgery surgeon operating medical room',
  vaksina: 'vaccine medicine laboratory research',
  virus: 'virus microbiology laboratory medical',
  медицина: 'medicine doctor hospital healthcare clinic',
  медицинский: 'medical healthcare laboratory clinic doctor',
  врач: 'doctor medical clinic stethoscope hospital',
  здравоохранение: 'healthcare hospital medical clinic',
  больница: 'modern hospital clinic healthcare building',
  лечение: 'medical treatment therapy healthcare',
  фармацевтика: 'pharmaceutical laboratory research pills',
  хирургия: 'surgery operation hospital room doctors',
  вакцина: 'vaccine medicine laboratory syringe research',
  вирус: 'microbiology virus laboratory microscope',
  анатомия: 'human anatomy medical science research',

  // Ta'lim va Fan / Образование и Наука
  talim: 'education university classroom students',
  maktab: 'school classroom students learning',
  universitet: 'university campus college students',
  institut: 'academic university library study campus',
  talaba: 'student studying college university',
  talabalar: 'students college campus studying',
  oqituvchi: 'teacher classroom education professor',
  pedagogika: 'pedagogy education teaching school',
  dars: 'classroom lecture study learning',
  kitob: 'books library literature study',
  kitoblar: 'library books knowledge education',
  tadqiqot: 'scientific research laboratory study',
  ilmiy: 'science research academic laboratory',
  fan: 'science research knowledge discovery',
  образование: 'education university students classroom',
  университет: 'university campus modern college students',
  школа: 'school classroom students learning study',
  студент: 'student university campus library studying',
  студенты: 'college students campus study learning',
  наука: 'science laboratory research experiment',
  научный: 'scientific research academic laboratory tech',
  исследования: 'scientific research laboratory discovery',
  лаборатория: 'modern science laboratory experiment test',

  // Tarix, Adabiyot va Madaniyat / Культура и История
  navoiy: 'classic oriental poetry manuscript literature',
  adabiyot: 'literature classic books library poetry',
  sheriyat: 'poetry poem literature writing manuscript',
  ijod: 'art literature writing creative work',
  tarix: 'history ancient architecture heritage museum',
  tarixiy: 'historical ancient architecture heritage',
  madaniy: 'cultural heritage tradition monument architecture museum',
  madaniyat: 'culture tradition heritage architecture',
  boylik: 'cultural heritage wealth historical treasures',
  boyligi: 'cultural heritage treasure historical assets',
  meros: 'cultural heritage historical architecture monument',
  muzey: 'museum art historical artifacts gallery',
  qadimiy: 'ancient historical architecture monument',
  buxoro: 'ancient central asia architecture monuments',
  samarqand: 'ancient central asia turquoise dome architecture',
  temur: 'historical central asia empire architecture',
  культура: 'culture heritage cultural museum art',
  культурное: 'cultural heritage museum historical architecture',
  наследие: 'cultural heritage historical architecture monument',
  богатство: 'cultural heritage treasure historical',
  история: 'history ancient architecture heritage museum',
  исторический: 'historical ancient monument architecture',
  литература: 'literature classic library books poetry',
  музей: 'museum art historical artifacts gallery',
  фарҳанг: 'culture heritage traditional art',
  фарҳангӣ: 'cultural heritage traditional architecture',
  мерос: 'cultural heritage historical architecture',

  // Tabiat, Ekologiya va Energetika / Экология и Энергетика
  tabiat: 'nature landscape green environment forest',
  ekologiya: 'ecology green clean energy environment',
  global: 'global climate earth planet warming',
  isish: 'climate change global warming glacier melting',
  iqlim: 'climate weather meteorology atmosphere earth',
  muzlik: 'glacier ice arctic melting ice polar',
  issiqxona: 'greenhouse effect climate emissions',
  parnik: 'greenhouse gas emissions atmosphere',
  uglerod: 'carbon footprint emissions green transition',
  co2: 'carbon emissions greenhouse gas atmosphere',
  harorat: 'temperature climate global warming atmosphere',
  atmosfera: 'earth atmosphere planet ozone sky',
  chiqindi: 'recycling circular economy waste clean',
  qishloq: 'agriculture farming field harvest rural',
  xojaligi: 'farming agriculture harvest crops field',
  hosil: 'harvest agriculture crops farm wheat',
  paxta: 'cotton field agriculture harvest farm',
  galla: 'wheat agriculture grain field harvest',
  bogdorchilik: 'orchard fruit trees gardening nature',
  fermer: 'farmer agriculture field crop tractor',
  suv: 'water river clean environment nature',
  energiya: 'clean green energy solar wind turbine',
  quyosh: 'solar energy panels sunshine technology',
  shamol: 'wind turbine clean energy nature',
  экология: 'ecology clean green nature environment',
  природа: 'nature landscape green forest mountains',
  климат: 'climate weather atmosphere planet earth',
  потепление: 'climate change global warming glacier melting',
  энергетика: 'clean green renewable energy solar wind',
  солнечная: 'solar panels energy renewable sunshine',
  ветровая: 'wind turbines renewable clean green energy',
  отходы: 'recycling circular economy waste environment',
  сельское: 'agriculture farm harvest crops field tractor',
  хозяйство: 'agriculture farm harvesting wheat crops',
  глобальное: 'global climate earth planet warming',
  глобальный: 'global climate planet atmosphere',
  изменение: 'climate change weather atmosphere earth',
  изменения: 'climate change global warming nature',
  муҳит: 'environment nature clean ecology',
  муҳити: 'environment clean green nature',
  зист: 'living environment ecology nature',
  вода: 'clean water river lake environment nature',

  // Fizika, Kimyo va Muhandislik / Физика и Инженерия
  fizika: 'physics science quantum research laboratory',
  kimyo: 'chemistry laboratory experiment flask science',
  laboratoriya: 'science laboratory research experiment tech',
  muhandislik: 'engineering industrial technology machine',
  qurilish: 'construction architecture building modern',
  arxitektura: 'architecture modern building exterior facade',
  zavod: 'factory industrial manufacturing production',
  sanoat: 'industry modern factory manufacturing machinery',
  avtomobil: 'automotive car modern vehicle technology',
  aviatsiya: 'aviation airplane flight aerospace modern',
  transport: 'transport logistics freight modern transit',
  физика: 'physics science quantum research laboratory',
  химия: 'chemistry laboratory experiment flask science',
  инженерия: 'engineering industrial technology machine',
  строительство: 'modern construction architecture building',
  архитектура: 'architecture modern building facade design',
  промышленность: 'industry factory manufacturing machinery',
  автомобили: 'modern automotive vehicle technology car',
  транспорт: 'transport logistics freight high speed train',
};

// Tashlab yuboriladigan to'ldiruvchi so'zlar (stopwords)
const STOP_WORDS = new Set([
  'va', 'bilan', 'uchun', 'haqida', 'dagi', 'ning', 'dan', 'ga', 'ham', 'bu', 'u', 'bir',
  'mavzusi', 'tahlili', 'bosqichlari', 'omillari', 'asosiy', 'kirish', 'xulosalar',
  'tavsiyalar', 'keyslar', 'istiqbollari', 'muammolari', 'yechimlari', 'tamoyillari',
  'tuzilishi', 'tizimi', 'korsatkichlari', 'boyicha', 'orqali', 'amaliyoti', 'nazariyasi',
  'ozbekiston', 'ozbekistonda', 'respublikasi', 'davlat', 'hududiy', 'slayd', 'taqdimot',
  'и', 'в', 'на', 'с', 'по', 'для', 'о', 'об', 'как', 'это', 'что', 'темы', 'тема',
  'анализ', 'введение', 'заключение', 'выводы', 'рекомендации', 'основы', 'проблемы',
  'решения', 'принципы', 'структура', 'показатели', 'методология', 'практический',
  'теоретический', 'россия', 'государственный', 'слайд', 'презентация', 'обзор',
  'ва', 'бо', 'барои', 'дар', 'аз', 'ба', 'ин', 'он', 'як', 'мавзуъ', 'тахлил', 'хулоса',
  'мукаддима', 'тавсияхо', 'сохтор', 'низом', 'муаррифи',
  'concept', 'photo', 'illustration', 'visual', 'hd', '4k', 'wallpaper', 'free', 'image', 'picture'
]);

/**
 * Matn allaqachon professional inglizcha prompt ekanligini aniqlash.
 */
function isPrimarilyEnglish(text) {
  if (!text || typeof text !== 'string') return false;
  // Agar kirill harflari bo'lsa, inglizcha emas
  if (/[\u0400-\u04FF]/.test(text)) return false;

  const words = text.toLowerCase().replace(/[^a-z\s]/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return false;

  const englishCommon = new Set([
    'operating', 'system', 'systems', 'technology', 'technologies', 'computer', 'computers',
    'desktop', 'interface', 'software', 'hardware', 'cloud', 'data', 'server', 'servers',
    'digital', 'network', 'cyber', 'code', 'coding', 'developer', 'programming',
    'medical', 'doctor', 'hospital', 'science', 'research', 'laboratory', 'nature',
    'environment', 'climate', 'green', 'energy', 'solar', 'business', 'office',
    'finance', 'financial', 'market', 'modern', 'professional', 'concept', 'visual',
    'architecture', 'building', 'mobile', 'robot', 'robotics', 'intelligence', 'artificial',
    'economic', 'global', 'analysis', 'future', 'innovation', 'education', 'student', 'students',
    'linux', 'windows', 'macos', 'android', 'terminal', 'datacenter', 'process', 'management'
  ]);

  const matchCount = words.filter(w => englishCommon.has(w)).length;
  return matchCount >= 2 || (words.length === 1 && englishCommon.has(words[0]));
}

/**
 * Xom qidiruv so'zini tozalab, sof inglizcha vizual kalit so'zlarga aylantiradi.
 */
export function extractCleanKeywords(rawQuery) {
  if (!rawQuery || typeof rawQuery !== 'string') return 'modern technology presentation';

  // 1. Agar prompt allaqachon inglizcha bo'lsa (masalan AI'ning imagePrompts massividan)
  if (isPrimarilyEnglish(rawQuery)) {
    const cleanTokens = rawQuery.toLowerCase()
      .replace(/['`ʻ’]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(w => !STOP_WORDS.has(w) && w.length >= 2);

    if (cleanTokens.length >= 2) {
      // Eng muhim 3-4 ta aniq so'zni qaytaramiz
      const uniqueTokens = [...new Set(cleanTokens)];
      return uniqueTokens.slice(0, 4).join(' ');
    }
  }

  // 2. O'zbekcha / Ruscha / Tojikcha so'zlarni qayta ishlash
  const normalized = rawQuery.toLowerCase()
    .replace(/['`ʻ’]/g, '')
    .trim();

  // So'zlarga ajratish (kirill va lotin harflarini saqlab)
  const rawWords = normalized.split(/[^a-zа-яёғӣӯҳҷқ0-9]+/i).filter(Boolean);
  const englishTerms = [];

  const UZ_SUFFIXES = ['larida', 'laridan', 'dagi', 'lari', 'lar', 'dan', 'da', 'ga', 'ning', 'ni', 'si', 'isi', 'lik', 'ligi', 'yoti', 'yot'];
  const RU_SUFFIXES = ['иями', 'ями', 'ого', 'его', 'ому', 'ему', 'ыми', 'ими', 'ной', 'ный', 'ное', 'ная', 'ные', 'ных', 'ным', 'ской', 'ский', 'ское', 'ские', 'ских', 'ским', 'ия', 'ии', 'ию', 'ией', 'ей', 'ов', 'ев', 'ах', 'ях', 'ам', 'ям', 'ом', 'ем', 'а', 'ы', 'е', 'у'];
  const TG_SUFFIXES = ['хои', 'ҳои', 'хо', 'ҳо', 'ро', 'и', 'е'];

  for (let w of rawWords) {
    if (STOP_WORDS.has(w)) continue;

    // To'g'ridan-to'g'ri lug'atdan tekshirish
    let matched = DICTIONARY[w];

    // Agar topilmasa, o'zbekcha qo'shimchalarni kesish
    if (!matched) {
      for (const suf of UZ_SUFFIXES) {
        if (w.endsWith(suf) && w.length > suf.length + 3) {
          const stem = w.slice(0, -suf.length);
          if (DICTIONARY[stem]) {
            matched = DICTIONARY[stem];
            break;
          }
        }
      }
    }

    // Agar topilmasa, ruscha qo'shimchalarni kesish
    if (!matched) {
      for (const suf of RU_SUFFIXES) {
        if (w.endsWith(suf) && w.length > suf.length + 3) {
          const stem = w.slice(0, -suf.length);
          if (DICTIONARY[stem]) {
            matched = DICTIONARY[stem];
            break;
          }
        }
      }
    }

    // Agar topilmasa, tojikcha qo'shimchalarni kesish
    if (!matched) {
      for (const suf of TG_SUFFIXES) {
        if (w.endsWith(suf) && w.length > suf.length + 3) {
          const stem = w.slice(0, -suf.length);
          if (DICTIONARY[stem]) {
            matched = DICTIONARY[stem];
            break;
          }
        }
      }
    }

    // Agar hali ham topilmasa va kirill harfida bo'lsa -> lotinchaga transliteratsiya qilamiz
    if (!matched && /[\u0400-\u04FF]/.test(w)) {
      const translit = transliterateCyrillic(w);
      if (DICTIONARY[translit]) {
        matched = DICTIONARY[translit];
      } else if (translit.length >= 3 && !STOP_WORDS.has(translit)) {
        // Masalan: "linux", "windows", "python", "server" kabi so'zlar
        englishTerms.push(translit);
      }
    }

    if (matched) {
      englishTerms.push(matched);
    } else if (w.length >= 3 && /^[a-z]+$/.test(w) && !STOP_WORDS.has(w)) {
      englishTerms.push(w);
    }
  }

  // Agar lug'atdan yoki transliteratsiyadan mosliklar topilgan bo'lsa
  if (englishTerms.length > 0) {
    const combined = englishTerms.join(' ').split(/\s+/);
    const unique = [...new Set(combined)].filter(x => x.length > 2 && !STOP_WORDS.has(x));
    // Unsplash uchun eng muhim 3-4 ta aniq kalit so'z
    return unique.slice(0, 4).join(' ');
  }

  // Agar butunlay hech narsa topilmasa, transliteratsiyadan so'zlarni yig'amiz
  const transliteratedAll = transliterateCyrillic(normalized)
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(w => !STOP_WORDS.has(w) && w.length >= 3);

  if (transliteratedAll.length > 0) {
    return transliteratedAll.slice(0, 3).join(' ');
  }

  return 'modern scientific presentation concept';
}

/**
 * Mavzuga 100% mos rasmni topadi va Base64 Data URL sifatida qaytaradi.
 */
export async function fetchContextualImage(promptText, width = 1200, height = 750) {
  const searchQuery = extractCleanKeywords(promptText);
  console.log(`[Image Search] Aniq so'rov: "${searchQuery}" (asl prompt: "${promptText?.slice(0, 50)}")`);

  // 1-URINISH: Unsplash Search (Mavzuga 100% mos yuqori sifatli fotosurat)
  try {
    const unsplashUrl = `https://unsplash.com/napi/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=8&orientation=landscape`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(unsplashUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        // Landshaft (keng formatli) sifatli rasmni tanlaymiz
        const candidates = data.results.filter(r => (r.width || 1200) >= (r.height || 700));
        const picked = candidates[0] || data.results[0] || data.results[1];
        const directUrl = picked?.urls?.regular || picked?.urls?.full || picked?.urls?.small;

        if (directUrl) {
          const imgRes = await fetch(directUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
            }
          });
          if (imgRes.ok) {
            const buf = Buffer.from(await imgRes.arrayBuffer());
            if (buf.byteLength > 6000) {
              console.log(`[Image] Unsplash dan 100% mos foto yuklandi (${(buf.byteLength / 1024).toFixed(0)} KB)`);
              return `data:image/jpeg;base64,${buf.toString('base64')}`;
            }
          }
        }
      }
    }
  } catch (_) {
    // Unsplash uzilsa keyingi bosqichga o'tiladi
  }

  // 2-URINISH: Wikimedia Commons (Ilmiy, tibbiy, tarixiy va ensiklopedik rasmlar)
  try {
    const wikiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(searchQuery)}&gsrlimit=4&prop=imageinfo&iiprop=url&format=json`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(wikiUrl, {
      headers: {
        'User-Agent': 'SlideCraftBot/2.0 (https://t.me/ai_slide_bot; admin@slidecraft.uz)'
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const pages = data.query?.pages;
      if (pages) {
        for (const k of Object.keys(pages)) {
          const imgInfo = pages[k]?.imageinfo?.[0];
          const imgUrl = imgInfo?.url;
          if (imgUrl && (imgUrl.endsWith('.jpg') || imgUrl.endsWith('.jpeg') || imgUrl.endsWith('.png'))) {
            const imgRes = await fetch(imgUrl, {
              headers: {
                'User-Agent': 'SlideCraftBot/2.0 (https://t.me/ai_slide_bot; admin@slidecraft.uz)'
              }
            });
            if (imgRes.ok) {
              const buf = Buffer.from(await imgRes.arrayBuffer());
              if (buf.byteLength > 6000 && buf.byteLength < 6000000) {
                console.log(`[Image] Wikimedia dan yuklandi (${(buf.byteLength / 1024).toFixed(0)} KB)`);
                return `data:image/jpeg;base64,${buf.toString('base64')}`;
              }
            }
          }
        }
      }
    }
  } catch (_) {
    // Keyingi bosqich
  }

  // 3-URINISH: Pollinations AI (Mavzuga mos fotorealistik 4K generatsiya)
  try {
    const seed = Math.floor(Math.random() * 900000) + 10000;
    const aiPrompt = `${searchQuery} professional 4k high quality photography, cinematic lighting, photorealistic, documentary wallpaper`;
    const aiUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(aiPrompt)}?width=${width}&height=${height}&nologo=true&nofeed=true&seed=${seed}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(aiUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.byteLength > 5000) {
        console.log(`[Image] Pollinations AI dan generatsiya qilindi (${(buf.byteLength / 1024).toFixed(0)} KB)`);
        return `data:image/jpeg;base64,${buf.toString('base64')}`;
      }
    }
  } catch (_) {
    //
  }

  return null;
}
