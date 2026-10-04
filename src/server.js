import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { InputFile, InlineKeyboard } from 'grammy';
import { generatePresentationData } from './ai.js';
import { createPptx } from './pptx.js';
import { bot } from './bot.js';
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
} from './db.js';

export const app = express();

app.use(cors());
app.use(express.json({ limit: '25mb' }));

// Frontend Mini App statik fayllari
app.use(express.static(path.resolve('public')));

const TEMP_DIR = path.resolve('temp');

// 0. API: Foydalanuvchi balansi va holatini olish
app.get('/api/user/:userId', (req, res) => {
  const { userId } = req.params;
  const userRecord = getOrCreateUser(userId);
  const myPresentations = getUserPresentations(userId);
  res.json({
    success: true,
    user: userRecord.user,
    presentationsCount: myPresentations.length,
    isAdmin: String(userId) === config.adminId,
    adminUsername: ADMIN_TELEGRAM_USERNAME,
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

// 2. API: Slayd generatsiya qilish
app.post('/api/generate', async (req, res) => {
  try {
    const { topic, slideCount, language, theme, category, organization, chatId, username, firstName } = req.body;

    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      return res.status(400).json({ success: false, error: 'Mavzu kiritilishi shart' });
    }

    // Agar Telegram chatId mavjud bo'lsa, coin tekshirish
    let remainingCoins = 10;
    if (chatId) {
      const { user } = getOrCreateUser(chatId, { username, firstName });
      if (user.coins <= 0) {
        return res.status(403).json({
          success: false,
          error: 'NO_COINS',
          message: `Sizda taqdimot yaratish uchun imkoniyatlar tugadi!\nHar 1 ta taqdimot: ${PRICE_PER_SLIDE.toLocaleString()} so'm.\nKarta: ${CARD_NUMBER}\nYoki 3 ta do'stingizni taklif qilib, +1 ta bepul taqdimot oling!`,
          cardNumber: CARD_NUMBER,
        });
      }

      deductCoin(chatId);
      remainingCoins = user.coins;
    }

    console.log(`[API] Yangi taqdimot: "${topic}", soha: ${category}, slaydlar: ${slideCount}, til: ${language}, tema: ${theme}`);

    // AI orqali ma'lumot olish
    const presentationData = await generatePresentationData({
      topic: topic.trim(),
      slideCount: parseInt(slideCount, 10) || 6,
      language: language || 'uz',
      theme: theme || 'ocean',
      category: category || 'general',
      organization: organization || '',
    });

    // PPTX fayl yasash
    const { filePath, fileName, speakerNotesList } = await createPptx(presentationData);
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
        await bot.api.sendDocument(
          chatId,
          new InputFile(filePath, `${presentationData.title || 'taqdimot'}.pptx`),
          {
            caption: `📊 *${presentationData.title}*\n\n✨ Mini App orqali yaratildi.\n📄 Slaydlar: ${presentationData.slides?.length || slideCount} ta\n🎨 Uslub: ${theme || 'ocean'}\n🪙 Qolgan imkoniyatlaringiz: *${remainingCoins} ta*\n\n_Do'stlaringizga ulashing: har 3 ta do'st uchun +1 ta bepul taqdimot!_`,
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

// 3. API: Admin Panel ma'lumotlari (Statistika, foydalanuvchilar, so'nggi taqdimotlar)
app.get('/api/admin/dashboard', (req, res) => {
  const { adminId } = req.query;
  if (String(adminId) !== config.adminId) {
    return res.status(403).json({ success: false, error: 'Ruxsat berilmagan' });
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

// 4. API: Admindan foydalanuvchiga Coin sovg'a qilish
app.post('/api/admin/give-coins', async (req, res) => {
  const { adminId, targetUserId, amount } = req.body;
  if (String(adminId) !== config.adminId) {
    return res.status(403).json({ success: false, error: 'Ruxsat berilmagan' });
  }

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

// 5. API: Faylni yuklab olish
app.get('/api/download/:fileName', (req, res) => {
  const fileName = req.params.fileName;
  const filePath = path.join(TEMP_DIR, fileName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Fayl topilmadi yoki muddati o\'tgan.');
  }

  res.download(filePath, fileName);
});

// 6. API: Telegram chatga yuborish
app.post('/api/send-to-chat', async (req, res) => {
  try {
    const { chatId, fileName, title } = req.body;
    if (!chatId || !fileName) {
      return res.status(400).json({ success: false, error: 'chatId va fileName kiritilishi shart' });
    }

    const filePath = path.join(TEMP_DIR, fileName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Fayl topilmadi' });
    }

    await bot.api.sendDocument(chatId, new InputFile(filePath, fileName), {
      caption: `📊 *${title || 'Taqdimot'}*\n\n✨ AI Slayd Bot orqali tayyorlandi.`,
      parse_mode: 'Markdown',
    });

    res.json({ success: true, message: 'Fayl muvaffaqiyatli chatga yuborildi!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7. API: Mini App ichidan to'lov cheki yuklash
app.post('/api/upload-receipt', async (req, res) => {
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

