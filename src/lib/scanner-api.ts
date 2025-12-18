export const API_BASE = "/api/zypher";

export interface ScannerBalances {
  sapling_balance: number;
  orchard_balance: number;
  transparent_balance: number;
}

export interface ScannerTxReport {
  txid: string;
  datetime: string;
  kind: string; // "Received" | "Sent"
  value: number;
  fee?: number;
  memos: (string | Record<string, any>)[];
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

export interface SyncStatus {
  status: string; // "in_progress" | "complete" | "error"
  blocks_scanned: number;
  percent_scanned: number;
  tx_count: number;
  error?: string | null;
  // Optional mapped fields if we still want to support them or map them
  current_block?: number;
  latest_block?: number;
}

export interface OverviewResponse {
  balances: ScannerBalances;
  transactions: ScannerTxReport[];
  analysis: ScannerAnalysis;
}

// Store session ID in memory
let currentSessionId: string | null = null;

export function getSessionId() {
  return currentSessionId;
}

async function apiClient<T>(
  endpoint: string,
  method: string = "GET",
  body?: any
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const options: RequestInit = {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  };

  // Append session_id to query params for all requests except /init
  let url = `${API_BASE}${endpoint}`;
  if (currentSessionId && endpoint !== "/init") {
    const separator = url.includes("?") ? "&" : "?";
    url = `${url}${separator}session_id=${currentSessionId}`;
  }

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API Error ${response.status}: ${text}`);
    }

    // Handle void responses or non-json
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }
    return {} as T;
  } catch (error) {
    console.error(`API Call Failed [${method} ${endpoint}]:`, error);
    throw error;
  }
}

// 1. Init Viewing key
export async function initScanner(uvk: string, birthday?: number) {
  const response = await apiClient<{ session_id: string }>("/init", "POST", {
    uvk,
    birthday: birthday ?? 3150000, // Default to 3150000 if not provided
  });
  if (response && response.session_id) {
    currentSessionId = response.session_id;
    console.log("[Scanner API] Initialized session:", currentSessionId);
  }
  return response;
}

// 2. Start Sync
export async function startSync() {
  return apiClient("/sync/start", "POST");
}

// 3. Sync Status
export async function getSyncStatus() {
  return apiClient<SyncStatus>("/sync/status");
}

// 4. Get Memo
export async function getMemo(txid: string) {
  // Returns raw string or object? Assuming object with memo field or just the text
  // The user said "Get Memo by Tx ID".
  // Let's assume it returns { memo: string } or similar JSON.
  // If it falls back to raw text, apiClient handles it?
  // Actually apiClient expects JSON if content-type is json.
  // Let's assume standard JSON response.
  return apiClient<{ memo: string; memos?: string[] }>(`/memo/${txid}`);
}

// 5. Overview
export async function getOverview() {
  return apiClient<OverviewResponse>("/overview");
}

// 6. Get Transaction by ID (Restored)
export async function getTransaction(txid: string) {
  return apiClient<ScannerTxReport>(`/transaction/${txid}`); // Endpoint might need verification if it exists in backend
}
