"use client";

import type { CollabParticipant } from "@/types";

interface PresenceBarProps {
  participants: CollabParticipant[];
  currentUserId: string;
  roomCode: string;
}

export default function PresenceBar({
  participants,
  currentUserId,
  roomCode,
}: PresenceBarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 bg-background border-b-4 border-foreground z-30 relative shadow-[0px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex items-center gap-3">
        {/* Avatar Stack */}
        <div className="flex -space-x-2">
          {participants.slice(0, 6).map((p, i) => (
            <div
              key={p.user_id}
              className="relative w-7 h-7 rounded-full border-2 border-foreground border-2 flex items-center justify-center text-[10px] font-bold text-foreground"
              style={{ backgroundColor: p.user_color, zIndex: 10 - i }}
              title={p.user_name}
            >
              {p.user_name.charAt(0).toUpperCase()}
              {p.user_id === currentUserId && (
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border border-foreground border-2" />
              )}
            </div>
          ))}
          {participants.length > 6 && (
            <div className="w-7 h-7 rounded-full border-2 border-foreground border-2 bg-gray-700 flex items-center justify-center text-[10px] text-muted-foreground">
              +{participants.length - 6}
            </div>
          )}
        </div>

        {/* Count */}
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-muted-foreground">
            {participants.length}{" "}
            {participants.length === 1 ? "person" : "people"} viewing
          </span>
        </div>
      </div>

      {/* Room Code */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground">Room</span>
        <span className="text-xs font-mono font-bold text-blue-400">
          {roomCode}
        </span>
      </div>
    </div>
  );
}
