import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { generateTokenReport } from "@/core/orchestrator";
import { isValidSolanaAddress } from "@/lib/utils";
import { ReportViewer } from "./ReportViewer";
import { SearchBar } from "@/app/components/SearchBar";
import { ShieldAlert, ArrowLeft, AlertCircle } from "lucide-react";

interface PageProps {
  params: {
    mint: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const mint = params.mint;
  return {
    title: `${mint.slice(0, 6)}...${mint.slice(-4)} — LaunchLens Solana Token Report`,
    description: `Deterministic on-chain risk analysis, holder distribution, and liquidity audit for Solana token ${mint}.`,
  };
}

export default async function ReportPage({ params }: PageProps) {
  const mint = params.mint;

  // Validate address format before attempting fetch
  if (!mint || !isValidSolanaAddress(mint)) {
    return (
      <div className="w-full max-w-2xl mx-auto py-12 text-center space-y-6">
        <div className="rounded-3xl border border-lens-rose/30 bg-lens-850/80 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-lens-rose/10 border border-lens-rose/30 text-lens-rose mb-4">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Invalid Solana Mint Address</h2>
          <p className="text-sm text-slate-300 mb-6">
            The provided address <code className="font-mono text-lens-rose break-all">{mint}</code> is not a valid 32–44 character base58 Solana public key.
          </p>

          <SearchBar />

          <div className="pt-6">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Return to Home</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  try {
    const report = await generateTokenReport(mint);

    return (
      <div className="w-full space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <Link
            href="/"
            className="flex items-center gap-1.5 hover:text-lens-accent transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Search Another Token</span>
          </Link>
          <span className="font-mono text-slate-500">
            Chain: Solana Mainnet (ID: 101)
          </span>
        </div>

        {/* Interactive Report View */}
        <ReportViewer initialReport={report} mint={mint} />
      </div>
    );
  } catch (error: any) {
    console.error("Error generating report for mint:", mint, error);
    throw error; // Will be caught by error.tsx
  }
}
