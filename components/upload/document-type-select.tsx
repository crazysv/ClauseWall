"use client";

import { Home, Briefcase, Handshake, Landmark, FileText } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function DocumentTypeSelect() {
  return (
    <div className="flex flex-col gap-2 w-full">
      <label htmlFor="document-type" className="text-sm font-semibold text-slate-700 ml-0.5">
        Contract Type
      </label>
      
      <Select defaultValue="">
        <SelectTrigger 
          id="document-type" 
          className="w-full h-11 bg-white dark:bg-card border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-medium rounded-xl shadow-sm dark:shadow-slate-900/20 hover:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
        >
          <SelectValue placeholder="Select specific legal category..." className="font-normal" />
        </SelectTrigger>
        
        <SelectContent className="bg-white dark:bg-card border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-1.5 min-w-[240px]">
          <SelectItem value="lease" className="rounded-lg cursor-pointer focus:bg-indigo-50 focus:text-indigo-900 data-[state=checked]:bg-indigo-50 data-[state=checked]:text-indigo-700 data-[state=checked]:font-extrabold transition-colors my-0.5">
             <div className="flex items-center gap-3 py-1">
               <Home className="w-4 h-4 text-indigo-500 opacity-90" />
               <span className="text-sm">Lease Agreement</span>
             </div>
          </SelectItem>
          
          <SelectItem value="employment" className="rounded-lg cursor-pointer focus:bg-indigo-50 focus:text-indigo-900 data-[state=checked]:bg-indigo-50 data-[state=checked]:text-indigo-700 data-[state=checked]:font-extrabold transition-colors my-0.5">
             <div className="flex items-center gap-3 py-1">
               <Briefcase className="w-4 h-4 text-emerald-500 opacity-90" />
               <span className="text-sm">Employment Contract</span>
             </div>
          </SelectItem>
          
          <SelectItem value="service" className="rounded-lg cursor-pointer focus:bg-indigo-50 focus:text-indigo-900 data-[state=checked]:bg-indigo-50 data-[state=checked]:text-indigo-700 data-[state=checked]:font-extrabold transition-colors my-0.5">
             <div className="flex items-center gap-3 py-1">
               <Handshake className="w-4 h-4 text-amber-500 opacity-90" />
               <span className="text-sm">Service Agreement</span>
             </div>
          </SelectItem>
          
          <SelectItem value="loan" className="rounded-lg cursor-pointer focus:bg-indigo-50 focus:text-indigo-900 data-[state=checked]:bg-indigo-50 data-[state=checked]:text-indigo-700 data-[state=checked]:font-extrabold transition-colors my-0.5">
             <div className="flex items-center gap-3 py-1">
               <Landmark className="w-4 h-4 text-blue-500 opacity-90" />
               <span className="text-sm">Loan Agreement</span>
             </div>
          </SelectItem>
          
          <SelectItem value="other" className="rounded-lg cursor-pointer focus:bg-indigo-50 focus:text-indigo-900 data-[state=checked]:bg-indigo-50 data-[state=checked]:text-indigo-700 data-[state=checked]:font-extrabold transition-colors my-0.5">
             <div className="flex items-center gap-3 py-1">
               <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400 opacity-90" />
               <span className="text-sm">Other General Contract</span>
             </div>
          </SelectItem>
        </SelectContent>
      </Select>
      
      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium ml-0.5 max-w-sm">
        Assists the AI in cross-referencing industry standard behavioral precedents.
      </p>
    </div>
  );
}
