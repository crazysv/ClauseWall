"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MessageSquare, ArrowRight } from "lucide-react";

interface WhatsAppGuideModalProps {
  open: boolean;
  onClose: () => void;
}

const STEPS = [
  { step: 1, icon: "📱", title: "Open WhatsApp", desc: "Find the chat with the broker, landlord, HR, or anyone who made promises." },
  { step: 2, icon: "👆", title: "Tap Chat Name", desc: "Tap the contact/group name at the top of the chat to open chat info." },
  { step: 3, icon: "📤", title: "Scroll to Export", desc: "Scroll down in chat info and tap 'Export Chat'." },
  { step: 4, icon: "📝", title: "Without Media", desc: "Select 'Without Media' — this is faster and creates a smaller .txt file." },
  { step: 5, icon: "💾", title: "Save the File", desc: "Save or share the .txt file to your device. You may receive a .zip file." },
  { step: 6, icon: "⬆️", title: "Upload Here", desc: "Upload the .txt or .zip file in ClauseWall. We parse it automatically." },
];

export function WhatsAppGuideModal({ open, onClose }: WhatsAppGuideModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white dark:bg-card border border-slate-200 dark:border-slate-700 shadow-xl rounded-2xl overflow-hidden p-0">
        <div className="space-y-6">
          <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 p-6">
            <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-200 shadow-sm dark:shadow-slate-900/20">
              <MessageSquare className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Export WhatsApp Chat</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1">Step-by-step guide</p>
            </div>
          </div>

          <div className="space-y-4 px-4 md:px-6 pb-2">
            {STEPS.map(({ step, icon, title, desc }, i) => (
              <div key={step} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-inner flex items-center justify-center text-xl">
                  {icon}
                </div>
                <div className="flex-1 mt-0.5">
                  <p className="text-sm font-black text-slate-700">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mr-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-card px-2 py-0.5 rounded shadow-sm dark:shadow-slate-900/20">Step {step}</span> {title}
                  </p>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">{desc}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-slate-300 mt-2.5 flex-shrink-0 hidden sm:block" />
                )}
              </div>
            ))}
          </div>

          <div className="px-4 md:px-6 pb-6">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 shadow-sm dark:shadow-slate-900/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-emerald-100/50 to-transparent pointer-events-none" />
              <p className="text-xs font-bold text-emerald-800 leading-relaxed pr-6">
                <span className="text-lg mr-1.5 drop-shadow-sm dark:shadow-slate-900/20">💡</span> Your chat data stays private. We only extract promises and commitments — personal messages are never stored.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
