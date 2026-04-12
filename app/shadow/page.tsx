"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileSearch,
  Upload,
  Search,
  FileText,
  ChevronRight,
  Loader2,
  AlertTriangle,
} from "lucide-react";

interface VaultDocument {
  id: string;
  original_filename: string;
  document_type: string;
  jurisdiction: string;
  entity_name: string | null;
  overall_risk_score: number;
}

const RISK_COLOR = (score: number) => {
  if (score >= 75) return "text-red-400 border-red-900/50 bg-red-950/20";
  if (score >= 50) return "text-amber-400 border-amber-900/50 bg-amber-950/20";
  if (score >= 25)
    return "text-amber-300 border-amber-900/50 bg-amber-950/10";
  return "text-emerald-400 border-emerald-900/50 bg-emerald-950/20";
};

export default function ShadowLandingPage() {
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
        console.error("[Shadow] Failed to fetch documents:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, []);

  const filtered = documents.filter((d) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const filename = (d.original_filename || "Unnamed").toLowerCase();
    const docType = (d.document_type || "unknown").toLowerCase();
    const entity = (d.entity_name || "").toLowerCase();
    return filename.includes(q) || docType.includes(q) || entity.includes(q);
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-200 px-4 sm:px-6 lg:px-8 py-12">
      <div className="relative mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 border border-amber-900/50 bg-amber-950/10">
              <FileSearch className="h-6 w-6 text-amber-500" />
            </div>
            <h1 className="text-sm font-mono uppercase tracking-widest text-neutral-200">
              SHADOW_AGREEMENT_DETECTOR
            </h1>
          </div>
          <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-500 max-w-xl mx-auto leading-relaxed mt-2">
            DID THE BROKER PROMISE FREE PARKING? DID HR PROMISE A BONUS OVER
            EMAIL? CHECK IF YOUR INFORMAL PROMISES MATCH THE FINAL FORMAL
            CONTRACT.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Upload New */}
          <div className="md:col-span-1">
            <div className="border border-neutral-900 bg-[#0a0a0a] p-6 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
              <div className="p-4 border border-cyan-900/50 bg-cyan-950/10 mb-4">
                <Upload className="h-6 w-6 text-cyan-400" />
              </div>
              <h3 className="text-[9px] font-mono uppercase tracking-widest text-neutral-200 mb-2">
                NEW CONTRACT
              </h3>
              <p className="text-[8px] font-mono uppercase tracking-widest text-neutral-600 mb-6 leading-relaxed">
                UPLOAD A NEW FORMAL CONTRACT FIRST, THEN ADD YOUR EVIDENCE OF
                PROMISES.
              </p>
              <Link
                href="/upload"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-cyan-900/50 bg-cyan-950/10 font-mono uppercase tracking-widest text-[8px] text-cyan-400 hover:text-cyan-300 hover:border-cyan-800 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                ANALYZE NEW CONTRACT
              </Link>
            </div>
          </div>

          {/* Right Column: Select Existing */}
          <div className="md:col-span-2">
            <div className="border border-neutral-900 bg-[#0a0a0a] p-6">
              <h3 className="text-[9px] font-mono uppercase tracking-widest text-neutral-200 mb-1">
                SELECT FROM VAULT
              </h3>
              <p className="text-[8px] font-mono uppercase tracking-widest text-neutral-600 mb-6">
                SELECT A PREVIOUSLY ANALYZED CONTRACT TO CHECK SHADOW
                AGREEMENTS.
              </p>

              {/* Search */}
              <div className="relative flex-1 mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-600" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search contracts..."
                  className="w-full pl-9 pr-3 py-2.5 bg-[#050505] border border-neutral-800 text-sm font-mono text-neutral-300 focus:outline-none focus:border-neutral-600 transition-colors placeholder:text-neutral-700"
                />
              </div>

              {/* List */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin mb-4 text-amber-500/50" />
                  <p className="text-[8px] font-mono uppercase tracking-widest text-neutral-600">
                    LOADING CONTRACTS...
                  </p>
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-8 h-8 mx-auto mb-3 text-neutral-800" />
                  <p className="text-[8px] font-mono uppercase tracking-widest text-neutral-600">
                    NO ANALYZED CONTRACTS FOUND.
                  </p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[8px] font-mono uppercase tracking-widest text-neutral-600">
                    NO CONTRACTS MATCH YOUR SEARCH.
                  </p>
                </div>
              ) : (
                <div className="space-y-1 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  <AnimatePresence>
                    {filtered.map((doc, index) => {
                      const riskColor = RISK_COLOR(doc.overall_risk_score);
                      return (
                        <motion.div
                          key={doc.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: index * 0.03 }}
                        >
                          <Link href={`/shadow/${doc.id}`}>
                            <div className="border border-neutral-900 bg-[#050505] hover:border-neutral-700 transition-colors group cursor-pointer p-4 flex items-center gap-4 mb-1">
                              <div className="w-8 h-8 border border-amber-900/50 bg-amber-950/10 flex items-center justify-center flex-shrink-0">
                                <FileText className="w-4 h-4 text-amber-500/70" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-300 truncate group-hover:text-amber-400 transition-colors">
                                  {doc.original_filename || "Unnamed Document"}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[7px] font-mono uppercase tracking-widest text-neutral-600 px-1.5 py-0.5 border border-neutral-800 bg-[#0a0a0a]">
                                    {(doc.document_type || "unknown").replace(
                                      /_/g,
                                      " ",
                                    )}
                                  </span>
                                  {doc.entity_name && (
                                    <span className="text-[7px] font-mono text-neutral-600 truncate">
                                      {doc.entity_name}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-2">
                                <span
                                  className={`text-[7px] font-mono uppercase tracking-widest px-1.5 py-0.5 border ${riskColor}`}
                                >
                                  RISK: {doc.overall_risk_score}/100
                                </span>
                                <ChevronRight className="w-3 h-3 text-neutral-700 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
