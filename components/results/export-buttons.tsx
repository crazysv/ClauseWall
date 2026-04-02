"use client";

import { Share2, FileDown, Printer, ChevronDown, Trophy, Code, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ExportButtons() {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button 
        variant="outline" 
        size="sm"
        className="gap-2 font-bold border-2 border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 hover:border-indigo-300 transition-colors shadow-sm dark:shadow-slate-900/20 rounded-lg"
      >
        <Share2 className="h-4 w-4" />
        Share
      </Button>
      
      <Button 
        variant="outline" 
        size="sm"
        className="gap-2 font-bold border-2 border-slate-200 dark:border-slate-700 text-slate-700 bg-white dark:bg-card hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:text-slate-100 transition-colors shadow-sm dark:shadow-slate-900/20 rounded-lg"
      >
        <FileDown className="h-4 w-4" />
        Export PDF
      </Button>

      <Button 
        variant="outline" 
        size="sm"
        className="gap-2 font-bold border-2 border-slate-200 dark:border-slate-700 text-slate-700 bg-white dark:bg-card hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:text-slate-100 transition-colors shadow-sm dark:shadow-slate-900/20 rounded-lg hidden sm:flex"
      >
        <Printer className="h-4 w-4" />
        Print
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1.5 font-bold border-2 border-slate-200 dark:border-slate-700 text-slate-700 bg-white dark:bg-card hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:text-slate-100 transition-colors shadow-sm dark:shadow-slate-900/20 rounded-lg px-2"
          >
            <ChevronDown className="h-4 w-4 opacity-70" />
            <span className="sr-only">More Options</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52 bg-white dark:bg-card border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-1">
          <DropdownMenuItem className="gap-3 text-sm text-slate-700 cursor-pointer font-bold hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800 focus:bg-slate-50 dark:bg-slate-800 rounded-lg p-2.5 transition-colors">
            <Trophy className="h-4 w-4 text-emerald-500" />
            Score Card
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-3 text-sm text-slate-700 cursor-pointer font-bold hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800 focus:bg-slate-50 dark:bg-slate-800 rounded-lg p-2.5 transition-colors">
            <Code className="h-4 w-4 text-indigo-500" />
            Embed Badge
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-3 text-sm text-slate-700 cursor-pointer font-bold hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800 focus:bg-slate-50 dark:bg-slate-800 rounded-lg p-2.5 transition-colors">
            <QrCode className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            QR Code
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
