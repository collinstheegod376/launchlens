import React from "react";
import { Loader2, Shield } from "lucide-react";

export default function Loading() {
  return (
    <div className="w-full max-w-6xl mx-auto py-8 animate-pulse space-y-8">
      {/* Top Breadcrumb & Status Skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-4 w-40 rounded bg-lens-700/50" />
        <div className="h-6 w-28 rounded-full bg-lens-700/50" />
      </div>

      {/* Header Skeleton */}
      <div className="rounded-2xl border border-lens-700/40 bg-lens-850/60 p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-lens-700/60" />
              <div className="space-y-1">
                <div className="h-6 w-48 rounded bg-lens-700/70" />
                <div className="h-4 w-24 rounded bg-lens-700/40" />
              </div>
            </div>
            <div className="h-4 w-72 rounded bg-lens-700/40" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-32 rounded-xl bg-lens-700/60" />
            <div className="h-10 w-24 rounded-xl bg-lens-700/60" />
          </div>
        </div>

        {/* AI Summary Card Skeleton */}
        <div className="rounded-xl border border-lens-700/50 bg-lens-800/40 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-lens-accent/30" />
            <div className="h-4 w-36 rounded bg-lens-700/50" />
          </div>
          <div className="h-4 w-full rounded bg-lens-700/40" />
          <div className="h-4 w-5/6 rounded bg-lens-700/40" />
          <div className="h-4 w-4/6 rounded bg-lens-700/40" />
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl border border-lens-700/40 bg-lens-800/30 p-3 space-y-2">
              <div className="h-3 w-16 rounded bg-lens-700/40" />
              <div className="h-5 w-20 rounded bg-lens-700/60" />
            </div>
          ))}
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="flex gap-2 border-b border-lens-700/40 pb-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-9 w-28 rounded-lg bg-lens-700/40" />
        ))}
      </div>

      {/* Content Area Skeleton */}
      <div className="rounded-2xl border border-lens-700/40 bg-lens-850/50 p-6 space-y-4">
        <div className="h-5 w-48 rounded bg-lens-700/60" />
        <div className="h-20 w-full rounded-xl bg-lens-700/30" />
        <div className="h-20 w-full rounded-xl bg-lens-700/30" />
      </div>

      {/* Centered scanning notification */}
      <div className="flex items-center justify-center gap-2 text-xs text-slate-400 pt-4">
        <Loader2 className="h-4 w-4 animate-spin text-lens-accent" />
        <span>Synthesizing Solana RPC ledger and DEX state...</span>
      </div>
    </div>
  );
}
