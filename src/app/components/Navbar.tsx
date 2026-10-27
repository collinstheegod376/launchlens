import React from "react";
import Link from "next/link";
import { Send, Github } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-lens-700/40 bg-lens-900/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="group flex items-center gap-3 transition-opacity hover:opacity-90">
          <div className="relative flex h-10 w-10 overflow-hidden items-center justify-center rounded-xl bg-lens-850 p-0.5 border border-lens-accent/40 shadow-lg shadow-lens-accent/10 group-hover:border-lens-accent group-hover:shadow-lens-accent/25 transition-all">
            <img
              src="/logo.png"
              alt="LaunchLens"
              className="h-full w-full rounded-lg object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white">
                Launch<span className="text-lens-accent">Lens</span>
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-400">
              Deterministic Token Intelligence
            </span>
          </div>
        </Link>

        {/* Center / Right Links */}
        <div className="flex items-center gap-3 sm:gap-5">
          {/* Telegram Bot Link */}
          <a
            href="https://t.me/LaunchLensBot"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-lens-700/60 bg-lens-850/80 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-lens-accent/40 hover:text-lens-accent"
            title="LaunchLens Telegram Scanner Bot"
          >
            <Send className="h-3.5 w-3.5 text-lens-accent" />
            <span className="hidden md:inline">Telegram Bot</span>
          </a>

          {/* GitHub Repo Link */}
          <a
            href="https://github.com/collinstheegod376/launchlens"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-lens-700/60 bg-lens-850/80 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
            title="LaunchLens Source Code"
          >
            <Github className="h-3.5 w-3.5" />
            <span className="hidden md:inline">GitHub</span>
          </a>
        </div>
      </div>
    </header>
  );
}
