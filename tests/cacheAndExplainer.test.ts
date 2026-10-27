import { describe, it, expect } from "vitest";
import { MemoryCache } from "../src/core/adapters/cache";
import { generateDeterministicSummary } from "../src/core/ai/explainer";
import { isValidSolanaAddress } from "../src/core/orchestrator";
import { TokenOverview, RiskScorecard, RiskFinding } from "../src/core/types/token";

describe("MemoryCache", () => {
  it("stores and retrieves cached items before expiration", () => {
    const cache = new MemoryCache(60);
    cache.set("foo", { val: 42 });
    expect(cache.has("foo")).toBe(true);
    expect(cache.get<{ val: number }>("foo")?.val).toBe(42);
  });

  it("returns null for non-existent keys", () => {
    const cache = new MemoryCache(60);
    expect(cache.get("non-existent")).toBeNull();
  });

  it("expires items after TTL", async () => {
    const cache = new MemoryCache(1); // 1 second TTL
    cache.set("quick", "hello", 0.05); // 50ms TTL

    await new Promise((r) => setTimeout(r, 80));
    expect(cache.get("quick")).toBeNull();
  });

  it("clears all cached items", () => {
    const cache = new MemoryCache(60);
    cache.set("a", 1);
    cache.set("b", 2);
    expect(cache.size()).toBe(2);
    cache.clear();
    expect(cache.size()).toBe(0);
    expect(cache.get("a")).toBeNull();
  });
});

describe("isValidSolanaAddress", () => {
  it("validates on-curve Solana base58 addresses", () => {
    // Valid standard mint: Wrapped SOL
    expect(isValidSolanaAddress("So11111111111111111111111111111111111111112")).toBe(true);
    // Invalid addresses
    expect(isValidSolanaAddress("invalid-address")).toBe(false);
    expect(isValidSolanaAddress("")).toBe(false);
    expect(isValidSolanaAddress("0x1234567890123456789012345678901234567890")).toBe(false);
  });
});

describe("generateDeterministicSummary", () => {
  it("creates a well-structured summary without AI API key", () => {
    const token: TokenOverview = {
      mint: "So11111111111111111111111111111111111111112",
      name: "Solana",
      symbol: "SOL",
      decimals: 9,
      supplyRaw: "500000000000000000",
      supplyFormatted: 500_000_000,
      tokenProgram: "spl-token",
      authorities: {
        mintAuthority: null,
        freezeAuthority: null,
        isMintRevoked: true,
        isFreezeRevoked: true,
        isMutable: false,
        updateAuthority: null,
      },
    };

    const scorecard: RiskScorecard = {
      overallLevel: "LOW",
      score: 5,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 1,
      infoCount: 0,
      breakdown: {
        authorities: { score: 0, status: "SAFE" },
        holders: { score: 10, status: "SAFE" },
        liquidity: { score: 5, status: "SAFE" },
        codeOrExtensions: { score: 0, status: "SAFE" },
      },
    };

    const findings: RiskFinding[] = [];

    const summary = generateDeterministicSummary({
      token,
      scorecard,
      findings,
      top10ConcentrationPct: 15.2,
      top20ConcentrationPct: 22.5,
      burnedSupplyPct: 5.0,
      circulatingSupplyFormatted: 475_000_000,
      totalLiquidityUsd: 500_000,
      totalVolume24h: 1_200_000,
      lpLockedPct: 98,
    });

    expect(summary.generatedBy).toBe("deterministic-fallback");
    expect(summary.narrative).toContain("Solana ($SOL)");
    expect(summary.narrative).toContain("LOW");
    expect(summary.keyTakeaways.length).toBeGreaterThan(0);
    expect(summary.uncertainties.length).toBeGreaterThan(0);
    expect(summary.keyTakeaways.some((k) => k.includes("Mint authority is permanently revoked"))).toBe(true);
  });
});
