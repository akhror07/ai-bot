# 📊 AI Slayd va Prezentatsiya Tayyorlovchi Telegram Bot & Mini App

Sun'iy intellekt (**Google Gemini 3.8 / 3.5**) yordamida bir necha soniyada professional **PowerPoint (.pptx)** taqdimotlarini tayyorlab beruvchi ommaviy Telegram bot va Telegram Mini App.

---

## 🚀 Asosiy Imkoniyatlar

1. **📱 Telegram Mini App (TMA):**
   - Telegram ichida to'liq vizual interfeys.
   - Slaydlar sonini tanlash (4, 6, 8, 10 ta).
   - Taqdimot tilini tanlash (O'zbek, Rus, Ingliz).
   - 5 xil zamonaviy ranglar uslubi (Ocean Blue, Modern Dark, Emerald Nature, Sunset Orange, Clean Light).
   - Slaydlarni jonli ko'rib chiqish (preview) va `.pptx` faylini bevosita yuklab olish yoki botga yuborish.

2. **💬 To'g'ridan-to'g'ri Telegram Chat:**
   - Shunchaki xohlagan mavzuingizni botga yozib yuboring (masalan: *"Sun'iy intellektning ta'limdagi o'rni"*).
   - Bot avtomatik reja tuzadi, chiroyli dizayn bilan 16:9 HD formatda PowerPoint fayl yasaydi va uni chatga yuboradi.

3. **🎨 Professional Dizayn (16:9 Widescreen):**
   - Muqova slaydi (Title slide)
   - Chiroyli kartochkali kontent slaydlari
   - Asosiy xulosalar uchun "Highlight" bloklari
   - Slayd raqamlari va spiker eslatmalari (Speaker Notes)

---

## 🛠 Texnologiyalar

- **Runtime:** Node.js (v20+)
- **Telegram Framework:** [grammY](https://grammy.dev/)
- **AI Dvigateli:** [Google Generative AI](https://ai.google.dev/) (Gemini 3.8 / 3.5 Flash)
- **PowerPoint Generatori:** [PptxGenJS](https://gitbrent.github.io/PptxGenJS/)
- **Backend:** Express.js
- **Frontend:** HTML5, CSS3, JavaScript (Telegram WebApp SDK)

---

## ⚙️ O'rnatish va Ishga Tushirish

### 1. Bog'liqliklarni o'rnatish
```bash
npm install
```

### 2. `.env` faylini sozlash
Loyihaning asosiy papkasida `.env` fayli mavjudligiga ishonch hosil qiling:
```env
BOT_TOKEN=8925416268:AAFhSrfU4zCMYQbT_VKxcJTkdUy-acb06qE
GEMINI_API_KEY=AQ.Ab8RN6IizhgjzEFjdHxI9BJ4H7mfH_EUwlNyrZzTOtDLjeDA9A
PORT=3000
MINI_APP_URL=
```

### 3. Ishga tushirish
```bash
npm start
```
Server `http://localhost:3000` da, Telegram bot esa `@AhroriAIbot` sifatida ishlay boshlaydi.

---

## 🌐 Mini App ni Telegramda Ommaviy Qilish (HTTPS ulash)

Telegram Mini App faqat **HTTPS** protokoli orqali ishlaydi. Mahalliydan internetga chiqarish uchun:

1. **Ngrok** yoki **Localtunnel** dan foydalaning:
   ```bash
   npx localtunnel --port 3000
   ```
   yoki
   ```bash
   ngrok http 3000
   ```
2. Olingan HTTPS havolani (masalan: `https://my-slide-app.loca.lt`) `.env` faylidagi `MINI_APP_URL` ga yozing:
   ```env
   MINI_APP_URL=https://my-slide-app.loca.lt
   ```
3. **BotFather** da Mini App tugmasini sozlang:
   - [@BotFather](https://t.me/BotFather) ga kiring -> `/mybots` -> Botni tanlang -> `Bot Settings` -> `Menu Button` -> `Configure menu button`.
   - URL ga `https://my-slide-app.loca.lt` manzilini, tugma nomiga esa `Prezentatsiya 📊` deb yozing.
