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
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface VaultDocument {
  id: string;
  original_filename: string;
  document_type: string;
  jurisdiction: string;
  entity_name: string | null;
  overall_risk_score: number;
}

const RISK_COLOR = (score: number) => {
  if (score >= 75) return "text-red-400 bg-red-500/10";
  if (score >= 50) return "text-orange-400 bg-orange-500/10";
  if (score >= 25) return "text-yellow-400 bg-yellow-500/10";
  return "text-green-400 bg-green-500/10";
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
    <div className="relative min-h-screen px-4 sm:px-6 lg:px-8 py-12">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <FileSearch className="h-8 w-8 text-amber-500" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold">
              Shadow <span className="text-amber-500">Agreement Detector</span>
            </h1>
          </div>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            Did the broker promise free parking? Did HR promise a bonus over email? 
            Check if your informal promises match the final formal contract.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column: Upload New */}
          <div className="md:col-span-1">
            <Card className="glass border-white/5 bg-white/[0.01] h-full">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
                <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                  <Upload className="h-8 w-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">New Contract</h3>
                <p className="text-sm text-white/50 mb-6">
                  Upload a new formal contract first, then you can add your evidence of promises.
                </p>
                <Link href="/upload" className="w-full">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 gap-2 shadow-lg shadow-blue-500/20">
                    <Upload className="w-4 h-4" />
                    Analyze New Contract
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Select Existing */}
          <div className="md:col-span-2">
            <Card className="glass border-white/5 bg-white/[0.01] h-full">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-1">Select from Vault</h3>
                <p className="text-sm text-white/50 mb-6">
                  Select a previously analyzed contract to check shadow agreements.
                </p>

                {/* Search */}
                <div className="relative flex-1 mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search contracts..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm focus:outline-none focus:border-amber-500/30 transition-colors"
                  />
                </div>

                {/* List */}
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-white/40">
                    <Loader2 className="w-8 h-8 animate-spin mb-4 text-amber-500/50" />
                    <p className="text-sm">Loading contracts...</p>
                  </div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-12 text-white/40">
                    <FileText className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">No analyzed contracts found.</p>
                  </div>
                ) : filtered.length === 0 ? (
                   <div className="text-center py-12 text-white/40">
                    <p className="text-sm">No contracts match your search.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
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
                              <Card className="glass border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-amber-500/30 transition-all group cursor-pointer">
                                <CardContent className="p-4 flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-5 h-5 text-amber-500/70" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white/90 truncate group-hover:text-amber-400 transition-colors">
                                      {doc.original_filename || "Unnamed Document"}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-[10px] text-white/40 capitalize bg-white/5 px-2 py-0.5 rounded-full">
                                        {(doc.document_type || "unknown").replace(/_/g, " ")}
                                      </span>
                                      {doc.entity_name && (
                                        <span className="text-[10px] text-white/40 truncate">
                                          {doc.entity_name}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex flex-col items-end gap-2">
                                    <Badge className={`${riskColor} text-[10px] border-0`}>
                                      Risk: {doc.overall_risk_score}/100
                                    </Badge>
                                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                                  </div>
                                </CardContent>
                              </Card>
                            </Link>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
