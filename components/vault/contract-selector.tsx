"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, FileText, Loader2, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface VaultDocument {
  id: string;
  original_filename: string;
  document_type: string;
  jurisdiction: string;
  entity_name: string | null;
  overall_risk_score: number;
  total_clauses: number;
}

interface ContractSelectorProps {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

const RISK_COLOR = (score: number) => {
  if (score >= 75) return "text-red-600 dark:text-red-500 border-red-500 bg-red-100 dark:bg-red-950";
  if (score >= 50) return "text-orange-600 dark:text-orange-500 border-orange-500 bg-orange-100 dark:bg-orange-950";
  if (score >= 25) return "text-yellow-600 dark:text-yellow-500 border-yellow-500 bg-yellow-100 dark:bg-yellow-950";
  return "text-green-600 dark:text-green-500 border-green-500 bg-green-100 dark:bg-green-950";
};

export default function ContractSelector({
  selectedIds,
  onSelectionChange,
}: ContractSelectorProps) {
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await fetch("/api/vault/documents");
        if (res.ok) {
          const data = await res.json();
          setDocuments(data.documents || []);
        }
      } catch (error) {
        console.error("[Vault] Failed to fetch documents:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, []);

  const toggleDoc = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((sid) => sid !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const selectAll = () => {
    onSelectionChange(documents.map((d) => d.id));
  };

  const selectNone = () => {
    onSelectionChange([]);
  };

  const filtered = documents.filter((d) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    
    // Safely fallback strings to empty if null to prevent crashes
    const filename = (d.original_filename || "Unnamed Document").toLowerCase();
    const docType = (d.document_type || "unknown").toLowerCase();
    const entity = (d.entity_name || "").toLowerCase();

    return filename.includes(q) || docType.includes(q) || entity.includes(q);
  });

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full rounded-lg" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 border-4 border-black bg-gray-50 dark:bg-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <FileText className="w-12 h-12 mx-auto mb-4 stroke-[3px] text-muted-foreground" />
        <p className="text-base font-black uppercase tracking-widest text-foreground">NO ANALYZED CONTRACTS FOUND.</p>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-2">UPLOAD AND ANALYZE CONTRACTS FIRST.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search + Select All/None */}
      <div className="flex gap-3 flex-wrap sm:flex-nowrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground stroke-[3px]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="SEARCH CONTRACTS..."
            className="w-full pl-10 pr-4 py-3 border-4 border-black bg-white dark:bg-zinc-900 text-sm font-black uppercase tracking-widest text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-4 focus:ring-indigo-500/30 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          />
        </div>
        <button
          onClick={selectAll}
          className="px-6 py-3 text-xs font-black uppercase tracking-widest text-foreground bg-white dark:bg-zinc-900 border-4 border-black hover:-translate-y-1 hover:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
        >
          ALL
        </button>
        <button
          onClick={selectNone}
          className="px-6 py-3 text-xs font-black uppercase tracking-widest text-foreground bg-white dark:bg-zinc-900 border-4 border-black hover:-translate-y-1 hover:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
        >
          NONE
        </button>
      </div>

      {/* Selection count */}
      <p className="text-xs font-black uppercase tracking-widest text-muted-foreground pt-2">
        <span className="text-foreground bg-white dark:bg-zinc-900 px-2 py-0.5 border-2 border-black inline-block mr-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">{selectedIds.length}</span> OF {documents.length} SELECTED
        {selectedIds.length < 2 && (
          <span className="text-yellow-600 dark:text-yellow-500 ml-3 inline-block px-2 py-0.5 border-2 border-yellow-500 bg-yellow-100 dark:bg-yellow-950 font-bold">
            (MINIMUM 2 REQUIRED)
          </span>
        )}
      </p>

      {/* Document List */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        {filtered.map((doc, index) => {
          const isSelected = selectedIds.includes(doc.id);
          const riskColor = RISK_COLOR(doc.overall_risk_score);

          return (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Card
                className={`cursor-pointer transition-all border-4 rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-none ${
                  isSelected
                    ? "bg-indigo-50 dark:bg-indigo-950/30 border-black"
                    : "bg-white dark:bg-zinc-900 border-black"
                }`}
                onClick={() => toggleDoc(doc.id)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  {/* Checkbox */}
                  <div
                    className={`w-6 h-6 flex items-center justify-center flex-shrink-0 border-4 transition-colors ${
                      isSelected
                        ? "bg-black border-black dark:bg-white dark:text-black dark:border-white shadow-[2px_2px_0px_0px_rgba(81,73,246,1)]"
                        : "border-black bg-white dark:bg-black"
                    }`}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white dark:text-black stroke-[4px]" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-black uppercase tracking-widest text-foreground truncate">
                      {doc.original_filename || "UNNAMED DOCUMENT"}
                    </p>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 border-2 border-black">
                        {(doc.document_type || "UNKNOWN").replace(/_/g, " ")}
                      </span>
                      {doc.entity_name && (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                          <span className="text-black dark:text-white font-black">•</span> {doc.entity_name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Risk Badge */}
                  <Badge className={`${riskColor} text-[10px] font-black uppercase tracking-widest border-2 rounded-none px-2 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
                    {doc.overall_risk_score}/100
                  </Badge>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
