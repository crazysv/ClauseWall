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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
        <p className="text-muted-foreground">Loading document...</p>
      </div>
    );
  }

  // No document
  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <p className="text-red-400">Document not found</p>
        <Link href="/upload">
          <Button>Upload New Document</Button>
        </Link>
      </div>
    );
  }

  // Count problematic clauses
  const illegalCount = clauses.filter((c) => c.risk_level === "illegal").length;
  const dangerousCount = clauses.filter((c) => c.risk_level === "dangerous").length;
  const warningCount = clauses.filter((c) => c.risk_level === "warning").length;

  return (
    <div className="relative px-4 sm:px-6 lg:px-8 py-8">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl">
        {/* Back Link */}
        <Link
          href={`/results/${documentId}`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Results
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Scale className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Legal Notice Generator</h1>
              <p className="text-muted-foreground text-sm">
                {document.original_filename} • {getDocumentTypeLabel(document.document_type)} •{" "}
                {getStateName(document.jurisdiction)}
              </p>
            </div>
          </div>
        </div>

        {/* Problematic Clauses Summary */}
        <Card className="glass border-white/5 mb-6">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Problematic Clauses Found</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 rounded-lg bg-purple-500/10">
                <p className="text-2xl font-bold text-purple-400">{illegalCount}</p>
                <p className="text-xs text-muted-foreground">Illegal</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-red-500/10">
                <p className="text-2xl font-bold text-red-400">{dangerousCount}</p>
                <p className="text-xs text-muted-foreground">Dangerous</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-yellow-500/10">
                <p className="text-2xl font-bold text-yellow-400">{warningCount}</p>
                <p className="text-xs text-muted-foreground">Warning</p>
              </div>
            </div>

            {clauses.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No problematic clauses found. Your contract looks good! 🎉
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {clauses.slice(0, 5).map((clause, i) => (
                  <div
                    key={clause.id}
                    className="flex items-center gap-2 text-sm p-2 rounded-lg bg-white/5"
                  >
                    <Badge
                      className={
                        clause.risk_level === "illegal"
                          ? "bg-purple-500/20 text-purple-400"
                          : clause.risk_level === "dangerous"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-yellow-500/20 text-yellow-400"
                      }
                    >
                      {clause.risk_level}
                    </Badge>
                    <span className="text-muted-foreground truncate flex-1">
                      {clause.original_text.substring(0, 80)}...
                    </span>
                  </div>
                ))}
                {clauses.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center">
                    + {clauses.length - 5} more clauses
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Generate Button */}
        {!letter && (
          <div className="text-center mb-8">
            <Button
              onClick={generateLetter}
              disabled={generating || clauses.length === 0}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 gap-2 px-8"
            >
              {generating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating Legal Notice...
                </>
              ) : (
                <>
                  <FileText className="h-5 w-5" />
                  Generate Legal Notice
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              This will create a formal legal notice citing Indian laws
            </p>
          </div>
        )}

        {/* Generated Letter */}
        {letter && (
          <Card className="glass border-white/5 glow-blue">
            <CardContent className="p-6">
              {/* Letter Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{letter.subject}</h3>
                  <p className="text-sm text-muted-foreground">
                    Generated under Indian law
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateLetter}
                    disabled={generating}
                    className="gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${generating ? "animate-spin" : ""}`} />
                    Regenerate
                  </Button>
                </div>
              </div>

              {/* Editable Letter Body */}
              <Textarea
                value={editedBody}
                onChange={(e) => setEditedBody(e.target.value)}
                className="min-h-[400px] bg-white/5 border-white/10 font-mono text-sm leading-relaxed"
                placeholder="Letter content..."
              />

              {/* Legal References */}
              {letter.legal_references && letter.legal_references.length > 0 && (
                <div className="mt-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="text-sm font-medium text-blue-400 mb-2">
                    Laws & Sections Referenced:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {letter.legal_references.map((ref, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="border-blue-500/30 text-blue-300"
                      >
                        {ref}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Agencies */}
              {letter.agencies && letter.agencies.length > 0 && (
                <div className="mt-4 p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <p className="text-sm font-medium text-purple-400 mb-2">
                    Where to File Complaints:
                  </p>
                  <ul className="text-sm text-purple-300 space-y-1">
                    {letter.agencies.map((agency, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3" />
                        {agency}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mt-6">
                <Button onClick={copyToClipboard} className="gap-2">
                  {copied ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy to Clipboard
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={downloadLetter} className="gap-2">
                  <Download className="h-4 w-4" />
                  Download as TXT
                </Button>
                <Button variant="outline" className="gap-2" disabled>
                  <Send className="h-4 w-4" />
                  Send via Email (Coming Soon)
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Disclaimer */}
        <div className="mt-8 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-300">
              <p className="font-medium mb-1">Important Disclaimer</p>
              <p className="text-yellow-300/80">
                This legal notice is auto-generated for informational purposes only. It is NOT
                a substitute for professional legal advice. We recommend consulting with a
                qualified lawyer before sending any legal notice. ClauseWall is not responsible
                for any consequences arising from the use of this generated content.
              </p>
            </div>
          </div>
        </div>

        {/* Notice Follow-Up: File at Authority */}
        {letter && (
          <Card className="mt-6 border-blue-500/20 bg-blue-500/5">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="h-5 w-5 text-blue-400" />
                <h3 className="font-semibold">Notice sent? If no response in 15 days, file here:</h3>
              </div>

              {/* Mini Escalation Preview */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/15 border border-green-500/30">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                  <span className="text-xs font-medium text-green-400">Step 1: Legal Notice</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Link href="/authority" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 hover:bg-blue-500/25 transition-colors">
                  <Building2 className="h-3.5 w-3.5 text-blue-400" />
                  <span className="text-xs font-medium text-blue-400">Step 2: File at Authority →</span>
                </Link>
              </div>

              <p className="text-xs text-muted-foreground">
                Under Indian consumer law, if the opposing party does not respond to your legal notice
                within 15 days, you can escalate by filing a formal complaint at the appropriate forum.
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