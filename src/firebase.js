import { onRequest } from 'firebase-functions/v2/https';
import { app } from './server.js';
import { bot } from './bot.js';
import { webhookCallback } from 'grammy';

// Telegram Webhook endpoint
app.use('/api/telegram', webhookCallback(bot, 'express'));

// Export Firebase Cloud Function
export const api = onRequest({
  cors: true,
  memory: '512MiB',
  timeoutSeconds: 120,
}, app);
