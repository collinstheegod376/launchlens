import { InlineKeyboard } from 'grammy';
import { TokenReport, RiskFinding, RiskSeverity } from '@/core/types/token';

/**
 * Escapes characters that have special meaning in Telegram HTML mode:
 * &, <, and >
 */
export function escapeHtml(text: string | undefined | null): string {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Formats a numeric USD price nicely for display.
 */
export function formatPrice(price: number | undefined | null): string {
  if (price === undefined || price === null || isNaN(price)) return '$0.00';
  if (price === 0) return '$0.00';
  if (price >= 1000) {
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (price >= 1) {
    return `$${price.toFixed(2)}`;
  }
  if (price >= 0.01) {
    return `$${price.toFixed(4)}`;
  }
  if (price >= 0.0001) {
    return `$${price.toFixed(6)}`;
  }
  return `$${price.toPrecision(4)}`;
}

/**
 * Formats large USD amounts into human-readable compact notation ($1.2M, $45.6K, etc.).
 */
export function formatCurrency(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) return '$0';
  if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(2)}B`;
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(1)}K`;
  return `$${num.toFixed(2)}`;
}

/**
 * Maps risk severity level to an eye-catching Telegram badge.
 */
function getRiskBadge(level: RiskSeverity): string {
  switch (level) {
    case 'CRITICAL':
      return '🚨 CRITICAL RISK';
    case 'HIGH':
      return '🔴 HIGH RISK';
    case 'MEDIUM':
      return '🟡 MODERATE RISK';
    case 'LOW':
      return '🟢 LOW RISK';
    case 'INFO':
    default:
      return '⚪ INFORMATIONAL';
  }
}

/**
 * Formats a TokenReport into a crisp, readable, high-impact Telegram HTML message card.
 */
export function formatTokenReport(report: TokenReport): string {
  const { token, holders, liquidity, risk, aiSummary } = report;
  const symbol = escapeHtml(token.symbol || 'UNKNOWN');
  const name = escapeHtml(token.name || 'Unknown Token');
  const mint = token.mint;
  const mintTruncated = `${mint.slice(0, 4)}...${mint.slice(-4)}`;

  // Risk Assessment
  const riskBadge = getRiskBadge(risk.scorecard.overallLevel);
  const riskScore = risk.scorecard.score ?? 0;

  // Key Metrics
  const highestPool = liquidity.highestLiquidityPool;
  const price = highestPool?.priceUsd ?? 0;
  const fdv = highestPool?.fdv ?? 0;
  const totalLiquidity = liquidity.totalLiquidityUsd ?? 0;
  const volume24h = liquidity.totalVolume24h ?? 0;

  // Authorities
  const mintAuthStatus = token.authorities.isMintRevoked
    ? '❌ Revoked (Safe)'
    : '⚠️ Active (Can Mint)';
  const freezeAuthStatus = token.authorities.isFreezeRevoked
    ? '❌ Revoked (Safe)'
    : '⚠️ Active (Can Freeze)';
  const mutabilityStatus = token.authorities.isMutable
    ? '⚠️ Mutable'
    : '❌ Immutable';

  // Holders
  const top10Pct = holders.top10ConcentrationPct ?? 0;
  let top10Note = '🟢 Well distributed';
  if (top10Pct > 70) {
    top10Note = '🚨 Critical concentration';
  } else if (top10Pct > 45) {
    top10Note = '⚠️ Elevated concentration';
  }

  // Liquidity & Top Pool
  let poolDesc = 'No active DEX pool found';
  let lpLockedDesc = 'N/A';
  if (highestPool) {
    const dex = escapeHtml(highestPool.dexId?.toUpperCase() || 'DEX');
    const poolAddr = `${highestPool.poolAddress.slice(0, 4)}...${highestPool.poolAddress.slice(-4)}`;
    poolDesc = `<b>${dex}</b> (<code>${poolAddr}</code>)`;
    lpLockedDesc = highestPool.lpLockedPct !== undefined
      ? `<b>${highestPool.lpLockedPct.toFixed(1)}% locked</b>`
      : '⚠️ Not locked / Unknown';
  }

  // Risk findings filtered to CRITICAL, HIGH, MEDIUM
  const criticalFindings = (risk.findings || []).filter(
    (f: RiskFinding) => f.severity === 'CRITICAL' || f.severity === 'HIGH' || f.severity === 'MEDIUM'
  );

  let findingsSection = '';
  if (criticalFindings.length > 0) {
    findingsSection = criticalFindings
      .slice(0, 5) // keep message concise
      .map((f: RiskFinding) => {
        const icon = f.severity === 'CRITICAL' ? '🚨' : f.severity === 'HIGH' ? '🔴' : '🟡';
        return `• ${icon} <b>${escapeHtml(f.title)}</b>\n  <i>${escapeHtml(f.description)}</i>`;
      })
      .join('\n');
    if (criticalFindings.length > 5) {
      findingsSection += `\n• <i>+${criticalFindings.length - 5} more findings in full report</i>`;
    }
  } else {
    findingsSection = '• 🟢 No critical, high, or medium risk findings detected.';
  }

  // AI Summary / Insight (2-3 concise sentences)
  let insightText = '';
  if (aiSummary?.narrative) {
    insightText = escapeHtml(aiSummary.narrative.trim());
  } else if (aiSummary?.keyTakeaways && aiSummary.keyTakeaways.length > 0) {
    insightText = escapeHtml(aiSummary.keyTakeaways.slice(0, 3).join(' '));
  } else {
    insightText = `Risk scorecard indicates a risk score of ${riskScore}/100. Always review top holder distribution and liquidity lock status before trading.`;
  }

  // Assemble full card
  return [
    `⚡ <b>LAUNCHLENS REPORT: $${symbol} (${name})</b>`,
    `<code>${mint}</code>`,
    '',
    `🛡️ <b>Risk:</b> ${riskBadge} (Score: <b>${riskScore}/100</b>)`,
    '',
    '📊 <b>Key Metrics:</b>',
    `• <b>Price:</b> ${formatPrice(price)}`,
    `• <b>FDV:</b> ${formatCurrency(fdv)}`,
    `• <b>Liquidity:</b> ${formatCurrency(totalLiquidity)}`,
    `• <b>24h Volume:</b> ${formatCurrency(volume24h)}`,
    '',
    '🔐 <b>Authorities:</b>',
    `• Mint: ${mintAuthStatus}`,
    `• Freeze: ${freezeAuthStatus}`,
    `• Metadata: ${mutabilityStatus}`,
    '',
    '👥 <b>Holders:</b>',
    `• Top 10 Holders: <b>${top10Pct.toFixed(1)}%</b> (${top10Note})`,
    holders.burnedSupplyPct > 0 ? `• Burned Supply: <b>${holders.burnedSupplyPct.toFixed(1)}%</b>` : '',
    '',
    '💧 <b>Liquidity & DEX:</b>',
    `• Primary Pool: ${poolDesc}`,
    `• LP Status: ${lpLockedDesc}`,
    '',
    '⚠️ <b>Key Risk Findings:</b>',
    findingsSection,
    '',
    '🧠 <b>AI Safety Insight:</b>',
    `<i>${insightText}</i>`,
    '',
    '—',
    '⚠️ <i>Automated analysis for informational purposes only. Always DYOR. Not financial advice.</i>',
  ]
    .filter((line) => line !== '')
    .join('\n');
}

/**
 * Returns a grammY InlineKeyboard for a TokenReport card.
 */
export function getReportInlineKeyboard(report: TokenReport, baseUrl?: string): InlineKeyboard {
  const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const cleanBase = base.replace(/\/$/, '');
  const mint = report.token.mint;
  const dexscreenerUrl =
    report.liquidity.highestLiquidityPool?.url || `https://dexscreener.com/solana/${mint}`;
  const solscanUrl = `https://solscan.io/token/${mint}`;

  return new InlineKeyboard()
    .url('🌐 Full Web Report', `${cleanBase}/report/${mint}`)
    .row()
    .url('📈 DEXScreener', dexscreenerUrl)
    .url('🔍 Solscan', solscanUrl)
    .row()
    .text('🔄 Rescan', `rescan:${mint}`);
}
