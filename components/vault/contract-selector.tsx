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
  if (score >= 75) return "text-red-700 bg-red-100";
  if (score >= 50) return "text-orange-700 bg-orange-100";
  if (score >= 25) return "text-yellow-700 bg-yellow-100";
  return "text-emerald-700 bg-emerald-100";
};

export function ContractSelector({
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
      } catch {
        // Silently handled
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
      <div className="text-center py-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 border-dashed rounded-3xl">
        <FileText className="w-10 h-10 mx-auto mb-4 text-slate-300" />
        <p className="text-sm font-black text-slate-800 dark:text-slate-200 tracking-tight">No analyzed contracts found.</p>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Upload and analyze contracts first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search + Select All/None */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contracts..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-card border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20 text-sm font-medium text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <button
          onClick={selectAll}
          className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-100 bg-white dark:bg-card border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
        >
          All
        </button>
        <button
          onClick={selectNone}
          className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-100 bg-white dark:bg-card border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
        >
          None
        </button>
      </div>

      {/* Selection count */}
      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">
        {selectedIds.length} of {documents.length} selected
        {selectedIds.length < 2 && (
          <span className="text-orange-600 ml-2">
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
                className={`cursor-pointer transition-all shadow-sm dark:shadow-slate-900/20 rounded-2xl ${ isSelected ? "bg-indigo-50 border-indigo-200" : "bg-white dark:bg-card border-slate-200 dark:border-slate-700 hover:border-indigo-300" }`}
                onClick={() => toggleDoc(doc.id)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  {/* Checkbox */}
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 border transition-all ${ isSelected ? "bg-indigo-600 border-indigo-700" : "border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800" }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-900 dark:text-slate-100 truncate">
                      {doc.original_filename || "Unnamed Document"}
                    </p>
                    <div className="flex items-center gap-2 mt-1 -ml-0.5">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">
                        {(doc.document_type || "unknown").replace(/_/g, " ")}
                      </span>
                      {doc.entity_name && (
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest before:content-['·'] before:mr-2 before:text-slate-300">
                          {doc.entity_name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Risk Badge */}
                  <Badge className={`${riskColor} text-[10px] font-black uppercase tracking-widest border-0 px-2 rounded-full`}>
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
