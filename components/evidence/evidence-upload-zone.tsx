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
              className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all text-xs ${
                isActive
                  ? "border-blue-500/50 bg-blue-500/10 text-blue-400"
                  : "border-white/5 bg-white/[0.02] text-muted-foreground hover:bg-white/[0.04] hover:border-white/10"
              }`}
            >
              <Icon className="h-5 w-5" />
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
            className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/50"
          />
          <Button
            onClick={() => { if (urlInput) onUpload(selectedType, [], urlInput); }}
            disabled={!urlInput}
            className="bg-blue-600 hover:bg-blue-700"
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
            className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/50 font-mono"
          />
          <Button
            onClick={() => { if (cinInput) onUpload(selectedType, [], cinInput); }}
            disabled={!cinInput}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Building2 className="h-4 w-4 mr-2" />
            Lookup Company
          </Button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
            isDragActive
              ? "border-blue-500 bg-blue-500/5"
              : "border-white/10 bg-white/[0.01] hover:border-white/20 hover:bg-white/[0.03]"
          }`}
        >
          <input {...getInputProps()} />
          <Upload className={`h-8 w-8 mx-auto mb-3 ${isDragActive ? "text-blue-400" : "text-muted-foreground"}`} />
          <p className="text-sm text-foreground font-medium">
            {isDragActive ? "Drop files here..." : "Drag & drop files here"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            or click to browse • {selectedMeta?.description}
          </p>
        </div>
      )}
    </div>
  );
}
