import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pptxgen = require('pptxgenjs');
import JSZip from 'jszip';
import path from 'path';
import fs from 'fs';
import { getTheme } from './themes.js';
import { fetchContextualImage } from './images.js';

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
        prompts = [
          idx === 0 ? `${mainTitle} concept photo` : `${s.title || mainTitle} illustration photo`,
          `${mainTitle} professional visual`
        ];
      }
      const images = await Promise.all(
        prompts.slice(0, 2).map(p => fetchContextualImage(p))
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
    },
  };
  return dict[lang] || dict.uz;
}

/**
 * Har bir slayd uchun standart sarlavha paneli (xatlar ramkadan chiqmaydigan qilib)
 */
function addSlideHeader(slide, pres, theme, title, subtitle, slideNumber, totalSlides, i18n = null) {
  const slideWord = i18n?.slide || 'Slayd';
  // Sarlavha (fit: 'shrink' bilan matn uzun bo'lsa avtomatik moslashadi)
  slide.addText(title || `${slideWord} ${slideNumber}`, {
    x: 0.8, y: 0.45, w: 9.8, h: 0.65,
    fontFace: 'Arial', fontSize: 22, bold: true,
    color: theme.primary, valign: 'middle', wrap: true, fit: 'shrink',
  });

  // Slayd raqami nishoni
  slide.addShape(pres.ShapeType.roundRect, {
    x: 10.9, y: 0.45, w: 1.63, h: 0.42,
    fill: { color: theme.cardBg },
    line: { color: theme.border, width: 1 },
    rectRadius: 0.1,
  });
  slide.addText(`${slideNumber} / ${totalSlides}`, {
    x: 10.9, y: 0.45, w: 1.63, h: 0.42,
    fontFace: 'Arial', fontSize: 11, bold: true,
    color: theme.subtext, align: 'center', valign: 'middle', fit: 'shrink',
  });

  // Kichik sarlavha (subtitle)
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.8, y: 1.12, w: 11.73, h: 0.35,
      fontFace: 'Arial', fontSize: 12, color: theme.subtext, valign: 'top', wrap: true, fit: 'shrink',
    });
  }

  // Ajratuvchi chiziq
  slide.addShape(pres.ShapeType.line, {
    x: 0.8, y: 1.50, w: 11.73, h: 0,
    line: { color: theme.border, width: 1.2 },
  });
}

/**
 * Xulosa bloki (Highlight) — qat'iy chegaralangan balandlik va fit: shrink bilan
 */
function addHighlightBox(slide, pres, theme, text, y = 5.52, isGlass = false, i18n = null) {
  if (!text) return;

  const prefix = i18n?.highlightPrefix || '💡 Xulosa: ';
  const boxH = 0.80;
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.8, y, w: 11.73, h: boxH,
    fill: { color: theme.cardBg, transparency: isGlass ? 15 : 0 },
    line: { color: theme.primary, width: 1.5 },
    rectRadius: 0.12,
  });

  slide.addText(`${prefix}${text}`, {
    x: 1.05, y: y + 0.05, w: 11.23, h: boxH - 0.1,
    fontFace: 'Arial', fontSize: 11.5, italic: true,
    color: '#FFFFFF',
    valign: 'middle', wrap: true, fit: 'shrink',
  });
}

/**
 * Pastki footer (Hech qanday keraksiz AI so'zlari yo'q)
 */
function addSlideFooter(slide, theme, mainTitle) {
  if (!mainTitle) return;
  slide.addText(mainTitle, {
    x: 0.8, y: 6.65, w: 8.0, h: 0.30,
    fontFace: 'Arial', fontSize: 9.5, color: theme.subtext, align: 'left', fit: 'shrink',
  });
}

// ================================================================
// ================================================================
// 1-LAYOUT: SPLIT HERO (Chapda rasm kartochkasi, O'ngda tahlil kartochkalari)
// ================================================================
function renderSplitHeroLayout(slide, pres, theme, item, num, total, img, data, i18n) {
  slide.background = { color: theme.bg };
  addSlideHeader(slide, pres, theme, item.title, item.subtitle, num, total, i18n);

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

  // Rasm ustidagi badge
  slide.addShape(pres.ShapeType.roundRect, {
    x: 1.05, y: contentY + 0.25, w: 2.3, h: 0.38,
    fill: { color: theme.bg, transparency: 15 },
    line: { color: theme.primary, width: 1 },
    rectRadius: 0.1,
  });
  slide.addText(i18n.mainVisual, {
    x: 1.05, y: contentY + 0.25, w: 2.3, h: 0.38,
    fontFace: 'Arial', fontSize: 9.5, bold: true, color: theme.primary, align: 'center', valign: 'middle', fit: 'shrink',
  });

  // O'ng tomon: 3 ta qulay tahlil kartochkasi
  const count = Math.min(points.length, 3) || 1;
  const gap = 0.18;
  const cardH = (contentH - (count - 1) * gap) / count;

  points.slice(0, 3).forEach((p, idx) => {
    const y = contentY + idx * (cardH + gap);

    slide.addShape(pres.ShapeType.roundRect, {
      x: rightX, y, w: rightW, h: cardH,
      fill: { color: theme.cardBg },
      line: { color: theme.border, width: 1 },
      rectRadius: 0.12,
    });

    slide.addShape(pres.ShapeType.roundRect, {
      x: rightX + 0.22, y: y + 0.16, w: 0.42, h: 0.42,
      fill: { color: theme.primary },
      rectRadius: 0.1,
    });
    slide.addText(`0${idx + 1}`, {
      x: rightX + 0.22, y: y + 0.16, w: 0.42, h: 0.42,
      fontFace: 'Arial', fontSize: 11, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle',
    });

    slide.addText([
      { text: `${p.heading || i18n.pointFallback(idx + 1)}\n`, options: { bold: true, fontSize: 13, color: '#FFFFFF' } },
      { text: p.description || '', options: { bold: false, fontSize: 11, color: theme.subtext } }
    ], {
      x: rightX + 0.75, y: y + 0.08, w: rightW - 0.95, h: cardH - 0.16,
      valign: 'middle', wrap: true, fit: 'shrink',
    });
  });

  if (hasHighlight) addHighlightBox(slide, pres, theme, item.highlight, 5.52, false, i18n);
  addSlideFooter(slide, theme, data.title);
}

// ================================================================
// 2-LAYOUT: 2-COLUMN COMPARISON (Ikki ustunli taqqoslash)
// ================================================================
function renderComparisonLayout(slide, pres, theme, item, num, total, img, data, i18n) {
  slide.background = { color: theme.bg };
  addSlideHeader(slide, pres, theme, item.title, item.subtitle, num, total, i18n);

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
  slide.addText(`🌟 ${item.leftHeading || i18n.leftDefault}`, {
    x: leftX + 0.2, y: contentY + 0.2, w: colW - 0.4, h: 0.55,
    fontFace: 'Arial', fontSize: 12, bold: true, color: '#FFFFFF', align: 'center', valign: 'middle', fit: 'shrink',
  });

  const p1 = points[0] || {};
  slide.addText([
    { text: `${p1.heading || i18n.leftDefault}\n\n`, options: { bold: true, fontSize: 14, color: '#FFFFFF' } },
    { text: p1.description || '', options: { bold: false, fontSize: 11.5, color: theme.subtext } }
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
  slide.addText(`🚀 ${item.rightHeading || i18n.rightDefault}`, {
    x: rightX + 0.2, y: contentY + 0.2, w: colW - 0.4, h: 0.55,
    fontFace: 'Arial', fontSize: 12, bold: true, color: theme.primary, align: 'center', valign: 'middle', fit: 'shrink',
  });

  const p2 = points[1] || points[0] || {};
  slide.addText([
    { text: `${p2.heading || i18n.rightDefault}\n\n`, options: { bold: true, fontSize: 14, color: '#FFFFFF' } },
    { text: p2.description || '', options: { bold: false, fontSize: 11.5, color: theme.subtext } }
  ], {
    x: rightX + 0.35, y: contentY + 0.95, w: colW - 0.7, h: contentH - 1.15,
    valign: 'top', wrap: true, fit: 'shrink',
  });

  if (hasHighlight) addHighlightBox(slide, pres, theme, item.highlight, 5.52, false, i18n);
  addSlideFooter(slide, theme, data.title);
}

// ================================================================
// 3-LAYOUT: DYNAMIC KPI & STATS (Ulkan raqamlar va ko'rsatkichlar)
// ================================================================
function renderKpiMetricsLayout(slide, pres, theme, item, num, total, img, data, i18n) {
  slide.background = { color: theme.bg };
  addSlideHeader(slide, pres, theme, item.title, item.subtitle, num, total, i18n);

  const points = item.points || [];
  const metrics = item.metrics || [
    { val: '+85%', label: i18n.kpiLabels[0], desc: points[0]?.heading || i18n.kpiDescs[0] },
    { val: '3.5x', label: i18n.kpiLabels[1], desc: points[1]?.heading || i18n.kpiDescs[1] },
    { val: 'TOP 1', label: i18n.kpiLabels[2], desc: points[2]?.heading || i18n.kpiDescs[2] }
  ];

  const hasHighlight = !!item.highlight;
  const contentY = 1.68;
  const contentH = hasHighlight ? 3.65 : 4.60;

  // 3 ta ulkan statistika kartochkasi
  const cardW = 3.65;
  const gap = 0.39;

  metrics.slice(0, 3).forEach((m, idx) => {
    const x = 0.8 + idx * (cardW + gap);

    slide.addShape(pres.ShapeType.roundRect, {
      x, y: contentY, w: cardW, h: contentH * 0.58,
      fill: { color: theme.cardBg },
      line: { color: idx === 0 ? theme.primary : theme.border, width: 1.5 },
      rectRadius: 0.14,
    });

    // Katta raqam
    slide.addText(m.val, {
      x: x + 0.2, y: contentY + 0.2, w: cardW - 0.4, h: 0.95,
      fontFace: 'Arial', fontSize: 34, bold: true,
      color: idx === 0 ? theme.primary : '#FFFFFF',
      align: 'center', valign: 'middle', fit: 'shrink',
    });

    // Qisqa nishon
    slide.addText(m.label || i18n.kpiLabels[idx % 3], {
      x: x + 0.2, y: contentY + 1.25, w: cardW - 0.4, h: 0.45,
      fontFace: 'Arial', fontSize: 11.5, bold: true,
      color: theme.subtext, align: 'center', valign: 'middle', fit: 'shrink',
    });

    // Tavsif
    slide.addText(m.desc || '', {
      x: x + 0.2, y: contentY + 1.75, w: cardW - 0.4, h: contentH * 0.58 - 1.85,
      fontFace: 'Arial', fontSize: 10, color: theme.subtext, align: 'center', valign: 'top', wrap: true, fit: 'shrink',
    });
  });

  // Pastki qator: Rasm yoki keng tahlil kartochkasi
  const bottomY = contentY + contentH * 0.58 + 0.22;
  const bottomH = contentH - (contentH * 0.58 + 0.22);

  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.8, y: bottomY, w: 11.73, h: bottomH,
    fill: { color: theme.cardBg },
    line: { color: theme.primary, width: 1 },
    rectRadius: 0.12,
  });

  slide.addText([
    { text: i18n.analysisSummary, options: { bold: true, fontSize: 12, color: theme.primary } },
    { text: points[0]?.description || i18n.analysisSummaryFallback, options: { bold: false, fontSize: 11, color: '#FFFFFF' } }
  ], {
    x: 1.1, y: bottomY + 0.05, w: 11.13, h: bottomH - 0.1,
    valign: 'middle', wrap: true, fit: 'shrink',
  });

  if (hasHighlight) addHighlightBox(slide, pres, theme, item.highlight, 5.52, false, i18n);
  addSlideFooter(slide, theme, data.title);
}

// ================================================================
// 4-LAYOUT: PROCESS TIMELINE (Gorizontal ketma-ket jarayon)
// ================================================================
function renderProcessTimelineLayout(slide, pres, theme, item, num, total, img, data, i18n) {
  slide.background = { color: theme.bg };
  addSlideHeader(slide, pres, theme, item.title, item.subtitle, num, total, i18n);

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

    slide.addText(p.heading || i18n.stepFallback(idx + 1), {
      x: x + 0.15, y: contentY + 0.95, w: cardW - 0.3, h: 0.60,
      fontFace: 'Arial', fontSize: 13, bold: true, color: theme.primary, align: 'center', valign: 'middle', wrap: true, fit: 'shrink',
    });

    slide.addText(p.description || '', {
      x: x + 0.2, y: contentY + 1.60, w: cardW - 0.4, h: contentH - 1.80,
      fontFace: 'Arial', fontSize: 11, color: theme.subtext, align: 'left', valign: 'top', wrap: true, fit: 'shrink',
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
  addSlideFooter(slide, theme, data.title);
}

// ================================================================
// 5-LAYOUT: 4-BOX MATRIX (2x2 To'rtburchak matritsa)
// ================================================================
function renderMatrixGridLayout(slide, pres, theme, item, num, total, img, data, i18n) {
  slide.background = { color: theme.bg };
  addSlideHeader(slide, pres, theme, item.title, item.subtitle, num, total, i18n);

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

    slide.addText([
      { text: `${p.heading || i18n.partFallback(i + 1)}\n`, options: { bold: true, fontSize: 12.5, color: '#FFFFFF' } },
      { text: p.description || i18n.partDesc, options: { bold: false, fontSize: 10.5, color: theme.subtext } }
    ], {
      x: x + 0.75, y: y + 0.08, w: cardW - 0.95, h: cardH - 0.16,
      valign: 'middle', wrap: true, fit: 'shrink',
    });
  }

  if (hasHighlight) addHighlightBox(slide, pres, theme, item.highlight, 5.52, false, i18n);
  addSlideFooter(slide, theme, data.title);
}

// ================================================================
// 6-LAYOUT: SPOTLIGHT CALLOUT (Bosh g'oya banneri + 2 ta karta)
// ================================================================
function renderSpotlightCalloutLayout(slide, pres, theme, item, num, total, img, data, i18n) {
  slide.background = { color: theme.bg };
  addSlideHeader(slide, pres, theme, item.title, item.subtitle, num, total, i18n);

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

  const spotlight = item.spotlightText || item.highlight || item.title || '';
  slide.addText([
    { text: i18n.spotlightPrefix, options: { bold: true, fontSize: 13, color: theme.primary } },
    { text: `"${spotlight}"`, options: { bold: false, italic: true, fontSize: 12, color: '#FFFFFF' } }
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

    slide.addText([
      { text: `${p.heading || i18n.pointFallback(idx + 1)}\n\n`, options: { bold: true, fontSize: 13, color: theme.primary } },
      { text: p.description || '', options: { bold: false, fontSize: 11, color: theme.subtext } }
    ], {
      x: x + 0.3, y: bottomY + 0.15, w: colW - 0.6, h: bottomH - 0.3,
      valign: 'top', wrap: true, fit: 'shrink',
    });
  });

  if (hasHighlight) addHighlightBox(slide, pres, theme, item.highlight, 5.52, false, i18n);
  addSlideFooter(slide, theme, data.title);
}

// ================================================================
// 7-LAYOUT: CINEMATIC FULL HERO (To'liq fon rasmi + shaffof kartalar)
// ================================================================
function renderCinematicLayout(slide, pres, theme, item, num, total, img, data, i18n) {
  if (img) {
    slide.addImage({ data: img, x: 0, y: 0, w: 13.333, h: 7.5 });
    slide.addShape(pres.ShapeType.rect, {
      x: 0, y: 0, w: 13.333, h: 7.5,
      fill: { color: theme.bg, transparency: 22 },
      line: { color: theme.bg, transparency: 22 },
    });
  } else {
    slide.background = { color: theme.bg };
  }

  addSlideHeader(slide, pres, theme, item.title, item.subtitle, num, total, i18n);

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
      fill: { color: theme.cardBg, transparency: 18 },
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
      fontFace: 'Arial', fontSize: 12, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle',
    });

    slide.addText(p.heading || i18n.pointFallback(idx + 1), {
      x: x + 0.2, y: contentY + 0.85, w: cardW - 0.4, h: 0.60,
      fontFace: 'Arial', fontSize: 14, bold: true, color: '#FFFFFF', valign: 'middle', wrap: true, fit: 'shrink',
    });

    slide.addText(p.description || '', {
      x: x + 0.2, y: contentY + 1.55, w: cardW - 0.4, h: contentH - 1.70,
      fontFace: 'Arial', fontSize: 11, color: '#E2E8F0', valign: 'top', wrap: true, fit: 'shrink',
    });
  });

  if (hasHighlight) addHighlightBox(slide, pres, theme, item.highlight, 5.52, true, i18n);
  addSlideFooter(slide, theme, data.title);
}

// ================================================================
// 8-LAYOUT: CONCLUSION & ACTION PLAN (Yakuniy xulosa va harakatlar)
// ================================================================
function renderConclusionLayout(slide, pres, theme, item, num, total, img, data, i18n) {
  slide.background = { color: theme.bg };
  addSlideHeader(slide, pres, theme, item.title || i18n.conclusionHeading, item.subtitle || '', num, total, i18n);

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
      fill: { color: theme.cardBg },
      line: { color: theme.primary, width: 1.2 },
      rectRadius: 0.12,
    });

    slide.addText('✅', {
      x: 1.05, y: y + 0.15, w: 0.40, h: 0.40,
      fontFace: 'Arial', fontSize: 16, valign: 'middle',
    });

    slide.addText([
      { text: `${p.heading || i18n.recommendation(idx + 1)}\n`, options: { bold: true, fontSize: 13, color: theme.primary } },
      { text: p.description || '', options: { bold: false, fontSize: 11, color: theme.text } }
    ], {
      x: 1.55, y: y + 0.08, w: leftW - 1.75, h: cardH - 0.16,
      valign: 'middle', wrap: true, fit: 'shrink',
    });
  });

  // O'ng tomon: Bosh xulosa bloki
  slide.addShape(pres.ShapeType.roundRect, {
    x: rightX, y: contentY, w: rightW, h: contentH,
    fill: { color: theme.cardBg },
    line: { color: theme.primary, width: 2 },
    rectRadius: 0.15,
  });

  slide.addText(i18n.conclusionHeading, {
    x: rightX + 0.35, y: contentY + 0.30, w: rightW - 0.7, h: 0.40,
    fontFace: 'Arial', fontSize: 14, bold: true, color: theme.primary, fit: 'shrink',
  });

  const mainConclusion = item.highlight || `${data.title}: ${i18n.conclusionSuccess}`;
  slide.addText(mainConclusion, {
    x: rightX + 0.35, y: contentY + 0.85, w: rightW - 0.7, h: 2.30,
    fontFace: 'Arial', fontSize: 13, italic: true, color: '#FFFFFF', valign: 'top', wrap: true, fit: 'shrink',
  });

  // Call to action
  slide.addShape(pres.ShapeType.roundRect, {
    x: rightX + 0.35, y: contentY + 3.35, w: rightW - 0.7, h: 0.90,
    fill: { color: theme.bg },
    line: { color: theme.border, width: 1 },
    rectRadius: 0.1,
  });
  slide.addText(i18n.conclusionSuccess, {
    x: rightX + 0.45, y: contentY + 3.35, w: rightW - 0.9, h: 0.90,
    fontFace: 'Arial', fontSize: 11, bold: true, color: theme.primary, align: 'center', valign: 'middle', wrap: true, fit: 'shrink',
  });

  addSlideFooter(slide, theme, data.title);
}

/**
 * Professional PowerPoint (.pptx) taqdimot yaratadi:
 * - 8 ta butunlay xilma-xil andoza
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

  const lang = data.language || 'uz';
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

  if (coverImg) {
    titleSlide.addImage({
      data: coverImg,
      x: 0, y: 0, w: 13.333, h: 7.5,
    });
    titleSlide.addShape(pres.ShapeType.rect, {
      x: 0, y: 0, w: 13.333, h: 7.5,
      fill: { color: theme.bg, transparency: 22 },
      line: { color: theme.bg, transparency: 22 },
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

  titleSlide.addText(data.title || titleData.title || '', {
    x: 1.0, y: 1.9, w: textW, h: 2.3,
    fontFace: 'Arial', fontSize: coverImg2 ? 30 : 36, bold: true,
    color: 'FFFFFF', valign: 'middle', wrap: true, fit: 'shrink',
  });

  if (data.subtitle || titleData.subtitle) {
    titleSlide.addText(data.subtitle || titleData.subtitle, {
      x: 1.0, y: 4.4, w: textW, h: 1.2,
      fontFace: 'Arial', fontSize: 16, color: theme.primary, valign: 'top', wrap: true, fit: 'shrink',
    });
  }

  titleSlide.addText(i18n.totalInfo(slidesList.length), {
    x: 1.0, y: 6.6, w: 8.0, h: 0.35,
    fontFace: 'Arial', fontSize: 10, color: theme.subtext, fit: 'shrink',
  });

  if (titleData.speakerNotes) titleSlide.addNotes(titleData.speakerNotes);

  // ================================================================
  // 2. KONTENT SLAYDLARI — 8 xil unikal layout rotatsiyasi!
  // ================================================================
  const contentSlides = slidesList.slice(1);
  const totalSlides = slidesList.length;

  const layoutRotator = [
    'split_hero',
    'comparison',
    'kpi_metrics',
    'process_timeline',
    'matrix_grid',
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
        case 'comparison':
          renderComparisonLayout(slide, pres, theme, slideItem, slideNumber, totalSlides, img1, data, i18n);
          break;
        case 'kpi_metrics':
          renderKpiMetricsLayout(slide, pres, theme, slideItem, slideNumber, totalSlides, img1, data, i18n);
          break;
        case 'process_timeline':
          renderProcessTimelineLayout(slide, pres, theme, slideItem, slideNumber, totalSlides, img1, data, i18n);
          break;
        case 'matrix_grid':
          renderMatrixGridLayout(slide, pres, theme, slideItem, slideNumber, totalSlides, img1, data, i18n);
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
