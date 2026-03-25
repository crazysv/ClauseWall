"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gavel, ArrowLeft, ArrowRight, Loader2, CheckCircle2, Copy,
  Download, FileText, Scale, IndianRupee, MapPin, Clock,
  AlertTriangle, BookOpen, Shield, Users, ChevronDown, Phone,
  Mail, Globe, Building2, CalendarDays, ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type {
  AuthorityRoutingResult, AuthorityRecommendation,
  FeeCalculation, FilingGuide, FilingGuideStep, ComplaintDocument,
  Authority,
} from "@/types";

const WIZARD_STEPS = [
  { id: "authority", label: "Authority", icon: Building2 },
  { id: "details", label: "Your Details", icon: Users },
  { id: "generate", label: "Generate", icon: FileText },
  { id: "guide", label: "Filing Guide", icon: BookOpen },
];

export default function ComplaintFilingPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.documentId as string;

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [routing, setRouting] = useState<AuthorityRoutingResult | null>(null);
  const [selectedAuth, setSelectedAuth] = useState<AuthorityRecommendation | null>(null);
  const [guide, setGuide] = useState<FilingGuide | null>(null);
  const [generating, setGenerating] = useState(false);
  const [complaintDocs, setComplaintDocs] = useState<{
    complaint?: ComplaintDocument;
    affidavit?: ComplaintDocument;
    synopsis?: ComplaintDocument;
    fee?: FeeCalculation;
    citations?: string[];
    filing_id?: string;
  } | null>(null);

  // Form fields
  const [claimAmount, setClaimAmount] = useState("");
  const [district, setDistrict] = useState("");
  const [complainantName, setComplainantName] = useState("");
  const [complainantAddress, setComplainantAddress] = useState("");
  const [complainantPhone, setComplainantPhone] = useState("");
  const [respondentName, setRespondentName] = useState("");
  const [respondentAddress, setRespondentAddress] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");

  // Step 1: Determine authority
  const determineAuthority = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/complaint/determine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          claimAmount: claimAmount ? Number(claimAmount) : undefined,
          district: district || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRouting(data);
      if (data.recommendations?.length > 0) {
        setSelectedAuth(data.recommendations[0]);
      }
    } catch (err) {
      toast.error("Failed to determine authority");
    } finally {
      setLoading(false);
    }
  }, [documentId, claimAmount, district]);

  useEffect(() => { determineAuthority(); }, []);

  // Step 3: Generate complaint
  const handleGenerate = async () => {
    if (!selectedAuth) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/complaint/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          authorityType: selectedAuth.primary.type,
          complainantName, complainantAddress, complainantPhone,
          respondentName, respondentAddress,
          claimAmount: claimAmount ? Number(claimAmount) : 0,
          additionalContext,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setComplaintDocs({
        complaint: data.complaint,
        affidavit: data.affidavit,
        synopsis: data.synopsis,
        fee: data.fee,
        citations: data.citations,
        filing_id: data.filing_id,
      });
      toast.success("Complaint documents generated!");
      setStep(3);
      // Fetch guide
      const guideRes = await fetch(`/api/complaint/filing-guide?authorityType=${selectedAuth.primary.type}`);
      if (guideRes.ok) setGuide(await guideRes.json());
    } catch (err) {
      toast.error("Failed to generate complaint");
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="h-12 w-full rounded-xl mb-6" />
        <Skeleton className="h-64 w-full rounded-xl mb-4" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <Gavel className="h-5 w-5 text-orange-400" />
              File Regulatory Complaint
            </h1>
            <p className="text-xs text-muted-foreground">
              We{"'"}ll guide you through the entire process
            </p>
          </div>
        </div>

        {/* Wizard Steps */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {WIZARD_STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => i <= step && setStep(i)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  i === step
                    ? "bg-orange-500/10 text-orange-300 border border-orange-500/30"
                    : i < step
                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                    : "bg-white/[0.02] text-gray-500 border border-white/5"
                }`}
              >
                {i < step ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Limitation Warning */}
        {routing?.limitation_check?.is_expired && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span className="text-sm font-medium text-red-300">Limitation Period Expired</span>
            </div>
            <p className="text-xs text-red-400/80">
              The limitation period may have expired. You can still file — the Forum may condon the delay if you show sufficient cause.
            </p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* ═══ STEP 0: AUTHORITY SELECTION ═══ */}
          {step === 0 && (
            <motion.div key="authority" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {/* Claim Amount Input */}
              <Card className="bg-gray-900/50 border-gray-800 mb-4">
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-green-400" />
                    Claim Amount (approximate)
                  </h3>
                  <div className="flex gap-3">
                    <input
                      type="number"
                      value={claimAmount}
                      onChange={e => setClaimAmount(e.target.value)}
                      placeholder="e.g. 50000"
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-orange-500/50 focus:outline-none"
                    />
                    <Button size="sm" onClick={determineAuthority} className="bg-orange-600 hover:bg-orange-700">
                      Update
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    This determines filing fees and which forum level handles your complaint.
                  </p>
                </CardContent>
              </Card>

              {/* Authority Recommendations */}
              {routing?.recommendations?.map((rec, i) => (
                <Card
                  key={rec.primary.id}
                  onClick={() => setSelectedAuth(rec)}
                  className={`mb-3 cursor-pointer transition-all ${
                    selectedAuth?.primary.id === rec.primary.id
                      ? "border-orange-500/50 bg-orange-500/5"
                      : "border-gray-800 bg-gray-900/50 hover:border-gray-700"
                  }`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {i === 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300">Recommended</span>}
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400">
                            {rec.primary.filing_method === 'online' ? '🌐 Online' : rec.primary.filing_method === 'offline' ? '🏢 Offline' : '🌐+🏢 Both'}
                          </span>
                        </div>
                        <h4 className="font-semibold text-sm">{rec.primary.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{rec.reasoning}</p>

                        {rec.primary.address && (
                          <div className="flex items-start gap-1.5 mt-2 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span>{rec.primary.address}</span>
                          </div>
                        )}
                        {rec.primary.phone && (
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{rec.primary.phone}</span>
                          </div>
                        )}
                        {rec.primary.portal_url && (
                          <div className="flex items-center gap-1.5 mt-1 text-xs">
                            <Globe className="h-3 w-3 text-blue-400" />
                            <a href={rec.primary.portal_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                              {rec.primary.portal_name || 'Filing Portal'}
                            </a>
                          </div>
                        )}
                      </div>
                      <div className={`h-4 w-4 rounded-full border-2 flex-shrink-0 mt-1 ${
                        selectedAuth?.primary.id === rec.primary.id ? "border-orange-500 bg-orange-500" : "border-gray-600"
                      }`} />
                    </div>

                    {/* Fee Preview */}
                    {routing.fee_calculations[i] && (
                      <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2">
                        <IndianRupee className="h-3 w-3 text-green-400" />
                        <span className="text-xs">
                          Filing Fee: {routing.fee_calculations[i].is_free
                            ? <span className="text-green-400 font-semibold">FREE ✓</span>
                            : <span className="text-amber-400">₹{routing.fee_calculations[i].filing_fee.toLocaleString('en-IN')}</span>
                          }
                        </span>
                      </div>
                    )}

                    {/* Limitation */}
                    {rec.limitation_period.days_remaining !== null && (
                      <div className="mt-2 flex items-center gap-2">
                        <Clock className="h-3 w-3 text-amber-400" />
                        <span className="text-xs text-muted-foreground">
                          {rec.limitation_period.is_expired
                            ? <span className="text-red-400">Limitation may have expired</span>
                            : `${rec.limitation_period.days_remaining} days remaining`
                          }
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              <div className="flex justify-end mt-4">
                <Button onClick={() => setStep(1)} disabled={!selectedAuth} className="bg-orange-600 hover:bg-orange-700 gap-2">
                  Next: Your Details <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ═══ STEP 1: COMPLAINANT DETAILS ═══ */}
          {step === 1 && (
            <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card className="bg-gray-900/50 border-gray-800 mb-4">
                <CardContent className="p-5 space-y-4">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-400" />
                    Complainant Details (You)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input value={complainantName} onChange={e => setComplainantName(e.target.value)} placeholder="Full Name (as on ID)" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-orange-500/50 focus:outline-none" />
                    <input value={complainantPhone} onChange={e => setComplainantPhone(e.target.value)} placeholder="Phone Number" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-orange-500/50 focus:outline-none" />
                  </div>
                  <textarea value={complainantAddress} onChange={e => setComplainantAddress(e.target.value)} placeholder="Complete Address (with PIN code)" rows={2} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-orange-500/50 focus:outline-none" />
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-800 mb-4">
                <CardContent className="p-5 space-y-4">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-red-400" />
                    Respondent / Opposite Party
                  </h3>
                  <input value={respondentName} onChange={e => setRespondentName(e.target.value)} placeholder="Company / Person Name" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-orange-500/50 focus:outline-none" />
                  <textarea value={respondentAddress} onChange={e => setRespondentAddress(e.target.value)} placeholder="Registered Address" rows={2} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-orange-500/50 focus:outline-none" />
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-800 mb-4">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-sm mb-2">Additional Context (Optional)</h3>
                  <textarea value={additionalContext} onChange={e => setAdditionalContext(e.target.value)} placeholder="Any extra details about your complaint..." rows={3} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-orange-500/50 focus:outline-none" />
                </CardContent>
              </Card>

              <div className="flex justify-between mt-4">
                <Button variant="outline" onClick={() => setStep(0)}>
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                <Button onClick={() => setStep(2)} className="bg-orange-600 hover:bg-orange-700 gap-2">
                  Next: Generate <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ═══ STEP 2: GENERATE ═══ */}
          {step === 2 && (
            <motion.div key="generate" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {!complaintDocs ? (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-500/10 mb-4">
                    <FileText className="h-8 w-8 text-orange-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Ready to Generate</h3>
                  <p className="text-sm text-muted-foreground mb-1">
                    Filing at: <span className="text-white">{selectedAuth?.primary.short_name}</span>
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">
                    We{"'"}ll generate a formal complaint, affidavit, and index of documents.
                  </p>
                  <Button onClick={handleGenerate} disabled={generating} className="bg-orange-600 hover:bg-orange-700 gap-2 px-8">
                    {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gavel className="h-4 w-4" />}
                    {generating ? "Generating…" : "Generate Complaint Documents"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                    <h3 className="font-semibold">Documents Generated</h3>
                  </div>

                  {[complaintDocs.complaint, complaintDocs.affidavit, complaintDocs.synopsis].filter(Boolean).map(doc => (
                    <Card key={doc!.id} className="bg-gray-900/50 border-gray-800">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <h4 className="font-semibold text-sm">{doc!.title}</h4>
                            <p className="text-xs text-muted-foreground">{doc!.format_notes}</p>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => copyToClipboard(doc!.content, doc!.title)} className="gap-1 text-xs">
                            <Copy className="h-3 w-3" /> Copy
                          </Button>
                        </div>
                        <details>
                          <summary className="text-xs text-blue-400 cursor-pointer hover:underline">View document content</summary>
                          <pre className="mt-2 p-3 rounded-lg bg-black/30 text-xs whitespace-pre-wrap max-h-60 overflow-y-auto border border-white/5">
                            {doc!.content}
                          </pre>
                        </details>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Fee Summary */}
                  {complaintDocs.fee && (
                    <Card className="bg-gray-900/50 border-gray-800">
                      <CardContent className="p-5">
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <IndianRupee className="h-4 w-4 text-green-400" />
                          Filing Fee
                        </h4>
                        <p className="text-lg font-bold">
                          {complaintDocs.fee.is_free
                            ? <span className="text-green-400">FREE ✓</span>
                            : <span className="text-amber-400">₹{complaintDocs.fee.filing_fee.toLocaleString('en-IN')}</span>
                          }
                        </p>
                        {complaintDocs.fee.notes.map((note, i) => (
                          <p key={i} className="text-xs text-muted-foreground mt-1">{note}</p>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  <div className="flex justify-between mt-4">
                    <Button variant="outline" onClick={() => setStep(1)}>
                      <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                    <Button onClick={() => setStep(3)} className="bg-orange-600 hover:bg-orange-700 gap-2">
                      Next: Filing Guide <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ═══ STEP 3: FILING GUIDE ═══ */}
          {step === 3 && (
            <motion.div key="guide" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {guide ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-blue-400" />
                      Step-by-Step Filing Guide
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      ~{guide.estimated_time}
                    </span>
                  </div>

                  {guide.steps.map((gs) => (
                    <Card key={gs.step_number} className="bg-gray-900/50 border-gray-800">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-orange-500/10 flex items-center justify-center text-xs font-bold text-orange-400">
                            {gs.step_number}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm">{gs.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1">{gs.description}</p>
                            {gs.url && (
                              <a href={gs.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-400 mt-2 hover:underline">
                                <Globe className="h-3 w-3" /> {gs.url}
                              </a>
                            )}
                            {gs.tips.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {gs.tips.map((tip, ti) => (
                                  <p key={ti} className="text-[10px] text-green-400/70">💡 {tip}</p>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Document Checklist */}
                  <Card className="bg-gray-900/50 border-gray-800">
                    <CardContent className="p-5">
                      <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                        <ClipboardList className="h-4 w-4 text-amber-400" />
                        Document Checklist
                      </h4>
                      {guide.documents_checklist.map((item, i) => (
                        <div key={i} className="flex items-start gap-2 py-1.5 border-b border-white/5 last:border-0">
                          <span className={`mt-0.5 ${item.available ? 'text-green-400' : item.required ? 'text-amber-400' : 'text-gray-500'}`}>
                            {item.available ? '✅' : item.required ? '⚠️' : '📎'}
                          </span>
                          <div>
                            <p className="text-xs">{item.document}</p>
                            {item.how_to_get && <p className="text-[10px] text-muted-foreground">{item.how_to_get}</p>}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Helpline */}
                  {guide.helpline && (
                    <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-center">
                      <p className="text-xs text-blue-400">
                        📞 Need help? Call: <span className="font-semibold">{guide.helpline}</span>
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between mt-4">
                    <Button variant="outline" onClick={() => setStep(2)}>
                      <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                    <Link href={`/complaint`}>
                      <Button className="bg-green-600 hover:bg-green-700 gap-2">
                        <CheckCircle2 className="h-4 w-4" /> Done — View All Filings
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-orange-400 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Loading filing guide...</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
