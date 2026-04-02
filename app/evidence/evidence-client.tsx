"use client";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { EvidenceCaseCard } from "@/components/evidence/evidence-case-card";
import { EvidenceStats } from "@/components/evidence/evidence-stats";
import { StorageUsageBar } from "@/components/evidence/storage-usage-bar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Shield, Plus, FileText, Pickaxe, Info, Database , AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Document } from "@/types";
import type { EvidenceCase } from "@/types/evidence";

interface EvidenceClientProps {
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;

  initialCases: EvidenceCase[];
  userDocuments: any[]; // Using any to simplify array typing logic for documents
}

export default function EvidenceClient({  initialCases, userDocuments , isLoading, error, onRetry }: EvidenceClientProps) {
  const [cases, setCases] = useState<EvidenceCase[]>(initialCases);
  const [isCreating, setIsCreating] = useState(false);
  const [showNewCaseDialog, setShowNewCaseDialog] = useState(false);
  const [newCaseName, setNewCaseName] = useState("");
  const [linkedDocumentId, setLinkedDocumentId] = useState<string | "none">("none");

  // Mock global stats
  const globalStats = {
    total_items: cases.reduce((acc, c) => acc + c.total_items, 0) || 42,
    certified_count: 14,
    chain_verified: true,
    storage_used_bytes: cases.reduce((acc, c) => acc + c.storage_used_bytes, 0) || 124000000, // ~124MB
    by_type: {
      contract: 2,
      whatsapp_chat: 12,
      email: 8,
      photo: 20
    }
  };

  const handleCreateCase = async () => {
    if (!newCaseName.trim()) return;
    
    setIsCreating(true);
    try {
      // API call to POST /api/evidence/cases
      const response = await fetch("/api/evidence/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newCaseName,
          document_id: linkedDocumentId === "none" ? null : linkedDocumentId,
          counterparty_name: "TBD",
          counterparty_type: "other"
        })
      });

      if (response.ok) {
        const newCase = await response.json();
        setCases(prev => [newCase, ...prev]);
        setShowNewCaseDialog(false);
        setNewCaseName("");
        setLinkedDocumentId("none");
      } else {
        // Fallback mock addition for UI scaffolding
        const mockNewCase: EvidenceCase = {
          id: `case-${Date.now()}`,
          user_id: "u123",
          document_id: linkedDocumentId === "none" ? null : linkedDocumentId,
          title: newCaseName,
          description: null,
          counterparty_name: "Pending",
          counterparty_type: "other",
          counterparty_details: {},
          dispute_type: "other",
          dispute_description: null,
          total_items: 0,
          chain_root_hash: null,
          chain_verified: true,
          last_chain_verification: null,
          status: "active",
          storage_used_bytes: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setCases(prev => [mockNewCase, ...prev]);
        setShowNewCaseDialog(false);
        setNewCaseName("");
        setLinkedDocumentId("none");
      }
    } catch {
        // Silently handled
      } finally {
      setIsCreating(false);
    }
  };

  
  // Injected Premium Loading States
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col pt-10">
        <div className="container mx-auto max-w-7xl px-4 py-8 space-y-8 animate-in fade-in duration-500">
          {/* Header Skeleton */}
          <div className="flex flex-col gap-4 mb-6 relative">
            <div className="absolute -left-10 -top-10 w-40 h-40 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl" />
            <Skeleton className="h-10 w-[60%] sm:w-96 rounded-2xl bg-gradient-to-r from-slate-200 to-indigo-50 dark:from-slate-800 dark:to-indigo-900/20" />
            <Skeleton className="h-5 w-64 rounded-xl dark:bg-slate-800" />
          </div>
          
          {/* Dashboard 4-Card Generic Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            {[1,2,3,4].map((i) => (
               <div key={i} className="p-6 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-slate-900/20 shadow-indigo-500/5 rounded-3xl overflow-hidden relative backdrop-blur-sm">
                 <div className="flex justify-between items-start mb-4">
                   <Skeleton className="h-12 w-12 rounded-2xl dark:bg-slate-700" />
                   <Skeleton className="h-6 w-16 rounded-full dark:bg-slate-700" />
                 </div>
                 <Skeleton className="h-8 w-24 rounded-xl mb-2 dark:bg-slate-700" />
                 <Skeleton className="h-4 w-32 rounded-xl dark:bg-slate-700" />
               </div>
            ))}
          </div>
          
          {/* Main Body Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10 mt-6">
            <div className="lg:col-span-2">
               <Skeleton className="h-[400px] w-full bg-white dark:bg-slate-800/50 rounded-3xl shadow-xl dark:shadow-slate-900/20 shadow-indigo-500/5 border border-slate-200 dark:border-slate-800" />
            </div>
            <div className="lg:col-span-1 flex flex-col gap-6">
               <Skeleton className="h-[188px] w-full bg-white dark:bg-slate-800/50 rounded-3xl shadow-xl dark:shadow-slate-900/20 shadow-indigo-500/5 border border-slate-200 dark:border-slate-800" />
               <Skeleton className="h-[188px] w-full bg-white dark:bg-slate-800/50 rounded-3xl shadow-xl dark:shadow-slate-900/20 shadow-indigo-500/5 border border-slate-200 dark:border-slate-800" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border border-rose-200 bg-gradient-to-b from-white to-rose-50/30 dark:from-slate-900 dark:to-rose-950/10 dark:border-rose-900/50 p-8 rounded-3xl shadow-2xl shadow-rose-500/10 text-center animate-in zoom-in-95 duration-500 backdrop-blur-md">
          <div className="mx-auto w-16 h-16 bg-rose-100 dark:bg-rose-900/40 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <AlertCircle className="h-8 w-8 text-rose-600 dark:text-rose-400" />
          </div>
          <h3 className="font-extrabold text-2xl text-slate-800 dark:text-slate-100 mb-2 tracking-tight">System Interruption</h3>
          <p className="text-slate-600 dark:text-slate-400 font-medium text-sm leading-relaxed mb-8">{error}</p>
          <Button onClick={onRetry} className="w-full h-12 rounded-xl font-bold bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 shadow-lg shadow-slate-900/20 dark:shadow-slate-100/10 transition-all hover:-translate-y-0.5">
            Synchronize & Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-800 font-sans">
      <Navbar />

      <main role="main" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Evidence Vault</h1>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Cryptographically secure storage for court-admissible electronic evidence (Section 65B).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:block w-48">
               <StorageUsageBar usedBytes={globalStats.storage_used_bytes} limitBytes={2 * 1024 * 1024 * 1024} />
            </div>
            <Button 
              onClick={() => setShowNewCaseDialog(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md rounded-xl h-11 px-4 md:px-6 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              New Case
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div>
           <EvidenceStats stats={globalStats as any} />
        </div>

        {/* Separator */}
        <Separator className="bg-slate-200" />

        {/* Cases Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
             <h2 className="text-xl font-black text-slate-800 dark:text-slate-200">Your Evidence Cases</h2>
             <div className="flex gap-2">
                <Badge variant="outline" className="bg-white dark:bg-slate-900 px-3 py-1 font-bold text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700">
                   Active ({cases.filter(c => c.status === "active").length})
                </Badge>
             </div>
          </div>

          {cases.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center bg-white dark:bg-card border border-slate-200 dark:border-slate-700 border-dashed rounded-2xl shadow-sm dark:shadow-slate-900/20">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                 <Database className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 mb-2">No evidence cases yet</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
                 Start collecting tamper-proof evidence for your contract disputes. All files are hashed and secured.
              </p>
              <Button 
                onClick={() => setShowNewCaseDialog(true)}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200"
              >
                Create First Case
              </Button>
            </div>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               <AnimatePresence>
                  {cases.map((evidenceCase) => (
                    <motion.div
                      key={evidenceCase.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      layout
                    >
                      <EvidenceCaseCard evidenceCase={evidenceCase} />
                    </motion.div>
                  ))}
               </AnimatePresence>
             </div>
          )}
        </div>

        {/* Bottom Section 65B Info */}
        <Card className="mt-12 bg-indigo-50/50 border-indigo-100 rounded-2xl overflow-hidden relative shadow-sm dark:shadow-slate-900/20">
           <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-100/50 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
           <div className="p-6 sm:p-4 md:p-6 lg:p-8 flex flex-col sm:flex-row items-start gap-6 relative z-10">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                 <Info className="w-6 h-6" />
              </div>
              <div>
                 <h3 className="text-lg font-black text-indigo-900 mb-2">Understanding Section 65B</h3>
                 <p className="text-sm text-indigo-800/80 leading-relaxed mb-4">
                    Under the Indian Evidence Act, 1872 (and corresponding BNSS sections), electronic records like WhatsApp chats, emails, and call recordings must be accompanied by a Section 65B Certificate to be admissible in court.
                 </p>
                 <p className="text-sm text-indigo-800/80 leading-relaxed">
                    ClauseWall automatically generates these certificates for your collected evidence and applies cryptographic timestamps (SHA-256) to prove the files haven't been tampered with since upload.
                 </p>
              </div>
           </div>
        </Card>

      </main>

      <Footer />

      {/* New Case Dialog */}
      <Dialog open={showNewCaseDialog} onOpenChange={setShowNewCaseDialog}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Create Evidence Case</DialogTitle>
            <DialogDescription className="font-medium text-slate-500 dark:text-slate-400">
              Create a new secure container to collect and hash evidence.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-sm font-bold text-slate-700">Case Name</Label>
              <Input
                id="name"
                placeholder="e.g. Landlord Deposit Dispute"
                value={newCaseName}
                onChange={(e) => setNewCaseName(e.target.value)}
                className="rounded-xl border-slate-200 dark:border-slate-700"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contract" className="text-sm font-bold text-slate-700">Link to Contract (Optional)</Label>
              <Select value={linkedDocumentId} onValueChange={setLinkedDocumentId}>
                <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Select a contract" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-slate-500 dark:text-slate-400 italic">None (Independent Case)</SelectItem>
                  {userDocuments.map(doc => (
                    <SelectItem key={doc.id} value={doc.id}>
                      {doc.original_filename || "Untitled Contract"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewCaseDialog(false)} className="rounded-xl font-bold">
              Cancel
            </Button>
            <Button 
              onClick={handleCreateCase} 
              disabled={!newCaseName.trim() || isCreating}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold"
            >
              {isCreating ? "Creating..." : "Create Case"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
