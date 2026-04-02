"use client";

import { useState } from "react";
import { CloudUpload, FileType2 } from "lucide-react";
import { motion } from "framer-motion";

export function Dropzone() {
  const [isDragging, setIsDragging] = useState(false);

  // Note: Actual drag-and-drop file capture logic should be wired here if not passed in via props
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    // placeholder onDrop logic
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative w-full overflow-hidden transition-all duration-300 ease-out flex flex-col items-center justify-center p-16 rounded-2xl border-2 group cursor-pointer ${ isDragging ? "border-indigo-500 border-solid bg-indigo-100 scale-[1.02] shadow-xl shadow-indigo-500/10" : "border-slate-300 dark:border-slate-600 border-dashed bg-white dark:bg-card hover:bg-indigo-50 dark:hover:bg-indigo-950/30/50 hover:border-indigo-400 hover:shadow-md" }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center z-10">
        <div className={`p-4 rounded-full mb-6 transition-all duration-300 ${isDragging ? "bg-indigo-200 text-indigo-700 scale-110 shadow-inner" : "bg-slate-50 shadow-sm dark:shadow-slate-900/20 border border-slate-200 dark:border-slate-700 text-slate-400 group-hover:text-indigo-600 group-hover:border-indigo-200 group-hover:bg-white dark:bg-card group-hover:shadow"}`}>
          <CloudUpload className={`h-10 w-10 transition-transform duration-500 ${isDragging ? "-translate-y-1" : "group-hover:-translate-y-1"}`} />
        </div>
        
        <h3 className={`text-xl font-extrabold tracking-tight mb-2 transition-colors ${isDragging ? "text-indigo-900" : "text-slate-900 dark:text-slate-100 group-hover:text-indigo-950"}`}>
          {isDragging ? "Drop your contract now" : "Drag & drop your contract"}
        </h3>
        
        <p className="text-sm font-medium text-slate-500 mb-8 flex items-center gap-1.5 group-hover:text-slate-600 dark:text-slate-400 transition-colors">
          Or <span className="text-indigo-600 font-black hover:text-indigo-700 hover:underline underline-offset-4 decoration-2">browse files</span> from your computer
        </p>

        <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-slate-400 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 group-hover:bg-white dark:bg-card transition-colors">
           <span className="flex items-center gap-1.5"><FileType2 className="h-3.5 w-3.5 text-slate-300" /> PDF</span>
           <span className="w-1 h-1 rounded-full bg-slate-300" />
           <span className="flex items-center gap-1.5"><FileType2 className="h-3.5 w-3.5 text-slate-300" /> DOC</span>
           <span className="w-1 h-1 rounded-full bg-slate-300" />
           <span className="flex items-center gap-1.5"><FileType2 className="h-3.5 w-3.5 text-slate-300" /> DOCX</span>
        </div>
      </div>
      
      {/* Interactive gradient tracking flare */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-700 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.08),transparent_50%)]" />
    </motion.div>
  );
}
