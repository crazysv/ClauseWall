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
    icon: <MessageSquare className="w-3.5 h-3.5" />,
    pages: ["letter", "escape", "battle", "simulate", "statemachine"],
  },
  {
    key: "letter",
    label: "Legal Notice",
    description: "Generate a formal notice citing violations",
    href: (id) => `/letter/${id}`,
    icon: <FileText className="w-3.5 h-3.5" />,
    pages: ["negotiate", "escape", "battle", "statemachine"],
  },
  {
    key: "escape",
    label: "Escape Plan",
    description: "Step-by-step plan to exit this contract",
    href: (id) => `/escape/${id}`,
    icon: <DoorOpen className="w-3.5 h-3.5" />,
    pages: ["negotiate", "letter", "simulate", "statemachine"],
  },
  {
    key: "benchmark",
    label: "Benchmark",
    description: "Compare your contract to state averages",
    href: (id) => `/battle/${id}`,
    icon: <BarChart3 className="w-3.5 h-3.5" />,
    pages: ["negotiate", "letter", "escape", "simulate"],
  },
  {
    key: "costCalc",
    label: "Cost Calculator",
    description: "Project the financial impact over time",
    href: (id) => `/simulate/${id}`,
    icon: <Calculator className="w-3.5 h-3.5" />,
    pages: ["escape", "battle", "statemachine"],
  },
  {
    key: "trapDetector",
    label: "Trap Detector",
    description: "Find hidden trap paths in your contract",
    href: (id) => `/statemachine/${id}`,
    icon: <Map className="w-3.5 h-3.5" />,
    pages: ["escape", "simulate"],
  },
  {
    key: "results",
    label: "Back to Analysis",
    description: "Review the full clause breakdown",
    href: (id) => `/results/${id}`,
    icon: <ArrowLeft className="w-3.5 h-3.5" />,
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
    action.pages.includes(currentPage),
  );

  if (actions.length === 0) return null;

  return (
    <div className="mt-8 pt-6 border-t border-neutral-900">
      <h4 className="text-[9px] font-mono uppercase tracking-widest text-neutral-600 mb-4">
        RELATED_ACTIONS
      </h4>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Link
            key={action.key}
            href={action.href(documentId)}
            className="group inline-flex items-center gap-2.5 px-3 py-2 bg-[#050505] border border-neutral-800 hover:border-neutral-600 transition-colors"
          >
            <span className="text-neutral-600 group-hover:text-neutral-300 transition-colors">
              {action.icon}
            </span>
            <div>
              <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 group-hover:text-neutral-200 transition-colors">
                {action.label}
              </p>
              <p className="text-[8px] font-mono text-neutral-700 hidden sm:block">
                {action.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
