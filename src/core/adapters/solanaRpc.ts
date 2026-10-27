import { Connection, PublicKey } from "@solana/web3.js";

export interface SolanaRpcAccountResult {
  mint: string;
  decimals: number;
  supplyRaw: string;
  supplyFormatted: number;
  mintAuthority: string | null;
  freezeAuthority: string | null;
  isMintRevoked: boolean;
  isFreezeRevoked: boolean;
  tokenProgram: "spl-token" | "spl-token-2022" | string;
  extensions: string[];
  ownerProgramId: string;
}

const SPL_TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const SPL_TOKEN_2022_PROGRAM_ID = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
const DEFAULT_RPC_TIMEOUT_MS = 10000;

function getRpcEndpoint(): string {
  return (
    process.env.SOLANA_RPC_URL?.trim() ||
    "https://api.mainnet-beta.solana.com"
  );
}

/**
 * Executes a promise with an enforced timeout.
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operationName: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${operationName} timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

/**
 * Fetches and parses Solana mint account info via direct Solana JSON-RPC.
 */
export async function fetchSolanaParsedAccount(
  mintAddress: string,
  timeoutMs: number = DEFAULT_RPC_TIMEOUT_MS
): Promise<SolanaRpcAccountResult | null> {
  try {
    let pubkey: PublicKey;
    try {
      pubkey = new PublicKey(mintAddress);
    } catch {
      throw new Error(`Invalid Solana public key: ${mintAddress}`);
    }

    const endpoint = getRpcEndpoint();
    const connection = new Connection(endpoint, {
      commitment: "confirmed",
      confirmTransactionInitialTimeout: timeoutMs,
    });

    const accountInfo = await withTimeout(
      connection.getParsedAccountInfo(pubkey),
      timeoutMs,
      `Solana getParsedAccountInfo(${mintAddress})`
    );

    if (!accountInfo || !accountInfo.value) {
      return null;
    }

    const { data, owner } = accountInfo.value;
    const ownerProgramId = owner.toBase58();

    let tokenProgram: "spl-token" | "spl-token-2022" | string = "spl-token";
    if (ownerProgramId === SPL_TOKEN_2022_PROGRAM_ID) {
      tokenProgram = "spl-token-2022";
    } else if (ownerProgramId === SPL_TOKEN_PROGRAM_ID) {
      tokenProgram = "spl-token";
    } else {
      tokenProgram = ownerProgramId;
    }

    // Ensure account data is parsed
    if (!("parsed" in data)) {
      throw new Error(`Account data for ${mintAddress} is binary and was not parsed by RPC`);
    }

    const parsedInfo = data.parsed?.info;
    if (!parsedInfo) {
      throw new Error(`Parsed account data missing 'info' field for ${mintAddress}`);
    }

    const decimals = typeof parsedInfo.decimals === "number" ? parsedInfo.decimals : 0;
    const supplyRaw = String(parsedInfo.supply ?? "0");
    const mintAuthority = parsedInfo.mintAuthority ? String(parsedInfo.mintAuthority) : null;
    const freezeAuthority = parsedInfo.freezeAuthority ? String(parsedInfo.freezeAuthority) : null;

    // Detect Token-2022 extensions
    const extensions: string[] = [];
    if (Array.isArray(parsedInfo.extensions)) {
      for (const ext of parsedInfo.extensions) {
        if (typeof ext === "object" && ext !== null && "extension" in ext) {
          extensions.push(String(ext.extension));
        } else if (typeof ext === "string") {
          extensions.push(ext);
        }
      }
    }

    // Calculate formatted supply safely
    let supplyFormatted = 0;
    try {
      if (decimals === 0) {
        supplyFormatted = Number(BigInt(supplyRaw));
      } else {
        const divisor = BigInt(10 ** decimals);
        const integerPart = BigInt(supplyRaw) / divisor;
        const remainder = BigInt(supplyRaw) % divisor;
        supplyFormatted = Number(integerPart) + Number(remainder) / 10 ** decimals;
      }
    } catch {
      supplyFormatted = parseFloat(supplyRaw) / 10 ** decimals || 0;
    }

    return {
      mint: mintAddress,
      decimals,
      supplyRaw,
      supplyFormatted,
      mintAuthority,
      freezeAuthority,
      isMintRevoked: mintAuthority === null,
      isFreezeRevoked: freezeAuthority === null,
      tokenProgram,
      extensions,
      ownerProgramId,
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.warn(`[solanaRpc] Error fetching parsed account for ${mintAddress}: ${err.message}`);
    return null;
  }
}
