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
import { Button } from "@/components/ui/button";
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
      <div className="flex flex-wrap gap-3">
        {CAPTURE_TYPES.map((ct) => {
          const Icon = ct.icon;
          const isActive = selectedType === ct.type;
          return (
            <button
              key={ct.type}
              onClick={() => setSelectedType(ct.type)}
              className={`flex flex-col items-center gap-2 p-3 border-4 transition-all text-sm font-bold tracking-wide shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                isActive
                  ? "border-black bg-blue-200 text-blue-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5"
                  : "border-black bg-white dark:bg-zinc-900 text-muted-foreground"
              }`}
            >
              <Icon className="h-6 w-6 stroke-[3px]" />
              <span className="uppercase">{ct.label}</span>
            </button>
          );
        })}
      </div>

      {/* Upload area or input */}
      {isUrlType ? (
        <div className="space-y-4 pt-4 mt-6 border-t-4 border-black">
          <input
            type="url"
            placeholder="https://example.com/terms-of-service"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="w-full border-4 border-black p-3 bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all placeholder:font-medium"
          />
          <Button
            onClick={() => {
              if (urlInput) onUpload(selectedType, [], urlInput);
            }}
            disabled={!urlInput}
            className="btn-impact bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Globe className="h-5 w-5 mr-2 stroke-[3px]" />
            ARCHIVE PAGE
          </Button>
        </div>
      ) : isCompanyType ? (
        <div className="space-y-4 pt-4 mt-6 border-t-4 border-black">
          <input
            type="text"
            placeholder="Enter CIN (e.g., U72900MH2020PTC345678)"
            value={cinInput}
            onChange={(e) => setCinInput(e.target.value.toUpperCase())}
            className="w-full border-4 border-black p-3 bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all placeholder:font-medium font-mono"
          />
          <Button
            onClick={() => {
              if (cinInput) onUpload(selectedType, [], cinInput);
            }}
            disabled={!cinInput}
            className="btn-impact bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Building2 className="h-5 w-5 mr-2 stroke-[3px]" />
            LOOKUP COMPANY
          </Button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`relative border-4 border-dashed pt-4 mt-6 p-12 text-center transition-all cursor-pointer ${
            isDragActive
              ? "border-blue-600 bg-blue-100 dark:bg-blue-900/30 shadow-[8px_8px_0px_0px_rgba(37,99,235,1)]"
              : "border-black bg-white dark:bg-zinc-900 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1"
          }`}
        >
          <input {...getInputProps()} />
          <Upload
            className={`h-12 w-12 mx-auto mb-4 stroke-[3px] ${isDragActive ? "text-blue-600 dark:text-blue-400 animate-bounce" : "text-black dark:text-white"}`}
          />
          <p className="text-xl font-black uppercase tracking-widest text-foreground">
            {isDragActive ? "DROP FILES HERE..." : "DRAG & DROP FILES HERE"}
          </p>
          <p className="text-sm font-bold text-muted-foreground mt-2 uppercase tracking-widest">
            OR CLICK TO BROWSE • {selectedMeta?.description}
          </p>
        </div>
      )}
    </div>
  );
}
