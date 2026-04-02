"use client";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Loader2, Building2, User, Users, Briefcase, FileCode, CheckCircle2, ChevronRight, Scale, AlertCircle, ArrowUpCircle } from "lucide-react";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { LegalAuthority, EscalationPath } from "@/types/authority";
import { AuthorityCard } from "@/components/authority/authority-card";
import { LegalAidChecker } from "@/components/authority/legal-aid-checker";
import { EscalationPathVisualizer } from "@/components/authority/escalation-path-visualizer";

const QUICK_FILTERS = [
  { id: "consumer", label: "Consumer", icon: User },
  { id: "rental", label: "Tenant", icon: Building2 },
  { id: "employment", label: "Employee", icon: Briefcase },
  { id: "banking", label: "Borrower", icon: MapPin },
  { id: "freelance", label: "Freelancer", icon: FileCode },
];

interface Props {
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;

  initialDocumentId: string | null;
}

export default function AuthorityClient({ initialDocumentId, isLoading, error, onRetry }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<LegalAuthority[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [escalationPath, setEscalationPath] = useState<EscalationPath | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(initialDocumentId);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (documentId) {
      handleSearch(true);
    }
  }, [documentId]);

  const handleSearch = (autoDetect = false, catOverride?: string | null) => {
    setIsSearching(true);
    setHasSearched(true);
    const categoryToSearch = catOverride || selectedCategory;

    // Simulate Network API Call
    setTimeout(() => {
       const mockResults: LegalAuthority[] = [
          {
             id: "mock1", name: "District Consumer Disputes Redressal Commission",
             short_name: "DCDRC", authority_type: "consumer_forum_district",
             jurisdiction_level: "district", state_code: "MH", city: "Mumbai",
             district: "Mumbai Suburban", covers_districts: ["Mumbai Suburban"],
             covers_states: ["MH"], claim_amount_min: 0, claim_amount_max: 5000000,
             handles_document_types: ["rental", "sale"], handles_dispute_types: ["consumer"],
             physical_address: "Bandra East, Mumbai, 400051", pincode: "400051", phone_numbers: ["022-26510000"],
             email: "dcdrc-mh@nic.in", website: "http://confonet.nic.in", e_filing_portal_url: "https://edaakhil.nic.in",
             e_filing_instructions: null, google_maps_url: null, latitude: null, longitude: null,
             working_hours: "10:30 AM - 5:00 PM", working_days: "Mon-Fri", closed_on: "Sat, Sun, Public Holidays", lunch_break: "1:30 PM - 2:00 PM",
             filing_fee_structure: { base_fee: 500 }, required_documents: [], filing_process_steps: [],
             typical_resolution_days: 180, current_backlog: "High", success_rate_estimate: 65, last_verified_at: new Date().toISOString(),
             presiding_officer_name: "Hon'ble President", presiding_officer_designation: "President",
             has_e_filing: true, has_video_hearing: true, has_online_tracking: true, has_online_payment: true,
             online_tracking_url: null, parent_authority_id: null, escalation_authority_id: "state_commission", escalation_deadline_days: 45,
             escalation_conditions: null, notes: null, data_source: "manual", is_active: true, is_verified: true, created_at: "", updated_at: ""
          },
          {
             id: "mock2", name: "State Consumer Disputes Redressal Commission",
             short_name: "SCDRC", authority_type: "consumer_forum_state",
             jurisdiction_level: "state", state_code: "MH", city: "Mumbai",
             district: null, covers_districts: [],
             covers_states: ["MH"], claim_amount_min: 5000000, claim_amount_max: 20000000,
             handles_document_types: ["rental", "sale", "insurance"], handles_dispute_types: ["consumer"],
             physical_address: "Fountain, Fort, Mumbai", pincode: "400001", phone_numbers: ["022-22660000"],
             email: "scdrc-mh@nic.in", website: "http://confonet.nic.in", e_filing_portal_url: "https://edaakhil.nic.in",
             e_filing_instructions: null, google_maps_url: null, latitude: null, longitude: null,
             working_hours: "10:30 AM - 5:00 PM", working_days: "Mon-Fri", closed_on: "Sat, Sun, Public Holidays", lunch_break: "1:30 PM - 2:00 PM",
             filing_fee_structure: { base_fee: 2500 }, required_documents: [], filing_process_steps: [],
             typical_resolution_days: 240, current_backlog: "Moderate", success_rate_estimate: 50, last_verified_at: new Date().toISOString(),
             presiding_officer_name: "Hon'ble Justice", presiding_officer_designation: "President",
             has_e_filing: true, has_video_hearing: true, has_online_tracking: true, has_online_payment: true,
             online_tracking_url: null, parent_authority_id: null, escalation_authority_id: "ncdrc", escalation_deadline_days: 30,
             escalation_conditions: null, notes: null, data_source: "manual", is_active: true, is_verified: true, created_at: "", updated_at: ""
          }
       ];
       setSearchResults(mockResults.filter(r => categoryToSearch ? r.authority_type.includes(categoryToSearch) || categoryToSearch === 'consumer' : true));
       
       setEscalationPath({
          steps: [
             { step_number: 1, action: "District Commission", description: "File original complaint up to ₹50 Lakhs", status: "completed", deadline_days: 0, required_documents: [] },
             { step_number: 2, action: "State Commission", description: "First Appeal. Limit: 45 days from judgement", status: "upcoming", deadline_days: 45, required_documents: [] },
             { step_number: 3, action: "National Commission (NCDRC)", description: "Revision Petition / Second Appeal", status: "upcoming", deadline_days: 30, required_documents: [] }
          ],
          current_step: 0,
          total_steps: 3,
          dispute_category: "consumer",
          document_type: "sale"
       });
       
       setIsSearching(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
     if (e.key === "Enter") handleSearch();
  }

  const toggleCategory = (catId: string) => {
     const newCat = selectedCategory === catId ? null : catId;
     setSelectedCategory(newCat);
     if (hasSearched) handleSearch(false, newCat);
  }

  
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
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-100 dark selection:bg-blue-500/30">
      <Navbar />
      
      <main role="main" className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-4 md:px-6 py-6 sm:py-10 pb-32">
        
        {/* Hero Search Section */}
        <div className="mb-12 max-w-4xl mx-auto text-center space-y-6">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Scale className="w-4 h-4" /> Legal Authority Locator
           </div>
           <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
             Find the right court, instantly.
           </h1>
           <p className="text-slate-400 font-medium text-lg max-w-2xl mx-auto">
             Enter your issue, location, or opponent. ClauseWall’s routing engine identifies the exact forum, jurisdiction, and escalation ladder.
           </p>

           <div className="mt-8 relative max-w-3xl mx-auto">
              <div className="relative flex items-center shadow-2xl rounded-2xl bg-slate-900 border border-white/10 focus-within:border-blue-500/50 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                 <Search className="absolute left-5 w-6 h-6 text-slate-500 dark:text-slate-400" />
                 <Input 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   onKeyDown={handleKeyPress}
                   placeholder="E.g., Mumbai builder didn't give possession on time..." 
                   className="w-full pl-14 pr-32 h-16 bg-transparent border-0 text-lg shadow-none focus-visible:ring-0 placeholder:text-slate-600 dark:text-slate-400 font-medium" 
                 />
                 <Button 
                   onClick={() => handleSearch()} disabled={isSearching}
                   className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-4 md:px-6"
                 >
                   {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : "Route Case"}
                 </Button>
              </div>

              {documentId && (
                 <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                    <Button variant="secondary" onClick={() => handleSearch(true)} className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-semibold text-sm h-10 px-4 md:px-6 rounded-full transition-all">
                       <CheckCircle2 className="w-4 h-4 mr-2" /> Auto-Detect Parameters from Analysis
                    </Button>
                 </motion.div>
              )}
           </div>

           {/* Quick Filters */}
           <div className="flex flex-wrap justify-center gap-3 mt-6">
              {QUICK_FILTERS.map((cat) => {
                 const Icon = cat.icon;
                 const isActive = selectedCategory === cat.id;
                 return (
                    <button
                       key={cat.id}
                       onClick={() => toggleCategory(cat.id)}
                       className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 border ${
                          isActive 
                          ? "bg-slate-800 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]" 
                          : "bg-slate-900/50 border-white/5 text-slate-400 hover:bg-slate-800 hover:text-white hover:border-white/10"
                       }`}
                    >
                       <Icon className={`w-4 h-4 ${isActive ? "text-blue-400" : "opacity-60"}`} /> {cat.label}
                    </button>
                 )
              })}
           </div>
        </div>

        {/* Results Structure */}
        <AnimatePresence mode="wait">
           {!hasSearched ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-2xl mx-auto mt-20 text-center">
                 <div className="w-24 h-24 bg-slate-900 border border-white/5 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <Scale className="w-10 h-10 text-slate-700" />
                 </div>
                 <h2 className="text-xl font-bold text-slate-300 mb-2">Awaiting Case Details</h2>
                 <p className="text-slate-500 dark:text-slate-400 text-sm">Tell us your issue above, and we'll map the correct regulatory authority, calculate your fees, and build the initial legal routing parameters.</p>
              </motion.div>
           ) : (
              <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-12">
                 
                 {/* Left Column: Result Cards */}
                 <div className="lg:col-span-8 space-y-6">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                       <h2 className="text-xl font-bold text-white flex items-center gap-2">
                          Primary Forums Found <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">{searchResults.length}</Badge>
                       </h2>
                       {isSearching && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
                    </div>

                    {isSearching ? (
                       <div className="space-y-4">
                          {[1, 2].map(i => (
                             <Card key={i} className="border-white/5 bg-slate-900/50 h-[220px] animate-pulse">
                                <CardContent className="p-6 flex flex-col justify-between h-full">
                                   <div className="flex gap-4">
                                      <div className="w-12 h-12 bg-white dark:bg-slate-900/5 rounded-full shrink-0" />
                                      <div className="space-y-3 w-full">
                                         <div className="h-5 bg-white dark:bg-slate-900/10 rounded w-2/3" />
                                         <div className="h-4 bg-white dark:bg-slate-900/5 rounded w-1/3" />
                                      </div>
                                   </div>
                                   <div className="flex gap-2">
                                      <div className="h-10 bg-white dark:bg-slate-900/5 rounded w-28" />
                                      <div className="h-10 bg-white dark:bg-slate-900/5 rounded w-24" />
                                   </div>
                                </CardContent>
                             </Card>
                          ))}
                       </div>
                    ) : searchResults.length === 0 ? (
                       <Card className="border-amber-500/20 bg-amber-500/5">
                          <CardContent className="p-4 md:p-6 lg:p-8 text-center text-amber-200/80">
                             <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                             No direct authority found for these exact parameters locally. Expand search bounds or clarify industry.
                          </CardContent>
                       </Card>
                    ) : (
                       <div className="space-y-4">
                          {searchResults.map((auth, idx) => (
                             <AuthorityCard 
                                key={auth.id} 
                                authority={auth} 
                                priority={idx === 0 ? 1 : idx + 1}
                                confidence={idx === 0 ? "high" : "medium"}
                                reasoning={idx === 0 ? "Primary regulatory body for real estate complaints against formalized development entities within localized physical district zones." : "Alternative State commission if monetary values exceed the threshold limit."}
                             />
                          ))}
                       </div>
                    )}

                    {/* Bottom Area: Auxiliary Modules */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 pt-8 border-t border-white/5">
                       <LegalAidChecker />
                       
                       <Card className="border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40 transition-all cursor-pointer group">
                          <CardContent className="p-6">
                             <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4">
                                <FileCode className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
                             </div>
                             <h3 className="text-lg font-bold text-white mb-2">RTI Generator</h3>
                             <p className="text-sm text-emerald-200/70 mb-6">Extract critical information backing your evidence loop via the Right to Information Act for just ₹10.</p>
                             <Button variant="outline" className="w-full bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20">
                                Draft Application <ChevronRight className="w-4 h-4 ml-2" />
                             </Button>
                          </CardContent>
                       </Card>
                    </div>
                 </div>

                 {/* Right Column: Escalation Graph */}
                 <div className="lg:col-span-4 space-y-6">
                    <Card className="border-white/10 bg-slate-900 shadow-2xl sticky top-8">
                       <CardHeader className="border-b border-white/5 pb-4">
                          <CardTitle className="text-lg flex items-center gap-2"><ArrowUpCircle className="w-5 h-5 text-indigo-400" /> Escalation Ladder</CardTitle>
                          <CardDescription className="text-xs text-slate-400">The statutory appeallate path for this dispute class.</CardDescription>
                       </CardHeader>
                       <CardContent className="p-0">
                          {isSearching ? (
                             <div className="p-6 space-y-4">
                                {[1,2,3].map(i => <div key={i} className="h-16 bg-white dark:bg-slate-900/5 animate-pulse rounded-lg" />)}
                             </div>
                          ) : escalationPath ? (
                             <div className="p-4">
                                <EscalationPathVisualizer path={escalationPath} />
                             </div>
                          ) : (
                             <div className="p-6 text-center text-slate-500 dark:text-slate-400 text-sm">Ladder data unavailable.</div>
                          )}
                       </CardContent>
                    </Card>
                 </div>

              </motion.div>
           )}
        </AnimatePresence>
        
      </main>
    </div>
  );
}
