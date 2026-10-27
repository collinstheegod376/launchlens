import { describe, it, expect } from 'vitest';
import { formatTokenReport, getReportInlineKeyboard, escapeHtml, formatPrice, formatCurrency } from '../formatter';
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
    pools: [],
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
    narrative: 'Jupiter displays strong security fundamentals with revoked mint and freeze authorities. Top holders are concentrated in documented community multisig pools.',
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

describe('Telegram Bot Formatter', () => {
  it('escapes HTML special characters properly', () => {
    expect(escapeHtml('Launch <Test> & "More"')).toBe('Launch &lt;Test&gt; &amp; "More"');
    expect(escapeHtml('')).toBe('');
    expect(escapeHtml(null)).toBe('');
  });

  it('formats prices and currencies correctly', () => {
    expect(formatPrice(1234.56)).toBe('$1,234.56');
    expect(formatPrice(0.825)).toBe('$0.8250');
    expect(formatPrice(0.0000456)).toBe('$0.00004560');
    expect(formatCurrency(125_000_000)).toBe('$125.00M');
    expect(formatCurrency(45_000)).toBe('$45.0K');
    expect(formatCurrency(8_250_000_000)).toBe('$8.25B');
  });

  it('formats a full token report into an HTML Telegram message', () => {
    const formatted = formatTokenReport(mockReport);

    // Header check
    expect(formatted).toContain('⚡ <b>LAUNCHLENS REPORT: $JUP &amp; CO (Jupiter &lt;Core&gt;)</b>');
    expect(formatted).toContain('<code>JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN</code>');

    // Risk badge check
    expect(formatted).toContain('🛡️ <b>Risk:</b> 🟢 LOW RISK (Score: <b>12/100</b>)');

    // Metrics check
    expect(formatted).toContain('• <b>Price:</b> $0.8250');
    expect(formatted).toContain('• <b>FDV:</b> $8.25B');
    expect(formatted).toContain('• <b>Liquidity:</b> $125.00M');

    // Authorities check
    expect(formatted).toContain('• Mint: ❌ Revoked (Safe)');
    expect(formatted).toContain('• Freeze: ❌ Revoked (Safe)');
    expect(formatted).toContain('• Metadata: ❌ Immutable');

    // Holders check
    expect(formatted).toContain('• Top 10 Holders: <b>52.4%</b>');

    // DEX & LP check
    expect(formatted).toContain('• Primary Pool: <b>RAYDIUM</b>');
    expect(formatted).toContain('• LP Status: <b>99.5% locked</b>');

    // Risk findings check (Medium finding included, Low excluded)
    expect(formatted).toContain('• 🟡 <b>Elevated Holder Concentration</b>');
    expect(formatted).toContain('Top 10 holders control 52.4% of total supply.');

    // AI Insight check
    expect(formatted).toContain('Jupiter displays strong security fundamentals');

    // Disclaimer check
    expect(formatted).toContain('Automated analysis for informational purposes only');
  });

  it('generates an InlineKeyboard with all expected URLs and callback actions', () => {
    const keyboard = getReportInlineKeyboard(mockReport, 'https://launchlens.app');
    const buttons = keyboard.inline_keyboard;

    // Row 1: Web report
    const webBtn = buttons[0][0];
    expect(webBtn.text).toBe('🌐 Full Web Report');
    if ('url' in webBtn) {
      expect(webBtn.url).toBe('https://launchlens.app/report/JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN');
    }

    // Row 2: DEXScreener and Solscan
    const dexBtn = buttons[1][0];
    const solBtn = buttons[1][1];
    expect(dexBtn.text).toBe('📈 DEXScreener');
    if ('url' in dexBtn) {
      expect(dexBtn.url).toBe('https://dexscreener.com/solana/pool1111111111111111111111111111111111111111');
    }
    expect(solBtn.text).toBe('🔍 Solscan');
    if ('url' in solBtn) {
      expect(solBtn.url).toBe('https://solscan.io/token/JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN');
    }

    // Row 3: Rescan callback
    const rescanBtn = buttons[2][0];
    expect(rescanBtn.text).toBe('🔄 Rescan');
    if ('callback_data' in rescanBtn) {
      expect(rescanBtn.callback_data).toBe('rescan:JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN');
    }
  });

  it('correctly validates Solana addresses', () => {
    expect(isValidSolanaAddress('JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN')).toBe(true);
    expect(isValidSolanaAddress('DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263')).toBe(true);
    expect(isValidSolanaAddress('EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm')).toBe(true);
    expect(isValidSolanaAddress('not-an-address')).toBe(false);
    expect(isValidSolanaAddress('0x1234567890abcdef1234567890abcdef12345678')).toBe(false);
    expect(isValidSolanaAddress('')).toBe(false);
  });

  it('enforces chat cooldown rate limiting', () => {
    const testChatId = 999999999;
    expect(checkAndSetCooldown(testChatId)).toBe(false); // First call passes
    expect(checkAndSetCooldown(testChatId)).toBe(true); // Immediate second call throttled
  });
});
