"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import type { CounterpartyType, DisputeType } from "@/types/evidence";

const COUNTERPARTY_TYPES: {
  value: CounterpartyType;
  label: string;
  emoji: string;
}[] = [
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
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-amber-500/50" />
        </div>
      }
    >
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
  const [counterpartyType, setCounterpartyType] =
    useState<CounterpartyType>("company");
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

  const inputClass =
    "w-full border border-neutral-800 p-3 bg-[#050505] text-sm font-mono text-neutral-300 focus:outline-none focus:border-neutral-600 transition-colors placeholder:text-neutral-700";

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-neutral-200">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <Link
          href="/evidence"
          className="inline-flex items-center gap-2 text-[8px] font-mono uppercase tracking-widest text-neutral-600 hover:text-neutral-300 mb-6 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          BACK TO EVIDENCE CASES
        </Link>

        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-neutral-900">
          <div className="p-2.5 border border-cyan-900/50 bg-cyan-950/10">
            <Shield className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xs font-mono uppercase tracking-widest text-neutral-200">
              NEW EVIDENCE CASE
            </h1>
            <p className="text-[8px] font-mono uppercase tracking-widest text-neutral-600 mt-0.5">
              CREATE A NEW EVIDENCE CASE TO START BUILDING YOUR EVIDENCE CHAIN
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 border-l-2 border-red-500 bg-red-950/20 text-[9px] font-mono text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Case Title */}
          <div className="space-y-1.5">
            <label className="text-[8px] font-mono uppercase tracking-widest text-neutral-400">
              CASE TITLE *
            </label>
            <input
              type="text"
              placeholder="e.g., Defective Product — Amazon Order #123"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          {/* Counterparty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[8px] font-mono uppercase tracking-widest text-neutral-400">
                COUNTERPARTY NAME *
              </label>
              <input
                type="text"
                placeholder="e.g., ABC Pvt. Ltd."
                value={counterpartyName}
                onChange={(e) => setCounterpartyName(e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[8px] font-mono uppercase tracking-widest text-neutral-400">
                TYPE
              </label>
              <select
                value={counterpartyType}
                onChange={(e) =>
                  setCounterpartyType(e.target.value as CounterpartyType)
                }
                className={inputClass}
              >
                {COUNTERPARTY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.emoji} {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dispute */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[8px] font-mono uppercase tracking-widest text-neutral-400">
                DISPUTE TYPE
              </label>
              <select
                value={disputeType}
                onChange={(e) => setDisputeType(e.target.value as DisputeType)}
                className={inputClass}
              >
                {DISPUTE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[8px] font-mono uppercase tracking-widest text-neutral-400">
                DESCRIPTION
              </label>
              <input
                type="text"
                placeholder="Brief case description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Dispute Description */}
          <div className="space-y-1.5">
            <label className="text-[8px] font-mono uppercase tracking-widest text-neutral-400">
              DISPUTE DETAILS (OPTIONAL)
            </label>
            <textarea
              placeholder="Describe what happened in detail. This helps organize your evidence..."
              value={disputeDescription}
              onChange={(e) => setDisputeDescription(e.target.value)}
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-4 border border-emerald-900/50 bg-emerald-950/10 font-mono uppercase tracking-widest text-[9px] text-emerald-400 hover:text-emerald-300 hover:border-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                CREATING...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4" />
                CREATE EVIDENCE CASE
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
