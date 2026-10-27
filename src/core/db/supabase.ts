import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { TokenReport } from "../types/token";

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  try {
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
      },
    });
    return supabaseClient;
  } catch (error) {
    console.warn("[supabase] Failed to initialize Supabase client:", error);
    return null;
  }
}

/**
 * Saves a generated TokenReport to Supabase if configured.
 * Gracefully skips if credentials are not set or if an error occurs.
 */
export async function saveReportToDatabase(report: TokenReport): Promise<void> {
  const client = getSupabaseClient();
  if (!client) {
    // Graceful skip - no credentials configured
    return;
  }

  try {
    const mint = report.token.mint;

    // 1. Upsert token record
    const { error: tokenError } = await client.from("tokens").upsert(
      {
        mint,
        name: report.token.name,
        symbol: report.token.symbol,
        decimals: report.token.decimals,
        token_program: report.token.tokenProgram,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "mint" }
    );

    if (tokenError) {
      console.warn(`[supabase] Error upserting token ${mint}:`, tokenError.message);
      return;
    }

    // 2. Insert report record
    const { data: reportRecord, error: reportError } = await client
      .from("reports")
      .insert({
        mint,
        risk_score: report.risk.scorecard.score,
        risk_level: report.risk.scorecard.overallLevel,
        ai_summary: report.aiSummary,
        provenance: report.provenance,
      })
      .select("id")
      .single();

    if (reportError || !reportRecord) {
      console.warn(`[supabase] Error inserting report for ${mint}:`, reportError?.message);
      return;
    }

    const reportId = reportRecord.id;

    // 3. Insert snapshot record
    const { error: snapshotError } = await client.from("snapshots").insert({
      report_id: reportId,
      mint,
      total_supply: report.token.supplyFormatted,
      circulating_supply: report.holders.circulatingSupplyFormatted,
      burned_supply_pct: report.holders.burnedSupplyPct,
      top10_concentration_pct: report.holders.top10ConcentrationPct,
      top20_concentration_pct: report.holders.top20ConcentrationPct,
      total_liquidity_usd: report.liquidity.totalLiquidityUsd,
      total_volume_24h: report.liquidity.totalVolume24h,
      highest_pool_address: report.liquidity.highestLiquidityPool?.poolAddress || null,
      raw_data: {
        scorecard: report.risk.scorecard,
        liquidityPoolsCount: report.liquidity.pools.length,
      },
    });

    if (snapshotError) {
      console.warn(`[supabase] Error inserting snapshot for ${mint}:`, snapshotError.message);
    }

    // 4. Insert findings
    if (report.risk.findings.length > 0) {
      const findingsToInsert = report.risk.findings.map((f) => ({
        report_id: reportId,
        mint,
        rule_id: f.ruleId,
        title: f.title,
        severity: f.severity,
        description: f.description,
        evidence: f.evidence,
      }));

      const { error: findingsError } = await client.from("findings").insert(findingsToInsert);
      if (findingsError) {
        console.warn(`[supabase] Error inserting findings for ${mint}:`, findingsError.message);
      }
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.warn(`[supabase] Unexpected error persisting report for ${report.token.mint}: ${err.message}`);
  }
}
