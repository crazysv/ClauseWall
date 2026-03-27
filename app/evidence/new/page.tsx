"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import type { CounterpartyType, DisputeType } from "@/types/evidence";

const COUNTERPARTY_TYPES: { value: CounterpartyType; label: string; emoji: string }[] = [
  { value: "company", label: "Company", emoji: "🏢" },
  { value: "employer", label: "Employer", emoji: "💼" },
  { value: "landlord", label: "Landlord", emoji: "🏠" },
  { value: "bank", label: "Bank/NBFC", emoji: "🏦" },
  { value: "builder", label: "Builder/Developer", emoji: "🏗️" },
  { value: "broker", label: "Broker/Agent", emoji: "🤝" },
  { value: "service_provider", label: "Service Provider", emoji: "⚙️" },
  { value: "individual", label: "Individual", emoji: "👤" },
  { value: "government", label: "Government", emoji: "🏛️" },
  { value: "other", label: "Other", emoji: "📋" },
];

const DISPUTE_TYPES: { value: DisputeType; label: string }[] = [
  { value: "consumer", label: "Consumer Dispute" },
  { value: "rental", label: "Rental Dispute" },
  { value: "employment", label: "Employment Dispute" },
  { value: "financial", label: "Financial Dispute" },
  { value: "property", label: "Property Dispute" },
  { value: "service", label: "Service Dispute" },
  { value: "insurance", label: "Insurance Dispute" },
  { value: "telecom", label: "Telecom Dispute" },
  { value: "ecommerce", label: "E-Commerce Dispute" },
  { value: "other", label: "Other" },
];

export default function NewEvidenceCasePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
      <NewEvidenceCaseForm />
    </Suspense>
  );
}

function NewEvidenceCaseForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const documentId = searchParams.get("documentId");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [counterpartyName, setCounterpartyName] = useState("");
  const [counterpartyType, setCounterpartyType] = useState<CounterpartyType>("company");
  const [disputeType, setDisputeType] = useState<DisputeType>("consumer");
  const [disputeDescription, setDisputeDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !counterpartyName.trim()) {
      setError("Case title and counterparty name are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/evidence/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          counterparty_name: counterpartyName,
          counterparty_type: counterpartyType,
          dispute_type: disputeType,
          dispute_description: disputeDescription,
          document_id: documentId || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create case");
        return;
      }

      const data = await res.json();
      router.push(`/evidence/${data.case.id}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/evidence" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-3 w-3" />
          Back to Evidence Cases
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <Shield className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">New Evidence Case</h1>
            <p className="text-xs text-muted-foreground">Create a new evidence case to start building your evidence chain</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Case Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Case Title *</label>
            <input
              type="text"
              placeholder="e.g., Defective Product — Amazon Order #123"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/50"
              required
            />
          </div>

          {/* Counterparty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Counterparty Name *</label>
              <input
                type="text"
                placeholder="e.g., ABC Pvt. Ltd."
                value={counterpartyName}
                onChange={(e) => setCounterpartyName(e.target.value)}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/50"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Type</label>
              <select
                value={counterpartyType}
                onChange={(e) => setCounterpartyType(e.target.value as CounterpartyType)}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-sm text-foreground focus:outline-none focus:border-blue-500/50 [&>option]:bg-[#0a0a0f] [&>option]:text-foreground"
              >
                {COUNTERPARTY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Dispute */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Dispute Type</label>
              <select
                value={disputeType}
                onChange={(e) => setDisputeType(e.target.value as DisputeType)}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-sm text-foreground focus:outline-none focus:border-blue-500/50 [&>option]:bg-[#0a0a0f] [&>option]:text-foreground"
              >
                {DISPUTE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Description</label>
              <input
                type="text"
                placeholder="Brief case description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/50"
              />
            </div>
          </div>

          {/* Dispute Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Dispute Details (optional)</label>
            <textarea
              placeholder="Describe what happened in detail. This helps organize your evidence..."
              value={disputeDescription}
              onChange={(e) => setDisputeDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/50 resize-none"
            />
          </div>

          {/* Submit */}
          <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 h-12">
            {loading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating Case...</>
            ) : (
              <><Shield className="h-4 w-4 mr-2" />Create Evidence Case</>
            )}
          </Button>
        </form>
      </div>
    </main>
  );
}
