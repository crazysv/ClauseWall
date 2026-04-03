"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Dna,
  Scan,
  Swords,
  FileText,
  Image,
  Video,
  Link2,
  Download,
  BarChart3,
  Flame,
  ChevronRight,
  ChevronDown,
  Search,
  Zap,
  Share2,
  DoorOpen,
  Gamepad2,
  Users,
  Wrench,
  Calculator,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { generateReport } from "@/lib/pdf/report-generator";
import type { Document, Clause } from "@/types";

interface Props {
  document: Document;
  clauses: Clause[];
  onOpenDNA: () => void;
  onOpenXRay: () => void;
  onOpenScoreCard: () => void;
  onOpenVideoCard: () => void;
  isRoastMode: boolean;
  roastLoading: boolean;
  onToggleRoast: () => void;
}

interface ActionItem {
  id: string;
  label: string;
  icon: typeof Menu;
  color: string;
  bg: string;
}

interface ActionGroup {
  id: string;
  label: string;
  subtitle: string;
  icon: typeof Menu;
  color: string;
  bg: string;
  actions: ActionItem[];
}

const ACTION_GROUPS: ActionGroup[] = [
  {
    id: "inspect",
    label: "Inspect",
    subtitle: "Visualize and verify",
    icon: Search,
    color: "#A855F7",
    bg: "rgba(168, 85, 247, 0.15)",
    actions: [
      {
        id: "dna",
        label: "Contract Personality",
        icon: Dna,
        color: "#A855F7",
        bg: "rgba(168, 85, 247, 0.15)",
      },
      {
        id: "xray",
        label: "Deep Scan View",
        icon: Scan,
        color: "#8B5CF6",
        bg: "rgba(139, 92, 246, 0.15)",
      },
      {
        id: "battle",
        label: "Benchmark",
        icon: BarChart3,
        color: "#F97316",
        bg: "rgba(249, 115, 22, 0.15)",
      },
      {
        id: "simulate",
        label: "Cost Calculator",
        icon: Gamepad2,
        color: "#06B6D4",
        bg: "rgba(6, 182, 212, 0.15)",
      },
      {
        id: "ruin-calculator",
        label: "Financial Risk",
        icon: Calculator,
        color: "#EF4444",
        bg: "rgba(239, 68, 68, 0.15)",
      },
      {
        id: "collaborate",
        label: "Review Room",
        icon: Users,
        color: "#3B82F6",
        bg: "rgba(59, 130, 246, 0.15)",
      },
    ],
  },
  {
    id: "action",
    label: "Take Action",
    subtitle: "Negotiate, dispute, or exit",
    icon: Zap,
    color: "#EC4899",
    bg: "rgba(236, 72, 153, 0.15)",
    actions: [
      {
        id: "playbook",
        label: "Negotiation",
        icon: Swords,
        color: "#EC4899",
        bg: "rgba(236, 72, 153, 0.15)",
      },
      {
        id: "notice",
        label: "Legal Notice",
        icon: FileText,
        color: "#3B82F6",
        bg: "rgba(59, 130, 246, 0.15)",
      },
      {
        id: "escape",
        label: "Escape Plan",
        icon: DoorOpen,
        color: "#F97316",
        bg: "rgba(249, 115, 22, 0.15)",
      },
      {
        id: "legal-help",
        label: "Legal Authority",
        icon: Building2,
        color: "#8B5CF6",
        bg: "rgba(139, 92, 246, 0.15)",
      },

    ],
  },
  {
    id: "share",
    label: "Share & Export",
    subtitle: "Share your results",
    icon: Share2,
    color: "#10B981",
    bg: "rgba(16, 185, 129, 0.15)",
    actions: [
      {
        id: "scorecard",
        label: "Score Card",
        icon: Image,
        color: "#10B981",
        bg: "rgba(16, 185, 129, 0.15)",
      },
      {
        id: "video",
        label: "Video Card",
        icon: Video,
        color: "#F59E0B",
        bg: "rgba(245, 158, 11, 0.15)",
      },
      {
        id: "link",
        label: "Copy Link",
        icon: Link2,
        color: "#06B6D4",
        bg: "rgba(6, 182, 212, 0.15)",
      },
      {
        id: "pdf",
        label: "Download PDF",
        icon: Download,
        color: "#EF4444",
        bg: "rgba(239, 68, 68, 0.15)",
      },
    ],
  },
];

export default function FloatingActions({
  document: doc,
  clauses,
  onOpenDNA,
  onOpenXRay,
  onOpenScoreCard,
  onOpenVideoCard,
  isRoastMode,
  roastLoading,
  onToggleRoast,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const router = useRouter();

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        setExpandedGroup(null);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  const handleBackdropClick = () => {
    if (isOpen) {
      setIsOpen(false);
      setExpandedGroup(null);
    }
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroup((prev) => (prev === groupId ? null : groupId));
  };

  const handleAction = async (actionId: string) => {
    switch (actionId) {
      case "collaborate":
        setIsOpen(false);
        setExpandedGroup(null);
        // Emit event — parent will handle
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("clausewall:collaborate"));
        }
        break;

      case "dna":
        onOpenDNA();
        setIsOpen(false);
        setExpandedGroup(null);
        break;

      case "battle":
        router.push(`/battle/${doc.id}`);
        setIsOpen(false);
        setExpandedGroup(null);
        break;

      case "simulate":
        router.push(`/simulate/${doc.id}`);
        setIsOpen(false);
        setExpandedGroup(null);
        break;

      case "ruin-calculator":
        router.push(`/ruin-calculator/${doc.id}`);
        setIsOpen(false);
        setExpandedGroup(null);
        break;

      case "escape":
        router.push(`/escape/${doc.id}`);
        setIsOpen(false);
        setExpandedGroup(null);
        break;

      case "legal-help":
        window.document.getElementById("authority-section-cta")?.scrollIntoView({ behavior: "smooth", block: "center" });
        setIsOpen(false);
        setExpandedGroup(null);
        break;

      case "xray":
        onOpenXRay();
        setIsOpen(false);
        setExpandedGroup(null);
        break;

      case "playbook":
        router.push(`/negotiate/${doc.id}`);
        setIsOpen(false);
        setExpandedGroup(null);
        break;

      case "notice":
        router.push(`/letter/${doc.id}`);
        setIsOpen(false);
        setExpandedGroup(null);
        break;

      case "scorecard":
        onOpenScoreCard();
        setIsOpen(false);
        setExpandedGroup(null);
        break;

      case "video":
        onOpenVideoCard();
        setIsOpen(false);
        setExpandedGroup(null);
        break;

      case "roast":
        onToggleRoast();
        break;

      case "link":
        const url = `${window.location.origin}/results/${doc.id}`;
        await navigator.clipboard.writeText(url);
        toast.success("Results link copied!");
        setIsOpen(false);
        setExpandedGroup(null);
        break;

      case "pdf":
        setDownloading(true);
        try {
          await generateReport(doc, clauses);
          toast.success("PDF report downloaded!");
        } catch (error) {
          toast.error("Failed to generate PDF");
          console.error(error);
        }
        setDownloading(false);
        setIsOpen(false);
        setExpandedGroup(null);
        break;
    }
  };

  const getActionLabel = (actionId: string, defaultLabel: string): string => {
    if (actionId === "pdf" && downloading) return "Generating...";
    return defaultLabel;
  };

  return (
    <>
      {/* ══════════════════════════════════════════════════════════ */}
      {/* DESKTOP: Left floating sidebar with grouped categories    */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div className="hidden md:flex fixed left-0 top-0 bottom-0 z-40 items-center pointer-events-none">
        <div className="pointer-events-auto">
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="panel"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                className="ml-3 card-impact bg-background p-2 flex flex-col gap-1 min-w-[200px]"
              >
                {/* Close button */}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setExpandedGroup(null);
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-none text-muted-foreground hover:text-foreground hover:bg-muted transition-all uppercase tracking-wider font-bold"
                >
                  <X className="h-5 w-5" />
                  <span className="text-sm font-black">Close</span>
                </button>

                <div className="border-t-2 border-foreground mx-2 my-1" />

                {/* Grouped Actions */}
                {ACTION_GROUPS.map((group, groupIndex) => {
                  const GroupIcon = group.icon;
                  const isExpanded = expandedGroup === group.id;

                  return (
                    <div key={group.id}>
                      {/* Group Header */}
                        <button
                          key={group.id}
                          onClick={() => toggleGroup(group.id)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-none text-muted-foreground hover:text-foreground hover:bg-muted transition-all ${
                            isExpanded ? "bg-muted" : ""
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="p-1.5 border-2 border-foreground bg-background"
                            >
                              <GroupIcon
                                className="h-4 w-4 text-foreground"
                              />
                            </div>
                            <div className="flex flex-col items-start gap-0">
                              <span className="text-sm font-black uppercase tracking-wider text-foreground">{group.label}</span>
                              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wide">{group.subtitle}</p>
                            </div>
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-foreground" />
                          )}
                        </button>

                      {/* Expanded Actions */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="pl-4 pr-2 py-1 space-y-0.5">
                              {group.actions.map((action, actionIndex) => {
                                const ActionIcon = action.icon;
                                const isDisabled =
                                  action.id === "pdf" && downloading;
                                const label = getActionLabel(
                                  action.id,
                                  action.label
                                );

                                return (
                                  <button
                                    key={action.id}
                                    onClick={() => handleAction(action.id)}
                                    disabled={isDisabled}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-none hover:bg-muted hover:text-foreground transition-all disabled:opacity-50 text-muted-foreground font-bold tracking-wider uppercase border-l-2 border-transparent hover:border-foreground"
                                  >
                                    <ActionIcon
                                      className="h-4 w-4 flex-shrink-0"
                                    />
                                    <span className="text-xs whitespace-nowrap">
                                      {label}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}

                {/* Divider before Roast Mode */}
                <div className="h-px bg-gray-700/50 mx-2 my-1" />

                {/* Roast Mode Toggle — Always visible */}
                <button
                  onClick={() => handleAction("roast")}
                  disabled={roastLoading}
                  className={`flex items-center justify-between px-3 py-3 rounded-none transition-all border-2 ${
                    roastLoading ? "animate-pulse" : ""
                  } ${
                    isRoastMode
                      ? "bg-orange-100 border-orange-600 dark:bg-orange-950"
                      : "bg-muted border-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-1.5 border-2 ${
                        isRoastMode
                          ? "bg-orange-200 border-orange-600 dark:bg-orange-900"
                          : "bg-background border-foreground"
                      }`}
                    >
                      <Flame
                        className={`h-4 w-4 ${
                          isRoastMode ? "text-orange-600 animate-bounce" : "text-foreground"
                        }`}
                      />
                    </div>
                    <span
                      className={`text-sm font-black uppercase tracking-wider ${
                        isRoastMode ? "text-orange-800 dark:text-orange-200" : "text-foreground"
                      }`}
                    >
                      {roastLoading
                        ? "Roasting..."
                        : isRoastMode
                          ? "Roast ON"
                          : "Roast Mode"}
                    </span>
                  </div>

                  {/* Toggle Indicator */}
                  <div
                    className={`w-10 h-5 border-2 transition-colors relative ${
                      isRoastMode ? "bg-orange-500 border-orange-800" : "bg-muted border-foreground"
                    }`}
                  >
                    <div
                      className={`absolute top-0 w-4 h-[16px] bg-foreground transition-all ${
                        isRoastMode ? "left-5" : "left-0"
                      }`}
                    />
                  </div>
                </button>

                {/* Roast Mode subtitle */}
                <p className="text-[10px] text-white/20 px-3 pb-1">Fun mode — roasts your contract</p>
              </motion.div>
            ) : (
              <motion.button
                key="toggle"
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -10, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                onClick={() => setIsOpen(true)}
                className="ml-3 flex flex-col items-center gap-1 w-16 py-3 rounded-xl bg-gray-900/90 backdrop-blur-md border border-gray-700/50 text-gray-400 hover:text-white hover:bg-gray-800/90 hover:border-gray-600/50 transition-all shadow-lg"
              >
                {isRoastMode ? (
                  <Flame className="h-5 w-5 text-orange-400 animate-bounce" />
                ) : (
                  <Wrench className="h-5 w-5" />
                )}
                <span className="text-[10px] font-medium text-white/50">Tools</span>
                <span className="text-[9px] text-white/30">
                  ({ACTION_GROUPS.reduce((sum, g) => sum + g.actions.length, 0)})
                </span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Backdrop for desktop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="hidden md:block fixed inset-0 z-30"
            onClick={handleBackdropClick}
          />
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* MOBILE: Bottom sheet with sections                        */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40">
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 z-40"
                onClick={handleBackdropClick}
              />

              {/* Bottom panel */}
              <motion.div
                initial={{ y: 400 }}
                animate={{ y: 0 }}
                exit={{ y: 400 }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                className="relative z-50 bg-gray-900/98 backdrop-blur-xl border-t border-gray-700/50 rounded-t-2xl shadow-2xl p-4 pb-8 max-h-[80vh] overflow-y-auto"
              >
                {/* Handle */}
                <div className="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-4" />

                {/* Grouped Sections */}
                <div className="space-y-4">
                  {ACTION_GROUPS.map((group) => {
                    const GroupIcon = group.icon;

                    return (
                      <div key={group.id}>
                        {/* Section Header */}
                        <div className="flex items-center gap-2 mb-2 px-1">
                          <GroupIcon
                            className="h-4 w-4"
                            style={{ color: group.color }}
                          />
                          <span
                            className="text-xs font-semibold uppercase tracking-wider"
                            style={{ color: group.color }}
                          >
                            {group.label}
                          </span>
                        </div>

                        {/* Action Grid */}
                        <div className="grid grid-cols-4 gap-2">
                          {group.actions.map((action) => {
                            const ActionIcon = action.icon;
                            const isDisabled =
                              action.id === "pdf" && downloading;
                            const label = getActionLabel(
                              action.id,
                              action.label
                            );

                            return (
                              <button
                                key={action.id}
                                onClick={() => handleAction(action.id)}
                                disabled={isDisabled}
                                className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-colors disabled:opacity-50"
                                style={{ backgroundColor: action.bg }}
                              >
                                <ActionIcon
                                  className="h-5 w-5"
                                  style={{ color: action.color }}
                                />
                                <span className="text-[10px] text-gray-300 font-medium text-center leading-tight">
                                  {label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {/* Roast Mode — Full Width Toggle */}
                  <div className="pt-2">
                    <button
                      onClick={() => handleAction("roast")}
                      disabled={roastLoading}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                        roastLoading ? "animate-pulse" : ""
                      } ${
                        isRoastMode
                          ? "bg-orange-500/20 border border-orange-500/30"
                          : "bg-orange-500/10 border border-orange-500/20"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Flame
                          className={`h-5 w-5 text-orange-400 ${
                            isRoastMode ? "animate-bounce" : ""
                          }`}
                        />
                        <span
                          className={`text-sm font-medium ${
                            isRoastMode ? "text-orange-300" : "text-gray-300"
                          }`}
                        >
                          {roastLoading
                            ? "Generating Roasts..."
                            : isRoastMode
                              ? "Roast Mode ON 🔥"
                              : "Roast Mode"}
                        </span>
                      </div>

                      {/* Toggle */}
                      <div
                        className={`w-10 h-5 rounded-full relative transition-colors ${
                          isRoastMode ? "bg-orange-500" : "bg-gray-600"
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                            isRoastMode ? "left-5" : "left-0.5"
                          }`}
                        />
                      </div>
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Mobile toggle button */}
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="flex justify-center pb-6 pt-2"
            >
              <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gray-900/90 backdrop-blur-md border border-gray-700/50 text-gray-300 hover:text-white hover:bg-gray-800/90 transition-all shadow-lg"
              >
                {isRoastMode ? (
                  <Flame className="h-4 w-4 text-orange-400 animate-bounce" />
                ) : (
                  <Menu className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">
                  {isRoastMode ? "Tools 🔥" : `Tools (${ACTION_GROUPS.reduce((sum, g) => sum + g.actions.length, 0)})`}
                </span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}