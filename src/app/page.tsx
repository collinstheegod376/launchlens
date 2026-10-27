import React from "react";
import Link from "next/link";
import { SearchBar } from "./components/SearchBar";
import {
  Send,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Droplets,
  BrainCircuit,
  Fingerprint,
  BarChart3,
  Layers,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  FileText,
  AlertTriangle,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full text-center py-8 sm:py-16 md:py-20 flex flex-col items-center">
                {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.18] sm:leading-[1.15]">
          Evidence-First Solana{" "}
          <span className="bg-gradient-to-r from-lens-accent via-cyan-300 to-lens-emerald bg-clip-text text-transparent">
            Token Transparency
          </span>{" "}
          Reports
        </h1>

        {/* Hero Subhead */}
        <p className="mt-4 sm:mt-6 text-sm sm:text-lg md:text-xl text-slate-300 max-w-2xl font-normal leading-relaxed px-2">
          Deterministic on-chain holder distribution, liquidity verification, authority status,
          and grounded AI summaries. Zero hype, zero speculation.
        </p>

        {/* Search Bar Component */}
        <div className="w-full mt-6 sm:mt-10">
          <SearchBar autoFocus />
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="w-full py-12 border-t border-lens-700/40">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Institutional Rigor. On-Chain Certainty.
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Four deterministic pillars that expose token vulnerabilities before you transact.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Feature 1: Holder Concentration */}
          <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
            <div className="h-10 w-10 rounded-xl bg-lens-accent/10 border border-lens-accent/30 flex items-center justify-center text-lens-accent mb-4 group-hover:scale-110 transition-transform">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Holder Concentration</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Calculates exact Top 10 and Top 20 supply distribution percentages, separates DEX pool vaults from individual wallets, and flags insider clusters.
            </p>
            <div className="mt-4 pt-3 border-t border-lens-700/40 flex items-center justify-between text-[11px] font-mono text-lens-accent">
              <span>Top 10 / 20 / Burn</span>
              <span>Exact %</span>
            </div>
          </div>

          {/* Feature 2: Authority Status */}
          <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
            <div className="h-10 w-10 rounded-xl bg-lens-emerald/10 border border-lens-emerald/30 flex items-center justify-center text-lens-emerald mb-4 group-hover:scale-110 transition-transform">
              <Lock className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Authority Status</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Direct cryptographic verification of Mint Authority, Freeze Authority, and Metaplex update authority status. Detects hidden admin backdoor privileges.
            </p>
            <div className="mt-4 pt-3 border-t border-lens-700/40 flex items-center justify-between text-[11px] font-mono text-lens-emerald">
              <span>Freeze / Mint Revocation</span>
              <span>On-Chain</span>
            </div>
          </div>

          {/* Feature 3: DEX Liquidity */}
          <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
            <div className="h-10 w-10 rounded-xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
              <Droplets className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">DEX Liquidity Depth</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Discovers all active AMM pairs across Raydium, Orca, and Meteora. Inspects real liquidity depth USD, 24h trading volume, and LP token lockup status.
            </p>
            <div className="mt-4 pt-3 border-t border-lens-700/40 flex items-center justify-between text-[11px] font-mono text-cyan-400">
              <span>Raydium • Orca • Meteora</span>
              <span>LP Locked %</span>
            </div>
          </div>

          {/* Feature 4: Grounded AI */}
          <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
            <div className="h-10 w-10 rounded-xl bg-lens-amber/10 border border-lens-amber/30 flex items-center justify-center text-lens-amber mb-4 group-hover:scale-110 transition-transform">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Grounded AI Analysis</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Google Gemini synthesizes an executive summary strictly bounded by on-chain findings. Includes explicit uncertainties, caveats, and deterministic fallbacks.
            </p>
            <div className="mt-4 pt-3 border-t border-lens-700/40 flex items-center justify-between text-[11px] font-mono text-lens-amber">
              <span>Zero Hallucination</span>
              <span>Strict Bounds</span>
            </div>
          </div>
        </div>
      </section>

      {/* 6 Core Transparency Principles Section */}
      <section className="w-full py-16 border-t border-lens-700/40">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <span className="text-xs font-semibold uppercase tracking-wider text-lens-accent">
            Core Philosophy
          </span>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-white">
            The 6 Principles of Token Transparency
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            LaunchLens was built to replace emotional trading with verifiable proof.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Principle 1 */}
          <div className="rounded-xl border border-lens-700/60 bg-lens-850/50 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-lens-accent/10 text-xs font-bold text-lens-accent font-mono border border-lens-accent/20">
                  01
                </span>
                <h4 className="text-sm font-semibold text-white">Deterministic On-Chain Evidence</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every metric is directly derived from verifiable Solana RPC calls. We don&apos;t rely on self-reported developer forms or paid promotion listings.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
              <CheckCircle2 className="h-3.5 w-3.5 text-lens-accent" />
              <span>Cryptographic Proof</span>
            </div>
          </div>

          {/* Principle 2 */}
          <div className="rounded-xl border border-lens-700/60 bg-lens-850/50 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-lens-emerald/10 text-xs font-bold text-lens-emerald font-mono border border-lens-emerald/20">
                  02
                </span>
                <h4 className="text-sm font-semibold text-white">Zero Algorithmic Speculation</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                We never assign predictive &quot;moon&quot; or &quot;dump&quot; price predictions. LaunchLens focuses entirely on structural integrity and custody distribution.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
              <CheckCircle2 className="h-3.5 w-3.5 text-lens-emerald" />
              <span>Objective Risk Scores</span>
            </div>
          </div>

          {/* Principle 3 */}
          <div className="rounded-xl border border-lens-700/60 bg-lens-850/50 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-lens-amber/10 text-xs font-bold text-lens-amber font-mono border border-lens-amber/20">
                  03
                </span>
                <h4 className="text-sm font-semibold text-white">Grounded AI Summaries</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Large language models are constrained via strict JSON schemas to only summarize verified metrics, eliminating marketing rhetoric and creative fabrication.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
              <CheckCircle2 className="h-3.5 w-3.5 text-lens-amber" />
              <span>Fact-Checked LLM</span>
            </div>
          </div>

          {/* Principle 4 */}
          <div className="rounded-xl border border-lens-700/60 bg-lens-850/50 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-lens-rose/10 text-xs font-bold text-lens-rose font-mono border border-lens-rose/20">
                  04
                </span>
                <h4 className="text-sm font-semibold text-white">Clear Risk Categorization</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Triggered risk rules are categorized into Critical, High, Medium, Low, and Info with clear evidence quotes and explicit explanations of why the rule matters.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
              <CheckCircle2 className="h-3.5 w-3.5 text-lens-rose" />
              <span>Actionable Severity</span>
            </div>
          </div>

          {/* Principle 5 */}
          <div className="rounded-xl border border-lens-700/60 bg-lens-850/50 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-400/10 text-xs font-bold text-cyan-400 font-mono border border-cyan-400/20">
                  05
                </span>
                <h4 className="text-sm font-semibold text-white">Direct Solscan Verification</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every holder account, mint authority key, and pool contract provides 1-click external navigation to Solscan block explorer for independent audit.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
              <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
              <span>Open Explorer Links</span>
            </div>
          </div>

          {/* Principle 6 */}
          <div className="rounded-xl border border-lens-700/60 bg-lens-850/50 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-400/10 text-xs font-bold text-slate-300 font-mono border border-slate-500/20">
                  06
                </span>
                <h4 className="text-sm font-semibold text-white">Transparent Limitations &amp; Freshness</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                We clearly state exact RPC slot and timestamp provenance, along with unverified off-chain boundaries (such as team identity or private off-chain agreements).
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
              <CheckCircle2 className="h-3.5 w-3.5 text-slate-400" />
              <span>Slot-Level Auditing</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Launch CTA Banner */}
      <section className="w-full mt-6 mb-12 rounded-3xl border border-lens-700/80 bg-gradient-to-r from-lens-850 via-lens-800 to-lens-850 p-6 sm:p-12 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-lens-accent/10 rounded-full blur-3xl pointer-events-none" />
        <h3 className="text-xl sm:text-3xl font-bold text-white mb-3">
          Audit Any Solana Token in Seconds
        </h3>
        <p className="text-sm text-slate-400 max-w-xl mx-auto mb-6">
          Paste any Solana SPL or Token-2022 mint address to generate an instant, unforgeable transparency dossier.
        </p>
        <div className="flex items-center justify-center">
          <a
            href="https://t.me/LaunchLensBot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-lens-accent px-6 py-3 text-sm font-bold text-lens-900 transition-all hover:brightness-110 shadow-lg shadow-lens-accent/20"
          >
            <Send className="h-4 w-4" />
            <span>Open Telegram Bot</span>
          </a>
        </div>
      </section>
    </div>
  );
}
