"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  FileText,
  MessageSquare,
  Mail,
  Mic,
  Camera,
  Receipt,
  Globe,
  Building2,
} from "lucide-react";
import type { EvidenceType } from "@/types/evidence";

const CAPTURE_TYPES: Array<{
  type: EvidenceType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  accept: string;
  description: string;
}> = [
  {
    type: "document",
    label: "File",
    icon: FileText,
    accept: "*/*",
    description: "PDF, DOCX, images",
  },
  {
    type: "whatsapp_chat",
    label: "WhatsApp",
    icon: MessageSquare,
    accept: ".txt",
    description: "Exported chat .txt",
  },
  {
    type: "email",
    label: "Email",
    icon: Mail,
    accept: ".eml",
    description: ".eml file or paste text",
  },
  {
    type: "audio_recording",
    label: "Audio",
    icon: Mic,
    accept: "audio/*",
    description: "MP3, WAV, M4A",
  },
  {
    type: "photo",
    label: "Photo",
    icon: Camera,
    accept: "image/*",
    description: "JPG, PNG evidence",
  },
  {
    type: "payment_receipt",
    label: "Receipt",
    icon: Receipt,
    accept: "image/*,application/pdf",
    description: "Payment screenshot",
  },
  {
    type: "website_archive",
    label: "URL",
    icon: Globe,
    accept: "",
    description: "Archive a web page",
  },
  {
    type: "company_data",
    label: "Company",
    icon: Building2,
    accept: "",
    description: "MCA CIN lookup",
  },
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
  const isUrlType =
    selectedType === "website_archive" || selectedType === "tos_archive";
  const isCompanyType = selectedType === "company_data";

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onUpload(selectedType, acceptedFiles);
      }
    },
    [selectedType, onUpload],
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
              className={`flex flex-col items-center gap-1.5 p-3 border transition-colors text-[7px] font-mono uppercase tracking-widest ${
                isActive
                  ? "border-amber-900/50 bg-amber-950/20 text-amber-400"
                  : "border-neutral-800 bg-[#050505] text-neutral-600 hover:border-neutral-700 hover:text-neutral-400"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{ct.label}</span>
            </button>
          );
        })}
      </div>

      {/* Upload area or input */}
      {isUrlType ? (
        <div className="space-y-3 pt-4 mt-4 border-t border-neutral-800">
          <input
            type="url"
            placeholder="https://example.com/terms-of-service"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="w-full border border-neutral-800 p-3 bg-[#050505] text-sm font-mono text-neutral-300 focus:outline-none focus:border-neutral-600 transition-colors placeholder:text-neutral-700"
          />
          <button
            onClick={() => {
              if (urlInput) onUpload(selectedType, [], urlInput);
            }}
            disabled={!urlInput}
            className="flex items-center gap-2 px-4 py-2 border border-cyan-900/50 bg-cyan-950/10 font-mono uppercase tracking-widest text-[8px] text-cyan-400 hover:text-cyan-300 hover:border-cyan-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Globe className="h-3.5 w-3.5" />
            ARCHIVE PAGE
          </button>
        </div>
      ) : isCompanyType ? (
        <div className="space-y-3 pt-4 mt-4 border-t border-neutral-800">
          <input
            type="text"
            placeholder="Enter CIN (e.g., U72900MH2020PTC345678)"
            value={cinInput}
            onChange={(e) => setCinInput(e.target.value.toUpperCase())}
            className="w-full border border-neutral-800 p-3 bg-[#050505] text-sm font-mono text-neutral-300 focus:outline-none focus:border-neutral-600 transition-colors placeholder:text-neutral-700"
          />
          <button
            onClick={() => {
              if (cinInput) onUpload(selectedType, [], cinInput);
            }}
            disabled={!cinInput}
            className="flex items-center gap-2 px-4 py-2 border border-amber-900/50 bg-amber-950/10 font-mono uppercase tracking-widest text-[8px] text-amber-400 hover:text-amber-300 hover:border-amber-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Building2 className="h-3.5 w-3.5" />
            LOOKUP COMPANY
          </button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`relative border border-dashed pt-4 mt-4 p-10 text-center transition-colors cursor-pointer ${
            isDragActive
              ? "border-cyan-500 bg-cyan-950/10"
              : "border-neutral-700 bg-[#050505] hover:border-neutral-500"
          }`}
        >
          <input {...getInputProps()} />
          <Upload
            className={`h-8 w-8 mx-auto mb-4 ${isDragActive ? "text-cyan-400 animate-bounce" : "text-neutral-600"}`}
          />
          <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-300">
            {isDragActive ? "DROP FILES HERE..." : "DRAG & DROP FILES HERE"}
          </p>
          <p className="text-[8px] font-mono uppercase tracking-widest text-neutral-600 mt-2">
            OR CLICK TO BROWSE • {selectedMeta?.description}
          </p>
        </div>
      )}
    </div>
  );
}
