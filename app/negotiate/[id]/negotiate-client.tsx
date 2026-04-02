"use client";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { 
  Copy, Loader2, Printer, ShieldAlert, AlertTriangle, 
  Scale, CheckCircle2, Bot, ChevronDown, ChevronUp, MessagesSquare, Info
, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { Document, Clause, NegotiationScript, NegotiationPlaybook } from "@/types";

interface NegotiateClientProps {
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;

  document: Document;
  clauses: Clause[];
}

export default function NegotiateClient({  document, clauses , isLoading, error, onRetry }: NegotiateClientProps) {
  const [playbooks, setPlaybooks] = useState<Record<string, NegotiationPlaybook>>({});
  const [loadingClauseId, setLoadingClauseId] = useState<string | null>(null);
  const [expandedClauseId, setExpandedClauseId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const generatePlaybook = async (clause: Clause) => {
    setLoadingClauseId(clause.id);
    try {
      const res = await fetch("/api/negotiate/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clauseText: clause.original_text,
          clauseType: clause.clause_type,
          riskLevel: clause.risk_level,
          documentType: document.document_type,
          jurisdiction: document.jurisdiction,
          entityName: document.entity_name }) });
      if (!res.ok) throw new Error("Failed to generate playbook");
      const data = await res.json();
      setPlaybooks((prev) => ({ ...prev, [clause.id]: data }));
      setExpandedClauseId(clause.id);
    } catch {
        // Silently handled
      } finally {
      setLoadingClauseId(null);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const printCheatSheet = () => {
    window.print();
  };

  const getRiskStyles = (risk: string) => {
    switch (risk) {
      case "illegal":
        return "border-purple-200 border-l-4 border-l-purple-500 bg-purple-50 text-purple-900";
      case "dangerous":
        return "border-rose-200 border-l-4 border-l-rose-500 bg-rose-50 text-rose-900";
      case "warning":
        return "border-amber-200 border-l-4 border-l-amber-500 bg-amber-50 text-amber-900";
      default:
        return "border-slate-200 border-l-4 border-l-slate-400 bg-white text-slate-900";
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case "illegal":
        return <Scale className="w-5 h-5 text-purple-600" />;
      case "dangerous":
        return <ShieldAlert className="w-5 h-5 text-rose-600" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      default:
        return <Info className="w-5 h-5 text-slate-500 dark:text-slate-400" />;
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
    <div className="min-h-screen flex flex-col bg-slate-50 print:bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <Navbar />
      
      <main role="main" className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12 print:p-0">
        
        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 print:hidden">
          <div>
            <h1 className="text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
              Negotiation Playbook
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
              {document.original_filename || "Document Analysis"} • {clauses.length} Risky Clauses
            </p>
          </div>
          <Button 
            onClick={printCheatSheet} 
            variant="outline" 
            className="flex items-center gap-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-card hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 shadow-sm dark:shadow-slate-900/20 rounded-xl font-bold px-5"
          >
            <Printer className="w-4 h-4" />
            Print Cheat Sheet
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* LEFT COLUMN (65%) */}
          <div className="w-full lg:w-[65%] space-y-6">
            {clauses.map((clause, index) => {
              const playbook = playbooks[clause.id];
              const script = playbook?.scripts[0];
              const isExpanded = expandedClauseId === clause.id;
              const isLoading = loadingClauseId === clause.id;

              return (
                <Card 
                  key={clause.id} 
                  className={cn(
                    "overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md",
                    getRiskStyles(clause.risk_level),
                    "border border-slate-200 rounded-xl bg-white"
                  )}
                >
                  {/* Card Header (Always visible) */}
                  <div 
                    className={cn(
                      "p-5 cursor-pointer flex items-start gap-4 hover:bg-slate-50/50 transition-colors",
                      getRiskStyles(clause.risk_level).replace('bg-', 'hover:bg-').split(' ')[2] + '/10' // inject hover bg matching indicator 
                    )}
                    onClick={() => setExpandedClauseId(isExpanded ? null : clause.id)}
                  >
                    <div className="mt-1 flex-shrink-0">
                       {getRiskIcon(clause.risk_level)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="font-bold text-[10px] uppercase tracking-wider bg-white dark:bg-slate-900">
                          Clause {clause.clause_number}
                        </Badge>
                        <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-lg">
                          {clause.clause_type.replace(/_/g, " ")}
                        </h3>
                      </div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400 line-clamp-2">
                        "{clause.original_text}"
                      </p>
                    </div>
                    <div className="flex-shrink-0 pl-4 mt-2 print:hidden">
                       {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </div>
                  </div>

                  {/* Expanding Content Container */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-white dark:bg-slate-900"
                      >
                        <Separator className="bg-slate-100 dark:bg-slate-800" />
                        
                        <CardContent className="p-6">
                          {!playbook ? (
                            <div className="flex flex-col items-center justify-center py-6 md:py-8 lg:py-12 text-center">
                              <Bot className="w-12 h-12 text-indigo-300 mb-4" />
                              <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">Needs Tactical Breakdown</h4>
                              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mb-6 font-medium">
                                Generate a targeted response strategy, legal backing, and counter-arguments for this specific risk.
                              </p>
                              <Button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  generatePlaybook(clause);
                                }}
                                disabled={isLoading}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-4 md:px-4 md:px-6 lg:px-8 shadow-sm dark:shadow-slate-900/20"
                              >
                                {isLoading ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Analyzing Angles...
                                  </>
                                ) : (
                                  "Generate Playbook"
                                )}
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-8 animate-in fade-in duration-500">
                              
                              {/* Open Approach Section */}
                              {script?.opening_statement && (
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-widest">
                                      Opening Statement
                                    </h4>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => copyToClipboard(script.opening_statement, `open-${clause.id}`)}
                                      className="h-8 text-xs font-bold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-700 px-2"
                                    >
                                      {copiedId === `open-${clause.id}` ? (
                                        <><CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Copied!</>
                                      ) : (
                                        <><Copy className="w-3.5 h-3.5 mr-1.5" /> Copy script</>
                                      )}
                                    </Button>
                                  </div>
                                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 text-indigo-900 font-medium text-sm leading-relaxed relative shadow-inner">
                                    <span className="absolute -left-2.5 -top-2.5 text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl text-indigo-200 font-serif">"</span>
                                    {script.opening_statement}
                                  </div>
                                </div>
                              )}

                              {/* If They Say / You Say Table */}
                              {script?.counter_responses && script.counter_responses.length > 0 && (
                                <div className="space-y-3">
                                  <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-widest">
                                    Counter-Argument Matrix
                                  </h4>
                                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm dark:shadow-slate-900/20">
                                    <div className="grid grid-cols-2 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                      <div>If They Say...</div>
                                      <div>You Say...</div>
                                    </div>
                                    <div className="divide-y divide-slate-100">
                                      {script.counter_responses.map((response, idx) => (
                                        <div key={idx} className={cn(
                                          "grid grid-cols-2 group",
                                          idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                                        )}>
                                          <div className="p-4 text-sm text-slate-600 dark:text-slate-400 font-medium border-r border-slate-100 group-hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800 transition-colors">
                                            "{response.they_say}"
                                          </div>
                                          <div className="p-4 text-sm text-slate-800 dark:text-slate-200 font-bold relative group-hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800 transition-colors">
                                            {response.you_say}
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                                              onClick={() => copyToClipboard(response.you_say, `counter-${clause.id}-${idx}`)}
                                            >
                                              {copiedId === `counter-${clause.id}-${idx}` ? (
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                              ) : (
                                                <Copy className="w-3.5 h-3.5 text-slate-400" />
                                              )}
                                            </Button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Escalation Path (Stepper) */}
                              {script?.escalation && (
                                <div className="space-y-4 pt-2">
                                  <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-widest">
                                    Escalation Path
                                  </h4>
                                  
                                  <div className="relative pl-6 space-y-6 before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-200 before:to-transparent">
                                    
                                    {/* Step 1 */}
                                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                      <div className="flex items-center justify-center w-6 h-6 rounded-full border-4 border-white bg-indigo-500 text-white font-bold text-[10px] shadow-sm dark:shadow-slate-900/20 absolute left-0 -translate-x-[calc(50%-2px)] md:left-1/2 md:-translate-x-1/2">
                                        1
                                      </div>
                                      <div className="w-[calc(100%-1rem)] ml-4">
                                        <div className="p-4 bg-white dark:bg-card border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm dark:shadow-slate-900/20">
                                          <Badge className="mb-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100">Step 1</Badge>
                                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{script.escalation.action}</p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Step 2 */}
                                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                      <div className="flex items-center justify-center w-6 h-6 rounded-full border-4 border-white bg-slate-300 text-slate-600 dark:text-slate-400 font-bold text-[10px] shadow-sm dark:shadow-slate-900/20 absolute left-0 -translate-x-[calc(50%-2px)] md:left-1/2 md:-translate-x-1/2">
                                        2
                                      </div>
                                      <div className="w-[calc(100%-1rem)] ml-4">
                                        <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl border-dashed">
                                          <Badge variant="outline" className="mb-2 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700">Legal Leverage</Badge>
                                          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Cite <span className="font-bold text-slate-800 dark:text-slate-200">{script.escalation.law_reference}</span></p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Step 3 */}
                                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                      <div className="flex items-center justify-center w-6 h-6 rounded-full border-4 border-white bg-rose-200 text-rose-700 font-bold text-[10px] shadow-sm dark:shadow-slate-900/20 absolute left-0 -translate-x-[calc(50%-2px)] md:left-1/2 md:-translate-x-1/2">
                                        3
                                      </div>
                                      <div className="w-[calc(100%-1rem)] ml-4">
                                        <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl opacity-80">
                                          <Badge className="mb-2 bg-rose-100 border border-rose-200 text-rose-700 hover:bg-rose-200">Final Escation</Badge>
                                          <p className="text-sm font-bold text-rose-900">Escalate to {script.escalation.authority}</p>
                                        </div>
                                      </div>
                                    </div>

                                  </div>
                                </div>
                              )}

                            </div>
                          )}
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              );
            })}
          </div>

          {/* RIGHT COLUMN (35%) */}
          <div className="w-full lg:w-[35%] space-y-6 print:hidden">
            <div className="sticky top-24 space-y-6">
              
              {/* Context Panel Card */}
              <Card className="bg-white dark:bg-card rounded-xl shadow-sm dark:shadow-slate-900/20 border border-slate-200 dark:border-slate-700 overflow-hidden">
                <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 pb-4">
                  <CardTitle className="text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <MessagesSquare className="w-5 h-5 text-indigo-500" />
                    Strategic Context
                  </CardTitle>
                  <CardDescription className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Know your leverage points prior to engaging
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-5 mt-2">
                  
                  <div>
                    <h5 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Entity Profiling</h5>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {document.entity_name || "Unidentified Party"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 leading-relaxed">
                      Known to use standard boilerplate templates. Frequently responds to verified legal citations when challenged. 
                    </p>
                  </div>

                  <Separator className="bg-slate-100 dark:bg-slate-800" />

                  <div>
                    <h5 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Your Strengths</h5>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                        <span className="text-sm font-medium text-slate-700">Backed by Consumer Protection Act 2019</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                        <span className="text-sm font-medium text-slate-700">Unilateral modification clauses are heavily scrutinised</span>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-slate-100 dark:bg-slate-800" />
                  
                  <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                    <h5 className="text-xs font-extrabold uppercase tracking-wider text-indigo-800 mb-1">Golden Rule</h5>
                    <p className="text-xs font-medium text-indigo-600 leading-relaxed">
                      Stay calm, remain written, and never agree to verbal side-deals. If it's not on paper, it doesn't exist.
                    </p>
                  </div>

                </CardContent>
              </Card>

              {/* Live CTA Container */}
              <Link href={`/negotiate/live?docId=${document.id}`} className="block group">
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-xl p-6 shadow-lg relative overflow-hidden transition-transform group-hover:-translate-y-1">
                  <div className="absolute -right-10 -top-10 w-32 h-32 bg-white dark:bg-slate-900/10 rounded-full blur-2xl" />
                  <div className="relative z-10">
                    <div className="bg-indigo-500/30 w-10 h-10 rounded-lg flex items-center justify-center mb-4 border border-indigo-400/30">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-black text-white mb-2 leading-tight">
                      Take me into the room
                    </h3>
                    <p className="text-indigo-100 text-sm font-medium mb-4 leading-relaxed">
                      Launch the Live Action Companion overlay to receive real-time counters on your phone during vocal negotiations.
                    </p>
                    <span className="inline-flex items-center text-white text-xs font-bold tracking-widest uppercase pb-1 border-b-2 border-indigo-400">
                      Engage Live Mode <ChevronDown className="w-3 h-3 ml-1 -rotate-90" />
                    </span>
                  </div>
                </div>
              </Link>

            </div>
          </div>
        </div>

      </main>
      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
