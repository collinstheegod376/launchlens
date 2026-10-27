import { webhookCallback } from 'grammy';
import { bot } from '@/bot/bot';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30; // Max allowed serverless duration on Vercel

// grammY standard HTTP webhook callback adapter for Next.js App Router (std/http)
const handleWebhook = webhookCallback(bot, 'std/http', {
  timeoutMilliseconds: 25000,
});

/**
 * Health check & verification endpoint for the Telegram webhook.
 * GET /api/bot
 */
export async function GET() {
  const isConfigured = Boolean(
    process.env.TELEGRAM_BOT_TOKEN &&
    process.env.TELEGRAM_BOT_TOKEN !== 'placeholder' &&
    process.env.TELEGRAM_BOT_TOKEN.trim() !== ''
  );

  return Response.json({
    status: 'ok',
    service: 'LaunchLens Telegram Bot Webhook Handler',
    configured: isConfigured,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Serverless webhook processor for incoming Telegram updates.
 * POST /api/bot
 */
export async function POST(req: Request) {
  if (
    !process.env.TELEGRAM_BOT_TOKEN ||
    process.env.TELEGRAM_BOT_TOKEN === 'placeholder' ||
    process.env.TELEGRAM_BOT_TOKEN.trim() === ''
  ) {
    console.warn('[Webhook] Received update but TELEGRAM_BOT_TOKEN is not configured.');
    return new Response('TELEGRAM_BOT_TOKEN is not configured', { status: 503 });
  }

  try {
    return await handleWebhook(req);
  } catch (err) {
    console.error('[Webhook] Error handling Telegram webhook update:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
