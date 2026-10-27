import { PublicKey } from "@solana/web3.js";
import { TokenOverview, TokenReport, PoolRecord, HolderRecord } from "./types/token";
import { reportCache } from "./adapters/cache";
import { fetchSolanaParsedAccount, SolanaRpcAccountResult } from "./adapters/solanaRpc";
import { fetchDexScreenerData, DexScreenerResult } from "./adapters/dexScreener";
import { fetchRugCheckReport, RugCheckResult } from "./adapters/rugCheck";
import { calculateHolderMetrics, calculateLiquidityMetrics } from "./engine/metricsCalculator";
import { evaluateRisk } from "./engine/riskEngine";
import { generateAiSummary } from "./ai/explainer";
import { saveReportToDatabase } from "./db/supabase";

/**
 * Validates whether the given string is a valid Solana public key (base58).
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    const pubkey = new PublicKey(address);
    return PublicKey.isOnCurve(pubkey.toBuffer());
  } catch {
    return false;
  }
}

/**
 * Orchestrates full token ingestion, metrics calculation, risk scoring,
 * AI summarization, caching, and persistence.
 */
export async function generateTokenReport(
  mintAddress: string,
  forceFresh = false
): Promise<TokenReport> {
  const trimmedAddress = mintAddress.trim();

  // 1. Validate Base58 Solana Address
  if (!isValidSolanaAddress(trimmedAddress)) {
    throw new Error(`Invalid Solana mint address: "${trimmedAddress}"`);
  }

  // 2. Check Cache
  if (!forceFresh) {
    const cached = reportCache.get<TokenReport>(trimmedAddress);
    if (cached) {
      return cached;
    }
  }

  // 3. Concurrently fetch all data sources via Promise.allSettled
  const [rpcSettled, dexSettled, rugCheckSettled] = await Promise.allSettled([
    fetchSolanaParsedAccount(trimmedAddress),
    fetchDexScreenerData(trimmedAddress),
    fetchRugCheckReport(trimmedAddress),
  ]);

  const rpcData: SolanaRpcAccountResult | null =
    rpcSettled.status === "fulfilled" ? rpcSettled.value : null;

  const dexData: DexScreenerResult =
    dexSettled.status === "fulfilled"
      ? dexSettled.value
      : {
          pools: [],
          highestLiquidityPool: undefined,
          totalLiquidityUsd: 0,
          totalVolume24h: 0,
          primaryPriceUsd: 0,
          primaryFdv: 0,
        };

  const rugCheckData: RugCheckResult =
    rugCheckSettled.status === "fulfilled"
      ? rugCheckSettled.value
      : {
          topHolders: [],
          lpLockedPct: 0,
          lpLockedUsd: 0,
          risks: [],
        };

  // Re-classify any holders matching DEX pools
  const knownPoolAddresses = new Set<string>();
  for (const pool of dexData.pools) {
    if (pool.poolAddress) knownPoolAddresses.add(pool.poolAddress);
  }

  const normalizedHolders: HolderRecord[] = rugCheckData.topHolders.map((h) => {
    if (
      h.classification !== "burn" &&
      ((h.address && knownPoolAddresses.has(h.address)) ||
        (h.owner && knownPoolAddresses.has(h.owner)))
    ) {
      return { ...h, classification: "pool" };
    }
    return h;
  });

  // Extract Metadata & Authorities
  const tokenName =
    rugCheckData.tokenMeta?.name ||
    dexData.tokenName ||
    `${trimmedAddress.slice(0, 4)}...${trimmedAddress.slice(-4)}`;

  const tokenSymbol =
    rugCheckData.tokenMeta?.symbol || dexData.tokenSymbol || "UNKNOWN";

  const decimals = rpcData?.decimals ?? 9;
  const supplyRaw = rpcData?.supplyRaw ?? "0";
  const supplyFormatted = rpcData?.supplyFormatted ?? 0;

  const mintAuthority = rpcData?.mintAuthority ?? null;
  const freezeAuthority = rpcData?.freezeAuthority ?? null;
  const isMintRevoked = rpcData ? rpcData.isMintRevoked : false;
  const isFreezeRevoked = rpcData ? rpcData.isFreezeRevoked : false;

  const isMutable = rugCheckData.tokenMeta?.mutable ?? true;
  const updateAuthority = rugCheckData.tokenMeta?.updateAuthority ?? null;

  const tokenProgram = rpcData?.tokenProgram ?? "spl-token";
  const extensions = rpcData?.extensions ?? [];

  const tokenOverview: TokenOverview = {
    mint: trimmedAddress,
    name: tokenName,
    symbol: tokenSymbol,
    decimals,
    supplyRaw,
    supplyFormatted,
    tokenProgram,
    authorities: {
      mintAuthority,
      freezeAuthority,
      isMintRevoked,
      isFreezeRevoked,
      isMutable,
      updateAuthority,
    },
    metadataUri: rugCheckData.tokenMeta?.uri,
    extensions,
  };

  // 4. Calculate holder concentration metrics
  const holderMetrics = calculateHolderMetrics(normalizedHolders, supplyFormatted);

  // 5. Calculate liquidity metrics
  const liquidityMetrics = calculateLiquidityMetrics(dexData.pools);

  // Attach LP lock info to highest liquidity pool if present
  const poolsWithLp: PoolRecord[] = liquidityMetrics.highestLiquidityPool
    ? dexData.pools.map((p, idx) => {
        if (idx === 0) {
          return {
            ...p,
            lpLockedPct: rugCheckData.lpLockedPct,
            lpLockedUsd: rugCheckData.lpLockedUsd,
          };
        }
        return p;
      })
    : dexData.pools;

  const highestPool = poolsWithLp[0] || undefined;

  // 6. Evaluate Risk Engine
  const riskResult = evaluateRisk({
    token: tokenOverview,
    holders: {
      topHolders: holderMetrics.topHolders,
      top10ConcentrationPct: holderMetrics.top10ConcentrationPct,
      top20ConcentrationPct: holderMetrics.top20ConcentrationPct,
      burnedSupplyPct: holderMetrics.burnedSupplyPct,
      circulatingSupplyFormatted: holderMetrics.circulatingSupplyFormatted,
    },
    liquidity: {
      totalLiquidityUsd: liquidityMetrics.totalLiquidityUsd,
      totalVolume24h: liquidityMetrics.totalVolume24h,
      pools: poolsWithLp,
      highestLiquidityPool: highestPool,
    },
    lpLockedPct: rugCheckData.lpLockedPct,
  });

  // 7. Generate AI / Deterministic Summary
  const aiSummary = await generateAiSummary({
    token: tokenOverview,
    scorecard: riskResult.scorecard,
    findings: riskResult.findings,
    top10ConcentrationPct: holderMetrics.top10ConcentrationPct,
    top20ConcentrationPct: holderMetrics.top20ConcentrationPct,
    burnedSupplyPct: holderMetrics.burnedSupplyPct,
    circulatingSupplyFormatted: holderMetrics.circulatingSupplyFormatted,
    totalLiquidityUsd: liquidityMetrics.totalLiquidityUsd,
    totalVolume24h: liquidityMetrics.totalVolume24h,
    lpLockedPct: rugCheckData.lpLockedPct,
  });

  // 8. Compile Provenance
  const limitations: string[] = [];
  if (!rpcData) {
    limitations.push("Solana direct RPC call timed out or failed; authority data could not be verified directly from RPC.");
  }
  if (dexData.pools.length === 0) {
    limitations.push("No DEX trading pairs detected on DEX Screener for this mint address.");
  }
  if (rugCheckData.topHolders.length === 0) {
    limitations.push("RugCheck holder distribution data was unavailable or empty.");
  }

  const report: TokenReport = {
    token: tokenOverview,
    holders: {
      topHolders: holderMetrics.topHolders,
      top10ConcentrationPct: holderMetrics.top10ConcentrationPct,
      top20ConcentrationPct: holderMetrics.top20ConcentrationPct,
      burnedSupplyPct: holderMetrics.burnedSupplyPct,
      circulatingSupplyFormatted: holderMetrics.circulatingSupplyFormatted,
    },
    liquidity: {
      totalLiquidityUsd: liquidityMetrics.totalLiquidityUsd,
      totalVolume24h: liquidityMetrics.totalVolume24h,
      highestLiquidityPool: highestPool,
      pools: poolsWithLp,
    },
    risk: {
      scorecard: riskResult.scorecard,
      findings: riskResult.findings,
    },
    aiSummary,
    provenance: {
      generatedAt: new Date().toISOString(),
      dataFreshness: {
        solanaRpc: rpcData ? "confirmed" : "unavailable",
        dexScreener: dexData.pools.length > 0 ? "confirmed" : "unavailable",
        rugCheck: rugCheckData.topHolders.length > 0 ? "confirmed" : "unavailable",
      },
      limitations,
    },
  };

  // 9. Persist to Supabase if configured (non-blocking)
  saveReportToDatabase(report).catch((err) => {
    console.warn(`[orchestrator] Background persistence failed: ${err.message}`);
  });

  // 10. Cache report
  reportCache.set(trimmedAddress, report);

  return report;
}
