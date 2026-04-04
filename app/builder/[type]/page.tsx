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
  const [values, setValues] = useState<Record<string, string | number | boolean>>({});
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
          if (field.validation.min !== undefined && val < field.validation.min) {
            newErrors[field.name] = `Minimum value is ${field.validation.min}`;
          }
          if (field.validation.max !== undefined && val > field.validation.max) {
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
        setGenerationError(data.error || "Generation failed. Please try again.");
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
        })
      );

      // Navigate to preview
      if (data.contract_id) {
        router.push(`/builder/preview/${data.contract_id}`);
      } else {
        router.push(`/builder/preview/temp`);
      }
    } catch (error: any) {
      console.error("Generation error:", error);
      setGenerationError("Network error. Please check your connection and try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const renderField = (field: TemplateField) => {
    const value = values[field.name] ?? "";
    const error = errors[field.name];

    const baseInputClass = `w-full border-4 bg-white dark:bg-zinc-950 px-4 py-3 font-bold placeholder:font-medium transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-foreground placeholder-muted-foreground focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none ${
      error
        ? "border-red-500"
        : "border-black"
    }`;

    return (
      <div key={field.name} className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-300">
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
            className={baseInputClass}
          />
        ) : field.type === "currency" ? (
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              ₹
            </span>
            <input
              type="number"
              value={String(value)}
              onChange={(e) =>
                updateValue(field.name, e.target.value ? Number(e.target.value) : "")
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
              updateValue(field.name, e.target.value ? Number(e.target.value) : "")
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
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <Info className="w-3 h-3" />
            {field.helpText}
          </p>
        )}

        {error && (
          <p className="text-xs text-red-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {error}
          </p>
        )}
      </div>
    );
  };

  const isLastGroup = currentGroup === groupNames.length - 1;
  const progress = ((currentGroup + 1) / groupNames.length) * 100;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Back button */}
        <button
          onClick={() => router.push("/builder")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-black uppercase tracking-widest mb-8 transition-colors border-b-4 border-transparent hover:border-black"
        >
          <ArrowLeft className="w-5 h-5 stroke-[3px]" />
          BACK TO TEMPLATES
        </button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 border-4 border-black bg-blue-100 dark:bg-blue-900/30 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
        >
          <h1 className="text-3xl font-black uppercase tracking-widest mb-2 text-foreground">{config.name}</h1>
          <p className="text-muted-foreground font-bold">
            Fill in the details below. Every clause will be fair and legally compliant.
          </p>
        </motion.div>

        {/* Progress Bar */}
        <div className="mb-10">
          <div className="flex justify-between items-end text-sm font-black uppercase tracking-widest text-muted-foreground mb-3">
            <span>
              STEP {currentGroup + 1} OF {groupNames.length}:{" "}
              <span className="text-foreground border-b-4 border-emerald-500">{groupNames[currentGroup]}</span>
            </span>
            <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-100 px-2 border-2 border-black">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-8 border-4 border-black bg-white dark:bg-zinc-900 overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <motion.div
              className="h-full bg-emerald-400 border-r-4 border-black"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          {/* Step indicators */}
          <div className="flex mt-4 gap-2">
            {groupNames.map((name, i) => (
              <button
                key={name}
                onClick={() => setCurrentGroup(i)}
                className={`flex-1 h-3 border-2 border-black transition-colors ${
                  i <= currentGroup ? "bg-emerald-400" : "bg-white dark:bg-zinc-800"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Jurisdiction selector (always visible before form) */}
        {currentGroup === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-8 border-4 border-black bg-white dark:bg-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
          >
            <label className="block text-sm font-black uppercase tracking-widest text-foreground mb-4">
              <Scale className="w-5 h-5 inline mr-2 stroke-[3px]" />
              STATE / JURISDICTION <span className="text-red-500">*</span>
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
              className={`w-full border-4 bg-white dark:bg-zinc-950 px-4 py-3 font-bold transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none ${
                errors["_jurisdiction"]
                  ? "border-red-500"
                  : "border-black"
              }`}
            >
              <option value="">Select your state...</option>
              {INDIAN_STATES.map((state) => (
                <option key={state.value} value={state.value}>
                  {state.label}
                </option>
              ))}
            </select>
            {errors["_jurisdiction"] && (
              <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors["_jurisdiction"]}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Laws vary by state. This ensures your contract references the correct statutes.
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
            className="border-4 border-black bg-white dark:bg-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 mb-12"
          >
            <h2 className="text-2xl font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-8 border-b-4 border-black pb-4">
              {groupNames[currentGroup]}
            </h2>
            <div className="space-y-8">
              {groupedFields[groupNames[currentGroup]].map(renderField)}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Generation Error */}
        {generationError && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Generation Failed</p>
              <p className="mt-1">{generationError}</p>
            </div>
          </motion.div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-8">
          <button
            onClick={handlePrev}
            disabled={currentGroup === 0}
            className={`flex items-center gap-2 px-6 py-3 border-4 font-black uppercase tracking-widest transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
              currentGroup === 0
                ? "border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed shadow-none"
                : "border-black bg-white hover:-translate-y-1 hover:shadow-none hover:bg-gray-100 text-foreground"
            }`}
          >
            <ArrowLeft className="w-5 h-5 stroke-[3px]" />
            PREVIOUS
          </button>

          {isLastGroup ? (
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2 px-8 py-3 border-4 border-black bg-emerald-400 hover:bg-emerald-500 text-black font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-none"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin stroke-[3px]" />
                  GENERATING...
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6 stroke-[3px]" />
                  GENERATE CONTRACT
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-8 py-3 border-4 border-black bg-black text-white hover:bg-gray-800 font-black uppercase tracking-widest transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-none"
            >
              NEXT
              <ArrowRight className="w-5 h-5 stroke-[3px]" />
            </button>
          )}
        </div>

        {/* Applicable Laws */}
        {config.applicableLaws.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-12 p-6 bg-gray-900/30 border border-gray-800/50 rounded-xl"
          >
            <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
              <Scale className="w-4 h-4" />
              Laws Applied in This Contract
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {config.applicableLaws.map((law, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-gray-300">{law.name}</span>
                    <span className="text-gray-600"> · {law.section}</span>
                    <p className="text-gray-500 text-xs">{law.relevance}</p>
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