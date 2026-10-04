export const categories = {
  education: {
    id: 'education',
    name: '🎓 Ta\'lim va O\'qituvchilar',
    desc: 'Pedagogika, dars ishlanmalari va o\'quv metodikasi',
    promptContext: 'Taqdimot ta\'lim sohasi, o\'qituvchilar va talabalar uchun mo\'ljallangan. Tushuntirishlar pedagogik, interaktiv, metodik jihatdan to\'g\'ri va dars uchun qulay bo\'lsin.',
  },
  economy: {
    id: 'economy',
    name: '💼 Iqtisodiyot va Moliya',
    desc: 'Biznes, marketing, investitsiya va bozor tahlili',
    promptContext: 'Taqdimot iqtisodiyot, biznes va moliya mutaxassislari uchun mo\'ljallangan. Statistik tahlil, ROI, rentabellik, bozor dinamikasi va amaliy biznes strategiyalariga urg\'u bering.',
  },
  medical: {
    id: 'medical',
    name: '🩺 Tibbiyot va Salomatlik',
    desc: 'Sog\'liqni saqlash, anatomiya va tibbiy tahlil',
    promptContext: 'Taqdimot tibbiyot va sog\'liqni saqlash sohasiga tegishli. Ilmiy asoslangan tibbiy atamalar, inson organizmiga ta\'siri va profilaktika choralariga aniq to\'xtaling.',
  },
  tech: {
    id: 'tech',
    name: '💻 IT va Texnologiya',
    desc: 'Dasturlash, kiberxavfsizlik va sun\'iy intellekt',
    promptContext: 'Taqdimot IT va yangi texnologiyalar bo\'yicha. Zamonaviy dasturiy yechimlar, arxitektura, kiberxavfsizlik va kelajak texnologiyalariga chuqur e\'tibor qarating.',
  },
  nature: {
    id: 'nature',
    name: '🌿 Tabiat va Qishloq xo\'jaligi',
    desc: 'Ekologiya, agrar soha va atrof-muhit',
    promptContext: 'Taqdimot tabiat, ekologiya va qishloq xo\'jaligi mavzusida. Agrar innovatsiyalar, hosildorlik, biologik muvozanat va ekologik toza yondashuvlarni aks ettiring.',
  },
  general: {
    id: 'general',
    name: '🌟 Umumiy / Erkin',
    desc: 'Har qanday universal mavzular uchun',
    promptContext: 'Taqdimot keng auditoriya uchun mo\'ljallangan, universal va qiziqarli tushuntirishlarga ega bo\'lsin.',
  }
};

export function getCategory(id) {
  return categories[id] || categories.general;
}
