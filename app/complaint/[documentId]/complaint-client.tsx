"use client";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, ArrowRight, ArrowLeft, Download, MapPin, Scale, FileText, IndianRupee, Map, FileCheck, Truck, DownloadCloud, Edit3, Loader2, Building2, CheckSquare, Square, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Document, Clause } from "@/types";

interface FeeBreakdown {
  courtFee: number;
  filingFee: number;
  advocateFee: { min: number; max: number };
  postalCharges: number;
  total: number;
}

interface ComplaintClientProps {
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;

  document: Document;
  clauses: Clause[];
}

const STEPS = [
  "Determine Forum",
  "Prepare Complaint",
  "Calculate Fees",
  "Review & File",
  "Track Status"
];

export default function ComplaintClient({  document, clauses , isLoading, error, onRetry }: ComplaintClientProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedForum, setSelectedForum] = useState<string | null>("District Consumer Disputes Redressal Commission");
  const [complaintDraft, setComplaintDraft] = useState<string | null>(null);
  const [feeBreakdown, setFeeBreakdown] = useState<FeeBreakdown | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [complainantDetails, setComplainantDetails] = useState({ name: "", address: "", phone: "", email: "" });
  const [selectedViolations, setSelectedViolations] = useState<string[]>([]);
  const [documentsChecklist, setDocumentsChecklist] = useState<Record<string, boolean>>({
     doc1: false, doc2: false, doc3: false, doc4: false
  });
  const [direction, setDirection] = useState(1); // 1 for right, -1 for left

  // Mock API logic on step transitions
  const handleNext = () => {
     if (currentStep === 5) return;
     
     if (currentStep === 1) {
        setIsGenerating(true);
        setTimeout(() => {
           setComplaintDraft(`BEFORE THE DISTRICT CONSUMER DISPUTES REDRESSAL COMMISSION\nAT ${document.jurisdiction?.toUpperCase() || "NEW DELHI"}\nIN THE MATTER OF:\n[Your Name]\n[Your Address]\n... Complainant\nVERSUS\n${document.entity_name || "The Opposite Party"}\n... Opposite Party\nCOMPLAINT UNDER SECTION 35 OF THE CONSUMER PROTECTION ACT, 2019\nRESPECTFULLY SHOWETH:\n1. That the complainant is a consumer as defined under Section 2(7) of the Act.\n2. That the Opposite Party inserted one-sided, arbitrary, and predatory clauses in the Contract dated ${document.created_at ? new Date(document.created_at).toLocaleDateString() : "[Date]"} namely:\n${clauses.filter(c => c.risk_level === "illegal" || c.risk_level === "dangerous").map(c => `   - ${c.original_text}`).join("\n")}\n3. This constitutes "unfair contract" under Section 2(46) of the Act.\nPRAYER:\nIn view of the above submissions, it is prayed that this Hon'ble Commission may be pleased to:\na) Declare the impugned clauses null and void.\nb) Direct refund of exacted amounts along with 18% interest.\nc) Award compensation for mental agony.\nPLACE: ${document.jurisdiction || "__________"}\nDATE: ${new Date().toLocaleDateString()}`);
           setIsGenerating(false);
           setDirection(1);
           setCurrentStep(2);
        }, 1200);
        return;
     }

     if (currentStep === 2) {
        setIsGenerating(true);
        setTimeout(() => {
           setFeeBreakdown({
              courtFee: 500,
              filingFee: 100,
              advocateFee: { min: 10000, max: 25000 },
              postalCharges: 250,
              total: 850
           });
           setIsGenerating(false);
           setDirection(1);
           setCurrentStep(3);
        }, 800);
        return;
     }

     if (currentStep === 3 || currentStep === 4) {
        setDirection(1);
        setCurrentStep(prev => prev + 1);
     }
  };

  const handlePrev = () => {
    if (currentStep === 1) return;
    setDirection(-1);
    setCurrentStep(prev => prev - 1);
  };

  const toggleChecklist = (id: string) => {
     setDocumentsChecklist(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const slideVariants: any = {
    initial: (dir: number) => ({ x: dir > 0 ? 30 : -30, opacity: 0 }),
    active: { x: 0, opacity: 1, transition: { duration: 0.3, ease: "easeOut" } },
    exit: (dir: number) => ({ x: dir < 0 ? 30 : -30, opacity: 0, transition: { duration: 0.2, ease: "easeIn" } }) };

  
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
      
      <main role="main" className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-4 md:px-6 py-6 sm:py-10 pb-32">
        
        {/* Header & Stepper */}
        <div className="mb-8 sm:mb-12">
           <h1 className="text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight flex items-center gap-3">
             <Scale className="w-8 h-8 text-indigo-600" /> Complaint Filing Builder
           </h1>
           <p className="text-slate-500 dark:text-slate-400 font-medium mt-2 max-w-2xl">
             Generate a court-ready regulatory complaint to strike down predatory clauses autonomously.
           </p>

           <div className="mt-8 relative">
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 rounded-full hidden sm:block z-0" />
              <div 
                 className="absolute top-1/2 left-0 h-1 bg-indigo-600 -translate-y-1/2 rounded-full hidden sm:block transition-all duration-500 ease-out z-0" 
                 style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
              />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 relative z-10 w-full">
                 {STEPS.map((stepLabel, idx) => {
                    const isActive = currentStep === idx + 1;
                    const isCompleted = currentStep > idx + 1;
                    return (
                       <div key={idx} className="flex sm:flex-col items-center gap-3 sm:gap-2 bg-slate-50 dark:bg-slate-800 sm:bg-transparent px-2 sm:px-0">
                          <div className={cn(
                             "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm transition-colors",
                             isActive ? "bg-indigo-600 text-white ring-4 ring-indigo-100" : 
                             isCompleted ? "bg-emerald-500 text-white" : "bg-white text-slate-400 border border-slate-200"
                          )}>
                             {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
                          </div>
                          <span className={cn(
                             "text-xs sm:text-sm font-bold",
                             isActive ? "text-indigo-900" : isCompleted ? "text-slate-700" : "text-slate-400"
                          )}>
                             {stepLabel}
                          </span>
                       </div>
                    )
                 })}
              </div>
           </div>
        </div>

        {/* Step Content Container */}
        <div className="relative min-h-[500px]">
           <AnimatePresence mode="wait" custom={direction}>
              
              {/* STEP 1: Determine Forum */}
              {currentStep === 1 && (
                 <motion.div key="step1" custom={direction} variants={slideVariants} initial="initial" animate="active" exit="exit" className="space-y-6">
                    <Card className="border-indigo-100 shadow-sm dark:shadow-slate-900/20 bg-white dark:bg-card overflow-hidden">
                       <div className="bg-indigo-50/50 border-b border-indigo-100 px-4 md:px-6 py-4 flex items-center gap-3">
                          <Building2 className="w-6 h-6 text-indigo-600" />
                          <div>
                             <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">AI Recommended Jurisdiction</h2>
                             <p className="text-xs text-indigo-600/80 font-bold uppercase tracking-widest mt-0.5">Automated Assignment</p>
                          </div>
                       </div>
                       <CardContent className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div>
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 mb-4 px-3 py-1 font-bold">Optimal Forum Found</Badge>
                                <h3 className="text-lg md:text-xl lg:text-2xl font-black text-slate-900 dark:text-slate-100 mb-2">{selectedForum}</h3>
                                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6">
                                   Because the estimated service valuation is below ₹50 Lakhs and this constitutes an "unfair contract" under the Consumer Protection Act 2019, the District Commission is the precise legal venue requiring the lowest fees and offering expedited proceedings.
                                </p>
                                
                                <div className="space-y-3">
                                   <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border border-slate-100">
                                      <MapPin className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                                      <div>
                                         <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Filing Location</p>
                                         <p className="text-xs text-slate-500 dark:text-slate-400">{document.jurisdiction || "Local"} District (Applicable to opposite party's branch office)</p>
                                      </div>
                                   </div>
                                   <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border border-slate-100">
                                      <Scale className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                      <div>
                                         <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Legal Basis</p>
                                         <p className="text-xs text-slate-500 dark:text-slate-400">Sec 2(46), Consumer Protection Act 2019</p>
                                      </div>
                                   </div>
                                </div>
                             </div>

                             <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700/60">
                                <h4 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-widest">Available Alternatives</h4>
                                <div className="space-y-4">
                                   <div className="opacity-50">
                                      <p className="text-sm font-bold text-slate-600 dark:text-slate-400 line-through">State Consumer Commission</p>
                                      <p className="text-xs text-slate-400 mt-1">Claim does not exceed ₹50 Lakhs.</p>
                                   </div>
                                   <div className="opacity-50">
                                      <p className="text-sm font-bold text-slate-600 dark:text-slate-400 line-through">Civil Court (Standard Suit)</p>
                                      <p className="text-xs text-slate-400 mt-1">Slower, requires expensive ad-valorem court fees (often 2-5% of claim).</p>
                                   </div>
                                   <div className="opacity-50">
                                      <p className="text-sm font-bold text-slate-600 dark:text-slate-400 line-through">Arbitration Tribunal</p>
                                      <p className="text-xs text-slate-400 mt-1">Mandatory arbitration over predatory consumer terms is often invalid.</p>
                                   </div>
                                </div>
                             </div>
                          </div>
                       </CardContent>
                    </Card>
                 </motion.div>
              )}

              {/* STEP 2: Prepare Complaint */}
              {currentStep === 2 && (
                 <motion.div key="step2" custom={direction} variants={slideVariants} initial="initial" animate="active" exit="exit" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[600px]">
                       {/* Left Form */}
                       <Card className="lg:col-span-5 h-full flex flex-col border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20">
                          <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50 dark:bg-slate-800/50">
                             <CardTitle className="text-lg flex items-center gap-2"><Edit3 className="w-5 h-5 text-indigo-600" /> Prepare Draft</CardTitle>
                             <CardDescription>Fill missing details to auto-compile the legal plea.</CardDescription>
                          </CardHeader>
                          <ScrollArea className="flex-1 p-6">
                             <div className="space-y-5">
                                <div className="space-y-2">
                                   <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Complainant Name</label>
                                   <Input placeholder="E.g., Rahul Sharma" value={complainantDetails.name} onChange={(e) => setComplainantDetails({...complainantDetails, name: e.target.value})} className="bg-white dark:bg-slate-900" />
                                </div>
                                <div className="space-y-2">
                                   <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Complainant Address</label>
                                   <Textarea placeholder="Full residential address" value={complainantDetails.address} onChange={(e) => setComplainantDetails({...complainantDetails, address: e.target.value})} className="bg-white dark:bg-slate-900 resize-none" rows={3} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   <div className="space-y-2">
                                      <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Phone</label>
                                      <Input placeholder="+91..." value={complainantDetails.phone} onChange={(e) => setComplainantDetails({...complainantDetails, phone: e.target.value})} className="bg-white dark:bg-slate-900" />
                                   </div>
                                   <div className="space-y-2">
                                      <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Email</label>
                                      <Input placeholder="email@ext.com" value={complainantDetails.email} onChange={(e) => setComplainantDetails({...complainantDetails, email: e.target.value})} className="bg-white dark:bg-slate-900" />
                                   </div>
                                </div>
                                
                                <Separator />

                                <div className="space-y-3">
                                   <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Contested Clauses Bound</label>
                                   {clauses.filter(c => c.risk_level === "illegal" || c.risk_level === "dangerous").map((c, i) => (
                                      <div key={i} className="flex gap-3 items-start bg-rose-50/50 p-3 rounded-md border border-rose-100">
                                         <CheckSquare className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                         <p className="text-xs font-medium text-rose-900 leading-relaxed">
                                            {c.original_text}
                                         </p>
                                      </div>
                                   ))}
                                </div>
                             </div>
                          </ScrollArea>
                       </Card>

                       {/* Right Preview */}
                       <Card className="lg:col-span-7 h-full flex flex-col bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                          <CardHeader className="pb-3 pt-4 border-b border-slate-200 dark:border-slate-700 bg-slate-200/50">
                             <div className="flex items-center justify-between">
                                <CardTitle className="text-sm text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest">Live Auto-Generated Preview</CardTitle>
                                <Badge variant="outline" className="bg-white dark:bg-slate-900 font-bold opacity-60">Read-Only View</Badge>
                             </div>
                          </CardHeader>
                          <ScrollArea className="flex-1 p-6">
                             <div className="bg-white dark:bg-card min-h-full p-4 md:p-6 lg:p-8 rounded-sm shadow-md font-serif text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap outline outline-1 outline-slate-200">
                                {complaintDraft}
                             </div>
                          </ScrollArea>
                       </Card>
                    </div>
                 </motion.div>
              )}

              {/* STEP 3: Calculate Fees */}
              {currentStep === 3 && (
                 <motion.div key="step3" custom={direction} variants={slideVariants} initial="initial" animate="active" exit="exit" className="max-w-2xl mx-auto space-y-6">
                    <Card className="border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20 overflow-hidden">
                       <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100">
                          <CardTitle className="flex items-center gap-2"><IndianRupee className="w-5 h-5 text-emerald-600" /> Estimated Filing Strategy & Fees</CardTitle>
                          <CardDescription>A breakdown of mandatory dues and avoidable costs.</CardDescription>
                       </CardHeader>
                       <CardContent className="p-0">
                          <table className="w-full text-left text-sm">
                             <tbody className="divide-y divide-slate-100">
                                <tr className="bg-white dark:bg-slate-900">
                                   <td className="px-4 md:px-6 py-4 font-bold text-slate-700 w-2/3">Mandatory Statutory Court Fee <br/><span className="text-xs font-normal text-slate-500 dark:text-slate-400">For claims up to ₹5 Lakhs</span></td>
                                   <td className="px-4 md:px-6 py-4 text-right font-black text-slate-900 dark:text-slate-100">₹{feeBreakdown?.courtFee}</td>
                                </tr>
                                <tr className="bg-white dark:bg-slate-900">
                                   <td className="px-4 md:px-6 py-4 font-bold text-slate-700">Digital Filing Registration</td>
                                   <td className="px-4 md:px-6 py-4 text-right font-black text-slate-900 dark:text-slate-100">₹{feeBreakdown?.filingFee}</td>
                                </tr>
                                <tr className="bg-white dark:bg-slate-900">
                                   <td className="px-4 md:px-6 py-4 font-bold text-slate-700">Registered Post with Acknowledgement Due (RPAD)</td>
                                   <td className="px-4 md:px-6 py-4 text-right font-black text-slate-900 dark:text-slate-100">₹{feeBreakdown?.postalCharges}</td>
                                </tr>
                                <tr className="bg-slate-50 dark:bg-slate-800/50">
                                   <td className="px-4 md:px-6 py-4">
                                      <p className="font-bold text-slate-700 flex items-center gap-2">Advocate Retainer (Optional) <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-[10px]">Avoidable</Badge></p>
                                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Under CP Act, lawyers are not mandatory to argue your own case regarding predatory contracts.</p>
                                   </td>
                                   <td className="px-4 md:px-6 py-4 text-right font-black text-slate-400 line-through">₹{feeBreakdown?.advocateFee.min} - ₹{feeBreakdown?.advocateFee.max}</td>
                                </tr>
                             </tbody>
                             <tfoot className="bg-emerald-50 border-t-2 border-emerald-100">
                                <tr>
                                   <td className="px-4 md:px-6 py-5 font-black text-emerald-900 text-lg">Total Personal Filing Cost</td>
                                   <td className="px-4 md:px-6 py-5 text-right font-black text-emerald-700 text-lg md:text-xl lg:text-2xl">₹{feeBreakdown?.total}</td>
                                </tr>
                             </tfoot>
                          </table>
                       </CardContent>
                    </Card>

                    <div className="bg-indigo-50 border-l-4 border-l-indigo-500 p-4 rounded-r-lg">
                       <p className="text-sm font-bold text-indigo-900 mb-1">ClauseWall Arbitration Note:</p>
                       <p className="text-xs text-indigo-700 leading-relaxed">By filing this auto-generated draft autonomously ("in-person"), you entirely bypass the immense cost drag that makes negotiating bad terms unprofitable. The draft natively binds explicit statutory laws preventing the immediate dismissal of unrepresented plaintiffs.</p>
                    </div>
                 </motion.div>
              )}

              {/* STEP 4: Review & File */}
              {currentStep === 4 && (
                 <motion.div key="step4" custom={direction} variants={slideVariants} initial="initial" animate="active" exit="exit" className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Documents Checklist */}
                    <Card className="border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20 h-fit">
                       <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100">
                          <CardTitle className="text-lg flex items-center gap-2"><FileCheck className="w-5 h-5 text-indigo-600" /> Pre-Filing Checklist</CardTitle>
                          <CardDescription>Physically compile these required exhibits before paying the fee.</CardDescription>
                       </CardHeader>
                       <CardContent className="p-6 space-y-4">
                          <div className="flex items-start gap-3 cursor-pointer" onClick={() => toggleChecklist("doc1")}>
                             {documentsChecklist.doc1 ? <CheckSquare className="w-5 h-5 text-indigo-600 shrink-0" /> : <Square className="w-5 h-5 text-slate-300 shrink-0" />}
                             <div>
                                <p className={cn("text-sm font-bold transition-colors", documentsChecklist.doc1 ? "text-slate-900" : "text-slate-600")}>Original Executed Agreement Copy</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Notarised True Copy or Original showing the highlighted predatory clauses.</p>
                             </div>
                          </div>
                          <Separator />
                          <div className="flex items-start gap-3 cursor-pointer" onClick={() => toggleChecklist("doc2")}>
                             {documentsChecklist.doc2 ? <CheckSquare className="w-5 h-5 text-indigo-600 shrink-0" /> : <Square className="w-5 h-5 text-slate-300 shrink-0" />}
                             <div>
                                <p className={cn("text-sm font-bold transition-colors", documentsChecklist.doc2 ? "text-slate-900" : "text-slate-600")}>ClauseWall Analytical Report</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Attach the auto-generated PDF evaluation backing your Sec 2(46) plea.</p>
                             </div>
                          </div>
                          <Separator />
                          <div className="flex items-start gap-3 cursor-pointer" onClick={() => toggleChecklist("doc3")}>
                             {documentsChecklist.doc3 ? <CheckSquare className="w-5 h-5 text-indigo-600 shrink-0" /> : <Square className="w-5 h-5 text-slate-300 shrink-0" />}
                             <div>
                                <p className={cn("text-sm font-bold transition-colors", documentsChecklist.doc3 ? "text-slate-900" : "text-slate-600")}>Identity Verification (Aadhar/PAN)</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Self-attested photocopies of {complainantDetails.name || "[Your Name]"}.</p>
                             </div>
                          </div>
                          <Separator />
                          <div className="flex items-start gap-3 cursor-pointer" onClick={() => toggleChecklist("doc4")}>
                             {documentsChecklist.doc4 ? <CheckSquare className="w-5 h-5 text-indigo-600 shrink-0" /> : <Square className="w-5 h-5 text-slate-300 shrink-0" />}
                             <div>
                                <p className={cn("text-sm font-bold transition-colors", documentsChecklist.doc4 ? "text-slate-900" : "text-slate-600")}>Proof of Payment / Receipts</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Any monetary deposits already trapped by the opposed party.</p>
                             </div>
                          </div>
                       </CardContent>
                    </Card>

                    {/* Right: Actions */}
                    <Card className="border-indigo-100 shadow-sm dark:shadow-slate-900/20 bg-gradient-to-br from-indigo-50/50 to-white h-fit">
                       <CardHeader>
                          <CardTitle className="text-lg">Final Execution Block</CardTitle>
                          <CardDescription>Submit documents physically or utilize the Central E-Daakhil conduit.</CardDescription>
                       </CardHeader>
                       <CardContent className="p-6 space-y-6 pt-0">
                          
                          <Button size="lg" className="w-full bg-slate-900 text-white font-bold h-14 shadow-md" onClick={() => window.print()}>
                             <DownloadCloud className="w-5 h-5 mr-3" /> Download Complaint Pack (ZIP)
                          </Button>
                          
                          <div className="relative">
                             <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200 dark:border-slate-700" /></div>
                             <div className="relative flex justify-center text-xs uppercase"><span className="bg-indigo-50 px-2 text-slate-500 dark:text-slate-400 tracking-widest font-bold">OR FILE ONLINE</span></div>
                          </div>

                          <div className="bg-white dark:bg-card border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20 rounded-xl p-5 text-center">
                             <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">E-Daakhil Central Portal</p>
                             <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 px-4 line-clamp-2">Register with the official digital conduit bypassing physical presence for initialization.</p>
                             <Button variant="outline" className="w-full border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100 font-bold">
                                Navigate to E-Daakhil <ArrowRight className="w-4 h-4 ml-2" />
                             </Button>
                          </div>

                       </CardContent>
                    </Card>
                 </motion.div>
              )}

              {/* STEP 5: Track Status */}
              {currentStep === 5 && (
                 <motion.div key="step5" custom={direction} variants={slideVariants} initial="initial" animate="active" exit="exit" className="max-w-3xl mx-auto">
                    <Card className="border-emerald-200 border-t-8 border-t-emerald-500 shadow-lg text-center p-4 md:p-6 lg:p-8 sm:p-12">
                       <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                          <CheckCircle className="w-10 h-10 text-emerald-600" />
                       </div>
                       <h2 className="text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-100 mb-3">Complaint Pack Generated!</h2>
                       <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-lg mx-auto leading-relaxed">
                          Your legal documents are bundled and ready. You must now file them through the respective commission using the instructions enclosed in the ZIP.
                       </p>

                       <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-left relative overflow-hidden">
                          <div className="absolute top-0 bottom-0 left-6 w-1 bg-slate-200" />
                          <div className="space-y-6">
                             <div className="relative flex items-center gap-6 z-10">
                                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 border-4 border-slate-50 shadow-sm dark:shadow-slate-900/20">
                                   <Check className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                   <p className="text-sm font-bold text-emerald-700">Generated & Prepared</p>
                                   <p className="text-xs text-slate-500 dark:text-slate-400">Completed precisely locally</p>
                                </div>
                             </div>
                             <div className="relative flex items-center gap-6 z-10">
                                <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center shrink-0 border-4 border-slate-50 shadow-sm dark:shadow-slate-900/20">
                                   <Loader2 className="w-4 h-4 text-white animate-spin" />
                                </div>
                                <div>
                                   <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Awaiting Filing Confirmatory Receipt</p>
                                   <p className="text-xs text-slate-500 dark:text-slate-400">Upload your court 'Diary Number' once returned</p>
                                </div>
                             </div>
                             <div className="relative flex items-center gap-6 z-10 opacity-50">
                                <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center shrink-0 border-4 border-slate-50">
                                   <Truck className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                   <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Summons Dispatched</p>
                                   <p className="text-xs text-slate-500 dark:text-slate-400">-</p>
                                </div>
                             </div>
                          </div>
                       </div>
                       
                       <Button variant="outline" className="mt-8 font-bold text-slate-600 dark:text-slate-400" onClick={() => router.push('/dashboard')}>
                          Return to Dashboard
                       </Button>
                    </Card>
                 </motion.div>
              )}
           </AnimatePresence>
        </div>

      </main>

      {/* Persistent Bottom Fixed Navigation Block */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-card border-t border-slate-200 dark:border-slate-700 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.1)] p-4 sm:p-5 z-50">
         <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Button 
               variant="outline" 
               className={cn("bg-white font-bold h-12 px-6", currentStep === 1 || currentStep === 5 ? "opacity-0 pointer-events-none" : "")}
               onClick={handlePrev}
            >
               <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            
            <Button 
               className={cn("bg-indigo-600 hover:bg-indigo-700 text-white font-black h-12 px-8 min-w-[200px]", currentStep === 5 ? "hidden" : "")}
               onClick={handleNext}
               disabled={isGenerating}
            >
               {isGenerating ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
               {currentStep === 4 ? "Mark as Prepared" : isGenerating ? "Processing..." : "Continue"} {!isGenerating && currentStep !== 4 && <ArrowRight className="w-5 h-5 ml-2" />}
            </Button>
         </div>
      </div>
      
    </div>
  );
}
