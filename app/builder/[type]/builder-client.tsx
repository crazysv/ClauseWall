"use client";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Scale,
  Sparkles,
  Info,
  CheckCircle2,
  Copy,
  Download,
  Printer,
  ShieldCheck,
  Plus
, AlertCircle } from "lucide-react";
import { getGroupedFields, INDIAN_STATES } from "@/lib/builder/template-fields";
import { ContractTemplateType, TemplateField, GeneratedContract } from "@/types";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";

interface BuilderClientProps {
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;

  templateConfig: any; // Assuming imported config type
  templateType: ContractTemplateType;
}

export default function BuilderClient({  templateConfig, templateType , isLoading, error, onRetry }: BuilderClientProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [jurisdiction, setJurisdiction] = useState("ALL-INDIA");
  const [generatedContract, setGeneratedContract] = useState<GeneratedContract | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [optionalClauses, setOptionalClauses] = useState<Record<string, boolean>>({
     dispute_resolution: true,
     force_majeure: false,
     severability: true
  });

  const groupedFields = getGroupedFields(templateConfig.fields);
  const groupNames = Object.keys(groupedFields);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/builder/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateType,
          jurisdiction,
          formData,
          optionalClauses
        }) });

      const data = await response.json();
      if (data.contract_id) {
        setGeneratedContract(data);
      }
    } catch {
        // Silently handled
      } finally {
      setIsGenerating(false);
    }
  };

  const renderField = (field: TemplateField) => {
    const value = formData[field.name] || "";

    const baseInputClass = "w-full h-11 bg-white border-slate-200 text-slate-900 rounded-xl font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 shadow-inner text-sm";

    
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
      <div key={field.name} className="space-y-2 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 rounded-2xl relative group">
        <div className="flex justify-between items-start">
           <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
             {field.label} {field.required && <span className="text-rose-500">*</span>}
           </Label>
           <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] shadow-none flex gap-1">
              <CheckCircle2 className="w-3 h-3" /> Act Validated
           </Badge>
        </div>

        {field.type === "select" ? (
          <select
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            className={baseInputClass + " px-3"}
          >
            <option value="">Select...</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : field.type === "textarea" ? (
          <textarea
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            placeholder={field.placeholder}
            rows={3}
            className={baseInputClass + " p-3 h-auto resize-none"}
          />
        ) : (
          <Input
            type={field.type === "number" || field.type === "currency" ? "number" : field.type === "date" ? "date" : "text"}
            value={value}
            placeholder={field.placeholder}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            className={baseInputClass}
          />
        )}
        
        {field.helpText && (
          <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mt-2 flex items-center gap-1">
            <Info className="w-3 h-3" /> {field.helpText}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800 font-sans flex flex-col overflow-hidden">
      <Navbar />

      <main role="main" className="flex-1 w-full max-w-[1400px] mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8 items-start h-[calc(100vh-80px)]">
        
        {/* LEFT PANEL: 55% Form */}
        <div className="w-full lg:w-[55%] h-full flex flex-col space-y-6">
           <div className="flex items-center justify-between shrink-0">
              <Link href="/builder" className="text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest flex items-center gap-1">
                 <ArrowLeft className="w-3 h-3" /> Back to Templates
              </Link>
           </div>
           
           <div className="shrink-0 space-y-2">
              <h1 className="text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
                 {templateConfig.name}
                 <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-none">Drafting</Badge>
              </h1>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                 Complete the dynamic fields below. Ensure accuracy as they map directly to legal clauses.
              </p>
           </div>
           
           <ScrollArea className="flex-1 pr-4 -mr-4">
              <div className="space-y-8 pb-12 pr-4">
                 
                 {/* Jurisdiction Box */}
                 <div className="bg-white dark:bg-card border rounded-3xl p-6 shadow-sm dark:shadow-slate-900/20 border-slate-200 dark:border-slate-700">
                    <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                       <Scale className="w-4 h-4 text-indigo-600" /> Governing Jurisdiction
                    </h2>
                    <select
                      value={jurisdiction}
                      onChange={(e) => setJurisdiction(e.target.value)}
                      className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 shadow-inner px-4 text-sm"
                    >
                      <option value="ALL-INDIA">All India (Central Statutes)</option>
                      {INDIAN_STATES.map((state) => (
                        <option key={state.value} value={state.value}>{state.label}</option>
                      ))}
                    </select>
                 </div>

                 {/* Dynamic Groups */}
                 {groupNames.map((group) => (
                    <div key={group} className="bg-white dark:bg-card border rounded-3xl p-6 shadow-sm dark:shadow-slate-900/20 border-slate-200 dark:border-slate-700">
                       <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 mb-6 uppercase tracking-widest">{group}</h2>
                       <div className="space-y-4">
                          {groupedFields[group].map(renderField)}
                       </div>
                    </div>
                 ))}

                 {/* Optional Clauses */}
                 <div className="bg-white dark:bg-card border rounded-3xl p-6 shadow-sm dark:shadow-slate-900/20 border-slate-200 dark:border-slate-700">
                    <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 mb-6 uppercase tracking-widest">Optional Protections</h2>
                    <div className="space-y-4">
                       {Object.keys(optionalClauses).map(opt => (
                          <div key={opt} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100">
                             <div>
                                <h4 className="text-xs font-bold text-slate-700 capitalize">{opt.replace("_", " ")} Clause</h4>
                                <p className="text-[10px] text-slate-400 font-medium">Auto-populates strict liability phrasing.</p>
                             </div>
                             <Switch 
                                checked={optionalClauses[opt]} 
                                onCheckedChange={(v) => setOptionalClauses({...optionalClauses, [opt]: v})}
                             />
                          </div>
                       ))}
                       <Button variant="outline" className="w-full h-11 border-dashed border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 font-bold uppercase tracking-widest text-xs">
                          <Plus className="w-4 h-4 mr-2" /> Add Custom Clause
                       </Button>
                    </div>
                 </div>
              </div>
           </ScrollArea>
           
           <div className="shrink-0 pt-4 bg-slate-50 dark:bg-slate-800 z-10 w-full mb-4 lg:mb-0">
              <Button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black tracking-widest uppercase transition-all shadow-md text-sm rounded-2xl"
              >
                 {isGenerating ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                 ) : (
                    <Sparkles className="w-5 h-5 mr-2" />
                 )}
                 {isGenerating ? "Drafting Document..." : "Generate Contract"}
              </Button>
           </div>
        </div>

        {/* RIGHT PANEL: 45% Preview */}
        <div className="w-full lg:w-[45%] h-full flex flex-col bg-slate-200/50 rounded-3xl p-4 lg:p-6 shadow-inner relative overflow-hidden">
           
           <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Live Document Preview</h3>
              <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200 gap-1 shadow-sm dark:shadow-slate-900/20">
                 <ShieldCheck className="w-3 h-3" /> All clauses comply with Indian law
              </Badge>
           </div>

           <div className="flex-1 overflow-hidden relative border border-slate-200 dark:border-slate-700 shadow-2xl bg-white dark:bg-card mx-auto w-full max-w-[500px] rounded-sm flex flex-col">
              {/* Paper styled preview container */}
              <ScrollArea className="flex-1 w-full relative">
                 <div className="p-4 md:p-6 lg:p-8 sm:p-12 min-h-full font-serif text-slate-800 dark:text-slate-200 pointer-events-none select-none relative">
                    {/* Watermark */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-5">
                       <ShieldCheck className="w-64 h-64" />
                    </div>

                    <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-center mb-12 uppercase decoration-double underline underline-offset-8">
                       {templateConfig.name}
                    </h1>

                    <div className="space-y-6 text-[13px] leading-relaxed tracking-wide text-justify">
                       {/* Mock preamble */}
                       <p>
                          THIS AGREEMENT is made and entered into on this <span className="bg-yellow-100 px-1 font-bold text-slate-900 dark:text-slate-100 border border-yellow-200 rounded">___ day of ______ 20__</span>, at <span className="bg-yellow-100 px-1 font-bold text-slate-900 dark:text-slate-100 border border-yellow-200 rounded">{jurisdiction}</span>.
                       </p>

                       <div>
                          <p className="font-bold underline uppercase text-xs mb-2 tracking-widest mt-8">I. Definitions Mapping</p>
                          {Object.keys(formData).length === 0 ? (
                             <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                          ) : (
                             <ul className="list-disc pl-5 space-y-2">
                                {Object.entries(formData).map(([k, v]) => (
                                   <li key={k}>
                                      The term <strong>"{k.replace(/_/g, " ").toUpperCase()}"</strong> shall refer to: 
                                      <span className="bg-yellow-100 px-1 border border-yellow-200 font-bold ml-1 rounded">
                                         {v || "______________"}
                                      </span>
                                   </li>
                                ))}
                             </ul>
                          )}
                       </div>

                       <div>
                          <p className="font-bold underline uppercase text-xs mb-2 tracking-widest mt-8">II. Standard Clauses</p>
                          {templateConfig.fields.slice(0, 3).map((f: any, i: number) => (
                             <p key={i} className="mb-3">
                                {i+1}. <strong>{f.label}</strong>. Both parties agree that the conditions regulating {f.label.toLowerCase()} are stringently bound by statutory provisions. 
                                <span className={formData[f.name] ? 'bg-yellow-100 px-1 font-bold ml-1 rounded' : 'text-slate-400 font-mono ml-1'}>
                                   {formData[f.name] || "[Awaiting input]"}
                                </span>.
                             </p>
                          ))}
                       </div>
                       
                       {/* Blurred bottom to signify continuation */}
                       <div className="h-48 bg-gradient-to-b from-transparent to-white w-full absolute bottom-0 left-0" />
                    </div>
                 </div>
              </ScrollArea>
           </div>

           {/* Preview Actions Footer */}
           <div className="mt-4 flex items-center justify-center gap-4 bg-white dark:bg-card p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20 shrink-0">
              <Button variant="ghost" className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl font-bold flex gap-2 w-full">
                 <Download className="w-4 h-4" /> Download
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Button variant="ghost" className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl font-bold flex gap-2 w-full">
                 <Copy className="w-4 h-4" /> Copy
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Button variant="ghost" className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl font-bold flex gap-2 w-full">
                 <Printer className="w-4 h-4" /> Print
              </Button>
           </div>
        </div>

      </main>
    </div>
  );
}
