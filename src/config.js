import dotenv from 'dotenv';
dotenv.config();

if (!process.env.BOT_TOKEN) {
  console.error("Xatolik: BOT_TOKEN topilmadi! .env faylini tekshiring.");
  process.exit(1);
}

if (!process.env.GEMINI_API_KEY) {
  console.error("Xatolik: GEMINI_API_KEY topilmadi! .env faylini tekshiring.");
  process.exit(1);
}

export const config = {
  botToken: process.env.BOT_TOKEN,
  geminiApiKey: process.env.GEMINI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || '',
  openrouterApiKey: process.env.OPENROUTER_API_KEY || '',
  port: parseInt(process.env.PORT || '3000', 10),
  miniAppUrl: process.env.RENDER_EXTERNAL_URL || process.env.MINI_APP_URL || (process.env.PORT ? 'https://ahrori-ai-bot.onrender.com' : `http://localhost:${process.env.PORT || 3000}`),
  adminId: String(process.env.ADMIN_ID || '8388288136'),
  channelUsername: process.env.CHANNEL_USERNAME || 'ahroriAI',
  botUsername: 'ai_slide_bot',
};

