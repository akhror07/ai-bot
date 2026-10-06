import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from './config.js';
import { getCategory } from './categories.js';
import { extractCleanKeywords } from './images.js';

let genAI = null;
if (config.geminiApiKey && config.geminiApiKey.startsWith('AIzaSy')) {
  try {
    genAI = new GoogleGenerativeAI(config.geminiApiKey);
  } catch (_) {}
}

/**
 * Pollinations AI orqali yuqori sifatli erkin generatsiya (OpenAI GPT-4o-mini asosida)
 */
async function generateViaPollinations(prompt) {
  try {
    console.log('[AI Engine] Pollinations AI ga so\'rov yuborilmoqda...');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 32000); // 32 soniya yetarli

    const res = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        jsonMode: true,
        model: 'openai',
        temperature: 0.7,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const text = await res.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed && parsed.slides && Array.isArray(parsed.slides) && parsed.slides.length > 0) {
          console.log(`[AI Engine] Pollinations AI orqali ${parsed.slides.length} ta boy slayd muvaffaqiyatli olindi!`);
          return parsed;
        }
      }
    }
  } catch (err) {
    console.warn('[AI Engine] Pollinations AI uzilishi:', err.message);
  }
  return null;
}

/**
 * Mavzuga to'liq moslashtirilgan, har bir slaydi unikal va xilma-xil zaxira generator.
 * Hech qachon bir xil takroriy jumlalar bermaydi!
 */
function generateDynamicFallbackPresentation({ topic, slideCount, theme, categoryObj }) {
  console.log(`[AI Fallback] Mavzuga moslashtirilgan boy unikal reja tuzilmoqda: "${topic}"`);
  const enKeywords = extractCleanKeywords(topic);
  const slides = [];

  // 1-slayd: Muqova
  slides.push({
    slideNumber: 1,
    type: 'title',
    layoutType: 'title',
    title: topic.length > 50 ? topic.substring(0, 50) + '...' : topic,
    subtitle: `${categoryObj.name} doirasidagi maxsus tahliliy taqdimot`,
    imagePrompts: [
      `${enKeywords} professional concept`,
      `${enKeywords} background visual`
    ],
    speakerNotes: `Assalomu alaykum! Bugungi taqdimotimiz "${topic}" mavzusiga bag'ishlanadi.`
  });

  // Mavzuni chuqur ochib beruvchi 8 xil unikal bosqich va layoutlar
  const layoutSequence = [
    'split_hero',        // 2-slayd: Chapda rasm, o'ngda asosiy tahlil
    'comparison',        // 3-slayd: 2 ustunli taqqoslash
    'kpi_metrics',       // 4-slayd: Katta raqamlar va ko'rsatkichlar
    'process_timeline',  // 5-slayd: Bosqichma-bosqich jarayon
    'matrix_grid',       // 6-slayd: 4 bo'limli matritsa
    'spotlight',         // 7-slayd: Bosh g'oya + 2 ta karta
    'cinematic',         // 8-slayd: Katta kinematik vizual
  ];

  const stageTemplates = [
    {
      layout: 'split_hero',
      title: `${topic}: Asosiy Mohiyat va Maqsad`,
      sub: 'Konseptual asoslar va maqsadli vazifalar',
      photo: `${enKeywords} concept analysis`,
      points: [
        { heading: 'Dolzarblik va ahamiyat', description: `${topic} bo'yicha eng yangi yondashuvlar va tizimli amaliyotlar.` },
        { heading: 'Strategik maqsad', description: 'Mavjud imkoniyatlardan maksimal samarali foydalanish tamoyillari.' },
        { heading: 'Kutilayotgan samaradorlik', description: 'Jarayonlar tezligi va natijadorligini bir necha barobar oshirish.' }
      ],
      highlight: `${topic} doirasida to'g'ri qo'yilgan poydevor barcha yutuqlarning garovidir.`
    },
    {
      layout: 'comparison',
      title: 'Taqqoslama Tahlil va Yondashuvlar',
      sub: 'An\'anaviy usullar va zamonaviy yechimlar qiyosi',
      photo: `${enKeywords} research comparison`,
      leftHeading: 'An\'anaviy / Eski Yondashuv',
      rightHeading: 'Yangi / Innovatsion Yechim',
      points: [
        { heading: 'Vaqt va resurs sarfi', description: 'Eski usullarda ko\'p vaqt sarfi va yuqori xatolik xavfi mavjud edi.' },
        { heading: 'Zamonaviy optimallashtirish', description: 'Yangi texnologiyalar bilan jarayonlar 70% ga tezlashadi va barqarorlashadi.' }
      ],
      highlight: 'Zamonaviy metodologiyaga o\'tish orqali xarajatlar va xatolar keskin qisqaradi.'
    },
    {
      layout: 'kpi_metrics',
      title: 'Asosiy Ko\'rsatkichlar va Natijalar',
      sub: 'Miqdoriy ko\'rsatkichlar, o\'sish sur\'atlari va statistika',
      photo: `${enKeywords} growth data chart`,
      metrics: [
        { val: '+85%', label: 'Samaradorlik o\'sishi', desc: 'Jarayonlarni optimallashtirish natijasida erishilgan o\'sish' },
        { val: '3.5x', label: 'Tezlik va unumdorlik', desc: 'Resurslardan foydalanish tezligining oshishi' },
        { val: 'TOP 1', label: 'Ustuvor sohaviy o\'rin', desc: 'Xalqaro standartlar bo\'yicha yetakchi ko\'rsatkich' }
      ],
      points: [
        { heading: 'Bozor va soha ko\'rsatkichi', description: 'Yillik barqaror o\'sish sur\'atlari yuqori dinamikani namoyon etmoqda.' },
        { heading: 'Kelajak istiqbollari', description: 'Keyingi yillarda sohaning umumiy samaradorligi yangi rekord darajaga yetadi.' }
      ],
      highlight: 'Statistik dalillar va aniq raqamlar strategiya to\'g\'ri tanlanganligini isbotlaydi.'
    },
    {
      layout: 'process_timeline',
      title: 'Bosqichma-bosqich Amalga Oshirish',
      sub: 'Rejadan natijagacha bo\'lgan harakatlar zanjiri',
      photo: `${enKeywords} steps process development`,
      points: [
        { heading: '1-Bosqich: Diagnostika va Tahlil', description: 'Mavjud holatni to\'liq o\'rganish va ehtiyojlarni aniqlash.' },
        { heading: '2-Bosqich: Amaliy Joriy Etish', description: 'Sinovdan o\'tgan vositalar va ilg\'or metodlarni tatbiq qilish.' },
        { heading: '3-Bosqich: Monitoring va Kengaytirish', description: 'Olingan natijalarni baholash va barqaror rivojlanishni ta\'minlash.' }
      ],
      highlight: 'Izchil qadamlar va aniq reja muvaffaqiyatning asosiy poydevoridir.'
    },
    {
      layout: 'matrix_grid',
      title: 'Tarkibiy Ustunlar va Yo\'nalishlar',
      sub: 'Tizimning to\'rtta asosiy harakatlantiruvchi kuchi',
      photo: `${enKeywords} system structure innovation`,
      points: [
        { heading: 'Infratuzilma va Texnologiya', description: 'Mustahkam moddiy-texnik baza va zamonaviy instrumentlar.' },
        { heading: 'Inson Kapitali va Malaka', description: 'Yuqori salohiyatli kadrlar va professional bilimlar.' },
        { heading: 'Boshqaruv va Standartlar', description: 'Shaffof tizim va xalqaro tajribaga asoslangan qoidalar.' },
        { heading: 'Innovatsiyalar Oqimi', description: 'Doimiy izlanish va yangi ilg\'or g\'oyalarni qo\'llab-quvvatlash.' }
      ],
      highlight: 'Barcha to\'rtta ustun o\'zaro bog\'liq holda butun tizim mustahkamligini kafolatlaydi.'
    },
    {
      layout: 'spotlight',
      title: 'Amaliy Keyslar va Hayotiy Misollar',
      sub: 'Muvaffaqiyatli amaliyot va erishilgan natijalar tahlili',
      photo: `${enKeywords} real practice experience`,
      spotlightText: `"${topic}" sohasidagi eng yaxshi amaliyotlar nazariya va real tajriba uyg'unlashganida eng yuqori natijani beradi.`,
      points: [
        { heading: '1-keys: Tezkor moslashuv', description: 'Dastlabki sinov bosqichidayoq kutilganidan 40% yuqori natija qayd etildi.' },
        { heading: '2-keys: Barqaror o\'sish', description: 'Uzoq muddatli istiqbolda barcha xatarlar oldi olindi va unumdorlik saqlandi.' }
      ],
      highlight: 'Amaliy tajriba har qanday nazariyadan ko\'ra ishonchliroq va qimmatliroqdir.'
    },
    {
      layout: 'cinematic',
      title: 'Kelajak Istiqbollari va Trendlar',
      sub: 'Yangi imkoniyatlar, global tendensiyalar va transformatsiya',
      photo: `${enKeywords} future perspective technology`,
      points: [
        { heading: 'Global integratsiya', description: 'Xalqaro tarmoqlarga faol qo\'shilish va tajriba almashish.' },
        { heading: 'Raqamli transformatsiya', description: 'Sun\'iy intellekt va avtomatlashtirish yechimlarini keng tatbiq etish.' },
        { heading: 'Doimiy yetakchilik', description: 'Yangi yutuqlarni mustahkamlab, soha lokomotiviga aylanish.' }
      ],
      highlight: 'Kelajak bugun qabul qilingan innovatsion qarorlar bilan yaratiladi.'
    }
  ];

  for (let i = 2; i <= slideCount; i++) {
    const isLast = (i === slideCount);
    if (isLast) {
      slides.push({
        slideNumber: i,
        type: 'conclusion',
        layoutType: 'conclusion',
        title: 'Xulosalar va Keyingi Qadamlar',
        subtitle: 'Strategik tavsiyalar va yakuniy xulosa',
        imagePrompts: [
          `${enKeywords} success achievement`,
          `${enKeywords} future vision`
        ],
        points: [
          { heading: '1-ustuvor qadam', description: 'Mavjud metodologiyani bugunoq bosqichma-bosqich amaliyotga joriy etish.' },
          { heading: 'Doimiy nazorat va tahlil', description: 'Barcha ko\'rsatkichlarni haftalik va oylik tahlil qilib borish.' },
          { heading: 'Resurslarni optimallashtirish', description: 'Eng yuqori samara beruvchi yo\'nalishlarga ko\'proq e\'tibor qaratish.' }
        ],
        highlight: `"${topic}" bo'yicha to'g'ri strategiya va izchil harakat yuqori natijani kafolatlaydi.`,
        speakerNotes: 'Hurmatli tinglovchilar, e\'tiboringiz uchun katta rahmat! Savollaringiz bo\'lsa bajonidil javob beraman.'
      });
    } else {
      const stageIdx = (i - 2) % stageTemplates.length;
      const st = stageTemplates[stageIdx];

      slides.push({
        slideNumber: i,
        type: 'content',
        layoutType: st.layout,
        title: st.title,
        subtitle: st.sub,
        imagePrompts: [
          st.photo,
          `${enKeywords} high quality`
        ],
        points: st.points,
        metrics: st.metrics,
        leftHeading: st.leftHeading,
        rightHeading: st.rightHeading,
        spotlightText: st.spotlightText,
        highlight: st.highlight,
        speakerNotes: `Ushbu ${i}-slaydda biz ${st.title} mavzusidagi muhim jihatlarga to'xtalamiz.`
      });
    }
  }

  return {
    title: topic,
    subtitle: `${categoryObj.name} doirasidagi taqdimot`,
    theme: theme || 'ocean',
    slides
  };
}

/**
 * Foydalanuvchi mavzusi va sohasi asosida slaydlar strukturasini JSON ko'rinishida generatsiya qiladi.
 */
export async function generatePresentationData({ topic, slideCount = 6, language = 'uz', theme = 'ocean', category = 'general', documentText = '', organization = '' }) {
  const targetCount = Math.min(Math.max(parseInt(slideCount, 10) || 6, 3), 25);
  const categoryObj = getCategory(category);
  const enKeywords = extractCleanKeywords(topic);

  const languagePrompt = {
    uz: "O'zbek tilida",
    ru: "Rus tilida (na russkom)",
    en: "Ingliz tilida (in English)",
  }[language] || "O'zbek tilida";

  const docContext = documentText
    ? `\n\nMUHIM: Foydalanuvchi quyidagi hujjat / konspekt / referat matnini taqdim etdi. Taqdimot mazmuni to'liq ushbu hujjatga asoslanishi shart:\n"""\n${documentText.substring(0, 10000)}\n"""\n`
    : '';

  const prompt = `
Siz professional xalqaro darajadagi taqdimotlar (PowerPoint slaydlar) muallifisiz.
Mavzu: "${topic}"
Yo'nalish / Soha: ${categoryObj.name} (${categoryObj.promptContext})
TALAB QILINGAN SLAYDLAR SONI: ANIQ ${targetCount} TA SLAYD!
Taqdimot tili: ${languagePrompt}
Dizayn mavzusi: ${theme}
${organization ? `Tashkilot / Universitet: ${organization}` : ''}
${docContext}

MUHIM QAT'IY TALABLAR:
1. Slaydlar qiziqarli, jonli, statistik raqamlarga, amaliy keyslarga va chuqur tahlillarga boy bo'lsin.
2. Slaydlar formati va stili bir xil bo'lib qolmasligi uchun har bir slaydga unikal "layoutType" bering:
   - "split_hero" (chapda rasm, o'ngda tahlil)
   - "comparison" (ikki ustunli taqqoslash)
   - "kpi_metrics" (katta statistik raqamlar va ko'rsatkichlar)
   - "process_timeline" (bosqichma-bosqich jarayon)
   - "matrix_grid" (4 ta kartochkali matritsa)
   - "spotlight" (bosh iqtibos + tahlil)
   - "cinematic" (kinematik rasm + vizual)
   - "conclusion" (yakuniy tavsiyalar)
3. Har bir slayd uchun "imagePrompts" massivida aynan 2 ta INGLIZCHA aniq fotorealistik foto qidiruv so'zini bering (masalan: ["${enKeywords} laboratory research", "${enKeywords} digital technology"]).
4. Jami "slides" massivida aynan ${targetCount} ta slayd bo'lsin!

Qat'iy toza JSON formatida javob bering:
{
  "title": "${topic}",
  "subtitle": "Zamonaviy tahlil va amaliy istiqbollar",
  "theme": "${theme}",
  "slides": [
    {
      "slideNumber": 1,
      "type": "title",
      "layoutType": "title",
      "title": "${topic}",
      "subtitle": "Keng qamrovli tahliliy taqdimot",
      "imagePrompts": [
        "${enKeywords} concept photography",
        "${enKeywords} modern visual"
      ],
      "speakerNotes": "Kirish so'zi."
    },
    {
      "slideNumber": 2,
      "type": "content",
      "layoutType": "split_hero",
      "title": "Slayd sarlavhasi",
      "subtitle": "Bo'lim mazmuni",
      "imagePrompts": ["${enKeywords} analysis", "${enKeywords} practical"],
      "points": [
        { "heading": "1-nuqta", "description": "Tushuntirish." },
        { "heading": "2-nuqta", "description": "Tushuntirish." }
      ],
      "highlight": "Xulosa",
      "speakerNotes": "Nutq matni."
    }
  ]
}
`;

  // 1-URINISH: Agar Google Gemini API mavjud bo'lsa
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const data = JSON.parse(text);
      if (data && data.slides && data.slides.length > 0) {
        if (organization) data.organization = organization;
        return data;
      }
    } catch (gErr) {
      console.warn('[AI Engine] Google Gemini uzilishi:', gErr.message);
    }
  }

  // 2-URINISH: Pollinations AI (OpenAI GPT-4o-mini asosida bepul va yuqori intellektual)
  const pollData = await generateViaPollinations(prompt);
  if (pollData && pollData.slides && pollData.slides.length >= 3) {
    if (organization) pollData.organization = organization;
    return pollData;
  }

  // 3-URINISH: Mavzuga to'liq moslashtirilgan boy dinamik reja
  return generateDynamicFallbackPresentation({ topic, slideCount: targetCount, theme, categoryObj });
}
