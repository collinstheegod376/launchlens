import { PoolRecord } from "../types/token";

export interface DexScreenerResult {
  pools: PoolRecord[];
  highestLiquidityPool?: PoolRecord;
  totalLiquidityUsd: number;
  totalVolume24h: number;
  primaryPriceUsd: number;
  primaryFdv: number;
  tokenName?: string;
  tokenSymbol?: string;
}

interface RawDexScreenerPair {
  chainId?: string;
  dexId?: string;
  url?: string;
  pairAddress?: string;
  baseToken?: {
    address?: string;
    name?: string;
    symbol?: string;
  };
  quoteToken?: {
    address?: string;
    name?: string;
    symbol?: string;
  };
  priceUsd?: string;
  volume?: {
    h24?: number;
  };
  liquidity?: {
    usd?: number;
    base?: number;
    quote?: number;
  };
  fdv?: number;
  marketCap?: number;
  pairCreatedAt?: number;
}

interface RawDexScreenerResponse {
  schemaVersion?: string;
  pairs?: RawDexScreenerPair[] | null;
}

const DEFAULT_TIMEOUT_MS = 8000;

export async function fetchDexScreenerData(
  mintAddress: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<DexScreenerResult> {
  const emptyResult: DexScreenerResult = {
    pools: [],
    highestLiquidityPool: undefined,
    totalLiquidityUsd: 0,
    totalVolume24h: 0,
    primaryPriceUsd: 0,
    primaryFdv: 0,
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const url = `https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(mintAddress)}`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[dexScreener] HTTP ${response.status} fetching data for ${mintAddress}`);
      return emptyResult;
    }

    const json: RawDexScreenerResponse = await response.json();
    const rawPairs = json.pairs || [];

    if (!Array.isArray(rawPairs) || rawPairs.length === 0) {
      return emptyResult;
    }

    // Filter to Solana pairs or pairs involving this mint
    const solanaPairs = rawPairs.filter(
      (pair) =>
        (!pair.chainId || pair.chainId.toLowerCase() === "solana") &&
        (pair.baseToken?.address?.toLowerCase() === mintAddress.toLowerCase() ||
          pair.quoteToken?.address?.toLowerCase() === mintAddress.toLowerCase())
    );

    const targetPairs = solanaPairs.length > 0 ? solanaPairs : rawPairs;

    const mappedPools: PoolRecord[] = targetPairs.map((pair) => {
      const isBase = pair.baseToken?.address?.toLowerCase() === mintAddress.toLowerCase();
      const baseInfo = isBase ? pair.baseToken : pair.quoteToken;
      const quoteInfo = isBase ? pair.quoteToken : pair.baseToken;

      return {
        dexId: pair.dexId || "unknown",
        poolAddress: pair.pairAddress || "",
        baseToken: {
          address: baseInfo?.address || mintAddress,
          symbol: baseInfo?.symbol || "UNKNOWN",
          name: baseInfo?.name,
        },
        quoteToken: {
          address: quoteInfo?.address || "",
          symbol: quoteInfo?.symbol || "SOL",
          name: quoteInfo?.name,
        },
        priceUsd: parseFloat(pair.priceUsd || "0") || 0,
        liquidityUsd: Number(pair.liquidity?.usd) || 0,
        volume24h: Number(pair.volume?.h24) || 0,
        fdv: Number(pair.fdv ?? pair.marketCap) || 0,
        pairCreatedAt: pair.pairCreatedAt,
        url: pair.url || `https://dexscreener.com/solana/${pair.pairAddress || mintAddress}`,
      };
    });

    // Sort pools by liquidity descending
    mappedPools.sort((a, b) => b.liquidityUsd - a.liquidityUsd);

    const totalLiquidityUsd = mappedPools.reduce((sum, p) => sum + p.liquidityUsd, 0);
    const totalVolume24h = mappedPools.reduce((sum, p) => sum + p.volume24h, 0);

    const highestLiquidityPool = mappedPools[0];
    const primaryPriceUsd = highestLiquidityPool?.priceUsd || 0;
    const primaryFdv = highestLiquidityPool?.fdv || 0;

    // Detect metadata from the primary pool
    const tokenName = highestLiquidityPool?.baseToken?.name;
    const tokenSymbol = highestLiquidityPool?.baseToken?.symbol;

    return {
      pools: mappedPools,
      highestLiquidityPool,
      totalLiquidityUsd,
      totalVolume24h,
      primaryPriceUsd,
      primaryFdv,
      tokenName,
      tokenSymbol,
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.warn(`[dexScreener] Error fetching data for ${mintAddress}: ${err.message}`);
    return emptyResult;
  }
}
