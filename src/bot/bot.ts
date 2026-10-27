import { Bot, Context, InlineKeyboard } from 'grammy';
import { PublicKey } from '@solana/web3.js';
import { generateTokenReport } from '@/core/orchestrator';
import { formatTokenReport, getReportInlineKeyboard, escapeHtml } from './formatter';

// Initialize grammY Bot instance
// TELEGRAM_BOT_TOKEN can be loaded from process.env or fallback to placeholder for building/testing
const token = process.env.TELEGRAM_BOT_TOKEN || 'placeholder';
export const bot = new Bot(token);

// Base application URL for full web reports
export const getBaseUrl = (): string =>
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Solana address regex pattern (base58, 32-44 characters)
const SOLANA_ADDRESS_REGEX = /\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/g;

// In-memory per-chat cooldown tracker (10s cooldown per chat to prevent spam in busy groups)
const chatCooldowns = new Map<number | string, number>();
const AUTO_DETECT_COOLDOWN_MS = 10_000;

/**
 * Validates whether a candidate string is a valid Solana public key.
 */
export function isValidSolanaAddress(address: string): boolean {
  if (!address || address.length < 32 || address.length > 44) {
    return false;
  }
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks and records rate-limiting cooldown for automatic address detection in chats.
 * Returns true if the chat is currently on cooldown (should skip).
 */
export function checkAndSetCooldown(chatId: number | string): boolean {
  const now = Date.now();
  const lastTime = chatCooldowns.get(chatId);
  if (lastTime && now - lastTime < AUTO_DETECT_COOLDOWN_MS) {
    return true;
  }
  chatCooldowns.set(chatId, now);
  return false;
}

/**
 * Reusable scanning flow:
 * 1. Sends or edits a progress message.
 * 2. Fetches the token report from the core orchestrator.
 * 3. Updates the message with the formatted card and inline buttons.
 * 4. Catches errors and displays an informative error card.
 */
export async function handleScanFlow(
  ctx: Context,
  mint: string,
  forceFresh = false
): Promise<void> {
  const shortMint = `${mint.slice(0, 4)}...${mint.slice(-4)}`;
  const progressText = `🔍 Scanning Solana blockchain & DEX pools for <code>${shortMint}</code>...`;

  let progressMsgId: number | undefined;
  let chatId: number | undefined = ctx.chat?.id;

  if (ctx.callbackQuery?.message) {
    chatId = ctx.callbackQuery.message.chat.id;
    progressMsgId = ctx.callbackQuery.message.message_id;
    try {
      await ctx.api.editMessageText(chatId, progressMsgId, progressText, {
        parse_mode: 'HTML',
      });
    } catch {
      const reply = await ctx.reply(progressText, { parse_mode: 'HTML' });
      progressMsgId = reply.message_id;
      chatId = reply.chat.id;
    }
  } else {
    const reply = await ctx.reply(progressText, { parse_mode: 'HTML' });
    progressMsgId = reply.message_id;
    chatId = reply.chat.id;
  }

  try {
    const report = await generateTokenReport(mint, forceFresh);
    const card = formatTokenReport(report);
    const keyboard = getReportInlineKeyboard(report, getBaseUrl());

    await ctx.api.editMessageText(chatId, progressMsgId, card, {
      parse_mode: 'HTML',
      reply_markup: keyboard,
      link_preview_options: { is_disabled: true },
    });
  } catch (err) {
    const errorMsg =
      err instanceof Error ? err.message : 'Unknown error during token scan';
    await ctx.api.editMessageText(
      chatId,
      progressMsgId,
      `❌ <b>Scan Failed</b>\n\nCould not analyze token <code>${mint}</code>.\n\n<i>${escapeHtml(errorMsg)}</i>`,
      {
        parse_mode: 'HTML',
        link_preview_options: { is_disabled: true },
      }
    );
  }
}

// ---------------------------------------------------------------------------
// Bot Command Handlers
// ---------------------------------------------------------------------------

// /start and /help commands
bot.command(['start', 'help'], async (ctx) => {
  const baseUrl = getBaseUrl();
  const welcomeText = [
    '⚡ <b>Welcome to LaunchLens Bot!</b>',
    '',
    'LaunchLens provides instant, institutional-grade risk & safety audits for any Solana token.',
    '',
    '🔍 <b>How to Scan:</b>',
    '• Send <code>/scan &lt;mint_address&gt;</code>',
    '• Or simply paste any Solana token address directly into the chat!',
    '',
    '🛡️ <b>Audits Include:</b>',
    '• Mint & Freeze Authority Status',
    '• Top 10 Holder & Insider Concentration',
    '• DEX Pool Depth & LP Lock Verification',
    '• Honeypot & Malicious Extension Checks',
    '• AI-Powered Risk Summaries',
    '',
    '💡 <b>Sample Tokens to Try:</b>',
    '• <b>JUP:</b> <code>JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN</code>',
    '• <b>BONK:</b> <code>DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263</code>',
    '• <b>WIF:</b> <code>EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm</code>',
  ].join('\n');

  const keyboard = new InlineKeyboard()
    .url('🌐 Open Web App', baseUrl)
    .row()
    .text('⚡ Scan JUP', 'scan:JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN')
    .text('⚡ Scan BONK', 'scan:DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263')
    .text('⚡ Scan WIF', 'scan:EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm');

  await ctx.reply(welcomeText, {
    parse_mode: 'HTML',
    reply_markup: keyboard,
    link_preview_options: { is_disabled: true },
  });
});

// /scan <mint> command
bot.command('scan', async (ctx) => {
  const text = ctx.message?.text || '';
  const parts = text.trim().split(/\s+/);
  const mint = parts[1];

  if (!mint || !isValidSolanaAddress(mint)) {
    await ctx.reply(
      '⚠️ <b>Invalid Address</b>\n\nPlease provide a valid Solana token address.\n\n<b>Usage:</b>\n<code>/scan &lt;mint_address&gt;</code>\n\n<b>Example:</b>\n<code>/scan DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263</code>',
      { parse_mode: 'HTML' }
    );
    return;
  }

  await handleScanFlow(ctx, mint);
});

// ---------------------------------------------------------------------------
// Callback Query Handlers
// ---------------------------------------------------------------------------

// Rescan button callback (rescan:<mint>)
bot.callbackQuery(/^rescan:(.+)$/, async (ctx) => {
  const mint = ctx.match[1];
  await ctx.answerCallbackQuery({ text: '🔄 Refreshing token analysis...' });

  if (!isValidSolanaAddress(mint)) {
    await ctx.reply('⚠️ Invalid token address.', { parse_mode: 'HTML' });
    return;
  }

  await handleScanFlow(ctx, mint, true);
});

// Quick scan button callback (scan:<mint>)
bot.callbackQuery(/^scan:(.+)$/, async (ctx) => {
  const mint = ctx.match[1];
  const shortMint = `${mint.slice(0, 4)}...${mint.slice(-4)}`;
  await ctx.answerCallbackQuery({ text: `⚡ Scanning ${shortMint}` });

  if (!isValidSolanaAddress(mint)) {
    await ctx.reply('⚠️ Invalid token address.', { parse_mode: 'HTML' });
    return;
  }

  await handleScanFlow(ctx, mint, false);
});

// ---------------------------------------------------------------------------
// Address Auto-detection Middleware
// ---------------------------------------------------------------------------

bot.on('message:text', async (ctx, next) => {
  const text = ctx.message.text.trim();

  // Ignore bot commands (handled by bot.command)
  if (text.startsWith('/')) {
    return next();
  }

  // Scan text for Solana address candidates
  const matches = text.match(SOLANA_ADDRESS_REGEX);
  if (!matches || matches.length === 0) {
    return next();
  }

  // Find the first match that is a valid Solana public key
  const validMint = matches.find((candidate) => isValidSolanaAddress(candidate));
  if (!validMint) {
    return next();
  }

  // Prevent spam in busy groups by checking cooldown
  const chatId = ctx.chat.id;
  if (checkAndSetCooldown(chatId)) {
    // Cooldown active, skip automatic scan silently
    return next();
  }

  await handleScanFlow(ctx, validMint);
});
