"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Hammer, Search, ShieldCheck, ArrowRight, FileText } from "lucide-react";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const templates = [
  { type: "residential_rental", name: "Residential Rental Agreement", icon: "🏠", clauses: 15, laws: 4, description: "Standard rental agreement for residential property" },
  { type: "commercial_lease", name: "Commercial Lease", icon: "🏢", clauses: 20, laws: 5, description: "Commercial property lease agreement" },
  { type: "employment", name: "Employment Contract", icon: "💼", clauses: 18, laws: 6, description: "Standard employment agreement" },
  { type: "freelance", name: "Freelance Agreement", icon: "💻", clauses: 12, laws: 3, description: "Independent contractor agreement" },
  { type: "service", name: "Service Agreement", icon: "🤝", clauses: 14, laws: 3, description: "General service agreement" },
  { type: "nda", name: "NDA (Non-Disclosure)", icon: "🔒", clauses: 8, laws: 2, description: "Confidentiality agreement" },
  { type: "partnership", name: "Partnership Deed", icon: "👥", clauses: 16, laws: 4, description: "Business partnership agreement" },
  { type: "loan", name: "Loan Agreement", icon: "💰", clauses: 14, laws: 5, description: "Personal or business loan agreement" },
  { type: "sale", name: "Sale Agreement", icon: "📋", clauses: 12, laws: 4, description: "Property or asset sale agreement" },
  { type: "consultancy", name: "Consultancy Agreement", icon: "📊", clauses: 10, laws: 3, description: "Professional consulting agreement" }
];

export default function BuilderSelectionPage() {
  const prefersReducedMotion = useReducedMotion();
  const [search, setSearch] = useState("");

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800 font-sans flex flex-col">
      <Navbar />
      
      <main role="main" className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner mx-auto mb-6">
            <Hammer className="w-8 h-8" />
          </div>
          <h1 className="text-lg md:text-xl lg:text-2xl md:text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl lg:text-4xl text-balance font-black text-slate-900 dark:text-slate-100 tracking-tight">Contract Builder</h1>
          <p className="text-lg font-medium text-slate-600 dark:text-slate-400">
             Generate localized, legally compliant contracts dynamically tuned to Indian state laws. Select a template to begin drafting.
          </p>
          
          <div className="relative max-w-md mx-auto mt-8">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
             <Input 
               aria-label="Search templates"
               placeholder="Search templates (e.g. 'Rental')" 
               className="pl-12 h-14 bg-white dark:bg-card border-slate-200 dark:border-slate-700 rounded-2xl font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 shadow-sm dark:shadow-slate-900/20 text-base"
               value={search}
               onChange={(e) => setSearch(e.target.value)}
             />
          </div>
        </div>

        {/* Template Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {filteredTemplates.map((tpl, i) => (
             <motion.div
               key={tpl.type}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.05 }}
             >
               <Link href={`/builder/${tpl.type}`}>
                 <Card className="h-full bg-white dark:bg-card border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm dark:shadow-slate-900/20 hover:shadow-md hover:border-indigo-200 transition-all group overflow-hidden relative cursor-pointer flex flex-col">
                   {/* Hover Gradient line */}
                   <div className="absolute top-0 inset-x-0 h-1 bg-transparent group-hover:bg-indigo-500 transition-colors" />
                   
                   <CardContent className="p-6 flex-1 flex flex-col">
                     <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 flex items-center justify-center text-lg md:text-xl lg:text-2xl shadow-inner group-hover:bg-indigo-50 dark:hover:bg-indigo-950/30 group-hover:border-indigo-100 transition-colors">
                           {tpl.icon}
                        </div>
                        <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase border border-emerald-100">
                           <ShieldCheck className="w-3 h-3" />
                           Compliance Locked
                        </div>
                     </div>
                     
                     <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-2 group-hover:text-indigo-700 transition-colors">{tpl.name}</h3>
                     <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6 flex-1 leading-relaxed">{tpl.description}</p>
                     
                     <div className="flex items-center gap-3 mb-6">
                        <Badge variant="outline" className="border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold bg-slate-50 dark:bg-slate-800">
                           <FileText className="w-3 h-3 mr-1.5" /> {tpl.clauses} Clauses
                        </Badge>
                        <Badge variant="outline" className="border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold bg-slate-50 dark:bg-slate-800">
                           <ShieldCheck className="w-3 h-3 mr-1.5" /> {tpl.laws} Statutes
                        </Badge>
                     </div>
                     
                     <div className="w-full flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                        <span className="text-xs font-black uppercase tracking-widest text-indigo-600">Use Template</span>
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                           <ArrowRight className="w-4 h-4" />
                        </div>
                     </div>
                   </CardContent>
                 </Card>
               </Link>
             </motion.div>
           ))}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}