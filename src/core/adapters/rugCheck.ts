import { HolderRecord } from "../types/token";

export interface RugCheckResult {
  topHolders: HolderRecord[];
  lpLockedPct: number;
  lpLockedUsd: number;
  tokenMeta?: {
    name?: string;
    symbol?: string;
    uri?: string;
    mutable?: boolean;
    updateAuthority?: string | null;
  };
  risks?: Array<{
    name: string;
    description: string;
    level: string;
    score: number;
  }>;
  rugScore?: number;
}

interface RawRugCheckHolder {
  address?: string;
  owner?: string;
  amount?: number | string;
  uiAmount?: number;
  uiAmountString?: string;
  pct?: number;
  insider?: boolean;
}

interface RawRugCheckMarketLp {
  lpLockedPct?: number;
  lpLockedUSD?: number;
  lpUnlockedPct?: number;
  pct?: number;
  usd?: number;
  burnPct?: number;
}

interface RawRugCheckMarket {
  pubkey?: string;
  marketType?: string;
  lp?: RawRugCheckMarketLp;
}

interface RawRugCheckResponse {
  mint?: string;
  score?: number;
  tokenMeta?: {
    name?: string;
    symbol?: string;
    uri?: string;
    mutable?: boolean;
    updateAuthority?: string | null;
  };
  topHolders?: RawRugCheckHolder[];
  markets?: RawRugCheckMarket[];
  risks?: Array<{
    name: string;
    description: string;
    level: string;
    score: number;
  }>;
}

const KNOWN_BURN_ADDRESSES = new Set([
  "11111111111111111111111111111111",
  "1nc1nerator11111111111111111111111111111111",
  "0x0000000000000000000000000000000000000000",
]);

const KNOWN_DEX_PROGRAMS = new Set([
  "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8", // Raydium Liquidity Pool V4
  "CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C", // Raydium CPMM
  "CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK", // Raydium CLMM
  "LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo", // Meteora DLMM
  "Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB", // Meteora Dynamic Pools
  "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc", // Orca Whirlpools
  "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P", // Pump.fun Bonding Curve
  "CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM", // Pump.fun Fee
]);

const DEFAULT_TIMEOUT_MS = 8000;

function isBurnAddress(address?: string, owner?: string): boolean {
  if (!address && !owner) return false;

  const addrNorm = (address || "").toLowerCase();
  const ownerNorm = (owner || "").toLowerCase();

  if (address && KNOWN_BURN_ADDRESSES.has(address)) return true;
  if (owner && KNOWN_BURN_ADDRESSES.has(owner)) return true;

  if (addrNorm.startsWith("dead") || ownerNorm.startsWith("dead")) return true;
  if (addrNorm.includes("11111111111111111111111111111111")) return true;
  if (ownerNorm.includes("11111111111111111111111111111111")) return true;

  return false;
}

function isPoolOrInsider(holder: RawRugCheckHolder, knownPoolAddresses: Set<string>): boolean {
  if (holder.insider === true) return true;
  if (holder.address && knownPoolAddresses.has(holder.address)) return true;
  if (holder.owner && knownPoolAddresses.has(holder.owner)) return true;
  if (holder.owner && KNOWN_DEX_PROGRAMS.has(holder.owner)) return true;
  if (holder.address && KNOWN_DEX_PROGRAMS.has(holder.address)) return true;
  return false;
}

export async function fetchRugCheckReport(
  mintAddress: string,
  knownPoolAddresses: Set<string> = new Set(),
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<RugCheckResult> {
  const emptyResult: RugCheckResult = {
    topHolders: [],
    lpLockedPct: 0,
    lpLockedUsd: 0,
    tokenMeta: undefined,
    risks: [],
    rugScore: undefined,
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const url = `https://api.rugcheck.xyz/v1/tokens/${encodeURIComponent(mintAddress)}/report`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[rugCheck] HTTP ${response.status} fetching report for ${mintAddress}`);
      return emptyResult;
    }

    const data: RawRugCheckResponse = await response.json();

    // 1. Process topHolders
    const rawHolders = data.topHolders || [];
    const topHolders: HolderRecord[] = rawHolders.map((h) => {
      let classification: HolderRecord["classification"] = "wallet";

      if (isBurnAddress(h.address, h.owner)) {
        classification = "burn";
      } else if (isPoolOrInsider(h, knownPoolAddresses)) {
        classification = "pool";
      }

      return {
        address: h.address || "",
        owner: h.owner,
        rawBalance: String(h.amount ?? "0"),
        uiBalance: typeof h.uiAmount === "number" ? h.uiAmount : parseFloat(String(h.amount ?? "0")) || 0,
        percentage: typeof h.pct === "number" ? h.pct : 0,
        isInsider: Boolean(h.insider),
        classification,
      };
    });

    // 2. Extract LP locked info from markets array
    let maxLpLockedPct = 0;
    let maxLpLockedUsd = 0;

    if (Array.isArray(data.markets)) {
      for (const m of data.markets) {
        if (m.lp) {
          const lockedPct = m.lp.lpLockedPct ?? m.lp.pct ?? m.lp.burnPct ?? 0;
          const lockedUsd = m.lp.lpLockedUSD ?? m.lp.usd ?? 0;

          if (lockedPct > maxLpLockedPct) {
            maxLpLockedPct = lockedPct;
          }
          if (lockedUsd > maxLpLockedUsd) {
            maxLpLockedUsd = lockedUsd;
          }
        }
      }
    }

    // 3. Extract tokenMeta
    let tokenMeta: RugCheckResult["tokenMeta"] = undefined;
    if (data.tokenMeta) {
      tokenMeta = {
        name: data.tokenMeta.name,
        symbol: data.tokenMeta.symbol,
        uri: data.tokenMeta.uri,
        mutable: data.tokenMeta.mutable,
        updateAuthority: data.tokenMeta.updateAuthority ?? null,
      };
    }

    return {
      topHolders,
      lpLockedPct: Math.min(100, Math.max(0, maxLpLockedPct)),
      lpLockedUsd: Math.max(0, maxLpLockedUsd),
      tokenMeta,
      risks: data.risks,
      rugScore: data.score,
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.warn(`[rugCheck] Error fetching report for ${mintAddress}: ${err.message}`);
    return emptyResult;
  }
}
