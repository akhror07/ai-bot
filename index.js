import { app } from './src/server.js';
import { bot, setupBotCommands } from './src/bot.js';
import { config } from './src/config.js';
import { startTunnel as startUntun } from 'untun';
import localtunnel from 'localtunnel';

async function setupPublicTunnel() {
  // Agar Render yoki boshqa bulutli serverda bo'lsa (doimiy HTTPS domen mavjud bo'lsa)
  const cloudUrl = process.env.RENDER_EXTERNAL_URL || process.env.MINI_APP_URL;
  if (cloudUrl && cloudUrl.startsWith('https://')) {
    console.log(`🌍 Doimiy Bulutli HTTPS domen aniqlandi: ${cloudUrl}`);
    config.miniAppUrl = cloudUrl;
    return cloudUrl;
  }

  // 1-urinish: Cloudflare Quick Tunnel (untun) - Hech qanday ogohlantirish oynasisiz to'g'ridan-to'g'ri ochiladi!
  try {
    console.log('🔗 Cloudflare Quick Tunnel (untun) ochilmoqda...');
    const tunnel = await startUntun({ port: config.port });
    const url = await tunnel.getURL();
    if (url && url.startsWith('https://')) {
      console.log(`🌍 Cloudflare Tunnel URL: ${url}`);
      config.miniAppUrl = url;
      return url;
    }
  } catch (err) {
    console.warn('[Cloudflare Tunnel] Ochilmadi:', err.message);
  }

  // 2-urinish: Localtunnel (zaxira)
  try {
    console.log('🔗 Localtunnel zaxira ochilmoqda...');
    const lt = await localtunnel({ port: config.port });
    if (lt && lt.url) {
      console.log(`🌍 Localtunnel URL: ${lt.url}`);
      config.miniAppUrl = lt.url;
      return lt.url;
    }
  } catch (err) {
    console.warn('[Localtunnel] Ochilmadi:', err.message);
  }

  return config.miniAppUrl || null;
}

async function main() {
  console.log('----------------------------------------------------');
  console.log('🚀 AI Slayd & Prezentatsiya Bot ishga tushirilmoqda...');
  console.log('----------------------------------------------------');

  // 1. Express Web Serverni ishga tushirish
  await new Promise((resolve) => {
    app.listen(config.port, () => {
      console.log(`🌐 Express server: http://localhost:${config.port}`);
      console.log(`📱 Mini App: http://localhost:${config.port}/index.html`);
      resolve();
    });
  });

  // 2. HTTPS Tunnelni ishga tushirish (Cloudflare / Localtunnel)
  const tunnelUrl = await setupPublicTunnel();

  // 3. Telegram Botni ishga tushirish
  try {
    const botInfo = await bot.api.getMe();
    config.botUsername = botInfo.username;
    console.log(`🤖 Telegram bot: @${botInfo.username} (${botInfo.first_name})`);

    // Telegram bot buyruqlarini (setMyCommands) sozlash
    await setupBotCommands();

    // Telegram Chat Menu Button sozlash (Buyruqlar menyusini ochish uchun)
    try {
      await bot.api.setChatMenuButton({
        menu_button: {
          type: 'commands',
        },
      });
      console.log('✅ Telegram Menu Button (Commands menyusi) sozlandi');
    } catch (menuErr) {
      console.warn('[Bot] Menu button sozlashda xatolik:', menuErr.message);
    }

    // 4. Telegram Webhook tozalash va Polling boshlash
    try {
      await bot.api.deleteWebhook({ drop_pending_updates: false });
    } catch (_) {}

    bot.start({
      onStart: (info) => {
        console.log(`✅ @${info.username} bot to'liq faol!`);
        console.log(`📱 Mini App havolasi: ${tunnelUrl || 'localhost'}`);
        console.log('----------------------------------------------------');
      },
    });
  } catch (err) {
    console.error('Telegram botni ishga tushirishda xatolik:', err);
  }
}

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

// Firebase Cloud Functions eksporti (Lazy import orqali polling bilan to'qnashuv bo'lmaydi)
export async function api(req, res) {
  const mod = await import('./src/firebase.js');
  return mod.api(req, res);
}

// Agar Firebase Cloud Functions ichida bo'lmasa, mustaqil server va polling rejimida ishga tushadi
if (!process.env.K_SERVICE && !process.env.FUNCTION_NAME && !process.env.FIREBASE_CONFIG) {
  main();
}

