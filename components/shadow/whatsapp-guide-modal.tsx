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

export default function WhatsAppGuideModal({ open, onClose }: WhatsAppGuideModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-gray-950 border-white/10">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <MessageSquare className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold">How to Export WhatsApp Chat</h3>
              <p className="text-xs text-white/40">Step-by-step guide</p>
            </div>
          </div>

          <div className="space-y-3">
            {STEPS.map(({ step, icon, title, desc }, i) => (
              <div key={step} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-lg">
                  {icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    <span className="text-white/40 mr-1">Step {step}:</span> {title}
                  </p>
                  <p className="text-xs text-white/40 mt-0.5">{desc}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-white/10 mt-2 flex-shrink-0 hidden sm:block" />
                )}
              </div>
            ))}
          </div>

          <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/10">
            <p className="text-xs text-green-300">
              💡 Your chat data stays private. We only extract promises and commitments — personal messages are never stored.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
