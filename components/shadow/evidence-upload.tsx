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
import { toast } from "sonner";
import type {
  EvidenceType,
  EvidenceFormat,
  ShadowAnalysisRequest,
} from "@/types";
import WhatsAppGuideModal from "./whatsapp-guide-modal";

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
  {
    type: "whatsapp_chat" as EvidenceType,
    icon: MessageSquare,
    label: "WhatsApp Chat",
    desc: ".txt export",
    accept: ".txt,.zip",
    color: "text-emerald-400",
    bg: "bg-emerald-950/20",
    border: "border-emerald-900/50",
  },
  {
    type: "email" as EvidenceType,
    icon: Mail,
    label: "Email Thread",
    desc: "Paste or .eml",
    accept: ".eml,.txt",
    color: "text-cyan-400",
    bg: "bg-cyan-950/20",
    border: "border-cyan-900/50",
  },
  {
    type: "sms_screenshot" as EvidenceType,
    icon: Camera,
    label: "SMS Screenshots",
    desc: "Image files",
    accept: "image/*",
    color: "text-purple-400",
    bg: "bg-purple-950/20",
    border: "border-purple-900/50",
  },
  {
    type: "audio_recording" as EvidenceType,
    icon: Mic,
    label: "Audio Recording",
    desc: ".mp3, .m4a, .wav",
    accept: "audio/*",
    color: "text-red-400",
    bg: "bg-red-950/20",
    border: "border-red-900/50",
  },
  {
    type: "handwritten_note" as EvidenceType,
    icon: PenTool,
    label: "Handwritten Notes",
    desc: "Photo of notes",
    accept: "image/*",
    color: "text-amber-400",
    bg: "bg-amber-950/20",
    border: "border-amber-900/50",
  },
  {
    type: "property_listing" as EvidenceType,
    icon: Home,
    label: "Property Listing",
    desc: "Paste listing text",
    accept: "",
    color: "text-cyan-300",
    bg: "bg-cyan-950/10",
    border: "border-cyan-900/30",
  },
  {
    type: "job_posting" as EvidenceType,
    icon: Briefcase,
    label: "Job Posting",
    desc: "Paste job post",
    accept: "",
    color: "text-indigo-400",
    bg: "bg-indigo-950/20",
    border: "border-indigo-900/50",
  },
  {
    type: "broker_message" as EvidenceType,
    icon: MessageCircle,
    label: "Broker Messages",
    desc: "Paste messages",
    accept: "",
    color: "text-orange-400",
    bg: "bg-orange-950/20",
    border: "border-orange-900/50",
  },
  {
    type: "other_text" as EvidenceType,
    icon: FileText,
    label: "Other Text",
    desc: "Any text evidence",
    accept: "",
    color: "text-neutral-400",
    bg: "bg-neutral-950/20",
    border: "border-neutral-800",
  },
];

export default function EvidenceUpload({
  documentId,
  onAnalyze,
  isAnalyzing,
}: EvidenceUploadProps) {
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
      const isZip =
        file.type === "application/zip" || file.name.endsWith(".zip");
      const format: EvidenceFormat = isImage
        ? "image"
        : isAudio
          ? "audio"
          : isZip
            ? "zip"
            : "txt";

      // Try to get preview
      let preview = "";
      let messageCount: number | undefined;
      let participants: string[] | undefined;
      let wordCount: number | undefined;

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", selectedType);

        const res = await fetch("/api/shadow/parse-preview", {
          method: "POST",
          body: formData,
        });
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

      setEvidenceItems((prev) => [
        ...prev,
        {
          id,
          type: selectedType,
          format,
          file,
          filename: file.name,
          preview,
          messageCount,
          participants,
          wordCount,
        },
      ]);
    }

    setUploading(false);
    setSelectedType(null);
    e.target.value = "";
  };

  const handleTextSubmit = () => {
    if (!textInput.trim() || !selectedType) return;

    const id = `ev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setEvidenceItems((prev) => [
      ...prev,
      {
        id,
        type: selectedType,
        format: "text" as EvidenceFormat,
        text: textInput,
        filename: `${selectedType}_text`,
        preview: textInput.substring(0, 200),
        wordCount: textInput.split(/\s+/).length,
      },
    ]);

    setTextInput("");
    setSelectedType(null);
  };

  const removeEvidence = (id: string) => {
    setEvidenceItems((prev) => prev.filter((e) => e.id !== id));
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

  const typeConfig = EVIDENCE_TYPES.find((t) => t.type === selectedType);
  const needsTextInput = !typeConfig?.accept;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center p-5 border border-amber-900/50 bg-amber-950/10 max-w-2xl mx-auto">
        <h2 className="text-xs font-mono uppercase tracking-widest text-amber-400 mb-3">
          UPLOAD EVIDENCE OF PROMISES
        </h2>
        <p className="text-[8px] font-mono uppercase tracking-widest text-neutral-500 max-w-xl mx-auto border-t border-neutral-800 pt-3 leading-relaxed">
          UPLOAD WHATSAPP CHATS, EMAILS, RECORDINGS, OR SCREENSHOTS OF PROMISES
          MADE BEFORE/DURING SIGNING. WE&apos;LL CHECK IF THEY MATCH THE
          CONTRACT.
        </p>
      </div>

      {/* Evidence Type Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {EVIDENCE_TYPES.map(
          ({ type, icon: Icon, label, desc, color, bg, border }) => (
            <button
              key={type}
              onClick={() =>
                setSelectedType(selectedType === type ? null : type)
              }
              className={`group relative p-4 transition-all text-left flex flex-col border ${
                selectedType === type
                  ? `${bg} ${border}`
                  : "bg-[#050505] border-neutral-800 hover:border-neutral-600"
              }`}
            >
              <div
                className={`p-2 border ${border} ${bg} inline-block mb-3 ${color}`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-300">
                {label}
              </p>
              <p className="text-[7px] font-mono uppercase tracking-widest text-neutral-600 mt-1">
                {desc}
              </p>
            </button>
          ),
        )}
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
            <div className="border border-neutral-800 bg-[#050505]">
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                  <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-300 flex items-center gap-2">
                    {typeConfig && (
                      <span
                        className={`p-1 border ${typeConfig.border} ${typeConfig.bg}`}
                      >
                        <typeConfig.icon className="w-3.5 h-3.5" />
                      </span>
                    )}
                    ADD {typeConfig?.label?.toUpperCase()}
                  </p>
                  {selectedType === "whatsapp_chat" && (
                    <button
                      onClick={() => setShowWhatsAppGuide(true)}
                      className="text-[8px] font-mono uppercase tracking-widest text-cyan-400 border border-cyan-900/50 bg-cyan-950/10 px-2 py-1 hover:text-cyan-300 hover:border-cyan-800 transition-colors flex items-center gap-1"
                    >
                      <Info className="w-3 h-3" />
                      HOW TO EXPORT
                    </button>
                  )}
                </div>

                {needsTextInput ? (
                  <div className="space-y-4">
                    <textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder={`Paste ${typeConfig?.label?.toLowerCase() || "text"} here...`}
                      className="w-full h-40 p-4 text-sm font-mono text-neutral-300 bg-[#0a0a0a] border border-dashed border-neutral-700 resize-none focus:outline-none focus:border-neutral-500 placeholder:text-neutral-700 placeholder:uppercase"
                    />
                    <button
                      onClick={handleTextSubmit}
                      disabled={!textInput.trim()}
                      className="w-full py-3 border border-amber-900/50 bg-amber-950/10 font-mono uppercase tracking-widest text-[8px] text-amber-400 hover:text-amber-300 hover:border-amber-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      ADD EVIDENCE
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-8 border border-dashed border-neutral-700 bg-[#0a0a0a] cursor-pointer hover:border-neutral-500 transition-colors">
                    {uploading ? (
                      <div className="flex flex-col items-center">
                        <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-4" />
                        <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-400">
                          UPLOADING...
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="p-3 border border-neutral-800 bg-[#050505] mb-4">
                          <Upload className="w-5 h-5 text-neutral-500" />
                        </div>
                        <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-400">
                          CLICK TO UPLOAD OR DRAG FILES HERE
                        </span>
                        <span className="text-[7px] font-mono uppercase tracking-widest text-neutral-700 mt-2">
                          ACCEPTS {typeConfig?.accept}
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
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Added Evidence List */}
      <AnimatePresence>
        {evidenceItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 border-b border-neutral-800 pb-2">
              EVIDENCE ADDED ({evidenceItems.length})
            </p>
            <div className="space-y-2">
              {evidenceItems.map((item) => {
                const config = EVIDENCE_TYPES.find((t) => t.type === item.type);
                const Icon = config?.icon || FileText;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center gap-4 p-3 border border-neutral-800 bg-[#050505]"
                  >
                    <div
                      className={`p-1.5 border ${config?.border || "border-neutral-800"} ${config?.bg || ""} flex-shrink-0`}
                    >
                      <Icon
                        className={`w-4 h-4 ${config?.color || "text-neutral-500"}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-300 truncate">
                        {item.filename}
                      </p>
                      <p className="text-[7px] font-mono uppercase tracking-widest text-neutral-600 mt-1 flex flex-wrap gap-2">
                        {item.messageCount && (
                          <span className="px-1 py-0.5 border border-neutral-800 bg-[#0a0a0a]">
                            {item.messageCount} MESSAGES
                          </span>
                        )}
                        {item.participants && item.participants.length > 0 && (
                          <span className="px-1 py-0.5 border border-neutral-800 bg-[#0a0a0a]">
                            {item.participants.length} PARTICIPANTS
                          </span>
                        )}
                        {item.wordCount && !item.messageCount && (
                          <span className="px-1 py-0.5 border border-neutral-800 bg-[#0a0a0a]">
                            {item.wordCount} WORDS
                          </span>
                        )}
                        {item.preview &&
                          !item.messageCount &&
                          !item.wordCount && (
                            <span className="text-neutral-600">
                              {item.preview.substring(0, 60)}...
                            </span>
                          )}
                      </p>
                    </div>
                    <button
                      onClick={() => removeEvidence(item.id)}
                      className="p-1.5 border border-red-900/50 bg-red-950/20 text-red-400 hover:text-red-300 hover:border-red-800 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analyze Button */}
      {evidenceItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full py-4 border border-emerald-900/50 bg-emerald-950/10 font-mono uppercase tracking-widest text-[9px] text-emerald-400 hover:text-emerald-300 hover:border-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                ANALYZING MISMATCHES...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                CHECK {evidenceItems.length} EVIDENCE SOURCE
                {evidenceItems.length > 1 ? "S" : ""} AGAINST CONTRACT
              </>
            )}
          </button>
        </motion.div>
      )}

      <WhatsAppGuideModal
        open={showWhatsAppGuide}
        onClose={() => setShowWhatsAppGuide(false)}
      />
    </div>
  );
}
