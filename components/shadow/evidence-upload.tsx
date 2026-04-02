"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Mail,
  Camera,
  Mic,
  PenTool,
  Home,
  Briefcase,
  MessageCircle,
  FileText,
  Upload,
  X,
  Loader2,
  Info,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import type { EvidenceType, EvidenceFormat, ShadowAnalysisRequest } from "@/types";
import { WhatsAppGuideModal } from "./whatsapp-guide-modal";

interface EvidenceItem {
  id: string;
  type: EvidenceType;
  format: EvidenceFormat;
  file?: File;
  text?: string;
  filename: string;
  preview?: string;
  messageCount?: number;
  participants?: string[];
  wordCount?: number;
}

interface EvidenceUploadProps {
  documentId: string;
  onAnalyze: (request: ShadowAnalysisRequest) => void;
  isAnalyzing: boolean;
}

const EVIDENCE_TYPES = [
  { type: "whatsapp_chat" as EvidenceType, icon: MessageSquare, label: "WhatsApp Chat", desc: ".txt export", accept: ".txt,.zip", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  { type: "email" as EvidenceType, icon: Mail, label: "Email Thread", desc: "Paste or .eml", accept: ".eml,.txt", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  { type: "sms_screenshot" as EvidenceType, icon: Camera, label: "SMS Screenshots", desc: "Image files", accept: "image/*", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
  { type: "audio_recording" as EvidenceType, icon: Mic, label: "Audio Recording", desc: ".mp3, .m4a, .wav", accept: "audio/*", color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200" },
  { type: "handwritten_note" as EvidenceType, icon: PenTool, label: "Handwritten Notes", desc: "Photo of notes", accept: "image/*", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  { type: "property_listing" as EvidenceType, icon: Home, label: "Property Listing", desc: "Paste listing text", accept: "", color: "text-cyan-700", bg: "bg-cyan-50", border: "border-cyan-200" },
  { type: "job_posting" as EvidenceType, icon: Briefcase, label: "Job Posting", desc: "Paste job post", accept: "", color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200" },
  { type: "broker_message" as EvidenceType, icon: MessageCircle, label: "Broker Messages", desc: "Paste messages", accept: "", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
  { type: "other_text" as EvidenceType, icon: FileText, label: "Other Text", desc: "Any text evidence", accept: "", color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200" },
];

export function EvidenceUpload({ documentId, onAnalyze, isAnalyzing }: EvidenceUploadProps) {
  const [selectedType, setSelectedType] = useState<EvidenceType | null>(null);
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>([]);
  const [textInput, setTextInput] = useState("");
  const [showWhatsAppGuide, setShowWhatsAppGuide] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !selectedType) return;

    setUploading(true);

    for (const file of Array.from(files)) {
      const id = `ev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const isImage = file.type.startsWith("image/");
      const isAudio = file.type.startsWith("audio/");
      const isZip = file.type === "application/zip" || file.name.endsWith(".zip");
      const format: EvidenceFormat = isImage ? "image" : isAudio ? "audio" : isZip ? "zip" : "txt";

      // Try to get preview
      let preview = "";
      let messageCount: number | undefined;
      let participants: string[] | undefined;
      let wordCount: number | undefined;

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", selectedType);

        const res = await fetch("/api/shadow/parse-preview", { method: "POST", body: formData });
        if (res.ok) {
          const data = await res.json();
          preview = data.text_preview || "";
          messageCount = data.metadata?.message_count;
          participants = data.participants;
          wordCount = data.metadata?.word_count;
        }
      } catch {
        // Preview is non-critical
      }

      setEvidenceItems(prev => [...prev, {
        id,
        type: selectedType,
        format,
        file,
        filename: file.name,
        preview,
        messageCount,
        participants,
        wordCount,
      }]);
    }

    setUploading(false);
    setSelectedType(null);
    e.target.value = "";
  };

  const handleTextSubmit = () => {
    if (!textInput.trim() || !selectedType) return;

    const id = `ev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setEvidenceItems(prev => [...prev, {
      id,
      type: selectedType,
      format: "text" as EvidenceFormat,
      text: textInput,
      filename: `${selectedType}_text`,
      preview: textInput.substring(0, 200),
      wordCount: textInput.split(/\s+/).length,
    }]);

    setTextInput("");
    setSelectedType(null);
  };

  const removeEvidence = (id: string) => {
    setEvidenceItems(prev => prev.filter(e => e.id !== id));
  };

  const handleAnalyze = async () => {
    if (evidenceItems.length === 0) return;

    const evidence: ShadowAnalysisRequest["evidence"] = [];

    for (const item of evidenceItems) {
      if (item.file) {
        const content = ["image", "audio", "zip"].includes(item.format)
          ? await item.file.arrayBuffer()
          : await item.file.text();
        evidence.push({
          type: item.type,
          format: item.format,
          content,
          filename: item.filename,
        });
      } else if (item.text) {
        evidence.push({
          type: item.type,
          format: "text",
          content: item.text,
        });
      }
    }

    onAnalyze({ document_id: documentId, evidence });
  };

  const typeConfig = EVIDENCE_TYPES.find(t => t.type === selectedType);
  const needsTextInput = !typeConfig?.accept;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20 p-6 rounded-2xl mb-6">
        <h2 className="text-lg md:text-xl lg:text-2xl font-black text-slate-900 dark:text-slate-100 mb-2 tracking-tight">Upload Evidence of Promises</h2>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
          Upload WhatsApp chats, emails, recordings, or screenshots of promises made before/during signing. We&apos;ll check if they match the contract.
        </p>
      </div>

      {/* Evidence Type Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {EVIDENCE_TYPES.map(({ type, icon: Icon, label, desc, color, bg, border }) => (
          <button
            key={type}
            onClick={() => setSelectedType(selectedType === type ? null : type)}
            className={`group relative p-4 rounded-xl transition-all text-left shadow-sm ${
              selectedType === type
                ? `${border} ${bg} ring-2 ring-indigo-500 ring-offset-2 border-transparent scale-[1.02] shadow-md`
                : "border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300"
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 shadow-inner ${ selectedType === type ? "bg-white dark:bg-card border text-current border-current/20" : "bg-slate-50 border border-slate-100" }`}>
              <Icon className={`w-5 h-5 ${selectedType === type ? "text-current" : color}`} />
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">{label}</p>
            <p className={`text-xs font-semibold mt-1 ${selectedType === type ? "text-slate-600 dark:text-slate-400" : "text-slate-500"}`}>{desc}</p>
          </button>
        ))}
      </div>

      {/* Upload/Input Area */}
      <AnimatePresence>
        {selectedType && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-card shadow-md">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    {typeConfig && <typeConfig.icon className={`w-4 h-4 ${typeConfig.color}`} />}
                    Add {typeConfig?.label}
                  </p>
                  {selectedType === "whatsapp_chat" && (
                    <button
                      onClick={() => setShowWhatsAppGuide(true)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded-md"
                    >
                      <Info className="w-3.5 h-3.5" /> How to export
                    </button>
                  )}
                </div>

                {needsTextInput ? (
                  <div className="space-y-3">
                    <textarea
                      value={textInput}
                      onChange={e => setTextInput(e.target.value)}
                      placeholder={`Paste ${typeConfig?.label?.toLowerCase() || "text"} here...`}
                      className="w-full h-32 px-4 py-3 text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-inner placeholder:text-slate-400"
                    />
                    <Button size="sm" onClick={handleTextSubmit} disabled={!textInput.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm dark:shadow-slate-900/20">
                      Add Evidence
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 bg-slate-50 dark:bg-slate-800 transition-colors shadow-inner">
                    {uploading ? (
                      <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-slate-400 mb-2 drop-shadow-sm dark:shadow-slate-900/20" />
                        <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                          Click to upload or drag files here
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      accept={typeConfig?.accept}
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Added Evidence List */}
      <AnimatePresence>
        {evidenceItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3 mt-4"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span className="w-full h-px bg-slate-200"></span>
              <span className="shrink-0 whitespace-nowrap">Evidence added ({evidenceItems.length})</span>
              <span className="w-full h-px bg-slate-200"></span>
            </p>
            {evidenceItems.map(item => {
              const config = EVIDENCE_TYPES.find(t => t.type === item.type);
              const Icon = config?.icon || FileText;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-4 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20"
                >
                  <div className={`p-2 rounded-lg ${config?.bg || "bg-slate-50 dark:bg-slate-800"} border shadow-inner ${config?.border || "border-slate-100"}`}>
                    <Icon className={`w-5 h-5 flex-shrink-0 ${config?.color || "text-slate-500 dark:text-slate-400"}`} />
                  </div>
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{item.filename}</p>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                      {item.messageCount && `${item.messageCount} messages`}
                      {item.participants && item.participants.length > 0 && ` • ${item.participants.length} participants`}
                      {item.wordCount && !item.messageCount && `${item.wordCount} words`}
                      {item.preview && !item.messageCount && !item.wordCount && item.preview.substring(0, 60) + "..."}
                    </p>
                  </div>
                  <button
                    onClick={() => removeEvidence(item.id)}
                    className="p-2 rounded-lg bg-white dark:bg-card border border-slate-100 shadow-sm dark:shadow-slate-900/20 hover:shadow hover:bg-red-50 text-slate-400 hover:text-red-600 transition-all border-solid"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analyze Button */}
      {evidenceItems.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-4">
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-6 gap-2 text-base rounded-xl shadow-lg border-none"
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing Mismatches...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Check {evidenceItems.length} Evidence Source{evidenceItems.length > 1 ? "s" : ""} Against Contract
              </>
            )}
          </Button>
        </motion.div>
      )}

      <WhatsAppGuideModal open={showWhatsAppGuide} onClose={() => setShowWhatsAppGuide(false)} />
    </div>
  );
}
