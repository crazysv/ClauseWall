"use client";

import { useState, useEffect } from "react";
import { Clock, AlertTriangle } from "lucide-react";
import type { EscalationDeadline } from "@/types/authority";

interface Props {
  deadline: EscalationDeadline;
  compact?: boolean;
}

export default function EscalationCountdown({ deadline, compact = false }: Props) {
  const [daysRemaining, setDaysRemaining] = useState(deadline.days_remaining);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const target = new Date(deadline.deadline_date);
      const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      setDaysRemaining(diff);
    }, 60000);
    return () => clearInterval(timer);
  }, [deadline.deadline_date]);

  const isUrgent = daysRemaining <= 3 && daysRemaining > 0;
  const isOverdue = daysRemaining < 0;

  const bgColor = isOverdue ? "bg-red-500/15" : isUrgent ? "bg-amber-500/15" : "bg-blue-500/15";
  const textColor = isOverdue ? "text-red-400" : isUrgent ? "text-amber-400" : "text-blue-400";

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${bgColor} ${compact ? "" : "min-w-[180px]"}`}>
      {isOverdue ? (
        <AlertTriangle className={`h-4 w-4 ${textColor}`} />
      ) : (
        <Clock className={`h-4 w-4 ${textColor}`} />
      )}
      <div>
        <p className={`text-xs font-bold ${textColor}`}>
          {isOverdue
            ? `${Math.abs(daysRemaining)} days OVERDUE`
            : daysRemaining === 0
            ? "Due TODAY"
            : `${daysRemaining} days left`}
        </p>
        {!compact && (
          <p className="text-[10px] text-muted-foreground">{deadline.action}</p>
        )}
      </div>
    </div>
  );
}
