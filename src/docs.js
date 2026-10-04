import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import mammoth from 'mammoth';
import fs from 'fs';

/**
 * Hujjat fayllaridan (PDF, DOCX, TXT) toza matnni ajratib oladi.
 * @param {string|Buffer} source - Fayl yo'li yoki Buffer
 * @param {string} fileExt - Fayl kengaytmasi (.pdf, .docx, .txt)
 * @returns {Promise<string>}
 */
export async function extractTextFromDocument(source, fileExt) {
  const ext = (fileExt || '').toLowerCase();
  const buffer = Buffer.isBuffer(source) ? source : fs.readFileSync(source);

  if (ext.endsWith('.pdf')) {
    const data = await pdfParse(buffer);
    return cleanExtractedText(data.text);
  }

  if (ext.endsWith('.docx') || ext.endsWith('.doc')) {
    const result = await mammoth.extractRawText({ buffer });
    return cleanExtractedText(result.value);
  }

  if (ext.endsWith('.txt')) {
    return cleanExtractedText(buffer.toString('utf-8'));
  }

  throw new Error(`Qo'llab-quvvatlanmaydigan fayl formati: ${ext}. Iltimos, PDF, Word (.docx) yoki TXT yuboring.`);
}

function cleanExtractedText(text) {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .substring(0, 12000); // 12,000 belgigacha optimal kontekst
}
