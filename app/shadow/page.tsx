"use client";
import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { MismatchList } from "@/components/shadow/mismatch-list";
import { PromiseTimeline } from "@/components/shadow/promise-timeline";
import { TrustScoreGauge } from "@/components/shadow/trust-score-gauge";
import { ShadowSummaryCard } from "@/components/shadow/shadow-summary-card";
import { ComparisonTable } from "@/components/shadow/comparison-table";
import { EvidenceUpload } from "@/components/shadow/evidence-upload";
import { WhatsAppGuideModal } from "@/components/shadow/whatsapp-guide-modal";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

import { Ghost, FileSignature, MessageCircle, Mail, Mic, StickyNote, ArrowRight, ShieldCheck, Download, Gavel, FileSearch, Info, AlertTriangle , AlertCircle } from "lucide-react";

// Mocking required types to avoid TS failures during scaffolding
interface PromiseInput {
  id: string;
  type: "whatsapp" | "email" | "notes" | "audio";
  content: string;
}

interface ShadowResult {
  trustScore: number;
  mismatches: any[];
  promises: any[];
  summary: string;
}

export default function ShadowContractCheckerPage({ isLoading, error, onRetry }: any) {
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [promiseInputs, setPromiseInputs] = useState<PromiseInput[]>([]);
  const [activeInputTab, setActiveInputTab] = useState<"whatsapp" | "email" | "notes" | "audio">("whatsapp");
  const [shadowResult, setShadowResult] = useState<ShadowResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showWhatsappGuide, setShowWhatsappGuide] = useState(false);
  
  // Input tracking
  const [currentText, setCurrentText] = useState("");

  const handleAddPromise = (type: "whatsapp" | "email" | "notes" | "audio") => {
     if (!currentText.trim() && type !== "audio") return;
     
     const newPromise: PromiseInput = {
        id: `p_${Date.now()}`,
        type,
        content: currentText
     };
     setPromiseInputs([...promiseInputs, newPromise]);
     setCurrentText("");
     
     // Would normally hit /api/shadow/parse-preview here
  };

  const handleAnalysis = async () => {
     setIsAnalyzing(true);
     // Mock POST /api/shadow/analyze { documentId, promises }
     try {
        await new Promise(r => setTimeout(r, 2000)); // Latency
        
        // Mock Result
        setShadowResult({
           trustScore: 42,
           summary: "Significant deviation between verbal promises and written terms. 3 explicit contradictions found.",
           mismatches: [
              { id: "m1", type: "contradiction", promise: "We will never raise rent in the first 2 years.", written: "Lessor reserves the right to hike rent by 10% annually.", severity: "high", implication: "Promise is legally void due to Entire Agreement clause." },
              { id: "m2", type: "omission", promise: "Balcony repairs are fully covered.", written: "[No mention of balcony]", severity: "medium", implication: "Burden of repair defaults to tenant." },
           ],
           promises: [
              { id: "p1", status: "contradicted", content: "Rent locked for 2 years", source: "whatsapp", timestamp: new Date().toISOString() },
              { id: "p2", status: "matched", content: "Deposit is 2 months", source: "whatsapp", timestamp: new Date(Date.now()-86400).toISOString() },
              { id: "p3", status: "omitted", content: "Balcony covered", source: "email", timestamp: new Date(Date.now()-100000).toISOString() }
           ]
        });
     } finally {
        setIsAnalyzing(false);
     }
  };

  
  // Injected Premium Loading States
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col pt-10">
        <div className="container mx-auto max-w-7xl px-4 py-8 space-y-8 animate-in fade-in duration-500">
          {/* Header Skeleton */}
          <div className="flex flex-col gap-4 mb-6 relative">
            <div className="absolute -left-10 -top-10 w-40 h-40 bg-indigo-600 dark:bg-indigo-500/5 rounded-full blur-3xl" />
            <Skeleton className="h-10 w-[60%] sm:w-96 rounded-xl bg-gradient-to-r from-slate-200 to-indigo-50 dark:from-slate-800 dark:to-indigo-950/20" />
            <Skeleton className="h-5 w-64 rounded-lg" />
          </div>
          
          {/* Dashboard 4-Card Generic Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            {[1,2,3,4].map((i) => (
               <div key={i} className="p-6 bg-white dark:bg-card border-none shadow-xl shadow-indigo-500/5 rounded-3xl overflow-hidden relative">
                 <div className="flex justify-between items-start mb-4">
                   <Skeleton className="h-12 w-12 rounded-xl" />
                   <Skeleton className="h-6 w-16 rounded-full" />
                 </div>
                 <Skeleton className="h-8 w-24 rounded-lg mb-2" />
                 <Skeleton className="h-4 w-32 rounded-lg" />
               </div>
            ))}
          </div>
          
          {/* Main Body Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10 mt-6">
            <div className="lg:col-span-2">
               <Skeleton className="h-[400px] w-full bg-white dark:bg-card rounded-3xl shadow-xl shadow-indigo-500/5" />
            </div>
            <div className="lg:col-span-1 flex flex-col gap-6">
               <Skeleton className="h-[188px] w-full bg-white dark:bg-card rounded-3xl shadow-xl shadow-indigo-500/5" />
               <Skeleton className="h-[188px] w-full bg-white dark:bg-card rounded-3xl shadow-xl shadow-indigo-500/5" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-rose-200 bg-gradient-to-b from-white to-rose-50/30 dark:bg-rose-950/20 dark:border-rose-800 p-8 rounded-3xl shadow-2xl shadow-rose-500/10 text-center animate-in zoom-in-95 duration-500">
          <div className="mx-auto w-16 h-16 bg-rose-100 dark:bg-rose-900/50 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <AlertCircle className="h-8 w-8 text-rose-500 dark:text-rose-400" />
          </div>
          <h3 className="font-extrabold text-2xl text-slate-800 dark:text-slate-100 mb-2 tracking-tight">System Interruption</h3>
          <p className="text-slate-600 dark:text-slate-400 font-medium text-sm leading-relaxed mb-8">{error}</p>
          <Button onClick={onRetry} className="w-full h-12 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5">
            Synchronize & Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800 font-sans flex flex-col">
      <Navbar />

      <main role="main" className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-4 md:px-6 py-10 space-y-10">
        
        {/* Header Setup */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
           <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-inner shadow-indigo-200">
              <Ghost className="w-8 h-8" />
           </div>
           <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Shadow Agreement Engine
           </h1>
           <p className="text-base text-slate-500 dark:text-slate-400 font-medium">
              Weigh formal contract legalese against WhatsApp chats, verbal promises, and email threads to expose hidden contradictions.
           </p>
        </div>

        {/* Input Phase */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           
           {/* Left: Written Contract */}
           <Card className="bg-white dark:bg-card rounded-3xl p-6 shadow-sm dark:shadow-slate-900/20 border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-black text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-6">
                 <FileSignature className="w-6 h-6 text-indigo-500" />
                 1. The Written Contract
              </h2>
              {documentId ? (
                 <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                    <FileSearch className="w-8 h-8 text-indigo-400 mb-2" />
                    <p className="font-bold text-indigo-900">Contract Linked</p>
                    <p className="text-xs text-indigo-600 mb-4">Analyzing Document ID: {documentId}</p>
                    <Button variant="outline" size="sm" onClick={() => setDocumentId(null)}>Change Document</Button>
                 </div>
              ) : (
                 <div className="space-y-4">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                       Upload the formal agreement or link an existing analyzed document from your vault.
                    </p>
                    {/* @ts-ignore */}
                    <EvidenceUpload onUploadComplete={(id) => setDocumentId(id || "mock_doc_1")} acceptedFormats={["pdf", "docx"]} />
                 </div>
              )}
           </Card>

           {/* Right: Informal Promises */}
           <Card className="bg-white dark:bg-card rounded-3xl p-6 shadow-sm dark:shadow-slate-900/20 border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-6">
                 <h2 className="text-xl font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <MessageCircle className="w-6 h-6 text-amber-500" />
                    2. Informal Promises
                 </h2>
                 <Badge className="bg-amber-100 text-amber-700 border-none font-bold">
                    {promiseInputs.length} Added
                 </Badge>
              </div>
              
              <Tabs value={activeInputTab} onValueChange={(v: any) => setActiveInputTab(v)} className="w-full">
                 <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full grid grid-cols-4 h-auto mb-4">
                    <TabsTrigger value="whatsapp" className="rounded-lg data-[state=active]:bg-white dark:bg-card data-[state=active]:shadow-sm dark:shadow-slate-900/20 py-2">
                       <MessageCircle className="w-4 h-4 md:mr-2 text-emerald-500" /> <span className="hidden md:inline font-bold">WhatsApp</span>
                    </TabsTrigger>
                    <TabsTrigger value="email" className="rounded-lg data-[state=active]:bg-white dark:bg-card data-[state=active]:shadow-sm dark:shadow-slate-900/20 py-2">
                       <Mail className="w-4 h-4 md:mr-2 text-sky-500" /> <span className="hidden md:inline font-bold">Email</span>
                    </TabsTrigger>
                    <TabsTrigger value="notes" className="rounded-lg data-[state=active]:bg-white dark:bg-card data-[state=active]:shadow-sm dark:shadow-slate-900/20 py-2">
                       <StickyNote className="w-4 h-4 md:mr-2 text-amber-500" /> <span className="hidden md:inline font-bold">Notes</span>
                    </TabsTrigger>
                    <TabsTrigger value="audio" className="rounded-lg data-[state=active]:bg-white dark:bg-card data-[state=active]:shadow-sm dark:shadow-slate-900/20 py-2">
                       <Mic className="w-4 h-4 md:mr-2 text-rose-500" /> <span className="hidden md:inline font-bold">Audio</span>
                    </TabsTrigger>
                 </TabsList>

                 <TabsContent value="whatsapp" className="space-y-4 mt-0 outline-none">
                    <div className="flex justify-between items-center px-1">
                       <label htmlFor="whatsapp-input" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Paste Chat Export</label>
                       <Button variant="link" size="sm" onClick={() => setShowWhatsappGuide(true)} className="text-emerald-600 h-auto p-0">
                          How to export? <Info className="w-3 h-3 ml-1" />
                       </Button>
                    </div>
                    <Textarea 
                       id="whatsapp-input"
                       placeholder="[10/10/24, 2:30 PM] Broker: Don't worry, the lock-in is fully negotiable..." 
                       className="min-h-[120px] resize-none rounded-xl border-slate-200 dark:border-slate-700"
                       value={currentText} onChange={(e) => setCurrentText(e.target.value)}
                    />
                    <Button onClick={() => handleAddPromise("whatsapp")} disabled={!currentText.trim()} className="w-full bg-slate-900 text-white rounded-xl">Add to Context</Button>
                 </TabsContent>

                 <TabsContent value="email" className="space-y-4 mt-0 outline-none">
                    <label htmlFor="email-input" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">Paste Email Thread</label>
                    <Textarea 
                       id="email-input"
                       placeholder="From: HR Manager... Yes, your stock options vest immediately upon..."
                       className="min-h-[120px] resize-none rounded-xl border-slate-200 dark:border-slate-700"
                       value={currentText} onChange={(e) => setCurrentText(e.target.value)}
                    />
                    <Button onClick={() => handleAddPromise("email")} disabled={!currentText.trim()} className="w-full bg-slate-900 text-white rounded-xl">Add to Context</Button>
                 </TabsContent>

                 <TabsContent value="notes" className="space-y-4 mt-0 outline-none">
                    <label htmlFor="notes-input" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">Direct Promises / Summary</label>
                    <Textarea 
                       id="notes-input"
                       placeholder="They promised me over the phone that I could exit anytime..."
                       className="min-h-[120px] resize-none rounded-xl border-slate-200 dark:border-slate-700"
                       value={currentText} onChange={(e) => setCurrentText(e.target.value)}
                    />
                    <Button onClick={() => handleAddPromise("notes")} disabled={!currentText.trim()} className="w-full bg-slate-900 text-white rounded-xl">Add to Context</Button>
                 </TabsContent>
                 
                 <TabsContent value="audio" className="mt-0 outline-none">
                     {/* @ts-ignore */}
                    <EvidenceUpload onUploadComplete={() => handleAddPromise("audio")} acceptedFormats={["mp3", "wav", "m4a"]} />
                 </TabsContent>
              </Tabs>
           </Card>

        </div>

        {/* Global Action CTA Center */}
        <div className="flex flex-col items-center justify-center py-6">
           <Button 
              size="lg" 
              onClick={handleAnalysis}
              disabled={!documentId || promiseInputs.length === 0 || isAnalyzing}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-lg h-16 px-10 shadow-xl shadow-indigo-600/20 transition-all hover:scale-105"
           >
              {isAnalyzing ? (
                 <>
                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin mr-3" />
                    Checking for Mismatches...
                 </>
              ) : (
                 <>
                    Expose Shadow Agreement
                    <ArrowRight className="w-6 h-6 ml-3" />
                 </>
              )}
           </Button>
           
           {(!documentId || promiseInputs.length === 0) && (
              <p className="text-xs text-slate-400 font-bold mt-4 uppercase tracking-widest">Requires Contract + ≥1 Promise</p>
           )}
        </div>

        <Separator className="bg-slate-200" />

        {/* Analysis Results View */}
        <AnimatePresence>
           {shadowResult && !isAnalyzing && (
              <motion.div 
                 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} 
                 className="space-y-8 pb-10"
              >
                 <div className="text-center mb-10">
                    <h2 className="text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Analysis Complete</h2>
                 </div>

                 {/* Results Grid Row 1 */}
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Security Gauge */}
                    <Card className="bg-white dark:bg-card sm:col-span-1 rounded-3xl p-4 md:p-6 lg:p-8 shadow-sm dark:shadow-slate-900/20 border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center relative overflow-hidden">
                       <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest absolute top-6">Document Trust Score</h3>
                       <div className="mt-8 scale-110">
                          {/* @ts-ignore */}
                          <TrustScoreGauge score={shadowResult.trustScore} />
                       </div>
                    </Card>

                    {/* Overall Summary block */}
                    <Card className="bg-white dark:bg-card sm:col-span-2 rounded-3xl p-4 md:p-6 lg:p-8 shadow-sm dark:shadow-slate-900/20 border-slate-200 dark:border-slate-700 flex flex-col justify-center bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/50 to-white">
                       <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-4">Executive Summary</h3>
                       <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed text-lg mb-6">
                          {shadowResult.summary}
                       </p>
                       <div className="flex gap-4">
                          {/* @ts-ignore */}
                          <ShadowSummaryCard mismatches={shadowResult.mismatches} />
                       </div>
                    </Card>
                 </div>

                 {/* Mismatch Explorer */}
                 <div className="space-y-6">
                    <h3 className="text-lg md:text-xl lg:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                       <AlertTriangle className="w-6 h-6 text-red-500" /> 
                       Discovered Contradictions
                    </h3>
                    <div className="bg-white dark:bg-card p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20">
                       {/* @ts-ignore */}
                       <MismatchList mismatches={shadowResult.mismatches} />
                    </div>
                 </div>

                 {/* Promise Timeline Tracer */}
                 <div className="space-y-6">
                    <h3 className="text-lg md:text-xl lg:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                       <FileSearch className="w-6 h-6 text-indigo-500" /> 
                       Promise Trace Timeline
                    </h3>
                    <Card className="bg-slate-900 p-4 md:p-6 lg:p-8 rounded-3xl border-none shadow-xl border-slate-200 dark:border-slate-700 overflow-hidden text-slate-100">
                       <p className="text-sm text-slate-400 font-medium mb-8">Visual chronological tracing of informal promises mapped directly against the physical agreement terms.</p>
                       {/* @ts-ignore */}
                       <PromiseTimeline promises={shadowResult.promises} />
                    </Card>
                 </div>

                 {/* Action Bar Bottom */}
                 <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-8 border-t border-slate-200 dark:border-slate-700">
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto font-bold rounded-xl h-14 px-4 md:px-4 md:px-6 lg:px-8">
                       <Download className="w-5 h-5 mr-2" />
                       Generate PDF Evidence Report
                    </Button>
                    <Button variant="outline" className="w-full sm:w-auto font-bold border-indigo-200 text-indigo-700 rounded-xl h-14 px-4 md:px-4 md:px-6 lg:px-8 bg-indigo-50 hover:bg-indigo-100">
                       <ShieldCheck className="w-5 h-5 mr-2" />
                       Build Section 65B File
                    </Button>
                    <Button variant="ghost" className="w-full sm:w-auto font-bold text-slate-500 dark:text-slate-400 hover:text-red-600 rounded-xl h-14 px-4 md:px-4 md:px-6 lg:px-8">
                       <Gavel className="w-5 h-5 mr-2" />
                       View Legal Options
                    </Button>
                 </div>
              </motion.div>
           )}
        </AnimatePresence>

      </main>

      <Footer />
      {/* @ts-ignore */}
      <WhatsAppGuideModal open={showWhatsappGuide} onClose={() => setShowWhatsappGuide(false)} />
    </div>
  );
}
