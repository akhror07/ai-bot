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
  console.log(`[PPTX] ${slidesList.length} ta slayd uchun rasmlar parallel yuklanmoqda...`);

  const result = await Promise.all(
    slidesList.map(async (s, idx) => {
      let prompts = s.imagePrompts || (s.imagePrompt ? [s.imagePrompt] : []);
      if (!prompts || !prompts.length) {
        prompts = [
          idx === 0 ? `${mainTitle} cinematic high resolution photo 4k` : `${s.title || mainTitle} photography 4k`,
          `${s.title || mainTitle} visual background texture`
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
 * Professional PowerPoint (.pptx) taqdimot yaratadi:
 * - Har bir slaydda rasmlar mavjud.
 * - Navbatma-navbat: ba'zi slaydlarda to'liq FON rasmi (cinematic overlay bilan),
 *   ba'zi slaydlarda esa o'ng tomonda 2 ta alohida kartochkali rasmlar!
 * - Perexod animatsiyalari kiritilgan.
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

  // Rasmlarni yuklab olish
  const allSlideImages = await loadAllImages(slidesList, data.title || 'Taqdimot');

  // ================================================================
  // 1. MUQOVA SLAYDI (TITLE SLIDE) — Full Background yoki Hero
  // ================================================================
  const titleData = slidesList[0] || {};
  const coverImages = allSlideImages[0] || [];
  const titleSlide = pres.addSlide();
  const coverImg = coverImages[0] || null;
  const coverImg2 = coverImages[1] || null;

  if (coverImg) {
    // To'liq orqa fon rasmi
    titleSlide.addImage({
      data: coverImg,
      x: 0, y: 0, w: 13.333, h: 7.5,
    });
    // Matnlar 100% o'qilishi uchun quyuq yarim-shaffof overlay qatlami
    titleSlide.addShape(pres.ShapeType.rect, {
      x: 0, y: 0, w: 13.333, h: 7.5,
      fill: { color: theme.bg, transparency: 22 },
      line: { color: theme.bg, transparency: 22 },
    });
  } else {
    titleSlide.background = { color: theme.bg };
  }

  // Chap tomondagi aksent chiziq
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
      color: theme.text, align: 'center', valign: 'middle',
    });
  }

  // Agar 2-muqova rasmi bo'lsa, o'ng tomonda vizual karta
  if (coverImg2) {
    titleSlide.addShape(pres.ShapeType.roundRect, {
      x: 8.0, y: 1.2, w: 4.5, h: 5.0,
      fill: { color: theme.cardBg }, line: { color: theme.primary, width: 1.5 }, rectRadius: 0.15,
    });
    titleSlide.addImage({ data: coverImg2, x: 8.1, y: 1.3, w: 4.3, h: 4.8, rounding: true });
  }

  const textW = coverImg2 ? 6.7 : 11.3;

  titleSlide.addText(data.title || titleData.title || 'Taqdimot', {
    x: 1.0, y: 1.9, w: textW, h: 2.3,
    fontFace: 'Arial', fontSize: coverImg2 ? 30 : 36, bold: true,
    color: 'FFFFFF', valign: 'middle', wrap: true,
  });

  titleSlide.addText(data.subtitle || titleData.subtitle || 'Sun\'iy intellekt tomonidan tayyorlandi', {
    x: 1.0, y: 4.4, w: textW, h: 1.2,
    fontFace: 'Arial', fontSize: 17, color: theme.primary, valign: 'top', wrap: true,
  });

  titleSlide.addText(`Jami: ${slidesList.length} ta slayd • 16:9 Full HD • Sifatli rasmli`, {
    x: 1.0, y: 6.6, w: 6.0, h: 0.35,
    fontFace: 'Arial', fontSize: 10, color: theme.subtext,
  });

  if (titleData.speakerNotes) titleSlide.addNotes(titleData.speakerNotes);

  // ================================================================
  // 2. KONTENT SLAYDLARI — Navbatma-navbat Fonli va Kartochkali
  // ================================================================
  const contentSlides = slidesList.slice(1);

  contentSlides.forEach((slideItem, index) => {
    const slideNumber = index + 2;
    const totalSlides = slidesList.length;
    const slide = pres.addSlide();

    const imgs = allSlideImages[index + 1] || [];
    const img1 = imgs[0] || null;
    const img2 = imgs[1] || null;

    const points = slideItem.points || [];
    const hasHighlight = !!slideItem.highlight;

    // USLUB TANLASH:
    // Toq indekslarda (index % 2 === 1): TO'LIQ FON RASMI (FULL BACKGROUND SLIDE)
    // Juft indekslarda (index % 2 === 0): O'NG TOMONDA 2 TA RASM (DUAL-IMAGE CARD SLIDE)
    const isFullBackground = (index % 2 === 1) && img1;

    // ────────────────────────────────────────────────────────────────
    // VARIANT 1: TO'LIQ FON RASMI BILAN (FULL BACKGROUND SLIDE)
    // ────────────────────────────────────────────────────────────────
    if (isFullBackground) {
      // 1. Fon rasmi
      slide.addImage({ data: img1, x: 0, y: 0, w: 13.333, h: 7.5 });

      // 2. Qorong'i overlay qatlami
      slide.addShape(pres.ShapeType.rect, {
        x: 0, y: 0, w: 13.333, h: 7.5,
        fill: { color: theme.bg, transparency: 24 },
        line: { color: theme.bg, transparency: 24 },
      });

      // Sarlavha
      slide.addText(slideItem.title || `Slayd ${slideNumber}`, {
        x: 0.8, y: 0.45, w: 11.73, h: 0.7,
        fontFace: 'Arial', fontSize: 24, bold: true,
        color: theme.primary, valign: 'top', wrap: true,
      });

      if (slideItem.subtitle) {
        slide.addText(slideItem.subtitle, {
          x: 0.8, y: 1.15, w: 11.73, h: 0.35,
          fontFace: 'Arial', fontSize: 13, color: '#E2E8F0', valign: 'top', wrap: true,
        });
      }

      slide.addShape(pres.ShapeType.line, {
        x: 0.8, y: 1.55, w: 11.73, h: 0,
        line: { color: theme.primary, width: 1.5 },
      });

      // Shaffof kartochkalardagi matnlar (Glassmorphism kartochkalar)
      const count = Math.min(points.length, 3);
      const gap = 0.35;
      const cardW = (11.73 - gap * (count - 1)) / (count || 1);
      const cardY = 1.75;
      const cardH = hasHighlight ? 3.55 : 4.35;

      points.slice(0, 3).forEach((point, pIdx) => {
        const x = 0.8 + pIdx * (cardW + gap);

        slide.addShape(pres.ShapeType.roundRect, {
          x, y: cardY, w: cardW, h: cardH,
          fill: { color: theme.cardBg, transparency: 18 },
          line: { color: theme.border, width: 1.2 },
          rectRadius: 0.12,
        });

        slide.addShape(pres.ShapeType.roundRect, {
          x: x + 0.25, y: cardY + 0.25, w: 0.45, h: 0.45,
          fill: { color: theme.primary }, rectRadius: 0.1,
        });
        slide.addText(`${pIdx + 1}`, {
          x: x + 0.25, y: cardY + 0.25, w: 0.45, h: 0.45,
          fontFace: 'Arial', fontSize: 13, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle',
        });

        slide.addText(point.heading || '', {
          x: x + 0.25, y: cardY + 0.85, w: cardW - 0.5, h: 0.6,
          fontFace: 'Arial', fontSize: 15, bold: true, color: '#FFFFFF', valign: 'top', wrap: true,
        });
        slide.addText(point.description || '', {
          x: x + 0.25, y: cardY + 1.5, w: cardW - 0.5, h: cardH - 1.65,
          fontFace: 'Arial', fontSize: 12.5, color: '#E2E8F0', valign: 'top', wrap: true,
        });
      });

    // ────────────────────────────────────────────────────────────────
    // VARIANT 2: O'NG TOMONDA 2 TA RASM (DUAL-IMAGE CARD SLIDE)
    // ────────────────────────────────────────────────────────────────
    } else {
      slide.background = { color: theme.bg };

      // Sarlavha
      slide.addText(slideItem.title || `Slayd ${slideNumber}`, {
        x: 0.8, y: 0.45, w: 11.73, h: 0.7,
        fontFace: 'Arial', fontSize: 24, bold: true,
        color: theme.primary, valign: 'top', wrap: true,
      });

      if (slideItem.subtitle) {
        slide.addText(slideItem.subtitle, {
          x: 0.8, y: 1.15, w: 11.73, h: 0.35,
          fontFace: 'Arial', fontSize: 13, color: theme.subtext, valign: 'top', wrap: true,
        });
      }

      slide.addShape(pres.ShapeType.line, {
        x: 0.8, y: 1.55, w: 11.73, h: 0,
        line: { color: theme.border, width: 1 },
      });

      const contentY = 1.75;
      const contentH = hasHighlight ? 3.55 : 4.35;

      // Agar rasmlar mavjud bo'lsa
      if (img1 && img2) {
        const leftW = 6.8;
        const rightX = 8.0;
        const rightW = 4.53;
        const singleImgH = (contentH - 0.25) / 2;

        // O'ng tomonda 2 ta rasm
        slide.addShape(pres.ShapeType.roundRect, {
          x: rightX, y: contentY, w: rightW, h: singleImgH,
          fill: { color: theme.cardBg }, line: { color: theme.border, width: 1 }, rectRadius: 0.12,
        });
        slide.addImage({ data: img1, x: rightX + 0.08, y: contentY + 0.08, w: rightW - 0.16, h: singleImgH - 0.16, rounding: true });

        slide.addShape(pres.ShapeType.roundRect, {
          x: rightX, y: contentY + singleImgH + 0.25, w: rightW, h: singleImgH,
          fill: { color: theme.cardBg }, line: { color: theme.border, width: 1 }, rectRadius: 0.12,
        });
        slide.addImage({ data: img2, x: rightX + 0.08, y: contentY + singleImgH + 0.33, w: rightW - 0.16, h: singleImgH - 0.16, rounding: true });

        // Chap tomonda matn bloklari
        const count = Math.min(points.length, 3);
        const cardGap = 0.25;
        const cardH = (contentH - (count - 1) * cardGap) / (count || 1);

        points.slice(0, 3).forEach((point, pIdx) => {
          const y = contentY + pIdx * (cardH + cardGap);
          slide.addShape(pres.ShapeType.roundRect, {
            x: 0.8, y, w: leftW, h: cardH,
            fill: { color: theme.cardBg }, line: { color: theme.border, width: 1 }, rectRadius: 0.12,
          });
          slide.addShape(pres.ShapeType.roundRect, {
            x: 1.05, y: y + 0.15, w: 0.38, h: 0.38,
            fill: { color: theme.primary }, rectRadius: 0.1,
          });
          slide.addText(`${pIdx + 1}`, {
            x: 1.05, y: y + 0.15, w: 0.38, h: 0.38,
            fontFace: 'Arial', fontSize: 12, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle',
          });
          slide.addText(point.heading || '', {
            x: 1.55, y: y + 0.12, w: leftW - 1.8, h: 0.4,
            fontFace: 'Arial', fontSize: 14, bold: true, color: theme.text, wrap: true,
          });
          slide.addText(point.description || '', {
            x: 1.05, y: y + 0.55, w: leftW - 0.55, h: cardH - 0.65,
            fontFace: 'Arial', fontSize: 11.5, color: theme.subtext, valign: 'top', wrap: true,
          });
        });
      } else if (img1) {
        // 1 ta katta rasm o'ngda
        const leftW = 7.1;
        const rightX = 8.2;
        const rightW = 4.33;

        slide.addShape(pres.ShapeType.roundRect, {
          x: rightX, y: contentY, w: rightW, h: contentH,
          fill: { color: theme.cardBg }, line: { color: theme.primary, width: 1.5 }, rectRadius: 0.15,
        });
        slide.addImage({ data: img1, x: rightX + 0.1, y: contentY + 0.1, w: rightW - 0.2, h: contentH - 0.2, rounding: true });

        const count = Math.min(points.length, 3);
        const cardGap = 0.25;
        const cardH = (contentH - (count - 1) * cardGap) / (count || 1);

        points.slice(0, 3).forEach((point, pIdx) => {
          const y = contentY + pIdx * (cardH + cardGap);
          slide.addShape(pres.ShapeType.roundRect, {
            x: 0.8, y, w: leftW, h: cardH,
            fill: { color: theme.cardBg }, line: { color: theme.border, width: 1 }, rectRadius: 0.12,
          });
          slide.addShape(pres.ShapeType.roundRect, {
            x: 1.05, y: y + 0.15, w: 0.38, h: 0.38,
            fill: { color: theme.primary }, rectRadius: 0.1,
          });
          slide.addText(`${pIdx + 1}`, {
            x: 1.05, y: y + 0.15, w: 0.38, h: 0.38,
            fontFace: 'Arial', fontSize: 12, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle',
          });
          slide.addText(point.heading || '', {
            x: 1.55, y: y + 0.12, w: leftW - 1.8, h: 0.4,
            fontFace: 'Arial', fontSize: 14, bold: true, color: theme.text, wrap: true,
          });
          slide.addText(point.description || '', {
            x: 1.05, y: y + 0.55, w: leftW - 0.55, h: cardH - 0.65,
            fontFace: 'Arial', fontSize: 11.5, color: theme.subtext, valign: 'top', wrap: true,
          });
        });
      } else {
        // Rasm bo'lmasa 3 ustunli
        const count = Math.min(points.length, 3);
        const gap = 0.4;
        const cardW = (11.73 - gap * (count - 1)) / (count || 1);

        points.slice(0, 3).forEach((point, pIdx) => {
          const x = 0.8 + pIdx * (cardW + gap);
          slide.addShape(pres.ShapeType.roundRect, {
            x, y: contentY, w: cardW, h: contentH,
            fill: { color: theme.cardBg }, line: { color: theme.border, width: 1 }, rectRadius: 0.12,
          });
          slide.addShape(pres.ShapeType.roundRect, {
            x: x + 0.25, y: contentY + 0.25, w: 0.45, h: 0.45,
            fill: { color: theme.primary }, rectRadius: 0.1,
          });
          slide.addText(`${pIdx + 1}`, {
            x: x + 0.25, y: contentY + 0.25, w: 0.45, h: 0.45,
            fontFace: 'Arial', fontSize: 13, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle',
          });
          slide.addText(point.heading || '', {
            x: x + 0.25, y: contentY + 0.85, w: cardW - 0.5, h: 0.6,
            fontFace: 'Arial', fontSize: 15, bold: true, color: theme.text, valign: 'top', wrap: true,
          });
          slide.addText(point.description || '', {
            x: x + 0.25, y: contentY + 1.5, w: cardW - 0.5, h: contentH - 1.65,
            fontFace: 'Arial', fontSize: 12, color: theme.subtext, valign: 'top', wrap: true,
          });
        });
      }
    }

    // Xulosa qutisi (Highlight)
    if (hasHighlight) {
      slide.addShape(pres.ShapeType.roundRect, {
        x: 0.8, y: 5.45, w: 11.73, h: 0.8,
        fill: { color: theme.cardBg, transparency: isFullBackground ? 15 : 0 },
        line: { color: theme.primary, width: 1.5 },
        rectRadius: 0.1,
      });

      slide.addText(`💡 Xulosa: ${slideItem.highlight}`, {
        x: 1.0, y: 5.45, w: 11.33, h: 0.8,
        fontFace: 'Arial', fontSize: 12.5, italic: true,
        color: '#FFFFFF',
        valign: 'middle', wrap: true,
      });
    }

    // Footer
    slide.addText(data.title || 'AI Prezentatsiya', {
      x: 0.8, y: 6.58, w: 8.0, h: 0.35,
      fontFace: 'Arial', fontSize: 10, color: theme.subtext, align: 'left',
    });
    slide.addText(`${slideNumber} / ${totalSlides}`, {
      x: 9.8, y: 6.58, w: 2.73, h: 0.35,
      fontFace: 'Arial', fontSize: 10, color: theme.subtext, align: 'right',
    });

    if (slideItem.speakerNotes) slide.addNotes(slideItem.speakerNotes);
  });

  // ================================================================
  // 3. PPTX HOSIL QILISH VA PEREXODLAR (TRANSITIONS) KIRITISH
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
