import { useState, useMemo } from "react";
import { useAddressBook } from "@/hooks/useAddressBook";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BookOpen,
  Plus,
  Search,
  Star,
  StarOff,
  Trash2,
  Upload,
  Download,
  MoreVertical,
  Copy,
  Check,
  Edit,
} from "lucide-react";
import { toast } from "sonner";

interface AddressBookProps {
  onSelectAddress?: (address: string) => void;
}

export const AddressBook = ({ onSelectAddress }: AddressBookProps) => {
  const {
    entries,
    favorites,
    addEntry,
    removeEntry,
    toggleFavorite,
    search,
    importFromJSON,
    exportToJSON,
  } = useAddressBook();

  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [newAddress, setNewAddress] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [importJson, setImportJson] = useState("");
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) {
      return entries;
    }
    return search(searchQuery);
  }, [entries, searchQuery, search]);

  const handleAddEntry = () => {
    if (!newAddress.trim() || !newLabel.trim()) {
      toast.error("Address and label are required");
      return;
    }

    try {
      addEntry(newAddress.trim(), newLabel.trim(), {
        notes: newNotes.trim() || undefined,
      });
      toast.success("Address added to address book");
      setNewAddress("");
      setNewLabel("");
      setNewNotes("");
      setIsAddDialogOpen(false);
    } catch (error) {
      toast.error("Failed to add address");
    }
  };

  const handleCopyAddress = async (address: string) => {
    await navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    toast.success("Address copied");
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const handleDeleteEntry = (address: string) => {
    removeEntry(address);
    toast.success("Address removed from address book");
  };

  const handleToggleFavorite = (address: string) => {
    const isFavorite = toggleFavorite(address);
    toast.success(isFavorite ? "Added to favorites" : "Removed from favorites");
  };

  const handleExport = () => {
    try {
      const json = exportToJSON();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `zcash-address-book-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Address book exported");
    } catch (error) {
      toast.error("Failed to export address book");
    }
  };

  const handleImport = () => {
    if (!importJson.trim()) {
      toast.error("Please paste JSON to import");
      return;
    }

    try {
      const count = importFromJSON(importJson, true);
      toast.success(`Imported ${count} addresses`);
      setImportJson("");
      setIsImportDialogOpen(false);
    } catch (error) {
      toast.error("Failed to import. Invalid JSON format.");
    }
  };

  const getAddressTypeColor = (type: string) => {
    switch (type) {
      case "transparent":
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
      case "sapling":
        return "bg-purple-500/20 text-purple-300 border-purple-500/30";
      case "orchard":
        return "bg-purple-500/20 text-purple-300 border-purple-500/30";
      case "unified":
        return "bg-accent/20 text-accent border-accent/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card className="card-glow bg-card/50 backdrop-blur-sm border-accent/10">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-accent" />
            Address Book
          </h2>
          <div className="flex items-center gap-2">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-accent/30"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Address</DialogTitle>
                  <DialogDescription>
                    Save an address with a label for easy identification
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Address
                    </label>
                    <Input
                      placeholder="t1..., zs1..., or u1..."
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Label
                    </label>
                    <Input
                      placeholder="e.g., My Wallet, Friend's Address"
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Notes (optional)
                    </label>
                    <Input
                      placeholder="Additional notes..."
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAddEntry}>Add to Address Book</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-accent/30"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExport}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsImportDialogOpen(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search addresses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Favorites Section */}
      {favorites.length > 0 && !searchQuery && (
        <div className="p-4 border-b border-border bg-accent/5">
          <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500" />
            Favorites
          </h3>
          <div className="flex flex-wrap gap-2">
            {favorites.map((entry) => (
              <Button
                key={entry.address}
                variant="outline"
                size="sm"
                className="border-accent/30"
                onClick={() => onSelectAddress?.(entry.address)}
              >
                {entry.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Address List */}
      <div className="divide-y divide-border max-h-96 overflow-y-auto">
        {filteredEntries.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {searchQuery ? (
              <p>No addresses match your search</p>
            ) : (
              <>
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Your address book is empty</p>
                <p className="text-sm">
                  Add addresses to label them for easy identification
                </p>
              </>
            )}
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <div
              key={entry.address}
              className="p-4 hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{entry.label}</span>
                    <Badge
                      variant="outline"
                      className={getAddressTypeColor(entry.type)}
                    >
                      {entry.type}
                    </Badge>
                    {entry.isFavorite && (
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    )}
                  </div>
                  <p className="font-mono text-sm text-muted-foreground truncate">
                    {entry.address}
                  </p>
                  {entry.notes && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {entry.notes}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleCopyAddress(entry.address)}
                  >
                    {copiedAddress === entry.address ? (
                      <Check className="w-4 h-4 text-terminal-green" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleToggleFavorite(entry.address)}
                  >
                    {entry.isFavorite ? (
                      <StarOff className="w-4 h-4" />
                    ) : (
                      <Star className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDeleteEntry(entry.address)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Address Book</DialogTitle>
            <DialogDescription>
              Paste a JSON export from another wallet or backup
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <textarea
              placeholder='{"entries": [...], "version": 1}'
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              className="w-full h-48 p-3 rounded-lg bg-secondary border border-border font-mono text-sm resize-none"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsImportDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleImport}>Import</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AddressBook;
