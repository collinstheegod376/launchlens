export type RiskSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";

export interface RiskFinding {
  ruleId: string;
  title: string;
  severity: RiskSeverity;
  description: string;
  evidence: string;
  limitations?: string;
  confidence?: "HIGH" | "MEDIUM" | "LOW";
}

export interface TokenAuthorityInfo {
  mintAuthority: string | null;
  freezeAuthority: string | null;
  isMintRevoked: boolean;
  isFreezeRevoked: boolean;
  isMutable: boolean;
  updateAuthority: string | null;
}

export interface TokenOverview {
  mint: string;
  name: string;
  symbol: string;
  decimals: number;
  supplyRaw: string;
  supplyFormatted: number;
  tokenProgram: "spl-token" | "spl-token-2022" | string;
  authorities: TokenAuthorityInfo;
  metadataUri?: string;
  createdAt?: string;
  extensions?: string[];
}

export interface HolderRecord {
  address: string;
  owner?: string;
  rawBalance: string;
  uiBalance: number;
  percentage: number;
  isInsider?: boolean;
  classification: "wallet" | "pool" | "burn" | "program" | "unknown";
}

export interface PoolRecord {
  dexId: string;
  poolAddress: string;
  baseToken: {
    address: string;
    symbol: string;
    name?: string;
  };
  quoteToken: {
    address: string;
    symbol: string;
    name?: string;
  };
  priceUsd: number;
  liquidityUsd: number;
  volume24h: number;
  fdv: number;
  pairCreatedAt?: number;
  url: string;
  lpLockedPct?: number;
  lpLockedUsd?: number;
}

export interface RiskScorecard {
  overallLevel: RiskSeverity;
  score: number; // 0 (safest) to 100 (riskiest)
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  infoCount: number;
  breakdown: {
    authorities: { score: number; status: string };
    holders: { score: number; status: string };
    liquidity: { score: number; status: string };
    codeOrExtensions: { score: number; status: string };
  };
}

export interface TokenReport {
  token: TokenOverview;
  holders: {
    topHolders: HolderRecord[];
    top10ConcentrationPct: number;
    top20ConcentrationPct: number;
    burnedSupplyPct: number;
    circulatingSupplyFormatted: number;
  };
  liquidity: {
    totalLiquidityUsd: number;
    totalVolume24h: number;
    highestLiquidityPool?: PoolRecord;
    pools: PoolRecord[];
  };
  risk: {
    scorecard: RiskScorecard;
    findings: RiskFinding[];
  };
  aiSummary: {
    narrative: string;
    keyTakeaways: string[];
    uncertainties: string[];
    generatedBy: "gemini" | "groq" | "deterministic-fallback";
  };
  provenance: {
    generatedAt: string;
    dataFreshness: {
      solanaRpc: string;
      dexScreener: string;
      rugCheck: string;
    };
    limitations: string[];
  };
}
