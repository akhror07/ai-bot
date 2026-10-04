import dotenv from 'dotenv';
dotenv.config();

const key = process.env.GEMINI_API_KEY;

try {
  let url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
  let allModels = [];
  while (url) {
    const res = await fetch(url);
    const data = await res.json();
    if (data.models) {
      allModels.push(...data.models);
    }
    if (data.nextPageToken) {
      url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}&pageToken=${data.nextPageToken}`;
    } else {
      url = null;
    }
  }

  const genModels = allModels
    .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
    .map(m => m.name.replace('models/', ''));

  console.log("Mavjud generateContent modellari:", genModels);
} catch (e) {
  console.error("Xatolik:", e);
}
