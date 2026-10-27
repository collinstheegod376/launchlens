"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertOctagon, RotateCcw, Home, Search } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Token Report Error:", error);
  }, [error]);

  return (
    <div className="w-full max-w-xl mx-auto py-16 text-center">
      <div className="rounded-3xl border border-lens-rose/30 bg-lens-850/80 p-8 sm:p-10 shadow-2xl backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-lens-rose/10 border border-lens-rose/30 text-lens-rose mb-6">
          <AlertOctagon className="h-7 w-7" />
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">Analysis Failed</h2>
        <p className="text-sm text-slate-300 mb-4 leading-relaxed">
          LaunchLens was unable to generate a report for this token address. The mint may not exist on Solana Mainnet or external indexers timed out.
        </p>

        {error.message && (
          <div className="mb-6 rounded-xl border border-lens-700/60 bg-lens-900/80 p-3 font-mono text-xs text-rose-300/90 text-left overflow-x-auto">
            <code>{error.message}</code>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-lens-accent px-5 py-2.5 text-sm font-bold text-lens-900 hover:brightness-110 transition-all shadow-md"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Retry Analysis</span>
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-lens-700 bg-lens-800/80 px-5 py-2.5 text-sm font-semibold text-slate-200 hover:border-slate-500 hover:text-white transition-all"
          >
            <Home className="h-4 w-4" />
            <span>Back to Search</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
