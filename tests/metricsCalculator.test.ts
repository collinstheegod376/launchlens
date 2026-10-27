import { describe, it, expect } from "vitest";
import {
  calculateHolderMetrics,
  calculateLiquidityMetrics,
  roundTo,
} from "../src/core/engine/metricsCalculator";
import { HolderRecord, PoolRecord } from "../src/core/types/token";

describe("metricsCalculator", () => {
  describe("roundTo", () => {
    it("correctly rounds floating point numbers", () => {
      expect(roundTo(12.3456, 2)).toBe(12.35);
      expect(roundTo(12.3444, 2)).toBe(12.34);
      expect(roundTo(NaN)).toBe(0);
      expect(roundTo(Infinity)).toBe(0);
    });
  });

  describe("calculateHolderMetrics", () => {
    it("handles empty holders gracefully", () => {
      const result = calculateHolderMetrics([], 1_000_000);
      expect(result.top10ConcentrationPct).toBe(0);
      expect(result.top20ConcentrationPct).toBe(0);
      expect(result.burnedSupplyPct).toBe(0);
      expect(result.circulatingSupplyFormatted).toBe(1_000_000);
      expect(result.topHolders).toEqual([]);
    });

    it("calculates top 10 and top 20 non-burn concentration", () => {
      // 15 holders, 5% each
      const holders: HolderRecord[] = Array.from({ length: 15 }, (_, i) => ({
        address: `addr${i + 1}`,
        rawBalance: "50000",
        uiBalance: 50000,
        percentage: 5.0,
        classification: "wallet",
      }));

      const result = calculateHolderMetrics(holders, 1_000_000);
      // top 10 non-burn = 10 * 5% = 50%
      expect(result.top10ConcentrationPct).toBe(50.0);
      // top 20 non-burn = 15 * 5% = 75%
      expect(result.top20ConcentrationPct).toBe(75.0);
      expect(result.burnedSupplyPct).toBe(0);
      expect(result.circulatingSupplyFormatted).toBe(1_000_000);
    });

    it("excludes burn addresses from concentration and reduces circulating supply", () => {
      const holders: HolderRecord[] = [
        {
          address: "1nc1nerator11111111111111111111111111111111",
          rawBalance: "400000",
          uiBalance: 400000,
          percentage: 40.0,
          classification: "burn",
        },
        {
          address: "whale1",
          rawBalance: "200000",
          uiBalance: 200000,
          percentage: 20.0,
          classification: "wallet",
        },
        {
          address: "whale2",
          rawBalance: "150000",
          uiBalance: 150000,
          percentage: 15.0,
          classification: "wallet",
        },
        {
          address: "pool1",
          rawBalance: "100000",
          uiBalance: 100000,
          percentage: 10.0,
          classification: "pool",
        },
      ];

      const result = calculateHolderMetrics(holders, 1_000_000);

      expect(result.burnedSupplyPct).toBe(40.0);
      // Circulating = 1,000,000 * (100 - 40)% = 600,000
      expect(result.circulatingSupplyFormatted).toBe(600_000);
      // Top 10 non-burn = whale1 (20) + whale2 (15) + pool1 (10) = 45%
      expect(result.top10ConcentrationPct).toBe(45.0);
      expect(result.top20ConcentrationPct).toBe(45.0);
    });
  });

  describe("calculateLiquidityMetrics", () => {
    it("handles empty pools array", () => {
      const result = calculateLiquidityMetrics([]);
      expect(result.totalLiquidityUsd).toBe(0);
      expect(result.totalVolume24h).toBe(0);
      expect(result.highestLiquidityPool).toBeUndefined();
      expect(result.liquidityToFdvRatio).toBe(0);
    });

    it("aggregates multiple pools and identifies highest liquidity pool", () => {
      const pools: PoolRecord[] = [
        {
          dexId: "raydium",
          poolAddress: "poolA",
          baseToken: { address: "mint", symbol: "TKN" },
          quoteToken: { address: "sol", symbol: "SOL" },
          priceUsd: 1.5,
          liquidityUsd: 50_000,
          volume24h: 120_000,
          fdv: 1_500_000,
          url: "https://dexscreener.com/solana/poolA",
        },
        {
          dexId: "orca",
          poolAddress: "poolB",
          baseToken: { address: "mint", symbol: "TKN" },
          quoteToken: { address: "usdc", symbol: "USDC" },
          priceUsd: 1.5,
          liquidityUsd: 100_000,
          volume24h: 300_000,
          fdv: 1_500_000,
          url: "https://dexscreener.com/solana/poolB",
        },
      ];

      const result = calculateLiquidityMetrics(pools);

      expect(result.totalLiquidityUsd).toBe(150_000);
      expect(result.totalVolume24h).toBe(420_000);
      expect(result.highestLiquidityPool?.poolAddress).toBe("poolB");
      expect(result.primaryPriceUsd).toBe(1.5);
      // liquidityToFdvRatio = (150,000 / 1,500,000) * 100 = 10%
      expect(result.liquidityToFdvRatio).toBe(10.0);
    });
  });
});
