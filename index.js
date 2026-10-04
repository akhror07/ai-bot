import { app } from './src/server.js';
import { bot } from './src/bot.js';
import { config } from './src/config.js';
import { startTunnel as startUntun } from 'untun';
import localtunnel from 'localtunnel';

async function setupPublicTunnel() {
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
    console.log(`🤖 Telegram bot: @${botInfo.username} (${botInfo.first_name})`);

    // Telegram Chat Menu Button sozlash
    if (tunnelUrl && tunnelUrl.startsWith('https://')) {
      try {
        await bot.api.setChatMenuButton({
          menu_button: {
            type: 'web_app',
            text: '📊 Taqdimot Yaratish',
            web_app: { url: tunnelUrl },
          },
        });
        console.log(`✅ Telegram Menu Button sozlandi: ${tunnelUrl}`);
      } catch (menuErr) {
        console.warn('[Bot] Menu button sozlashda xatolik:', menuErr.message);
      }
    }

    // 4. Bot polling boshlash
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

main();
