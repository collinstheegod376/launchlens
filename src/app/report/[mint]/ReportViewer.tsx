"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  TokenReport,
  RiskFinding,
  HolderRecord,
  PoolRecord,
  RiskSeverity,
} from "@/core/types/token";
import {
  ShieldAlert,
  ShieldCheck,
  Shield,
  AlertTriangle,
  AlertOctagon,
  Info,
  Copy,
  Check,
  Share2,
  RotateCw,
  ExternalLink,
  Lock,
  Unlock,
  Droplets,
  Users,
  Coins,
  BrainCircuit,
  FileCode,
  Flame,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Search,
} from "lucide-react";
import {
  truncateAddress,
  formatNumber,
  formatCurrency,
  formatPercent,
} from "@/lib/utils";

interface ReportViewerProps {
  initialReport: TokenReport;
  mint: string;
}

type TabType = "findings" | "holders" | "authorities" | "liquidity" | "provenance";

export function ReportViewer({ initialReport, mint }: ReportViewerProps) {
  const [report, setReport] = useState<TokenReport>(initialReport);
  const [activeTab, setActiveTab] = useState<TabType>("findings");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [copiedMint, setCopiedMint] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [isRescanning, setIsRescanning] = useState(false);
  const [rescanError, setRescanError] = useState<string | null>(null);

  const { token, holders, liquidity, risk, aiSummary, provenance } = report;

  // Copy Mint handler
  const handleCopyMint = () => {
    navigator.clipboard.writeText(token.mint);
    setCopiedMint(true);
    setTimeout(() => setCopiedMint(false), 2000);
  };

  // Share handler
  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  // Rescan handler
  const handleRescan = async () => {
    try {
      setIsRescanning(true);
      setRescanError(null);
      const res = await fetch(`/api/report/${encodeURIComponent(mint)}?forceFresh=true`, {
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(`Rescan returned ${res.status}: ${res.statusText}`);
      }
      const freshData: TokenReport = await res.json();
      setReport(freshData);
    } catch (err: any) {
      console.error("Rescan error:", err);
      setRescanError(err?.message || "Failed to refresh token data");
    } finally {
      setIsRescanning(false);
    }
  };

  // Severity color helpers
  const getSeverityBadge = (level: RiskSeverity) => {
    switch (level) {
      case "CRITICAL":
        return {
          bg: "bg-rose-500/15 border-rose-500/40 text-rose-400",
          icon: AlertOctagon,
          label: "CRITICAL RISK",
        };
      case "HIGH":
        return {
          bg: "bg-lens-rose/15 border-lens-rose/40 text-lens-rose",
          icon: ShieldAlert,
          label: "HIGH RISK",
        };
      case "MEDIUM":
        return {
          bg: "bg-lens-amber/15 border-lens-amber/40 text-lens-amber",
          icon: AlertTriangle,
          label: "MEDIUM RISK",
        };
      case "LOW":
        return {
          bg: "bg-lens-emerald/15 border-lens-emerald/40 text-lens-emerald",
          icon: ShieldCheck,
          label: "LOW RISK",
        };
      case "INFO":
      default:
        return {
          bg: "bg-cyan-500/15 border-cyan-500/40 text-cyan-400",
          icon: Info,
          label: "INFORMATIONAL",
        };
    }
  };

  const riskBadge = getSeverityBadge(risk.scorecard.overallLevel);
  const RiskIcon = riskBadge.icon;

  // Filtered findings
  const filteredFindings =
    severityFilter === "ALL"
      ? risk.findings
      : risk.findings.filter((f) => f.severity === severityFilter);

  return (
    <div className="w-full space-y-6">
      {/* Rescan Error Toast */}
      {rescanError && (
        <div className="rounded-xl border border-lens-rose/40 bg-lens-rose/10 p-4 text-xs text-lens-rose flex items-center justify-between">
          <span>Failed to refresh: {rescanError}</span>
          <button
            onClick={() => setRescanError(null)}
            className="text-xs font-bold underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Report Header Card */}
      <div className="rounded-2xl border border-lens-700/60 bg-lens-850/80 p-4 sm:p-6 md:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-lens-accent/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Token Identity */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {token.name}
              </h1>
              <span className="rounded-lg bg-lens-800 px-2.5 py-1 text-sm font-bold text-lens-accent border border-lens-700/80">
                ${token.symbol}
              </span>
              <span className="rounded-full bg-lens-700/50 px-2.5 py-0.5 text-xs font-mono text-slate-300 border border-lens-600/50">
                {token.tokenProgram === "spl-token-2022" ? "Token-2022" : "SPL Token"}
              </span>
            </div>

            {/* Copyable Mint Address & Solscan Link */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono">
              <span className="text-slate-500">Mint:</span>
              <span className="text-slate-200 select-all font-mono break-all sm:break-normal hidden sm:inline">{token.mint}</span>
              <span className="text-slate-200 select-all font-mono sm:hidden">{truncateAddress(token.mint, 6)}</span>
              <button
                type="button"
                onClick={handleCopyMint}
                className="flex items-center gap-1 rounded bg-lens-800 px-2 py-1 text-[11px] text-slate-300 hover:text-white transition-colors border border-lens-700"
                title="Copy Mint Address"
              >
                {copiedMint ? (
                  <>
                    <Check className="h-3 w-3 text-lens-emerald" />
                    <span className="text-lens-emerald font-semibold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
              <a
                href={`https://solscan.io/token/${token.mint}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] text-lens-accent hover:underline"
              >
                Solscan
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Overall Risk Score Badge & Actions */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full lg:w-auto">
            <div
              className={`flex items-center gap-3 rounded-2xl border px-4 py-2.5 sm:px-5 sm:py-3 shadow-lg w-full sm:w-auto ${riskBadge.bg}`}
            >
              <RiskIcon className="h-7 w-7 shrink-0" />
              <div>
                <div className="text-[11px] uppercase tracking-wider font-semibold opacity-90">
                  Risk Assessment
                </div>
                <div className="text-lg font-black tracking-tight">
                  {riskBadge.label}
                  <span className="ml-2 text-sm font-bold opacity-80">
                    ({risk.scorecard.score}/100)
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons: Share & Rescan */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleShare}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl border border-lens-700 bg-lens-800/80 px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs font-semibold text-slate-200 hover:border-lens-accent/50 hover:text-white transition-all shadow-sm active:scale-95"
                title="Share Report"
              >
                {copiedShare ? (
                  <>
                    <Check className="h-4 w-4 text-lens-emerald" />
                    <span className="text-lens-emerald">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4 text-lens-accent" />
                    <span>Share</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleRescan}
                disabled={isRescanning}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl border border-lens-700 bg-lens-800/80 px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs font-semibold text-slate-200 hover:border-lens-accent/50 hover:text-white transition-all disabled:opacity-50 shadow-sm active:scale-95"
                title="Trigger Fresh RPC & Indexer Query"
              >
                <RotateCw
                  className={`h-4 w-4 text-lens-accent ${
                    isRescanning ? "animate-spin" : ""
                  }`}
                />
                <span>{isRescanning ? "Scanning..." : "Rescan"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* AI Narrative Summary Card */}
        <div className="mt-8 rounded-xl border border-lens-700/60 bg-lens-900/70 p-5 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-lens-700/40 mb-3">
            <div className="flex flex-wrap items-center gap-2">
              <BrainCircuit className="h-4 w-4 text-lens-accent" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Grounded AI Transparency Narrative
              </span>
              <span className="rounded bg-lens-800 px-2 py-0.5 text-[10px] font-mono text-lens-accent border border-lens-700">
                {aiSummary.generatedBy === "groq"
                  ? "Groq AI (Llama 3)"
                  : aiSummary.generatedBy === "gemini"
                  ? "Google Gemini 1.5"
                  : "Deterministic Engine"}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>Snapshot: {new Date(provenance.generatedAt).toLocaleTimeString()}</span>
            </div>
          </div>

          <p className="text-sm text-slate-200 leading-relaxed font-sans mb-4">
            {aiSummary.narrative}
          </p>

          {/* Key Bullet Points */}
          {aiSummary.keyTakeaways && aiSummary.keyTakeaways.length > 0 && (
            <div className="space-y-1.5 mb-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Key Findings:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {aiSummary.keyTakeaways.map((point, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-xs text-slate-300 bg-lens-800/40 rounded-lg p-2 border border-lens-700/30"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-lens-emerald shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Uncertainties & Caveats Box */}
          {aiSummary.uncertainties && aiSummary.uncertainties.length > 0 && (
            <div className="rounded-lg border border-lens-amber/30 bg-lens-amber/5 p-3 text-xs text-amber-200/90 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-lens-amber shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold text-lens-amber">
                  Known Uncertainties &amp; Caveats:
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-300 text-[11px]">
                  {aiSummary.uncertainties.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Overview Stats Bar */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 pt-5 sm:pt-6 border-t border-lens-700/40">
          <div className="rounded-xl border border-lens-700/50 bg-lens-800/40 p-3">
            <span className="text-[11px] text-slate-400 font-medium">Price USD</span>
            <div className="text-base font-bold text-white num-mono mt-0.5">
              {liquidity.highestLiquidityPool
                ? formatCurrency(liquidity.highestLiquidityPool.priceUsd, 6)
                : "N/A"}
            </div>
          </div>

          <div className="rounded-xl border border-lens-700/50 bg-lens-800/40 p-3">
            <span className="text-[11px] text-slate-400 font-medium">Market Cap / FDV</span>
            <div className="text-base font-bold text-white num-mono mt-0.5">
              {liquidity.highestLiquidityPool
                ? formatCurrency(liquidity.highestLiquidityPool.fdv)
                : "N/A"}
            </div>
          </div>

          <div className="rounded-xl border border-lens-700/50 bg-lens-800/40 p-3">
            <span className="text-[11px] text-slate-400 font-medium">Total Liquidity</span>
            <div className="text-base font-bold text-lens-accent num-mono mt-0.5">
              {formatCurrency(liquidity.totalLiquidityUsd)}
            </div>
          </div>

          <div className="rounded-xl border border-lens-700/50 bg-lens-800/40 p-3">
            <span className="text-[11px] text-slate-400 font-medium">24h Volume</span>
            <div className="text-base font-bold text-white num-mono mt-0.5">
              {formatCurrency(liquidity.totalVolume24h)}
            </div>
          </div>

          <div className="rounded-xl border border-lens-700/50 bg-lens-800/40 p-3">
            <span className="text-[11px] text-slate-400 font-medium">Decimals</span>
            <div className="text-base font-bold text-white num-mono mt-0.5">
              {token.decimals}
            </div>
          </div>

          <div className="rounded-xl border border-lens-700/50 bg-lens-800/40 p-3">
            <span className="text-[11px] text-slate-400 font-medium">Total Supply</span>
            <div className="text-base font-bold text-white num-mono mt-0.5 truncate" title={formatNumber(token.supplyFormatted)}>
              {formatNumber(token.supplyFormatted)}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-lens-700/60 overflow-x-auto no-scrollbar gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("findings")}
          className={`flex items-center gap-2 px-3.5 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition-all border-b-2 whitespace-nowrap shrink-0 ${
            activeTab === "findings"
              ? "border-lens-accent text-lens-accent bg-lens-accent/5"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600"
          }`}
        >
          <ShieldAlert className="h-4 w-4" />
          <span>Risk Findings ({risk.findings.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("holders")}
          className={`flex items-center gap-2 px-3.5 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition-all border-b-2 whitespace-nowrap shrink-0 ${
            activeTab === "holders"
              ? "border-lens-accent text-lens-accent bg-lens-accent/5"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Holders Distribution</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("authorities")}
          className={`flex items-center gap-2 px-3.5 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition-all border-b-2 whitespace-nowrap shrink-0 ${
            activeTab === "authorities"
              ? "border-lens-accent text-lens-accent bg-lens-accent/5"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600"
          }`}
        >
          <Lock className="h-4 w-4" />
          <span>Authorities &amp; Keys</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("liquidity")}
          className={`flex items-center gap-2 px-3.5 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition-all border-b-2 whitespace-nowrap shrink-0 ${
            activeTab === "liquidity"
              ? "border-lens-accent text-lens-accent bg-lens-accent/5"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600"
          }`}
        >
          <Droplets className="h-4 w-4" />
          <span>Liquidity &amp; Pools ({liquidity.pools.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("provenance")}
          className={`flex items-center gap-2 px-3.5 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition-all border-b-2 whitespace-nowrap shrink-0 ${
            activeTab === "provenance"
              ? "border-lens-accent text-lens-accent bg-lens-accent/5"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600"
          }`}
        >
          <FileCode className="h-4 w-4" />
          <span>Provenance &amp; Limitations</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="mt-4">
        {/* TAB 1: RISK FINDINGS */}
        {activeTab === "findings" && (
          <div className="space-y-6">
            {/* Scorecard Breakdown */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              <div className="rounded-xl border border-lens-700/50 bg-lens-850/60 p-4">
                <span className="text-xs text-slate-400 font-medium">Authorities Score</span>
                <div className="text-xl font-bold text-white mt-1">
                  {risk.scorecard.breakdown.authorities.score} / 100
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {risk.scorecard.breakdown.authorities.status}
                </div>
              </div>

              <div className="rounded-xl border border-lens-700/50 bg-lens-850/60 p-4">
                <span className="text-xs text-slate-400 font-medium">Holders Score</span>
                <div className="text-xl font-bold text-white mt-1">
                  {risk.scorecard.breakdown.holders.score} / 100
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {risk.scorecard.breakdown.holders.status}
                </div>
              </div>

              <div className="rounded-xl border border-lens-700/50 bg-lens-850/60 p-4">
                <span className="text-xs text-slate-400 font-medium">Liquidity Score</span>
                <div className="text-xl font-bold text-white mt-1">
                  {risk.scorecard.breakdown.liquidity.score} / 100
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {risk.scorecard.breakdown.liquidity.status}
                </div>
              </div>

              <div className="rounded-xl border border-lens-700/50 bg-lens-850/60 p-4">
                <span className="text-xs text-slate-400 font-medium">Code &amp; Extensions</span>
                <div className="text-xl font-bold text-white mt-1">
                  {risk.scorecard.breakdown.codeOrExtensions.score} / 100
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {risk.scorecard.breakdown.codeOrExtensions.status}
                </div>
              </div>
            </div>

            {/* Severity Filter Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Triggered Rules Filter:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"].map((level) => {
                  const count =
                    level === "ALL"
                      ? risk.findings.length
                      : risk.findings.filter((f) => f.severity === level).length;
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setSeverityFilter(level)}
                      className={`rounded-lg px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold transition-all border ${
                        severityFilter === level
                          ? "bg-lens-accent/15 border-lens-accent text-lens-accent"
                          : "bg-lens-800/60 border-lens-700/60 text-slate-400 hover:text-white"
                      }`}
                    >
                      {level} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Findings List */}
            {filteredFindings.length === 0 ? (
              <div className="rounded-2xl border border-lens-700/50 bg-lens-850/40 p-8 text-center text-slate-400 text-sm">
                No findings match the selected filter &quot;{severityFilter}&quot;.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFindings.map((finding) => {
                  const badge = getSeverityBadge(finding.severity);
                  const Icon = badge.icon;
                  return (
                    <div
                      key={finding.ruleId}
                      className="rounded-2xl border border-lens-700/60 bg-lens-850/70 p-5 backdrop-blur-md space-y-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`flex items-center gap-1 rounded-md border px-2.5 py-0.5 text-[11px] font-bold ${badge.bg}`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {finding.severity}
                          </span>
                          <h4 className="text-base font-bold text-white">
                            {finding.title}
                          </h4>
                        </div>
                        <span className="font-mono text-[11px] text-slate-500">
                          {finding.ruleId}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        {finding.description}
                      </p>

                      {/* Evidence Monospace Box */}
                      {finding.evidence && (
                        <div className="rounded-lg border border-lens-700/70 bg-lens-900/90 p-3 font-mono text-xs text-slate-300">
                          <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                            Deterministic Evidence Quote:
                          </div>
                          <code className="text-lens-accent block overflow-x-auto whitespace-pre-wrap break-all sm:break-normal">
                            {finding.evidence}
                          </code>
                        </div>
                      )}

                      {/* Caveat or Confidence */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-lens-700/30 text-[11px]">
                        {finding.limitations ? (
                          <span className="text-amber-300/80 italic">
                            Caveat: {finding.limitations}
                          </span>
                        ) : (
                          <span className="text-slate-400">On-chain verified</span>
                        )}
                        {finding.confidence && (
                          <span className="font-mono text-slate-400">
                            Confidence:{" "}
                            <strong className="text-white">{finding.confidence}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: HOLDERS DISTRIBUTION */}
        {activeTab === "holders" && (
          <div className="space-y-6">
            {/* Concentration Meters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-lens-700/60 bg-lens-850/70 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Top 10 Concentration</span>
                  <span className="text-lg font-bold text-lens-accent num-mono">
                    {formatPercent(holders.top10ConcentrationPct)}
                  </span>
                </div>
                {/* Visual meter */}
                <div className="h-2 w-full rounded-full bg-lens-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      holders.top10ConcentrationPct > 70
                        ? "bg-lens-rose"
                        : holders.top10ConcentrationPct > 40
                        ? "bg-lens-amber"
                        : "bg-lens-emerald"
                    }`}
                    style={{ width: `${Math.min(100, holders.top10ConcentrationPct)}%` }}
                  />
                </div>
                <div className="text-[11px] text-slate-400">
                  {holders.top10ConcentrationPct > 60
                    ? "Elevated concentration risk: Top 10 control over 60%."
                    : "Moderate distribution among top accounts."}
                </div>
              </div>

              <div className="rounded-2xl border border-lens-700/60 bg-lens-850/70 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Top 20 Concentration</span>
                  <span className="text-lg font-bold text-white num-mono">
                    {formatPercent(holders.top20ConcentrationPct)}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-lens-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-cyan-400"
                    style={{ width: `${Math.min(100, holders.top20ConcentrationPct)}%` }}
                  />
                </div>
                <div className="text-[11px] text-slate-400">
                  Total supply controlled by top 20 recorded holders.
                </div>
              </div>

              <div className="rounded-2xl border border-lens-700/60 bg-lens-850/70 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Burned Supply</span>
                  <span className="text-lg font-bold text-lens-emerald num-mono">
                    {formatPercent(holders.burnedSupplyPct)}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-lens-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-lens-emerald"
                    style={{ width: `${Math.min(100, holders.burnedSupplyPct)}%` }}
                  />
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5 text-lens-emerald" />
                  <span>Permanently unrecoverable dead address balance.</span>
                </div>
              </div>
            </div>

            {/* Top Holders Table */}
            <div className="rounded-2xl border border-lens-700/60 bg-lens-850/70 overflow-hidden shadow-xl">
              <div className="p-4 border-b border-lens-700/40 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Top Accounts &amp; Custody Classification</h3>
                  <p className="text-xs text-slate-400">
                    Accounts tagged via on-chain program signatures and known protocol contracts.
                  </p>
                </div>
                <span className="rounded bg-lens-800 px-2.5 py-1 text-xs font-mono text-slate-300">
                  {holders.topHolders.length} accounts analyzed
                </span>
              </div>

              <div className="sm:hidden text-[10px] text-slate-400 flex items-center justify-between px-4 py-1.5 bg-lens-900/60 border-b border-lens-700/40 font-mono">
                <span>Swipe table horizontally</span>
                <span>→</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-xs">
                  <thead className="bg-lens-900/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-lens-700/40">
                    <tr>
                      <th className="py-3 px-4">Rank</th>
                      <th className="py-3 px-4">Holder / Owner Address</th>
                      <th className="py-3 px-4">Classification</th>
                      <th className="py-3 px-4 text-right">Balance</th>
                      <th className="py-3 px-4 text-right">% of Supply</th>
                      <th className="py-3 px-4">Explorer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-lens-700/30">
                    {holders.topHolders.map((holder, idx) => {
                      return (
                        <tr
                          key={holder.address + idx}
                          className="hover:bg-lens-800/40 transition-colors"
                        >
                          <td className="py-3 px-4 font-mono font-bold text-slate-400">
                            #{idx + 1}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col font-mono">
                              <span className="text-slate-200 font-semibold">
                                {holder.owner || truncateAddress(holder.address, 6)}
                              </span>
                              {holder.owner && (
                                <span className="text-[10px] text-slate-500">
                                  {truncateAddress(holder.address, 6)}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${
                                  holder.classification === "pool"
                                    ? "bg-lens-emerald/15 text-lens-emerald border border-lens-emerald/30"
                                    : holder.classification === "burn"
                                    ? "bg-zinc-500/15 text-zinc-400 border border-zinc-500/30"
                                    : holder.classification === "program"
                                    ? "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                                    : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                                }`}
                              >
                                {holder.classification}
                              </span>
                              {holder.isInsider && (
                                <span className="rounded bg-lens-amber/15 text-lens-amber border border-lens-amber/30 px-1.5 py-0.5 text-[10px] font-bold">
                                  Insider
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-300 font-medium">
                            {formatNumber(holder.uiBalance)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className="font-mono text-white font-bold">
                                {formatPercent(holder.percentage)}
                              </span>
                              <div className="h-1.5 w-12 rounded-full bg-lens-800 overflow-hidden">
                                <div
                                  className="h-full bg-lens-accent rounded-full"
                                  style={{ width: `${Math.min(100, holder.percentage * 2)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <a
                              href={`https://solscan.io/account/${holder.address}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-lens-accent hover:underline flex items-center gap-1 font-mono text-[11px]"
                            >
                              Solscan
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: AUTHORITIES & PERMISSIONS */}
        {activeTab === "authorities" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mint Authority */}
              <div className="rounded-2xl border border-lens-700/60 bg-lens-850/70 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Coins className="h-5 w-5 text-lens-accent" />
                    <h3 className="text-base font-bold text-white">Mint Authority</h3>
                  </div>
                  {token.authorities.isMintRevoked ? (
                    <span className="flex items-center gap-1.5 rounded-full bg-lens-emerald/15 border border-lens-emerald/40 px-3 py-1 text-xs font-bold text-lens-emerald">
                      <Lock className="h-3.5 w-3.5" />
                      Revoked (Safe)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 rounded-full bg-lens-rose/15 border border-lens-rose/40 px-3 py-1 text-xs font-bold text-lens-rose">
                      <Unlock className="h-3.5 w-3.5" />
                      Active (Warning)
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Controls whether the creator or admin can mint new tokens in the future.
                  When revoked, total supply is permanently capped.
                </p>

                <div className="rounded-xl border border-lens-700/60 bg-lens-900/80 p-3 text-xs font-mono space-y-1">
                  <div className="text-[10px] text-slate-400 uppercase">On-Chain Key:</div>
                  <div className="text-slate-200 break-all select-all">
                    {token.authorities.mintAuthority || "None (Revoked / null)"}
                  </div>
                </div>
              </div>

              {/* Freeze Authority */}
              <div className="rounded-2xl border border-lens-700/60 bg-lens-850/70 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Shield className="h-5 w-5 text-lens-accent" />
                    <h3 className="text-base font-bold text-white">Freeze Authority</h3>
                  </div>
                  {token.authorities.isFreezeRevoked ? (
                    <span className="flex items-center gap-1.5 rounded-full bg-lens-emerald/15 border border-lens-emerald/40 px-3 py-1 text-xs font-bold text-lens-emerald">
                      <Lock className="h-3.5 w-3.5" />
                      Revoked (Safe)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 rounded-full bg-rose-500/20 border border-rose-500/50 px-3 py-1 text-xs font-bold text-rose-400">
                      <AlertOctagon className="h-3.5 w-3.5" />
                      Active (Critical)
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Allows blacklisting or freezing holder token accounts, preventing selling or transferring.
                  A revoked freeze authority ensures permissionless transfers.
                </p>

                <div className="rounded-xl border border-lens-700/60 bg-lens-900/80 p-3 text-xs font-mono space-y-1">
                  <div className="text-[10px] text-slate-400 uppercase">On-Chain Key:</div>
                  <div className="text-slate-200 break-all select-all">
                    {token.authorities.freezeAuthority || "None (Revoked / null)"}
                  </div>
                </div>
              </div>

              {/* Metadata Update Authority */}
              <div className="rounded-2xl border border-lens-700/60 bg-lens-850/70 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <FileCode className="h-5 w-5 text-lens-accent" />
                    <h3 className="text-base font-bold text-white">Metadata Mutability</h3>
                  </div>
                  {!token.authorities.isMutable ? (
                    <span className="rounded-full bg-lens-emerald/15 border border-lens-emerald/40 px-3 py-1 text-xs font-bold text-lens-emerald">
                      Immutable (Safe)
                    </span>
                  ) : (
                    <span className="rounded-full bg-lens-amber/15 border border-lens-amber/40 px-3 py-1 text-xs font-bold text-lens-amber">
                      Mutable (Changeable)
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Determines whether the token name, symbol, or URI can be modified by the update authority key.
                </p>

                <div className="rounded-xl border border-lens-700/60 bg-lens-900/80 p-3 text-xs font-mono space-y-1">
                  <div className="text-[10px] text-slate-400 uppercase">Update Authority Key:</div>
                  <div className="text-slate-200 break-all select-all">
                    {token.authorities.updateAuthority || "None"}
                  </div>
                </div>

                {token.metadataUri && (
                  <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 pt-1">
                    <span>Metadata URI:</span>
                    <a
                      href={token.metadataUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lens-accent hover:underline truncate max-w-xs flex items-center gap-1"
                    >
                      {token.metadataUri}
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </div>
                )}
              </div>

              {/* Token-2022 Extensions */}
              <div className="rounded-2xl border border-lens-700/60 bg-lens-850/70 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="h-5 w-5 text-lens-accent" />
                    <h3 className="text-base font-bold text-white">Token-2022 Extensions</h3>
                  </div>
                  <span className="rounded-full bg-lens-800 px-3 py-1 text-xs font-mono text-slate-300 border border-lens-700">
                    {token.tokenProgram}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Solana Token Extensions allow custom transfer fees, permanent delegate hooks, or confidential transfers.
                </p>

                {token.extensions && token.extensions.length > 0 ? (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-300">Detected Extensions:</span>
                    <div className="flex flex-wrap gap-2">
                      {token.extensions.map((ext, idx) => (
                        <span
                          key={idx}
                          className="rounded-lg bg-lens-800 px-2.5 py-1 text-xs font-mono text-lens-accent border border-lens-700"
                        >
                          {ext}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-lens-700/50 bg-lens-900/70 p-3 text-xs text-slate-400 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-lens-emerald shrink-0" />
                    <span>No active Token-2022 extensions. Standard SPL Token layout.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: LIQUIDITY & DEX POOLS */}
        {activeTab === "liquidity" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-lens-700/60 bg-lens-850/70 overflow-hidden shadow-xl">
              <div className="p-4 border-b border-lens-700/40 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Discovered Liquidity Pools &amp; AMMs</h3>
                  <p className="text-xs text-slate-400">
                    Active liquidity pools across decentralized exchange protocols on Solana.
                  </p>
                </div>
                <div className="text-xs font-bold text-lens-accent num-mono">
                  Total Liquidity: {formatCurrency(liquidity.totalLiquidityUsd)}
                </div>
              </div>

              {liquidity.pools.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  No decentralized trading pools found for this mint address.
                </div>
              ) : (
                <>
                  <div className="sm:hidden text-[10px] text-slate-400 flex items-center justify-between px-4 py-1.5 bg-lens-900/60 border-b border-lens-700/40 font-mono">
                    <span>Swipe table horizontally</span>
                    <span>→</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[620px] text-left text-xs">
                    <thead className="bg-lens-900/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-lens-700/40">
                      <tr>
                        <th className="py-3 px-4">DEX Protocol</th>
                        <th className="py-3 px-4">Trading Pair</th>
                        <th className="py-3 px-4 text-right">Price USD</th>
                        <th className="py-3 px-4 text-right">Liquidity USD</th>
                        <th className="py-3 px-4 text-right">24h Volume</th>
                        <th className="py-3 px-4">LP Lock Status</th>
                        <th className="py-3 px-4">Links</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-lens-700/30">
                      {liquidity.pools.map((pool, idx) => (
                        <tr
                          key={pool.poolAddress + idx}
                          className="hover:bg-lens-800/40 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <span className="rounded bg-lens-800 px-2 py-0.5 text-xs font-bold uppercase text-white border border-lens-700">
                              {pool.dexId}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold text-slate-200">
                            {pool.baseToken.symbol} / {pool.quoteToken.symbol}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-white font-medium">
                            {formatCurrency(pool.priceUsd, 6)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-lens-accent font-bold">
                            {formatCurrency(pool.liquidityUsd)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-300">
                            {formatCurrency(pool.volume24h)}
                          </td>
                          <td className="py-3 px-4">
                            {pool.lpLockedPct !== undefined ? (
                              <span
                                className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                                  pool.lpLockedPct >= 95
                                    ? "bg-lens-emerald/15 text-lens-emerald border border-lens-emerald/30"
                                    : pool.lpLockedPct >= 50
                                    ? "bg-lens-amber/15 text-lens-amber border border-lens-amber/30"
                                    : "bg-lens-rose/15 text-lens-rose border border-lens-rose/30"
                                }`}
                              >
                                {pool.lpLockedPct}% Locked
                              </span>
                            ) : (
                              <span className="text-slate-500 font-mono text-[10px]">Unverified</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {pool.url && (
                                <a
                                  href={pool.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-cyan-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                                >
                                  DEXScreener
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                              <a
                                href={`https://solscan.io/account/${pool.poolAddress}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-400 hover:text-white flex items-center gap-1 font-mono text-[11px]"
                              >
                                Solscan
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>)}
            </div>
          </div>
        )}

        {/* TAB 5: DATA PROVENANCE & LIMITATIONS */}
        {activeTab === "provenance" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-lens-700/60 bg-lens-850/70 p-5 space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Solana RPC Data
                </span>
                <div className="text-sm font-bold text-white">
                  {provenance.dataFreshness.solanaRpc}
                </div>
                <p className="text-[11px] text-slate-400">
                  Fetched directly from Solana validator nodes via getAccountInfo &amp; getTokenLargestAccounts.
                </p>
              </div>

              <div className="rounded-2xl border border-lens-700/60 bg-lens-850/70 p-5 space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  DEX Liquidity Index
                </span>
                <div className="text-sm font-bold text-white">
                  {provenance.dataFreshness.dexScreener}
                </div>
                <p className="text-[11px] text-slate-400">
                  Aggregated AMM reserve pools, 24-hour volume metrics, and LP lock percentage validations.
                </p>
              </div>

              <div className="rounded-2xl border border-lens-700/60 bg-lens-850/70 p-5 space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Risk Engine Heuristics
                </span>
                <div className="text-sm font-bold text-white">
                  {provenance.dataFreshness.rugCheck}
                </div>
                <p className="text-[11px] text-slate-400">
                  Evaluated ruleset comparing contract byte patterns against known honeypot and dump vulnerabilities.
                </p>
              </div>
            </div>

            {/* Checks Completed vs Unverified */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-lens-700/60 bg-lens-850/70 p-6 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-lens-emerald" />
                  <span>Deterministic Checks Completed</span>
                </h4>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-lens-emerald" />
                    On-chain Mint Authority &amp; Supply Verification
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-lens-emerald" />
                    Freeze Authority &amp; Transfer Restriction Scan
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-lens-emerald" />
                    Top 20 Account Supply Concentration Ledger
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-lens-emerald" />
                    Dead / Burn Address Destruction Proof
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-lens-emerald" />
                    Multi-DEX Reserve Liquidity Aggregation
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-lens-emerald" />
                    Token-2022 Extension Bytecode Inspection
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-lens-700/60 bg-lens-850/70 p-6 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-lens-amber" />
                  <span>Explicit Limitations &amp; Unverified Factors</span>
                </h4>
                <ul className="space-y-2 text-xs text-slate-300">
                  {provenance.limitations && provenance.limitations.length > 0 ? (
                    provenance.limitations.map((lim, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-lens-amber shrink-0 mt-1.5" />
                        <span>{lim}</span>
                      </li>
                    ))
                  ) : (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-lens-amber shrink-0 mt-1.5" />
                        <span>Off-chain physical identities of anonymous creator keys.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-lens-amber shrink-0 mt-1.5" />
                        <span>Private off-chain coordination across seemingly disjoint holder wallets.</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
