"use client";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useCallback, useEffect } from "react";
import { Copy, Download, Printer, Send, Loader2, AlertTriangle, ShieldAlert, Check, FileText, CheckSquare, Square , AlertCircle } from "lucide-react";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Document, Clause } from "@/types";

interface LetterClientProps {
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;

  document: Document;
  clauses: Clause[];
}

export default function LetterClient({  document, clauses , isLoading, error, onRetry }: LetterClientProps) {
  const [senderName, setSenderName] = useState("");
  const [senderAddress, setSenderAddress] = useState("");
  const [recipientName, setRecipientName] = useState(document?.entity_name || "");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [selectedClauses, setSelectedClauses] = useState<string[]>([]);
  const [deadline, setDeadline] = useState("15");
  const [tone, setTone] = useState<"firm" | "aggressive" | "diplomatic">("firm");
  const [letterContent, setLetterContent] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  // Initial letter loading hook (optional if you want it to mock immediately)
  useEffect(() => {
    // We immediately preview a template format before user generates
    if (!letterContent && selectedClauses.length === 0) {
      setLetterContent(
        `[SENDER NAME]\n[SENDER ADDRESS]\nDate: ${new Date().toLocaleDateString()}\n[RECIPIENT NAME]\n[RECIPIENT ADDRESS]\nSUBJECT: Legal Notice Regarding Predatory Terms in ${document?.original_filename || "Contract"}\nDear [Recipient Name],\nThis is a formal notice...`
      );
    }
  }, [document, letterContent, selectedClauses]);

  const toggleClause = (clauseId: string) => {
    setSelectedClauses((prev) =>
      prev.includes(clauseId)
        ? prev.filter((id) => id !== clauseId)
        : [...prev, clauseId]
    );
  };

  const selectAllIllegal = () => {
    const illegalIds = clauses.filter((c) => c.risk_level === "illegal").map((c) => c.id);
    setSelectedClauses((prev) => Array.from(new Set([...prev, ...illegalIds])));
  };

  const selectAllDangerous = () => {
    const dangerousIds = clauses.filter((c) => c.risk_level === "dangerous").map((c) => c.id);
    setSelectedClauses((prev) => Array.from(new Set([...prev, ...dangerousIds])));
  };

  const generateLetter = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/generate-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: document.id,
          clauses: selectedClauses,
          senderName,
          senderAddress,
          recipientName,
          recipientAddress,
          deadline,
          tone }) });
      
      if (!res.ok) throw new Error("API Route Missing");
      
      const data = await res.json();
      setLetterContent(data.content);
    } catch (e) {
      // Fallback for UI visualization purposes if endpoint doesn't exist
      const header = `${senderName || "[SENDER NAME]"}\n${senderAddress || "[SENDER ADDRESS]"}\nDate: ${new Date().toLocaleDateString()}\n${recipientName || "[RECIPIENT NAME]"}\n${recipientAddress || "[RECIPIENT ADDRESS]"}\n`;
      const subject = `SUBJECT: Legal Notice Regarding Predatory Terms in ${document?.original_filename || "Contract"}\n`;
      const salutation = `Dear ${recipientName || "[Recipient]"}, \n`;
      let body = `I am writing to formally object to several illegal and predatory clauses present within the agreement provided to me. `;
      
      if (selectedClauses.length > 0) {
        body += `Specifically, I am highlighting the following ${selectedClauses.length} condition(s) which violate standard regulations:\n`;
        clauses.forEach((c) => {
          if (selectedClauses.includes(c.id)) {
            body += `• ${c.clause_type.replace(/_/g, " ").toUpperCase()}: "${c.original_text}"\n`;
          }
        });
      } else {
        body += `\n`;
      }
      
      let toneText = "";
      if (tone === "aggressive") toneText = "We demand immediate and unconditional withdrawal of these clauses.";
      else if (tone === "diplomatic") toneText = "We kindly request to renegotiate these terms mutually to align with standard practices.";
      else toneText = "We expect full rectification of these terms to comply with the law.";

      const footer = `\n${toneText} We expect a response within ${deadline} days.\nSincerely,\n${senderName || "[Sender]"}`;
      
      setTimeout(() => {
        setLetterContent(header + subject + salutation + body + footer);
        setIsGenerating(false);
      }, 1500);
    }
  };

  const printLetter = () => {
    window.print();
  };

  const copyText = () => {
    if (letterContent) {
      navigator.clipboard.writeText(letterContent);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    }
  };

  const downloadPDF = () => {
    // Stub functionality to open print dialog mapping as PDF option
    window.print();
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800 flex flex-col font-sans">
      <Navbar />
      
      <main role="main" className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8 print:hidden">
          <h1 className="text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
            Legal Notice Generator
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
            Build formal legal responses using extracted predatory clauses.
          </p>
        </div>

        {/* 40/60 Split Layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* LEFT 40% Panel - Options */}
          <div className="w-full lg:w-[40%] space-y-6 print:hidden">
            <Card className="border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20 overflow-hidden">
              <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 pb-4">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" /> Letter Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-6">
                
                {/* Sender Settings */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">About You (Sender)</h3>
                  <div className="grid gap-3">
                    <Input 
                      aria-label="Your Full Name"
                      placeholder="Your Full Name" 
                      value={senderName} 
                      onChange={(e) => setSenderName(e.target.value)} 
                      className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus-visible:ring-indigo-500"
                    />
                    <Textarea 
                      aria-label="Your Full Address"
                      placeholder="Your Full Address" 
                      value={senderAddress} 
                      onChange={(e) => setSenderAddress(e.target.value)} 
                      rows={2}
                      className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus-visible:ring-indigo-500 resize-none"
                    />
                  </div>
                </div>

                <Separator />

                {/* Recipient Settings */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Entity (Recipient)</h3>
                  <div className="grid gap-3">
                    <Input 
                      aria-label="Recipient Entity Name"
                      placeholder="Recipient Entity Name" 
                      value={recipientName} 
                      onChange={(e) => setRecipientName(e.target.value)} 
                      className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus-visible:ring-indigo-500"
                    />
                    <Textarea 
                      aria-label="Recipient Registered Address"
                      placeholder="Recipient Registered Address" 
                      value={recipientAddress} 
                      onChange={(e) => setRecipientAddress(e.target.value)}
                      rows={2} 
                      className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus-visible:ring-indigo-500 resize-none"
                    />
                  </div>
                </div>

                <Separator />

                {/* Clause Checklist */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Clauses to Dispute</h3>
                    <Badge variant="secondary" className="bg-indigo-50 text-indigo-700">{selectedClauses.length} Selected</Badge>
                  </div>
                  
                  {/* Select All Toggles */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={selectAllIllegal} className="text-xs h-7 border-purple-200 text-purple-700 hover:bg-purple-50">
                      Select All Illegal
                    </Button>
                    <Button variant="outline" size="sm" onClick={selectAllDangerous} className="text-xs h-7 border-rose-200 text-rose-700 hover:bg-rose-50">
                      Select All Dangerous
                    </Button>
                  </div>

                  <ScrollArea className="h-[240px] border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50 p-2">
                    <div className="space-y-2">
                      {clauses.map((clause) => {
                        const isSelected = selectedClauses.includes(clause.id);
                        const isIllegale = clause.risk_level === "illegal";
                        return (
                          <div 
                            key={clause.id} 
                            onClick={() => toggleClause(clause.id)}
                            className={cn(
                              "p-3 rounded-lg border transition-all cursor-pointer flex gap-3",
                              isSelected ? "bg-white border-indigo-300 shadow-sm" : "bg-white border-slate-200 hover:border-slate-300"
                            )}
                          >
                            <div className="mt-0.5 pointer-events-none text-indigo-600">
                              {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-slate-300" />}
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-sm text-slate-800 dark:text-slate-200 line-clamp-1">{clause.clause_type.replace(/_/g, " ")}</span>
                                {isIllegale ? 
                                    <Badge variant="destructive" className="bg-purple-100 text-purple-800 border-0 hover:bg-purple-100 scale-75"><span className="sr-only">Risk Level: </span>Illegal</Badge> : 
                                    <Badge variant="destructive" className="bg-rose-100 text-rose-800 border-0 hover:bg-rose-100 scale-75"><span className="sr-only">Risk Level: </span>Dangerous</Badge>
                                }
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">"{clause.original_text}"</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                </div>

                <Separator />

                {/* Configuration: Deadline and Tone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tone</h3>
                    <Select value={tone} onValueChange={(val: any) => setTone(val)}>
                      <SelectTrigger aria-label="Letter Tone" className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 h-10">
                        <SelectValue placeholder="Select tone..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="diplomatic">Diplomatic</SelectItem>
                        <SelectItem value="firm">Firm & Assured</SelectItem>
                        <SelectItem value="aggressive">Aggressive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Deadline (Days)</h3>
                    <Select value={deadline} onValueChange={setDeadline}>
                      <SelectTrigger aria-label="Response Deadline" className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 h-10">
                        <SelectValue placeholder="Select deadline..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 Days</SelectItem>
                        <SelectItem value="15">15 Days</SelectItem>
                        <SelectItem value="30">30 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button 
                  onClick={generateLetter} 
                  disabled={isGenerating}
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-lg rounded-xl transition-all active:scale-[0.98]"
                >
                  {isGenerating ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Drafting Letter...</>
                  ) : (
                    "Generate Legal Notice"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT 60% Panel - Live Preview */}
          <div className="w-full lg:w-[60%] flex flex-col items-center">
            
            {/* Toolbar */}
            <div className="w-full md:w-[80%] flex items-center justify-between mb-4 px-2 print:hidden">
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Live Preview</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={downloadPDF} className="bg-white dark:bg-card hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20 text-slate-600 dark:text-slate-400 hidden sm:flex">
                  <Download className="w-4 h-4 mr-2" /> Export PDF
                </Button>
                <Button variant="outline" size="sm" onClick={copyText} className="bg-white dark:bg-card hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20 text-slate-600 dark:text-slate-400">
                  {hasCopied ? <Check className="w-4 h-4 mr-2 text-emerald-500" /> : <Copy className="w-4 h-4 mr-2" />} 
                  {hasCopied ? "Copied!" : "Copy"}
                </Button>
                <Button variant="outline" size="sm" onClick={printLetter} className="bg-white dark:bg-card hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20 text-slate-600 dark:text-slate-400">
                  <Printer className="w-4 h-4 mr-2" /> Print
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.location.href = `mailto:?subject=Legal Notice&body=${encodeURIComponent(letterContent || "")}`} className="bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 shadow-sm dark:shadow-slate-900/20 hidden sm:flex">
                  <Send className="w-4 h-4 mr-2" /> Email
                </Button>
              </div>
            </div>

            {/* Formatted Notice Document */}
            <motion.div 
              layout
              className="w-full sm:w-[80%] mx-auto bg-white dark:bg-card min-h-[842px] px-10 py-12 md:px-16 md:py-16 shadow-2xl border border-slate-200 dark:border-slate-700 printable-document relative"
              style={{
                background: "url('/paper-texture.png') repeat, #fff",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)" }}
            >
              {isGenerating ? (
                <div className="absolute inset-0 bg-white dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-10 print:hidden">
                   <div className="flex flex-col items-center justify-center p-4 md:p-6 lg:p-8 bg-white dark:bg-card rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
                     <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                     <p className="text-lg font-bold text-slate-800 dark:text-slate-200">Drafting Response...</p>
                     <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Applying legal citations and formatting</p>
                   </div>
                </div>
              ) : null}
              
              <div className="prose prose-sm max-w-none text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-serif leading-relaxed">
                {letterContent || <em className="text-slate-400">Your letter preview will generate here. Complete the fields iteratively to watch it assemble.</em>}
              </div>
            </motion.div>
          </div>

        </div>
      </main>

      <Footer />
      
      {/* Global Print Styles defined inline for layout encapsulation */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          .printable-document { box-shadow: none !important; border: none !important; margin: 0 !important; width: 100% !important; max-width: none !important; }
        }
      `}} />
    </div>
  );
}
