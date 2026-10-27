import { describe, it, expect } from "vitest";
import { evaluateRisk, RiskEvaluationInput } from "../src/core/engine/riskEngine";
import { TokenOverview } from "../src/core/types/token";

describe("riskEngine", () => {
  const createBaseInput = (overrides?: Partial<RiskEvaluationInput>): RiskEvaluationInput => {
    const defaultToken: TokenOverview = {
      mint: "So11111111111111111111111111111111111111112",
      name: "Test Token",
      symbol: "TEST",
      decimals: 9,
      supplyRaw: "1000000000000000",
      supplyFormatted: 1_000_000,
      tokenProgram: "spl-token",
      authorities: {
        mintAuthority: null,
        freezeAuthority: null,
        isMintRevoked: true,
        isFreezeRevoked: true,
        isMutable: false,
        updateAuthority: null,
      },
      extensions: [],
    };

    return {
      token: defaultToken,
      holders: {
        topHolders: [],
        top10ConcentrationPct: 20,
        top20ConcentrationPct: 35,
        burnedSupplyPct: 0,
        circulatingSupplyFormatted: 1_000_000,
      },
      liquidity: {
        totalLiquidityUsd: 100_000,
        totalVolume24h: 50_000,
        pools: [
          {
            dexId: "raydium",
            poolAddress: "pool1",
            baseToken: { address: "mint", symbol: "TEST" },
            quoteToken: { address: "sol", symbol: "SOL" },
            priceUsd: 1.0,
            liquidityUsd: 100_000,
            volume24h: 50_000,
            fdv: 1_000_000,
            url: "https://dexscreener.com/solana/pool1",
          },
        ],
      },
      lpLockedPct: 100,
      ...overrides,
    };
  };

  it("evaluates a safe token with low risk score and LOW severity", () => {
    const input = createBaseInput();
    const result = evaluateRisk(input);

    expect(result.scorecard.overallLevel).toBe("LOW");
    expect(result.scorecard.criticalCount).toBe(0);
    expect(result.scorecard.highCount).toBe(0);
    expect(result.scorecard.score).toBe(0);
    expect(result.findings.length).toBe(0);
    expect(result.scorecard.breakdown.authorities.status).toBe("SAFE");
  });

  it("RULE_MINT_AUTH_ACTIVE: triggers CRITICAL finding when mint authority is active", () => {
    const input = createBaseInput({
      token: {
        ...createBaseInput().token,
        authorities: {
          mintAuthority: "DevWallet111111111111111111111111111111111",
          freezeAuthority: null,
          isMintRevoked: false,
          isFreezeRevoked: true,
          isMutable: false,
          updateAuthority: null,
        },
      },
    });

    const result = evaluateRisk(input);
    expect(result.scorecard.criticalCount).toBeGreaterThanOrEqual(1);
    expect(result.scorecard.overallLevel).toBe("CRITICAL");
    expect(result.scorecard.score).toBeGreaterThanOrEqual(85);

    const mintFinding = result.findings.find((f) => f.ruleId === "RULE_MINT_AUTH_ACTIVE");
    expect(mintFinding).toBeDefined();
    expect(mintFinding?.severity).toBe("CRITICAL");
  });

  it("RULE_FREEZE_AUTH_ACTIVE: triggers HIGH finding when freeze authority is active", () => {
    const input = createBaseInput({
      token: {
        ...createBaseInput().token,
        authorities: {
          mintAuthority: null,
          freezeAuthority: "FreezeWallet11111111111111111111111111111",
          isMintRevoked: true,
          isFreezeRevoked: false,
          isMutable: false,
          updateAuthority: null,
        },
      },
    });

    const result = evaluateRisk(input);
    expect(result.scorecard.highCount).toBeGreaterThanOrEqual(1);
    expect(result.scorecard.overallLevel).toBe("HIGH");

    const freezeFinding = result.findings.find((f) => f.ruleId === "RULE_FREEZE_AUTH_ACTIVE");
    expect(freezeFinding).toBeDefined();
    expect(freezeFinding?.severity).toBe("HIGH");
  });

  it("RULE_EXTREME_CONCENTRATION: triggers CRITICAL when >80% and HIGH when >50%", () => {
    // Test > 80%
    const criticalInput = createBaseInput({
      holders: {
        topHolders: [],
        top10ConcentrationPct: 85.5,
        top20ConcentrationPct: 92.0,
        burnedSupplyPct: 0,
        circulatingSupplyFormatted: 1_000_000,
      },
    });
    const critResult = evaluateRisk(criticalInput);
    expect(critResult.scorecard.overallLevel).toBe("CRITICAL");
    const critFinding = critResult.findings.find((f) => f.ruleId === "RULE_EXTREME_CONCENTRATION");
    expect(critFinding?.severity).toBe("CRITICAL");

    // Test > 50% <= 80%
    const highInput = createBaseInput({
      holders: {
        topHolders: [],
        top10ConcentrationPct: 62.0,
        top20ConcentrationPct: 75.0,
        burnedSupplyPct: 0,
        circulatingSupplyFormatted: 1_000_000,
      },
    });
    const highResult = evaluateRisk(highInput);
    expect(highResult.scorecard.overallLevel).toBe("HIGH");
    const highFinding = highResult.findings.find((f) => f.ruleId === "RULE_EXTREME_CONCENTRATION");
    expect(highFinding?.severity).toBe("HIGH");
  });

  it("RULE_LOW_LIQUIDITY: triggers HIGH for <$5k and MEDIUM for <$25k", () => {
    // Under $5,000
    const highLiqInput = createBaseInput({
      liquidity: {
        totalLiquidityUsd: 3_200,
        totalVolume24h: 1_000,
        pools: [],
      },
    });
    const highLiqResult = evaluateRisk(highLiqInput);
    const highLiqFinding = highLiqResult.findings.find((f) => f.ruleId === "RULE_LOW_LIQUIDITY");
    expect(highLiqFinding?.severity).toBe("HIGH");

    // Between $5,000 and $25,000
    const medLiqInput = createBaseInput({
      liquidity: {
        totalLiquidityUsd: 18_000,
        totalVolume24h: 5_000,
        pools: [],
      },
    });
    const medLiqResult = evaluateRisk(medLiqInput);
    const medLiqFinding = medLiqResult.findings.find((f) => f.ruleId === "RULE_LOW_LIQUIDITY");
    expect(medLiqFinding?.severity).toBe("MEDIUM");
  });

  it("RULE_LP_UNLOCKED: triggers HIGH when pool exists and LP locked < 80%", () => {
    const input = createBaseInput({
      lpLockedPct: 25,
    });
    const result = evaluateRisk(input);
    const lpFinding = result.findings.find((f) => f.ruleId === "RULE_LP_UNLOCKED");
    expect(lpFinding).toBeDefined();
    expect(lpFinding?.severity).toBe("HIGH");
  });

  it("RULE_MUTABLE_METADATA: triggers LOW finding when metadata is mutable", () => {
    const input = createBaseInput({
      token: {
        ...createBaseInput().token,
        authorities: {
          mintAuthority: null,
          freezeAuthority: null,
          isMintRevoked: true,
          isFreezeRevoked: true,
          isMutable: true,
          updateAuthority: "CreatorAuthority1111111111111111111111111",
        },
      },
    });
    const result = evaluateRisk(input);
    const mutableFinding = result.findings.find((f) => f.ruleId === "RULE_MUTABLE_METADATA");
    expect(mutableFinding).toBeDefined();
    expect(mutableFinding?.severity).toBe("LOW");
  });

  it("RULE_TOKEN2022_EXTENSIONS: triggers CRITICAL for NonTransferable and HIGH for TransferFee", () => {
    // NonTransferable
    const nonTransInput = createBaseInput({
      token: {
        ...createBaseInput().token,
        tokenProgram: "spl-token-2022",
        extensions: ["NonTransferable"],
      },
    });
    const nonTransResult = evaluateRisk(nonTransInput);
    expect(nonTransResult.scorecard.overallLevel).toBe("CRITICAL");
    const nonTransFinding = nonTransResult.findings.find((f) => f.ruleId === "RULE_TOKEN2022_EXTENSIONS");
    expect(nonTransFinding?.severity).toBe("CRITICAL");

    // TransferFeeConfig
    const feeInput = createBaseInput({
      token: {
        ...createBaseInput().token,
        tokenProgram: "spl-token-2022",
        extensions: ["TransferFeeConfig"],
      },
    });
    const feeResult = evaluateRisk(feeInput);
    expect(feeResult.scorecard.overallLevel).toBe("HIGH");
    const feeFinding = feeResult.findings.find((f) => f.ruleId === "RULE_TOKEN2022_EXTENSIONS");
    expect(feeFinding?.severity).toBe("HIGH");
  });
});
