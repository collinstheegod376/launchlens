import { HolderRecord, PoolRecord } from "../types/token";

export interface HolderMetricsResult {
  top10ConcentrationPct: number;
  top20ConcentrationPct: number;
  burnedSupplyPct: number;
  circulatingSupplyFormatted: number;
  topHolders: HolderRecord[];
}

export interface LiquidityMetricsResult {
  totalLiquidityUsd: number;
  totalVolume24h: number;
  primaryPriceUsd: number;
  primaryFdv: number;
  liquidityToFdvRatio: number;
  highestLiquidityPool?: PoolRecord;
}

/**
 * Rounds a number to a specified number of decimal places.
 */
export function roundTo(val: number, decimals = 2): number {
  if (!isFinite(val) || isNaN(val)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}

/**
 * Calculates holder concentration metrics and circulating supply.
 * Burn addresses are excluded from holder concentration.
 */
export function calculateHolderMetrics(
  holders: HolderRecord[],
  totalSupplyFormatted: number
): HolderMetricsResult {
  if (!Array.isArray(holders) || holders.length === 0) {
    return {
      top10ConcentrationPct: 0,
      top20ConcentrationPct: 0,
      burnedSupplyPct: 0,
      circulatingSupplyFormatted: Math.max(0, totalSupplyFormatted),
      topHolders: [],
    };
  }

  // Clone and sort holders by percentage descending
  const sortedHolders = [...holders].sort((a, b) => (b.percentage || 0) - (a.percentage || 0));

  // Compute burned supply percentage
  let burnedPct = 0;
  for (const h of sortedHolders) {
    if (h.classification === "burn") {
      burnedPct += h.percentage || 0;
    }
  }
  const burnedSupplyPct = roundTo(Math.min(100, Math.max(0, burnedPct)), 2);

  // Compute circulating supply
  const circulatingMultiplier = Math.max(0, 100 - burnedSupplyPct) / 100;
  const circulatingSupplyFormatted = roundTo(
    Math.max(0, totalSupplyFormatted * circulatingMultiplier),
    4
  );

  // Filter out burn addresses to calculate genuine concentration
  const nonBurnHolders = sortedHolders.filter((h) => h.classification !== "burn");

  // Sum top 10 non-burn holders
  const top10 = nonBurnHolders.slice(0, 10);
  const top10ConcentrationPct = roundTo(
    Math.min(100, top10.reduce((acc, h) => acc + (h.percentage || 0), 0)),
    2
  );

  // Sum top 20 non-burn holders
  const top20 = nonBurnHolders.slice(0, 20);
  const top20ConcentrationPct = roundTo(
    Math.min(100, top20.reduce((acc, h) => acc + (h.percentage || 0), 0)),
    2
  );

  return {
    top10ConcentrationPct,
    top20ConcentrationPct,
    burnedSupplyPct,
    circulatingSupplyFormatted,
    topHolders: sortedHolders,
  };
}

/**
 * Computes aggregate liquidity and market metrics across DEX pools.
 */
export function calculateLiquidityMetrics(pools: PoolRecord[]): LiquidityMetricsResult {
  if (!Array.isArray(pools) || pools.length === 0) {
    return {
      totalLiquidityUsd: 0,
      totalVolume24h: 0,
      primaryPriceUsd: 0,
      primaryFdv: 0,
      liquidityToFdvRatio: 0,
      highestLiquidityPool: undefined,
    };
  }

  // Sort pools by liquidity descending
  const sortedPools = [...pools].sort((a, b) => (b.liquidityUsd || 0) - (a.liquidityUsd || 0));
  const highestLiquidityPool = sortedPools[0];

  const totalLiquidityUsd = roundTo(
    sortedPools.reduce((sum, p) => sum + (p.liquidityUsd || 0), 0),
    2
  );

  const totalVolume24h = roundTo(
    sortedPools.reduce((sum, p) => sum + (p.volume24h || 0), 0),
    2
  );

  const primaryPriceUsd = highestLiquidityPool?.priceUsd || 0;
  const primaryFdv = highestLiquidityPool?.fdv || 0;

  let liquidityToFdvRatio = 0;
  if (primaryFdv > 0) {
    liquidityToFdvRatio = roundTo((totalLiquidityUsd / primaryFdv) * 100, 2);
  }

  return {
    totalLiquidityUsd,
    totalVolume24h,
    primaryPriceUsd,
    primaryFdv,
    liquidityToFdvRatio,
    highestLiquidityPool,
  };
}
