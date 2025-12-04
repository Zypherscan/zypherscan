/**
 * Address Book Service
 *
 * Allows users to label and save addresses for easy identification
 * All data is stored locally in localStorage
 */

import { config } from "./config";

export interface AddressEntry {
  address: string;
  label: string;
  type: "transparent" | "sapling" | "orchard" | "unified" | "unknown";
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
  tags?: string[];
  isFavorite?: boolean;
}

export interface AddressBook {
  entries: AddressEntry[];
  version: number;
}

class AddressBookService {
  private storageKey = config.storage.addressBook;
  private addressBook: AddressBook;

  constructor() {
    this.addressBook = this.load();
  }

  /**
   * Load address book from localStorage
   */
  private load(): AddressBook {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        parsed.entries = parsed.entries.map((entry: any) => ({
          ...entry,
          createdAt: new Date(entry.createdAt),
          updatedAt: new Date(entry.updatedAt),
        }));
        return parsed;
      }
    } catch (error) {
      console.error("Failed to load address book:", error);
    }
    return { entries: [], version: 1 };
  }

  /**
   * Save address book to localStorage
   */
  private save(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.addressBook));
    } catch (error) {
      console.error("Failed to save address book:", error);
    }
  }

  /**
   * Detect address type from prefix
   */
  private detectAddressType(address: string): AddressEntry["type"] {
    if (address.startsWith("t1") || address.startsWith("t3")) {
      return "transparent";
    }
    if (address.startsWith("zs1") || address.startsWith("zs")) {
      return "sapling";
    }
    if (address.startsWith("u1")) {
      return "unified";
    }
    // Orchard addresses are part of unified addresses
    return "unknown";
  }

  /**
   * Add or update an address entry
   */
  addEntry(
    address: string,
    label: string,
    options?: Partial<AddressEntry>
  ): AddressEntry {
    const now = new Date();
    const existing = this.getEntry(address);

    if (existing) {
      // Update existing entry
      const updated: AddressEntry = {
        ...existing,
        ...options,
        label,
        updatedAt: now,
      };
      this.addressBook.entries = this.addressBook.entries.map((e) =>
        e.address === address ? updated : e
      );
      this.save();
      return updated;
    }

    // Create new entry
    const newEntry: AddressEntry = {
      address,
      label,
      type: this.detectAddressType(address),
      createdAt: now,
      updatedAt: now,
      notes: options?.notes,
      tags: options?.tags || [],
      isFavorite: options?.isFavorite || false,
    };

    this.addressBook.entries.push(newEntry);
    this.save();
    return newEntry;
  }

  /**
   * Get an entry by address
   */
  getEntry(address: string): AddressEntry | undefined {
    return this.addressBook.entries.find((e) => e.address === address);
  }

  /**
   * Get label for an address (returns truncated address if not found)
   */
  getLabel(address: string): string {
    const entry = this.getEntry(address);
    if (entry) {
      return entry.label;
    }
    // Return truncated address
    if (address.length > 20) {
      return `${address.slice(0, 10)}...${address.slice(-6)}`;
    }
    return address;
  }

  /**
   * Remove an entry
   */
  removeEntry(address: string): boolean {
    const initialLength = this.addressBook.entries.length;
    this.addressBook.entries = this.addressBook.entries.filter(
      (e) => e.address !== address
    );
    if (this.addressBook.entries.length !== initialLength) {
      this.save();
      return true;
    }
    return false;
  }

  /**
   * Get all entries
   */
  getAllEntries(): AddressEntry[] {
    return [...this.addressBook.entries];
  }

  /**
   * Get favorite entries
   */
  getFavorites(): AddressEntry[] {
    return this.addressBook.entries.filter((e) => e.isFavorite);
  }

  /**
   * Search entries by label, address, or tags
   */
  search(query: string): AddressEntry[] {
    const lowerQuery = query.toLowerCase();
    return this.addressBook.entries.filter(
      (e) =>
        e.label.toLowerCase().includes(lowerQuery) ||
        e.address.toLowerCase().includes(lowerQuery) ||
        e.notes?.toLowerCase().includes(lowerQuery) ||
        e.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Toggle favorite status
   */
  toggleFavorite(address: string): boolean {
    const entry = this.getEntry(address);
    if (entry) {
      entry.isFavorite = !entry.isFavorite;
      entry.updatedAt = new Date();
      this.save();
      return entry.isFavorite;
    }
    return false;
  }

  /**
   * Export address book as JSON
   */
  exportToJSON(): string {
    return JSON.stringify(this.addressBook, null, 2);
  }

  /**
   * Import address book from JSON
   */
  importFromJSON(json: string, merge: boolean = false): number {
    try {
      const imported = JSON.parse(json);
      if (!imported.entries || !Array.isArray(imported.entries)) {
        throw new Error("Invalid address book format");
      }

      let addedCount = 0;

      if (merge) {
        // Merge with existing entries
        for (const entry of imported.entries) {
          if (!this.getEntry(entry.address)) {
            this.addEntry(entry.address, entry.label, {
              notes: entry.notes,
              tags: entry.tags,
              isFavorite: entry.isFavorite,
            });
            addedCount++;
          }
        }
      } else {
        // Replace all entries
        this.addressBook = {
          entries: imported.entries.map((entry: any) => ({
            ...entry,
            createdAt: new Date(entry.createdAt),
            updatedAt: new Date(entry.updatedAt),
          })),
          version: imported.version || 1,
        };
        addedCount = imported.entries.length;
        this.save();
      }

      return addedCount;
    } catch (error) {
      console.error("Failed to import address book:", error);
      throw error;
    }
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.addressBook = { entries: [], version: 1 };
    this.save();
  }
}

// Singleton instance
export const addressBook = new AddressBookService();

export default addressBook;
