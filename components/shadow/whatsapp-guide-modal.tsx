"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MessageSquare, ArrowRight } from "lucide-react";

interface WhatsAppGuideModalProps {
  open: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    step: 1,
    icon: "📱",
    title: "Open WhatsApp",
    desc: "Find the chat with the broker, landlord, HR, or anyone who made promises.",
  },
  {
    step: 2,
    icon: "👆",
    title: "Tap Chat Name",
    desc: "Tap the contact/group name at the top of the chat to open chat info.",
  },
  {
    step: 3,
    icon: "📤",
    title: "Scroll to Export",
    desc: "Scroll down in chat info and tap 'Export Chat'.",
  },
  {
    step: 4,
    icon: "📝",
    title: "Without Media",
    desc: "Select 'Without Media' — this is faster and creates a smaller .txt file.",
  },
  {
    step: 5,
    icon: "💾",
    title: "Save the File",
    desc: "Save or share the .txt file to your device. You may receive a .zip file.",
  },
  {
    step: 6,
    icon: "⬆️",
    title: "Upload Here",
    desc: "Upload the .txt or .zip file in ClauseWall. We parse it automatically.",
  },
];

export default function WhatsAppGuideModal({
  open,
  onClose,
}: WhatsAppGuideModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-4 border-black bg-white dark:bg-zinc-950 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none">
        <div className="space-y-6">
          <div className="flex items-center gap-4 border-b-4 border-black pb-4">
            <div className="p-3 border-4 border-black bg-green-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <MessageSquare className="w-6 h-6 text-black stroke-[3px]" />
            </div>
            <div>
              <h3 className="font-black text-xl uppercase tracking-widest text-foreground">
                Extract Promises
              </h3>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                WHATSAPP CHAT EXPORT GUIDE
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {STEPS.map(({ step, icon, title, desc }, i) => (
              <div key={step} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 border-4 border-black bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  {icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black uppercase tracking-wide text-foreground">
                    <span className="text-muted-foreground mr-2 font-bold uppercase tracking-widest">
                      STEP {step}:
                    </span>{" "}
                    {title}
                  </p>
                  <p className="text-xs font-medium text-muted-foreground mt-1 leading-relaxed">
                    {desc}
                  </p>
                </div>
                {i < STEPS.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-black dark:text-white mt-3 flex-shrink-0 hidden sm:block stroke-[3px]" />
                )}
              </div>
            ))}
          </div>

          <div className="p-4 border-4 border-black bg-green-100 dark:bg-green-900/30 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-xs font-bold text-green-900 dark:text-green-300 uppercase tracking-wide leading-relaxed">
              💡{" "}
              <span className="font-black text-black dark:text-white">
                YOUR DATA STAYS PRIVATE.
              </span>{" "}
              We only extract promises and commitments — personal messages are
              never stored.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
