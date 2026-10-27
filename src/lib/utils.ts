import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncateAddress(address: string, chars = 4): string {
  if (!address) return "";
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function formatNumber(num: number, maximumFractionDigits = 2): string {
  if (num === null || num === undefined || isNaN(num)) return "0";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
  }).format(num);
}

export function formatCurrency(num: number, maxDigits = 2): string {
  if (num === null || num === undefined || isNaN(num)) return "$0.00";
  if (num >= 1_000_000_000) {
    return `$${(num / 1_000_000_000).toFixed(2)}B`;
  }
  if (num >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(2)}M`;
  }
  if (num >= 1_000) {
    return `$${(num / 1_000).toFixed(2)}K`;
  }
  if (num < 0.0001 && num > 0) {
    return `$${num.toExponential(4)}`;
  }
  return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: maxDigits })}`;
}

export function formatPercent(num: number, digits = 2): string {
  if (num === null || num === undefined || isNaN(num)) return "0.00%";
  return `${num.toFixed(digits)}%`;
}

export function isValidSolanaAddress(address: string): boolean {
  if (!address) return false;
  const trimmed = address.trim();
  // Solana public keys are base58 encoded, 32-44 characters long
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(trimmed);
}
