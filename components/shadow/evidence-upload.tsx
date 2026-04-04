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
  { type: "whatsapp_chat" as EvidenceType, icon: MessageSquare, label: "WhatsApp Chat", desc: ".txt export", accept: ".txt,.zip", color: "text-green-700", bg: "bg-green-100 mt-0", border: "border-green-600" },
  { type: "email" as EvidenceType, icon: Mail, label: "Email Thread", desc: "Paste or .eml", accept: ".eml,.txt", color: "text-blue-700", bg: "bg-blue-100", border: "border-blue-600" },
  { type: "sms_screenshot" as EvidenceType, icon: Camera, label: "SMS Screenshots", desc: "Image files", accept: "image/*", color: "text-purple-700", bg: "bg-purple-100", border: "border-purple-600" },
  { type: "audio_recording" as EvidenceType, icon: Mic, label: "Audio Recording", desc: ".mp3, .m4a, .wav", accept: "audio/*", color: "text-red-700", bg: "bg-red-100", border: "border-red-600" },
  { type: "handwritten_note" as EvidenceType, icon: PenTool, label: "Handwritten Notes", desc: "Photo of notes", accept: "image/*", color: "text-amber-700", bg: "bg-amber-100", border: "border-amber-600" },
  { type: "property_listing" as EvidenceType, icon: Home, label: "Property Listing", desc: "Paste listing text", accept: "", color: "text-cyan-700", bg: "bg-cyan-100", border: "border-cyan-600" },
  { type: "job_posting" as EvidenceType, icon: Briefcase, label: "Job Posting", desc: "Paste job post", accept: "", color: "text-indigo-700", bg: "bg-indigo-100", border: "border-indigo-600" },
  { type: "broker_message" as EvidenceType, icon: MessageCircle, label: "Broker Messages", desc: "Paste messages", accept: "", color: "text-orange-700", bg: "bg-orange-100", border: "border-orange-600" },
  { type: "other_text" as EvidenceType, icon: FileText, label: "Other Text", desc: "Any text evidence", accept: "", color: "text-gray-700", bg: "bg-gray-100", border: "border-gray-600" },
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
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center p-6 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-yellow-400 max-w-2xl mx-auto">
        <h2 className="text-2xl font-black uppercase tracking-widest text-black mb-3">Upload Evidence of Promises</h2>
        <p className="text-sm font-bold uppercase tracking-widest text-black/80 max-w-xl mx-auto border-t-2 border-black pt-3">
          Upload WhatsApp chats, emails, recordings, or screenshots of promises made before/during signing. We&apos;ll check if they match the contract.
        </p>
      </div>

      {/* Evidence Type Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {EVIDENCE_TYPES.map(({ type, icon: Icon, label, desc, color, bg, border }) => (
          <button
            key={type}
            onClick={() => setSelectedType(selectedType === type ? null : type)}
            className={`group relative p-4 transition-all text-left flex flex-col border-4 border-black ${
              selectedType === type
                ? `${bg} shadow-[inset_4px_4px_0px_rgba(0,0,0,0.1)] translate-y-1`
                : "bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-50"
            }`}
          >
            <div className={`p-2 border-2 border-black inline-block mb-3 bg-white ${color}`}>
              <Icon className="w-6 h-6 " />
            </div>
            <p className="text-sm font-black uppercase tracking-widest text-black">{label}</p>
            <p className="text-xs font-bold uppercase tracking-widest text-black/60 mt-1">{desc}</p>
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
            <div className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white">
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b-4 border-black">
                  <p className="text-base font-black uppercase tracking-widest text-black flex items-center gap-2">
                    {typeConfig && (
                      <span className="p-1 bg-black text-white">
                        <typeConfig.icon className="w-5 h-5" />
                      </span>
                    )}
                    Add {typeConfig?.label}
                  </p>
                  {selectedType === "whatsapp_chat" && (
                    <button
                      onClick={() => setShowWhatsAppGuide(true)}
                      className="text-xs font-black uppercase tracking-widest text-black bg-blue-200 px-2 py-1 border-2 border-black hover:bg-blue-300 transition-colors flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <Info className="w-4 h-4" /> How to export
                    </button>
                  )}
                </div>

                {needsTextInput ? (
                  <div className="space-y-4">
                    <textarea
                      value={textInput}
                      onChange={e => setTextInput(e.target.value)}
                      placeholder={`Paste ${typeConfig?.label?.toLowerCase() || "text"} here...`}
                      className="w-full h-40 p-4 text-sm font-bold text-black bg-gray-100 border-4 border-black border-dashed resize-none focus:outline-none focus:ring-4 focus:ring-yellow-400 placeholder:uppercase"
                    />
                    <Button 
                      onClick={handleTextSubmit} 
                      disabled={!textInput.trim()}
                      className="w-full h-12 bg-black text-white font-black uppercase tracking-widest rounded-none border-4 border-black hover:bg-gray-800 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] disabled:opacity-50 disabled:shadow-none"
                    >
                      Add Evidence
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-8 border-4 border-dashed border-black bg-gray-50 cursor-pointer hover:bg-yellow-50 transition-colors">
                    {uploading ? (
                      <div className="flex flex-col items-center">
                        <Loader2 className="w-10 h-10 text-black animate-spin mb-4" />
                        <span className="text-sm font-black uppercase tracking-widest text-black">Uploading...</span>
                      </div>
                    ) : (
                      <>
                        <div className="p-4 bg-white border-4 border-black mb-4">
                          <Upload className="w-8 h-8 text-black" />
                        </div>
                        <span className="text-sm font-black uppercase tracking-widest text-black">
                          Click to upload or drag files here
                        </span>
                        <span className="text-xs font-bold uppercase tracking-widest text-black/50 mt-2">
                          Accepts {typeConfig?.accept}
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
            <p className="text-sm font-black uppercase tracking-widest text-black border-b-4 border-black pb-2 inline-block">
              Evidence added ({evidenceItems.length})
            </p>
            <div className="space-y-3">
              {evidenceItems.map(item => {
                const config = EVIDENCE_TYPES.find(t => t.type === item.type);
                const Icon = config?.icon || FileText;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center gap-4 p-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white"
                  >
                    <div className="p-2 border-2 border-black bg-gray-100 flex-shrink-0">
                      <Icon className="w-6 h-6 text-black" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black uppercase tracking-widest text-black truncate">{item.filename}</p>
                      <p className="text-xs font-bold uppercase tracking-widest text-black/60 mt-1 flex flex-wrap gap-2">
                        {item.messageCount && <span className="bg-gray-200 px-1 border-2 border-black">{item.messageCount} messages</span>}
                        {item.participants && item.participants.length > 0 && <span className="bg-gray-200 px-1 border-2 border-black">{item.participants.length} participants</span>}
                        {item.wordCount && !item.messageCount && <span className="bg-gray-200 px-1 border-2 border-black">{item.wordCount} words</span>}
                        {item.preview && !item.messageCount && !item.wordCount && <span>{item.preview.substring(0, 60)}...</span>}
                      </p>
                    </div>
                    <button
                      onClick={() => removeEvidence(item.id)}
                      className="p-2 border-2 border-black bg-red-100 text-red-600 hover:bg-red-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                      <X className="w-5 h-5" />
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
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full h-16 bg-black text-white font-black uppercase tracking-widest border-4 border-black hover:bg-gray-800 transition-colors shadow-[6px_6px_0px_0px_rgba(0,0,0,0.5)] disabled:opacity-50 disabled:shadow-none rounded-none text-base sm:text-lg gap-3"
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Analyzing Mismatches...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-6 h-6 text-green-400" />
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
