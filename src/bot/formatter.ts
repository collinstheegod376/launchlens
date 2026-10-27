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
      return 'CRITICAL RISK 🚨';
    case 'HIGH':
      return 'HIGH RISK 🔴';
    case 'MEDIUM':
      return 'MODERATE RISK 🟡';
    case 'LOW':
      return 'LOW RISK 🟢';
    case 'INFO':
    default:
      return 'INFORMATIONAL ⚪';
  }
}

/**
 * 1. FULL OVERVIEW REPORT (/scan or address)
 * Tree-structured layout with on-chain proofs, clean links, and 1-tap copyable CA.
 */
export function formatTokenReport(report: TokenReport, baseUrl?: string): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://launchlens-delta.vercel.app';
  const cleanBase = base.replace(/\/$/, '');
  const { token, holders, liquidity, risk, aiSummary } = report;
  const symbol = escapeHtml(token.symbol || 'UNKNOWN');
  const name = escapeHtml(token.name || 'Unknown Token');
  const mint = token.mint;
  const webUrl = `${cleanBase}/report/${mint}`;
  const dexscreenerUrl =
    liquidity.highestLiquidityPool?.url || `https://dexscreener.com/solana/${mint}`;
  const solscanUrl = `https://solscan.io/token/${mint}`;
  const rugcheckUrl = `https://rugcheck.xyz/tokens/${mint}`;

  const riskBadge = getRiskBadge(risk.scorecard.overallLevel);
  const riskScore = risk.scorecard.score ?? 0;

  const highestPool = liquidity.highestLiquidityPool;
  const price = highestPool?.priceUsd ?? 0;
  const fdv = highestPool?.fdv ?? 0;
  const totalLiquidity = liquidity.totalLiquidityUsd ?? 0;
  const volume24h = liquidity.totalVolume24h ?? 0;

  let poolName = 'No active DEX pool';
  let lpLockedDesc = 'Unlocked';
  if (highestPool) {
    const dex = escapeHtml(highestPool.dexId?.toUpperCase() || 'DEX');
    const baseSym = escapeHtml(highestPool.baseToken.symbol || symbol);
    const quoteSym = escapeHtml(highestPool.quoteToken.symbol || 'SOL');
    poolName = `${dex} (${baseSym}/${quoteSym})`;
    lpLockedDesc = highestPool.lpLockedPct !== undefined
      ? `${highestPool.lpLockedPct.toFixed(1)}% Locked 🔒`
      : 'Unverified ⚠️';
  }

  const top10Pct = holders.top10ConcentrationPct ?? 0;
  const top20Pct = holders.top20ConcentrationPct ?? 0;
  const progressBar = renderProgressBar(top10Pct);

  // Top 5 clickable holders
  const top5Links = (holders.topHolders || [])
    .slice(0, 5)
    .map((h) => {
      const pct = (h.percentage ?? 0).toFixed(1);
      return `<a href="https://solscan.io/account/${h.address}">${pct}%</a>`;
    })
    .join(' | ');

  const mintAuthStatus = token.authorities.isMintRevoked ? 'Revoked (Safe) 🟢' : 'Active (Warning) 🔴';
  const freezeAuthStatus = token.authorities.isFreezeRevoked ? 'Revoked (Safe) 🟢' : 'Active (Warning) 🔴';
  const mutabilityStatus = !token.authorities.isMutable ? 'Immutable 🟢' : 'Mutable 🟡';
  const progStandard = token.tokenProgram === 'spl-token-2022' ? 'Token-2022' : 'SPL-Token';

  const critOrHigh = (risk.findings || []).filter(
    (f) => f.severity === 'CRITICAL' || f.severity === 'HIGH' || f.severity === 'MEDIUM'
  );
  let findingsText = '🟢 No high-risk rules triggered';
  if (critOrHigh.length > 0) {
    const topFinding = critOrHigh[0];
    const icon = topFinding.severity === 'CRITICAL' ? '🚨' : topFinding.severity === 'HIGH' ? '🔴' : '🟡';
    findingsText = `${icon} ${escapeHtml(topFinding.title)} (${critOrHigh.length} flagged)`;
  }

  let aiText = '';
  if (aiSummary?.narrative) {
    aiText = escapeHtml(aiSummary.narrative.trim());
  } else if (aiSummary?.keyTakeaways && aiSummary.keyTakeaways.length > 0) {
    aiText = escapeHtml(aiSummary.keyTakeaways.slice(0, 2).join(' '));
  } else {
    aiText = `On-chain risk score of ${riskScore}/100. Review top holders and liquidity lockup before trading.`;
  }

  return [
    `⚡ <a href="${webUrl}"><b>${name}</b></a> ($${symbol})`,
    `└ 🛡️ ${riskBadge} (<b>${riskScore}/100</b>) | 🏷️ ${progStandard} | ⏱️ Live`,
    '',
    `📊 <b>Market &amp; Liquidity</b>`,
    `├ USD: <b>${formatPrice(price)}</b>`,
    `├ MC / FDV: <b>${formatCurrency(fdv)}</b>`,
    `├ 24h Vol: <b>${formatCurrency(volume24h)}</b>`,
    `├ Total LP: <b>${formatCurrency(totalLiquidity)}</b> (${lpLockedDesc})`,
    `└ Primary: ${poolName}`,
    '',
    `👥 <b>Holders Distribution</b>`,
    `├ Top 10 Non-Burn: <b>${top10Pct.toFixed(1)}%</b> <code>[${progressBar}]</code>`,
    `├ Top 20 Non-Burn: <b>${top20Pct.toFixed(1)}%</b>${holders.burnedSupplyPct > 0 ? ` | Burned: <b>${holders.burnedSupplyPct.toFixed(1)}%</b> 🔥` : ''}`,
    top5Links ? `└ Top 5: ${top5Links}` : `└ Top 10: <b>${top10Pct.toFixed(1)}%</b>`,
    '',
    `🔐 <b>Authorities &amp; Permissions</b>`,
    `├ Mint Authority: <b>${mintAuthStatus}</b>`,
    `├ Freeze Authority: <b>${freezeAuthStatus}</b>`,
    `└ Metadata: <b>${mutabilityStatus}</b>`,
    '',
    `⚠️ <b>Risk Findings</b>`,
    `└ ${findingsText}`,
    '',
    `🧠 <b>AI Synthesis</b>`,
    `└ <i>"${aiText}"</i>`,
    '',
    `🔗 <b>Quick Links</b>`,
    `└ <a href="${webUrl}">[🌐 Web Dossier]</a> • <a href="${dexscreenerUrl}">[📈 DEXScreener]</a> • <a href="${solscanUrl}">[🔍 Solscan]</a> • <a href="${rugcheckUrl}">[🛡️ RugCheck]</a>`,
    '',
    `<code>${mint}</code>`,
  ].join('\n');
}

/**
 * 2. HOLDERS DEEP-DIVE REPORT (/holders or /top)
 */
export function formatHoldersReport(report: TokenReport, baseUrl?: string): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://launchlens-delta.vercel.app';
  const cleanBase = base.replace(/\/$/, '');
  const { token, holders } = report;
  const symbol = escapeHtml(token.symbol || 'TOKEN');
  const name = escapeHtml(token.name || 'Token');
  const mint = token.mint;
  const webUrl = `${cleanBase}/report/${mint}`;
  const solscanHoldersUrl = `https://solscan.io/token/${mint}#holders`;

  const top10Pct = holders.top10ConcentrationPct ?? 0;
  const top20Pct = holders.top20ConcentrationPct ?? 0;
  const burnedPct = holders.burnedSupplyPct ?? 0;
  const circulating = formatTokens(holders.circulatingSupplyFormatted);
  const progressBar = renderProgressBar(top10Pct);

  const topHoldersList = (holders.topHolders || [])
    .slice(0, 8)
    .map((h: HolderRecord, idx: number, arr: HolderRecord[]) => {
      const isLast = idx === arr.length - 1;
      const branch = isLast ? '└' : '├';
      const shortAddr = `${h.address.slice(0, 4)}...${h.address.slice(-4)}`;
      const link = `<a href="https://solscan.io/account/${h.address}">${shortAddr}</a>`;
      const pct = (h.percentage ?? 0).toFixed(2);
      const balance = formatTokens(h.uiBalance);

      let tag = '👤 Wallet';
      if (h.classification === 'burn') tag = '🔥 Burn';
      else if (h.classification === 'pool') tag = '💧 AMM Pool';
      else if (h.isInsider) tag = '⚠️ Team';

      return `${branch} #${idx + 1} ${link} • <b>${pct}%</b> (${balance} ${symbol}) ${tag}`;
    })
    .join('\n');

  return [
    `👥 <a href="${webUrl}"><b>${name}</b></a> — Holder Distribution ($${symbol})`,
    `└ 📊 Top 10: <b>${top10Pct.toFixed(1)}%</b> | Top 20: <b>${top20Pct.toFixed(1)}%</b>${burnedPct > 0 ? ` | Burned: <b>${burnedPct.toFixed(1)}%</b> 🔥` : ''}`,
    '',
    `📈 <b>Concentration Breakdown</b>`,
    `├ Top 10 Non-Burn: <b>${top10Pct.toFixed(1)}%</b> <code>[${progressBar}]</code>`,
    `├ Circulating Float: <b>${circulating} ${symbol}</b>`,
    `└ Incinerated / Dead: <b>${burnedPct.toFixed(1)}%</b>`,
    '',
    `🏆 <b>Top Account Wallets</b>`,
    topHoldersList || '└ <i>No individual holder accounts recorded.</i>',
    '',
    `💡 <i>LaunchLens isolates burn incinerators and AMM pool reserves to compute true private insider concentration.</i>`,
    '',
    `🔗 <a href="${webUrl}">[🌐 Full Ledger]</a> • <a href="${solscanHoldersUrl}">[🔍 Solscan Holders]</a>`,
    '',
    `<code>${mint}</code>`,
  ].join('\n');
}

/**
 * 3. LIQUIDITY DEEP-DIVE REPORT (/lp or /liquidity)
 */
export function formatLiquidityReport(report: TokenReport, baseUrl?: string): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://launchlens-delta.vercel.app';
  const cleanBase = base.replace(/\/$/, '');
  const { token, liquidity } = report;
  const symbol = escapeHtml(token.symbol || 'TOKEN');
  const name = escapeHtml(token.name || 'Token');
  const mint = token.mint;
  const webUrl = `${cleanBase}/report/${mint}`;
  const dexscreenerUrl =
    liquidity.highestLiquidityPool?.url || `https://dexscreener.com/solana/${mint}`;

  const totalLiq = formatCurrency(liquidity.totalLiquidityUsd);
  const totalVol = formatCurrency(liquidity.totalVolume24h);
  const poolCount = liquidity.pools.length;

  const highestPool = liquidity.highestLiquidityPool;
  const lpLockedPct = highestPool?.lpLockedPct !== undefined
    ? `${highestPool.lpLockedPct.toFixed(1)}% Locked 🔒`
    : 'Unverified ⚠️';

  const poolTrees = (liquidity.pools || [])
    .slice(0, 3)
    .map((p: PoolRecord, idx: number, arr: PoolRecord[]) => {
      const isLast = idx === arr.length - 1;
      const branch = isLast ? '└' : '├';
      const pipe = isLast ? ' ' : '│';
      const dex = escapeHtml(p.dexId?.toUpperCase() || 'AMM');
      const poolAddr = `${p.poolAddress.slice(0, 4)}...${p.poolAddress.slice(-4)}`;
      const baseSym = escapeHtml(p.baseToken.symbol || symbol);
      const quoteSym = escapeHtml(p.quoteToken.symbol || 'SOL');
      const liq = formatCurrency(p.liquidityUsd);
      const vol = formatCurrency(p.volume24h);
      const locked = p.lpLockedPct !== undefined ? `<b>${p.lpLockedPct.toFixed(0)}% Locked 🔒</b>` : 'Unlocked ⚠️';
      const dsLink = p.url ? `<a href="${p.url}">[DEXScreener]</a>` : '';
      const solscanLink = `<a href="https://solscan.io/account/${p.poolAddress}">[Solscan]</a>`;

      return [
        `${branch} <b>${dex}</b> (${baseSym}/${quoteSym}) • <code>${poolAddr}</code>`,
        `${pipe} ├ Liq: <b>${liq}</b> • Vol: ${vol}`,
        `${pipe} ├ State: ${locked}`,
        `${pipe} └ Links: ${dsLink ? `${dsLink} • ` : ''}${solscanLink}`,
      ].join('\n');
    })
    .join('\n│\n');

  return [
    `💧 <a href="${webUrl}"><b>${name}</b></a> — Liquidity Audit ($${symbol})`,
    `└ 📊 Total LP: <b>${totalLiq}</b> | 24h Vol: <b>${totalVol}</b> | ${lpLockedPct}`,
    '',
    `🏊 <b>Active AMM Pools (${poolCount})</b>`,
    poolTrees || '└ <i>No active liquidity pools discovered on Raydium, Orca, or Meteora.</i>',
    '',
    `🔒 <i>Locked LP tokens prevent creators from draining reserves in sudden exit liquidity pulls.</i>`,
    '',
    `🔗 <a href="${webUrl}">[🌐 Web Pools]</a> • <a href="${dexscreenerUrl}">[📈 DEXScreener]</a>`,
    '',
    `<code>${mint}</code>`,
  ].join('\n');
}

/**
 * 4. SECURITY & AUTHORITIES DEEP-DIVE REPORT (/auth or /security)
 */
export function formatSecurityReport(report: TokenReport, baseUrl?: string): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://launchlens-delta.vercel.app';
  const cleanBase = base.replace(/\/$/, '');
  const { token } = report;
  const symbol = escapeHtml(token.symbol || 'TOKEN');
  const name = escapeHtml(token.name || 'Token');
  const mint = token.mint;
  const webUrl = `${cleanBase}/report/${mint}`;
  const solscanContractUrl = `https://solscan.io/token/${mint}`;

  const mintAuth = token.authorities.isMintRevoked
    ? '├ Mint Authority: <b>REVOKED (Safe) 🟢</b>\n│ ├ Status: Total supply is permanently capped.\n│ └ Key: <code>None (null)</code>'
    : `├ Mint Authority: <b>ACTIVE (High Risk) 🔴</b>\n│ ├ Status: Creator can arbitrarily mint new tokens.\n│ └ Key: <code>${escapeHtml(token.authorities.mintAuthority || 'Active')}</code>`;

  const freezeAuth = token.authorities.isFreezeRevoked
    ? '├ Freeze Authority: <b>REVOKED (Safe) 🟢</b>\n│ ├ Status: Token accounts cannot be frozen.\n│ └ Key: <code>None (null)</code>'
    : `├ Freeze Authority: <b>ACTIVE (High Risk) 🔴</b>\n│ ├ Status: Creator can freeze user token accounts.\n│ └ Key: <code>${escapeHtml(token.authorities.freezeAuthority || 'Active')}</code>`;

  const updateAuth = !token.authorities.isMutable
    ? '├ Metadata Mutability: <b>IMMUTABLE (Safe) 🟢</b>\n│ ├ Status: Name, ticker, and image cannot be altered.\n│ └ Key: <code>None (null)</code>'
    : `├ Metadata Mutability: <b>MUTABLE (Changeable) 🟡</b>\n│ ├ Status: Metadata update authority is retained.\n│ └ Key: <code>${escapeHtml(token.authorities.updateAuthority || 'Active')}</code>`;

  const progStandard = escapeHtml(token.tokenProgram);
  const extensions = token.extensions && token.extensions.length > 0
    ? `⚠️ Detected Extensions: ${escapeHtml(token.extensions.join(', '))}`
    : 'Standard SPL Program (No transfer hooks or hidden fees)';

  return [
    `🔐 <a href="${webUrl}"><b>${name}</b></a> — Security &amp; Permissions ($${symbol})`,
    `└ 🛡️ Cryptographic Access Controls`,
    '',
    `👮 <b>On-Chain Authority State</b>`,
    mintAuth,
    '│',
    freezeAuth,
    '│',
    updateAuth,
    '│',
    `└ Program Standard: <b>${progStandard}</b>`,
    `  └ Extensions: ${extensions}`,
    '',
    `💡 <i>Revoked authorities prove current on-chain state observed at block slot.</i>`,
    '',
    `🔗 <a href="${webUrl}">[🌐 Web Security]</a> • <a href="${solscanContractUrl}">[🔍 Solscan Contract]</a>`,
    '',
    `<code>${mint}</code>`,
  ].join('\n');
}

/**
 * 5. RISK FINDINGS & SCORECARD REPORT (/risk or /audit)
 */
export function formatRiskReport(report: TokenReport, baseUrl?: string): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://launchlens-delta.vercel.app';
  const cleanBase = base.replace(/\/$/, '');
  const { token, risk } = report;
  const symbol = escapeHtml(token.symbol || 'TOKEN');
  const name = escapeHtml(token.name || 'Token');
  const mint = token.mint;
  const webUrl = `${cleanBase}/report/${mint}`;
  const rugcheckUrl = `https://rugcheck.xyz/tokens/${mint}`;

  const riskBadge = getRiskBadge(risk.scorecard.overallLevel);
  const riskScore = risk.scorecard.score ?? 0;
  const breakdown = risk.scorecard.breakdown;

  const findingsTrees = (risk.findings || [])
    .slice(0, 5)
    .map((f: RiskFinding, idx: number, arr: RiskFinding[]) => {
      const isLast = idx === arr.length - 1;
      const branch = isLast ? '└' : '├';
      const pipe = isLast ? ' ' : '│';
      const icon = f.severity === 'CRITICAL' ? '🚨' : f.severity === 'HIGH' ? '🔴' : f.severity === 'MEDIUM' ? '🟡' : '🟢';

      return [
        `${branch} ${icon} <b>${escapeHtml(f.title)}</b> [${f.severity}]`,
        `${pipe} ├ Rule: ${escapeHtml(f.description)}`,
        `${pipe} └ Evidence: <code>${escapeHtml(f.evidence)}</code>`,
      ].join('\n');
    })
    .join('\n│\n');

  return [
    `⚠️ <a href="${webUrl}"><b>${name}</b></a> — Risk Scorecard ($${symbol})`,
    `└ 🛡️ RATING: <b>${riskBadge}</b> | Score: <b>${riskScore}/100</b>`,
    '',
    `📊 <b>Category Scorecard</b>`,
    `├ Authorities: <b>${breakdown.authorities.score}/100</b> (${escapeHtml(breakdown.authorities.status)})`,
    `├ Holders: <b>${breakdown.holders.score}/100</b> (${escapeHtml(breakdown.holders.status)})`,
    `├ Liquidity: <b>${breakdown.liquidity.score}/100</b> (${escapeHtml(breakdown.liquidity.status)})`,
    `└ Code / Extensions: <b>${breakdown.codeOrExtensions.score}/100</b> (${escapeHtml(breakdown.codeOrExtensions.status)})`,
    '',
    `📋 <b>Itemized Rule Trigger Audit</b>`,
    findingsTrees || '└ 🟢 <i>No risk findings triggered. Clean audit profile.</i>',
    '',
    `⚖️ <i>Findings reflect observable on-chain conditions. Never financial advice.</i>`,
    '',
    `🔗 <a href="${webUrl}">[🌐 Full Audit]</a> • <a href="${rugcheckUrl}">[🛡️ RugCheck]</a>`,
    '',
    `<code>${mint}</code>`,
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
