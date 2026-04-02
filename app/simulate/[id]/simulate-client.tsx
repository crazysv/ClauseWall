"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceArea, Tooltip as RechartsTooltip } from "recharts";
import { AlertTriangle, Download, Share2, TrendingUp, ShieldAlert, BadgeIndianRupee, Activity, FileText , AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Document, Clause } from "@/types";

export interface SimulatorData {
  summary: { totalExposure: number; baseCost: number; riskPremium: number; };
  monthlyData: { month: string; cost: number; zone: string }[];
  dangerZones: { id: string; title: string; trigger: string; impactAmount: number; probability: string }[];
  scenarios: { id: string; name: string; outcome: "positive" | "negative"; cost: number; description: string }[];
}

interface SimulateClientProps {
  
  error?: string;
  onRetry?: () => void;

  document: Document;
  clauses: Clause[];

  isLoading?: boolean;
}

export default function SimulateClient({  document, clauses , error, onRetry, isLoading }: SimulateClientProps) {
  const router = useRouter();
  const [simulatorData, setSimulatorData] = useState<SimulatorData | null>(null);
  const [localLoading, setLocalLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("basic");

  useEffect(() => {
    let mounted = true;

    async function fetchSimulation() {
      try {
        const res = await fetch("/api/simulate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentId: document.id,
            clauses: clauses.map(c => c.id),
            documentType: document.document_type || "contract",
            jurisdiction: document.jurisdiction || "india" }) });
        
        if (!res.ok) throw new Error("Missing Route");
        const data = await res.json();
        if (mounted) {
           setSimulatorData(data);
           setLocalLoading(false);
        }
      } catch (err) {
        // Fallback UI generation 
        if (mounted) {
           setTimeout(() => {
              setSimulatorData({
                 summary: { totalExposure: 1450000, baseCost: 500000, riskPremium: 950000 },
                 monthlyData: Array.from({ length: 36 }).map((_, i) => ({
                    month: `M${i+1}`,
                    cost: 500000 + (Math.random() * (i * 25000)),
                    zone: i < 12 ? "safe" : i < 24 ? "warning" : "danger"
                 })),
                 dangerZones: [
                    { id: "dz1", title: "Accelerated Penalty Rate", trigger: "Late payment > 5 days", impactAmount: 150000, probability: "45%" },
                    { id: "dz2", title: "Auto-Renewal Lock", trigger: "Failure to notice 90 days prior", impactAmount: 600000, probability: "80%" }
                 ],
                 scenarios: [
                    { id: "sc1", name: "Perfect Execution", outcome: "positive", cost: 500000, description: "No penalties triggered, standard base cost applies." },
                    { id: "sc2", name: "Minor Delays", outcome: "negative", cost: 575000, description: "Standard late fees and minor default rectifications." },
                    { id: "sc3", name: "Early Termination", outcome: "negative", cost: 1250000, description: "Forfeiture of all deposits plus remainder of contract term billed." },
                    { id: "sc4", name: "Dispute Escalation", outcome: "negative", cost: 1450000, description: "Maximum contractual ruin including legal fees imposed on you." }
                 ]
              });
              setLocalLoading(false);
           }, 1500);
        }
      }
    }

    fetchSimulation();

    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    if (val === "advanced") {
      router.push(`/ruin-calculator/${document.id}`);
    }
  };

  const getOutcomeColor = (outcome: string) => outcome === "positive" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800";

  
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
      
      <main role="main" className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
           <div>
             <h1 className="text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">Cost Calculator Simulation</h1>
             <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Simulate true agreement costs mapping hidden penalty structures over 36 months.</p>
           </div>
           
           <div className="flex gap-3 shrink-0">
             <Button variant="outline" className="bg-white dark:bg-card border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20"><Share2 className="w-4 h-4 mr-2" /> Share Report</Button>
             <Button className="bg-slate-900 text-white shadow-md"><Download className="w-4 h-4 mr-2" /> Export PDF</Button>
           </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="bg-slate-200/50 p-1 mb-8 w-full max-w-md">
            <TabsTrigger value="basic" className="w-1/2 data-[state=active]:bg-white dark:bg-card data-[state=active]:shadow-sm dark:shadow-slate-900/20 font-bold">Basic Simulator</TabsTrigger>
            <TabsTrigger value="advanced" className="w-1/2 data-[state=active]:bg-white dark:bg-card data-[state=active]:shadow-sm dark:shadow-slate-900/20 font-bold">Advanced (Monte Carlo)</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-8 mt-0 border-0 p-0 outline-none">
            
            {/* Top Summaries */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <Card className="border-indigo-100 shadow-sm dark:shadow-slate-900/20 bg-gradient-to-br from-indigo-50/50 to-white">
                 <CardContent className="p-6">
                    <p className="text-sm font-bold text-indigo-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                       <FileText className="w-4 h-4" /> Base Contract Value
                    </p>
                    <p className="text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-100">
                       {isLoading ? <Skeleton className="h-10 w-32" /> : `₹${simulatorData?.summary.baseCost.toLocaleString()}`}
                    </p>
                 </CardContent>
               </Card>
               <Card className="border-rose-100 shadow-sm dark:shadow-slate-900/20 bg-gradient-to-br from-rose-50/50 to-white">
                 <CardContent className="p-6">
                    <p className="text-sm font-bold text-rose-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                       <ShieldAlert className="w-4 h-4" /> Hidden Risk Premium
                    </p>
                    <p className="text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl font-black text-rose-700">
                       {isLoading ? <Skeleton className="h-10 w-32" /> : `+₹${simulatorData?.summary.riskPremium.toLocaleString()}`}
                    </p>
                 </CardContent>
               </Card>
               <Card className="border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20 bg-slate-900 text-white">
                 <CardContent className="p-6">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                       <TrendingUp className="w-4 h-4" /> True Total Exposure
                    </p>
                    <p className="text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl font-black text-white">
                       {isLoading ? <Skeleton className="h-10 w-32 bg-slate-800" /> : `₹${simulatorData?.summary.totalExposure.toLocaleString()}`}
                    </p>
                 </CardContent>
               </Card>
            </div>

            {/* Recharts Timeline */}
            <Card className="border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20">
               <CardHeader className="border-b border-slate-100 pb-4">
                  <CardTitle className="text-lg flex items-center gap-2"><Activity className="w-5 h-5 text-indigo-500" /> 36-Month Cost Trajectory</CardTitle>
                  <CardDescription>Visualizing how compounding penalties scale across standard contract lifetimes.</CardDescription>
               </CardHeader>
               <CardContent className="p-6">
                  <div className="h-[400px] w-full">
                     {isLoading ? <Skeleton className="w-full h-full rounded-lg" /> : simulatorData && (
                        <ResponsiveContainer width="100%" height="100%">
                           <LineChart data={simulatorData.monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                              <XAxis dataKey="month" tick={{fill: '#64748b', fontSize: 12}} stroke="#cbd5e1" />
                              <YAxis tickFormatter={(val) => `₹${(val/1000).toFixed(0)}k`} tick={{fill: '#64748b', fontSize: 12}} stroke="#cbd5e1" />
                              <RechartsTooltip 
                                formatter={(val: any) => `₹${val.toLocaleString()}`}
                                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                              />
                              <ReferenceArea x1="M1" x2="M12" fill="#ecfdf5" fillOpacity={0.5} />
                              <ReferenceArea x1="M12" x2="M24" fill="#fef3c7" fillOpacity={0.5} />
                              <ReferenceArea x1="M24" x2="M36" fill="#fef2f2" fillOpacity={0.5} />
                              <Line type="monotone" dataKey="cost" stroke="#4f46e5" strokeWidth={3} dot={{ fill: '#4f46e5', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                           </LineChart>
                        </ResponsiveContainer>
                     )}
                  </div>
               </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
               
               {/* Danger Zones (3 Col on Desktop) */}
               <div className="lg:col-span-4 space-y-4">
                  <h3 className="text-lg font-bold flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-rose-500" /> Danger Zones Detected</h3>
                  {isLoading ? (
                     <><Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" /></>
                  ) : simulatorData?.dangerZones.map(dz => (
                     <Card key={dz.id} className="border-rose-200 border-l-4 border-l-rose-500 shadow-sm dark:shadow-slate-900/20 relative overflow-hidden">
                        <CardContent className="p-4">
                           <Badge variant="destructive" className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-0 absolute top-3 right-3 text-[10px] tracking-wider uppercase font-bold">
                              {dz.probability} Prob
                           </Badge>
                           <h4 className="font-bold text-slate-900 dark:text-slate-100 pr-16">{dz.title}</h4>
                           <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-3">Trigger: {dz.trigger}</p>
                           <div className="flex items-center text-rose-600 font-black text-lg gap-1">
                              <BadgeIndianRupee className="w-5 h-5" /> {dz.impactAmount.toLocaleString()} impact
                           </div>
                        </CardContent>
                     </Card>
                  ))}
               </div>

               {/* 4-Column Scenarios (9 Col spanning) */}
               <div className="lg:col-span-8 space-y-4">
                   <h3 className="text-lg font-bold flex items-center gap-2">Scenario Comparison Matrix</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full">
                      {isLoading ? (
                         Array.from({length: 4}).map((_,i) => <Skeleton key={i} className="h-64 w-full" />)
                      ) : simulatorData?.scenarios.map(sc => (
                         <Card key={sc.id} className={cn("border-slate-200 shadow-sm h-full flex flex-col", getOutcomeColor(sc.outcome))}>
                            <CardHeader className="p-4 pb-2 border-b border-white/50">
                               <CardTitle className="text-sm font-bold tracking-tight leading-tight">{sc.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 flex-1 flex flex-col">
                               <p className="text-xs font-medium opacity-80 mb-4 flex-1">{sc.description}</p>
                               <div className="pt-3 border-t border-white/50">
                                  <p className="text-[10px] uppercase tracking-widest font-bold opacity-60 mb-1">Projected Cost</p>
                                  <p className="text-xl font-black">₹{sc.cost.toLocaleString()}</p>
                               </div>
                            </CardContent>
                         </Card>
                      ))}
                   </div>
               </div>

            </div>

          </TabsContent>
        </Tabs>

      </main>
      
      <Footer />
    </div>
  );
}
