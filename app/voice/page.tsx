"use client";
import { Skeleton } from "@/components/ui/skeleton";
import React, { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Menu, Settings, History, Upload, X, Shield, FileText , AlertCircle } from "lucide-react";
import dynamic from "next/dynamic";

import { Navbar } from "@/components/shared/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// Dynamically import VoiceInterface because it uses browser-only APIs (MediaRecorder, webkitSpeechRecognition)
const VoiceInterfaceComponent = dynamic(
  () => import("@/components/voice-aid/voice-interface").then(mod => mod.VoiceInterface as React.ComponentType<any>),
  { ssr: false, loading: () => <div className="h-full w-full flex items-center justify-center animate-pulse"><div className="w-16 h-16 rounded-full bg-indigo-500/20" /></div> }
);

export default function VoicePage({ isLoading, error, onRetry }: any) {
  const prefersReducedMotion = useReducedMotion();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Mock History for the layout (Ideally wired to a database/state store)
  const conversationHistory = [
    { id: 1, text: "I need to review a rental agreement...", time: "Yesterday" },
    { id: 2, text: "What does clause 4 mean?", time: "2 Days ago" },
    { id: 3, text: "Explain non-compete clauses", time: "Last week" },
  ];

  
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
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-800 relative overflow-hidden font-sans">
      <Navbar />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Mobile Sidebar Toggle (Floating) */}
        <Button
          aria-label="Toggle navigation menu"
          variant="outline"
          size="icon"
          className="absolute top-4 left-4 z-40 lg:hidden bg-white dark:bg-card/80 backdrop-blur-md shadow-md border-indigo-100/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-5 w-5 text-indigo-600" />
        </Button>

        {/* Desktop / Responsive Sidebar */}
        <AnimatePresence>
          {(sidebarOpen || typeof window !== 'undefined' && window.innerWidth >= 1024) && (
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", bounce: 0, duration: prefersReducedMotion ? 0 : 0.4 }}
              className="absolute lg:relative z-50 h-full w-72 bg-white dark:bg-card border-r border-indigo-50 shadow-2xl lg:shadow-none flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-indigo-50 lg:hidden">
                <span className="font-black uppercase tracking-widest text-indigo-900 text-sm">Options</span>
                <Button aria-label="Close navigation menu" variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                  <X className="h-5 w-5 text-indigo-400" />
                </Button>
              </div>

              <ScrollArea className="flex-1 p-4">
                
                {/* Actions */}
                <div className="space-y-2 mb-8 mt-2 lg:mt-0">
                  <Button className="w-full justify-start bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 shadow-md shadow-indigo-600/10">
                    <Upload className="h-4 w-4 mr-3" /> Upload Document
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-12 border-indigo-100 text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30/50 font-bold">
                    <Settings className="h-4 w-4 mr-3" /> Voice Settings
                  </Button>
                </div>

                <Separator className="bg-indigo-50 mb-6" />

                {/* History Block */}
                <div className="mb-4 flex items-center gap-2 px-1">
                  <History className="h-4 w-4 text-indigo-400" />
                  <span className="text-xs font-black uppercase tracking-widest text-indigo-900/40">Recent History</span>
                </div>

                <div className="space-y-2">
                  {conversationHistory.map((item) => (
                    <Card key={item.id} className="border-indigo-50 bg-indigo-50/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/30/50 cursor-pointer transition-colors shadow-none">
                      <CardContent className="p-3">
                        <p className="text-sm font-semibold text-indigo-900 truncate">{item.text}</p>
                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">{item.time}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="mt-8 p-4 bg-indigo-50/30 rounded-xl border border-indigo-50/50 flex flex-col items-center text-center">
                   <Shield className="w-8 h-8 text-indigo-300 mb-2" />
                   <p className="text-[10px] uppercase font-black tracking-widest text-indigo-400 mb-1">ClauseWall Secure</p>
                   <p className="text-xs font-semibold text-indigo-800/60 leading-relaxed">All voice interactions are end-to-end encrypted and wiped post-session.</p>
                </div>

              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sidebar Mobile Overlay Backdrop */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden absolute inset-0 bg-indigo-950/20 backdrop-blur-sm z-40"
            />
          )}
        </AnimatePresence>

        {/* Central Conversational App */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-800 relative isolate pt-14 lg:pt-0">
          {/* Subtle Ambient Background Effects */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-400/5 blur-[100px] -z-10 rounded-full" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-400/5 blur-[100px] -z-10 rounded-full" />
          
          <div className="flex-1 max-w-4xl mx-auto w-full h-full bg-white dark:bg-card shadow-[0_0_50px_rgba(79,70,229,0.03)] border-x border-indigo-50/50 overflow-hidden relative">
            <VoiceInterfaceComponent />
          </div>
        </div>

      </div>
    </div>
  );
}
