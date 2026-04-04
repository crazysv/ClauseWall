"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gavel,
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Copy,
  Download,
  FileText,
  Scale,
  IndianRupee,
  MapPin,
  Clock,
  AlertTriangle,
  BookOpen,
  Shield,
  Users,
  ChevronDown,
  Phone,
  Mail,
  Globe,
  Building2,
  CalendarDays,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type {
  AuthorityRoutingResult,
  AuthorityRecommendation,
  FeeCalculation,
  FilingGuide,
  FilingGuideStep,
  ComplaintDocument,
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
  const [selectedAuth, setSelectedAuth] =
    useState<AuthorityRecommendation | null>(null);
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

  useEffect(() => {
    determineAuthority();
  }, []);

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
          complainantName,
          complainantAddress,
          complainantPhone,
          respondentName,
          respondentAddress,
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
      const guideRes = await fetch(
        `/api/complaint/filing-guide?authorityType=${selectedAuth.primary.type}`,
      );
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
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-10 md:py-16">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-none"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-impact-heading flex items-center gap-2">
              <Gavel className="h-6 w-6 text-orange-500" />
              File Regulatory Complaint
            </h1>
            <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground mt-1">
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
                className={`flex items-center gap-2 px-4 py-2 font-bold uppercase tracking-widest border-2 transition-all ${
                  i === step
                    ? "bg-orange-500 text-black border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    : i < step
                      ? "bg-green-500 text-black border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] opacity-80"
                      : "bg-white dark:bg-zinc-900 text-gray-500 border-gray-400 opacity-50 shadow-none border-dashed"
                }`}
              >
                {i < step ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <Icon className="h-3.5 w-3.5" />
                )}
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Limitation Warning */}
        {routing?.limitation_check?.is_expired && (
          <div className="mb-6 p-4 border-4 border-red-500 bg-red-100 dark:bg-red-900/30 shadow-[4px_4px_0px_0px_rgba(239,68,68,1)]">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <span className="text-sm font-black uppercase tracking-wider text-red-600 dark:text-red-400">
                Limitation Period Expired
              </span>
            </div>
            <p className="text-xs font-medium text-red-800 dark:text-red-300 mt-2">
              The limitation period may have expired. You can still file — the
              Forum may condon the delay if you show sufficient cause.
            </p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* ═══ STEP 0: AUTHORITY SELECTION ═══ */}
          {step === 0 && (
            <motion.div
              key="authority"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* Claim Amount Input */}
              <Card className="card-impact mb-6 p-6 rounded-none">
                <CardContent className="p-0">
                  <h3 className="text-sm font-black uppercase tracking-wider mb-3 flex items-center gap-2">
                    <IndianRupee className="h-5 w-5 text-green-500" />
                    Claim Amount (approximate)
                  </h3>
                  <div className="flex gap-3">
                    <input
                      type="number"
                      value={claimAmount}
                      onChange={(e) => setClaimAmount(e.target.value)}
                      placeholder="e.g. 50000"
                      className="flex-1 bg-white dark:bg-black border-2 border-black px-4 py-2 text-sm font-bold focus:border-orange-500 focus:outline-none w-full"
                    />
                    <Button
                      size="sm"
                      onClick={determineAuthority}
                      className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-orange-600 hover:bg-orange-700 font-bold uppercase tracking-widest text-white rounded-none"
                    >
                      Update
                    </Button>
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground mt-3">
                    This determines filing fees and which forum level handles
                    your complaint.
                  </p>
                </CardContent>
              </Card>

              {/* Authority Recommendations */}
              {routing?.recommendations?.map((rec, i) => (
                <Card
                  key={rec.primary.id}
                  onClick={() => setSelectedAuth(rec)}
                  className={`mb-4 cursor-pointer transition-all rounded-none p-6 ${
                    selectedAuth?.primary.id === rec.primary.id
                      ? "card-impact-emphasis bg-orange-50 dark:bg-orange-900/10 border-orange-500 shadow-[6px_6px_0px_0px_rgba(249,115,22,1)]"
                      : "card-impact hover:-translate-y-1"
                  }`}
                >
                  <CardContent className="p-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          {i === 0 && (
                            <span className="text-[10px] px-2 py-1 font-black uppercase tracking-widest bg-orange-500 text-black border-2 border-black">
                              Recommended
                            </span>
                          )}
                          <span className="text-[10px] px-2 py-1 font-black uppercase tracking-widest bg-white dark:bg-black text-gray-600 dark:text-gray-300 border-2 border-black">
                            {rec.primary.filing_method === "online"
                              ? "🌐 Online"
                              : rec.primary.filing_method === "offline"
                                ? "🏢 Offline"
                                : "🌐+🏢 Both"}
                          </span>
                        </div>
                        <h4 className="font-black text-lg uppercase tracking-wide">
                          {rec.primary.name}
                        </h4>
                        <p className="text-sm font-medium text-muted-foreground mt-2">
                          {rec.reasoning}
                        </p>

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
                            <a
                              href={rec.primary.portal_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:underline"
                            >
                              {rec.primary.portal_name || "Filing Portal"}
                            </a>
                          </div>
                        )}
                      </div>
                      <div
                        className={`h-6 w-6 border-4 flex-shrink-0 mt-1 ${
                          selectedAuth?.primary.id === rec.primary.id
                            ? "border-orange-500 bg-orange-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                            : "border-black bg-white dark:bg-black"
                        }`}
                      />
                    </div>

                    {/* Fee Preview */}
                    {routing.fee_calculations[i] && (
                      <div className="mt-4 pt-4 border-t-4 border-black flex items-center gap-2">
                        <IndianRupee className="h-4 w-4 text-green-500 stroke-[3px]" />
                        <span className="text-sm font-black uppercase tracking-wide">
                          Filing Fee:{" "}
                          {routing.fee_calculations[i].is_free ? (
                            <span className="text-green-500 shadow-sm px-2 py-1 bg-green-100 dark:bg-green-900 border-2 border-green-500">
                              FREE ✓
                            </span>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400 px-2 py-1 bg-amber-100 dark:bg-amber-900/50 border-2 border-amber-500">
                              ₹
                              {routing.fee_calculations[
                                i
                              ].filing_fee.toLocaleString("en-IN")}
                            </span>
                          )}
                        </span>
                      </div>
                    )}

                    {/* Limitation */}
                    {rec.limitation_period.days_remaining !== null && (
                      <div className="mt-3 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-amber-500 stroke-[3px]" />
                        <span className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                          {rec.limitation_period.is_expired ? (
                            <span className="text-red-500">
                              Limitation may have expired
                            </span>
                          ) : (
                            `${rec.limitation_period.days_remaining} days remaining`
                          )}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              <div className="flex justify-end mt-8">
                <Button
                  onClick={() => setStep(1)}
                  disabled={!selectedAuth}
                  className="border-4 border-black text-white bg-orange-600 hover:bg-orange-700 hover:-translate-y-1 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none font-black uppercase tracking-widest px-8 py-6 text-lg gap-3"
                >
                  Next: Your Details{" "}
                  <ArrowRight className="h-6 w-6 stroke-[3px]" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ═══ STEP 1: COMPLAINANT DETAILS ═══ */}
          {step === 1 && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="card-impact mb-6 p-6 rounded-none">
                <CardContent className="p-0 space-y-6">
                  <h3 className="font-black text-lg uppercase tracking-widest flex items-center gap-2 border-b-4 border-black pb-2 mb-4">
                    <Users className="h-6 w-6 text-blue-500 stroke-[3px]" />
                    Complainant Details (You)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      value={complainantName}
                      onChange={(e) => setComplainantName(e.target.value)}
                      placeholder="Full Name (as on ID)"
                      className="bg-white dark:bg-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] px-4 py-3 font-bold focus:border-orange-500 focus:outline-none w-full"
                    />
                    <input
                      value={complainantPhone}
                      onChange={(e) => setComplainantPhone(e.target.value)}
                      placeholder="Phone Number"
                      className="bg-white dark:bg-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] px-4 py-3 font-bold focus:border-orange-500 focus:outline-none w-full"
                    />
                  </div>
                  <textarea
                    value={complainantAddress}
                    onChange={(e) => setComplainantAddress(e.target.value)}
                    placeholder="Complete Address (with PIN code)"
                    rows={3}
                    className="w-full bg-white dark:bg-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] px-4 py-3 font-bold focus:border-orange-500 focus:outline-none"
                  />
                </CardContent>
              </Card>

              <Card className="card-impact mb-6 p-6 rounded-none">
                <CardContent className="p-0 space-y-6">
                  <h3 className="font-black text-lg uppercase tracking-widest flex items-center gap-2 border-b-4 border-black pb-2 mb-4">
                    <Building2 className="h-6 w-6 text-red-500 stroke-[3px]" />
                    Respondent / Opposite Party
                  </h3>
                  <input
                    value={respondentName}
                    onChange={(e) => setRespondentName(e.target.value)}
                    placeholder="Company / Person Name"
                    className="w-full bg-white dark:bg-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] px-4 py-3 font-bold focus:border-orange-500 focus:outline-none"
                  />
                  <textarea
                    value={respondentAddress}
                    onChange={(e) => setRespondentAddress(e.target.value)}
                    placeholder="Registered Address"
                    rows={3}
                    className="w-full bg-white dark:bg-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] px-4 py-3 font-bold focus:border-orange-500 focus:outline-none"
                  />
                </CardContent>
              </Card>

              <Card className="card-impact mb-6 p-6 rounded-none">
                <CardContent className="p-0">
                  <h3 className="font-black text-lg uppercase tracking-widest mb-4">
                    Additional Context (Optional)
                  </h3>
                  <textarea
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    placeholder="Any extra details about your complaint..."
                    rows={4}
                    className="w-full bg-white dark:bg-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] px-4 py-3 font-bold focus:border-orange-500 focus:outline-none"
                  />
                </CardContent>
              </Card>

              <div className="flex justify-between mt-8">
                <Button
                  variant="outline"
                  onClick={() => setStep(0)}
                  className="border-4 border-black text-black dark:text-white hover:-translate-y-1 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none font-black uppercase tracking-widest px-6 py-6 text-lg gap-3"
                >
                  <ArrowLeft className="h-6 w-6 mr-2 stroke-[3px]" /> Back
                </Button>
                <Button
                  onClick={() => setStep(2)}
                  className="border-4 border-black text-white bg-orange-600 hover:bg-orange-700 hover:-translate-y-1 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none font-black uppercase tracking-widest px-8 py-6 text-lg gap-3"
                >
                  Next: Generate <ArrowRight className="h-6 w-6 stroke-[3px]" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ═══ STEP 2: GENERATE ═══ */}
          {step === 2 && (
            <motion.div
              key="generate"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {!complaintDocs ? (
                <div className="card-impact p-16 text-center rounded-none">
                  <div className="inline-flex items-center justify-center w-20 h-20 border-4 border-black bg-orange-100 dark:bg-orange-900/50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6">
                    <FileText className="h-10 w-10 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h3 className="text-impact-subheading mb-2">
                    Ready to Generate
                  </h3>
                  <p className="font-bold text-muted-foreground uppercase tracking-widest mb-2">
                    Filing at:{" "}
                    <span className="text-black dark:text-white underline decoration-2">
                      {selectedAuth?.primary.short_name}
                    </span>
                  </p>
                  <p className="text-md font-medium text-muted-foreground mb-8 max-w-lg mx-auto">
                    We'll generate a formal complaint, affidavit, and index of
                    documents.
                  </p>
                  <Button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="border-4 border-black text-white bg-orange-600 hover:bg-orange-700 hover:-translate-y-1 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none font-black uppercase tracking-widest px-8 py-6 text-lg gap-3"
                  >
                    {generating ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <Gavel className="h-6 w-6 stroke-[3px]" />
                    )}
                    {generating
                      ? "Generating…"
                      : "Generate Complaint Documents"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-8 pb-4 border-b-4 border-black">
                    <CheckCircle2 className="h-8 w-8 text-green-500 stroke-[3px]" />
                    <h3 className="text-impact-subheading">
                      Documents Generated
                    </h3>
                  </div>

                  {[
                    complaintDocs.complaint,
                    complaintDocs.affidavit,
                    complaintDocs.synopsis,
                  ]
                    .filter(Boolean)
                    .map((doc) => (
                      <Card
                        key={doc!.id}
                        className="card-impact mb-6 p-6 rounded-none"
                      >
                        <CardContent className="p-0">
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <div>
                              <h4 className="font-black text-lg uppercase tracking-wide">
                                {doc!.title}
                              </h4>
                              <p className="text-sm font-bold text-muted-foreground mt-1">
                                {doc!.format_notes}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(doc!.content, doc!.title)
                              }
                              className="border-2 border-black font-bold uppercase tracking-widest bg-white dark:bg-black hover:bg-gray-100 dark:hover:bg-gray-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-none gap-2"
                            >
                              <Copy className="h-4 w-4" /> Copy
                            </Button>
                          </div>
                          <details className="group border-t-2 border-black pt-4">
                            <summary className="text-sm font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 cursor-pointer hover:underline list-none ::marker:hidden flex items-center gap-2">
                              View Document Content{" "}
                              <ChevronDown className="h-4 w-4 group-open:rotate-180 transition-transform" />
                            </summary>
                            <pre className="mt-4 p-4 border-4 border-black bg-white dark:bg-black text-sm whitespace-pre-wrap max-h-96 overflow-y-auto font-mono shadow-[inset_0px_4px_0px_0px_rgba(0,0,0,0.1)]">
                              {doc!.content}
                            </pre>
                          </details>
                        </CardContent>
                      </Card>
                    ))}

                  {/* Fee Summary */}
                  {complaintDocs.fee && (
                    <Card className="card-impact mb-6 p-6 rounded-none">
                      <CardContent className="p-0">
                        <h4 className="font-black uppercase tracking-wide text-lg mb-4 flex items-center gap-2 border-b-4 border-black pb-2">
                          <IndianRupee className="h-6 w-6 text-green-500 stroke-[3px]" />
                          Filing Fee
                        </h4>
                        <p className="text-4xl font-black mb-4">
                          {complaintDocs.fee.is_free ? (
                            <span className="text-green-500 bg-green-100 dark:bg-green-900 border-4 border-green-500 px-4 py-2 inline-block">
                              FREE ✓
                            </span>
                          ) : (
                            <span className="text-amber-500 bg-amber-100 dark:bg-amber-900/50 border-4 border-amber-500 px-4 py-2 inline-block">
                              ₹
                              {complaintDocs.fee.filing_fee.toLocaleString(
                                "en-IN",
                              )}
                            </span>
                          )}
                        </p>
                        <div className="space-y-2">
                          {complaintDocs.fee.notes.map((note, i) => (
                            <p
                              key={i}
                              className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2 pr-4"
                            >
                              <ArrowRight className="h-4 w-4" /> {note}
                            </p>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="flex justify-between mt-8">
                    <Button
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="border-4 border-black text-black dark:text-white hover:-translate-y-1 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none font-black uppercase tracking-widest px-6 py-6 text-lg gap-3"
                    >
                      <ArrowLeft className="h-6 w-6 mr-2 stroke-[3px]" /> Back
                    </Button>
                    <Button
                      onClick={() => setStep(3)}
                      className="border-4 border-black text-white bg-orange-600 hover:bg-orange-700 hover:-translate-y-1 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none font-black uppercase tracking-widest px-8 py-6 text-lg gap-3"
                    >
                      Next: Filing Guide{" "}
                      <ArrowRight className="h-6 w-6 stroke-[3px]" />
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ═══ STEP 3: FILING GUIDE ═══ */}
          {step === 3 && (
            <motion.div
              key="guide"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {guide ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-8 pb-4 border-b-4 border-black">
                    <h3 className="text-impact-subheading flex items-center gap-3">
                      <BookOpen className="h-8 w-8 text-blue-500 stroke-[3px]" />
                      Step-by-Step Filing Guide
                    </h3>
                    <span className="font-black uppercase tracking-widest px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 border-2 border-blue-500">
                      ~{guide.estimated_time}
                    </span>
                  </div>

                  {guide.steps.map((gs) => (
                    <Card
                      key={gs.step_number}
                      className="card-impact mb-6 p-6 rounded-none"
                    >
                      <CardContent className="p-0">
                        <div className="flex items-start gap-6">
                          <div className="flex-shrink-0 w-12 h-12 border-4 border-black bg-orange-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center text-xl font-black text-black">
                            {gs.step_number}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-black text-lg uppercase tracking-wide mb-2">
                              {gs.title}
                            </h4>
                            <p className="font-medium text-muted-foreground leading-relaxed text-sm mb-4">
                              {gs.description}
                            </p>
                            {gs.url && (
                              <a
                                href={gs.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 font-bold uppercase tracking-widest text-sm text-blue-600 dark:text-blue-400 bg-white dark:bg-black border-2 border-black px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-4"
                              >
                                <Globe className="h-5 w-5" /> Visit Portal
                              </a>
                            )}
                            {gs.tips.length > 0 && (
                              <div className="space-y-2 bg-green-50 dark:bg-green-900/10 border-l-4 border-green-500 p-4">
                                {gs.tips.map((tip, ti) => (
                                  <p
                                    key={ti}
                                    className="font-bold text-sm text-green-700 dark:text-green-400"
                                  >
                                    💡 {tip}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Document Checklist */}
                  <Card className="card-impact mb-6 p-6 rounded-none">
                    <CardContent className="p-0">
                      <h4 className="font-black text-lg uppercase tracking-widest mb-6 flex items-center gap-3 border-b-4 border-black pb-2">
                        <ClipboardList className="h-6 w-6 text-amber-500 stroke-[3px]" />
                        Document Checklist
                      </h4>
                      <div className="space-y-4">
                        {guide.documents_checklist.map((item, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-4 p-4 border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-zinc-900 hover:border-black dark:hover:border-white transition-colors"
                          >
                            <span className="text-2xl pt-1">
                              {item.available
                                ? "✅"
                                : item.required
                                  ? "⚠️"
                                  : "📎"}
                            </span>
                            <div>
                              <p className="font-bold text-lg uppercase tracking-wide">
                                {item.document}
                              </p>
                              {item.how_to_get && (
                                <p className="font-medium text-sm text-muted-foreground mt-2 border-l-2 border-gray-300 pl-3">
                                  {item.how_to_get}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Helpline */}
                  {guide.helpline && (
                    <div className="p-6 bg-blue-100 dark:bg-blue-900/30 border-4 border-blue-500 text-center shadow-[4px_4px_0px_0px_rgba(59,130,246,1)]">
                      <p className="font-black text-xl uppercase tracking-widest text-blue-700 dark:text-blue-300">
                        📞 Need help? Call:{" "}
                        <span className="bg-white dark:bg-black px-4 py-2 border-2 border-blue-500 ml-2 shadow-[2px_2px_0px_0px_rgba(59,130,246,1)] text-black dark:text-white">
                          {guide.helpline}
                        </span>
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between mt-12 pb-16">
                    <Button
                      variant="outline"
                      onClick={() => setStep(2)}
                      className="border-4 border-black text-black dark:text-white hover:-translate-y-1 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none font-black uppercase tracking-widest px-6 py-6 text-lg gap-3"
                    >
                      <ArrowLeft className="h-6 w-6 mr-2 stroke-[3px]" /> Back
                    </Button>
                    <Link href={`/complaint`}>
                      <Button className="border-4 border-black text-white bg-green-600 hover:bg-green-700 hover:-translate-y-1 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none font-black uppercase tracking-widest px-8 py-6 text-lg gap-3">
                        <CheckCircle2 className="h-6 w-6 stroke-[3px]" /> Done —
                        View All
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-orange-400 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Loading filing guide...
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
