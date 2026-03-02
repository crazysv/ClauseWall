"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Upload,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import {
  getRiskLevel,
  getRiskLabel,
  getStateName,
  getDocumentTypeLabel,
  RISK_COLORS,
} from "@/lib/utils/constants";
import { formatDate } from "@/lib/utils/helpers";
import type { Document } from "@/types";
import { toast } from "sonner";

export default function DashboardPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const { data, error } = await supabase
          .from("documents")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(20);

        if (error) throw error;
        setDocuments((data as Document[]) || []);
      } catch (err) {
        toast.error("Failed to load documents");
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "analyzing":
      case "pending":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case "failed":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
        <p className="text-muted-foreground">Loading your documents...</p>
      </div>
    );
  }

  return (
    <div className="relative px-4 sm:px-6 lg:px-8 py-8">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Your Documents</h1>
            <p className="text-muted-foreground">
              {documents.length} document{documents.length !== 1 ? "s" : ""} analyzed
            </p>
          </div>
          <Link href="/upload">
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Upload className="h-4 w-4" />
              Analyze New
            </Button>
          </Link>
        </div>

        {/* Empty State */}
        {documents.length === 0 && (
          <Card className="glass border-white/5">
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No documents yet</h3>
              <p className="text-muted-foreground mb-6">
                Upload your first contract to get started
              </p>
              <Link href="/upload">
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                  <Upload className="h-4 w-4" />
                  Upload Contract
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Documents List */}
        <div className="space-y-4">
          {documents.map((doc) => {
            const riskLevel = getRiskLevel(doc.overall_risk_score);
            const riskColor = RISK_COLORS[riskLevel];

            return (
              <Link key={doc.id} href={`/results/${doc.id}`}>
                <Card className="glass border-white/5 hover:border-blue-500/20 transition-all cursor-pointer">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between gap-4">
                      {/* Left Side */}
                      <div className="flex items-center gap-4 min-w-0">
                        <div
                          className="h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${riskColor}20` }}
                        >
                          <span
                            className="text-lg font-bold"
                            style={{ color: riskColor }}
                          >
                            {doc.overall_risk_score}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {getStatusIcon(doc.analysis_status)}
                            <p className="font-medium truncate">
                              {doc.original_filename || "Untitled Document"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{getDocumentTypeLabel(doc.document_type)}</span>
                            <span>•</span>
                            <span>{getStateName(doc.jurisdiction)}</span>
                            <span>•</span>
                            <span>{formatDate(doc.created_at)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Side */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {doc.analysis_status === "completed" && (
                          <div className="hidden sm:flex items-center gap-2">
                            {doc.illegal_count > 0 && (
                              <Badge className="bg-purple-500/20 text-purple-400">
                                {doc.illegal_count} illegal
                              </Badge>
                            )}
                            {doc.dangerous_count > 0 && (
                              <Badge className="bg-red-500/20 text-red-400">
                                {doc.dangerous_count} dangerous
                              </Badge>
                            )}
                          </div>
                        )}
                        <Badge
                          variant="outline"
                          className={
                            doc.analysis_status === "completed"
                              ? "border-green-500/30 text-green-400"
                              : doc.analysis_status === "failed"
                              ? "border-red-500/30 text-red-400"
                              : "border-blue-500/30 text-blue-400"
                          }
                        >
                          {doc.analysis_status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}