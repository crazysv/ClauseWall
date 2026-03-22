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
  if (score >= 75) return "text-red-400 bg-red-500/10";
  if (score >= 50) return "text-orange-400 bg-orange-500/10";
  if (score >= 25) return "text-yellow-400 bg-yellow-500/10";
  return "text-green-400 bg-green-500/10";
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
      <div className="text-center py-8 text-white/40">
        <FileText className="w-8 h-8 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No analyzed contracts found.</p>
        <p className="text-xs mt-1">Upload and analyze contracts first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search + Select All/None */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contracts..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-indigo-500/30"
          />
        </div>
        <button
          onClick={selectAll}
          className="px-3 py-2 text-xs text-white/40 hover:text-white/60 bg-white/[0.03] border border-white/10 rounded-lg transition-colors"
        >
          All
        </button>
        <button
          onClick={selectNone}
          className="px-3 py-2 text-xs text-white/40 hover:text-white/60 bg-white/[0.03] border border-white/10 rounded-lg transition-colors"
        >
          None
        </button>
      </div>

      {/* Selection count */}
      <p className="text-xs text-white/30">
        {selectedIds.length} of {documents.length} selected
        {selectedIds.length < 2 && (
          <span className="text-yellow-400 ml-2">
            (minimum 2 required)
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
                className={`cursor-pointer transition-all ${
                  isSelected
                    ? "bg-indigo-500/10 border-indigo-500/30"
                    : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04]"
                }`}
                onClick={() => toggleDoc(doc.id)}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  {/* Checkbox */}
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${
                      isSelected
                        ? "bg-indigo-500 border-indigo-500"
                        : "border-white/20 bg-white/5"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/80 truncate">
                      {doc.original_filename || "Unnamed Document"}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-white/30 capitalize">
                        {(doc.document_type || "unknown").replace(/_/g, " ")}
                      </span>
                      {doc.entity_name && (
                        <span className="text-[10px] text-white/30">
                          · {doc.entity_name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Risk Badge */}
                  <Badge className={`${riskColor} text-[10px] border-0`}>
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
