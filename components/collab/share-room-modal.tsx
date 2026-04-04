"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  Copy,
  Check,
  Share2,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { generateSessionId, getRandomColor } from "@/lib/collab";

interface ShareRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
}

export default function ShareRoomModal({
  isOpen,
  onClose,
  documentId,
}: ShareRoomModalProps) {
  const [hostName, setHostName] = useState("");
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    if (!hostName.trim()) {
      toast.error("Please enter your name");
      return;
    }

    setLoading(true);

    try {
      const sessionId = generateSessionId();
      localStorage.setItem("clausewall_session_id", sessionId);
      localStorage.setItem("clausewall_user_name", hostName.trim());
      localStorage.setItem("clausewall_user_color", getRandomColor());

      const res = await fetch("/api/collab/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          hostName: hostName.trim(),
          sessionId,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to create room");
      }

      setRoomCode(data.room.room_code);
      toast.success("Collaboration room created!");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const shareUrl = roomCode
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/collab/${roomCode}`
    : "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copied!");
  };

  const handleWhatsApp = () => {
    const text = `Hey! I've analyzed a contract on ClauseWall. Join to review together: ${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-[#0A0A0F] border-foreground border-2 p-0 gap-0">
        <VisuallyHidden>
          <DialogTitle>Start Collaboration</DialogTitle>
        </VisuallyHidden>

        <div className="p-5 border-b border-foreground border-2/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-none bg-background border border-blue-500/30 flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Collaborate in Real-Time</h2>
              <p className="text-xs text-muted-foreground">
                Share with roommates, colleagues, or even the other party
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {!roomCode ? (
            <>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">
                  Your Name
                </label>
                <Input
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  placeholder="e.g., Tenant, Rahul, etc."
                  className="bg-background border-2 border-foreground card-impact border-foreground border-2"
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Others will see this name in the collaboration room
                </p>
              </div>

              <Button
                onClick={handleCreate}
                disabled={loading || !hostName.trim()}
                className="w-full gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Users className="h-4 w-4" />
                )}
                Create Room
              </Button>
            </>
          ) : (
            <>
              {/* Room Created */}
              <div className="text-center py-3">
                <div className="inline-flex items-center gap-2 px-4 py-3 rounded-none bg-blue-500/10 border border-blue-500/20 mb-3">
                  <span className="text-2xl font-mono font-bold text-blue-400 tracking-wider">
                    {roomCode}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Share this code or link
                </p>
              </div>

              {/* Share URL */}
              <div className="flex gap-2">
                <Input
                  value={shareUrl}
                  readOnly
                  className="bg-background border-2 border-foreground card-impact border-foreground border-2 text-xs font-mono"
                />
                <Button variant="outline" size="icon" onClick={handleCopy}>
                  {copied ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Share Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="gap-1.5 text-xs"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy Link
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleWhatsApp}
                  className="gap-1.5 text-xs"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  WhatsApp
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/collab/${roomCode}`, "_blank")}
                  className="gap-1.5 text-xs"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open
                </Button>
              </div>

              <p className="text-[10px] text-muted-foreground text-center">
                Room expires in 24 hours • Up to 10 participants
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
