import { Bot, Context, InlineKeyboard } from 'grammy';
import { PublicKey } from '@solana/web3.js';
import { generateTokenReport } from '@/core/orchestrator';
import {
  formatTokenReport,
  formatHoldersReport,
  formatLiquidityReport,
  formatSecurityReport,
  formatRiskReport,
  getReportInlineKeyboard,
  ReportViewType,
  escapeHtml,
} from './formatter';

// Initialize grammY Bot instance
const token = process.env.TELEGRAM_BOT_TOKEN || 'placeholder';
export const bot = new Bot(token);

// Base application URL for full web reports
export const getBaseUrl = (): string =>
  process.env.NEXT_PUBLIC_APP_URL || 'https://launchlens-delta.vercel.app';

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
 * Extracts a candidate mint address from command parameters or reply messages.
 */
function extractMintFromContext(ctx: Context): string | null {
  const text = ctx.message?.text || '';
  const parts = text.trim().split(/\s+/);

  // If argument supplied: /command <mint>
  if (parts.length > 1 && isValidSolanaAddress(parts[1])) {
    return parts[1];
  }

  // Check if message is a reply to an address
  const replyText = ctx.message?.reply_to_message?.text;
  if (replyText) {
    const matches = replyText.match(SOLANA_ADDRESS_REGEX);
    if (matches && matches.length > 0) {
      const valid = matches.find((m) => isValidSolanaAddress(m));
      if (valid) return valid;
    }
  }

  return null;
}

/**
 * Renders the formatted card for the specified view.
 */
function renderCardForView(report: any, view: ReportViewType): string {
  switch (view) {
    case 'holders':
      return formatHoldersReport(report);
    case 'lp':
      return formatLiquidityReport(report);
    case 'auth':
      return formatSecurityReport(report);
    case 'risk':
      return formatRiskReport(report);
    case 'overview':
    default:
      return formatTokenReport(report);
  }
}

/**
 * Reusable scanning flow supporting modular views:
 * 1. Sends or edits a progress message.
 * 2. Fetches the token report from the core orchestrator.
 * 3. Updates the message with the requested view card and view-toggle buttons.
 */
export async function handleScanFlow(
  ctx: Context,
  mint: string,
  forceFresh = false,
  view: ReportViewType = 'overview'
): Promise<void> {
  const shortMint = `${mint.slice(0, 4)}...${mint.slice(-4)}`;
  const progressText = `🔍 Analyzing Solana on-chain state for <code>${shortMint}</code>...`;

  let progressMsgId: number | undefined;
  let chatId: number | undefined = ctx.chat?.id;

  if (ctx.callbackQuery?.message) {
    chatId = ctx.callbackQuery.message.chat.id;
    progressMsgId = ctx.callbackQuery.message.message_id;
  } else {
    const reply = await ctx.reply(progressText, { parse_mode: 'HTML' });
    progressMsgId = reply.message_id;
    chatId = reply.chat.id;
  }

  try {
    const report = await generateTokenReport(mint, forceFresh);
    const card = renderCardForView(report, view);
    const keyboard = getReportInlineKeyboard(report, getBaseUrl(), view);

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
    '⚡ <b>Welcome to LaunchLens Token Intelligence!</b>',
    '',
    'Institutional-grade, deterministic Solana risk analysis powered by raw on-chain verification.',
    '',
    '🔍 <b>Specialized Commands:</b>',
    '• <code>/scan &lt;mint&gt;</code> — Full Comprehensive Report',
    '• <code>/holders &lt;mint&gt;</code> — Top Holders & Whale Breakdown',
    '• <code>/lp &lt;mint&gt;</code> — Liquidity Pools & LP Lock Verification',
    '• <code>/auth &lt;mint&gt;</code> — Mint, Freeze & Metadata Authorities',
    '• <code>/risk &lt;mint&gt;</code> — Risk Findings & Detailed Scorecard',
    '',
    '💬 <b>Auto-Detection:</b>',
    'Simply paste any Solana token address into chat, and LaunchLens will analyze it automatically!',
    '',
    '💡 <b>Quick Benchmark Scans:</b>',
  ].join('\n');

  const keyboard = new InlineKeyboard()
    .url('🌐 Open Web Dashboard', baseUrl)
    .row()
    .text('⚡ $JUP', 'scan:JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN')
    .text('⚡ $BONK', 'scan:DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263')
    .text('⚡ $WIF', 'scan:EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm');

  await ctx.reply(welcomeText, {
    parse_mode: 'HTML',
    reply_markup: keyboard,
    link_preview_options: { is_disabled: true },
  });
});

// /scan <mint> — Full Comprehensive Report
bot.command('scan', async (ctx) => {
  const mint = extractMintFromContext(ctx);
  if (!mint) {
    await ctx.reply(
      '⚠️ <b>Missing Address</b>\n\nUsage: <code>/scan &lt;mint_address&gt;</code>\nExample: <code>/scan DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263</code>',
      { parse_mode: 'HTML' }
    );
    return;
  }
  await handleScanFlow(ctx, mint, false, 'overview');
});

// /holders or /top — Holder Distribution & Whale Concentration
bot.command(['holders', 'top', 'whales'], async (ctx) => {
  const mint = extractMintFromContext(ctx);
  if (!mint) {
    await ctx.reply(
      '⚠️ <b>Missing Address</b>\n\nUsage: <code>/holders &lt;mint_address&gt;</code>\nExample: <code>/holders JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN</code>',
      { parse_mode: 'HTML' }
    );
    return;
  }
  await handleScanFlow(ctx, mint, false, 'holders');
});

// /lp or /liquidity or /pools — Liquidity Depth & LP Lockup
bot.command(['lp', 'liquidity', 'pools'], async (ctx) => {
  const mint = extractMintFromContext(ctx);
  if (!mint) {
    await ctx.reply(
      '⚠️ <b>Missing Address</b>\n\nUsage: <code>/lp &lt;mint_address&gt;</code>\nExample: <code>/lp JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN</code>',
      { parse_mode: 'HTML' }
    );
    return;
  }
  await handleScanFlow(ctx, mint, false, 'lp');
});

// /auth or /security or /keys — Authorities & Permissions
bot.command(['auth', 'security', 'keys'], async (ctx) => {
  const mint = extractMintFromContext(ctx);
  if (!mint) {
    await ctx.reply(
      '⚠️ <b>Missing Address</b>\n\nUsage: <code>/auth &lt;mint_address&gt;</code>\nExample: <code>/auth JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN</code>',
      { parse_mode: 'HTML' }
    );
    return;
  }
  await handleScanFlow(ctx, mint, false, 'auth');
});

// /risk or /audit or /score — Risk Findings & Scorecard
bot.command(['risk', 'audit', 'score'], async (ctx) => {
  const mint = extractMintFromContext(ctx);
  if (!mint) {
    await ctx.reply(
      '⚠️ <b>Missing Address</b>\n\nUsage: <code>/risk &lt;mint_address&gt;</code>\nExample: <code>/risk JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN</code>',
      { parse_mode: 'HTML' }
    );
    return;
  }
  await handleScanFlow(ctx, mint, false, 'risk');
});

// ---------------------------------------------------------------------------
// Interactive View Toggle Callbacks (view:viewType:mint)
// ---------------------------------------------------------------------------

bot.callbackQuery(/^view:(overview|holders|lp|auth|risk):(.+)$/, async (ctx) => {
  const view = ctx.match[1] as ReportViewType;
  const mint = ctx.match[2];

  await ctx.answerCallbackQuery();

  if (!isValidSolanaAddress(mint)) {
    return;
  }

  // Switch view using cached report data for zero delay
  await handleScanFlow(ctx, mint, false, view);
});

// Rescan button callback (rescan:<mint>)
bot.callbackQuery(/^rescan:(.+)$/, async (ctx) => {
  const mint = ctx.match[1];
  await ctx.answerCallbackQuery({ text: '🔄 Refreshing token analysis...' });

  if (!isValidSolanaAddress(mint)) {
    return;
  }

  await handleScanFlow(ctx, mint, true, 'overview');
});

// Quick scan button callback (scan:<mint>)
bot.callbackQuery(/^scan:(.+)$/, async (ctx) => {
  const mint = ctx.match[1];
  const shortMint = `${mint.slice(0, 4)}...${mint.slice(-4)}`;
  await ctx.answerCallbackQuery({ text: `⚡ Scanning ${shortMint}` });

  if (!isValidSolanaAddress(mint)) {
    return;
  }

  await handleScanFlow(ctx, mint, false, 'overview');
});

// ---------------------------------------------------------------------------
// Address Auto-detection Middleware
// ---------------------------------------------------------------------------

bot.on('message:text', async (ctx, next) => {
  const text = ctx.message.text.trim();

  // Ignore bot commands
  if (text.startsWith('/')) {
    return next();
  }

  // Scan text for Solana address candidates
  const matches = text.match(SOLANA_ADDRESS_REGEX);
  if (!matches || matches.length === 0) {
    return next();
  }

  // Find first valid Solana public key
  const validMint = matches.find((candidate) => isValidSolanaAddress(candidate));
  if (!validMint) {
    return next();
  }

  // Prevent spam in busy groups by checking cooldown
  const chatId = ctx.chat.id;
  if (checkAndSetCooldown(chatId)) {
    return next();
  }

  await handleScanFlow(ctx, validMint, false, 'overview');
});
