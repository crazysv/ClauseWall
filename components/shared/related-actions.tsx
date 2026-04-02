"use client";

import Link from "next/link";
import {
  MessageSquare,
  FileText,
  DoorOpen,
  BarChart3,
  Calculator,
  ArrowLeft,
  Map,
} from "lucide-react";

type PageId =
  | "negotiate"
  | "letter"
  | "escape"
  | "battle"
  | "simulate"
  | "statemachine"
  | "results";

interface RelatedActionsProps {
  documentId: string;
  currentPage: PageId;
}

const ALL_ACTIONS: Array<{
  key: string;
  label: string;
  description: string;
  href: (id: string) => string;
  icon: React.ReactNode;
  pages: PageId[];
}> = [
  {
    key: "negotiate",
    label: "Negotiate",
    description: "Get scripts to push back on risky clauses",
    href: (id) => `/negotiate/${id}`,
    icon: <MessageSquare className="w-4 h-4" />,
    pages: ["letter", "escape", "battle", "simulate", "statemachine"],
  },
  {
    key: "letter",
    label: "Legal Notice",
    description: "Generate a formal notice citing violations",
    href: (id) => `/letter/${id}`,
    icon: <FileText className="w-4 h-4" />,
    pages: ["negotiate", "escape", "battle", "statemachine"],
  },
  {
    key: "escape",
    label: "Escape Plan",
    description: "Step-by-step plan to exit this contract",
    href: (id) => `/escape/${id}`,
    icon: <DoorOpen className="w-4 h-4" />,
    pages: ["negotiate", "letter", "simulate", "statemachine"],
  },
  {
    key: "benchmark",
    label: "Benchmark",
    description: "Compare your contract to state averages",
    href: (id) => `/battle/${id}`,
    icon: <BarChart3 className="w-4 h-4" />,
    pages: ["negotiate", "letter", "escape", "simulate"],
  },
  {
    key: "costCalc",
    label: "Cost Calculator",
    description: "Project the financial impact over time",
    href: (id) => `/simulate/${id}`,
    icon: <Calculator className="w-4 h-4" />,
    pages: ["escape", "battle", "statemachine"],
  },
  {
    key: "trapDetector",
    label: "Trap Detector",
    description: "Find hidden trap paths in your contract",
    href: (id) => `/statemachine/${id}`,
    icon: <Map className="w-4 h-4" />,
    pages: ["escape", "simulate"],
  },
  {
    key: "results",
    label: "Back to Analysis",
    description: "Review the full clause breakdown",
    href: (id) => `/results/${id}`,
    icon: <ArrowLeft className="w-4 h-4" />,
    pages: [
      "negotiate",
      "letter",
      "escape",
      "battle",
      "simulate",
      "statemachine",
    ],
  },
];

export function RelatedActions({
  documentId,
  currentPage,
}: RelatedActionsProps) {
  const actions = ALL_ACTIONS.filter((action) =>
    action.pages.includes(currentPage)
  );

  if (actions.length === 0) return null;

  return (
    <div className="mt-8 pt-6 border-t border-white/5">
      <h4 className="text-[10px] font-medium text-slate-900 dark:text-slate-100 uppercase tracking-widest mb-3">
        Related Actions
      </h4>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Link
            key={action.key}
            href={action.href(documentId)}
            className="group inline-flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20 border-l-4 border-indigo-500 border border-white/5 hover:bg-white dark:bg-card/[0.05] hover:border-white/10 transition-all"
          >
            <span className="text-slate-900 dark:text-slate-100 group-hover:text-slate-900 dark:text-slate-100 transition-colors">
              {action.icon}
            </span>
            <div>
              <p className="text-[11px] font-medium text-slate-900 dark:text-slate-100 group-hover:text-slate-900 dark:text-slate-100 transition-colors">
                {action.label}
              </p>
              <p className="text-[9px] text-slate-900 dark:text-slate-100 hidden sm:block">
                {action.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
