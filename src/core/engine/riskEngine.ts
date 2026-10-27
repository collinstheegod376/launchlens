import {
  RiskFinding,
  RiskScorecard,
  RiskSeverity,
  TokenOverview,
  HolderRecord,
  PoolRecord,
} from "../types/token";

export interface RiskEvaluationInput {
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
    pools: PoolRecord[];
    highestLiquidityPool?: PoolRecord;
  };
  lpLockedPct: number;
}

export interface RiskEvaluationResult {
  scorecard: RiskScorecard;
  findings: RiskFinding[];
}

export function evaluateRisk(input: RiskEvaluationInput): RiskEvaluationResult {
  const { token, holders, liquidity, lpLockedPct } = input;
  const findings: RiskFinding[] = [];

  let authoritiesScore = 0;
  let holdersScore = 0;
  let liquidityScore = 0;
  let codeScore = 0;

  // 1. RULE_MINT_AUTH_ACTIVE
  if (!token.authorities.isMintRevoked && token.authorities.mintAuthority) {
    authoritiesScore += 50;
    findings.push({
      ruleId: "RULE_MINT_AUTH_ACTIVE",
      title: "Mint Authority Active",
      severity: "CRITICAL",
      description:
        "The mint authority is not revoked. The token creator can mint unlimited new tokens at any time, which can instantly dilute holders or crash the price.",
      evidence: `Mint authority is set to ${token.authorities.mintAuthority}`,
      confidence: "HIGH",
    });
  }

  // 2. RULE_FREEZE_AUTH_ACTIVE
  if (!token.authorities.isFreezeRevoked && token.authorities.freezeAuthority) {
    authoritiesScore += 35;
    findings.push({
      ruleId: "RULE_FREEZE_AUTH_ACTIVE",
      title: "Freeze Authority Active",
      severity: "HIGH",
      description:
        "The freeze authority is active. The authority can freeze token accounts at will, preventing holders from transferring or trading their tokens (honeypot risk).",
      evidence: `Freeze authority is set to ${token.authorities.freezeAuthority}`,
      confidence: "HIGH",
    });
  }

  // 3. RULE_MUTABLE_METADATA
  if (token.authorities.isMutable) {
    authoritiesScore += 15;
    findings.push({
      ruleId: "RULE_MUTABLE_METADATA",
      title: "Mutable Token Metadata",
      severity: "LOW",
      description:
        "The token metadata update authority is active. The creator or authority can alter token name, symbol, logo, or website at any time.",
      evidence: token.authorities.updateAuthority
        ? `Update authority is set to ${token.authorities.updateAuthority}`
        : "Metadata is marked as mutable",
      confidence: "HIGH",
    });
  }

  authoritiesScore = Math.min(100, authoritiesScore);

  // 4. RULE_EXTREME_CONCENTRATION
  if (holders.top10ConcentrationPct > 80) {
    holdersScore += 80;
    findings.push({
      ruleId: "RULE_EXTREME_CONCENTRATION",
      title: "Extreme Holder Concentration (>80%)",
      severity: "CRITICAL",
      description:
        "The top 10 non-burn holders control more than 80% of the circulating token supply. A coordinated or single-wallet dump could cause catastrophic loss.",
      evidence: `Top 10 non-burn wallets control ${holders.top10ConcentrationPct}% of supply.`,
      confidence: "HIGH",
    });
  } else if (holders.top10ConcentrationPct > 50) {
    holdersScore += 50;
    findings.push({
      ruleId: "RULE_EXTREME_CONCENTRATION",
      title: "High Holder Concentration (>50%)",
      severity: "HIGH",
      description:
        "The top 10 non-burn holders control over 50% of the circulating token supply, presenting substantial sell pressure and dump risk.",
      evidence: `Top 10 non-burn wallets control ${holders.top10ConcentrationPct}% of supply.`,
      confidence: "HIGH",
    });
  } else if (holders.top10ConcentrationPct > 30) {
    holdersScore += 25;
  }

  if (holders.top20ConcentrationPct > 90) {
    holdersScore += 15;
  }

  holdersScore = Math.min(100, holdersScore);

  // 5. RULE_LOW_LIQUIDITY
  if (liquidity.totalLiquidityUsd < 5000) {
    liquidityScore += 60;
    findings.push({
      ruleId: "RULE_LOW_LIQUIDITY",
      title: "Critically Low Liquidity (<$5,000)",
      severity: "HIGH",
      description:
        "Total liquidity across all detected trading pairs is below $5,000. Low liquidity causes massive price slippage and makes exiting positions extremely difficult.",
      evidence: `Total detected liquidity is $${liquidity.totalLiquidityUsd.toLocaleString()}`,
      confidence: "HIGH",
    });
  } else if (liquidity.totalLiquidityUsd < 25000) {
    liquidityScore += 30;
    findings.push({
      ruleId: "RULE_LOW_LIQUIDITY",
      title: "Moderate Liquidity (<$25,000)",
      severity: "MEDIUM",
      description:
        "Total liquidity across all detected pools is below $25,000. Moderate trades may experience noticeable slippage.",
      evidence: `Total detected liquidity is $${liquidity.totalLiquidityUsd.toLocaleString()}`,
      confidence: "HIGH",
    });
  }

  // 6. RULE_LP_UNLOCKED
  // Only evaluate if pools exist or if liquidity is present
  if (liquidity.pools.length > 0 && lpLockedPct < 80) {
    liquidityScore += 40;
    findings.push({
      ruleId: "RULE_LP_UNLOCKED",
      title: "Liquidity Pool Unlocked or Inadequately Locked (<80%)",
      severity: "HIGH",
      description:
        "Less than 80% of the primary pool LP tokens are verified locked or burned. The LP creator can pull liquidity at any moment, crashing the market price to zero.",
      evidence: `Verified LP locked or burned is ${lpLockedPct}%.`,
      confidence: "MEDIUM",
    });
  }

  liquidityScore = Math.min(100, liquidityScore);

  // 7. RULE_TOKEN2022_EXTENSIONS
  const extensions = token.extensions || [];
  const extLower = extensions.map((e) => e.toLowerCase());

  const hasNonTransferable = extLower.some((e) => e.includes("nontransferable"));
  const hasTransferFee = extLower.some(
    (e) => e.includes("transferfee") || e.includes("fee")
  );
  const hasTransferHook = extLower.some((e) => e.includes("transferhook") || e.includes("hook"));
  const hasPermanentDelegate = extLower.some(
    (e) => e.includes("permanentdelegate") || e.includes("delegate")
  );

  if (hasNonTransferable) {
    codeScore = 100;
    findings.push({
      ruleId: "RULE_TOKEN2022_EXTENSIONS",
      title: "Token-2022 Non-Transferable Extension",
      severity: "CRITICAL",
      description:
        "The token mint enforces the NonTransferable extension. Tokens cannot be transferred between accounts once received, rendering them untradable.",
      evidence: "Extension: NonTransferable detected in mint account",
      confidence: "HIGH",
    });
  } else if (hasTransferFee || hasTransferHook || hasPermanentDelegate) {
    codeScore = 65;
    const detected: string[] = [];
    if (hasTransferFee) detected.push("TransferFeeConfig");
    if (hasTransferHook) detected.push("TransferHook");
    if (hasPermanentDelegate) detected.push("PermanentDelegate");

    findings.push({
      ruleId: "RULE_TOKEN2022_EXTENSIONS",
      title: "Token-2022 Restrictive Extension Detected",
      severity: "HIGH",
      description:
        "The token mint uses advanced Token-2022 extensions that can assess transfer taxes, intercept transactions via hooks, or confiscate tokens via permanent delegates.",
      evidence: `Detected extensions: ${detected.join(", ")}`,
      confidence: "HIGH",
    });
  }

  codeScore = Math.min(100, codeScore);

  // Calculate severity counts
  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;
  let infoCount = 0;

  for (const f of findings) {
    if (f.severity === "CRITICAL") criticalCount++;
    else if (f.severity === "HIGH") highCount++;
    else if (f.severity === "MEDIUM") mediumCount++;
    else if (f.severity === "LOW") lowCount++;
    else if (f.severity === "INFO") infoCount++;
  }

  // Calculate composite score (0-100)
  let calculatedScore = Math.round(
    authoritiesScore * 0.35 +
      holdersScore * 0.25 +
      liquidityScore * 0.25 +
      codeScore * 0.15
  );

  // Apply critical and high minimum floors
  if (criticalCount > 0) {
    calculatedScore = Math.max(calculatedScore, 85);
  } else if (highCount > 1) {
    calculatedScore = Math.max(calculatedScore, 65);
  } else if (highCount > 0) {
    calculatedScore = Math.max(calculatedScore, 50);
  } else if (mediumCount > 0) {
    calculatedScore = Math.max(calculatedScore, 25);
  }

  const finalScore = Math.min(100, Math.max(0, calculatedScore));

  // Determine overall severity level
  let overallLevel: RiskSeverity = "LOW";
  if (criticalCount > 0 || finalScore >= 80) {
    overallLevel = "CRITICAL";
  } else if (highCount > 0 || finalScore >= 50) {
    overallLevel = "HIGH";
  } else if (mediumCount > 0 || finalScore >= 25) {
    overallLevel = "MEDIUM";
  } else if (finalScore >= 10 || lowCount > 0) {
    overallLevel = "LOW";
  } else {
    overallLevel = "LOW";
  }

  function getStatus(score: number): string {
    if (score >= 60) return "DANGER";
    if (score >= 25) return "WARNING";
    return "SAFE";
  }

  const scorecard: RiskScorecard = {
    overallLevel,
    score: finalScore,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    infoCount,
    breakdown: {
      authorities: {
        score: authoritiesScore,
        status: getStatus(authoritiesScore),
      },
      holders: {
        score: holdersScore,
        status: getStatus(holdersScore),
      },
      liquidity: {
        score: liquidityScore,
        status: getStatus(liquidityScore),
      },
      codeOrExtensions: {
        score: codeScore,
        status: getStatus(codeScore),
      },
    },
  };

  return {
    scorecard,
    findings,
  };
}
