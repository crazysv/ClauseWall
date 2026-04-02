"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { CountdownWidget } from "@/components/timebomb/countdown-widget";
import { DeadlineCard } from "@/components/timebomb/deadline-card";
import { DeadlineTimeline } from "@/components/timebomb/deadline-timeline";
import { CalendarExport } from "@/components/timebomb/calendar-export";
import { ReminderSettings } from "@/components/timebomb/reminder-settings";
import { SigningDateModal } from "@/components/timebomb/signing-date-modal";
import { TimebombSummary } from "@/components/timebomb/timebomb-summary";
import { NotificationBell } from "@/components/timebomb/notification-bell";
import { TelegramLink } from "@/components/timebomb/telegram-link";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

import { Bomb, Clock, CalendarIcon, ChevronLeft, BellRing, Info, Edit3, Settings, AlertTriangle, MessageSquareHeart , AlertCircle } from "lucide-react";

// Mock interfaces pending strict db type binding
interface Deadline {
  id: string;
  category: "favorable" | "dangerous" | "actionable";
  title: string;
  date: string;
  urgency: number;
  impact: string;
  required_action: string;
}

interface Reminder {
  id: string;
  deadline_id: string;
  channels: string[];
  timing: string;
}

interface TimebombClientProps {
  
  error?: string;
  onRetry?: () => void;

  userId: string;
  document: any;
  initialDeadlines: any[];

  isLoading?: boolean;
}

export default function TimebombClient({  userId, document, initialDeadlines , error, onRetry, isLoading }: TimebombClientProps) {
  const [deadlines, setDeadlines] = useState<Deadline[]>(initialDeadlines);
  const [signingDate, setSigningDate] = useState<string | null>(null);
  const [showSigningModal, setShowSigningModal] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showReminderSettings, setShowReminderSettings] = useState(false);
  const [localLoading, setLocalLoading] = useState(true);

  // Initial Fetch Setup
  useEffect(() => {
    setLocalLoading(true);
    const fetchTimebombState = async () => {
      try {
        await new Promise(r => setTimeout(r, 600)); // Latency mock
        
        // Mock payload mimicking the actual /api/timebomb logic
        const mockDeadlines: Deadline[] = [
           { id: "td_1", category: "dangerous", title: "Auto-Renewal Opt-Out Cutoff", date: new Date(Date.now() + 86400000 * 45).toISOString(), urgency: 2, impact: "Contract automatically renews for 12 months at +10% rate if not explicitly cancelled.", required_action: "Send written cancellation notice via email and physical post." },
           { id: "td_2", category: "actionable", title: "Security Deposit Refund Claim", date: new Date(Date.now() + 86400000 * 5).toISOString(), urgency: 1, impact: "Right to dispute deductions is waived after 7 days post-termination.", required_action: "Generate and send Dispute Action Letter asking for itemized deduction receipts." },
           { id: "td_3", category: "favorable", title: "Vesting Cliff Date", date: new Date(Date.now() + 86400000 * 180).toISOString(), urgency: 3, impact: "First 25% of ESOP options become fully vested and executable.", required_action: "Verify capital gains taxation status with CA." }
        ];
        
        const mockReminders: Reminder[] = [
           { id: "rm_1", deadline_id: "td_2", channels: ["email", "telegram"], timing: "3 days before" }
        ];

        setDeadlines(initialDeadlines.length > 0 ? initialDeadlines : mockDeadlines);
        setReminders(mockReminders);
        
        // Check if signing date was resolved in document metadata
        setSigningDate(document?.signed_at || new Date(Date.now() - 86400000 * 300).toISOString());
        
      } catch {
        // Silently handled
      } finally {
        setLocalLoading(false);
      }
    };
    fetchTimebombState();
  }, [document.id, initialDeadlines]);

  const sortedDeadlines = [...deadlines].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800 font-sans flex flex-col">
      <Navbar />

      <main role="main" className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Back Context */}
        <Link href={`/vault?documentId=${document.id}`} className="inline-flex items-center text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 transition-colors">
           <ChevronLeft className="w-4 h-4 mr-1" />
           Back to Contract Vault
        </Link>
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-2">
           <div>
              <div className="flex items-center gap-3 mb-2">
                 <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center shadow-inner">
                    <Bomb className="w-6 h-6" />
                 </div>
                 <h1 className="text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Timebomb Radar</h1>
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-xl">
                 Tracking auto-renewals, hidden traps, and statute of limitations cutoffs embedded in `<span className="font-bold underline text-slate-700">{document.original_filename || "Untitled Contract"}</span>`.
              </p>
           </div>
           
           <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <div className="relative group cursor-pointer" onClick={() => setShowSigningModal(true)}>
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon className="h-4 w-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                 </div>
                 <div className="pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20 rounded-xl text-sm font-bold text-slate-700 hover:border-indigo-300 transition-colors">
                    Start: {signingDate ? new Date(signingDate).toLocaleDateString() : "Set Signing Date"}
                 </div>
              </div>
              <Button 
                 onClick={() => setShowReminderSettings(true)}
                 className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl h-10 px-5 shadow-sm dark:shadow-slate-900/20"
              >
                 <BellRing className="w-4 h-4 mr-2" />
                 Set Up Reminders
              </Button>
           </div>
        </div>

        {/* Aggregate Summary Block */}
        <div className="w-full">
           {localLoading ? (
              <Skeleton className="h-28 rounded-3xl w-full bg-slate-200" />
           ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <Card className="bg-white dark:bg-card border-slate-200 dark:border-slate-700 rounded-3xl p-5 shadow-sm dark:shadow-slate-900/20 flex items-center justify-between">
                    <div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Active Timebombs</p>
                       <p className="text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl font-black text-slate-800 dark:text-slate-200">{sortedDeadlines.length}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                       <Clock className="w-5 h-5 text-indigo-500" />
                    </div>
                 </Card>
                 <Card className="bg-rose-50 border-rose-100 rounded-3xl p-5 shadow-sm dark:shadow-slate-900/20 flex items-center justify-between col-span-1 md:col-span-2 relative overflow-hidden">
                    <div className="z-10">
                       <p className="text-[10px] font-bold text-rose-800/60 uppercase tracking-widest mb-1">Urgent Trap Approaching</p>
                       <p className="text-xl font-black text-rose-950 truncate max-w-[200px] sm:max-w-[300px]">
                          {sortedDeadlines.find(d => d.category !== "favorable")?.title || "No traps pending"}
                       </p>
                    </div>
                    {/* @ts-ignore */}
                    <div className="z-10 scale-90 sm:scale-100 origin-right"><CountdownWidget targetDate={sortedDeadlines.find(d => d.category !== "favorable")?.date} urgency={1} /></div>
                    <AlertTriangle className="absolute -left-4 -bottom-4 w-24 h-24 text-rose-500/10 pointer-events-none" />
                 </Card>
              </div>
           )}
        </div>

        {/* Immersive Scrollable Timeline */}
        <Card className="bg-white dark:bg-card border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm dark:shadow-slate-900/20 p-6 overflow-hidden relative">
           <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mb-6 flex items-center justify-between z-10 relative">
              Contract Lifecycle Plotted
              <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-none font-bold">Zoom: 1Y</Badge>
           </h3>
           <div className="w-full h-32 relative z-10 overflow-x-auto no-scrollbar cursor-grab active:cursor-grabbing pb-4">
              {localLoading ? (
                 <Skeleton className="h-20 w-full bg-slate-100 dark:bg-slate-800 rounded-xl" />
              ) : (
                 <div className="min-w-[800px] w-full h-full relative">
                    {/* @ts-ignore */}
                    <DeadlineTimeline deadlines={sortedDeadlines} signingDate={signingDate} />
                 </div>
              )}
           </div>
           <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 dark:bg-slate-800 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        </Card>

        {/* Split Layout: Deadlines List & Calendar Tools */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
           
           {/* Left Feed (65%) */}
           <div className="w-full lg:max-w-[65%] space-y-6">
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                 Deadlines & Cutoffs
                 <Badge className="bg-slate-200 text-slate-700 border-none ml-2">{sortedDeadlines.length}</Badge>
              </h3>
              
              <div className="space-y-4">
                 {localLoading ? (
                    <Skeleton className="h-64 rounded-3xl w-full bg-slate-200" />
                 ) : sortedDeadlines.length === 0 ? (
                    <div className="py-8 md:py-6 md:py-8 lg:py-12 lg:py-16 text-center border-dashed border-2 border-slate-200 dark:border-slate-700 rounded-3xl bg-white dark:bg-slate-900">
                       <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                       <h4 className="text-lg font-bold text-slate-700">No timebombs found!</h4>
                       <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm mx-auto mt-2">This contract does not seem to map any strict impending deadlines or auto-renewals.</p>
                    </div>
                 ) : (
                    sortedDeadlines.map((deadline) => (
                       /* @ts-ignore */
                       <DeadlineCard 
                          key={deadline.id} 
                           deadline={deadline as any}
                           onDefuse={(id: string) => setDeadlines(prev => prev.filter(d => d.id !== id))}
                           documentId={document.id}
                       />
                    ))
                 )}
              </div>
           </div>

           {/* Right Utilities (35%) */}
           <div className="w-full lg:max-w-[35%] space-y-6 sticky top-24">
              
              {/* Active Reminders Overview */}
              <Card className="bg-white dark:bg-card border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm dark:shadow-slate-900/20 overflow-hidden text-sm">
                 <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                       <BellRing className="w-4 h-4 text-indigo-500" /> My Reminders
                    </h3>
                 </div>
                 {reminders.length === 0 ? (
                    <p className="text-slate-500 dark:text-slate-400 font-medium">No active alerts set. Don't miss your deadlines!</p>
                 ) : (
                    <div className="space-y-3">
                       {reminders.map(rem => (
                          <div key={rem.id} className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 flex items-center justify-between group">
                             <div>
                                <p className="font-bold text-indigo-900 text-xs">Notify {rem.timing}</p>
                                <p className="text-[10px] text-indigo-600 uppercase tracking-widest">{rem.channels.join(" & ")}</p>
                             </div>
                             <button className="text-slate-400 group-hover:text-red-500 transition-colors">
                                <Edit3 className="w-4 h-4" />
                             </button>
                          </div>
                       ))}
                    </div>
                 )}
                 <Button onClick={() => setShowReminderSettings(true)} variant="link" className="text-indigo-600 font-bold px-0 mt-2 h-auto">Manage Preferences &rarr;</Button>
              </Card>

              {/* Integrations Card */}
              {/* @ts-ignore */}
              <CalendarExport documentId={document.id} />

              {/* Telegram Bridge */}
              <Card className="bg-sky-50 border-sky-100 rounded-3xl p-6 shadow-sm dark:shadow-slate-900/20 flex flex-col items-center text-center">
                 <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center text-sky-500 mb-4 shadow-inner">
                    <MessageSquareHeart className="w-6 h-6" />
                 </div>
                 {/* @ts-ignore */}
                 <TelegramLink />
                 <p className="text-xs text-sky-700/80 mt-4 leading-relaxed font-medium">Get notified automatically via our ClauseWall Legal Assistant bot 24/7 so you never sleep past an auto-renewal.</p>
              </Card>

           </div>
        </div>
      </main>

      <Footer />

      {/* Internal Modals mapped to local state triggers */}
      <SigningDateModal 
         documentId={document.id}
         isOpen={showSigningModal}
         onClose={() => setShowSigningModal(false)}
         onActivated={(data) => {
           setShowSigningModal(false);
         }}
      />
      
      <Dialog open={showReminderSettings} onOpenChange={setShowReminderSettings}>
         <DialogContent className="sm:max-w-lg rounded-3xl border-slate-200 dark:border-slate-700">
            <ReminderSettings 
               onSaved={() => setShowReminderSettings(false)} 
            />
         </DialogContent>
      </Dialog>
    </div>
  );
}
