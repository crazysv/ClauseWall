"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { RelatedActions } from "@/components/shared/related-actions";
import {
  FileText,
  Download,
  Copy,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  AlertTriangle,
  Scale,
  Send,
  RefreshCw,
  Building2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { getStateName, getDocumentTypeLabel } from "@/lib/utils/constants";
import type { Document, Clause, DemandLetter } from "@/types";
import { toast } from "sonner";

export default function LetterPage() {
  const params = useParams();
  const documentId = params.id as string;

  const [document, setDocument] = useState<Document | null>(null);
  const [clauses, setClauses] = useState<Clause[]>([]);
  const [letter, setLetter] = useState<DemandLetter | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editedBody, setEditedBody] = useState("");

  const supabase = createClient();

  // Fetch document and clauses
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch document
        const { data: doc, error: docError } = await supabase
          .from("documents")
          .select("*")
          .eq("id", documentId)
          .single();

        if (docError || !doc) {
          toast.error("Document not found");
          setLoading(false);
          return;
        }

        setDocument(doc as Document);

        // Fetch problematic clauses (warning, dangerous, illegal)
        const { data: clauseData } = await supabase
          .from("clauses")
          .select("*")
          .eq("document_id", documentId)
          .in("risk_level", ["warning", "dangerous", "illegal"])
          .order("risk_score", { ascending: false });

        if (clauseData) {
          setClauses(clauseData as Clause[]);
        }

        setLoading(false);
      } catch (err) {
        toast.error("Failed to load document");
        setLoading(false);
      }
    };

    fetchData();
  }, [documentId]);

  // Generate letter
  const generateLetter = async () => {
    if (!document || clauses.length === 0) {
      toast.error("No problematic clauses found to generate letter");
      return;
    }

    setGenerating(true);
    toast.info("Generating legal notice...");

    try {
      const response = await fetch("/api/generate-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          documentType: document.document_type,
          jurisdiction: document.jurisdiction,
          entityName: document.entity_name,
          clauses: clauses.map((c) => ({
            original_text: c.original_text,
            risk_level: c.risk_level,
            risk_score: c.risk_score,
            explanation: c.explanation,
            legal_citation: c.legal_citation,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate letter");
      }

      setLetter(data.letter);
      setEditedBody(data.letter.body);
      toast.success("Legal notice generated!");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(editedBody || letter?.body || "");
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  // Download as text file
  const downloadLetter = () => {
    const content = editedBody || letter?.body || "";
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = `legal-notice-${documentId.substring(0, 8)}.txt`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Letter downloaded!");
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <Loader2 className="h-16 w-16 text-black animate-spin" />
        <p className="text-sm font-black uppercase tracking-widest text-foreground">
          Loading document...
        </p>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 bg-white border-2 border-black p-8 m-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <AlertTriangle className="h-16 w-16 text-red-600" />
        <p className="text-2xl font-black text-red-700">Document not found</p>
        <Link href="/upload">
          <Button className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold uppercase hover:translate-y-1 hover:shadow-none transition-all rounded-none">
            UPLOAD NEW DOCUMENT
          </Button>
        </Link>
      </div>
    );
  }

  // Count problematic clauses
  const illegalCount = clauses.filter((c) => c.risk_level === "illegal").length;
  const dangerousCount = clauses.filter(
    (c) => c.risk_level === "dangerous",
  ).length;
  const warningCount = clauses.filter((c) => c.risk_level === "warning").length;

  return (
    <div className="relative px-4 sm:px-6 lg:px-8 py-8">
      <div className="relative mx-auto max-w-4xl">
        {/* Back Link */}
        <Link
          href={`/results/${documentId}`}
          className="inline-flex items-center gap-2 text-foreground font-black uppercase tracking-wider hover:text-black mb-8 transition-colors hover:translate-x-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Results
        </Link>

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-14 w-14 border-2 border-black bg-blue-100 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(30,58,138,1)]">
              <Scale className="h-7 w-7 text-blue-900" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-black uppercase tracking-tighter">
                Legal Notice Generator
              </h1>
              <p className="text-foreground font-bold uppercase tracking-widest mt-2">
                {document.original_filename} •{" "}
                {getDocumentTypeLabel(document.document_type)} •{" "}
                {getStateName(document.jurisdiction)}
              </p>
            </div>
          </div>
        </div>

        {/* Problematic Clauses Summary */}
        <Card className="border-2 border-black rounded-none bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-10">
          <CardContent className="p-8">
            <h3 className="text-lg font-black uppercase tracking-widest text-black mb-6 border-b-2 border-black/10 pb-4">
              Problematic Clauses Found
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <div className="border-2 border-purple-900 bg-purple-100 p-4 shadow-[4px_4px_0px_0px_rgba(88,28,135,1)] text-center">
                <p className="text-4xl font-black text-purple-900 mb-1">
                  {illegalCount}
                </p>
                <p className="text-[10px] font-black uppercase tracking-widest text-purple-900">
                  Illegal
                </p>
              </div>
              <div className="border-2 border-red-900 bg-red-100 p-4 shadow-[4px_4px_0px_0px_rgba(127,29,29,1)] text-center">
                <p className="text-4xl font-black text-red-900 mb-1">
                  {dangerousCount}
                </p>
                <p className="text-[10px] font-black uppercase tracking-widest text-red-900">
                  Dangerous
                </p>
              </div>
              <div className="border-2 border-yellow-900 bg-yellow-100 p-4 shadow-[4px_4px_0px_0px_rgba(113,63,18,1)] text-center">
                <p className="text-4xl font-black text-yellow-900 mb-1">
                  {warningCount}
                </p>
                <p className="text-[10px] font-black uppercase tracking-widest text-yellow-900">
                  Warning
                </p>
              </div>
            </div>

            {clauses.length === 0 ? (
              <p className="font-bold text-black text-lg p-6 bg-green-100 border-2 border-green-900 text-center">
                No problematic clauses found. Your contract looks good! 🎉
              </p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {clauses.slice(0, 5).map((clause, i) => (
                  <div
                    key={clause.id}
                    className="flex items-center gap-4 text-sm p-4 border-2 border-black bg-gray-50 hover:bg-white transition-colors"
                  >
                    <Badge
                      className={`rounded-none border-2 px-2 py-1 font-black uppercase tracking-wider ${
                        clause.risk_level === "illegal"
                          ? "bg-purple-100 border-purple-900 text-purple-900"
                          : clause.risk_level === "dangerous"
                            ? "bg-red-100 border-red-900 text-red-900"
                            : "bg-yellow-100 border-yellow-900 text-yellow-900"
                      }`}
                    >
                      {clause.risk_level}
                    </Badge>
                    <span className="font-bold text-black truncate flex-1 leading-relaxed">
                      {clause.original_text.substring(0, 80)}...
                    </span>
                  </div>
                ))}
                {clauses.length > 5 && (
                  <p className="text-xs font-black uppercase tracking-widest text-foreground text-center mt-6">
                    + {clauses.length - 5} MORE CLAUSES
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Generate Button */}
        {!letter && (
          <div className="text-center mb-12">
            <Button
              onClick={generateLetter}
              disabled={generating || clauses.length === 0}
              size="lg"
              className="border-2 border-black bg-blue-500 hover:bg-blue-600 text-white font-black uppercase tracking-widest gap-3 px-12 py-8 text-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-y-2 active:translate-x-2 active:shadow-none transition-all rounded-none w-full sm:w-auto"
            >
              {generating ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                  GENERATING LEGAL NOTICE...
                </>
              ) : (
                <>
                  <FileText className="h-6 w-6" />
                  GENERATE LEGAL NOTICE
                </>
              )}
            </Button>
            <p className="text-xs font-bold uppercase tracking-widest text-foreground mt-8">
              This will create a formal legal notice citing Indian laws
            </p>
          </div>
        )}

        {/* Generated Letter */}
        {letter && (
          <Card className="border-2 border-black rounded-none bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <CardContent className="p-8">
              {/* Letter Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                <div>
                  <h3 className="font-black text-2xl uppercase tracking-tight text-black">
                    {letter.subject}
                  </h3>
                  <p className="text-xs font-bold uppercase tracking-widest text-foreground mt-2">
                    Generated under Indian law
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateLetter}
                    disabled={generating}
                    className="border-2 border-black font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all gap-2 rounded-none"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${generating ? "animate-spin" : ""}`}
                    />
                    REGENERATE
                  </Button>
                </div>
              </div>

              {/* Editable Letter Body */}
              <Textarea
                value={editedBody}
                onChange={(e) => setEditedBody(e.target.value)}
                className="min-h-[500px] bg-gray-50 border-2 border-black font-mono text-sm leading-relaxed p-6 shadow-[inset_4px_4px_0px_0px_rgba(0,0,0,0.05)] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-blue-500 rounded-none resize-y"
                placeholder="Letter content..."
              />

              {/* Legal References */}
              {letter.legal_references &&
                letter.legal_references.length > 0 && (
                  <div className="mt-6 p-6 bg-blue-50 border-2 border-blue-900 border-dashed">
                    <p className="text-xs font-black uppercase tracking-widest text-blue-900 dark:text-blue-100 font-bold mb-4">
                      LAWS & SECTIONS REFERENCED:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {letter.legal_references.map((ref, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="rounded-none border-2 border-blue-900 bg-white text-blue-900 font-bold uppercase shadow-[2px_2px_0px_0px_rgba(30,58,138,1)]"
                        >
                          {ref}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

              {/* Agencies */}
              {letter.agencies && letter.agencies.length > 0 && (
                <div className="mt-6 p-6 bg-purple-50 border-2 border-purple-900 border-dashed">
                  <p className="text-xs font-black uppercase tracking-widest text-purple-900 dark:text-purple-100 font-bold mb-4">
                    WHERE TO FILE COMPLAINTS:
                  </p>
                  <ul className="text-sm font-bold text-purple-950 space-y-3">
                    {letter.agencies.map((agency, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-purple-600 flex-shrink-0" />
                        {agency}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t-2 border-black/10">
                <Button
                  onClick={copyToClipboard}
                  className="border-2 border-black font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all gap-2 rounded-none px-6"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      COPIED!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      COPY TO CLIPBOARD
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={downloadLetter}
                  className="border-2 border-black font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all gap-2 rounded-none px-6"
                >
                  <Download className="h-4 w-4" />
                  DOWNLOAD AS TXT
                </Button>
                <Button
                  variant="outline"
                  className="border-2 border-black font-black uppercase tracking-wider gap-2 rounded-none px-6 disabled:opacity-50"
                  disabled
                >
                  <Send className="h-4 w-4" />
                  EMAIL (SOON)
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Disclaimer */}
        <div className="mt-12 p-6 bg-yellow-50 border-2 border-yellow-900 shadow-[4px_4px_0px_0px_rgba(113,63,18,1)]">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <AlertTriangle className="text-yellow-900 dark:text-yellow-100 font-bold h-8 w-8 flex-shrink-0" />
            <div className="text-yellow-900">
              <p className="font-black uppercase tracking-widest text-base mb-2">
                IMPORTANT DISCLAIMER
              </p>
              <p className="font-bold leading-relaxed">
                This legal notice is auto-generated for informational purposes
                only. It is NOT a substitute for professional legal advice. We
                recommend consulting with a qualified lawyer before sending any
                legal notice. ClauseWall is not responsible for any consequences
                arising from the use of this generated content.
              </p>
            </div>
          </div>
        </div>

        {/* Notice Follow-Up: File at Authority */}
        {letter && (
          <Card className="mt-8 border-2 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
            <CardContent className="p-8">
              <div className="flex items-center gap-4 mb-6 pb-4 border-b-2 border-black/10">
                <Building2 className="h-6 w-6 text-black" />
                <h3 className="font-black uppercase tracking-widest text-lg">
                  HAVE YOU SENT THE NOTICE?
                </h3>
              </div>

              {/* Mini Escalation Preview */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
                <div className="border-2 border-black bg-green-300 px-4 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-black" />
                  <span className="text-xs font-black uppercase tracking-wider text-black">
                    Step 1: Legal Notice
                  </span>
                </div>
                <ArrowRight className="h-5 w-5 text-black hidden sm:block" />
                <Link
                  href="/authority"
                  className="border-2 border-black bg-white hover:bg-gray-100 flex items-center gap-2 px-4 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-1 hover:-translate-y-1"
                >
                  <Building2 className="h-4 w-4 text-black" />
                  <span className="text-xs font-black uppercase tracking-wider text-black">
                    Step 2: File at Authority →
                  </span>
                </Link>
              </div>

              <p className="text-sm font-bold text-foreground leading-relaxed">
                Under Indian consumer law, if the opposing party does not
                respond to your legal notice within 15 days, you can escalate by
                filing a formal complaint at the appropriate forum.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Related Actions */}
        <RelatedActions documentId={documentId} currentPage="letter" />
      </div>
    </div>
  );
}
