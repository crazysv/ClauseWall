"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  AlertTriangle,
  Loader2,
  Zap,
  Quote,
  ShieldAlert,
  Crosshair,
  Link2,
  HelpCircle,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AdversarialResult } from "@/types";

interface DeceptionTabProps {
  clauseId: string;
  clauseText: string;
  clauseType: string;
  jurisdiction: string;
  documentType: string;
}

export function DeceptionTab({
  clauseId,
  clauseText,
  clauseType,
  jurisdiction,
  documentType,
}: DeceptionTabProps) {
  const [result, setResult] = useState<AdversarialResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  const fetchDeception = useCallback(async () => {
    if (fetched && result) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/adversarial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clauseText,
          clauseType,
          jurisdiction,
          documentType,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Analysis failed");
      }

      setResult(data.result);
      setFetched(true);
    } catch (err) {
      setError((err as Error).message || "Failed to detect deception");
    } finally {
      setLoading(false);
    }
  }, [clauseText, clauseType, jurisdiction, documentType, fetched, result]);

  // Auto-fetch on mount
  if (!fetched && !loading && !error) {
    fetchDeception();
  }

  if (loading) {
    return (
      <div className="p-6 rounded-xl bg-red-500/5 border border-red-500/20 flex items-center justify-center gap-3 py-8">
        <Loader2 className="h-5 w-5 text-red-400 animate-spin" />
        <span className="text-sm text-red-300">Scanning for hidden deception...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-xl bg-red-500/5 border border-red-500/20">
        <p className="text-sm text-red-300">{error}</p>
        <button
          onClick={() => { setError(null); setFetched(false); }}
          className="text-xs text-red-400 underline mt-2"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!result) return null;

  // Deception level config
  const levelConfig = {
    none: { color: "green", label: "Transparent", emoji: "✅", bg: "from-green-500/10 to-emerald-500/10", border: "border-green-500/20" },
    low: { color: "yellow", label: "Slightly Obscured", emoji: "🔍", bg: "from-yellow-500/10 to-amber-500/10", border: "border-yellow-500/20" },
    medium: { color: "orange", label: "Deliberately Vague", emoji: "⚠️", bg: "from-orange-500/10 to-amber-500/10", border: "border-orange-500/20" },
    high: { color: "red", label: "Deceptive", emoji: "🎭", bg: "from-red-500/10 to-orange-500/10", border: "border-red-500/20" },
    extreme: { color: "purple", label: "Predatory Disguise", emoji: "☠️", bg: "from-purple-500/10 to-red-500/10", border: "border-indigo-500/20" },
  };

  const level = levelConfig[result.deception_level] || levelConfig.medium;

  const techniqueIcons: Record<string, React.ReactNode> = {
    vague_quantifier: <HelpCircle className="h-3.5 w-3.5" />,
    unilateral_reference: <Crosshair className="h-3.5 w-3.5" />,
    external_schedule: <Link2 className="h-3.5 w-3.5" />,
    passive_voice_shift: <EyeOff className="h-3.5 w-3.5" />,
    false_mutual: <ShieldAlert className="h-3.5 w-3.5" />,
    scope_creep: <Zap className="h-3.5 w-3.5" />,
    consent_assumed: <AlertTriangle className="h-3.5 w-3.5" />,
    liability_shift: <ShieldAlert className="h-3.5 w-3.5" />,
    time_bomb: <AlertTriangle className="h-3.5 w-3.5" />,
    buried_exception: <EyeOff className="h-3.5 w-3.5" />,
    double_negative: <HelpCircle className="h-3.5 w-3.5" />,
    definition_manipulation: <Quote className="h-3.5 w-3.5" />,
    false_standard: <HelpCircle className="h-3.5 w-3.5" />,
  };

  const severityColor = {
    low: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    medium: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    high: "text-red-400 bg-red-500/10 border-red-500/20",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-3"
    >
      {/* Deception Score Header */}
      <div className={`p-6 rounded-xl bg-gradient-to-r ${level.bg} border ${level.border}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{level.emoji}</span>
            <span className={`text-sm font-bold text-${level.color}-400`}>
              Deception Level: {level.label}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`text-lg md:text-xl lg:text-2xl font-black tracking-tight text-${level.color}-400`}>
              {result.deception_score}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">/10</span>
          </div>
        </div>

        {/* Deception bar */}
        <div className="w-full h-2 rounded-full bg-indigo-50/50 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${result.deception_score * 10}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`h-full rounded-full ${
              result.deception_score <= 2 ? "bg-green-500" :
              result.deception_score <= 4 ? "bg-yellow-500" :
              result.deception_score <= 6 ? "bg-orange-500" :
              result.deception_score <= 8 ? "bg-red-500" :
              "bg-indigo-500"
            }`}
          />
        </div>

        {result.risk_amplification > 1 && (
          <p className="text-xs text-slate-400 mt-2">
            ⚡ This clause is <span className={`font-bold text-${level.color}-400`}>
              {result.risk_amplification}x riskier
            </span> than it appears on surface reading
          </p>
        )}
      </div>

      {/* Surface vs True Reading */}
      {result.surface_reading && result.true_reading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/15">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Eye className="h-3.5 w-3.5 text-green-400" />
              <span className="text-xs font-medium text-green-400">What It SEEMS to Say</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{result.surface_reading}</p>
          </div>
          <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/15">
            <div className="flex items-center gap-1.5 mb-1.5">
              <EyeOff className="h-3.5 w-3.5 text-red-400" />
              <span className="text-xs font-medium text-red-400">What It ACTUALLY Means</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{result.true_reading}</p>
          </div>
        </div>
      )}

      {/* Decoded Meaning */}
      {result.decoded_meaning && (
        <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Quote className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-xs font-medium text-amber-400">Decoded in Plain Language</span>
          </div>
          <p className="text-sm text-amber-200 leading-relaxed italic">
            &quot;{result.decoded_meaning}&quot;
          </p>
        </div>
      )}

      {/* Disguise Techniques */}
      {result.disguise_techniques.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
            🎭 Disguise Techniques Detected ({result.disguise_techniques.length})
          </p>
          <div className="space-y-2">
            {result.disguise_techniques.map((tech, i) => (
              <div
                key={i}
                className={`p-3 rounded-xl border ${severityColor[tech.severity]} bg-opacity-50`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  {techniqueIcons[tech.technique] || <AlertTriangle className="h-3.5 w-3.5" />}
                  <span className="text-xs font-semibold">{tech.label}</span>
                  <Badge
                    variant="outline"
                    className={`text-[9px] ${severityColor[tech.severity]}`}
                  >
                    {tech.severity}
                  </Badge>
                </div>
                {tech.phrase && (
                  <p className="text-xs text-slate-300 mb-1 font-mono bg-indigo-50/50 px-2 py-1 rounded">
                    &quot;{tech.phrase}&quot;
                  </p>
                )}
                <p className="text-xs text-slate-400 leading-relaxed">{tech.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hidden Powers */}
      {result.hidden_powers.length > 0 && (
        <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/15">
          <p className="text-xs font-medium text-red-400 mb-1.5 flex items-center gap-1.5">
            <Crosshair className="h-3.5 w-3.5" />
            Hidden Powers This Clause Gives
          </p>
          <ul className="space-y-1">
            {result.hidden_powers.map((power, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-red-300">
                <ArrowRight className="h-3 w-3 mt-0.5 flex-shrink-0 text-red-500" />
                {power}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Vague Terms */}
      {result.vague_terms.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mr-1">Exploitable vague terms:</span>
          {result.vague_terms.map((term, i) => (
            <Badge
              key={i}
              variant="outline"
              className="text-[10px] text-orange-400 border-orange-500/30 bg-orange-500/5"
            >
              &quot;{term}&quot;
            </Badge>
          ))}
        </div>
      )}

      {/* One-Sided Triggers */}
      {result.one_sided_triggers.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mr-1">One-sided power phrases:</span>
          {result.one_sided_triggers.map((trigger, i) => (
            <Badge
              key={i}
              variant="outline"
              className="text-[10px] text-red-400 border-red-500/30 bg-red-500/5"
            >
              &quot;{trigger}&quot;
            </Badge>
          ))}
        </div>
      )}

      {/* Cross References */}
      {result.cross_references.length > 0 && (
        <div className="p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/15">
          <p className="text-xs font-medium text-yellow-400 mb-1 flex items-center gap-1.5">
            <Link2 className="h-3.5 w-3.5" />
            External References (may hide terms)
          </p>
          <ul className="space-y-0.5">
            {result.cross_references.map((ref, i) => (
              <li key={i} className="text-xs text-yellow-300">• {ref}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer */}
      <div className="pt-1">
        <p className="text-[10px] text-slate-600 dark:text-slate-400 italic">
          🎭 Adversarial analysis — thinks like a predatory drafter to expose hidden tricks.
        </p>
      </div>
    </motion.div>
  );
}