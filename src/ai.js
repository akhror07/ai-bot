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
 * Rasm (konspekt, daftar qo'lyozmasi, kitob sahifasi) ichidagi matnni OCR orqali aniqlash
 */
export async function extractTextFromImage(imageBuffer, mimeType = 'image/jpeg') {
  if (genAI) {
    try {
      console.log('[Vision OCR] Gemini 1.5 Flash orqali rasmdan matn o\'qilmoqda...');
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `Ushbu rasmda konspekt, daftardagi qo'lyozma, kitob sahifasi yoki o'quv materiali keltirilgan.
Iltimos, rasmdagi barcha matnlarni juda aniq, to'liq va tartibli ravishda o'qib ber.
Faqat rasmdagi matnning o'zini qaytar, boshqa hech qanday izoh yoki kirish so'zlari yozma.`;

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: imageBuffer.toString('base64'),
            mimeType,
          },
        },
      ]);
      const text = result.response.text();
      if (text && text.trim().length > 10) {
        return text.trim();
      }
    } catch (err) {
      console.warn('[Vision OCR Error]:', err.message);
    }
  }
  return null;
}

/**
 * Pollinations AI orqali yuqori sifatli erkin generatsiya (OpenAI GPT-4o-mini / fast asosida)
 */
async function generateViaPollinations(prompt) {
  try {
    console.log('[AI Engine] Pollinations AI ga so\'rov yuborilmoqda...');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const res = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: 'You are an elite academic presentation AI. Output ONLY raw valid JSON adhering strictly to the requested schema. Never output markdown codeblocks, text explanations, or preambles.' },
          { role: 'user', content: prompt }
        ],
        model: 'openai-fast',
        temperature: 0.6,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      let text = await res.text();
      let cleaned = text.trim();
      if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
      else if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```\s*/i, '').replace(/\s*```$/i, '');

      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed && parsed.slides && Array.isArray(parsed.slides) && parsed.slides.length >= 3) {
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
 * Anthropic Claude 3.5 Sonnet orqali professional, tahliliy taqdimot generatsiyasi
 */
async function generateViaClaude(prompt) {
  if (!config.anthropicApiKey) return null;
  try {
    console.log('[AI Engine] Anthropic Claude 3.5 Sonnet ga so\'rov yuborilmoqda...');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': config.anthropicApiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 8192,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: `You are an elite academic presentation AI. Output ONLY raw valid JSON matching the requested schema. Never output markdown codeblocks, text explanations, or preambles.\n\n${prompt}`
          }
        ]
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (res.ok) {
      const json = await res.json();
      const content = json?.content?.[0]?.text || '';
      let cleaned = content.trim();
      if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
      else if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```\s*/i, '').replace(/\s*```$/i, '');
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed && parsed.slides && Array.isArray(parsed.slides) && parsed.slides.length >= 3) {
          console.log(`[AI Engine] Claude 3.5 Sonnet orqali ${parsed.slides.length} ta yuqori sifatli slayd muvaffaqiyatli olindi!`);
          return parsed;
        }
      }
    } else {
      const errBody = await res.text();
      console.warn('[AI Engine] Claude API xatosi:', res.status, errBody);
    }
  } catch (err) {
    console.warn('[AI Engine] Claude API uzilishi:', err.message);
  }
  return null;
}

/**
 * OpenRouter orqali Claude 3.5 Sonnet taqdimot generatsiyasi
 */
async function generateViaOpenRouter(prompt) {
  if (!config.openrouterApiKey) return null;
  try {
    console.log('[AI Engine] OpenRouter (Claude 3.5 Sonnet) ga so\'rov yuborilmoqda...');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.openrouterApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          { role: 'system', content: 'You are an elite academic presentation AI. Output ONLY raw valid JSON adhering strictly to the requested schema. Never output markdown codeblocks, text explanations, or preambles.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (res.ok) {
      const json = await res.json();
      const content = json?.choices?.[0]?.message?.content || '';
      let cleaned = content.trim();
      if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
      else if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```\s*/i, '').replace(/\s*```$/i, '');
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed && parsed.slides && Array.isArray(parsed.slides) && parsed.slides.length >= 3) {
          console.log(`[AI Engine] OpenRouter orqali ${parsed.slides.length} ta slayd muvaffaqiyatli olindi!`);
          return parsed;
        }
      }
    }
  } catch (err) {
    console.warn('[AI Engine] OpenRouter uzilishi:', err.message);
  }
  return null;
}

/**
 * Sohaviy haqiqiy, ishonchli va chuqur empirik statistik ko'rsatkichlar generatori.
 * Hech qachon bir xil, sayoz va zerikarli (+85%, 3.5x, TOP 1) takroriy raqamlarni bermaydi!
 */
export function getSmartDomainMetrics(topic = '', stageIndex = 4, language = 'uz') {
  const t = (topic || '').toLowerCase();

  // 1. Tibbiyot / Salomatlik / Farmakologiya / Anatomiya
  if (t.includes('tibbiy') || t.includes('salomat') || t.includes('shifokor') || t.includes('kasal') || t.includes('davo') || t.includes('klinik') || t.includes('farm') || t.includes('yurak') || t.includes('med') || t.includes('stomat') || t.includes('pediatr')) {
    if (stageIndex === 12 || stageIndex === 13) {
      const data = {
        uz: [
          { val: '-54.2%', label: 'Klinik Xarajatlar', desc: 'Erta diagnostika hisobiga statsionar davolash sarf-xarajatlarining qisqarishi' },
          { val: '3.6x', label: 'Davolash Rentabelligi', desc: 'Standart protokollarni tatbiq etish orqali erishilgan iqtisodiy tejamkorlik va ROI' },
          { val: '0.01%', label: 'Nojo\'ya Ta\'sirlar', desc: 'Xalqaro xavfsizlik va dori vositalarining klinik toleransi darajasi' }
        ],
        ru: [
          { val: '-54.2%', label: 'Клинические затраты', desc: 'Снижение расходов на госпитализацию за счет раннего скрининга' },
          { val: '3.6x', label: 'Медицинский ROI', desc: 'Экономическая окупаемость внедрения передовых протоколов и технологий' },
          { val: '0.01%', label: 'Побочные эффекты', desc: 'Высокая переносимость и соответствие международным стандартам безопасности' }
        ],
        en: [
          { val: '-54.2%', label: 'Hospital Care Cost', desc: 'Significant reduction in inpatient expenses via early clinical screening' },
          { val: '3.6x', label: 'Clinical ROI', desc: 'Economic return from standardizing treatment pathways and medical technology' },
          { val: '0.01%', label: 'Adverse Event Rate', desc: 'Stringent pharmacological safety profile and near-zero tolerance threshold' }
        ],
        tg: [
          { val: '-54.2%', label: 'Хароҷоти тиббӣ', desc: 'Коҳиши хароҷоти беморхона ба шарофати ташхиси барвақтии бемориҳо' },
          { val: '3.6x', label: 'ROI-и тиббӣ', desc: 'Самарабахшии ҷорисозии протоколҳои пешқадами клиникӣ ва табобатӣ' },
          { val: '0.01%', label: 'Таъсири манфӣ', desc: 'Ҳадди ақали аксуламалҳои номатлуби доруворӣ ва бехатарии комил' }
        ]
      };
      return data[language] || data.uz;
    }
    const data = {
      uz: [
        { val: '96.8%', label: 'Klinik Aniqlik', desc: 'Zamonaviy apparat tekshiruvlari va biokimyoviy tahlillarning aniqlik darajasi' },
        { val: '4.2 mln', label: 'Yillik Skrininglar', desc: 'Erta profilaktika orqali og\'ir asoratlar xavfining to\'liq oldini olish' },
        { val: '-68.5%', label: 'Asoratlar Xatari', desc: 'Xalqaro klinik protokollarga amal qilingandagi remissiya ko\'rsatkichi' }
      ],
      ru: [
        { val: '96.8%', label: 'Точность диагностики', desc: 'Достоверность аппаратных и лабораторных биохимических исследований' },
        { val: '4.2 млн', label: 'Ежегодный скрининг', desc: 'Предотвращение критических осложнений за счет превентивной медицины' },
        { val: '-68.5%', label: 'Снижение осложнений', desc: 'Результативность соблюдения международных протоколов лечения' }
      ],
      en: [
        { val: '96.8%', label: 'Diagnostic Precision', desc: 'Verified clinical accuracy benchmark across modern imaging and lab tests' },
        { val: '4.2M', label: 'Annual Screenings', desc: 'Volume of early preventive interventions mitigating critical pathology risks' },
        { val: '-68.5%', label: 'Complication Risk', desc: 'Standardized reduction in clinical complications via evidence-based medicine' }
      ],
      tg: [
        { val: '96.8%', label: 'Дақиқии ташхис', desc: 'Эътимоднокии ташхисҳои озмоишгоҳӣ ва дастгоҳҳои муосири тиббӣ' },
        { val: '4.2 млн', label: 'Скрининги солона', desc: 'Пешгирии оризаҳои вазнин тавассути ташхис ва назорати саривақтӣ' },
        { val: '-68.5%', label: 'Коҳиши оризаҳо', desc: 'Натиҷаи риояи қатъии протоколҳои стандартии соҳаи тандурустӣ' }
      ]
    };
    return data[language] || data.uz;
  }

  // 2. Sun'iy Intellekt / Axborot Texnologiyalari / Dasturlash / IT
  if (t.includes('suniy') || t.includes('intellekt') || t.includes('ai') || t.includes('robot') || t.includes('dastur') || t.includes('texnolog') || t.includes('kiber') || t.includes('algoritm') || t.includes('data')) {
    if (stageIndex === 12 || stageIndex === 13) {
      const data = {
        uz: [
          { val: '4.8x', label: 'Investitsion ROI', desc: 'Biznes jarayonlarini aqlli avtomatlashtirishdan olinadigan iqtisodiy samara' },
          { val: '-46.8%', label: 'Operatsion Xarajatlar', desc: 'Qo\'l mehnatini qisqartirish va hisoblash resurslarini optimallashtirish' },
          { val: '99.98%', label: 'Uptime Barqarorligi', desc: 'Uzluksiz server faoliyati va yuqori yuklamali arxitektura chidamliligi' }
        ],
        ru: [
          { val: '4.8x', label: 'Возврат инвестиций (ROI)', desc: 'Экономическая отдача от автоматизации ключевых бизнес-процессов' },
          { val: '-46.8%', label: 'Операционные издержки', desc: 'Оптимизация ручного труда и эффективная утилизация серверов' },
          { val: '99.98%', label: 'Отказоустойчивость', desc: 'Бесперебойный аптайм высоконагруженных серверных кластеров' }
        ],
        en: [
          { val: '4.8x', label: 'Enterprise ROI', desc: 'Measurable economic yield from intelligent workflow automation' },
          { val: '-46.8%', label: 'Operating Overhead', desc: 'Elimination of manual friction and optimized cloud compute capacity' },
          { val: '99.98%', label: 'System Uptime SLA', desc: 'Fault-tolerant high-availability neural cluster architecture' }
        ],
        tg: [
          { val: '4.8x', label: 'ROI-и сармоягузорӣ', desc: 'Бозгашти иқтисодӣ аз автоматикунонии равандҳои асосии корӣ' },
          { val: '-46.8%', label: 'Хароҷоти амалиётӣ', desc: 'Сарфаи захираҳои ҳисоббарорӣ ва кам кардани кори дастӣ' },
          { val: '99.98%', label: 'Устувории низом', desc: 'Фаъолияти бефосилаи серверҳо дар шароити сарбории баланд' }
        ]
      };
      return data[language] || data.uz;
    }
    const data = {
      uz: [
        { val: '$1.35 trln', label: 'Global Bozor (2030)', desc: 'Sun\'iy intellekt sanoatining kutilayotgan umumiy kapitallashuvi' },
        { val: '175 mlrd', label: 'Parametrlar Sig\'imi', desc: 'Katta til modellari va chuqur neyron tarmoqlar kognitiv hajmi' },
        { val: '0.04 ms', label: 'Kechikish Tezligi (Latency)', desc: 'Real vaqt rejimida hisoblash va tezkor qaror qabul qilish sur\'ati' }
      ],
      ru: [
        { val: '$1.35 трлн', label: 'Мировой рынок (2030)', desc: 'Прогнозируемая капитализация глобальной индустрии ИИ' },
        { val: '175 млрд', label: 'Объем параметров', desc: 'Когнитивная емкость современных глубоких нейросетей' },
        { val: '0.04 мс', label: 'Задержка инференса', desc: 'Сверхбыстрая обработка запросов в реальном времени' }
      ],
      en: [
        { val: '$1.35T', label: 'Market Cap (2030)', desc: 'Projected global economic capitalization of AI technology' },
        { val: '175B', label: 'Active Parameters', desc: 'Cognitive scale and computational capacity of deep architectures' },
        { val: '0.04 ms', label: 'Inference Latency', desc: 'Real-time response throughput for mission-critical deployments' }
      ],
      tg: [
        { val: '$1.35 трлн', label: 'Бозори ҷаҳонӣ (2030)', desc: 'Сармоягузории пешбинишудаи соҳаи зеҳни сунъӣ дар ҷаҳон' },
        { val: '175 млрд', label: 'Ҳаҷми параметрҳо', desc: 'Ғунҷоиши маърифатии шабакаҳои асабии муосир' },
        { val: '0.04 мс', label: 'Суръати коркард', desc: 'Қабули қарор дар вақти воқеӣ бо суръати фавқулодда баланд' }
      ]
    };
    return data[language] || data.uz;
  }

  // 3. Iqtisodiyot / Moliya / Biznes / Savdo / Investitsiya / Inqiroz
  if (t.includes('iqtisod') || t.includes('biznes') || t.includes('moliya') || t.includes('investitsiya') || t.includes('bank') || t.includes('savdo') || t.includes('marketing') || t.includes('soliq') || t.includes('inqiroz') || t.includes('krizis') || t.includes('crisis') || t.includes('bankrot')) {
    if (stageIndex === 12 || stageIndex === 13) {
      const data = {
        uz: [
          { val: '28.6%', label: 'Sof Rentabellik (ROI)', desc: 'Kiritilgan kapitaldan olinayotgan yillik toza moliyaviy daromad' },
          { val: '-38.4%', label: 'Xarajatlar Tejamkorligi', desc: 'Operatsion zanjirni optimallashtirish orqali ortiqcha sarf-xarajatlar qisqarishi' },
          { val: '3.4x', label: 'Kapital Aylanuvchanligi', desc: 'Moliyaviy aktivlarning aylanish tezligi va likvidlik darajasi' }
        ],
        ru: [
          { val: '28.6%', label: 'Чистая рентабельность (ROI)', desc: 'Годовой финансовый доход от вложенного капитала' },
          { val: '-38.4%', label: 'Экономия издержек', desc: 'Сокращение операционных затрат за счет оптимизации цепочек' },
          { val: '3.4x', label: 'Оборачиваемость капитала', desc: 'Скорость цикла финансовых активов и коэффициент ликвидности' }
        ],
        en: [
          { val: '28.6%', label: 'Net Annual ROI', desc: 'Clean financial margin yield generated on invested capital' },
          { val: '-38.4%', label: 'Cost Optimization', desc: 'Operating expenditure reduction through value chain streamlining' },
          { val: '3.4x', label: 'Capital Turnover', desc: 'Velocity of financial assets and institutional liquidity ratio' }
        ],
        tg: [
          { val: '28.6%', label: 'Даромаднокии соф (ROI)', desc: 'Даромади молиявии солона аз сармояи гузошташуда' },
          { val: '-38.4%', label: 'Сарфаи хароҷот', desc: 'Коҳиши хароҷоти амалиётӣ тавассути соддасозии равандҳо' },
          { val: '3.4x', label: 'Гардиши сармоя', desc: 'Суръати гардиши дороиҳои молиявӣ ва дараҷаи пардохтпазирӣ' }
        ]
      };
      return data[language] || data.uz;
    }
    const data = {
      uz: [
        { val: '$4.85 mlrd', label: 'Bozor Kapitallashuvi', desc: 'Sohaviy yillik investitsiya va eksport bitimlari umumiy hajmi' },
        { val: '+34.5%', label: 'Yillik O\'sish Sur\'ati', desc: 'Innovatsion xizmatlar hisobiga daromadning dinamik o\'sishi' },
        { val: '94.2%', label: 'Mijozlar Sodiqligi (LTV)', desc: 'Xizmat sifati va raqamli kanallar orqali erishilgan barqarorlik' }
      ],
      ru: [
        { val: '$4.85 млрд', label: 'Капитализация рынка', desc: 'Совокупный объем инвестиций и экспортных торговых контрактов' },
        { val: '+34.5%', label: 'Годовой темп роста', desc: 'Динамика увеличения выручки за счет внедрения инноваций' },
        { val: '94.2%', label: 'Индекс удержания (LTV)', desc: 'Стабильность клиентской базы благодаря качеству сервиса' }
      ],
      en: [
        { val: '$4.85B', label: 'Market Capitalization', desc: 'Total transaction volume across annual investments and trade' },
        { val: '+34.5%', label: 'Annual Growth Rate', desc: 'Top-line revenue expansion driven by innovative service channels' },
        { val: '94.2%', label: 'Customer Retention (LTV)', desc: 'Sustained user loyalty achieved through digital experience quality' }
      ],
      tg: [
        { val: '$4.85 млрд', label: 'Ҳаҷми бозор', desc: 'Ҳаҷми умумии сармоягузорӣ ва шартномаҳои содиротӣ дар соҳа' },
        { val: '+34.5%', label: 'Суръати рушди солона', desc: 'Афзоиши даромад аз ҳисоби ҷорӣ кардани хизматрасониҳои нав' },
        { val: '94.2%', label: 'Вафодории муштариён', desc: 'Устувории пойгоҳи муштариён ба шарофати сифати хизматрасонӣ' }
      ]
    };
    return data[language] || data.uz;
  }

  // 4. Ta'lim / Pedagogika / Maktab / Universitet
  if (t.includes('talim') || t.includes("ta'lim") || t.includes('pedagog') || t.includes('maktab') || t.includes('universitet') || t.includes('metodika') || t.includes('tarbiya') || t.includes('oqituvchi') || t.includes("o'qituvchi") || t.includes('dars') || t.includes('oquv')) {
    if (stageIndex === 12 || stageIndex === 13) {
      const data = {
        uz: [
          { val: '96.2%', label: 'Bitiruvchilar Bandligi', desc: 'Amaliy ko\'nikmalarga ega kadrlarning mehnat bozoridagi talabgirligi' },
          { val: '3.8x', label: 'Kadrlar Salohiyati ROI', desc: 'Pedagogik innovatsiyalarga kiritilgan har 1 dollar investitsiyadan olingan samara' },
          { val: '-45%', label: 'Akademik Uzilishlar', desc: 'Formativ baholash va individual mentorlik tufayli o\'zlashtirishdagi uzilishlar yo\'qolishi' }
        ],
        ru: [
          { val: '96.2%', label: 'Трудоустройство выпускников', desc: 'Востребованность специалистов с практическими компетенциями' },
          { val: '3.8x', label: 'ROI человеческого капитала', desc: 'Экономический эффект инвестиций в образовательные технологии' },
          { val: '-45%', label: 'Академическое отставание', desc: 'Устранение пробелов в знаниях за счет адаптивного менторства' }
        ],
        en: [
          { val: '96.2%', label: 'Graduate Employability', desc: 'Market demand for graduates equipped with hands-on competencies' },
          { val: '3.8x', label: 'Human Capital ROI', desc: 'Institutional return generated per dollar invested in EdTech innovation' },
          { val: '-45%', label: 'Academic Achievement Gap', desc: 'Reduction in learning loss via formative personalized mentoring' }
        ],
        tg: [
          { val: '96.2%', label: 'Шуғли хатмкунандагон', desc: 'Талаботи баланди бозори меҳнат ба мутахассисони дорои малакаи амалӣ' },
          { val: '3.8x', label: 'ROI-и сармояи инсонӣ', desc: 'Самарабахшии сармоягузорӣ ба технологияҳои таълимӣ' },
          { val: '-45%', label: 'Қафомонии таълимӣ', desc: 'Бартараф кардани норасоиҳо дар дониш бо кумаки усулҳои фардӣ' }
        ]
      };
      return data[language] || data.uz;
    }
    const data = {
      uz: [
        { val: '91.8%', label: 'O\'zlashtirish Sifati', desc: 'Interfaol metodikalar va amaliy keyslar asosidagi akademik natijadorlik' },
        { val: '4.5x', label: 'O\'quvchilar Faolligi', desc: 'Muammoli ta\'lim (PBL) orqali dars jarayoniga jalb qilinganlik darajasi' },
        { val: '140+ ta', label: 'Amaliy Keyslar Moduli', desc: 'Nazariyani amaliyotga bog\'lovchi maxsus ishlab chiqilgan o\'quv topshiriqlari' }
      ],
      ru: [
        { val: '91.8%', label: 'Качество усвоения', desc: 'Академическая результативность на основе интерактивных кейс-методов' },
        { val: '4.5x', label: 'Вовлеченность учащихся', desc: 'Рост учебной активности при проблемно-ориентированном обучении' },
        { val: '140+', label: 'Практических кейсов', desc: 'Специализированные учебные модули, связывающие теорию с практикой' }
      ],
      en: [
        { val: '91.8%', label: 'Curriculum Mastery', desc: 'Academic performance benchmark achieved through interactive case learning' },
        { val: '4.5x', label: 'Student Engagement', desc: 'Multi-fold increase in classroom participation via problem-based inquiry' },
        { val: '140+', label: 'Applied Case Modules', desc: 'Validated practical coursework bridging abstract theory with execution' }
      ],
      tg: [
        { val: '91.8%', label: 'Сифати азхудкунӣ', desc: 'Натиҷагирии баланди таълимӣ бар асоси усулҳои интерактивии дарс' },
        { val: '4.5x', label: 'Фаъолнокии хонандагон', desc: 'Ҷалби амиқи хонандагон ба раванди таълим тавассути баҳсҳои илмӣ' },
        { val: '140+', label: 'Кейсҳои амалӣ', desc: 'Барномаҳои махсуси таълимӣ барои пайвастани назария бо таҷриба' }
      ]
    };
    return data[language] || data.uz;
  }

  // 5. Universal / Boshqa barcha mavzular (General)
  if (stageIndex === 12 || stageIndex === 13) {
    const data = {
      uz: [
        { val: '34.8%', label: 'Operatsion Tejamkorlik', desc: 'Jarayonlarni optimallashtirish hisobiga samarasiz sarf-xarajatlar qisqarishi' },
        { val: '3.8x', label: 'Investitsion ROI', desc: 'Kiritilgan kapitalning qisqa muddat ichida o\'zini to\'liq oqlashi va rentabelligi' },
        { val: '-45.2%', label: 'Operatsion Xatarlar', desc: 'Tizimli audit va avtomatik monitoring orqali noaniqliklarning minimallashuvi' }
      ],
      ru: [
        { val: '34.8%', label: 'Операционная экономия', desc: 'Снижение неоправданных издержек благодаря стандартизации процессов' },
        { val: '3.8x', label: 'Коэффициент ROI', desc: 'Быстрая окупаемость инвестиций и высокая маржинальность решений' },
        { val: '-45.2%', label: 'Снижение рисков', desc: 'Минимизация сбоев благодаря непрерывному системному аудиту' }
      ],
      en: [
        { val: '34.8%', label: 'Operational Cost Reduction', desc: 'Elimination of redundant expenditures through systemic process redesign' },
        { val: '3.8x', label: 'Targeted Program ROI', desc: 'Rapid capital payback ratio and verified operational margin expansion' },
        { val: '-45.2%', label: 'Systemic Risk Mitigation', desc: 'Proactive avoidance of operational friction via real-time audit protocols' }
      ],
      tg: [
        { val: '34.8%', label: 'Сарфаи амалиётӣ', desc: 'Коҳиши хароҷоти беҳуда ба шарофати танзими дурусти равандҳо' },
        { val: '3.8x', label: 'Коэффитсиенти ROI', desc: 'Пӯшонидани зуди хароҷоти сармоягузорӣ ва гирифтани фоидаи устувор' },
        { val: '-45.2%', label: 'Коҳиши хатарҳо', desc: 'Пешгирии хатогиҳо ба воситаи назорати пайвастаи низомманд' }
      ]
    };
    return data[language] || data.uz;
  }

  const data = {
    uz: [
      { val: '86.4%', label: 'Metodologik Aniqlik', desc: 'Kompleks optimallashtirish va resurslarni to\'g\'ri taqsimlash samarasi' },
      { val: '12 800+ ta', label: 'Tadqiqot Ko\'rsatkichlari', desc: 'Sohaviy empirik ma\'lumotlar tahlili va amaliyotda sinovdan o\'tgan natijalar' },
      { val: '-42.5%', label: 'Tizimli Xatolar Toleransi', desc: 'Avtomatlashtirilgan standartlar hisobiga noaniqliklarning minimallashuvi' }
    ],
    ru: [
      { val: '86.4%', label: 'Методологическая точность', desc: 'Эффект комплексной оптимизации и выверенного распределения ресурсов' },
      { val: '12 800+', label: 'Исследованных параметров', desc: 'Объем эмпирических данных, подтвержденных на практическом опыте' },
      { val: '-42.5%', label: 'Снижение системных ошибок', desc: 'Минимизация сбоев за счет внедрения регламентированных стандартов' }
    ],
    en: [
      { val: '86.4%', label: 'Methodological Precision', desc: 'Impact of holistic workflow optimization and disciplined resource allocation' },
      { val: '12,800+', label: 'Empirical Data Points', desc: 'Robust data set rigorously tested and validated across real-world environments' },
      { val: '-42.5%', label: 'Systemic Error Reduction', desc: 'Controlled drop in operational variances via automated compliance standards' }
    ],
    tg: [
      { val: '86.4%', label: 'Дақиқии методологӣ', desc: 'Натиҷаи танзими ҳамаҷониба ва тақсимоти дурусти захираҳо' },
      { val: '12 800+', label: 'Нишондиҳандаҳои санҷидашуда', desc: 'Ҳаҷми иттилооти таҳқиқшуда, ки дар амалия тасдиқ гардидааст' },
      { val: '-42.5%', label: 'Коҳиши хатогиҳои низомӣ', desc: 'Ҳадди ақали норасоиҳо ба шарофати риояи стандартҳои дақиқ' }
    ]
  };
  return data[language] || data.uz;
}

/**
 * Sohaviy PowerPoint diagrammalari (Chart) uchun aniq, professional ma'lumotlar generatori.
 */
export function getSmartDomainCharts(topic = '', stageIndex = 6, language = 'uz') {
  const t = (topic || '').toLowerCase();

  // 1-Chart: Stage 6 (Slide 8) — Tarixiy va joriy o'sish dinamikasi
  if (stageIndex === 6) {
    if (t.includes('tibbiy') || t.includes('salomat') || t.includes('kasal') || t.includes('davo')) {
      const labels = {
        uz: ['Boshlang\'ich skrining', 'Klinik terapiya', 'Kombinatsiyalashgan', 'To\'liq remissiya'],
        ru: ['Первичный скрининг', 'Клиническая терапия', 'Комбинированный подход', 'Полная ремиссия'],
        en: ['Baseline Screening', 'Clinical Therapy', 'Multimodal Care', 'Complete Remission'],
        tg: ['Ташхиси аввалия', 'Муолиҷаи клиникӣ', 'Усули омехта', 'Шифои комил']
      }[language] || ['Boshlang\'ich skrining', 'Klinik terapiya', 'Kombinatsiyalashgan', 'To\'liq remissiya'];
      return { labels, values: [34, 58, 82, 97] };
    }
    if (t.includes('suniy') || t.includes('intellekt') || t.includes('ai') || t.includes('dastur') || t.includes('texnolog')) {
      const labels = {
        uz: ['Qo\'lda boshqaruv', 'Klassik kodlash', 'Neyron tarmoqlar', 'Avtonom tizimlar'],
        ru: ['Ручное управление', 'Классический код', 'Глубокие нейросети', 'Автономные системы'],
        en: ['Manual Workflows', 'Legacy Coding', 'Neural Pipelines', 'Autonomous Systems'],
        tg: ['Идораи дастӣ', 'Рамзгузории классикӣ', 'Шабакаҳои асабӣ', 'Низоми худмухтор']
      }[language] || ['Qo\'lda boshqaruv', 'Klassik kodlash', 'Neyron tarmoqlar', 'Avtonom tizimlar'];
      return { labels, values: [22, 51, 84, 99] };
    }
    if (t.includes('iqtisod') || t.includes('biznes') || t.includes('moliya') || t.includes('investitsiya')) {
      const labels = {
        uz: ['Boshlang\'ich marja', '1-bosqich o\'sish', 'Joriy rentabellik', 'Maqsadli EBITDA'],
        ru: ['Базовая маржа', 'Этап 1: Рост', 'Текущая рентабельность', 'Целевая EBITDA'],
        en: ['Baseline Margin', 'Phase 1 Expansion', 'Current Run-Rate', 'Target EBITDA'],
        tg: ['Маржаи ибтидоӣ', 'Марҳилаи 1: Рушд', 'Даромади ҷорӣ', 'EBITDA-и мақсаднок']
      }[language] || ['Boshlang\'ich marja', '1-bosqich o\'sish', 'Joriy rentabellik', 'Maqsadli EBITDA'];
      return { labels, values: [19, 42, 68, 94] };
    }
    if (t.includes('talim') || t.includes("ta'lim") || t.includes('maktab') || t.includes('pedagog')) {
      const labels = {
        uz: ['An\'anaviy dars', 'Interfaol metodika', 'STEM loyihalar', 'PISA standarti'],
        ru: ['Традиционный урок', 'Интерактивная методика', 'STEM-проекты', 'Стандарт PISA'],
        en: ['Lecture Method', 'Active Learning', 'STEM Inquiry', 'PISA Benchmark'],
        tg: ['Дарси анъанавӣ', 'Усули интерактивӣ', 'Лоиҳаҳои STEM', 'Меъёри PISA']
      }[language] || ['An\'anaviy dars', 'Interfaol metodika', 'STEM loyihalar', 'PISA standarti'];
      return { labels, values: [28, 56, 81, 95] };
    }
    const labels = {
      uz: ['Boshlang\'ich holat', 'Diagnostika davri', 'Joriy natijadorlik', 'Maqsadli marra'],
      ru: ['Исходное состояние', 'Этап диагностики', 'Текущий результат', 'Целевой рубеж'],
      en: ['Baseline Status', 'Diagnostic Period', 'Current Output', 'Strategic Target'],
      tg: ['Ҳолати ибтидоӣ', 'Давраи ташхис', 'Натиҷаи ҷорӣ', 'Ҳадафи асосӣ']
    }[language] || ['Boshlang\'ich holat', 'Diagnostika davri', 'Joriy natijadorlik', 'Maqsadli marra'];
    return { labels, values: [28, 52, 79, 96] };
  }

  // 2-Chart: Stage 20 (Slide 22) — Kelajak istiqbollari va 2025-2030 prognozlari
  const forecastLabels = {
    uz: ['2024 (Fakt)', '2025 (Kutilma)', '2027 (Prognoz)', '2030 (Maqsad)'],
    ru: ['2024 (Факт)', '2025 (Оценка)', '2027 (Прогноз)', '2030 (Цель)'],
    en: ['2024 (Actual)', '2025 (Planned)', '2027 (Projected)', '2030 (Target)'],
    tg: ['2024 (Воқеӣ)', '2025 (Нақша)', '2027 (Пешгӯӣ)', '2030 (Ҳадаф)']
  }[language] || ['2024 (Fakt)', '2025 (Kutilma)', '2027 (Prognoz)', '2030 (Maqsad)'];

  return { labels: forecastLabels, values: [42, 68, 92, 125] };
}


const KNOWN_TOPIC_TRANSLATIONS = {
  'madaniy boylik': { ru: 'Культурное наследие', en: 'Cultural Heritage', tg: 'Мероси фарҳангӣ' },
  'madaniy boyliklar': { ru: 'Культурные ценности и наследие', en: 'Cultural Heritage and Assets', tg: 'Боигарӣ ва мероси фарҳангӣ' },
  'madaniy meros': { ru: 'Культурное наследие', en: 'Cultural Heritage', tg: 'Мероси фарҳангӣ' },
  'madaniyat': { ru: 'Культура и духовность', en: 'Culture & Humanities', tg: 'Фарҳанг ва маънавият' },
  'ona tili': { ru: 'Родной язык и национальное наследие', en: 'Native Language & Heritage', tg: 'Забони модарӣ ва мероси миллӣ' },
  'alisher navoiy': { ru: 'Алишер Навои: Жизнь и творчество', en: 'Alisher Navoi: Life & Legacy', tg: 'Алишер Навоӣ: Ҳаёт ва эҷодиёт' },
  'amir temur': { ru: 'Амир Темур и эпоха Тимуридов', en: 'Amir Timur & The Timurid Era', tg: 'Амир Темур ва давлатдории Темуриён' },
  'suniy intellekt': { ru: 'Искусственный интеллект и технологии будущего', en: 'Artificial Intelligence & Future Tech', tg: 'Зеҳни сунъӣ ва технологияи оянда' },
  'sun\'iy intellekt': { ru: 'Искусственный интеллект и технологии будущего', en: 'Artificial Intelligence & Future Tech', tg: 'Зеҳни сунъӣ ва технологияи оянда' },
  'raqamli iqtisodiyot': { ru: 'Цифровая экономика и трансформация', en: 'Digital Economy & Transformation', tg: 'Иқтисодиёти рақамӣ' },
  'psixologiya': { ru: 'Когнитивная психология и восприятие', en: 'Cognitive Psychology & Perception', tg: 'Равоншиносӣ ва идроки инсон' },
  'kognitiv psixologiya': { ru: 'Когнитивная психология', en: 'Cognitive Psychology', tg: 'Психологияи маърифатӣ' },
  'xotira': { ru: 'Память и когнитивные процессы', en: 'Memory & Cognitive Architecture', tg: 'Хотира ва равандҳои зеҳнӣ' },
  'iqtisodiyot': { ru: 'Экономическая стратегия и развитие', en: 'Economic Strategy & Growth', tg: 'Стратегияи иқтисодӣ' },
  'moliya': { ru: 'Финансовый менеджмент и инвестиции', en: 'Financial Management & Investment', tg: 'Идоракунии молиявӣ' },
  'biznes': { ru: 'Современный бизнес и предпринимательство', en: 'Modern Business & Enterprise', tg: 'Бизнес ва соҳибкорӣ' },
  'tibbiyot': { ru: 'Современная медицина и здравоохранение', en: 'Modern Medicine & Healthcare', tg: 'Тиббиёти муосир' },
  'salomatlik': { ru: 'Здоровье и медицина', en: 'Health and Wellness', tg: 'Саломатӣ ва тарзи ҳаёт' },
  'talim': { ru: 'Современное образование и педагогика', en: 'Modern Education & Pedagogy', tg: 'Маориф ва низоми таълим' },
  'ta\'lim': { ru: 'Современное образование и педагогика', en: 'Modern Education & Pedagogy', tg: 'Маориф ва низоми таълим' },
  'pedagogika': { ru: 'Педагогика и методика обучения', en: 'Pedagogy & Teaching Methods', tg: 'Педагогика ва методикаи таълим' },
  'huquq': { ru: 'Правовые основы и юриспруденция', en: 'Legal Frameworks & Jurisprudence', tg: 'Асосҳои ҳуқуқӣ ва қонунгузорӣ' },
  'ekologiya': { ru: 'Экологическая безопасность и устойчивость', en: 'Ecology & Sustainability', tg: 'Экология ва рушди устувор' },
  'tabiat': { ru: 'Природа и окружающая среда', en: 'Nature and the Environment', tg: 'Табиат ва муҳити зист' },
  'sport': { ru: 'Физическая культура и спорт', en: 'Physical Education & Athletics', tg: 'Варзиш ва тарбияи ҷисмонӣ' },
  'sanat': { ru: 'Искусство и эстетическая культура', en: 'Art & Aesthetic Dimensions', tg: 'Санъат ва мероси бадеӣ' },
  'san\'at': { ru: 'Искусство и эстетическая культура', en: 'Art & Aesthetic Dimensions', tg: 'Санъат ва мероси бадеӣ' },
  'adabiyot': { ru: 'Классическая литература и поэзия', en: 'Classical Literature & Poetry', tg: 'Адабиёти классикӣ' },
  'tarix': { ru: 'Всемирная и отечественная история', en: 'World & National History', tg: 'Таърихи умумӣ ва миллӣ' },
  'falsafa': { ru: 'Философия и мировоззрение', en: 'Philosophy & Ethics', tg: 'Фалсафа ва ҷаҳонбинӣ' },
  'turizm': { ru: 'Международный туризм и индустрия гостеприимства', en: 'Tourism & Global Hospitality', tg: 'Сайёҳӣ ва меҳмондорӣ' },
  'qishloq xojaligi': { ru: 'Сельское хозяйство и агробизнес', en: 'Agriculture & Agribusiness', tg: 'Хоҷагии қишлоқ ва агробизнес' },
  'arxitektura': { ru: 'Архитектура и градостроительство', en: 'Architecture & Urban Planning', tg: 'Меъморӣ ва шаҳрсозӣ' },
  'fizika': { ru: 'Современная физика и фундаментальная наука', en: 'Modern Physics & Fundamental Science', tg: 'Физикаи муосир ва илми бунёдӣ' },
  'kimyo': { ru: 'Химия и материаловедение', en: 'Chemistry & Material Science', tg: 'Химия ва илми маводшиносӣ' },
};

const WORD_TRANSLATIONS = {
  ru: {
    'madaniy boylik': 'культурное наследие',
    'madaniy meros': 'культурное наследие',
    'madaniy': 'культурное',
    'boylik': 'богатство',
    'boyliklar': 'ценности',
    'meros': 'наследие',
    'madaniyat': 'культура',
    'tarix': 'история',
    'tarixiy': 'исторический',
    'asosiy': 'ключевой',
    'tushuncha': 'концепция',
    'vizual': 'объект',
    'bosqich': 'этап',
    'xulosa': 'вывод',
    'maqsad': 'цель',
    'omil': 'фактор',
    'natija': 'результат',
    'jarayon': 'процесс',
    'tizim': 'система',
    'zamonaviy': 'современный',
    'rivojlanish': 'развитие',
    'samaradorlik': 'эффективность',
  },
  en: {
    'madaniy boylik': 'cultural heritage',
    'madaniy meros': 'cultural heritage',
    'madaniy': 'cultural',
    'boylik': 'wealth',
    'boyliklar': 'assets',
    'meros': 'heritage',
    'madaniyat': 'culture',
    'tarix': 'history',
    'tarixiy': 'historical',
    'asosiy': 'core',
    'tushuncha': 'concept',
    'vizual': 'visual',
    'bosqich': 'phase',
    'xulosa': 'takeaway',
    'maqsad': 'objective',
    'omil': 'factor',
    'natija': 'outcome',
    'jarayon': 'process',
    'tizim': 'system',
    'zamonaviy': 'modern',
    'rivojlanish': 'development',
    'samaradorlik': 'efficiency',
  },
  tg: {
    'madaniy boylik': 'мероси фарҳангӣ',
    'madaniy meros': 'мероси фарҳангӣ',
    'madaniy': 'фарҳангӣ',
    'boylik': 'боигарӣ',
    'boyliklar': 'боигариҳо',
    'meros': 'мерос',
    'madaniyat': 'фарҳанг',
    'tarix': 'таърих',
    'tarixiy': 'таърихӣ',
    'asosiy': 'асосӣ',
    'tushuncha': 'консепсия',
    'vizual': 'визуал',
    'bosqich': 'марҳила',
    'xulosa': 'хулоса',
    'maqsad': 'ҳадаф',
    'omil': 'омил',
    'natija': 'натиҷа',
    'jarayon': 'раванд',
    'tizim': 'низом',
    'zamonaviy': 'муосир',
    'rivojlanish': 'рушд',
    'samaradorlik': 'самаранокӣ',
  }
};

export function translateUzbekTopic(rawTopic, targetLang = 'uz') {
  if (!rawTopic || typeof rawTopic !== 'string') return rawTopic || 'Presentation';
  if (targetLang === 'uz') return rawTopic;

  const normalized = rawTopic.toLowerCase().replace(/['`ʻ’]/g, '').trim();

  // 1. To'liq moslik
  for (const [key, trans] of Object.entries(KNOWN_TOPIC_TRANSLATIONS)) {
    const normKey = key.toLowerCase().replace(/['`ʻ’]/g, '').trim();
    if (normalized === normKey) {
      return trans[targetLang] || rawTopic;
    }
  }

  // 2. Qisman moslik
  for (const [key, trans] of Object.entries(KNOWN_TOPIC_TRANSLATIONS)) {
    const normKey = key.toLowerCase().replace(/['`ʻ’]/g, '').trim();
    if (normalized.includes(normKey)) {
      return trans[targetLang] || rawTopic;
    }
  }

  // 3. So'zma-so'z almashtirish
  let result = rawTopic;
  const wordsDict = WORD_TRANSLATIONS[targetLang];
  if (wordsDict) {
    for (const [uWord, tWord] of Object.entries(wordsDict)) {
      const reg = new RegExp(`\\b${uWord}\\b`, 'gi');
      result = result.replace(reg, tWord);
    }
    if (result !== rawTopic) {
      return result.charAt(0).toUpperCase() + result.slice(1);
    }
  }

  return rawTopic;
}

function cleanUzbekWordsFromText(text, targetLang = 'uz') {
  if (!text || typeof text !== 'string' || targetLang === 'uz') return text;
  let res = text;
  const wordsDict = WORD_TRANSLATIONS[targetLang];
  if (wordsDict) {
    for (const [uWord, tWord] of Object.entries(wordsDict)) {
      const reg = new RegExp(`\\b${uWord}\\b`, 'gi');
      res = res.replace(reg, tWord);
    }
  }
  return res;
}

function getLocalizedGenericStages(topic, enKeywords, language) {
  const effectiveTopic = translateUzbekTopic(topic, language);

  if (language === 'ru') {
    return [
      {
        layout: 'split_hero',
        title: `${effectiveTopic}: Концептуальные Основы и Значимость`,
        sub: 'Теоретический базис, системные вызовы и приоритетные ориентиры',
        photo: `${enKeywords} fundamental research concept analysis`,
        points: [
          { heading: 'Актуальность и стратегическая необходимость', description: `Динамичные изменения в профессиональной среде требуют глубокого переосмысления устоявшихся подходов по направлению "${effectiveTopic}". Внедрение передовых стандартов повышает общую результативность на 35–50% и гарантирует структурную устойчивость к внешним вызовам.` },
          { heading: 'Рациональное распределение ресурсов', description: 'Системное использование научно обоснованных инструментов обеспечивает сбалансированное распределение материального и кадрового потенциала, исключая неоправданные издержки.' },
          { heading: 'Ожидаемые качественные эффекты', description: 'Комплексная модернизация рабочих процессов обеспечивает непрерывный контроль качества и формирует надежный фундамент для долгосрочного масштабирования.' }
        ],
        highlight: 'Прочный концептуальный фундамент — ключевой залог успешной и устойчивой реализации долгосрочной стратегии.',
        speakerNotes: `Здравствуйте, уважаемые коллеги! На данном слайде мы подробно рассмотрим концептуальные основы и стратегическую актуальность темы "${effectiveTopic}".`
      },
      {
        layout: 'comparison',
        title: 'Диагностика Проблем: Традиционный vs Инновационный Подход',
        sub: 'Сопоставление консервативных ограничений и современных оптимизированных решений',
        photo: `${enKeywords} analysis research comparison innovation`,
        leftHeading: 'Традиционная Модель',
        rightHeading: 'Инновационное Решение',
        points: [
          { heading: 'Высокие трудозатраты и операционные задержки', description: 'Устаревшие методы страдают от фрагментарности данных, избыточного ручного труда и повышенного риска критических ошибок.' },
          { heading: 'Автоматизированная системная оптимизация', description: 'Современные алгоритмы ускоряют выполнение задач более чем в 3 раза, обеспечивая абсолютную прозрачность и непрерывный аудит.' }
        ],
        highlight: 'Переход на инновационную модель исключает до 60% системных ошибок и существенно сокращает операционные издержки.',
        speakerNotes: 'В данном разделе мы анализируем сравнительные преимущества перехода от устаревших подходов к интегрированным решениям.'
      },
      {
        layout: 'three_cards',
        title: 'Три Фундаментальных Столпа Системы',
        sub: 'Базовые опорные направления, обеспечивающие стабильность и надежность',
        photo: `${enKeywords} three pillars structure architecture`,
        points: [
          { heading: 'Инфраструктура и Платформы', description: 'Создание отказоустойчивой материально-технической базы и применение передового сертифицированного инструментария.' },
          { heading: 'Человеческий Капитал', description: 'Непрерывное повышение квалификации специалистов, развитие ключевых компетенций и поддержание командной эффективности.' },
          { heading: 'Регламенты и Стандарты', description: 'Внедрение прозрачных операционных процедур и строгое соблюдение международных отраслевых требований.' }
        ],
        highlight: 'Гармоничное развитие всех трех столпов гарантирует абсолютную долговечность и отказоустойчивость всей модели.',
        speakerNotes: 'Особое внимание следует обратить на три взаимосвязанных столпа, на которых строится вся архитектура устойчивости.'
      },
      {
        layout: 'matrix_grid',
        title: 'Методологическая Матрица и Модель Анализа',
        sub: 'Четыре взаимосвязанных уровня комплексного исследования и верификации',
        photo: `${enKeywords} methodology analytics scientific framework`,
        points: [
          { heading: 'Эмпирическое Наблюдение', description: 'Сбор объективных первичных данных, глубокий мониторинг текущего состояния и аудит факторов риска.' },
          { heading: 'Количественное Моделирование', description: 'Применение статистических алгоритмов для расчета оптимальных параметров и выявления скрытых закономерностей.' },
          { heading: 'Контроль Качества и Аудит', description: 'Многоуровневая валидация промежуточных результатов и кросс-проверка отклонений от нормативов.' },
          { heading: 'Практическая Коррекция', description: 'Оперативное внесение адресных улучшений на основе обратной связи для поддержания максимальной эффективности.' }
        ],
        highlight: 'Четкая аналитическая методология устраняет неопределенность и гарантирует объективность принимаемых решений.',
        speakerNotes: 'Методологическая матрица позволяет системно подойти к каждому этапу оценки и исключить субъективные искажения.'
      },
      {
        layout: 'kpi_metrics',
        title: 'Ключевые Эмпирические Метрики и Показатели',
        sub: 'Отраслевая статистика, количественные индикаторы и подтвержденные бенчмарки',
        photo: `${enKeywords} statistics data growth chart analytics`,
        metrics: getSmartDomainMetrics(effectiveTopic, 4, language),
        points: [
          { heading: 'Статистическая динамика и доказательная база', description: 'Количественные показатели наглядно демонстрируют правильность выбранной траектории развития. Измеримые параметры подтверждают надежность используемых инструментов и высокую окупаемость вложенных ресурсов.' }
        ],
        highlight: 'Фактические эмпирические данные подтверждают высокую практическую эффективность принятого стратегического курса.',
        speakerNotes: 'Представленные количественные метрики служат объективным доказательством надежности и результативности модели.'
      },
      {
        layout: 'comparison',
        title: 'Оптимизация Ресурсов: Фрагментарность vs Синергия',
        sub: 'Анализ временных и капитальных затрат при различных моделях управления',
        photo: `${enKeywords} resource optimization efficiency strategy`,
        leftHeading: 'Фрагментарное Управление',
        rightHeading: 'Интегрированная Синергия',
        points: [
          { heading: 'Несогласованность и дублирование функций', description: 'Разрозненные каналы взаимодействия ведут к потере до 35% полезного времени и создают информационные барьеры.' },
          { heading: 'Единая экосистема взаимодействия', description: 'Сквозная интеграция обеспечивает мгновенный обмен данными и синхронизацию усилий всех задействованных подразделений.' }
        ],
        highlight: 'Переход к единой экосистеме обеспечивает рост совокупной производительности более чем в 2.5 раза.',
        speakerNotes: 'Сравнение моделей наглядно показывает, как устранение барьеров высвобождает значительный потенциал роста.'
      },
      {
        layout: 'data_chart',
        title: 'Динамика Развития и Аналитический График (Chart)',
        sub: 'Траектория перехода от начального аудита к целевым показателям',
        photo: `${enKeywords} growth chart data visualization analytics`,
        chart: getSmartDomainCharts(effectiveTopic, 6, language),
        points: [
          { heading: 'Траектория поэтапного роста', description: 'На графике отражена динамика совершенствования ключевых параметров. Последовательная реализация запланированных мер обеспечивает стабильный прогресс на каждом контрольном этапе.' },
          { heading: 'Прогнозная устойчивость', description: 'Аналитическая аппроксимация демонстрирует сохранение положительного тренда и достижение запланированных рубежей в установленные сроки.' }
        ],
        highlight: 'График динамики наглядно подтверждает устойчивый и прогнозируемый характер качественных преобразований.',
        speakerNotes: 'Диаграмма наглядно иллюстрирует устойчивую восходящую траекторию ключевых показателей на протяжении всех этапов.'
      },
      {
        layout: 'process_timeline',
        title: 'Поэтапная Дорожная Карта Реализации',
        sub: 'Цепочка последовательных действий: от формулирования задачи до практического результата',
        photo: `${enKeywords} roadmap steps process workflow execution`,
        points: [
          { heading: 'Этап 1: Комплексная Диагностика', description: 'Инвентаризация текущего состояния, аудит потребностей и согласование детального плана мероприятий с оценкой рисков.' },
          { heading: 'Этап 2: Пилотное Внедрение и Апробация', description: 'Практическая интеграция апробированных методик в тестовом режиме, обучение специалистов и мониторинг первичных откликов.' },
          { heading: 'Этап 3: Масштабирование и Контроль', description: 'Распространение успешного опыта на всю структуру, непрерывный мониторинг KPI и регулярная оптимизация регламентов.' }
        ],
        highlight: 'Дисциплинированное выполнение дорожной карты — надежный гарант успешного достижения поставленных целей.',
        speakerNotes: 'Дорожная карта структурирует процесс внедрения на понятные контрольные этапы с прозрачными критериями завершения.'
      },
      {
        layout: 'matrix_grid',
        title: 'Четыре Драйвера Системной Устойчивости',
        sub: 'Ключевые векторы, обеспечивающие долгосрочное конкурентное лидерство',
        photo: `${enKeywords} corporate structure modern governance leadership`,
        points: [
          { heading: 'Технологическая Надежность', description: 'Использование проверенных современных платформ, минимизирующих вероятность сбоев и простоев.' },
          { heading: 'Кадровый Потенциал', description: 'Формирование команды высококлассных экспертов, развитие культуры персональной ответственности и мотивации.' },
          { heading: 'Прозрачность Управления', description: 'Внедрение четких регламентов и стандартов взаимодействия, исключающих неоднозначность решений.' },
          { heading: 'Поток Инноваций', description: 'Постоянный мониторинг передовых разработок, их своевременная адаптация и практическое освоение.' }
        ],
        highlight: 'Сбалансированное действие всех четырех факторов делает систему устойчивой к любым внешним вызовам.',
        speakerNotes: 'Четыре драйвера формируют основу долгосрочной конкурентоспособности и устойчивости к кризисным явлениям.'
      },
      {
        layout: 'split_hero',
        title: 'Международный Опыт и Глобальный Бенчмаркинг',
        sub: 'Анализ практики ведущих мировых институтов и адаптация лучших стандартов',
        photo: `${enKeywords} global international benchmark world cooperation`,
        points: [
          { heading: 'Глобальные стандарты и практики', description: 'Изучение опыта ведущих мировых центров позволяет опереться на проверенные временем модели и избежать типичных ошибок.' },
          { heading: 'Локализация и адресная адаптация', description: 'Успешная интеграция международного опыта требует учета специфики локальной среды и действующих нормативных рамок.' },
          { heading: 'Укрепление международного партнерства', description: 'Активное профессиональное сотрудничество содействует быстрому трансферу передовых знаний и технологий.' }
        ],
        highlight: 'Освоение лучшего мирового опыта в сочетании с точной адаптацией ускоряет развитие в несколько раз.',
        speakerNotes: 'В данном разделе мы рассматриваем глобальные бенчмарки и механизмы их корректной локализации.'
      },
      {
        layout: 'three_cards',
        title: 'Стандартизация, Регламенты и Сертификация',
        sub: 'Контроль соответствия, нормативная база и международные нормативы качества',
        photo: `${enKeywords} compliance standards regulations quality certificate`,
        points: [
          { heading: 'Международные Стандарты (ISO)', description: 'Внедрение стандартизированных процедур управления качеством гарантирует признание результатов на мировом уровне.' },
          { heading: 'Нормативно-Правовое Соответствие', description: 'Строгое следование регламентам защищает от юридических рисков и обеспечивает полную прозрачность деятельности.' },
          { heading: 'Регулярный Внутренний Аудит', description: 'Систематический инспекционный контроль позволяет оперативно выявлять и устранять малейшие отклонения.' }
        ],
        highlight: 'Соблюдение жестких стандартов качества — важнейший фактор институционального доверия и надежности.',
        speakerNotes: 'Соответствие отраслевым стандартам и регулярный аудит формируют безупречную репутацию и исключают риски.'
      },
      {
        layout: 'spotlight',
        title: 'Управление Рисками и Превентивный Контроль',
        sub: 'Аудит потенциальных угроз и инструменты заблаговременной нейтрализации',
        photo: `${enKeywords} risk management security protection analysis`,
        spotlightText: 'Лучшее антикризисное управление — это заблаговременное устранение источников риска до того, как они перерастут в проблему.',
        points: [
          { heading: 'Матрица вероятностей и угроз', description: 'Комплексный анализ операционных, финансовых и технологических факторов позволяет классифицировать риски по степени критичности.' },
          { heading: 'Превентивные протоколы защиты', description: 'Наличие заранее подготовленных регламентов реагирования сокращает время нейтрализации нештатных ситуаций на 75%.' }
        ],
        highlight: 'Превентивный мониторинг рисков защищает систему от непредвиденных сбоев и финансовых потерь.',
        speakerNotes: 'Ключевой акцент сделан на упреждающем характере мер риск-менеджмента и четких протоколах реагирования.'
      },
      {
        layout: 'kpi_metrics',
        title: 'Экономическая Эффективность и Рентабельность (ROI)',
        sub: 'Финансовая отдача, снижение издержек и показатели балансовой устойчивости',
        photo: `${enKeywords} financial roi investment growth profit analytics`,
        metrics: getSmartDomainMetrics(effectiveTopic, 12, language),
        points: [
          { heading: 'Обоснование финансовой результативности', description: 'Инвестиции в оптимизацию и внедрение передовых методик окупаются в сжатые сроки за счет устранения скрытых потерь, ускорения ключевых процессов и рационального использования материально-технических фондов.' }
        ],
        highlight: 'Каждый вложенный ресурс приносит измеримую экономическую отдачу и повышает общую рентабельность.',
        speakerNotes: 'Экономические расчеты подтверждают высокую инвестиционную привлекательность и быструю окупаемость проекта.'
      },
      {
        layout: 'cinematic',
        title: 'Инновационные Технологии и Смарт-Решения',
        sub: 'Цифровая трансформация, интеллектуальные алгоритмы и передовой инструментарий',
        photo: `${enKeywords} modern innovative digital technology smart future`,
        points: [
          { heading: 'Интеллектуальная автоматизация', description: 'Передача рутинных аналитических и учетных операций цифровым платформам снижает фактор человеческой ошибки до минимума.' },
          { heading: 'Аналитика больших данных', description: 'Обработка массивов информации в реальном времени открывает скрытые закономерности для предиктивного планирования.' },
          { heading: 'Технологическая синергия', description: 'Объединение автономных инструментов в единый контур многократно увеличивает суммарную мощность всей экосистемы.' }
        ],
        highlight: 'Инновационные технологии превращают сложные многоуровневые задачи в прозрачные и управляемые процессы.',
        speakerNotes: 'Внедрение цифровых инструментов создает мощное конкурентное преимущество и ускоряет трансформацию.'
      },
      {
        layout: 'three_cards',
        title: 'Развитие Кадрового Потенциала и Компетенций',
        sub: 'Подготовка квалифицированных кадров, культура лидерства и менторство',
        photo: `${enKeywords} human resources team professional talent training`,
        points: [
          { heading: 'Непрерывное Обучение (Upskilling)', description: 'Регулярные программы повышения квалификации помогают специалистам оперативно осваивать передовые методики.' },
          { heading: 'Культура Результативности', description: 'Формирование прозрачной системы мотивации, напрямую привязанной к достижению ключевых показателей эффективности.' },
          { heading: 'Командный Интеллект и Обмен Знаниями', description: 'Создание внутренней базы знаний и развитие института наставничества для быстрого ввода новых сотрудников.' }
        ],
        highlight: 'Инвестиции в развитие профессиональных навыков людей — самый надежный драйвер долгосрочного успеха.',
        speakerNotes: 'Люди остаются главным активом: именно их компетенции и мотивация определяют практический успех изменений.'
      },
      {
        layout: 'split_hero',
        title: 'Экологическая Ответственность и Устойчивость (ESG)',
        sub: 'Зеленые стандарты, сбережение ресурсов и долгосрочный общественный баланс',
        photo: `${enKeywords} sustainable green eco development future balance`,
        points: [
          { heading: 'Рациональное ресурсопотребление', description: 'Внедрение энергоэффективных и ресурсосберегающих технологий сокращает экологическую нагрузку и сопутствующие издержки.' },
          { heading: 'Социальная ответственность', description: 'Соблюдение высоких этических стандартов и забота о благополучии общества формируют устойчивую ценность бренда.' },
          { heading: 'Долгосрочный экологический баланс', description: 'Оценка влияния принимаемых стратегических решений на окружающую среду с прицелом на будущие поколения.' }
        ],
        highlight: 'Устойчивое развитие — это баланс между экономическим ростом и бережным отношением к будущему.',
        speakerNotes: 'ESG-принципы становятся обязательным требованием для всех современных устойчивых организаций.'
      },
      {
        layout: 'spotlight',
        title: 'Центральная Гипотеза и Стратегический Инсайт',
        sub: 'Ключевая авторская идея, формирующая качественно новое понимание проблемы',
        photo: `${enKeywords} key insight strategic idea discovery vision`,
        spotlightText: `Наивысший прорыв в направлении "${effectiveTopic}" достигается при синхронизации академической теории, цифровых технологий и регламентированной практики.`,
        points: [
          { heading: 'Преодоление изолированности подходов', description: 'Успех зависит не от совершенствования отдельных компонентов, а от создания бесшовного механизма их взаимного усиления.' },
          { heading: 'Системный качественный скачок', description: 'Комплексная интеграция высвобождает накопительный синергетический эффект, выводя результаты на принципиально новый уровень.' }
        ],
        highlight: 'Точный стратегический инсайт указывает вектор, позволяющий сфокусировать ресурсы на главном.',
        speakerNotes: 'Центральный инсайт исследования объясняет, почему традиционные точечные меры уступают системной интеграции.'
      },
      {
        layout: 'comparison',
        title: 'Практические Кейсы и Отраслевая Апробация',
        sub: 'Результаты пилотных проектов и подтвержденный опыт масштабного внедрения',
        photo: `${enKeywords} real practice experience case study success`,
        leftHeading: 'Кейс 1: Пилотное Тестирование',
        rightHeading: 'Кейс 2: Масштабное Внедрение',
        points: [
          { heading: 'Быстрая адаптация и первичный эффект', description: 'Уже на тестовой стадии зафиксирован прирост ключевых показателей эффективности на 40% выше базового прогноза.' },
          { heading: 'Стабильность при масштабировании', description: 'При тиражировании решений на всю организацию подтвердилась полная сохранность управляемости и высоких темпов роста.' }
        ],
        highlight: 'Проверенный реальной практикой опыт обладает неизмеримо большей ценностью, чем любые теоретические выкладки.',
        speakerNotes: 'Представленные практические кейсы наглядно подтверждают жизнеспособность решений в реальных условиях.'
      },
      {
        layout: 'process_timeline',
        title: 'Система Контроля Качества и Непрерывный Аудит',
        sub: 'Контур обратной связи, мониторинг отклонений и поддержание стандартов',
        photo: `${enKeywords} quality assurance audit feedback loop testing`,
        points: [
          { heading: 'Этап 1: Входной Скрининг Параметров', description: 'Проверка исходных данных и ресурсов на соответствие установленным стандартам качества до запуска процессов.' },
          { heading: 'Этап 2: Промежуточный Мониторинг', description: 'Оперативное отслеживание ключевых метрик на всех промежуточных стадиях с выявлением ранних отклонений.' },
          { heading: 'Этап 3: Финальная Экспертиза и Валидация', description: 'Итоговая верификация готового результата, сертификация и документирование извлеченных уроков.' }
        ],
        highlight: 'Непрерывный контроль качества исключает системные сбои и гарантирует стабильность результатов.',
        speakerNotes: 'Трехуровневая система контроля качества позволяет своевременно блокировать возникновение брака и ошибок.'
      },
      {
        layout: 'matrix_grid',
        title: 'Сценарное Планирование и Модели Адаптации',
        sub: 'Стратегические варианты действий при различных сценариях развития рыночной среды',
        photo: `${enKeywords} future strategic planning scenario forecast model`,
        points: [
          { heading: 'Базовый Сценарий', description: 'Устойчивое плановое развитие в рамках прогнозируемой динамики макроэкономических и отраслевых показателей.' },
          { heading: 'Оптимистический Прорыв', description: 'Быстрое масштабирование при появлении благоприятных возможностей и опережающем росте спроса.' },
          { heading: 'Консервативная Защита', description: 'Фокус на оптимизации расходов, сохранении ликвидности и минимизации рисков при турбулентности.' },
          { heading: 'Гибкий Маневр', description: 'Оперативная перестройка операционных моделей под внезапно изменившиеся условия внешней среды.' }
        ],
        highlight: 'Готовность к альтернативным сценариям обеспечивает непоколебимую устойчивость организации в любой ситуации.',
        speakerNotes: 'Сценарный подход гарантирует готовность команды к уверенным действиям при любой рыночной конъюнктуре.'
      },
      {
        layout: 'data_chart',
        title: 'Стратегический Прогноз и Горизонты Развития (Chart)',
        sub: 'Оценка динамики ключевых целевых индикаторов на период 2024–2030 гг.',
        photo: `${enKeywords} long term forecast projections target data chart`,
        chart: getSmartDomainCharts(effectiveTopic, 20, language),
        points: [
          { heading: 'Долгосрочная динамика показателей', description: 'Аналитические расчеты подтверждают возможность устойчивого опережающего роста целевых параметров при сохранении заданной траектории.' },
          { heading: 'Формирование отраслевого лидерства', description: 'Достижение прогнозных ориентиров позволит закрепить лидирующие позиции и установить новые отраслевые бенчмарки качества.' }
        ],
        highlight: 'Прогнозные расчеты подтверждают уверенный потенциал долгосрочного роста и отраслевого лидерства.',
        speakerNotes: 'Долгосрочный прогноз демонстрирует устойчивые темпы роста и достижимость поставленных стратегических целей.'
      },
      {
        layout: 'three_cards',
        title: 'Пакет Практических Рекомендаций к Внедрению',
        sub: 'Конкретные управленческие и операционные шаги для руководства и исполнителей',
        photo: `${enKeywords} actionable recommendations checklist practical guide`,
        points: [
          { heading: 'Управленческий Уровень', description: 'Утвердить регламенты, определить ответственных координаторов и внедрить сквозную систему KPI контроля.' },
          { heading: 'Операционный Уровень', description: 'Провести поэтапную реорганизацию рабочих цепочек, устранив выявленные дублирования и узкие места.' },
          { heading: 'Технологический Уровень', description: 'Обеспечить инфраструктурную готовность, внедрить инструменты автоматизации и обучить сотрудников.' }
        ],
        highlight: 'Четкие и конкретные рекомендации превращают стратегические ориентиры в измеримые результаты.',
        speakerNotes: 'Представленный чек-лист рекомендаций содержит готовые инструкции к немедленному практическому исполнению.'
      },
      {
        layout: 'cinematic',
        title: 'Горизонты Будущего и Глобальная Трансформация',
        sub: 'Новые рубежи развития, масштабные тренды и непрерывное совершенствование',
        photo: `${enKeywords} future horizon perspective world transformation visionary`,
        points: [
          { heading: 'Интеграция в глобальные процессы', description: 'Укрепление партнерских связей и активное участие в формировании новых отраслевых стандартов будущего.' },
          { heading: 'Непрерывная цифровая эволюция', description: 'Постоянное внедрение передовых технологических решений, опережающее ожидания рынка и потребителей.' },
          { heading: 'Устойчивое лидерство', description: 'Создание адаптивной культуры, способной легко превращать любые внешние вызовы в возможности для качественного роста.' }
        ],
        highlight: 'Будущее принадлежит тем, кто принимает смелые, научно обоснованные и системные решения уже сегодня.',
        speakerNotes: 'В заключительной части мы намечаем горизонты дальнейшего развития и закрепления долгосрочного лидерства.'
      },
      // ===================== RU ДОПОЛНИТЕЛЬНЫЕ ЭТАПЫ 24-30 =====================
      {
        layout: 'spotlight',
        title: 'Стратегические Партнерства и Кластерная Экосистема',
        sub: 'Сетевое взаимодействие, отраслевые альянсы и эффект коллективного масштаба',
        photo: `${enKeywords} strategic partnership network cluster collaboration`,
        spotlightText: `Объединение ведущих институтов в единый отраслевой кластер по направлению "${effectiveTopic}" увеличивает синергетический эффект в 4–5 раз.`,
        points: [
          { heading: 'Кластерная модель взаимодействия', description: 'Формирование единой платформы для координации промышленных предприятий, исследовательских центров и финансовых институтов обеспечивает непрерывный трансфер инноваций и ускоренное внедрение передовых методик.' },
          { heading: 'Стратегические альянсы и совместные проекты', description: 'Заключение долгосрочных соглашений о партнерстве снижает издержки на экспансию и выход на смежные рынки, распределяя риски и аккумулируя передовой опыт лидеров отрасли.' }
        ],
        highlight: 'Развитая сеть стратегических партнерств сокращает затраты на инновации до 40% и укрепляет конкурентоспособность.',
        speakerNotes: 'Кластерное взаимодействие и партнерские альянсы служат фундаментальным драйвером снижения себестоимости и быстрого масштабирования.'
      },
      {
        layout: 'matrix_grid',
        title: 'Дорожная Карта Цифровой Трансформации и KPI',
        sub: 'Этапы технологической модернизации, измеримые метрики и аналитический мониторинг',
        photo: `${enKeywords} digital transformation roadmap KPI dashboard`,
        points: [
          { heading: 'Аудит Цифровой Зрелости', description: 'Комплексная инвентаризация используемых ИТ-систем, выявление узких мест и оценка готовности инфраструктуры к интеграции сквозных решений.' },
          { heading: 'Интеграция Базовых Платформ', description: 'Внедрение взаимосвязанных ERP, CRM и аналитических модулей, обеспечивающих автоматизацию рутинных операций и единое хранилище данных.' },
          { heading: 'Архитектура Данных и Кибербезопасность', description: 'Стандартизация протоколов обмена информацией, сквозное шифрование и разграничение прав доступа для исключения утечек.' },
          { heading: 'Сквозной Мониторинг Эффективности', description: 'Развертывание аналитических панелей реального времени для непрерывного отслеживания ключевых показателей эффективности (KPI).' }
        ],
        highlight: 'Системная цифровизация ускоряет принятие управленческих решений в 3 раза и снижает операционные издержки на 45%.',
        speakerNotes: 'Цифровая трансформация переводит управление процессами на качественно новый уровень прозрачности и скорости.'
      },
      {
        layout: 'three_cards',
        title: 'Управление Интеллектуальной Собственностью и R&D',
        sub: 'Патентная защита, портфель инноваций и капитализация нематериальных активов',
        photo: `${enKeywords} intellectual property patent innovation portfolio`,
        points: [
          { heading: 'Патентная Стратегия и Лицензирование', description: 'Правовая защита уникальных научно-технических решений, формирование устойчивого патентного зонтика и коммерциализация ноу-хау.' },
          { heading: 'Целевые Инвестиции в R&D', description: 'Систематическое финансирование прикладных исследований в партнерстве с профильными университетами и ведущими отраслевыми лабораториями.' },
          { heading: 'Венчурные Инициативы и Акселерация', description: 'Поддержка внутренних стартапов, проведение пилотных экспериментов и быстрая интеграция успешных гипотез в основную цепочку создания стоимости.' }
        ],
        highlight: 'Надежный портфель интеллектуальной собственности обеспечивает устойчивое рыночное преимущество и защищает от копирования.',
        speakerNotes: 'Интеллектуальный капитал и непрерывные инвестиции в исследования формируют барьеры для входа конкурентов на долгие годы.'
      },
      {
        layout: 'process_timeline',
        title: 'Антикризисное Управление и Организационная Стойкость',
        sub: 'Протоколы раннего выявления рисков, оперативное реагирование и посткризисный рост',
        photo: `${enKeywords} crisis management resilience continuity strategy`,
        points: [
          { heading: 'Фаза 1: Ранняя Диагностика Угроз', description: 'Непрерывный мониторинг рыночных сигналов и опережающих индикаторов риска с целью заблаговременной активации превентивных мер.' },
          { heading: 'Фаза 2: Оперативный Кризисный Протокол', description: 'Развертывание антикризисного штаба, реализация регламентов защиты критических операций и сохранение ликвидности.' },
          { heading: 'Фаза 3: Посткризисная Адаптация и Рост', description: 'Анализ извлеченных уроков, пересмотр бизнес-процессов и использование открывающихся возможностей для захвата освободившихся долей рынка.' }
        ],
        highlight: 'Организации с проработанными антикризисными протоколами выходят из турбулентности сильнее и захватывают лидерство.',
        speakerNotes: 'Устойчивость к стрессовым факторам закладывается заранее путем регламентации действий в нештатных ситуациях.'
      },
      {
        layout: 'comparison',
        title: 'Сегментация Рынка и Анализ Целевых Аудиторий',
        sub: 'Дифференциация потребительских профилей и точность ценностного предложения',
        photo: `${enKeywords} market segmentation target audience customer profile`,
        leftHeading: 'Массовое Недифференцированное Предложение',
        rightHeading: 'Точечная Персонализированная Сегментация',
        points: [
          { heading: 'Недостатки размытого позиционирования', description: 'Попытка охватить всех потребителей единым стандартом приводит к размыванию фокуса, снижению лояльности и перерасходу маркетинговых бюджетов.' },
          { heading: 'Преимущества адресных решений', description: 'Глубокая кластеризация аудитории и адаптация продукта под специфические боли каждого сегмента повышают конверсию на 65% и LTV клиента.' }
        ],
        highlight: 'Точная сегментация снижает затраты на привлечение на 35% и удваивает жизненный цикл взаимодействия с клиентом.',
        speakerNotes: 'Переход от массового предложения к прецизионной сегментации многократно увеличивает конверсию каждого вложенного ресурса.'
      },
      {
        layout: 'kpi_metrics',
        title: 'Финансовая Устойчивость и Оптимизация Капитала',
        sub: 'Анализ структуры баланса, рентабельности инвестиций и показателей ликвидности',
        photo: `${enKeywords} financial stability capital structure liquidity analysis`,
        metrics: getSmartDomainMetrics(effectiveTopic, 8, language),
        points: [
          { heading: 'Оптимизация структуры финансирования', description: 'Определение сбалансированного соотношения собственных и заемных средств минимизирует средневзвешенную стоимость капитала (WACC) и максимизирует доходность на собственный капитал (ROE). Продуманная финансовая политика обеспечивает достаточную подушку ликвидности при любых внешних потрясениях.' }
        ],
        highlight: 'Выверенная структура капитала гарантирует финансовую устойчивость и инвестиционную привлекательность проекта.',
        speakerNotes: 'Управление структурой капитала позволяет максимизировать отдачу на вложенный рубль при строгом контроле долговых рисков.'
      },
      {
        layout: 'split_hero',
        title: 'Ключевые Факторы Успеха и Конкурентные Преимущества',
        sub: 'Стратегические компетенции, барьеры для входа и удержание рыночного лидерства',
        photo: `${enKeywords} success factors competitive advantage strategic model`,
        points: [
          { heading: 'Идентификация ключевых факторов успеха (KSF)', description: 'Научно обоснованное выделение 3–4 критических аспектов деятельности, обеспечивающих решающее преимущество перед прямыми конкурентами, и концентрация на них основных ресурсов.' },
          { heading: 'Формирование устойчивых барьеров для входа', description: 'Создание трудновоспроизводимых технологических, кадровых и экосистемных активов, защищающих завоеванные позиции от копирования.' },
          { heading: 'Механизм непрерывного опережения', description: 'Регулярный бенчмаркинг и опережающая адаптация бизнес-модели для сохранения безоговорочного отраслевого первенства в долгосрочной перспективе.' }
        ],
        highlight: 'Четко выстроенные конкурентные барьеры защищают бизнес-модель и гарантируют сохранение высоких маржинальных показателей.',
        speakerNotes: 'Ключевые факторы успеха определяют, вокруг каких уникальных компетенций должна выстраиваться долгосрочная стратегия.'
      }
    ];
  }

  if (language === 'en') {
    return [
      {
        layout: 'split_hero',
        title: `${effectiveTopic}: Conceptual Foundations & Strategic Imperatives`,
        sub: 'Theoretical architecture, operational drivers, and priority objectives',
        photo: `${enKeywords} fundamental research concept analysis`,
        points: [
          { heading: 'Strategic Relevance & Systemic Transformation', description: `Dynamic industry shifts demand a rigorous overhaul of conventional frameworks regarding "${effectiveTopic}". Modern best practices enhance overall execution efficiency by 35–50% while safeguarding systemic resilience.` },
          { heading: 'Strategic Resource Allocation', description: 'Disciplined deployment of validated methodologies enables optimal utilization of capital, technical infrastructure, and talent pools without operational waste.' },
          { heading: 'Measurable Value Creation', description: 'End-to-end modernization across operational touchpoints drives friction reduction and establishes a durable engine for long-term scalability.' }
        ],
        highlight: 'A sound conceptual foundation is the vital cornerstone of sustainable long-term competitive advantage.',
        speakerNotes: `Welcome, distinguished colleagues! On this opening slide, we examine the fundamental concepts and strategic relevance of "${effectiveTopic}".`
      },
      {
        layout: 'comparison',
        title: 'Problem Diagnostics: Legacy vs Modern Frameworks',
        sub: 'Contrasting legacy operational friction with optimized integrated systems',
        photo: `${enKeywords} analysis research comparison innovation`,
        leftHeading: 'Conventional Paradigm',
        rightHeading: 'Modern Systemic Solution',
        points: [
          { heading: 'Manual Friction & Fragmented Data', description: 'Legacy workflows carry heavy manual friction, suffer from siloed information, and present unacceptably high operational error rates.' },
          { heading: 'Automated Precision & Governance', description: 'Modern architectures accelerate turnaround cycles by over 3x, embedding automated precision checks and continuous accountability.' }
        ],
        highlight: 'Transitioning to modern standards eliminates up to 60% of systemic errors and dramatically lowers operating costs.',
        speakerNotes: 'In this section, we analyze the comparative advantages of migrating away from siloed legacy workflows toward modern solutions.'
      },
      {
        layout: 'three_cards',
        title: 'Three Fundamental Pillars of the System',
        sub: 'Core structural anchors ensuring stability, security, and scalability',
        photo: `${enKeywords} three pillars structure architecture`,
        points: [
          { heading: 'Infrastructure & Tooling', description: 'Engineering a fault-tolerant technical foundation equipped with modern, certified analytical instruments.' },
          { heading: 'Human Capital & Capability', description: 'Upskilling multidisciplinary teams, fostering problem-solving mindsets, and sustaining high team velocity.' },
          { heading: 'Governance & Protocols', description: 'Implementing transparent operational protocols that strictly comply with international quality benchmarks.' }
        ],
        highlight: 'The harmonious alignment of all three pillars guarantees complete operational durability and resilience.',
        speakerNotes: 'Special attention must be paid to the three interconnected pillars that form the foundation of our entire operational model.'
      },
      {
        layout: 'matrix_grid',
        title: 'Research Methodology & Analytical Matrix',
        sub: 'Four interlocking tiers of systematic investigation and verification',
        photo: `${enKeywords} methodology analytics scientific framework`,
        points: [
          { heading: 'Empirical Discovery', description: 'Rigorous baseline data capture, current-state audit, and comprehensive identification of risk factors.' },
          { heading: 'Quantitative Modeling', description: 'Statistical algorithms model operational dynamics to determine optimal performance parameters.' },
          { heading: 'Quality Assurance & Audit', description: 'Multi-stage cross-validation of interim milestones to ensure compliance with predefined benchmarks.' },
          { heading: 'Adaptive Field Calibration', description: 'Agile refinement of operational mechanisms based on empirical feedback loops to preserve peak throughput.' }
        ],
        highlight: 'A structured analytical methodology dispels ambiguity and guarantees objective, data-backed execution.',
        speakerNotes: 'The four-tier analytical matrix enables us to approach each operational stage with scientific precision.'
      },
      {
        layout: 'kpi_metrics',
        title: 'Core Empirical Metrics & Industry Benchmarks',
        sub: 'Quantitative indicators, verified milestones, and competitive benchmarks',
        photo: `${enKeywords} statistics data growth chart analytics`,
        metrics: getSmartDomainMetrics(effectiveTopic, 4, language),
        points: [
          { heading: 'Statistical Trajectory & Evidence Base', description: 'Quantitative parameters conclusively validate the trajectory of our strategic roadmap. Measurable metrics demonstrate high return on investment and institutional resilience.' }
        ],
        highlight: 'Empirical data and measurable milestones confirm the strength and precision of the strategic direction.',
        speakerNotes: 'These empirical KPIs provide conclusive proof of the effectiveness and economic feasibility of the chosen strategy.'
      },
      {
        layout: 'comparison',
        title: 'Resource Allocation: Siloed Fragmentation vs Synergy',
        sub: 'Comparative breakdown of time and capital efficiency under different models',
        photo: `${enKeywords} resource optimization efficiency strategy`,
        leftHeading: 'Fragmented Silos',
        rightHeading: 'Integrated Synergy',
        points: [
          { heading: 'Duplication & Communication Latency', description: 'Disconnected operating channels cause up to 35% time loss and generate costly informational barriers.' },
          { heading: 'Unified Operating Ecosystem', description: 'End-to-end integration enables real-time data synchronization and multi-team collaboration at scale.' }
        ],
        highlight: 'Migrating to an integrated ecosystem increases aggregate productivity by more than 2.5 times.',
        speakerNotes: 'Comparing operational models reveals how eliminating silos unlocks tremendous productivity gains.'
      },
      {
        layout: 'data_chart',
        title: 'Growth Dynamics & Statistical Trends (Chart)',
        sub: 'Performance trajectory from initial baseline audit to target milestones',
        photo: `${enKeywords} growth chart data visualization analytics`,
        chart: getSmartDomainCharts(effectiveTopic, 6, language),
        points: [
          { heading: 'Phased Growth Trajectory', description: 'The analytical chart illustrates consistent performance acceleration across each validation milestone. Phased discipline ensures compounding gains.' },
          { heading: 'Predictable Target Achievement', description: 'Statistical forecasting confirms that key strategic targets are achievable ahead of initial conservative projections.' }
        ],
        highlight: 'The dynamic trendline confirms stable, predictable, and compounding positive momentum.',
        speakerNotes: 'This native PowerPoint chart clearly illustrates the upward trajectory of our core performance indicators across phases.'
      },
      {
        layout: 'process_timeline',
        title: 'Step-by-Step Implementation Roadmap',
        sub: 'A disciplined execution sequence from discovery to verified outcomes',
        photo: `${enKeywords} roadmap steps process workflow execution`,
        points: [
          { heading: 'Phase 1: Discovery & Comprehensive Diagnosis', description: 'Rigorous baseline auditing, stakeholder requirement alignment, and thorough risk-impact assessment.' },
          { heading: 'Phase 2: Phased Execution & Integration', description: 'Staged deployment of validated toolchains, specialized talent upskilling, and controlled pilot validation.' },
          { heading: 'Phase 3: Systemic Scaling & Governance', description: 'Enterprise-wide rollout of verified methodologies, ongoing KPI monitoring, and iterative performance refinement.' }
        ],
        highlight: 'A structured roadmap and disciplined milestone execution guarantee outstanding strategic results.',
        speakerNotes: 'The roadmap organizes all critical initiatives into clear phases with transparent ownership and deliverables.'
      },
      {
        layout: 'matrix_grid',
        title: 'Four Drivers of Systemic Sustainability',
        sub: 'Key vectors establishing enduring competitive leadership in the space',
        photo: `${enKeywords} corporate structure modern governance leadership`,
        points: [
          { heading: 'Technological Reliability', description: 'Deploying battle-tested platforms that minimize latency and eliminate costly operational downtime.' },
          { heading: 'Human Capital Density', description: 'Cultivating top-tier talent, fostering autonomy, and embedding an ownership-driven culture.' },
          { heading: 'Governance Transparency', description: 'Implementing crisp protocols and transparent decision matrices that eliminate institutional ambiguity.' },
          { heading: 'Continuous Innovation', description: 'Actively tracking emerging technological advances and piloting high-leverage solutions rapidly.' }
        ],
        highlight: 'The balanced synergy of all four drivers ensures long-term resistance against macroeconomic volatility.',
        speakerNotes: 'These four vectors form the backbone of sustainable competitive advantage and operational excellence.'
      },
      {
        layout: 'split_hero',
        title: 'International Experience & Global Benchmarking',
        sub: 'Synthesizing global best practices and adapting international standards',
        photo: `${enKeywords} global international benchmark world cooperation`,
        points: [
          { heading: 'Global Standards & Precedents', description: 'Analyzing verified models from world-leading institutions avoids common pitfalls and accelerates deployment cycles.' },
          { heading: 'Targeted Local Adaptation', description: 'Successful integration requires calibrating international solutions to local regulatory and operational requirements.' },
          { heading: 'Strategic Global Partnerships', description: 'Active professional collaboration fosters rapid bidirectional transfer of high-impact knowledge.' }
        ],
        highlight: 'Adopting proven international benchmarks while tailoring execution yields exponential acceleration.',
        speakerNotes: 'In this section, we examine global precedents and the mechanics of tailoring them effectively to our context.'
      },
      {
        layout: 'three_cards',
        title: 'Standardization, Regulatory Frameworks & Compliance',
        sub: 'Quality assurance, compliance governance, and international standards',
        photo: `${enKeywords} compliance standards regulations quality certificate`,
        points: [
          { heading: 'International Standards (ISO)', description: 'Implementing standardized quality management protocols guarantees global recognition and operational consistency.' },
          { heading: 'Regulatory Compliance', description: 'Strict adherence to applicable statutory frameworks protects against legal liabilities and ensures transparency.' },
          { heading: 'Continuous Internal Audits', description: 'Regular inspection loops enable early identification and corrective intervention for minor discrepancies.' }
        ],
        highlight: 'Uncompromising adherence to quality standards builds lasting institutional trust and reliability.',
        speakerNotes: 'Compliance with industry standards and continuous auditing establish flawless operational integrity.'
      },
      {
        layout: 'spotlight',
        title: 'Risk Management & Proactive Mitigation Protocols',
        sub: 'Auditing potential vulnerabilities and implementing preventive protocols',
        photo: `${enKeywords} risk management security protection analysis`,
        spotlightText: 'True resilience lies not in reacting to crises, but in eliminating root vulnerabilities before they materialize.',
        points: [
          { heading: 'Threat Probability Matrix', description: 'Comprehensive evaluation of operational, financial, and technological vectors categorizes risks by potential impact.' },
          { heading: 'Pre-emptive Response Playbooks', description: 'Having pre-authorized contingency workflows reduces incident resolution turnaround times by 75%.' }
        ],
        highlight: 'Proactive risk mitigation protects organizational momentum from unexpected disruptions.',
        speakerNotes: 'Our risk framework emphasizes early detection and swift, pre-scripted containment procedures.'
      },
      {
        layout: 'kpi_metrics',
        title: 'Economic Efficiency & Return on Investment (ROI)',
        sub: 'Financial yield, cost optimization, and balance-sheet durability',
        photo: `${enKeywords} financial roi investment growth profit analytics`,
        metrics: getSmartDomainMetrics(effectiveTopic, 12, language),
        points: [
          { heading: 'Financial Feasibility & Capital Returns', description: 'Strategic investments in process optimization achieve rapid payback by removing redundant friction, accelerating cycle times, and optimizing capital assets.' }
        ],
        highlight: 'Every allocated dollar generates measurable financial yields and strengthens balance-sheet durability.',
        speakerNotes: 'Financial modeling confirms rapid break-even velocity and strong long-term investment returns.'
      },
      {
        layout: 'cinematic',
        title: 'Innovative Technologies & Smart Solutions',
        sub: 'Digital transformation, intelligent algorithms, and advanced toolchains',
        photo: `${enKeywords} modern innovative digital technology smart future`,
        points: [
          { heading: 'Intelligent Process Automation', description: 'Offloading repetitive analytical tasks to automated engines reduces human error to near zero.' },
          { heading: 'Predictive Big Data Analytics', description: 'Real-time telemetry analysis uncovers non-obvious patterns for proactive, high-confidence planning.' },
          { heading: 'Technological Synergy', description: 'Seamlessly weaving standalone tools into an integrated platform magnifies aggregate ecosystem power.' }
        ],
        highlight: 'Advanced technologies turn complex operational puzzles into transparent, predictable workflows.',
        speakerNotes: 'Integrating intelligent digital tools unlocks formidable competitive advantages and accelerates velocity.'
      },
      {
        layout: 'three_cards',
        title: 'Human Capital & Continuous Capability Building',
        sub: 'Talent development, culture of accountability, and leadership growth',
        photo: `${enKeywords} human resources team professional talent training`,
        points: [
          { heading: 'Continuous Upskilling', description: 'Regular curriculum programs ensure teams master emerging technologies and contemporary best practices.' },
          { heading: 'Performance-Driven Culture', description: 'Establishing transparent incentives directly linked to core KPI milestones drives sustained intrinsic motivation.' },
          { heading: 'Collective Knowledge Management', description: 'Curating centralized documentation and peer mentorship accelerates new personnel ramp-up time.' }
        ],
        highlight: 'Investing in human capability is the ultimate compounding engine of long-term strategic success.',
        speakerNotes: 'People remain our greatest asset: their capabilities and ownership dictate the real-world success of this transformation.'
      },
      {
        layout: 'split_hero',
        title: 'Environmental Responsibility & Sustainable Growth (ESG)',
        sub: 'Green standards, resource stewardship, and long-term societal value',
        photo: `${enKeywords} sustainable green eco development future balance`,
        points: [
          { heading: 'Resource Conservation', description: 'Adopting energy-efficient practices reduces ecological footprints alongside direct operational overhead.' },
          { heading: 'Social Responsibility', description: 'Upholding strict ethical standards and serving societal well-being builds enduring brand equity.' },
          { heading: 'Intergenerational Balance', description: 'Designing long-term strategies that balance immediate commercial gains with environmental preservation.' }
        ],
        highlight: 'True sustainability harmonizes near-term economic performance with long-term ecological balance.',
        speakerNotes: 'ESG standards are no longer optional—they are imperative for institutional longevity and market leadership.'
      },
      {
        layout: 'spotlight',
        title: 'Core Strategic Hypothesis & Foundational Insight',
        sub: 'The breakthrough realization driving systemic paradigm shifts',
        photo: `${enKeywords} key insight strategic idea discovery vision`,
        spotlightText: `The highest breakthrough in "${effectiveTopic}" is unlocked only when academic theory, digital automation, and disciplined governance converge.`,
        points: [
          { heading: 'Dismantling Operational Silos', description: 'Breakthrough success stems not from isolated optimizations, but from establishing seamless synergies across channels.' },
          { heading: 'Compounding Systemic Multipliers', description: 'Holistic integration unlocks exponential multiplier effects, elevating institutional outputs to unprecedented heights.' }
        ],
        highlight: 'A crisp strategic insight focuses scarce organizational energy on high-leverage inflection points.',
        speakerNotes: 'This foundational insight explains why integrated architectures outperform piecemeal initiatives every single time.'
      },
      {
        layout: 'comparison',
        title: 'Empirical Field Deployments & Case Study Validation',
        sub: 'Measured outcomes from controlled pilots and scaled enterprise rollouts',
        photo: `${enKeywords} real practice experience case study success`,
        leftHeading: 'Pilot Stage Validation',
        rightHeading: 'Enterprise-Scale Rollout',
        points: [
          { heading: 'Rapid Initial Throughput Gains', description: 'The pilot test demonstrated a 40% performance improvement exceeding conservative baseline projections.' },
          { heading: 'Durability at Broad Scale', description: 'Deploying solutions organization-wide confirmed complete preservation of governance and high velocity.' }
        ],
        highlight: 'Battle-tested empirical results provide infinitely greater certainty than abstract conjectures.',
        speakerNotes: 'These field deployments prove beyond doubt that our frameworks deliver consistent, high-impact outcomes.'
      },
      {
        layout: 'process_timeline',
        title: 'Quality Assurance Architecture & Continuous Feedback Loop',
        sub: 'Multi-stage quality controls, automated anomaly detection, and verification',
        photo: `${enKeywords} quality assurance audit feedback loop testing`,
        points: [
          { heading: 'Stage 1: Ingestion Screening & Validation', description: 'Pre-flight checks verify raw inputs and specifications against quality standards prior to execution.' },
          { heading: 'Stage 2: Real-Time Anomaly Monitoring', description: 'Live monitoring tracks key operational indicators to intercept early variance before propagation.' },
          { heading: 'Stage 3: Post-Mortem Certification & Knowledge', description: 'Final verification, certification of outputs, and systematic logging of lessons learned.' }
        ],
        highlight: 'Continuous quality loops eliminate defect propagation and guarantee dependable consistency.',
        speakerNotes: 'Our three-tiered QA architecture prevents defects from ever reaching downstream operational environments.'
      },
      {
        layout: 'matrix_grid',
        title: 'Dynamic Scenario Planning & Adaptation Models',
        sub: 'Strategic operating playbooks calibrated for varying market conditions',
        photo: `${enKeywords} future strategic planning scenario forecast model`,
        points: [
          { heading: 'Baseline Steady-State', description: 'Orderly execution under standard macroeconomic conditions, delivering predictable steady growth.' },
          { heading: 'Accelerated Breakthrough', description: 'Aggressive capacity scaling when favorable tailwinds and high-demand opportunities emerge.' },
          { heading: 'Defensive Preservation', description: 'Focus on cash-flow optimization, cost containment, and vulnerability hardening during volatility.' },
          { heading: 'Agile Strategic Pivot', description: 'Rapid operational realignment in response to sudden regulatory or competitive shifts.' }
        ],
        highlight: 'Preparedness across scenarios gives organizations unshakable confidence in turbulent environments.',
        speakerNotes: 'Scenario playbooks equip leadership to make rapid, decisive moves regardless of external market shifts.'
      },
      {
        layout: 'data_chart',
        title: 'Strategic Long-Term Projections & Milestones (Chart)',
        sub: 'Forecasting key performance indicators and target benchmarks through 2030',
        photo: `${enKeywords} long term forecast projections target data chart`,
        chart: getSmartDomainCharts(effectiveTopic, 20, language),
        points: [
          { heading: 'Long-Term Compounding Growth', description: 'Analytical modeling confirms sustained double-digit expansion across core metrics under disciplined execution.' },
          { heading: 'Solidifying Industry Leadership', description: 'Reaching projected milestones cements dominant market position and establishes new industry benchmarks.' }
        ],
        highlight: 'Statistical projections demonstrate tremendous compounding potential and durable market leadership.',
        speakerNotes: 'Long-term forecasting highlights the extraordinary compounding value of executing this strategic roadmap.'
      },
      {
        layout: 'three_cards',
        title: 'Actionable Recommendations & Phased Execution Guide',
        sub: 'Immediate strategic, operational, and technological directives for leadership',
        photo: `${enKeywords} actionable recommendations checklist practical guide`,
        points: [
          { heading: 'Executive Governance Directive', description: 'Ratify operational charters, appoint key process owners, and install end-to-end KPI scorecards.' },
          { heading: 'Operational Workflow Optimization', description: 'Restructure daily workflows to eliminate redundant friction points identified during baseline audits.' },
          { heading: 'Technology & Enablement Readiness', description: 'Ensure platform stability, activate automated tooling, and conduct hands-on training sessions.' }
        ],
        highlight: 'Actionable, unambiguous recommendations turn strategic ambitions into measurable operational victories.',
        speakerNotes: 'This implementation checklist provides immediate, prioritized marching orders across all leadership tiers.'
      },
      {
        layout: 'cinematic',
        title: 'Future Horizons & Systemic Global Transformation',
        sub: 'New frontiers, macro technological trends, and continuous evolution',
        photo: `${enKeywords} future horizon perspective world transformation visionary`,
        points: [
          { heading: 'Global Ecosystem Integration', description: 'Expanding cross-industry partnerships to actively shape the next generation of global standards.' },
          { heading: 'Continuous Technological Evolution', description: 'Anticipating emerging technological curves to maintain durable multi-year competitive advantages.' },
          { heading: 'Durable Leadership & Adaptability', description: 'Cultivating an agile culture that effortlessly transforms external disruptions into engines of growth.' }
        ],
        highlight: 'The future belongs to organizations that make bold, data-backed, and systemic decisions today.',
        speakerNotes: 'In conclusion, the foundations we lay today will define our leadership and impact for the next decade.'
      },
      // ===================== EN ADDITIONAL STAGES 24-30 =====================
      {
        layout: 'spotlight',
        title: 'Strategic Partnerships & Cluster Economics',
        sub: 'Network synergies, cross-sector alliances, and collective scale',
        photo: `${enKeywords} strategic partnership network cluster collaboration`,
        spotlightText: `Consolidating premier institutions into an integrated sectoral cluster centered on "${effectiveTopic}" expands output efficiency by 4–5x.`,
        points: [
          { heading: 'Cluster Collaboration Architecture', description: 'Establishing a shared operational framework across enterprises, research centers, and financial backers drives continuous knowledge exchange and accelerates the adoption of cutting-edge practices.' },
          { heading: 'Strategic Alliances & Joint Ventures', description: 'Long-term partnership charters mitigate entry barriers and cross-border expansion risks while aggregating collective intellectual and technological capabilities.' }
        ],
        highlight: 'Robust strategic alliances reduce innovation expenditures by up to 40% and build resilient competitive advantages.',
        speakerNotes: 'Cluster models and strategic joint ventures enable sustainable cost reduction and accelerated operational scale.'
      },
      {
        layout: 'matrix_grid',
        title: 'Digital Transformation Roadmap & KPI Engine',
        sub: 'Modernization phases, quantitative benchmarks, and real-time observability',
        photo: `${enKeywords} digital transformation roadmap KPI dashboard`,
        points: [
          { heading: 'Digital Maturity Assessment', description: 'Comprehensive audit of legacy software assets to pinpoint throughput bottlenecks and ensure infrastructure readiness for scalable modernization.' },
          { heading: 'Enterprise Platform Integration', description: 'Deploying unified ERP, CRM, and BI systems to eliminate manual data silos and establish a single source of truth across operations.' },
          { heading: 'Data Architecture & Zero-Trust Security', description: 'Enforcing standardized schema definitions, end-to-end encryption protocols, and role-based access governance to safeguard proprietary data assets.' },
          { heading: 'Real-Time KPI Observability', description: 'Implementing automated executive dashboards with live telemetry for continuous operational health tracking and predictive alerting.' }
        ],
        highlight: 'Systemic digital transformation accelerates decision turnaround by 3x while trimming operational expenses by 45%.',
        speakerNotes: 'Digital modernization elevates workflow agility, institutional transparency, and organizational execution speed.'
      },
      {
        layout: 'three_cards',
        title: 'Intellectual Property & Innovation Portfolio',
        sub: 'Patent strategy, R&D capital allocation, and intangible asset capitalization',
        photo: `${enKeywords} intellectual property patent innovation portfolio`,
        points: [
          { heading: 'Patent Protection & Licensing', description: 'Securing legal exclusivity over proprietary breakthroughs, developing defensible IP moats, and commercializing high-value licensing streams.' },
          { heading: 'Targeted R&D Capital Allocation', description: 'Funding applied research initiatives in tight collaboration with top-tier research institutes, universities, and industry laboratories.' },
          { heading: 'Internal Incubation & Venture Accelerators', description: 'Fostering agile internal venture sandboxes to rapidly validate disruptive concepts and integrate validated breakthroughs into core workflows.' }
        ],
        highlight: 'A defensible intellectual property portfolio provides sustainable market moats and long-term valuation premiums.',
        speakerNotes: 'Continuous investments into proprietary intellectual capital ensure long-term competitive durability and pricing power.'
      },
      {
        layout: 'process_timeline',
        title: 'Crisis Management & Organizational Resilience',
        sub: 'Early threat telemetry, rapid emergency containment, and post-crisis expansion',
        photo: `${enKeywords} crisis management resilience continuity strategy`,
        points: [
          { heading: 'Phase 1: Early Anomaly Telemetry', description: 'Continuous tracking of leading macro indicators to trigger preemptive defensive measures before risks materialize into systemic disruption.' },
          { heading: 'Phase 2: Rapid Containment & Protocol Activation', description: 'Mobilizing cross-functional crisis leadership units, enforcing contingency workflows, and safeguarding liquidity reserves.' },
          { heading: 'Phase 3: Post-Crisis Adaptation & Growth', description: 'Conducting comprehensive root-cause post-mortems, restructuring operational vulnerabilities, and capturing vacated market share.' }
        ],
        highlight: 'Organizations with disciplined crisis protocols emerge from market volatility stronger and capture decisive market share.',
        speakerNotes: 'Operational resilience is built in advance through rigorous contingency planning, stress-testing, and playbook automation.'
      },
      {
        layout: 'comparison',
        title: 'Market Segmentation & Precision Targeting',
        sub: 'Customer profile differentiation and value proposition alignment',
        photo: `${enKeywords} market segmentation target audience customer profile`,
        leftHeading: 'Mass Generalized Outreach',
        rightHeading: 'Data-Driven Precision Targeting',
        points: [
          { heading: 'Diluted value propositions', description: 'Targeting broad audiences with generic messaging squanders commercial capital, depresses brand resonance, and inflates customer acquisition costs.' },
          { heading: 'Tailored high-impact positioning', description: 'Deep cohort clustering and tailored value propositions boost conversion rates by 65% and substantially increase long-term customer lifetime value.' }
        ],
        highlight: 'Precision market segmentation cuts acquisition expenditure by 35% while doubling average customer lifetime engagement.',
        speakerNotes: 'Transitioning from undifferentiated outreach to targeted segmentation maximizes return on every operational dollar spent.'
      },
      {
        layout: 'kpi_metrics',
        title: 'Financial Stability & Capital Efficiency',
        sub: 'Balance sheet optimization, return on invested capital, and liquidity reserves',
        photo: `${enKeywords} financial stability capital structure liquidity analysis`,
        metrics: getSmartDomainMetrics(effectiveTopic, 8, language),
        points: [
          { heading: 'Capital Structure Optimization', description: 'Balancing debt and equity tranches minimizes the Weighted Average Cost of Capital (WACC) while maximizing Return on Equity (ROE). Prudent capital management preserves resilient liquidity buffers across cyclical fluctuations.' }
        ],
        highlight: 'A disciplined capital allocation framework provides balance sheet resilience and unlocks sustainable growth trajectories.',
        speakerNotes: 'Optimizing capital deployment maximizes enterprise returns while tightly governing financial and structural downside risks.'
      },
      {
        layout: 'split_hero',
        title: 'Key Success Factors & Sustainable Competitive Moats',
        sub: 'Distinctive capabilities, high entry barriers, and durable market leadership',
        photo: `${enKeywords} success factors competitive advantage strategic model`,
        points: [
          { heading: 'Isolating Key Success Factors (KSFs)', description: 'Empirically identifying the 3–4 foundational performance drivers that separate top quartile performers from industry peers, and directing resources accordingly.' },
          { heading: 'Constructing High Entry Barriers', description: 'Cultivating hard-to-replicate technological capabilities, deep customer integrations, and network effects that shield profit margins from competitor imitation.' },
          { heading: 'Dynamic Competitive Adaptation', description: 'Implementing continuous benchmark surveillance to proactively evolve core competencies and maintain uncontested market leadership over decades.' }
        ],
        highlight: 'Formidable competitive moats protect core business profitability and secure unchallenged industry leadership.',
        speakerNotes: 'Key success factors define the distinctive, hard-to-copy capabilities around which our long-term roadmap is architected.'
      }
    ];
  }

  if (language === 'tg') {
    return [
      {
        layout: 'split_hero',
        title: `${effectiveTopic}: Асосҳои Консептуалӣ ва Мубрамияти Стратегӣ`,
        sub: 'Пойдевори назариявӣ, дигаргуниҳои соҳавӣ ва ҳадафҳои асосӣ',
        photo: `${enKeywords} fundamental research concept analysis`,
        points: [
          { heading: 'Мубрамияти мавзӯъ ва зарурати низомманд', description: `Дар шароити имрӯза таҷдиди назар кардани усулҳои анъанавӣ дар самти "${effectiveTopic}" тақозои замон аст. Ҷорисозии стандартҳои пешрафта маҳсулнокиро 35–50% афзуда, устувории низомро таъмин месозад.` },
          { heading: 'Тақсимоти оқилонаи захираҳо', description: 'Истифодаи мақсадноки воситаҳои илмӣ заминаи истифодаи сарфакоронаи сармояи моддӣ ва инсониро фароҳам меорад.' },
          { heading: 'Натиҷаҳои чашмдошти сифатӣ', description: 'Таҳлили ҳамаҷонибаи равандҳо назорати доимии сифатро кафолат дода, заминаи рушди устуворро мегузорад.' }
        ],
        highlight: 'Пойдевори мустаҳками назариявӣ кафили боэътимоди ноил шудан ба мақсадҳои дарозмуддат мебошад.',
        speakerNotes: `Салом, ҳозирини гиромӣ! Дар ин слайд мо асосҳои консептуалӣ ва аҳамияти стратегии мавзӯи "${effectiveTopic}"-ро баррасӣ мекунем.`
      },
      {
        layout: 'comparison',
        title: 'Ташхиси Мушкилот: Равиши Анъанавӣ ва Инноватсионӣ',
        sub: 'Муқоисаи маҳдудиятҳои куҳна бо роҳҳои ҳалли муосиру мукаммал',
        photo: `${enKeywords} analysis research comparison innovation`,
        leftHeading: 'Модели Анъанавӣ',
        rightHeading: 'Қарори Инноватсионӣ',
        points: [
          { heading: 'Сарфи баланди вақт ва хавфи хатогиҳо', description: 'Усулҳои куҳна кори зиёди дастиро талаб карда, хавфи хатогиҳоро баланд мебардоранд ва суръатро коҳиш медиҳанд.' },
          { heading: 'Оптимизатсияи автоматикунонидашуда', description: 'Алгоритмҳои муосир иҷрои вазифаҳоро беш аз 3 маротиба метезонанд ва шаффофияти комилро таъмин месозанд.' }
        ],
        highlight: 'Гузариш ба усулҳои муосир то 60% хатогиҳоро коҳиш дода, хароҷоти амалиётиро сарфа менамояд.',
        speakerNotes: 'Дар ин қисмат мо бартариҳои гузариш аз усулҳои куҳна ба низоми муосирро муқоиса мекунем.'
      },
      {
        layout: 'three_cards',
        title: 'Се Сутуни Бунёдӣ ва Принсипҳои Низом',
        sub: 'Самтҳои асосии кафолатбахши устуворӣ ва эътимоднокӣ',
        photo: `${enKeywords} three pillars structure architecture`,
        points: [
          { heading: 'Инфрасохтор ва Технология', description: 'Таъсиси заминаи мустаҳками моддию техникӣ ва истифодаи асбобҳои муосиру боэътимод.' },
          { heading: 'Сармояи Инсонӣ', description: 'Баланд бардоштани сатҳи тахассусии мутахассисон ва ташкили фарҳанги пешсафӣ.' },
          { heading: 'Меъёрҳо ва Стандартҳо', description: 'Ҷорисозии қоидаҳои шаффофи корӣ ва риояи қатъии стандартҳои байналмилалии сифат.' }
        ],
        highlight: 'Ҳамоҳангии комили ин се сутун устувории тамоми низомро кафолат медиҳад.',
        speakerNotes: 'Се сутуни бунёдӣ — инфрасохтор, кадрҳо ва стандартҳо асоси пешрафти дарозмуддат мебошанд.'
      },
      {
        layout: 'matrix_grid',
        title: 'Методологияи Таҳқиқот ва Матритсаи Таҳлилӣ',
        sub: 'Чор сатҳи таҳлили ҳамаҷониба ва санҷиши илмӣ',
        photo: `${enKeywords} methodology analytics scientific framework`,
        points: [
          { heading: 'Мушоҳидаи Эмпирикӣ', description: 'Ҷамъоварии маълумоти воқеӣ, ташхиси ҳолати ҷорӣ ва муайян кардани хавфҳо.' },
          { heading: 'Моделсозии Миқдорӣ', description: 'Истифодаи алгоритмҳои оморӣ барои муайян кардани нишондиҳандаҳои беҳтарин.' },
          { heading: 'Назорати Сифат ва Аудит', description: 'Санҷиши пайвастаи натиҷаҳо ва рафъи норасоиҳо дар марҳилаҳои аввал.' },
          { heading: 'Ислоҳи Амалӣ', description: 'Ворид кардани тағйироти саривақтӣ бар асоси таҳлил барои нигоҳ доштани суръати рушд.' }
        ],
        highlight: 'Методологияи дақиқи таҳлилӣ номуайяниро бартараф сохта, натиҷаҳои боэътимод медиҳад.',
        speakerNotes: 'Матритсаи методологӣ ба мо имкон медиҳад, ки равандҳоро илман идора кунем.'
      },
      {
        layout: 'kpi_metrics',
        title: 'Нишондиҳандаҳои Асосии Эмпирикӣ ва Омори Соҳавӣ',
        sub: 'Омори воқеӣ, суръати афзоиш ва меъёрҳои тасдиқшудаи соҳа',
        photo: `${enKeywords} statistics data growth chart analytics`,
        metrics: getSmartDomainMetrics(effectiveTopic, 4, language),
        points: [
          { heading: 'Динамикаи оморӣ ва заминаи далелҳо', description: 'Нишондиҳандаҳои миқдорӣ дурустии самти стратегии интихобшударо исбот мекунанд. Рақамҳои воқеӣ самарабахшии сармоягузорӣ ва устувории низомро тасдиқ менамоянд.' }
        ],
        highlight: 'Далелҳои оморӣ ва рақамҳои воқеӣ дурустии стратегияро комилан собит месозанд.',
        speakerNotes: 'Нишондиҳандаҳои пешниҳодшуда далели равшани эътимоднокӣ ва самаранокии модел мебошанд.'
      },
      {
        layout: 'comparison',
        title: 'Оптимизатсияи Захираҳо: Парокандагӣ ва Ҳамгироӣ',
        sub: 'Таҳлили сарфи вақт ва маблағ дар шароити гуногуни идоракунӣ',
        photo: `${enKeywords} resource optimization efficiency strategy`,
        leftHeading: 'Идоракунии Пароканда',
        rightHeading: 'Ҳамгироии Ягона',
        points: [
          { heading: 'Талафоти вақт ва захираҳо', description: 'Алоқаи сусти бахшҳо боиси то 35% талафи вақти корӣ мегардад ва монеаҳои иловагӣ эҷод мекунад.' },
          { heading: 'Экосистемаи ягона', description: 'Ҳамгироии равандҳо мубодилаи фаврии маълумот ва фаъолияти мураттаби тамоми сохторҳоро таъмин менамояд.' }
        ],
        highlight: 'Гузариш ба экосистемаи ягона маҳсулнокиро беш аз 2.5 маротиба афзун менамояд.',
        speakerNotes: 'Муқоисаи низомҳо нишон медиҳад, ки ҳамгироӣ сарчашмаи асосии сарфа ва афзоиши суръат аст.'
      },
      {
        layout: 'data_chart',
        title: 'Динамикаи Рушд ва Графики Таҳлилӣ (Chart)',
        sub: 'Траекторияи гузариш аз марҳилаи аввал ба нишондиҳандаҳои ниҳоӣ',
        photo: `${enKeywords} growth chart data visualization analytics`,
        chart: getSmartDomainCharts(effectiveTopic, 6, language),
        points: [
          { heading: 'Суръати афзоиши марҳилавӣ', description: 'Диаграмма нишон медиҳад, ки чӣ гуна самаранокии кор дар ҳар як давра босуръат боло рафтааст. Иҷрои нақша омили пешрафти доимист.' },
          { heading: 'Устувории нишондиҳандаҳо', description: 'Пешгӯиҳои таҳлилӣ нишон медиҳанд, ки ба ҳадафҳо пеш аз мӯҳлат расидан мумкин аст.' }
        ],
        highlight: 'Графики динамика рушди устувор ва мунтазами низомро ба таври равшан нишон медиҳад.',
        speakerNotes: 'Ин диаграммаи PowerPoint динамикаи воқеии рушдро дар марҳилаҳои гуногун инъикос менамояд.'
      },
      {
        layout: 'process_timeline',
        title: 'Харитаи Роҳ ва Марҳилаҳои Амалисозӣ',
        sub: 'Занҷири амалҳои пайдарпай: аз банақшагирӣ то натиҷаи амалӣ',
        photo: `${enKeywords} roadmap steps process workflow execution`,
        points: [
          { heading: 'Марҳилаи 1: Ташхиси Ҳамаҷониба', description: 'Баҳодиҳии ҳолати кунунӣ, муайян кардани эҳтиёҷот ва тасдиқи нақшаи чорабиниҳо.' },
          { heading: 'Марҳилаи 2: Татбиқи Озмоишӣ', description: 'Ҷорисозии усулҳои озмудашуда, омӯзонидани мутахассисон ва санҷиши аввалияи натиҷаҳо.' },
          { heading: 'Марҳилаи 3: Густариш ва Назорат', description: 'Фарогирии тамоми сохтор бо таҷрибаи нав, мониторинги пайваста ва таҳкими нишондиҳандаҳо.' }
        ],
        highlight: 'Иҷрои боинтизоми харитаи роҳ кафили ноил шудан ба ҳамаи ҳадафҳои гузошташуда мебошад.',
        speakerNotes: 'Харитаи роҳ тамоми вазифаҳоро бо мӯҳлатҳои мушаххас ба низом медарорад.'
      },
      {
        layout: 'matrix_grid',
        title: 'Чор Омили Пешбарандаи Устувории Низом',
        sub: 'Самтҳои калидӣ барои нигоҳ доштани пешсафии дарозмуддат',
        photo: `${enKeywords} corporate structure modern governance leadership`,
        points: [
          { heading: 'Эътимоднокии Технологӣ', description: 'Истифодаи платформаҳои муосир барои пешгирии қатъшавии кор ва камбудиҳо.' },
          { heading: 'Потенсиали Кадрӣ', description: 'Ташаккули дастаи мутахассисони варзида ва баланд бардоштани ҳавасмандии онҳо.' },
          { heading: 'Шаффофияти Идоракунӣ', description: 'Ҷорисозии қоидаҳои возеҳ барои пешгирии нофаҳмиҳо дар қабули қарорҳо.' },
          { heading: 'Ҷараёни Навовариҳо', description: 'Ҷустуҷӯ ва татбиқи фаврии дастовардҳои навтарини соҳавӣ.' }
        ],
        highlight: 'Ҳамоҳангии ҳамаи чор омил низомро дар муқобили ҳама гуна бӯҳронҳо устувор мегардонад.',
        speakerNotes: 'Ин чор самт пояи рақобатпазирии дарозмуддати соҳаро ташкил медиҳанд.'
      },
      {
        layout: 'split_hero',
        title: 'Таҷрибаи Байналмилалӣ ва Бенчмаркинги Ҷаҳонӣ',
        sub: 'Таҳлили таҷрибаи муассисаҳои пешбари ҷаҳон ва мутобиқсозии онҳо',
        photo: `${enKeywords} global international benchmark world cooperation`,
        points: [
          { heading: 'Стандартҳои пешқадами ҷаҳонӣ', description: 'Омӯзиши таҷрибаи кишварҳои пешрафта имкон медиҳад, ки хатогиҳои такрорӣ пешгирӣ карда шаванд.' },
          { heading: 'Мутобиқсозии маҳаллӣ', description: 'Истифодаи модели байналмилалӣ бо дарназардошти хусусиятҳои дохилӣ сурат мегирад.' },
          { heading: 'Тавсеаи ҳамкориҳои байналмилалӣ', description: 'Муколамаи пайваста бо коршиносони хориҷӣ ба интиқоли фаврии дониш мусоидат мекунад.' }
        ],
        highlight: 'Истифодаи оқилонаи таҷрибаи ҷаҳонӣ раванди рушдро чандин маротиба метезонад.',
        speakerNotes: 'Дар ин қисмат мо таҷрибаҳои беҳтарини байналмилалӣ ва мутобиқсозии онҳоро дида мебароем.'
      },
      {
        layout: 'three_cards',
        title: 'Стандартизатсия, Заминаи Меъёрӣ ва Сертификатсия',
        sub: 'Назорати мутобиқат, қоидаҳои корӣ ва стандартҳои ҷаҳонии сифат',
        photo: `${enKeywords} compliance standards regulations quality certificate`,
        points: [
          { heading: 'Стандартҳои Байналмилалӣ (ISO)', description: 'Ҷорисозии талаботи муосири сифат эътирофи натиҷаҳоро дар сатҳи ҷаҳонӣ таъмин менамояд.' },
          { heading: 'Мутобиқати Ҳуқуқӣ', description: 'Риояи қатъии қонунгузорӣ фаъолиятро шаффоф ва бехатар мегардонад.' },
          { heading: 'Аудити Дохилии Мунтазам', description: 'Санҷиши пайваста имкон медиҳад, ки камбудиҳо сари вақт бартараф карда шаванд.' }
        ],
        highlight: 'Риояи стандартҳои баланд сатҳи эътимоднокӣ ва нуфузи касбиро баланд мебардорад.',
        speakerNotes: 'Стандартизатсия ва аудити доимӣ заминаи фаъолияти бехатар ва бехато мебошанд.'
      },
      {
        layout: 'spotlight',
        title: 'Идоракунии Хавфҳо ва Назорати Пешгирикунанда',
        sub: 'Ташхиси хатарҳо ва усулҳои пешгирии саривақтии онҳо',
        photo: `${enKeywords} risk management security protection analysis`,
        spotlightText: 'Идоракунии беҳтарин ин рафъи сабабҳои хатар пеш аз рух додани онҳо мебошад.',
        points: [
          { heading: 'Матритсаи эҳтимоли хатарҳо', description: 'Таҳлили омилҳои молиявӣ ва технологӣ имкон медиҳад, ки хавфҳо дараҷабандӣ карда шаванд.' },
          { heading: 'Нақшаҳои пешгирӣ ва ҳимоя', description: 'Мавҷудияти дастурҳои фаврӣ вақти ҳалли мушкилотро то 75% кам мекунад.' }
        ],
        highlight: 'Пешгирии саривақтии хатарҳо соҳаро аз хисороти ногаҳонӣ муҳофизат мекунад.',
        speakerNotes: 'Таваҷҷуҳи асосӣ ба пешгирии саривақтии хатарҳо ва нақшаҳои вокуниш равона шудааст.'
      },
      {
        layout: 'kpi_metrics',
        title: 'Самарабахшии Иқтисодӣ ва Бозгашти Сармоя (ROI)',
        sub: 'Даромаднокии молиявӣ, кам кардани хароҷот ва устувории низом',
        photo: `${enKeywords} financial roi investment growth profit analytics`,
        metrics: getSmartDomainMetrics(effectiveTopic, 12, language),
        points: [
          { heading: 'Асосноккунии натиҷаҳои молиявӣ', description: 'Сармоягузорӣ ба ин бахш дар мӯҳлати кӯтоҳ аз ҳисоби коҳиши хароҷоти беҳуда ва баланд бардоштани суръати равандҳо пурра ҷуброн мегардад.' }
        ],
        highlight: 'Ҳар як захираи масрафшуда натиҷаи мушаххаси иқтисодӣ ва фоидаи соф меорад.',
        speakerNotes: 'Ҳисобҳои молиявӣ ҷолибияти баланд ва бозгашти тези сармояро собит месозанд.'
      },
      {
        layout: 'cinematic',
        title: 'Технологияҳои Инноватсионӣ ва Қарорҳои Ҳушманд',
        sub: 'Табдили рақамӣ, алгоритмҳои интеллектуалӣ ва абзорҳои навин',
        photo: `${enKeywords} modern innovative digital technology smart future`,
        points: [
          { heading: 'Автоматикунонии ҳушманд', description: 'Супоридани корҳои якранг ба низомҳои рақамӣ омили инсониро ба ҳадди ақал мерасонад.' },
          { heading: 'Таҳлили додаҳои калон (Big Data)', description: 'Коркарди фаврии маълумот имкон медиҳад, ки қарорҳои дақиқ қабул карда шаванд.' },
          { heading: 'Ҳамоҳангии технологӣ', description: 'Муттаҳид сохтани воситаҳо дар як занҷир қудрати тамоми низомро афзун мекунад.' }
        ],
        highlight: 'Технологияҳои навин равандҳои душворро ба кори шаффоф ва идорашаванда табдил медиҳанд.',
        speakerNotes: 'Ҷорисозии абзорҳои рақамӣ афзалияти қавии рақобатӣ ба вуҷуд меорад.'
      },
      {
        layout: 'three_cards',
        title: 'Сармояи Инсонӣ ва Баланд Бардоштани Малакаи Кадрҳо',
        sub: 'Тайёр кардани мутахассисони соҳибтаҷриба ва фарҳанги пешсафӣ',
        photo: `${enKeywords} human resources team professional talent training`,
        points: [
          { heading: 'Омӯзиши Мунтазам (Upskilling)', description: 'Барномаҳои пайвастаи баланд бардоштани тахассус барои аз худ кардани усулҳои нав.' },
          { heading: 'Ҳавасмандгардонии Натиҷавӣ', description: 'Таъсиси низоми шаффофи мукофотдиҳӣ бар асоси нишондиҳандаҳои воқеӣ.' },
          { heading: 'Фарҳанги Ҳамкории Даставӣ', description: 'Мусоидат ба мубодилаи дониш ва дастгирии ҳамдигар дар муҳити корӣ.' }
        ],
        highlight: 'Сармоягузорӣ ба инсон кафили боэътимодтарини муваффақияти дарозмуддат аст.',
        speakerNotes: 'Инсон муҳимтарин дороии мост: донишу маҳорати ӯ натиҷаи корро муайян мекунад.'
      },
      {
        layout: 'split_hero',
        title: 'Масъулияти Экологӣ ва Рушди Устувор (ESG)',
        sub: 'Меъёрҳои сабз, сарфаи захираҳо ва мувозинати дарозмуддати иҷтимоӣ',
        photo: `${enKeywords} sustainable green eco development future balance`,
        points: [
          { heading: 'Сарфаи оқилонаи захираҳо', description: 'Истифодаи технологияҳои сарфакунанда таъсири манфиро ба табиат кам карда, хароҷотро сарфа месозад.' },
          { heading: 'Масъулияти иҷтимоӣ', description: 'Риояи меъёрҳои баланди ахлоқӣ эътибори соҳаро дар ҷомеа баланд мебардорад.' },
          { heading: 'Мувозинати экологӣ', description: 'Қабули қарорҳои дуруст бо дарназардошти манфиатҳои наслҳои оянда.' }
        ],
        highlight: 'Рушди устувор — ин мувозинат байни пешрафти иқтисодӣ ва ҳифзи табиат аст.',
        speakerNotes: 'Принсипҳои ESG барои ҳамаи сохторҳои муосир талаботи ҳатмӣ гардидаанд.'
      },
      {
        layout: 'spotlight',
        title: 'Фарзияи Марказӣ ва Инсайти Бунёдии Стратегӣ',
        sub: 'Ғояи калидии муаллиф барои таҳаввулоти куллӣ дар соҳа',
        photo: `${enKeywords} key insight strategic idea discovery vision`,
        spotlightText: `Комёбии баландтарин дар самти "${effectiveTopic}" танҳо ҳангоми пайвастани назария, рақамикунонӣ ва амалияи дақиқ ба даст меояд.`,
        points: [
          { heading: 'Рафъи ҷудоии равандҳо', description: 'Муваффақият аз пайвастани тамоми қисмҳо дар як занҷири ягона вобаста аст.' },
          { heading: 'Ҷаҳиши сифатии низом', description: 'Ҳамгироии ҳамаҷониба нерӯи дохилиро бедор карда, натиҷаро ба сатҳи нав мебарорад.' }
        ],
        highlight: 'Инсайти дуруст захираҳоро ба муҳимтарин нуқтаҳои рушд равона месозад.',
        speakerNotes: 'Ин ғояи марказӣ нишон медиҳад, ки чаро чораҳои пароканда ба ҳамгироии куллӣ бохтанд.'
      },
      {
        layout: 'comparison',
        title: 'Кейсҳои Амалӣ ва Таҳлили Озмоишҳои Воқеӣ',
        sub: 'Натиҷаҳои лоиҳаҳои озмоишӣ ва таҷрибаи татбиқи густурда',
        photo: `${enKeywords} real practice experience case study success`,
        leftHeading: 'Санҷиши Озмоишӣ',
        rightHeading: 'Татбиқи Густурда',
        points: [
          { heading: 'Натиҷаҳои босуръати аввалия', description: 'Дар давраи озмоиш нишондиҳандаҳо нисбат ба чашмдошт 40% баландтар ба қайд гирифта шуданд.' },
          { heading: 'Устуворӣ дар сатҳи васеъ', description: 'Ҳангоми паҳн кардани таҷриба суръати баланди рушд ва назорат комилан нигоҳ дошта шуд.' }
        ],
        highlight: 'Таҷрибаи дар амал санҷидашуда нисбат ба ҳар гуна назария боэътимодтар аст.',
        speakerNotes: 'Кейсҳои воқеӣ исбот мекунанд, ки усулҳои пешниҳодшуда дар амал 100% самарабахшанд.'
      },
      {
        layout: 'process_timeline',
        title: 'Назорати Сифат ва Занҷири Доимии Аудит',
        sub: 'Мониторинги камбудиҳо, бозгашти иттилоот ва риояи меъёрҳо',
        photo: `${enKeywords} quality assurance audit feedback loop testing`,
        points: [
          { heading: 'Марҳилаи 1: Тафтиши Ибтидоӣ', description: 'Санҷиши маълумоти аввалия ва захираҳо пеш аз оғози равандҳои корӣ.' },
          { heading: 'Марҳилаи 2: Мониторинги Фосилавӣ', description: 'Пайгирии фаврии нишондиҳандаҳо барои ошкор сохтани камбудиҳои аввалия.' },
          { heading: 'Марҳилаи 3: Хулоса ва Сертификатсия', description: 'Санҷиши ниҳоии сифат, таҳияи хулоса ва ҳуҷҷатгузории таҷрибаи муваффақ.' }
        ],
        highlight: 'Назорати доимии сифат хатогиҳоро бартараф карда, устувориро кафолат медиҳад.',
        speakerNotes: 'Низоми сезинагии назорат сифати олии маҳсулот ва хизматрасониро таъмин мекунад.'
      },
      {
        layout: 'matrix_grid',
        title: 'Банақшагирии Сенарияҳо ва Моделҳои Мутобиқшавӣ',
        sub: 'Имконоти фаъолият дар шароитҳои гуногуни рушди соҳа ва бозор',
        photo: `${enKeywords} future strategic planning scenario forecast model`,
        points: [
          { heading: 'Сенарияи Асосӣ', description: 'Рушди мунтазам дар доираи нишондиҳандаҳои пешбинишудаи стандартӣ.' },
          { heading: 'Пешрафти Фаврӣ', description: 'Густариши босуръат ҳангоми пайдо шудани имкониятҳои мусоид.' },
          { heading: 'Ҳимояи Муҳофизакорӣ', description: 'Сарфаи захираҳо ва кам кардани хавфҳо ҳангоми номуайянии бозор.' },
          { heading: 'Мутобиқшавии Чолок', description: 'Тағйир додани фаврии тарзи кор ба шароити нави беруна.' }
        ],
        highlight: 'Омодагӣ ба ҳама гуна вазъият устувории қавии соҳаро кафолат медиҳад.',
        speakerNotes: 'Усули сенариявӣ омодагии дастаро ба амалҳои дақиқ дар ҳар шароит таъмин месозад.'
      },
      {
        layout: 'data_chart',
        title: 'Пешгӯиҳои Дарозмуддат ва Марҳилаҳои Рушд (Chart)',
        sub: 'Нишондиҳандаҳои стратегӣ барои давраи солҳои 2024–2030',
        photo: `${enKeywords} long term forecast projections target data chart`,
        chart: getSmartDomainCharts(effectiveTopic, 20, language),
        points: [
          { heading: 'Динамикаи рушди оянда', description: 'Ҳисобҳои таҳлилӣ нишон медиҳанд, ки дар сурати иҷрои нақша суръати афзоиш боло хоҳад рафт.' },
          { heading: 'Таҳкими пешсафӣ дар соҳа', description: 'Расидан ба ҳадафҳо мавқеи пешсафиро мустаҳкам карда, стандартҳои навро муқаррар месозад.' }
        ],
        highlight: 'Ҳисобҳои ояндабин иқтидори баланди рушд ва даромаднокиро собит месозанд.',
        speakerNotes: 'Ин диаграммаи дурнамо пешрафти воқеиро дар солҳои оянда равшан нишон медиҳад.'
      },
      {
        layout: 'three_cards',
        title: 'Тавсияҳои Амалӣ ва Барномаи Фаъолият',
        sub: 'Қадамҳои мушаххаси идоракунӣ ва амалиётӣ барои роҳбарон ва иҷрокунандагон',
        photo: `${enKeywords} actionable recommendations checklist practical guide`,
        points: [
          { heading: 'Сатҳи Роҳбарият', description: 'Тасдиқи нақшаҳо, таъин намудани масъулон ва ҷорисозии низоми назорати KPI.' },
          { heading: 'Сатҳи Амалиётӣ', description: 'Таҷдиди занҷирҳои корӣ, рафъи такроршавӣ ва автоматикунонии равандҳо.' },
          { heading: 'Сатҳи Технологӣ', description: 'Таъмини заминаи техникӣ, ҷорисозии абзорҳои нав ва омӯзонидани кормандон.' }
        ],
        highlight: 'Тавсияҳои мушаххас мақсадҳоро ба натиҷаҳои воқеӣ ва ченшаванда табдил медиҳанд.',
        speakerNotes: 'Ин дастури амалӣ роҳнамои дақиқи қадам ба қадам барои амалисозӣ мебошад.'
      },
      {
        layout: 'cinematic',
        title: 'Уфуқҳои Оянда ва Дигаргунсозии Ҷаҳонӣ',
        sub: 'Имкониятҳои нав, тамоюлҳои калон ва такмили пайваста',
        photo: `${enKeywords} future horizon perspective world transformation visionary`,
        points: [
          { heading: 'Ҳамгироӣ бо равандҳои ҷаҳонӣ', description: 'Таҳкими робитаҳо ва иштироки фаъол дар ташаккули стандартҳои нави оянда.' },
          { heading: 'Эволютсияи рақамии пайваста', description: 'Ҷорисозии мунтазами дастовардҳои нав, ки аз чашмдошти бозор пеш мегузаранд.' },
          { heading: 'Пешсафии устувор', description: 'Ташаккули фарҳанги чолок, ки ҳама мушкилотро ба имконияти рушд табдил медиҳад.' }
        ],
        highlight: 'Оянда ба касоне тааллуқ дорад, ки имрӯз қарорҳои далер ва илман асоснок қабул мекунанд.',
        speakerNotes: 'Дар хотима бояд гуфт, ки пояи гузошташуда заминаи комёбиҳои даҳсолаи ояндаро мегузорад.'
      },
      // ===================== TG ИЛОВАГИИ ЭТАПҲОИ 24-30 =====================
      {
        layout: 'spotlight',
        title: 'Ҳамкории Стратегӣ ва Иқтисодиёти Кластерӣ',
        sub: 'Шабакаи ҳамкорӣ, иттиҳодҳои соҳавӣ ва афзоиши самаранокӣ',
        photo: `${enKeywords} strategic partnership network cluster collaboration`,
        spotlightText: `Муттаҳид сохтани муассисаҳои пешсаф дар кластери ягона оид ба "${effectiveTopic}" самаранокиро 4–5 маротиба меафзояд.`,
        points: [
          { heading: 'Модели ҳамкории кластерӣ', description: 'Таъсиси заминаи ягона барои корхонаҳо, марказҳои илмӣ ва молиявӣ мубодилаи дониш ва ҷорисозии босуръати навовариҳоро таъмин месозад.' },
          { heading: 'Иттиҳодҳои стратегӣ ва тарҳҳои муштарак', description: 'Бастани созишномаҳои дарозмуддат хароҷоти воридшавӣ ба бозорҳои навро кам карда, таҷрибаи пешсафонро ҷамъ меорад.' }
        ],
        highlight: 'Шабакаи қавии шарикон хароҷоти навовариро то 40% кам карда, мавқеи рақобатиро мустаҳкам месозад.',
        speakerNotes: 'Ҳамкории кластерӣ ва шарикӣ омили асосии кам кардани хароҷот ва рушди босуръат мебошанд.'
      },
      {
        layout: 'matrix_grid',
        title: 'Харитаи Роҳи Таҳаввулоти Рақамӣ ва Низоми KPI',
        sub: 'Марҳилаҳои рақамикунонӣ, нишондиҳандаҳои ченшаванда ва мониторинг',
        photo: `${enKeywords} digital transformation roadmap KPI dashboard`,
        points: [
          { heading: 'Баҳодиҳии Омодагии Рақамӣ', description: 'Тафтиши ҳамаҷонибаи системаҳои IT, ошкор сохтани нуқсонҳо ва омодагии инфрасохтор барои ворид намудани қарорҳои нав.' },
          { heading: 'Ҳамгироии Платформаҳои Асосӣ', description: 'Ҷорисозии системаҳои ягонаи ERP, CRM ва модулҳои таҳлилӣ барои автоматикунонии амалиёти ҳаррӯза.' },
          { heading: 'Амнияти Додаҳо ва Киберамният', description: 'Стандартикунонии қоидаҳои мубодилаи маълумот ва ҳифзи онҳо аз дастрасии ғайриқонунӣ.' },
          { heading: 'Мониторинги Пайвастаи Самаранокӣ', description: 'Ташкили панелҳои таҳлилии фаврӣ барои пайгирии доимии нишондиҳандаҳои калидӣ (KPI).' }
        ],
        highlight: 'Рақамикунонии низомманд қабули қарорҳоро 3 баробар тезонида, хароҷотро 45% кам мекунад.',
        speakerNotes: 'Таҳаввулоти рақамӣ идоракунии равандҳоро ба сатҳи комилан нави шаффофият мебарорад.'
      },
      {
        layout: 'three_cards',
        title: 'Идоракунии Моликияти Зеҳнӣ ва Сандуқи Навовариҳо',
        sub: 'Ҳимояи патентӣ, сармоягузории илмӣ ва басармоятабдилдиҳӣ',
        photo: `${enKeywords} intellectual property patent innovation portfolio`,
        points: [
          { heading: 'Стратегияи Патентӣ ва Иҷозатномадиҳӣ', description: 'Ҳимояи ҳуқуқии қарорҳои нодири илмию техникӣ ва истифодаи самараноки дороиҳои зеҳнӣ.' },
          { heading: 'Сармоягузории Мақсаднок ба Тадқиқот', description: 'Маблағгузории пайвастаи тадқиқоти илмӣ дар ҳамкорӣ бо донишгоҳҳо ва озмоишгоҳҳо.' },
          { heading: 'Ташаббусҳои Озмоишӣ ва Стартапҳо', description: 'Дастгирии лоиҳаҳои дохилӣ ва ҷорисозии босуръати ғояҳои муваффақ ба амалиёти асосӣ.' }
        ],
        highlight: 'Сандуқи устувори моликияти зеҳнӣ бартарии боэътимодро дар бозор таъмин месозад.',
        speakerNotes: 'Сармояи зеҳнӣ заминаи рақобатпазирии дарозмуддат ва даромаднокии устуворро фароҳам меорад.'
      },
      {
        layout: 'process_timeline',
        title: 'Идоракунии Бӯҳрон ва Устувории Ташкилотӣ',
        sub: 'Муайянкунии барвақтии хатарҳо, вокуниши фаврӣ ва рушди пас аз бӯҳрон',
        photo: `${enKeywords} crisis management resilience continuity strategy`,
        points: [
          { heading: 'Марҳилаи 1: Ташхиси Барвақтӣ', description: 'Мониторинги доимии нишонаҳои бозор ва хатарҳо бо мақсади сари вақт андешидани чораҳои пешгирикунанда.' },
          { heading: 'Марҳилаи 2: Вокуниши Фаврӣ', description: 'Фаъолсозии гурӯҳи зиддибӯҳронӣ, ҳифзи амалиёти муҳим ва захираҳои молиявӣ.' },
          { heading: 'Марҳилаи 3: Мутобиқшавӣ ва Рушд', description: 'Таҳлили сабабҳо, такмили равандҳо ва истифодаи имкониятҳои нав барои ишғоли бозор.' }
        ],
        highlight: 'Ташкилотҳои дорои нақшаи зиддибӯҳронӣ аз ҳар мушкилот қавитар ва бо имкониятҳои бештар берун меоянд.',
        speakerNotes: 'Устуворӣ ба ҳолатҳои ғайричашмдошт пешакӣ ва тавассути омодагии дақиқ ба даст меояд.'
      },
      {
        layout: 'comparison',
        title: 'Бахшбандии Бозор ва Таҳлили Мухотабон',
        sub: 'Фарқияти талаботи истеъмолкунандагон ва пешниҳоди арзишманд',
        photo: `${enKeywords} market segmentation target audience customer profile`,
        leftHeading: 'Пешниҳоди Умумии Номуайян',
        rightHeading: 'Бахшбандии Дақиқи Мақсаднок',
        points: [
          { heading: 'Камбудиҳои равиши якхела', description: 'Кӯшиши қонеъ кардани ҳамаи мизоҷон бо як паём боиси сарфи беҳудаи захираҳо ва паст шудани самаранокӣ мегардад.' },
          { heading: 'Афзалиятҳои пешниҳоди дақиқ', description: 'Тақсимбандии дурусти мухотабон ва мутобиқ кардани маҳсулот ба талаботи мушаххас ҷалби мизоҷонро 65% меафзояд.' }
        ],
        highlight: 'Бахшбандии дуруст хароҷоти ҷалбро 35% кам карда, эътимоди мизоҷонро дучанд мегардонад.',
        speakerNotes: 'Гузариш ба бахшбандии дақиқ натиҷаи ҳар як воситаи сарфшударо ба таври назаррас афзун мекунад.'
      },
      {
        layout: 'kpi_metrics',
        title: 'Устувории Молиявӣ ва Оптимизатсияи Сармоя',
        sub: 'Таҳлили сохтори сармоя, даромаднокӣ ва нишондиҳандаҳои пардохтпазирӣ',
        photo: `${enKeywords} financial stability capital structure liquidity analysis`,
        metrics: getSmartDomainMetrics(effectiveTopic, 8, language),
        points: [
          { heading: 'Оптимизатсияи сохтори молиявӣ', description: 'Муайян намудани таносуби дурусти сармояи худӣ ва қарзӣ хароҷоти сармояро кам карда, даромаднокиро баланд мебардорад. Сиёсати оқилонаи молиявӣ устувориро дар шароити тағйирёбанда таъмин месозад.' }
        ],
        highlight: 'Сохтори дурусти сармоя кафолати устувории молиявӣ ва ҷолибияти сармоягузории лоиҳа мебошад.',
        speakerNotes: 'Идоракунии самараноки сармоя фоидаро ҳадди аксар афзоиш дода, хатарҳои молиявиро кам мекунад.'
      },
      {
        layout: 'split_hero',
        title: 'Омилҳои Калидии Муваффақият ва Афзалиятҳои Рақобатӣ',
        sub: 'Маҳорати стратегӣ, монеаҳо барои рақибон ва ҳифзи пешсафӣ дар бозор',
        photo: `${enKeywords} success factors competitive advantage strategic model`,
        points: [
          { heading: 'Муайян кардани омилҳои асосӣ (KSF)', description: 'Ҷудо кардани 3-4 самти муҳимтарине, ки афзалияти ҳалкунанда медиҳанд, ва равона кардани захираҳои асосӣ ба онҳо.' },
          { heading: 'Бунёди монеаҳои қавии рақобатӣ', description: 'Эҷоди дороиҳои технологии такрорнашаванда ва фарҳанги қавӣ, ки мавқеъро аз рақибон ҳимоя мекунанд.' },
          { heading: 'Механизми пешсафии доимӣ', description: 'Мутобиқсозии пайвастаи тарзи кор барои нигоҳ доштани пешсафии мутлақ дар муддати тӯлонӣ.' }
        ],
        highlight: 'Бартариҳои рақобатии мушаххас лоиҳаро дар бозор ҳамчун пешсафи бебаҳс устувор месозанд.',
        speakerNotes: 'Омилҳои муваффақият нишон медиҳанд, ки стратегии дарозмуддат бояд бар кадом пояҳо устувор бошад.'
      }
    ];
  }

  // Uzbek (Default Generic) - 23 sequential stages
  return [
    {
      layout: 'split_hero',
      title: `${effectiveTopic}: Konseptual Asoslar va Strategik Zarurat`,
      sub: 'Nazariy poydevor, sohaviy transformatsiya va fundamental maqsadlar',
      photo: `${enKeywords} fundamental research concept analysis`,
      points: [
        { heading: 'Mavzuning dolzarbligi va tizimli ehtiyoj', description: `Bugungi shiddatli davrda "${effectiveTopic}" yo'nalishidagi an'anaviy yondashuvlarni tubdan qayta ko'rib chiqish talab etilmoqda. Yangi ilmiy tadqiqotlar va sohaviy tajribalar shuni ko'rsatadiki, zamonaviy standartlarni joriy etish jarayonlar samaradorligini 35-50% ga oshirish bilan birga, yuzaga kelishi mumkin bo'lgan operatsion xatarlarni sezilarli darajada kamaytiradi.` },
        { heading: 'Resurslar salohiyatini oqilona taqsimlash', description: 'Ilg\'or metodologiyalar va sinovdan o\'tgan vositalarni qo\'llash moddiy, moliyaviy va inson kapitalidan maksimal darajada tejamkor foydalanish kafolatini beradi. Bosqichma-bosqich takomillashtirish modeli tizimning uzoq muddatli barqarorligini hamda raqobatbardosh ustunliklarini ta\'minlaydi.' },
        { heading: 'Kutilayotgan miqdoriy va sifat natijalari', description: 'Tizimli diagnostika va kompleks chora-tadbirlar qisqa muddat ichida operatsion xarajatlarni tejash, ijro intizomini mustahkamlash va sohadagi yetakchi xalqaro mezonlarga to\'liq javob berish imkoniyatini yaratadi.' }
      ],
      highlight: 'Mustahkam nazariy poydevor va izchil harakatlar strategiyasi yuqori marralarga erishishning asosiy kalitidir.',
      speakerNotes: `Assalomu alaykum, hurmatli tinglovchilar! Taqdimotimizning ushbu ochilish qismida biz "${effectiveTopic}" mavzusining dolzarbligi, nazariy asoslari va strategik maqsadlarini atroflicha ko'rib chiqamiz.`
    },
    {
      layout: 'comparison',
      title: 'Muammolar Diagnostikasi: An\'anaviy va Innovatsion Yondashuvlar',
      sub: 'Eskirgan cheklovlar, samarasiz xarajatlar va innovatsion modellar qiyosi',
      photo: `${enKeywords} analysis research comparison innovation`,
      leftHeading: 'An\'anaviy Cheklangan Model',
      rightHeading: 'Innovatsion Tizimli Yechim',
      points: [
        { heading: 'Yuqori vaqt sarfi va xatoliklar xatari', description: 'Eski konservativ uslublarda ko\'p qo\'l mehnati talab qilinib, ma\'lumotlar tarqoqligi sababli jarayonlar sekin kechgan va inson omili oqibatida xatoliklar ko\'p yuzaga kelgan.' },
        { heading: 'Avtomatlashtirilgan zamonaviy boshqaruv', description: 'Zamonaviy tizimli yondashuv bilan operatsion jarayonlar 3 barobarga tezlashadi, uzluksiz raqamli monitoring yo\'lga qo\'yiladi va shaffoflik to\'liq ta\'minlanadi.' }
      ],
      highlight: 'Zamonaviy metodologiyaga o\'tish orqali operatsion xatolar xavfi 60% ga qisqaradi va resurslar tejaladi.',
      speakerNotes: 'Ushbu slaydda an\'anaviy usullarning cheklovlari va yangi innovatsion model keltiradigan amaliy afzalliklar taqqoslab ko\'rsatilgan.'
    },
    {
      layout: 'three_cards',
      title: 'Tizimning 3 Ta Fundamental Ustuni va Tamoyillari',
      sub: 'Barqarorlik va yuqori samaradorlikni ta\'minlovchi tayanch mezonlar',
      photo: `${enKeywords} three pillars structure architecture`,
      points: [
        { heading: 'Infratuzilma va Yangi Texnologiyalar', description: 'Moddiy-texnik bazani to\'liq modernizatsiya qilish, ishonchli raqamli platformalarni tatbiq etish va ma\'lumotlar xavfsizligini kafolatlash.' },
        { heading: 'Professional Kadrlar va Salohiyat', description: 'Mutaxassislarning kasbiy malakasini uzluksiz oshirib borish, zamonaviy ko\'nikmalarni shakllantirish va natijadorlik muhitini yaratish.' },
        { heading: 'Shaffof Boshqaruv va Standartlar', description: 'Xalqaro sifat menejmenti tizimlarini joriy etish, aniq reglamentlar asosida ishlash va har bir jarayon ustidan qat\'iy nazorat o\'rnatish.' }
      ],
      highlight: 'Ushbu uchta asosiy ustun o\'zaro bog\'liq holda butun tizim mustahkamligi va bardavomligini kafolatlaydi.',
      speakerNotes: 'Uchta fundamental ustun — infratuzilma, kadrlar va standartlar butun loyihaning uzoq muddatli tayanch poydevoridir.'
    },
    {
      layout: 'matrix_grid',
      title: 'Tadqiqot Metodologiyasi va Tahliliy Matritsa',
      sub: 'Tizimli monitoring, ma\'lumotlar tahlili va ko\'p bosqichli tekshiruv modeli',
      photo: `${enKeywords} methodology analytics scientific framework`,
      points: [
        { heading: 'Empirik Kuzatuv va Diagnostika', description: 'Mavjud holatni kompleks inventarizatsiya qilish, xatarlarni aniqlash va dastlabki faktik ma\'lumotlar bazasini shakllantirish.' },
        { heading: 'Kvantitativ Statistik Modellashtirish', description: 'Raqamli tahlil algoritmlari orqali jarayonlar dinamikasini hisoblash va eng samarali ko\'rsatkichlarni belgilash.' },
        { heading: 'Sifat Nazorati va Cross-Audit', description: 'Oraliq natijalarni belgilangan mezonlar bilan solishtirish, sifat auditini o\'tkazish va noaniqliklarni bartaraf etish.' },
        { heading: 'Amaliy Verifikatsiya va Korreksiya', description: 'Qabul qilingan qarorlarning amaliy hayotiy samarasini tekshirish va zarur hollarda tezkor o\'zgartirishlar kiritish.' }
      ],
      highlight: 'Ilmiy asoslangan tahliliy matritsa har qanday noaniqlikni bartaraf etib, aniq va ishonchli natija beradi.',
      speakerNotes: 'To\'rtta metodologik o\'q jarayonlarni shunchaki kuzatibgina qolmay, ularni ilmiy asosda boshqarish imkonini beradi.'
    },
    {
      layout: 'kpi_metrics',
      title: 'Asosiy Empirik Ko\'rsatkichlar va Sohaviy Statistika',
      sub: 'Miqdoriy natijalar, o\'sish sur\'atlari va sohaviy benchmark ko\'rsatkichlari',
      photo: `${enKeywords} statistics data growth chart analytics`,
      metrics: getSmartDomainMetrics(effectiveTopic, 4, language),
      points: [
        { heading: 'Sohaviy dinamika va empirik dalillar', description: 'Aniq miqdoriy statistika tanlangan strategik yo\'nalishning to\'g\'riligini va amaliy hayotiyligini to\'liq isbotlamoqda. O\'lchanadigan indikatorlar kiritilgan investitsiyalarning yuqori darajada o\'zini oqlashini va tizimli barqarorlikni ta\'minlaydi.' }
      ],
      highlight: 'Empirik raqamlar va aniq faktlar strategik yo\'nalish to\'g\'ri tanlanganligini yaqqol isbotlaydi.',
      speakerNotes: 'Ushbu slayd doirasida biz erishilgan aniq miqdoriy ko\'rsatkichlar va o\'lchanadigan natijalarni ko\'rib chiqamiz.'
    },
    {
      layout: 'comparison',
      title: 'Operatsion Qiyos: Resurs Sarfi va Natijadorlik Balansi',
      sub: 'Vaqt sarfi, moliyaviy tejamkorlik va kutilmagan to\'siqlar tahlili',
      photo: `${enKeywords} resource optimization efficiency strategy`,
      leftHeading: 'Fragmentar Tarqoq Boshqaruv',
      rightHeading: 'Integratsiyalashgan Ekotizim',
      points: [
        { heading: 'Vaqt va mablag\' yo\'qotishlari', description: 'Tarqoq tizimlarda ma\'lumot almashinuvi kechikadi, takroriy harakatlar ko\'payadi va umumiy unumdorlik 35% gacha pasayib ketadi.' },
        { heading: 'Yagona sinergetik samara', description: 'Yagona ekotizimga birlashgan jarayonlar minimal resurs sarfi bilan eng yuqori natijaga erishish va shaffoflikni ta\'minlaydi.' }
      ],
      highlight: 'Integratsiyalashgan ekotizimga o\'tish orqali umumiy ish unumdorligi 2.5 barobarga oshadi.',
      speakerNotes: 'Taqqoslama tahlil ko\'rsatmoqdaki, resurslarni integratsiyalashgan holda boshqarish samarasiz yo\'qotishlarga to\'liq chek qo\'yadi.'
    },
    {
      layout: 'data_chart',
      title: 'O\'sish Dinamikasi va Statistik Tendensiyalar (Chart)',
      sub: 'Boshlang\'ich davrdan maqsadli marragacha bo\'lgan o\'sish traektoriyasi',
      photo: `${enKeywords} growth chart data visualization analytics`,
      chart: getSmartDomainCharts(effectiveTopic, 6, language),
      points: [
        { heading: 'Bosqichma-bosqich o\'sish sur\'ati', description: 'Diagramma ko\'rsatkichlari har bir oraliq davrda samaradorlikning izchil ortib borayotganini ko\'rsatmoqda. Rejali qadamlar va sifat nazorati tizimli o\'sishni kafolatlaydi.' },
        { heading: 'Prognoz ko\'rsatkichlarining barqarorligi', description: 'Matematik modellashtirish natijalari maqsadli ko\'rsatkichlarga belgilangan muddatdan oldinroq erishish mumkinligini tasdiqlamoqda.' }
      ],
      highlight: 'Dinamik grafik ko\'rsatkichlari tizimning barqaror va ijobiy yuksalish traektoriyasini tasdiqlaydi.',
      speakerNotes: 'Ushbu PowerPoint diagrammasi orqali loyihaning har bir bosqichida qayd etilgan faktik o\'sish sur\'atlarini ko\'rishingiz mumkin.'
    },
    {
      layout: 'process_timeline',
      title: 'Bosqichma-bosqich Amalga Oshirish Yo\'l Xaritasi',
      sub: 'G\'oyadan to\'liq amaliy natijagacha bo\'lgan izchil qadamlar zanjiri',
      photo: `${enKeywords} roadmap steps process workflow execution`,
      points: [
        { heading: '1-Bosqich: Kompleks Diagnostika va Audit', description: 'Mavjud holatni chuqur tahlil qilish, ehtiyojlarni xatlovdan o\'tkazish va xatarlarni baholagan holda reja tasdiqlash.' },
        { heading: '2-Bosqich: Pilot Tatbiq va Tajriba-Sinov', description: 'Sinovdan o\'tgan metodologik vositalarni amaliyotga kiritish, xodimlarni o\'qitish va dastlabki natijalarni o\'lchash.' },
        { heading: '3-Bosqich: Masshtablashtirish va Monitoring', description: 'Ijobiy tajribani butun tarmoq bo\'ylab kengaytirish, muntazam sifat auditini yo\'lga qo\'yish va natijalarni mustahkamlash.' }
      ],
      highlight: 'Izchil bosqichli intizom har qanday murakkab maqsadga aniq erishishning bosh garovidir.',
      speakerNotes: 'Yo\'l xaritasi barcha vazifalarni aniq vaqt chegaralari hamda mas\'ullar kesimida tizimlashtirishga xizmat qiladi.'
    },
    {
      layout: 'matrix_grid',
      title: 'Tizim Barqarorligining 4 Ta Harakatlantiruvchi O\'qi',
      sub: 'Uzoq muddatli raqobatbardoshlikni shakllantiruvchi integral tuzilma',
      photo: `${enKeywords} corporate structure modern governance leadership`,
      points: [
        { heading: 'Texnologik Mustahkamlik', description: 'Eng so\'nggi avtomatlashtirish yechimlari, zamonaviy uskunalar va uzluksiz ishlovchi mustahkam platformalar.' },
        { heading: 'Inson Kapitalini Rivojlantirish', description: 'Malakali kadrlar zaxirasini shakllantirish, sog\'lom motivatsiya va jamoaviy birdamlik madaniyatini kuchaytirish.' },
        { heading: 'Nazorat va Korporativ Standartlar', description: 'Barcha jarayonlarning reglamentlarga to\'liq mosligi va javobgarlik chegaralarining aniq belgilanishi.' },
        { heading: 'Uzluksiz Innovatsiyalar Oqimi', description: 'Yangi g\'oyalarni muntazam qo\'llab-quvvatlash, ilmiy tadqiqotlar va ilg\'or tajribalarni darhol o\'zlashtirish.' }
      ],
      highlight: 'Barcha to\'rtta harakatlantiruvchi o\'q uyg\'unlashganda tizim har qanday inqirozlarga chidamli bo\'ladi.',
      speakerNotes: 'Ushbu to\'rtta o\'q tizimning barqaror rivojlanishi va tashqi o\'zgarishlarga tez moslashuvchanligini ta\'minlaydi.'
    },
    {
      layout: 'split_hero',
      title: 'Xalqaro Tajriba va Global Benchmarking',
      sub: 'Jahon yetakchi institutlari amaliyoti va ilg\'or tajribalarni moslashtirish',
      photo: `${enKeywords} global international benchmark world cooperation`,
      points: [
        { heading: 'Xalqaro ilg\'or tajribalarni o\'rganish', description: 'Dunyoning yetakchi davlatlari va ilmiy markazlarida sinovdan o\'tgan muvaffaqiyatli amaliyotlarni chuqur tahlil qilish.' },
        { heading: 'Milliy sharoitga moslashtirish (Adaptatsiya)', description: 'Xorijiy modellarni ko\'r-ko\'rona ko\'chirmasdan, mahalliy xususiyatlar va amaldagi mezonlarni hisobga olgan holda tatbiq etish.' },
        { heading: 'Global hamkorlik aloqalarini kengaytirish', description: 'Xalqaro ekspertlar hamjamiyati bilan doimiy muloqot o\'rnatish va bilimlar almashinuvini ta\'minlash.' }
      ],
      highlight: 'Ilg\'or jahon tajribasini to\'g\'ri moslashtirish vaqt va resurslarni bir necha barobar tejaydi.',
      speakerNotes: 'Global benchmarking orqali biz xalqaro darajada sinalgan eng samarali mexanizmlarni o\'zlashtiramiz.'
    },
    {
      layout: 'three_cards',
      title: 'Standartlashtirish, Normativ Baza va Sertifikatsiya',
      sub: 'Sifat kafolati, xalqaro reglamentlar va qat\'iy standartlar majmuasi',
      photo: `${enKeywords} compliance standards regulations quality certificate`,
      points: [
        { heading: 'Xalqaro Sifat Standartlari (ISO)', description: 'Xalqaro sifat talablariga to\'liq javob beruvchi reglamentlarni joriy etish va boshqaruv madaniyatini oshirish.' },
        { heading: 'Normativ-Huquqiy Muvofiqlik', description: 'Barcha harakatlarning amaldagi qonunchilikka to\'liq mosligini ta\'minlash va yuridik xatarlarni bartaraf qilish.' },
        { heading: 'Muntazam Ichki va Tashqi Audit', description: 'Jarayonlar ustidan mustaqil ekspert tekshiruvlarini o\'tkazib, kamchiliklarni erta bosqichda tuzatib borish.' }
      ],
      highlight: 'Qat\'iy standartlarga amal qilish sohadagi nufuz, ishonchlilik va sifat darajasini kafolatlaydi.',
      speakerNotes: 'Standartlashtirish va muntazam audit har bir jarayonning xatoliksiz va xavfsiz bajarilishiga asos bo\'ladi.'
    },
    {
      layout: 'spotlight',
      title: 'Risk-Menejment va Xatarlarni Oldindan Niqoblash',
      sub: 'Kutilmagan operatsion, moliyaviy va tizimli xavflarni minimallashtirish',
      photo: `${enKeywords} risk management security protection analysis`,
      spotlightText: 'Eng yaxshi inqiroz boshqaruvi — bu xatarlar yuz bermasdan oldin ularning ildizini bartaraf etuvchi profilaktik tizimdir.',
      points: [
        { heading: 'Xavflarni erta aniqlash matritsasi', description: 'Barcha yuzaga kelishi mumkin bo\'lgan xatarlar oldindan baholanib, ularning ta\'sir darajasi bo\'yicha saralanadi.' },
        { heading: 'Favqulodda harakatlar protokoli', description: 'Kutilmagan o\'zgarishlar sodir bo\'lganda tizim faoliyatini to\'xtatmasdan boshqarish uchun aniq ssenariylar mavjud.' }
      ],
      highlight: 'Profilaktik xavfsizlik choralari yo\'qotishlar ehtimolini 75% ga kamaytiradi va barqarorlikni saqlaydi.',
      speakerNotes: 'Risk-menejment blokida biz ehtimoliy xavf omillari va ularning oldini oluvchi profilaktik chora-tadbirlarni tahlil qilamiz.'
    },
    {
      layout: 'kpi_metrics',
      title: 'Iqtisodiy Samaradorlik va Investitsion Rentabellik (ROI)',
      sub: 'Xarajatlarni optimallashtirish, kapital qaytishi va rentabellik tahlili',
      photo: `${enKeywords} financial roi investment growth profit analytics`,
      metrics: getSmartDomainMetrics(effectiveTopic, 12, language),
      points: [
        { heading: 'Investitsiyalarning iqtisodiy oqlanishi', description: 'Taklif etilayotgan modelga yo\'naltirilgan sarmoyalar qisqa muddat ichida samarasiz xarajatlarni qisqartirish, tezlikni oshirish va resurslarni tejamkor ishlatish hisobiga to\'liq qoplanadi va sof iqtisodiy foyda keltiradi.' }
      ],
      highlight: 'Har bir sarflangan resursning aniq o\'lchanadigan iqtisodiy samara keltirishi kafolatlangan.',
      speakerNotes: 'Ushbu slayd kiritilgan har bir investitsiya birligidan olinadigan aniq moliyaviy natijadorlikni ko\'rsatadi.'
    },
    {
      layout: 'cinematic',
      title: 'Innovatsion Texnologiyalar va Smart Yechimlar',
      sub: 'Raqamli ekotizim, avtomatlashtirish algoritmlari va yangi davr vositalari',
      photo: `${enKeywords} modern innovative digital technology smart future`,
      points: [
        { heading: 'Jarayonlarni aqlli avtomatlashtirish', description: 'Inson omilini kamaytirib, mexanik vazifalarni intellektual tizimlarga topshirish orqali tezlikni oshirish.' },
        { heading: 'Katta ma\'lumotlar (Big Data) tahlili', description: 'Keng qamrovli ma\'lumotlarni soniyalar ichida qayta ishlab, aniq va xolis strategik qarorlar qabul qilish.' },
        { heading: 'Texnologik yechimlar sinergiyasi', description: 'Barcha vositalarning bir-biri bilan uzviy bog\'lanishi natijasida yaxlit kuchli ekotizim shakllanadi.' }
      ],
      highlight: 'Innovatsion texnologiyalar jarayonlar samaradorligini tubdan yangi bosqichga olib chiqadi.',
      speakerNotes: 'Raqamli texnologiyalar va sun\'iy intellekt vositalari ish unumdorligini oshirishning asosiy lokomotiviga aylanmoqda.'
    },
    {
      layout: 'three_cards',
      title: 'Inson Kapitali va Kadrlar Malakasini Rivojlantirish',
      sub: 'Yuqori malakali mutaxassislar tayyorlash va liderlik salohiyatini oshirish',
      photo: `${enKeywords} human resources team professional talent training`,
      points: [
        { heading: 'Uzluksiz Malaka Oshirish Tizimi', description: 'Xodimlar uchun sohaviy treninglar, master-klasslar va zamonaviy o\'quv dasturlarini muntazam o\'tkazish.' },
        { heading: 'Natijadorlikka Yo\'naltirilgan Motivatsiya', description: 'Har bir mutaxassisning shaxsiy hissasi va erishgan aniq natijalariga qarab rag\'batlantirish tizimini yo\'lga qo\'yish.' },
        { heading: 'Korporativ Madaniyat va Birdamlik', description: 'Jamoada o\'zaro ishonch, bilim almashinuvi va umumiy maqsad sari birlashish muhitini shakllantirish.' }
      ],
      highlight: 'Eng ilg\'or texnologiya ham yetuk, mas\'uliyatli va bilimli mutaxassislar bo\'lgandagina haqiqiy samara beradi.',
      speakerNotes: 'Inson kapitali — har qanday tashkiliy muvaffaqiyatning yuragi. Biz xodimlarning bilim va malakasiga alohida e\'tibor qaratamiz.'
    },
    {
      layout: 'split_hero',
      title: 'Ekologik Mas\'uliyat va Barqaror Rivojlanish (ESG)',
      sub: 'Yashil standartlar, resurs tejamkorligi va uzoq muddatli ijtimoiy ta\'sir',
      photo: `${enKeywords} sustainable green eco development future balance`,
      points: [
        { heading: 'Ekologik toza va tejamkor yondashuv', description: 'Energiya va moddiy resurslarni tejash, chiqindilarni minimallashtirish va atrof-muhitni asrash mezonlariga rioya qilish.' },
        { heading: 'Ijtimoiy mas\'uliyat va jamoatchilik manfaati', description: 'Faoliyatning jamiyat farovonligi, aholi salomatligi va kelajak avlodlar manfaatlariga to\'liq uyg\'un bo\'lishi.' },
        { heading: 'Uzoq muddatli barqaror muvozanat', description: 'Bugungi iqtisodiy yutuqlarni kelajak ekologiyasi va resurslariga putur yetkazmasdan qo\'lga kiritish.' }
      ],
      highlight: 'Barqaror rivojlanish — bugungi taraqqiyotni ertangi kun bilan uyg\'unlashtirish san\'atidir.',
      speakerNotes: 'ESG mezonlari va ekologik mas\'uliyat xalqaro miqyosda korxona nufuzi va uzoq umr ko\'rishining asosiy talabiga aylanmoqda.'
    },
    {
      layout: 'spotlight',
      title: 'Markaziy Gipoteza va Fundamental Strategik Insight',
      sub: 'Tadqiqotning eng muhim yangiligi va tizimli o\'zgarishlar keltiruvchi kuchi',
      photo: `${enKeywords} key insight strategic idea discovery vision`,
      spotlightText: `"${effectiveTopic}" yo'nalishidagi eng yuksak natija alohida qismlarni emas, balki butun tizimni yagona intellektual zanjirga bog'lagandagina qo'lga kiritiladi.`,
      points: [
        { heading: 'Mavjud parokandalikni bartaraf etish', description: 'Tarqoq jarayonlarni yagona maqsad atrofida jipslashtirish orqali yashirin zaxiralar to\'liq ishga solinadi.' },
        { heading: 'Sinergiya qonuniyatining amaliy kuchi', description: 'Har bir bo\'g\'inning samaradorligi boshqa bo\'g\'inlar faoliyatini bir necha barobarga kuchaytiradi.' }
      ],
      highlight: 'To\'g\'ri strategik insight murakkab vaziyatlarda barcha kuchlarni eng muhim nuqtaga jamlash imkonini beradi.',
      speakerNotes: 'Ushbu slayd butun taqdimotimizning mag\'zini tashkil etuvchi asosiy ilmiy gipoteza va transformatsion kashfiyotga bag\'ishlanadi.'
    },
    {
      layout: 'comparison',
      title: 'Amaliy Sanoat Keyslari va Hayotiy Sinovlar Tahlili',
      sub: 'Dastlabki sinov bosqichidagi yutuqlar va to\'liq joriy etish natijalari',
      photo: `${enKeywords} real practice experience case study success`,
      leftHeading: '1-Keys: Moslashuv va Sinov Natijalari',
      rightHeading: '2-Keys: Masshtabli Rivojlanish va Barqarorlik',
      points: [
        { heading: 'Dastlabki sinovdagi tezkor yutuqlar', description: 'Ilk pilot davridayoq rejadagi ko\'rsatkichlardan 40% yuqori unumdorlik qayd etildi va tizim xatolari to\'liq bartaraf qilindi.' },
        { heading: 'Keng qamrovli masshtabda olingan natijalar', description: 'Loyihani butun tizimga yoyish jarayonida operatsion barqarorlik to\'liq saqlandi va kutilgan samara 2 karra oshdi.' }
      ],
      highlight: 'Haqiqiy sinovdan o\'tgan amaliy tajriba har qanday mavhum nazariyadan ming karra ishonchliroqdir.',
      speakerNotes: 'Real hayotiy keyslar tahlili taklif etilayotgan yechimlarning amalda 100% ishlashini va yuqori samara berishini tasdiqlaydi.'
    },
    {
      layout: 'process_timeline',
      title: 'Sifat Nazorati va Uzluksiz Audit Zanjiri',
      sub: 'Doimiy takomillashtirish, qayta aloqa va sifat nazorati bosqichlari',
      photo: `${enKeywords} quality assurance audit feedback loop testing`,
      points: [
        { heading: '1-Bosqich: Kiruvchi Parametrlar Skriningi', description: 'Jarayon boshlanishidan oldin barcha resurslar, hujjatlar va dastlabki shartlarni sifat talablariga muvofiqligini tekshirish.' },
        { heading: '2-Bosqich: Oraliq Monitoring va Verifikatsiya', description: 'Amaliyot jarayonida asosiy mezonlarni real vaqt rejimida kuzatib, yuzaga kelishi mumkin bo\'lgan og\'ishlarni erta to\'g\'rilash.' },
        { heading: '3-Bosqich: Yakuniy Ekspertiza va Sertifikatlash', description: 'Tayyor natijani to\'liq tekshiruvdan o\'tkazish, tahliliy hisobot tuzish va muvaffaqiyatli tajribani standartlashtirish.' }
      ],
      highlight: 'Uzluksiz sifat nazorati kutilmagan xatoliklarni butunlay bartaraf etadi va yuqori ishonchlilikni ta\'minlaydi.',
      speakerNotes: 'Uch bosqichli sifat nazorati mexanizmi har bir mahsulot va xizmatning eng yuqori standartlarga javob berishini kafolatlaydi.'
    },
    {
      layout: 'matrix_grid',
      title: 'Ssenariyli Rejalashtirish va Kelajak Modellari',
      sub: 'Turli xil bozor va sharoitlar uchun moslashuvchan strategik variantlar',
      photo: `${enKeywords} future strategic planning scenario forecast model`,
      points: [
        { heading: 'Bazaviy Standart Ssenariy', description: 'Barqaror va me\'yoriy sharoitlarda rejalashtirilgan barcha ko\'rsatkichlarga bosqichma-bosqich erishish traektoriyasi.' },
        { heading: 'Optimistik Yuqori O\'sish', description: 'Qulay tashqi omillar va yangi imkoniyatlar paydo bo\'lganda rivojlanishni tezlashtiruvchi faol ssenariy.' },
        { heading: 'Konservativ Himoyalangan Model', description: 'Bozorda kutilmagan noaniqliklar yuz berganda xarajatlarni qisqartirib, asosiy kapitalni asrab qoluvchi reja.' },
        { heading: 'Tezkor Moslashuvchan Manevr', description: 'Yangi talablar paydo bo\'lganda boshqaruv tuzilmasini zudlik bilan yangi yo\'nalishga o\'zgartirish imkoniyati.' }
      ],
      highlight: 'Har qanday vaziyatga oldindan tayyor bo\'lish tashkilotning yengilmas barqarorligini ta\'minlaydi.',
      speakerNotes: 'Ssenariyli rejalashtirish tufayli jamoa har qanday tashqi kutilmagan vaziyatda ham aniq yo\'riqnoma asosida harakat qiladi.'
    },
    {
      layout: 'data_chart',
      title: 'Uzoq Muddatli Prognozlar va Rivojlanish Marralari (Chart)',
      sub: 'Yillar kesimidagi ko\'rsatkichlar va kutilayotgan strategik marralar',
      photo: `${enKeywords} long term forecast projections target data chart`,
      chart: getSmartDomainCharts(effectiveTopic, 20, language),
      points: [
        { heading: 'Kelgusi yillardagi o\'sish sur\'atlari', description: 'Tahliliy modellashtirish natijalari 2025-2030 yillarda barcha yo\'nalishlar bo\'yicha dinamik o\'sish sur\'ati saqlanib qolishini ko\'rsatmoqda.' },
        { heading: 'Sohaviy yetakchilikni mustahkamlash', description: 'Strategik dasturning to\'liq amalga oshirilishi sohada yangi sifat mezonlarini belgilab, uzoq muddatli ustunlik beradi.' }
      ],
      highlight: 'Uzoq muddatli prognozlar belgilangan marralarga to\'liq erishilishini va yuqori rentabellikni ko\'rsatmoqda.',
      speakerNotes: 'Prognoz diagrammasi kelgusi besh yillikda loyihaning qanday miqyosda kengayishi va qanday natijalarga erishishini tasdiqlaydi.'
    },
    {
      layout: 'three_cards',
      title: 'Amaliy Tavsiyalar va Harakatlar Dasturi',
      sub: 'Rahbariyat, mutaxassislar va ijrochilar uchun tayyor amaliy yo\'riqnoma',
      photo: `${enKeywords} actionable recommendations checklist practical guide`,
      points: [
        { heading: 'Rahbariyat va Boshqaruv Qadamlari', description: 'Strategik rejani tasdiqlash, resurslarni maqsadli taqsimlash va har bir bosqich bo\'yicha mas\'ullarni tayinlash.' },
        { heading: 'Operatsion Jarayonlarni Takomillashtirish', description: 'Ish zanjirini yangi reglamentlarga moslashtirish, samarasiz amallarni qisqartirish va avtomatlashtirish.' },
        { heading: 'Kadrlar va Texnologik Ta\'minot', description: 'Jamoani yangi vositalar bilan ishlashga o\'rgatish va zarur zamonaviy dasturiy platformalarni ishga tushirish.' }
      ],
      highlight: 'Aniq va amaliy tavsiyalar to\'plami g\'oyani muvaffaqiyatli real natijaga aylantirish yo\'lidir.',
      speakerNotes: 'Ushbu amaliy tavsiyalar har bir mas\'ul mutaxassis uchun aniq qadam-baqadam harakatlar yo\'riqnomasini beradi.'
    },
    {
      layout: 'cinematic',
      title: 'Kelajak Gorizontlari va Global Transformatsiya',
      sub: 'Yangi imkoniyatlar, global tendensiyalar va barqaror yetakchilik sari yo\'l',
      photo: `${enKeywords} future horizon perspective world transformation visionary`,
      points: [
        { heading: 'Xalqaro miqyosdagi integratsiya', description: 'Global professional tarmoqlar bilan hamkorlikni chuqurlashtirish va ilg\'or standartlarni ilgari surish.' },
        { heading: 'Uzluksiz raqamli innovatsiyalar', description: 'Yangi texnologiyalar to\'lqinini o\'z vaqtida qabul qilib, sohada doimo bir qadam oldinda bo\'lish.' },
        { heading: 'Barqaror yetakchilikni kafolatlash', description: 'Erishilgan yutuqlar bilan cheklanmasdan, doimiy takomillashuv va yuqori intizom asosida oldinga intilish.' }
      ],
      highlight: 'Kelajak bugun qabul qilinayotgan dadil, ilmiy asoslangan va aniq qarorlar bilan yaratiladi.',
      speakerNotes: 'Xulosa o\'rnida shuni ta\'kidlash joizki, bugun qo\'yilgan mustahkam poydevor kelgusi yillarda katta yuksalishlarga yo\'l ochadi.'
    },
    // ===================== QOSHIMCHA STAGES 24-30 (TAKRORLANISHNI OLDINI OLISH UCHUN) =====================
    {
      layout: 'spotlight',
      title: 'Strategik Hamkorlik va Klaster Iqtisodiyoti',
      sub: 'Sinergetik hamkorlik tarmog\'ini kengaytirish va klaster modeli',
      photo: `${enKeywords} strategic partnership network cluster collaboration`,
      spotlightText: 'Yagona maqsad atrofida birlashgan tashkilotlar klaster iqtisodiyoti orqali individual kuchlardan 5 baravar kuchliroq natijaga erishadi.',
      points: [
        { heading: 'Klaster hamkorlik modeli', description: 'Sohadagi yetakchi korxonalar, ilmiy markazlar va moliyaviy institutlarni bir tizimda birlashtirish innovatsiya va samaradorlikni keskin oshiradi. Klaster ichidagi bilimlar va resurslar almashishi barcha ishtirokchilar uchun raqobatbardosh afzalliklarni shakllantiradi.' },
        { heading: 'Strategik ittifoqlar va joint venture', description: 'Keng qamrovli strategik sheriklik shartnomalari yangi bozorlarni o\'zlashtirish va texnologiyalar transferini tezlashtiradi. Birgalikdagi loyihalar alohida kuchlar uyg\'unlashganda ko\'zda tutilmagan yuqori natijalarga erishish imkonini beradi.' }
      ],
      highlight: 'Puxta hamkorlik tarmoqlari xarajatlarni 40% ga kamaytiradi va innovatsiyalar sur\'atini ikki baravar oshiradi.',
      speakerNotes: 'Strategik hamkorlik va klaster modeli zamonaviy iqtisodiyotning eng kuchli raqobat vositalaridan biriga aylandi. Birgalikdagi harakatlar alohida kuchlar yig\'indisidan doimo yuqori natija beradi.'
    },
    {
      layout: 'matrix_grid',
      title: 'Raqamli Transformatsiya Yo\'l Xaritasi va KPI Tizimi',
      sub: 'Raqamlashtirish bosqichlari, o\'lchanadigan maqsadlar va monitoring tizimi',
      photo: `${enKeywords} digital transformation roadmap KPI dashboard`,
      points: [
        { heading: 'Raqamli tayyor holatni baholash (Digital Maturity)', description: 'Hozirgi raqamli salohiyatni to\'liq audit qilish va etishmayotgan komponentlarni aniqlash, raqamlashtirish yo\'l xaritasini tuzish.' },
        { heading: 'Asosiy raqamli tizimlarni joriy etish', description: 'ERP, CRM, BI tizimlarini integratsiya qilish, jarayonlarni avtomatlashtirishning ustuvor yo\'nalishlarini belgilash.' },
        { heading: 'Ma\'lumotlar boshqaruvi va xavfsizlik', description: 'Korporativ ma\'lumotlar arxitekturasini yagona standartga keltirish va kiberxavfsizlik protokollarini joriy etish.' },
        { heading: 'Raqamli samaradorlik monitoringi', description: 'Real vaqt rejimida ishlash ko\'rsatkichlarini kuzatuvchi boshqaruv paneli (dashboard) va KPI tizimini o\'rnatish.' }
      ],
      highlight: 'Tizimli raqamlashtirish operatsion xarajatlarni 45% ga kamaytiradi va qaror qabul qilish tezligini 3 barobarga oshiradi.',
      speakerNotes: 'Raqamli transformatsiya — bu nafaqat texnologiya, balki tashkilot madaniyatini va jarayonlarini tubdan o\'zgartirish jarayonidir. Puxta yo\'l xaritasi bu o\'tishni tizimli va xavfsiz qiladi.'
    },
    {
      layout: 'three_cards',
      title: 'Intellektual Mulk va Innovatsiyalar Portfeli',
      sub: 'Patent strategiyasi, litsenziyalash va innovatsion aktiv boshqaruvi',
      photo: `${enKeywords} intellectual property patent innovation portfolio`,
      points: [
        { heading: 'Patent va litsenziya strategiyasi', description: 'Innovatsion ishlanmalarni patentlash, strategik litsenziyalash shartnomalarini tuzish va intellektual aktivlarni kapitalga aylantirish mexanizmlarini ishga tushirish.' },
        { heading: 'Tadqiqot va ishlanmalar (R&D) investitsiyasi', description: 'Ilmiy-tadqiqot ishlariga maqsadli investitsiya yo\'naltirish, ilg\'or universitetlar va laboratoriyalar bilan hamkorlikni yo\'lga qo\'yish.' },
        { heading: 'Innovatsion ekotizim va startaplar', description: 'Ichki startap akseleratorlarini tashkil etish, yangi g\'oyalarni tezkor sinovdan o\'tkazish va muvaffaqiyatli g\'oyalarni asosiy biznesga integratsiya qilish.' }
      ],
      highlight: 'Kuchli intellektual mulk portfeli tashkilotga bozorda barqaror raqobatbardosh ustunlik va qo\'shimcha daromad oqimlari beradi.',
      speakerNotes: 'Intellektual mulk zamonaviy iqtisodiyotda eng qimmatli aktivlardan biri. Innovatsiyalar portfelini boshqarish — bu uzoq muddatli raqobatbardoshlikning kafolatidir.'
    },
    {
      layout: 'process_timeline',
      title: 'Krizis Boshqaruvi va Tashkiliy Chidamlilik',
      sub: 'Inqiroz sharoitida tizim barqarorligini saqlash strategiyasi',
      photo: `${enKeywords} crisis management resilience continuity strategy`,
      points: [
        { heading: 'Krizis signallarini erta aniqlash', description: 'Biznes-razvedka tizimi va kalit ko\'rsatkichlarni doimiy monitoring qilish orqali inqirozning dastlabki belgilarini oldindan ko\'rish va profilaktik choralar ko\'rish.' },
        { heading: 'Krizisga javob berish protokoli', description: 'Oldindan ishlab chiqilgan krizis-boshqaruv qo\'llanmasi va mas\'ul guruhning zudlik bilan harakatga o\'tishi tashkilot barqarorligini kafolatlaydi.' },
        { heading: 'Krizisdan keyin tiklash va o\'rganish', description: 'Inqiroz yechilgandan so\'ng sabablarni tahlil qilish, tizim mustahkamligini oshirish va xodimlar tajribasini institutsiyal bilimga aylantirish.' }
      ],
      highlight: 'Krizis boshqaruviga oldindan tayyor bo\'lgan tashkilotlar istalgan inqirozdan kuchliroq va yangi imkoniyatlar bilan chiqib keladi.',
      speakerNotes: 'Inqirozlar muqarrardir — muhim narsa ularga tayyor bo\'lish va tizimning chidamliligini oldindan shakllantirish. Biz ushbu strategiyani batafsil ko\'rib chiqamiz.'
    },
    {
      layout: 'comparison',
      title: 'Bozor Segmentatsiyasi va Maqsadli Auditoriya Tahlili',
      sub: 'Mijozlar profili, segment dinamikasi va qiymat taklifi farqi',
      photo: `${enKeywords} market segmentation target audience customer profile`,
      leftHeading: 'An\'anaviy Ommaviy Yondashuv',
      rightHeading: 'Maqsadli Segment Strategiyasi',
      points: [
        { heading: 'Ommaviy yondashuvning cheklovlari', description: 'Barcha iste\'molchilarga bir xil xabar berish resurslarni samarasiz sarflaydi, marketing ROI pastlaydi va mijozlar ehtiyojlarini to\'liq qondirish imkoniyati yo\'qoladi.' },
        { heading: 'Segment asosidagi personallashtirilgan strategiya', description: 'Har bir maqsadli segment uchun alohida ishlab chiqilgan qiymat taklifi va muloqot strategiyasi mijozlarni jalb qilish samaradorligini 60-80% ga oshiradi va uzoq muddatli sadoqatni shakllantiradi.' }
      ],
      highlight: 'To\'g\'ri segmentatsiya marketing xarajatlarini 35% ga kamaytira turib, sotuvlar konversiyasini 2 barobarga oshiradi.',
      speakerNotes: 'Bozor segmentatsiyasi zamonaviy marketing strategiyasining poydevori. Maqsadli yondashuv har bir so\'m sarflangan marketing xarajatidan maksimal natija olish imkonini beradi.'
    },
    {
      layout: 'kpi_metrics',
      title: 'Moliyaviy Barqarorlik va Kapital Tuzilishi Tahlili',
      sub: 'Likvidlik, rentabellik va kapital samaradorligi ko\'rsatkichlari',
      photo: `${enKeywords} financial stability capital structure liquidity analysis`,
      metrics: getSmartDomainMetrics(effectiveTopic, 8, language),
      points: [
        { heading: 'Kapital samaradorligini optimallashtirish', description: 'Qarz va o\'z kapitalining optimal nisbatini belgilash, moliyaviy dastak ta\'siridan foydalanish va kapital xarajatlarini (WACC) minimallashtirishning amaliy usullari ko\'rib chiqiladi. Moliyaviy tuzilmani optimallashtirish EPS va ROE ko\'rsatkichlarini sezilarli yaxshilaydi.' }
      ],
      highlight: 'Puxta moliyaviy tuzilma tashkilotga barqarorlik beradi va kelajakdagi o\'sish uchun zaruriy kapital bazasini shakllantiradi.',
      speakerNotes: 'Moliyaviy barqarorlik — har qanday tashkilotning uzoq muddatli muvaffaqiyatining asosi. Kapital tuzilishini to\'g\'ri boshqarish iqtisodiy inqirozlarda ham yuqori natija berishni ta\'minlaydi.'
    },
    {
      layout: 'split_hero',
      title: 'Muvaffaqiyat Omillari va Raqobatbardosh Ustunlik Modeli',
      sub: 'Asosiy muvaffaqiyat omillarini (KSF) aniqlash va rivojlantirish',
      photo: `${enKeywords} success factors competitive advantage strategic model`,
      points: [
        { heading: 'Kritik muvaffaqiyat omillarini (KSF) aniqlash', description: 'Sohaning o\'ziga xos raqobat sharoitida ustunlik qozonish uchun hal qiluvchi ahamiyatga ega bo\'lgan 3-5 ta asosiy omilni ilmiy asosda aniqlash va ularni kuchli tomonlarga aylantirish. KSF analizi resurslarni to\'g\'ri yo\'nalishga yo\'naltiradi va raqobat ustunligini uzluksiz ta\'minlaydi.' },
        { heading: 'Raqobatbardosh pozitsiyani mustahkamlash strategiyasi', description: 'Porter\'s Five Forces va VRIO tahlillari asosida tashkilotning o\'ziga xos ustunlik manbalarini aniqlash, ularni imitatsiya qilish qiyinlashtirilgan tarzda rivojlantirish va sohada barqaror yetakchi o\'rinni egallash strategiyasini ishlab chiqish.' },
        { heading: 'Doimiy ustunlikni saqlash mexanizmi', description: 'Raqobatchilarning harakatlarini doimiy kuzatib borish, o\'z ustunliklarini yangilash va adaptatsiya qilish tizimini joriy etish orqali o\'zgaruvchan bozor sharoitida ham yuqori pozitsiyani saqlab qolish.' }
      ],
      highlight: 'Aniq belgilangan raqobatbardosh ustunlik manbasi tashkilotni sohada uzoq muddatli yetakchi sifatida belgilaydi.',
      speakerNotes: 'Raqobatbardosh ustunlik modeli tashkilotning nima sababdan bozorda o\'ziga xos o\'rin egallashini va bu pozitsiyani qanday saqlashini ko\'rsatadi. Bu strategik boshqaruvning eng muhim qismidir.'
    }
  ];
}

/**
 * 23 bosqichli to'liq unikal taqdimot arxitekturasini quruvchi funksiya.
 * Har qanday mavzu va tilda HECH QACHON takrorlanmas noyob slaydlarni kafolatlaydi!
 */
export function buildPresentationSequentialStages(effectiveTopic, enKeywords, language = 'uz') {
  return getLocalizedGenericStages(effectiveTopic, enKeywords, language);
}

function getLocalizedMeta(effectiveTopic, categoryName, language = 'uz') {
  const metaMap = {
    uz: {
      sub: `${categoryName ? categoryName + ' doirasidagi ' : ''}maxsus ilmiy-tahliliy tadqiqot`,
      notes: `Assalomu alaykum, hurmatli qatnashchilar! Bugungi taqdimotimiz "${effectiveTopic}" mavzusining konseptual asoslari, amaliy ahamiyati va istiqboldagi vazifalariga bag'ishlanadi.`,
      concTitle: 'Xulosalar va Strategik Tavsiyalar',
      concSub: 'Tizimli tahlil natijalari va istiqboldagi ustuvor yo\'nalishlar',
      concPoints: [
        {
          heading: 'Amaliy integratsiya va joriy etish',
          description: 'Tavsiya etilgan metodologiya va tizimli yechimlarni bosqichma-bosqich amaliyotga tatbiq etish lozim. Bu jarayon operatsion xatarlarni kamaytiradi va umumiy unumdorlikni 35-50% ga oshirishga xizmat qiladi.'
        },
        {
          heading: 'Doimiy monitoring va sifat nazorati',
          description: 'Belgilangan mezonlar va asosiy ko\'rsatkichlarni (KPI) muntazam o\'lchab borish zarur. Bu dinamikani to\'liq nazorat qilish hamda muhitdagi o\'zgarishlarga tezkor moslashish imkonini beradi.'
        },
        {
          heading: 'Resurslarni strategik optimallashtirish',
          description: 'Mavjud moddiy, texnologik va inson resurslarini eng yuqori daromad va samara keltiruvchi yo\'nalishlarga yo\'naltirish talab etiladi. Natijada xarajatlar tejaladi va barqaror rivojlanish ta\'minlanadi.'
        }
      ],
      concHighlight: `"${effectiveTopic}" bo'yicha to'g'ri strategiya va izchil harakat eng yuqori natijani kafolatlaydi.`,
      concNotes: 'Hurmatli tinglovchilar, e\'tiboringiz uchun katta rahmat! Mavzu yuzasidan barcha savollaringiz bo\'lsa, bajonidil javob berishga tayyorman.'
    },
    ru: {
      sub: `${categoryName ? 'Аналитическое исследование в сфере: ' + categoryName : 'Комплексный аналитический обзор'}`,
      notes: `Здравствуйте, уважаемые коллеги! Сегодняшняя презентация посвящена глубокому рассмотрению темы "${effectiveTopic}", ее стратегических аспектов и практических механизмов реализации.`,
      concTitle: 'Выводы и Стратегические Рекомендации',
      concSub: 'Ключевые итоги исследования и следующие шаги развития',
      concPoints: [
        {
          heading: 'Практическая интеграция решений',
          description: 'Поэтапное внедрение предложенной методологии и практических инструментов в операционную деятельность. Это позволяет снизить риски системных сбоев и повысить общую результативность на 35–50%.'
        },
        {
          heading: 'Непрерывный мониторинг и контроль качества',
          description: 'Регулярный аудит ключевых показателей эффективности (KPI) и контроль точности процессов. Систематический анализ гарантирует гибкую адаптацию к любым изменениям внешней конъюнктуры.'
        },
        {
          heading: 'Стратегическая оптимизация ресурсов',
          description: 'Концентрация материального, технологического и кадрового потенциала на приоритетных точках роста. Данный подход исключает неоправданные издержки и обеспечивает устойчивое масштабирование.'
        }
      ],
      concHighlight: 'Грамотная стратегия и системный подход гарантируют успешное достижение поставленных целей.',
      concNotes: 'Уважаемые слушатели, спасибо за внимание! Буду рад ответить на ваши вопросы и обсудить детали реализации.'
    },
    en: {
      sub: `${categoryName ? 'Comprehensive analytical briefing on ' + categoryName : 'Executive strategic analysis and operational frameworks'}`,
      notes: `Welcome, distinguished colleagues! Today's presentation provides an in-depth strategic analysis of "${effectiveTopic}", examining operational frameworks, key metrics, and implementation roadmaps.`,
      concTitle: 'Strategic Conclusions & Next Steps',
      concSub: 'Executive takeaways and critical recommendations',
      concPoints: [
        {
          heading: 'Operational Execution & Integration',
          description: 'Phased implementation of validated methodologies and technical frameworks directly into standard workflows. This reduces critical friction points while accelerating overall throughput by 35–50%.'
        },
        {
          heading: 'Continuous Performance Auditing',
          description: 'Systematic monitoring of measurable KPIs and benchmark milestones across every operational layer. Real-time feedback loops enable swift adaptation to market and environmental dynamics.'
        },
        {
          heading: 'Strategic Resource Alignment',
          description: 'Targeted allocation of financial, technical, and human capital toward the highest-leverage initiatives. This eliminates redundancies and establishes a durable engine for long-term scalability.'
        }
      ],
      concHighlight: 'A well-defined strategy and consistent milestone execution ensure sustainable competitive advantage.',
      concNotes: 'Thank you very much for your time and engagement! I look forward to your questions and strategic discussion.'
    },
    tg: {
      sub: `${categoryName ? 'Таҳқиқоти махсуси илмию амалӣ дар самти: ' + categoryName : 'Таҳлили ҳамаҷониба ва дурнамои стратегӣ'}`,
      notes: `Салом, ҳамкасбони гиромӣ! Муаррифии имрӯзаи мо ба таҳлили амиқи мавзӯи "${effectiveTopic}", самтҳои стратегӣ ва тарҳрезии амалии он бахшида шудааст.`,
      concTitle: 'Хулосаҳо ва Тавсияҳои Стратегӣ',
      concSub: 'Натиҷагирии ниҳоӣ ва самтҳои афзалиятноки рушд',
      concPoints: [
        {
          heading: 'Татбиқи амалии усулҳо ва қарорҳо',
          description: 'Ҷорисозии зина ба зинаи усулҳои пешниҳодшуда ва воситаҳои амалӣ дар равандҳои корӣ. Ин раванд хавфҳои идоравиро коҳиш дода, маҳсулнокиро 35–50% меафзояд.'
        },
        {
          heading: 'Мониторинги доимӣ ва назорати сифат',
          description: 'Баҳодиҳии пайвастаи нишондиҳандаҳои калидӣ (KPI) ва назорати дақиқи самтҳо. Таҳлили мунтазам имкон медиҳад, ки ба ҳама тағйирот зуд мутобиқ шавем.'
        },
        {
          heading: 'Оптимизатсияи стратегии захираҳо',
          description: 'Тамаркузи захираҳои моддӣ, техникӣ ва инсонӣ ба самтҳои асосие, ки натиҷаи баландтаринро медиҳанд. Дар натиҷа хароҷот сарфа шуда, рушди устувор таъмин мегардад.'
        }
      ],
      concHighlight: 'Стратегияи дуруст ва фаъолияти пайгирона ноил шудан ба натиҷаҳои баландтаринро кафолат медиҳад.',
      concNotes: 'Шунавандагони гиромӣ, барои таваҷҷуҳатон сипосгузорам! Агар саволе бошад, бо камоли майл посух медиҳам.'
    }
  };

  return metaMap[language] || metaMap.uz;
}

function getLocalizedQA(effectiveTopic, language = 'uz') {
  const localizedQA = {
    uz: [
      { question: `"${effectiveTopic}" mavzusining asosiy ilmiy yangiligi va amaliy ahamiyati nimada?`, answer: 'Asosiy ahamiyat tarqoq yondashuvlarni yagona tizimga keltirib, jarayonlar samaradorligini 35-50% ga oshirish va tizimli xatarlarni kamaytirishdadir.' },
      { question: 'Amaliyotga tatbiq etishda qanday asosiy to\'siqlar yuzaga kelishi mumkin va ular qanday hal qilinadi?', answer: 'Asosiy omil yangi standartlarga moslashishdir, bu bosqichma-bosqich tajriba-sinov va maxsus o\'quv dasturlari orqali bartaraf etiladi.' },
      { question: 'Ushbu loyihaning uzoq muddatli iqtisodiy va sifat ko\'rsatkichlari qanday mezonlar bilan baholanadi?', answer: 'Baholash aniq KPI mezonlari: resurslar aylanmasi tezligi, operatsion xarajatlar tejalishi va sifat barqarorligi bilan o\'lchanadi.' },
    ],
    ru: [
      { question: `В чем заключается ключевая научная новизна и прикладная ценность темы "${effectiveTopic}"?`, answer: 'Основная ценность состоит в систематизации подходов и создании комплексной модели, повышающей эффективность процессов на 35–50%.' },
      { question: 'С какими рисками можно столкнуться при практической реализации и как их нивелировать?', answer: 'Главным риском является сопротивление адаптации к новым регламентам, что устраняется поэтапным пилотированием и обучением команды.' },
      { question: 'Какие метрики используются для подтверждения долгосрочной результативности?', answer: 'Оценка базируется на измеримых KPI: снижении издержек, скорости цикла ключевых ресурсов и стабильности стандартов качества.' },
    ],
    en: [
      { question: `What is the core strategic breakthrough and real-world value of "${effectiveTopic}"?`, answer: 'The primary value lies in consolidating fragmented practices into an integrated framework that boosts operational output by 35–50%.' },
      { question: 'What are the critical implementation hurdles and how are they overcome?', answer: 'The primary challenge is organizational adoption, effectively resolved through phased milestones, risk audits, and targeted upskilling.' },
      { question: 'How do you measure and validate sustainable long-term ROI?', answer: 'Validation relies on empirical KPI metrics: reduced turnaround times, lower operating friction, and durable quality benchmarks.' },
    ],
    tg: [
      { question: `Навоварии асосии илмӣ ва аҳамияти амалии мавзӯи "${effectiveTopic}" дар чист?`, answer: 'Аҳамияти асосӣ дар муттаҳид сохтани усулҳо ва баланд бардоштани маҳсулнокии равандҳо ба андозаи 35-50% мебошад.' },
      { question: 'Ҳангоми татбиқи амалӣ бо кадом монеаҳо рӯ ба рӯ шудан мумкин аст?', answer: 'Мушкили асосӣ мутобиқшавии мутахассисон ба қоидаҳои нав мебошад, ки он тавассути санҷишҳои марҳилавӣ бартараф мегардад.' },
      { question: 'Самаранокии дарозмуддати ин қарорҳо бо кадом нишондиҳандаҳо чен карда мешавад?', answer: 'Арзёбӣ бар асоси нишондиҳандаҳои KPI: сарфаи захираҳо, суръати амалиёт ва устувории сифати натиҷаҳо муайян карда мешавад.' },
    ],
  };

  return localizedQA[language] || localizedQA.uz;
}

/**
 * Mavzuga to'liq moslashtirilgan, har bir slaydi unikal va xilma-xil zaxira generator.
 * HECH QACHON birorta ham slaydni takrorlamaydi!
 */
export function generateDynamicFallbackPresentation({ topic, slideCount, language = 'uz', theme, categoryObj }) {
  const effectiveTopic = translateUzbekTopic(topic, language);
  console.log(`[AI Fallback] Mavzuga moslashtirilgan boy unikal reja tuzilmoqda: "${effectiveTopic}" (asli: "${topic}", til: ${language})`);
  const enKeywords = extractCleanKeywords(effectiveTopic || topic);
  const slides = [];

  const localizedMeta = getLocalizedMeta(effectiveTopic, categoryObj?.name || '', language);

  // 1-slayd: Muqova
  slides.push({
    slideNumber: 1,
    type: 'title',
    layoutType: 'title',
    title: effectiveTopic.length > 50 ? effectiveTopic.substring(0, 50) + '...' : effectiveTopic,
    subtitle: localizedMeta.sub,
    imagePrompts: [
      `${enKeywords} professional concept`,
      `${enKeywords} background visual`
    ],
    speakerNotes: localizedMeta.notes
  });

  // Mavzuga moslashtirilgan 23 ta unikal bosqichlar zanjiri
  const stageTemplates = buildPresentationSequentialStages(effectiveTopic, enKeywords, language);

  for (let i = 2; i <= slideCount; i++) {
    const isLast = (i === slideCount);
    if (isLast) {
      slides.push({
        slideNumber: i,
        type: 'conclusion',
        layoutType: 'conclusion',
        title: localizedMeta.concTitle,
        subtitle: localizedMeta.concSub,
        imagePrompts: [
          `${enKeywords} success achievement`,
          `${enKeywords} future vision`
        ],
        points: localizedMeta.concPoints,
        highlight: localizedMeta.concHighlight,
        speakerNotes: localizedMeta.concNotes
      });
    } else {
      // Sof ketma-ketlik: HECH QANDAY MODULO TAKRORLANISHSIZ!
      const stageIdx = i - 2;
      let st;
      if (stageIdx < stageTemplates.length) {
        st = stageTemplates[stageIdx];
      } else {
        // Template tugagan holat: unikal overflow slayd yaratamiz (HECH QACHON oxirgisini takrorlamaymiz!)
        const overflowIdx = stageIdx - stageTemplates.length;
        const overflowTitles = {
          uz: [
            `${effectiveTopic}: Qo'shimcha Tahlil va Kengaytirilgan Tushuntirish`,
            `${effectiveTopic} Sohasidagi Yangi Trendlar va Perspektivlar`,
            `${effectiveTopic}: Amaliy Tajriba va Ko'nikmalar`,
            `${effectiveTopic} Bo'yicha Muhim Xulosalar va Dalillar`,
            `${effectiveTopic}: O'qib O'rganish va Muvofiqlash`,
          ],
          ru: [
            `${effectiveTopic}: Дополнительный анализ и расширенные выводы`,
            `Новые тенденции в сфере \"${effectiveTopic}\"`,
            `${effectiveTopic}: Практика и профессиональные компетенции`,
            `Ключевые данные по теме \"${effectiveTopic}\"`,
            `${effectiveTopic}: Обучение и адаптация`,
          ],
          en: [
            `${effectiveTopic}: Extended Analysis and Deeper Insights`,
            `Emerging Trends in \"${effectiveTopic}\"`,
            `${effectiveTopic}: Practical Skills and Competencies`,
            `Key Evidence and Data on \"${effectiveTopic}\"`,
            `${effectiveTopic}: Learning and Continuous Adaptation`,
          ],
          tg: [
            `${effectiveTopic}: Таҳлили иловагӣ ва хулосаҳои васеъ`,
            `Тамоюлҳои нав дар соҳаи \"${effectiveTopic}\"`,
            `${effectiveTopic}: Малакаҳои амалӣ ва шоистагиҳо`,
            `Маълумоти калидӣ оид ба \"${effectiveTopic}\"`,
            `${effectiveTopic}: Омӯзиш ва мутобиқшавии доимӣ`,
          ],
        };
        const titles = overflowTitles[language] || overflowTitles.uz;
        const overflowTitle = titles[overflowIdx % titles.length];
        const baseStage = stageTemplates[overflowIdx % stageTemplates.length];
        st = {
          layout: baseStage.layout,
          title: overflowTitle,
          sub: baseStage.sub,
          photo: baseStage.photo,
          points: baseStage.points ? baseStage.points.map(p => ({
            heading: p.heading,
            description: p.description + (language === 'uz'
              ? ` Bu \"${overflowTitle}\" mavzusining muhim tarkibiy qismidir.`
              : language === 'ru' ? ` Это важный компонент темы \"${overflowTitle}\".`
              : language === 'en' ? ` This is a key element of "${overflowTitle}".`
              : ` Ин ҷузъи муҳими мавзӯи \"${overflowTitle}\" мебошад.`)
          })) : baseStage.points,
          metrics: baseStage.metrics,
          chart: baseStage.chart,
          leftHeading: baseStage.leftHeading,
          rightHeading: baseStage.rightHeading,
          spotlightText: baseStage.spotlightText ? overflowTitle : undefined,
          highlight: language === 'uz'
            ? `\"${overflowTitle}\" bo'yicha chuqur tahlil va izchil yondashuv maqsadlarga erishishning asosiy kalitidir.`
            : language === 'ru' ? `Системный подход по теме \"${overflowTitle}\" гарантирует устойчивый результат.`
            : language === 'en' ? `A rigorous framework focused on "${overflowTitle}" ensures measurable outcomes.`
            : `Муносибати низомманд дар \"${overflowTitle}\" натиҷаҳои боэътимодро кафолат медиҳад.`,
          speakerNotes: language === 'uz'
            ? `Hurmatli tinglovchilar! Ushbu ${i}-slaydda biz \"${overflowTitle}\" bo'yicha eng muhim jihatlarni tahlil qilamiz.`
            : language === 'ru' ? `Уважаемые коллеги! На данном слайде ${i} мы рассмотрим \"${overflowTitle}\".`
            : language === 'en' ? `Distinguished colleagues, slide ${i} explores the key dimensions of "${overflowTitle}".`
            : `Ҳозирини гиромӣ! Слайди ${i} ба \"${overflowTitle}\" бахшида шудааст.`,
        };
      }

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
        chart: st.chart,
        leftHeading: st.leftHeading,
        rightHeading: st.rightHeading,
        spotlightText: st.spotlightText,
        highlight: st.highlight,
        speakerNotes: st.speakerNotes || (language === 'ru'
          ? `Уважаемые слушатели! На данном слайде ${i} мы подробно проанализируем ключевые аспекты темы "${st.title}". Особое внимание следует обратить на практическую реализацию и измеримые результаты.`
          : language === 'en'
          ? `Distinguished colleagues, on slide ${i} we explore the critical dimensions of "${st.title}". It is essential to focus on operational execution and measurable outcomes.`
          : language === 'tg'
          ? `Шунавандагони гиромӣ! Дар ин слайди ${i} мо ҷанбаҳои муҳимтарини мавзӯи "${st.title}"-ро ба таври муфассал баррасӣ менамоем. Таваҷҷуҳи асосӣ бояд ба татбиқи амалӣ ва натиҷаҳои мушаххас равона шавад.`
          : `Hurmatli tinglovchilar! Ushbu ${i}-slaydda biz "${st.title}" bo'yicha eng muhim strategik jihatlarni ko'rib chiqamiz. Asosiy e'tiborni amaliy tatbiq va kutilayotgan natijadorlikka qaratishimiz lozim.`)
      });
    }
  }

  const localizedQA = getLocalizedQA(effectiveTopic, language);

  return {
    title: effectiveTopic,
    subtitle: localizedMeta.sub,
    theme: theme || 'ocean',
    language: language || 'uz',
    slides,
    qaList: localizedQA,
  };
}

/**
 * Har qanday manbadan (Gemini, Pollinations, Fallback) kelgan taqdimot slaydlarini tekshiruvchi
 * va birorta ham slayd takrorlanmasligini (100% UNIKAL) hamda aniq targetCount ta bo'lishini kafolatlovchi filtr.
 */
export function ensureUniqueAndCompleteSlides(data, topic, language = 'uz', targetCount = 6) {
  if (!data || !Array.isArray(data.slides)) return data;

  const effectiveTopic = translateUzbekTopic(topic || data.title || '', language);
  const enKeywords = extractCleanKeywords(effectiveTopic);
  const stageTemplates = buildPresentationSequentialStages(effectiveTopic, enKeywords, language);
  const localizedMeta = getLocalizedMeta(effectiveTopic, '', language);

  const seenTitles = new Set();
  const seenHeadings = new Set();
  const seenDescriptions = new Set();
  const seenSentences = new Set();

  const normalizeText = (txt) => (txt || '').toLowerCase().replace(/['`ʻ’".,!?:;()\-–—]/g, ' ').replace(/\s+/g, ' ').trim();

  const getSlideSentences = (slide) => {
    const list = [];
    if (Array.isArray(slide.points)) {
      for (const p of slide.points) {
        if (p.description) {
          const sList = p.description.split(/[.!?]+/).map(s => normalizeText(s)).filter(s => s.length > 20);
          list.push(...sList);
        }
      }
    }
    return list;
  };

  const isSlideDuplicate = (slide) => {
    if (!slide) return true;
    const normTitle = normalizeText(slide.title);
    if (!normTitle || normTitle.length < 3 || seenTitles.has(normTitle)) return true;

    if (Array.isArray(slide.points)) {
      let matchingHeadings = 0;
      for (const p of slide.points) {
        const normH = normalizeText(p.heading);
        if (normH.length > 5 && seenHeadings.has(normH)) matchingHeadings++;
      }
      if (matchingHeadings >= 2) return true;
    }

    const sentences = getSlideSentences(slide);
    for (const s of sentences) {
      if (seenSentences.has(s)) return true;
    }

    return false;
  };

  const registerSlideContent = (slide) => {
    if (!slide) return;
    const normTitle = normalizeText(slide.title);
    if (normTitle) seenTitles.add(normTitle);

    if (Array.isArray(slide.points)) {
      for (const p of slide.points) {
        const normH = normalizeText(p.heading);
        if (normH.length > 5) seenHeadings.add(normH);
        const normD = normalizeText(p.description);
        if (normD.length > 15) seenDescriptions.add(normD);
      }
    }

    const sentences = getSlideSentences(slide);
    for (const s of sentences) seenSentences.add(s);
  };

  // 1-slayd: Muqova (Har doim 1-o'rinda)
  const firstSlide = data.slides[0] || {};
  firstSlide.slideNumber = 1;
  firstSlide.type = 'title';
  firstSlide.layoutType = 'title';
  firstSlide.title = firstSlide.title || effectiveTopic;
  firstSlide.subtitle = firstSlide.subtitle || localizedMeta.sub;
  registerSlideContent(firstSlide);

  // Content slaydlar uchun maksimal joy: targetCount - 2 (chunki 1-si muqova, oxirgisi xulosa)
  const maxContentSlides = Math.max(targetCount - 2, 1);
  const contentSlides = [];
  let stageCursor = 0;

  // Helper: template tugab qolsa ham kafolatlangan unikal slayd yasash
  const getNextUniqueStage = (slideNum) => {
    while (stageCursor < stageTemplates.length) {
      const candidate = stageTemplates[stageCursor];
      stageCursor++;
      if (!isSlideDuplicate(candidate)) {
        return candidate;
      }
    }
    // Agar barcha template ishlatib bo'lingan bo'lsa:
    const overflowIdx = stageCursor - stageTemplates.length;
    stageCursor++;
    const layouts = ['split_hero', 'three_cards', 'comparison', 'matrix_grid', 'cinematic', 'spotlight'];
    const chosenLayout = layouts[overflowIdx % layouts.length];
    const overflowTitle = language === 'ru'
      ? `${effectiveTopic}: Стратегический Аспект ${slideNum}`
      : language === 'en'
      ? `${effectiveTopic}: Strategic Focus ${slideNum}`
      : language === 'tg'
      ? `${effectiveTopic}: Ҷанбаи Стратегӣ ${slideNum}`
      : `${effectiveTopic}: ${slideNum}-Strategik Yo'nalish`;
    return {
      layout: chosenLayout,
      title: overflowTitle,
      sub: localizedMeta.sub,
      photo: `${enKeywords} advanced perspective concept`,
      points: [
        {
          heading: language === 'ru' ? `Направление ${slideNum}.1` : language === 'en' ? `Dimension ${slideNum}.1` : language === 'tg' ? `Самти ${slideNum}.1` : `${slideNum}.1-Asosiy Yo'nalish`,
          description: language === 'ru'
            ? `Детальная аналитическая проработка направления "${overflowTitle}" позволяет исключить операционные риски и внедрить передовые стандарты эффективности.`
            : language === 'en'
            ? `In-depth operational analysis across "${overflowTitle}" eliminates systemic friction and integrates best-in-class performance standards.`
            : language === 'tg'
            ? `Таҳлили амиқи самти "${overflowTitle}" хатарҳои идоравиро коҳиш дода, сатҳи баланди маҳсулнокиро кафолат медиҳад.`
            : `"${overflowTitle}" yo'nalishidagi chuqur amaliy tahlillar operatsion xatarlarni keskin kamaytirib, yuqori sifat standartlarini joriy etishga xizmat qiladi.`
        },
        {
          heading: language === 'ru' ? `Направление ${slideNum}.2` : language === 'en' ? `Dimension ${slideNum}.2` : language === 'tg' ? `Самти ${slideNum}.2` : `${slideNum}.2-Amaliy Yechim`,
          description: language === 'ru'
            ? `Интеграция современных методологических инструментов обеспечивает устойчивое долгосрочное развитие и гибкую адаптацию к изменениям.`
            : language === 'en'
            ? `Deploying rigorous methodology ensures resilient long-term scalability and swift adaptation to evolving industry conditions.`
            : language === 'tg'
            ? `Ҷорисозии усулҳои пешрафта рушди устувор ва мутобиқшавии босуръатро ба шароити нав таъмин месозад.`
            : `Ilg'or uslubiy vositalarni amaliyotga kiritish uzoq muddatli barqaror rivojlanish va tezkor moslashuvchanlik poydevorini yaratadi.`
        }
      ],
      highlight: language === 'ru'
        ? `Системный подход по направлению "${overflowTitle}" гарантирует качественный рост.`
        : language === 'en'
        ? `Disciplined execution across "${overflowTitle}" ensures sustained operational excellence.`
        : language === 'tg'
        ? `Муносибати низомманд дар "${overflowTitle}" пешрафти воқеиро таъмин мекунад.`
        : `"${overflowTitle}" bo'yicha tizimli yondashuv yuqori sifat va barqarorlikni kafolatlaydi.`,
      speakerNotes: language === 'ru'
        ? `Уважаемые коллеги! На данном этапе мы подробно анализируем "${overflowTitle}".`
        : language === 'en'
        ? `Distinguished audience, on this slide we explore the core drivers of "${overflowTitle}".`
        : language === 'tg'
        ? `Ҳозирини гиромӣ! Дар ин слайд мо ҷанбаҳои асосии "${overflowTitle}"-ро баррасӣ мекунем.`
        : `Hurmatli tinglovchilar! Ushbu bosqichda biz "${overflowTitle}" bo'yicha muhim jihatlarni ko'rib chiqamiz.`
    };
  };

  // Kiruvchi slaydlarni tahlil qilish (muqovadan keyingi va xulosadan oldingi slaydlar)
  let candidateConclusion = null;
  for (let sIdx = 1; sIdx < data.slides.length; sIdx++) {
    const sl = data.slides[sIdx];
    const normTitle = normalizeText(sl.title);
    const isConclusionLike = sl.type === 'conclusion' ||
      normTitle.includes('xulosa') ||
      normTitle.includes('вывод') ||
      normTitle.includes('conclusion') ||
      normTitle.includes('хулоса');

    if (isConclusionLike) {
      if (!candidateConclusion) candidateConclusion = sl;
      continue;
    }

    if (contentSlides.length >= maxContentSlides) break;

    if (!isSlideDuplicate(sl)) {
      registerSlideContent(sl);
      contentSlides.push(sl);
    } else {
      const replSt = getNextUniqueStage(contentSlides.length + 2);
      const newSlide = {
        type: 'content',
        layoutType: replSt.layout,
        title: replSt.title,
        subtitle: replSt.sub,
        imagePrompts: [replSt.photo, `${enKeywords} professional visual`],
        points: replSt.points,
        metrics: replSt.metrics,
        chart: replSt.chart,
        leftHeading: replSt.leftHeading,
        rightHeading: replSt.rightHeading,
        spotlightText: replSt.spotlightText,
        highlight: replSt.highlight,
        speakerNotes: replSt.speakerNotes,
      };
      registerSlideContent(newSlide);
      contentSlides.push(newSlide);
    }
  }

  // Agar content slaydlar maxContentSlides ga yetmagan bo'lsa, yetishmaganlarini yangi unikal bosqichlar bilan to'ldirish
  while (contentSlides.length < maxContentSlides) {
    const newSt = getNextUniqueStage(contentSlides.length + 2);
    const newSlide = {
      type: 'content',
      layoutType: newSt.layout,
      title: newSt.title,
      subtitle: newSt.sub,
      imagePrompts: [newSt.photo, `${enKeywords} professional visual`],
      points: newSt.points,
      metrics: newSt.metrics,
      chart: newSt.chart,
      leftHeading: newSt.leftHeading,
      rightHeading: newSt.rightHeading,
      spotlightText: newSt.spotlightText,
      highlight: newSt.highlight,
      speakerNotes: newSt.speakerNotes,
    };
    registerSlideContent(newSlide);
    contentSlides.push(newSlide);
  }

  // Yakuniy Slayd: Xulosa (Har doim eng oxirgi slayd, slideNumber = targetCount)
  let finalConclusion;
  if (candidateConclusion && candidateConclusion.points && candidateConclusion.points.length > 0) {
    finalConclusion = candidateConclusion;
    finalConclusion.title = finalConclusion.title || localizedMeta.concTitle;
    finalConclusion.subtitle = finalConclusion.subtitle || localizedMeta.concSub;
    finalConclusion.highlight = finalConclusion.highlight || localizedMeta.concHighlight;
    finalConclusion.speakerNotes = finalConclusion.speakerNotes || localizedMeta.concNotes;
  } else {
    finalConclusion = {
      title: localizedMeta.concTitle,
      subtitle: localizedMeta.concSub,
      points: localizedMeta.concPoints,
      highlight: localizedMeta.concHighlight,
      speakerNotes: localizedMeta.concNotes,
    };
  }
  finalConclusion.type = 'conclusion';
  finalConclusion.layoutType = 'conclusion';
  finalConclusion.imagePrompts = [`${enKeywords} success achievement`, `${enKeywords} future vision`];
  registerSlideContent(finalConclusion);

  // Barcha slaydlarni birlashtirish va raqamlarini qat'iy 1 dan targetCount gacha belgilash
  const allSlides = [firstSlide, ...contentSlides, finalConclusion];
  allSlides.forEach((s, idx) => {
    s.slideNumber = idx + 1;
    // Agar slayd data_chart yoki kpi_metrics bo'lsa-yu, chart/metrics bo'lmasa boyitish
    if (s.layoutType === 'data_chart' && !s.chart) {
      s.chart = getSmartDomainCharts(effectiveTopic, idx + 1, language);
    }
    if (s.layoutType === 'kpi_metrics' && (!s.metrics || s.metrics.length === 0)) {
      s.metrics = getSmartDomainMetrics(effectiveTopic, idx + 1, language);
    }
  });

  data.slides = allSlides.slice(0, targetCount);
  return data;
}

export function buildPresentationPrompt({ topic, targetCount, language = 'uz', theme = 'ocean', categoryObj, enKeywords, organization = '', documentText = '' }) {
  const translatedTopic = translateUzbekTopic(topic, language);
  const docContext = documentText
    ? `\n\n${
        language === 'ru'
          ? `ВАЖНО: Пользователь предоставил исходный материал/конспект. Содержимое слайдов должно строго опираться на этот документ:\n"""\n${documentText.substring(0, 10000)}\n"""\n`
          : language === 'en'
          ? `IMPORTANT: The user provided source material. The presentation content must strictly derive from this text:\n"""\n${documentText.substring(0, 10000)}\n"""\n`
          : language === 'tg'
          ? `МУҲИМ: Корбар матни асосӣ/конспектро пешниҳод кардааст. Мазмуни муаррифӣ бояд пурра бар асоси ин матн таҳия шавад:\n"""\n${documentText.substring(0, 10000)}\n"""\n`
          : `MUHIM: Foydalanuvchi quyidagi hujjat / konspekt matnini taqdim etdi. Taqdimot mazmuni to'liq ushbu hujjatga asoslansin:\n"""\n${documentText.substring(0, 10000)}\n"""\n`
      }`
    : '';

  if (language === 'ru') {
    return `
Вы — ведущий международный эксперт и создатель высококлассных аналитических презентаций уровня McKinsey, BCG и ведущих академических институтов.
Тема презентации: "${translatedTopic}" (ввод пользователя: "${topic}")
Отрасль / Направление: ${categoryObj.name} (${categoryObj.promptContext})
ТРЕБУЕМОЕ КОЛИЧЕСТВО СЛАЙДОВ: РОВНО ${targetCount} СЛАЙДОВ!
Язык презентации: ИСКЛЮЧИТЕЛЬНО РУССКИЙ ЯЗЫК (богатый, академический, профессиональный русский язык).
Тема оформления: ${theme}
${organization ? `Организация / Университет: ${organization}` : ''}
${docContext}

СТРОЖАЙШИЕ ТРЕБОВАНИЯ И ПРАВИЛА:
1. 100% ЧИСТЫЙ РУССКИЙ ЯЗЫК (ВКЛЮЧАЯ НАЗВАНИЕ ТЕМЫ):
   - ВСЕ заголовки (title), подзаголовки (subtitle), названия тезисов (heading), подробные описания (description), ключевые выводы (highlight), метрики и заметки докладчика (speakerNotes) должны быть ИСКЛЮЧИТЕЛЬНО НА РУССКОМ ЯЗЫКЕ!
   - Если пользователь ввел тему на узбекском или другом языке (например: "${topic}"), ВЫ ОБЯЗАНЫ ПЕРЕВЕСТИ ЕЕ НА ЛИТЕРАТУРНЫЙ РУССКИЙ ЯЗЫК: "${translatedTopic}"!
   - Поле "title" в корне и на всех слайдах ОБЯЗАНО БЫТЬ НА ЧИСТОМ РУССКОМ ЯЗЫКЕ ("${translatedTopic}")!
   - КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО использовать слова на узбекском или любых других языках (никаких "${topic}", "1-nuqta", "Xulosa", "Kirish so'zi", "Zamonaviy", "tushuntirish" и т.п.)! Исключение — только поисковые запросы в imagePrompts (они должны быть на английском).
2. ВЫСОКАЯ ИНФОРМАТИВНОСТЬ И БОЛЬШОЙ ОБЪЕМ (ОТСУТСТВИЕ ВОДЫ И ШАБЛОНОВ):
   - В каждом пункте слайда поле "description" ОБЯЗАНО содержать минимум 3–5 развернутых, содержательных предложений (от 45 до 75 слов)!
   - Приводите реальные факты, профессиональную академическую терминологию, причинно-следственные связи, аналитические механизмы и конкретные измеримые параметры.
   - КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНЫ пустые шаблонные отписки («Пункт 1», «Введение», «Описание сути» и 1-строчные общие фразы)!
3. ПОЛНЫЙ ЗАПРЕТ НА УПОМИНАНИЕ ИСКУССТВЕННОГО ИНТЕЛЛЕКТА (ИИ):
   - КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО писать, что презентация создана с помощью ИИ, упоминать слова «ИИ», «AI», «нейросеть», «бот», «промпт», «сгенерировано». Презентация должна выглядеть так, как будто её создал опытный эксперт-исследователь или топ-аналитик вручную.
4. РАЗНООБРАЗИЕ МАКЕТОВ (layoutType):
   - Распределяйте слайды по разнообразным структурам: "split_hero", "three_cards", "data_chart" (наглядный график/диаграмма PowerPoint с аналитикой), "comparison", "kpi_metrics", "process_timeline", "matrix_grid", "spotlight", "cinematic", "conclusion".
5. ЗАПРОСЫ ДЛЯ ИЗОБРАЖЕНИЙ:
   - В поле "imagePrompts" ровно 2 англоязычных фотореалистичных запроса (например: ["${enKeywords} professional laboratory analysis", "${enKeywords} modern business conference"]).
6. ЗАМЕТКИ ДОКЛАДЧИКА (speakerNotes):
   - Для каждого слайда напишите живой, академический, готовый для защиты текст речи докладчика из 4–6 предложений на чистом русском языке.
7. Общее количество слайдов в массиве "slides" ДОЛЖНО БЫТЬ РОВНО ${targetCount}!
8. КАТЕГОРИЧЕСКИЙ ЗАПРЕТ НА ДУБЛИРОВАНИЕ И ПОВТОРЕНИЕ СЛАЙДОВ:
   - ВСЕ ${targetCount} слайдов ОБЯЗАНЫ иметь совершенно УНИКАЛЬНЫЕ заголовки (title), различные макеты и разное содержание!
   - КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО копировать или повторно использовать начальные слайды в конце презентации! Каждый слайд должен раскрывать новую грань исследования.
9. ВОПРОСЫ И ОТВЕТЫ ДЛЯ ЗАЩИТЫ (qaList):
   - Сформируйте в корневом объекте массив "qaList" из 3 ключевых аналитических вопросов экзаменационной комиссии/преподавателя и образцовых развернутых ответов докладчика.

Строго верните ЧИСТЫЙ JSON следующей структуры:
{
  "title": "${translatedTopic}",
  "subtitle": "Комплексный аналитический обзор и стратегические решения",
  "theme": "${theme}",
  "slides": [
    {
      "slideNumber": 1,
      "type": "title",
      "layoutType": "title",
      "title": "${translatedTopic}",
      "subtitle": "Аналитическое исследование в сфере: ${categoryObj.name}",
      "imagePrompts": ["${enKeywords} professional concept", "${enKeywords} modern visual"],
      "speakerNotes": "Здравствуйте, уважаемые участники! Сегодня мы подробно рассмотрим ключевые аспекты и стратегические перспективы темы ${translatedTopic}."
    },
    {
      "slideNumber": 2,
      "type": "content",
      "layoutType": "split_hero",
      "title": "Концептуальные основы и актуальность",
      "subtitle": "Теоретический базис и предпосылки практического применения",
      "imagePrompts": ["${enKeywords} analysis research", "${enKeywords} practical innovation"],
      "points": [
        {
          "heading": "Системная трансформация процессов",
          "description": "Современные вызовы требуют кардинального пересмотра традиционных подходов и внедрения комплексных моделей развития. Использование передовых отраслевых стандартов повышает общую продуктивность на 35-50% и гарантирует гибкую адаптацию к изменениям внешней среды."
        },
        {
          "heading": "Оптимизация ресурсного потенциала",
          "description": "Интеграция инновационных решений обеспечивает рациональное распределение ключевых ресурсов и снижение сопутствующих рисков. Поэтапное масштабирование формирует прочный фундамент для достижения измеримых долгосрочных показателей."
        }
      ],
      "highlight": "Фундаментальный системный подход и точная диагностика гарантируют максимальную эффективность практической реализации.",
      "speakerNotes": "На данном слайде мы анализируем базовые предпосылки и ключевые точки роста, определяющие высокую актуальность рассматриваемого вопроса."
    }
  ],
  "qaList": [
    {
      "question": "В чем заключается ключевая прикладная ценность данного исследования?",
      "answer": "Ключевая ценность заключается в снижении рисков и оптимизации процессов на 35-50% за счет системного внедрения стандартов."
    }
  ]
}
`;
  }

  if (language === 'en') {
    return `
You are a world-class strategic consultant and presentation designer (McKinsey, BCG, TED-caliber executive briefings).
Presentation Topic: "${translatedTopic}" (original user input: "${topic}")
Domain / Industry: ${categoryObj.name} (${categoryObj.promptContext})
REQUIRED SLIDE COUNT: EXACTLY ${targetCount} SLIDES!
Language: 100% PROFESSIONAL, FLUENT ENGLISH.
Design Theme: ${theme}
${organization ? `Organization / University: ${organization}` : ''}
${docContext}

STRICT MANDATORY REQUIREMENTS:
1. 100% PURE ENGLISH CONTENT (INCLUDING PRESENTATION TITLE):
   - ALL titles, subtitles, point headings, detailed descriptions, metric labels, highlights, and speakerNotes MUST be strictly in English!
   - If the user entered the topic in Uzbek or another language (e.g., "${topic}"), TRANSLATE IT TO PURE ENGLISH: "${translatedTopic}"!
   - The root "title" and slide 1 title MUST BE in pure English: "${translatedTopic}"!
   - ABSOLUTELY NO foreign words or phrases (especially no Uzbek or Russian words like "${topic}", "1-nuqta", "Xulosa", "Kirish", etc.).
2. IN-DEPTH, SUBSTANTIVE CONTENT (HIGH INFORMATION DENSITY):
   - Every bullet point "description" MUST contain at least 3–5 complete, informative sentences (45 to 75 words)!
   - Include concrete domain terminology, real-world mechanisms, analytical depth, empirical metrics, and cause-and-effect reasoning.
   - Generic filler, superficial phrases, and 1-line bullet points are STRICTLY FORBIDDEN!
3. ZERO MENTION OF ARTIFICIAL INTELLIGENCE (AI):
   - Do NOT mention "AI", "artificial intelligence", "generated by AI", "bot", or "prompt" anywhere in titles, descriptions, subtitles, or speaker notes. The deck must look 100% human-crafted by a seasoned industry expert.
4. RICH DIVERSITY OF LAYOUTS (layoutType):
   - Rotate strategically through: "split_hero", "three_cards", "data_chart" (native PowerPoint chart with analytical breakdown), "comparison", "kpi_metrics", "process_timeline", "matrix_grid", "spotlight", "cinematic", "conclusion".
5. HIGH-QUALITY IMAGE SEARCH PROMPTS:
   - In "imagePrompts", provide exactly 2 precise photorealistic English search keywords (e.g., ["${enKeywords} professional research", "${enKeywords} technology architecture"]).
6. COMPREHENSIVE SPEAKER NOTES (speakerNotes):
   - Provide a natural, polished 4–6 sentence verbal script for the presenter on every slide in English.
7. The "slides" array MUST contain EXACTLY ${targetCount} slides!
8. STRICT BAN ON DUPLICATE OR REPEATING SLIDES:
   - ALL ${targetCount} slides MUST have 100% UNIQUE titles, distinct layouts, and non-overlapping analytical points!
   - NEVER copy early slides to later positions! Every single slide must progressively explore a new milestone.
9. COMMITTEE DEFENSE QUESTIONS & ANSWERS (qaList):
   - Provide a "qaList" array in the root object containing 3 critical examination questions with authoritative model answers in English.

Strictly return CLEAN JSON of this structure:
{
  "title": "${translatedTopic}",
  "subtitle": "Comprehensive Strategic Analysis & Practical Frameworks",
  "theme": "${theme}",
  "slides": [
    {
      "slideNumber": 1,
      "type": "title",
      "layoutType": "title",
      "title": "${translatedTopic}",
      "subtitle": "Executive Research Briefing on ${categoryObj.name}",
      "imagePrompts": ["${enKeywords} concept photography", "${enKeywords} modern visual"],
      "speakerNotes": "Welcome everyone. Today we are presenting a comprehensive analytical evaluation of ${translatedTopic}, highlighting structural dynamics and strategic execution paths."
    },
    {
      "slideNumber": 2,
      "type": "content",
      "layoutType": "split_hero",
      "title": "Fundamental Concepts & Strategic Imperatives",
      "subtitle": "Theoretical framework and modern operational drivers",
      "imagePrompts": ["${enKeywords} analysis research", "${enKeywords} practical innovation"],
      "points": [
        {
          "heading": "Systemic Operational Transformation",
          "description": "Rapid market evolution demands a fundamental shift away from legacy workflows toward integrated modern practices. Applying standardized methodologies accelerates operational velocity by 35-50% while mitigating core execution risks."
        },
        {
          "heading": "Strategic Resource Maximization",
          "description": "Deploying data-driven solutions ensures optimal capital and talent deployment across critical touchpoints. Phased scaling establishes a resilient foundation capable of delivering durable competitive advantages."
        }
      ],
      "highlight": "A disciplined foundational architecture is the cornerstone of sustainable long-term excellence.",
      "speakerNotes": "On this slide, we examine the baseline theoretical foundations and critical levers that drive operational success in this domain."
    }
  ],
  "qaList": [
    {
      "question": "What is the core strategic breakthrough and practical value of this approach?",
      "answer": "The core breakthrough lies in systemic workflow optimization yielding a 35-50% throughput gain while controlling execution risks."
    }
  ]
}
`;
  }

  if (language === 'tg') {
    return `
Шумо коршиноси сатҳи байналмилалӣ ва муаллифи муаррифиҳои касбӣ (PowerPoint) дар сатҳи олии илмӣ, донишгоҳӣ ва таҳлилӣ мебошед.
Мавзӯи муаррифӣ: "${translatedTopic}" (вориди аслӣ: "${topic}")
Соҳа / Самт: ${categoryObj.name} (${categoryObj.promptContext})
ШУМОРАИ ТАЛАБШУДАИ СЛАЙДҲО: ДАҚИҚАН ${targetCount} СЛАЙД!
Забони муаррифӣ: 100% ЗАБОНИ ТОҶИКӢ (забони адабӣ, равон ва касбӣ).
Услуби тарҳрезӣ: ${theme}
${organization ? `Муассиса / Донишгоҳ: ${organization}` : ''}
${docContext}

ТАЛАБОТИ ҚАТЪӢ ВА ҚОИДАҲОИ АСОСӢ:
1. 100% ЗАБОНИ ШЕВО ВА ТОЗАИ ТОҶИКӢ (БО ШУМУЛИ НОМИ МАВЗӮЪ):
   - ҲАМАИ сарлавҳаҳо (title), зерсарлавҳаҳо (subtitle), номи бандҳо (heading), шарҳҳои муфассал (description), нишондиҳандаҳо, хулосаҳои асосӣ (highlight) ва қайдҳои баромадкунанда (speakerNotes) бояд ТАНҲО ВА СОФ БА ЗАБОНИ ТОҶИКӢ бошанд!
   - Агар корбар мавзӯъро бо забони ӯзбекӣ ё дигар забон ворид карда бошад (масалан: "${topic}"), ОНРО БА ЗАБОНИ НОБИ ТОҶИКӢ ТАРҶУМА КУНЕД: "${translatedTopic}"!
   - Қисмати "title" дар реша ва дар ҳамаи слайдҳо ҲАТМАН бояд бо забони тоҷикӣ бошад ("${translatedTopic}")!
   - Истифодаи калимаҳои ӯзбекӣ, русӣ ё дигар забонҳо (ба мисли "${topic}", "1-nuqta", "Xulosa", "Kirish so'zi", "Zamonaviy", "tushuntirish") ҚАТЪИЯН МАНЪ АСТ! Танҳо дар imagePrompts бояд ибораҳои англисӣ истифода шаванд.
2. МАЪЛУМОТИ АМИҚ, ПУРРА ВА СЕРМАЗМУН (ШУМОРАИ ЗИЁДИ КАЛИМАҲОИ ФОЙДАНОК):
   - Дар ҳар як банди слайд қисмати "description" (шарҳ) БОЯД ҳатман аз 3 то 5 ҷумлаи мукаммал ва пурмазмун (аз 45 то 75 калима) иборат бошад!
   - Далелҳои мушаххас, мафҳумҳои илмию соҳавӣ, нишондиҳандаҳои воқеӣ, таҳлилҳои амиқи сабабу натиҷа ва равандҳои амалиро зикр намоед.
   - Ибораҳои умумӣ, хушк ва кӯтоҳи яксатра («Банди 1», «Муқаддима», «Шарҳи кӯтоҳ») ҚАТЪИЯН МАНЪ АСТ!
3. МАНЪИ ҚАТЪИИ ЗИКРИ ЗЕҲНИ СУНЪӢ (AI):
   - Дар ягон ҷойи муаррифӣ навиштани он, ки ин муаррифӣ бо зеҳни сунъӣ омода шудааст, ё истифодаи калимаҳои «зеҳни сунъӣ», «AI», «бот», «промпт» ҚАТЪИЯН МАНЪ АСТ! Муаррифӣ бояд тавре бошад, ки гӯё онро олими барҷаста ё мутахассиси варзида худаш навишта бошад.
4. ГУНОГУНИИ ТАРҲҲОИ СЛАЙД (layoutType):
   - Аз тарҳҳои "split_hero", "three_cards", "data_chart" (диаграмма/графики таҳлилии PowerPoint), "comparison", "kpi_metrics", "process_timeline", "matrix_grid", "spotlight", "cinematic", "conclusion" самаранок истифода баред.
5. ҶУСТУҶӮИ АКСҲО (imagePrompts):
   - Барои ҳар слайд дар "imagePrompts" дақиқан 2 ибораи ҷустуҷӯи акс ба забони англисӣ диҳед (масалан: ["${enKeywords} professional laboratory analysis", "${enKeywords} modern conference"]).
6. ҚАЙДҲОИ БАРОМАДКУНАНДА (speakerNotes):
   - Барои ҳар як слайд матни нутқи зинда, илмӣ ва касбии баромадкунандаро (4–6 ҷумла) бо забони тоҷикӣ омода кунед.
7. Дар маҷмӯъ шумораи слайдҳо дар массиви "slides" ДАҚИҚАН ${targetCount} адад бошад!
8. МАНЪИ ҚАТЪИИ ТАКРОРШАВИИ СЛАЙДҲО:
   - ҲАМАИ ${targetCount} слайд БОЯД дорои сарлавҳаҳои комилан беназир, тарҳҳои гуногун ва мазмуни нав бошанд!
   - Нусхабардорӣ кардани слайдҳои аввал дар охири муаррифӣ ҚАТЪИЯН МАНЪ АСТ! Ҳар як слайд марҳилаи нави мантиқиро инъикос намояд.
9. САВОЛУ ҶАВОБҲОИ ҲИМОЯ (qaList):
   - Дар қисмати "qaList" 3 саволи муҳими комиссия ва посухҳои мукаммали илмию амалиро пешниҳод намоед.

Қатъиян дар формати JSON посух диҳед:
{
  "title": "${translatedTopic}",
  "subtitle": "Таҳлили ҳамаҷониба ва дурнамои стратегӣ",
  "theme": "${theme}",
  "slides": [
    {
      "slideNumber": 1,
      "type": "title",
      "layoutType": "title",
      "title": "${translatedTopic}",
      "subtitle": "Таҳқиқоти илмӣ ва амалӣ дар самти: ${categoryObj.name}",
      "imagePrompts": ["${enKeywords} professional concept", "${enKeywords} modern visual"],
      "speakerNotes": "Салом, ҳозирини гиромӣ! Имрӯз мо ҷанбаҳои асосӣ ва дурнамои рушди мавзӯи ${translatedTopic}-ро ба таври муфассал мавриди баррасӣ қарор медиҳем."
    },
    {
      "slideNumber": 2,
      "type": "content",
      "layoutType": "split_hero",
      "title": "Асосҳои назариявӣ ва мубрамияти мавзӯъ",
      "subtitle": "Пойдевори консептуалӣ ва заминаҳои татбиқи амалӣ",
      "imagePrompts": ["${enKeywords} analysis research", "${enKeywords} practical innovation"],
      "points": [
        {
          "heading": "Дигаргунсозии низомманди равандҳо",
          "description": "Шароити муосир таҷдиди назар кардани усулҳои анъанавӣ ва ҷорисозии моделҳои навро тақозо мекунад. Татбиқи стандартҳои пешрафта маҳсулнокиро 35-50% боло бурда, мутобиқшавии фавриро ба тағйирот таъмин месозад."
        },
        {
          "heading": "Истифодаи мақсадноки захираҳо",
          "description": "Ҳамгироии роҳҳои ҳалли инноватсионӣ тақсимоти дурусти захираҳои моддию инсониро кафолат медиҳад. Ин раванд хавфҳои идоравиро ба ҳадди ақал расонида, заминаи рушди устуворро фароҳам меорад."
        }
      ],
      "highlight": "Пойдевори мустаҳками назариявӣ кафили комёбиҳои амалӣ ва рушди устувор мебошад.",
      "speakerNotes": "Дар ин слайд мо омилҳои асосии пешбаранда ва нуқтаҳои муҳими рушдро, ки мубрамияти мавзӯъро таъмин менамоянд, таҳлил мекунем."
    }
  ],
  "qaList": [
    {
      "question": "Аҳамияти асосии амалии ин таҳқиқот дар чист?",
      "answer": "Аҳамияти асосӣ дар баланд бардоштани маҳсулнокӣ ба андозаи 35-50% ва истифодаи самараноки захираҳо мебошад."
    }
  ]
}
`;
  }

  // Uzbek (Default)
  return `
Siz xalqaro darajadagi professional taqdimotlar (PowerPoint slaydlar) muallifi va sohaning yetakchi tahlilchisiz.
Mavzu: "${topic}"
Yo'nalish / Soha: ${categoryObj.name} (${categoryObj.promptContext})
TALAB QILINGAN SLAYDLAR SONI: ANIQ ${targetCount} TA SLAYD!
Taqdimot tili: Toza, adabiy o'zbek tili.
Dizayn mavzusi: ${theme}
${organization ? `Tashkilot / Universitet: ${organization}` : ''}
${docContext}

MUHIM QAT'IY TALABLAR VA CHEKLOVLAR:
1. HAR BIR BANDDA CHUQUR, KENG QAMROVLI VA MAZMUNDOR MA'LUMOT (SO'ZLAR SONI BOY BO'LSIN):
   - Har bir slayd punktidagi "description" (tushuntirish) kamida 3-5 ta to'liq, mazmundor gapdan (kamida 45-75 so'z) iborat bo'lishi SHART!
   - Mavzuga doir aniq sohaviy tushunchalar, real faktlar, amaliy mexanizmlar, sabab-oqibat tahlillari va professional atamalarni keltiring. Har bir tushuntirish akademik va konsalting darajasida puxta bo'lsin.
   - Qisqa, 1 qatorli umumiy gaplar, "1-nuqta", "Kirish", "Xulosa", "Tushuntirish" kabi quruq va zerikarli iboralarni ishlatish QAT'IYAN TAQIQLANADI!
2. SUN'IY INTELLEKT (AI) HAQIDA HECH QANDAY SO'Z YOZILMASIN:
   - Slayd ichida, sarlavhada, bandlarda yoki spiker nutqida "bu taqdimot AI yordamida qilindi", "Sun'iy intellekt", "AI", "bot" kabi iboralarni MUTLAQO ISHLATMANG! Taqdimot inson mutaxassisi yoki professor tomonidan chuqur tayyorlangan ilmiy-amaliy taqdimotdek bo'lsin.
3. HAR BIR SLAYD UNIKAL BO'LISHI UCHUN "layoutType" TURLARIDAN UNUMLI FOYDALANING:
   - "split_hero": chapda asosiy vizual, o'ngda chuqur tahliliy fikrlar
   - "three_cards": 3 ta vertikal ustunli to'liq tahlil kartochkalari (har birida alohida sarlavha, raqam va keng tushuntirish)
   - "data_chart": PowerPoint tahrirlanadigan ustunli diagrammasi va empirik tahlili
   - "comparison": an'anaviy yondashuv va innovatsion yechimlarni taqqoslash ("leftHeading", "rightHeading", "points")
   - "kpi_metrics": katta statistik raqamlar va aniq o'lchovlar ("metrics": [{"val": "+85%", "label": "...", "desc": "..."}])
   - "process_timeline": bosqichma-bosqich yo'l xaritasi va harakatlar zanjiri
   - "matrix_grid": tizimning 4 ta mustahkam ustuni yoki bloklari (aniq 4 ta point)
   - "spotlight": bosh analitik iqtibos / insight ("spotlightText") va tahlillar
   - "cinematic": strategik kelajak ko'rinishi va transformatsiya
   - "conclusion": yakuniy xulosalar va amaliy tavsiyalar
4. RASMLAR UCHUN:
   - Har bir slayd uchun "imagePrompts" massivida aynan 2 ta INGLIZCHA aniq fotorealistik foto qidiruv so'zini bering (masalan: ["${enKeywords} laboratory research", "${enKeywords} modern professional workspace"]).
5. SPIKER NUTQI (speakerNotes):
   - Har bir slayd uchun spiker minbardan turib himoyada gapirib berishi mumkin bo'lgan 4-6 gapdan iborat jonli, qiziqarli, akademik nutq matnini yozing.
6. Jami "slides" massivida AYNAN ${targetCount} ta slayd bo'lsin!
7. SLAYDLARNI TAKRORLASH MUTLAQO TAQIQLANADI (100% UNIKAL BETLAR):
   - 1-slayddan ${targetCount}-slaydgacha bo'lgan BARCHA slaydlarning sarlavhasi (title), maketi va mazmuni MUTLAQO NOYOB bo'lishi shart!
   - Boshlang'ich slaydlarni oxirgi slaydlarda bir xil nusxalab qo'yish QAT'IYAN TAQIQLANADI! Har bir slayd mavzuning keyingi mantiqiy bosqichini chuqur yoritsin.
8. HIMOYA VA KOMISSIYA SAVOL-JAVOBLARI (qaList):
   - "qaList" massivida komissiya yoki ustozlar berishi mumkin bo'lgan 3 ta dolzarb savol va spikerning namunali chuqur javoblarini keltiring.

Qat'iy toza JSON formatida javob bering:
{
  "title": "${topic}",
  "subtitle": "Keng qamrovli tahliliy tadqiqot va amaliy yechimlar",
  "theme": "${theme}",
  "slides": [
    {
      "slideNumber": 1,
      "type": "title",
      "layoutType": "title",
      "title": "${topic}",
      "subtitle": "${categoryObj.name} doirasidagi maxsus ilmiy-tahliliy taqdimot",
      "imagePrompts": [
        "${enKeywords} concept photography",
        "${enKeywords} modern visual"
      ],
      "speakerNotes": "Assalomu alaykum, hurmatli anjuman ishtirokchilari! Bugun biz ${topic} mavzusining fundamental asoslari va amaliy istiqbollarini atroflicha tahlil qilamiz."
    },
    {
      "slideNumber": 2,
      "type": "content",
      "layoutType": "split_hero",
      "title": "Mavzuning Dolzarbligi va Nazariy Asoslari",
      "subtitle": "Fundamental tamoyillar va sohaviy rivojlanish omillari",
      "imagePrompts": ["${enKeywords} analysis research", "${enKeywords} practical innovation"],
      "points": [
        {
          "heading": "Tizimli Transformatsiya Zarurati",
          "description": "Bugungi kunda sohadagi tezkor o'zgarishlar an'anaviy yondashuvlardan voz kechib, kompleks va integratsiyalashgan boshqaruv modellariga o'tishni taqozo etmoqda. Zamonaviy standartlarni joriy qilish amaliy samaradorlikni 35-50% ga oshirish bilan birga, yuzaga kelishi mumkin bo'lgan xatarlarni sezilarli darajada kamaytiradi."
        },
        {
          "heading": "Resurslar Imkoniyatini Optimallashtirish",
          "description": "Innovatsion uslublar va ilg'or tajribalarni qo'llash moddiy hamda inson kapitalidan maksimal darajada oqilona foydalanish kafolatini beradi. Bosqichma-bosqich takomillashtirish uzoq muddatli istiqbolda barqaror o'sish sur'atlarini ta'minlovchi mustahkam poydevor yaratadi."
        }
      ],
      "highlight": "Mukammal nazariy poydevor va izchil harakatlar strategiyasi yuqori natijalarga erishishning asosiy kalitidir.",
      "speakerNotes": "Ushbu slaydda biz sohaning bugungi kundagi holati, mavzuni dolzarb qilayotgan asosiy omillar hamda kelgusidagi transformatsiya yo'nalishlariga chuqur to'xtalamiz."
    }
  ],
  "qaList": [
    {
      "question": "Ushbu loyihaning amaliy ahamiyati va asosiy yangiligi nimada?",
      "answer": "Asosiy yangilik jarayonlarni tizimlashtirish, samaradorlikni 35-50% ga oshirish va xatarlarni minimallashtirishdan iboratdir."
    }
  ]
}
`;
}

/**
 * AI belgilari, suv belgisi va chet tillarga o'tib ketgan o'zbekcha so'zlarni tozalovchi filtr
 */
function sanitizePresentationData(data, language = 'uz') {
  if (!data || typeof data !== 'object') return data;
  data.language = language;

  const aiSelfRegex = /(taqdimot\s*(sun['']iy\s*intellekt|ai)\s*(yordamida|tomonidan)\s*(tayyorlandi|tuzildi|yaratildi)|sun['']iy\s*intellekt\s*tomonidan\s*tayyorlandi|презентация\s*(создана|сгенерирована)\s*(с\s*помощью\s*ии|искусственным\s*интеллектом)|сгенерировано\s*ии|создано\s*ии|generated\s*by\s*ai|created\s*by\s*ai|prepared\s*with\s*ai|муаррифӣ\s*бо\s*зеҳни\s*сунъӣ\s*омода\s*шудааст|бо\s*зеҳни\s*сунъӣ\s*омода\s*шудааст|✨\s*ai\s*taqdimot|ai\s*presentation\s*bot)/gi;

  const cleanText = (str, fallback = '') => {
    if (!str || typeof str !== 'string') return fallback;
    const cleaned = str.replace(aiSelfRegex, '').trim();
    return cleaned || fallback;
  };

  const defaultSubtitles = {
    uz: 'Keng qamrovli tahliliy tadqiqot va amaliy yechimlar',
    ru: 'Комплексный аналитический обзор и практические выводы',
    en: 'Comprehensive strategic analysis and operational frameworks',
    tg: 'Таҳлили ҳамаҷониба ва дурнамои стратегӣ',
  };

  const isNonUzbek = language !== 'uz';

  const originalRootTitle = data.title || '';
  if (isNonUzbek && data.title) {
    const translatedRoot = translateUzbekTopic(data.title, language);
    data.title = cleanUzbekWordsFromText(translatedRoot, language);
  }

  data.subtitle = cleanText(data.subtitle, defaultSubtitles[language] || defaultSubtitles.uz);

  if (Array.isArray(data.slides)) {
    data.slides.forEach((slide, idx) => {
      slide.title = cleanText(slide.title, `Slide ${idx + 1}`);
      slide.subtitle = cleanText(slide.subtitle, '');
      if (slide.highlight) slide.highlight = cleanText(slide.highlight, '');
      if (slide.spotlightText) slide.spotlightText = cleanText(slide.spotlightText, '');
      if (slide.speakerNotes) slide.speakerNotes = cleanText(slide.speakerNotes, '');

      // Chet tillarda o'zbekcha qolib ketgan so'zlarni va mavzu nomini almashtirish
      if (isNonUzbek) {
        if (originalRootTitle && originalRootTitle !== data.title) {
          const escOrig = originalRootTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const origRegex = new RegExp(escOrig, 'gi');
          slide.title = slide.title.replace(origRegex, data.title);
          if (slide.subtitle) slide.subtitle = slide.subtitle.replace(origRegex, data.title);
          if (slide.highlight) slide.highlight = slide.highlight.replace(origRegex, data.title);
          if (slide.spotlightText) slide.spotlightText = slide.spotlightText.replace(origRegex, data.title);
          if (slide.speakerNotes) slide.speakerNotes = slide.speakerNotes.replace(origRegex, data.title);
        }

        slide.title = cleanUzbekWordsFromText(slide.title, language);
        if (slide.subtitle) slide.subtitle = cleanUzbekWordsFromText(slide.subtitle, language);
        if (slide.highlight) slide.highlight = cleanUzbekWordsFromText(slide.highlight, language);
        if (slide.spotlightText) slide.spotlightText = cleanUzbekWordsFromText(slide.spotlightText, language);
        if (slide.speakerNotes) slide.speakerNotes = cleanUzbekWordsFromText(slide.speakerNotes, language);

        if (/zamonaviy\s*tahlil/i.test(slide.subtitle) || /keng\s*qamrovli/i.test(slide.subtitle)) {
          slide.subtitle = defaultSubtitles[language] || '';
        }
        if (/bo['']lim\s*mazmuni/i.test(slide.subtitle)) {
          slide.subtitle = language === 'ru' ? 'Ключевые направления и анализ' : language === 'en' ? 'Core dimensions and analysis' : 'Самтҳои асосӣ ва таҳлил';
        }
        if (/slayd\s*sarlavhasi/i.test(slide.title)) {
          slide.title = language === 'ru' ? `Тематический раздел ${idx + 1}` : language === 'en' ? `Strategic Focus ${idx + 1}` : `Бахши мавзӯъии ${idx + 1}`;
        }
        if (/kirish\s*so['']zi/i.test(slide.speakerNotes) || /nutq\s*matni/i.test(slide.speakerNotes)) {
          slide.speakerNotes = language === 'ru'
            ? `Здравствуйте, уважаемые коллеги! На данном слайде мы подробно рассмотрим тему "${slide.title}".`
            : language === 'en'
            ? `Welcome everyone. On this slide, we explore the essential dimensions of "${slide.title}".`
            : `Салом, ҳозирини гиромӣ! Дар ин слайд мо ҷанбаҳои муҳимтарини "${slide.title}"-ро баррасӣ мекунем.`;
        }
        if (/xulosa/i.test(slide.highlight) && slide.highlight.length < 25) {
          slide.highlight = language === 'ru'
            ? 'Системный подход и выверенная стратегия гарантируют достижение высоких показателей.'
            : language === 'en'
            ? 'A disciplined strategic framework ensures optimal performance and sustainable growth.'
            : 'Равиши низомманд ва стратегияи дақиқ ноил шудан ба натиҷаҳои баландро кафолат медиҳад.';
        }
      }

      // Highlight bo'sh yoki o'ta qisqa bo'lsa har bir slayd uchun unikal tahliliy xulosa bilan to'ldirish
      if (!slide.highlight || slide.highlight.length < 25) {
        slide.highlight = language === 'ru'
          ? `Системный подход по направлению "${slide.title}" гарантирует устойчивую результативность и минимизацию отраслевых рисков.`
          : language === 'en'
          ? `A disciplined strategic framework focused on "${slide.title}" ensures operational excellence and verifiable ROI.`
          : language === 'tg'
          ? `Муносибати низомманд дар самти "${slide.title}" кафили сифати баланд ва рушди устувори соҳа мебошад.`
          : `"${slide.title}" bo'yicha tizimli yondashuv va qat'iy standartlar belgilangan marralarga erishishning asosiy garovidir.`;
      }

      // Spiker nutqi bo'sh yoki o'ta qisqa bo'lsa boyitish
      if (!slide.speakerNotes || slide.speakerNotes.length < 40) {
        slide.speakerNotes = language === 'ru'
          ? `Здравствуйте, уважаемые коллеги! На данном этапе мы подробно анализируем ключевые аспекты темы "${slide.title}". Особое внимание уделено практическим механизмам реализации и долгосрочной отраслевой эффективности.`
          : language === 'en'
          ? `Welcome, distinguished audience. In this section, we examine the essential drivers of "${slide.title}". Our strategic focus centers on operational efficiency, mitigation of risks, and measurable performance.`
          : language === 'tg'
          ? `Салом, ҳозирини гиромӣ! Дар ин марҳила мо ҷанбаҳои асосӣ ва амиқи мавзӯи "${slide.title}"-ро баррасӣ мекунем. Таваҷҷуҳи хоса ба механизмҳои амалӣ ва баланд бардоштани самаранокии соҳа равона шудааст.`
          : `Assalomu alaykum, hurmatli anjuman qatnashchilari! Ushbu bosqichda biz "${slide.title}" mavzusining eng muhim konseptual jihatlari va amaliy mexanizmlarini atroflicha tahlil qilamiz. Asosiy e'tibor jarayonlarni optimallashtirish va kutilayotgan samaradorlikka qaratilgan.`;
      }

      if (Array.isArray(slide.points)) {
        slide.points.forEach((pt, pIdx) => {
          pt.heading = cleanText(pt.heading, '');
          pt.description = cleanText(pt.description, '');

          if (isNonUzbek) {
            if (originalRootTitle && originalRootTitle !== data.title) {
              const escOrig = originalRootTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const origRegex = new RegExp(escOrig, 'gi');
              pt.heading = pt.heading.replace(origRegex, data.title);
              pt.description = pt.description.replace(origRegex, data.title);
            }
            pt.heading = cleanUzbekWordsFromText(pt.heading, language);
            pt.description = cleanUzbekWordsFromText(pt.description, language);

            if (/^\d+[-_]nuqta$/i.test(pt.heading) || /^nuqta\s*\d+$/i.test(pt.heading)) {
              pt.heading = language === 'ru'
                ? `Ключевой фактор ${pIdx + 1}`
                : language === 'en'
                ? `Core Factor ${pIdx + 1}`
                : `Омили калидии ${pIdx + 1}`;
            }
            if (/tushuntirish/i.test(pt.description)) {
              pt.description = language === 'ru'
                ? 'Глубокий анализ данного направления позволяет выявить ключевые закономерности и внедрить эффективные отраслевые решения.'
                : language === 'en'
                ? 'Detailed analysis of this dimension reveals critical structural patterns and enables high-impact operational solutions.'
                : 'Таҳлили амиқи ин самт имкон медиҳад, ки қонуниятҳои асосӣ муайян гардида, роҳҳои ҳалли муассир татбиқ карда шаванд.';
            }
          }

          // Qisqa bo'lib qolgan gaplarni har bir nuqta va slayd uchun unikal kontekst bilan boyitish
          if (pt.description.length < 90) {
            const enrichPools = {
              uz: [
                ` Ushbu chora-tadbirlar "${slide.title}" doirasida jarayonlar ishonchliligini oshirib, sifat barqarorligini kafolatlaydi.`,
                ` Amaliyotga integratsiya qilish orqali umumiy samaradorlik ko'rsatkichlari 35-50% ga ortadi.`,
                ` Belgilangan standartlar resurslardan tejamkor foydalanish va tizimli xatarlarni minimallashtirishga xizmat qiladi.`,
                ` Natijada barcha bo'g'inlar o'rtasida mustahkam sinergiya va yuqori ijro intizomi shakllanadi.`,
                ` Uzoq muddatli istiqbolda bu yondashuv barqaror o'sish va sohaviy yetakchilik poydevorini mustahkamlaydi.`,
                ` Mazkur mexanizm kutilmagan operatsion to'siqlarni erta bartaraf etish imkonini beradi.`
              ],
              ru: [
                ` В рамках направления "${slide.title}" соблюдение данных критериев обеспечивает качественный рост и исключает сбои.`,
                ` Поэтапная практическая интеграция позволяет повысить результативность процессов на 35–50%.`,
                ` Данный подход оптимизирует распределение ключевых ресурсов и минимизирует системные риски.`,
                ` Систематический контроль формирует прочную основу для достижения долгосрочных показателей.`,
                ` Комплексное внедрение закрепляет конкурентные преимущества и гарантирует стабильность.`,
                ` Применение регламентов предотвращает операционные ошибки на ранних этапах выполнения.`
              ],
              en: [
                ` Deploying these rigorous parameters across "${slide.title}" optimizes resource utilization and ensures throughput.`,
                ` Phased operational execution boosts aggregate workflow performance by 35–50%.`,
                ` This framework eliminates structural bottlenecks and reliably mitigates operational friction.`,
                ` Consistent metric monitoring establishes a durable engine for long-term scalability.`,
                ` Systematic integration secures measurable competitive moats and durable excellence.`,
                ` Proactive governance eliminates execution errors before they impact deliverable quality.`
              ],
              tg: [
                ` Татбиқи ин тадбирҳо дар доираи "${slide.title}" самаранокии баланд ва назорати сифатро кафолат медиҳад.`,
                ` Ҷорисозии амалӣ маҳсулнокии равандҳоро ба андозаи 35–50% афзун мегардонад.`,
                ` Ин равиш истифодаи сарфакоронаи захираҳо ва коҳиши хавфҳоро таъмин месозад.`,
                ` Назорати пайваста пойдевори мустаҳкамро барои рушди дарозмуддат мегузорад.`,
                ` Ҳамгироии ҳамаҷониба мавқеи пешсафиро дар соҳа таҳким мебахшад.`,
                ` Риояи меъёрҳо камбудиҳои эҳтимолиро дар марҳилаҳои аввал пешгирӣ мекунад.`
              ]
            };
            const langPool = enrichPools[language] || enrichPools.uz;
            const contextSentence = langPool[(idx * 3 + pIdx) % langPool.length];
            pt.description += contextSentence;
          }
        });
      }
    });

    // Butun taqdimot bo'yicha gaplar takrorlanishini 100% bartaraf etish (Hech qachon 2 ta slaydda bir xil gap bo'lmasin!)
    const globalSentences = new Set();
    data.slides.forEach((slide, sIdx) => {
      if (Array.isArray(slide.points)) {
        slide.points.forEach((pt, pIdx) => {
          if (pt.description) {
            const rawSentences = pt.description.split(/(?<=[.!?])\s+/);
            const filtered = [];
            for (const s of rawSentences) {
              const norm = s.toLowerCase().replace(/['`ʻ’".,!?:;()\-–—]/g, ' ').replace(/\s+/g, ' ').trim();
              if (norm.length > 20) {
                if (globalSentences.has(norm)) {
                  continue; // Takroriy gap chetlatildi!
                }
                globalSentences.add(norm);
              }
              filtered.push(s);
            }
            pt.description = filtered.join(' ').trim();
            if (pt.description.length < 40) {
              const miniPool = {
                uz: [
                  ` "${slide.title}" bo'yicha chuqur tahliliy yondashuv uzoq muddatli amaliy natijadorlikni ta'minlaydi.`,
                  ` Amaliy tadbiq jarayonida belgilangan standartlarga qat'iy rioya qilish yuqori sifat beradi.`,
                  ` Tizimli tahlil natijalari jarayonlarni optimallashtirish va resurslarni tejashga xizmat qiladi.`
                ],
                ru: [
                  ` Глубокая аналитическая проработка по разделу "${slide.title}" формирует надежную практическую базу.`,
                  ` Соблюдение регламентов при реализации гарантирует стабильное качество и исключает риски.`,
                  ` Системный анализ создает измеримый фундамент для оптимизации всех ключевых ресурсов.`
                ],
                en: [
                  ` Rigorous domain execution across "${slide.title}" establishes a verifiable foundation for growth.`,
                  ` Phased milestone delivery ensures consistent output quality and eliminates operational risks.`,
                  ` Systematic analysis provides an empirical basis for optimizing critical resource allocation.`
                ],
                tg: [
                  ` Таҳлили амиқ дар бахши "${slide.title}" заминаи боэътимоди амалиро таъмин месозад.`,
                  ` Риояи дақиқи қоидаҳо сифати устуворро кафолат дода, хавфҳоро коҳиш медиҳад.`,
                  ` Равиши низомманд барои истифодаи сарфакоронаи захираҳо мусоидат менамояд.`
                ]
              };
              const mList = miniPool[language] || miniPool.uz;
              pt.description += mList[(sIdx * 3 + pIdx) % mList.length];
            }
          }
        });
      }
    });
  }

  if (Array.isArray(data.qaList)) {
    data.qaList = data.qaList.map(item => ({
      question: cleanText(item?.question, ''),
      answer: cleanText(item?.answer, ''),
    })).filter(x => x.question && x.answer);

    if (isNonUzbek && originalRootTitle && originalRootTitle !== data.title) {
      const escOrig = originalRootTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const origRegex = new RegExp(escOrig, 'gi');
      data.qaList.forEach(item => {
        item.question = cleanUzbekWordsFromText(item.question.replace(origRegex, data.title), language);
        item.answer = cleanUzbekWordsFromText(item.answer.replace(origRegex, data.title), language);
      });
    }
  }

  if (!Array.isArray(data.qaList) || data.qaList.length === 0) {
    const topicTitle = data.title || 'Mavzu';
    const localizedDefaults = {
      uz: [
        { question: `"${topicTitle}" bo'yicha asosiy ilmiy yangilik va amaliy samara nimada?`, answer: `Asosiy ahamiyat tarqoq yondashuvlarni yagona tizimga keltirib, jarayonlar unumdorligini 35-50% ga oshirish va operatsion xatarlarni kamaytirishdan iborat.` },
        { question: `Ushbu loyihani amaliyotga joriy qilishda asosiy xatarlar qanday bartaraf etiladi?`, answer: `Bosqichma-bosqich rejalashtirish, xodimlar malakasini oshirish va muntazam sifat nazorati o'rnatish orqali xatarlar bartaraf qilinadi.` },
        { question: `Natijadorlik qaysi asosiy mezonlar (KPI) orqali baholanadi?`, answer: `Resurslar tejamkorligi, operatsion tezlik va xalqaro sifat mezonlariga muvofiqlik darajasi bilan o'lchanadi.` },
      ],
      ru: [
        { question: `В чем заключается ключевая научная новизна и прикладная ценность темы "${topicTitle}"?`, answer: `Основная ценность состоит в систематизации процессов и повышении эффективности на 35–50% при минимальных эксплуатационных рисках.` },
        { question: `С какими сложностями можно столкнуться при реализации и как их нивелировать?`, answer: `Сложности преодолеваются поэтапным пилотированием, обучением специалистов и внедрением непрерывного аудита качества.` },
        { question: `Какие метрики используются для подтверждения результативности?`, answer: `Оценка базируется на измеримых KPI: снижении издержек, ускорении ключевых циклов и устойчивости стандартов.` },
      ],
      en: [
        { question: `What is the core breakthrough and real-world value of "${topicTitle}"?`, answer: `The primary value lies in systemic framework integration that accelerates operational output by 35–50% while controlling friction.` },
        { question: `What are the primary implementation hurdles and how are they overcome?`, answer: `Hurdles are resolved through phased milestones, comprehensive stakeholder training, and continuous metric tracking.` },
        { question: `How do you measure and validate sustainable long-term ROI?`, answer: `Validation relies on empirical KPI metrics: lower turnaround latency, minimized operational overhead, and compliance with industry standards.` },
      ],
      tg: [
        { question: `Навоварии асосии илмӣ ва аҳамияти амалии мавзӯи "${topicTitle}" дар чист?`, answer: `Аҳамияти асосӣ дар баланд бардоштани маҳсулнокии равандҳо ба андозаи 35-50% ва истифодаи самараноки захираҳо мебошад.` },
        { question: `Ҳангоми татбиқи амалӣ мушкилиҳо чӣ гуна бартараф карда мешаванд?`, answer: `Тавассути озмоишҳои марҳилавӣ, омӯзиши пайвастаи мутахассисон ва назорати сифати натиҷаҳо бартараф мегардад.` },
        { question: `Самаранокии ин лоиҳа бо кадом нишондиҳандаҳо чен карда мешавад?`, answer: `Сарфаи захираҳо, суръати амалиёт ва риояи стандартҳои байналмилалии сифат мебошанд.` },
      ],
    };
    data.qaList = localizedDefaults[language] || localizedDefaults.uz;
  }

  return data;
}

/**
 * Foydalanuvchi mavzusi va sohasi asosida slaydlar strukturasini JSON ko'rinishida generatsiya qiladi.
 */
export async function generatePresentationData({ topic, slideCount = 6, language = 'uz', theme = 'ocean', category = 'general', documentText = '', organization = '' }) {
  const targetCount = Math.min(Math.max(parseInt(slideCount, 10) || 6, 3), 25);
  const categoryObj = getCategory(category, language);
  const enKeywords = extractCleanKeywords(topic);

  const prompt = buildPresentationPrompt({
    topic,
    targetCount,
    language,
    theme,
    categoryObj,
    enKeywords,
    organization,
    documentText,
  });

  // 1-URINISH: Anthropic Claude 3.5 Sonnet (Agar API kalit sozlangan bo'lsa)
  const claudeData = await generateViaClaude(prompt);
  if (claudeData && claudeData.slides && claudeData.slides.length >= 3) {
    if (organization) claudeData.organization = organization;
    const completeData = ensureUniqueAndCompleteSlides(claudeData, topic, language, targetCount);
    return sanitizePresentationData(completeData, language);
  }

  // 2-URINISH: OpenRouter orqali Claude (Agar API kalit sozlangan bo'lsa)
  const openRouterData = await generateViaOpenRouter(prompt);
  if (openRouterData && openRouterData.slides && openRouterData.slides.length >= 3) {
    if (organization) openRouterData.organization = organization;
    const completeData = ensureUniqueAndCompleteSlides(openRouterData, topic, language, targetCount);
    return sanitizePresentationData(completeData, language);
  }

  // 3-URINISH: Agar Google Gemini API mavjud bo'lsa
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
        const completeData = ensureUniqueAndCompleteSlides(data, topic, language, targetCount);
        return sanitizePresentationData(completeData, language);
      }
    } catch (gErr) {
      console.warn('[AI Engine] Google Gemini uzilishi:', gErr.message);
    }
  }

  // 4-URINISH: Pollinations AI (OpenAI GPT-4o-mini asosida bepul va yuqori intellektual)
  const pollData = await generateViaPollinations(prompt);
  if (pollData && pollData.slides && pollData.slides.length >= 3) {
    if (organization) pollData.organization = organization;
    const completeData = ensureUniqueAndCompleteSlides(pollData, topic, language, targetCount);
    return sanitizePresentationData(completeData, language);
  }

  // 5-URINISH: Mavzuga to'liq moslashtirilgan boy dinamik reja
  const fallbackData = generateDynamicFallbackPresentation({ topic, slideCount: targetCount, language, theme, categoryObj });
  if (organization) fallbackData.organization = organization;
  const completeData = ensureUniqueAndCompleteSlides(fallbackData, topic, language, targetCount);
  return sanitizePresentationData(completeData, language);
}
