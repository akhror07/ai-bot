import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pptxgen = require('pptxgenjs');
import JSZip from 'jszip';
import path from 'path';
import fs from 'fs';
import { getTheme } from './themes.js';
import { fetchContextualImage } from './images.js';
import { getSmartDomainCharts } from './ai.js';

const TEMP_DIR = path.resolve('temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// 8 xil hayratlanarli, noodatiy perexod (transition) animatsiyalari
const TRANSITIONS = [
  '<p:wheel spokes="4"/>',       // 4 qanotli aylanuvchi charxpalak!
  '<p:circle/>',                 // Iris doira bo'ylab kengayuvchi ochilish!
  '<p:diamond/>',                // Olmos shaklida yorib chiquvchi effekt!
  '<p:blinds orient="horz"/>',   // Gorizontal zamonaviy jalyuzi!
  '<p:comb orient="vert"/>',     // Vertikal taroqli chiziqlar o'tishi!
  '<p:zoom dir="in"/>',          // 3D yaqinlashuvchi kinematik Zoom-in!
  '<p:checker dir="horz"/>',     // Shaxmat doskasidek kubiklar bilan ochilish!
  '<p:wedge/>',                  // Foniy ponasimon ochilish effekti!
];

/**
 * Barcha slaydlar uchun rasmlarni parallel yuklaydi.
 */
async function loadAllImages(slidesList, mainTitle) {
  console.log(`[PPTX] ${slidesList.length} ta slayd uchun mavzuga mos rasmlar yuklanmoqda: "${mainTitle}"...`);

  const result = await Promise.all(
    slidesList.map(async (s, idx) => {
      let prompts = s.imagePrompts || (s.imagePrompt ? [s.imagePrompt] : []);
      if (!prompts || !prompts.length) {
        if (idx === 0) {
          prompts = [`${mainTitle} professional landscape photo`, `${mainTitle} architecture visual`];
        } else if (idx === slidesList.length - 1) {
          prompts = [`${mainTitle} future perspective achievement`, `${mainTitle} strategic vision`];
        } else {
          prompts = [
            `${s.title || mainTitle} specific concept photo`,
            `${mainTitle} technology visual`
          ];
        }
      }
      const isWideBackground = idx === 0 || idx === slidesList.length - 1 || s.layoutType === 'cinematic';
      const w = isWideBackground ? 1920 : 1200;
      const h = isWideBackground ? 1080 : 800;

      const images = await Promise.all(
        prompts.slice(0, 2).map(p => fetchContextualImage(p, w, h))
      );
      return images.filter(Boolean);
    })
  );
  return result;
}

function getI18n(lang = 'uz') {
  const dict = {
    uz: {
      badge: 'TAQDIMOT',
      slide: 'Slayd',
      highlightPrefix: '💡 Xulosa: ',
      mainVisual: '📌 ASOSIY VIZUAL',
      coreConcept: '🎯 Asosiy Tushuncha',
      stepBadge: (n) => `0${n}-BOSQICH`,
      stepFallback: (n) => `Bosqich ${n}`,
      analysisSummary: '📊 Tahliliy Xulosa: ',
      analysisSummaryFallback: 'Tizimli tahlil va aniq metodologiya yuqori samaradorlikni ta\'minlaydi.',
      spotlightPrefix: "💬 Bosh G'oya: ",
      conclusionHeading: '🎯 BOSH XULOSA',
      conclusionSuccess: '🚀 Muvaffaqiyat kaliti: Doimiy rivojlanish va aniq harakatlar rejasi!',
      recommendation: (n) => `Tavsiya ${n}`,
      pointFallback: (n) => `Asosiy yo'nalish ${n}`,
      partFallback: (n) => `Tarkibiy qism ${n}`,
      partDesc: 'Muhim tamoyil va uning amaliy ahamiyati.',
      leftDefault: 'ASOSIY OMILLAR',
      rightDefault: 'AMALIY NATIJALAR',
      kpiLabels: ['Samaradorlik o\'sishi', 'Unumdorlik ko\'rsatkichi', 'Yetakchi o\'rin'],
      kpiDescs: ['Jarayonlar optimallashuvi', 'Resurslardan oqilona foydalanish', 'Yuqori sifat ko\'rsatkichlari'],
      totalInfo: (n) => `Jami: ${n} ta slayd • 16:9 Full HD • Professional Dizayn`,
      chartBadge: '📊 EMPIRIK TAHLIL & ASOSIY OMILLAR',
      chartTitle: '📈 NATIJALAR & DINAMIKA (POWERPOINT CHART)',
      kpiChartTitle: '📊 STATISTIK TAHLIL VA STRUKTURAVIY DINAMIKA',
      agendaBadge: '📋 MUNDARIJA & REJA',
      focusBadge: '🎯 ASOSIY FOKUS',
      tableHeaders: ['Bosqich / Davr', 'Asosiy Vazifa & Strategiya', 'Mas\'ul Bo\'lim & Resurs', 'Kutilayotgan KPI'],
      tableSummary: '📊 Tizimli Reja: Har bir bosqich qat\'iy mezonlar asosida nazorat qilinadi.',
      swotBadges: ['STRENGTHS (KUCHLI TOMONLAR)', 'WEAKNESSES (ZAIF JIHATLAR)', 'OPPORTUNITIES (IMKONIYATLAR)', 'THREATS (XAVF-XATARLAR)'],
      swotLetters: ['S', 'W', 'O', 'T'],
      problemHeading: '⚠️ DOLZARB MUAMMO VA XATARLAR',
      solutionHeading: '💡 INNOVATSION YECHIM VA METODLAR',
      solutionImpact: '📈 Kutilayotgan samaradorlik va amaliy natijalar.',
      pyramidLevelLabels: ['01. Strategik Cho\'qqi & Missiya', '02. Boshqaruv & Operatsion Tizim', '03. Fundamental Asos & Infratuzilma'],
      quoteLead: 'MUHIM AKADEMIK KONSEPSIYA & XULOSA',
      stakeholderBadges: ['Boshqaruv & Regulyatorlar', 'Amaliyotchi Mutaxassislar', 'Yakuniy Foydalanuvchilar'],
      sourcePrefix: '📊 Manba: ',
      ratingScaleNote: 'Baholash shkalasi: ●●●●● — a\'lo daraja, ○ — juda zaif. Ekspert tahliliy bahosi.',
      scenarioRule: '💡 Qoida: Avval vazifa va byudjet aniqlanadi, keyin optimal tizim tanlanadi.',
      profileHeadings: {
        pros: 'KUCHLI TOMONLARI',
        cons: 'ZAIF TOMONLARI & CHEKLOVLAR',
        bestFor: 'ENG MOS SOHALAR',
        passport: 'TIZIM PASPORTI'
      },
      coverSources: 'StatCounter, Gartner va rasmiy xalqaro manbalar asosida',
      chartLabels: ['Boshlang\'ich', 'O\'rta bosqich', 'Amaliy natija', 'Maqsadli prognoz'],
      keyMetricFallback: 'Omil',
      indicatorFallback: 'Ko\'rsatkich',
      milestonesPhases: [
        { period: '1-Bosqich (Q1)', resp: 'Boshqaruv & Audit', kpi: '100% Audit' },
        { period: '2-Bosqich (Q2)', resp: 'Texnik Departament', kpi: '+35% Tezlik' },
        { period: '3-Bosqich (Q3)', resp: 'Operatsion Bo\'lim', kpi: '95% Samaradorlik' },
        { period: '4-Bosqich (Q4)', resp: 'Sifat Nazorati', kpi: 'Barqaror O\'sish' },
      ],
      problemSolutionDefaults: {
        probHeading: 'Tizimdagi Asosiy Kamchiliklar',
        probDesc: 'Eski an\'anaviy metodologiyalar yuqori resurs yo\'qotishlariga va past samaradorlikka olib kelmoqda.',
        solHeading: 'Ilg\'or Texnologik Mexanizm',
        solDesc: 'Avtomatlashtirilgan tahlil va zamonaviy mexanizmlar orqali jarayonlar to\'liq optimallashtiriladi.',
      },
      matrixRatingCols: ['Mezon', 'Variant A', 'Variant B', 'Variant C', 'Variant D', 'Variant E'],
      matrixRatingRows: [
        { name: 'Ekotizim & Qamrov', scores: ['●●●●●', '●●●●○', '●●●○○', '●●●●●', '●●●●○'] },
        { name: 'Xavfsizlik & Maxfiylik', scores: ['●●●○○', '●●●●○', '●●●●●', '●●●○○', '●●●●●'] },
        { name: 'Moslashtirish Erkinligi', scores: ['●●●○○', '●●○○○', '●●●●●', '●●●●○', '●●○○○'] },
        { name: 'Resurs Samaradorligi', scores: ['●●●○○', '●●●●○', '●●●●●', '●●●○○', '●●●●●'] },
        { name: 'Kirish Narxi & Tejamkorlik', scores: ['●●●○○', '●●○○○', '●●●●●', '●●●●●', '●●○○○'] },
      ],
      criterionFallback: 'Mezon',
      scenarioHeaders: ['Foydalanish Stsenariysi / Vazifa', 'Tavsiya Etilgan Tanlov', 'Asosiy Sabab & Strategik Afzallik'],
      scenarioFallback: [
        { scenario: 'Korporativ Ofis & Boshqaruv', choice: 'Standart Model A', reason: 'Keng qamrovli ekotizim, markaziy audit va integratsiya qulayligi.' },
        { scenario: 'Kreativ Ish & Dizayn', choice: 'Premium Model B', reason: 'Maksimal rang aniqligi, unumdorlik va energiya samaradorligi balansi.' },
        { scenario: 'Dasturlash & Infratuzilma', choice: 'Ochiq Model C', reason: 'UNIX/POSIX muhiti, konteynerlar va litsenziya xarajatlarining yo\'qligi.' },
        { scenario: 'Ommaviy Bozor & Mass Market', choice: 'Moslashuvchan Model D', reason: 'Keng apparat tanlovi, har qanday byudjetga moslik va erkinlik.' },
        { scenario: 'Eski yoki Cheklangan Resurs', choice: 'Yengil Model E', reason: 'Minimal talablar bilan barqaror ishlash va tejamkorlik.' },
      ],
      recommendationBadge: 'Tavsiya',
      taskFallback: 'Vazifa',
      choiceBadge: 'Tanlov',
      profilePassportDefaults: [
        { label: 'Turi', val: 'Arxitektura / Tizim' },
        { label: 'Yadro', val: 'Gibrid / Modular' },
        { label: 'Litsenziya', val: 'Proprietar / Ochiq' },
        { label: 'Qamrov', val: '~75% Segment' },
      ],
      profileConsDefaults: [
        'Yuqori apparat talablari va resurs sarfi.',
        'Maxfiylik va telemetriya parametrlarining cheklanganligi.',
      ],
      profileBestForDefault: 'Korporativ ofis, ilmiy tadqiqotlar va keng qamrovli ekotizim.',
      stakeholderUserFallback: 'Foydalanuvchi',
    },
    ru: {
      badge: 'ПРЕЗЕНТАЦИЯ',
      slide: 'Слайд',
      highlightPrefix: '💡 Ключевой вывод: ',
      mainVisual: '📌 КЛЮЧЕВОЙ ОБЪЕКТ',
      coreConcept: '🎯 Ключевая Концепция',
      stepBadge: (n) => `ЭТАП 0${n}`,
      stepFallback: (n) => `Этап ${n}`,
      analysisSummary: '📊 Аналитический Вывод: ',
      analysisSummaryFallback: 'Системный анализ и обоснованная методология обеспечивают наивысшую результативность.',
      spotlightPrefix: '💬 Главная Идея: ',
      conclusionHeading: '🎯 ГЛАВНЫЙ ВЫВОД',
      conclusionSuccess: '🚀 Ключ к успеху: Постоянное развитие и системный подход!',
      recommendation: (n) => `Рекомендация ${n}`,
      pointFallback: (n) => `Ключевой аспект ${n}`,
      partFallback: (n) => `Компонент ${n}`,
      partDesc: 'Ключевой принцип и его практическая ценность.',
      leftDefault: 'КЛЮЧЕВЫЕ ФАКТОРЫ',
      rightDefault: 'ПРАКТИЧЕСКИЕ РЕЗУЛЬТАТЫ',
      kpiLabels: ['Рост эффективности', 'Показатель продуктивности', 'Лидирующая позиция'],
      kpiDescs: ['Оптимизация ключевых процессов', 'Рациональное использование ресурсов', 'Высокие стандарты качества'],
      totalInfo: (n) => `Всего: ${n} слайдов • 16:9 Full HD • Премиум Дизайн`,
      chartBadge: '📊 ЭМПИРИЧЕСКИЙ АНАЛИЗ & ФАКТОРЫ',
      chartTitle: '📈 ПОКАЗАТЕЛИ & ДИНАМИКА (POWERPOINT CHART)',
      kpiChartTitle: '📊 СТАТИСТИЧЕСКИЙ АНАЛИЗ И СТРУКТУРНАЯ ДИНАМИКА',
      agendaBadge: '📋 СОДЕРЖАНИЕ & ПЛАН',
      focusBadge: '🎯 КЛЮЧЕВОЙ ФОКУС',
      tableHeaders: ['Этап / Период', 'Ключевые Задачи & Стратегия', 'Ответственные & Ресурсы', 'Ожидаемый KPI'],
      tableSummary: '📊 Системный План: Каждый этап контролируется на основе измеримых отраслевых критериев.',
      swotBadges: ['STRENGTHS (СИЛЬНЫЕ СТОРОНЫ)', 'WEAKNESSES (СЛАБЫЕ СТОРОНЫ)', 'OPPORTUNITIES (ВОЗМОЖНОСТИ)', 'THREATS (УГРОЗЫ И РИСКИ)'],
      swotLetters: ['S', 'W', 'O', 'T'],
      problemHeading: '⚠️ АКТУАЛЬНЫЕ ПРОБЛЕМЫ & РИСКИ',
      solutionHeading: '💡 ИННОВАЦИОННЫЕ РЕШЕНИЯ & МЕТОДЫ',
      solutionImpact: '📈 Ожидаемый эффект и системная результативность.',
      pyramidLevelLabels: ['01. Стратегическая Вершина & Миссия', '02. Управленческие Механизмы', '03. Базовый Фундамент & Ресурсы'],
      quoteLead: 'КЛЮЧЕВАЯ АКАДЕМИЧЕСКАЯ КОНЦЕПЦИЯ',
      stakeholderBadges: ['Руководство & Регуляторы', 'Профильные Эксперты', 'Конечные Пользователи'],
      sourcePrefix: '📊 Источник: ',
      ratingScaleNote: 'Шкала оценки: ●●●●● — отлично, ○ — слабо. Экспертная аналитическая оценка.',
      scenarioRule: '💡 Правило: Сначала определяются задачи и бюджет, затем выбирается оптимальное решение.',
      profileHeadings: {
        pros: 'СИЛЬНЫЕ СТОРОНЫ',
        cons: 'СЛАБЫЕ СТОРОНЫ И ОГРАНИЧЕНИЯ',
        bestFor: 'НАИБОЛЕЕ ПОДХОДЯЩИЕ СФЕРЫ',
        passport: 'ПАСПОРТ СИСТЕМЫ'
      },
      coverSources: 'На основе StatCounter, Gartner и официальных отраслевых отчетов',
      chartLabels: ['Начальный уровень', 'Промежуточный этап', 'Практический результат', 'Целевой прогноз'],
      keyMetricFallback: 'Фактор',
      indicatorFallback: 'Показатель',
      milestonesPhases: [
        { period: '1-й Этап (Q1)', resp: 'Управление & Аудит', kpi: '100% Аудит' },
        { period: '2-й Этап (Q2)', resp: 'Технический Департамент', kpi: '+35% Скорость' },
        { period: '3-й Этап (Q3)', resp: 'Операционный Отдел', kpi: '95% Эффективность' },
        { period: '4-й Этап (Q4)', resp: 'Контроль Качества', kpi: 'Стабильный Рост' },
      ],
      problemSolutionDefaults: {
        probHeading: 'Ключевые Системные Барьеры',
        probDesc: 'Устаревшие традиционные методологии приводят к высоким потерям ресурсов и низкой эффективности.',
        solHeading: 'Передовой Технологический Подход',
        solDesc: 'Комплексная автоматизация и современные инструменты обеспечивают оптимизацию и масштабируемость.',
      },
      matrixRatingCols: ['Критерий', 'Вариант A', 'Вариант B', 'Вариант C', 'Вариант D', 'Вариант E'],
      matrixRatingRows: [
        { name: 'Экосистема & Охват', scores: ['●●●●●', '●●●●○', '●●●○○', '●●●●●', '●●●●○'] },
        { name: 'Безопасность & Конфиденциальность', scores: ['●●●○○', '●●●●○', '●●●●●', '●●●○○', '●●●●●'] },
        { name: 'Гибкость Настройки', scores: ['●●●○○', '●●○○○', '●●●●●', '●●●●○', '●●○○○'] },
        { name: 'Эффективность Ресурсов', scores: ['●●●○○', '●●●●○', '●●●●●', '●●●○○', '●●●●●'] },
        { name: 'Экономичность Внедрения', scores: ['●●●○○', '●●○○○', '●●●●●', '●●●●●', '●●○○○'] },
      ],
      criterionFallback: 'Критерий',
      scenarioHeaders: ['Сценарий Использования / Задача', 'Рекомендуемый Выбор', 'Обоснование & Преимущества'],
      scenarioFallback: [
        { scenario: 'Корпоративное Управление & Офис', choice: 'Стандартная Модель A', reason: 'Глубокая экосистема, централизованный аудит и простота интеграции.' },
        { scenario: 'Креативные Задачи & Дизайн', choice: 'Премиум Модель B', reason: 'Прецизионная точность цветопередачи и высокая энергоэффективность.' },
        { scenario: 'Разработка ПО & Серверы', choice: 'Открытая Модель C', reason: 'Среда UNIX/POSIX, контейнеризация и отсутствие лицензионных издержек.' },
        { scenario: 'Массовый Сегмент & Масштабирование', choice: 'Гибкая Модель D', reason: 'Широкая аппаратная совместимость и адаптивность под любой бюджет.' },
        { scenario: 'Ограниченные Аппаратные Ресурсы', choice: 'Облегченная Модель E', reason: 'Минимальные системные требования и стабильная бесперебойная работа.' },
      ],
      recommendationBadge: 'Рекомендация',
      taskFallback: 'Задача',
      choiceBadge: 'Выбор',
      profilePassportDefaults: [
        { label: 'Тип', val: 'Архитектура / Система' },
        { label: 'Ядро', val: 'Гибридное / Модульное' },
        { label: 'Лицензия', val: 'Проприетарная / Open Source' },
        { label: 'Охват', val: '~75% Сегмента' },
      ],
      profileConsDefaults: [
        'Повышенные системные требования и потребление ресурсов.',
        'Ограниченная гибкость настройки телеметрии и приватности.',
      ],
      profileBestForDefault: 'Корпоративный сектор, академические исследования и масштабируемые экосистемы.',
      stakeholderUserFallback: 'Пользователь',
    },
    en: {
      badge: 'PRESENTATION',
      slide: 'Slide',
      highlightPrefix: '💡 Key Takeaway: ',
      mainVisual: '📌 KEY VISUAL',
      coreConcept: '🎯 Core Concept',
      stepBadge: (n) => `PHASE 0${n}`,
      stepFallback: (n) => `Phase ${n}`,
      analysisSummary: '📊 Analytical Insight: ',
      analysisSummaryFallback: 'Systematic analysis and proven methodologies drive sustainable performance.',
      spotlightPrefix: '💬 Core Insight: ',
      conclusionHeading: '🎯 KEY TAKEAWAY',
      conclusionSuccess: '🚀 Key to success: Continuous development and disciplined execution!',
      recommendation: (n) => `Recommendation ${n}`,
      pointFallback: (n) => `Key Dimension ${n}`,
      partFallback: (n) => `Core Pillar ${n}`,
      partDesc: 'Essential principle delivering validated practical impact.',
      leftDefault: 'CORE FACTORS',
      rightDefault: 'PRACTICAL OUTCOMES',
      kpiLabels: ['Efficiency Surge', 'Productivity Index', 'Industry Benchmark'],
      kpiDescs: ['Systematic process optimization', 'Effective turnaround of resources', 'High standards of excellence'],
      totalInfo: (n) => `Total: ${n} slides • 16:9 Full HD • Executive Design`,
      chartBadge: '📊 EMPIRICAL ANALYSIS & KEY DRIVERS',
      chartTitle: '📈 PERFORMANCE & METRICS (POWERPOINT CHART)',
      kpiChartTitle: '📊 STATISTICAL ANALYSIS & STRUCTURAL DYNAMICS',
      agendaBadge: '📋 AGENDA & OUTLINE',
      focusBadge: '🎯 STRATEGIC FOCUS',
      tableHeaders: ['Phase / Timeline', 'Core Strategic Deliverable', 'Ownership & Resources', 'Target KPI / Benchmark'],
      tableSummary: '📊 Systemic Roadmap: Every operational milestone is audited against rigorous industry benchmarks.',
      swotBadges: ['STRENGTHS (CORE ADVANTAGES)', 'WEAKNESSES (CHALLENGES)', 'OPPORTUNITIES (GROWTH AREAS)', 'THREATS (STRATEGIC RISKS)'],
      swotLetters: ['S', 'W', 'O', 'T'],
      problemHeading: '⚠️ CORE CHALLENGES & RISKS',
      solutionHeading: '💡 INNOVATIVE SOLUTIONS & ROADMAP',
      solutionImpact: '📈 Expected performance surge and strategic impact.',
      pyramidLevelLabels: ['01. Strategic Pinnacle & Vision', '02. Operational Systems & Tools', '03. Core Infrastructure & Foundation'],
      quoteLead: 'EXECUTIVE CITATION & INSIGHT',
      stakeholderBadges: ['Leadership & Governance', 'Domain Specialists', 'Target Beneficiaries'],
      sourcePrefix: '📊 Source: ',
      ratingScaleNote: 'Rating scale: ●●●●● — excellent, ○ — weak. Domain expert evaluation.',
      scenarioRule: '💡 Core rule: Define workload and budget first, then select the optimal solution.',
      profileHeadings: {
        pros: 'CORE STRENGTHS',
        cons: 'KEY LIMITATIONS & RISKS',
        bestFor: 'OPTIMAL USE CASES',
        passport: 'SYSTEM PROFILE'
      },
      coverSources: 'Based on StatCounter, Gartner, and official global data benchmarks',
      chartLabels: ['Baseline Level', 'Mid-term Milestone', 'Practical Outcome', 'Target Forecast'],
      keyMetricFallback: 'Factor',
      indicatorFallback: 'Metric',
      milestonesPhases: [
        { period: 'Phase 1 (Q1)', resp: 'Governance & Audit', kpi: '100% Audited' },
        { period: 'Phase 2 (Q2)', resp: 'Technical Department', kpi: '+35% Velocity' },
        { period: 'Phase 3 (Q3)', resp: 'Operations Team', kpi: '95% Efficiency' },
        { period: 'Phase 4 (Q4)', resp: 'Quality Assurance', kpi: 'Sustainable Growth' },
      ],
      problemSolutionDefaults: {
        probHeading: 'Core Systemic Barriers',
        probDesc: 'Legacy methodologies result in high resource attrition and suboptimal operational velocity.',
        solHeading: 'Advanced Strategic Framework',
        solDesc: 'Automated analytics and modern architectural tooling ensure complete workflow optimization.',
      },
      matrixRatingCols: ['Criterion', 'Option A', 'Option B', 'Option C', 'Option D', 'Option E'],
      matrixRatingRows: [
        { name: 'Ecosystem & Coverage', scores: ['●●●●●', '●●●●○', '●●●○○', '●●●●●', '●●●●○'] },
        { name: 'Security & Privacy', scores: ['●●●○○', '●●●●○', '●●●●●', '●●●○○', '●●●●●'] },
        { name: 'Customization Flexibility', scores: ['●●●○○', '●●○○○', '●●●●●', '●●●●○', '●●○○○'] },
        { name: 'Resource Efficiency', scores: ['●●●○○', '●●●●○', '●●●●●', '●●●○○', '●●●●●'] },
        { name: 'Cost Optimization', scores: ['●●●○○', '●●○○○', '●●●●●', '●●●●●', '●●○○○'] },
      ],
      criterionFallback: 'Criterion',
      scenarioHeaders: ['Use Case Scenario / Objective', 'Recommended Choice', 'Rationale & Strategic Advantage'],
      scenarioFallback: [
        { scenario: 'Enterprise Governance & Office', choice: 'Standard Model A', reason: 'Unified ecosystem, centralized governance, and seamless integration.' },
        { scenario: 'Creative Media & High-End Design', choice: 'Premium Model B', reason: 'Maximum color calibration, raw processing power, and efficiency.' },
        { scenario: 'Software Engineering & Cloud', choice: 'Open Model C', reason: 'Robust UNIX/POSIX toolchain, native containerization, zero licensing overhead.' },
        { scenario: 'Mass Market & Broad Deployment', choice: 'Flexible Model D', reason: 'Broad hardware compatibility, modular scalability, and budget adaptability.' },
        { scenario: 'Resource-Constrained Environments', choice: 'Lightweight Model E', reason: 'Minimal system footprint, high resilience, and low operational cost.' },
      ],
      recommendationBadge: 'Recommendation',
      taskFallback: 'Objective',
      choiceBadge: 'Choice',
      profilePassportDefaults: [
        { label: 'Type', val: 'Architecture / System' },
        { label: 'Core', val: 'Hybrid / Modular' },
        { label: 'License', val: 'Proprietary / Open Source' },
        { label: 'Adoption', val: '~75% Coverage' },
      ],
      profileConsDefaults: [
        'Elevated hardware requirements and intensive resource consumption.',
        'Constraints in bespoke telemetry configuration and data privacy.',
      ],
      profileBestForDefault: 'Enterprise leadership, rigorous scientific research, and complex ecosystems.',
      stakeholderUserFallback: 'Stakeholder',
    },
    tg: {
      badge: 'МУАРРИФӢ',
      slide: 'Слайд',
      highlightPrefix: '💡 Хулосаи асосӣ: ',
      mainVisual: '📌 ВИЗУАЛИ АСОСӢ',
      coreConcept: '🎯 Консепсияи Асосӣ',
      stepBadge: (n) => `МАРҲИЛАИ 0${n}`,
      stepFallback: (n) => `Марҳилаи ${n}`,
      analysisSummary: '📊 Хулосаи Таҳлилӣ: ',
      analysisSummaryFallback: 'Таҳлили мунтазам ва усулҳои дақиқ самаранокии баландро таъмин менамоянд.',
      spotlightPrefix: '💬 Ғояи Асосӣ: ',
      conclusionHeading: '🎯 ХУЛОСАИ АСОСӢ',
      conclusionSuccess: '🚀 Калиди комёбӣ: Рушди доимӣ ва фаъолияти пайгирона!',
      recommendation: (n) => `Тавсияи ${n}`,
      pointFallback: (n) => `Ҷанбаи асосӣ ${n}`,
      partFallback: (n) => `Рукни асосӣ ${n}`,
      partDesc: 'Принсипи муҳим ва аҳамияти амалии он.',
      leftDefault: 'ОМИЛҲОИ АСОСӢ',
      rightDefault: 'НАТИҶАҲОИ АМАЛӢ',
      kpiLabels: ['Афзоиши самаранокӣ', 'Нишондиҳандаи маҳсулнокӣ', 'Мавқеи пешсаф'],
      kpiDescs: ['Оптимизатсияи равандҳо', 'Истифодаи дурусти захираҳо', 'Стандартҳои баланди сифат'],
      totalInfo: (n) => `Ҳамагӣ: ${n} слайд • 16:9 Full HD • Тарҳи Касбӣ`,
      chartBadge: '📊 ТАҲЛИЛИ ЭМПИРИКӢ & ОМИЛҲО',
      chartTitle: '📈 НАТИҶАҲО & ДИНАМИКА (POWERPOINT CHART)',
      kpiChartTitle: '📊 ТАҲЛИЛИ ОМОРӢ ВА ДИНАМИКАИ СОХТОРӢ',
      agendaBadge: '📋 МУНДАРИҶА & НАҚША',
      focusBadge: '🎯 ФОКУСИ АСОСӢ',
      tableHeaders: ['Марҳила / Мӯҳлат', 'Вазифаҳои Асосӣ & Стратегия', 'Масъулият & Захираҳо', 'Натиҷаи Ниҳоӣ (KPI)'],
      tableSummary: '📊 Нақшаи Низомманд: Ҳар як марҳила дар асоси меъёрҳои мушаххас назорат карда мешавад.',
      swotBadges: ['STRENGTHS (ҶАНБАҲОИ ҚАВӢ)', 'WEAKNESSES (ҶАНБАҲОИ ЗАИФ)', 'OPPORTUNITIES (ИМКОНИЯТҲО)', 'THREATS (ХАВФҲО ВА ТАҲДИДҲО)'],
      swotLetters: ['S', 'W', 'O', 'T'],
      problemHeading: '⚠️ МУШКИЛОТИ МУҲИМ ВА ХАВФҲО',
      solutionHeading: '💡 РОҲҲОИ ҲАЛЛИ ИННОВАТСИОНӢ',
      solutionImpact: '📈 Натиҷаи чашмдошти самаранокӣ ва дигаргунии амалӣ.',
      pyramidLevelLabels: ['01. Қуллаи Стратегӣ ва Ҳадаф', '02. Механизмҳои Идоракунӣ', '03. Пойдевори Асосӣ ва Захираҳо'],
      quoteLead: 'КОНСЕПСИЯ ВА ХУЛОСАИ МУҲИМИ ИЛМӢ',
      stakeholderBadges: ['Роҳбарият ва Танзимгарон', 'Мутахассисони Соҳавӣ', 'Истифодабарандагони Ниҳоӣ'],
      sourcePrefix: '📊 Сарчашма: ',
      ratingScaleNote: 'Миқёси баҳодиҳӣ: ●●●●● — аъло, ○ — заиф. Баҳодиҳии коршиносон.',
      scenarioRule: '💡 Қоида: Аввал ҳадаф ва буҷет муайян карда мешавад, сипас қарор интихоб мешавад.',
      profileHeadings: {
        pros: 'ҶАНБАҲОИ ҚАВӢ',
        cons: 'ҶАНБАҲОИ ЗАИФ ВА МАҲДУДИЯТҲО',
        bestFor: 'СОҲАҲОИ МУНОСИБ',
        passport: 'ШИНОСНОМАИ НИЗОМ'
      },
      coverSources: 'Дар асоси StatCounter, Gartner ва омори расмии ҷаҳонӣ',
      chartLabels: ['Сатҳи ибтидоӣ', 'Марҳилаи мобайнӣ', 'Натиҷаи амалӣ', 'Пешгӯии ҳадаф'],
      keyMetricFallback: 'Омил',
      indicatorFallback: 'Нишондиҳанда',
      milestonesPhases: [
        { period: 'Марҳилаи 1 (Q1)', resp: 'Идоракунӣ ва Аудит', kpi: '100% Аудит' },
        { period: 'Марҳилаи 2 (Q2)', resp: 'Шӯъбаи Техникӣ', kpi: '+35% Суръат' },
        { period: 'Марҳилаи 3 (Q3)', resp: 'Шӯъбаи Амалиётӣ', kpi: '95% Самаранокӣ' },
        { period: 'Марҳилаи 4 (Q4)', resp: 'Назорати Сифат', kpi: 'Рушди Устувор' },
      ],
      problemSolutionDefaults: {
        probHeading: 'Маҳдудиятҳои Асосии Низом',
        probDesc: 'Усулҳои кӯҳна ба талафоти баланди захираҳо ва самаранокии паст оварда мерасонанд.',
        solHeading: 'Равиши Пешқадами Технологӣ',
        solDesc: 'Автоматикунонии ҳамаҷониба ва воситаҳои муосир оптимизатсияи пурраро таъмин менамоянд.',
      },
      matrixRatingCols: ['Меъёр', 'Варианти A', 'Варианти B', 'Варианти C', 'Варианти D', 'Варианти E'],
      matrixRatingRows: [
        { name: 'Экосистема ва Фарогирӣ', scores: ['●●●●●', '●●●●○', '●●●○○', '●●●●●', '●●●●○'] },
        { name: 'Амният ва Махфият', scores: ['●●●○○', '●●●●○', '●●●●●', '●●●○○', '●●●●●'] },
        { name: 'Озодии Танзим', scores: ['●●●○○', '●●○○○', '●●●●●', '●●●●○', '●●○○○'] },
        { name: 'Самаранокии Захираҳо', scores: ['●●●○○', '●●●●○', '●●●●●', '●●●○○', '●●●●●'] },
        { name: 'Сарфакории Хароҷот', scores: ['●●●○○', '●●○○○', '●●●●●', '●●●●●', '●●○○○'] },
      ],
      criterionFallback: 'Меъёр',
      scenarioHeaders: ['Сценарияи Истифода / Вазифа', 'Интихоби Тавсияшаванда', 'Сабаби Асосӣ ва Бартарии Стратегӣ'],
      scenarioFallback: [
        { scenario: 'Идоракунии Корпоратӣ ва Офис', choice: 'Модели Стандартии A', reason: 'Экосистемаи васеъ, назорати марказӣ ва ҳамгироии осон.' },
        { scenario: 'Корҳои Эҷодӣ ва Дизайн', choice: 'Модели Премиуми B', reason: 'Дақиқии баланд, маҳсулнокӣ ва мувозинати сарфаи энергия.' },
        { scenario: 'Барномасозӣ ва Инфрасохтор', choice: 'Модели Кушодаи C', reason: 'Муҳити UNIX/POSIX, контейнерҳо ва набудани хароҷоти литсензия.' },
        { scenario: 'Бозори Оммавӣ ва Маҳаллӣ', choice: 'Модели Мутобиқшавандаи D', reason: 'Интихоби васеи сахтафзор ва мувофиқат ба ҳама гуна буҷет.' },
        { scenario: 'Захираҳои Маҳдуд', choice: 'Модели Сабуки E', reason: 'Талаботи ҳадди ақал ва фаъолияти боэътимод.' },
      ],
      recommendationBadge: 'Тавсия',
      taskFallback: 'Вазифа',
      choiceBadge: 'Интихоб',
      profilePassportDefaults: [
        { label: 'Намуд', val: 'Меъморӣ / Низом' },
        { label: 'Асос', val: 'Гибридӣ / Модулӣ' },
        { label: 'Литсензия', val: 'Хусусӣ / Кушода' },
        { label: 'Фарогирӣ', val: '~75% Ҳаҷм' },
      ],
      profileConsDefaults: [
        'Талаботи баланди техникӣ ва хароҷоти захираҳо.',
        'Маҳдудият дар танзими амният ва махфият.',
      ],
      profileBestForDefault: 'Бахши корпоративӣ, таҳқиқоти илмӣ ва экосистемаҳои васеъ.',
      stakeholderUserFallback: 'Истифодабаранда',
    },
  };
  return dict[lang] || dict.uz;
}

/**
 * Slayd foni va zamonaviy ambient bezaklari (barcha temalarga mos)
 */
function applySlideBackground(slide, pres, theme) {
  slide.background = { color: theme.bg };

  if (theme.id === 'monochrome') {
    // Shveytsariya brutalizmi va arxitektura chiziqlari (Swiss architectural grid lines)
    slide.addShape(pres.ShapeType.line, {
      x: 0.8, y: 0.25, w: 0, h: 7.0,
      line: { color: theme.border, width: 0.6, transparency: 40 },
    });
    slide.addShape(pres.ShapeType.line, {
      x: 12.53, y: 0.25, w: 0, h: 7.0,
      line: { color: theme.border, width: 0.6, transparency: 40 },
    });
    // Kichik burchak xochi (crosshair mark)
    slide.addShape(pres.ShapeType.line, {
      x: 12.35, y: 0.45, w: 0.35, h: 0,
      line: { color: theme.subtext, width: 0.8 },
    });
    slide.addShape(pres.ShapeType.line, {
      x: 12.52, y: 0.28, w: 0, h: 0.35,
      line: { color: theme.subtext, width: 0.8 },
    });
  } else if (theme.id === 'neon_abstract') {
    // Neon 3D Shisha & Fluid Auralar (#F88196 pushti va #96BFCB moviy)
    slide.addShape(pres.ShapeType.ellipse, {
      x: 9.8, y: -1.0, w: 4.8, h: 4.8,
      fill: { color: 'F88196', transparency: 91 },
      line: { color: 'F88196', transparency: 91 },
    });
    slide.addShape(pres.ShapeType.ellipse, {
      x: -1.2, y: 4.8, w: 4.5, h: 4.5,
      fill: { color: '96BFCB', transparency: 91 },
      line: { color: '96BFCB', transparency: 91 },
    });
    // 3D Glass Torus dekorativ halqasi
    slide.addShape(pres.ShapeType.ellipse, {
      x: 10.8, y: 4.8, w: 2.8, h: 2.8,
      line: { color: 'F88196', width: 1.2, transparency: 85 },
    });
  } else if (theme.id === 'cosmic' || theme.id === 'amethyst') {
    // Fazoviy / Ametist auralari
    slide.addShape(pres.ShapeType.ellipse, {
      x: 9.8, y: -1.2, w: 5.0, h: 5.0,
      fill: { color: theme.primary, transparency: 91 },
      line: { color: theme.primary, transparency: 91 },
    });
    slide.addShape(pres.ShapeType.ellipse, {
      x: -1.5, y: 4.6, w: 4.8, h: 4.8,
      fill: { color: theme.accent || theme.primary, transparency: 92 },
      line: { color: theme.accent || theme.primary, transparency: 92 },
    });
  } else if (theme.id === 'latte' || theme.id === 'terracotta') {
    // Issiq kofe / terrakotta estetikasi
    slide.addShape(pres.ShapeType.ellipse, {
      x: 10.2, y: -1.2, w: 4.6, h: 4.6,
      fill: { color: theme.primary, transparency: 92 },
      line: { color: theme.primary, transparency: 92 },
    });
    slide.addShape(pres.ShapeType.ellipse, {
      x: -1.2, y: 5.0, w: 4.2, h: 4.2,
      fill: { color: theme.accent || theme.primary, transparency: 93 },
      line: { color: theme.accent || theme.primary, transparency: 93 },
    });
  } else if (theme.id === 'sage') {
    // Tabiiy adaçayı va zaytun auralari
    slide.addShape(pres.ShapeType.ellipse, {
      x: 10.5, y: -1.0, w: 4.4, h: 4.4,
      fill: { color: theme.primary, transparency: 92 },
      line: { color: theme.primary, transparency: 92 },
    });
    slide.addShape(pres.ShapeType.ellipse, {
      x: -1.0, y: 5.0, w: 4.0, h: 4.0,
      fill: { color: theme.accent || theme.primary, transparency: 93 },
      line: { color: theme.accent || theme.primary, transparency: 93 },
    });
  } else if (theme.id === 'tokyo_tech') {
    // Tokyo Tech chiziqlari va auralari
    slide.addShape(pres.ShapeType.ellipse, {
      x: 10.2, y: -1.2, w: 4.8, h: 4.8,
      fill: { color: theme.primary, transparency: 92 },
      line: { color: theme.primary, transparency: 92 },
    });
    slide.addShape(pres.ShapeType.ellipse, {
      x: -1.2, y: 5.0, w: 4.2, h: 4.2,
      fill: { color: theme.accent, transparency: 93 },
      line: { color: theme.accent, transparency: 93 },
    });
  } else {
    // Boshqa barcha temalar uchun standart yumshoq auralar
    slide.addShape(pres.ShapeType.ellipse, {
      x: 10.5, y: -1.2, w: 4.5, h: 4.5,
      fill: { color: theme.primary, transparency: 94 },
      line: { color: theme.primary, transparency: 94 },
    });
    slide.addShape(pres.ShapeType.ellipse, {
      x: -1.2, y: 5.2, w: 4.2, h: 4.2,
      fill: { color: theme.accent || theme.primary, transparency: 95 },
      line: { color: theme.accent || theme.primary, transparency: 95 },
    });
  }
}

/**
 * Matnni so'z yoki gap chegarasida xavfsiz qisqartirish (harflar bir-birining ustiga chiqmasligi uchun)
 */
function truncateClean(str, maxLen = 140) {
  if (!str || typeof str !== 'string') return '';
  const trimmed = str.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= maxLen) return trimmed;

  // Gap oxiri bo'yicha qidiramiz (. ! ?)
  const sentenceSlice = trimmed.substring(0, maxLen);
  const lastPunct = Math.max(
    sentenceSlice.lastIndexOf('. '),
    sentenceSlice.lastIndexOf('! '),
    sentenceSlice.lastIndexOf('? ')
  );
  if (lastPunct > maxLen * 0.55) {
    return sentenceSlice.substring(0, lastPunct + 1).trim();
  }

  // So'z chegarasi bo'yicha qidiramiz
  const lastSpace = sentenceSlice.lastIndexOf(' ');
  if (lastSpace > maxLen * 0.6) {
    return sentenceSlice.substring(0, lastSpace).trim() + '...';
  }
  return sentenceSlice.trim() + '...';
}

/**
 * Slayd sarlavhasini tozalash: Mavzu nomining takrorlanishini olib tashlash va uzunlikni cheklash
 */
function cleanSlideTitle(title, mainTitle = '') {
  if (!title || typeof title !== 'string') return '';
  let t = title.trim();

  // Agar sarlavha boshida umumiy mavzu nomi takrorlangan bo'lsa (masalan: "Mavzu: Bo'lim...")
  if (mainTitle && mainTitle.length > 3) {
    const esc = mainTitle.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    t = t.replace(new RegExp(`^${esc}\\s*[:\\-–—|]\\s*`, 'i'), '');
    t = t.replace(new RegExp(`^[:\\-–—|]\\s*`, 'i'), '');
  }

  // Agar ortiqcha uzun prefiks bo'lsa
  t = t.replace(/^[^:]{3,60}:\s*/, (match) => {
    if (match.length > 25 && t.length > 60) return '';
    return match;
  });

  return truncateClean(t, 65);
}

/**
 * Har bir slayd uchun standart sarlavha paneli (xatlar mutlaqo ustma-ust tushmaydigan dinamik joylashuv)
 */
function addSlideHeader(slide, pres, theme, title, subtitle, slideNumber, totalSlides, i18n = null, mainTitle = '') {
  const slideWord = i18n?.slide || 'Slayd';
  const isMonochrome = theme.id === 'monochrome';
  const isNeon = theme.id === 'neon_abstract';

  const cleanedTitle = cleanSlideTitle(title, mainTitle) || `${slideWord} ${slideNumber}`;
  const cleanedSub = truncateClean(subtitle, 105);

  // Sarlavha uzunligiga qarab shrift va balandlikni dinamik moslashtirish
  let titleFontSize = 20;
  let titleH = 0.44;
  if (cleanedTitle.length > 55) {
    titleFontSize = 15.5;
    titleH = 0.52;
  } else if (cleanedTitle.length > 35) {
    titleFontSize = 17.5;
    titleH = 0.48;
  }

  const titleY = 0.36;
  slide.addText(cleanedTitle, {
    x: 0.8, y: titleY, w: 9.8, h: titleH,
    fontFace: 'Arial', fontSize: titleFontSize, bold: true,
    color: isMonochrome ? '#111111' : (isNeon ? '#FFFFFF' : theme.primary),
    valign: 'middle', wrap: true, fit: 'shrink',
  });

  // Slayd raqami nishoni
  slide.addShape(pres.ShapeType.roundRect, {
    x: 10.9, y: 0.38, w: 1.63, h: 0.42,
    fill: { color: isMonochrome ? '111111' : theme.cardBg },
    line: { color: isNeon ? 'F88196' : theme.border, width: 1 },
    rectRadius: isMonochrome ? 0.05 : 0.1,
  });
  slide.addText(`${slideNumber} / ${totalSlides}`, {
    x: 10.9, y: 0.38, w: 1.63, h: 0.42,
    fontFace: 'Arial', fontSize: 11, bold: true,
    color: isMonochrome ? '#FFFFFF' : theme.subtext, align: 'center', valign: 'middle', fit: 'shrink',
  });

  // Kichik sarlavha (subtitle) — sarlavhadan pastda, HECH QACHON to'qnashmaydi
  let subY = titleY + titleH + 0.04;
  if (cleanedSub) {
    slide.addText(cleanedSub, {
      x: 0.8, y: subY, w: 11.73, h: 0.30,
      fontFace: 'Arial', fontSize: 11.5, color: theme.subtext, valign: 'middle', wrap: true, fit: 'shrink',
    });
    subY += 0.32;
  } else {
    subY += 0.06;
  }

  // Ajratuvchi chiziq va rangli aksent
  slide.addShape(pres.ShapeType.line, {
    x: 0.8, y: subY, w: 11.73, h: 0,
    line: { color: theme.border, width: 1.2 },
  });
  slide.addShape(pres.ShapeType.rect, {
    x: 0.8, y: subY - 0.02, w: 1.4, h: 0.04,
    fill: { color: isNeon ? 'F88196' : theme.primary },
    line: { color: isNeon ? 'F88196' : theme.primary },
  });
}

/**
 * Xulosa bloki (Highlight) — qat'iy chegaralangan balandlik va fit: shrink bilan
 */
function addHighlightBox(slide, pres, theme, text, y = 5.52, isGlass = false, i18n = null) {
  if (!text) return;

  const prefix = i18n?.highlightPrefix || '💡 ';
  const cleanContent = truncateClean(text, 130);
  const boxH = 0.82;
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.8, y, w: 11.73, h: boxH,
    fill: { color: theme.cardBg, transparency: isGlass ? 15 : 0 },
    line: { color: theme.border, width: 1.2 },
    rectRadius: 0.12,
  });

  // Chap aksent chizig'i
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.8, y, w: 0.12, h: boxH,
    fill: { color: theme.primary },
    line: { color: theme.primary },
    rectRadius: 0.05,
  });

  slide.addText([
    { text: prefix, options: { bold: true, fontSize: 11, color: theme.primary } },
    { text: cleanContent, options: { bold: false, italic: true, fontSize: 10.5, color: theme.text } }
  ], {
    x: 1.12, y: y + 0.05, w: 11.20, h: boxH - 0.1,
    valign: 'middle', wrap: true, fit: 'shrink',
  });
}

/**
 * Pastki footer (Manba va sahifa ko'rsatkichi)
 */
function addSlideFooter(slide, pres, theme, mainTitle, slideNumber, totalSlides, source = '', i18n = null) {
  if (!mainTitle && !source) return;
  slide.addShape(pres.ShapeType.line, {
    x: 0.8, y: 6.60, w: 11.73, h: 0,
    line: { color: theme.border, width: 0.8, transparency: 40 },
  });
  const sourcePrefix = i18n?.sourcePrefix || '📊 Manba: ';
  const footerText = source ? `${sourcePrefix}${source}` : (mainTitle || '');
  slide.addText(footerText, {
    x: 0.8, y: 6.66, w: 8.8, h: 0.32,
    fontFace: 'Arial', fontSize: 9.0, italic: !!source, color: theme.subtext, align: 'left', fit: 'shrink',
  });
  if (slideNumber && totalSlides) {
    slide.addText(`${slideNumber} / ${totalSlides}`, {
      x: 9.8, y: 6.66, w: 2.73, h: 0.32,
      fontFace: 'Arial', fontSize: 9.5, bold: true, color: theme.subtext, align: 'right', fit: 'shrink',
    });
  }
}

// ================================================================
// 1-LAYOUT: SPLIT HERO (Chapda rasm kartochkasi, O'ngda tahlil kartochkalari)
// ================================================================
function renderSplitHeroLayout(slide, pres, theme, item, num, total, img, data, i18n) {
  applySlideBackground(slide, pres, theme);
  addSlideHeader(slide, pres, theme, item.title, item.subtitle, num, total, i18n, data?.title);

  const points = item.points || [];
  const hasHighlight = !!item.highlight;
  const contentY = 1.68;
  const contentH = hasHighlight ? 3.65 : 4.60;

  const leftW = 4.8;
  const rightX = 5.95;
  const rightW = 6.58;

  // Chap tomon: Katta ramkali foto kartochka
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.8, y: contentY, w: leftW, h: contentH,
    fill: { color: theme.cardBg },
    line: { color: theme.primary, width: 1.5 },
    rectRadius: 0.14,
  });

  if (img) {
    slide.addImage({
      data: img,
      x: 0.88, y: contentY + 0.08,
      w: leftW - 0.16, h: contentH - 0.16,
      rounding: true,
    });
  } else {
    slide.addText(i18n.coreConcept, {
      x: 0.8, y: contentY, w: leftW, h: contentH,
      fontFace: 'Arial', fontSize: 16, bold: true, color: theme.primary, align: 'center', valign: 'middle', fit: 'shrink',
    });
  }

  // Rasm ustidagi yuqori kontrastli badge
  slide.addShape(pres.ShapeType.roundRect, {
    x: 1.05, y: contentY + 0.25, w: 2.3, h: 0.38,
    fill: { color: '000000', transparency: 30 },
    line: { color: theme.primary, width: 1.2 },
    rectRadius: 0.1,
  });
  slide.addText(i18n.mainVisual, {
    x: 1.05, y: contentY + 0.25, w: 2.3, h: 0.38,
    fontFace: 'Arial', fontSize: 9.5, bold: true, color: '#FFFFFF', align: 'center', valign: 'middle', fit: 'shrink',
  });

  // O'ng tomon: 3 ta qulay tahlil kartochkasi (aniq o'lcham va xatlar sig'ishi kafolatlangan)
  const count = Math.min(points.length, 3) || 1;
  const gap = 0.18;
  const cardH = (contentH - (count - 1) * gap) / count;

  points.slice(0, 3).forEach((p, idx) => {
    const y = contentY + idx * (cardH + gap);

    slide.addShape(pres.ShapeType.roundRect, {
      x: rightX, y, w: rightW, h: cardH,
      fill: { color: theme.cardBg },
      line: { color: theme.border, width: 1.2 },
      rectRadius: 0.12,
    });

    slide.addShape(pres.ShapeType.roundRect, {
      x: rightX + 0.20, y: y + (cardH - 0.42) / 2, w: 0.42, h: 0.42,
      fill: { color: theme.primary },
      rectRadius: 0.1,
    });
    slide.addText(`0${idx + 1}`, {
      x: rightX + 0.20, y: y + (cardH - 0.42) / 2, w: 0.42, h: 0.42,
      fontFace: 'Arial', fontSize: 11, bold: true, color: '#FFFFFF', align: 'center', valign: 'middle',
    });

    const headingText = truncateClean(p.heading || i18n.pointFallback(idx + 1), 38);
    const descText = truncateClean(p.description || '', 120);

    slide.addText([
      { text: `${headingText}\n`, options: { bold: true, fontSize: 11.5, color: theme.primary } },
      { text: descText, options: { bold: false, fontSize: 9.5, color: theme.text } }
    ], {
      x: rightX + 0.72, y: y + 0.06, w: rightW - 0.90, h: cardH - 0.12,
      valign: 'middle', wrap: true, fit: 'shrink',
    });
  });

  if (hasHighlight) addHighlightBox(slide, pres, theme, item.highlight, 5.52, false, i18n);
  addSlideFooter(slide, pres, theme, data.title, num, total, item.source, i18n);
}

// ================================================================
// 2-LAYOUT: 2-COLUMN COMPARISON (Ikki ustunli taqqoslash)
// ================================================================
function renderComparisonLayout(slide, pres, theme, item, num, total, img, data, i18n) {
  applySlideBackground(slide, pres, theme);
  addSlideHeader(slide, pres, theme, item.title, item.subtitle, num, total, i18n, data?.title);

  const points = item.points || [];
  const hasHighlight = !!item.highlight;
  const contentY = 1.68;
  const contentH = hasHighlight ? 3.65 : 4.60;

  const colW = 5.65;
  const gap = 0.43;

  // 1-Ustun: Chap tomon
  const leftX = 0.8;
  slide.addShape(pres.ShapeType.roundRect, {
    x: leftX, y: contentY, w: colW, h: contentH,
    fill: { color: theme.cardBg },
    line: { color: theme.primary, width: 1.5 },
    rectRadius: 0.14,
  });

  slide.addShape(pres.ShapeType.roundRect, {
    x: leftX + 0.2, y: contentY + 0.2, w: colW - 0.4, h: 0.55,
    fill: { color: theme.primary },
    rectRadius: 0.1,
  });
  slide.addText(`🌟 ${truncateClean(item.leftHeading || i18n.leftDefault, 36)}`, {
    x: leftX + 0.2, y: contentY + 0.2, w: colW - 0.4, h: 0.55,
    fontFace: 'Arial', fontSize: 12, bold: true, color: '#FFFFFF', align: 'center', valign: 'middle', fit: 'shrink',
  });

  const p1 = points[0] || {};
  const h1 = truncateClean(p1.heading || i18n.leftDefault, 40);
  const d1 = truncateClean(p1.description || '', 180);
  slide.addText([
    { text: `${h1}\n\n`, options: { bold: true, fontSize: 13, color: theme.primary } },
    { text: d1, options: { bold: false, fontSize: 11, color: theme.text } }
  ], {
    x: leftX + 0.35, y: contentY + 0.95, w: colW - 0.7, h: contentH - 1.15,
    valign: 'top', wrap: true, fit: 'shrink',
  });

  // 2-Ustun: O'ng tomon
  const rightX = leftX + colW + gap;
  slide.addShape(pres.ShapeType.roundRect, {
    x: rightX, y: contentY, w: colW, h: contentH,
    fill: { color: theme.cardBg },
    line: { color: theme.border, width: 1.5 },
    rectRadius: 0.14,
  });

  // Markaziy hayratlanarli "VS" (Taqqoslash) nishoni
  const vsX = leftX + colW + (gap - 0.9) / 2;
  const vsY = contentY + contentH / 2 - 0.45;
  slide.addShape(pres.ShapeType.ellipse, {
    x: vsX, y: vsY, w: 0.9, h: 0.9,
    fill: { color: theme.primary },
    line: { color: '#FFFFFF', width: 2.5 },
  });
  slide.addText('VS', {
    x: vsX, y: vsY, w: 0.9, h: 0.9,
    fontFace: 'Arial', fontSize: 13, bold: true, color: '#FFFFFF', align: 'center', valign: 'middle',
  });

  slide.addShape(pres.ShapeType.roundRect, {
    x: rightX + 0.2, y: contentY + 0.2, w: colW - 0.4, h: 0.55,
    fill: { color: theme.border },
    rectRadius: 0.1,
  });
  slide.addText(`🚀 ${truncateClean(item.rightHeading || i18n.rightDefault, 36)}`, {
    x: rightX + 0.2, y: contentY + 0.2, w: colW - 0.4, h: 0.55,
    fontFace: 'Arial', fontSize: 12, bold: true, color: theme.primary, align: 'center', valign: 'middle', fit: 'shrink',
  });

  const p2 = points[1] || points[0] || {};
  const h2 = truncateClean(p2.heading || i18n.rightDefault, 40);
  const d2 = truncateClean(p2.description || '', 180);
  slide.addText([
    { text: `${h2}\n\n`, options: { bold: true, fontSize: 13, color: theme.primary } },
    { text: d2, options: { bold: false, fontSize: 11, color: theme.text } }
  ], {
    x: rightX + 0.35, y: contentY + 0.95, w: colW - 0.7, h: contentH - 1.15,
    valign: 'top', wrap: true, fit: 'shrink',
  });

  if (hasHighlight) addHighlightBox(slide, pres, theme, item.highlight, 5.52, false, i18n);
  addSlideFooter(slide, pres, theme, data.title, num, total, item.source, i18n);
}

// ================================================================
// 3-LAYOUT: DYNAMIC KPI & STATS (Split-Screen: Real Metrics + Native PowerPoint Chart)
// ================================================================
function renderKpiMetricsLayout(slide, pres, theme, item, num, total, img, data, i18n) {
  applySlideBackground(slide, pres, theme);
  addSlideHeader(slide, pres, theme, item.title, item.subtitle, num, total, i18n, data?.title);

  const points = item.points || [];
  const metrics = (Array.isArray(item.metrics) && item.metrics.length > 0)
    ? item.metrics
    : [
        { val: '98.5%', label: i18n.kpiLabels[0], desc: points[0]?.heading || i18n.kpiDescs[0] },
        { val: '2.8x', label: i18n.kpiLabels[1], desc: points[1]?.heading || i18n.kpiDescs[1] },
        { val: '-40%', label: i18n.kpiLabels[2], desc: points[2]?.heading || i18n.kpiDescs[2] }
      ];

  const hasHighlight = !!item.highlight;
  const contentY = 1.68;
  const contentH = hasHighlight ? 3.75 : 4.60;

  // Split-Screen o'lchamlari: Chapda 3 ta KPI kartochkasi, O'ngda PowerPoint Diagrammasi
  const leftX = 0.8;
  const leftW = 5.20;
  const rightX = 6.25;
  const rightW = 6.28;

  // 1. CHAP TOMON: 3 ta vertikal statistik kartochka
  const gapY = 0.16;
  const cardH = (contentH - 2 * gapY) / 3;

  metrics.slice(0, 3).forEach((m, idx) => {
    const cardY = contentY + idx * (cardH + gapY);

    // Kartochka foni
    slide.addShape(pres.ShapeType.roundRect, {
      x: leftX, y: cardY, w: leftW, h: cardH,
      fill: { color: theme.cardBg },
      line: { color: idx === 0 ? theme.primary : theme.border, width: idx === 0 ? 1.5 : 1.2 },
      rectRadius: 0.12,
    });

    // Raqam maydoni (chap blok)
    const numW = 1.85;
    slide.addShape(pres.ShapeType.roundRect, {
      x: leftX + 0.12, y: cardY + 0.12, w: numW, h: cardH - 0.24,
      fill: { color: theme.border },
      rectRadius: 0.08,
    });

    slide.addText(m.val, {
      x: leftX + 0.14, y: cardY + 0.12, w: numW - 0.04, h: cardH - 0.24,
      fontFace: 'Arial', fontSize: cardH > 1.25 ? 22 : 18, bold: true,
      color: idx === 0 ? theme.primary : theme.accent,
      align: 'center', valign: 'middle', fit: 'shrink',
    });

    // Tavsif maydoni (o'ng blok)
    const textX = leftX + numW + 0.25;
    const textW = leftW - numW - 0.38;
    const labelText = truncateClean(m.label || i18n.kpiLabels[idx % 3], 32);
    const descText = truncateClean(m.desc || points[idx]?.description || points[0]?.description || '', cardH > 1.25 ? 90 : 65);

    slide.addText([
      { text: `${labelText}\n`, options: { bold: true, fontSize: cardH > 1.25 ? 11.5 : 10.5, color: theme.text } },
      { text: descText, options: { bold: false, fontSize: cardH > 1.25 ? 9.5 : 8.5, color: theme.subtext } }
    ], {
      x: textX, y: cardY + 0.10, w: textW, h: cardH - 0.20,
      valign: 'middle', wrap: true, fit: 'shrink',
    });
  });

  // 2. O'NG TOMON: PowerPoint Native Chart (Diagramma)
  slide.addShape(pres.ShapeType.roundRect, {
    x: rightX, y: contentY, w: rightW, h: contentH,
    fill: { color: theme.cardBg },
    line: { color: theme.primary, width: 1.4 },
    rectRadius: 0.14,
  });

  // Diagramma sarlavhasi / badge
  slide.addShape(pres.ShapeType.roundRect, {
    x: rightX + 0.3, y: contentY + 0.18, w: rightW - 0.6, h: 0.40,
    fill: { color: theme.border },
    rectRadius: 0.08,
  });

  const chartBadgeText = truncateClean(item.chart?.title || i18n.kpiChartTitle || '📊 STATISTIK TAHLIL VA STRUKTURAVIY DINAMIKA', 45);
  slide.addText(chartBadgeText, {
    x: rightX + 0.3, y: contentY + 0.18, w: rightW - 0.6, h: 0.40,
    fontFace: 'Arial', fontSize: 10.5, bold: true, color: theme.primary, align: 'center', valign: 'middle', fit: 'shrink',
  });

  // Diagramma ma'lumotlarini aniqlash
  let chartType = pres.ChartType.bar;
  let chartLabels = [];
  let chartValues = [];

  if (item.chart && Array.isArray(item.chart.labels) && Array.isArray(item.chart.values) && item.chart.labels.length >= 2) {
    chartLabels = item.chart.labels.slice(0, 5);
    chartValues = item.chart.values.slice(0, 5);
    if (item.chart.type === 'doughnut' || item.chart.type === 'pie') {
      chartType = pres.ChartType.doughnut;
    }
  } else if (item.metrics && item.metrics.length >= 2) {
    chartLabels = item.metrics.slice(0, 4).map(m => truncateClean(m.label, 16) || i18n.keyMetricFallback || 'Omil');
    chartValues = item.metrics.slice(0, 4).map(m => {
      const rawVal = String(m.val || '');
      const parsed = parseFloat(rawVal.replace(/[^\d.-]/g, ''));
      return isNaN(parsed) || parsed === 0 ? 50 : Math.abs(parsed);
    });
  } else {
    const smartChart = getSmartDomainCharts(data?.title || item.title || '', 6, data?.language || 'uz');
    chartLabels = smartChart.labels;
    chartValues = smartChart.values;
  }

  const chartData = [
    {
      name: item.title ? item.title.substring(0, 24) : (i18n.indicatorFallback || 'Ko\'rsatkich'),
      labels: chartLabels,
      values: chartValues,
    }
  ];

  const chartColors = [theme.primary, theme.accent, '38BDF8', '818CF8', '34D399'];

  const chartOpts = {
    x: rightX + 0.25,
    y: contentY + 0.68,
    w: rightW - 0.5,
    h: contentH - 0.82,
    showTitle: false,
    chartColors: chartColors,
    chartColorsOpacity: 90,
    barDir: 'col',
    barGapWidthPct: 45,
    showValue: true,
    dataLabelColor: theme.text,
    dataLabelPosition: 'outEnd',
    dataLabelFontSize: 10,
    valAxisLabelColor: theme.subtext,
    valAxisLineColor: theme.border,
    valAxisFontSize: 9,
    catAxisLabelColor: theme.text,
    catAxisLineColor: theme.border,
    catAxisFontSize: 9.5,
    catAxisLabelFrequency: 1,
    showLegend: false,
  };

  try {
    slide.addChart(chartType, chartData, chartOpts);
  } catch (chartErr) {
    console.warn('[PPTX KPI] Chart chizishda xatolik:', chartErr.message);
  }

  if (hasHighlight) addHighlightBox(slide, pres, theme, item.highlight, 5.52, false, i18n);
  addSlideFooter(slide, pres, theme, data.title, num, total, item.source, i18n);
}

// ================================================================
// 4-LAYOUT: PROCESS TIMELINE (Gorizontal ketma-ket jarayon)
// ================================================================
function renderProcessTimelineLayout(slide, pres, theme, item, num, total, img, data, i18n) {
  applySlideBackground(slide, pres, theme);
  addSlideHeader(slide, pres, theme, item.title, item.subtitle, num, total, i18n, data?.title);

  const points = item.points || [];
  const hasHighlight = !!item.highlight;
  const contentY = 1.80;
  const contentH = hasHighlight ? 3.50 : 4.40;

  const count = Math.min(points.length, 3) || 3;
  const gap = 0.45;
  const cardW = (11.73 - gap * (count - 1)) / count;

  // Gorizontal jarayon chizig'i
  slide.addShape(pres.ShapeType.line, {
    x: 1.5, y: contentY + 0.35, w: 10.33, h: 0,
    line: { color: theme.primary, width: 2.5 },
  });

  points.slice(0, 3).forEach((p, idx) => {
    const x = 0.8 + idx * (cardW + gap);

    // Bosqich nishoni
    slide.addShape(pres.ShapeType.roundRect, {
      x: x + cardW / 2 - 0.7, y: contentY + 0.1, w: 1.4, h: 0.5,
      fill: { color: theme.primary },
      line: { color: '#FFFFFF', width: 1.5 },
      rectRadius: 0.2,
    });
    slide.addText(i18n.stepBadge(idx + 1), {
      x: x + cardW / 2 - 0.7, y: contentY + 0.1, w: 1.4, h: 0.5,
      fontFace: 'Arial', fontSize: 9.5, bold: true, color: '#FFFFFF', align: 'center', valign: 'middle', fit: 'shrink',
    });

    // Bosqich kartochkasi
    slide.addShape(pres.ShapeType.roundRect, {
      x, y: contentY + 0.8, w: cardW, h: contentH - 0.8,
      fill: { color: theme.cardBg },
      line: { color: theme.border, width: 1.2 },
      rectRadius: 0.14,
    });

    const stepHeading = truncateClean(p.heading || i18n.stepFallback(idx + 1), 32);
    const stepDesc = truncateClean(p.description || '', 130);

    slide.addText(stepHeading, {
      x: x + 0.15, y: contentY + 0.95, w: cardW - 0.3, h: 0.60,
      fontFace: 'Arial', fontSize: 12, bold: true, color: theme.primary, align: 'center', valign: 'middle', wrap: true, fit: 'shrink',
    });

    slide.addText(stepDesc, {
      x: x + 0.2, y: contentY + 1.60, w: cardW - 0.4, h: contentH - 1.80,
      fontFace: 'Arial', fontSize: 10, color: theme.text, align: 'left', valign: 'top', wrap: true, fit: 'shrink',
    });

    // Bosqichlar orasidagi ko'rsatkich (Chevron flow arrow)
    if (idx < count - 1) {
      slide.addText('➔', {
        x: x + cardW, y: contentY + 0.1, w: gap, h: 0.5,
        fontFace: 'Arial', fontSize: 18, bold: true, color: theme.primary, align: 'center', valign: 'middle',
      });
    }
  });

  if (hasHighlight) addHighlightBox(slide, pres, theme, item.highlight, 5.52, false, i18n);
  addSlideFooter(slide, pres, theme, data.title, num, total, item.source, i18n);
}

// ================================================================
// 5-LAYOUT: 4-BOX MATRIX (2x2 To'rtburchak matritsa)
// ================================================================
function renderMatrixGridLayout(slide, pres, theme, item, num, total, img, data, i18n) {
  applySlideBackground(slide, pres, theme);
  addSlideHeader(slide, pres, theme, item.title, item.subtitle, num, total, i18n, data?.title);

  const points = item.points || [];
  const hasHighlight = !!item.highlight;
  const contentY = 1.68;
  const contentH = hasHighlight ? 3.65 : 4.60;

  const cardW = 5.65;
  const gapX = 0.43;
  const gapY = 0.22;
  const cardH = (contentH - gapY) / 2;

  const icons = ['💡', '⚡', '🎯', '📊'];

  for (let i = 0; i < 4; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.8 + col * (cardW + gapX);
    const y = contentY + row * (cardH + gapY);
    const p = points[i] || points[i % points.length] || {};

    slide.addShape(pres.ShapeType.roundRect, {
      x, y, w: cardW, h: cardH,
      fill: { color: theme.cardBg },
      line: { color: i === 0 ? theme.primary : theme.border, width: 1.2 },
      rectRadius: 0.12,
    });

    // Kichik belgi
    slide.addText(icons[i], {
      x: x + 0.2, y: y + 0.15, w: 0.45, h: 0.45,
      fontFace: 'Arial', fontSize: 16, valign: 'middle',
    });

    const mHeading = truncateClean(p.heading || i18n.partFallback(i + 1), 32);
    const mDesc = truncateClean(p.description || i18n.partDesc, 110);

    slide.addText([
      { text: `${mHeading}\n`, options: { bold: true, fontSize: 12, color: theme.primary } },
      { text: mDesc, options: { bold: false, fontSize: 9.5, color: theme.text } }
    ], {
      x: x + 0.75, y: y + 0.08, w: cardW - 0.95, h: cardH - 0.16,
      valign: 'middle', wrap: true, fit: 'shrink',
    });
  }

  if (hasHighlight) addHighlightBox(slide, pres, theme, item.highlight, 5.52, false, i18n);
  addSlideFooter(slide, pres, theme, data.title, num, total, item.source, i18n);
}

// ================================================================
// 6-LAYOUT: SPOTLIGHT CALLOUT (Bosh g'oya banneri + 2 ta karta)
// ================================================================
function renderSpotlightCalloutLayout(slide, pres, theme, item, num, total, img, data, i18n) {
  applySlideBackground(slide, pres, theme);
  addSlideHeader(slide, pres, theme, item.title, item.subtitle, num, total, i18n, data?.title);

  const points = item.points || [];
  const hasHighlight = !!item.highlight;
  const contentY = 1.68;
  const contentH = hasHighlight ? 3.65 : 4.60;

  // Yuqori katta Spotlight banneri
  const bannerH = 1.35;
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.8, y: contentY, w: 11.73, h: bannerH,
    fill: { color: theme.cardBg },
    line: { color: theme.primary, width: 2 },
    rectRadius: 0.14,
  });

  // Bezakli katta iqtibos nishoni (Watermark)
  slide.addText('“', {
    x: 1.0, y: contentY - 0.22, w: 1.2, h: 1.2,
    fontFace: 'Georgia', fontSize: 68, bold: true, color: theme.primary,
  });

  const rawSpotlight = item.spotlightText || item.highlight || item.title || '';
  const spotlight = truncateClean(rawSpotlight, 130);
  slide.addText([
    { text: i18n.spotlightPrefix, options: { bold: true, fontSize: 13, color: theme.primary } },
    { text: `"${spotlight}"`, options: { bold: false, italic: true, fontSize: 12, color: theme.text } }
  ], {
    x: 1.1, y: contentY + 0.1, w: 11.13, h: bannerH - 0.2,
    valign: 'middle', wrap: true, fit: 'shrink',
  });

  // Pastki 2 ta qulay tahlil kartochkasi
  const bottomY = contentY + bannerH + 0.25;
  const bottomH = contentH - bannerH - 0.25;
  const colW = 5.65;
  const gap = 0.43;

  points.slice(0, 2).forEach((p, idx) => {
    const x = 0.8 + idx * (colW + gap);

    slide.addShape(pres.ShapeType.roundRect, {
      x, y: bottomY, w: colW, h: bottomH,
      fill: { color: theme.cardBg },
      line: { color: theme.border, width: 1.2 },
      rectRadius: 0.12,
    });

    const spHeading = truncateClean(p.heading || i18n.pointFallback(idx + 1), 38);
    const spDesc = truncateClean(p.description || '', 140);

    slide.addText([
      { text: `${spHeading}\n\n`, options: { bold: true, fontSize: 13, color: theme.primary } },
      { text: spDesc, options: { bold: false, fontSize: 10.5, color: theme.text } }
    ], {
      x: x + 0.3, y: bottomY + 0.15, w: colW - 0.6, h: bottomH - 0.3,
      valign: 'top', wrap: true, fit: 'shrink',
    });
  });

  if (hasHighlight) addHighlightBox(slide, pres, theme, item.highlight, 5.52, false, i18n);
  addSlideFooter(slide, pres, theme, data.title, num, total, item.source, i18n);
}

// ================================================================
// 7-LAYOUT: CINEMATIC FULL HERO (To'liq fon rasmi + shaffof kartalar)
// ================================================================
function renderCinematicLayout(slide, pres, theme, item, num, total, img, data, i18n) {
  const isLight = theme.id === 'minimal' || theme.id === 'monochrome';
  if (img) {
    slide.addImage({ data: img, x: 0, y: 0, w: 13.333, h: 7.5 });
    const overlayTransparency = isLight ? 84 : 58;
    slide.addShape(pres.ShapeType.rect, {
      x: 0, y: 0, w: 13.333, h: 7.5,
      fill: { color: theme.bg, transparency: overlayTransparency },
      line: { color: theme.bg, transparency: overlayTransparency },
    });
    // Pastki matnlar uchun yumshoq qo'shimcha soya qatlami
    slide.addShape(pres.ShapeType.rect, {
      x: 0, y: 3.8, w: 13.333, h: 3.7,
      fill: { color: isLight ? 'FFFFFF' : '000000', transparency: isLight ? 90 : 74 },
      line: { color: isLight ? 'FFFFFF' : '000000', transparency: 100 },
    });
  } else {
    applySlideBackground(slide, pres, theme);
  }

  addSlideHeader(slide, pres, theme, item.title, item.subtitle, num, total, i18n, data?.title);

  const points = item.points || [];
  const hasHighlight = !!item.highlight;
  const contentY = 1.68;
  const contentH = hasHighlight ? 3.65 : 4.60;

  const count = Math.min(points.length, 3) || 3;
  const gap = 0.35;
  const cardW = (11.73 - gap * (count - 1)) / count;

  points.slice(0, 3).forEach((p, idx) => {
    const x = 0.8 + idx * (cardW + gap);

    slide.addShape(pres.ShapeType.roundRect, {
      x, y: contentY, w: cardW, h: contentH,
      fill: { color: theme.cardBg, transparency: 12 },
      line: { color: theme.border, width: 1.2 },
      rectRadius: 0.14,
    });

    slide.addShape(pres.ShapeType.roundRect, {
      x: x + 0.22, y: contentY + 0.25, w: 0.45, h: 0.45,
      fill: { color: theme.primary },
      rectRadius: 0.1,
    });
    slide.addText(`0${idx + 1}`, {
      x: x + 0.22, y: contentY + 0.25, w: 0.45, h: 0.45,
      fontFace: 'Arial', fontSize: 12, bold: true, color: '#FFFFFF', align: 'center', valign: 'middle',
    });

    const cHeading = truncateClean(p.heading || i18n.pointFallback(idx + 1), 36);
    const cDesc = truncateClean(p.description || '', 130);

    slide.addText(cHeading, {
      x: x + 0.2, y: contentY + 0.85, w: cardW - 0.4, h: 0.60,
      fontFace: 'Arial', fontSize: 13, bold: true, color: theme.primary, valign: 'middle', wrap: true, fit: 'shrink',
    });

    slide.addText(cDesc, {
      x: x + 0.2, y: contentY + 1.55, w: cardW - 0.4, h: contentH - 1.70,
      fontFace: 'Arial', fontSize: 10.5, color: theme.text, valign: 'top', wrap: true, fit: 'shrink',
    });
  });

  if (hasHighlight) addHighlightBox(slide, pres, theme, item.highlight, 5.52, true, i18n);
  addSlideFooter(slide, pres, theme, data.title, num, total, item.source, i18n);
}

// ================================================================
// 8-LAYOUT: 3-COLUMN FEATURE CARDS (3 ta vertikal ustunli kartochkalar)
// ================================================================
function renderThreeCardsLayout(slide, pres, theme, item, num, total, img, data, i18n) {
  applySlideBackground(slide, pres, theme);
  addSlideHeader(slide, pres, theme, item.title, item.subtitle, num, total, i18n, data?.title);

  const points = item.points || [];
  const hasHighlight = !!item.highlight;
  const contentY = 1.68;
  const contentH = hasHighlight ? 3.65 : 4.60;

  const count = 3;
  const gap = 0.38;
  const cardW = (11.73 - gap * (count - 1)) / count;
  const icons = ['🎯', '💎', '🚀'];

  for (let idx = 0; idx < count; idx++) {
    const x = 0.8 + idx * (cardW + gap);
    const p = points[idx] || points[idx % points.length] || {};

    // Asosiy ustun kartochkasi
    slide.addShape(pres.ShapeType.roundRect, {
      x, y: contentY, w: cardW, h: contentH,
      fill: { color: theme.cardBg },
      line: { color: idx === 0 ? theme.primary : theme.border, width: idx === 0 ? 1.5 : 1.2 },
      rectRadius: 0.14,
    });

    // Yuqori aksent chiziq
    slide.addShape(pres.ShapeType.roundRect, {
      x: x + 0.2, y: contentY + 0.12, w: cardW - 0.4, h: 0.06,
      fill: { color: idx === 0 ? theme.primary : theme.accent || theme.primary },
      line: { color: idx === 0 ? theme.primary : theme.accent || theme.primary },
      rectRadius: 0.03,
    });

    // Icon / Bosqich nishoni
    slide.addShape(pres.ShapeType.ellipse, {
      x: x + 0.25, y: contentY + 0.32, w: 0.55, h: 0.55,
      fill: { color: theme.primary },
      line: { color: '#FFFFFF', width: 1.5 },
    });
    slide.addText(icons[idx % icons.length], {
      x: x + 0.25, y: contentY + 0.32, w: 0.55, h: 0.55,
      fontFace: 'Arial', fontSize: 13, align: 'center', valign: 'middle',
    });

    // Raqam nishoni (o'ng yuqorida)
    slide.addText(`0${idx + 1}`, {
      x: x + cardW - 1.0, y: contentY + 0.35, w: 0.75, h: 0.4,
      fontFace: 'Arial', fontSize: 14, bold: true, color: theme.subtext, align: 'right', valign: 'middle',
    });

    const cardHeading = truncateClean(p.heading || i18n.partFallback(idx + 1), 38);
    const cardDesc = truncateClean(p.description || i18n.partDesc, 150);

    // Sarlavha
    slide.addText(cardHeading, {
      x: x + 0.25, y: contentY + 1.05, w: cardW - 0.5, h: 0.60,
      fontFace: 'Arial', fontSize: 12.5, bold: true, color: theme.primary, valign: 'middle', wrap: true, fit: 'shrink',
    });

    // Ajratuvchi nozik chiziq
    slide.addShape(pres.ShapeType.line, {
      x: x + 0.25, y: contentY + 1.70, w: cardW - 0.5, h: 0,
      line: { color: theme.border, width: 0.8 },
    });

    // Mazmun / Tavsif
    slide.addText(cardDesc, {
      x: x + 0.25, y: contentY + 1.80, w: cardW - 0.5, h: contentH - 1.95,
      fontFace: 'Arial', fontSize: 10.5, color: theme.text, valign: 'top', wrap: true, fit: 'shrink',
    });
  }

  if (hasHighlight) addHighlightBox(slide, pres, theme, item.highlight, 5.52, false, i18n);
  addSlideFooter(slide, pres, theme, data.title, num, total, item.source, i18n);
}

// ================================================================
// 9-LAYOUT: DATA VISUALIZATION & POWERPOINT CHART (Diagramma va Grafiklar)
// ================================================================
function renderChartLayout(slide, pres, theme, item, num, total, img, data, i18n) {
  applySlideBackground(slide, pres, theme);
  addSlideHeader(slide, pres, theme, item.title, item.subtitle, num, total, i18n, data?.title);

  const points = item.points || [];
  const hasHighlight = !!item.highlight;
  const contentY = 1.68;
  const contentH = 4.60;

  const leftW = 5.60;
  const rightX = 6.65;
  const rightW = 5.88;

  // Chap tomon: Tahliliy matn va asosiy omillar
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.8, y: contentY, w: leftW, h: hasHighlight ? contentH - 0.95 : contentH,
    fill: { color: theme.cardBg },
    line: { color: theme.border, width: 1.2 },
    rectRadius: 0.14,
  });

  // Chap badge
  slide.addShape(pres.ShapeType.roundRect, {
    x: 1.0, y: contentY + 0.2, w: leftW - 0.4, h: 0.42,
    fill: { color: theme.border },
    rectRadius: 0.08,
  });
  slide.addText(i18n.chartBadge, {
    x: 1.0, y: contentY + 0.2, w: leftW - 0.4, h: 0.42,
    fontFace: 'Arial', fontSize: 10.5, bold: true, color: theme.primary, align: 'center', valign: 'middle', fit: 'shrink',
  });

  // Tahliliy bandlar
  const p1 = points[0] || {};
  const p2 = points[1] || {};

  const h1 = truncateClean(p1.heading || 'Tizimli O\'sish Dinamikasi', 36);
  const d1 = truncateClean(p1.description || '', 120);

  const textBlocks = [
    { text: `${h1}\n`, options: { bold: true, fontSize: 12.5, color: theme.primary } },
    { text: `${d1}\n\n`, options: { bold: false, fontSize: 10.5, color: theme.text } },
  ];
  if (p2.heading || p2.description) {
    const h2 = truncateClean(p2.heading || 'Prognoz Ko\'rsatkichlari', 36);
    const d2 = truncateClean(p2.description || '', 120);
    textBlocks.push(
      { text: `${h2}\n`, options: { bold: true, fontSize: 12.5, color: theme.primary } },
      { text: `${d2}`, options: { bold: false, fontSize: 10.5, color: theme.text } }
    );
  }

  slide.addText(textBlocks, {
    x: 1.05, y: contentY + 0.75, w: leftW - 0.5, h: (hasHighlight ? contentH - 0.95 : contentH) - 0.9,
    valign: 'top', wrap: true, fit: 'shrink',
  });

  if (hasHighlight) {
    addHighlightBox(slide, pres, theme, item.highlight, 5.52, false, i18n);
  }

  // O'ng tomon: PowerPoint Native Chart kartochkasi
  slide.addShape(pres.ShapeType.roundRect, {
    x: rightX, y: contentY, w: rightW, h: contentH,
    fill: { color: theme.cardBg },
    line: { color: theme.primary, width: 1.4 },
    rectRadius: 0.14,
  });

  // Diagramma sarlavhasi
  slide.addShape(pres.ShapeType.roundRect, {
    x: rightX + 0.3, y: contentY + 0.2, w: rightW - 0.6, h: 0.42,
    fill: { color: theme.border },
    rectRadius: 0.08,
  });
  slide.addText(i18n.chartTitle, {
    x: rightX + 0.3, y: contentY + 0.2, w: rightW - 0.6, h: 0.42,
    fontFace: 'Arial', fontSize: 10.5, bold: true, color: theme.text, align: 'center', valign: 'middle', fit: 'shrink',
  });

  // Diagramma ma'lumotlarini aniqlash
  let chartType = pres.ChartType.bar;
  let chartLabels = [];
  let chartValues = [];

  if (item.chart && Array.isArray(item.chart.labels) && Array.isArray(item.chart.values)) {
    chartLabels = item.chart.labels.slice(0, 5);
    chartValues = item.chart.values.slice(0, 5);
    if (item.chart.type === 'doughnut' || item.chart.type === 'pie') {
      chartType = pres.ChartType.doughnut;
    }
  } else if (item.metrics && item.metrics.length >= 2) {
    chartLabels = item.metrics.map(m => m.label?.substring(0, 16) || i18n.keyMetricFallback || 'Omil');
    chartValues = item.metrics.map(m => {
      const parsed = parseInt(String(m.val).replace(/[^\d]/g, ''), 10);
      return isNaN(parsed) || parsed === 0 ? 50 : parsed;
    });
  } else {
    // Aqlli standart tahliliy ko'rsatkichlar
    chartLabels = i18n.chartLabels || ['Boshlang\'ich', 'O\'rta bosqich', 'Amaliy natija', 'Maqsadli prognoz'];
    chartValues = [35, 62, 84, 96];
  }

  const chartData = [
    {
      name: item.title ? item.title.substring(0, 24) : (i18n.indicatorFallback || 'Ko\'rsatkich'),
      labels: chartLabels,
      values: chartValues,
    }
  ];

  const chartColors = [theme.primary, theme.accent, '38BDF8', '818CF8', '34D399'];

  const chartOpts = {
    x: rightX + 0.25,
    y: contentY + 0.72,
    w: rightW - 0.5,
    h: contentH - 0.85,
    showTitle: false,
    chartColors: chartColors,
    chartColorsOpacity: 90,
    barDir: 'col',
    barGapWidthPct: 45,
    showValue: true,
    dataLabelColor: theme.text,
    dataLabelPosition: 'outEnd',
    dataLabelFontSize: 10,
    valAxisLabelColor: theme.subtext,
    valAxisLineColor: theme.border,
    valAxisFontSize: 9,
    catAxisLabelColor: theme.text,
    catAxisLineColor: theme.border,
    catAxisFontSize: 9.5,
    catAxisLabelFrequency: 1,
    showLegend: false,
  };

  try {
    slide.addChart(chartType, chartData, chartOpts);
  } catch (chartErr) {
    console.warn('[PPTX] Chart chizishda xatolik:', chartErr.message);
  }

  addSlideFooter(slide, pres, theme, data.title, num, total, item.source, i18n);
}

// ================================================================
// 10-LAYOUT: CONCLUSION & ACTION PLAN (Yakuniy xulosa va harakatlar)
// ================================================================
function renderConclusionLayout(slide, pres, theme, item, num, total, img, data, i18n) {
  const isLight = theme.id === 'minimal' || theme.id === 'monochrome';
  if (img) {
    slide.addImage({ data: img, x: 0, y: 0, w: 13.333, h: 7.5 });
    const overlayTransparency = isLight ? 84 : 60;
    slide.addShape(pres.ShapeType.rect, {
      x: 0, y: 0, w: 13.333, h: 7.5,
      fill: { color: theme.bg, transparency: overlayTransparency },
      line: { color: theme.bg, transparency: overlayTransparency },
    });
    // Pastki qism uchun yumshoq kontrast soyasi
    slide.addShape(pres.ShapeType.rect, {
      x: 0, y: 3.8, w: 13.333, h: 3.7,
      fill: { color: isLight ? 'FFFFFF' : '000000', transparency: isLight ? 90 : 74 },
      line: { color: isLight ? 'FFFFFF' : '000000', transparency: 100 },
    });
  } else {
    applySlideBackground(slide, pres, theme);
  }

  addSlideHeader(slide, pres, theme, item.title || i18n.conclusionHeading, item.subtitle || '', num, total, i18n, data?.title);

  const points = item.points || [];
  const contentY = 1.68;
  const contentH = 4.60;

  const leftW = 6.8;
  const rightX = 7.85;
  const rightW = 4.68;

  // Chap tomon: Tavsiyalar
  const count = Math.min(points.length, 3) || 1;
  const gap = 0.22;
  const cardH = (contentH - (count - 1) * gap) / count;

  points.slice(0, 3).forEach((p, idx) => {
    const y = contentY + idx * (cardH + gap);

    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8, y, w: leftW, h: cardH,
      fill: { color: theme.cardBg, transparency: img ? 12 : 0 },
      line: { color: theme.primary, width: 1.2 },
      rectRadius: 0.12,
    });

    slide.addText('✅', {
      x: 1.05, y: y + 0.15, w: 0.40, h: 0.40,
      fontFace: 'Arial', fontSize: 16, valign: 'middle',
    });

    const recHeading = truncateClean(p.heading || i18n.recommendation(idx + 1), 36);
    const recDesc = truncateClean(p.description || '', 120);

    slide.addText([
      { text: `${recHeading}\n`, options: { bold: true, fontSize: 12, color: theme.primary } },
      { text: recDesc, options: { bold: false, fontSize: 10, color: theme.text } }
    ], {
      x: 1.55, y: y + 0.06, w: leftW - 1.75, h: cardH - 0.12,
      valign: 'middle', wrap: true, fit: 'shrink',
    });
  });

  // O'ng tomon: Bosh xulosa bloki
  slide.addShape(pres.ShapeType.roundRect, {
    x: rightX, y: contentY, w: rightW, h: contentH,
    fill: { color: theme.cardBg, transparency: img ? 10 : 0 },
    line: { color: theme.primary, width: 2 },
    rectRadius: 0.15,
  });

  slide.addText(i18n.conclusionHeading, {
    x: rightX + 0.35, y: contentY + 0.30, w: rightW - 0.7, h: 0.40,
    fontFace: 'Arial', fontSize: 14, bold: true, color: theme.primary, fit: 'shrink',
  });

  const rawConclusion = item.highlight || `${data.title}: ${i18n.conclusionSuccess}`;
  const mainConclusion = truncateClean(rawConclusion, 150);
  slide.addText(mainConclusion, {
    x: rightX + 0.35, y: contentY + 0.85, w: rightW - 0.7, h: 2.30,
    fontFace: 'Arial', fontSize: 12.5, italic: true, color: theme.text, valign: 'top', wrap: true, fit: 'shrink',
  });

  // Call to action
  slide.addShape(pres.ShapeType.roundRect, {
    x: rightX + 0.35, y: contentY + 3.35, w: rightW - 0.7, h: 0.90,
    fill: { color: theme.bg },
    line: { color: theme.border, width: 1 },
    rectRadius: 0.1,
  });
  slide.addText(truncateClean(i18n.conclusionSuccess, 100), {
    x: rightX + 0.45, y: contentY + 3.35, w: rightW - 0.9, h: 0.90,
    fontFace: 'Arial', fontSize: 11, bold: true, color: theme.primary, align: 'center', valign: 'middle', wrap: true, fit: 'shrink',
  });

  addSlideFooter(slide, pres, theme, data.title, num, total, item.source, i18n);
}

// ================================================================
// 11-LAYOUT: NUMBERED AGENDA & OUTLINE (2 ustunli raqamlangan mundarija)
// ================================================================
function renderAgendaNumberedLayout(slide, pres, theme, item, num, total, img, data, i18n) {
  applySlideBackground(slide, pres, theme);
  addSlideHeader(slide, pres, theme, item.title || i18n.agendaBadge, item.subtitle, num, total, i18n, data?.title);

  const points = item.points || [];
  const hasHighlight = !!item.highlight;
  const contentY = 1.68;
  const contentH = hasHighlight ? 3.65 : 4.60;

  const leftX = 0.8;
  const colW = 5.65;
  const gapX = 0.43;
  const rightX = leftX + colW + gapX;

  // Taqdimot mundarijasidagi kartochkalar soni (4 tadan 8 tagacha)
  const count = Math.max(Math.min(points.length, 8), 4);
  const rows = Math.ceil(count / 2);
  const gapY = 0.16;
  const cardH = (contentH - (rows - 1) * gapY) / rows;

  const isMonochrome = theme.id === 'monochrome';
  const isNeon = theme.id === 'neon_abstract';

  for (let idx = 0; idx < count; idx++) {
    const isLeft = idx < rows;
    const colIdx = isLeft ? 0 : 1;
    const rowIdx = isLeft ? idx : (idx - rows);
    const x = colIdx === 0 ? leftX : rightX;
    const y = contentY + rowIdx * (cardH + gapY);
    const p = points[idx] || points[idx % points.length] || {};

    // Kartochka foni
    slide.addShape(pres.ShapeType.roundRect, {
      x, y, w: colW, h: cardH,
      fill: { color: theme.cardBg },
      line: { color: isNeon ? (idx === 0 ? 'F88196' : theme.border) : (idx === 0 ? theme.primary : theme.border), width: 1.2 },
      rectRadius: isMonochrome ? 0.06 : 0.12,
    });

    // Raqam nishoni
    const numBoxW = 0.52;
    const numBoxH = Math.min(cardH - 0.2, 0.46);
    slide.addShape(pres.ShapeType.roundRect, {
      x: x + 0.18, y: y + (cardH - numBoxH) / 2, w: numBoxW, h: numBoxH,
      fill: { color: isMonochrome ? '111111' : (isNeon ? 'F88196' : theme.primary) },
      rectRadius: 0.08,
    });
    slide.addText(`0${idx + 1}`, {
      x: x + 0.18, y: y + (cardH - numBoxH) / 2, w: numBoxW, h: numBoxH,
      fontFace: 'Arial', fontSize: 11, bold: true, color: '#FFFFFF', align: 'center', valign: 'middle',
    });

    const agHeading = truncateClean(p.heading || i18n.pointFallback(idx + 1), 34);
    const agDesc = truncateClean(p.description || '', 90);

    // Sarlavha va qisqa tushuntirish
    slide.addText([
      { text: `${agHeading}\n`, options: { bold: true, fontSize: 11.5, color: isMonochrome ? '#111111' : theme.primary } },
      { text: agDesc, options: { bold: false, fontSize: 9.5, color: theme.text } }
    ], {
      x: x + 0.82, y: y + 0.05, w: colW - 0.98, h: cardH - 0.1,
      valign: 'middle', wrap: true, fit: 'shrink',
    });
  }

  if (hasHighlight) addHighlightBox(slide, pres, theme, item.highlight, 5.52, false, i18n);
  addSlideFooter(slide, pres, theme, data.title, num, total, item.source, i18n);
}

// ================================================================
// 12-LAYOUT: CIRCULAR FEATURE (Shveytsariya doiraviy vizual + asosiy ustunlar)
// ================================================================
function renderCircularFeatureLayout(slide, pres, theme, item, num, total, img, data, i18n) {
  applySlideBackground(slide, pres, theme);
  addSlideHeader(slide, pres, theme, item.title, item.subtitle, num, total, i18n, data?.title);

  const points = item.points || [];
  const hasHighlight = !!item.highlight;
  const contentY = 1.68;
  const contentH = hasHighlight ? 3.65 : 4.60;

  const leftW = 4.8;
  const rightX = 5.95;
  const rightW = 6.58;

  const isMonochrome = theme.id === 'monochrome';
  const isNeon = theme.id === 'neon_abstract';

  // Chap tomon: Konsentrik doiraviy badiiy kompozitsiya
  const circleSize = Math.min(leftW, contentH);
  const circleX = 0.8 + (leftW - circleSize) / 2;
  const circleY = contentY + (contentH - circleSize) / 2;

  // Tashqi konsentrik hoshiya
  slide.addShape(pres.ShapeType.ellipse, {
    x: circleX - 0.12, y: circleY - 0.12, w: circleSize + 0.24, h: circleSize + 0.24,
    line: { color: isNeon ? 'F88196' : theme.border, width: 1.2, dashType: 'dash' },
  });

  // Asosiy ichki doiraviy kartochka
  slide.addShape(pres.ShapeType.ellipse, {
    x: circleX, y: circleY, w: circleSize, h: circleSize,
    fill: { color: theme.cardBg },
    line: { color: isMonochrome ? '111111' : (isNeon ? '96BFCB' : theme.primary), width: 2 },
  });

  if (img) {
    slide.addImage({
      data: img,
      x: circleX + 0.15, y: circleY + 0.15,
      w: circleSize - 0.3, h: circleSize - 0.3,
      rounding: true,
    });
  } else {
    slide.addText(i18n.focusBadge, {
      x: circleX, y: circleY, w: circleSize, h: circleSize,
      fontFace: 'Arial', fontSize: 16, bold: true, color: theme.primary, align: 'center', valign: 'middle', fit: 'shrink',
    });
  }

  // Doira ostidagi fokus nishoni
  slide.addShape(pres.ShapeType.roundRect, {
    x: circleX + circleSize / 2 - 1.2, y: circleY + circleSize - 0.42, w: 2.4, h: 0.38,
    fill: { color: isMonochrome ? '111111' : theme.bg, transparency: isMonochrome ? 0 : 15 },
    line: { color: isNeon ? 'F88196' : theme.primary, width: 1 },
    rectRadius: 0.1,
  });
  slide.addText(i18n.focusBadge, {
    x: circleX + circleSize / 2 - 1.2, y: circleY + circleSize - 0.42, w: 2.4, h: 0.38,
    fontFace: 'Arial', fontSize: 9.5, bold: true,
    color: isMonochrome ? '#FFFFFF' : theme.primary, align: 'center', valign: 'middle', fit: 'shrink',
  });

  // O'ng tomon: 3 ta qat'iy ustun kartochkasi
  const count = Math.min(points.length, 3) || 1;
  const gap = 0.20;
  const cardH = (contentH - (count - 1) * gap) / count;

  points.slice(0, 3).forEach((p, idx) => {
    const y = contentY + idx * (cardH + gap);

    slide.addShape(pres.ShapeType.roundRect, {
      x: rightX, y, w: rightW, h: cardH,
      fill: { color: theme.cardBg },
      line: { color: isMonochrome ? (idx === 0 ? '111111' : theme.border) : (isNeon && idx === 0 ? 'F88196' : theme.border), width: 1.2 },
      rectRadius: isMonochrome ? 0.06 : 0.12,
    });

    // Yirik minimalist raqam kvadrati
    slide.addShape(pres.ShapeType.roundRect, {
      x: rightX + 0.20, y: y + (cardH - 0.44) / 2, w: 0.44, h: 0.44,
      fill: { color: isMonochrome ? '111111' : (isNeon ? 'F88196' : theme.primary) },
      rectRadius: 0.08,
    });
    slide.addText(`0${idx + 1}`, {
      x: rightX + 0.20, y: y + (cardH - 0.44) / 2, w: 0.44, h: 0.44,
      fontFace: 'Arial', fontSize: 11, bold: true, color: '#FFFFFF', align: 'center', valign: 'middle',
    });

    const circHeading = truncateClean(p.heading || i18n.pointFallback(idx + 1), 38);
    const circDesc = truncateClean(p.description || '', 120);

    slide.addText([
      { text: `${circHeading}\n`, options: { bold: true, fontSize: 11.5, color: isMonochrome ? '#111111' : theme.primary } },
      { text: circDesc, options: { bold: false, fontSize: 9.5, color: theme.text } }
    ], {
      x: rightX + 0.76, y: y + 0.06, w: rightW - 0.95, h: cardH - 0.12,
      valign: 'middle', wrap: true, fit: 'shrink',
    });
  });

  if (hasHighlight) addHighlightBox(slide, pres, theme, item.highlight, 5.52, false, i18n);
  addSlideFooter(slide, pres, theme, data.title, num, total, item.source, i18n);
}

// ================================================================
// 13-LAYOUT: MILESTONES TABLE (Strukturaviy korporativ reja va ko'rsatkichlar jadvali)
// ================================================================
function renderMilestonesTableLayout(slide, pres, theme, item, num, total, img, data, i18n) {
  applySlideBackground(slide, pres, theme);
  addSlideHeader(slide, pres, theme, item.title, item.subtitle, num, total, i18n, data?.title);

  const points = item.points || [];
  const hasHighlight = !!item.highlight;
  const contentY = 1.68;
  const tableH = hasHighlight ? 3.65 : 4.60;
  const isMonochrome = theme.id === 'monochrome';
  const isNeon = theme.id === 'neon_abstract';

  // Jadval sarlavhasi
  const headers = i18n.tableHeaders || ['Bosqich / Davr', 'Asosiy Vazifa & Strategiya', 'Mas\'ul Bo\'lim & Resurs', 'Kutilayotgan KPI'];

  const defaultPhases = i18n.milestonesPhases || [
    { period: '1-Bosqich (Q1)', resp: 'Boshqaruv & Audit', kpi: '100% Audit' },
    { period: '2-Bosqich (Q2)', resp: 'Texnik Departament', kpi: '+35% Tezlik' },
    { period: '3-Bosqich (Q3)', resp: 'Operatsion Bo\'lim', kpi: '95% Samaradorlik' },
    { period: '4-Bosqich (Q4)', resp: 'Sifat Nazorati', kpi: 'Barqaror O\'sish' },
  ];

  const headerBg = isMonochrome ? '111111' : (isNeon ? '1C2C3B' : theme.primary);
  const headerTextColor = '#FFFFFF';

  const tableRows = [
    [
      { text: headers[0], options: { fill: headerBg, color: headerTextColor, bold: true, align: 'center', fontSize: 11 } },
      { text: headers[1], options: { fill: headerBg, color: headerTextColor, bold: true, align: 'left', fontSize: 11 } },
      { text: headers[2], options: { fill: headerBg, color: headerTextColor, bold: true, align: 'center', fontSize: 11 } },
      { text: headers[3], options: { fill: headerBg, color: headerTextColor, bold: true, align: 'center', fontSize: 11 } },
    ]
  ];

  const rowCount = Math.min(Math.max(points.length, 3), 4);
  for (let r = 0; r < rowCount; r++) {
    const p = points[r] || points[r % points.length] || {};
    const dPhase = defaultPhases[r] || defaultPhases[0];
    const isEven = (r % 2 === 0);
    const rowBg = isEven ? theme.cardBg : theme.bg;

    const phaseTitle = truncateClean(p.phase || dPhase.period, 24);
    const taskDesc = truncateClean(`${p.heading || i18n.pointFallback(r + 1)}: ${p.description || ''}`, 105);
    const respDept = truncateClean(p.owner || dPhase.resp, 28);
    const targetKpi = truncateClean(p.kpi || dPhase.kpi, 24);

    tableRows.push([
      { text: phaseTitle, options: { fill: rowBg, color: isMonochrome ? '111111' : theme.primary, bold: true, align: 'center', fontSize: 10 } },
      { text: taskDesc, options: { fill: rowBg, color: theme.text, fontSize: 9.5 } },
      { text: respDept, options: { fill: rowBg, color: theme.subtext, align: 'center', fontSize: 9.5 } },
      { text: targetKpi, options: { fill: rowBg, color: isNeon ? 'F88196' : (isMonochrome ? '111111' : theme.primary), bold: true, align: 'center', fontSize: 10 } },
    ]);
  }

  try {
    slide.addTable(tableRows, {
      x: 0.8,
      y: contentY,
      w: 11.73,
      h: tableH,
      colW: [2.2, 5.33, 2.1, 2.1],
      border: { type: 'solid', pt: 1, color: isNeon ? '595C8A' : theme.border },
      valign: 'middle',
      margin: [0.08, 0.12, 0.08, 0.12],
    });
  } catch (tErr) {
    console.warn('[PPTX] Jadval chizishda xatolik:', tErr.message);
  }

  if (hasHighlight) addHighlightBox(slide, pres, theme, item.highlight, 5.52, false, i18n);
  addSlideFooter(slide, pres, theme, data.title, num, total, item.source, i18n);
}

// ================================================================
// 14-LAYOUT: SWOT ANALYSIS (Kuchli va Zaif tomonlar, Imkoniyatlar va Xavflar)
// ================================================================
function renderSwotAnalysisLayout(slide, pres, theme, item, num, total, img, data, i18n) {
  applySlideBackground(slide, pres, theme);
  addSlideHeader(slide, pres, theme, item.title, item.subtitle, num, total, i18n, data?.title);

  const points = item.points || [];
  const hasHighlight = !!item.highlight;
  const contentY = 1.68;
  const contentH = hasHighlight ? 3.65 : 4.60;

  const cardW = 5.65;
  const gapX = 0.43;
  const gapY = 0.22;
  const cardH = (contentH - gapY) / 2;

  const swotColors = ['10B981', 'F59E0B', '0EA5E9', 'EF4444'];
  const swotLetters = i18n.swotLetters || ['S', 'W', 'O', 'T'];
  const swotBadges = i18n.swotBadges || ['STRENGTHS', 'WEAKNESSES', 'OPPORTUNITIES', 'THREATS'];

  for (let i = 0; i < 4; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.8 + col * (cardW + gapX);
    const y = contentY + row * (cardH + gapY);
    const p = points[i] || points[i % points.length] || {};
    const colHex = swotColors[i];

    slide.addShape(pres.ShapeType.roundRect, {
      x, y, w: cardW, h: cardH,
      fill: { color: theme.cardBg },
      line: { color: colHex, width: 1.5 },
      rectRadius: 0.12,
    });

    slide.addShape(pres.ShapeType.roundRect, {
      x: x + 0.22, y: y + 0.20, w: 0.65, h: 0.65,
      fill: { color: colHex },
      line: { color: '#FFFFFF', width: 1 },
      rectRadius: 0.12,
    });
    slide.addText(swotLetters[i], {
      x: x + 0.22, y: y + 0.20, w: 0.65, h: 0.65,
      fontFace: 'Arial', fontSize: 16, bold: true, color: '#FFFFFF',
      align: 'center', valign: 'middle',
    });

    const badgeTitle = swotBadges[i];
    const itemHeading = truncateClean(p.heading ? `${p.heading}` : badgeTitle, 36);
    slide.addText([
      { text: `${badgeTitle}\n`, options: { bold: true, fontSize: 9.5, color: colHex } },
      { text: `${itemHeading}`, options: { bold: true, fontSize: 11.5, color: theme.text } }
    ], {
      x: x + 1.0, y: y + 0.14, w: cardW - 1.20, h: 0.70,
      valign: 'middle', wrap: true, fit: 'shrink',
    });

    const swotDesc = truncateClean(p.description || i18n.partDesc, 110);
    slide.addText(swotDesc, {
      x: x + 0.25, y: y + 0.90, w: cardW - 0.50, h: cardH - 1.05,
      fontFace: 'Arial', fontSize: 10, color: theme.subtext,
      align: 'left', valign: 'top', wrap: true, fit: 'shrink',
    });
  }

  if (hasHighlight) addHighlightBox(slide, pres, theme, item.highlight, 5.52, false, i18n);
  addSlideFooter(slide, pres, theme, data.title, num, total, item.source, i18n);
}

// ================================================================
// 15-LAYOUT: PROBLEM VS SOLUTION (Muammo va Innovatsion Yechim Kontrasti)
// ================================================================
function renderProblemSolutionLayout(slide, pres, theme, item, num, total, img, data, i18n) {
  applySlideBackground(slide, pres, theme);
  addSlideHeader(slide, pres, theme, item.title, item.subtitle, num, total, i18n, data?.title);

  const points = item.points || [];
  const hasHighlight = !!item.highlight;
  const contentY = 1.68;
  const contentH = hasHighlight ? 3.65 : 4.60;

  const colW = 5.45;
  const gap = 0.83;
  const leftX = 0.8;
  const rightX = leftX + colW + gap;

  const p1 = points[0] || {};
  const p2 = points[1] || points[0] || {};

  // 1. CHAP KARTA — DOLZARB MUAMMO
  slide.addShape(pres.ShapeType.roundRect, {
    x: leftX, y: contentY, w: colW, h: contentH,
    fill: { color: theme.cardBg },
    line: { color: 'EF4444', width: 1.8 },
    rectRadius: 0.14,
  });

  slide.addShape(pres.ShapeType.roundRect, {
    x: leftX + 0.35, y: contentY + 0.25, w: 3.4, h: 0.45,
    fill: { color: 'EF4444' },
    line: { color: 'EF4444' },
    rectRadius: 0.08,
  });
  slide.addText(i18n.problemHeading || '⚠️ DOLZARB MUAMMO VA XATARLAR', {
    x: leftX + 0.35, y: contentY + 0.25, w: 3.4, h: 0.45,
    fontFace: 'Arial', fontSize: 9.5, bold: true, color: '#FFFFFF',
    align: 'center', valign: 'middle', fit: 'shrink',
  });

  const p1Heading = truncateClean(p1.heading || i18n.problemSolutionDefaults?.probHeading || 'Tizimdagi Asosiy Kamchiliklar', 40);
  const p1Desc = truncateClean(p1.description || i18n.problemSolutionDefaults?.probDesc || 'Eski an\'anaviy metodologiyalar yuqori resurs yo\'qotishlariga va past samaradorlikka olib kelmoqda.', 170);

  slide.addText(p1Heading, {
    x: leftX + 0.35, y: contentY + 0.85, w: colW - 0.7, h: 0.70,
    fontFace: 'Arial', fontSize: 13.5, bold: true, color: 'EF4444',
    valign: 'middle', wrap: true, fit: 'shrink',
  });

  slide.addText(p1Desc, {
    x: leftX + 0.35, y: contentY + 1.65, w: colW - 0.7, h: contentH - 1.85,
    fontFace: 'Arial', fontSize: 10.5, color: theme.text,
    align: 'left', valign: 'top', wrap: true, fit: 'shrink',
  });

  // O'RTADAGI TRANSFORMATSIYA KO'RSATKICHI
  const centerX = leftX + colW;
  slide.addText('➔', {
    x: centerX, y: contentY + contentH / 2 - 0.4, w: gap, h: 0.8,
    fontFace: 'Arial', fontSize: 28, bold: true, color: theme.primary,
    align: 'center', valign: 'middle',
  });

  // 2. O'NG KARTA — INNOVATSION YECHIM
  slide.addShape(pres.ShapeType.roundRect, {
    x: rightX, y: contentY, w: colW, h: contentH,
    fill: { color: theme.cardBg },
    line: { color: '10B981', width: 1.8 },
    rectRadius: 0.14,
  });

  slide.addShape(pres.ShapeType.roundRect, {
    x: rightX + 0.35, y: contentY + 0.25, w: 3.4, h: 0.45,
    fill: { color: '10B981' },
    line: { color: '10B981' },
    rectRadius: 0.08,
  });
  slide.addText(i18n.solutionHeading || '💡 INNOVATSION YECHIM VA METODLAR', {
    x: rightX + 0.35, y: contentY + 0.25, w: 3.4, h: 0.45,
    fontFace: 'Arial', fontSize: 9.5, bold: true, color: '#FFFFFF',
    align: 'center', valign: 'middle', fit: 'shrink',
  });

  const p2Heading = truncateClean(p2.heading || i18n.problemSolutionDefaults?.solHeading || 'Ilg\'or Texnologik Mexanizm', 40);
  const p2Desc = truncateClean(p2.description || i18n.problemSolutionDefaults?.solDesc || 'Avtomatlashtirilgan tahlil va zamonaviy mexanizmlar orqali jarayonlar to\'liq optimallashtiriladi.', 170);

  slide.addText(p2Heading, {
    x: rightX + 0.35, y: contentY + 0.85, w: colW - 0.7, h: 0.70,
    fontFace: 'Arial', fontSize: 13.5, bold: true, color: '10B981',
    valign: 'middle', wrap: true, fit: 'shrink',
  });

  slide.addText(p2Desc, {
    x: rightX + 0.35, y: contentY + 1.65, w: colW - 0.7, h: contentH - 1.85,
    fontFace: 'Arial', fontSize: 10.5, color: theme.text,
    align: 'left', valign: 'top', wrap: true, fit: 'shrink',
  });

  if (hasHighlight) addHighlightBox(slide, pres, theme, item.highlight, 5.52, false, i18n);
  addSlideFooter(slide, pres, theme, data.title, num, total, item.source, i18n);
}

// ================================================================
// 16-LAYOUT: PYRAMID HIERARCHY (3-Qatlamli Ierarxiya va Bosqichli Asos)
// ================================================================
function renderPyramidHierarchyLayout(slide, pres, theme, item, num, total, img, data, i18n) {
  applySlideBackground(slide, pres, theme);
  addSlideHeader(slide, pres, theme, item.title, item.subtitle, num, total, i18n, data?.title);

  const points = item.points || [];
  const hasHighlight = !!item.highlight;
  const contentY = 1.68;
  const contentH = hasHighlight ? 3.65 : 4.60;

  const leftW = 4.6;
  const rightX = 5.8;
  const rightW = 6.73;

  const tierH = (contentH - 0.30) / 3;
  const pLabels = i18n.pyramidLevelLabels || ['01. STRATEGIK CHO\'QQI', '02. AMALIY MEXANIZMLAR', '03. FUNDAMENTAL ASOS'];
  const tiers = [
    { label: pLabels[0] || '01. STRATEGIK CHO\'QQI', w: 2.8, fill: theme.primary, textCol: '#FFFFFF' },
    { label: pLabels[1] || '02. AMALIY MEXANIZMLAR', w: 3.7, fill: theme.accent || theme.primary, textCol: '#FFFFFF' },
    { label: pLabels[2] || '03. FUNDAMENTAL ASOS', w: 4.6, fill: theme.cardBg, borderCol: theme.primary, textCol: theme.text },
  ];

  tiers.forEach((t, idx) => {
    const py = contentY + idx * (tierH + 0.15);
    const px = 0.8 + (leftW - t.w) / 2;

    slide.addShape(pres.ShapeType.roundRect, {
      x: px, y: py, w: t.w, h: tierH,
      fill: { color: t.fill },
      line: { color: t.borderCol || t.fill, width: 1.5 },
      rectRadius: 0.12,
    });
    slide.addText(t.label, {
      x: px + 0.1, y: py + 0.1, w: t.w - 0.2, h: tierH - 0.2,
      fontFace: 'Arial', fontSize: 10.5, bold: true, color: t.textCol,
      align: 'center', valign: 'middle', fit: 'shrink',
    });
  });

  for (let idx = 0; idx < 3; idx++) {
    const ry = contentY + idx * (tierH + 0.15);
    const p = points[idx] || points[idx % points.length] || {};
    const defaultHeading = (i18n.pyramidLevelLabels && i18n.pyramidLevelLabels[idx]) || `Daraja 0${idx + 1}`;

    slide.addShape(pres.ShapeType.roundRect, {
      x: rightX, y: ry, w: rightW, h: tierH,
      fill: { color: theme.cardBg },
      line: { color: idx === 0 ? theme.primary : theme.border, width: 1.2 },
      rectRadius: 0.12,
    });

    const pyrHeading = truncateClean(p.heading || defaultHeading, 36);
    const pyrDesc = truncateClean(p.description || i18n.partDesc, 110);

    slide.addText([
      { text: `${pyrHeading}\n`, options: { bold: true, fontSize: 11.5, color: theme.primary } },
      { text: pyrDesc, options: { bold: false, fontSize: 9.5, color: theme.text } }
    ], {
      x: rightX + 0.30, y: ry + 0.08, w: rightW - 0.60, h: tierH - 0.16,
      valign: 'middle', wrap: true, fit: 'shrink',
    });
  }

  if (hasHighlight) addHighlightBox(slide, pres, theme, item.highlight, 5.52, false, i18n);
  addSlideFooter(slide, pres, theme, data.title, num, total, item.source, i18n);
}

// ================================================================
// 17-LAYOUT: QUOTE EDITORIAL (Nufuzli Ilmiy Iqtibos & Chuqur Xulosa)
// ================================================================
function renderQuoteEditorialLayout(slide, pres, theme, item, num, total, img, data, i18n) {
  applySlideBackground(slide, pres, theme);
  addSlideHeader(slide, pres, theme, item.title, item.subtitle, num, total, i18n, data?.title);

  const points = item.points || [];
  const hasHighlight = !!item.highlight;
  const contentY = 1.68;
  const contentH = hasHighlight ? 3.65 : 4.60;

  const leftW = 5.65;
  const rightX = 6.88;
  const rightW = 5.65;

  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.8, y: contentY, w: leftW, h: contentH,
    fill: { color: theme.cardBg },
    line: { color: theme.primary, width: 1.8 },
    rectRadius: 0.14,
  });

  slide.addText('“', {
    x: 1.1, y: contentY - 0.1, w: 1.5, h: 1.2,
    fontFace: 'Georgia', fontSize: 68, bold: true, color: theme.primary,
  });

  const rawQuote = item.spotlightText || item.highlight || points[0]?.description || 'Ilmiy yondashuv va aniq strategiya har qanday murakkab vazifani muvaffaqiyatga aylantiradi.';
  const quoteText = truncateClean(rawQuote, 160);
  slide.addText(quoteText, {
    x: 1.1, y: contentY + 1.05, w: leftW - 0.6, h: contentH - 1.90,
    fontFace: 'Georgia', italic: true, fontSize: 13, color: theme.text,
    valign: 'top', wrap: true, fit: 'shrink',
  });

  slide.addShape(pres.ShapeType.roundRect, {
    x: 1.1, y: contentY + contentH - 0.75, w: leftW - 0.6, h: 0.45,
    fill: { color: theme.bg },
    line: { color: theme.border, width: 1 },
    rectRadius: 0.08,
  });
  const cleanOrg = truncateClean(data.title || '', 35);
  slide.addText(`📌 ${cleanOrg} • ${i18n.quoteLead || 'Ilmiy Asos'}`, {
    x: 1.2, y: contentY + contentH - 0.75, w: leftW - 0.8, h: 0.45,
    fontFace: 'Arial', fontSize: 9.5, bold: true, color: theme.primary,
    valign: 'middle', fit: 'shrink',
  });

  const rightCardH = (contentH - 0.22) / 2;
  points.slice(0, 2).forEach((p, idx) => {
    const ry = contentY + idx * (rightCardH + 0.22);

    slide.addShape(pres.ShapeType.roundRect, {
      x: rightX, y: ry, w: rightW, h: rightCardH,
      fill: { color: theme.cardBg },
      line: { color: theme.border, width: 1.2 },
      rectRadius: 0.12,
    });

    const qHeading = truncateClean(p.heading || i18n.pointFallback(idx + 1), 38);
    const qDesc = truncateClean(p.description || i18n.partDesc, 130);

    slide.addText(qHeading, {
      x: rightX + 0.35, y: ry + 0.18, w: rightW - 0.70, h: 0.50,
      fontFace: 'Arial', fontSize: 12.5, bold: true, color: theme.primary,
      valign: 'middle', wrap: true, fit: 'shrink',
    });

    slide.addText(qDesc, {
      x: rightX + 0.35, y: ry + 0.72, w: rightW - 0.70, h: rightCardH - 0.88,
      fontFace: 'Arial', fontSize: 10, color: theme.text,
      align: 'left', valign: 'top', wrap: true, fit: 'shrink',
    });
  });

  if (hasHighlight) addHighlightBox(slide, pres, theme, item.highlight, 5.52, false, i18n);
  addSlideFooter(slide, pres, theme, data.title, num, total, item.source, i18n);
}

// ================================================================
// 18-LAYOUT: HORIZONTAL FLOWCHART (4 Bosqichli Gorizontal Qadamma-qadam Zanjir)
// ================================================================
function renderHorizontalFlowchartLayout(slide, pres, theme, item, num, total, img, data, i18n) {
  applySlideBackground(slide, pres, theme);
  addSlideHeader(slide, pres, theme, item.title, item.subtitle, num, total, i18n, data?.title);

  const points = item.points || [];
  const hasHighlight = !!item.highlight;
  const contentY = 1.68;
  const contentH = hasHighlight ? 3.65 : 4.60;

  const count = 4;
  const gap = 0.35;
  const cardW = (11.73 - gap * (count - 1)) / count;

  slide.addShape(pres.ShapeType.line, {
    x: 1.2, y: contentY + 0.30, w: 10.93, h: 0,
    line: { color: theme.primary, width: 2.2 },
  });

  for (let idx = 0; idx < count; idx++) {
    const x = 0.8 + idx * (cardW + gap);
    const p = points[idx] || points[idx % points.length] || {};

    slide.addShape(pres.ShapeType.roundRect, {
      x: x + (cardW - 1.5) / 2, y: contentY + 0.08, w: 1.5, h: 0.44,
      fill: { color: theme.primary },
      line: { color: '#FFFFFF', width: 1.2 },
      rectRadius: 0.18,
    });
    const stepBadgeLabel = i18n.stepBadge ? i18n.stepBadge(idx + 1) : `0${idx + 1}-BOSQICH`;
    slide.addText(stepBadgeLabel, {
      x: x + (cardW - 1.5) / 2, y: contentY + 0.08, w: 1.5, h: 0.44,
      fontFace: 'Arial', fontSize: 9.5, bold: true, color: '#FFFFFF',
      align: 'center', valign: 'middle', fit: 'shrink',
    });

    slide.addShape(pres.ShapeType.roundRect, {
      x, y: contentY + 0.65, w: cardW, h: contentH - 0.65,
      fill: { color: theme.cardBg },
      line: { color: theme.border, width: 1.2 },
      rectRadius: 0.12,
    });

    const flowHeading = truncateClean(p.heading || i18n.stepFallback(idx + 1), 28);
    const flowDesc = truncateClean(p.description || i18n.partDesc, 110);

    slide.addText(flowHeading, {
      x: x + 0.15, y: contentY + 0.78, w: cardW - 0.30, h: 0.58,
      fontFace: 'Arial', fontSize: 11.5, bold: true, color: theme.primary,
      align: 'center', valign: 'middle', wrap: true, fit: 'shrink',
    });

    slide.addText(flowDesc, {
      x: x + 0.15, y: contentY + 1.42, w: cardW - 0.30, h: contentH - 2.15,
      fontFace: 'Arial', fontSize: 9.5, color: theme.text,
      align: 'left', valign: 'top', wrap: true, fit: 'shrink',
    });

    if (idx < count - 1) {
      slide.addText('➔', {
        x: x + cardW, y: contentY + 0.08, w: gap, h: 0.44,
        fontFace: 'Arial', fontSize: 16, bold: true, color: theme.primary,
        align: 'center', valign: 'middle',
      });
    }
  }

  if (hasHighlight) addHighlightBox(slide, pres, theme, item.highlight, 5.52, false, i18n);
  addSlideFooter(slide, pres, theme, data.title, num, total, item.source, i18n);
}

// ================================================================
// 19-LAYOUT: TEAM & STAKEHOLDERS (Manfaatdor Tomonlar va Ekspertlar Profillari)
// ================================================================
function renderTeamStakeholdersLayout(slide, pres, theme, item, num, total, img, data, i18n) {
  applySlideBackground(slide, pres, theme);
  addSlideHeader(slide, pres, theme, item.title, item.subtitle, num, total, i18n, data?.title);

  const points = item.points || [];
  const hasHighlight = !!item.highlight;
  const contentY = 1.68;
  const contentH = hasHighlight ? 3.65 : 4.60;

  const count = 3;
  const gap = 0.39;
  const cardW = (11.73 - gap * (count - 1)) / count;
  const icons = ['🏛️', '💼', '👥'];

  for (let idx = 0; idx < count; idx++) {
    const x = 0.8 + idx * (cardW + gap);
    const p = points[idx] || points[idx % points.length] || {};
    const defaultRole = (i18n.stakeholderBadges && i18n.stakeholderBadges[idx]) || `Guruh ${idx + 1}`;

    slide.addShape(pres.ShapeType.roundRect, {
      x, y: contentY, w: cardW, h: contentH,
      fill: { color: theme.cardBg },
      line: { color: idx === 1 ? theme.primary : theme.border, width: idx === 1 ? 1.6 : 1.2 },
      rectRadius: 0.14,
    });

    slide.addShape(pres.ShapeType.ellipse, {
      x: x + (cardW - 1.1) / 2, y: contentY + 0.25, w: 1.1, h: 1.1,
      fill: { color: theme.bg },
      line: { color: theme.primary, width: 1.5 },
    });
    slide.addText(icons[idx % icons.length], {
      x: x + (cardW - 1.1) / 2, y: contentY + 0.25, w: 1.1, h: 1.1,
      fontFace: 'Arial', fontSize: 26, align: 'center', valign: 'middle',
    });

    slide.addShape(pres.ShapeType.roundRect, {
      x: x + 0.4, y: contentY + 1.50, w: cardW - 0.8, h: 0.38,
      fill: { color: theme.primary },
      line: { color: theme.primary },
      rectRadius: 0.08,
    });
    slide.addText(defaultRole, {
      x: x + 0.4, y: contentY + 1.50, w: cardW - 0.8, h: 0.38,
      fontFace: 'Arial', fontSize: 9.5, bold: true, color: '#FFFFFF',
      align: 'center', valign: 'middle', fit: 'shrink',
    });

    const teamHeading = truncateClean(p.heading || `${i18n.stakeholderUserFallback || 'Foydalanuvchi'} ${idx + 1}`, 32);
    const teamDesc = truncateClean(p.description || i18n.partDesc, 120);

    slide.addText(teamHeading, {
      x: x + 0.2, y: contentY + 1.95, w: cardW - 0.4, h: 0.55,
      fontFace: 'Arial', fontSize: 12.5, bold: true, color: theme.text,
      align: 'center', valign: 'middle', wrap: true, fit: 'shrink',
    });

    slide.addText(teamDesc, {
      x: x + 0.2, y: contentY + 2.55, w: cardW - 0.4, h: contentH - 2.70,
      fontFace: 'Arial', fontSize: 10, color: theme.subtext,
      align: 'left', valign: 'top', wrap: true, fit: 'shrink',
    });
  }

  if (hasHighlight) addHighlightBox(slide, pres, theme, item.highlight, 5.52, false, i18n);
  addSlideFooter(slide, pres, theme, data.title, num, total, item.source, i18n);
}

// ================================================================
// 20-LAYOUT: MATRIX RATING (Ekspert Baholash Matritsasi — ●●●●○ Ballari Bilan)
// ================================================================
function renderMatrixRatingLayout(slide, pres, theme, item, num, total, img, data, i18n) {
  applySlideBackground(slide, pres, theme);
  addSlideHeader(slide, pres, theme, item.title, item.subtitle, num, total, i18n, data?.title);

  const hasHighlight = !!item.highlight;
  const contentY = 1.68;
  const tableH = hasHighlight ? 3.65 : 4.60;
  const isMonochrome = theme.id === 'monochrome';
  const isNeon = theme.id === 'neon_abstract';

  const defaultCols = i18n.matrixRatingCols || ['Mezon', 'Variant A', 'Variant B', 'Variant C', 'Variant D', 'Variant E'];
  const columns = (item.columns && item.columns.length) ? item.columns : (item.headers && item.headers.length ? item.headers : defaultCols);
  const colCount = columns.length;

  const headerBg = isMonochrome ? '111111' : (isNeon ? '1C2C3B' : theme.primary);
  const headerTextColor = '#FFFFFF';

  const tableRows = [
    columns.map((c, cIdx) => ({
      text: truncateClean(c, 24),
      options: {
        fill: headerBg,
        color: headerTextColor,
        bold: true,
        align: cIdx === 0 ? 'left' : 'center',
        fontSize: colCount > 5 ? 10 : 11
      }
    }))
  ];

  const defaultRows = i18n.matrixRatingRows || [
    { name: 'Ekotizim & Qamrov', scores: ['●●●●●', '●●●●○', '●●●○○', '●●●●●', '●●●●○'] },
    { name: 'Xavfsizlik & Maxfiylik', scores: ['●●●○○', '●●●●○', '●●●●●', '●●●○○', '●●●●●'] },
    { name: 'Moslashtirish Erkinligi', scores: ['●●●○○', '●●○○○', '●●●●●', '●●●●○', '●●○○○'] },
    { name: 'Resurs Samaradorligi', scores: ['●●●○○', '●●●●○', '●●●●●', '●●●○○', '●●●●●'] },
    { name: 'Kirish Narxi & Tejamkorlik', scores: ['●●●○○', '●●○○○', '●●●●●', '●●●●●', '●●○○○'] },
  ];

  const rows = (item.matrixRows && item.matrixRows.length) ? item.matrixRows : (item.rows && item.rows.length ? item.rows : defaultRows);
  const maxRows = Math.min(rows.length, 6);
  for (let rIdx = 0; rIdx < maxRows; rIdx++) {
    const r = rows[rIdx];
    const isEven = (rIdx % 2 === 0);
    const rowBg = isEven ? theme.cardBg : theme.bg;
    const rowCells = [
      {
        text: truncateClean(r.name || r.criterion || `${i18n.criterionFallback || 'Mezon'} 0${rIdx + 1}`, 32),
        options: {
          fill: rowBg,
          color: isMonochrome ? '111111' : theme.primary,
          bold: true,
          align: 'left',
          fontSize: 10
        }
      }
    ];

    const scores = r.scores || r.values || [];
    for (let cIdx = 1; cIdx < colCount; cIdx++) {
      const scoreVal = scores[cIdx - 1] || '●●●○○';
      rowCells.push({
        text: scoreVal,
        options: {
          fill: rowBg,
          color: isNeon ? 'F88196' : (isMonochrome ? '111111' : theme.primary),
          bold: true,
          align: 'center',
          fontSize: 10.5
        }
      });
    }
    tableRows.push(rowCells);
  }

  const firstColW = colCount > 5 ? 2.8 : 3.3;
  const otherColW = (11.73 - firstColW) / Math.max(colCount - 1, 1);
  const colWidths = [firstColW];
  for (let c = 1; c < colCount; c++) colWidths.push(otherColW);

  try {
    slide.addTable(tableRows, {
      x: 0.8,
      y: contentY,
      w: 11.73,
      h: tableH,
      colW: colWidths,
      border: { type: 'solid', pt: 1, color: isNeon ? '595C8A' : theme.border },
      valign: 'middle',
      margin: [0.06, 0.1, 0.06, 0.1],
    });
  } catch (tErr) {
    console.warn('[PPTX] Matrix rating jadvalida xatolik:', tErr.message);
  }

  const ratingNote = item.ratingScaleNote || i18n.ratingScaleNote;
  const highlightText = item.highlight ? `${ratingNote} • ${truncateClean(item.highlight, 90)}` : ratingNote;
  if (highlightText) addHighlightBox(slide, pres, theme, truncateClean(highlightText, 130), 5.52, false, i18n);
  addSlideFooter(slide, pres, theme, data.title, num, total, item.source, i18n);
}

// ================================================================
// 21-LAYOUT: SCENARIO MATRIX (Amaliy Stsenariylar & Tanlov Tavsiyalari Jadvali)
// ================================================================
function renderScenarioMatrixLayout(slide, pres, theme, item, num, total, img, data, i18n) {
  applySlideBackground(slide, pres, theme);
  addSlideHeader(slide, pres, theme, item.title, item.subtitle, num, total, i18n, data?.title);

  const hasHighlight = !!item.highlight;
  const contentY = 1.68;
  const tableH = hasHighlight ? 3.65 : 4.60;
  const isMonochrome = theme.id === 'monochrome';
  const isNeon = theme.id === 'neon_abstract';

  const defaultHeaders = i18n.scenarioHeaders || ['Foydalanish Stsenariysi / Vazifa', 'Tavsiya Etilgan Tanlov', 'Asosiy Sabab & Strategik Afzallik'];
  const headers = (item.headers && item.headers.length) ? item.headers : defaultHeaders;

  const headerBg = isMonochrome ? '111111' : (isNeon ? '1C2C3B' : theme.primary);
  const headerTextColor = '#FFFFFF';

  const tableRows = [
    [
      { text: truncateClean(headers[0], 35), options: { fill: headerBg, color: headerTextColor, bold: true, align: 'left', fontSize: 11 } },
      { text: truncateClean(headers[1], 28), options: { fill: headerBg, color: headerTextColor, bold: true, align: 'center', fontSize: 11 } },
      { text: truncateClean(headers[2], 38), options: { fill: headerBg, color: headerTextColor, bold: true, align: 'left', fontSize: 11 } },
    ]
  ];

  const defaultScenarios = i18n.scenarioFallback || [
    { scenario: 'Korporativ Ofis & Boshqaruv', choice: 'Standart Model A', reason: 'Keng qamrovli ekotizim, markaziy audit va integratsiya qulayligi.' },
    { scenario: 'Kreativ Ish & Dizayn', choice: 'Premium Model B', reason: 'Maksimal rang aniqligi, unumdorlik va energiya samaradorligi balansi.' },
    { scenario: 'Dasturlash & Infratuzilma', choice: 'Ochiq Model C', reason: 'UNIX/POSIX muhiti, konteynerlar va litsenziya xarajatlarining yo\'qligi.' },
    { scenario: 'Ommaviy Bozor & Mass Market', choice: 'Moslashuvchan Model D', reason: 'Keng apparat tanlovi, har qanday byudjetga moslik va erkinlik.' },
    { scenario: 'Eski yoki Cheklangan Resurs', choice: 'Yengil Model E', reason: 'Minimal talablar bilan barqaror ishlash va tejamkorlik.' },
  ];

  const scenarios = (item.scenarios && item.scenarios.length) ? item.scenarios : (item.points ? item.points.map(p => ({
    scenario: p.heading,
    choice: p.choice || p.tag || (i18n.recommendationBadge || 'Tavsiya'),
    reason: p.description
  })) : defaultScenarios);

  const rowCount = Math.min(scenarios.length, 6);
  for (let r = 0; r < rowCount; r++) {
    const sc = scenarios[r];
    const isEven = (r % 2 === 0);
    const rowBg = isEven ? theme.cardBg : theme.bg;

    tableRows.push([
      { text: truncateClean(sc.scenario || `${i18n.taskFallback || 'Vazifa'} 0${r + 1}`, 36), options: { fill: rowBg, color: isMonochrome ? '111111' : theme.primary, bold: true, align: 'left', fontSize: 10 } },
      { text: truncateClean(sc.choice || (i18n.choiceBadge || 'Tanlov'), 26), options: { fill: rowBg, color: isNeon ? 'F88196' : (isMonochrome ? '111111' : theme.primary), bold: true, align: 'center', fontSize: 10.5 } },
      { text: truncateClean(sc.reason || '', 95), options: { fill: rowBg, color: theme.text, fontSize: 9.5 } },
    ]);
  }

  try {
    slide.addTable(tableRows, {
      x: 0.8,
      y: contentY,
      w: 11.73,
      h: tableH,
      colW: [3.3, 2.7, 5.73],
      border: { type: 'solid', pt: 1, color: isNeon ? '595C8A' : theme.border },
      valign: 'middle',
      margin: [0.07, 0.12, 0.07, 0.12],
    });
  } catch (tErr) {
    console.warn('[PPTX] Scenario jadvalida xatolik:', tErr.message);
  }

  const ruleNote = item.rule || i18n.scenarioRule;
  const highlightText = item.highlight ? `${ruleNote} • ${truncateClean(item.highlight, 90)}` : ruleNote;
  if (highlightText) addHighlightBox(slide, pres, theme, truncateClean(highlightText, 130), 5.52, false, i18n);
  addSlideFooter(slide, pres, theme, data.title, num, total, item.source, i18n);
}

// ================================================================
// 22-LAYOUT: PROFILE CARD (Tizim Portreti: Pasport, Kuchli/Zaif Tomonlar & Qo'llanish)
// ================================================================
function renderProfileCardLayout(slide, pres, theme, item, num, total, img, data, i18n) {
  applySlideBackground(slide, pres, theme);
  addSlideHeader(slide, pres, theme, item.title, item.subtitle, num, total, i18n, data?.title);

  const hasHighlight = !!item.highlight;
  const contentY = 1.68;
  const isMonochrome = theme.id === 'monochrome';
  const isNeon = theme.id === 'neon_abstract';

  // 1. TIZIM PASPORTI (Yuqoridagi horizontal karta)
  const passportH = 0.68;
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.8, y: contentY, w: 11.73, h: passportH,
    fill: { color: theme.cardBg },
    line: { color: theme.primary, width: 1.2 },
    rectRadius: 0.1,
  });

  const passportFields = item.passport || i18n.profilePassportDefaults || [
    { label: 'Turi', val: item.typeDesc || 'Operatsion Tizim' },
    { label: 'Yadro', val: item.kernel || 'Gibrid / Modular' },
    { label: 'Litsenziya', val: item.license || 'Proprietar / GPL' },
    { label: 'Bozor Ulushi', val: item.marketShare || '~70%' },
  ];

  const passW = 11.73 / passportFields.length;
  passportFields.forEach((f, idx) => {
    const px = 0.8 + idx * passW;
    slide.addText([
      { text: `${truncateClean(f.label, 18)}: `, options: { bold: true, fontSize: 9.5, color: theme.subtext } },
      { text: `${truncateClean(f.val, 24)}`, options: { bold: true, fontSize: 10.5, color: isNeon ? '#FFFFFF' : theme.primary } },
    ], {
      x: px + 0.1, y: contentY + 0.05, w: passW - 0.2, h: passportH - 0.1,
      align: 'center', valign: 'middle', fit: 'shrink',
    });
  });

  // 2. TAHLIL QISMI: Agar rasm bo'lsa 3 ta ustun (Rasm, Kuchli, Zaif), bo'lmasa 2 ta ustun
  const colY = contentY + passportH + 0.15;
  const colH = hasHighlight ? 2.15 : 2.95;

  let leftX, colW, rightX;
  if (img) {
    const imgW = 3.2;
    // Chap foto kartochka
    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8, y: colY, w: imgW, h: colH,
      fill: { color: theme.cardBg },
      line: { color: theme.primary, width: 1.4 },
      rectRadius: 0.12,
    });
    slide.addImage({
      data: img,
      x: 0.86, y: colY + 0.06,
      w: imgW - 0.12, h: colH - 0.12,
      rounding: true,
    });

    colW = 4.05;
    leftX = 0.8 + imgW + 0.22;
    rightX = leftX + colW + 0.22;
  } else {
    colW = 5.65;
    leftX = 0.8;
    rightX = leftX + colW + 0.43;
  }

  // Chap karta: Kuchli tomonlari
  slide.addShape(pres.ShapeType.roundRect, {
    x: leftX, y: colY, w: colW, h: colH,
    fill: { color: theme.cardBg },
    line: { color: '10B981', width: 1.4 },
    rectRadius: 0.12,
  });
  slide.addText(`✅ ${i18n.profileHeadings?.pros || 'KUCHLI TOMONLARI'}`, {
    x: leftX + 0.25, y: colY + 0.12, w: colW - 0.5, h: 0.35,
    fontFace: 'Arial', fontSize: 11, bold: true, color: '10B981', fit: 'shrink',
  });

  const pros = (item.pros && item.pros.length) ? item.pros : (item.strengths && item.strengths.length ? item.strengths : (item.points ? item.points.slice(0, 3) : []));
  const prosText = pros.map(p => {
    const raw = typeof p === 'string' ? p : `${p.heading ? p.heading + ': ' : ''}${p.description || ''}`;
    return `• ${truncateClean(raw, 95)}`;
  }).join('\n\n');
  slide.addText(prosText, {
    x: leftX + 0.25, y: colY + 0.48, w: colW - 0.5, h: colH - 0.58,
    fontFace: 'Arial', fontSize: 9.5, color: theme.text, valign: 'top', wrap: true, fit: 'shrink',
  });

  // O'ng karta: Zaif tomonlari
  slide.addShape(pres.ShapeType.roundRect, {
    x: rightX, y: colY, w: colW, h: colH,
    fill: { color: theme.cardBg },
    line: { color: 'EF4444', width: 1.4 },
    rectRadius: 0.12,
  });
  slide.addText(`⚠️ ${i18n.profileHeadings?.cons || 'ZAIF TOMONLARI & CHEKLOVLAR'}`, {
    x: rightX + 0.25, y: colY + 0.12, w: colW - 0.5, h: 0.35,
    fontFace: 'Arial', fontSize: 11, bold: true, color: 'EF4444', fit: 'shrink',
  });

  const cons = (item.cons && item.cons.length) ? item.cons : (item.weaknesses && item.weaknesses.length ? item.weaknesses : (item.points ? item.points.slice(3, 6) : []));
  const consList = cons.length ? cons : (i18n.profileConsDefaults || [
    'Yuqori apparat talablari va resurs sarfi.',
    'Maxfiylik va telemetriya parametrlarining cheklanganligi.'
  ]);
  const consText = consList.map(p => {
    const raw = typeof p === 'string' ? p : `${p.heading ? p.heading + ': ' : ''}${p.description || ''}`;
    return `• ${truncateClean(raw, 95)}`;
  }).join('\n\n');
  slide.addText(consText, {
    x: rightX + 0.25, y: colY + 0.48, w: colW - 0.5, h: colH - 0.58,
    fontFace: 'Arial', fontSize: 9.5, color: theme.text, valign: 'top', wrap: true, fit: 'shrink',
  });

  // 3. ENG MOS SOHALAR (Pastki blok)
  const bestForY = colY + colH + 0.12;
  const bestForH = 0.55;
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.8, y: bestForY, w: 11.73, h: bestForH,
    fill: { color: theme.bg },
    line: { color: theme.border, width: 1 },
    rectRadius: 0.08,
  });
  const bestForRaw = item.bestFor || item.targetUse || (i18n.profileBestForDefault || 'Korporativ ofis, ilmiy tadqiqotlar va keng qamrovli ekotizim.');
  const bestForText = truncateClean(bestForRaw, 120);
  slide.addText([
    { text: `🎯 ${i18n.profileHeadings?.bestFor || 'ENG MOS SOHALAR'}: `, options: { bold: true, fontSize: 10, color: isNeon ? '#FFFFFF' : theme.primary } },
    { text: bestForText, options: { bold: false, fontSize: 10, color: theme.text } },
  ], {
    x: 0.95, y: bestForY + 0.05, w: 11.43, h: bestForH - 0.1,
    valign: 'middle', wrap: true, fit: 'shrink',
  });

  if (hasHighlight) addHighlightBox(slide, pres, theme, item.highlight, 5.52, false, i18n);
  addSlideFooter(slide, pres, theme, data.title, num, total, item.source, i18n);
}

/**
 * Professional PowerPoint (.pptx) taqdimot yaratadi:
 * - 21 xil boy va unikal andozalar
 * - 100% ramka ichida qoladigan matnlar (fit: 'shrink')
 * - Mavzuga 100% mos 4K fotosuratlar
 */
export async function createPptx(data) {
  const pres = new pptxgen();
  pres.defineLayout({ name: 'WIDE_16_9', width: 13.333, height: 7.5 });
  pres.layout = 'WIDE_16_9';
  pres.author = data.organization || data.title || 'Presentation';
  pres.company = data.organization || '';
  pres.title = data.title || 'Presentation';

  let lang = data.language;
  if (!lang || lang === 'uz') {
    // Matn tarkibidan aqlli aniqlash (agar slaydlar ruscha yoki tojikcha bo'lsa)
    const sampleText = `${data.title || ''} ${data.slides?.[0]?.title || ''} ${data.slides?.[1]?.title || ''} ${data.slides?.[1]?.points?.[0]?.heading || ''} ${data.slides?.[1]?.points?.[0]?.description || ''}`;
    if (/[ҷҳӣӯғқ]/i.test(sampleText)) {
      lang = 'tg';
    } else if (/[ыэъщёц]/i.test(sampleText) || /[а-я]/i.test(sampleText)) {
      lang = 'ru';
    } else if (data.language) {
      lang = data.language;
    } else {
      lang = 'uz';
    }
  }
  const i18n = getI18n(lang);

  const theme = getTheme(data.theme);
  const slidesList = data.slides || [];

  // Mavzuga mos rasmlarni yuklab olish
  const allSlideImages = await loadAllImages(slidesList, data.title || 'Presentation');

  // ================================================================
  // 1. MUQOVA SLAYDI (TITLE SLIDE)
  // ================================================================
  const titleData = slidesList[0] || {};
  const coverImages = allSlideImages[0] || [];
  const titleSlide = pres.addSlide();
  const coverImg = coverImages[0] || null;
  const coverImg2 = coverImages[1] || null;

  const isLightTheme = theme.id === 'minimal' || theme.id === 'monochrome';
  if (coverImg) {
    titleSlide.addImage({
      data: coverImg,
      x: 0, y: 0, w: 13.333, h: 7.5,
    });
    // O'ta muhim kontrast sozlamasi:
    // PptxGenJS transparency: 0 = to'liq xira (solid), 100 = butunlay shaffof (transparent).
    // Dark temalarda: 58% shaffoflik orqali fon rasmi juda jozibali, boy va tiniq namoyon bo'ladi!
    // Light temalarda: 84% shaffoflik orqali matnlar ravshan o'qiladi.
    const overlayTransparency = isLightTheme ? 84 : 58;
    titleSlide.addShape(pres.ShapeType.rect, {
      x: 0, y: 0, w: 13.333, h: 7.5,
      fill: { color: theme.bg, transparency: overlayTransparency },
      line: { color: theme.bg, transparency: overlayTransparency },
    });
    // Pastki sarlavha va ma'lumotlar uchun yumshoq qo'shimcha kontrast qatlami (vignette scrim)
    titleSlide.addShape(pres.ShapeType.rect, {
      x: 0, y: 3.5, w: 13.333, h: 4.0,
      fill: { color: isLightTheme ? 'FFFFFF' : '000000', transparency: isLightTheme ? 88 : 72 },
      line: { color: isLightTheme ? 'FFFFFF' : '000000', transparency: 100 },
    });
  } else {
    titleSlide.background = { color: theme.bg };
  }

  // Chap aksent chiziq
  titleSlide.addShape(pres.ShapeType.rect, {
    x: 0, y: 0, w: 0.35, h: 7.5,
    fill: { color: theme.primary },
    line: { color: theme.primary },
  });

  // Badge (Top-left) — NO AI MENTIONS
  const coverBadgeText = data.organization ? data.organization.toUpperCase() : i18n.badge;
  titleSlide.addShape(pres.ShapeType.roundRect, {
    x: 1.0, y: 1.0, w: 2.8, h: 0.45,
    fill: { color: theme.cardBg },
    line: { color: theme.border, width: 1 },
    rectRadius: 0.1,
  });
  titleSlide.addText(coverBadgeText, {
    x: 1.0, y: 1.0, w: 2.8, h: 0.45,
    fontFace: 'Arial', fontSize: 11, bold: true,
    color: theme.primary, align: 'center', valign: 'middle', fit: 'shrink',
  });

  // Tashkilot / Universitet nomi (Branding)
  if (data.organization) {
    titleSlide.addShape(pres.ShapeType.roundRect, {
      x: 4.0, y: 1.0, w: 4.2, h: 0.45,
      fill: { color: theme.cardBg },
      line: { color: theme.border, width: 1 },
      rectRadius: 0.1,
    });
    titleSlide.addText(`🏢 ${data.organization}`, {
      x: 4.0, y: 1.0, w: 4.2, h: 0.45,
      fontFace: 'Arial', fontSize: 10, bold: true,
      color: theme.text, align: 'center', valign: 'middle', fit: 'shrink',
    });
  }

  // Agar 2-muqova rasmi bo'lsa
  if (coverImg2) {
    titleSlide.addShape(pres.ShapeType.roundRect, {
      x: 8.0, y: 1.4, w: 4.5, h: 4.5,
      fill: { color: theme.cardBg },
      line: { color: theme.primary, width: 1.5 },
      rectRadius: 0.15,
    });
    titleSlide.addImage({ data: coverImg2, x: 8.08, y: 1.48, w: 4.34, h: 4.34, rounding: true });
  }

  const textW = coverImg2 ? 6.7 : 11.3;
  const titleColor = isLightTheme ? (theme.primary || '111111') : '#FFFFFF';

  const coverTitle = (data.title || titleData.title || '').trim();
  const coverTitleLen = coverTitle.length;
  let coverTitleFontSize = coverImg2 ? 30 : 36;
  if (coverTitleLen > 80) {
    coverTitleFontSize = coverImg2 ? 22 : 25;
  } else if (coverTitleLen > 55) {
    coverTitleFontSize = coverImg2 ? 25 : 29;
  }

  titleSlide.addText(coverTitle, {
    x: 1.0, y: 1.9, w: textW, h: 2.3,
    fontFace: 'Arial', fontSize: coverTitleFontSize, bold: true,
    color: titleColor, valign: 'middle', wrap: true, fit: 'shrink',
  });

  if (data.subtitle || titleData.subtitle) {
    const coverSubtitle = truncateClean(data.subtitle || titleData.subtitle, 120);
    titleSlide.addText(coverSubtitle, {
      x: 1.0, y: 4.4, w: textW, h: 0.75,
      fontFace: 'Arial', fontSize: 14.5, color: isLightTheme ? (theme.accent || '52525B') : theme.primary, valign: 'top', wrap: true, fit: 'shrink',
    });
  }

  // Scope Tag Pills (Masalan: Windows 11, macOS, Linux, Android, iOS kabi asosiy qismlar)
  const scopePills = titleData.tags || data.tags || titleData.scopePills || data.scopePills || [];
  if (scopePills && scopePills.length) {
    const pillY = 5.20;
    let pillX = 1.0;
    scopePills.slice(0, 5).forEach(pillText => {
      const pW = Math.min(Math.max(pillText.length * 0.13 + 0.45, 1.2), 2.4);
      if (pillX + pW <= textW + 1.0) {
        titleSlide.addShape(pres.ShapeType.roundRect, {
          x: pillX, y: pillY, w: pW, h: 0.36,
          fill: { color: theme.cardBg },
          line: { color: theme.border, width: 1 },
          rectRadius: 0.18,
        });
        titleSlide.addText(pillText, {
          x: pillX, y: pillY, w: pW, h: 0.36,
          fontFace: 'Arial', fontSize: 9.0, bold: true, color: theme.primary,
          align: 'center', valign: 'middle', fit: 'shrink',
        });
        pillX += pW + 0.15;
      }
    });
  }

  if (data.author) {
    const authorCardW = textW > 7 ? 6.5 : textW;
    titleSlide.addShape(pres.ShapeType.roundRect, {
      x: 1.0, y: 5.75, w: authorCardW, h: 0.48,
      fill: { color: theme.cardBg },
      line: { color: theme.primary, width: 1.2 },
      rectRadius: 0.1,
    });
    titleSlide.addText(`👤 ${data.author}`, {
      x: 1.15, y: 5.75, w: authorCardW - 0.3, h: 0.48,
      fontFace: 'Arial', fontSize: 11, bold: true,
      color: theme.primary, valign: 'middle', fit: 'shrink',
    });
  }

  const totalSlidesInfo = `${slidesList.length} ${i18n.slide || 'slayd'} • 16:9 Full HD • ${data.sourcesNote || i18n.coverSources || 'StatCounter, Gartner va rasmiy xalqaro manbalar asosida'}`;
  titleSlide.addText(totalSlidesInfo, {
    x: 1.0, y: 6.6, w: 10.5, h: 0.35,
    fontFace: 'Arial', fontSize: 9.5, color: theme.subtext, fit: 'shrink',
  });

  if (titleData.speakerNotes) titleSlide.addNotes(titleData.speakerNotes);

  // ================================================================
  // 2. KONTENT SLAYDLARI — 12 xil unikal layout rotatsiyasi!
  // ================================================================
  const contentSlides = slidesList.slice(1);
  const totalSlides = slidesList.length;

  const layoutRotator = [
    'split_hero',
    'agenda_numbered',
    'kpi_metrics',
    'profile_card',
    'three_cards',
    'circular_feature',
    'matrix_rating',
    'swot_analysis',
    'data_chart',
    'problem_solution',
    'milestones_table',
    'comparison',
    'scenario_matrix',
    'pyramid_hierarchy',
    'process_timeline',
    'quote_editorial',
    'matrix_grid',
    'horizontal_flowchart',
    'team_stakeholders',
    'spotlight',
    'cinematic'
  ];

  const speakerNotesList = [];
  if (titleData.speakerNotes) {
    speakerNotesList.push({ slideNumber: 1, notes: titleData.speakerNotes });
  }

  contentSlides.forEach((slideItem, index) => {
    const slideNumber = index + 2;
    const isLast = (index === contentSlides.length - 1);
    const imgs = allSlideImages[index + 1] || [];
    const img1 = imgs[0] || null;

    const slide = pres.addSlide();

    if (isLast) {
      renderConclusionLayout(slide, pres, theme, slideItem, slideNumber, totalSlides, img1, data, i18n);
    } else {
      const chosenLayout = slideItem.layoutType || layoutRotator[index % layoutRotator.length];

      switch (chosenLayout) {
        case 'split_hero':
          renderSplitHeroLayout(slide, pres, theme, slideItem, slideNumber, totalSlides, img1, data, i18n);
          break;
        case 'agenda_numbered':
          renderAgendaNumberedLayout(slide, pres, theme, slideItem, slideNumber, totalSlides, img1, data, i18n);
          break;
        case 'three_cards':
          renderThreeCardsLayout(slide, pres, theme, slideItem, slideNumber, totalSlides, img1, data, i18n);
          break;
        case 'circular_feature':
          renderCircularFeatureLayout(slide, pres, theme, slideItem, slideNumber, totalSlides, img1, data, i18n);
          break;
        case 'swot_analysis':
          renderSwotAnalysisLayout(slide, pres, theme, slideItem, slideNumber, totalSlides, img1, data, i18n);
          break;
        case 'data_chart':
          renderChartLayout(slide, pres, theme, slideItem, slideNumber, totalSlides, img1, data, i18n);
          break;
        case 'problem_solution':
          renderProblemSolutionLayout(slide, pres, theme, slideItem, slideNumber, totalSlides, img1, data, i18n);
          break;
        case 'milestones_table':
          renderMilestonesTableLayout(slide, pres, theme, slideItem, slideNumber, totalSlides, img1, data, i18n);
          break;
        case 'comparison':
          renderComparisonLayout(slide, pres, theme, slideItem, slideNumber, totalSlides, img1, data, i18n);
          break;
        case 'pyramid_hierarchy':
          renderPyramidHierarchyLayout(slide, pres, theme, slideItem, slideNumber, totalSlides, img1, data, i18n);
          break;
        case 'kpi_metrics':
          renderKpiMetricsLayout(slide, pres, theme, slideItem, slideNumber, totalSlides, img1, data, i18n);
          break;
        case 'process_timeline':
          renderProcessTimelineLayout(slide, pres, theme, slideItem, slideNumber, totalSlides, img1, data, i18n);
          break;
        case 'quote_editorial':
          renderQuoteEditorialLayout(slide, pres, theme, slideItem, slideNumber, totalSlides, img1, data, i18n);
          break;
        case 'matrix_grid':
          renderMatrixGridLayout(slide, pres, theme, slideItem, slideNumber, totalSlides, img1, data, i18n);
          break;
        case 'horizontal_flowchart':
          renderHorizontalFlowchartLayout(slide, pres, theme, slideItem, slideNumber, totalSlides, img1, data, i18n);
          break;
        case 'team_stakeholders':
          renderTeamStakeholdersLayout(slide, pres, theme, slideItem, slideNumber, totalSlides, img1, data, i18n);
          break;
        case 'matrix_rating':
          renderMatrixRatingLayout(slide, pres, theme, slideItem, slideNumber, totalSlides, img1, data, i18n);
          break;
        case 'scenario_matrix':
          renderScenarioMatrixLayout(slide, pres, theme, slideItem, slideNumber, totalSlides, img1, data, i18n);
          break;
        case 'profile_card':
          renderProfileCardLayout(slide, pres, theme, slideItem, slideNumber, totalSlides, img1, data, i18n);
          break;
        case 'spotlight':
          renderSpotlightCalloutLayout(slide, pres, theme, slideItem, slideNumber, totalSlides, img1, data, i18n);
          break;
        case 'cinematic':
          renderCinematicLayout(slide, pres, theme, slideItem, slideNumber, totalSlides, img1, data, i18n);
          break;
        default:
          renderSplitHeroLayout(slide, pres, theme, slideItem, slideNumber, totalSlides, img1, data, i18n);
      }
    }

    if (slideItem.speakerNotes) {
      slide.addNotes(slideItem.speakerNotes);
      speakerNotesList.push({ slideNumber, notes: slideItem.speakerNotes });
    }
  });

  // Faylni vaqtinchalik xotiraga eksport qilish
  const buffer = await pres.write({ outputType: 'nodebuffer' });

  // ZIP ichidagi XML'larga perexod animatsiyalarini kiritish
  try {
    const zip = await JSZip.loadAsync(buffer);
    let slideIdx = 0;

    for (const fileName of Object.keys(zip.files)) {
      if (fileName.startsWith('ppt/slides/slide') && fileName.endsWith('.xml')) {
        let xml = await zip.files[fileName].async('string');
        const transitionXml = TRANSITIONS[slideIdx % TRANSITIONS.length];
        slideIdx++;

        if (!xml.includes('<p:transition')) {
          xml = xml.replace('</p:sld>', `<p:transition>${transitionXml}</p:transition></p:sld>`);
          zip.file(fileName, xml);
        }
      }
    }

    const modifiedBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    const filename = `presentation_${Date.now()}_${Math.random().toString(36).substring(7)}.pptx`;
    const filePath = path.join(TEMP_DIR, filename);
    fs.writeFileSync(filePath, modifiedBuffer);

    console.log(`[PPTX] Taqdimot yaratildi (${(modifiedBuffer.length / 1024).toFixed(0)} KB): ${filePath}`);

    return { filePath, filename, fileName: filename, buffer: modifiedBuffer, speakerNotesList };
  } catch (err) {
    console.warn('[PPTX] Animatsiyalar qo\'shishda xatolik, standart eksport qilinmoqda:', err.message);
    const filename = `presentation_${Date.now()}_${Math.random().toString(36).substring(7)}.pptx`;
    const filePath = path.join(TEMP_DIR, filename);
    fs.writeFileSync(filePath, buffer);
    return { filePath, filename, fileName: filename, buffer, speakerNotesList };
  }
}
