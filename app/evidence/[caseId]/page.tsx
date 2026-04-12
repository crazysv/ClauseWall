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
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </main>
    );
  }

  if (!evidenceCase) return null;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-neutral-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <Link
          href="/evidence"
          className="inline-flex items-center gap-2 text-[8px] font-mono uppercase tracking-widest text-neutral-600 hover:text-neutral-300 mb-6 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          BACK TO CASES
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-6 border-b border-neutral-900 pb-5">
          <div>
            <h1 className="text-xs font-mono uppercase tracking-widest text-neutral-200">
              {evidenceCase.title}
            </h1>
            <p className="text-[8px] font-mono uppercase tracking-widest text-neutral-600 mt-1">
              VS. {evidenceCase.counterparty_name}{" "}
              <span className="text-neutral-700 mx-1">•</span>{" "}
              {evidenceCase.dispute_type || "General"} DISPUTE
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleVerifyChain}
              disabled={verifying}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-800 bg-[#050505] font-mono uppercase tracking-widest text-[8px] text-neutral-400 hover:text-neutral-200 hover:border-neutral-600 disabled:opacity-40 transition-colors"
            >
              {verifying ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3 w-3" />
              )}
              VERIFY CHAIN
            </button>
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-800 bg-[#050505] font-mono uppercase tracking-widest text-[8px] text-neutral-400 hover:text-neutral-200 hover:border-neutral-600 transition-colors"
            >
              <Plus className="h-3 w-3" />
              ADD EVIDENCE
            </button>
            <Link href={`/evidence/${caseId}/bundle`}>
              <span className="flex items-center gap-1.5 px-3 py-1.5 border border-cyan-900/50 bg-cyan-950/10 font-mono uppercase tracking-widest text-[8px] text-cyan-400 hover:text-cyan-300 hover:border-cyan-800 transition-colors">
                <Package className="h-3 w-3" />
                GENERATE BUNDLE
              </span>
            </Link>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-3 border-l-2 text-[9px] font-mono uppercase tracking-widest ${
              message.type === "success"
                ? "border-emerald-500 bg-emerald-950/20 text-emerald-400"
                : "border-red-500 bg-red-950/20 text-red-400"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="inline h-3.5 w-3.5 mr-2" />
            ) : (
              <AlertTriangle className="inline h-3.5 w-3.5 mr-2" />
            )}
            {message.text}
          </div>
        )}

        {/* Stats */}
        <div className="mb-5">
          <EvidenceStats stats={computeStats()} />
        </div>

        {/* Storage */}
        <div className="mb-6 border border-neutral-900 bg-[#0a0a0a] p-5">
          <StorageUsageBar usedBytes={evidenceCase.storage_used_bytes} />
        </div>

        {/* Upload area */}
        {showUpload && (
          <div className="mb-6 border border-neutral-900 bg-[#0a0a0a] p-6">
            <h3 className="text-[9px] font-mono uppercase tracking-widest text-neutral-300 mb-5 flex items-center gap-2">
              <Plus className="h-3.5 w-3.5" /> ADD EVIDENCE
            </h3>
            <EvidenceUploadZone caseId={caseId} onUpload={handleUpload} />
            {uploading && (
              <div className="flex items-center gap-2 mt-5 text-[8px] font-mono uppercase tracking-widest text-cyan-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                PROCESSING...
              </div>
            )}
          </div>
        )}

        {/* View mode tabs */}
        <div className="flex items-center gap-4 mb-6 border-b border-neutral-900 pb-3">
          <div className="flex gap-1">
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
                  className={`flex items-center gap-1.5 px-3 py-2 border text-[8px] font-mono uppercase tracking-widest transition-colors ${
                    viewMode === mode
                      ? "bg-amber-950/20 text-amber-400 border-amber-900/50"
                      : "bg-[#050505] text-neutral-600 border-neutral-800 hover:border-neutral-700 hover:text-neutral-400"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
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
          <div className="space-y-2">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[8px] font-mono uppercase tracking-widest text-neutral-600">
                  NO EVIDENCE ITEMS YET. CLICK &quot;ADD EVIDENCE&quot; TO GET
                  STARTED.
                </p>
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
