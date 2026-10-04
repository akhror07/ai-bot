import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from './config.js';

const genAI = new GoogleGenerativeAI(config.geminiApiKey);

/**
 * Telegram ovozli xabarini (OGG audio) Gemini yordamida tinglab,
 * taqdimot mavzusi, slaydlar soni va sohasini aniqlaydi.
 * @param {Buffer} audioBuffer - Ovoz fayli buferi
 * @returns {Promise<{ topic: string, slideCount: number, category: string }>}
 */
export async function processVoiceMessage(audioBuffer) {
  const base64Audio = audioBuffer.toString('base64');

  const prompt = `
Siz ovozli xabarni tahlil qiluvchi sun'iy intellektsiz.
Foydalanuvchi taqdimot (PowerPoint slayd) tayyorlash bo'yicha ovozli so'rov yubordi.
Ushbu audio yozuvni tinglang va foydalanuvchi qaysi mavzuda slayd so'rayotganini, necha betlik va qaysi sohada ekanligini aniqlang.

Faqat quyidagi JSON formatida javob bering:
{
  "topic": "Aniqlangan aniq va to'liq taqdimot mavzusi (o'zbek tilida)",
  "slideCount": 8, // Agar audio ichida 5, 10, 15 yoki 18 kabi son aytilgan bo'lsa o'sha son, aytilmagan bo'lsa 8
  "category": "education" // Quyidagilardan biri: "education" (ta'lim), "economy" (iqtisod), "medical" (tibbiyot), "tech" (IT), "nature" (tabiat), "general" (umumiy)
}
`;

  const candidateModels = [
    'gemini-3.7-flash',
    'gemini-3.8-flash',
    'gemini-3.5-flash',
    'gemini-flash-latest'
  ];

  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: 'application/json' }
      });

      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: 'audio/ogg',
            data: base64Audio
          }
        },
        prompt
      ]);

      const text = result.response.text();
      const parsed = JSON.parse(text);
      if (parsed && parsed.topic) {
        return {
          topic: parsed.topic,
          slideCount: Math.min(Math.max(parseInt(parsed.slideCount, 10) || 8, 3), 25),
          category: parsed.category || 'general'
        };
      }
    } catch (err) {
      console.warn(`[Voice] ${modelName} bilan xatolik:`, err.message);
    }
  }

  throw new Error("Ovozli xabarni tushunishda xatolik bo'ldi. Iltimos, qaytadan aniqroq gapiring yoki matn sifatida yozing.");
}
