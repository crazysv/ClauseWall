"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import type {
  EvidenceCase,
  EvidenceItem,
  EvidenceType,
  ChainLink,
} from "@/types/evidence";
import { EvidenceItemCard } from "@/components/evidence/evidence-item-card";
import { EvidenceTimeline } from "@/components/evidence/evidence-timeline";
import { EvidenceUploadZone } from "@/components/evidence/evidence-upload-zone";
import { EvidenceChainVisualizer } from "@/components/evidence/evidence-chain-visualizer";
import { ChainStatusBadge } from "@/components/evidence/chain-status-badge";
import { StorageUsageBar } from "@/components/evidence/storage-usage-bar";
import { EvidenceStats } from "@/components/evidence/evidence-stats";
import { Button } from "@/components/ui/button";
import {
  Shield,
  ArrowLeft,
  Loader2,
  Package,
  FileText,
  Clock,
  Link as LinkIcon,
  CheckCircle2,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Plus,
} from "lucide-react";
import Link from "next/link";

type ViewMode = "items" | "timeline" | "chain";

export default function EvidenceCaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.caseId as string;

  const [evidenceCase, setEvidenceCase] = useState<EvidenceCase | null>(null);
  const [items, setItems] = useState<EvidenceItem[]>([]);
  const [chainLinks, setChainLinks] = useState<ChainLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("items");
  const [showUpload, setShowUpload] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchCase = useCallback(async () => {
    try {
      const res = await fetch(`/api/evidence/cases/${caseId}`);
      if (!res.ok) {
        router.push("/evidence");
        return;
      }
      const data = await res.json();
      setEvidenceCase(data.case);
      setItems(data.items || []);
    } catch {
      router.push("/evidence");
    } finally {
      setLoading(false);
    }
  }, [caseId, router]);

  useEffect(() => {
    fetchCase();
  }, [fetchCase]);

  const handleUpload = async (
    type: EvidenceType,
    files: File[],
    urlOrCin?: string,
  ) => {
    setUploading(true);
    setMessage(null);

    try {
      let endpoint: string;
      let body: FormData | string;
      let headers: Record<string, string> = {};

      if (type === "whatsapp_chat" && files.length > 0) {
        endpoint = "/api/evidence/capture/whatsapp";
        const fd = new FormData();
        fd.append("file", files[0]);
        fd.append("case_id", caseId);
        body = fd;
      } else if (type === "email" && files.length > 0) {
        endpoint = "/api/evidence/capture/email";
        const fd = new FormData();
        fd.append("file", files[0]);
        fd.append("case_id", caseId);
        body = fd;
      } else if (type === "payment_receipt" && files.length > 0) {
        endpoint = "/api/evidence/capture/receipt";
        const fd = new FormData();
        fd.append("file", files[0]);
        fd.append("case_id", caseId);
        body = fd;
      } else if (type === "audio_recording" && files.length > 0) {
        endpoint = "/api/evidence/capture/audio";
        const fd = new FormData();
        fd.append("file", files[0]);
        fd.append("case_id", caseId);
        body = fd;
      } else if (type === "website_archive" && urlOrCin) {
        endpoint = "/api/evidence/capture/url";
        body = JSON.stringify({
          case_id: caseId,
          url: urlOrCin,
          evidence_type: type,
        });
        headers = { "Content-Type": "application/json" };
      } else if (type === "company_data" && urlOrCin) {
        endpoint = "/api/evidence/company";
        body = JSON.stringify({ case_id: caseId, cin: urlOrCin });
        headers = { "Content-Type": "application/json" };
      } else if (files.length > 0) {
        // Generic file upload
        endpoint = "/api/evidence/items";
        body = JSON.stringify({
          case_id: caseId,
          evidence_type: type,
          title: files[0].name,
          content: await files[0].text().catch(() => files[0].name),
          original_filename: files[0].name,
          mime_type: files[0].type,
          file_size_bytes: files[0].size,
        });
        headers = { "Content-Type": "application/json" };
      } else {
        return;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        body: body as BodyInit,
        ...(Object.keys(headers).length > 0 ? { headers } : {}),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Evidence added successfully!" });
        await fetchCase();
        setShowUpload(false);
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to add evidence",
        });
      }
    } catch (e) {
      setMessage({ type: "error", text: "Something went wrong" });
    } finally {
      setUploading(false);
    }
  };

  const handleVerifyChain = async () => {
    setVerifying(true);
    try {
      const res = await fetch("/api/evidence/chain/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ case_id: caseId }),
      });
      const data = await res.json();
      setChainLinks(
        items.map((item, i) => ({
          item_id: item.id,
          sequence_number: item.sequence_number,
          content_hash: item.content_hash,
          chain_hash: item.chain_hash,
          previous_chain_hash:
            i === 0 ? null : items[i - 1]?.chain_hash || null,
          timestamp: item.captured_at,
          verified: data.verification?.valid !== false,
        })),
      );

      if (data.verification?.valid) {
        setMessage({
          type: "success",
          text: `Chain verified ✓ — Merkle Root: ${data.merkle_root?.substring(0, 16)}...`,
        });
      } else {
        setMessage({
          type: "error",
          text: `Chain broken at item #${data.verification?.broken_at}`,
        });
      }
      await fetchCase();
    } catch {
      setMessage({ type: "error", text: "Verification failed" });
    } finally {
      setVerifying(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Delete this evidence item? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/evidence/items/${itemId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMessage({ type: "success", text: "Item deleted" });
        await fetchCase();
      }
    } catch {
      setMessage({ type: "error", text: "Delete failed" });
    }
  };

  const handleCertifyItem = async (itemId: string) => {
    const name = prompt("Your full name (for Section 65B certificate):");
    if (!name) return;
    const designation =
      prompt("Your designation (e.g., Complainant):") || "Complainant";
    const address = prompt("Your address:") || "";
    const place = prompt("Place of certification (city):") || "";

    try {
      const res = await fetch("/api/evidence/certificate/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_id: itemId,
          case_id: caseId,
          user_info: { name, designation, address, place },
        }),
      });
      if (res.ok) {
        setMessage({ type: "success", text: "65B Certificate generated ✓" });
        await fetchCase();
      }
    } catch {
      setMessage({ type: "error", text: "Certificate generation failed" });
    }
  };

  const computeStats = () => ({
    total_items: items.length,
    by_type: items.reduce(
      (acc, i) => {
        acc[i.evidence_type] = (acc[i.evidence_type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ),
    certified_count: items.filter((i) => i.is_certified).length,
    chain_verified: evidenceCase?.chain_verified ?? false,
    storage_used_bytes: evidenceCase?.storage_used_bytes || 0,
    storage_limit_bytes: 200 * 1024 * 1024,
  });

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (!evidenceCase) return null;

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <Link
          href="/evidence"
          className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest text-muted-foreground hover:text-foreground mb-6 border-b-2 border-transparent hover:border-black transition-all"
        >
          <ArrowLeft className="h-4 w-4 stroke-[3px]" />
          BACK TO CASES
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-8 border-b-4 border-black pb-6">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-widest text-foreground">
              {evidenceCase.title}
            </h1>
            <p className="text-sm font-bold text-muted-foreground mt-2 tracking-wide uppercase">
              vs. {evidenceCase.counterparty_name}{" "}
              <span className="mx-2">•</span>{" "}
              {evidenceCase.dispute_type || "General"} Dispute
            </p>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <Button
              variant="outline"
              onClick={handleVerifyChain}
              disabled={verifying}
              className="btn-impact bg-white dark:bg-zinc-900 border-2 px-6"
            >
              {verifying ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin stroke-[3px]" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2 stroke-[3px]" />
              )}
              VERIFY CHAIN
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowUpload(!showUpload)}
              className="btn-impact bg-white dark:bg-zinc-900 border-2 px-6"
            >
              + ADD EVIDENCE
            </Button>
            <Link href={`/evidence/${caseId}/bundle`}>
              <Button className="btn-impact bg-blue-600 hover:bg-blue-700 text-white px-6">
                <Package className="h-4 w-4 mr-2 stroke-[3px]" />
                GENERATE BUNDLE
              </Button>
            </Link>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-8 p-4 border-4 border-black font-bold uppercase tracking-widest text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${message.type === "success" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-100" : "bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-100"}`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="inline h-5 w-5 mr-2 stroke-[3px]" />
            ) : (
              <AlertTriangle className="inline h-5 w-5 mr-2 stroke-[3px]" />
            )}
            {message.text}
          </div>
        )}

        {/* Stats */}
        <div className="mb-6">
          <EvidenceStats stats={computeStats()} />
        </div>

        {/* Storage */}
        <div className="mb-8 border-4 border-black bg-white dark:bg-zinc-900 p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <StorageUsageBar usedBytes={evidenceCase.storage_used_bytes} />
        </div>

        {/* Upload area */}
        {showUpload && (
          <div className="mb-8 border-4 border-black bg-blue-50 dark:bg-blue-900/20 p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-lg font-black uppercase tracking-widest text-foreground mb-6 flex items-center gap-3">
              <Plus className="h-6 w-6 stroke-[3px]" /> ADD EVIDENCE
            </h3>
            <EvidenceUploadZone caseId={caseId} onUpload={handleUpload} />
            {uploading && (
              <div className="flex items-center gap-3 mt-6 text-sm font-bold text-blue-700 dark:text-blue-400 uppercase tracking-widest">
                <Loader2 className="h-5 w-5 animate-spin stroke-[3px]" />
                PROCESSING...
              </div>
            )}
          </div>
        )}

        {/* View mode tabs */}
        <div className="flex items-center gap-4 mb-8 border-b-4 border-black pb-4">
          <div className="flex gap-2">
            {(["items", "timeline", "chain"] as ViewMode[]).map((mode) => {
              const Icon =
                mode === "items"
                  ? FileText
                  : mode === "timeline"
                    ? Clock
                    : LinkIcon;
              return (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`flex items-center gap-2 px-4 py-2 border-2 border-black text-sm font-black uppercase tracking-widest transition-all ${
                    viewMode === mode
                      ? "bg-black text-white dark:bg-white dark:text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      : "bg-white dark:bg-zinc-900 text-muted-foreground hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  }`}
                >
                  <Icon className="h-5 w-5 stroke-[3px]" />
                  {mode === "items"
                    ? "ITEMS"
                    : mode === "timeline"
                      ? "TIMELINE"
                      : "CHAIN"}
                </button>
              );
            })}
          </div>
          <div className="ml-auto">
            <ChainStatusBadge verified={evidenceCase.chain_verified} />
          </div>
        </div>

        {/* Content */}
        {viewMode === "items" && (
          <div className="space-y-3">
            {items.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No evidence items yet. Click &quot;Add Evidence&quot; to get
                started.
              </div>
            ) : (
              items.map((item) => (
                <EvidenceItemCard
                  key={item.id}
                  item={item}
                  onDelete={handleDeleteItem}
                  onCertify={handleCertifyItem}
                />
              ))
            )}
          </div>
        )}

        {viewMode === "timeline" && <EvidenceTimeline items={items} />}

        {viewMode === "chain" && (
          <EvidenceChainVisualizer
            links={
              chainLinks.length > 0
                ? chainLinks
                : items.map((item, i) => ({
                    item_id: item.id,
                    sequence_number: item.sequence_number,
                    content_hash: item.content_hash,
                    chain_hash: item.chain_hash,
                    previous_chain_hash:
                      i === 0 ? null : items[i - 1]?.chain_hash || null,
                    timestamp: item.captured_at,
                    verified: true,
                  }))
            }
          />
        )}
      </div>
    </main>
  );
}
