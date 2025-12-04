/**
 * Export Service
 *
 * Handles exporting transaction history and wallet data
 * in various formats (CSV, JSON)
 */

import { DecryptedTransaction, formatZEC } from "./zcash-crypto";
import { addressBook } from "./address-book";

export interface ExportOptions {
  format: "csv" | "json";
  includeAddressLabels: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  types?: ("incoming" | "outgoing" | "internal")[];
}

class ExportService {
  /**
   * Export transactions to CSV format
   */
  exportToCSV(
    transactions: DecryptedTransaction[],
    options: ExportOptions = { format: "csv", includeAddressLabels: true }
  ): string {
    const filteredTxs = this.filterTransactions(transactions, options);

    const headers = [
      "Date",
      "Time",
      "Type",
      "Amount (ZEC)",
      "Fee (ZEC)",
      "Pool",
      "Transaction ID",
      "Block Height",
      "Confirmations",
      "Memo",
      options.includeAddressLabels ? "Address" : null,
      options.includeAddressLabels ? "Label" : null,
    ].filter(Boolean);

    const rows = filteredTxs.map((tx) => {
      const date = tx.timestamp.toISOString().split("T")[0];
      const time = tx.timestamp.toISOString().split("T")[1].split(".")[0];
      const amount =
        tx.type === "incoming"
          ? formatZEC(tx.amount)
          : `-${formatZEC(tx.amount)}`;
      const fee = tx.fee ? formatZEC(tx.fee) : "";
      const address = tx.address || "";
      const label =
        options.includeAddressLabels && tx.address
          ? addressBook.getLabel(tx.address)
          : "";

      return [
        date,
        time,
        tx.type,
        amount,
        fee,
        tx.pool,
        tx.txid,
        tx.blockHeight.toString(),
        tx.confirmations.toString(),
        this.escapeCSV(tx.memo || ""),
        options.includeAddressLabels ? this.escapeCSV(address) : null,
        options.includeAddressLabels ? this.escapeCSV(label) : null,
      ].filter((v) => v !== null);
    });

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
      "\n"
    );

    return csv;
  }

  /**
   * Export transactions to JSON format
   */
  exportToJSON(
    transactions: DecryptedTransaction[],
    options: ExportOptions = { format: "json", includeAddressLabels: true }
  ): string {
    const filteredTxs = this.filterTransactions(transactions, options);

    const exportData = {
      exportDate: new Date().toISOString(),
      count: filteredTxs.length,
      transactions: filteredTxs.map((tx) => ({
        ...tx,
        timestamp: tx.timestamp.toISOString(),
        amountZEC: formatZEC(tx.amount),
        feeZEC: tx.fee ? formatZEC(tx.fee) : null,
        addressLabel:
          options.includeAddressLabels && tx.address
            ? addressBook.getLabel(tx.address)
            : undefined,
      })),
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Filter transactions based on export options
   */
  private filterTransactions(
    transactions: DecryptedTransaction[],
    options: ExportOptions
  ): DecryptedTransaction[] {
    let filtered = [...transactions];

    // Filter by date range
    if (options.dateRange) {
      filtered = filtered.filter(
        (tx) =>
          tx.timestamp >= options.dateRange!.start &&
          tx.timestamp <= options.dateRange!.end
      );
    }

    // Filter by transaction type
    if (options.types && options.types.length > 0) {
      filtered = filtered.filter((tx) => options.types!.includes(tx.type));
    }

    // Sort by date descending
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return filtered;
  }

  /**
   * Escape a value for CSV
   */
  private escapeCSV(value: string): string {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Download data as a file
   */
  downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Export and download transactions as CSV
   */
  downloadCSV(transactions: DecryptedTransaction[], filename?: string): void {
    const csv = this.exportToCSV(transactions, {
      format: "csv",
      includeAddressLabels: true,
    });
    const timestamp = new Date().toISOString().split("T")[0];
    const defaultFilename = `zcash-transactions-${timestamp}.csv`;
    this.downloadFile(csv, filename || defaultFilename, "text/csv");
  }

  /**
   * Export and download transactions as JSON
   */
  downloadJSON(transactions: DecryptedTransaction[], filename?: string): void {
    const json = this.exportToJSON(transactions, {
      format: "json",
      includeAddressLabels: true,
    });
    const timestamp = new Date().toISOString().split("T")[0];
    const defaultFilename = `zcash-transactions-${timestamp}.json`;
    this.downloadFile(json, filename || defaultFilename, "application/json");
  }

  /**
   * Export address book
   */
  downloadAddressBook(format: "json" | "csv" = "json"): void {
    const timestamp = new Date().toISOString().split("T")[0];

    if (format === "json") {
      const json = addressBook.exportToJSON();
      this.downloadFile(
        json,
        `zcash-address-book-${timestamp}.json`,
        "application/json"
      );
    } else {
      const entries = addressBook.getAllEntries();
      const headers = [
        "Address",
        "Label",
        "Type",
        "Notes",
        "Tags",
        "Favorite",
        "Created",
        "Updated",
      ];
      const rows = entries.map((e) => [
        e.address,
        this.escapeCSV(e.label),
        e.type,
        this.escapeCSV(e.notes || ""),
        this.escapeCSV((e.tags || []).join(";")),
        e.isFavorite ? "Yes" : "No",
        e.createdAt.toISOString(),
        e.updatedAt.toISOString(),
      ]);
      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join(
        "\n"
      );
      this.downloadFile(csv, `zcash-address-book-${timestamp}.csv`, "text/csv");
    }
  }

  /**
   * Generate a tax report summary
   */
  generateTaxSummary(
    transactions: DecryptedTransaction[],
    year: number
  ): {
    totalReceived: number;
    totalSent: number;
    totalFees: number;
    netChange: number;
    transactionCount: number;
    byMonth: { month: string; received: number; sent: number }[];
  } {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);

    const yearTxs = transactions.filter(
      (tx) => tx.timestamp >= startOfYear && tx.timestamp <= endOfYear
    );

    const byMonth: { month: string; received: number; sent: number }[] = [];
    for (let m = 0; m < 12; m++) {
      const monthStart = new Date(year, m, 1);
      const monthEnd = new Date(year, m + 1, 0, 23, 59, 59);
      const monthTxs = yearTxs.filter(
        (tx) => tx.timestamp >= monthStart && tx.timestamp <= monthEnd
      );

      const monthName = monthStart.toLocaleString("default", {
        month: "short",
      });
      byMonth.push({
        month: monthName,
        received: monthTxs
          .filter((tx) => tx.type === "incoming")
          .reduce((sum, tx) => sum + tx.amount, 0),
        sent: monthTxs
          .filter((tx) => tx.type === "outgoing")
          .reduce((sum, tx) => sum + tx.amount, 0),
      });
    }

    const totalReceived = yearTxs
      .filter((tx) => tx.type === "incoming")
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalSent = yearTxs
      .filter((tx) => tx.type === "outgoing")
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalFees = yearTxs
      .filter((tx) => tx.fee)
      .reduce((sum, tx) => sum + (tx.fee || 0), 0);

    return {
      totalReceived,
      totalSent,
      totalFees,
      netChange: totalReceived - totalSent - totalFees,
      transactionCount: yearTxs.length,
      byMonth,
    };
  }
}

// Singleton instance
export const exportService = new ExportService();

export default exportService;
