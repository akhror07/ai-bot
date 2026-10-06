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

// 8 xil silliq perexod (transition) animatsiyalari
const TRANSITIONS = [
  '<p:fade/>',
  '<p:push dir="l"/>',
  '<p:wipe dir="r"/>',
  '<p:split orient="horz"/>',
  '<p:push dir="r"/>',
  '<p:wipe dir="l"/>',
  '<p:fade/>',
  '<p:split orient="vert"/>',
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

/**
 * Har bir slayd uchun standart sarlavha paneli (xatlar ramkadan chiqmaydigan qilib)
 */
function addSlideHeader(slide, pres, theme, title, subtitle, slideNumber, totalSlides) {
  // Sarlavha (fit: 'shrink' bilan matn uzun bo'lsa avtomatik moslashadi)
  slide.addText(title || `Slayd ${slideNumber}`, {
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
function addHighlightBox(slide, pres, theme, text, y = 5.52, isGlass = false) {
  if (!text) return;

  const boxH = 0.80;
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.8, y, w: 11.73, h: boxH,
    fill: { color: theme.cardBg, transparency: isGlass ? 15 : 0 },
    line: { color: theme.primary, width: 1.5 },
    rectRadius: 0.12,
  });

  slide.addText(`💡 Xulosa: ${text}`, {
    x: 1.05, y: y + 0.05, w: 11.23, h: boxH - 0.1,
    fontFace: 'Arial', fontSize: 11.5, italic: true,
    color: '#FFFFFF',
    valign: 'middle', wrap: true, fit: 'shrink',
  });
}

/**
 * Pastki footer
 */
function addSlideFooter(slide, theme, mainTitle) {
  slide.addText(mainTitle || 'AI Taqdimot', {
    x: 0.8, y: 6.65, w: 8.0, h: 0.30,
    fontFace: 'Arial', fontSize: 9.5, color: theme.subtext, align: 'left', fit: 'shrink',
  });
}

// ================================================================
// 1-LAYOUT: SPLIT VIEW (Chapda kartochkalar, O'ngda sifatli media)
// ================================================================
function renderSplitLayout(slide, pres, theme, item, num, total, img, data) {
  slide.background = { color: theme.bg };
  addSlideHeader(slide, pres, theme, item.title, item.subtitle, num, total);

  const points = item.points || [];
  const hasHighlight = !!item.highlight;
  const contentY = 1.68;
  const contentH = hasHighlight ? 3.65 : 4.60;

  const leftW = 6.8;
  const rightX = 7.85;
  const rightW = 4.68;

  // Chap tomon: Kartochkalar
  const count = Math.min(points.length, 3) || 1;
  const gap = 0.18;
  const cardH = (contentH - (count - 1) * gap) / count;

  points.slice(0, 3).forEach((p, idx) => {
    const y = contentY + idx * (cardH + gap);

    // Kartochka foni
    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8, y, w: leftW, h: cardH,
      fill: { color: theme.cardBg },
      line: { color: theme.border, width: 1 },
      rectRadius: 0.12,
    });

    // Raqam badge
    slide.addShape(pres.ShapeType.roundRect, {
      x: 1.02, y: y + 0.16, w: 0.42, h: 0.42,
      fill: { color: theme.primary },
      rectRadius: 0.1,
    });
    slide.addText(`0${idx + 1}`, {
      x: 1.02, y: y + 0.16, w: 0.42, h: 0.42,
      fontFace: 'Arial', fontSize: 11, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle',
    });

    // Birlashtirilgan matn bloki (fit: 'shrink' bilan — hech qachon ramkadan chiqmaydi!)
    slide.addText([
      { text: `${p.heading || `Tahlil ${idx + 1}`}\n`, options: { bold: true, fontSize: 13, color: '#FFFFFF' } },
      { text: p.description || '', options: { bold: false, fontSize: 11, color: theme.subtext } }
    ], {
      x: 1.55, y: y + 0.08, w: leftW - 1.75, h: cardH - 0.16,
      valign: 'middle', wrap: true, fit: 'shrink',
    });
  });

  // O'ng tomon: Katta ramkali media kartochkasi
  slide.addShape(pres.ShapeType.roundRect, {
    x: rightX, y: contentY, w: rightW, h: contentH,
    fill: { color: theme.cardBg },
    line: { color: theme.primary, width: 1.5 },
    rectRadius: 0.14,
  });

  if (img) {
    slide.addImage({
      data: img,
      x: rightX + 0.08, y: contentY + 0.08,
      w: rightW - 0.16, h: contentH - 0.16,
      rounding: true,
    });
  } else {
    slide.addText('🎯 Asosiy Tushuncha', {
      x: rightX, y: contentY, w: rightW, h: contentH,
      fontFace: 'Arial', fontSize: 16, bold: true, color: theme.primary, align: 'center', valign: 'middle', fit: 'shrink',
    });
  }

  // Rasm ustidagi nishon
  slide.addShape(pres.ShapeType.roundRect, {
    x: rightX + 0.25, y: contentY + 0.25, w: 2.1, h: 0.38,
    fill: { color: theme.bg, transparency: 15 },
    line: { color: theme.primary, width: 1 },
    rectRadius: 0.1,
  });
  slide.addText('📌 ASOSIY TAHLIL', {
    x: rightX + 0.25, y: contentY + 0.25, w: 2.1, h: 0.38,
    fontFace: 'Arial', fontSize: 9.5, bold: true, color: theme.primary, align: 'center', valign: 'middle',
  });

  if (hasHighlight) addHighlightBox(slide, pres, theme, item.highlight);
  addSlideFooter(slide, theme, data.title);
}

// ================================================================
// 2-LAYOUT: REVERSE SPLIT VIEW (Chapda rasm, O'ngda kartochkalar)
// ================================================================
function renderReverseSplitLayout(slide, pres, theme, item, num, total, img, data) {
  slide.background = { color: theme.bg };
  addSlideHeader(slide, pres, theme, item.title, item.subtitle, num, total);

  const points = item.points || [];
  const hasHighlight = !!item.highlight;
  const contentY = 1.68;
  const contentH = hasHighlight ? 3.65 : 4.60;

  const leftX = 0.8;
  const leftW = 4.68;
  const rightX = 5.73;
  const rightW = 6.8;

  // Chap tomon: Rasm kartochkasi
  slide.addShape(pres.ShapeType.roundRect, {
    x: leftX, y: contentY, w: leftW, h: contentH,
    fill: { color: theme.cardBg },
    line: { color: theme.primary, width: 1.5 },
    rectRadius: 0.14,
  });

  if (img) {
    slide.addImage({
      data: img,
      x: leftX + 0.08, y: contentY + 0.08,
      w: leftW - 0.16, h: contentH - 0.16,
      rounding: true,
    });
  }

  // Rasm ustidagi nishon
  slide.addShape(pres.ShapeType.roundRect, {
    x: leftX + 0.25, y: contentY + 0.25, w: 2.3, h: 0.38,
    fill: { color: theme.bg, transparency: 15 },
    line: { color: theme.primary, width: 1 },
    rectRadius: 0.1,
  });
  slide.addText('🎯 AMALIY YECHIM', {
    x: leftX + 0.25, y: contentY + 0.25, w: 2.3, h: 0.38,
    fontFace: 'Arial', fontSize: 9.5, bold: true, color: theme.primary, align: 'center', valign: 'middle',
  });

  // O'ng tomon: Kartochkalar
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

    // Chap aksent chiziq
    slide.addShape(pres.ShapeType.rect, {
      x: rightX, y: y + 0.1, w: 0.12, h: cardH - 0.2,
      fill: { color: theme.primary },
      line: { color: theme.primary },
    });

    slide.addText([
      { text: `0${idx + 1}. ${p.heading || ''}\n`, options: { bold: true, fontSize: 13, color: '#FFFFFF' } },
      { text: p.description || '', options: { bold: false, fontSize: 11, color: theme.subtext } }
    ], {
      x: rightX + 0.32, y: y + 0.08, w: rightW - 0.45, h: cardH - 0.16,
      valign: 'middle', wrap: true, fit: 'shrink',
    });
  });

  if (hasHighlight) addHighlightBox(slide, pres, theme, item.highlight);
  addSlideFooter(slide, theme, data.title);
}

// ================================================================
// 3-LAYOUT: 3-COLUMN PILLARS GRID (3 ta teng kuchli ustun)
// ================================================================
function renderThreeColumnsLayout(slide, pres, theme, item, num, total, img, data) {
  slide.background = { color: theme.bg };
  addSlideHeader(slide, pres, theme, item.title, item.subtitle, num, total);

  const points = item.points || [];
  const hasHighlight = !!item.highlight;
  const contentY = 1.68;
  const contentH = hasHighlight ? 3.65 : 4.60;

  const count = Math.min(points.length, 3) || 3;
  const gap = 0.35;
  const cardW = (11.73 - gap * (count - 1)) / count;

  points.slice(0, 3).forEach((p, idx) => {
    const x = 0.8 + idx * (cardW + gap);

    // Asosiy ustun kartochkasi
    slide.addShape(pres.ShapeType.roundRect, {
      x, y: contentY, w: cardW, h: contentH,
      fill: { color: theme.cardBg },
      line: { color: theme.border, width: 1.2 },
      rectRadius: 0.14,
    });

    // Yuqori aksent qopqoq
    slide.addShape(pres.ShapeType.rect, {
      x: x + 0.05, y: contentY + 0.05, w: cardW - 0.1, h: 0.08,
      fill: { color: theme.primary },
      line: { color: theme.primary },
    });

    // Raqam badge
    slide.addShape(pres.ShapeType.roundRect, {
      x: x + 0.22, y: contentY + 0.25, w: 0.5, h: 0.5,
      fill: { color: theme.primary },
      rectRadius: 0.12,
    });
    slide.addText(`0${idx + 1}`, {
      x: x + 0.22, y: contentY + 0.25, w: 0.5, h: 0.5,
      fontFace: 'Arial', fontSize: 12, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle',
    });

    // Sarlavha
    slide.addText(p.heading || `Yo'nalish ${idx + 1}`, {
      x: x + 0.2, y: contentY + 0.90, w: cardW - 0.4, h: 0.65,
      fontFace: 'Arial', fontSize: 13.5, bold: true, color: '#FFFFFF', valign: 'middle', wrap: true, fit: 'shrink',
    });

    // Bo'luvchi chiziq
    slide.addShape(pres.ShapeType.line, {
      x: x + 0.2, y: contentY + 1.65, w: cardW - 0.4, h: 0,
      line: { color: theme.border, width: 1 },
    });

    // Batafsil matn (fit: 'shrink' bilan)
    slide.addText(p.description || '', {
      x: x + 0.2, y: contentY + 1.80, w: cardW - 0.4, h: contentH - 1.95,
      fontFace: 'Arial', fontSize: 11, color: theme.subtext, valign: 'top', wrap: true, fit: 'shrink',
    });
  });

  if (hasHighlight) addHighlightBox(slide, pres, theme, item.highlight);
  addSlideFooter(slide, theme, data.title);
}

// ================================================================
// 4-LAYOUT: TIMELINE / PROCESS STEPS (Bosqichma-bosqich jarayon)
// ================================================================
function renderTimelineProcessLayout(slide, pres, theme, item, num, total, img, data) {
  slide.background = { color: theme.bg };
  addSlideHeader(slide, pres, theme, item.title, item.subtitle, num, total);

  const points = item.points || [];
  const hasHighlight = !!item.highlight;
  const contentY = 1.75;
  const contentH = hasHighlight ? 3.55 : 4.45;

  const count = Math.min(points.length, 3) || 3;
  const gap = 0.42;
  const cardW = (11.73 - gap * (count - 1)) / count;

  // Gorizontal jarayon chizig'i
  slide.addShape(pres.ShapeType.line, {
    x: 1.5, y: contentY + 0.4, w: 10.33, h: 0,
    line: { color: theme.primary, width: 2.5 },
  });

  points.slice(0, 3).forEach((p, idx) => {
    const x = 0.8 + idx * (cardW + gap);

    // Bosqich doirasi
    slide.addShape(pres.ShapeType.roundRect, {
      x: x + cardW / 2 - 0.5, y: contentY + 0.15, w: 1.0, h: 0.5,
      fill: { color: theme.primary },
      line: { color: '#FFFFFF', width: 2 },
      rectRadius: 0.2,
    });
    slide.addText(`${idx + 1}-QADAM`, {
      x: x + cardW / 2 - 0.5, y: contentY + 0.15, w: 1.0, h: 0.5,
      fontFace: 'Arial', fontSize: 9.5, bold: true, color: '#FFFFFF', align: 'center', valign: 'middle',
    });

    // Pastdagi karta
    slide.addShape(pres.ShapeType.roundRect, {
      x, y: contentY + 0.85, w: cardW, h: contentH - 0.85,
      fill: { color: theme.cardBg },
      line: { color: theme.border, width: 1.2 },
      rectRadius: 0.14,
    });

    slide.addText(p.heading || `Bosqich ${idx + 1}`, {
      x: x + 0.15, y: contentY + 1.00, w: cardW - 0.3, h: 0.60,
      fontFace: 'Arial', fontSize: 13, bold: true, color: theme.primary, align: 'center', valign: 'middle', wrap: true, fit: 'shrink',
    });

    slide.addText(p.description || '', {
      x: x + 0.2, y: contentY + 1.65, w: cardW - 0.4, h: contentH - 1.85,
      fontFace: 'Arial', fontSize: 11, color: theme.subtext, align: 'left', valign: 'top', wrap: true, fit: 'shrink',
    });
  });

  if (hasHighlight) addHighlightBox(slide, pres, theme, item.highlight);
  addSlideFooter(slide, theme, data.title);
}

// ================================================================
// 5-LAYOUT: KPI & METRICS FOCUS (Statistika va ko'rsatkichlar)
// ================================================================
function renderMetricStatsLayout(slide, pres, theme, item, num, total, img, data) {
  slide.background = { color: theme.bg };
  addSlideHeader(slide, pres, theme, item.title, item.subtitle, num, total);

  const points = item.points || [];
  const hasHighlight = !!item.highlight;
  const contentY = 1.68;
  const contentH = hasHighlight ? 3.65 : 4.60;

  const leftW = 5.2;
  const rightX = 6.25;
  const rightW = 6.28;

  // Chap tomon: 2 ta ulkan ko'rsatkich kartasi
  const statBoxH = (contentH - 0.22) / 2;

  // 1-Stat karta
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.8, y: contentY, w: leftW, h: statBoxH,
    fill: { color: theme.cardBg },
    line: { color: theme.primary, width: 1.5 },
    rectRadius: 0.14,
  });
  slide.addText('85%', {
    x: 1.05, y: contentY + 0.12, w: leftW - 0.5, h: 0.65,
    fontFace: 'Arial', fontSize: 32, bold: true, color: theme.primary, valign: 'middle', fit: 'shrink',
  });
  slide.addText(points[0]?.heading || 'Asosiy samaradorlik ko\'rsatkichi', {
    x: 1.05, y: contentY + 0.82, w: leftW - 0.5, h: statBoxH - 0.95,
    fontFace: 'Arial', fontSize: 11.5, color: theme.text, valign: 'top', wrap: true, fit: 'shrink',
  });

  // 2-Stat karta
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.8, y: contentY + statBoxH + 0.22, w: leftW, h: statBoxH,
    fill: { color: theme.cardBg },
    line: { color: theme.border, width: 1.2 },
    rectRadius: 0.14,
  });
  slide.addText('TOP 1', {
    x: 1.05, y: contentY + statBoxH + 0.34, w: leftW - 0.5, h: 0.65,
    fontFace: 'Arial', fontSize: 28, bold: true, color: '#38BDF8', valign: 'middle', fit: 'shrink',
  });
  slide.addText(points[1]?.heading || 'Strategik ustuvor yo\'nalish', {
    x: 1.05, y: contentY + statBoxH + 1.04, w: leftW - 0.5, h: statBoxH - 1.15,
    fontFace: 'Arial', fontSize: 11.5, color: theme.text, valign: 'top', wrap: true, fit: 'shrink',
  });

  // O'ng tomon: Rasm + tahlil kartasi
  if (img) {
    const imgH = contentH * 0.52;
    slide.addShape(pres.ShapeType.roundRect, {
      x: rightX, y: contentY, w: rightW, h: imgH,
      fill: { color: theme.cardBg },
      line: { color: theme.border, width: 1 },
      rectRadius: 0.12,
    });
    slide.addImage({
      data: img,
      x: rightX + 0.08, y: contentY + 0.08,
      w: rightW - 0.16, h: imgH - 0.16,
      rounding: true,
    });

    // Pastdagi tahlil bloki
    const subCardY = contentY + imgH + 0.18;
    const subCardH = contentH - imgH - 0.18;
    slide.addShape(pres.ShapeType.roundRect, {
      x: rightX, y: subCardY, w: rightW, h: subCardH,
      fill: { color: theme.cardBg },
      line: { color: theme.primary, width: 1 },
      rectRadius: 0.12,
    });
    slide.addText([
      { text: `${points[2]?.heading || 'Amaliy xulosa'}\n`, options: { bold: true, fontSize: 12.5, color: theme.primary } },
      { text: points[2]?.description || (points[0]?.description || ''), options: { bold: false, fontSize: 10.5, color: theme.subtext } }
    ], {
      x: rightX + 0.25, y: subCardY + 0.08, w: rightW - 0.5, h: subCardH - 0.16,
      valign: 'middle', wrap: true, fit: 'shrink',
    });
  } else {
    slide.addShape(pres.ShapeType.roundRect, {
      x: rightX, y: contentY, w: rightW, h: contentH,
      fill: { color: theme.cardBg },
      line: { color: theme.primary, width: 1.5 },
      rectRadius: 0.14,
    });
    slide.addText('Tahliliy Xulosalar', {
      x: rightX + 0.35, y: contentY + 0.3, w: rightW - 0.7, h: 0.45,
      fontFace: 'Arial', fontSize: 15, bold: true, color: theme.primary, fit: 'shrink',
    });
    slide.addText(points.map(p => `• ${p.heading}: ${p.description}`).join('\n\n'), {
      x: rightX + 0.35, y: contentY + 0.85, w: rightW - 0.7, h: contentH - 1.05,
      fontFace: 'Arial', fontSize: 11, color: theme.subtext, valign: 'top', wrap: true, fit: 'shrink',
    });
  }

  if (hasHighlight) addHighlightBox(slide, pres, theme, item.highlight);
  addSlideFooter(slide, theme, data.title);
}

// ================================================================
// 6-LAYOUT: CINEMATIC FULL HERO (Katta fon rasmi + shaffof kartalar)
// ================================================================
function renderCinematicHeroLayout(slide, pres, theme, item, num, total, img, data) {
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

  addSlideHeader(slide, pres, theme, item.title, item.subtitle, num, total);

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

    slide.addText(p.heading || '', {
      x: x + 0.2, y: contentY + 0.85, w: cardW - 0.4, h: 0.60,
      fontFace: 'Arial', fontSize: 14, bold: true, color: '#FFFFFF', valign: 'middle', wrap: true, fit: 'shrink',
    });

    slide.addText(p.description || '', {
      x: x + 0.2, y: contentY + 1.55, w: cardW - 0.4, h: contentH - 1.70,
      fontFace: 'Arial', fontSize: 11, color: '#E2E8F0', valign: 'top', wrap: true, fit: 'shrink',
    });
  });

  if (hasHighlight) addHighlightBox(slide, pres, theme, item.highlight, 5.52, true);
  addSlideFooter(slide, theme, data.title);
}

// ================================================================
// 7-LAYOUT: CONCLUSION & ACTION PLAN (Yakuniy xulosa slaydi)
// ================================================================
function renderConclusionLayout(slide, pres, theme, item, num, total, img, data) {
  slide.background = { color: theme.bg };
  addSlideHeader(slide, pres, theme, item.title || 'Yakuniy Xulosalar', item.subtitle || 'Kutilayotgan natijalar va strategik tavsiyalar', num, total);

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
      { text: `${p.heading || `Tavsiya ${idx + 1}`}\n`, options: { bold: true, fontSize: 13, color: theme.primary } },
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

  slide.addText('🎯 BOSH XULOSA', {
    x: rightX + 0.35, y: contentY + 0.30, w: rightW - 0.7, h: 0.40,
    fontFace: 'Arial', fontSize: 14, bold: true, color: theme.primary, fit: 'shrink',
  });

  const mainConclusion = item.highlight || `${data.title} bo'yicha tizimli yondashuv va innovatsion amaliyot eng yuqori natijani ta'minlaydi.`;
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
  slide.addText('🚀 Muvaffaqiyat kaliti: Doimiy rivojlanish va aniq harakatlar rejasi!', {
    x: rightX + 0.45, y: contentY + 3.35, w: rightW - 0.9, h: 0.90,
    fontFace: 'Arial', fontSize: 11, bold: true, color: theme.primary, align: 'center', valign: 'middle', wrap: true, fit: 'shrink',
  });

  addSlideFooter(slide, theme, data.title);
}

/**
 * Professional PowerPoint (.pptx) taqdimot yaratadi:
 * - 6 ta xilma-xil andoza
 * - 100% ramka ichida qoladigan matnlar (fit: 'shrink')
 * - Mavzuga 100% mos Unsplash & Wikimedia fotosuratlari
 */
export async function createPptx(data) {
  const pres = new pptxgen();
  pres.defineLayout({ name: 'WIDE_16_9', width: 13.333, height: 7.5 });
  pres.layout = 'WIDE_16_9';
  pres.author = 'AI Presentation Bot';
  pres.company = 'Telegram AI Bot';
  pres.title = data.title || 'Prezentatsiya';

  const theme = getTheme(data.theme);
  const slidesList = data.slides || [];

  // Mavzuga mos rasmlarni yuklab olish
  const allSlideImages = await loadAllImages(slidesList, data.title || 'Taqdimot');

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

  // Badge
  titleSlide.addShape(pres.ShapeType.roundRect, {
    x: 1.0, y: 1.0, w: 2.2, h: 0.45,
    fill: { color: theme.cardBg },
    line: { color: theme.border, width: 1 },
    rectRadius: 0.1,
  });
  titleSlide.addText('✨ AI TAQDIMOT', {
    x: 1.0, y: 1.0, w: 2.2, h: 0.45,
    fontFace: 'Arial', fontSize: 11, bold: true,
    color: theme.primary, align: 'center', valign: 'middle',
  });

  // Tashkilot / Universitet nomi (Branding)
  if (data.organization) {
    titleSlide.addShape(pres.ShapeType.roundRect, {
      x: 3.4, y: 1.0, w: 4.2, h: 0.45,
      fill: { color: theme.cardBg },
      line: { color: theme.border, width: 1 },
      rectRadius: 0.1,
    });
    titleSlide.addText(`🏢 ${data.organization}`, {
      x: 3.4, y: 1.0, w: 4.2, h: 0.45,
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

  titleSlide.addText(data.title || titleData.title || 'Taqdimot', {
    x: 1.0, y: 1.9, w: textW, h: 2.3,
    fontFace: 'Arial', fontSize: coverImg2 ? 30 : 36, bold: true,
    color: 'FFFFFF', valign: 'middle', wrap: true, fit: 'shrink',
  });

  titleSlide.addText(data.subtitle || titleData.subtitle || 'Sun\'iy intellekt tomonidan tayyorlandi', {
    x: 1.0, y: 4.4, w: textW, h: 1.2,
    fontFace: 'Arial', fontSize: 16, color: theme.primary, valign: 'top', wrap: true, fit: 'shrink',
  });

  titleSlide.addText(`Jami: ${slidesList.length} ta slayd • 16:9 Full HD • Professional Dizayn`, {
    x: 1.0, y: 6.6, w: 6.0, h: 0.35,
    fontFace: 'Arial', fontSize: 10, color: theme.subtext, fit: 'shrink',
  });

  if (titleData.speakerNotes) titleSlide.addNotes(titleData.speakerNotes);

  // ================================================================
  // 2. KONTENT SLAYDLARI — 6 xil tartibli layout rotatsiyasi!
  // ================================================================
  const contentSlides = slidesList.slice(1);
  const totalSlides = slidesList.length;

  contentSlides.forEach((slideItem, index) => {
    const slideNumber = index + 2;
    const isLast = (index === contentSlides.length - 1);
    const imgs = allSlideImages[index + 1] || [];
    const img1 = imgs[0] || null;

    const slide = pres.addSlide();

    if (isLast) {
      renderConclusionLayout(slide, pres, theme, slideItem, slideNumber, totalSlides, img1, data);
    } else {
      const layoutType = index % 6;
      switch (layoutType) {
        case 0:
          renderSplitLayout(slide, pres, theme, slideItem, slideNumber, totalSlides, img1, data);
          break;
        case 1:
          renderThreeColumnsLayout(slide, pres, theme, slideItem, slideNumber, totalSlides, img1, data);
          break;
        case 2:
          renderReverseSplitLayout(slide, pres, theme, slideItem, slideNumber, totalSlides, img1, data);
          break;
        case 3:
          renderTimelineProcessLayout(slide, pres, theme, slideItem, slideNumber, totalSlides, img1, data);
          break;
        case 4:
          renderMetricStatsLayout(slide, pres, theme, slideItem, slideNumber, totalSlides, img1, data);
          break;
        case 5:
          if (img1) {
            renderCinematicHeroLayout(slide, pres, theme, slideItem, slideNumber, totalSlides, img1, data);
          } else {
            renderSplitLayout(slide, pres, theme, slideItem, slideNumber, totalSlides, null, data);
          }
          break;
        default:
          renderSplitLayout(slide, pres, theme, slideItem, slideNumber, totalSlides, img1, data);
      }
    }

    if (slideItem.speakerNotes) slide.addNotes(slideItem.speakerNotes);
  });

  // ================================================================
  // 3. VIRAL BRANDING SLAYDI
  // ================================================================
  if (data.includeBranding !== false) {
    const brandSlide = pres.addSlide();
    brandSlide.background = { color: theme.bg };

    brandSlide.addShape(pres.ShapeType.rect, {
      x: 0, y: 0, w: 0.35, h: 7.5,
      fill: { color: theme.primary },
      line: { color: theme.primary },
    });

    brandSlide.addShape(pres.ShapeType.roundRect, {
      x: 2.2, y: 1.1, w: 8.933, h: 5.3,
      fill: { color: theme.cardBg },
      line: { color: theme.primary, width: 2 },
      rectRadius: 0.2,
    });

    brandSlide.addShape(pres.ShapeType.roundRect, {
      x: 4.6, y: 1.5, w: 4.133, h: 0.55,
      fill: { color: theme.primary },
      line: { color: theme.primary },
      rectRadius: 0.15,
    });
    brandSlide.addText('✨ E\'TIBORINGIZ UCHUN RAHMAT!', {
      x: 4.6, y: 1.5, w: 4.133, h: 0.55,
      fontFace: 'Arial', fontSize: 13, bold: true,
      color: '#FFFFFF', align: 'center', valign: 'middle',
    });

    brandSlide.addText(data.title || 'Taqdimot Yakuni', {
      x: 2.5, y: 2.3, w: 8.333, h: 1.1,
      fontFace: 'Arial', fontSize: 24, bold: true,
      color: '#FFFFFF', align: 'center', valign: 'middle', wrap: true, fit: 'shrink',
    });

    brandSlide.addText('Ushbu taqdimot sun\'iy intellekt (AI) yordamida tez va professional tayyorlandi.', {
      x: 2.5, y: 3.5, w: 8.333, h: 0.6,
      fontFace: 'Arial', fontSize: 13.5, color: theme.text, align: 'center', fit: 'shrink',
    });

    const botHandle = data.botUsername ? `@${data.botUsername}` : '@ai_slide_bot';
    const channelHandle = '@ahroriAI';

    brandSlide.addShape(pres.ShapeType.roundRect, {
      x: 3.0, y: 4.25, w: 7.333, h: 1.7,
      fill: { color: theme.bg },
      line: { color: theme.border, width: 1.5 },
      rectRadius: 0.15,
    });

    brandSlide.addText(`🚀 Siz ham bir necha daqiqada taqdimot yarating:\n👉 Telegram Bot: ${botHandle}\n📢 Rasmiy Kanal: ${channelHandle}\n💡 Mini App orqali professional slaydlar & tayyor nutq!`, {
      x: 3.1, y: 4.25, w: 7.133, h: 1.7,
      fontFace: 'Arial', fontSize: 12, bold: true,
      color: theme.primary, align: 'center', valign: 'middle', fit: 'shrink',
    });
  }

  // ================================================================
  // 4. PPTX HOSIL QILISH VA PEREXODLAR (TRANSITIONS)
  // ================================================================
  const rawBuffer = await pres.write({ outputType: 'nodebuffer' });
  const zip = await JSZip.loadAsync(rawBuffer);

  const slideFiles = Object.keys(zip.files)
    .filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => {
      const na = parseInt(a.match(/(\d+)/)[1]);
      const nb = parseInt(b.match(/(\d+)/)[1]);
      return na - nb;
    });

  for (let i = 0; i < slideFiles.length; i++) {
    const fname = slideFiles[i];
    let xml = await zip.file(fname).async('string');
    if (!xml.includes('<p:transition')) {
      const trans = TRANSITIONS[i % TRANSITIONS.length];
      xml = xml.replace('</p:sld>', `<p:transition spd="med">${trans}</p:transition></p:sld>`);
      zip.file(fname, xml);
    }
  }

  const finalBuffer = await zip.generateAsync({ type: 'nodebuffer' });

  const safeTitle = (data.title || 'taqdimot')
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, '_')
    .substring(0, 30);
  const fileName = `${safeTitle}_${Date.now()}.pptx`;
  const filePath = path.join(TEMP_DIR, fileName);

  fs.writeFileSync(filePath, finalBuffer);
  console.log(`[PPTX] Tayyor (${(finalBuffer.byteLength / 1024).toFixed(1)} KB): ${fileName}`);

  const speakerNotesList = slidesList.map(s => ({
    slideNumber: s.slideNumber,
    title: s.title,
    notes: s.speakerNotes || ''
  }));

  return { filePath, fileName, speakerNotesList };
}
