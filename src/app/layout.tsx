import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "./components/Navbar";
import { ShieldCheck, ExternalLink, Terminal, Cpu } from "lucide-react";

export const metadata: Metadata = {
  title: "LaunchLens — Evidence-First Solana Token Transparency Reports",
  description:
    "Deterministic on-chain holder distribution, liquidity verification, authority status, and grounded AI summaries for Solana tokens. Zero hype, zero speculation.",
  keywords: ["Solana", "Token Research", "RugCheck", "SPL Token", "Token-2022", "DeFi", "On-Chain Intelligence"],
  openGraph: {
    title: "LaunchLens — Solana Token Transparency Reports",
    description:
      "Deterministic on-chain holder distribution, liquidity verification, authority status, and grounded AI summaries. Zero hype, zero speculation.",
    type: "website",
    images: ["/logo.png"],
  },
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-lens-900 text-slate-100 flex flex-col antialiased selection:bg-lens-accent selection:text-lens-900">
        {/* Glow ambient background elements */}
        <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-lens-accent/5 rounded-full blur-[140px]" />
          <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-lens-emerald/5 rounded-full blur-[160px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-lens-600/10 rounded-full blur-[180px]" />
        </div>

        {/* Global Navigation Header */}
        <Navbar />

        {/* Page Content Container */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {children}
        </main>

        {/* Informational Disclaimer Footer */}
        <footer className="w-full border-t border-lens-700/40 bg-lens-850/60 backdrop-blur-md py-10 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              {/* Brand Col */}
              <div className="md:col-span-2 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-white">
                    Launch<span className="text-lens-accent">Lens</span>
                  </span>
                  <span className="rounded-md bg-lens-700/60 px-2 py-0.5 text-[10px] font-mono text-lens-accent">
                    v1.0.0
                  </span>
                </div>
                <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                  Deterministic on-chain transparency reports for Solana SPL and Token-2022 mints.
                  Eliminates subjective promoter claims by extracting unforgeable ledger data directly from RPC nodes and verified AMMs.
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-400 pt-2">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Cpu className="h-3.5 w-3.5 text-lens-accent" />
                    Powered by Solana RPC & Gemini
                  </span>
                </div>
              </div>

              {/* Verified Sources */}
              <div>
                <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
                  Data Provenance
                </h4>
                <ul className="space-y-2 text-xs text-slate-400">
                  <li>
                    <a
                      href="https://solana.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-lens-accent transition-colors flex items-center gap-1"
                    >
                      Solana Mainnet RPC
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://dexscreener.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-lens-accent transition-colors flex items-center gap-1"
                    >
                      DEXScreener API
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://rugcheck.xyz"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-lens-accent transition-colors flex items-center gap-1"
                    >
                      RugCheck Risk Rules
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://solscan.io"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-lens-accent transition-colors flex items-center gap-1"
                    >
                      Solscan Block Explorer
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                </ul>
              </div>

              {/* Research Principles */}
              <div>
                <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
                  Methodology
                </h4>
                <ul className="space-y-2 text-xs text-slate-400">
                  <li className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-lens-accent" />
                    Deterministic Holder Ledger
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-lens-emerald" />
                    AMM Liquidity Verification
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-lens-amber" />
                    Admin Authority Proofs
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                    Zero Speculative Scoring
                  </li>
                </ul>
              </div>
            </div>

            {/* Disclaimer Banner */}
            <div className="border-t border-lens-700/40 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-[11px] text-slate-400 text-center md:text-left leading-relaxed">
                <strong className="text-slate-300">Disclaimer:</strong> Informational token research analysis only. Not financial advice. Token data is sourced deterministically from decentralized networks and is subject to network latency and market fluctuations. Always independently verify all on-chain transactions and contracts.
              </p>
              <div className="text-[11px] text-slate-500 whitespace-nowrap">
                © {new Date().getFullYear()} LaunchLens. Open Research.
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
