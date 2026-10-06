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
        sub: 'Концептуальные основы и приоритетные задачи',
        photo: `${enKeywords} concept analysis professional`,
        points: [
          { heading: 'Актуальность и важность', description: `Новейшие подходы и современные системные практики по направлению "${topic}".` },
          { heading: 'Стратегическая цель', description: 'Принципы максимально эффективного использования имеющихся возможностей.' },
          { heading: 'Ожидаемый результат', description: 'Многократное повышение скорости процессов и общей результативности.' }
        ],
        highlight: 'Правильно заложенный фундамент — залог успешного развития и долгосрочных побед.'
      },
      {
        layout: 'comparison',
        title: 'Сравнительный Анализ и Подходы',
        sub: 'Сопоставление традиционных методов и современных решений',
        photo: `${enKeywords} research comparison analytics`,
        leftHeading: 'Традиционный подход',
        rightHeading: 'Инновационное решение',
        points: [
          { heading: 'Затраты ресурсов', description: 'Устаревшие методы требуют больше времени и несут риски ошибок.' },
          { heading: 'Современная оптимизация', description: 'Новые технологии ускоряют процессы на 70% и гарантируют стабильность.' }
        ],
        highlight: 'Переход на передовые стандарты кратно сокращает издержки и исключает риски.'
      },
      {
        layout: 'kpi_metrics',
        title: 'Ключевые Показатели и Результаты',
        sub: 'Количественные индикаторы, динамика роста и статистика',
        photo: `${enKeywords} data chart growth statistics`,
        metrics: [
          { val: '+85%', label: 'Рост эффективности', desc: 'Прирост за счет оптимизации процессов' },
          { val: '3.5x', label: 'Скорость процессов', desc: 'Ускорение использования ключевых ресурсов' },
          { val: 'TOP 1', label: 'Лидирующая позиция', desc: 'Ведущие показатели по международным стандартам' }
        ],
        points: [
          { heading: 'Отраслевые показатели', description: 'Стабильный ежегодный рост демонстрирует высокую динамику развития.' }
        ],
        highlight: 'Фактические данные и объективные цифры подтверждают точность выбранного курса.'
      },
      {
        layout: 'process_timeline',
        title: 'Поэтапная Дорожная Карта',
        sub: 'Цепочка действий: от планирования до измеримого результата',
        photo: `${enKeywords} steps process roadmap development`,
        points: [
          { heading: 'Этап 1: Анализ и Диагностика', description: 'Комплексная оценка текущего состояния и выявление потребностей.' },
          { heading: 'Этап 2: Практическое Внедрение', description: 'Интеграция проверенных инструментов и передовых методик.' },
          { heading: 'Этап 3: Масштабирование', description: 'Закрепление достигнутых результатов и обеспечение устойчивого роста.' }
        ],
        highlight: 'Четкий план и последовательные действия являются основой любого успеха.'
      },
      {
        layout: 'matrix_grid',
        title: 'Ключевые Столпы Системы',
        sub: 'Четыре ключевых драйвера успешного развития',
        photo: `${enKeywords} system structure innovation modern`,
        points: [
          { heading: 'Инфраструктура и Технологии', description: 'Надежная технологическая база и современные инструменты.' },
          { heading: 'Человеческий Капитал', description: 'Высококвалифицированные специалисты и сильная экспертиза.' },
          { heading: 'Управление и Стандарты', description: 'Прозрачные правила и соблюдение международных стандартов.' },
          { heading: 'Инновационный Поток', description: 'Постоянный поиск новых решений и внедрение свежих идей.' }
        ],
        highlight: 'Синергия всех четырех компонентов гарантирует абсолютную устойчивость всей системы.'
      },
      {
        layout: 'spotlight',
        title: 'Практические Кейсы и Опыт',
        sub: 'Анализ успешной практики и реальных достижений',
        photo: `${enKeywords} real practice experience case study`,
        spotlightText: `Лучшие практики в области "${topic}" достигаются на стыке глубокой теории и проверенного опыта.`,
        points: [
          { heading: 'Кейс 1: Быстрая адаптация', description: 'Уже на начальном этапе зафиксирован прирост на 40% выше ожидаемого.' },
          { heading: 'Кейс 2: Устойчивый рост', description: 'Все риски были своевременно нивелированы, динамика полностью сохранена.' }
        ],
        highlight: 'Практический опыт ценнее любой отвлеченной теории.'
      },
      {
        layout: 'cinematic',
        title: 'Перспективы и Тренды Будущего',
        sub: 'Новые возможности, глобальные ориентиры и цифровая трансформация',
        photo: `${enKeywords} future perspective technology vision`,
        points: [
          { heading: 'Глобальная интеграция', description: 'Активное внедрение международного опыта и мировых практик.' },
          { heading: 'Цифровая трансформация', description: 'Использование алгоритмов искусственного интеллекта и автоматизации.' },
          { heading: 'Непрерывное лидерство', description: 'Укрепление завоеванных позиций и формирование новых отраслевых стандартов.' }
        ],
        highlight: 'Будущее создается сегодня смелыми и дальновидными решениями.'
      }
    ];
  }

  if (language === 'en') {
    return [
      {
        layout: 'split_hero',
        title: `${topic}: Core Concept & Objectives`,
        sub: 'Conceptual framework and primary strategic goals',
        photo: `${enKeywords} concept analysis professional`,
        points: [
          { heading: 'Relevance & Significance', description: `Cutting-edge approaches and systematic practices in "${topic}".` },
          { heading: 'Strategic Vision', description: 'Principles of maximizing high-impact capabilities and potential.' },
          { heading: 'Expected Impact', description: 'Substantial acceleration of workflow speed and overall performance.' }
        ],
        highlight: 'A strong foundational framework is the key to scalable long-term achievement.'
      },
      {
        layout: 'comparison',
        title: 'Comparative Analysis & Methodology',
        sub: 'Contrasting conventional methods with modern innovative practices',
        photo: `${enKeywords} research comparison analytics`,
        leftHeading: 'Conventional Methods',
        rightHeading: 'Modern Innovation',
        points: [
          { heading: 'Resource Consumption', description: 'Outdated practices demand more manual effort and carry higher error rates.' },
          { heading: 'Optimized Efficiency', description: 'Modern solutions accelerate core operations by up to 70% with high reliability.' }
        ],
        highlight: 'Adopting modern paradigms significantly reduces friction and maximizes output.'
      },
      {
        layout: 'kpi_metrics',
        title: 'Key Metrics & Measurable Impact',
        sub: 'Quantitative indicators, benchmark growth, and core performance stats',
        photo: `${enKeywords} data chart growth statistics`,
        metrics: [
          { val: '+85%', label: 'Efficiency Surge', desc: 'Performance boost delivered through systematic workflow optimization' },
          { val: '3.5x', label: 'Execution Velocity', desc: 'Significant enhancement in resource turnaround times' },
          { val: 'TOP 1', label: 'Industry Benchmark', desc: 'Leading position conforming to international quality standards' }
        ],
        points: [
          { heading: 'Market Benchmarks', description: 'Steady continuous growth proves strong structural momentum.' }
        ],
        highlight: 'Clear empirical data and measurable metrics demonstrate strategic excellence.'
      },
      {
        layout: 'process_timeline',
        title: 'Implementation Roadmap',
        sub: 'A cohesive action plan from initial strategy to verified outcomes',
        photo: `${enKeywords} steps process roadmap development`,
        points: [
          { heading: 'Phase 1: Discovery & Assessment', description: 'Thorough evaluation of the baseline status and strategic requirements.' },
          { heading: 'Phase 2: Execution & Deployment', description: 'Seamless integration of validated tools and best-in-class workflows.' },
          { heading: 'Phase 3: Scaling & Optimization', description: 'Continuous refinement ensuring long-term resilience and growth.' }
        ],
        highlight: 'Disciplined execution of a well-defined plan ensures outstanding results.'
      },
      {
        layout: 'matrix_grid',
        title: 'Core Pillars & Architecture',
        sub: 'The four structural drivers powering sustainable success',
        photo: `${enKeywords} system structure innovation modern`,
        points: [
          { heading: 'Infrastructure & Tools', description: 'Resilient technical foundation equipped with modern capabilities.' },
          { heading: 'Human Expertise', description: 'Talented individuals with deep functional knowledge and execution skills.' },
          { heading: 'Governance & Standards', description: 'Transparent workflows built upon globally proven benchmarks.' },
          { heading: 'Continuous Innovation', description: 'Proactive experimentation and integration of novel ideas.' }
        ],
        highlight: 'The harmony between all core pillars provides unmatched organizational strength.'
      },
      {
        layout: 'spotlight',
        title: 'Case Studies & Real-World Validation',
        sub: 'Practical observations and verified execution breakthroughs',
        photo: `${enKeywords} real practice experience case study`,
        spotlightText: `In the field of "${topic}", the greatest breakthroughs occur where solid theory meets validated execution.`,
        points: [
          { heading: 'Case 1: Rapid Adaptation', description: 'Delivered 40% higher efficiency than original targets within early milestones.' },
          { heading: 'Case 2: Sustainable Expansion', description: 'Effectively mitigated potential risks while maintaining upward growth.' }
        ],
        highlight: 'Empirical practice provides the most reliable foundation for durable innovation.'
      },
      {
        layout: 'cinematic',
        title: 'Future Outlook & Emerging Trends',
        sub: 'Upcoming opportunities, industry shifts, and digital transformation',
        photo: `${enKeywords} future perspective technology vision`,
        points: [
          { heading: 'Global Synergy', description: 'Active alignment with international standards and progressive networks.' },
          { heading: 'Digital Evolution', description: 'Leveraging advanced automation and intelligent AI-driven systems.' },
          { heading: 'Market Leadership', description: 'Cementing competitive advantages to drive future industry standards.' }
        ],
        highlight: 'The future belongs to proactive leaders making decisive, forward-thinking moves today.'
      }
    ];
  }

  if (language === 'tg') {
    return [
      {
        layout: 'split_hero',
        title: `${topic}: Моҳият ва Ҳадафҳои Стратегӣ`,
        sub: 'Асосҳои консептуалӣ ва вазифаҳои асосӣ',
        photo: `${enKeywords} concept analysis professional`,
        points: [
          { heading: 'Аҳамият ва мубрамият', description: `Равишҳои навтарин ва таҷрибаҳои муосир дар самти "${topic}".` },
          { heading: 'Ҳадафи стратегӣ', description: 'Усулҳои истифодаи беҳтарини имкониятҳои мавҷуда.' },
          { heading: 'Самаранокии чашмдошт', description: 'Баланд бардоштани суръати равандҳо ва натиҷабахшии умумӣ.' }
        ],
        highlight: 'Пойдевори дуруст гузошташуда кафили тамоми комёбиҳо мебошад.'
      },
      {
        layout: 'comparison',
        title: 'Таҳлили Муқоисавӣ ва Равишҳо',
        sub: 'Муқоисаи усулҳои анъанавӣ бо роҳҳои ҳалли инноватсионӣ',
        photo: `${enKeywords} research comparison analytics`,
        leftHeading: 'Усули анъанавӣ',
        rightHeading: 'Роҳи ҳалли инноватсионӣ',
        points: [
          { heading: 'Сарфи захираҳо', description: 'Усулҳои кӯҳна вақти зиёд ва хавфи баланди хатогиро талаб мекарданд.' },
          { heading: 'Оптимизатсияи муосир', description: 'Технологияҳои нав равандҳоро 70% тезонида, устувориро таъмин мекунанд.' }
        ],
        highlight: 'Гузариш ба усулҳои муосир хароҷотро якбора кам карда, сифатро меафзояд.'
      },
      {
        layout: 'kpi_metrics',
        title: 'Нишондиҳандаҳои Асосӣ ва Натиҷаҳо',
        sub: 'Нишондиҳандаҳои миқдорӣ, суръати рушд ва омор',
        photo: `${enKeywords} data chart growth statistics`,
        metrics: [
          { val: '+85%', label: 'Афзоиши самаранокӣ', desc: 'Рушди бадастомада аз оптимизатсияи равандҳо' },
          { val: '3.5x', label: 'Суръат ва маҳсулнокӣ', desc: 'Тезонидани истифодаи захираҳо' },
          { val: 'TOP 1', label: 'Ҷойи аввал дар соҳа', desc: 'Нишондиҳандаи пешсаф аз рӯи стандартҳо' }
        ],
        points: [
          { heading: 'Нишондиҳандаи соҳа', description: 'Рушди устувори солона динамикаи баландро нишон медиҳад.' }
        ],
        highlight: 'Далелҳои оморӣ ва рақамҳои дақиқ дурустии стратегияро исбот мекунанд.'
      },
      {
        layout: 'process_timeline',
        title: 'Татбиқи Зина ба Зинаи Нақша',
        sub: 'Занҷири амалҳо: аз тарҳрезӣ то ба даст овардани натиҷа',
        photo: `${enKeywords} steps process roadmap development`,
        points: [
          { heading: 'Зинаи 1: Ташхис ва Таҳлил', description: 'Омӯзиши ҳамаҷонибаи вазъи мавҷуда ва муайян кардани ниёзҳо.' },
          { heading: 'Зинаи 2: Татбиқи Амалӣ', description: 'Истифодаи воситаҳои озмудашуда ва усулҳои пешқадам.' },
          { heading: 'Зинаи 3: Рушд ва Мониторинг', description: 'Баҳодиҳии натиҷаҳо ва таъмини рушди устувор.' }
        ],
        highlight: 'Қадамҳои пайгирона ва нақшаи дақиқ асоси комёбӣ мебошанд.'
      },
      {
        layout: 'matrix_grid',
        title: 'Сутунҳои Асосии Низом',
        sub: 'Чор омили асосии пешбарандаи низом',
        photo: `${enKeywords} system structure innovation modern`,
        points: [
          { heading: 'Инфрасохтор ва Технология', description: 'Пойдевори боэътимод ва асбобҳои муосири корӣ.' },
          { heading: 'Сармояи Инсонӣ', description: 'Мутахассисони дорои дониши баланди касбӣ.' },
          { heading: 'Идоракунӣ ва Стандартҳо', description: 'Қоидаҳои шаффоф ва таҷрибаи байналмилалӣ.' },
          { heading: 'Ҷараёни Инноватсияҳо', description: 'Ҷустуҷӯи доимӣ ва дастгирии ғояҳои нав.' }
        ],
        highlight: 'Ҳамоҳангии ҳамаи чор рукн устувории тамоми низомро кафолат медиҳад.'
      },
      {
        layout: 'spotlight',
        title: 'Кейсҳои Амалӣ ва Намунаҳои Ҳаётӣ',
        sub: 'Таҳлили таҷрибаи бомуваффақият ва натиҷаҳои бадастомада',
        photo: `${enKeywords} real practice experience case study`,
        spotlightText: `Дар самти "${topic}" беҳтарин натиҷа вақте ба даст меояд, ки назария ва таҷрибаи воқеӣ пайваст шаванд.`,
        points: [
          { heading: 'Кейси 1: Мутобиқшавии фаврӣ', description: 'Дар марҳилаи аввал натиҷа нисбат ба чашмдошт 40% баландтар ба қайд гирифта шуд.' },
          { heading: 'Кейси 2: Рушди устувор', description: 'Тамоми хатарҳо сари вақт пешгирӣ карда шуданд.' }
        ],
        highlight: 'Таҷрибаи амалӣ нисбат ба ҳар гуна назария боэътимодтар ва арзишмандтар аст.'
      },
      {
        layout: 'cinematic',
        title: 'Дурнамои Оянда ва Равандҳо',
        sub: 'Имкониятҳои нав, тамоюлҳои ҷаҳонӣ ва таҳаввулоти рақамӣ',
        photo: `${enKeywords} future perspective technology vision`,
        points: [
          { heading: 'Интегратсияи ҷаҳонӣ', description: 'Ҳамкории фаъол бо шарикони байналмилалӣ.' },
          { heading: 'Табдили рақамӣ', description: 'Татбиқи зеҳни сунъӣ ва равандҳои автоматӣ.' },
          { heading: 'Пешвоии доимӣ', description: 'Таҳкими дастовардҳо ва расидан ба сатҳи пешсаф.' }
        ],
        highlight: 'Оянда бо қарорҳои далер ва инноватсионии имрӯза сохта мешавад.'
      }
    ];
  }

  return null;
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
      sub: `${categoryObj.name} doirasidagi maxsus tahliliy taqdimot`,
      notes: `Assalomu alaykum! Bugungi taqdimotimiz "${topic}" mavzusiga bag'ishlanadi.`,
      concTitle: 'Xulosalar va Keyingi Qadamlar',
      concSub: 'Strategik tavsiyalar va yakuniy xulosa',
      concPoints: [
        { heading: '1-ustuvor qadam', description: 'Mavjud metodologiyani bugunoq bosqichma-bosqich amaliyotga joriy etish.' },
        { heading: 'Doimiy monitoring va nazorat', description: 'Barcha ko\'rsatkichlarni muntazam tahlil qilib, o\'zgarishlarga tez moslashish.' },
        { heading: 'Resurslarni optimallashtirish', description: 'Eng yuqori samara beruvchi asosiy yo\'nalishlarga ko\'proq e\'tibor qaratish.' }
      ],
      concHighlight: `"${topic}" bo'yicha to'g'ri strategiya va izchil harakat eng yuqori natijani kafolatlaydi.`,
      concNotes: 'Hurmatli tinglovchilar, e\'tiboringiz uchun katta rahmat! Savollaringiz bo\'lsa bajonidil javob beraman.'
    },
    ru: {
      sub: `Аналитическая презентация в сфере: ${categoryObj.name}`,
      notes: `Здравствуйте! Сегодняшняя наша презентация посвящена теме "${topic}".`,
      concTitle: 'Выводы и Следующие Шаги',
      concSub: 'Стратегические рекомендации и ключевые итоги',
      concPoints: [
        { heading: 'Первоочередной шаг', description: 'Поэтапное внедрение методологии и практических инструментов в текущие процессы.' },
        { heading: 'Непрерывный мониторинг', description: 'Регулярная оценка ключевых показателей эффективности и контроль динамики.' },
        { heading: 'Оптимизация ресурсов', description: 'Концентрация внимания на направлениях, обеспечивающих максимальный результат.' }
      ],
      concHighlight: `Грамотная стратегия и системный подход гарантируют успешное достижение поставленных целей.`,
      concNotes: 'Уважаемые слушатели, спасибо за внимание! Буду рад ответить на ваши вопросы.'
    },
    en: {
      sub: `Comprehensive analytical presentation on ${categoryObj.name}`,
      notes: `Welcome! Today's presentation is dedicated to the topic "${topic}".`,
      concTitle: 'Conclusions & Next Steps',
      concSub: 'Strategic recommendations and key takeaways',
      concPoints: [
        { heading: 'Immediate Priority', description: 'Step-by-step implementation of modern methodologies into operational workflows.' },
        { heading: 'Continuous Monitoring', description: 'Regular evaluation of KPIs and proactive performance tracking.' },
        { heading: 'Resource Optimization', description: 'Focusing key capabilities on high-impact strategic initiatives.' }
      ],
      concHighlight: `A well-defined strategy and consistent execution ensure sustainable success.`,
      concNotes: 'Thank you very much for your time and attention! I welcome any questions or discussion.'
    },
    tg: {
      sub: `Муаррифии махсуси таҳлилӣ дар самти: ${categoryObj.name}`,
      notes: `Салом! Муаррифии имрӯзаи мо ба мавзӯи "${topic}" бахшида шудааст.`,
      concTitle: 'Хулосаҳо ва Қадамҳои Минбаъда',
      concSub: 'Тавсияҳои стратегӣ ва натиҷагирии ниҳоӣ',
      concPoints: [
        { heading: 'Қадами аввалиндараҷа', description: 'Татбиқи зина ба зинаи усулҳои муосир ва воситаҳои амалӣ дар равандҳои корӣ.' },
        { heading: 'Мониторинги доимӣ', description: 'Баҳодиҳии мунтазами нишондиҳандаҳо ва назорати рушд.' },
        { heading: 'Оптимизатсияи захираҳо', description: 'Таваҷҷуҳ ба самтҳое, ки самаранокии баландтаринро таъмин мекунанд.' }
      ],
      concHighlight: `Стратегияи дуруст ва фаъолияти пайгирона натиҷаи баландро кафолат медиҳад.`,
      concNotes: 'Шунавандагони гиромӣ, ташаккури зиёд барои диққататон! Агар саволе бошад, бо камоли майл посух медиҳам.'
    }
  }[language] || {
    sub: `${categoryObj.name} doirasidagi maxsus tahliliy taqdimot`,
    notes: `Assalomu alaykum! Bugungi taqdimotimiz "${topic}" mavzusiga bag'ishlanadi.`,
    concTitle: 'Xulosalar va Keyingi Qadamlar',
    concSub: 'Strategik tavsiyalar va yakuniy xulosa',
    concPoints: [
      { heading: '1-ustuvor qadam', description: 'Mavjud metodologiyani bugunoq bosqichma-bosqich amaliyotga joriy etish.' },
      { heading: 'Doimiy monitoring va nazorat', description: 'Barcha ko\'rsatkichlarni muntazam tahlil qilib, o\'zgarishlarga tez moslashish.' },
      { heading: 'Resurslarni optimallashtirish', description: 'Eng yuqori samara beruvchi asosiy yo\'nalishlarga ko\'proq e\'tibor qaratish.' }
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

  // Mavzuga moslashtirilgan 7 ta boy va unikal bosqichlar
  const stageTemplates = getLocalizedGenericStages(topic, enKeywords, language) || getDomainStages(topic, enKeywords);

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
          ? `На данном слайде ${i} мы подробно рассмотрим тему "${st.title}".`
          : language === 'en'
          ? `On this slide ${i}, we explore the key aspects of "${st.title}".`
          : language === 'tg'
          ? `Дар ин слайди ${i} мо ҷанбаҳои муҳими мавзӯи "${st.title}"-ро баррасӣ мекунем.`
          : `Ushbu ${i}-slaydda biz ${st.title} mavzusidagi muhim jihatlarga to'xtalamiz.`
      });
    }
  }

  return {
    title: topic,
    subtitle: localizedMeta.sub,
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
    uz: "O'zbek tilida (barcha slayd sarlavhalari, matnlari, tushuntirishlari, xulosalari va nutq matni toza o'zbek adabiy tilida bo'lsin)",
    ru: "Русском языке (на грамотном, профессиональном русском языке: ВСЕ заголовки, подзаголовки, тезисы, аналитика, ключевые выводы и заметки докладчика speakerNotes должны быть строго на русском языке)",
    en: "English (in professional, high-impact English: ALL slide titles, subtitles, bullet points, descriptions, highlights, and speakerNotes must be strictly in English)",
    tg: "Забони тоҷикӣ (бо забони шево ва адабии тоҷикӣ: ҲАМАИ сарлавҳаҳо, зерсарлавҳаҳо, нуктаҳои асосӣ, таҳлилҳо, хулосаҳо ва қайдҳои баромадкунанда speakerNotes бояд комилан ба забони тоҷикӣ бошанд)",
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
  return generateDynamicFallbackPresentation({ topic, slideCount: targetCount, language, theme, categoryObj });
}
