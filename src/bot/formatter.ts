import { InlineKeyboard } from 'grammy';
import { TokenReport, RiskFinding, RiskSeverity, HolderRecord, PoolRecord } from '@/core/types/token';

export type ReportViewType = 'overview' | 'holders' | 'lp' | 'auth' | 'risk';

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
 * Renders a visual ASCII progress bar for percentages (e.g. [██████░░░░] 60%).
 */
export function renderProgressBar(pct: number, length = 10): string {
  const safePct = Math.min(100, Math.max(0, isNaN(pct) ? 0 : pct));
  const filled = Math.round((safePct / 100) * length);
  return '█'.repeat(filled) + '░'.repeat(length - filled);
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
 * Formats token quantity numbers with compact suffixes (1.5B, 250M, etc.).
 */
export function formatTokens(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) return '0';
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

/**
 * Maps risk severity level to an eye-catching Telegram badge.
 */
export function getRiskBadge(level: RiskSeverity): string {
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
 * 1. FULL OVERVIEW REPORT
 * Spacious, breathable layout with clean dividers and high visual hierarchy.
 */
export function formatTokenReport(report: TokenReport): string {
  const { token, holders, liquidity, risk, aiSummary } = report;
  const symbol = escapeHtml(token.symbol || 'UNKNOWN');
  const name = escapeHtml(token.name || 'Unknown Token');
  const mint = token.mint;

  const riskBadge = getRiskBadge(risk.scorecard.overallLevel);
  const riskScore = risk.scorecard.score ?? 0;

  const highestPool = liquidity.highestLiquidityPool;
  const price = highestPool?.priceUsd ?? 0;
  const fdv = highestPool?.fdv ?? 0;
  const totalLiquidity = liquidity.totalLiquidityUsd ?? 0;
  const volume24h = liquidity.totalVolume24h ?? 0;

  const mintAuthStatus = token.authorities.isMintRevoked
    ? '❌ Revoked (Safe)'
    : '⚠️ Active (Can Mint)';
  const freezeAuthStatus = token.authorities.isFreezeRevoked
    ? '❌ Revoked (Safe)'
    : '⚠️ Active (Can Freeze)';
  const mutabilityStatus = token.authorities.isMutable
    ? '⚠️ Mutable'
    : '❌ Immutable';

  const top10Pct = holders.top10ConcentrationPct ?? 0;
  const progressBar = renderProgressBar(top10Pct);

  let poolDesc = 'No active DEX pool found';
  let lpLockedDesc = 'Unknown / Unlocked';
  if (highestPool) {
    const dex = escapeHtml(highestPool.dexId?.toUpperCase() || 'DEX');
    const poolAddr = `${highestPool.poolAddress.slice(0, 4)}...${highestPool.poolAddress.slice(-4)}`;
    poolDesc = `<b>${dex}</b> (<code>${poolAddr}</code>)`;
    lpLockedDesc = highestPool.lpLockedPct !== undefined
      ? `<b>${highestPool.lpLockedPct.toFixed(1)}% locked</b>`
      : '⚠️ Not locked';
  }

  const criticalFindings = (risk.findings || []).filter(
    (f: RiskFinding) => f.severity === 'CRITICAL' || f.severity === 'HIGH' || f.severity === 'MEDIUM'
  );

  let findingsSection = '';
  if (criticalFindings.length > 0) {
    findingsSection = criticalFindings
      .slice(0, 4)
      .map((f: RiskFinding) => {
        const icon = f.severity === 'CRITICAL' ? '🚨' : f.severity === 'HIGH' ? '🔴' : '🟡';
        return `• ${icon} <b>${escapeHtml(f.title)}</b>\n  <i>${escapeHtml(f.description)}</i>`;
      })
      .join('\n\n');
  } else {
    findingsSection = '• 🟢 <i>No critical or high-risk findings detected in standard ruleset.</i>';
  }

  let insightText = '';
  if (aiSummary?.narrative) {
    insightText = escapeHtml(aiSummary.narrative.trim());
  } else if (aiSummary?.keyTakeaways && aiSummary.keyTakeaways.length > 0) {
    insightText = escapeHtml(aiSummary.keyTakeaways.slice(0, 3).join(' '));
  } else {
    insightText = `Risk scorecard indicates a risk score of ${riskScore}/100. Review top holders and liquidity lockup before trading.`;
  }

  return [
    `⚡ <b>LAUNCHLENS REPORT: $${symbol}</b>`,
    `<i>${name}</i>`,
    `<code>${mint}</code>`,
    '',
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `🛡️ <b>RISK POSTURE:</b> ${riskBadge} (Score: <b>${riskScore}/100</b>)`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    '',
    `📊 <b>Market Intelligence:</b>`,
    `• Price: <b>${formatPrice(price)}</b>`,
    `• FDV: <b>${formatCurrency(fdv)}</b>`,
    `• Total Liquidity: <b>${formatCurrency(totalLiquidity)}</b>`,
    `• 24h Volume: <b>${formatCurrency(volume24h)}</b>`,
    '',
    `🔐 <b>Cryptographic Authorities:</b>`,
    `• Mint Authority: ${mintAuthStatus}`,
    `• Freeze Authority: ${freezeAuthStatus}`,
    `• Metadata Update: ${mutabilityStatus}`,
    '',
    `👥 <b>Holder Distribution:</b>`,
    `• Top 10 Non-Burn: <b>${top10Pct.toFixed(1)}%</b>`,
    `  <code>[${progressBar}]</code>`,
    holders.burnedSupplyPct > 0 ? `• Burned Supply: <b>${holders.burnedSupplyPct.toFixed(1)}%</b>` : '',
    '',
    `💧 <b>DEX Liquidity:</b>`,
    `• Primary Pool: ${poolDesc}`,
    `• LP Lockup: ${lpLockedDesc}`,
    '',
    `⚠️ <b>Key Risk Findings:</b>`,
    findingsSection,
    '',
    `🧠 <b>AI Risk Synthesis:</b>`,
    `<i>${insightText}</i>`,
    '',
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `🔍 <i>Use buttons below to explore Holders, LP, or Security deep-dives.</i>`,
  ]
    .filter((line) => line !== '')
    .join('\n');
}

/**
 * 2. HOLDERS DEEP-DIVE REPORT (/holders or /top)
 */
export function formatHoldersReport(report: TokenReport): string {
  const { token, holders } = report;
  const symbol = escapeHtml(token.symbol || 'TOKEN');
  const mint = token.mint;
  const top10Pct = holders.top10ConcentrationPct ?? 0;
  const top20Pct = holders.top20ConcentrationPct ?? 0;
  const burnedPct = holders.burnedSupplyPct ?? 0;
  const circulating = formatTokens(holders.circulatingSupplyFormatted);

  const progressBar = renderProgressBar(top10Pct);

  // Format top 8 holders
  const topList = (holders.topHolders || [])
    .slice(0, 8)
    .map((h: HolderRecord, idx: number) => {
      const rank = `#${idx + 1}`.padEnd(3, ' ');
      const addr = `${h.address.slice(0, 4)}...${h.address.slice(-4)}`;
      const pct = (h.percentage ?? 0).toFixed(2);
      const balance = formatTokens(h.uiBalance);

      let tag = '👤 Wallet';
      if (h.classification === 'burn') tag = '🔥 Burn';
      else if (h.classification === 'pool') tag = '💧 AMM Pool';
      else if (h.isInsider) tag = '⚠️ Insider';

      return `${rank} <code>${addr}</code> • <b>${pct}%</b>\n    Balance: ${balance} ${symbol} • ${tag}`;
    })
    .join('\n\n');

  return [
    `👥 <b>HOLDER DISTRIBUTION: $${symbol}</b>`,
    `<code>${mint}</code>`,
    '',
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `📊 <b>Concentration Breakdown:</b>`,
    `• Top 10 Non-Burn: <b>${top10Pct.toFixed(1)}%</b>`,
    `  <code>[${progressBar}]</code>`,
    `• Top 20 Non-Burn: <b>${top20Pct.toFixed(1)}%</b>`,
    `• Burned Supply: <b>${burnedPct.toFixed(1)}%</b>`,
    `• Circulating Float: <b>${circulating} ${symbol}</b>`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    '',
    `🏆 <b>Top Holder Accounts:</b>`,
    topList || '<i>No individual holder accounts recorded.</i>',
    '',
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `💡 <i>LaunchLens isolates burn incinerators and AMM pool reserves to compute true private insider concentration.</i>`,
  ]
    .filter((line) => line !== '')
    .join('\n');
}

/**
 * 3. LIQUIDITY DEEP-DIVE REPORT (/lp or /liquidity)
 */
export function formatLiquidityReport(report: TokenReport): string {
  const { token, liquidity } = report;
  const symbol = escapeHtml(token.symbol || 'TOKEN');
  const mint = token.mint;
  const totalLiq = formatCurrency(liquidity.totalLiquidityUsd);
  const totalVol = formatCurrency(liquidity.totalVolume24h);
  const poolCount = liquidity.pools.length;

  const highestPool = liquidity.highestLiquidityPool;
  const lpLockedPct = highestPool?.lpLockedPct !== undefined
    ? `${highestPool.lpLockedPct.toFixed(1)}%`
    : 'Unknown';

  const poolEntries = (liquidity.pools || [])
    .slice(0, 4)
    .map((p: PoolRecord) => {
      const dex = escapeHtml(p.dexId?.toUpperCase() || 'AMM');
      const poolAddr = `${p.poolAddress.slice(0, 4)}...${p.poolAddress.slice(-4)}`;
      const baseSym = escapeHtml(p.baseToken.symbol || symbol);
      const quoteSym = escapeHtml(p.quoteToken.symbol || 'SOL');
      const liq = formatCurrency(p.liquidityUsd);
      const vol = formatCurrency(p.volume24h);
      const locked = p.lpLockedPct !== undefined ? `${p.lpLockedPct.toFixed(0)}% locked` : 'Unlocked';

      return `• <b>${dex}</b> (${baseSym}/${quoteSym})\n  Pool: <code>${poolAddr}</code>\n  Liq: <b>${liq}</b> • 24h Vol: ${vol}\n  LP State: <b>${locked}</b>`;
    })
    .join('\n\n');

  return [
    `💧 <b>LIQUIDITY &amp; AMM AUDIT: $${symbol}</b>`,
    `<code>${mint}</code>`,
    '',
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `📊 <b>Global AMM Reserves:</b>`,
    `• Total Liquidity: <b>${totalLiq}</b>`,
    `• 24h Volume: <b>${totalVol}</b>`,
    `• Discovered Pools: <b>${poolCount} AMM pair${poolCount === 1 ? '' : 's'}</b>`,
    `• Primary Pool Lockup: <b>${lpLockedPct}</b>`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    '',
    `🏊 <b>Active Trading Pools:</b>`,
    poolEntries || '<i>No active liquidity pools discovered on Raydium, Orca, or Meteora.</i>',
    '',
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `🔒 <i>Locked LP tokens prevent creators from draining reserves in sudden exit liquidity pulls.</i>`,
  ]
    .filter((line) => line !== '')
    .join('\n');
}

/**
 * 4. SECURITY & AUTHORITIES DEEP-DIVE REPORT (/auth or /security)
 */
export function formatSecurityReport(report: TokenReport): string {
  const { token } = report;
  const symbol = escapeHtml(token.symbol || 'TOKEN');
  const mint = token.mint;

  const mintAuth = token.authorities.isMintRevoked
    ? '🟢 <b>PERMANENTLY REVOKED (Safe)</b>\n  <i>Additional token supply cannot be minted. Inflation/dilution risk eliminated.</i>'
    : `🔴 <b>ACTIVE (High Risk)</b>\n  <i>Owner key can arbitrarily mint new tokens to dump:\n  <code>${escapeHtml(token.authorities.mintAuthority || 'Active')}</code></i>`;

  const freezeAuth = token.authorities.isFreezeRevoked
    ? '🟢 <b>PERMANENTLY REVOKED (Safe)</b>\n  <i>Wallet token accounts cannot be frozen or blacklisted.</i>'
    : `🔴 <b>ACTIVE (High Risk)</b>\n  <i>Freeze authority is retained; user token accounts could be halted from trading:\n  <code>${escapeHtml(token.authorities.freezeAuthority || 'Active')}</code></i>`;

  const updateAuth = !token.authorities.isMutable
    ? '🟢 <b>IMMUTABLE (Safe)</b>\n  <i>Metadata, name, symbol, and URI are permanently locked.</i>'
    : `🟡 <b>MUTABLE (Owner Modifiable)</b>\n  <i>Update authority can modify token name, ticker, and media image:\n  <code>${escapeHtml(token.authorities.updateAuthority || 'Active')}</code></i>`;

  const extensions = token.extensions && token.extensions.length > 0
    ? `⚠️ <b>Detected Extensions:</b>\n  ${escapeHtml(token.extensions.join(', '))}`
    : '🟢 <b>Standard SPL Program</b> (No hidden transfer hooks or fees detected)';

  return [
    `🔐 <b>SECURITY &amp; PERMISSIONS: $${symbol}</b>`,
    `<code>${mint}</code>`,
    '',
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `👮 <b>Cryptographic Controls:</b>`,
    '',
    `• <b>Mint Authority:</b>`,
    mintAuth,
    '',
    `• <b>Freeze Authority:</b>`,
    freezeAuth,
    '',
    `• <b>Metadata Status:</b>`,
    updateAuth,
    '',
    `• <b>Token Program Standard:</b> <code>${escapeHtml(token.tokenProgram)}</code>`,
    extensions,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `💡 <i>Revoked authorities prove current on-chain state observed at block slot. Always inspect team multi-sig structures.</i>`,
  ].join('\n');
}

/**
 * 5. RISK FINDINGS & SCORECARD REPORT (/risk or /audit)
 */
export function formatRiskReport(report: TokenReport): string {
  const { token, risk } = report;
  const symbol = escapeHtml(token.symbol || 'TOKEN');
  const mint = token.mint;

  const riskBadge = getRiskBadge(risk.scorecard.overallLevel);
  const riskScore = risk.scorecard.score ?? 0;

  const breakdown = risk.scorecard.breakdown;
  const bText = [
    `• Authorities: <b>${breakdown.authorities.score}/100</b> (${escapeHtml(breakdown.authorities.status)})`,
    `• Holders: <b>${breakdown.holders.score}/100</b> (${escapeHtml(breakdown.holders.status)})`,
    `• Liquidity: <b>${breakdown.liquidity.score}/100</b> (${escapeHtml(breakdown.liquidity.status)})`,
    `• Code / Extensions: <b>${breakdown.codeOrExtensions.score}/100</b> (${escapeHtml(breakdown.codeOrExtensions.status)})`,
  ].join('\n');

  const findingsList = (risk.findings || [])
    .map((f: RiskFinding) => {
      const icon = f.severity === 'CRITICAL' ? '🚨' : f.severity === 'HIGH' ? '🔴' : f.severity === 'MEDIUM' ? '🟡' : '🟢';
      return `${icon} <b>${escapeHtml(f.title)}</b> [${f.severity}]\n   <i>${escapeHtml(f.description)}</i>\n   <code>Evidence: ${escapeHtml(f.evidence)}</code>`;
    })
    .join('\n\n');

  return [
    `⚠️ <b>RISK SCORECARD &amp; FINDINGS: $${symbol}</b>`,
    `<code>${mint}</code>`,
    '',
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `🛡️ <b>OVERALL RATING:</b> ${riskBadge}`,
    `📊 <b>Risk Score:</b> <b>${riskScore}/100</b> (0 = Cleanest, 100 = Riskiest)`,
    '',
    `<b>Category Score Breakdown:</b>`,
    bText,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    '',
    `📋 <b>Full Rule Findings:</b>`,
    findingsList || '• 🟢 <i>No risk findings triggered. Clean audit profile.</i>',
    '',
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `⚖️ <i>Findings reflect observable on-chain conditions. Never financial advice.</i>`,
  ].join('\n');
}

/**
 * Generates interactive keyboard buttons tailored to the active view.
 */
export function getReportInlineKeyboard(
  report: TokenReport,
  baseUrl?: string,
  activeView: ReportViewType = 'overview'
): InlineKeyboard {
  const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://launchlens-delta.vercel.app';
  const cleanBase = base.replace(/\/$/, '');
  const mint = report.token.mint;
  const dexscreenerUrl =
    report.liquidity.highestLiquidityPool?.url || `https://dexscreener.com/solana/${mint}`;

  const keyboard = new InlineKeyboard();

  if (activeView === 'overview') {
    keyboard
      .text('👥 Holders', `view:holders:${mint}`)
      .text('💧 Liquidity', `view:lp:${mint}`)
      .row()
      .text('🔐 Security', `view:auth:${mint}`)
      .text('⚠️ Risk Rules', `view:risk:${mint}`)
      .row()
      .url('🌐 Full Web Report', `${cleanBase}/report/${mint}`)
      .url('📈 DEXScreener', dexscreenerUrl)
      .row()
      .text('🔄 Rescan', `rescan:${mint}`);
  } else if (activeView === 'holders') {
    keyboard
      .text('📋 Overview', `view:overview:${mint}`)
      .text('💧 Liquidity', `view:lp:${mint}`)
      .row()
      .text('🔐 Security', `view:auth:${mint}`)
      .text('⚠️ Risk Rules', `view:risk:${mint}`)
      .row()
      .url('🌐 Full Web Report', `${cleanBase}/report/${mint}`)
      .text('🔄 Rescan', `rescan:${mint}`);
  } else if (activeView === 'lp') {
    keyboard
      .text('📋 Overview', `view:overview:${mint}`)
      .text('👥 Holders', `view:holders:${mint}`)
      .row()
      .text('🔐 Security', `view:auth:${mint}`)
      .text('⚠️ Risk Rules', `view:risk:${mint}`)
      .row()
      .url('📈 DEXScreener', dexscreenerUrl)
      .text('🔄 Rescan', `rescan:${mint}`);
  } else if (activeView === 'auth') {
    keyboard
      .text('📋 Overview', `view:overview:${mint}`)
      .text('👥 Holders', `view:holders:${mint}`)
      .row()
      .text('💧 Liquidity', `view:lp:${mint}`)
      .text('⚠️ Risk Rules', `view:risk:${mint}`)
      .row()
      .url('🌐 Full Web Report', `${cleanBase}/report/${mint}`)
      .text('🔄 Rescan', `rescan:${mint}`);
  } else if (activeView === 'risk') {
    keyboard
      .text('📋 Overview', `view:overview:${mint}`)
      .text('👥 Holders', `view:holders:${mint}`)
      .row()
      .text('💧 Liquidity', `view:lp:${mint}`)
      .text('🔐 Security', `view:auth:${mint}`)
      .row()
      .url('🌐 Full Web Report', `${cleanBase}/report/${mint}`)
      .text('🔄 Rescan', `rescan:${mint}`);
  }

  return keyboard;
}
