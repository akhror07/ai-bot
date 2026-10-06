export const categories = {
  education: {
    id: 'education',
    names: {
      uz: '🎓 Ta\'lim va O\'qituvchilar',
      ru: '🎓 Образование и Наука',
      en: '🎓 Education & Academia',
      tg: '🎓 Маориф ва Илм',
    },
    promptContexts: {
      uz: 'Taqdimot ta\'lim sohasi, o\'qituvchilar va talabalar uchun mo\'ljallangan. Tushuntirishlar chuqur pedagogik, metodik jihatdan to\'g\'ri, ilmiy asoslangan va dars uchun qulay bo\'lsin.',
      ru: 'Презентация предназначена для академической сферы, преподавателей и студентов. Материал должен быть глубоким, методически выверенным, насыщенным научными фактами и структурированным.',
      en: 'The presentation is tailored for academia, educators, and scholars. Content must be pedagogically sound, deeply insightful, fact-driven, and clearly structured.',
      tg: 'Муаррифӣ барои соҳаи маориф, омӯзгорон ва донишҷӯён пешбинӣ шудааст. Маводҳо бояд аз ҷиҳати методӣ дуруст, илман асоснок ва дорои таҳлили амиқ бошанд.',
    },
  },
  economy: {
    id: 'economy',
    names: {
      uz: '💼 Iqtisodiyot va Moliya',
      ru: '💼 Экономика и Финансы',
      en: '💼 Business & Finance',
      tg: '💼 Иқтисодиёт ва Молия',
    },
    promptContexts: {
      uz: 'Taqdimot iqtisodiyot, biznes va moliya mutaxassislari uchun mo\'ljallangan. Statistik tahlil, ROI, rentabellik, bozor dinamikasi va amaliy biznes strategiyalariga chuqur urg\'u bering.',
      ru: 'Презентация разработана для специалистов в области бизнеса и финансов. Сделайте упор на экономические показатели, рыночную динамику, окупаемость инвестиций и практические стратегии.',
      en: 'The presentation is designed for business and finance leaders. Emphasize analytical metrics, market dynamics, ROI, and actionable strategic insights.',
      tg: 'Муаррифӣ барои соҳаи тиҷорат ва молия пешбинӣ шудааст. Ба нишондиҳандаҳои иқтисодӣ, бозори молиявӣ ва стратегияҳои амалии тиҷорат диққати махсус диҳед.',
    },
  },
  medical: {
    id: 'medical',
    names: {
      uz: '🩺 Tibbiyot va Salomatlik',
      ru: '🩺 Медицина и Здравоохранение',
      en: '🩺 Healthcare & Medicine',
      tg: '🩺 Тиббиёт ва Тандурустӣ',
    },
    promptContexts: {
      uz: 'Taqdimot tibbiyot va sog\'liqni saqlash sohasiga tegishli. Ilmiy asoslangan tibbiy atamalar, inson organizmiga ta\'siri, profilaktika va davolash mezonlariga aniq to\'xtaling.',
      ru: 'Презентация посвящена медицине и здравоохранению. Используйте научно доказанные медицинские термины, клинические данные и практические рекомендации.',
      en: 'The presentation focuses on healthcare and clinical medicine. Incorporate evidence-based terms, physiological impacts, and verified clinical insights.',
      tg: 'Муаррифӣ ба соҳаи тиб ва тандурустӣ марбут аст. Аз истилоҳоти илмии тиббӣ, маълумотҳои воқеӣ ва роҳҳои табобату пешгирӣ истифода баред.',
    },
  },
  tech: {
    id: 'tech',
    names: {
      uz: '💻 IT va Texnologiya',
      ru: '💻 IT и Высокие Технологии',
      en: '💻 IT & High Technology',
      tg: '💻 IT ва Технологияҳои Нав',
    },
    promptContexts: {
      uz: 'Taqdimot IT va yangi texnologiyalar bo\'yicha. Zamonaviy dasturiy yechimlar, arxitektura, kiberxavfsizlik va kelajak texnologiyalariga chuqur e\'tibor qarating.',
      ru: 'Презентация посвящена информационным технологиям. Осветите архитектуру систем, алгоритмы, современные инструменты разработки и технологические перспективы.',
      en: 'The presentation is dedicated to software and IT engineering. Highlight system architectures, algorithmic models, cybersecurity, and future technological paradigms.',
      tg: 'Муаррифӣ ба технологияҳои иттилоотӣ бахшида шудааст. Ба сохтори барномаҳо, амнияти иттилоотӣ ва равандҳои нави рақамӣ диққат диҳед.',
    },
  },
  nature: {
    id: 'nature',
    names: {
      uz: '🌿 Tabiat va Qishloq xo\'jaligi',
      ru: '🌿 Экология и Агрономия',
      en: '🌿 Ecology & Agriculture',
      tg: '🌿 Экология ва Кишоварзӣ',
    },
    promptContexts: {
      uz: 'Taqdimot tabiat, ekologiya va qishloq xo\'jaligi mavzusida. Agrar innovatsiyalar, hosildorlik, biologik muvozanat va ekologik toza yondashuvlarni aks ettiring.',
      ru: 'Презентация охватывает экологию и аграрный сектор. Опишите агроинновации, устойчивое развитие, защиту биоразнообразия и экотехнологии.',
      en: 'The presentation addresses ecology and modern agriculture. Emphasize agricultural innovation, ecological balance, sustainable development, and natural preservation.',
      tg: 'Муаррифӣ ба масъалаҳои экологӣ ва соҳаи кишоварзӣ марбут аст. Навовариҳои аграрӣ, ҳифзи табиат ва устувории экологии муҳитро баррасӣ кунед.',
    },
  },
  general: {
    id: 'general',
    names: {
      uz: '🌟 Umumiy / Erkin',
      ru: '🌟 Общетематический / Универсальный',
      en: '🌟 General / Multidisciplinary',
      tg: '🌟 Умумӣ ва Гуногунсоҳа',
    },
    promptContexts: {
      uz: 'Taqdimot keng auditoriya uchun mo\'ljallangan, universal, sermazmun va chuqur tahliliy ma\'lumotlarga ega bo\'lsin.',
      ru: 'Презентация ориентирована на широкую аудиторию. Обеспечьте насыщенную подачу материала, глубокий анализ и четкие факты.',
      en: 'The presentation is designed for a versatile audience. Provide rich, insightful information, compelling analysis, and clear evidence.',
      tg: 'Муаррифӣ барои доираи васеи шунавандагон пешбинӣ шудааст. Маълумоти бой, таҳлили амиқ ва далелҳои мушаххасро пешниҳод намоед.',
    },
  }
};

export function getCategory(id, lang = 'uz') {
  const cat = categories[id] || categories.general;
  return {
    id: cat.id,
    name: cat.names?.[lang] || cat.names?.uz || 'Umumiy',
    promptContext: cat.promptContexts?.[lang] || cat.promptContexts?.uz || '',
  };
}
