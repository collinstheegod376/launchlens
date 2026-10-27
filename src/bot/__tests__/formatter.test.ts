import { describe, it, expect } from 'vitest';
import {
  formatTokenReport,
  formatHoldersReport,
  formatLiquidityReport,
  formatSecurityReport,
  formatRiskReport,
  getReportInlineKeyboard,
  escapeHtml,
  formatPrice,
  formatCurrency,
  renderProgressBar,
} from '../formatter';
import { isValidSolanaAddress, checkAndSetCooldown } from '../bot';
import { TokenReport } from '@/core/types/token';

const mockReport: TokenReport = {
  token: {
    mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
    name: 'Jupiter <Core>',
    symbol: 'JUP & CO',
    decimals: 6,
    supplyRaw: '10000000000000000',
    supplyFormatted: 10_000_000_000,
    tokenProgram: 'spl-token',
    authorities: {
      mintAuthority: null,
      freezeAuthority: null,
      isMintRevoked: true,
      isFreezeRevoked: true,
      isMutable: false,
      updateAuthority: null,
    },
    metadataUri: 'https://metadata.jup.ag/token/JUP',
    createdAt: '2024-01-31T15:00:00Z',
    extensions: [],
  },
  holders: {
    topHolders: [
      {
        address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        owner: 'Community Multisig',
        rawBalance: '4000000000000000',
        uiBalance: 4_000_000_000,
        percentage: 40.0,
        classification: 'wallet',
      },
    ],
    top10ConcentrationPct: 52.4,
    top20ConcentrationPct: 65.0,
    burnedSupplyPct: 0.0,
    circulatingSupplyFormatted: 10_000_000_000,
  },
  liquidity: {
    totalLiquidityUsd: 125000000,
    totalVolume24h: 45000000,
    highestLiquidityPool: {
      dexId: 'raydium',
      poolAddress: 'pool1111111111111111111111111111111111111111',
      baseToken: { address: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', symbol: 'JUP' },
      quoteToken: { address: 'So11111111111111111111111111111111111111112', symbol: 'SOL' },
      priceUsd: 0.825,
      liquidityUsd: 125000000,
      volume24h: 45000000,
      fdv: 8250000000,
      url: 'https://dexscreener.com/solana/pool1111111111111111111111111111111111111111',
      lpLockedPct: 99.5,
    },
    pools: [
      {
        dexId: 'raydium',
        poolAddress: 'pool1111111111111111111111111111111111111111',
        baseToken: { address: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', symbol: 'JUP' },
        quoteToken: { address: 'So11111111111111111111111111111111111111112', symbol: 'SOL' },
        priceUsd: 0.825,
        liquidityUsd: 125000000,
        volume24h: 45000000,
        fdv: 8250000000,
        url: 'https://dexscreener.com/solana/pool1111111111111111111111111111111111111111',
        lpLockedPct: 99.5,
      },
    ],
  },
  risk: {
    scorecard: {
      overallLevel: 'LOW',
      score: 12,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 1,
      lowCount: 2,
      infoCount: 1,
      breakdown: {
        authorities: { score: 0, status: 'Revoked' },
        holders: { score: 20, status: 'Moderate concentration' },
        liquidity: { score: 0, status: 'Deep liquidity' },
        codeOrExtensions: { score: 0, status: 'Standard SPL' },
      },
    },
    findings: [
      {
        ruleId: 'HOLDER_CONCENTRATION_ELEVATED',
        title: 'Elevated Holder Concentration',
        severity: 'MEDIUM',
        description: 'Top 10 holders control 52.4% of total supply.',
        evidence: 'Top holder controls 40.0% in multisig.',
      },
      {
        ruleId: 'AUTH_MINT_REVOKED',
        title: 'Mint Authority Revoked',
        severity: 'LOW',
        description: 'No new tokens can be created.',
        evidence: 'mintAuthority is null',
      },
    ],
  },
  aiSummary: {
    narrative: 'Jupiter displays strong security fundamentals with revoked mint and freeze authorities.',
    keyTakeaways: ['Mint revoked', 'Deep liquidity'],
    uncertainties: [],
    generatedBy: 'deterministic-fallback',
  },
  provenance: {
    generatedAt: '2026-10-26T23:00:00Z',
    dataFreshness: {
      solanaRpc: 'Direct on-demand scan',
      dexScreener: 'Real-time query',
      rugCheck: 'Evaluated rule engine',
    },
    limitations: ['Automated heuristics'],
  },
};

describe('Telegram Bot Formatter & Modular Views', () => {
  it('escapes HTML special characters properly', () => {
    expect(escapeHtml('Launch <Test> & "More"')).toBe('Launch &lt;Test&gt; &amp; "More"');
    expect(escapeHtml('')).toBe('');
    expect(escapeHtml(null)).toBe('');
  });

  it('renders ASCII progress bars accurately', () => {
    expect(renderProgressBar(50, 10)).toBe('█████░░░░░');
    expect(renderProgressBar(100, 10)).toBe('██████████');
    expect(renderProgressBar(0, 10)).toBe('░░░░░░░░░░');
  });

  it('formats prices and currencies correctly', () => {
    expect(formatPrice(1234.56)).toBe('$1,234.56');
    expect(formatPrice(0.825)).toBe('$0.8250');
    expect(formatCurrency(125_000_000)).toBe('$125.00M');
    expect(formatCurrency(8_250_000_000)).toBe('$8.25B');
  });

  it('formats full token report (Overview)', () => {
    const formatted = formatTokenReport(mockReport);
    expect(formatted).toContain('⚡ <a href="https://launchlens-delta.vercel.app/report/JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN"><b>Jupiter &lt;Core&gt;</b></a> ($JUP &amp; CO)');
    expect(formatted).toContain('<code>JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN</code>');
    expect(formatted).toContain('🛡️ LOW RISK 🟢 (<b>12/100</b>)');
    expect(formatted).toContain('Mint Authority: <b>Revoked (Safe) 🟢</b>');
    expect(formatted).toContain('Top 10 Non-Burn: <b>52.4%</b>');
    expect(formatted).toContain('Total LP: <b>$125.00M</b>');
  });

  it('formats /holders deep-dive report', () => {
    const formatted = formatHoldersReport(mockReport);
    expect(formatted).toContain('👥 <a href="https://launchlens-delta.vercel.app/report/JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN"><b>Jupiter &lt;Core&gt;</b></a> — Holder Distribution ($JUP &amp; CO)');
    expect(formatted).toContain('Top 10 Non-Burn: <b>52.4%</b>');
    expect(formatted).toContain('7xKX...gAsU');
  });

  it('formats /lp liquidity deep-dive report', () => {
    const formatted = formatLiquidityReport(mockReport);
    expect(formatted).toContain('💧 <a href="https://launchlens-delta.vercel.app/report/JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN"><b>Jupiter &lt;Core&gt;</b></a> — Liquidity Audit ($JUP &amp; CO)');
    expect(formatted).toContain('Total LP: <b>$125.00M</b>');
    expect(formatted).toContain('RAYDIUM');
  });

  it('formats /auth security deep-dive report', () => {
    const formatted = formatSecurityReport(mockReport);
    expect(formatted).toContain('🔐 <a href="https://launchlens-delta.vercel.app/report/JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN"><b>Jupiter &lt;Core&gt;</b></a> — Security &amp; Permissions ($JUP &amp; CO)');
    expect(formatted).toContain('REVOKED (Safe) 🟢');
  });

  it('formats /risk scorecard deep-dive report', () => {
    const formatted = formatRiskReport(mockReport);
    expect(formatted).toContain('⚠️ <a href="https://launchlens-delta.vercel.app/report/JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN"><b>Jupiter &lt;Core&gt;</b></a> — Risk Scorecard ($JUP &amp; CO)');
    expect(formatted).toContain('Score: <b>12/100</b>');
  });

  it('generates interactive keyboards for different views', () => {
    const overviewKb = getReportInlineKeyboard(mockReport, 'https://launchlens.app', 'overview');
    expect(overviewKb.inline_keyboard[0][0].text).toBe('👥 Holders');
    expect(overviewKb.inline_keyboard[0][1].text).toBe('💧 Liquidity');

    const holdersKb = getReportInlineKeyboard(mockReport, 'https://launchlens.app', 'holders');
    expect(holdersKb.inline_keyboard[0][0].text).toBe('📋 Overview');
  });

  it('validates Solana public key addresses accurately', () => {
    expect(isValidSolanaAddress('JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN')).toBe(true);
    expect(isValidSolanaAddress('invalid_address_123')).toBe(false);
    expect(isValidSolanaAddress('')).toBe(false);
  });
});
