import { useState, useCallback, useEffect } from "react";
import { addressBook, AddressEntry } from "@/lib/address-book";

export interface UseAddressBookReturn {
  entries: AddressEntry[];
  favorites: AddressEntry[];
  addEntry: (
    address: string,
    label: string,
    options?: Partial<AddressEntry>
  ) => AddressEntry;
  removeEntry: (address: string) => boolean;
  getLabel: (address: string) => string;
  toggleFavorite: (address: string) => boolean;
  search: (query: string) => AddressEntry[];
  importFromJSON: (json: string, merge?: boolean) => number;
  exportToJSON: () => string;
  clear: () => void;
  refresh: () => void;
}

export function useAddressBook(): UseAddressBookReturn {
  const [entries, setEntries] = useState<AddressEntry[]>([]);
  const [favorites, setFavorites] = useState<AddressEntry[]>([]);

  const refresh = useCallback(() => {
    setEntries(addressBook.getAllEntries());
    setFavorites(addressBook.getFavorites());
  }, []);

  // Load on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  const addEntry = useCallback(
    (address: string, label: string, options?: Partial<AddressEntry>) => {
      const entry = addressBook.addEntry(address, label, options);
      refresh();
      return entry;
    },
    [refresh]
  );

  const removeEntry = useCallback(
    (address: string) => {
      const result = addressBook.removeEntry(address);
      refresh();
      return result;
    },
    [refresh]
  );

  const getLabel = useCallback((address: string) => {
    return addressBook.getLabel(address);
  }, []);

  const toggleFavorite = useCallback(
    (address: string) => {
      const result = addressBook.toggleFavorite(address);
      refresh();
      return result;
    },
    [refresh]
  );

  const search = useCallback((query: string) => {
    return addressBook.search(query);
  }, []);

  const importFromJSON = useCallback(
    (json: string, merge?: boolean) => {
      const count = addressBook.importFromJSON(json, merge);
      refresh();
      return count;
    },
    [refresh]
  );

  const exportToJSON = useCallback(() => {
    return addressBook.exportToJSON();
  }, []);

  const clear = useCallback(() => {
    addressBook.clear();
    refresh();
  }, [refresh]);

  return {
    entries,
    favorites,
    addEntry,
    removeEntry,
    getLabel,
    toggleFavorite,
    search,
    importFromJSON,
    exportToJSON,
    clear,
    refresh,
  };
}

export default useAddressBook;
