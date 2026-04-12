"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, FileText, Loader2, Search } from "lucide-react";

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
  if (score >= 75)
    return "text-red-500 border-red-900/50 bg-red-950/20";
  if (score >= 50)
    return "text-amber-500 border-amber-900/50 bg-amber-950/20";
  if (score >= 25)
    return "text-yellow-500 border-yellow-900/50 bg-yellow-950/20";
  return "text-emerald-500 border-emerald-900/50 bg-emerald-950/20";
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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-neutral-600 mr-3" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-600">
          LOADING_PAYLOAD_INDEX...
        </span>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 border border-neutral-900 bg-[#050505]">
        <FileText className="w-8 h-8 mx-auto mb-4 text-neutral-700" />
        <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
          NO ANALYZED PAYLOADS FOUND.
        </p>
        <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-600 mt-2">
          UPLOAD AND ANALYZE CONTRACTS FIRST.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search + Select All/None */}
      <div className="flex gap-3 flex-wrap sm:flex-nowrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="SEARCH PAYLOADS..."
            className="w-full pl-10 pr-4 py-2.5 border border-neutral-800 bg-[#050505] text-[10px] font-mono uppercase tracking-widest text-neutral-300 placeholder:text-neutral-700 focus:outline-none focus:border-cyan-900/50 transition-colors"
          />
        </div>
        <button
          onClick={selectAll}
          className="px-5 py-2.5 text-[9px] font-mono uppercase tracking-widest text-neutral-500 bg-[#050505] border border-neutral-800 hover:text-white hover:border-neutral-600 transition-colors"
        >
          ALL
        </button>
        <button
          onClick={selectNone}
          className="px-5 py-2.5 text-[9px] font-mono uppercase tracking-widest text-neutral-500 bg-[#050505] border border-neutral-800 hover:text-white hover:border-neutral-600 transition-colors"
        >
          NONE
        </button>
      </div>

      {/* Selection count */}
      <div className="flex items-center gap-3 text-[9px] font-mono uppercase tracking-widest text-neutral-600 pt-1">
        <span className="text-neutral-300 bg-neutral-900 border border-neutral-800 px-2 py-0.5">
          {selectedIds.length}
        </span>
        OF {documents.length} SELECTED
        {selectedIds.length < 2 && (
          <span className="text-amber-500 border border-amber-900/50 bg-amber-950/20 px-2 py-0.5 text-[8px]">
            MINIMUM 2 REQUIRED
          </span>
        )}
      </div>

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
              <div
                className={`cursor-pointer transition-colors border p-4 flex items-center gap-4 ${
                  isSelected
                    ? "bg-cyan-950/10 border-cyan-900/50"
                    : "bg-[#050505] border-neutral-900 hover:border-neutral-700"
                }`}
                onClick={() => toggleDoc(doc.id)}
              >
                {/* Checkbox */}
                <div
                  className={`w-5 h-5 flex items-center justify-center flex-shrink-0 border transition-colors ${
                    isSelected
                      ? "bg-cyan-500 border-cyan-500"
                      : "border-neutral-700 bg-transparent"
                  }`}
                >
                  {isSelected && (
                    <Check className="w-3 h-3 text-[#050505]" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono uppercase tracking-widest text-neutral-200 truncate">
                    {doc.original_filename || "UNNAMED DOCUMENT"}
                  </p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-[8px] font-mono uppercase tracking-widest text-neutral-500 bg-neutral-900 border border-neutral-800 px-1.5 py-0.5">
                      {(doc.document_type || "UNKNOWN").replace(/_/g, " ")}
                    </span>
                    {doc.entity_name && (
                      <span className="text-[8px] font-mono uppercase tracking-widest text-neutral-600 flex items-center gap-1">
                        <span className="text-neutral-700">
                          //
                        </span>{" "}
                        {doc.entity_name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Risk Badge */}
                <span
                  className={`${riskColor} text-[9px] font-mono uppercase tracking-widest border px-2 py-0.5 flex-shrink-0`}
                >
                  {doc.overall_risk_score}/100
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
