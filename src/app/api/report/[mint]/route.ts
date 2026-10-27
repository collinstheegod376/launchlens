import { NextRequest, NextResponse } from "next/server";
import { generateTokenReport } from "@/core/orchestrator";
import { isValidSolanaAddress } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { mint: string } }
) {
  try {
    const mint = params.mint;

    if (!mint || !isValidSolanaAddress(mint)) {
      return NextResponse.json(
        {
          error: "Invalid Solana mint address",
          message: "A valid base58 Solana public key between 32 and 44 characters is required.",
          mint,
        },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const forceFresh =
      searchParams.get("forceFresh") === "true" ||
      searchParams.get("fresh") === "1" ||
      searchParams.get("refresh") === "true";

    const report = await generateTokenReport(mint, forceFresh);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (forceFresh) {
      headers["Cache-Control"] = "no-store, max-age=0";
    } else {
      headers["Cache-Control"] = "public, s-maxage=60, stale-while-revalidate=300";
    }

    return NextResponse.json(report, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error("API error generating token report:", error);
    return NextResponse.json(
      {
        error: "Failed to generate token report",
        message: error?.message || "Internal server error occurred while analyzing token.",
      },
      { status: 500 }
    );
  }
}
