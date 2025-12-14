export const SCANNER_API_URL = "/scan";

export interface ScannerTxReport {
  txid: string;
  datetime: string;
  kind: string;
  value: number;
  fee?: number;
  memos: string[];
}

export interface ScannerBalances {
  sapling_balance: number;
  orchard_balance: number;
  transparent_balance: number;
}

export interface ScannerAnalysis {
  total_transactions: number;
  total_received: number;
  total_sent: number;
  total_fees: number;
  avg_transaction_value: number;
  most_active_day: string;
  most_active_day_count: number;
  pool_distribution: Record<string, number>;
  type_distribution: Record<string, number>;
}

export interface ScannerResponse {
  balances?: ScannerBalances;
  analysis?: ScannerAnalysis;
  history?: ScannerTxReport[];
  raw?: string;
}

export async function scanWallet(
  uvk: string,
  birthday: number,
  action: "all" | "summary" | "history" | "memo" = "all",
  txid?: string
): Promise<ScannerResponse> {
  try {
    const response = await fetch("/api/scan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uvk, birthday, action, txid }),
    });

    if (!response.ok) {
      // Prepare error message
      const text = await response.text();
      throw new Error(
        `Scanner API error: ${response.status} ${response.statusText} - ${text}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch from Scanner API:", error);
    // Determine if it's a network error (server unlikely running)
    if (
      error instanceof TypeError &&
      error.message.includes("Failed to fetch")
    ) {
      throw new Error(
        "Scanner Server is not running. Please run 'node zypherscan-decrypt/server.js' locally."
      );
    }
    throw error;
  }
}
