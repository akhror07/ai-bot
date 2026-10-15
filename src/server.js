import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { InputFile, InlineKeyboard } from 'grammy';
import { generatePresentationData } from './ai.js';
import { createPptx } from './pptx.js';
import { bot, isUserSubscribedToChannel, isAdmin, BANNED_USER_IDS } from './bot.js';
import { config } from './config.js';
import {
  getUser,
  getOrCreateUser,
  deductCoin,
  addCoins,
  giveCoins,
  savePresentationRecord,
  getUserPresentations,
  getAllPresentations,
  getAllUsers,
  getStats,
  hasPendingPayment,
  createPayment,
  CARD_NUMBER,
  PRICE_PER_SLIDE,
  saveFeedback,
  getAllFeedbacks,
  ADMIN_TELEGRAM_USERNAME,
  claimChannelBonus,
  isUserVip,
  redeemPromoCode,
  getAllPromoCodes,
  getAllAdmins,
  addAdmin,
  removeAdmin,
} from './db.js';

export const app = express();

// 1. Xavfsizlik sarlavhalari (Security Headers)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'ALLOWALL'); // Telegram WebApp iframe uchun ruxsat
  next();
});

// 2. DoS va flood hujumlariga qarshi xotiradagi Rate Limiter
const rateLimitStore = new Map();

function createRateLimiter({ windowMs = 60 * 1000, max = 100, message = 'Juda ko\'p so\'rov yuborildi. Iltimos, biroz kuting.' }) {
  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || '127.0.0.1';
    const key = `${req.baseUrl || ''}${req.path}_${ip}`;
    const now = Date.now();
    const record = rateLimitStore.get(key) || { count: 0, resetTime: now + windowMs };

    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + windowMs;
    }

    record.count += 1;
    rateLimitStore.set(key, record);

    if (rateLimitStore.size > 5000) {
      for (const [k, v] of rateLimitStore.entries()) {
        if (now > v.resetTime) rateLimitStore.delete(k);
      }
    }

    if (record.count > max) {
      return res.status(429).json({ success: false, error: 'RATE_LIMIT_EXCEEDED', message });
    }
    next();
  };
}

const generalLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 120 });
const generateLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 12, message: 'Taqdimot yaratish bo\'yicha limit oshib ketdi. Iltimos, 1 daqiqa kuting.' });
const receiptLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 6, message: 'Iltimos, chek yuklashdan avval biroz kuting.' });

// 3. Telegram WebApp HMAC-SHA256 imzosi tekshiruvi (Kriptografik himoya)
export function validateTelegramWebAppData(initData, botToken) {
  if (!initData || typeof initData !== 'string') return null;
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    if (!hash) return null;
    urlParams.delete('hash');

    const params = Array.from(urlParams.entries())
      .map(([key, val]) => `${key}=${val}`)
      .sort()
      .join('\n');

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(params)
      .digest('hex');

    if (calculatedHash === hash) {
      const userStr = urlParams.get('user');
      return userStr ? JSON.parse(userStr) : {};
    }
  } catch (err) {
    console.warn('[Security] WebApp initData tekshirishda xato:', err.message);
  }
  return null;
}

// 4. Admin huquqini qat'iy tekshirish funksiyasi
export function verifyAdminAccess(req) {
  // A. Maxfiy secret token orqali
  const adminSecret = process.env.ADMIN_SECRET;
  const passedSecret = req.headers['x-admin-secret'] || req.query.secret || req.body?.secret;
  if (adminSecret && passedSecret && passedSecret === adminSecret) {
    return true;
  }

  // B. Kriptografik imzolangan Telegram initData orqali
  const initData = req.headers['x-telegram-init-data'] || req.query.initData || req.body?.initData;
  if (initData) {
    const tgUser = validateTelegramWebAppData(initData, config.botToken);
    if (tgUser?.id && isAdmin(tgUser.id)) {
      return true;
    }
  }

  // C. Telegram ID orqali (faqat ro'yxatdagi rasmiy admin IDlar uchun)
  const candidateId = req.query.adminId || req.body?.adminId;
  if (candidateId && isAdmin(candidateId)) {
    return true;
  }

  return false;
}

app.use(cors());
app.use(generalLimiter);
app.use(express.json({ limit: '10mb' })); // 10mb xavfsiz chegara

// Frontend Mini App statik fayllari (Keshlanib qolmasligi uchun no-cache sarlavhalari bilan)
app.use(express.static(path.resolve('public'), {
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

const TEMP_DIR = path.resolve('temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Health check & Ping (Render Free Tier doim uyg'oq turishi uchun)
app.get('/api/ping', (req, res) => res.json({ status: 'ok', time: Date.now() }));
app.get('/api/health', (req, res) => res.json({ status: 'healthy', uptime: process.uptime() }));

// Render Free Tier doim uyg'oq saqlash (Keep-Alive Heartbeat: har 4 daqiqada)
const targetUrl = process.env.RENDER_EXTERNAL_URL || config.miniAppUrl || 'https://ahrori-ai-bot.onrender.com';
if (targetUrl && typeof targetUrl === 'string' && targetUrl.startsWith('http') && !targetUrl.includes('localhost')) {
  const cleanPingUrl = `${targetUrl.replace(/\/$/, '')}/api/ping`;
  console.log(`[Keep-Alive] Render uyg'otish xizmati faol: ${cleanPingUrl}`);
  setInterval(async () => {
    try {
      await fetch(cleanPingUrl);
      console.log(`[Keep-Alive] Render uyg'oq saqlandi (${new Date().toLocaleTimeString()})`);
    } catch (_) {}
  }, 4 * 60 * 1000);
}

// 0. API: Foydalanuvchi balansi va holatini olish
app.get('/api/user/:userId', async (req, res) => {
  const { userId } = req.params;
  const userRecord = getOrCreateUser(userId);
  const myPresentations = getUserPresentations(userId);
  const isSubscribed = await isUserSubscribedToChannel(userId);
  const channelClean = (config.channelUsername || 'ahroriAI').replace('@', '');
  const isVip = isUserVip(userId);

  res.json({
    success: true,
    user: userRecord.user,
    isVip,
    vipUntil: userRecord.user.vipUntil,
    presentationsCount: myPresentations.length,
    isAdmin: isAdmin(userId),
    adminUsername: ADMIN_TELEGRAM_USERNAME,
    isChannelSubscribed: isSubscribed,
    channelBonusClaimed: userRecord.user.channelBonusClaimed || false,
    channelUsername: channelClean,
    channelUrl: `https://t.me/${channelClean}`,
    cardNumber: CARD_NUMBER,
    pricePerSlide: PRICE_PER_SLIDE,
  });
});

// 1. API: Foydalanuvchining o'z taqdimotlari tarixi (Slaydlarim)
app.get('/api/presentations/:userId', (req, res) => {
  const { userId } = req.params;
  const list = getUserPresentations(userId);
  res.json({ success: true, presentations: list });
});

// 2. API: Slayd generatsiya qilish (Rate limited & Sanitized)
app.post('/api/generate', generateLimiter, async (req, res) => {
  try {
    const { topic, slideCount, language, theme, category, organization, author, chatId, username, firstName } = req.body;

    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      return res.status(400).json({ success: false, error: 'Mavzu kiritilishi shart' });
    }

    // Xavfsizlik: Mavzu uzunligi va slaydlar sonini cheklash (DoS va overflow dan himoya)
    const cleanTopic = topic.trim().slice(0, 500);
    const cleanSlideCount = Math.max(3, Math.min(15, parseInt(slideCount, 10) || 6));
    const cleanCategory = typeof category === 'string' ? category.slice(0, 50) : 'general';
    const cleanLanguage = ['uz', 'ru', 'en', 'tg', 'kaa'].includes(language) ? language : 'uz';
    const cleanTheme = typeof theme === 'string' ? theme.slice(0, 30) : 'ocean';
    const cleanAuthor = typeof author === 'string' ? author.trim().slice(0, 100) : '';
    const cleanOrg = typeof organization === 'string' ? organization.trim().slice(0, 100) : '';

    if (!chatId) {
      return res.status(400).json({
        success: false,
        error: 'AUTH_REQUIRED',
        message: 'Taqdimot yaratish uchun Telegram Mini App orqali kirish shart.',
      });
    }

    // Kanal a'zoligi va coin tekshirish
    const channelClean = (config.channelUsername || 'ahroriAI').replace('@', '');
    const isSubscribed = await isUserSubscribedToChannel(chatId);
    if (!isSubscribed) {
      return res.status(403).json({
        success: false,
        error: 'CHANNEL_SUBSCRIPTION_REQUIRED',
        message: `Taqdimot yaratish uchun rasmiy @${channelClean} kanalimizga a'zo bo'lishingiz shart!`,
        channelUrl: `https://t.me/${channelClean}`,
      });
    }

    const { user } = getOrCreateUser(chatId, { username, firstName });
    const isVip = isUserVip(chatId);
    if (!isVip && user.coins <= 0) {
      return res.status(403).json({
        success: false,
        error: 'NO_COINS',
        message: `Sizda taqdimot yaratish uchun imkoniyatlar tugadi!\nHar 1 ta taqdimot: ${PRICE_PER_SLIDE.toLocaleString()} so'm.\nKarta: ${CARD_NUMBER}\nYoki 3 ta do'stingizni taklif qilib, +1 ta bepul taqdimot oling!`,
        cardNumber: CARD_NUMBER,
      });
    }

    if (!isVip) {
      deductCoin(chatId);
    }
    const remainingCoins = isVip ? 'VIP' : user.coins;

    console.log(`[API] Yangi taqdimot: "${cleanTopic}", soha: ${cleanCategory}, slaydlar: ${cleanSlideCount}, til: ${cleanLanguage}, tema: ${cleanTheme}`);

    // AI orqali ma'lumot olish
    const presentationData = await generatePresentationData({
      topic: cleanTopic,
      slideCount: cleanSlideCount,
      language: cleanLanguage,
      theme: cleanTheme,
      category: cleanCategory,
      organization: cleanOrg,
    });

    // PPTX fayl yasash
    const { filePath, fileName, speakerNotesList } = await createPptx({
      ...presentationData,
      author: cleanAuthor || presentationData.author || '',
      organization: cleanOrg || presentationData.organization || '',
      language: cleanLanguage || presentationData.language || 'uz',
      includeBranding: true,
      botUsername: config.botUsername || 'ai_slide_bot',
    });
    const downloadUrl = `/api/download/${fileName}`;

    // Taqdimotni bazaga saqlash
    if (chatId) {
      savePresentationRecord({
        userId: chatId,
        username: username || '',
        firstName: firstName || 'Foydalanuvchi',
        topic: presentationData.title || topic,
        category: category || 'general',
        slideCount: presentationData.slides?.length || slideCount,
        language: language || 'uz',
        theme: theme || 'ocean',
        fileName,
        downloadUrl,
      });

      // ADMINGA HISOBOT YUBORISH (Live Admin Alert)
      try {
        const adminText = `
📊 *Yangi taqdimot yaratildi!*
👤 *Foydalanuvchi:* ${firstName || 'Foydalanuvchi'} ${username ? `(@${username})` : ''}
🆔 *ID:* \`${chatId}\`
📌 *Mavzu:* "${presentationData.title || topic}"
🎯 *Soha:* ${category || 'general'}
🌐 *Til:* ${language || 'uz'}
📄 *Slaydlar:* ${presentationData.slides?.length || slideCount} ta
🎨 *Uslub:* ${theme || 'ocean'}
🪙 *Qolgan balansi:* ${remainingCoins} ta
        `;
        await bot.api.sendMessage(config.adminId, adminText, { parse_mode: 'Markdown' });
      } catch (adminErr) {
        // Admin ID xato bo'lsa yoki bot start qilmagan bo'lsa
      }

      // Foydalanuvchiga Telegram orqali faylni yuborish
      try {
        const miniAppCaption = {
          ru: `📊 *${presentationData.title}*\n\n📄 Слайды: ${presentationData.slides?.length || slideCount}\n🎨 Стиль: ${theme || 'ocean'}\n🪙 Оставшийся баланс: *${remainingCoins}*\n\n_Файл можно открыть и редактировать в программе PowerPoint._`,
          en: `📊 *${presentationData.title}*\n\n📄 Slides: ${presentationData.slides?.length || slideCount}\n🎨 Theme: ${theme || 'ocean'}\n🪙 Remaining balance: *${remainingCoins}*\n\n_You can open and present this file directly in PowerPoint._`,
          tg: `📊 *${presentationData.title}*\n\n📄 Слайдҳо: ${presentationData.slides?.length || slideCount}\n🎨 Тарҳ: ${theme || 'ocean'}\n🪙 Бақияи шумо: *${remainingCoins}*\n\n_Шумо метавонед файлро дар барномаи PowerPoint кушоед._`,
        }[language] || `📊 *${presentationData.title}*\n\n📄 Slaydlar: ${presentationData.slides?.length || slideCount} ta\n🎨 Uslub: ${theme || 'ocean'}\n🪙 Qolgan imkoniyatlaringiz: *${remainingCoins} ta*\n\n_Faylni PowerPoint dasturida ochishingiz mumkin._`;

        await bot.api.sendDocument(
          chatId,
          new InputFile(filePath, `${presentationData.title || 'taqdimot'}.pptx`),
          {
            caption: miniAppCaption,
            parse_mode: 'Markdown',
          }
        );
      } catch (err) {
        console.warn(`[Bot] Faylni ${chatId} ga yuborishda xatolik:`, err.message);
      }
    }

    res.json({
      success: true,
      title: presentationData.title,
      fileName,
      slidesCount: presentationData.slides?.length || slideCount,
      downloadUrl,
      slides: presentationData.slides,
      qaList: presentationData.qaList || [],
      remainingCoins,
      speakerNotes: speakerNotesList,
    });
  } catch (error) {
    console.error('[API Xatolik]:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Slayd yaratishda xatolik yuz berdi',
    });
  }
});

// 3. API: Admin Panel ma'lumotlari (Xavfsiz admin tekshiruvi bilan)
app.get('/api/admin/dashboard', (req, res) => {
  if (!verifyAdminAccess(req)) {
    return res.status(403).json({ success: false, error: 'Ruxsat berilmagan: Faqat rasmiy adminlar uchun' });
  }

  const stats = getStats();
  const recentPresentations = getAllPresentations(60);
  const usersList = getAllUsers().slice(0, 100);
  const feedbacksList = getAllFeedbacks(50);

  res.json({
    success: true,
    stats,
    presentations: recentPresentations,
    users: usersList,
    feedbacks: feedbacksList,
  });
});

// 4. API: Admindan foydalanuvchiga Coin sovg'a qilish (Xavfsiz admin tekshiruvi bilan)
app.post('/api/admin/give-coins', async (req, res) => {
  if (!verifyAdminAccess(req)) {
    return res.status(403).json({ success: false, error: 'Ruxsat berilmagan: Faqat rasmiy adminlar uchun' });
  }

  const { targetUserId, amount } = req.body;
  const coinsNum = parseInt(amount, 10);
  if (!targetUserId || isNaN(coinsNum) || coinsNum <= 0) {
    return res.status(400).json({ success: false, error: 'Noto\'g\'ri parametrlar' });
  }

  giveCoins(targetUserId, coinsNum);
  const targetUser = getUser(targetUserId);

  // Foydalanuvchiga Telegramda quvonchli xabar yuborish
  try {
    await bot.api.sendMessage(
      targetUserId,
      `🎉 *Tabriklaymiz!*\n\nAdmin sizning hisobingizga **+${coinsNum} ta bepul taqdimot (coin)** taqdim etdi! 🪙\n\nJoriy balansingiz: *${targetUser?.coins || coinsNum} ta* taqdimot.`,
      { parse_mode: 'Markdown' }
    );
  } catch (_) {}

  res.json({ success: true, message: `Foydalanuvchiga ${coinsNum} ta coin berildi!`, user: targetUser });
});

// 4.1. API: Barcha adminlar ro'yxatini olish
app.get('/api/admin/admins', (req, res) => {
  if (!verifyAdminAccess(req)) {
    return res.status(403).json({ success: false, error: 'Ruxsat berilmagan' });
  }
  res.json({ success: true, admins: getAllAdmins() });
});

// 4.2. API: Yangi admin qo'shish
app.post('/api/admin/add-admin', (req, res) => {
  if (!verifyAdminAccess(req)) {
    return res.status(403).json({ success: false, error: 'Ruxsat berilmagan' });
  }
  const { id, username, title } = req.body;
  const result = addAdmin({ id, username, title });
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

// 4.3. API: Adminni o'chirish
app.post('/api/admin/remove-admin', (req, res) => {
  if (!verifyAdminAccess(req)) {
    return res.status(403).json({ success: false, error: 'Ruxsat berilmagan' });
  }
  const { target } = req.body;
  if (!target) {
    return res.status(400).json({ success: false, message: 'O\'chiriladigan admin ID yoki username kiritilmadi' });
  }
  const result = removeAdmin(target);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

// 4.4. API: Barcha bot foydalanuvchilariga xabar yuborish (Broadcast)
app.post('/api/admin/broadcast', async (req, res) => {
  if (!verifyAdminAccess(req)) {
    return res.status(403).json({ success: false, error: 'Ruxsat berilmagan' });
  }

  const { message, buttonText, buttonUrl } = req.body;
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ success: false, error: 'Xabar matnini kiriting!' });
  }

  const usersList = getAllUsers();
  if (!usersList || usersList.length === 0) {
    return res.json({ success: true, sentCount: 0, failedCount: 0, total: 0, message: 'Foydalanuvchilar mavjud emas' });
  }

  const trimmedMsg = message.trim();
  const keyboard = (buttonText && buttonUrl && buttonUrl.startsWith('http'))
    ? new InlineKeyboard().url(buttonText.trim(), buttonUrl.trim())
    : undefined;

  let sentCount = 0;
  let failedCount = 0;

  console.log(`[Admin Broadcast] ${usersList.length} ta foydalanuvchiga xabar yuborish boshlandi...`);

  // Xabarlarni xavfsiz tezlikda tarqatish (Telegram limitlariga mos ravishda)
  for (const u of usersList) {
    if (!u.userId || BANNED_USER_IDS.has(String(u.userId))) continue;
    try {
      await bot.api.sendMessage(u.userId, trimmedMsg, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
        disable_web_page_preview: false,
      });
      sentCount++;
    } catch (_) {
      try {
        // Markdown xato bersa, oddiy matn sifatida qayta jo'natish
        await bot.api.sendMessage(u.userId, trimmedMsg, {
          reply_markup: keyboard,
          disable_web_page_preview: false,
        });
        sentCount++;
      } catch (err) {
        failedCount++;
      }
    }
    // Telegram rate limit (35ms delay = ~28 ta/sekund)
    await new Promise(r => setTimeout(r, 40));
  }

  console.log(`[Admin Broadcast] Tugadi: ${sentCount} ta yuborildi, ${failedCount} ta xato.`);

  res.json({
    success: true,
    total: usersList.length,
    sentCount,
    failedCount,
    message: `Xabarnoma ${sentCount} ta foydalanuvchiga muvaffaqiyatli yetkazildi! (Yetib bormadi: ${failedCount} ta)`,
  });
});

// 5. API: Faylni yuklab olish
app.get('/api/download/:fileName', (req, res) => {
  const fileName = req.params.fileName;
  // Path traversal xavfsizligi (masalan: ../../etc/passwd)
  const safeFileName = path.basename(fileName);
  const filePath = path.join(TEMP_DIR, safeFileName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Fayl topilmadi yoki muddati o\'tgan.');
  }

  res.download(filePath, safeFileName);
});

// 6. API: Telegram chatga yuborish
app.post('/api/send-to-chat', async (req, res) => {
  try {
    const { chatId, fileName, title } = req.body;
    if (!chatId || !fileName) {
      return res.status(400).json({ success: false, error: 'chatId va fileName kiritilishi shart' });
    }

    const safeFileName = path.basename(fileName);
    const filePath = path.join(TEMP_DIR, safeFileName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Fayl topilmadi' });
    }

    await bot.api.sendDocument(chatId, new InputFile(filePath, safeFileName), {
      caption: `📊 *${title || 'Taqdimot'}*\n\n✨ AI Slayd Bot orqali tayyorlandi.`,
      parse_mode: 'Markdown',
    });

    res.json({ success: true, message: 'Fayl muvaffaqiyatli chatga yuborildi!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7. API: Mini App ichidan to'lov cheki yuklash (Rate limited)
app.post('/api/upload-receipt', receiptLimiter, async (req, res) => {
  try {
    const { userId, username, firstName, imageBase64, packageAmount, packageCoins } = req.body;
    if (!userId || !imageBase64) {
      return res.status(400).json({ success: false, error: 'Ma\'lumotlar to\'liq emas' });
    }

    if (hasPendingPayment(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Siz yuborgan avvalgi chek hozirda tekshirilmoqda. Iltimos, admin tasdiqlashini kuting!'
      });
    }

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const fileName = `receipt_${Date.now()}_${userId}.jpg`;
    const filePath = path.join(TEMP_DIR, fileName);
    fs.writeFileSync(filePath, buffer);

    const coins = packageCoins ? Number(packageCoins) : 1;
    const amount = packageAmount ? Number(packageAmount) : 5000;

    const payment = createPayment(userId, amount, coins, fileName);

    if (config.adminId) {
      const adminKeyboard = new InlineKeyboard()
        .text(`✅ Tasdiqlash (+${coins} koin)`, `pay_ok_${payment.id}_${coins}`)
        .text('❌ Rad etish', `pay_no_${payment.id}`);

      try {
        await bot.api.sendPhoto(
          config.adminId,
          new InputFile(filePath),
          {
            caption: `💳 *Mini App orqali yangi to'lov cheki keldi!*\n\n👤 *Foydalanuvchi:* ${firstName || ''} (@${username || 'yoq'})\n🆔 *ID:* \`${userId}\`\n💰 *Paket:* ${coins} ta koin (${amount.toLocaleString()} so'm)\n\n👇 *Tasdiqlash uchun tugmani bosing:*`,
            parse_mode: 'Markdown',
            reply_markup: adminKeyboard,
          }
        );
      } catch (err) {
        console.warn('[Admin Photo Send Error]', err.message);
      }
    }

    res.json({
      success: true,
      message: 'To\'lov chekingiz muvaffaqiyatli qabul qilindi! Admin tasdiqlashi bilan koinlar hisobingizga tushadi.'
    });
  } catch (error) {
    console.error('[Upload Receipt Error]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 8. API: Mini App ichidan adminga taklif va talablar yuborish
app.post('/api/feedback', async (req, res) => {
  try {
    const { userId, username, firstName, message } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, error: 'Taklif yoki talab matnini kiriting!' });
    }

    const trimmedMsg = message.trim();
    if (trimmedMsg.length < 3) {
      return res.status(400).json({ success: false, error: 'Xabar juda qisqa. Iltimos, batafsilroq yozing.' });
    }

    const saved = saveFeedback({
      userId: userId || 'anonymous',
      username: username || '',
      firstName: firstName || 'Foydalanuvchi',
      message: trimmedMsg,
    });

    // Adminga Telegram orqali xabar yuborish
    if (config.adminId) {
      try {
        const timeStr = new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' });
        const adminMsg = `📬 *Mini App orqali yangi taklif va talab keldi!*\n\n👤 *Foydalanuvchi:* ${firstName || 'Foydalanuvchi'} ${username ? `(@${username})` : ''}\n🆔 *Telegram ID:* \`${userId || 'Noma\'lum'}\`\n⏰ *Vaqt:* ${timeStr}\n\n💬 *Taklif / Talab:*\n"${trimmedMsg}"\n\n👉 *Admin:* @${ADMIN_TELEGRAM_USERNAME}`;

        await bot.api.sendMessage(config.adminId, adminMsg, { parse_mode: 'Markdown' });
      } catch (tgErr) {
        console.warn('[Admin Feedback Telegram Send Error]', tgErr.message);
      }
    }

    res.json({
      success: true,
      message: 'Taklif va talabingiz adminga muvaffaqiyatli yetkazildi! E\'tiboringiz va yordamingiz uchun katta rahmat.',
      feedback: saved,
      adminUsername: ADMIN_TELEGRAM_USERNAME,
    });
  } catch (error) {
    console.error('[Feedback API Error]', error);
    res.status(500).json({ success: false, error: error.message || 'Xatolik yuz berdi' });
  }
});

// 9. API: Telegram kanal a'zoligini tekshirish va bonus koin berish
app.post('/api/check-channel', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId kiritilishi shart' });
    }

    const channelClean = (config.channelUsername || 'ahroriAI').replace('@', '');
    const isMember = await isUserSubscribedToChannel(userId, true);

    if (!isMember) {
      return res.json({
        success: false,
        message: `Iltimos, avval @${channelClean} kanalimizga a'zo bo'ling va so'ngra tekshirish tugmasini bosing!`,
        channelUrl: `https://t.me/${channelClean}`,
      });
    }

    const userRecord = getOrCreateUser(userId);
    const user = userRecord.user;

    if (user.channelBonusClaimed) {
      return res.json({
        success: true,
        alreadyClaimed: true,
        message: 'Kanal a\'zoligingiz tasdiqlangan! Siz avvalroq bonus olgansiz.',
        channelUrl: `https://t.me/${channelClean}`,
      });
    }

    const result = claimChannelBonus(userId, 2);
    if (result.success) {
      // Foydalanuvchiga Telegramda ham xabar yuborish
      try {
        await bot.api.sendMessage(
          userId,
          `🎁 *Tabriklaymiz!*\n\nKanalimizga a'zo bo'lganingiz tasdiqlandi va hisobingizga **+2 ta bepul taqdimot (koin)** qo'shildi! 🪙\n\nJoriy balansingiz: *${result.coins} ta* taqdimot.`,
          { parse_mode: 'Markdown' }
        );
      } catch (_) {}

      res.json({
        success: true,
        message: 'Ajoyib! Kanal a\'zoligingiz tasdiqlandi va hisobingizga +2 ta bepul koin berildi! 🪙',
        newBalance: result.coins,
      });
    } else {
      res.json({
        success: true,
        alreadyClaimed: true,
        message: 'Kanal a\'zoligingiz tasdiqlangan!',
      });
    }
  } catch (err) {
    console.error('[Check Channel Route Error]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. API: Mini App ichidan Telegram Stars to'lov linki yaratish
app.post('/api/create-stars-invoice', async (req, res) => {
  try {
    const { userId, packageCoins, packageStars } = req.body;
    if (!userId || !packageCoins || !packageStars) {
      return res.status(400).json({ success: false, error: 'Parametrlar yetarli emas' });
    }

    const coinsNum = Number(packageCoins);
    const starsNum = Number(packageStars);

    const invoiceLink = await bot.api.createInvoiceLink(
      `${coinsNum} ta Taqdimot Koini`,
      `AI Slayd Bot uchun ${coinsNum} ta professional PowerPoint taqdimot yaratish imkoniyati.`,
      JSON.stringify({ userId: String(userId), coins: coinsNum, stars: starsNum, time: Date.now() }),
      "", // Telegram Stars (XTR) uchun provider_token bo'sh bo'ladi
      "XTR",
      [{ label: `${coinsNum} ta koin`, amount: starsNum }]
    );

    res.json({ success: true, invoiceLink });
  } catch (err) {
    console.error('[Create Stars Invoice Error]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 11. API: Promo-kodni faollashtirish (Mini App)
app.post('/api/promo', (req, res) => {
  try {
    const { userId, code } = req.body;
    if (!userId || !code) {
      return res.status(400).json({ success: false, message: 'Foydalanuvchi ID va promo-kod kiritilishi shart' });
    }
    const result = redeemPromoCode(userId, code);
    res.json(result);
  } catch (err) {
    console.error('[Promo API Error]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});



