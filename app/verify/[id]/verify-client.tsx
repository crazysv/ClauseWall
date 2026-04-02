"use client";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useRef } from "react";
import { Copy, Download, Share2, ShieldCheck, ShieldAlert, FileText, MapPin, Building, Info, AlertTriangle, ExternalLink , AlertCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toPng } from "html-to-image";
import { toast } from "sonner";

import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import type { Document, Clause } from "@/types";
import { downloadDataUrl } from "@/lib/utils/share";
import { cn } from "@/lib/utils";

interface VerifyClientProps {
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;

  document: Document | null;
  clauses?: Clause[];
  documentId: string;
}

export default function VerifyClient({  document, clauses = [], documentId , isLoading, error, onRetry }: VerifyClientProps) {
  const [isVerified] = useState<boolean>(!!document);
  const [downloading, setDownloading] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Verification link copied to clipboard");
  };

  const handleDownloadPDF = async () => {
    if (!certificateRef.current) return;
    setDownloading(true);
    toast.info("Generating secure certificate...");
    try {
      const url = await toPng(certificateRef.current, { quality: 1.0, pixelRatio: 2, backgroundColor: "#ffffff" });
      downloadDataUrl(url, `clausewall-certificate-${document?.id.substring(0, 8) || 'unknown'}.png`);
      toast.success("Certificate saved successfully");
    } catch (e) {
      toast.error("Failed to generate certificate");
    } finally {
      setDownloading(false);
    }
  };

  const verificationDate = document?.created_at 
    ? new Date(document.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })
    : "Unknown Date";

  
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

      <main role="main" className="flex-1 flex flex-col items-center py-6 md:py-8 lg:py-12 px-4 relative">
        
        {/* Abstract Background Overlay */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none" />
        <div className="absolute top-0 w-full h-64 bg-slate-100 dark:bg-slate-800 -z-10" />

        {/* Top Status Header */}
        <div className="w-full max-w-[600px] text-center mb-8 relative z-10">
          <div className="flex justify-center mb-4">
             {isVerified ? (
                <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center ring-4 ring-green-50 shadow-lg">
                   <ShieldCheck className="w-8 h-8" />
                </div>
             ) : (
                <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center ring-4 ring-red-50 shadow-lg">
                   <ShieldAlert className="w-8 h-8" />
                </div>
             )}
          </div>
          
          <Badge className={cn("text-sm px-4 py-1.5 uppercase font-black tracking-widest border-none shadow-md", isVerified ? "bg-green-600 hover:bg-green-700 text-white" : "bg-red-600 hover:bg-red-700 text-white")}>
             {isVerified ? "✓ Verified Authentic" : "✗ Invalid Record"}
          </Badge>
          
          <h1 className="text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-6">
             {isVerified ? "ClauseWall Trust Certificate" : "Verification Failed"}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium max-w-sm mx-auto">
             {isVerified 
              ? "This document was cryptographically sealed by the ClauseWall Intelligence Engine." 
              : "We could not find a verified document trace matching this cryptographic ID."}
          </p>
        </div>

        {/* Certificate Card Content */}
        {isVerified && document && (
          <div className="w-full max-w-[600px] relative z-10 pb-16">
             
            {/* The Actual Certificate Capture Boundary */}
            <div ref={certificateRef} className="bg-white dark:bg-card border-2 border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden relative isolate print:shadow-none print:border">
               
               {/* Elegant Header Frame */}
               <div className="bg-slate-900 text-white px-4 md:px-4 md:px-6 lg:px-8 py-6 flex items-start justify-between border-b-4 border-indigo-500">
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">Official Document Manifest</span>
                     <h2 className="text-xl font-black truncate max-w-[250px]">{document.original_filename || "Untitled Agreement"}</h2>
                     <p className="text-xs text-slate-400 mt-1 font-medium">{document.id}</p>
                  </div>
                  <div className="text-right flex flex-col items-end">
                     <span className="text-[10px] uppercase font-bold text-slate-400">Scan Date</span>
                     <span className="text-sm font-black">{verificationDate}</span>
                  </div>
               </div>

               <div className="p-4 md:p-6 lg:p-8 space-y-8">
                  
                  {/* Summary Core Block */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-100 flex items-center gap-4">
                        <MapPin className="w-5 h-5 text-indigo-400 shrink-0" />
                        <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jurisdiction</p>
                           <p className="font-bold text-slate-800 dark:text-slate-200 capitalize leading-tight">{document.jurisdiction.replace(/_/g, " ")}</p>
                        </div>
                     </div>
                     <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-100 flex items-center gap-4">
                        <Building className="w-5 h-5 text-indigo-400 shrink-0" />
                        <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Entity</p>
                           <p className="font-bold text-slate-800 dark:text-slate-200 capitalize leading-tight truncate">{document.entity_name || "Unknown"}</p>
                        </div>
                     </div>
                  </div>

                  {/* Cryptographic Proof Area */}
                  <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 relative shadow-inner">
                     <div className="flex items-center gap-2 mb-3">
                        <ShieldCheck className="w-4 h-4 text-green-400" />
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Cryptographic Traces</h3>
                     </div>
                     <div className="space-y-3">
                        <div>
                           <div className="flex justify-between items-center mb-1">
                              <span className="text-[10px] text-slate-400 uppercase font-bold">SHA-256 Checksum</span>
                           </div>
                           <div className="bg-black/50 p-2 rounded flex items-center justify-between group">
                              <code className="text-[10px] text-green-400 break-all font-mono leading-relaxed">
                                 {document.proof_hash || "PENDING_BLOCKCHAIN_SEAL"}
                              </code>
                           </div>
                        </div>
                        {document.proof_cid && (
                           <div>
                              <div className="flex justify-between items-center mb-1">
                                 <span className="text-[10px] text-slate-400 uppercase font-bold">IPFS Network CID</span>
                                 <ExternalLink className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                              </div>
                              <code className="bg-black/50 p-2 rounded block text-[10px] text-blue-400 font-mono">
                                 ipfs://{document.proof_cid}
                              </code>
                           </div>
                        )}
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-800 pt-3 flex items-center gap-1.5">
                           <Info className="w-3 h-3" /> Hash fingerprints independently guarantee file integrity.
                        </p>
                     </div>
                  </div>

                  {/* Key Findings Preview */}
                  <div>
                     <div className="flex items-center justify-between mb-4 border-b pb-2">
                        <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Critical Findings</h3>
                        <div className="flex items-center gap-2">
                           <span className="text-xl font-black text-slate-900 dark:text-slate-100">{document.overall_risk_score}</span>
                           <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">/ 100 Risk</span>
                        </div>
                     </div>
                     
                     {clauses.length > 0 ? (
                        <div className="space-y-3">
                           {clauses.map((clause, idx) => (
                              <div key={idx} className="flex gap-3 items-start">
                                 <AlertTriangle className={cn("w-4 h-4 shrink-0 mt-0.5", clause.risk_level === "illegal" ? "text-purple-600" : clause.risk_level === "dangerous" ? "text-red-500" : "text-yellow-500")} />
                                 <div>
                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 capitalize leading-tight mb-0.5">{clause.clause_type.replace(/_/g, " ")}</p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{clause.explanation}</p>
                                 </div>
                              </div>
                           ))}
                        </div>
                     ) : (
                        <div className="text-center py-6 bg-slate-50 dark:bg-slate-800 rounded-lg">
                           <ShieldCheck className="w-8 h-8 text-green-400 mx-auto mb-2 opacity-50" />
                           <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">No critical predatory clauses were flagged.</p>
                        </div>
                     )}
                  </div>

                  {/* QR Core Verification */}
                  <div className="flex flex-col sm:flex-row items-center justify-between bg-indigo-50/50 p-6 rounded-xl border border-indigo-100 gap-6">
                     <div className="bg-white dark:bg-card p-3 rounded-xl shadow-sm dark:shadow-slate-900/20 border border-slate-100 shrink-0">
                        {typeof window !== "undefined" && (
                           <QRCodeSVG 
                              value={window.location.href}
                              size={120}
                              level="H"
                              fgColor="#0f172a"
                              imageSettings={{
                                 src: "https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://clausewall.com&size=64",
                                 x: undefined,
                                 y: undefined,
                                 height: 24,
                                 width: 24,
                                 excavate: true }}
                           />
                        )}
                     </div>
                     <div className="text-center sm:text-left space-y-2">
                        <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Public Verify Link</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">Scan this code to load this decentralized certificate anywhere to prove analytical baseline intent.</p>
                        <Button variant="outline" size="sm" className="mt-2 h-8 text-xs font-bold uppercase tracking-widest" onClick={handleCopyLink}>
                           <Copy className="w-3 h-3 mr-2" /> Copy Link
                        </Button>
                     </div>
                  </div>

               </div>
            </div>

            {/* Floating Action Controls */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
               <Button onClick={handleDownloadPDF} disabled={downloading} className="w-full sm:w-auto h-12 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest shadow-xl">
                  {downloading ? "Generating..." : <><Download className="w-4 h-4 mr-2" /> Download PDF</>}
               </Button>
               <Button onClick={handleCopyLink} variant="outline" className="w-full sm:w-auto h-12 font-bold text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900">
                  <Share2 className="w-4 h-4 mr-2" /> Network Share
               </Button>
            </div>
             
          </div>
        )}

      </main>
      <Footer />
    </div>
  );
}
