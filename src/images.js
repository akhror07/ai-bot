/**
 * Mavzuga 100% mos yuqori sifatli fotosuratlarni qidiradi va yuklaydi.
 * 1-bosqich: Unsplash Search (haqiqiy, professional, mavzuga to'liq mos 4K fotosuratlar).
 * 2-bosqich: Wikimedia Commons (ilmiy, texnik, tibbiy va ta'limiy fotosuratlar).
 * 3-bosqich: Pollinations AI (mavzuga mos 4K generatsiya).
 * Hech qachon mavzuga aloqasiz tasodifiy rasm chiqarmaydi!
 */

// Kengaytirilgan o'zbekcha/ruscha so'zlarni professional inglizcha vizual kalit so'zlarga o'tkazish lug'ati
const DICTIONARY = {
  // Psixologiya va inson idroki
  psixologiya: 'psychology human brain',
  psixologik: 'psychological mental mind',
  kognitiv: 'cognitive brain neuroscience',
  xotira: 'memory brain recall',
  xotirasi: 'memory brain mind',
  inson: 'human mind',
  ong: 'consciousness human brain',
  miya: 'human brain neuroscience',
  ruhiyat: 'psychology emotional mental',
  emotsiya: 'emotion feeling expressive',
  xulq: 'behavior psychological',
  idrok: 'perception cognitive brain',
  tafakkur: 'thinking reasoning intellect',

  // Sun'iy intellekt va Axborot texnologiyalari
  suniy: 'artificial intelligence robot',
  intellekt: 'intelligence algorithm neural',
  ai: 'artificial intelligence futuristic technology',
  neyron: 'neural network deep learning',
  tarmoq: 'network cyber digital',
  tarmoqlari: 'neural network data',
  robot: 'robot robotics automation',
  robototexnika: 'robotics automation machine',
  dasturlash: 'programming software coding developer',
  dasturchi: 'software developer coding computer',
  kompyuter: 'computer technology laptop modern',
  kiber: 'cyber security technology code',
  xavfsizlik: 'security technology protection shield',
  malumotlar: 'data analytics server cloud',
  baza: 'database analytics server',
  bulutli: 'cloud computing digital data',
  texnologiya: 'technology innovation modern tech',
  texnologiyalar: 'technology digital innovation',
  innovatsiya: 'innovation creative technology future',
  algoritm: 'algorithm digital logic code',
  veb: 'web technology digital modern',
  mobil: 'mobile smartphone digital app',

  // Iqtisodiyot, Biznes va Moliya
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

  // Tibbiyot va Salomatlik
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
  jarrohlik: 'surgery surgeon operating medical',
  vaksina: 'vaccine medicine laboratory research',
  virus: 'virus microbiology laboratory medical',

  // Ta'lim va Fan
  talim: 'education university classroom students',
  maktab: 'school classroom students learning',
  universitet: 'university campus college students',
  institut: 'academic university library study',
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

  // Adabiyot, Tarix va Madaniyat
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
  фарҳанг: 'culture heritage traditional art',
  фарҳангӣ: 'cultural heritage traditional architecture',
  мерос: 'cultural heritage historical architecture',

  // Tabiat, Ekologiya va Qishloq xo'jaligi
  tabiat: 'nature landscape green environment forest',
  ekologiya: 'ecology green clean energy environment',
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

  // Huquq va Davlat
  huquq: 'law justice courthouse legal courtroom',
  qonun: 'law justice court judge legal hammer',
  sud: 'courthouse courtroom judge justice legal',
  adolat: 'justice scales of justice courthouse law',
  konstitutsiya: 'constitution law legal document justice',
  advokat: 'lawyer attorney courthouse legal business',

  // Fizika, Kimyo va Muhandislik
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

  // Sport va San'at
  sport: 'sports athletics athlete fitness stadium',
  futbol: 'football soccer stadium athlete sports',
  fitnes: 'fitness workout athlete gymnasium health',
  sanat: 'art painting gallery exhibition artist',
  musiqa: 'music musical instruments sound concert',
  teatr: 'theatre stage performance drama hall',
  kino: 'cinema film camera movie production',
};

// Tashlab yuboriladigan to'ldiruvchi so'zlar (stopwords)
const STOP_WORDS = new Set([
  'va', 'bilan', 'uchun', 'haqida', 'dagi', 'ning', 'dan', 'ga', 'ham', 'bu', 'u', 'bir',
  'mavzusi', 'tahlili', 'bosqichlari', 'omillari', 'asosiy', 'kirish', 'xulosalar',
  'tavsiyalar', 'keyslar', 'istiqbollari', 'muammolari', 'yechimlari', 'tamoyillari',
  'tuzilishi', 'tizimi', 'korsatkichlari', 'boyicha', 'orqali', 'amaliyoti', 'nazariyasi',
  'ozbekiston', 'ozbekistonda', 'respublikasi', 'davlat', 'hududiy'
]);

/**
 * Xom qidiruv so'zini tozalab, sof inglizcha vizual kalit so'zlarga aylantiradi.
 */
export function extractCleanKeywords(rawQuery) {
  if (!rawQuery || typeof rawQuery !== 'string') return 'modern technology presentation';

  // Lotin harflariga keltirish, belgilarni tozalash
  const cleaned = rawQuery.toLowerCase()
    .replace(/['`ʻ’]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = cleaned.split(' ');
  const englishTerms = [];

  const SUFFIXES = ['larida', 'laridan', 'dagi', 'lari', 'lar', 'dan', 'da', 'ga', 'ning', 'ni', 'si', 'isi', 'lik', 'ligi', 'yoti', 'yot'];

  for (let w of words) {
    if (STOP_WORDS.has(w)) continue;

    let matched = DICTIONARY[w];
    if (!matched) {
      // O'zbekcha qo'shimchalarni ajratib tekshirish
      for (const suf of SUFFIXES) {
        if (w.endsWith(suf) && w.length > suf.length + 3) {
          const stem = w.slice(0, -suf.length);
          if (DICTIONARY[stem]) {
            matched = DICTIONARY[stem];
            break;
          }
        }
      }
    }

    if (matched) {
      englishTerms.push(matched);
    } else if (w.length >= 3 && /^[a-z]+$/.test(w)) {
      englishTerms.push(w);
    }
  }

  // Agar lug'atdan mosliklar topilgan bo'lsa, birlashtiramiz va takrorlarini olib tashlaymiz
  if (englishTerms.length > 0) {
    const combined = englishTerms.join(' ').split(' ');
    const unique = [...new Set(combined)].filter(x => x.length > 2);
    // Unsplash uchun eng muhim 3-4 ta kalit so'z
    return unique.slice(0, 4).join(' ');
  }

  // Agar sof inglizcha so'zlar bo'lsa
  const cleanEnglishOnly = words.filter(w => !STOP_WORDS.has(w) && w.length > 2).slice(0, 3).join(' ');
  if (cleanEnglishOnly) {
    return cleanEnglishOnly;
  }

  return 'modern scientific presentation concept';
}

/**
 * Mavzuga 100% mos rasmni topadi va Base64 Data URL sifatida qaytaradi.
 */
export async function fetchContextualImage(promptText, width = 1000, height = 700) {
  const searchQuery = extractCleanKeywords(promptText);
  console.log(`[Image Search] Aniq so'rov: "${searchQuery}" (asl prompt: "${promptText?.slice(0, 45)}")`);

  // 1-URINISH: Unsplash Search (Mavzuga 100% mos eng yuqori sifatli fotosurat)
  try {
    const unsplashUrl = `https://unsplash.com/napi/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=4`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    const res = await fetch(unsplashUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        // Eng birinchi eng mos keluvchi fotosuratni olamiz (#0 yoki #1)
        const picked = data.results[0] || data.results[1];
        const directUrl = picked?.urls?.regular || picked?.urls?.small;

        if (directUrl) {
          const imgRes = await fetch(directUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
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
    const wikiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(searchQuery)}&gsrlimit=3&prop=imageinfo&iiprop=url&format=json`;
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
              if (buf.byteLength > 6000 && buf.byteLength < 5000000) {
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
    const aiPrompt = `${searchQuery} professional 4k high quality photography cinematic documentary`;
    const aiUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(aiPrompt)}?width=${width}&height=${height}&nologo=true&nofeed=true&seed=${seed}`;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000); // 12 soniya yetarli

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
