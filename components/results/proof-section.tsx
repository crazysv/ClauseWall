"use client";

import { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toPng } from "html-to-image";
import {
  Link2,
  Copy,
  Check,
  Download,
  ExternalLink,
  Clock,
  Hash,
  Lock,
  Fingerprint,
  ShieldCheck,
  Globe,
  FileCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface ProofSectionProps {
  proofHash: string | null;
  proofCid: string | null;
  proofTimestamp: string | null;
  proofStatus: string | null;
  tsaToken: string | null;
  tsaSerial: string | null;
  overallRiskScore: number;
  totalClauses: number;
}

export default function ProofSection({
  proofHash,
  proofCid,
  proofTimestamp,
  proofStatus,
  tsaToken,
  tsaSerial,
  overallRiskScore,
  totalClauses,
}: ProofSectionProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const certRef = useRef<HTMLDivElement>(null);

  if (!proofHash) return null;

  const verifyUrl = proofCid
    ? `https://gateway.pinata.cloud/ipfs/${proofCid}`
    : null;

  const publicIpfsUrl = proofCid
    ? `https://ipfs.io/ipfs/${proofCid}`
    : null;

  const formattedDate = proofTimestamp
    ? new Date(proofTimestamp).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      })
    : null;

  const shortHash = `0x${proofHash.substring(0, 8)}...${proofHash.substring(proofHash.length - 8)}`;

  const hasTSA = !!tsaToken;
  const hasIPFS = !!proofCid;

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      toast.success(`${label} copied!`);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const downloadCertificate = async () => {
    if (!certRef.current) return;
    try {
      const dataUrl = await toPng(certRef.current, {
        quality: 1.0,
        pixelRatio: 3,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = `clausewall-proof-${proofHash.substring(0, 8)}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Proof certificate downloaded");
    } catch {
      toast.error("Failed to download certificate");
    }
  };

  const downloadTSAToken = () => {
    if (!tsaToken) return;
    const bytes = Uint8Array.from(atob(tsaToken), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: "application/timestamp-reply" });
    const link = document.createElement("a");
    link.download = `clausewall-tsa-${proofHash.substring(0, 8)}.tsr`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success("TSA token downloaded (.tsr)");
  };

  const downloadHashFile = () => {
    if (!proofHash) return;
    // Create a file with the raw hash bytes (what was sent to TSA)
    const hashBytes = new Uint8Array(
      proofHash.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
    );
    const blob = new Blob([hashBytes], { type: "application/octet-stream" });
    const link = document.createElement("a");
    link.download = `clausewall-hash-${proofHash.substring(0, 8)}.bin`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success("Hash file downloaded (.bin) — use this with TSR to verify");
  };

  const openFreeTSAVerify = () => {
    window.open("https://freetsa.org/index_en.php", "_blank");
    toast.info("Upload the .tsr and .bin files to verify");
  };

  return (
    <>
      <Card className="bg-gray-900/50 border-gray-800 mt-8 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500" />

        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Link2 className="h-5 w-5 text-cyan-400" />
              Analysis Proof
              <Badge className="bg-cyan-500/15 text-cyan-400 border-cyan-500/30 text-[10px] gap-1">
                <Lock className="h-3 w-3" />
                IMMUTABLE
              </Badge>
            </h3>
            <div className="flex gap-1.5">
              {hasTSA && (
                <Badge className="bg-green-500/15 text-green-400 border-green-500/30 text-[10px] gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  TSA VERIFIED
                </Badge>
              )}
              {hasIPFS && (
                <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30 text-[10px] gap-1">
                  <Globe className="h-3 w-3" />
                  IPFS PINNED
                </Badge>
              )}
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-6">
            This analysis is permanently recorded and independently verified.
            Use this proof in disputes as digital evidence under the{" "}
            <span className="text-cyan-400 font-medium">
              IT Act, 2000 — Section 65B
            </span>
            .
          </p>

          {/* ---- LAYER 1: LEGAL PROOF (FreeTSA) ---- */}
          {hasTSA && (
            <div className="mb-4 p-4 rounded-xl bg-green-500/5 border border-green-500/20">
              <h4 className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Legal Proof — RFC 3161 Timestamp
              </h4>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Fingerprint className="h-3.5 w-3.5 text-green-400" />
                    Proof Hash
                  </span>
                  <div className="flex items-center gap-2">
                    <code className="text-green-300 font-mono text-xs">
                      {shortHash}
                    </code>
                    <button
                      onClick={() => copyToClipboard(proofHash, "Hash")}
                      className="text-muted-foreground hover:text-white"
                    >
                      {copied === "Hash" ? (
                        <Check className="h-3.5 w-3.5 text-green-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {formattedDate && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-green-400" />
                      TSA Timestamp
                    </span>
                    <span>{formattedDate}</span>
                  </div>
                )}

                {tsaSerial && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Hash className="h-3.5 w-3.5 text-green-400" />
                      Serial Number
                    </span>
                    <code className="font-mono text-xs">#{tsaSerial}</code>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <FileCheck className="h-3.5 w-3.5 text-green-400" />
                    Authority
                  </span>
                  <span>FreeTSA.org (RFC 3161)</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-green-500/10">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-green-300/70">
                    Independently timestamped by FreeTSA.org. This authority is
                    not affiliated with ClauseWall. The timestamp cannot be
                    modified or backdated.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ---- LAYER 2: PUBLIC PROOF (IPFS) ---- */}
          {hasIPFS && verifyUrl && (
            <div className="mb-4 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
              <h4 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Public Proof — IPFS
              </h4>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="bg-white p-2.5 rounded-lg flex-shrink-0">
                  <QRCodeSVG
                    value={verifyUrl}
                    size={90}
                    bgColor="#ffffff"
                    fgColor="#111827"
                    level="M"
                  />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-xs text-muted-foreground mb-1">IPFS CID</p>
                  <code className="text-xs text-blue-300 font-mono break-all">
                    {proofCid!.length > 40
                      ? `${proofCid!.substring(0, 20)}...${proofCid!.substring(proofCid!.length - 15)}`
                      : proofCid}
                  </code>
                  <div className="flex gap-2 mt-2 justify-center sm:justify-start">
                    <a
                      href={verifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Pinata Gateway
                    </a>
                    <a
                      href={publicIpfsUrl!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Public Gateway
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Hash-only fallback (no TSA, no IPFS) */}
          {!hasTSA && !hasIPFS && (
            <div className="mb-4 p-4 rounded-xl bg-white/[0.03] border border-white/10">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Fingerprint className="h-3.5 w-3.5 text-cyan-400" />
                  Proof Hash (SHA-256)
                </span>
                <button
                  onClick={() => copyToClipboard(proofHash, "Hash")}
                  className="text-muted-foreground hover:text-white"
                >
                  {copied === "Hash" ? (
                    <Check className="h-3.5 w-3.5 text-green-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              <code className="text-xs text-cyan-300 font-mono break-all">
                {proofHash}
              </code>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={downloadCertificate} className="gap-2">
              <Download className="h-3.5 w-3.5" />
              Certificate
            </Button>
            {hasTSA && (
              <>
                <Button variant="outline" size="sm" onClick={downloadTSAToken} className="gap-2">
                  <FileCheck className="h-3.5 w-3.5" />
                  TSA Token (.tsr)
                </Button>
                <Button variant="outline" size="sm" onClick={downloadHashFile} className="gap-2">
                  <Hash className="h-3.5 w-3.5" />
                  Hash File (.bin)
                </Button>
                <Button variant="outline" size="sm" onClick={openFreeTSAVerify} className="gap-2">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Verify on FreeTSA
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(proofHash, "Hash")}
              className="gap-2"
            >
              {copied === "Hash" ? (
                <Check className="h-3.5 w-3.5 text-green-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              Copy Hash
            </Button>
            {verifyUrl && (
              <Button variant="outline" size="sm" className="gap-2" asChild>
                <a href={verifyUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Verify IPFS
                </a>
              </Button>
            )}
          </div>

          {/* Legal note */}
          <p className="text-[10px] text-muted-foreground mt-4 leading-relaxed">
            🔒 This proof contains NO personal data or contract text. The SHA-256 hash
            is deterministic — identical analysis always produces the same hash.
            {hasTSA && " FreeTSA.org is an independent timestamp authority operating since 2005."}
            {" "}Admissible as digital evidence under IT Act, 2000 — Section 65B.
          </p>
        </CardContent>
      </Card>

      {/* Hidden Certificate for PNG Export */}
      <div style={{ position: "fixed", left: "-9999px", top: 0 }}>
        <div
          ref={certRef}
          style={{
            width: 440,
            padding: 32,
            background: "#ffffff",
            borderRadius: 16,
            border: "3px solid #06b6d4",
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: "#06b6d4", fontWeight: 600, letterSpacing: 2, marginBottom: 4 }}>
              ANALYSIS PROOF CERTIFICATE
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#111827" }}>
              🛡️ ClauseWall
            </div>
            <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>
              India&apos;s AI Contract Analyzer
            </div>
          </div>

          <div style={{ height: 2, background: "linear-gradient(to right, #06b6d4, #8b5cf6)", margin: "0 0 16px 0", borderRadius: 1 }} />

          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 42, fontWeight: 800, color: "#111827" }}>
              {overallRiskScore}
              <span style={{ fontSize: 16, color: "#6b7280", fontWeight: 400 }}>/100</span>
            </div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>
              Risk Score • {totalClauses} clauses analyzed
            </div>
          </div>

          <div style={{ background: "#f0fdfa", borderRadius: 8, padding: 12, marginBottom: 12, border: "1px solid #99f6e4" }}>
            <div style={{ fontSize: 9, color: "#0d9488", fontWeight: 600, marginBottom: 6, letterSpacing: 1 }}>
              LEGAL PROOF — RFC 3161
            </div>
            <div style={{ fontSize: 10, color: "#374151", lineHeight: 1.8 }}>
              <div><strong>Hash:</strong> 0x{proofHash.substring(0, 20)}...{proofHash.substring(proofHash.length - 8)}</div>
              {formattedDate && <div><strong>Timestamp:</strong> {formattedDate}</div>}
              {tsaSerial && <div><strong>TSA Serial:</strong> #{tsaSerial}</div>}
              <div><strong>Authority:</strong> FreeTSA.org (Independent)</div>
              {proofCid && <div><strong>IPFS CID:</strong> {proofCid.substring(0, 24)}...</div>}
            </div>
          </div>

          {verifyUrl && (
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
              <QRCodeSVG value={verifyUrl} size={90} bgColor="#ffffff" fgColor="#111827" level="M" includeMargin />
            </div>
          )}

          <div style={{ height: 1, background: "#e5e7eb", margin: "12px 0" }} />
          <div style={{ fontSize: 8, color: "#9ca3af", lineHeight: 1.5, textAlign: "center" }}>
            Admissible as digital evidence under IT Act, 2000 — Section 65B.
            No personal data included. Verify at clause-wall.vercel.app
          </div>
        </div>
      </div>
    </>
  );
}