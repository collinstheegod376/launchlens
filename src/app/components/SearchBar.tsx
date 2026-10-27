"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, AlertCircle, ArrowRight, Sparkles } from "lucide-react";
import { isValidSolanaAddress } from "@/lib/utils";

interface SampleToken {
  name: string;
  symbol: string;
  mint: string;
  description: string;
}

const SAMPLE_TOKENS: SampleToken[] = [
  {
    name: "Jupiter",
    symbol: "JUP",
    mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
    description: "Leading DEX aggregator",
  },
  {
    name: "Bonk",
    symbol: "BONK",
    mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    description: "Community dog token",
  },
  {
    name: "dogwifhat",
    symbol: "WIF",
    mint: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
    description: "Organic meme coin",
  },
];

interface SearchBarProps {
  initialValue?: string;
  autoFocus?: boolean;
  className?: string;
}

export function SearchBar({ initialValue = "", autoFocus = false, className = "" }: SearchBarProps) {
  const router = useRouter();
  const [mintInput, setMintInput] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleScan = (targetMint: string) => {
    const trimmed = targetMint.trim();
    if (!trimmed) {
      setError("Please enter a Solana mint address");
      return;
    }

    if (!isValidSolanaAddress(trimmed)) {
      setError("Invalid Solana mint address: must be 32–44 base58 characters");
      return;
    }

    setError(null);
    startTransition(() => {
      router.push(`/report/${trimmed}`);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleScan(mintInput);
  };

  return (
    <div className={`w-full max-w-3xl mx-auto ${className}`}>
      {/* Search Input Container */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center rounded-2xl border border-lens-700/80 bg-lens-850/90 shadow-2xl backdrop-blur-xl transition-all focus-within:border-lens-accent focus-within:ring-2 focus-within:ring-lens-accent/20">
          <div className="pointer-events-none pl-4 text-slate-400">
            <Search className="h-4 w-4 sm:h-5 sm:w-5 text-lens-accent/80" />
          </div>

          <input
            type="text"
            value={mintInput}
            onChange={(e) => {
              setMintInput(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Paste Solana token mint address..."
            autoFocus={autoFocus}
            disabled={isPending}
            className="w-full bg-transparent px-2.5 sm:px-4 py-3.5 sm:py-4 text-xs sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none disabled:opacity-60 font-mono tracking-tight"
          />

          <div className="pr-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-1.5 sm:gap-2 rounded-xl bg-gradient-to-r from-lens-accent via-cyan-400 to-emerald-400 px-3.5 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-bold text-lens-900 shadow-md transition-all hover:brightness-110 active:scale-95 disabled:pointer-events-none disabled:opacity-70 shrink-0"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-lens-900" />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <span className="sm:hidden">Scan</span>
                  <span className="hidden sm:inline">Scan Token</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Validation Error Banner */}
        {error && (
          <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-lens-rose/30 bg-lens-rose/10 px-3.5 py-2 text-xs font-medium text-lens-rose animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </form>

      {/* Quick Sample Token Pills */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-xs font-medium text-slate-400 mr-1">
          <Sparkles className="h-3.5 w-3.5 text-lens-accent" />
          Quick Test:
        </span>
        {SAMPLE_TOKENS.map((token) => (
          <button
            key={token.symbol}
            type="button"
            onClick={() => {
              setMintInput(token.mint);
              handleScan(token.mint);
            }}
            disabled={isPending}
            className="group flex items-center gap-2 rounded-lg border border-lens-700/60 bg-lens-800/60 px-3 py-1.5 text-xs text-slate-300 transition-all hover:border-lens-accent/50 hover:bg-lens-700/50 hover:text-white disabled:opacity-50"
          >
            <span className="font-semibold text-lens-accent group-hover:text-cyan-300">
              ${token.symbol}
            </span>
            <span className="text-slate-500 font-mono text-[11px] hidden sm:inline">
              ({token.name})
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
export default SearchBar;
