import { GoogleGenerativeAI } from "@google/generative-ai";
import { RiskFinding, RiskScorecard, TokenOverview } from "../types/token";

export interface ExplainerInput {
  token: TokenOverview;
  scorecard: RiskScorecard;
  findings: RiskFinding[];
  top10ConcentrationPct: number;
  top20ConcentrationPct: number;
  burnedSupplyPct: number;
  circulatingSupplyFormatted: number;
  totalLiquidityUsd: number;
  totalVolume24h: number;
  lpLockedPct: number;
}

export interface AiSummaryResult {
  narrative: string;
  keyTakeaways: string[];
  uncertainties: string[];
  generatedBy: "gemini" | "groq" | "deterministic-fallback";
}

/**
 * Builds factual context object passed to LLMs.
 */
function buildFactualContext(input: ExplainerInput) {
  return {
    token: {
      mint: input.token.mint,
      name: input.token.name,
      symbol: input.token.symbol,
      tokenProgram: input.token.tokenProgram,
      decimals: input.token.decimals,
      authorities: input.token.authorities,
      extensions: input.token.extensions,
    },
    metrics: {
      top10ConcentrationPct: input.top10ConcentrationPct,
      top20ConcentrationPct: input.top20ConcentrationPct,
      burnedSupplyPct: input.burnedSupplyPct,
      circulatingSupplyFormatted: input.circulatingSupplyFormatted,
      totalLiquidityUsd: input.totalLiquidityUsd,
      totalVolume24h: input.totalVolume24h,
      lpLockedPct: input.lpLockedPct,
    },
    scorecard: input.scorecard,
    findings: input.findings.map((f) => ({
      ruleId: f.ruleId,
      title: f.title,
      severity: f.severity,
      evidence: f.evidence,
    })),
  };
}

const ANALYST_PROMPT_INSTRUCTIONS = `
You are LaunchLens AI, an objective on-chain Solana risk analyst.
Evaluate the factual metrics provided below.

STRICT RULES:
1. Ground your response STRICTLY in the provided facts.
2. ZERO hallucinations or assumptions.
3. NEVER make price predictions, trading recommendations, or financial advice.
4. NEVER declare a token definitely safe or definitely a scam; state the factual risk factors and structural evidence objectively.
5. Return ONLY a valid JSON object matching this schema:
{
  "narrative": "A 2-paragraph objective factual summary of the token's risk posture, authorities, liquidity, and holder distribution.",
  "keyTakeaways": ["string bullet 1", "string bullet 2", "string bullet 3", "string bullet 4"],
  "uncertainties": ["string uncertainty 1", "string uncertainty 2"]
}
`;

/**
 * Builds a deterministic, rules-based summary when no AI API key is configured or when APIs fail.
 */
export function generateDeterministicSummary(input: ExplainerInput): AiSummaryResult {
  const {
    token,
    scorecard,
    findings,
    top10ConcentrationPct,
    burnedSupplyPct,
    circulatingSupplyFormatted,
    totalLiquidityUsd,
    totalVolume24h,
    lpLockedPct,
  } = input;

  const keyTakeaways: string[] = [];
  const uncertainties: string[] = [];

  // Key Takeaways derivation
  if (token.authorities.isMintRevoked) {
    keyTakeaways.push("Mint authority is permanently revoked (no further token creation possible).");
  } else {
    keyTakeaways.push("CRITICAL: Mint authority is active; additional supply can be minted at any time.");
  }

  if (token.authorities.isFreezeRevoked) {
    keyTakeaways.push("Freeze authority is revoked (wallet token balances cannot be frozen by authority).");
  } else {
    keyTakeaways.push("HIGH: Freeze authority is active; accounts could potentially be frozen.");
  }

  keyTakeaways.push(
    `Top 10 non-burn holders hold ${top10ConcentrationPct}% of circulating supply.`
  );

  if (totalLiquidityUsd > 0) {
    keyTakeaways.push(
      `DEX liquidity stands at $${totalLiquidityUsd.toLocaleString()} (24h volume: $${totalVolume24h.toLocaleString()}) with ${lpLockedPct}% LP locked/burned.`
    );
  } else {
    keyTakeaways.push("No active DEX liquidity pools detected for this token.");
  }

  if (token.extensions && token.extensions.length > 0) {
    keyTakeaways.push(`Token-2022 extensions enabled: ${token.extensions.join(", ")}.`);
  }

  // Uncertainties
  uncertainties.push(
    "On-chain analysis cannot determine off-chain team coordination, sybil wallet clustering, or social engineering risks."
  );
  uncertainties.push(
    "LP lock reliability is subject to the security and unlock parameters of third-party vesting lockers."
  );
  if (totalLiquidityUsd < 10000) {
    uncertainties.push(
      "Thin liquidity may experience severe slippage and abrupt price volatility on small trades."
    );
  }

  // Narrative generation
  const paragraphs: string[] = [];

  paragraphs.push(
    `${token.name || "Token"} ($${token.symbol || "UNKNOWN"}) has an overall risk rating of ${scorecard.overallLevel} with a risk score of ${scorecard.score}/100. The token has ${circulatingSupplyFormatted.toLocaleString()} circulating tokens after accounting for ${burnedSupplyPct}% burned supply.`
  );

  if (findings.length > 0) {
    const criticalOrHigh = findings.filter((f) => f.severity === "CRITICAL" || f.severity === "HIGH");
    if (criticalOrHigh.length > 0) {
      const titles = criticalOrHigh.map((f) => f.title).join(", ");
      paragraphs.push(
        `Critical or high-priority findings detected during analysis include: ${titles}. Buyers should exercise extreme caution as these factors significantly increase rug pull and capital loss hazards.`
      );
    } else {
      paragraphs.push(
        `No critical or high severity risks were flagged. Noted observations include ${findings.map((f) => f.title).join(", ")}.`
      );
    }
  } else {
    paragraphs.push(
      "The token passes initial automated checks with clean authorities and no immediate structural vulnerabilities flagged in the standard rule set."
    );
  }

  return {
    narrative: paragraphs.join("\n\n"),
    keyTakeaways,
    uncertainties,
    generatedBy: "deterministic-fallback",
  };
}

/**
 * Generates an AI summary via Groq (ultra-fast, free tier with Llama 3.3 70B).
 */
async function generateGroqSummary(input: ExplainerInput, apiKey: string): Promise<AiSummaryResult> {
  const factualContext = buildFactualContext(input);
  const prompt = `${ANALYST_PROMPT_INSTRUCTIONS}\n\nFACTS:\n${JSON.stringify(factualContext, null, 2)}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are LaunchLens AI, an objective on-chain Solana risk analyst. Output only valid JSON.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[explainer] Groq API returned error status ${res.status}:`, errText);
      return generateDeterministicSummary(input);
    }

    const json = await res.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content) {
      return generateDeterministicSummary(input);
    }

    const parsed = JSON.parse(content);
    if (
      typeof parsed.narrative === "string" &&
      Array.isArray(parsed.keyTakeaways) &&
      Array.isArray(parsed.uncertainties)
    ) {
      return {
        narrative: parsed.narrative,
        keyTakeaways: parsed.keyTakeaways,
        uncertainties: parsed.uncertainties,
        generatedBy: "groq",
      };
    }

    return generateDeterministicSummary(input);
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn("[explainer] Groq API failed, falling back to deterministic template:", err);
    return generateDeterministicSummary(input);
  }
}

/**
 * Generates an AI summary via Google Gemini (gemini-1.5-flash).
 */
async function generateGeminiSummary(input: ExplainerInput, apiKey: string): Promise<AiSummaryResult> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });

    const factualContext = buildFactualContext(input);
    const prompt = `${ANALYST_PROMPT_INSTRUCTIONS}\n\nFACTS:\n${JSON.stringify(factualContext, null, 2)}`;

    const response = await model.generateContent(prompt);
    const text = response.response.text();

    if (!text) {
      return generateDeterministicSummary(input);
    }

    let cleaned = text.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.replace(/^```json/, "").replace(/```$/, "").trim();
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```/, "").replace(/```$/, "").trim();
    }

    const parsed = JSON.parse(cleaned);
    if (
      typeof parsed.narrative === "string" &&
      Array.isArray(parsed.keyTakeaways) &&
      Array.isArray(parsed.uncertainties)
    ) {
      return {
        narrative: parsed.narrative,
        keyTakeaways: parsed.keyTakeaways,
        uncertainties: parsed.uncertainties,
        generatedBy: "gemini",
      };
    }

    return generateDeterministicSummary(input);
  } catch (error) {
    console.warn("[explainer] Gemini API error, falling back to deterministic template:", error);
    return generateDeterministicSummary(input);
  }
}

/**
 * Unified AI summary entrypoint:
 * 1. Checks GROQ_API_KEY (fastest, free tier with Llama 3.3 70B)
 * 2. Checks GEMINI_API_KEY (Google Gemini 1.5 Flash)
 * 3. Falls back gracefully to deterministic rules engine.
 */
export async function generateAiSummary(input: ExplainerInput): Promise<AiSummaryResult> {
  const groqApiKey = process.env.GROQ_API_KEY?.trim();
  if (groqApiKey) {
    return generateGroqSummary(input, groqApiKey);
  }

  const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
  if (geminiApiKey) {
    return generateGeminiSummary(input, geminiApiKey);
  }

  return generateDeterministicSummary(input);
}
