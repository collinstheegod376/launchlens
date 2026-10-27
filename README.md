# ⚡ LaunchLens — Solana Token Transparency Reports

> Evidence-first, zero-speculation token intelligence platform built on **100% free-tier APIs**. Features both an interactive Next.js research web dashboard and a high-speed Telegram bot powered by a shared deterministic core engine.

![Next.js](https://img.shields.io/badge/Next.js-14_App_Router-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=for-the-badge&logo=typescript)
![Solana](https://img.shields.io/badge/Solana-Web3.js-purple?style=for-the-badge&logo=solana)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=for-the-badge&logo=tailwindcss)
![Telegram](https://img.shields.io/badge/Telegram-grammY_Bot-26A5E4?style=for-the-badge&logo=telegram)
![Groq](https://img.shields.io/badge/AI-Groq_Llama_3.3_70B-orange?style=for-the-badge)

---

## 🔍 Features

- **100% Free API Architecture**: No expensive paid subscriptions (like Solscan Pro). Powered by direct **Solana Public JSON-RPC**, **DEX Screener API**, and the **RugCheck Public API**.
- **Deterministic Risk Engine**: 7 objective on-chain rules calculating composite scorecards (0–100) and risk tiers (`LOW`, `MODERATE`, `HIGH`, `CRITICAL`):
  - Active Mint Authority detection
  - Active Freeze Authority detection
  - Top 10 / Top 20 holder concentration analysis with burn wallet deduction
  - Liquidity depth and LP lockup percentage verification
  - Token-2022 extension checks (transfer fees, non-transferable flags)
- **Grounded AI Explanations**: Zero-hallucination narratives powered by **Groq** (`llama-3.3-70b-versatile`) or **Google Gemini** (`gemini-1.5-flash`), with an instant deterministic rule fallback when keys are omitted.
- **Dual Delivery**:
  - **Web Dashboard**: Dark cyber research UI with interactive tabs (Overview, Risk Findings, Holder Distribution, Authorities & Permissions, Liquidity Pools, Provenance).
  - **Telegram Bot**: `grammY` bot supporting `/scan <mint>`, automatic address detection with anti-spam cooldown, and interactive inline action buttons (`🌐 Full Web Report`, `📈 DEXScreener`, `🔍 Solscan`, `🔄 Rescan`).
- **Deploy Anywhere for Free**:
  - Next.js Web on Vercel / Render.
  - Serverless Telegram webhook at `/api/bot` (Zero-server cost) or standalone polling daemon via `npm run bot`.

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/collinstheegod376/launchlens.git
cd launchlens
npm install
```

### 2. Configure Environment
Copy the example environment configuration:
```bash
cp .env.example .env.local
```

| Variable | Description | Required? |
|---|---|---|
| `SOLANA_RPC_URL` | Solana JSON-RPC endpoint (defaults to public RPC) | Optional |
| `GROQ_API_KEY` | Groq API Key (Free tier Llama 3.3 70B from [console.groq.com](https://console.groq.com)) | Optional |
| `GEMINI_API_KEY` | Google Gemini API Key from [AI Studio](https://aistudio.google.com) | Optional |
| `TELEGRAM_BOT_TOKEN` | Bot token from [@BotFather](https://t.me/BotFather) | Optional (for Telegram bot) |
| `NEXT_PUBLIC_APP_URL` | Base URL for web report links (e.g. `http://localhost:3000`) | Optional |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Postgres URL (for persistent snapshots) | Optional |

### 3. Run Web App
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run Telegram Bot (Polling Mode)
```bash
npm run bot
```

---

## 🧪 Testing & Verification

```bash
# Run unit test suite (Vitest)
npm test

# Verify production build
npm run build
```

---

## ⚖️ Disclaimer

LaunchLens provides automated informational on-chain research and algorithmic observations. It does not provide financial, investment, or trading advice. Always conduct independent due diligence before interacting with cryptocurrency tokens.
