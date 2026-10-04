import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from './config.js';
import { getCategory } from './categories.js';

const genAI = new GoogleGenerativeAI(config.geminiApiKey);

/**
 * Agar Google API vaqtinchalik 503 (server yuklamasi) bo'lsa,
 * sifatli zaxira reja tuzib beruvchi generator.
 */
function generateFallbackPresentation({ topic, slideCount, theme, categoryObj }) {
  console.log(`[AI Fallback] Mavzu va soha bo'yicha zaxira reja tuzilmoqda: "${topic}" (${categoryObj.name})`);
  const slides = [];

  // 1-slayd: Muqova
  slides.push({
    slideNumber: 1,
    type: 'title',
    title: topic.length > 40 ? topic.substring(0, 40) + '...' : topic,
    subtitle: `${categoryObj.name} doirasidagi maxsus tahliliy taqdimot`,
    imagePrompts: [
      `${topic} ${categoryObj.id} professional high quality photo 4k cinematic`,
      `${topic} modern aesthetic background texture`
    ],
    speakerNotes: `Hurmatli tinglovchilar, bugungi taqdimotimiz ${categoryObj.name} yo'nalishidagi dolzarb masalalarga bag'ishlanadi.`
  });

  // Kontent slaydlari
  const subtopics = [
    { title: 'Asosiy Tushuncha va Nazariya', sub: 'Sohaviy poydevor va boshlang\'ich tamoyillar' },
    { title: 'Joriy Holat va Amaliy Muammolar', sub: 'Bugungi kundagi real vaziyat va dolzarb masalalar' },
    { title: 'Innovatsion Yondashuvlar', sub: 'Zamonaviy texnologiyalar va yangicha yechimlar' },
    { title: 'Amaliy Tadbiq va Misollar', sub: 'Sohaviy keyslar va muvaffaqiyatli amaliyot' },
    { title: 'Xalqaro Tajriba va Standartlar', sub: 'Yetakchi mamlakatlar va professional standartlar' },
    { title: 'Rivojlanish Strategiyasi', sub: 'Bosqichma-bosqich amalga oshirish rejasi' },
    { title: 'Kelajak Istiqbollari va Trendlar', sub: 'Kelgusi 5-10 yillikdagi asosiy yo\'nalishlar' },
    { title: 'Xulosalar va Asosiy Tavsiyalar', sub: 'Kutilayotgan natijalar va yakuniy xulosa' }
  ];

  for (let i = 2; i <= slideCount; i++) {
    const subIdx = (i - 2) % subtopics.length;
    const st = subtopics[subIdx];
    const isLast = i === slideCount;

    slides.push({
      slideNumber: i,
      type: 'content',
      title: isLast ? 'Xulosalar va Tavsiyalar' : st.title,
      subtitle: isLast ? 'Sohaviy yakuniy fikrlar va istiqbol' : st.sub,
      imagePrompts: [
        `${topic} ${st.title} ${categoryObj.id} 4k high resolution photo`,
        `${topic} ${st.title} detailed professional scene`
      ],
      points: [
        {
          heading: `${st.title} omillari`,
          description: `${topic} doirasida ushbu yo'nalish eng asosiy harakatlantiruvchi kuchlardan biri hisoblanadi.`
        },
        {
          heading: 'Asosiy afzalliklari',
          description: 'To\'g\'ri yondashuv orqali samaradorlikni oshirish va yangi natijalarga erishish mumkin.'
        },
        {
          heading: 'Amaliy tavsiya',
          description: 'Muntazam monitoring va professional ko\'nikmalar natijani barqaror ushlab turadi.'
        }
      ],
      highlight: `${topic} bo'yicha tizimli va professional yondashuv eng yuqori natijani ta'minlaydi.`,
      speakerNotes: `Ushbu slaydda ${st.title} bo'yicha asosiy xulosalarni ko'rib chiqamiz.`
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
 * @param {Object} options
 * @param {string} options.topic - Slayd mavzusi
 * @param {number} [options.slideCount=6] - Slaydlar soni
 * @param {string} [options.language='uz'] - Til
 * @param {string} [options.theme='ocean'] - Dizayn mavzusi
 * @param {string} [options.category='general'] - Soha / Yo'nalish
 * @param {string} [options.documentText] - Biriktirilgan hujjat / referat matni
 * @param {string} [options.organization] - Tashkilot / Universitet nomi
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
    ? `\n\nMUHIM: Foydalanuvchi quyidagi hujjat / konspekt / referat matnini taqdim etdi. Taqdimot mazmuni, faktlari va bandlari to'liq ushbu hujjat matniga asoslanishi shart:\n"""\n${documentText.substring(0, 10000)}\n"""\n`
    : '';

  const prompt = `
Siz professional taqdimotlar (PowerPoint slaydlar) bo'yicha yetakchi mutaxassissiz.
Foydalanuvchi quyidagi mavzuda taqdimot tayyorlashni so'radi:
Mavzu: "${topic}"
Yo'nalish / Soha: ${categoryObj.name}
Sohaviy yo'riqnoma: ${categoryObj.promptContext}
TALAB QILINGAN SLAYDLAR SONI: ANIQ ${targetCount} TA!
Taqdimot tili: ${languagePrompt}
Tavsiya etilgan dizayn mavzusi: ${theme}
${organization ? `Tashkilot / Universitet: ${organization}` : ''}
${docContext}

MUHIM QAT'IY TALAB:
Siz taqdimot uchun qat'iy ravishda ANIQ ${targetCount} TA slayd tuzishingiz shart! "slides" massivida kam ham emas, ko'p ham emas, aynan ${targetCount} ta slayd obyekti bo'lsin.
- Taqdimot mazmuni aynan tanlangan soha (${categoryObj.name}) atamalari, uslubi va amaliy talablariga mos kelsin.
- 1-slayd: Kirish / Title muqova slaydi.
- 2-slayddan ${targetCount - 1}-slaydgacha: Mavzuni soha doirasida chuqur ochib beruvchi kontent slaydlari.
- ${targetCount}-slayd: Yakuniy xulosalar va kelajak istiqbollari slaydi.

Qat'iy JSON formatida javob bering:
{
  "title": "Taqdimotning qisqa va jarangdor bosh sarlavhasi",
  "subtitle": "Qo'shimcha izoh yoki shior",
  "theme": "${theme}",
  "slides": [
    {
      "slideNumber": 1,
      "type": "title",
      "title": "Asosiy sarlavha",
      "subtitle": "Kirish va qisqa izoh",
      "imagePrompts": [
        "English vivid photo prompt for cover hero image matching topic and ${categoryObj.id} (e.g. 4k cinematic photo)",
        "English prompt for cover background texture"
      ],
      "speakerNotes": "Spiker uchun eslatma"
    },
    {
      "slideNumber": 2,
      "type": "content",
      "title": "Slayd sarlavhasi",
      "subtitle": "Bo'limning qisqa mazmuni",
      "imagePrompts": [
        "English prompt for main slide photo matching this topic in ${categoryObj.id} context",
        "English prompt for supporting visual or scene"
      ],
      "points": [
        {
          "heading": "1-asosiy fikr sarlavhasi",
          "description": "Batafsil, aniq va lo'nda tushuntirish (1-2 gap)."
        },
        {
          "heading": "2-asosiy fikr sarlavhasi",
          "description": "Batafsil, aniq va lo'nda tushuntirish."
        },
        {
          "heading": "3-asosiy fikr sarlavhasi",
          "description": "Batafsil, aniq va lo'nda tushuntirish."
        }
      ],
      "highlight": "Ushbu slayddan olinadigan eng muhim xulosa yoki iqtibos",
      "speakerNotes": "Spiker uchun eslatma"
    }
  ]
}

Qoidalar:
1. Har bir slayd mazmuni professional va ${categoryObj.name} doirasidagi real faktlarga boy bo'lsin.
2. Har bir kontent slaydida 2 yoki 3 ta asosiy "points" bo'lsin.
3. Jami "slides" massivida aynan ${targetCount} ta slayd bo'lsin.
4. Har bir slayd uchun "imagePrompts" massivida 2 ta inglizcha aniq fotorealistik rasm tavsifi bo'lsin.
5. Faqat toza JSON formatida javob qaytaring.
`;

  // 7 ta turli xil faol modellar ro'yxati
  const candidateModels = [
    'gemini-3.7-flash',
    'gemini-3.8-flash',
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.6-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-lite-latest'
  ];

  let lastError = null;

  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.7,
          maxOutputTokens: 8192,
        },
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const data = JSON.parse(text);
      if (data && data.slides && data.slides.length > 0) {
        if (organization) data.organization = organization;
        return data;
      }
    } catch (err) {
      console.warn(`[AI Engine] ${modelName} bilan xatolik (${err.status || err.message}). Keyingi modelga o'tilmoqda...`);
      lastError = err;
      await new Promise(r => setTimeout(r, 600));
    }
  }

  // Agar barcha modellar Google tomonida band bo'lsa:
  console.warn(`[AI Engine] Barcha Google modellarida 503 yuklama kuzatildi, zaxira reja ishga tushirilmoqda.`);
  return generateFallbackPresentation({ topic, slideCount: targetCount, theme, categoryObj });
}
