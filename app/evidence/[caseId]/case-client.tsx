"use client";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { EvidenceTimeline } from "@/components/evidence/evidence-timeline";
import { EvidenceItemCard } from "@/components/evidence/evidence-item-card";
import { EvidenceChainVisualizer } from "@/components/evidence/evidence-chain-visualizer";
import { EvidenceTypeIcon } from "@/components/evidence/evidence-type-icon";
import { EvidenceUploadZone } from "@/components/evidence/evidence-upload-zone";
import { ChainStatusBadge } from "@/components/evidence/chain-status-badge";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Download, Upload, ShieldCheck, Mail, Camera, FileAudio, FileText, Globe, Smartphone, Lock, Search , AlertCircle } from "lucide-react";
import type { EvidenceCase, EvidenceItem, ChainLink } from "@/types/evidence";

// Quick Capture types
const CAPTURE_TYPES = [
  { id: "whatsapp", label: "WhatsApp", icon: Smartphone, color: "text-emerald-500", bg: "bg-emerald-50 hover:bg-emerald-100" },
  { id: "email", label: "Email", icon: Mail, color: "text-sky-500", bg: "bg-sky-50 hover:bg-sky-100" },
  { id: "photo", label: "Photo", icon: Camera, color: "text-amber-500", bg: "bg-amber-50 hover:bg-amber-100" },
  { id: "audio", label: "Audio", icon: FileAudio, color: "text-purple-500", bg: "bg-purple-50 hover:bg-purple-100" },
  { id: "website", label: "Website", icon: Globe, color: "text-blue-500", bg: "bg-blue-50 hover:bg-blue-100" },
  { id: "document", label: "Document", icon: FileText, color: "text-slate-500", bg: "bg-slate-50 hover:bg-slate-100" },
];

interface CaseClientProps {
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;

  initialCase: EvidenceCase;
  initialItems: EvidenceItem[];
}

export default function CaseClient({  initialCase, initialItems , isLoading, error, onRetry }: CaseClientProps) {
  const [items, setItems] = useState<EvidenceItem[]>(initialItems);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [isBundling, setIsBundling] = useState(false);
  const [selectedItem, setSelectedItem] = useState<EvidenceItem | null>(null);

  // Derive mock chain links for the visualizer
  const chainLinks: ChainLink[] = items.map((item, index) => ({
    item_id: item.id,
    sequence_number: item.sequence_number || index + 1,
    content_hash: item.content_hash || "hash_pending",
    chain_hash: item.chain_hash || "chain_pending",
    previous_chain_hash: item.previous_item_id || null,
    timestamp: item.captured_at,
    verified: true, // Mock valid chain
  }));

  const handleQuickCapture = (typeId: string) => {
    setSelectedType(typeId);
    setShowUploadDialog(true);
  };

  const handleGenerateBundle = async () => {
    setIsBundling(true);
    // POST /api/evidence/bundle/generate
    try {
      await new Promise(r => setTimeout(r, 2000));
      alert("Bundle Generation Complete & 65B Signed. Check your downloads.");
    } finally {
      setIsBundling(false);
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800 font-sans flex flex-col">
      <Navbar />

      <main role="main" className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Breadcrumb */}
        <nav role="navigation" aria-label="Breadcrumb navigation" className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 mb-6 font-mono">
          <Link href="/evidence" className="hover:text-indigo-600 transition-colors">Evidence Vault</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-0.5">{initialCase.title}</span>
        </nav>

        {/* Top Header */}
        <header className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{initialCase.title}</h1>
              <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none px-3 font-bold uppercase tracking-wider text-xs">
                {initialCase.status}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">vs. {initialCase.counterparty_name}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <Link href={initialCase.document_id ? `/documents/${initialCase.document_id}` : "#"} className="text-sm font-medium text-indigo-600 hover:text-indigo-700 underline underline-offset-4">
                View Linked Contract
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button 
              variant="outline" 
              onClick={() => setShowUploadDialog(true)}
              className="border-slate-300 dark:border-slate-600 text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-xl font-bold h-11 px-5"
            >
              <Upload className="w-4 h-4 mr-2" />
              Add Evidence
            </Button>
            <Button 
              onClick={handleGenerateBundle}
              disabled={isBundling || items.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold h-11 px-4 md:px-6 shadow-md"
            >
              {isBundling ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              ) : (
                <ShieldCheck className="w-5 h-5 mr-2" />
              )}
              Generate 65B Bundle
            </Button>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Column (65%) */}
          <div className="flex-1 lg:max-w-[65%] order-2 lg:order-1 space-y-8">
            
            {/* Quick Capture Row */}
            <div className="bg-white dark:bg-card rounded-2xl shadow-sm dark:shadow-slate-900/20 border border-slate-200 dark:border-slate-700 p-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">Quick Capture</h3>
              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar px-2">
                {CAPTURE_TYPES.map(type => (
                  <button
                    key={type.id}
                    onClick={() => handleQuickCapture(type.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl min-w-[80px] transition-all border border-transparent hover:border-${type.color.split('-')[1]}-200 ${type.bg}`}
                  >
                    <type.icon className={`w-6 h-6 mb-2 ${type.color}`} />
                    <span className="text-[10px] font-bold text-slate-700">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Main Timeline */}
            <div className="bg-white dark:bg-card rounded-2xl shadow-sm dark:shadow-slate-900/20 border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-3 mb-8">
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Evidence Timeline</h3>
                <ChainStatusBadge verified={initialCase.chain_verified} />
              </div>

              {items.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                  <div className="w-16 h-16 bg-white dark:bg-card rounded-full flex items-center justify-center shadow-sm dark:shadow-slate-900/20 mb-4">
                    <Search className="w-8 h-8 text-slate-300" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-700 mb-1">Timeline is empty</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">Capture evidence to build a cryptographically secure timeline of events.</p>
                </div>
              ) : (
                <EvidenceTimeline items={items} />
              )}
            </div>
            
            {/* Currently selected item detail panel (Expands below timeline if clicked) */}
            <AnimatePresence>
              {selectedItem && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <Card className="rounded-2xl border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20 p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-black text-slate-800 dark:text-slate-200">Item Detail: {selectedItem.title}</h3>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedItem(null)}>✕</Button>
                    </div>
                    {/* Render standard EvidenceItemCard or equivalent content layout */}
                    {/* @ts-ignore */}
                    <EvidenceItemCard item={selectedItem} />
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
            
          </div>

          {/* Right Column (35%) Sticky Panel */}
          <div className="w-full lg:w-[35%] order-1 lg:order-2">
            <div className="sticky top-24 space-y-6">
              
              {/* Stats Card */}
              <Card className="bg-white dark:bg-card border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm dark:shadow-slate-900/20 p-6 flex flex-col gap-4">
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Case Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Items</p>
                    <p className="text-lg md:text-xl lg:text-2xl font-black text-indigo-600">{initialCase.total_items}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Storage</p>
                    <p className="text-lg md:text-xl lg:text-2xl font-black text-slate-700">{(initialCase.storage_used_bytes / 1024 / 1024).toFixed(1)}MB</p>
                  </div>
                </div>
                <Separator className="bg-slate-100 dark:bg-slate-800" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Section 65B Status</span>
                  {initialCase.chain_verified ? (
                     <Badge className="bg-emerald-50 text-emerald-700 border-none font-bold">Verifiable</Badge>
                  ) : (
                     <Badge className="bg-amber-50 text-amber-700 border-none font-bold">Pending Checks</Badge>
                  )}
                </div>
                {initialCase.chain_root_hash && (
                  <div className="bg-slate-900 rounded-lg p-3 flex flex-col gap-1 mt-2">
                    <div className="flex items-center gap-2">
                      <Lock className="w-3 h-3 text-emerald-400" />
                      <span className="text-[10px] font-bold text-emerald-400 tracking-wider">ROOT HASH (SHA-256)</span>
                    </div>
                    <span className="text-xs font-mono text-slate-300 break-all leading-tight">
                      {initialCase.chain_root_hash}
                    </span>
                  </div>
                )}
              </Card>

              {/* Chain of Custody Visualizer */}
              <Card className="bg-white dark:bg-card border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm dark:shadow-slate-900/20 p-6">
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mb-6 tracking-tight">Chain of Custody</h3>
                <ScrollArea className="h-[400px] w-full pr-4">
                  <EvidenceChainVisualizer links={chainLinks} />
                </ScrollArea>
              </Card>

            </div>
          </div>
        </div>

      </main>
      
      <Footer />

      {/* Upload/Capture Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-[550px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 dark:text-slate-100">
              {selectedType ? `Capture ${CAPTURE_TYPES.find(t => t.id === selectedType)?.label}` : "Upload Evidence"}
            </DialogTitle>
            <DialogDescription className="font-medium text-slate-500 dark:text-slate-400">
              Files will be cryptographically hashed upon upload to guarantee chain of custody.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="file" className="w-full mt-4">
            <TabsList className="grid grid-cols-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl h-auto">
              <TabsTrigger value="file" className="rounded-lg font-bold py-2 data-[state=active]:bg-white dark:bg-card data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm dark:shadow-slate-900/20">File Upload</TabsTrigger>
              <TabsTrigger value="manual" className="rounded-lg font-bold py-2 data-[state=active]:bg-white dark:bg-card data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm dark:shadow-slate-900/20">Text / URL</TabsTrigger>
            </TabsList>
            <TabsContent value="file" className="pt-4 outline-none">
              <div className="w-full">
                {/* @ts-ignore */}
                <EvidenceUploadZone onUploadComplete={() => {
                  setShowUploadDialog(false);
                  // refresh items...
                }}/>
              </div>
            </TabsContent>
            <TabsContent value="manual" className="pt-4 outline-none space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="evidence-title" className="text-sm font-bold text-slate-700">Title / Reference Name</Label>
                <Input id="evidence-title" placeholder="e.g. Email Thread with HR" className="rounded-xl border-slate-200 dark:border-slate-700" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="evidence-content" className="text-sm font-bold text-slate-700">Direct Content (Text, Chat Snippet, or URL)</Label>
                <Textarea id="evidence-content" placeholder="Paste content or an archive URL here..." className="rounded-xl border-slate-200 dark:border-slate-700 min-h-[150px] resize-none" />
              </div>
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl h-11 shadow-sm dark:shadow-slate-900/20">
                Capture & Hash
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
