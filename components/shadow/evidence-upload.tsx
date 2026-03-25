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
  { type: "whatsapp_chat" as EvidenceType, icon: MessageSquare, label: "WhatsApp Chat", desc: ".txt export", accept: ".txt,.zip", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" },
  { type: "email" as EvidenceType, icon: Mail, label: "Email Thread", desc: "Paste or .eml", accept: ".eml,.txt", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  { type: "sms_screenshot" as EvidenceType, icon: Camera, label: "SMS Screenshots", desc: "Image files", accept: "image/*", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  { type: "audio_recording" as EvidenceType, icon: Mic, label: "Audio Recording", desc: ".mp3, .m4a, .wav", accept: "audio/*", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
  { type: "handwritten_note" as EvidenceType, icon: PenTool, label: "Handwritten Notes", desc: "Photo of notes", accept: "image/*", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  { type: "property_listing" as EvidenceType, icon: Home, label: "Property Listing", desc: "Paste listing text", accept: "", color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
  { type: "job_posting" as EvidenceType, icon: Briefcase, label: "Job Posting", desc: "Paste job post", accept: "", color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
  { type: "broker_message" as EvidenceType, icon: MessageCircle, label: "Broker Messages", desc: "Paste messages", accept: "", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  { type: "other_text" as EvidenceType, icon: FileText, label: "Other Text", desc: "Any text evidence", accept: "", color: "text-gray-400", bg: "bg-gray-500/10", border: "border-gray-500/20" },
];

export default function EvidenceUpload({ documentId, onAnalyze, isAnalyzing }: EvidenceUploadProps) {
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
      <div className="text-center">
        <h2 className="text-xl font-bold mb-2">Upload Evidence of Promises</h2>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          Upload WhatsApp chats, emails, recordings, or screenshots of promises made before/during signing. We&apos;ll check if they match the contract.
        </p>
      </div>

      {/* Evidence Type Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {EVIDENCE_TYPES.map(({ type, icon: Icon, label, desc, color, bg, border }) => (
          <button
            key={type}
            onClick={() => setSelectedType(selectedType === type ? null : type)}
            className={`group relative p-4 rounded-xl border transition-all text-left ${
              selectedType === type
                ? `${border} ${bg} ring-1 ring-white/20`
                : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10"
            }`}
          >
            <Icon className={`w-5 h-5 mb-2 ${color}`} />
            <p className="text-sm font-medium">{label}</p>
            <p className="text-xs text-white/40 mt-0.5">{desc}</p>
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
            <Card className="border-white/10 bg-white/[0.02]">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium flex items-center gap-2">
                    {typeConfig && <typeConfig.icon className={`w-4 h-4 ${typeConfig.color}`} />}
                    Add {typeConfig?.label}
                  </p>
                  {selectedType === "whatsapp_chat" && (
                    <button
                      onClick={() => setShowWhatsAppGuide(true)}
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      <Info className="w-3 h-3" /> How to export
                    </button>
                  )}
                </div>

                {needsTextInput ? (
                  <div className="space-y-2">
                    <textarea
                      value={textInput}
                      onChange={e => setTextInput(e.target.value)}
                      placeholder={`Paste ${typeConfig?.label?.toLowerCase() || "text"} here...`}
                      className="w-full h-32 px-3 py-2 text-sm bg-black/30 border border-white/10 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-white/20"
                    />
                    <Button size="sm" onClick={handleTextSubmit} disabled={!textInput.trim()}>
                      Add Evidence
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-white/10 rounded-lg cursor-pointer hover:border-white/20 hover:bg-white/[0.02] transition-colors">
                    {uploading ? (
                      <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-white/40 mb-1" />
                        <span className="text-xs text-white/40">
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
            className="space-y-2"
          >
            <p className="text-sm font-medium text-white/60">
              Evidence added ({evidenceItems.length})
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
                  className={`flex items-center gap-3 p-3 rounded-lg border ${config?.border || "border-white/5"} ${config?.bg || "bg-white/[0.02]"}`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${config?.color || "text-white/40"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.filename}</p>
                    <p className="text-xs text-white/40">
                      {item.messageCount && `${item.messageCount} messages`}
                      {item.participants && item.participants.length > 0 && ` • ${item.participants.length} participants`}
                      {item.wordCount && !item.messageCount && `${item.wordCount} words`}
                      {item.preview && !item.messageCount && !item.wordCount && item.preview.substring(0, 60) + "..."}
                    </p>
                  </div>
                  <button
                    onClick={() => removeEvidence(item.id)}
                    className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white/80"
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
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 gap-2"
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
