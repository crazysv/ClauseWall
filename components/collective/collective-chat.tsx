"use client";

import { useState, useEffect, useRef } from "react";
import {
  Send,
  Pin,
  MessageCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { CollectiveMessage } from "@/types";

interface Props {
  collectiveId: string;
  userAnonymousId: string | null;
}

export default function CollectiveChat({
  collectiveId,
  userAnonymousId,
}: Props) {
  const [messages, setMessages] = useState<CollectiveMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(
          `/api/collective/${collectiveId}/messages?limit=50`
        );
        const data = await res.json();
        if (Array.isArray(data)) {
          setMessages(data.reverse());
        }
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Poll every 10 seconds
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [collectiveId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const res = await fetch(`/api/collective/${collectiveId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage }),
      });

      const data = await res.json();
      if (data.success && data.message) {
        setMessages((prev) => [...prev, data.message]);
        setNewMessage("");
      } else {
        toast.error(data.error || "Failed to send message");
      }
    } catch {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Generate pastel color from anonymous ID
  const getAvatarColor = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 50%, 60%)`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 text-white/20 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[400px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 p-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="h-8 w-8 text-white/10 mb-2" />
            <p className="text-xs text-white/30">No messages yet</p>
            <p className="text-[10px] text-white/20">
              Start the conversation — all messages are anonymous
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_anonymous_id === userAnonymousId;
            return (
              <div
                key={msg.id}
                className={`flex gap-2 ${isOwn ? "flex-row-reverse" : ""}`}
              >
                {/* Avatar */}
                <div
                  className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                  style={{
                    backgroundColor: getAvatarColor(msg.sender_anonymous_id),
                  }}
                >
                  {msg.sender_anonymous_id.charAt(0)}
                </div>

                {/* Message */}
                <div
                  className={`max-w-[75%] rounded-xl px-3 py-2 ${
                    isOwn
                      ? "bg-amber-500/10 border border-amber-500/20"
                      : "bg-white/[0.03] border border-white/5"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className="text-[10px] font-medium"
                      style={{
                        color: getAvatarColor(msg.sender_anonymous_id),
                      }}
                    >
                      {msg.sender_anonymous_id}
                    </span>
                    {msg.is_pinned && (
                      <Pin className="h-2.5 w-2.5 text-amber-400" />
                    )}
                  </div>
                  <p className="text-xs text-white/70 leading-relaxed">
                    {msg.content}
                  </p>
                  <p className="text-[9px] text-white/20 mt-1">
                    {new Date(msg.created_at).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {userAnonymousId ? (
        <div className="border-t border-white/5 p-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type an anonymous message..."
              className="flex-1 px-3 py-2 text-xs bg-white/[0.03] border border-white/10 rounded-lg text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/30"
              maxLength={2000}
            />
            <Button
              size="sm"
              onClick={handleSend}
              disabled={sending || !newMessage.trim()}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {sending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Send className="h-3 w-3" />
              )}
            </Button>
          </div>
          <p className="text-[9px] text-white/15 mt-1">
            Messages are anonymous. PII is automatically stripped.
          </p>
        </div>
      ) : (
        <div className="border-t border-white/5 p-3 text-center">
          <p className="text-xs text-white/30">
            Join the collective to participate in discussions
          </p>
        </div>
      )}
    </div>
  );
}
