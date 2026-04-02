"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, AlertTriangle, Flag, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

interface Props {
  authorityId: string;
  authorityName: string;
  isOpen: boolean;
  onClose: () => void;
}

const ISSUE_TYPES = [
  { value: "wrong_phone", label: "Wrong Phone Number" },
  { value: "wrong_email", label: "Wrong Email" },
  { value: "wrong_address", label: "Wrong Address" },
  { value: "closed", label: "Permanently Closed" },
  { value: "moved", label: "Moved to Different Location" },
  { value: "other", label: "Other Issue" },
];

export function ReportIssueModal({ authorityId, authorityName, isOpen, onClose }: Props) {
  const [issueType, setIssueType] = useState("other");
  const [description, setDescription] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) { toast.error("Please describe the issue"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/authority/report-issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authority_id: authorityId, issue_type: issueType, description, suggested_correction: suggestion || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        toast.success("Report submitted. Thank you!");
        setTimeout(() => { onClose(); setSubmitted(false); setDescription(""); setSuggestion(""); }, 2000);
      }
    } catch {
      toast.error("Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20 border border-slate-200 dark:border-slate-700/60 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-md" onClick={(e) => e.stopPropagation()}
        >
          <Card className="border-amber-500/20 bg-slate-900">
            <CardContent className="p-6">
              {submitted ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-3" />
                  <p className="font-semibold">Report Submitted</p>
                  <p className="text-xs text-muted-foreground mt-1">We will review and update this information.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <Flag className="h-5 w-5 text-amber-400" />
                    <div>
                      <h3 className="font-semibold">Report Incorrect Information</h3>
                      <p className="text-xs text-muted-foreground">{authorityName}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Issue Type</label>
                      <select value={issueType} onChange={(e) => setIssueType(e.target.value)} className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm focus:border-amber-500 focus:outline-none">
                        {ISSUE_TYPES.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Description *</label>
                      <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="What's incorrect?" className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm focus:border-amber-500 focus:outline-none resize-none" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Suggested Correction</label>
                      <input type="text" value={suggestion} onChange={(e) => setSuggestion(e.target.value)} placeholder="What should it be?" className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm focus:border-amber-500 focus:outline-none" />
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
                    <Button onClick={handleSubmit} disabled={submitting} className="flex-1 bg-amber-600 hover:bg-amber-700 gap-1">
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4" />}
                      Submit Report
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
