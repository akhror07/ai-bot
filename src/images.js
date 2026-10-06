/**
 * Mavzuga 100% mos yuqori sifatli fotosuratlarni qidiradi va yuklaydi.
 * 1-bosqich: Unsplash Search (haqiqiy, professional, mavzuga to'liq mos 4K fotosuratlar).
 * 2-bosqich: Wikimedia Commons (ilmiy, texnik, tibbiy va ta'limiy fotosuratlar).
 * 3-bosqich: Pollinations AI (mavzuga mos generatsiya).
 * Hech qachon mavzuga aloqasiz tasodifiy rasm chiqarmaydi!
 */

// Sohaviy inglizcha kalit so'zlar xaritasi
const CATEGORY_KEYWORDS = {
  education: 'education university students study classroom learning',
  economy: 'business finance economy investment growth market',
  medical: 'medical healthcare medicine doctor hospital science',
  tech: 'technology software coding computer artificial intelligence',
  nature: 'nature ecology agriculture environment green science',
  general: 'modern professional presentation abstract concept',
};

// O'zbekcha atamalarni inglizchaga tarjima qilish xaritasi (qidiruv aniqligini oshirish uchun)
const UZ_EN_DICTIONARY = {
  psixologiya: 'psychology human mind',
  kognitiv: 'cognitive brain memory',
  iqtisod: 'economy finance',
  moliya: 'finance banking investment',
  tibbiyot: 'medicine healthcare doctor',
  talim: 'education university classroom',
  maktab: 'school learning students',
  tarix: 'history historical museum',
  texnologiya: 'technology computer innovation',
  dasturlash: 'programming software coding',
  suniy: 'artificial intelligence robot',
  intellekt: 'intelligence algorithm neural network',
  qishloq: 'agriculture farming field',
  xojaligi: 'farming agriculture harvest',
  tabiat: 'nature environment ecology',
  ekologiya: 'ecology green clean energy',
  marketing: 'marketing business sales digital',
  strategiya: 'strategy roadmap planning',
  boshqaruv: 'management leadership team',
  fizika: 'physics science research laboratory',
  kimyo: 'chemistry laboratory experiment science',
  matematika: 'mathematics data analytics formulas',
  geografiya: 'geography world globe landscape',
  huquq: 'law justice court legal',
  madaniyat: 'culture art heritage museum',
};

function cleanAndTranslateQuery(rawQuery) {
  if (!rawQuery || typeof rawQuery !== 'string') return 'modern technology presentation';

  let clean = rawQuery.toLowerCase()
    .replace(/['`ʻ’]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Agar so'zlar o'zbekcha bo'lsa, inglizcha ekvivalentini qo'shish
  const tokens = clean.split(' ');
  const translated = [];
  for (const t of tokens) {
    if (UZ_EN_DICTIONARY[t]) {
      translated.push(UZ_EN_DICTIONARY[t]);
    } else if (t.length > 2) {
      translated.push(t);
    }
  }

  const finalQuery = translated.join(' ').slice(0, 70);
  return finalQuery || 'professional presentation visual';
}

export async function fetchContextualImage(promptText, width = 800, height = 600) {
  const searchQuery = cleanAndTranslateQuery(promptText);
  console.log(`[Image Search] So'rov: "${searchQuery}" (asl prompt: "${promptText?.slice(0, 40)}")`);

  // 1-URINISH: Unsplash Search (Mavzuga 100% mos haqiqiy fotosuratlar)
  try {
    const unsplashUrl = `https://unsplash.com/napi/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=5`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(unsplashUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        // Natijalardan mosini tanlash
        const picked = data.results[Math.floor(Math.random() * Math.min(data.results.length, 4))];
        const directUrl = picked?.urls?.regular || picked?.urls?.small;

        if (directUrl) {
          const imgRes = await fetch(directUrl);
          if (imgRes.ok) {
            const buf = Buffer.from(await imgRes.arrayBuffer());
            if (buf.byteLength > 5000) {
              console.log(`[Image] Unsplash dan muvaffaqiyatli yuklandi (${(buf.byteLength / 1024).toFixed(0)} KB)`);
              return `data:image/jpeg;base64,${buf.toString('base64')}`;
            }
          }
        }
      }
    }
  } catch (err) {
    // Unsplash band bo'lsa yoki xatolik bersa, keyingi bosqichga o'tiladi
  }

  // 2-URINISH: Wikimedia Commons (Ilmiy, tibbiy, tarixiy va ensiklopedik rasmlar)
  try {
    const wikiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(searchQuery)}&gsrlimit=4&prop=imageinfo&iiprop=url&format=json`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(wikiUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const pages = data.query?.pages;
      if (pages) {
        const pageKeys = Object.keys(pages);
        for (const k of pageKeys) {
          const imgInfo = pages[k]?.imageinfo?.[0];
          const imgUrl = imgInfo?.url;
          if (imgUrl && (imgUrl.endsWith('.jpg') || imgUrl.endsWith('.jpeg') || imgUrl.endsWith('.png'))) {
            const imgRes = await fetch(imgUrl);
            if (imgRes.ok) {
              const buf = Buffer.from(await imgRes.arrayBuffer());
              if (buf.byteLength > 5000 && buf.byteLength < 5000000) {
                console.log(`[Image] Wikimedia dan muvaffaqiyatli yuklandi (${(buf.byteLength / 1024).toFixed(0)} KB)`);
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

  // 3-URINISH: Pollinations AI (mavzuga mos generatsiya)
  try {
    const seed = Math.floor(Math.random() * 900000) + 10000;
    const aiUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(searchQuery + ' high quality 4k photography cinematic')}` +
                  `?width=${width}&height=${height}&nologo=true&seed=${seed}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5500);

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

  // Hech qachon random picsum bermaymiz!
  return null;
}
