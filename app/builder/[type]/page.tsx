"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Scale,
  AlertCircle,
  Sparkles,
  Info,
  CheckCircle2,
} from "lucide-react";
import {
  getTemplateConfig,
  getGroupedFields,
  INDIAN_STATES,
} from "@/lib/builder/template-fields";
import { ContractTemplateType, TemplateField } from "@/types";

export default function BuilderFormPage() {
  const params = useParams();
  const router = useRouter();
  const type = params.type as ContractTemplateType;

  const config = getTemplateConfig(type);

  const [jurisdiction, setJurisdiction] = useState("");
  const [values, setValues] = useState<
    Record<string, string | number | boolean>
  >({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [currentGroup, setCurrentGroup] = useState(0);

  // Redirect if invalid type
  useEffect(() => {
    if (!config || config.fields.length === 0) {
      router.push("/builder");
    }
  }, [config, router]);

  if (!config || config.fields.length === 0) {
    return null;
  }

  const groupedFields = getGroupedFields(config.fields);
  const groupNames = Object.keys(groupedFields);

  // Initialize defaults
  useEffect(() => {
    const defaults: Record<string, string | number | boolean> = {};
    for (const field of config.fields) {
      if (field.default !== undefined) {
        defaults[field.name] = field.default;
      }
    }
    setValues((prev) => ({ ...defaults, ...prev }));
  }, [config.fields]);

  const updateValue = (name: string, value: string | number | boolean) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const validateCurrentGroup = (): boolean => {
    const fields = groupedFields[groupNames[currentGroup]];
    const newErrors: Record<string, string> = {};

    for (const field of fields) {
      if (field.required) {
        const val = values[field.name];
        if (val === undefined || val === null || val === "") {
          newErrors[field.name] = `${field.label} is required`;
        }
      }
      if (field.validation) {
        const val = Number(values[field.name]);
        if (values[field.name] !== undefined && values[field.name] !== "") {
          if (
            field.validation.min !== undefined &&
            val < field.validation.min
          ) {
            newErrors[field.name] = `Minimum value is ${field.validation.min}`;
          }
          if (
            field.validation.max !== undefined &&
            val > field.validation.max
          ) {
            newErrors[field.name] = `Maximum value is ${field.validation.max}`;
          }
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateAll = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!jurisdiction) {
      newErrors["_jurisdiction"] = "Please select a state";
    }

    for (const field of config.fields) {
      if (field.required) {
        const val = values[field.name];
        if (val === undefined || val === null || val === "") {
          newErrors[field.name] = `${field.label} is required`;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentGroup()) {
      setCurrentGroup((prev) => Math.min(prev + 1, groupNames.length - 1));
    }
  };

  const handlePrev = () => {
    setCurrentGroup((prev) => Math.max(prev - 1, 0));
  };

  const handleGenerate = async () => {
    if (!validateAll()) {
      // Jump to first group with errors
      for (let i = 0; i < groupNames.length; i++) {
        const fields = groupedFields[groupNames[i]];
        if (fields.some((f) => errors[f.name])) {
          setCurrentGroup(i);
          break;
        }
      }
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const response = await fetch("/api/builder/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_type: type,
          jurisdiction,
          values,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setGenerationError(
          data.error || "Generation failed. Please try again.",
        );
        return;
      }

      // Store result in sessionStorage for preview page
      sessionStorage.setItem(
        "clausewall_generated_contract",
        JSON.stringify({
          contract_id: data.contract_id,
          title: data.title,
          generated_text: data.generated_text,
          generated_clauses: data.generated_clauses,
          stamp_paper_note: data.stamp_paper_note,
          template_type: type,
          jurisdiction,
          values,
        }),
      );

      // Navigate to preview
      if (data.contract_id) {
        router.push(`/builder/preview/${data.contract_id}`);
      } else {
        router.push(`/builder/preview/temp`);
      }
    } catch (error: any) {
      console.error("Generation error:", error);
      setGenerationError(
        "Network error. Please check your connection and try again.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const renderField = (field: TemplateField) => {
    const value = values[field.name] ?? "";
    const error = errors[field.name];

    const baseInputClass = `w-full border bg-[#050505] px-4 py-3 text-sm font-mono text-neutral-300 transition-colors focus:outline-none focus:border-neutral-600 placeholder:text-neutral-700 ${
      error ? "border-red-500" : "border-neutral-800"
    }`;

    return (
      <div key={field.name} className="space-y-1.5">
        <label className="block text-[8px] font-mono uppercase tracking-widest text-neutral-400">
          {field.label}
          {field.required && <span className="text-red-400 ml-1">*</span>}
        </label>

        {field.type === "select" ? (
          <select
            value={String(value)}
            onChange={(e) => updateValue(field.name, e.target.value)}
            className={baseInputClass}
          >
            <option value="">Select...</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : field.type === "textarea" ? (
          <textarea
            value={String(value)}
            onChange={(e) => updateValue(field.name, e.target.value)}
            placeholder={field.placeholder}
            rows={3}
            className={`${baseInputClass} resize-none`}
          />
        ) : field.type === "currency" ? (
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 text-sm font-mono">
              ₹
            </span>
            <input
              type="number"
              value={String(value)}
              onChange={(e) =>
                updateValue(
                  field.name,
                  e.target.value ? Number(e.target.value) : "",
                )
              }
              placeholder={field.placeholder}
              min={field.validation?.min}
              max={field.validation?.max}
              className={`${baseInputClass} pl-8`}
            />
          </div>
        ) : field.type === "number" ? (
          <input
            type="number"
            value={String(value)}
            onChange={(e) =>
              updateValue(
                field.name,
                e.target.value ? Number(e.target.value) : "",
              )
            }
            placeholder={field.placeholder}
            min={field.validation?.min}
            max={field.validation?.max}
            className={baseInputClass}
          />
        ) : field.type === "date" ? (
          <input
            type="date"
            value={String(value)}
            onChange={(e) => updateValue(field.name, e.target.value)}
            className={baseInputClass}
          />
        ) : (
          <input
            type="text"
            value={String(value)}
            onChange={(e) => updateValue(field.name, e.target.value)}
            placeholder={field.placeholder}
            className={baseInputClass}
          />
        )}

        {field.helpText && !error && (
          <p className="text-[7px] font-mono text-neutral-600 flex items-center gap-1">
            <Info className="w-2.5 h-2.5" />
            {field.helpText}
          </p>
        )}

        {error && (
          <p className="text-[7px] font-mono text-red-400 flex items-center gap-1">
            <AlertCircle className="w-2.5 h-2.5" />
            {error}
          </p>
        )}
      </div>
    );
  };

  const isLastGroup = currentGroup === groupNames.length - 1;
  const progress = ((currentGroup + 1) / groupNames.length) * 100;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-200">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {/* Back button */}
        <button
          onClick={() => router.push("/builder")}
          className="flex items-center gap-2 text-[8px] font-mono uppercase tracking-widest text-neutral-600 hover:text-neutral-300 mb-8 transition-colors"
        >
          <ArrowLeft className="w-3 w-3" />
          BACK TO TEMPLATES
        </button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-5 border border-neutral-900 bg-[#0a0a0a]"
        >
          <h1 className="text-xs font-mono uppercase tracking-widest mb-1.5 text-neutral-200">
            {config.name}
          </h1>
          <p className="text-[8px] font-mono text-neutral-600 leading-relaxed">
            Fill in the details below. Every clause will be fair and legally
            compliant.
          </p>
        </motion.div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-end text-[8px] font-mono uppercase tracking-widest text-neutral-500 mb-2">
            <span>
              STEP {currentGroup + 1} OF {groupNames.length}:{" "}
              <span className="text-emerald-400">
                {groupNames[currentGroup]}
              </span>
            </span>
            <span className="text-emerald-400 px-1.5 py-0.5 border border-emerald-900/50 bg-emerald-950/20">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full h-2 border border-neutral-800 bg-[#050505] overflow-hidden p-px">
            <motion.div
              className="h-full bg-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          {/* Step indicators */}
          <div className="flex mt-2 gap-1">
            {groupNames.map((name, i) => (
              <button
                key={name}
                onClick={() => setCurrentGroup(i)}
                className={`flex-1 h-1.5 border transition-colors ${i <= currentGroup ? "border-emerald-900/50 bg-emerald-500" : "border-neutral-800 bg-[#050505]"}`}
              />
            ))}
          </div>
        </div>

        {/* Jurisdiction selector (always visible before form) */}
        {currentGroup === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 border border-neutral-900 bg-[#0a0a0a]"
          >
            <label className="block text-[8px] font-mono uppercase tracking-widest text-neutral-400 mb-3">
              <Scale className="w-3 h-3 inline mr-1.5" />
              STATE / JURISDICTION <span className="text-red-400">*</span>
            </label>
            <select
              value={jurisdiction}
              onChange={(e) => {
                setJurisdiction(e.target.value);
                if (errors["_jurisdiction"]) {
                  setErrors((prev) => {
                    const copy = { ...prev };
                    delete copy["_jurisdiction"];
                    return copy;
                  });
                }
              }}
              className={`w-full border bg-[#050505] px-4 py-3 text-sm font-mono text-neutral-300 transition-colors focus:outline-none focus:border-neutral-600 ${errors["_jurisdiction"] ? "border-red-500" : "border-neutral-800"}`}
            >
              <option value="">Select your state...</option>
              {INDIAN_STATES.map((state) => (
                <option key={state.value} value={state.value}>
                  {state.label}
                </option>
              ))}
            </select>
            {errors["_jurisdiction"] && (
              <p className="text-[7px] font-mono text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-2.5 h-2.5" />
                {errors["_jurisdiction"]}
              </p>
            )}
            <p className="text-[7px] font-mono text-neutral-600 mt-2">
              Laws vary by state. This ensures your contract references the
              correct statutes.
            </p>
          </motion.div>
        )}

        {/* Form Fields - Current Group */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentGroup}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="border border-neutral-900 bg-[#0a0a0a] p-6 mb-10"
          >
            <h2 className="text-[9px] font-mono uppercase tracking-widest text-emerald-400 mb-6 border-b border-neutral-800 pb-3">
              {groupNames[currentGroup]}
            </h2>
            <div className="space-y-6">
              {groupedFields[groupNames[currentGroup]].map(renderField)}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Generation Error */}
        {generationError && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 border-l-2 border-red-500 bg-red-950/20 text-[9px] font-mono text-red-400 flex items-start gap-3"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="uppercase tracking-widest">Generation Failed</p>
              <p className="mt-1 text-red-400/70">{generationError}</p>
            </div>
          </motion.div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={handlePrev}
            disabled={currentGroup === 0}
            className={`flex items-center gap-2 px-4 py-2.5 border text-[8px] font-mono uppercase tracking-widest transition-colors ${currentGroup === 0 ? "border-neutral-900 text-neutral-700 cursor-not-allowed" : "border-neutral-800 bg-[#050505] text-neutral-400 hover:text-neutral-200 hover:border-neutral-600"}`}
          >
            <ArrowLeft className="w-3 h-3" />
            PREVIOUS
          </button>

          {isLastGroup ? (
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2 px-6 py-2.5 border border-emerald-900/50 bg-emerald-950/10 text-emerald-400 hover:text-emerald-300 hover:border-emerald-800 text-[8px] font-mono uppercase tracking-widest transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  GENERATING...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  GENERATE CONTRACT
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2.5 border border-neutral-800 bg-[#050505] text-neutral-300 hover:text-neutral-100 hover:border-neutral-600 text-[8px] font-mono uppercase tracking-widest transition-colors"
            >
              NEXT
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Applicable Laws */}
        {config.applicableLaws.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-10 p-5 border border-neutral-900 bg-[#0a0a0a]"
          >
            <h3 className="text-[8px] font-mono uppercase tracking-widest text-neutral-500 mb-3 flex items-center gap-2">
              <Scale className="w-3 h-3" />
              LAWS APPLIED IN THIS CONTRACT
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {config.applicableLaws.map((law, i) => (
                <div key={i} className="flex items-start gap-2 text-[8px] font-mono">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-neutral-500">{law.name}</span>
                    <span className="text-neutral-600">
                      {" "}
                      · {law.section}
                    </span>
                    <p className="text-neutral-600 text-[7px] mt-0.5">
                      {law.relevance}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
