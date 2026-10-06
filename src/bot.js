import { Bot, InlineKeyboard, InputFile } from 'grammy';
import { config } from './config.js';
import { generatePresentationData, extractTextFromImage } from './ai.js';
import { createPptx } from './pptx.js';
import { categories, getCategory } from './categories.js';
import {
  getOrCreateUser,
  getUser,
  deductCoin,
  addCoins,
  giveCoins,
  savePresentationRecord,
  getAllPresentations,
  getAllUsers,
  getStats,
  createPayment,
  isReceiptDuplicate,
  hasPendingPayment,
  approvePayment,
  rejectPayment,
  getPaymentById,
  setUserSubscribed,
  isUserVip,
  setVipSubscription,
  redeemPromoCode,
  getAllPromoCodes,
  CARD_NUMBER,
  PRICE_PER_SLIDE,
  ADMIN_TELEGRAM_USERNAME,
} from './db.js';
import { extractTextFromDocument } from './docs.js';
import { processVoiceMessage } from './voice.js';

export const bot = new Bot(config.botToken);

// Xatoliklarni ushlab qolish - bot hech qachon to'xtab qolmasligi uchun
bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`[Grammy Error] Update ${ctx?.update?.update_id} da xatolik:`, err.error);
});

// Render Web serverini har qanday foydalanuvchi faolligida avtomatik uyg'otish / faol saqlash
bot.use(async (ctx, next) => {
  const pingUrl = process.env.RENDER_EXTERNAL_URL || config.miniAppUrl;
  if (pingUrl && typeof pingUrl === 'string' && pingUrl.startsWith('https://')) {
    fetch(`${pingUrl.replace(/\/$/, '')}/api/ping`).catch(() => {});
  }
  return next();
});

// Foydalanuvchilarning aktiv buyurtma jarayonlarini saqlash (Session)
const sessions = new Map();

// Mavzular nomlari
const THEME_NAMES = {
  ocean: '🌊 Ocean Blue',
  dark: '🌙 Modern Dark',
  emerald: '🌿 Emerald Nature',
  sunset: '🌅 Sunset Orange',
  minimal: '📄 Clean Light',
};

// Tillarning chiroyli nomlari
const LANG_NAMES = {
  uz: "🇺🇿 O'zbekcha",
  ru: "🇷🇺 Русский",
  en: "🇬🇧 English",
  tg: "🇹🇯 Тоҷикӣ",
};

// Til tanlash klaviaturasi
function getLanguageKeyboard() {
  return new InlineKeyboard()
    .text('🇺🇿 O\'zbekcha', 'lang_uz')
    .text('🇷🇺 Русский', 'lang_ru')
    .row()
    .text('🇬🇧 English', 'lang_en')
    .text('🇹🇯 Тоҷикӣ', 'lang_tg')
    .row()
    .text('❌ Bekor qilish', 'cancel_action');
}

// 1. Soha / Yo'nalish klaviaturasi
function getCategoryKeyboard() {
  return new InlineKeyboard()
    .text('🎓 Ta\'lim & O\'qituvchilar', 'cat_education').row()
    .text('💼 Iqtisodiyot & Moliya', 'cat_economy').row()
    .text('🩺 Tibbiyot & Salomatlik', 'cat_medical').row()
    .text('💻 IT & Texnologiya', 'cat_tech').row()
    .text('🌿 Tabiat & Qishloq xo\'jaligi', 'cat_nature').row()
    .text('🌟 Umumiy / Erkin uslub', 'cat_general').row()
    .text('❌ Bekor qilish', 'cancel_action');
}

// 2. Slaydlar soni klaviaturasi
function getSlideCountKeyboard() {
  return new InlineKeyboard()
    .text('5 ta', 'count_5')
    .text('8 ta', 'count_8')
    .text('10 ta', 'count_10')
    .row()
    .text('12 ta', 'count_12')
    .text('15 ta', 'count_15')
    .text('18 ta', 'count_18')
    .row()
    .text('20 ta', 'count_20')
    .text('25 ta', 'count_25')
    .row()
    .text('❌ Bekor qilish', 'cancel_action');
}

// 3. Dizayn uslubi klaviaturasi
function getThemeKeyboard() {
  return new InlineKeyboard()
    .text('🌊 Ocean Blue (IT & Biznes)', 'theme_ocean').row()
    .text('🌙 Modern Dark (Texnologik)', 'theme_dark').row()
    .text('🌿 Emerald (Tabiat & Tibbiyot)', 'theme_emerald').row()
    .text('🌅 Sunset (Kreativ & Dizayn)', 'theme_sunset').row()
    .text('📄 Clean Light (Klassik oq fon)', 'theme_minimal').row()
    .text('❌ Bekor qilish', 'cancel_action');
}

// Rasmiy kanal sozlamalari (Majburiy a'zolik)
export const CHANNEL_USERNAME = (config.channelUsername || 'ahroriAI').replace('@', '');
export const CHANNEL_URL = `https://t.me/${CHANNEL_USERNAME}`;

// Foydalanuvchining kanalga a'zoligini tekshirish
export async function isUserSubscribedToChannel(userId, forceCheck = false) {
  if (!userId) return false;
  const idStr = String(userId);

  // Admin doimo ruxsatga ega
  if (idStr === String(config.adminId)) return true;

  const existingUser = getUser(idStr);
  if (!forceCheck && existingUser && existingUser.isChannelSubscribed) {
    return true;
  }

  try {
    const member = await bot.api.getChatMember(`@${CHANNEL_USERNAME}`, Number(idStr));
    const isSubscribed = ['creator', 'administrator', 'member', 'restricted'].includes(member.status);
    if (isSubscribed) {
      if (existingUser) {
        existingUser.isChannelSubscribed = true;
        setUserSubscribed(idStr, true);
      }
      return true;
    }
    if (existingUser && existingUser.isChannelSubscribed) {
      existingUser.isChannelSubscribed = false;
      setUserSubscribed(idStr, false);
    }
    return false;
  } catch (err) {
    const desc = err.description || err.message || '';
    if (desc.includes('PARTICIPANT_ID_INVALID') || desc.includes('user not found')) {
      if (existingUser && existingUser.isChannelSubscribed) {
        existingUser.isChannelSubscribed = false;
        setUserSubscribed(idStr, false);
      }
      return false;
    }
    console.warn(`[Kanal tekshirish xatosi: ${userId}]:`, desc);
    return existingUser?.isChannelSubscribed || false;
  }
}

// Majburiy a'zolik klaviaturasi
export function getSubscriptionKeyboard() {
  return new InlineKeyboard()
    .url('📢 Kanalga a\'zo bo\'lish', CHANNEL_URL)
    .row()
    .text('✅ A\'zo bo\'ldim (Tekshirish)', 'check_subscription');
}

// Majburiy a'zolik xabari
export function getSubscriptionMessage(firstName = '') {
  return `
👋 *Assalomu alaykum${firstName ? `, ${firstName}` : ''}!*

🤖 Botdan foydalanish va AI yordamida professional taqdimotlar tayyorlash uchun, iltimos, avval rasmiy kanalimizga a'zo bo'ling:

📢 **Rasmiy kanal:** [@${CHANNEL_USERNAME}](${CHANNEL_URL})

1️⃣ Yuqoridagi **"📢 Kanalga a'zo bo'lish"** tugmasini bosing va a'zo bo'ling.
2️⃣ So'ngra pastdagi **«✅ A'zo bo'ldim (Tekshirish)»** tugmasini bosing!
  `.trim();
}

// Kanal tekshiruvidan o'tmagan referallarni saqlash
const pendingReferrers = new Map();

// Asosiy xush kelibsiz menyusi
async function sendWelcomeMenu(ctx, referrerId = null) {
  const { user, isNew, bonusGiven, referrer } = getOrCreateUser(
    ctx.chat.id,
    { username: ctx.from.username, firstName: ctx.from.first_name },
    referrerId
  );

  user.isChannelSubscribed = true;
  setUserSubscribed(ctx.chat.id, true);

  // Agar yangi foydalanuvchi referal orqali kirgan bo'lsa va 3-do'st bo'lsa
  if (isNew && referrer) {
    try {
      if (bonusGiven) {
        await ctx.api.sendMessage(
          referrer.userId,
          `🎉 *Ajoyib xabar!*\n\nSiz 3 ta do'stingizni taklif qildingiz va hisobingizga **+1 ta bepul taqdimot imkoniyati** berildi! 🪙\n\nJoriy balansingiz: *${referrer.coins} ta* taqdimot.`
        );
      } else {
        await ctx.api.sendMessage(
          referrer.userId,
          `👤 Sizning taklifingiz bilan yangi do'stingiz botga qo'shildi! (${referrer.referralProgress}/3 ta)\nYana ${3 - referrer.referralProgress} ta do'st taklif qiling va bepul taqdimot oling!`
        );
      }
    } catch (_) {}
  }

  if (config.miniAppUrl && config.miniAppUrl.startsWith('https://')) {
    try {
      await bot.api.setChatMenuButton({
        chat_id: ctx.chat.id,
        menu_button: {
          type: 'web_app',
          text: '📊 Taqdimot Yaratish',
          web_app: { url: config.miniAppUrl },
        },
      });
    } catch (_) {}
  }

  const keyboard = new InlineKeyboard();

  if (config.miniAppUrl && config.miniAppUrl.startsWith('https://')) {
    keyboard.webApp('📊 Mini App orqali yaratish', config.miniAppUrl).row();
  }
  keyboard
    .text('🪙 Balans & Referal', 'action_balance')
    .text('💳 Hisobni to\'ldirish', 'action_pay')
    .row()
    .text('💎 VIP Pass (Cheksiz)', 'action_vip')
    .text('🎟 Promo-kod', 'action_promo')
    .row()
    .text('📸 Konspektdan slayd (OCR)', 'action_ocr')
    .row();

  const isVip = isUserVip(ctx.chat.id);
  const vipBadge = isVip && user.vipUntil
    ? `\n👑 *VIP Obuna: FAOL!* (${new Date(user.vipUntil).toLocaleDateString('uz-UZ')} gacha cheksiz)\n`
    : '';

  const welcomeText = `
👋 *Assalomu alaykum, ${ctx.from.first_name || 'do\'stim'}!*

Men sun'iy intellekt yordamida **PowerPoint (.pptx)** taqdimotlarini tayyorlab beruvchi botman.
${vipBadge}
🎁 *Sizga ${isNew ? 'boshlang\'ich ' : ''}5 ta BEPUL taqdimot imkoniyati berildi!*
🪙 Joriy balansingiz: *${user.coins} ta* taqdimot

*Kengaytirilgan imkoniyatlar:*
1️⃣ **Mavzu yozing yoki ovozli xabar (voice) tashlang!**
2️⃣ **Word (.docx), PDF yoki Konspekt rasmini yuboring** — AI avtomatik o'qiydi!
3️⃣ **YouTube video havolasini yuboring** — video mavzusidan slayd tayyorlaydi!
4️⃣ **Himoya uchun tayyor nutq (Speaker notes) va komissiya Q&A savol-javoblari!**
5️⃣ **Promo-kod (/promo) & VIP Pass (/vip)** cheksiz taqdimotlar rejimi!

👉 *Boshlash uchun mavzuni yozing, havola tashlang, konspekt rasmini yuboring yoki quyidagi tugmani bosing!*
  `.trim();

  await ctx.reply(welcomeText, {
    parse_mode: 'Markdown',
    reply_markup: keyboard,
  });
}

// /start buyrug'i (Referal bilan: /start ref_123456)
bot.command('start', async (ctx) => {
  sessions.delete(ctx.chat.id);

  let referrerId = null;
  const match = ctx.match;
  if (match && match.startsWith('ref_')) {
    referrerId = match.replace('ref_', '');
    pendingReferrers.set(String(ctx.chat.id), referrerId);
  }

  const isSubscribed = await isUserSubscribedToChannel(ctx.chat.id);
  if (!isSubscribed) {
    return ctx.reply(getSubscriptionMessage(ctx.from?.first_name), {
      parse_mode: 'Markdown',
      reply_markup: getSubscriptionKeyboard(),
      disable_web_page_preview: true,
    });
  }

  const refToUse = referrerId || pendingReferrers.get(String(ctx.chat.id));
  await sendWelcomeMenu(ctx, refToUse);
  pendingReferrers.delete(String(ctx.chat.id));
});

// A'zolikni tekshirish tugmasi bosilganda
bot.callbackQuery('check_subscription', async (ctx) => {
  const userId = ctx.chat?.id || ctx.from?.id;
  const isSubscribed = await isUserSubscribedToChannel(userId, true);

  if (!isSubscribed) {
    return ctx.answerCallbackQuery({
      text: `❌ Siz hali @${CHANNEL_USERNAME} kanaliga a'zo bo'lmadingiz! Iltimos, avval kanalga a'zo bo'lib, so'ng qayta tekshiring.`,
      show_alert: true,
    });
  }

  await ctx.answerCallbackQuery({
    text: "🎉 Rahmat! Kanal a'zoligingiz muvaffaqiyatli tasdiqlandi.",
  });

  try {
    await ctx.deleteMessage();
  } catch (_) {}

  const pendingRef = pendingReferrers.get(String(userId));
  await sendWelcomeMenu(ctx, pendingRef);
  pendingReferrers.delete(String(userId));
});

// /app yoki /miniapp buyrug'i orqali doimo yangilangan Mini App tugmasini olish
bot.command(['app', 'miniapp', 'slayd'], async (ctx) => {
  const isSubscribed = await isUserSubscribedToChannel(ctx.chat.id);
  if (!isSubscribed) {
    return ctx.reply(getSubscriptionMessage(ctx.from?.first_name), {
      parse_mode: 'Markdown',
      reply_markup: getSubscriptionKeyboard(),
      disable_web_page_preview: true,
    });
  }

  const keyboard = new InlineKeyboard();
  if (config.miniAppUrl && config.miniAppUrl.startsWith('https://')) {
    keyboard.webApp('🚀 Mini App ni ochish', config.miniAppUrl);
  }
  await ctx.reply("📱 Quyidagi tugma orqali eng so'nggi Mini App xonalariga kirishingiz mumkin:", { reply_markup: keyboard });
});

// /balance buyrug'i
bot.command('balance', async (ctx) => {
  const isSubscribed = await isUserSubscribedToChannel(ctx.chat.id);
  if (!isSubscribed) {
    return ctx.reply(getSubscriptionMessage(ctx.from?.first_name), {
      parse_mode: 'Markdown',
      reply_markup: getSubscriptionKeyboard(),
      disable_web_page_preview: true,
    });
  }
  await showUserBalance(ctx);
});

bot.callbackQuery('action_balance', async (ctx) => {
  await ctx.answerCallbackQuery();
  await showUserBalance(ctx);
});

async function showUserBalance(ctx) {
  const user = getUser(ctx.chat.id) || { coins: 10, referralsCount: 0, referralProgress: 0 };
  const botInfo = await bot.api.getMe();
  const refLink = `https://t.me/${botInfo.username}?start=ref_${ctx.chat.id}`;
  const isVip = isUserVip(ctx.chat.id);

  const vipSection = isVip && user.vipUntil
    ? `👑 *VIP Obuna:* **FAOL!** (${new Date(user.vipUntil).toLocaleDateString('uz-UZ')} gacha cheksiz)\n`
    : `💎 *VIP Obuna:* Faol emas (/vip orqali oling)\n`;

  const text = `
🪙 *Sizning balansingiz:*
• Mavjud imkoniyatlar: *${user.coins} ta* taqdimot
• Ishlatilgan: *${user.usedCoins || 0} ta* taqdimot
${vipSection}
👥 *Referal dasturi:*
• Taklif qilingan do'stlar: *${user.referralsCount || 0} ta*
• Yangi coin uchun: *${user.referralProgress || 0} / 3 ta* do'st

🎁 *Qoida:* Har 3 ta taklif qilingan do'stingiz uchun sizga **+1 ta bepul taqdimot** beriladi!

🔗 *Sizning shaxsiy referal havolangiz:*
\`${refLink}\`
_(Ustiga bossangiz nusxa olinadi, do'stlaringizga ulashing!)_
  `.trim();

  const kb = new InlineKeyboard()
    .url('📤 Do\'stlarga ulashish', `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent("Do'stim, mana bu AI bot PowerPoint taqdimotlarni bir necha daqiqada tayyorlab berar ekan! 5 ta bepul slayd beradi:")}`).row()
    .text('💳 Hisobni to\'ldirish', 'action_pay')
    .text('💎 VIP Pass', 'action_vip').row()
    .text('🎟 Promo-kod kiritish', 'action_promo');

  await ctx.reply(text, { parse_mode: 'Markdown', reply_markup: kb });
}

// /pay buyrug'i (To'lov tizimi)
bot.command('pay', async (ctx) => {
  await showPaymentInfo(ctx);
});

bot.callbackQuery('action_pay', async (ctx) => {
  await ctx.answerCallbackQuery();
  await showPaymentInfo(ctx);
});

bot.command('stars', async (ctx) => {
  await sendStarsInvoiceMenu(ctx);
});

bot.callbackQuery('action_stars_menu', async (ctx) => {
  await ctx.answerCallbackQuery();
  await sendStarsInvoiceMenu(ctx);
});

async function sendStarsInvoiceMenu(ctx) {
  const kb = new InlineKeyboard()
    .text('⭐️ 1 ta koin (15 Stars)', 'buy_stars_1_15')
    .text('⭐️ 3 ta koin (40 Stars)', 'buy_stars_3_40').row()
    .text('🔥 5 ta koin (60 Stars)', 'buy_stars_5_60')
    .text('💎 10 ta koin (100 Stars)', 'buy_stars_10_100').row()
    .text('👑 30 kunlik VIP Cheksiz (100 Stars)', 'buy_vip_stars_30_100').row()
    .text('💳 Karta orqali to\'lash', 'action_pay');

  const text = `
⭐️ *Telegram Stars (Yulduzlar) orqali to'lov:*

Karta ma'lumotlarini kiritmasdan, to'g'ridan-to'g'ri Telegram hisobingizdan 1 bosishda koin sotib oling!

📦 *Stars tariflari:*
• **1 ta taqdimot** — 15 ⭐️ Stars
• **3 ta taqdimot** — 40 ⭐️ Stars
• **5 ta taqdimot** — 60 ⭐️ Stars _(Aksiya)_
• **10 ta taqdimot** — 100 ⭐️ Stars _(Eng arzon)_
• 👑 **30 kunlik VIP Cheksiz** — 100 ⭐️ Stars _(Cheksiz slaydlar!)_

👇 *Kerakli paketni tanlang (darhol to'lov oynasi chiqadi):*
  `;
  await ctx.reply(text, { parse_mode: 'Markdown', reply_markup: kb });
}

bot.callbackQuery(/^buy_stars_(\d+)_(\d+)$/, async (ctx) => {
  const coins = Number(ctx.match[1]);
  const stars = Number(ctx.match[2]);
  await ctx.answerCallbackQuery();

  await ctx.replyWithInvoice(
    `${coins} ta Taqdimot Koini`,
    `AI Slayd Bot orqali ${coins} ta professional PowerPoint taqdimot yaratish imkoniyati.`,
    JSON.stringify({ userId: String(ctx.chat.id), coins, stars, time: Date.now() }),
    'XTR', // Stars valyutasi
    [{ label: `${coins} ta koin`, amount: stars }]
  );
});

bot.callbackQuery(/^buy_vip_stars_(\d+)_(\d+)$/, async (ctx) => {
  const days = Number(ctx.match[1]) || 30;
  const stars = Number(ctx.match[2]) || 100;
  await ctx.answerCallbackQuery();

  await ctx.replyWithInvoice(
    `VIP Cheksiz Obuna (${days} kun)`,
    `AI Slayd Bot orqali ${days} kun davomida cheksiz va bepul taqdimotlar yaratish imkoniyati.`,
    JSON.stringify({ userId: String(ctx.chat.id), isVip: true, days, stars, time: Date.now() }),
    'XTR',
    [{ label: `${days} kunlik VIP Cheksiz`, amount: stars }]
  );
});

// Pre-checkout so'rovini qabul qilish (Telegram Stars)
bot.on('pre_checkout_query', async (ctx) => {
  try {
    await ctx.answerPreCheckoutQuery(true);
  } catch (err) {
    console.error('[PreCheckout Error]', err);
  }
});

// Muvaffaqiyatli to'lov (Telegram Stars orqali)
bot.on('message:successful_payment', async (ctx) => {
  try {
    const sp = ctx.message.successful_payment;
    let coins = 1;
    let userId = String(ctx.chat.id);

    try {
      const payload = JSON.parse(sp.invoice_payload);
      if (payload.userId) userId = String(payload.userId);

      if (payload.isVip) {
        const days = Number(payload.days) || 30;
        setVipSubscription(userId, days);
        const payment = createPayment(userId, sp.total_amount, 0, null, `stars_vip_${sp.telegram_payment_charge_id}`);
        payment.status = 'approved';

        await ctx.reply(
          `🎉 *VIP Obuna muvaffaqiyatli faollashtirildi!*\n\n⭐️ *${sp.total_amount} Stars* to'landi.\n👑 *VIP Muddat:* ${days} kun cheksiz taqdimotlar!\n\nIstalgan mavzuda bemalol cheksiz slaydlar yaratishingiz mumkin! Tashakkur! 🚀`,
          { parse_mode: 'Markdown' }
        );

        if (config.adminId && String(ctx.chat.id) !== String(config.adminId)) {
          try {
            await bot.api.sendMessage(
              config.adminId,
              `💎 *Yangi VIP Stars to'lovi!*\n\n👤 *Foydalanuvchi:* ${ctx.from.first_name || ''} (@${ctx.from.username || 'yoq'})\n🆔 *ID:* \`${userId}\`\n⭐️ *Summa:* ${sp.total_amount} Stars\n👑 *Muddat:* ${days} kun`,
              { parse_mode: 'Markdown' }
            );
          } catch (_) {}
        }
        return;
      }

      if (payload.coins) coins = Number(payload.coins);
    } catch (_) {}

    addCoins(userId, coins);
    const user = getUser(userId);

    const payment = createPayment(userId, sp.total_amount, coins, null, `stars_${sp.telegram_payment_charge_id}`);
    payment.status = 'approved';

    await ctx.reply(
      `🎉 *To'lov muvaffaqiyatli qabul qilindi!*\n\n⭐️ *${sp.total_amount} Stars* to'landi.\n🪙 Hisobingizga: *+${coins} ta koin* qo'shildi!\n\nJoriy balansingiz: *${user?.coins || coins} ta* taqdimot. Tashakkur!`,
      { parse_mode: 'Markdown' }
    );

    if (config.adminId && String(ctx.chat.id) !== String(config.adminId)) {
      try {
        await bot.api.sendMessage(
          config.adminId,
          `💰 *Yangi Telegram Stars to'lovi!*\n\n👤 *Foydalanuvchi:* ${ctx.from.first_name || ''} (@${ctx.from.username || 'yoq'})\n🆔 *ID:* \`${userId}\`\n⭐️ *Summa:* ${sp.total_amount} Stars\n🪙 *Koinlar:* +${coins} ta\n🧾 *Charge ID:* \`${sp.telegram_payment_charge_id}\``,
          { parse_mode: 'Markdown' }
        );
      } catch (_) {}
    }
  } catch (err) {
    console.error('[Successful Payment Error]', err);
  }
});

async function showPaymentInfo(ctx) {
  const text = `
💳 *Hisobni to'ldirish (Taqdimot sotib olish):*

1 ta to'liq taqdimot narxi: **5 000 so'm**

📦 *Tariflar:*
• **1 ta taqdimot** — 5 000 so'm (yoki 15 ⭐️)
• **5 ta taqdimot** — 20 000 so'm (yoki 60 ⭐️)
• **10 ta taqdimot** — 35 000 so'm (yoki 100 ⭐️)
• 💎 **30 kunlik VIP Cheksiz Pass** — 35 000 so'm (yoki 100 ⭐️)

🏦 *To'lov uchun karta raqami:*
\`${CARD_NUMBER}\`
_(Humo / Uzcard)_

📌 *To'lov tartibi:*
1. Yuqoridagi karta raqamiga kerakli summani o'tkazing (Payme, Click, Uzum).
2. To'lov cheki (screenshot yoki rasm)ni **to'g'ridan-to'g'ri ushbu chatga rasm qilib yuboring!**
3. Yoki pastdagi tugmalar orqali darhol **Telegram Stars (Yulduzlar)** bilan to'lang!
  `;

  const kb = new InlineKeyboard()
    .text('⭐️ Stars orqali to\'lash', 'action_stars_menu').row()
    .text('💎 VIP Cheksiz Pass', 'action_vip');

  await ctx.reply(text, { parse_mode: 'Markdown', reply_markup: kb });
}

// Rasm qabul qilish: A) Konspekt/Kitob OCR yoki B) To'lov cheki
bot.on('message:photo', async (ctx) => {
  const photos = ctx.message.photo;
  const bestPhoto = photos[photos.length - 1];
  const fileId = bestPhoto.file_id;
  const fileUniqueId = bestPhoto.file_unique_id;

  const session = sessions.get(ctx.chat.id);
  const caption = (ctx.message.caption || '').trim().toLowerCase();
  const isOcrRequest = (session && session.step === 'AWAIT_NOTE_PHOTO') ||
    /konspekt|kitob|darslik|referat|maqola|daftar|qo['`]?lyozma|ocr|slayd/i.test(caption);

  // 1. KONSPEKT / KITOB RASMIDAN SLAYD YARATISH (OCR VISION)
  if (isOcrRequest) {
    const isSubscribed = await isUserSubscribedToChannel(ctx.chat.id);
    if (!isSubscribed) {
      return ctx.reply(getSubscriptionMessage(ctx.from?.first_name), {
        parse_mode: 'Markdown',
        reply_markup: getSubscriptionKeyboard(),
        disable_web_page_preview: true,
      });
    }

    const user = getUser(ctx.chat.id) || getOrCreateUser(ctx.chat.id).user;
    const isVip = isUserVip(ctx.chat.id);
    if (!isVip && user.coins <= 0) {
      await ctx.reply(
        `❌ Sizda taqdimot yaratish uchun imkoniyatlar tugadi!\nKarta: \`${CARD_NUMBER}\`\nYoki 3 ta do'stingizni taklif qiling! (/balance)`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    const waitMsg = await ctx.reply(
      "📸 _Rasm tahlil qilinmoqda, qo'lyozma va matnlar o'qilmoqda (Vision AI)..._",
      { parse_mode: 'Markdown' }
    );

    try {
      const file = await ctx.getFile();
      const fileUrl = `https://api.telegram.org/file/bot${config.botToken}/${file.file_path}`;
      const res = await fetch(fileUrl);
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const ocrResult = await extractTextFromImage(buffer, 'image/jpeg');

      if (!ocrResult || !ocrResult.text || ocrResult.text.length < 15) {
        throw new Error("Rasmda yetarlicha matn yoki mavzu aniqlanmadi. Iltimos, ravshanroq rasm yuboring.");
      }

      sessions.set(ctx.chat.id, {
        topic: ocrResult.topic || 'Konspekt asosidagi taqdimot',
        documentText: ocrResult.text,
        step: 'ASK_CATEGORY',
      });

      await ctx.api.editMessageText(
        ctx.chat.id,
        waitMsg.message_id,
        `📸 *Konspekt / Kitob sahifasi muvaffaqiyatli o'qildi!*\n\n📌 Aniqlangan mavzu: *"${ocrResult.topic}"*\n📝 Matn hajmi: *${ocrResult.text.length} belgi*\n\n1️⃣ *Qaysi soha / yo'nalishga moslab slayd tayyorlaymiz?*`,
        {
          parse_mode: 'Markdown',
          reply_markup: getCategoryKeyboard(),
        }
      );
      return;
    } catch (ocrErr) {
      console.error('[OCR Photo Error]:', ocrErr);
      await ctx.api.editMessageText(
        ctx.chat.id,
        waitMsg.message_id,
        `❌ Rasmdagi matnni o'qishda xatolik bo'ldi:\n_${ocrErr.message}_\n\nIltimos, ravshanroq rasm oling yoki mavzuni matn ko'rinishida yozing.`,
        { parse_mode: 'Markdown' }
      );
      return;
    }
  }

  // 2. TO'LOV CHEKI RASMI (FIRIBGARLIKDAN HIMOYA)
  if (isReceiptDuplicate(fileUniqueId)) {
    return ctx.reply(
      `⚠️ *Bu to'lov cheki allaqachon botga yuborilgan!*\n\nBir xil chekni bir necha marta yuborish orqali koin olish mumkin emas. Agar to'lov bo'yicha savolingiz bo'lsa, adminga murojaat qiling.`,
      { parse_mode: 'Markdown' }
    );
  }

  const pending = hasPendingPayment(ctx.chat.id);
  if (pending) {
    return ctx.reply(
      `⏳ *Siz yuborgan avvalgi to'lov chekingiz hozirda tekshirilmoqda!*\n\nIltimos, admin tekshirib tasdiqlashini kuting. Bir nechta rasmni ketma-ket yuborish shart emas. Admin tasdiqlashi bilan sizga xabar keladi!`,
      { parse_mode: 'Markdown' }
    );
  }

  const payment = createPayment(ctx.chat.id, PRICE_PER_SLIDE, 1, fileId, fileUniqueId);
  const user = getUser(ctx.chat.id);

  await ctx.reply(
    `📩 *To'lov chekingiz tekshiruvga qabul qilindi!*

Admin chekni ko'rib chiqib tasdiqlaganidan so'ng (1-2 daqiqa ichida), balansingizga taqdimot coinlari yoki VIP obuna qo'shiladi va sizga darhol xabar boradi! 🪙

Joriy balansingiz: *${user?.coins || 0} ta* taqdimot.
Iltimos, kuting...`,
    { parse_mode: 'Markdown' }
  );

  if (config.adminId && String(ctx.chat.id) !== String(config.adminId)) {
    try {
      const adminKeyboard = new InlineKeyboard()
        .text('✅ 1 ta coin (5 000)', `pay_ok_${payment.id}_1`)
        .text('💎 3 ta coin (15 000)', `pay_ok_${payment.id}_3`).row()
        .text('🚀 5 ta coin (20 000)', `pay_ok_${payment.id}_5`)
        .text('🔥 10 ta coin (35 000)', `pay_ok_${payment.id}_10`).row()
        .text('👑 30 kunlik VIP Pass (35 000)', `pay_vip_${payment.id}_30`).row()
        .text('❌ Rad etish (Soxta / pul tushmagan)', `pay_no_${payment.id}`).row();

      await bot.api.sendPhoto(
        config.adminId,
        fileId,
        {
          caption: `💳 *Yangi to'lov cheki keldi!*\n\n👤 *Foydalanuvchi:* ${ctx.from?.first_name || ''} ${ctx.from?.last_name || ''} (@${ctx.from?.username || 'yoq'})\n🆔 *ID:* \`${ctx.from?.id}\`\n🪙 *Hozirgi balansi:* ${user?.coins || 0} ta\n\n👇 *Chekni ko'rib, tegishli tugmani bosing:*`,
          parse_mode: 'Markdown',
          reply_markup: adminKeyboard,
        }
      );
    } catch (adminErr) {
      console.warn('[Admin Notify] Chek yuborishda xatolik:', adminErr.message);
    }
  }
});

// Admin to'lovni tasdiqlaganda (Callback query)
bot.callbackQuery(/^pay_ok_(.+)_(.+)$/, async (ctx) => {
  if (String(ctx.from.id) !== String(config.adminId)) {
    return ctx.answerCallbackQuery({ text: 'Faqat admin uchun!', show_alert: true });
  }

  const paymentId = ctx.match[1];
  const coinsAmount = parseInt(ctx.match[2], 10) || 1;
  const updated = approvePayment(paymentId, coinsAmount);

  if (!updated) {
    return ctx.answerCallbackQuery({ text: '⚠️ Bu to\'lov allaqachon ko\'rib chiqilgan yoki topilmadi!', show_alert: true });
  }

  await ctx.answerCallbackQuery({ text: `✅ Tasdiqlandi! +${coinsAmount} coin berildi.` });

  const targetUser = getUser(updated.userId);

  // Admindagi xabarni yangilash (tugmalarni olib tashlash va tasdiq yozuvini qo'shish)
  try {
    const prevCaption = ctx.callbackQuery.message?.caption || '💳 To\'lov cheki';
    await ctx.editMessageCaption({
      caption: `${prevCaption}\n\n━━━━━━━━━━━━━━━━━━━━\n✅ *ADMIN TOMONIDAN TASDIQLANDI!*\n🎁 *Berilgan coin:* +${coinsAmount} ta\n🪙 *Yangi balansi:* ${targetUser?.coins || coinsAmount} ta`,
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: [] },
    });
  } catch (err) {
    console.warn('[Edit Caption Failed]', err.message);
  }

  // Foydalanuvchiga tantanali xabar yuborish
  try {
    await bot.api.sendMessage(
      updated.userId,
      `🎉 *Xushxabar! To'lovingiz admin tomonidan tasdiqlandi!*\n\nHisobingizga **+${coinsAmount} ta taqdimot (coin)** muvaffaqiyatli qo'shildi! 🪙\nJoriy balansingiz: *${targetUser?.coins || coinsAmount} ta* taqdimot.\n\nEndi bemalol slayd tayyorlashingiz mumkin! 🚀`,
      { parse_mode: 'Markdown' }
    );
  } catch (e) {
    console.warn('[Notify User Failed]', e.message);
  }
});

// Admin VIP obunani tasdiqlaganda (Callback query)
bot.callbackQuery(/^pay_vip_(.+)_(.+)$/, async (ctx) => {
  if (String(ctx.from.id) !== String(config.adminId)) {
    return ctx.answerCallbackQuery({ text: 'Faqat admin uchun!', show_alert: true });
  }

  const paymentId = ctx.match[1];
  const days = parseInt(ctx.match[2], 10) || 30;
  const payment = getPaymentById(paymentId);

  if (!payment || payment.status !== 'pending') {
    return ctx.answerCallbackQuery({ text: '⚠️ Bu to\'lov allaqachon ko\'rib chiqilgan yoki topilmadi!', show_alert: true });
  }

  payment.status = 'approved';
  payment.approvedAt = new Date().toISOString();
  payment.vipDays = days;
  setVipSubscription(payment.userId, days);

  await ctx.answerCallbackQuery({ text: `✅ VIP tasdiqlandi! (${days} kun)` });

  try {
    const prevCaption = ctx.callbackQuery.message?.caption || '💳 To\'lov cheki';
    await ctx.editMessageCaption({
      caption: `${prevCaption}\n\n━━━━━━━━━━━━━━━━━━━━\n👑 *ADMIN TOMONIDAN VIP TASDIQLANDI!*\n💎 *VIP Muddat:* ${days} kun cheksiz taqdimotlar`,
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: [] },
    });
  } catch (err) {
    console.warn('[Edit Caption Failed]', err.message);
  }

  try {
    await bot.api.sendMessage(
      payment.userId,
      `🎉 *Tabriklaymiz! Sizning to'lovingiz admin tomonidan tasdiqlandi!*\n\n👑 Hisobingizga **${days} kunlik VIP Cheksiz Obuna (VIP Pass)** berildi! 💎\nEndi siz ${days} kun davomida istalgancha bepul va cheksiz slaydlar tayyorlashingiz mumkin! 🚀`,
      { parse_mode: 'Markdown' }
    );
  } catch (e) {}
});

// Admin to'lovni rad etganda (Callback query)
bot.callbackQuery(/^pay_no_(.+)$/, async (ctx) => {
  if (String(ctx.from.id) !== String(config.adminId)) {
    return ctx.answerCallbackQuery({ text: 'Faqat admin uchun!', show_alert: true });
  }

  const paymentId = ctx.match[1];
  const updated = rejectPayment(paymentId);

  if (!updated) {
    return ctx.answerCallbackQuery({ text: '⚠️ Bu to\'lov allaqachon ko\'rib chiqilgan yoki topilmadi!', show_alert: true });
  }

  await ctx.answerCallbackQuery({ text: '❌ To\'lov rad etildi.' });

  try {
    const prevCaption = ctx.callbackQuery.message?.caption || '💳 To\'lov cheki';
    await ctx.editMessageCaption({
      caption: `${prevCaption}\n\n━━━━━━━━━━━━━━━━━━━━\n❌ *ADMIN TOMONIDAN RAD ETILDI* (Soxta yoki mablag' tushmagan)`,
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: [] },
    });
  } catch (err) {
    console.warn('[Edit Caption Failed]', err.message);
  }

  try {
    await bot.api.sendMessage(
      updated.userId,
      `❌ *To'lov chekingiz tasdiqlanmadi!*\n\nSababi: To'lov mablag'i kartaga tushmagan yoki chek haqiqiy emas. Agar xatolik bo'lsa, adminga murojaat qiling.`,
      { parse_mode: 'Markdown' }
    );
  } catch (e) {
    console.warn('[Notify User Failed]', e.message);
  }
});

// Ovozli xabar qabul qilish (message:voice)
bot.on('message:voice', async (ctx) => {
  const isSubscribed = await isUserSubscribedToChannel(ctx.chat.id);
  if (!isSubscribed) {
    return ctx.reply(getSubscriptionMessage(ctx.from?.first_name), {
      parse_mode: 'Markdown',
      reply_markup: getSubscriptionKeyboard(),
      disable_web_page_preview: true,
    });
  }

  const user = getUser(ctx.chat.id) || getOrCreateUser(ctx.chat.id).user;
  const isVip = isUserVip(ctx.chat.id);

  if (!isVip && user.coins <= 0) {
    await ctx.reply(
      `❌ Sizda taqdimot yaratish uchun imkoniyatlar tugadi!\n\nHar 1 ta taqdimot: *${PRICE_PER_SLIDE.toLocaleString()} so'm*.\nKarta: \`${CARD_NUMBER}\`\n\nYoki 3 ta do'stingizni taklif qilib, +1 ta bepul taqdimot oling! (/balance)`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  const waitMsg = await ctx.reply("🎙 _Ovozingiz tinglanmoqda va tahlil qilinmoqda..._", { parse_mode: 'Markdown' });

  try {
    const file = await ctx.getFile();
    const fileUrl = `https://api.telegram.org/file/bot${config.botToken}/${file.file_path}`;
    const res = await fetch(fileUrl);
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Ovozdan ma'lumotlarni chiqarish
    const voiceData = await processVoiceMessage(buffer);

    sessions.set(ctx.chat.id, {
      topic: voiceData.topic,
      slideCount: voiceData.slideCount,
      category: voiceData.category,
      step: 'ASK_THEME',
    });

    const catObj = getCategory(voiceData.category);

    await ctx.api.editMessageText(
      ctx.chat.id,
      waitMsg.message_id,
      `🎙 *Ovozdan tushunildi:*\n\n📌 Mavzu: *"${voiceData.topic}"*\n🎯 Soha: *${catObj.name}*\n📊 Slaydlar soni: *${voiceData.slideCount} ta*\n\n3️⃣ *Endi taqdimot fon va dizayn uslubini tanlang:*`,
      {
        parse_mode: 'Markdown',
        reply_markup: getThemeKeyboard(),
      }
    );
  } catch (err) {
    console.error('[Voice Error]:', err);
    await ctx.api.editMessageText(
      ctx.chat.id,
      waitMsg.message_id,
      `❌ Ovozli xabarni tushunishda xatolik bo'ldi:\n_${err.message}_\n\nIltimos, qaytadan aniqroq gapiring yoki mavzuni matn qilib yozing.`,
      { parse_mode: 'Markdown' }
    );
  }
});

// Hujjat fayllari qabul qilish (PDF / Word / TXT)
bot.on('message:document', async (ctx) => {
  const isSubscribed = await isUserSubscribedToChannel(ctx.chat.id);
  if (!isSubscribed) {
    return ctx.reply(getSubscriptionMessage(ctx.from?.first_name), {
      parse_mode: 'Markdown',
      reply_markup: getSubscriptionKeyboard(),
      disable_web_page_preview: true,
    });
  }

  const user = getUser(ctx.chat.id) || getOrCreateUser(ctx.chat.id).user;
  const isDocVip = isUserVip(ctx.chat.id);

  if (!isDocVip && user.coins <= 0) {
    await ctx.reply(
      `❌ Sizda taqdimot yaratish uchun imkoniyatlar tugadi!\nKarta: \`${CARD_NUMBER}\`\nYoki 3 ta do'stingizni taklif qiling! (/balance)`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  const doc = ctx.message.document;
  const fileName = doc.file_name || 'hujjat';
  const waitMsg = await ctx.reply(`📄 _"${fileName}" hujjati o'qilmoqda va asosiy xulosalar ajratilmoqda..._`, { parse_mode: 'Markdown' });

  try {
    const file = await ctx.getFile();
    const fileUrl = `https://api.telegram.org/file/bot${config.botToken}/${file.file_path}`;
    const res = await fetch(fileUrl);
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const extractedText = await extractTextFromDocument(buffer, fileName);

    const docTopic = fileName.replace(/\.[^/.]+$/, '').replace(/[_\\-]/g, ' ');

    sessions.set(ctx.chat.id, {
      topic: docTopic,
      documentText: extractedText,
      step: 'ASK_CATEGORY',
    });

    await ctx.api.editMessageText(
      ctx.chat.id,
      waitMsg.message_id,
      `✅ *Hujjat muvaffaqiyatli o'qildi!*\n\n📌 Mavzu: *"${docTopic}"*\n\n1️⃣ *Qaysi soha / yo'nalishga moslab slayd tayyorlaymiz?*`,
      {
        parse_mode: 'Markdown',
        reply_markup: getCategoryKeyboard(),
      }
    );
  } catch (err) {
    console.error('[Doc Error]:', err);
    await ctx.api.editMessageText(
      ctx.chat.id,
      waitMsg.message_id,
      `❌ Hujjatni o'qishda xatolik bo'ldi:\n_${err.message}_\n\nIltimos, PDF, Word (.docx) yoki TXT formatidagi fayl yuboring.`,
      { parse_mode: 'Markdown' }
    );
  }
});

// /help buyrug'i
bot.command('help', async (ctx) => {
  await ctx.reply(
    `📖 *Botdan foydalanish bo'yicha qo'llanma:*

1. **Mavzu yozish:** Shunchaki taqdimot mavzusini yozing.
2. **Ovozli xabar:** Mikrofonni bosib mavzuni gapiring.
3. **Hujjat yuborish:** PDF yoki Word faylingizni tashlang, AI konspekt tayyorlaydi.
4. **Referal:** /balance orqali referal havolangizni oling, har 3 ta do'stingiz uchun +1 ta bepul taqdimot beriladi!
5. **Balans to'ldirish:** /pay orqali to'lov qiling (1 ta taqdimot = 5 000 so'm).
6. **Taklif va talablar:** Adminga murojaat: @${ADMIN_TELEGRAM_USERNAME}`,
    { parse_mode: 'Markdown' }
  );
});

// /taklif yoki /feedback buyrug'i
bot.command(['taklif', 'talab', 'feedback'], async (ctx) => {
  const keyboard = new InlineKeyboard();
  if (config.miniAppUrl && config.miniAppUrl.startsWith('https://')) {
    keyboard.webApp('💡 Mini App orqali taklif yuborish', config.miniAppUrl).row();
  }
  keyboard.url('✈️ Adminga to\'g\'ridan-to\'g\'ri yozish', `https://t.me/${ADMIN_TELEGRAM_USERNAME}`);

  await ctx.reply(
    `📬 *Adminga taklif va talablar:*

Botni yaxshilash, yangi funksiyalar qo'shish yoki hamkorlik bo'yicha takliflaringiz bo'lsa, xursand bo'lamiz!

👤 *Admin:* @${ADMIN_TELEGRAM_USERNAME}
📱 _Mini App ichidagi "Taklif & Yordam" bo'limidan ham xabar yuborishingiz mumkin._`,
    {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    }
  );
});

// /cancel buyrug'i
bot.command('cancel', async (ctx) => {
  sessions.delete(ctx.chat.id);
  await ctx.reply("❌ Jarayon bekor qilindi. Yangi taqdimot uchun mavzu yozishingiz mumkin.");
});

bot.callbackQuery('cancel_action', async (ctx) => {
  sessions.delete(ctx.chat.id);
  await ctx.answerCallbackQuery({ text: 'Bekor qilindi' });
  await ctx.reply("❌ Taqdimot yaratish bekor qilindi.");
});

// 1-qadam: Soha / Kategoriya tanlanganda -> Til tanlashga o'tish
bot.callbackQuery(/^cat_([a-z]+)$/, async (ctx) => {
  const catKey = ctx.match[1];
  const session = sessions.get(ctx.chat.id);

  if (!session || !session.topic) {
    await ctx.answerCallbackQuery({ text: 'Iltimos, avval mavzuni yozing' });
    await ctx.reply("Iltimos, taqdimot mavzusini yozib yuboring:");
    return;
  }

  session.category = catKey;
  session.step = 'ASK_LANG';
  sessions.set(ctx.chat.id, session);

  const catObj = getCategory(catKey);
  await ctx.answerCallbackQuery();
  await ctx.reply(
    `✅ Soha: *${catObj.name}*\n\n2️⃣ *Taqdimot qaysi tilda tayyorlansin?*`,
    {
      parse_mode: 'Markdown',
      reply_markup: getLanguageKeyboard(),
    }
  );
});

// 2-qadam: Til tanlanganda -> Slaydlar soniga o'tish
bot.callbackQuery(/^lang_([a-z]+)$/, async (ctx) => {
  const langKey = ctx.match[1];
  const session = sessions.get(ctx.chat.id);

  if (!session || !session.topic) {
    await ctx.answerCallbackQuery({ text: 'Iltimos, avval mavzuni yozing' });
    await ctx.reply("Iltimos, taqdimot mavzusini yozib yuboring:");
    return;
  }

  session.language = langKey;
  session.step = 'ASK_COUNT';
  sessions.set(ctx.chat.id, session);

  const langTitle = LANG_NAMES[langKey] || langKey;
  await ctx.answerCallbackQuery();
  await ctx.reply(
    `✅ Til: *${langTitle}*\n\n3️⃣ *Necha betli taqdimot tayyorlaymiz?*\nTugmalardan tanlang yoki istalgan sonni (masalan: *18*) yozing:`,
    {
      parse_mode: 'Markdown',
      reply_markup: getSlideCountKeyboard(),
    }
  );
});

// 3-qadam: Slaydlar soni tanlanganda -> Fon uslubiga o'tish
bot.callbackQuery(/^count_(\d+)$/, async (ctx) => {
  const count = parseInt(ctx.match[1], 10);
  const session = sessions.get(ctx.chat.id);

  if (!session || !session.topic) {
    await ctx.answerCallbackQuery({ text: 'Iltimos, avval mavzuni yozing' });
    await ctx.reply("Iltimos, taqdimot mavzusini yozib yuboring:");
    return;
  }

  session.slideCount = count;
  session.step = 'ASK_THEME';
  sessions.set(ctx.chat.id, session);

  await ctx.answerCallbackQuery();
  await ctx.reply(
    `✅ Slaydlar soni: *${count} ta*\n\n4️⃣ *Endi taqdimot fon va dizayn uslubini tanlang:*`,
    {
      parse_mode: 'Markdown',
      reply_markup: getThemeKeyboard(),
    }
  );
});

// 4-qadam: Fon uslubi tanlanganda va generatsiya boshlash
bot.callbackQuery(/^theme_([a-z]+)$/, async (ctx) => {
  const theme = ctx.match[1];
  const session = sessions.get(ctx.chat.id);

  if (!session || !session.topic) {
    await ctx.answerCallbackQuery({ text: 'Sessiya topilmadi' });
    await ctx.reply("Iltimos, taqdimot mavzusini qaytadan yozib yuboring.");
    return;
  }

  // Coin tekshirish va yechish
  const user = getUser(ctx.chat.id) || getOrCreateUser(ctx.chat.id).user;
  const isVip = isUserVip(ctx.chat.id);
  if (!isVip && user.coins <= 0) {
    await ctx.answerCallbackQuery({ text: 'Imkoniyatlar tugagan' });
    await ctx.reply(
      `❌ Sizda taqdimot yaratish uchun imkoniyatlar tugadi!\n\nHar 1 ta taqdimot: *${PRICE_PER_SLIDE.toLocaleString()} so'm*.\nKarta: \`${CARD_NUMBER}\`\n\nYoki 3 ta do'stingizni taklif qilib, bepul coin oling! (/balance)`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  deductCoin(ctx.chat.id);

  session.theme = theme;
  sessions.delete(ctx.chat.id);

  await ctx.answerCallbackQuery();

  const themeName = THEME_NAMES[theme] || theme;
  const langKey = session.language || 'uz';
  const langName = LANG_NAMES[langKey] || langKey;
  const catObj = getCategory(session.category || 'general', langKey);

  const statusText = {
    ru: `⏳ *" ${session.topic} "*\n\n🎯 Направление: *${catObj.name}*\n🌐 Язык: *${langName}*\n📊 Слайды: *${session.slideCount}*\n🎨 Стиль: *${themeName}*\n🪙 Баланс: *${isVip ? '💎 VIP' : user.coins}*\n\n_Формирование структуры слайдов, подбор визуалов и создание PowerPoint (.pptx)..._`,
    en: `⏳ *" ${session.topic} "*\n\n🎯 Field: *${catObj.name}*\n🌐 Language: *${langName}*\n📊 Slides: *${session.slideCount}*\n🎨 Theme: *${themeName}*\n🪙 Balance: *${isVip ? '💎 VIP' : user.coins}*\n\n_Structuring slide architecture, selecting visuals, and generating PowerPoint (.pptx)..._`,
    tg: `⏳ *" ${session.topic} "*\n\n🎯 Самт: *${catObj.name}*\n🌐 Забон: *${langName}*\n📊 Слайдҳо: *${session.slideCount}*\n🎨 Тарҳ: *${themeName}*\n🪙 Бақия: *${isVip ? '💎 VIP' : user.coins}*\n\n_Таҳияи нақшаи слайдҳо, интихоби аксҳо ва ташаккули PowerPoint (.pptx)..._`,
  }[langKey] || `⏳ *" ${session.topic} "*\n\n🎯 Yo'nalish: *${catObj.name}*\n🌐 Til: *${langName}*\n📊 Slaydlar: *${session.slideCount} ta*\n🎨 Uslub: *${themeName}*\n🪙 Qolgan balansingiz: *${isVip ? '💎 VIP' : user.coins + ' ta'}*\n\n_Slaydlar rejasi tuzilmoqda, rasmlar yuklanmoqda va PowerPoint (.pptx) shakllantirilmoqda..._`;

  const statusMsg = await ctx.reply(statusText, { parse_mode: 'Markdown' });

  try {
    // 1. AI orqali generatsiya
    const data = await generatePresentationData({
      topic: session.topic,
      slideCount: session.slideCount,
      language: session.language || 'uz',
      theme: session.theme,
      category: session.category || 'general',
      documentText: session.documentText || '',
      organization: session.organization || '',
    });

    // 2. PPTX yaratish
    const { filePath, fileName, speakerNotesList } = await createPptx(data);

    // Bazaga saqlash
    savePresentationRecord({
      userId: ctx.chat.id,
      username: ctx.from.username || '',
      firstName: ctx.from.first_name || '',
      topic: data.title,
      category: session.category || 'general',
      slideCount: data.slides?.length || session.slideCount,
      language: session.language || 'uz',
      theme: session.theme,
      fileName,
      downloadUrl: `/api/download/${fileName}`,
    });

    // Adminga hisobot yuborish (Live Alert)
    try {
      const adminReport = `
📊 *Yangi taqdimot yaratildi!*
👤 *Foydalanuvchi:* ${ctx.from.first_name} ${ctx.from.username ? `(@${ctx.from.username})` : ''}
🆔 *ID:* \`${ctx.chat.id}\`
📌 *Mavzu:* "${data.title}"
🎯 *Soha:* ${catObj.name}
🌐 *Til:* ${langName}
📄 *Slaydlar:* ${data.slides?.length || session.slideCount} ta
🎨 *Uslub:* ${themeName}
🪙 *Qolgan balansi:* ${isVip ? '💎 VIP' : user.coins + ' ta'}
      `;
      await ctx.api.sendMessage(config.adminId, adminReport, { parse_mode: 'Markdown' });
    } catch (_) {}

    // 3. Foydalanuvchiga yuborish
    const docCaption = {
      ru: `✅ *${data.title}*\n\n🎯 Направление: ${catObj.name}\n🌐 Язык: ${langName}\n📄 Слайды: ${data.slides?.length || session.slideCount}\n🎨 Стиль: ${themeName}\n🪙 Оставшийся баланс: *${isVip ? '💎 VIP' : user.coins}*\n\n_Файл можно открыть и редактировать в программе PowerPoint._`,
      en: `✅ *${data.title}*\n\n🎯 Field: ${catObj.name}\n🌐 Language: ${langName}\n📄 Slides: ${data.slides?.length || session.slideCount}\n🎨 Theme: ${themeName}\n🪙 Remaining balance: *${isVip ? '💎 VIP' : user.coins}*\n\n_You can open and present this file in PowerPoint._`,
      tg: `✅ *${data.title}*\n\n🎯 Самт: ${catObj.name}\n🌐 Забон: ${langName}\n📄 Слайдҳо: ${data.slides?.length || session.slideCount}\n🎨 Тарҳ: ${themeName}\n🪙 Бақияи шумо: *${isVip ? '💎 VIP' : user.coins}*\n\n_Шумо метавонед файлро дар барномаи PowerPoint кушоед._`,
    }[langKey] || `✅ *${data.title}*\n\n🎯 Soha: ${catObj.name}\n🌐 Til: ${langName}\n📄 Slaydlar: ${data.slides?.length || session.slideCount} ta\n🎨 Uslub: ${themeName}\n🪙 Qolgan imkoniyatlaringiz: *${isVip ? '💎 VIP' : user.coins + ' ta'}*\n\n_Faylni PowerPoint dasturida ochishingiz mumkin._`;

    await ctx.replyWithDocument(
      new InputFile(filePath, `${data.title || 'prezentatsiya'}.pptx`),
      {
        caption: docCaption,
        parse_mode: 'Markdown',
      }
    );

    // 4. Spiker uchun nutq matni (Speaker Notes)
    if (speakerNotesList && speakerNotesList.length > 0) {
      const notesHeader = {
        ru: `🎙 *Готовая речь докладчика для защиты (Speaker Notes):*\n\n`,
        en: `🎙 *Presenter Speech & Talking Points (Speaker Notes):*\n\n`,
        tg: `🎙 *Матни нутқи баромадкунанда барои ҳимоя (Speaker Notes):*\n\n`,
      }[langKey] || `🎙 *Himoya va ma'ruza uchun tayyor spiker nutqi (Speaker Notes):*\n\n`;

      const slidePrefix = {
        ru: (num) => `*Слайд ${num}:*`,
        en: (num) => `*Slide ${num}:*`,
        tg: (num) => `*Слайди ${num}:*`,
      }[langKey] || ((num) => `*${num}-slayd:*`);

      const notesFooter = {
        ru: `\n_(Полный текст речи для всех слайдов также встроен в файл PowerPoint!)_`,
        en: `\n_(Complete speaker notes for all slides are also embedded inside the PowerPoint file!)_`,
        tg: `\n_(Матни пурраи нутқ дар дохили худи файли PowerPoint низ ҷойгир шудааст!)_`,
      }[langKey] || `\n_(Barcha slaydlar nutqi PowerPoint faylining o'zida ham saqlangan!)_`;

      let notesText = notesHeader;
      speakerNotesList.slice(0, 5).forEach((sn, i) => {
        if (sn.notes) {
          notesText += `${slidePrefix(i + 1)} ${sn.notes}\n\n`;
        }
      });
      notesText += notesFooter;

      await ctx.reply(notesText, { parse_mode: 'Markdown' });
    }

    // 5. Himoya va komissiya savol-javoblari (Defense Q&A)
    if (data.qaList && data.qaList.length > 0) {
      const qaHeader = {
        ru: `🎓 *Вопросы и ответы для защиты перед комиссией (Q&A):*\n_(Возможные вопросы преподавателя/комиссии и образцовые ответы)_\n\n`,
        en: `🎓 *Defense & Examination Q&A (Anticipated Questions & Model Answers):*\n_(Key committee questions and authoritative responses)_\n\n`,
        tg: `🎓 *Саволу ҷавобҳои эҳтимолӣ барои ҳимоя дар назди комиссия (Q&A):*\n_(Саволҳои муҳими омӯзгор ва посухҳои намунавӣ)_\n\n`,
      }[langKey] || `🎓 *Himoya va komissiya savol-javoblari (Q&A):*\n_(O'qituvchi yoki hay'at a'zolari berishi mumkin bo'lgan savollar va tayyor namunali javoblar)_\n\n`;

      const qLabel = {
        ru: (num) => `❓ *Вопрос ${num}:*`,
        en: (num) => `❓ *Question ${num}:*`,
        tg: (num) => `❓ *Саволи ${num}:*`,
      }[langKey] || ((num) => `❓ *${num}-savol:*`);

      const aLabel = {
        ru: `💡 *Ответ:*`,
        en: `💡 *Answer:*`,
        tg: `💡 *Ҷавоб:*`,
      }[langKey] || `💡 *Javob:*`;

      let qaText = qaHeader;
      data.qaList.slice(0, 4).forEach((item, idx) => {
        qaText += `${qLabel(idx + 1)} ${item.question}\n${aLabel} ${item.answer}\n\n`;
      });

      await ctx.reply(qaText.trim(), { parse_mode: 'Markdown' });
    }

    try {
      await ctx.api.deleteMessage(ctx.chat.id, statusMsg.message_id);
    } catch (_) {}
  } catch (error) {
    console.error('Xatolik:', error);
    // Xatolik bo'lsa coinni qaytarish (VIP bo'lmasa)
    if (!isVip) {
      addCoins(ctx.chat.id, 1);
    }
    await ctx.reply(
      `❌ Taqdimot tayyorlashda qisqa uzilish bo'ldi:\n_${error.message}_\n\nCoin hisobingizga qaytarildi. Iltimos, qayta urinib ko'ring.`,
      { parse_mode: 'Markdown' }
    );
  }
});

// /promo buyrug'i
bot.command('promo', async (ctx) => {
  const isSubscribed = await isUserSubscribedToChannel(ctx.chat.id);
  if (!isSubscribed) {
    return ctx.reply(getSubscriptionMessage(ctx.from?.first_name), {
      parse_mode: 'Markdown',
      reply_markup: getSubscriptionKeyboard(),
      disable_web_page_preview: true,
    });
  }

  const match = (ctx.match || '').trim();
  if (match) {
    const res = redeemPromoCode(ctx.chat.id, match);
    return ctx.reply(res.message, { parse_mode: 'Markdown' });
  }

  sessions.set(ctx.chat.id, { step: 'AWAIT_PROMO_CODE' });
  await ctx.reply(
    `🎟 *Promo-kodni kiriting:*\n\nAgarda sizda maxsus promo-kod bo'lsa (masalan: *TALABA*, *START5*, *TATU*, *SAMDU*, *VIP2026*), uni yozib yuboring va hisobingizga qo'shimcha bepul koinlar oling! 🪙\n\n_Bekor qilish uchun: /cancel_`,
    { parse_mode: 'Markdown' }
  );
});

bot.callbackQuery('action_promo', async (ctx) => {
  await ctx.answerCallbackQuery();
  sessions.set(ctx.chat.id, { step: 'AWAIT_PROMO_CODE' });
  await ctx.reply(
    `🎟 *Promo-kodni yozib yuboring:*\n\n(Masalan: \`TALABA\`, \`START5\`, \`TATU\`, \`VIP2026\`)`,
    { parse_mode: 'Markdown' }
  );
});

// /vip buyrug'i (VIP Cheksiz obuna haqida)
bot.command('vip', async (ctx) => {
  await showVipInfo(ctx);
});

bot.callbackQuery('action_vip', async (ctx) => {
  await ctx.answerCallbackQuery();
  await showVipInfo(ctx);
});

async function showVipInfo(ctx) {
  const isVip = isUserVip(ctx.chat.id);
  const user = getUser(ctx.chat.id);

  let statusHeader = '';
  if (isVip && user?.vipUntil) {
    const untilDate = new Date(user.vipUntil).toLocaleDateString('uz-UZ');
    statusHeader = `👑 *Sizning VIP maqomingiz: FAOL!* (${untilDate} gacha cheksiz taqdimotlar)\n\n`;
  }

  const text = `
${statusHeader}💎 *VIP Cheksiz Obuna (VIP Pass):*

Talabalar, o'qituvchilar va tadbirkorlar uchun cheklovlarsiz eng qulay tarif!

🔥 *VIP afzalliklari:*
• **Cheksiz taqdimotlar:** 30 kun davomida istalgancha slayd yarating (koin sarflanmaydi!)
• **Navbatsiz va ustuvor:** AI serverlarida 1-navbatda generatsiya qilinadi.
• **Konspekt & Foto OCR:** Daftardagi yozuv yoki kitoblardan cheksiz slaydlar.
• **To'liq Q&A va Spiker Nutqi:** Himoya va ma'ruza uchun tayyor savol-javoblar.

💰 *VIP Narxi:*
• **30 kunlik VIP Pass** — **35 000 so'm** (yoki 100 ⭐️ Stars)

👇 *To'lov usulini tanlang:*
  `.trim();

  const kb = new InlineKeyboard()
    .text('⭐️ Stars orqali to\'lash (100 Stars)', 'buy_vip_stars_30_100').row()
    .text('💳 Karta orqali to\'lash (35 000 so\'m)', 'action_pay_vip_card').row()
    .text('🔙 Orqaga', 'action_balance');

  await ctx.reply(text, { parse_mode: 'Markdown', reply_markup: kb });
}

bot.callbackQuery('action_pay_vip_card', async (ctx) => {
  await ctx.answerCallbackQuery();
  const text = `
💳 *VIP Pass uchun karta orqali to'lov:*

Summa: **35 000 so'm** (30 kunlik cheksiz kirish)
Karta raqami: \`${CARD_NUMBER}\`
_(Humo / Uzcard)_

📌 To'lovni amalga oshirgach, to'lov cheki (screenshot yoki rasm)ni **to'g'ridan-to'g'ri ushbu chatga rasm qilib yuboring!** Admin tasdiqlashi bilan profilingiz darhol VIP ga o'tadi.
  `.trim();
  await ctx.reply(text, { parse_mode: 'Markdown' });
});

// /ocr yoki /konspekt buyrug'i
bot.command(['ocr', 'konspekt', 'foto', 'photo'], async (ctx) => {
  sessions.set(ctx.chat.id, { step: 'AWAIT_NOTE_PHOTO' });
  await ctx.reply(
    `📸 *Konspekt, kitob sahifasi yoki qo'lyozmani rasmga olib yuboring!*

Vision AI qo'lyozma va bosma matnlarni to'liq o'qib, undan chiroyli professional PowerPoint taqdimot tayyorlab beradi.

👉 *Rasmni to'g'ridan-to'g'ri chatga yuboring:*`,
    { parse_mode: 'Markdown' }
  );
});

bot.callbackQuery('action_ocr', async (ctx) => {
  await ctx.answerCallbackQuery();
  sessions.set(ctx.chat.id, { step: 'AWAIT_NOTE_PHOTO' });
  await ctx.reply(
    `📸 *Daftar konspekti yoki kitob sahifasini rasmga olib yuboring!*

AI matnni o'zi o'qib, tartibli slaydga aylantiradi.`,
    { parse_mode: 'Markdown' }
  );
});

// Foydalanuvchi matn yozganda
bot.on('message:text', async (ctx) => {
  const text = ctx.message.text.trim();
  if (text.startsWith('/')) return;

  const isSubscribed = await isUserSubscribedToChannel(ctx.chat.id);
  if (!isSubscribed) {
    return ctx.reply(getSubscriptionMessage(ctx.from?.first_name), {
      parse_mode: 'Markdown',
      reply_markup: getSubscriptionKeyboard(),
      disable_web_page_preview: true,
    });
  }

  const session = sessions.get(ctx.chat.id);

  // 1. Promo-kod kiritish holati
  if (session && session.step === 'AWAIT_PROMO_CODE') {
    sessions.delete(ctx.chat.id);
    const promoRes = redeemPromoCode(ctx.chat.id, text);
    await ctx.reply(promoRes.message, { parse_mode: 'Markdown' });
    return;
  }

  // 2. Agar foydalanuvchi slayd sonini qo'lda raqam qilib yozgan bo'lsa
  if (session && session.step === 'ASK_COUNT') {
    const customCount = parseInt(text, 10);
    if (!isNaN(customCount) && customCount >= 3 && customCount <= 25) {
      session.slideCount = customCount;
      session.step = 'ASK_THEME';
      sessions.set(ctx.chat.id, session);

      await ctx.reply(
        `✅ Slaydlar soni: *${customCount} ta* deb belgilandi.\n\n4️⃣ *Endi taqdimot fon va dizayn uslubini tanlang:*`,
        {
          parse_mode: 'Markdown',
          reply_markup: getThemeKeyboard(),
        }
      );
      return;
    }
  }

  // Coin tekshirish (VIP foydalanuvchilar cheksiz foydalanadi)
  const user = getUser(ctx.chat.id) || getOrCreateUser(ctx.chat.id).user;
  const isVip = isUserVip(ctx.chat.id);

  if (!isVip && user.coins <= 0) {
    await ctx.reply(
      `❌ Sizda taqdimot yaratish uchun imkoniyatlar tugadi!\n\nHar 1 ta taqdimot: *${PRICE_PER_SLIDE.toLocaleString()} so'm*.\nKarta: \`${CARD_NUMBER}\`\n\nYoki 3 ta do'stingizni taklif qiling! (/balance)\nYoki /vip orqali cheksiz pass oling!`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  // 3. YouTube havola aniqlash
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;
  const ytMatch = text.match(youtubeRegex);
  if (ytMatch) {
    const videoUrl = ytMatch[0].startsWith('http') ? ytMatch[0] : `https://${ytMatch[0]}`;
    let videoTitle = '';
    try {
      const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`);
      if (oembedRes.ok) {
        const oembedData = await oembedRes.json();
        videoTitle = oembedData.title || '';
      }
    } catch (_) {}

    const topicToUse = videoTitle || `YouTube Video Tahlili (${ytMatch[1]})`;
    sessions.set(ctx.chat.id, {
      topic: topicToUse,
      step: 'ASK_CATEGORY',
    });

    await ctx.reply(
      `🎥 *YouTube video aniqlandi!*\n\n📌 Mavzu: *"${topicToUse}"*\n\n1️⃣ *Qaysi soha / yo'nalishga moslab slayd tayyorlaymiz?*`,
      {
        parse_mode: 'Markdown',
        reply_markup: getCategoryKeyboard(),
      }
    );
    return;
  }

  // 4. Oddiy matn / yangi mavzu
  sessions.set(ctx.chat.id, {
    topic: text,
    step: 'ASK_CATEGORY',
  });

  await ctx.reply(
    `📌 *Mavzu:* "${text}"\n\n1️⃣ *Qaysi soha / yo'nalishga moslab tayyorlaymiz?*`,
    {
      parse_mode: 'Markdown',
      reply_markup: getCategoryKeyboard(),
    }
  );
});

// /admin buyrug'i (Admin boshqaruv paneli)
bot.command('admin', async (ctx) => {
  if (String(ctx.chat.id) !== config.adminId) {
    return ctx.reply("❌ Bu buyruq faqat bot admini uchun!");
  }

  const stats = getStats();
  const recent = getAllPresentations(8);

  let text = `👑 *Admin Boshqaruv Paneli:*\n\n`;
  text += `👥 *Jami foydalanuvchilar:* ${stats.totalUsers} ta\n`;
  text += `📊 *Jami taqdimotlar:* ${stats.totalPresentations} ta\n`;
  text += `🪙 *Ishlatilgan coinlar:* ${stats.totalCoinsUsed} ta\n\n`;
  text += `📝 *So'nggi taqdimotlar:*\n`;

  if (!recent.length) {
    text += `_Hozircha taqdimotlar yo'q._\n`;
  } else {
    recent.forEach((p, idx) => {
      text += `${idx + 1}. *${p.firstName}* ${p.username ? `(@${p.username})` : `[ID:${p.userId}]`}: "${p.topic}" (${p.slideCount} ta slayd)\n`;
    });
  }

  text += `\n💡 *Foydalanuvchiga coin berish:* \n\`/give <ID> <SON>\` (masalan: \`/give 8388288136 5\`)`;

  await ctx.reply(text, { parse_mode: 'Markdown' });
});

// /give buyrug'i (Foydalanuvchiga coin taqdim qilish)
bot.command('give', async (ctx) => {
  if (String(ctx.chat.id) !== config.adminId) {
    return ctx.reply("❌ Bu buyruq faqat bot admini uchun!");
  }

  const args = (ctx.match || '').trim().split(/\s+/);
  if (args.length < 2) {
    return ctx.reply("Qo'llash: `/give <userId> <amount>`\nMasalan: `/give 8388288136 5`", { parse_mode: 'Markdown' });
  }

  const targetId = args[0];
  const amount = parseInt(args[1], 10);

  if (isNaN(amount) || amount <= 0) {
    return ctx.reply("❌ Coin miqdori musbat butun son bo'lishi kerak.");
  }

  giveCoins(targetId, amount);
  const targetUser = getUser(targetId);

  try {
    await bot.api.sendMessage(
      targetId,
      `🎉 *Tabriklaymiz!*\n\nAdmin sizning hisobingizga **+${amount} ta bepul taqdimot (coin)** taqdim etdi! 🪙\n\nJoriy balansingiz: *${targetUser?.coins || amount} ta* taqdimot.`,
      { parse_mode: 'Markdown' }
    );
  } catch (_) {}

  await ctx.reply(`✅ *Foydalanuvchi* (\`${targetId}\`)ga **+${amount} ta coin** muvaffaqiyatli berildi! 🪙\nUning joriy balansi: *${targetUser?.coins || amount} ta*`, { parse_mode: 'Markdown' });
});
