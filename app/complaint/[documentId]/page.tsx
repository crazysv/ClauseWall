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

  // ── Loading ─────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] p-4 sm:p-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-8 w-8 border border-neutral-800 bg-[#050505] animate-pulse" />
          <div className="h-4 w-48 bg-neutral-900 animate-pulse" />
        </div>
        <div className="h-10 w-full border border-neutral-900 mb-6 animate-pulse" />
        <div className="h-64 w-full border border-neutral-900 mb-4 animate-pulse" />
        <div className="h-48 w-full border border-neutral-900 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-10 md:py-16">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 border border-neutral-800 bg-[#050505] text-neutral-600 hover:text-neutral-300 hover:border-neutral-600 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 border border-neutral-800 bg-[#050505]">
              <Gavel className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <h1 className="text-xs font-mono uppercase tracking-widest text-neutral-200">
                FILE_REGULATORY_COMPLAINT
              </h1>
              <p className="text-[8px] font-mono uppercase tracking-widest text-neutral-600 mt-0.5">
                GUIDED COMPLAINT FILING PROCESS
              </p>
            </div>
          </div>
        </div>

        {/* Wizard Steps */}
        <div className="flex items-center gap-1.5 mb-8 overflow-x-auto pb-2">
          {WIZARD_STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => i <= step && setStep(i)}
                className={`flex items-center gap-2 px-3 py-1.5 font-mono uppercase tracking-widest text-[8px] border transition-colors ${
                  i === step
                    ? "bg-amber-950/20 text-amber-400 border-amber-900/50"
                    : i < step
                      ? "bg-emerald-950/10 text-emerald-400 border-emerald-900/50"
                      : "bg-[#050505] text-neutral-700 border-neutral-800 border-dashed cursor-default"
                }`}
              >
                {i < step ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <Icon className="h-3 w-3" />
                )}
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Limitation Warning */}
        {routing?.limitation_check?.is_expired && (
          <div className="mb-6 p-4 border-l-2 border-red-500 bg-red-950/20">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
              <span className="text-[9px] font-mono uppercase tracking-widest text-red-400">
                LIMITATION_PERIOD_EXPIRED
              </span>
            </div>
            <p className="text-[9px] font-mono text-neutral-500 mt-2 leading-relaxed">
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
              <div className="border border-neutral-900 bg-[#0a0a0a] mb-6 p-5">
                <h3 className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 mb-3 flex items-center gap-2">
                  <IndianRupee className="h-3.5 w-3.5 text-emerald-500" />
                  CLAIM_AMOUNT (APPROXIMATE)
                </h3>
                <div className="flex gap-3">
                  <input
                    type="number"
                    value={claimAmount}
                    onChange={(e) => setClaimAmount(e.target.value)}
                    placeholder="e.g. 50000"
                    className="flex-1 bg-[#050505] border border-neutral-800 px-4 py-2 text-sm font-mono text-neutral-300 placeholder:text-neutral-700 focus:border-neutral-600 focus:outline-none w-full"
                  />
                  <button
                    onClick={determineAuthority}
                    className="px-4 py-2 border border-amber-900/50 bg-amber-950/10 font-mono uppercase tracking-widest text-[8px] text-amber-400 hover:text-amber-300 hover:border-amber-800 transition-colors"
                  >
                    UPDATE
                  </button>
                </div>
                <p className="text-[8px] font-mono uppercase tracking-widest text-neutral-700 mt-3">
                  THIS DETERMINES FILING FEES AND WHICH FORUM LEVEL HANDLES YOUR
                  COMPLAINT.
                </p>
              </div>

              {/* Authority Recommendations */}
              {routing?.recommendations?.map((rec, i) => (
                <div
                  key={rec.primary.id}
                  onClick={() => setSelectedAuth(rec)}
                  className={`mb-3 cursor-pointer transition-all p-5 border ${
                    selectedAuth?.primary.id === rec.primary.id
                      ? "border-amber-900/50 bg-amber-950/10"
                      : "border-neutral-900 bg-[#0a0a0a] hover:border-neutral-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {i === 0 && (
                          <span className="text-[7px] px-1.5 py-0.5 font-mono uppercase tracking-widest bg-amber-950/20 text-amber-400 border border-amber-900/50">
                            RECOMMENDED
                          </span>
                        )}
                        <span className="text-[7px] px-1.5 py-0.5 font-mono uppercase tracking-widest border border-neutral-800 text-neutral-500 bg-[#050505]">
                          {rec.primary.filing_method === "online"
                            ? "ONLINE"
                            : rec.primary.filing_method === "offline"
                              ? "OFFLINE"
                              : "ONLINE + OFFLINE"}
                        </span>
                      </div>
                      <h4 className="text-[10px] font-mono uppercase tracking-widest text-neutral-200 mb-2">
                        {rec.primary.name}
                      </h4>
                      <p className="text-[9px] font-mono text-neutral-500 leading-relaxed">
                        {rec.reasoning}
                      </p>

                      {rec.primary.address && (
                        <div className="flex items-start gap-1.5 mt-2 text-[8px] font-mono text-neutral-600">
                          <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span>{rec.primary.address}</span>
                        </div>
                      )}
                      {rec.primary.phone && (
                        <div className="flex items-center gap-1.5 mt-1 text-[8px] font-mono text-neutral-600">
                          <Phone className="h-3 w-3" />
                          <span>{rec.primary.phone}</span>
                        </div>
                      )}
                      {rec.primary.portal_url && (
                        <div className="flex items-center gap-1.5 mt-1 text-[8px] font-mono">
                          <Globe className="h-3 w-3 text-cyan-500" />
                          <a
                            href={rec.primary.portal_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:underline"
                          >
                            {rec.primary.portal_name || "Filing Portal"}
                          </a>
                        </div>
                      )}
                    </div>
                    <div
                      className={`h-4 w-4 border flex-shrink-0 mt-1 ${
                        selectedAuth?.primary.id === rec.primary.id
                          ? "border-amber-500 bg-amber-500"
                          : "border-neutral-700 bg-[#050505]"
                      }`}
                    />
                  </div>

                  {/* Fee Preview */}
                  {routing.fee_calculations[i] && (
                    <div className="mt-4 pt-4 border-t border-neutral-900 flex items-center gap-2">
                      <IndianRupee className="h-3 w-3 text-emerald-500" />
                      <span className="text-[8px] font-mono uppercase tracking-widest text-neutral-400">
                        FILING_FEE:{" "}
                        {routing.fee_calculations[i].is_free ? (
                          <span className="text-emerald-400 px-1.5 py-0.5 border border-emerald-900/50 bg-emerald-950/20 ml-1">
                            FREE ✓
                          </span>
                        ) : (
                          <span className="text-amber-400 px-1.5 py-0.5 border border-amber-900/50 bg-amber-950/20 ml-1">
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
                      <Clock className="h-3 w-3 text-amber-500" />
                      <span className="text-[8px] font-mono uppercase tracking-widest text-neutral-500">
                        {rec.limitation_period.is_expired ? (
                          <span className="text-red-400">
                            LIMITATION MAY HAVE EXPIRED
                          </span>
                        ) : (
                          `${rec.limitation_period.days_remaining} DAYS REMAINING`
                        )}
                      </span>
                    </div>
                  )}
                </div>
              ))}

              <div className="flex justify-end mt-8">
                <button
                  onClick={() => setStep(1)}
                  disabled={!selectedAuth}
                  className="flex items-center gap-3 px-6 py-2.5 border border-amber-900/50 bg-amber-950/10 font-mono uppercase tracking-widest text-[9px] text-amber-400 hover:text-amber-300 hover:border-amber-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  NEXT: YOUR DETAILS
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
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
              <div className="border border-neutral-900 bg-[#0a0a0a] mb-4 p-5">
                <h3 className="text-[9px] font-mono uppercase tracking-widest text-cyan-400 flex items-center gap-2 border-b border-neutral-900 pb-3 mb-4">
                  <Users className="h-3.5 w-3.5" />
                  COMPLAINANT_DETAILS (YOU)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    value={complainantName}
                    onChange={(e) => setComplainantName(e.target.value)}
                    placeholder="Full Name (as on ID)"
                    className="bg-[#050505] border border-neutral-800 px-4 py-2.5 font-mono text-sm text-neutral-300 placeholder:text-neutral-700 focus:border-neutral-600 focus:outline-none w-full"
                  />
                  <input
                    value={complainantPhone}
                    onChange={(e) => setComplainantPhone(e.target.value)}
                    placeholder="Phone Number"
                    className="bg-[#050505] border border-neutral-800 px-4 py-2.5 font-mono text-sm text-neutral-300 placeholder:text-neutral-700 focus:border-neutral-600 focus:outline-none w-full"
                  />
                </div>
                <textarea
                  value={complainantAddress}
                  onChange={(e) => setComplainantAddress(e.target.value)}
                  placeholder="Complete Address (with PIN code)"
                  rows={3}
                  className="w-full mt-3 bg-[#050505] border border-neutral-800 px-4 py-2.5 font-mono text-sm text-neutral-300 placeholder:text-neutral-700 focus:border-neutral-600 focus:outline-none resize-y"
                />
              </div>

              <div className="border border-neutral-900 bg-[#0a0a0a] mb-4 p-5">
                <h3 className="text-[9px] font-mono uppercase tracking-widest text-red-400 flex items-center gap-2 border-b border-neutral-900 pb-3 mb-4">
                  <Building2 className="h-3.5 w-3.5" />
                  RESPONDENT / OPPOSITE_PARTY
                </h3>
                <input
                  value={respondentName}
                  onChange={(e) => setRespondentName(e.target.value)}
                  placeholder="Company / Person Name"
                  className="w-full bg-[#050505] border border-neutral-800 px-4 py-2.5 font-mono text-sm text-neutral-300 placeholder:text-neutral-700 focus:border-neutral-600 focus:outline-none"
                />
                <textarea
                  value={respondentAddress}
                  onChange={(e) => setRespondentAddress(e.target.value)}
                  placeholder="Registered Address"
                  rows={3}
                  className="w-full mt-3 bg-[#050505] border border-neutral-800 px-4 py-2.5 font-mono text-sm text-neutral-300 placeholder:text-neutral-700 focus:border-neutral-600 focus:outline-none resize-y"
                />
              </div>

              <div className="border border-neutral-900 bg-[#0a0a0a] mb-4 p-5">
                <h3 className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 mb-3">
                  ADDITIONAL_CONTEXT (OPTIONAL)
                </h3>
                <textarea
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  placeholder="Any extra details about your complaint..."
                  rows={4}
                  className="w-full bg-[#050505] border border-neutral-800 px-4 py-2.5 font-mono text-sm text-neutral-300 placeholder:text-neutral-700 focus:border-neutral-600 focus:outline-none resize-y"
                />
              </div>

              <div className="flex justify-between mt-8">
                <button
                  onClick={() => setStep(0)}
                  className="flex items-center gap-2 px-4 py-2 border border-neutral-800 bg-[#050505] font-mono uppercase tracking-widest text-[9px] text-neutral-400 hover:text-neutral-200 hover:border-neutral-600 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  BACK
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-3 px-6 py-2.5 border border-amber-900/50 bg-amber-950/10 font-mono uppercase tracking-widest text-[9px] text-amber-400 hover:text-amber-300 hover:border-amber-800 transition-colors"
                >
                  NEXT: GENERATE
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
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
                <div className="border border-neutral-900 bg-[#0a0a0a] p-16 text-center">
                  <div className="inline-flex items-center justify-center p-4 border border-amber-900/50 bg-amber-950/10 mb-6">
                    <FileText className="h-8 w-8 text-amber-400" />
                  </div>
                  <h3 className="text-[10px] font-mono uppercase tracking-widest text-neutral-200 mb-2">
                    [ READY_TO_GENERATE ]
                  </h3>
                  <p className="text-[8px] font-mono uppercase tracking-widest text-neutral-600 mb-2">
                    FILING AT:{" "}
                    <span className="text-neutral-300 border-b border-neutral-600">
                      {selectedAuth?.primary.short_name}
                    </span>
                  </p>
                  <p className="text-[9px] font-mono text-neutral-600 mb-8 max-w-lg mx-auto">
                    WE'LL GENERATE A FORMAL COMPLAINT, AFFIDAVIT, AND INDEX OF
                    DOCUMENTS.
                  </p>
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="flex items-center gap-3 mx-auto px-6 py-2.5 border border-amber-900/50 bg-amber-950/10 font-mono uppercase tracking-widest text-[9px] text-amber-400 hover:text-amber-300 hover:border-amber-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {generating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Gavel className="h-4 w-4" />
                    )}
                    {generating
                      ? "GENERATING..."
                      : "GENERATE COMPLAINT DOCUMENTS"}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 mb-8 pb-4 border-b border-neutral-900">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <h3 className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">
                      DOCUMENTS_GENERATED
                    </h3>
                  </div>

                  {[
                    complaintDocs.complaint,
                    complaintDocs.affidavit,
                    complaintDocs.synopsis,
                  ]
                    .filter(Boolean)
                    .map((doc) => (
                      <div
                        key={doc!.id}
                        className="border border-neutral-900 bg-[#0a0a0a] mb-3 p-5"
                      >
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div>
                            <h4 className="text-[10px] font-mono uppercase tracking-widest text-neutral-200">
                              {doc!.title}
                            </h4>
                            <p className="text-[8px] font-mono text-neutral-600 mt-1">
                              {doc!.format_notes}
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              copyToClipboard(doc!.content, doc!.title)
                            }
                            className="flex items-center gap-2 px-3 py-1.5 border border-neutral-800 bg-[#050505] font-mono uppercase tracking-widest text-[8px] text-neutral-500 hover:text-neutral-200 hover:border-neutral-600 transition-colors"
                          >
                            <Copy className="h-3 w-3" />
                            COPY
                          </button>
                        </div>
                        <details className="group border-t border-neutral-900 pt-4">
                          <summary className="text-[8px] font-mono uppercase tracking-widest text-cyan-400 cursor-pointer hover:text-cyan-300 list-none flex items-center gap-2 transition-colors">
                            VIEW DOCUMENT CONTENT
                            <ChevronDown className="h-3 w-3 group-open:rotate-180 transition-transform" />
                          </summary>
                          <pre className="mt-4 p-4 border border-neutral-800 bg-[#050505] text-xs text-neutral-400 whitespace-pre-wrap max-h-96 overflow-y-auto font-mono">
                            {doc!.content}
                          </pre>
                        </details>
                      </div>
                    ))}

                  {/* Fee Summary */}
                  {complaintDocs.fee && (
                    <div className="border border-neutral-900 bg-[#0a0a0a] mb-3 p-5">
                      <h4 className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 mb-4 flex items-center gap-2 border-b border-neutral-900 pb-3">
                        <IndianRupee className="h-3.5 w-3.5 text-emerald-500" />
                        FILING_FEE
                      </h4>
                      <p className="text-2xl font-mono tabular-nums mb-4">
                        {complaintDocs.fee.is_free ? (
                          <span className="text-emerald-400 px-2 py-1 border border-emerald-900/50 bg-emerald-950/20">
                            FREE ✓
                          </span>
                        ) : (
                          <span className="text-amber-400 px-2 py-1 border border-amber-900/50 bg-amber-950/20">
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
                            className="text-[9px] font-mono text-neutral-500 flex items-center gap-2 leading-relaxed"
                          >
                            <ArrowRight className="h-3 w-3 text-neutral-700 flex-shrink-0" />
                            {note}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between mt-8">
                    <button
                      onClick={() => setStep(1)}
                      className="flex items-center gap-2 px-4 py-2 border border-neutral-800 bg-[#050505] font-mono uppercase tracking-widest text-[9px] text-neutral-400 hover:text-neutral-200 hover:border-neutral-600 transition-colors"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      BACK
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      className="flex items-center gap-3 px-6 py-2.5 border border-amber-900/50 bg-amber-950/10 font-mono uppercase tracking-widest text-[9px] text-amber-400 hover:text-amber-300 hover:border-amber-800 transition-colors"
                    >
                      NEXT: FILING GUIDE
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
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
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-8 pb-4 border-b border-neutral-900">
                    <h3 className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 flex items-center gap-3">
                      <BookOpen className="h-3.5 w-3.5" />
                      STEP_BY_STEP_FILING_GUIDE
                    </h3>
                    <span className="font-mono uppercase tracking-widest text-[8px] px-2 py-1 border border-cyan-900/50 bg-cyan-950/10 text-cyan-400">
                      ~{guide.estimated_time}
                    </span>
                  </div>

                  {guide.steps.map((gs) => (
                    <div
                      key={gs.step_number}
                      className="border border-neutral-900 bg-[#0a0a0a] mb-3 p-5"
                    >
                      <div className="flex items-start gap-5">
                        <div className="flex-shrink-0 w-8 h-8 border border-amber-900/50 bg-amber-950/20 flex items-center justify-center text-sm font-mono tabular-nums text-amber-400">
                          {gs.step_number}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-[10px] font-mono uppercase tracking-widest text-neutral-200 mb-2">
                            {gs.title}
                          </h4>
                          <p className="text-[9px] font-mono text-neutral-500 leading-relaxed mb-4">
                            {gs.description}
                          </p>
                          {gs.url && (
                            <a
                              href={gs.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 font-mono uppercase tracking-widest text-[8px] text-cyan-400 border border-cyan-900/50 bg-cyan-950/10 px-3 py-1.5 hover:text-cyan-300 hover:border-cyan-800 transition-colors mb-4"
                            >
                              <Globe className="h-3 w-3" />
                              VISIT PORTAL
                            </a>
                          )}
                          {gs.tips.length > 0 && (
                            <div className="space-y-2 border-l-2 border-emerald-900/50 bg-emerald-950/10 p-3">
                              {gs.tips.map((tip, ti) => (
                                <p
                                  key={ti}
                                  className="text-[9px] font-mono text-emerald-400/70 leading-relaxed flex items-start gap-2"
                                >
                                  <span className="text-emerald-600 shrink-0">→</span>
                                  {tip}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Document Checklist */}
                  <div className="border border-neutral-900 bg-[#0a0a0a] mb-3 p-5">
                    <h4 className="text-[9px] font-mono uppercase tracking-widest text-amber-400 mb-4 flex items-center gap-3 border-b border-neutral-900 pb-3">
                      <ClipboardList className="h-3.5 w-3.5" />
                      DOCUMENT_CHECKLIST
                    </h4>
                    <div className="space-y-2">
                      {guide.documents_checklist.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-4 p-3 border border-neutral-800 bg-[#050505] hover:border-neutral-700 transition-colors"
                        >
                          <span className="text-base pt-0.5">
                            {item.available
                              ? "✅"
                              : item.required
                                ? "⚠️"
                                : "📎"}
                          </span>
                          <div>
                            <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-300">
                              {item.document}
                            </p>
                            {item.how_to_get && (
                              <p className="text-[8px] font-mono text-neutral-600 mt-1 border-l border-neutral-800 pl-2">
                                {item.how_to_get}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Helpline */}
                  {guide.helpline && (
                    <div className="p-5 border border-cyan-900/50 bg-cyan-950/10 text-center">
                      <p className="text-[9px] font-mono uppercase tracking-widest text-cyan-400">
                        NEED HELP? CALL:{" "}
                        <span className="text-neutral-200 px-2 py-0.5 border border-neutral-800 bg-[#050505] ml-2">
                          {guide.helpline}
                        </span>
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between mt-12 pb-16">
                    <button
                      onClick={() => setStep(2)}
                      className="flex items-center gap-2 px-4 py-2 border border-neutral-800 bg-[#050505] font-mono uppercase tracking-widest text-[9px] text-neutral-400 hover:text-neutral-200 hover:border-neutral-600 transition-colors"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      BACK
                    </button>
                    <Link href={`/complaint`}>
                      <button className="flex items-center gap-3 px-6 py-2.5 border border-emerald-900/50 bg-emerald-950/10 font-mono uppercase tracking-widest text-[9px] text-emerald-400 hover:text-emerald-300 hover:border-emerald-800 transition-colors">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        DONE — VIEW ALL
                      </button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-amber-400 mx-auto mb-3" />
                  <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-600">
                    LOADING FILING GUIDE...
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
