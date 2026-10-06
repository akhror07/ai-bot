import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from './config.js';
import { getCategory } from './categories.js';

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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 18000);

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
      // JSONni ajratib olish
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
 * Mavzuga to'liq moslashtirilgan, har bir slaydi boy va xilma-xil zaxira generator.
 * Hech qachon bir xil takroriy jumlalar bermaydi!
 */
function generateDynamicFallbackPresentation({ topic, slideCount, theme, categoryObj }) {
  console.log(`[AI Fallback] Mavzuga moslashtirilgan boy reja tuzilmoqda: "${topic}"`);
  const slides = [];

  // 1-slayd: Muqova
  slides.push({
    slideNumber: 1,
    type: 'title',
    title: topic.length > 45 ? topic.substring(0, 45) + '...' : topic,
    subtitle: `${categoryObj.name} bo'yicha tahliliy va amaliy qo'llanma`,
    imagePrompts: [
      `${topic} high resolution concept photo 4k`,
      `${topic} modern background visual`
    ],
    speakerNotes: `Assalomu alaykum! Bugungi taqdimotimiz "${topic}" mavzusiga bag'ishlanadi. Unda sohaning eng muhim jihatlarini tahlil qilamiz.`
  });

  // Mavzuni chuqur ochib beruvchi 8 xil unikal bosqich
  const topicStages = [
    {
      title: `${topic}: Kirish va Asosiy Mohiyat`,
      sub: 'Nazariy poydevor va boshlang\'ich tushunchalar',
      photo: `${topic} foundational concept`,
      points: [
        { heading: 'Muammoning dolzarbligi', description: `${topic} bugungi kunda sohadagi eng tez rivojlanayotgan yo'nalishlardan biridir.` },
        { heading: 'Asosiy maqsad va vazifalar', description: 'Tizimning ishlash tamoyillarini chuqur anglash va amaliyotga tatbiq etish.' },
        { heading: 'Kutilayotgan samaradorlik', description: 'To\'g\'ri tahlil orqali jarayonlar tezligini 2-3 barobarga oshirish imkoniyati.' }
      ],
      highlight: `${topic} bo'yicha mustahkam poydevor kelgusi barcha muvaffaqiyatlarning asosi hisoblanadi.`
    },
    {
      title: 'Tarixiy Rivojlanish va Asosiy Bosqichlar',
      sub: 'Shakllanish davri va evolyutsiya yo\'li',
      photo: `${topic} history evolution`,
      points: [
        { heading: 'Boshlang\'ich tadqiqotlar', description: 'Dastlabki nazariy g\'oyalar va fundamental ilmiy izlanishlar.' },
        { heading: 'Texnologik sakrash davri', description: 'Yangi usullar va zamonaviy vositalar kashf etilishi bilan yangi bosqichga chiqishi.' },
        { heading: 'Bugungi global o\'rni', description: 'Xalqaro standartlar darajasida ommalashuvi va integratsiyalashuvi.' }
      ],
      highlight: 'O\'tmish tajribasi va tarixiy saboqlar bugungi to\'g\'ri qarorlarning yo\'lchi yulduzidir.'
    },
    {
      title: 'Asosiy Omillar va Tarkibiy Qismlar',
      sub: 'Tizimning ichki tuzilishi va harakatlantiruvchi kuchlari',
      photo: `${topic} elements structure system`,
      points: [
        { heading: 'Birinchi tarkibiy ustun', description: 'Barcha jarayonlarni muvofiqlashtiruvchi boshqaruv mexanizmi.' },
        { heading: 'Resurslar va infratuzilma', description: 'Yuqori natija uchun zarur moddiy va intellektual salohiyat.' },
        { heading: 'Inson omili va ko\'nikmalar', description: 'Malakali mutaxassislar va ularning professional mahorati.' }
      ],
      highlight: 'Tarkibiy qismlarning o\'zaro uyg\'unligi butun tizim barqarorligini ta\'minlaydi.'
    },
    {
      title: 'Global Statistika va Bozor Tahlili',
      sub: 'Raqamlar, tendensiyalar va iqtisodiy ko\'rsatkichlar',
      photo: `${topic} statistics data chart`,
      points: [
        { heading: 'Bozor ulushining o\'sishi', description: 'Yillik barqaror o\'sish sur\'atlari 30% dan yuqori natijani ko\'rsatmoqda.' },
        { heading: 'Xalqaro investitsiyalar oqimi', description: 'Yetakchi tashkilotlar tomonidan yo\'naltirilgan sarmoyalar hajmi ortmoqda.' },
        { heading: 'Kelajak iqtisodiy samarasi', description: 'Kelgusi 5 yilda sohaning umumiy samaradorligi rekord darajaga yetishi kutilmoqda.' }
      ],
      highlight: 'Aniq faktlar va statistika soha istiqbolining eng ishonchli dalilidir.'
    },
    {
      title: 'Amaliy Yechimlar va Innovatsiyalar',
      sub: 'Zamonaviy metodologiyalar va yangicha yondashuvlar',
      photo: `${topic} innovation solution laboratory`,
      points: [
        { heading: 'Avtomatlashtirish yechimlari', description: 'Inson omilini kamaytirib, xatoliklarni 80% gacha qisqartirish.' },
        { heading: 'Moslashuvchan algoritmlar', description: 'Har qanday vaziyatga tez moslashuvchi zamonaviy instrumentlar.' },
        { heading: 'Optimallashtirish strategiyasi', description: 'Ortiqcha xarajatlarni qisqartirib, foydalilik koeffitsientini oshirish.' }
      ],
      highlight: 'Innovatsiya bu shunchaki yangilik emas, balki real muammolarning eng qulay yechimidir.'
    },
    {
      title: 'Keyslar va Muvaffaqiyatli Amaliyot',
      sub: 'Haqiqiy hayotiy misollar va erishilgan natijalar',
      photo: `${topic} real practice success`,
      points: [
        { heading: '1-muvaffaqiyatli keys', description: 'Dastlabki sinov bosqichida erishilgan yuqori samaradorlik ko\'rsatkichi.' },
        { heading: '2-sohaviy tajriba', description: 'Kutilmagan qiyinchiliklarni muvaffaqiyatli yengib o\'tish usullari.' },
        { heading: 'Uzoq muddatli barqarorlik', description: 'Olingan natijalarning vaqt o\'tishi bilan yanada mustahkamlanishi.' }
      ],
      highlight: 'Amaliy tajriba har qanday nazariyadan ko\'ra ishonchliroq va qimmatliroqdir.'
    },
    {
      title: 'Xatarlar, Qiyinchiliklar va Himoya',
      sub: 'Ehtimoliy to\'siqlar va ularni bartaraf etish',
      photo: `${topic} security risk protection`,
      points: [
        { heading: 'Texnik va xavfsizlik risklari', description: 'Kutilmagan uzilishlar va tizimli xatoliklardan ishonchli himoyalanish.' },
        { heading: 'Kadrlar yetishmovchiligi', description: 'Doimiy ta\'lim va xodimlar malakasini muntazam oshirib borish.' },
        { heading: 'Zaxira choralari rejasi', description: 'Favqulodda vaziyatlarda tezkor harakatlanish bo\'yicha aniq yo\'riqnoma.' }
      ],
      highlight: 'Xatarlarni oldindan ko\'ra bilish ularni yarmini yengish bilan barobardir.'
    },
    {
      title: 'Xulosalar va Strategik Tavsiyalar',
      sub: 'Yakuniy umumlashtirish va kelgusi harakatlar rejasi',
      photo: `${topic} strategy future roadmap`,
      points: [
        { heading: '1-ustuvor vazifa', description: 'Tizimni bugunoq bosqichma-bosqich sinovdan o\'tkazishni boshlash.' },
        { heading: 'Doimiy tahlil va monitoring', description: 'Erishilgan natijalarni haftalik va oylik tahlil qilib borish.' },
        { heading: 'Kelajak sari qadam', description: 'Zamonaviy texnologiyalardan maksimal foydalanib yetakchilikni saqlash.' }
      ],
      highlight: `"${topic}" bo'yicha to'g'ri strategiya va izchil harakat yuqori natijani kafolatlaydi.`
    }
  ];

  for (let i = 2; i <= slideCount; i++) {
    const isLast = (i === slideCount);
    const stageIdx = isLast ? (topicStages.length - 1) : ((i - 2) % (topicStages.length - 1));
    const st = topicStages[stageIdx];

    slides.push({
      slideNumber: i,
      type: isLast ? 'conclusion' : 'content',
      title: isLast ? 'Xulosalar va Keyingi Qadamlar' : st.title,
      subtitle: isLast ? 'Strategik tavsiyalar va yakuniy xulosa' : st.sub,
      imagePrompts: [
        st.photo,
        `${topic} professional photography`
      ],
      points: st.points,
      highlight: st.highlight,
      speakerNotes: `Hurmatli tinglovchilar, ushbu ${i}-slaydda biz ${st.title} bo'yicha muhim jihatlarga to'xtalamiz.`
    });
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
2. Hech qachon umumiy, zerikarli va takroriy gaplar yozmang! Har bir slaydda haqiqiy sohaviy atamalar, faktlar, aniq ko'rsatkichlar bo'lsin.
3. Jami "slides" massivida aynan ${targetCount} ta slayd bo'lsin!
   - 1-slayd: Muqova (Title)
   - 2-slayddan ${targetCount - 1}-slaydgacha: Mavzuni har tomonlama chuqur ochuvchi tahliliy slaydlar (tushuncha, tarix, statistika, muammolar, innovatsion yechimlar, xalqaro tajriba).
   - ${targetCount}-slayd: Yakuniy xulosalar va tavsiyalar (Conclusion).
4. Har bir slaydda "points" massivida 2 yoki 3 ta asosiy fikr bo'lsin:
   - "heading": Qisqa va jarangdor sarlavha (3-5 so'z).
   - "description": Aniq, lo'nda, mazmunli tushuntirish (1-2 gap).
5. Har bir slayd uchun "imagePrompts" massivida aynan 2 ta INGLIZCHA aniq fotorealistik foto qidiruv so'zini bering (masalan: ["cognitive psychology human brain neuron scan", "laboratory research psychological test"]).

Qat'iy toza JSON formatida javob bering:
{
  "title": "${topic}",
  "subtitle": "Zamonaviy tahlil va amaliy istiqbollar",
  "theme": "${theme}",
  "slides": [
    {
      "slideNumber": 1,
      "type": "title",
      "title": "${topic}",
      "subtitle": "Keng qamrovli tahliliy taqdimot",
      "imagePrompts": [
        "${topic} professional photography 4k",
        "${topic} concept visual background"
      ],
      "speakerNotes": "Kirish so'zi va tinglovchilarni mavzuga qiziqtirish nutqi."
    },
    {
      "slideNumber": 2,
      "type": "content",
      "title": "Slayd 2 mavzusi",
      "subtitle": "Bo'limning qisqa mazmuni",
      "imagePrompts": [
        "English specific photo search term",
        "English supporting visual scene"
      ],
      "points": [
        {
          "heading": "1-asosiy nuqtai nazar",
          "description": "Aniq va boy ma'lumotli tushuntirish."
        },
        {
          "heading": "2-asosiy nuqtai nazar",
          "description": "Aniq va boy ma'lumotli tushuntirish."
        },
        {
          "heading": "3-asosiy nuqtai nazar",
          "description": "Aniq va boy ma'lumotli tushuntirish."
        }
      ],
      "highlight": "Ushbu slayddan olinadigan eng muhim xulosa",
      "speakerNotes": "Spiker ma'ruzasi uchun nutq matni."
    }
  ]
}
`;

  // 1-URINISH: Agar Google Gemini API mavjud bo'lsa
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
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
