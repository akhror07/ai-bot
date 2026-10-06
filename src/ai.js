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
 * Pollinations AI orqali yuqori sifatli erkin generatsiya (OpenAI GPT-4o-mini asosida)
 */
async function generateViaPollinations(prompt) {
  try {
    console.log('[AI Engine] Pollinations AI ga so\'rov yuborilmoqda...');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 32000);

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
 * Mavzuga qarab chuqur, haqiqiy ilmiy va sohaviy bosqichlarni qaytaruvchi aqlli bilimlar bazasi.
 * Hech qachon umumiy, zerikarli va takroriy gaplar bermaydi!
 */
function getDomainStages(topic, enKeywords) {
  const t = topic.toLowerCase();

  // 1. PSIXOLOGIYA VA KOGNITIV XOTIRA
  if (t.includes('psixolog') || t.includes('xotira') || t.includes('kognitiv') || t.includes('miya') || t.includes('ong') || t.includes('idrok')) {
    return [
      {
        layout: 'split_hero',
        title: 'Kognitiv Psixologiya va Inson Idroki',
        sub: 'Axborotni qabul qilish, tahlil etish va miyada qayta ishlash',
        photo: 'cognitive psychology human brain 3d',
        points: [
          { heading: 'Idrok mexanizmi', description: 'Inson miyasi tashqi olamdan kelayotgan millionlab signallarni soniyaning ulushlarida saralaydi.' },
          { heading: 'Kognitiv strukturalar', description: 'Diqqat, tafakkur va idrok o\'zaro bog\'liq holda inson shaxsiyati va xulqini boshqaradi.' },
          { heading: 'Ong osti jarayonlari', description: 'Kundalik qarorlarimizning 80% dan ortig\'i ong ostidagi avtomatik sxemalarga tayanadi.' }
        ],
        highlight: 'Inson miyasi va kognitiv tizimi koinotdagi eng murakkab va mukammal bio-kompyuterdir.'
      },
      {
        layout: 'comparison',
        title: 'Xotira Turlari: Qisqa va Uzoq Muddatli Xotira',
        sub: 'Atkinson-Shiffrin modeli bo\'yicha saqlanish darajalari',
        photo: 'synapse brain neuron connections glowing',
        leftHeading: 'Qisqa Muddatli (Operativ) Xotira',
        rightHeading: 'Uzoq Muddatli (Doimiy) Xotira',
        points: [
          { heading: 'Sig\'im va davomiylik', description: 'O\'rtacha 7±2 ta ob\'ektni 20-30 soniya davomida saqlaydi, diqqat o\'zgarganda tez o\'chadi.' },
          { heading: 'Cheksiz saqlash hajmi', description: 'Neyronlar orasidagi sinapslar mustahkamlanishi orqali ma\'lumotlar yillar davomida saqlanadi.' }
        ],
        highlight: 'Axborotni takrorlash va his-tuyg\'u bilan bog\'lash uni uzoq muddatli xotiraga o\'tkazishning yagona yo\'lidir.'
      },
      {
        layout: 'kpi_metrics',
        title: 'Xotira Salohiyati va Neyroplastiklik Statistikasi',
        sub: 'Miyadagi neyronlar, sinapslar va axborot saqlash ko\'rsatkichlari',
        photo: 'human brain neuroscience mri scan',
        metrics: [
          { val: '86 mlrd', label: 'Faol Neyronlar Soni', desc: 'Inson miyasidagi axborot uzatuvchi hujayralar' },
          { val: '100 trln', label: 'Sinaptik Bog\'lanishlar', desc: 'Xotira va fikrlashni ta\'minlovchi neyron ko\'priklari' },
          { val: '2.5 PB', label: 'Xotira Sig\'imi (Petabayt)', desc: '300 yil davomida uzluksiz video yozib olishga teng hajm' }
        ],
        points: [
          { heading: 'Neyroplastiklik qobiliyati', description: 'Miya har qanday yoshda yangi bog\'lanishlar hosil qilish va qayta dasturlanish imkoniyatiga ega.' }
        ],
        highlight: 'Doimiy aqliy mehnat va yangi bilimlarni o\'rganish miya yoshini 10-15 yilga yoshartiradi.'
      },
      {
        layout: 'process_timeline',
        title: 'Unutish Qonuniyati va Ebbingauz Tadqiqotlari',
        sub: 'Axborotning vaqt o\'tishi bilan yo\'qolish bosqichlari',
        photo: 'psychology cognitive test science memory',
        points: [
          { heading: '1-soatdan keyin: 50% yo\'qolish', description: 'Yangi ma\'lumot takrorlanmasa, birinchi soatdayoq uning yarmi unutiladi.' },
          { heading: '1-kundan keyin: 70% unutilish', description: 'Miyadagi vaqtinchalik sinaptik izlar so\'nib, faqat eng yorqin obrazlar qoladi.' },
          { heading: 'Intervalli takrorlash effekti', description: '24 soat, 3 kun va 1 haftadan so\'ng takrorlash xotira barqarorligini 95% ga yetkazadi.' }
        ],
        highlight: 'Unutish bu kamchilik emas, balki miyani ortiqcha axborot shovqinidan tozalovchi himoya mexanizmidir.'
      },
      {
        layout: 'matrix_grid',
        title: 'Miyaga Salbiy Ta\'sir Qiluvchi Kognitiv Xatarlar',
        sub: 'Diqqat tarqoqligi va xotira susayishining to\'rtta asosiy omili',
        photo: 'stress human mind psychological counseling',
        points: [
          { heading: 'Surunkali Stress va Kortizol', description: 'Kortizol gormoni gippokampdagi yangi neyronlar paydo bo\'lishini to\'xtatadi.' },
          { heading: 'Axborot Shovqini va Gadjetlar', description: 'Doimiy qisqa videolarni tomosha qilish chuqur konsentratsiya qobiliyatini yo\'qotadi.' },
          { heading: 'Uyqu Yetishmovchiligi', description: 'Miya faqat chuqur uyqu fazasida kunduzgi xotiralarni tartibga soladi va tozalaydi.' },
          { heading: 'Kognitiv Passivlik', description: 'Miyani yangi qiyin vazifalar bilan yuklamaslik sinaptik bog\'lanishlarni zaiflashtiradi.' }
        ],
        highlight: 'Sog\'lom uyqu va axborot parhezi yuqori aqliy salohiyatning eng muhim garovidir.'
      },
      {
        layout: 'spotlight',
        title: 'Mnemotexnika va Xotirani Kuchaytirish Usullari',
        sub: 'Eslab qolish samaradorligini 5-10 barobarga oshirish usullari',
        photo: 'brain health neuroscience mental wellness',
        spotlightText: 'Eng kuchli xotira texnikasi bu quruq yodlash emas, balki axborotni tasavvur, tuyg\'u va makon bilan bog\'lashdir (Rim xonasi usuli).',
        points: [
          { heading: 'Assotsiatsiyalar zanjiri', description: 'Yangi raqamlar yoki atamalarni tanish bo\'lgan kulgili va g\'alati obrazlarga bog\'lash.' },
          { heading: 'Feynman usuli', description: 'O\'rganilgan mavzuni 10 yoshli bolaga tushuntirgandek sodda so\'zlar bilan qayta aytib berish.' }
        ],
        highlight: 'Tushunib o\'rganilgan bilim umrbod inson intellektining bir qismiga aylanadi.'
      },
      {
        layout: 'cinematic',
        title: 'Sun\'iy Intellekt va Inson Miyasi Qiyosi',
        sub: 'Biologik neyronlar va sun\'iy neyron tarmoqlarining o\'xshashliklari',
        photo: 'artificial intelligence and human brain comparison',
        points: [
          { heading: 'Neyron tarmoqlari tuzilishi', description: 'Zamonaviy chuqur o\'rganish modellari inson miyasi po\'stlog\'i arxitekturasidan ilhomlangan.' },
          { heading: 'Energiya sarfi samaradorligi', description: 'Inson miyasi bor-yo\'g\'i 20 vatt energiya sarflab, superkompyuterlardan aqlliroq ishlaydi.' },
          { heading: 'Tuyg\'ular va ijodkorlik ustunligi', description: 'Intuitsiya, empatiya va ijodiy kashfiyotlar inson idrokining yengilmas afzalligidir.' }
        ],
        highlight: 'Sun\'iy intellekt inson o\'rnini bosmaydi, balki inson aql-zakovatining qudratli qanotiga aylanadi.'
      }
    ];
  }

  // 2. ALISHER NAVOIY, ADABIYOT VA TARIX
  if (t.includes('navoiy') || t.includes('adabiyot') || t.includes('sheriyat') || t.includes('tarix') || t.includes('madaniyat')) {
    return [
      {
        layout: 'split_hero',
        title: 'Alisher Navoiy: Hayoti va Davri Muhiti',
        sub: 'Hirot muhiti, Temuriylar Renessansi va barkamol shaxs shakllanishi',
        photo: 'ancient central asia architecture herat samarkand',
        points: [
          { heading: 'Temuriylar madaniy muhiti', description: 'XV asr Hirot shahri Sharqning ilm-fan, san\'at va adabiyot poytaxti bo\'lgan.' },
          { heading: 'Ustozlar va ilk e\'tirof', description: 'Mavlono Lutfiy yosh Alisherning birgina g\'azalini o\'zining barcha she\'rlariga almashishini aytgan.' },
          { heading: 'Husayn Boyqaro bilan do\'stlik', description: 'Maktabdoshlikdan boshlangan sadoqat keyinchalik buyuk davlat va madaniyat ittifoqiga aylandi.' }
        ],
        highlight: 'Alisher Navoiy nafaqat daho shoir, balki buyuk ma\'rifatparvar va davlat arbobi edi.'
      },
      {
        layout: 'comparison',
        title: '"Hamsa" - Turkiy Adabiyotning Betakror Cho\'qqisi',
        sub: 'Nizomiy va Dehlaviy an\'anasini turkiy tilda yuksak mahorat bilan yaratishi',
        photo: 'classic oriental poetry calligraphy book manuscript',
        leftHeading: 'Forsiy Hamsachilik An\'anasi',
        rightHeading: 'Navoiyning Turkiy "Hamsa"si',
        points: [
          { heading: 'Tarixiy an\'ana', description: 'O\'sha davrgacha buyuk Hamsalar faqat forsiy tilda yaratilishi mumkin deb hisoblangan.' },
          { heading: 'Tarixiy jasorat va inqilob', description: 'Navoiy bor-yo\'g\'i 2 yilda besh buyuk dostonni turkiy tilda yaratib, jahon adabiyotiga kiritdi.' }
        ],
        highlight: 'Navoiy turkiy tilning boyligi va go\'zalligini butun dunyoga amalda isbotlab berdi.'
      },
      {
        layout: 'kpi_metrics',
        title: 'Navoiy Ijodiy Merosining Ko\'lami va Salohiyati',
        sub: 'Lirik asarlar, dostonlar va so\'z boyligi statistikasi',
        photo: 'ancient islamic madrasah architecture dome blue',
        metrics: [
          { val: '26 000+', label: 'Noyob Lug\'at Boyligi', desc: 'Navoiy asarlarida qo\'llangan unikal so\'zlar soni' },
          { val: '55 000+', label: 'Misralar Salmog\'i', desc: '"Hamsa" va devonlardagi she\'riy baytlar miqdori' },
          { val: '30+', label: 'Yirik Asarlar', desc: 'Dostonlar, ilmiy risolalar, tazkiralar va devonlar' }
        ],
        points: [
          { heading: 'Jahon rekord darajasi', description: 'Shekspir 20 ming, Pushkin 21 ming so\'z ishlatgan bo\'lsa, Navoiy 26 mingdan ortiq so\'z qo\'llagan.' }
        ],
        highlight: 'Navoiy so\'z boyligi bo\'yicha jahon adabiyotining eng boy ijodkori hisoblanadi.'
      },
      {
        layout: 'process_timeline',
        title: 'Davlat Arbobi va Xalqparvar Bunyodkorlik Faoliyati',
        sub: 'Vazirlik yillari va Hirotdagi ulkan ijtimoiy-madaniy qurilishlar',
        photo: 'ancient oriental palace architecture arches',
        points: [
          { heading: 'Bosh vazirlik va adolat', description: 'Xalq manfaatlari himoyasi, soliqlar yengilligi va davlat tizimini isloh qilish.' },
          { heading: 'Xayriya va madrasalar', description: '"Ixlosiya" madrasasi, "Shifoiya" shifoxonasi va ko\'plab kutubxonalar qurdirgan.' },
          { heading: 'Olim va shoirlarga homiylik', description: 'Yuzlab iste\'dodli musavvir, xattot va shoirlarni o\'z hisobidan ta\'minlagan.' }
        ],
        highlight: '"Kimki bir ko\'ngli buzuqning xotirin shod aylagay, oncha borkim Ka\'ba vayron bo\'lsa obod aylagay."'
      },
      {
        layout: 'matrix_grid',
        title: 'Alisher Navoiyning Falsafiy va Badiiy Ustunlari',
        sub: 'Buyuk shoir asarlarining g\'oyaviy-ma\'naviy asoslari',
        photo: 'sufi mystical poetry ancient manuscript book',
        points: [
          { heading: 'Tasavvuf va Irfon ("Lison ut-Tayr")', description: 'Komil inson g\'oyasi, nafsni yengish va Haqqa yetishish yo\'li.' },
          { heading: 'Vatanparvarlik va Adolat', description: 'Xalq baxt-saodati va adolatli shoh orzusi ("Saddi Iskandariy").' },
          { heading: 'Chin Ishq va Sadoqat', description: 'Nafsdan xoli pokiza muhabbat madhi ("Farhod va Shirin", "Layli va Majnun").' },
          { heading: 'Ona Tili Himoyasi ("Muhokamat")', description: 'Turkiy tilning nufuzi, ifoda boyligi va tengsizligini ilmiy isboti.' }
        ],
        highlight: 'Navoiy g\'oyalari asrlar osha insoniyat ma\'naviy kamolotining yo\'lchi yulduzi bo\'lib qolmoqda.'
      },
      {
        layout: 'spotlight',
        title: 'Ona Tilining Quvvati: "Muhokamat ul-Lug\'atayn"',
        sub: 'Milliy g\'urur va ona tilini ilmiy himoya qilgan tengsiz asar',
        photo: 'oriental calligraphy pen ink manuscript art',
        spotlightText: 'Navoiy o\'z xalqini o\'z ona tilida ijod qilishga, o\'z tilini sevishga va uni boyitishga chorlagan birinchi buyuk milliy yetakchidir.',
        points: [
          { heading: 'Ilmiy tahlil va dalillar', description: 'Turkiy tildagi 100 dan ortiq fe\'l va nozik ma\'nodosh so\'zlarni keltirib, uning ustunligini isbotlagan.' },
          { heading: 'Milliy o\'zlikni asrash', description: 'Ona tilini unutish milliy o\'zlikni yo\'qotish bilan teng ekanligini ta\'kidlagan.' }
        ],
        highlight: 'Bu asar o\'zbek tilining xalqaro miqyosdagi mustaqillik manifestidir.'
      },
      {
        layout: 'cinematic',
        title: 'Navoiy Merosining Bugungi Jahondagi O\'rni',
        sub: 'YUNESKO e\'tirofi, xalqaro tarjimalar va o\'lmas adabiy xazina',
        photo: 'unesco heritage central asia oriental museum',
        points: [
          { heading: 'Jahon tillariga tarjimalar', description: 'Asarlari ingliz, fransuz, nemis, rus va o\'nlab sharq tillariga tarjima qilingan.' },
          { heading: 'Parij, Tokio va Vashingtondagi haykallar', description: 'Dunyoning yirik poytaxtlarida Navoiyga ehtirom ramzi sifatida yodgorliklar o\'rnatilgan.' },
          { heading: 'Abadiy ma\'naviy sarchashma', description: 'Bugungi avlod uchun yuksak axloq, vatanparvarlik va ma\'rifat darsligidir.' }
        ],
        highlight: 'Navoiy merosi — insoniyat umumjahon madaniyatining bebaho javohiridir.'
      }
    ];
  }

  // 3. SUN'IY INTELLEKT VA AXBOROT TEXNOLOGIYALARI
  if (t.includes('suniy') || t.includes('intellekt') || t.includes('ai') || t.includes('robot') || t.includes('dastur') || t.includes('texnologiya')) {
    return [
      {
        layout: 'split_hero',
        title: 'Sun\'iy Intellekt va Yangi Texnologik Era',
        sub: 'Algoritmlar, neyron tarmoqlar va global raqamli transformatsiya',
        photo: 'humanoid robot artificial intelligence face 4k',
        points: [
          { heading: 'Texnologik inqilob', description: 'Sun\'iy intellekt bugun elektr toki yoki internet kashf qilinganidek barcha sohalarni o\'zgartirmoqda.' },
          { heading: 'Avtomatlashtirish sur\'ati', description: 'Takrorlanuvchi amallarning 70% dan ortig\'i aqlli algoritmlarga topshirilmoqda.' },
          { heading: 'Ma\'lumotlar tahlili qudrati', description: 'Katta hajmdagi ma\'lumotlar (Big Data) soniyalar ichida qayta ishlanib, aniq qarorlar chiqarilmoqda.' }
        ],
        highlight: 'Kelajakda sun\'iy intellektdan foydalana olgan mutaxassislar foydalanmaganlarni almashtiradi.'
      },
      {
        layout: 'comparison',
        title: 'Klassik Dasturlash va Mashinali O\'rganish',
        sub: 'Qat\'iy qoidalardan o\'zini-o\'zi o\'qituvchi neyron modellarga o\'tish',
        photo: 'deep learning neural network digital code visualization',
        leftHeading: 'An\'anaviy Dasturlash',
        rightHeading: 'Mashinali O\'rganish (Machine Learning)',
        points: [
          { heading: 'Qat\'iy qoidalar kiritish', description: 'Dasturchi har bir harakat va qoidani qo\'lda yozishi shart bo\'lgan, noaniqliklarga moslasha olmagan.' },
          { heading: 'Tajribadan o\'rganish', description: 'Model millionlab ma\'lumotlar orqali mustaqil qonuniyatlarni topadi va o\'zini takomillashtiradi.' }
        ],
        highlight: 'Neyron tarmoqlar dasturlashni inson miyasi kabi o\'rganuvchi tizim darajasiga ko\'tardi.'
      },
      {
        layout: 'kpi_metrics',
        title: 'Global AI Bozorining O\'sishi va Ko\'rsatkichlari',
        sub: 'Bozor kapitallashuvi, investitsiyalar va iqtisodiy samara',
        photo: 'quantum computing futuristic technology digital processor',
        metrics: [
          { val: '1.3 trln $', label: 'Bozor Hajmi (2030)', desc: 'Global AI sanoatining kutilayotgan kapitallashuvi' },
          { val: '40%', label: 'Samaradorlik O\'sishi', desc: 'Biznes jarayonlarini avtomatlashtirish hisobiga o\'sish' },
          { val: '97 mln', label: 'Yangi Ish O\'rinlari', desc: 'Raqamli iqtisodiyotda yaratiladigan yangi kasblar' }
        ],
        points: [
          { heading: 'Iqtisodiy lokomotiv', description: 'Sun\'iy intellekt global yalpi ichki mahsulotga 15.7 trillion dollar qo\'shimcha qiymat kiritadi.' }
        ],
        highlight: 'AI investitsiyalari bugungi kunda eng yuqori daromad keltiruvchi yo\'nalishga aylandi.'
      },
      {
        layout: 'process_timeline',
        title: 'Sanoat va Xizmat Ko\'rsatishda Robototexnika',
        sub: 'Oddiy mexanik robotlardan aqlli avtonom yechimlargacha',
        photo: 'industrial robotics automation factory modern',
        points: [
          { heading: '1-Bosqich: Manipulyatorlar', description: 'Zavodlarda og\'ir va xavfli ishlarni bajaruvchi dasturlashtirilgan robot-qo\'llar.' },
          { heading: '2-Bosqich: Avtonom Logistika', description: 'Omborlar va transportda inson aralashuvisiz harakatlanuvchi AGV robotlari.' },
          { heading: '3-Bosqich: Gumanoid Robotlar', description: 'Inson qiyofasidagi kognitiv robotlar xizmat ko\'rsatish va tibbiyotda yordamchiga aylanmoqda.' }
        ],
        highlight: 'Robototexnika insonni xavfli va og\'ir jismoniy mehnatdan butunlay ozod qilmoqda.'
      },
      {
        layout: 'matrix_grid',
        title: 'AI Qo\'llanilayotgan Eng Muhim 4 Soha',
        sub: 'Kundalik hayotimiz va global iqtisodiyotdagi amaliy yutuqlar',
        photo: 'artificial intelligence medicine healthcare doctor robot',
        points: [
          { heading: 'Tibbiyot va Diagnostika', description: 'MRT va rentgen tasvirlaridan kasalliklarni shifokorlardan 3 barobar tezroq aniqlash.' },
          { heading: 'Ta\'lim va Shaxsiy Mentor', description: 'Har bir o\'quvchining qobiliyatiga moslashgan individual ta\'lim traektoriyasi.' },
          { heading: 'Moliya va Kiberxavfsizlik', description: 'Firibgarlik tranzaksiyalarini soniyaning ulushlarida bloklash va prognozlash.' },
          { heading: 'Aqlli Shaharlar va Transport', description: 'Tirbandliklarni kamaytirish, haydovchisiz avtomobillar va resurslarni tejash.' }
        ],
        highlight: 'Har bir sohada sun\'iy intellekt samaradorlikni tubdan yangi bosqichga olib chiqmoqda.'
      },
      {
        layout: 'spotlight',
        title: 'Axloqiy Xatarlar va Xavfsizlik Masalalari',
        sub: 'Texnologiyalar rivojida inson huquqlari va ma\'lumotlar xavfsizligi',
        photo: 'cyber security digital code technology shield',
        spotlightText: 'Sun\'iy intellektning qudrati qanchalik ortsa, uning xavfsizligi, shaffofligi va insoniyat qadriyatlariga bo\'ysunishi shunchalik muhim bo\'ladi.',
        points: [
          { heading: 'Deepfake va Dezinformatsiya', description: 'Haqiqat va soxtalik chegarasini himoya qilish uchun yangi kriptografik standartlar zarur.' },
          { heading: 'Mehnat bozori moslashuvi', description: 'Xodimlarni yangi zamonaviy kasblarga qayta o\'qitish davlatlarning birlamchi vazifasidir.' }
        ],
        highlight: 'Texnologiya vosita xolos, uning maqsadi va axloqiy mezonlarini inson belgilaydi.'
      },
      {
        layout: 'cinematic',
        title: 'Kelgusi O\'n Yillik: Kvant Hisoblash va AGI',
        sub: 'Umumiy sun\'iy intellekt (AGI) va insoniyat kelajagi sari yo\'l',
        photo: 'future technology artificial intelligence ethics society',
        points: [
          { heading: 'Kvant kompyuterlar qudrati', description: 'Murakkab ilmiy muammolar ming yillar emas, daqiqalar ichida yechiladi.' },
          { heading: 'Yangi dori va materiallar', description: 'AI yordamida ilgari tasavvur qilib bo\'lmagan yangi kimyoviy elementlar kashf etiladi.' },
          { heading: 'Garmonik hamkorlik', description: 'Inson aqli va sun\'iy intellekt simbiozi global muammolarni hal qilish kalitidir.' }
        ],
        highlight: 'Kelajak allaqachon boshlangan, faqat uni ongli ravishda to\'g\'ri yo\'naltirish lozim.'
      }
    ];
  }

  // 4. IQTISODIYOT, MOLIYA VA BIZNES
  if (t.includes('iqtisod') || t.includes('biznes') || t.includes('moliya') || t.includes('investitsiya') || t.includes('bank') || t.includes('savdo')) {
    return [
      {
        layout: 'split_hero',
        title: `${topic}: Bozor Tahlili va Iqtisodiy O\'sish`,
        sub: 'Makroiqtisodiy ko\'rsatkichlar va global bozor dinamikasi',
        photo: 'modern city skyline corporate business finance 4k',
        points: [
          { heading: 'Bozor tendensiyalari', description: 'Raqobatbardoshlikni oshirish va yangi eksport bozorlariga chiqishning ustuvor yo\'nalishlari.' },
          { heading: 'Moliyaviy barqarorlik', description: 'Investitsiyalarni jalb qilish va risklarni oqilona boshqarish mexanizmlari.' },
          { heading: 'Raqamlashtirish samaradorligi', description: 'Biznes jarayonlarini raqamlashtirish operatsion xarajatlarni 30-40% ga qisqartiradi.' }
        ],
        highlight: 'To\'g\'ri iqtisodiy strategiya har qanday inqiroz sharoitida ham barqaror o\'sishni ta\'minlaydi.'
      },
      {
        layout: 'comparison',
        title: 'An\'anaviy Savdo va Raqamli E-Commerce',
        sub: 'Klassik savdo do\'konlaridan global elektron platformalarga o\'tish',
        photo: 'fintech digital banking online payment technology',
        leftHeading: 'An\'anaviy Chakana Savdo',
        rightHeading: 'Elektron Tijorat (E-Commerce)',
        points: [
          { heading: 'Cheklangan mijozlar qamrovi', description: 'Faqat ma\'lum bir hudud bilan cheklangan, yuqori ijara va ma\'muriy xarajatlar talab etadi.' },
          { heading: 'Global va 24/7 qamrov', description: 'Istalgan nuqtadan onlayn buyurtma berish, avtomatlashtirilgan logistika va arzon operatsiyalar.' }
        ],
        highlight: 'Elektron tijorat savdo chegaralarini yo\'qotib, eksport imkoniyatlarini keskin kengaytiradi.'
      },
      {
        layout: 'kpi_metrics',
        title: 'Moliyaviy Natijalar va O\'sish Sur\'atlari',
        sub: 'Rentabellik, sarmoyalar qaytishi va asosiy ko\'rsatkichlar',
        photo: 'global economic financial stock market chart analytics',
        metrics: [
          { val: '+35%', label: 'Yillik Daromad O\'sishi', desc: 'Optimallashtirish hisobiga olingan sof foyda sur\'ati' },
          { val: '2.8x', label: 'ROI (Sarmoya Qaytishi)', desc: 'Kiritilgan har 1 dollar investitsiyadan olingan natija' },
          { val: 'TOP 5', label: 'Bozor Segmentidagi O\'rin', desc: 'Raqobatchilar orasida egallangan yetakchi pozitsiya' }
        ],
        points: [
          { heading: 'Kapital oqimi barqarorligi', description: 'Xorijiy va mahalliy investitsiyalar oqimi barqaror dinamikani ko\'rsatmoqda.' }
        ],
        highlight: 'Aniq moliyaviy hisob-kitoblar kelgusi barcha muvaffaqiyatlarning eng mustahkam poydevoridir.'
      },
      {
        layout: 'process_timeline',
        title: 'Investitsiyalarni Jalb Qilish va Loyihalash',
        sub: 'Startap g\'oyadan yirik rentabelli korxonagacha bo\'lgan bosqichlar',
        photo: 'foreign investment business growth office capital',
        points: [
          { heading: '1-Bosqich: Biznes Reja va Audit', description: 'Bozor talabini o\'rganish, raqobatchilar tahlili va moliyaviy model tuzish.' },
          { heading: '2-Bosqich: Investorlar Bilan Muzokara', description: 'Taqdimot (Pitch deck) qilish, shartnoma shartlari va ulushlarni kelishish.' },
          { heading: '3-Bosqich: Masshtablashtirish', description: 'Yangi bozorlarni egallash va avtomatlashtirilgan boshqaruvni joriy etish.' }
        ],
        highlight: 'Izchil reja va kuchli jamoa har qanday loyihaga sarmoya jalb qilishning kafolatidir.'
      },
      {
        layout: 'matrix_grid',
        title: 'Biznes Barqarorligining 4 Ta Asosiy Ustuni',
        sub: 'Har qanday kompaniyaning muvaffaqiyatini ta\'minlovchi tizim',
        photo: 'international trade cargo logistics shipping port',
        points: [
          { heading: 'Mijozlar Ehtiyoji (Customer Care)', description: 'Mijozlarning doimiy sodiqligini ta\'minlovchi yuqori servis sifati.' },
          { heading: 'Kuchli Jamoa va Liderlik', description: 'Professional motivatsiyaga ega xodimlar va aniq vazifalar taqsimoti.' },
          { heading: 'Moliyaviy Intizom', description: 'Har bir xarajat va daromadni kunlik tahlil qilib, kassa uzilishlariga yo\'l qo\'ymaslik.' },
          { heading: 'Innovatsiya va Moslashuvchanlik', description: 'Bozor o\'zgarishlariga tezkor javob berish va yangi mahsulotlar yaratish.' }
        ],
        highlight: 'Ushbu to\'rt ustun mustahkam bo\'lsa, biznes har qanday inqirozdan kuchliroq bo\'lib chiqadi.'
      },
      {
        layout: 'spotlight',
        title: 'Startap Ekotizimi va Yangi Avlod Biznesi',
        sub: 'Zamonaviy tadbirkorlik va innovatsion ekotizim imkoniyatlari',
        photo: 'modern startup technology office creative teamwork',
        spotlightText: 'Bugungi dunyoda eng yirik korxonalar eng ko\'p binosi borlar emas, balki eng tezkor innovatsiya kiritgan startaplardir.',
        points: [
          { heading: 'Venchur kapitali imkoniyatlari', description: 'Istiqlolli g\'oyalarga xalqaro fondlar tomonidan millionlab dollar sarmoyalar kiritilmoqda.' },
          { heading: 'Moslashuvchan (Agile) boshqaruv', description: 'Byurokratiyasiz tezkor qarorlar qabul qilish va mahsulotni tezda bozorga chiqarish.' }
        ],
        highlight: 'Yangi davr biznesi bu tezlik, ijodkorlik va mijozga samimiy xizmat qilishdir.'
      },
      {
        layout: 'cinematic',
        title: 'Kelajak Iqtisodiyoti: Trendlar va Prognozlar',
        sub: 'Yashil energiya, aylanma iqtisodiyot va global integratsiya',
        photo: 'successful business investment future growth roadmap',
        points: [
          { heading: 'Yashil Iqtisodiyot (ESG)', description: 'Ekologik toza va barqaror ishlab chiqarish korxonalariga ustuvorlik berilishi.' },
          { heading: 'Sun\'iy Intellekt Moliyasi', description: 'Kreditlash, buxgalteriya va tahlillarning to\'liq avtomatlashtirilishi.' },
          { heading: 'Global integratsiya', description: 'Chegarasiz to\'lovlar va xalqaro bozorlarda erkin ishtirok etish imkoniyati.' }
        ],
        highlight: 'Kelajak iqtisodiyoti innovatsiyalarga ochiq va mas\'uliyatli korxonalarnikidir.'
      }
    ];
  }

  // 5. UNIVERSAL / BOSHQA MAVZULAR (Har qanday mavzuni chuqur sohaviy tahlil qilish)
  return [
    {
      layout: 'split_hero',
      title: `${topic}: Kirish va Fundamental Mohiyat`,
      sub: 'Nazariy poydevor, tushunchalar va asosiy maqsadlar',
      photo: `${enKeywords} fundamental research concept`,
      points: [
        { heading: 'Mavzuning dolzarbligi', description: `${topic} bugungi kunda sohaning eng muhim va dolzarb masalalaridan biri hisoblanadi.` },
        { heading: 'Asosiy maqsad va vazifalar', description: 'Mavjud muammolarni tizimli tahlil qilib, samarali amaliy yechimlarni topish.' },
        { heading: 'Kutilayotgan natijadorlik', description: 'Ilg\'or metodologiyalarni qo\'llash orqali jarayonlar unumdorligini oshirish.' }
      ],
      highlight: `${topic} bo'yicha mustahkam nazariy asos barcha amaliy yutuqlarning garovidir.`
    },
    {
      layout: 'comparison',
      title: 'Taqqoslama Tahlil va Yondashuvlar',
      sub: 'An\'anaviy usullar va zamonaviy yechimlar qiyosi',
      photo: `${enKeywords} analysis research comparison`,
      leftHeading: 'An\'anaviy Yondashuv',
      rightHeading: 'Zamonaviy Yechim',
      points: [
        { heading: 'Vaqt va resurs sarfi', description: 'Eski usullarda ko\'p vaqt sarfi va yuqori xatolik xavfi mavjud edi.' },
        { heading: 'Zamonaviy optimallashtirish', description: 'Yangi texnologiyalar bilan jarayonlar 70% ga tezlashadi va barqarorlashadi.' }
      ],
      highlight: 'Zamonaviy metodologiyaga o\'tish orqali xarajatlar va xatolar keskin qisqaradi.'
    },
    {
      layout: 'kpi_metrics',
      title: 'Asosiy Ko\'rsatkichlar va Natijadorlik',
      sub: 'Miqdoriy ko\'rsatkichlar, o\'sish sur\'atlari va statistika',
      photo: `${enKeywords} statistics data growth chart`,
      metrics: [
        { val: '+85%', label: 'Samaradorlik O\'sishi', desc: 'Jarayonlarni optimallashtirish hisobiga olingan o\'sish sur\'ati' },
        { val: '3.5x', label: 'Tezlik va Unumdorlik', desc: 'Resurslardan foydalanish tezligining oshishi' },
        { val: 'TOP 1', label: 'Ustuvor Yo\'nalish', desc: 'Xalqaro standartlar bo\'yicha yetakchi ko\'rsatkich' }
      ],
      points: [
        { heading: 'Sohaviy dinamika', description: 'Yillik barqaror o\'sish sur\'atlari yuqori rivojlanishni namoyon etmoqda.' }
      ],
      highlight: 'Statistik dalillar va aniq raqamlar strategiya to\'g\'ri tanlanganligini isbotlaydi.'
    },
    {
      layout: 'process_timeline',
      title: 'Bosqichma-bosqich Amalga Oshirish',
      sub: 'Rejadan natijagacha bo\'lgan harakatlar zanjiri',
      photo: `${enKeywords} steps process roadmap development`,
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
      photo: `${enKeywords} system structure innovation modern`,
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
      photo: `${enKeywords} real practice experience case study`,
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
      photo: `${enKeywords} future perspective technology vision`,
      points: [
        { heading: 'Global integratsiya', description: 'Xalqaro tajriba va zamonaviy standartlarga faol qo\'shilish.' },
        { heading: 'Raqamli transformatsiya', description: 'Zamonaviy avtomatlashtirish yechimlarini keng tatbiq etish.' },
        { heading: 'Doimiy yetakchilik', description: 'Yangi yutuqlarni mustahkamlab, o\'z sohasida eng ilg\'or darajaga erishish.' }
      ],
      highlight: 'Kelajak bugun qabul qilingan to\'g\'ri va dadil qarorlar bilan yaratiladi.'
    }
  ];
}

function getLocalizedGenericStages(topic, enKeywords, language) {
  if (language === 'ru') {
    return [
      {
        layout: 'split_hero',
        title: `${topic}: Суть и Стратегические Цели`,
        sub: 'Концептуальные основы, теоретический базис и приоритетные задачи',
        photo: `${enKeywords} concept analysis professional`,
        points: [
          {
            heading: 'Актуальность и системная трансформация',
            description: `Современные динамичные условия требуют глубокого переосмысления устоявшихся подходов по направлению "${topic}". Внедрение передовых стандартов повышает общую результативность на 35-50% и гарантирует устойчивость к внешним факторам.`
          },
          {
            heading: 'Стратегический вектор и целеполагание',
            description: 'Построение сбалансированной модели развития позволяет задействовать скрытый внутренний потенциал. Рациональное планирование исключает неоправданные риски и формирует надежный фундамент для долгосрочного прогресса.'
          },
          {
            heading: 'Ожидаемый экономический и качественный эффект',
            description: 'Системная модернизация процессов обеспечивает кратное сокращение операционных задержек. В результате достигается качественно новый уровень надежности и масштабируемости ключевых процессов.'
          }
        ],
        highlight: 'Правильно заложенный системный фундамент — ключевой залог успешного долгосрочного развития.'
      },
      {
        layout: 'comparison',
        title: 'Сравнительный Анализ и Подходы',
        sub: 'Сопоставление традиционных методов и современных инновационных решений',
        photo: `${enKeywords} research comparison analytics`,
        leftHeading: 'Традиционный подход',
        rightHeading: 'Инновационное решение',
        points: [
          {
            heading: 'Затраты времени и ресурсов',
            description: 'Устаревшие консервативные методы требуют больших трудозатрат, страдают от фрагментарности данных и несут повышенный риск операционных ошибок.'
          },
          {
            heading: 'Современная оптимизация процессов',
            description: 'Передовые технологии ускоряют выполнение ключевых задач более чем на 70%, обеспечивая автоматический контроль точности и абсолютную прозрачность.'
          }
        ],
        highlight: 'Переход на передовые стандарты кратно сокращает издержки и исключает вероятность системных сбоев.'
      },
      {
        layout: 'kpi_metrics',
        title: 'Ключевые Показатели и Результаты',
        sub: 'Количественные индикаторы, динамика роста и отраслевая статистика',
        photo: `${enKeywords} data chart growth statistics`,
        metrics: [
          { val: '+85%', label: 'Рост эффективности', desc: 'Прирост производительности за счет комплексной оптимизации процессов' },
          { val: '3.5x', label: 'Скорость процессов', desc: 'Многократное ускорение цикла использования ключевых ресурсов' },
          { val: 'TOP 1', label: 'Лидирующая позиция', desc: 'Высший стандарт качества и надежности в профессиональной среде' }
        ],
        points: [
          {
            heading: 'Отраслевые ориентиры и динамика',
            description: 'Стабильные количественные показатели наглядно демонстрируют высокую эффективность выбранной траектории развития. Измеримые метрики подтверждают правильность инвестиций и системных изменений.'
          }
        ],
        highlight: 'Фактические эмпирические данные и объективные цифры подтверждают точность стратегического курса.'
      },
      {
        layout: 'process_timeline',
        title: 'Поэтапная Дорожная Карта',
        sub: 'Цепочка последовательных действий: от планирования до измеримого результата',
        photo: `${enKeywords} steps process roadmap development`,
        points: [
          {
            heading: 'Этап 1: Анализ и Комплексная Диагностика',
            description: 'Глубокий аудит текущего состояния, аудит потребностей и формирование детального технического задания с оценкой возможных рисков.'
          },
          {
            heading: 'Этап 2: Практическая Интеграция',
            description: 'Поэтапное внедрение передовых инструментов, обучение ключевых специалистов и пилотное тестирование в реальных условиях.'
          },
          {
            heading: 'Этап 3: Масштабирование и Контроль',
            description: 'Распространение проверенной методики на всю систему, непрерывный мониторинг KPI и адаптация под новые вызовы.'
          }
        ],
        highlight: 'Четкая дорожная карта и последовательная реализация являются гарантией достижения запланированного результата.'
      },
      {
        layout: 'matrix_grid',
        title: 'Ключевые Столпы Системы',
        sub: 'Четыре ключевых системных драйвера успешного устойчивого развития',
        photo: `${enKeywords} system structure innovation modern`,
        points: [
          {
            heading: 'Инфраструктура и Технологии',
            description: 'Создание отказоустойчивой материально-технической базы и использование современного надежного инструментария.'
          },
          {
            heading: 'Человеческий Капитал',
            description: 'Привлечение специалистов высокой квалификации, непрерывное развитие компетенций и формирование культуры лидерства.'
          },
          {
            heading: 'Управление и Стандарты',
            description: 'Внедрение прозрачных регламентов работы и строгое следование международным отраслевым стандартам качества.'
          },
          {
            heading: 'Инновационный Поток',
            description: 'Постоянный поиск перспективных идей, исследовательская деятельность и быстрое прототипирование решений.'
          }
        ],
        highlight: 'Синергия всех четырех фундаментальных опор гарантирует абсолютную устойчивость всей системы.'
      },
      {
        layout: 'spotlight',
        title: 'Практические Кейсы и Опыт',
        sub: 'Анализ успешной прикладной практики и реальных отраслевых достижений',
        photo: `${enKeywords} real practice experience case study`,
        spotlightText: `В направлении "${topic}" наибольший прорыв достигается на стыке глубокой академической теории и проверенного практического опыта.`,
        points: [
          {
            heading: 'Кейс 1: Быстрая адаптация и результат',
            description: 'Уже в рамках первого пилотного периода зафиксирован прирост ключевых показателей на 40% выше первоначального прогноза.'
          },
          {
            heading: 'Кейс 2: Долгосрочная устойчивость',
            description: 'Все потенциальные риски были своевременно нивелированы, что позволило сохранить восходящую динамику роста.'
          }
        ],
        highlight: 'Практический проверенный опыт ценнее любых абстрактных теоретических гипотез.'
      },
      {
        layout: 'cinematic',
        title: 'Перспективы и Тренды Будущего',
        sub: 'Новые горизонты, глобальные ориентиры развития и цифровая трансформация',
        photo: `${enKeywords} future perspective technology vision`,
        points: [
          {
            heading: 'Глобальная интеграция и партнерство',
            description: 'Активный обмен передовым международным опытом и интеграция в ведущие мировые профессиональные сообщества.'
          },
          {
            heading: 'Цифровая трансформация',
            description: 'Широкое применение интеллектуальных алгоритмов обработки данных и автоматизация рутинных операций.'
          },
          {
            heading: 'Укрепление долгосрочного лидерства',
            description: 'Формирование новых стандартов в своей отрасли и непрерывное закрепление конкурентных преимуществ.'
          }
        ],
        highlight: 'Будущее создается сегодня смелыми, дальновидными и научно обоснованными решениями.'
      }
    ];
  }

  if (language === 'en') {
    return [
      {
        layout: 'split_hero',
        title: `${topic}: Core Concept & Strategic Imperatives`,
        sub: 'Conceptual foundation, theoretical basis, and priority objectives',
        photo: `${enKeywords} concept analysis professional`,
        points: [
          {
            heading: 'Strategic Relevance & Systemic Shift',
            description: `Dynamic environmental shifts demand a thorough re-evaluation of established practices regarding "${topic}". Adopting modern benchmarks elevates operational performance by 35-50% while guaranteeing structural resilience against disruption.`
          },
          {
            heading: 'Long-term Strategic Vision',
            description: 'Formulating a balanced operational architecture enables organizations to activate dormant capabilities. Disciplined planning mitigates vulnerabilities and constructs an enduring springboard for scalable expansion.'
          },
          {
            heading: 'Measurable Value Creation',
            description: 'Modernizing core processes dramatically reduces friction across operational channels. As a result, teams achieve superior execution consistency and institutional agility.'
          }
        ],
        highlight: 'A sound structural foundation is the essential cornerstone of enduring long-term competitive advantage.'
      },
      {
        layout: 'comparison',
        title: 'Comparative Methodology & Paradigms',
        sub: 'Contrasting legacy operational models with modern innovative breakthroughs',
        photo: `${enKeywords} research comparison analytics`,
        leftHeading: 'Conventional Paradigm',
        rightHeading: 'Innovative Solution',
        points: [
          {
            heading: 'Resource Drain & Manual Overhead',
            description: 'Legacy workflows carry heavy manual friction, suffer from siloed information, and present unacceptably high operational error rates.'
          },
          {
            heading: 'Modern Systematic Optimization',
            description: 'Modern architectures accelerate turnaround cycles by over 70%, embedding automated precision checks and end-to-end accountability.'
          }
        ],
        highlight: 'Migrating to advanced operational standards substantially reduces overhead while eliminating systemic failures.'
      },
      {
        layout: 'kpi_metrics',
        title: 'Key Benchmarks & Measurable Impact',
        sub: 'Quantitative performance indicators, market benchmarks, and growth trajectory',
        photo: `${enKeywords} data chart growth statistics`,
        metrics: [
          { val: '+85%', label: 'Efficiency Gain', desc: 'Substantial output surge driven by end-to-end workflow optimization' },
          { val: '3.5x', label: 'Execution Velocity', desc: 'Turnaround acceleration across key critical operational resources' },
          { val: 'TOP 1', label: 'Benchmark Status', desc: 'Highest standard of excellence and reliability across modern benchmarks' }
        ],
        points: [
          {
            heading: 'Empirical Metrics & Industry Standing',
            description: 'Rigorous quantitative indicators confirm the robust momentum of the strategic roadmap. Measurable metrics validate the underlying investment and architectural transformation.'
          }
        ],
        highlight: 'Transparent empirical evidence and concrete data confirm the accuracy of our strategic trajectory.'
      },
      {
        layout: 'process_timeline',
        title: 'Comprehensive Implementation Roadmap',
        sub: 'A disciplined execution sequence from discovery to verified outcomes',
        photo: `${enKeywords} steps process roadmap development`,
        points: [
          {
            heading: 'Phase 1: Discovery & Comprehensive Diagnosis',
            description: 'Rigorous baseline auditing, stakeholder requirement alignment, and thorough risk-impact assessment.'
          },
          {
            heading: 'Phase 2: Phased Execution & Integration',
            description: 'Staged deployment of validated toolchains, specialized talent upskilling, and controlled pilot validation.'
          },
          {
            heading: 'Phase 3: Systemic Scaling & Governance',
            description: 'Enterprise-wide rollout of verified methodologies, ongoing KPI monitoring, and iterative performance refinement.'
          }
        ],
        highlight: 'A structured roadmap and disciplined milestone execution guarantee outstanding strategic results.'
      },
      {
        layout: 'matrix_grid',
        title: 'Core Pillars of the Operational System',
        sub: 'The four structural drivers powering resilient organizational success',
        photo: `${enKeywords} system structure innovation modern`,
        points: [
          {
            heading: 'Infrastructure & Tooling',
            description: 'Engineering an ultra-reliable technical foundation equipped with modern, resilient analytical instruments.'
          },
          {
            heading: 'Human Expertise & Talent',
            description: 'Attracting high-caliber specialists, fostering continuous learning, and nurturing an empowering culture of leadership.'
          },
          {
            heading: 'Governance & Standards',
            description: 'Establishing transparent operating protocols aligned with internationally validated benchmarks and regulatory standards.'
          },
          {
            heading: 'Continuous Innovation Pipeline',
            description: 'Cultivating proactive research, rapid prototyping capabilities, and systematic integration of emerging solutions.'
          }
        ],
        highlight: 'The synergy of all four structural pillars provides unmatched organizational durability and stability.'
      },
      {
        layout: 'spotlight',
        title: 'Empirical Case Studies & Validated Insights',
        sub: 'Analysis of real-world deployments and verified breakthrough outcomes',
        photo: `${enKeywords} real practice experience case study`,
        spotlightText: `In the domain of "${topic}", the greatest breakthroughs emerge precisely where rigorous academic theory converges with proven real-world execution.`,
        points: [
          {
            heading: 'Case Study 1: Rapid Adoption & Early Impact',
            description: 'The initial rollout milestone demonstrated a 40% performance gain exceeding conservative baseline projections.'
          },
          {
            heading: 'Case Study 2: Long-Term Operational Durability',
            description: 'Systemic vulnerabilities were proactively mitigated, safeguarding steady compounding growth.'
          }
        ],
        highlight: 'Validated empirical practice provides far greater value and security than ungrounded theoretical assumptions.'
      },
      {
        layout: 'cinematic',
        title: 'Future Horizons & Strategic Frontiers',
        sub: 'Emerging opportunities, global industry trajectories, and digital evolution',
        photo: `${enKeywords} future perspective technology vision`,
        points: [
          {
            heading: 'Global Synergy & Ecosystem Networks',
            description: 'Active cross-border collaboration and strategic integration with leading international professional networks.'
          },
          {
            heading: 'Digital Transformation & Automation',
            description: 'Deep integration of intelligent data-driven algorithms to streamline complex workflows and accelerate decision-making.'
          },
          {
            heading: 'Sustained Sector Leadership',
            description: 'Setting progressive benchmarks and institutionalizing durable competitive advantages across the landscape.'
          }
        ],
        highlight: 'The future is actively forged today through courageous, visionary, and data-backed decisions.'
      }
    ];
  }

  if (language === 'tg') {
    return [
      {
        layout: 'split_hero',
        title: `${topic}: Моҳият ва Ҳадафҳои Стратегӣ`,
        sub: 'Асосҳои консептуалӣ, заминаи назариявӣ ва вазифаҳои афзалиятнок',
        photo: `${enKeywords} concept analysis professional`,
        points: [
          {
            heading: 'Аҳамият ва таҳаввулоти низомманд',
            description: `Шароити муосир таҷдиди назари амиқи усулҳои пешинаро дар самти "${topic}" тақозо мекунад. Татбиқи стандартҳои пешрафта самаранокиро 35-50% боло бурда, устувориро дар баробари омилҳои беруна кафолат медиҳад.`
          },
          {
            heading: 'Самти стратегӣ ва ҳадафгузорӣ',
            description: 'Бунёди модели мутавозини рушд имкон медиҳад, ки тамоми иқтидори дохилӣ ба кор андохта шавад. Банақшагирии дақиқ хавфҳои идоравиро бартараф сохта, пояи мустаҳками пешравиро мегузорад.'
          },
          {
            heading: 'Самаранокии чашмдошти иқтисодӣ ва сифатӣ',
            description: 'Таҷдиди низомманди равандҳо суръати иҷрои вазифаҳоро ба таври назаррас меафзояд. Дар натиҷа сатҳи сифат ва эътимоднокии тамоми сохтор боло меравад.'
          }
        ],
        highlight: 'Пойдевори дурусти назариявӣ кафили асосии комёбиҳои дарозмуддат ва устувор мебошад.'
      },
      {
        layout: 'comparison',
        title: 'Таҳлили Муқоисавӣ ва Равишҳо',
        sub: 'Муқоисаи усулҳои анъанавӣ бо роҳҳои ҳалли инноватсионӣ ва муосир',
        photo: `${enKeywords} research comparison analytics`,
        leftHeading: 'Усули анъанавӣ',
        rightHeading: 'Роҳи ҳалли инноватсионӣ',
        points: [
          {
            heading: 'Сарфи зиёди вақт ва захираҳо',
            description: 'Усулҳои кӯҳна меҳнати зиёди дастиро талаб мекарданд ва хавфи хатогиҳои инсониро хеле зиёд менамуданд.'
          },
          {
            heading: 'Оптимизатсияи муосири равандҳо',
            description: 'Технологияҳои пешқадам суръати иҷрои вазифаҳоро беш аз 70% тезонида, шаффофияти комил ва назорати сифатро фароҳам меоранд.'
          }
        ],
        highlight: 'Гузариш ба стандартҳои муосир хароҷотро якбора кам карда, хатогиҳои эҳтимолиро пешгирӣ мекунад.'
      },
      {
        layout: 'kpi_metrics',
        title: 'Нишондиҳандаҳои Асосӣ ва Натиҷаҳо',
        sub: 'Нишондиҳандаҳои миқдорӣ, суръати рушд ва омори соҳавӣ',
        photo: `${enKeywords} data chart growth statistics`,
        metrics: [
          { val: '+85%', label: 'Афзоиши самаранокӣ', desc: 'Рушди маҳсулнокӣ аз ҳисоби оптимизатсияи пурраи равандҳо' },
          { val: '3.5x', label: 'Суръати амалиёт', desc: 'Тезонидани давраи истифодаи захираҳои калидӣ' },
          { val: 'TOP 1', label: 'Ҷойи аввал дар соҳа', desc: 'Баландтарин нишондиҳандаи сифат аз рӯи меъёрҳо' }
        ],
        points: [
          {
            heading: 'Нишондиҳандаҳои соҳавӣ ва динамика',
            description: 'Омори дақиқи миқдорӣ дурустии самти интихобшударо ба таври равшан нишон медиҳад. Нишондиҳандаҳои ченшаванда самаранокии тағйироти воридшударо собит месозанд.'
          }
        ],
        highlight: 'Далелҳои оморӣ ва рақамҳои воқеӣ дурустии қарорҳои қабулшударо тасдиқ мекунанд.'
      },
      {
        layout: 'process_timeline',
        title: 'Татбиқи Зина ба Зинаи Нақша',
        sub: 'Занҷири амалҳои пайдарпай: аз тарҳрезӣ то ба даст овардани натиҷаи амалӣ',
        photo: `${enKeywords} steps process roadmap development`,
        points: [
          {
            heading: 'Зинаи 1: Ташхис ва Таҳлили Ҳамаҷониба',
            description: 'Омӯзиши амиқи вазъи мавҷуда, муайян кардани ниёзҳо ва таҳияи нақшаи муфассали корӣ бо баҳодиҳии хатарҳо.'
          },
          {
            heading: 'Зинаи 2: Татбиқи Амалии Усулҳо',
            description: 'Ҷорисозии зина ба зинаи воситаҳои озмудашуда, омӯзонидани мутахассисон ва санҷиши аввалия дар амал.'
          },
          {
            heading: 'Зинаи 3: Густариш ва Мониторинг',
            description: 'Фарогирии тамоми низом бо усулҳои нав, назорати доимии сифат ва мутобиқсозӣ ба талаботи замон.'
          }
        ],
        highlight: 'Нақшаи дақиқ ва амалҳои пайгирона кафили боэътимоди расидан ба мақсад мебошанд.'
      },
      {
        layout: 'matrix_grid',
        title: 'Сутунҳои Асосии Низом',
        sub: 'Чор омили калидии пешбарандаи рушди устувор ва дарозмуддат',
        photo: `${enKeywords} system structure innovation modern`,
        points: [
          {
            heading: 'Инфрасохтор ва Технология',
            description: 'Таъсиси заминаи мустаҳками моддию техникӣ ва истифодаи асбобҳои муосиру боэътимоди корӣ.'
          },
          {
            heading: 'Сармояи Инсонӣ',
            description: 'Ҷалби мутахассисони дорои ихтисоси баланд, такмили пайвастаи дониш ва ташаккули фарҳанги пешсафӣ.'
          },
          {
            heading: 'Идоракунӣ ва Стандартҳо',
            description: 'Татбиқи қоидаҳои шаффофи корӣ ва риояи қатъии стандартҳои байналмилалии соҳавӣ.'
          },
          {
            heading: 'Ҷараёни Инноватсияҳо',
            description: 'Ҷустуҷӯи доимии ғояҳои тоза, корҳои таҳқиқотӣ ва татбиқи фаврии қарорҳои судманд.'
          }
        ],
        highlight: 'Ҳамоҳангии комили тамоми чор рукн устувории бебозгашти низомро таъмин мекунад.'
      },
      {
        layout: 'spotlight',
        title: 'Кейсҳои Амалӣ ва Таҷрибаи Воқеӣ',
        sub: 'Таҳлили таҷрибаи бомуваффақияти соҳавӣ ва дастовардҳои мушаххас',
        photo: `${enKeywords} real practice experience case study`,
        spotlightText: `Дар самти "${topic}" комёбии беҳтарин вақте ба даст меояд, ки назарияи амиқи илмӣ бо таҷрибаи амалӣ пайваст гардад.`,
        points: [
          {
            heading: 'Кейси 1: Мутобиқшавии фаврӣ ва натиҷа',
            description: 'Дар давраи аввали санҷиш натиҷаҳои асосӣ нисбат ба чашмдошт 40% баландтар ба қайд гирифта шуданд.'
          },
          {
            heading: 'Кейси 2: Рушди устувори дарозмуддат',
            description: 'Тамоми хатарҳои эҳтимолӣ сари вақт пешгирӣ карда шуда, динамикаи рушд пурра нигоҳ дошта шуд.'
          }
        ],
        highlight: 'Таҷрибаи амалии озмудашуда нисбат ба ҳар гуна назарияи хушк боэътимодтар ва судмандтар аст.'
      },
      {
        layout: 'cinematic',
        title: 'Дурнамои Оянда ва Равандҳои Асосӣ',
        sub: 'Имкониятҳои нав, тамоюлҳои ҷаҳонии рушд ва таҳаввулоти рақамӣ',
        photo: `${enKeywords} future perspective technology vision`,
        points: [
          {
            heading: 'Интегратсия ва Ҳамкории Ҷаҳонӣ',
            description: 'Ҳамкории фаъол бо марказҳои байналмилалии илмию касбӣ ва омӯзиши таҷрибаи пешқадам.'
          },
          {
            heading: 'Табдили Рақамӣ',
            description: 'Татбиқи алгоритмҳои зеҳнӣ барои коркарди иттилоот ва автоматӣ намудани равандҳои душвор.'
          },
          {
            heading: 'Таҳкими Пешвоӣ дар Соҳа',
            description: 'Муқаррар кардани стандартҳои нав ва нигоҳ доштани бартарии доимии рақобатпазирӣ.'
          }
        ],
        highlight: 'Ояндаи дурахшон имрӯз бо қарорҳои далер, дақиқ ва илман асоснокшуда сохта мешавад.'
      }
    ];
  }

  // Uzbek (Default Generic)
  return [
    {
      layout: 'split_hero',
      title: `${topic}: Fundamental Mohiyat va Strategik Maqsadlar`,
      sub: 'Nazariy poydevor, konseptual asoslar va ustuvor vazifalar',
      photo: `${enKeywords} fundamental research concept`,
      points: [
        {
          heading: 'Mavzuning dolzarbligi va tizimli zarurat',
          description: `Bugungi tezkor davr "${topic}" yo'nalishidagi an'anaviy qarashlarni qayta ko'rib chiqishni talab etmoqda. Zamonaviy yondashuvlarni tatbiq etish unumdorlikni 35-50% ga oshiradi va tashqi xatarlarga chidamlilikni kafolatlaydi.`
        },
        {
          heading: 'Strategik maqsad va uzoq muddatli reja',
          description: 'Mavjud imkoniyatlarni chuqur tahlil qilish orqali barcha resurslarni to\'g\'ri yo\'naltirish lozim. Aniq strategiya noaniqliklarni bartaraf etadi va uzoq muddatli yutuqlar uchun mustahkam poydevor yaratadi.'
        },
        {
          heading: 'Kutilayotgan amaliy va iqtisodiy samara',
          description: 'Ilg\'or metodologiyalarni qo\'llash jarayonlar tezligini oshirib, sifat ko\'rsatkichlarini yangi bosqichga olib chiqadi. Natijada xarajatlar tejalib, tizimning umumiy ishonchliligi ta\'minlanadi.'
        }
      ],
      highlight: 'Mustahkam nazariy poydevor va izchil harakatlar strategiyasi yuqori natijalarga erishishning asosiy kalitidir.'
    },
    {
      layout: 'comparison',
      title: 'Taqqoslama Tahlil va Metodologiyalar',
      sub: 'An\'anaviy konservativ usullar va zamonaviy innovatsion yechimlar qiyosi',
      photo: `${enKeywords} analysis research comparison`,
      leftHeading: 'An\'anaviy Yondashuv',
      rightHeading: 'Zamonaviy Yechim',
      points: [
        {
          heading: 'Vaqt va resurslarning yuqori sarfi',
          description: 'Eski usullarda ko\'p qo\'l mehnati talab qilinib, jarayonlar sekin kechgan va inson omili sabab xatoliklar darajasi yuqori bo\'lgan.'
        },
        {
          heading: 'Zamonaviy tizimli optimallashtirish',
          description: 'Yangi texnologiyalar bilan jarayonlar 70% ga tezlashadi, avtomatik nazorat yo\'lga qo\'yiladi va shaffoflik to\'liq ta\'minlanadi.'
        }
      ],
      highlight: 'Ilg\'or standartlarga o\'tish orqali xarajatlar va kutilmagan tizimli xatolar xavfi keskin kamayadi.'
    },
    {
      layout: 'kpi_metrics',
      title: 'Asosiy Ko\'rsatkichlar va Natijadorlik',
      sub: 'Miqdoriy ko\'rsatkichlar, o\'sish sur\'atlari va sohaviy statistika',
      photo: `${enKeywords} statistics data growth chart`,
      metrics: [
        { val: '+85%', label: 'Samaradorlik O\'sishi', desc: 'Jarayonlarni kompleks optimallashtirish hisobiga olingan o\'sish sur\'ati' },
        { val: '3.5x', label: 'Tezlik va Unumdorlik', desc: 'Resurslardan foydalanish davrining bir necha barobar qisqarishi' },
        { val: 'TOP 1', label: 'Sohaviy Yetakchilik', desc: 'Xalqaro mezonlar va sifat standartlari bo\'yicha yetakchi ko\'rsatkich' }
      ],
      points: [
        {
          heading: 'Sohaviy dinamika va empirik dalillar',
          description: 'Aniq statistik raqamlar tanlangan rivojlanish yo\'nalishining to\'g\'riligini yaqqol ko\'rsatmoqda. O\'lchanadigan natijalar kiritilgan investitsiyalar samarasini to\'liq oqlaydi.'
        }
      ],
      highlight: 'Statistik dalillar va ishonchli raqamlar qabul qilingan strategik qarorlarning to\'g\'riligini isbotlaydi.'
    },
    {
      layout: 'process_timeline',
      title: 'Bosqichma-bosqich Amalga Oshirish',
      sub: 'Rejadan amaliy natijagacha bo\'lgan izchil harakatlar zanjiri',
      photo: `${enKeywords} steps process roadmap development`,
      points: [
        {
          heading: '1-Bosqich: Diagnostika va Tahlil',
          description: 'Mavjud holatni to\'liq inventarizatsiya qilish, ehtiyojlarni baholash va xatarlarni oldindan hisobga olgan reja tuzish.'
        },
        {
          heading: '2-Bosqich: Amaliy Tatbiq va Sinov',
          description: 'Sinovdan o\'tgan vositalarni joriy qilish, mutaxassislarni o\'qitish va tajriba-sinov jarayonlarini o\'tkazish.'
        },
        {
          heading: '3-Bosqich: Monitoring va Kengaytirish',
          description: 'Olingan natijalarni baholash, tizimni to\'liq kengaytirish va yangi o\'zgarishlarga doimiy moslashtirib borish.'
        }
      ],
      highlight: 'Aniq yo\'l xaritasi va izchil intizomli harakatlar muvaffaqiyatning asosiy garovidir.'
    },
    {
      layout: 'matrix_grid',
      title: 'Tarkibiy Ustunlar va Yo\'nalishlar',
      sub: 'Tizimning barqaror rivojlanishini ta\'minlovchi to\'rtta asosiy harakatlantiruvchi kuchi',
      photo: `${enKeywords} system structure innovation modern`,
      points: [
        {
          heading: 'Infratuzilma va Texnologiya',
          description: 'Mustahkam moddiy-texnik baza, barqaror arxitektura va zamonaviy professional vositalar.'
        },
        {
          heading: 'Inson Kapitali va Malaka',
          description: 'Yuqori salohiyatli mutaxassislar jamoasi, doimiy malaka oshirish va liderlik muhiti.'
        },
        {
          heading: 'Boshqaruv va Standartlar',
          description: 'Shaffof ish qoidalari, aniq reglamentlar va xalqaro sifat talablariga qat\'iy amal qilish.'
        },
        {
          heading: 'Innovatsiyalar Oqimi',
          description: 'Doimiy ilmiy izlanish, yangi ilg\'or g\'oyalarni sinab ko\'rish va amaliyotga tez tatbiq etish.'
        }
      ],
      highlight: 'Barcha to\'rtta ustunning uyg\'unligi butun tizimning uzoq yillik mustahkamligini kafolatlaydi.'
    },
    {
      layout: 'spotlight',
      title: 'Amaliy Keyslar va Hayotiy Misollar',
      sub: 'Muvaffaqiyatli amaliyot va erishilgan natijalar tahlili',
      photo: `${enKeywords} real practice experience case study`,
      spotlightText: `"${topic}" yo'nalishidagi eng yuksak natijalar chuqur nazariya va boy amaliy tajriba birlashgandagina qo'lga kiritiladi.`,
      points: [
        {
          heading: '1-keys: Tezkor moslashuv va natija',
          description: 'Dastlabki sinov bosqichidayoq kutilgan prognozlardan 40% yuqori unumdorlik qayd etildi.'
        },
        {
          heading: '2-keys: Barqaror uzoq muddatli o\'sish',
          description: 'Barcha yuzaga kelishi mumkin bo\'lgan xatarlar oldindan bartaraf etilib, rivojlanish sur\'ati saqlandi.'
        }
      ],
      highlight: 'Amaliy tajribada sinalgan bilimlar har qanday mavhum nazariyadan ko\'ra ishonchliroqdir.'
    },
    {
      layout: 'cinematic',
      title: 'Kelajak Istiqbollari va Global Trendlar',
      sub: 'Yangi imkoniyatlar, global tendensiyalar va raqamli transformatsiya sari yo\'l',
      photo: `${enKeywords} future perspective technology vision`,
      points: [
        {
          heading: 'Global integratsiya va hamkorlik',
          description: 'Xalqaro tajriba va jahon darajasidagi professional standartlar bilan faol integratsiyalashuv.'
        },
        {
          heading: 'Raqamli transformatsiya',
          description: 'Ma\'lumotlarni tahlil qilish algoritmlari va jarayonlarni avtomatlashtirish yechimlarini keng tatbiq etish.'
        },
        {
          heading: 'Barqaror yetakchilikni mustahkamlash',
          description: 'O\'z sohasida yangi standartlarni belgilab, raqobatbardosh ustunliklarni doimiy mustahkamlash.'
        }
      ],
      highlight: 'Kelajak bugun qabul qilinayotgan to\'g\'ri, dadil va ilmiy asoslangan qarorlar bilan yaratiladi.'
    }
  ];
}

/**
 * Mavzuga to'liq moslashtirilgan, har bir slaydi unikal va xilma-xil zaxira generator.
 */
function generateDynamicFallbackPresentation({ topic, slideCount, language = 'uz', theme, categoryObj }) {
  console.log(`[AI Fallback] Mavzuga moslashtirilgan boy unikal reja tuzilmoqda: "${topic}" (${language})`);
  const enKeywords = extractCleanKeywords(topic);
  const slides = [];

  const localizedMeta = {
    uz: {
      sub: `${categoryObj.name} doirasidagi maxsus ilmiy-tahliliy tadqiqot`,
      notes: `Assalomu alaykum, hurmatli qatnashchilar! Bugungi taqdimotimiz "${topic}" mavzusining konseptual asoslari, amaliy ahamiyati va istiqboldagi vazifalariga bag'ishlanadi.`,
      concTitle: 'Xulosalar va Strategik Tavsiyalar',
      concSub: 'Tizimli tahlil natijalari va istiqboldagi ustuvor yo\'nalishlar',
      concPoints: [
        {
          heading: 'Amaliy integratsiya va joriy etish',
          description: 'Tavsiya etilgan metodologiya va tizimli yechimlarni bosqichma-bosqich amaliyotga tatbiq etish lozim. Bu jarayon operatsion xatarlarni kamaytiradi va umumiy unumdorlikni 30-40% ga oshirishga xizmat qiladi.'
        },
        {
          heading: 'Doimiy monitoring va sifat nazorati',
          description: 'Belgilangan mezonlar va asosiy ko\'rsatkichlarni (KPI) muntazam o\'lchab borish zarur. Bu dinamikani to\'liq nazorat qilish hamda bozor va muhitdagi o\'zgarishlarga tezkor moslashish imkonini beradi.'
        },
        {
          heading: 'Resurslarni strategik optimallashtirish',
          description: 'Mavjud moddiy, texnologik va inson resurslarini eng yuqori daromad va samara keltiruvchi yo\'nalishlarga yo\'naltirish talab etiladi. Natijada xarajatlar tejaladi va barqaror rivojlanish ta\'minlanadi.'
        }
      ],
      concHighlight: `"${topic}" bo'yicha to'g'ri strategiya va izchil harakat eng yuqori natijani kafolatlaydi.`,
      concNotes: 'Hurmatli tinglovchilar, e\'tiboringiz uchun katta rahmat! Mavzu yuzasidan barcha savollaringiz bo\'lsa, bajonidil javob berishga tayyorman.'
    },
    ru: {
      sub: `Аналитическое исследование в сфере: ${categoryObj.name}`,
      notes: `Здравствуйте, уважаемые коллеги! Сегодняшняя презентация посвящена глубокому рассмотрению темы "${topic}", ее стратегических аспектов и практических механизмов реализации.`,
      concTitle: 'Выводы и Стратегические Рекомендации',
      concSub: 'Ключевые итоги исследования и следующие шаги развития',
      concPoints: [
        {
          heading: 'Практическая интеграция решений',
          description: 'Поэтапное внедрение предложенной методологии и практических инструментов в операционную деятельность. Это позволяет снизить риски системных сбоев и повысить общую результативность на 30–45%.'
        },
        {
          heading: 'Непрерывный мониторинг и контроль качества',
          description: 'Регулярный аудит ключевых показателей эффективности (KPI) и контроль точности процессов. Систематический анализ гарантирует гибкую адаптацию к любым изменениям рыночной конъюнктуры.'
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
      sub: `Comprehensive analytical briefing on ${categoryObj.name}`,
      notes: `Welcome, distinguished colleagues! Today's presentation provides an in-depth strategic analysis of "${topic}", examining operational frameworks, key metrics, and implementation roadmaps.`,
      concTitle: 'Strategic Conclusions & Next Steps',
      concSub: 'Executive takeaways and critical recommendations',
      concPoints: [
        {
          heading: 'Operational Execution & Integration',
          description: 'Phased implementation of validated methodologies and technical frameworks directly into standard workflows. This reduces critical friction points while accelerating overall throughput by 30–45%.'
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
      sub: `Таҳқиқоти махсуси илмию амалӣ дар самти: ${categoryObj.name}`,
      notes: `Салом, ҳамкасбони гиромӣ! Муаррифии имрӯзаи мо ба таҳлили амиқи мавзӯи "${topic}", самтҳои стратегӣ ва тарҳрезии амалии он бахшида шудааст.`,
      concTitle: 'Хулосаҳо ва Тавсияҳои Стратегӣ',
      concSub: 'Натиҷагирии ниҳоӣ ва самтҳои афзалиятноки рушд',
      concPoints: [
        {
          heading: 'Татбиқи амалии усулҳо ва қарорҳо',
          description: 'Ҷорисозии зина ба зинаи усулҳои пешниҳодшуда ва воситаҳои амалӣ дар равандҳои корӣ. Ин раванд хавфҳои идоравиро коҳиш дода, маҳсулнокиро 30-45% меафзояд.'
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
  }[language] || {
    sub: `${categoryObj.name} doirasidagi maxsus ilmiy-tahliliy tadqiqot`,
    notes: `Assalomu alaykum! Bugungi taqdimotimiz "${topic}" mavzusiga bag'ishlanadi.`,
    concTitle: 'Xulosalar va Strategik Tavsiyalar',
    concSub: 'Tizimli tahlil natijalari va istiqboldagi ustuvor yo\'nalishlar',
    concPoints: [
      {
        heading: 'Amaliy integratsiya va joriy etish',
        description: 'Tavsiya etilgan metodologiya va tizimli yechimlarni bosqichma-bosqich amaliyotga tatbiq etish lozim. Bu jarayon operatsion xatarlarni kamaytiradi va unumdorlikni oshiradi.'
      },
      {
        heading: 'Doimiy monitoring va sifat nazorati',
        description: 'Belgilangan mezonlar va asosiy ko\'rsatkichlarni (KPI) muntazam o\'lchab borish orqali jarayonlar ustidan to\'liq nazorat o\'rnatiladi.'
      },
      {
        heading: 'Resurslarni strategik optimallashtirish',
        description: 'Mavjud resurslarni eng yuqori daromad va samara keltiruvchi yo\'nalishlarga yo\'naltirish orqali barqaror rivojlanish ta\'minlanadi.'
      }
    ],
    concHighlight: `"${topic}" bo'yicha to'g'ri strategiya va izchil harakat eng yuqori natijani kafolatlaydi.`,
    concNotes: 'Hurmatli tinglovchilar, e\'tiboringiz uchun katta rahmat! Savollaringiz bo\'lsa bajonidil javob beraman.'
  };

  // 1-slayd: Muqova
  slides.push({
    slideNumber: 1,
    type: 'title',
    layoutType: 'title',
    title: topic.length > 50 ? topic.substring(0, 50) + '...' : topic,
    subtitle: localizedMeta.sub,
    imagePrompts: [
      `${enKeywords} professional concept`,
      `${enKeywords} background visual`
    ],
    speakerNotes: localizedMeta.notes
  });

  // Mavzuga moslashtirilgan boy va unikal bosqichlar (chet tillarda faqat sof o'sha til ishlatiladi!)
  const stageTemplates = (language === 'uz' ? (getDomainStages(topic, enKeywords) || getLocalizedGenericStages(topic, enKeywords, 'uz')) : getLocalizedGenericStages(topic, enKeywords, language)) || getLocalizedGenericStages(topic, enKeywords, 'uz');

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
        speakerNotes: language === 'ru'
          ? `Уважаемые слушатели! На данном слайде ${i} мы подробно проанализируем ключевые аспекты темы "${st.title}". Особое внимание следует обратить на практическую реализацию и измеримые результаты.`
          : language === 'en'
          ? `Distinguished colleagues, on slide ${i} we explore the critical dimensions of "${st.title}". It is essential to focus on operational execution and measurable outcomes.`
          : language === 'tg'
          ? `Шунавандагони гиромӣ! Дар ин слайди ${i} мо ҷанбаҳои муҳимтарини мавзӯи "${st.title}"-ро ба таври муфассал баррасӣ менамоем. Таваҷҷуҳи асосӣ бояд ба татбиқи амалӣ ва натиҷаҳои мушаххас равона шавад.`
          : `Hurmatli tinglovchilar! Ushbu ${i}-slaydda biz "${st.title}" bo'yicha eng muhim strategik jihatlarni ko'rib chiqamiz. Asosiy e'tiborni amaliy tatbiq va kutilayotgan natijadorlikka qaratishimiz lozim.`
      });
    }
  }

  const localizedQA = {
    uz: [
      { question: `"${topic}" mavzusining asosiy ilmiy yangiligi va amaliy ahamiyati nimada?`, answer: `Asosiy ahamiyat tarqoq yondashuvlarni yagona tizimga keltirib, jarayonlar samaradorligini 35-50% ga oshirish va tizimli xatarlarni kamaytirishdadir.` },
      { question: `Amaliyotga tatbiq etishda qanday asosiy to'siqlar yuzaga kelishi mumkin va ular qanday hal qilinadi?`, answer: `Asosiy omil yangi standartlarga moslashishdir, bu bosqichma-bosqich tajriba-sinov va maxsus o'quv dasturlari orqali bartaraf etiladi.` },
      { question: `Ushbu loyihaning uzoq muddatli iqtisodiy va sifat ko'rsatkichlari qanday mezonlar bilan baholanadi?`, answer: `Baholash aniq KPI mezonlari: resurslar aylanmasi tezligi, operatsion xarajatlar tejalishi va sifat barqarorligi bilan o'lchanadi.` },
    ],
    ru: [
      { question: `В чем заключается ключевая научная новизна и прикладная ценность темы "${topic}"?`, answer: `Основная ценность состоит в систематизации подходов и создании комплексной модели, повышающей эффективность процессов на 35–50%.` },
      { question: `С какими рисками можно столкнуться при практической реализации и как их нивелировать?`, answer: `Главным риском является сопротивление адаптации к новым регламентам, что устраняется поэтапным пилотированием и обучением команды.` },
      { question: `Какие метрики используются для подтверждения долгосрочной результативности?`, answer: `Оценка базируется на измеримых KPI: снижении издержек, скорости цикла ключевых ресурсов и стабильности стандартов качества.` },
    ],
    en: [
      { question: `What is the core strategic breakthrough and real-world value of "${topic}"?`, answer: `The primary value lies in consolidating fragmented practices into an integrated framework that boosts operational output by 35–50%.` },
      { question: `What are the critical implementation hurdles and how are they overcome?`, answer: `The primary challenge is organizational adoption, effectively resolved through phased milestones, risk audits, and targeted upskilling.` },
      { question: `How do you measure and validate sustainable long-term ROI?`, answer: `Validation relies on empirical KPI metrics: reduced turnaround times, lower operating friction, and durable quality benchmarks.` },
    ],
    tg: [
      { question: `Навоварии асосии илмӣ ва аҳамияти амалии мавзӯи "${topic}" дар чист?`, answer: `Аҳамияти асосӣ дар муттаҳид сохтани усулҳо ва баланд бардоштани маҳсулнокии равандҳо ба андозаи 35-50% мебошад.` },
      { question: `Ҳангоми татбиқи амалӣ бо кадом монеаҳо рӯ ба рӯ шудан мумкин аст?`, answer: `Мушкили асосӣ мутобиқшавии мутахассисон ба қоидаҳои нав мебошад, ки он тавассути санҷишҳои марҳилавӣ бартараф мегардад.` },
      { question: `Самаранокии дарозмуддати ин қарорҳо бо кадом нишондиҳандаҳо чен карда мешавад?`, answer: `Арзёбӣ бар асоси нишондиҳандаҳои KPI: сарфаи захираҳо, суръати амалиёт ва устувории сифати натиҷаҳо муайян карда мешавад.` },
    ],
  }[language] || [
    { question: `"${topic}" mavzusining asosiy ilmiy yangiligi nimada?`, answer: `Jarayonlar samaradorligini 35-50% ga oshirish va xatarlarni kamaytirishda.` }
  ];

  return {
    title: topic,
    subtitle: localizedMeta.sub,
    theme: theme || 'ocean',
    slides,
    qaList: localizedQA,
  };
}

/**
 * Har bir til uchun 100% o'sha tildagi mukammal prompt quruvchi
 */
function buildPresentationPrompt({ topic, targetCount, language = 'uz', theme = 'ocean', categoryObj, enKeywords, organization = '', documentText = '' }) {
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
Тема презентации: "${topic}"
Отрасль / Направление: ${categoryObj.name} (${categoryObj.promptContext})
ТРЕБУЕМОЕ КОЛИЧЕСТВО СЛАЙДОВ: РОВНО ${targetCount} СЛАЙДОВ!
Язык презентации: ИСКЛЮЧИТЕЛЬНО РУССКИЙ ЯЗЫК (богатый, академический, профессиональный русский язык).
Тема оформления: ${theme}
${organization ? `Организация / Университет: ${organization}` : ''}
${docContext}

СТРОЖАЙШИЕ ТРЕБОВАНИЯ И ПРАВИЛА:
1. 100% ЧИСТЫЙ РУССКИЙ ЯЗЫК:
   - ВСЕ заголовки (title), подзаголовки (subtitle), названия тезисов (heading), подробные описания (description), ключевые выводы (highlight), метрики и заметки докладчика (speakerNotes) должны быть ИСКЛЮЧИТЕЛЬНО НА РУССКОМ ЯЗЫКЕ!
   - КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО использовать слова на узбекском или любых других языках (никаких "1-nuqta", "Xulosa", "Kirish so'zi", "Zamonaviy", "tushuntirish" и т.п.)! Исключение — только поисковые запросы в imagePrompts (они должны быть на английском).
2. ВЫСОКАЯ ИНФОРМАТИВНОСТЬ И БОЛЬШОЙ ОБЪЕМ (ОТСУТСТВИЕ ВОДЫ И ШАБЛОНОВ):
   - В каждом пункте слайда поле "description" ОБЯЗАНО содержать минимум 2–4 развернутых, содержательных предложения (от 35 до 60 слов)!
   - Приводите реальные факты, профессиональную терминологию, причинно-следственные связи, аналитические механизмы и практические аспекты.
   - КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНЫ пустые шаблонные отписки («Пункт 1», «Введение», «Описание сути» и 1-строчные общие фразы)!
3. ПОЛНЫЙ ЗАПРЕТ НА УПОМИНАНИЕ ИСКУССТВЕННОГО ИНТЕЛЛЕКТА (ИИ):
   - КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО писать, что презентация создана с помощью ИИ, упоминать слова «ИИ», «AI», «нейросеть», «бот», «промпт», «сгенерировано». Презентация должна выглядеть так, как будто её создал опытный эксперт-исследователь или топ-аналитик вручную.
4. РАЗНООБРАЗИЕ МАКЕТОВ (layoutType):
   - Распределяйте слайды по разнообразным структурам: "split_hero", "comparison", "kpi_metrics", "process_timeline", "matrix_grid", "spotlight", "cinematic", "conclusion".
5. ЗАПРОСЫ ДЛЯ ИЗОБРАЖЕНИЙ:
   - В поле "imagePrompts" ровно 2 англоязычных фотореалистичных запроса (например: ["${enKeywords} professional laboratory analysis", "${enKeywords} modern business conference"]).
6. ЗАМЕТКИ ДОКЛАДЧИКА (speakerNotes):
   - Для каждого слайда напишите живой, готовый для выступления текст речи докладчика из 3–5 предложений.
7. Общее количество слайдов в массиве "slides" ДОЛЖНО БЫТЬ РОВНО ${targetCount}!

8. ВОПРОСЫ И ОТВЕТЫ ДЛЯ ЗАЩИТЫ (qaList):
   - Сформируйте в корневом объекте массив "qaList" из 3 ключевых аналитических вопросов экзаменационной комиссии/преподавателя и образцовых развернутых ответов докладчика.

Строго верните ЧИСТЫЙ JSON следующей структуры:
{
  "title": "${topic}",
  "subtitle": "Комплексный аналитический обзор и стратегические решения",
  "theme": "${theme}",
  "slides": [
    {
      "slideNumber": 1,
      "type": "title",
      "layoutType": "title",
      "title": "${topic}",
      "subtitle": "Аналитическое исследование в сфере: ${categoryObj.name}",
      "imagePrompts": ["${enKeywords} professional concept", "${enKeywords} modern visual"],
      "speakerNotes": "Здравствуйте, уважаемые участники! Сегодня мы подробно рассмотрим ключевые аспекты и стратегические перспективы темы ${topic}."
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
Presentation Topic: "${topic}"
Domain / Industry: ${categoryObj.name} (${categoryObj.promptContext})
REQUIRED SLIDE COUNT: EXACTLY ${targetCount} SLIDES!
Language: 100% PROFESSIONAL, FLUENT ENGLISH.
Design Theme: ${theme}
${organization ? `Organization / University: ${organization}` : ''}
${docContext}

STRICT MANDATORY REQUIREMENTS:
1. 100% PURE ENGLISH CONTENT:
   - ALL titles, subtitles, point headings, detailed descriptions, metric labels, highlights, and speakerNotes MUST be strictly in English!
   - ABSOLUTELY NO foreign words or phrases (especially no Uzbek or Russian words like "1-nuqta", "Xulosa", "Kirish", etc.).
2. IN-DEPTH, SUBSTANTIVE CONTENT (HIGH INFORMATION DENSITY):
   - Every bullet point "description" MUST contain at least 2–4 complete, informative sentences (35 to 60 words)!
   - Include concrete domain terminology, real-world mechanisms, analytical depth, industry benchmarks, and cause-and-effect reasoning.
   - Generic filler, superficial phrases, and 1-line bullet points are STRICTLY FORBIDDEN!
3. ZERO MENTION OF ARTIFICIAL INTELLIGENCE (AI):
   - Do NOT mention "AI", "artificial intelligence", "generated by AI", "bot", or "prompt" anywhere in titles, descriptions, subtitles, or speaker notes. The deck must look 100% human-crafted by a seasoned industry expert.
4. RICH DIVERSITY OF LAYOUTS (layoutType):
   - Rotate strategically through: "split_hero", "comparison", "kpi_metrics", "process_timeline", "matrix_grid", "spotlight", "cinematic", "conclusion".
5. HIGH-QUALITY IMAGE SEARCH PROMPTS:
   - In "imagePrompts", provide exactly 2 precise photorealistic English search keywords (e.g., ["${enKeywords} professional research", "${enKeywords} technology architecture"]).
6. COMPREHENSIVE SPEAKER NOTES (speakerNotes):
   - Provide a natural, polished 3–5 sentence verbal script for the presenter on every slide.
7. The "slides" array MUST contain EXACTLY ${targetCount} slides!
8. COMMITTEE DEFENSE QUESTIONS & ANSWERS (qaList):
   - Provide a "qaList" array in the root object containing 3 critical examination questions with authoritative model answers.

Strictly return CLEAN JSON of this structure:
{
  "title": "${topic}",
  "subtitle": "Comprehensive Strategic Analysis & Practical Frameworks",
  "theme": "${theme}",
  "slides": [
    {
      "slideNumber": 1,
      "type": "title",
      "layoutType": "title",
      "title": "${topic}",
      "subtitle": "Executive Research Briefing on ${categoryObj.name}",
      "imagePrompts": ["${enKeywords} concept photography", "${enKeywords} modern visual"],
      "speakerNotes": "Welcome everyone. Today we are presenting a comprehensive analytical evaluation of ${topic}, highlighting structural dynamics and strategic execution paths."
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
Мавзӯи муаррифӣ: "${topic}"
Соҳа / Самт: ${categoryObj.name} (${categoryObj.promptContext})
ШУМОРАИ ТАЛАБШУДАИ СЛАЙДҲО: ДАҚИҚАН ${targetCount} СЛАЙД!
Забони муаррифӣ: 100% ЗАБОНИ ТОҶИКӢ (забони адабӣ, равон ва касбӣ).
Услуби тарҳрезӣ: ${theme}
${organization ? `Муассиса / Донишгоҳ: ${organization}` : ''}
${docContext}

ТАЛАБОТИ ҚАТЪӢ ВА ҚОИДАҲОИ АСОСӢ:
1. 100% ЗАБОНИ ШЕВО ВА ТОЗАИ ТОҶИКӢ:
   - ҲАМАИ сарлавҳаҳо (title), зерсарлавҳаҳо (subtitle), номи бандҳо (heading), шарҳҳои муфассал (description), нишондиҳандаҳо, хулосаҳои асосӣ (highlight) ва қайдҳои баромадкунанда (speakerNotes) бояд ТАНҲО ВА СОФ БА ЗАБОНИ ТОҶИКӢ бошанд!
   - Истифодаи калимаҳои ӯзбекӣ, русӣ ё дигар забонҳо (ба мисли "1-nuqta", "Xulosa", "Kirish so'zi", "Zamonaviy", "tushuntirish") ҚАТЪИЯН МАНЪ АСТ! Танҳо дар imagePrompts бояд ибораҳои англисӣ истифода шаванд.
2. МАЪЛУМОТИ АМИҚ, ПУРРА ВА СЕРМАЗМУН (ШУМОРАИ ЗИЁДИ КАЛИМАҲОИ ФОЙДАНОК):
   - Дар ҳар як банди слайд қисмати "description" (шарҳ) БОЯД ҳатман аз 2 то 4 ҷумлаи мукаммал ва пурмазмун (аз 35 то 60 калима) иборат бошад!
   - Далелҳои мушаххас, мафҳумҳои илмию соҳавӣ, таҳлилҳои амиқи сабабу натиҷа ва равандҳои амалиро зикр намоед.
   - Ибораҳои умумӣ, хушк ва кӯтоҳи яксатра («Банди 1», «Муқаддима», «Шарҳи кӯтоҳ») ҚАТЪИЯН МАНЪ АСТ!
3. МАНЪИ ҚАТЪИИ ЗИКРИ ЗЕҲНИ СУНЪӢ (AI):
   - Дар ягон ҷойи муаррифӣ навиштани он, ки ин муаррифӣ бо зеҳни сунъӣ омода шудааст, ё истифодаи калимаҳои «зеҳни сунъӣ», «AI», «бот», «промпт» ҚАТЪИЯН МАНЪ АСТ! Муаррифӣ бояд тавре бошад, ки гӯё онро олими барҷаста ё мутахассиси варзида худаш навишта бошад.
4. ГУНОГУНИИ ТАРҲҲОИ СЛАЙД (layoutType):
   - Аз тарҳҳои "split_hero", "comparison", "kpi_metrics", "process_timeline", "matrix_grid", "spotlight", "cinematic", "conclusion" самаранок истифода баред.
5. ҶУСТУҶӮИ АКСҲО (imagePrompts):
   - Барои ҳар слайд дар "imagePrompts" дақиқан 2 ибораи ҷустуҷӯи акс ба забони англисӣ диҳед (масалан: ["${enKeywords} professional laboratory analysis", "${enKeywords} modern conference"]).
6. ҚАЙДҲОИ БАРОМАДКУНАНДА (speakerNotes):
   - Барои ҳар як слайд матни нутқи зинда ва касбии баромадкунандаро (3–5 ҷумла) бо забони тоҷикӣ омода кунед.
7. Дар маҷмӯъ шумораи слайдҳо дар массиви "slides" ДАҚИҚАН ${targetCount} адад бошад!
8. САВОЛУ ҶАВОБҲОИ ҲИМОЯ (qaList):
   - Дар қисмати "qaList" 3 саволи муҳими комиссия ва посухҳои мукаммали илмию амалиро пешниҳод намоед.

Қатъиян дар формати JSON посух диҳед:
{
  "title": "${topic}",
  "subtitle": "Таҳлили ҳамаҷониба ва дурнамои стратегӣ",
  "theme": "${theme}",
  "slides": [
    {
      "slideNumber": 1,
      "type": "title",
      "layoutType": "title",
      "title": "${topic}",
      "subtitle": "Таҳқиқоти илмӣ ва амалӣ дар самти: ${categoryObj.name}",
      "imagePrompts": ["${enKeywords} professional concept", "${enKeywords} modern visual"],
      "speakerNotes": "Салом, ҳозирини гиромӣ! Имрӯз мо ҷанбаҳои асосӣ ва дурнамои рушди мавзӯи ${topic}-ро ба таври муфассал мавриди баррасӣ қарор медиҳем."
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
   - Har bir slayd punktidagi "description" (tushuntirish) kamida 2-4 ta to'liq, mazmundor gapdan (kamida 35-60 so'z) iborat bo'lishi SHART!
   - Mavzuga doir aniq sohaviy tushunchalar, real faktlar, amaliy mexanizmlar, sabab-oqibat tahlillari va professional atamalarni keltiring.
   - Qisqa, 1 qatorli umumiy gaplar, "1-nuqta", "Kirish", "Xulosa", "Tushuntirish" kabi quruq va zerikarli iboralarni ishlatish QAT'IYAN TAQIQLANADI!
2. SUN'IY INTELLEKT (AI) HAQIDA HECH QANDAY SO'Z YOZILMASIN:
   - Slayd ichida, sarlavhada, bandlarda yoki spiker nutqida "bu taqdimot AI yordamida qilindi", "Sun'iy intellekt", "AI", "bot" kabi iboralarni MUTLAQO ISHLATMANG! Taqdimot inson mutaxassisi yoki professor tomonidan chuqur tayyorlangan ilmiy-amaliy taqdimotdek bo'lsin.
3. HAR BIR SLAYD UNIKAL BO'LISHI UCHUN "layoutType" TURLARIDAN UNUMLI FOYDALANING:
   - "split_hero": chapda asosiy vizual, o'ngda chuqur tahliliy fikrlar
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
   - Har bir slayd uchun spiker minbardan turib gapirib berishi mumkin bo'lgan 3-5 gapdan iborat jonli, qiziqarli nutq matnini yozing.
6. Jami "slides" massivida AYNAN ${targetCount} ta slayd bo'lsin!
7. HIMOYA VA KOMISSIYA SAVOL-JAVOBLARI (qaList):
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

  data.subtitle = cleanText(data.subtitle, defaultSubtitles[language] || defaultSubtitles.uz);

  const isNonUzbek = language !== 'uz';

  if (Array.isArray(data.slides)) {
    data.slides.forEach((slide, idx) => {
      slide.title = cleanText(slide.title, `Slide ${idx + 1}`);
      slide.subtitle = cleanText(slide.subtitle, '');
      if (slide.highlight) slide.highlight = cleanText(slide.highlight, '');
      if (slide.spotlightText) slide.spotlightText = cleanText(slide.spotlightText, '');
      if (slide.speakerNotes) slide.speakerNotes = cleanText(slide.speakerNotes, '');

      // Chet tillarda o'zbekcha qolib ketgan shablon so'zlarni almashtirish
      if (isNonUzbek) {
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
        if (/xulosa/i.test(slide.highlight) && slide.highlight.length < 15) {
          slide.highlight = language === 'ru'
            ? 'Системный подход и выверенная стратегия гарантируют достижение высоких показателей.'
            : language === 'en'
            ? 'A disciplined strategic framework ensures optimal performance and sustainable growth.'
            : 'Равиши низомманд ва стратегияи дақиқ ноил шудан ба натиҷаҳои баландро кафолат медиҳад.';
        }
      }

      if (Array.isArray(slide.points)) {
        slide.points.forEach((pt, pIdx) => {
          pt.heading = cleanText(pt.heading, '');
          pt.description = cleanText(pt.description, '');

          if (isNonUzbek) {
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

          // Qisqa bo'lib qolgan gaplarni boyitish
          if (pt.description.length < 25) {
            pt.description += language === 'ru'
              ? ' Практическая реализация данных мер существенно повышает общую эффективность процессов и снижает риски.'
              : language === 'en'
              ? ' Practical execution of these measures substantially boosts overall workflow productivity and resilience.'
              : language === 'tg'
              ? ' Татбиқи амалии ин тадбирҳо самаранокии умумии равандҳоро ба таври назаррас меафзояд ва хавфҳоро коҳиш медиҳад.'
              : ' Ushbu choralarni amaliyotga joriy etish jarayonlar samaradorligini sezilarli darajada oshiradi va xatarlarni kamaytiradi.';
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
        return sanitizePresentationData(data, language);
      }
    } catch (gErr) {
      console.warn('[AI Engine] Google Gemini uzilishi:', gErr.message);
    }
  }

  // 2-URINISH: Pollinations AI (OpenAI GPT-4o-mini asosida bepul va yuqori intellektual)
  const pollData = await generateViaPollinations(prompt);
  if (pollData && pollData.slides && pollData.slides.length >= 3) {
    if (organization) pollData.organization = organization;
    return sanitizePresentationData(pollData, language);
  }

  // 3-URINISH: Mavzuga to'liq moslashtirilgan boy dinamik reja
  const fallbackData = generateDynamicFallbackPresentation({ topic, slideCount: targetCount, language, theme, categoryObj });
  if (organization) fallbackData.organization = organization;
  return sanitizePresentationData(fallbackData, language);
}
