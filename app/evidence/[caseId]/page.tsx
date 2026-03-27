"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import type { EvidenceCase, EvidenceItem, EvidenceType, ChainLink } from "@/types/evidence";
import { EvidenceItemCard } from "@/components/evidence/evidence-item-card";
import { EvidenceTimeline } from "@/components/evidence/evidence-timeline";
import { EvidenceUploadZone } from "@/components/evidence/evidence-upload-zone";
import { EvidenceChainVisualizer } from "@/components/evidence/evidence-chain-visualizer";
import { ChainStatusBadge } from "@/components/evidence/chain-status-badge";
import { StorageUsageBar } from "@/components/evidence/storage-usage-bar";
import { EvidenceStats } from "@/components/evidence/evidence-stats";
import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft, Loader2, Package, FileText, Clock, Link as LinkIcon, CheckCircle2, RefreshCw, Trash2 } from "lucide-react";
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
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchCase = useCallback(async () => {
    try {
      const res = await fetch(`/api/evidence/cases/${caseId}`);
      if (!res.ok) { router.push("/evidence"); return; }
      const data = await res.json();
      setEvidenceCase(data.case);
      setItems(data.items || []);
    } catch { router.push("/evidence"); }
    finally { setLoading(false); }
  }, [caseId, router]);

  useEffect(() => { fetchCase(); }, [fetchCase]);

  const handleUpload = async (type: EvidenceType, files: File[], urlOrCin?: string) => {
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
        body = JSON.stringify({ case_id: caseId, url: urlOrCin, evidence_type: type });
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
        setMessage({ type: "error", text: data.error || "Failed to add evidence" });
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
          previous_chain_hash: i === 0 ? null : items[i - 1]?.chain_hash || null,
          timestamp: item.captured_at,
          verified: data.verification?.valid !== false,
        }))
      );

      if (data.verification?.valid) {
        setMessage({ type: "success", text: `Chain verified ✓ — Merkle Root: ${data.merkle_root?.substring(0, 16)}...` });
      } else {
        setMessage({ type: "error", text: `Chain broken at item #${data.verification?.broken_at}` });
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
      const res = await fetch(`/api/evidence/items/${itemId}`, { method: "DELETE" });
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
    const designation = prompt("Your designation (e.g., Complainant):") || "Complainant";
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
    by_type: items.reduce((acc, i) => {
      acc[i.evidence_type] = (acc[i.evidence_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
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
        <Link href="/evidence" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-3 w-3" />Back to Cases
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-foreground">{evidenceCase.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              vs. {evidenceCase.counterparty_name} • {evidenceCase.dispute_type || "General"} Dispute
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleVerifyChain} disabled={verifying} className="text-xs border-white/10">
              {verifying ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
              Verify Chain
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowUpload(!showUpload)} className="text-xs border-white/10">
              + Add Evidence
            </Button>
            <Link href={`/evidence/${caseId}/bundle`}>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs">
                <Package className="h-3 w-3 mr-1" />Generate Bundle
              </Button>
            </Link>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === "success" ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}>
            {message.text}
          </div>
        )}

        {/* Stats */}
        <div className="mb-6">
          <EvidenceStats stats={computeStats()} />
        </div>

        {/* Storage */}
        <div className="mb-6 rounded-lg border border-white/5 bg-white/[0.02] p-4">
          <StorageUsageBar usedBytes={evidenceCase.storage_used_bytes} />
        </div>

        {/* Upload area */}
        {showUpload && (
          <div className="mb-6 rounded-xl border border-blue-500/20 bg-blue-500/5 p-6">
            <h3 className="text-sm font-medium text-foreground mb-4">Add Evidence</h3>
            <EvidenceUploadZone caseId={caseId} onUpload={handleUpload} />
            {uploading && (
              <div className="flex items-center gap-2 mt-4 text-sm text-blue-400">
                <Loader2 className="h-4 w-4 animate-spin" />Processing...
              </div>
            )}
          </div>
        )}

        {/* View mode tabs */}
        <div className="flex items-center gap-1 mb-4 border-b border-white/5 pb-2">
          {(["items", "timeline", "chain"] as ViewMode[]).map((mode) => {
            const Icon = mode === "items" ? FileText : mode === "timeline" ? Clock : LinkIcon;
            return (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  viewMode === mode
                    ? "bg-blue-500/10 text-blue-400"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {mode === "items" ? "Items" : mode === "timeline" ? "Timeline" : "Chain"}
              </button>
            );
          })}
          <ChainStatusBadge verified={evidenceCase.chain_verified} />
        </div>

        {/* Content */}
        {viewMode === "items" && (
          <div className="space-y-3">
            {items.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No evidence items yet. Click &quot;Add Evidence&quot; to get started.
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

        {viewMode === "chain" && <EvidenceChainVisualizer links={chainLinks.length > 0 ? chainLinks : items.map((item, i) => ({
          item_id: item.id,
          sequence_number: item.sequence_number,
          content_hash: item.content_hash,
          chain_hash: item.chain_hash,
          previous_chain_hash: i === 0 ? null : items[i - 1]?.chain_hash || null,
          timestamp: item.captured_at,
          verified: true,
        }))} />}
      </div>
    </main>
  );
}
