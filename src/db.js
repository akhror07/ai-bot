import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve('data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PAYMENTS_FILE = path.join(DATA_DIR, 'payments.json');
const PRESENTATIONS_FILE = path.join(DATA_DIR, 'presentations.json');
const FEEDBACKS_FILE = path.join(DATA_DIR, 'feedbacks.json');
const PROMOS_FILE = path.join(DATA_DIR, 'promos.json');

// In-memory cache
let users = new Map();
let payments = [];
let presentations = [];
let feedbacks = [];
let promoCodes = [
  { code: 'TALABA', coins: 2, maxUses: 2000, usedBy: [] },
  { code: 'START5', coins: 2, maxUses: 2000, usedBy: [] },
  { code: 'TATU', coins: 3, maxUses: 1000, usedBy: [] },
  { code: 'SAMDU', coins: 3, maxUses: 1000, usedBy: [] },
  { code: 'VIP2026', coins: 3, maxUses: 1000, usedBy: [] },
  { code: 'AHROR', coins: 5, maxUses: 500, usedBy: [] },
];

function loadData() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
      users = new Map(Object.entries(data));
    }
  } catch (e) {
    console.error('[DB] Users yuklashda xatolik:', e.message);
  }

  try {
    if (fs.existsSync(PAYMENTS_FILE)) {
      payments = JSON.parse(fs.readFileSync(PAYMENTS_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('[DB] Payments yuklashda xatolik:', e.message);
  }

  try {
    if (fs.existsSync(PRESENTATIONS_FILE)) {
      presentations = JSON.parse(fs.readFileSync(PRESENTATIONS_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('[DB] Presentations yuklashda xatolik:', e.message);
  }

  try {
    if (fs.existsSync(FEEDBACKS_FILE)) {
      feedbacks = JSON.parse(fs.readFileSync(FEEDBACKS_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('[DB] Feedbacks yuklashda xatolik:', e.message);
  }

  try {
    if (fs.existsSync(PROMOS_FILE)) {
      const loaded = JSON.parse(fs.readFileSync(PROMOS_FILE, 'utf-8'));
      if (Array.isArray(loaded) && loaded.length > 0) {
        promoCodes = loaded;
      }
    }
  } catch (e) {
    console.error('[DB] Promos yuklashda xatolik:', e.message);
  }
}

function savePromoCodes() {
  try {
    fs.writeFileSync(PROMOS_FILE, JSON.stringify(promoCodes, null, 2), 'utf-8');
  } catch (e) {
    console.error('[DB] Promos saqlashda xatolik:', e.message);
  }
}

function saveUsers() {
  try {
    const obj = Object.fromEntries(users);
    fs.writeFileSync(USERS_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (e) {
    console.error('[DB] Users saqlashda xatolik:', e.message);
  }
}

function savePayments() {
  try {
    fs.writeFileSync(PAYMENTS_FILE, JSON.stringify(payments, null, 2), 'utf-8');
  } catch (e) {
    console.error('[DB] Payments saqlashda xatolik:', e.message);
  }
}

function savePresentations() {
  try {
    fs.writeFileSync(PRESENTATIONS_FILE, JSON.stringify(presentations, null, 2), 'utf-8');
  } catch (e) {
    console.error('[DB] Presentations saqlashda xatolik:', e.message);
  }
}

function saveFeedbacks() {
  try {
    fs.writeFileSync(FEEDBACKS_FILE, JSON.stringify(feedbacks, null, 2), 'utf-8');
  } catch (e) {
    console.error('[DB] Feedbacks saqlashda xatolik:', e.message);
  }
}

// Boshlang'ich yuklash
loadData();

export const CARD_NUMBER = '9860160142530080';
export const PRICE_PER_SLIDE = 5000; // 5,000 UZS
export const ADMIN_TELEGRAM_USERNAME = 'akhrorov18';

/**
 * Foydalanuvchini oladi yoki yangi yaratadi (Boshlang'ich 10 ta bepul coin beriladi).
 * Agar referal orqali kirgan bo'lsa, taklif qilganni hisobga oladi (har 3 ta do'stga +1 coin).
 */
export function getOrCreateUser(userId, info = {}, referrerId = null) {
  const idStr = String(userId);
  let user = users.get(idStr);

  if (user) {
    user.lastActive = new Date().toISOString();
    if (info.username) user.username = info.username;
    if (info.firstName) user.firstName = info.firstName;
    saveUsers();
    return { user, isNew: false, bonusGiven: false, referrer: null };
  }

  // Yangi foydalanuvchi: 5 ta bepul taqdimot imkoniyati
  user = {
    userId: idStr,
    username: info.username || '',
    firstName: info.firstName || 'Foydalanuvchi',
    coins: 5, // Boshlang'ich 5 ta tekin imkoniyat!
    usedCoins: 0,
    referrerId: null,
    referralsCount: 0,
    referralProgress: 0, // Har 3 taga yetganda 1 coin beriladi
    channelBonusClaimed: false, // Telegram kanalga a'zo bo'lganlik bonusi
    isChannelSubscribed: false, // Rasmiy kanalga a'zolik holati
    vipUntil: null, // VIP obuna muddati (ISO sana)
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
  };

  let bonusGiven = false;
  let referrerUser = null;

  if (referrerId && String(referrerId) !== idStr) {
    const refStr = String(referrerId);
    referrerUser = users.get(refStr);
    if (referrerUser) {
      user.referrerId = refStr;
      referrerUser.referralsCount = (referrerUser.referralsCount || 0) + 1;
      referrerUser.referralProgress = (referrerUser.referralProgress || 0) + 1;

      if (referrerUser.referralProgress >= 3) {
        referrerUser.referralProgress = 0;
        referrerUser.coins = (referrerUser.coins || 0) + 1;
        bonusGiven = true;
      }
    }
  }

  users.set(idStr, user);
  saveUsers();

  return { user, isNew: true, bonusGiven, referrer: referrerUser };
}

export function getUser(userId) {
  const idStr = String(userId);
  return users.get(idStr) || null;
}

export function setUserSubscribed(userId, isSubscribed = true) {
  const idStr = String(userId);
  const user = users.get(idStr);
  if (user) {
    user.isChannelSubscribed = Boolean(isSubscribed);
    saveUsers();
    return true;
  }
  return false;
}

export function getAllUsers() {
  return Array.from(users.values());
}

/**
 * 1 ta coin yechadi (VIP foydalanuvchilarda coin kamaymaydi).
 */
export function deductCoin(userId) {
  const idStr = String(userId);
  const user = users.get(idStr);
  if (!user) return false;

  // VIP foydalanuvchi tekshiruvi (cheksiz taqdimotlar)
  if (user.vipUntil && new Date(user.vipUntil) > new Date()) {
    user.usedCoins = (user.usedCoins || 0) + 1;
    saveUsers();
    return true;
  }

  if (user.coins > 0) {
    user.coins -= 1;
    user.usedCoins = (user.usedCoins || 0) + 1;
    saveUsers();
    return true;
  }

  return false;
}

export function addCoins(userId, amount) {
  const idStr = String(userId);
  const user = users.get(idStr);
  if (!user) return false;

  user.coins = (user.coins || 0) + amount;
  saveUsers();
  return true;
}

export function giveCoins(userId, amount) {
  return addCoins(userId, amount);
}

export function claimChannelBonus(userId, bonusAmount = 2) {
  const idStr = String(userId);
  const user = users.get(idStr);
  if (!user) return { success: false, error: 'Foydalanuvchi topilmadi' };
  if (user.channelBonusClaimed) {
    return { success: false, error: 'Siz allaqachon kanal uchun bonus koinlarni olgansiz!' };
  }

  user.channelBonusClaimed = true;
  user.coins = (user.coins || 0) + bonusAmount;
  saveUsers();
  return { success: true, coins: user.coins, bonusAmount };
}

// ================================================================
// TAQDIMOTLAR TARIXI VA HISOBOTLAR (ADMIN VA SLAYDLARIM)
// ================================================================

export function savePresentationRecord(data) {
  const record = {
    id: `pres_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    userId: String(data.userId || ''),
    username: data.username || '',
    firstName: data.firstName || 'Foydalanuvchi',
    topic: data.topic || '',
    category: data.category || 'general',
    slideCount: data.slideCount || 6,
    language: data.language || 'uz',
    theme: data.theme || 'ocean',
    fileName: data.fileName || '',
    downloadUrl: data.downloadUrl || '',
    createdAt: new Date().toISOString(),
  };

  presentations.unshift(record); // eng yangisini boshiga qo'shish
  // Xotirada ko'pi bilan 2000 ta taqdimotni saqlash
  if (presentations.length > 2000) presentations = presentations.slice(0, 2000);
  savePresentations();
  return record;
}

export function getUserPresentations(userId) {
  const idStr = String(userId);
  return presentations.filter(p => p.userId === idStr);
}

export function getAllPresentations(limit = 100) {
  return presentations.slice(0, limit);
}

export function getStats() {
  const allU = Array.from(users.values());
  const totalCoinsUsed = allU.reduce((acc, u) => acc + (u.usedCoins || 0), 0);
  return {
    totalUsers: allU.length,
    totalPresentations: presentations.length,
    totalCoinsUsed,
    totalPayments: payments.length,
  };
}

export function isReceiptDuplicate(fileUniqueId) {
  if (!fileUniqueId) return false;
  return payments.some(p => p.fileUniqueId === fileUniqueId);
}

export function hasPendingPayment(userId) {
  const idStr = String(userId);
  const now = Date.now();
  // 15 daqiqa ichida yuborilgan kutilayotgan to'lov
  return payments.find(p => p.userId === idStr && p.status === 'pending' && (now - new Date(p.createdAt).getTime()) < 15 * 60 * 1000);
}

export function createPayment(userId, amount, coins, receiptFileId = null, fileUniqueId = null) {
  const payment = {
    id: `pay${Date.now()}${Math.floor(Math.random() * 1000)}`,
    userId: String(userId),
    amount,
    coins,
    receiptFileId,
    fileUniqueId,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  payments.push(payment);
  savePayments();
  return payment;
}

export function getPaymentById(paymentId) {
  return payments.find(x => x.id === paymentId) || null;
}

export function approvePayment(paymentId, customCoins = null) {
  const p = payments.find(x => x.id === paymentId);
  if (!p || p.status !== 'pending') return null;

  const coinsToAdd = customCoins !== null ? Number(customCoins) : p.coins;
  p.status = 'approved';
  p.coins = coinsToAdd;
  p.approvedAt = new Date().toISOString();
  addCoins(p.userId, coinsToAdd);
  savePayments();
  return p;
}

export function rejectPayment(paymentId) {
  const p = payments.find(x => x.id === paymentId);
  if (!p || p.status !== 'pending') return null;

  p.status = 'rejected';
  p.rejectedAt = new Date().toISOString();
  savePayments();
  return p;
}

// ================================================================
// TAKLIF VA TALABLAR (FEEDBACK)
// ================================================================

export function saveFeedback(data) {
  const record = {
    id: `fb_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    userId: String(data.userId || 'anonymous'),
    username: data.username || '',
    firstName: data.firstName || 'Foydalanuvchi',
    message: String(data.message || '').trim(),
    createdAt: new Date().toISOString(),
  };

  feedbacks.unshift(record);
  if (feedbacks.length > 500) feedbacks = feedbacks.slice(0, 500);
  saveFeedbacks();
  return record;
}

export function getAllFeedbacks(limit = 50) {
  return feedbacks.slice(0, limit);
}

// ================================================================
// VIP OBUNA VA CHEKSIZ IMKONIYATLAR
// ================================================================

export function isUserVip(userId) {
  const user = getUser(userId);
  if (!user || !user.vipUntil) return false;
  return new Date(user.vipUntil) > new Date();
}

export function setVipSubscription(userId, days = 30) {
  const user = getUser(userId);
  if (!user) return null;
  const currentExpiry = (user.vipUntil && new Date(user.vipUntil) > new Date())
    ? new Date(user.vipUntil)
    : new Date();
  currentExpiry.setDate(currentExpiry.getDate() + Number(days));
  user.vipUntil = currentExpiry.toISOString();
  saveUsers();
  return user.vipUntil;
}

// ================================================================
// PROMO-KODLAR TIZIMI
// ================================================================

export function redeemPromoCode(userId, rawCode) {
  if (!rawCode || typeof rawCode !== 'string') {
    return { success: false, message: "Promo-kod kiritilmadi!" };
  }
  const idStr = String(userId);
  const user = getUser(idStr);
  if (!user) {
    return { success: false, message: "Foydalanuvchi topilmadi!" };
  }

  const code = rawCode.trim().toUpperCase();
  const promo = promoCodes.find(p => p.code.toUpperCase() === code);
  if (!promo) {
    return { success: false, message: `❌ "${code}" nomli promo-kod topilmadi yoki muddati o'tgan.` };
  }

  if (promo.usedBy && promo.usedBy.includes(idStr)) {
    return { success: false, message: `⚠️ Siz "${code}" promo-kodidan allaqachon foydalangansiz!` };
  }

  if (promo.usedBy && promo.usedBy.length >= (promo.maxUses || 1000)) {
    return { success: false, message: `⚠️ Ushbu promo-koddan foydalanish limiti tugagan.` };
  }

  if (!promo.usedBy) promo.usedBy = [];
  promo.usedBy.push(idStr);
  user.coins = (user.coins || 0) + (promo.coins || 2);
  saveUsers();
  savePromoCodes();

  return {
    success: true,
    coins: promo.coins,
    newBalance: user.coins,
    message: `🎉 Tabriklaymiz! "${code}" promo-kodi faollashtirildi va hisobingizga +${promo.coins} ta taqdimot qo'shildi! 🪙`,
  };
}

export function getAllPromoCodes() {
  return promoCodes.map(p => ({
    code: p.code,
    coins: p.coins,
    maxUses: p.maxUses,
    usedCount: p.usedBy ? p.usedBy.length : 0,
  }));
}

export function createPromoCode(code, coins = 2, maxUses = 1000) {
  const upper = String(code).trim().toUpperCase();
  const existing = promoCodes.find(p => p.code === upper);
  if (existing) {
    existing.coins = Number(coins);
    existing.maxUses = Number(maxUses);
    savePromoCodes();
    return existing;
  }
  const newPromo = { code: upper, coins: Number(coins), maxUses: Number(maxUses), usedBy: [] };
  promoCodes.push(newPromo);
  savePromoCodes();
  return newPromo;
}

