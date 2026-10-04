import { generatePresentationData } from './ai.js';
import { createPptx } from './pptx.js';

async function test() {
  console.log("1. Gemini AI orqali slayd ma'lumotlari olinmoqda...");
  const data = await generatePresentationData({
    topic: "Sun'iy intellektning ta'limdagi o'rni",
    slideCount: 4,
    language: 'uz',
    theme: 'ocean'
  });

  console.log("Gemini muvaffaqiyatli javob qaytardi!");
  console.log("Sarlavha:", data.title);
  console.log("Slaydlar soni:", data.slides?.length);

  console.log("2. PowerPoint .pptx fayli yaratilmoqda...");
  const result = await createPptx(data);
  console.log("Fayl yaratildi:", result.filePath);
}

test().catch(err => {
  console.error("Test xatosi:", err);
  process.exit(1);
});
