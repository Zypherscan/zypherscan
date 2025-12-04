import { useState } from "react";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Download, FileJson, FileSpreadsheet, Calendar } from "lucide-react";
import { DecryptedTransaction } from "@/lib/zcash-crypto";
import { exportService } from "@/lib/export";
import { toast } from "sonner";

interface ExportDialogProps {
  transactions: DecryptedTransaction[];
  trigger?: React.ReactNode;
}

type ExportFormat = "csv" | "json";
type DateRange = "all" | "30d" | "90d" | "year";

export const ExportDialog = ({ transactions, trigger }: ExportDialogProps) => {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [includeLabels, setIncludeLabels] = useState(true);
  const [includeIncoming, setIncludeIncoming] = useState(true);
  const [includeOutgoing, setIncludeOutgoing] = useState(true);
  const [includeInternal, setIncludeInternal] = useState(true);

  const handleExport = () => {
    const types: ("incoming" | "outgoing" | "internal")[] = [];
    if (includeIncoming) types.push("incoming");
    if (includeOutgoing) types.push("outgoing");
    if (includeInternal) types.push("internal");

    if (types.length === 0) {
      toast.error("Please select at least one transaction type");
      return;
    }

    let dateRangeObj: { start: Date; end: Date } | undefined;
    const now = new Date();

    switch (dateRange) {
      case "30d":
        dateRangeObj = {
          start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          end: now,
        };
        break;
      case "90d":
        dateRangeObj = {
          start: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
          end: now,
        };
        break;
      case "year":
        dateRangeObj = {
          start: new Date(now.getFullYear(), 0, 1),
          end: new Date(now.getFullYear(), 11, 31, 23, 59, 59),
        };
        break;
    }

    try {
      if (format === "csv") {
        exportService.downloadCSV(
          transactions.filter((tx) => {
            if (!types.includes(tx.type)) return false;
            if (dateRangeObj) {
              return (
                tx.timestamp >= dateRangeObj.start &&
                tx.timestamp <= dateRangeObj.end
              );
            }
            return true;
          })
        );
      } else {
        exportService.downloadJSON(
          transactions.filter((tx) => {
            if (!types.includes(tx.type)) return false;
            if (dateRangeObj) {
              return (
                tx.timestamp >= dateRangeObj.start &&
                tx.timestamp <= dateRangeObj.end
              );
            }
            return true;
          })
        );
      }
      toast.success(`Transactions exported as ${format.toUpperCase()}`);
      setOpen(false);
    } catch (error) {
      toast.error("Failed to export transactions");
    }
  };

  const filteredCount = transactions.filter((tx) => {
    const types: ("incoming" | "outgoing" | "internal")[] = [];
    if (includeIncoming) types.push("incoming");
    if (includeOutgoing) types.push("outgoing");
    if (includeInternal) types.push("internal");

    if (!types.includes(tx.type)) return false;

    const now = new Date();
    let start: Date | null = null;

    switch (dateRange) {
      case "30d":
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "year":
        start = new Date(now.getFullYear(), 0, 1);
        break;
    }

    if (start) {
      return tx.timestamp >= start;
    }
    return true;
  }).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="border-accent/30">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Transactions</DialogTitle>
          <DialogDescription>
            Download your transaction history in CSV or JSON format
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={format === "csv" ? "secondary" : "outline"}
                className={`justify-start ${
                  format === "csv" ? "border-accent" : ""
                }`}
                onClick={() => setFormat("csv")}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button
                variant={format === "json" ? "secondary" : "outline"}
                className={`justify-start ${
                  format === "json" ? "border-accent" : ""
                }`}
                onClick={() => setFormat("json")}
              >
                <FileJson className="w-4 h-4 mr-2" />
                JSON
              </Button>
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <Label>Date Range</Label>
            <Select
              value={dateRange}
              onValueChange={(value) => setDateRange(value as DateRange)}
            >
              <SelectTrigger>
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Transaction Types */}
          <div className="space-y-3">
            <Label>Transaction Types</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="incoming"
                  checked={includeIncoming}
                  onCheckedChange={(checked) =>
                    setIncludeIncoming(checked as boolean)
                  }
                />
                <label
                  htmlFor="incoming"
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  Incoming (received)
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="outgoing"
                  checked={includeOutgoing}
                  onCheckedChange={(checked) =>
                    setIncludeOutgoing(checked as boolean)
                  }
                />
                <label
                  htmlFor="outgoing"
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  Outgoing (sent)
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="internal"
                  checked={includeInternal}
                  onCheckedChange={(checked) =>
                    setIncludeInternal(checked as boolean)
                  }
                />
                <label
                  htmlFor="internal"
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  Internal (self-transfers)
                </label>
              </div>
            </div>
          </div>

          {/* Address Labels */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="labels"
              checked={includeLabels}
              onCheckedChange={(checked) =>
                setIncludeLabels(checked as boolean)
              }
            />
            <label
              htmlFor="labels"
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Include address labels from address book
            </label>
          </div>

          {/* Preview Count */}
          <div className="p-3 rounded-lg bg-secondary/50 border border-border">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {filteredCount}
              </span>{" "}
              transactions will be exported
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={filteredCount === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export {format.toUpperCase()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;
