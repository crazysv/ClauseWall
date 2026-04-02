"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, MessageSquare, Mail, Mic, Camera, Receipt, Globe, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EvidenceType } from "@/types/evidence";

const CAPTURE_TYPES: Array<{
  type: EvidenceType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  accept: string;
  description: string;
}> = [
  { type: "document", label: "File", icon: FileText, accept: "*/*", description: "PDF, DOCX, images" },
  { type: "whatsapp_chat", label: "WhatsApp", icon: MessageSquare, accept: ".txt", description: "Exported chat .txt" },
  { type: "email", label: "Email", icon: Mail, accept: ".eml", description: ".eml file or paste text" },
  { type: "audio_recording", label: "Audio", icon: Mic, accept: "audio/*", description: "MP3, WAV, M4A" },
  { type: "photo", label: "Photo", icon: Camera, accept: "image/*", description: "JPG, PNG evidence" },
  { type: "payment_receipt", label: "Receipt", icon: Receipt, accept: "image/*,application/pdf", description: "Payment screenshot" },
  { type: "website_archive", label: "URL", icon: Globe, accept: "", description: "Archive a web page" },
  { type: "company_data", label: "Company", icon: Building2, accept: "", description: "MCA CIN lookup" },
];

export function EvidenceUploadZone({
  caseId,
  onUpload,
}: {
  caseId: string;
  onUpload: (type: EvidenceType, files: File[], url?: string) => void;
}) {
  const [selectedType, setSelectedType] = useState<EvidenceType>("document");
  const [urlInput, setUrlInput] = useState("");
  const [cinInput, setCinInput] = useState("");

  const selectedMeta = CAPTURE_TYPES.find((t) => t.type === selectedType);
  const isUrlType = selectedType === "website_archive" || selectedType === "tos_archive";
  const isCompanyType = selectedType === "company_data";

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onUpload(selectedType, acceptedFiles);
      }
    },
    [selectedType, onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: isUrlType || isCompanyType,
    multiple: selectedType === "photo" || selectedType === "document",
  });

  return (
    <div className="space-y-4">
      {/* Type selector */}
      <div className="flex flex-wrap gap-2">
        {CAPTURE_TYPES.map((ct) => {
          const Icon = ct.icon;
          const isActive = selectedType === ct.type;
          return (
            <button
              key={ct.type}
              onClick={() => setSelectedType(ct.type)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-xs font-bold uppercase tracking-widest ${ isActive ? "border-indigo-400 bg-indigo-50 text-indigo-700 shadow-sm dark:shadow-slate-900/20" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-card text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-indigo-300" }`}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span>{ct.label}</span>
            </button>
          );
        })}
      </div>

      {/* Upload area or input */}
      {isUrlType ? (
        <div className="space-y-3">
          <input
            type="url"
            placeholder="https://example.com/terms-of-service"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="w-full rounded-xl bg-white dark:bg-card border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm dark:shadow-slate-900/20"
          />
          <Button
            onClick={() => { if (urlInput) onUpload(selectedType, [], urlInput); }}
            disabled={!urlInput}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm dark:shadow-slate-900/20"
          >
            <Globe className="h-4 w-4 mr-2" />
            Archive Page
          </Button>
        </div>
      ) : isCompanyType ? (
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Enter CIN (e.g., U72900MH2020PTC345678)"
            value={cinInput}
            onChange={(e) => setCinInput(e.target.value.toUpperCase())}
            className="w-full rounded-xl bg-white dark:bg-card border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm dark:shadow-slate-900/20 font-mono uppercase"
          />
          <Button
            onClick={() => { if (cinInput) onUpload(selectedType, [], cinInput); }}
            disabled={!cinInput}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-sm dark:shadow-slate-900/20"
          >
            <Building2 className="h-4 w-4 mr-2" />
            Lookup Company
          </Button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`relative rounded-2xl border-2 border-dashed p-10 text-center transition-all cursor-pointer ${ isDragActive ? "border-indigo-400 bg-indigo-50" : "border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30/30" }`}
        >
          <input {...getInputProps()} />
          <Upload className={`h-8 w-8 mx-auto mb-4 ${isDragActive ? "text-indigo-500" : "text-slate-400"}`} />
          <p className="text-sm font-black text-slate-800 dark:text-slate-200 tracking-tight">
            {isDragActive ? "Drop files here..." : "Drag & drop files here"}
          </p>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-widest">
            or click to browse • {selectedMeta?.description}
          </p>
        </div>
      )}
    </div>
  );
}
