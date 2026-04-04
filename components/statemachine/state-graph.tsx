"use client";

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn, ZoomOut, Maximize2, Play, RotateCcw, Undo2 } from "lucide-react";
import type {
  ContractStateMachine,
  ContractState,
  StateTransition,
  StateMachineReport,
  StatePath,
  NodePosition,
  StateType,
} from "@/lib/statemachine/types";

// ============================================
// PROPS & CONFIG
// ============================================

interface StateGraphProps {
  stateMachine: ContractStateMachine;
  report: StateMachineReport;
  mode: "explore" | "simulate" | "path";
  selectedPath?: StatePath;
  onStateClick?: (state: ContractState) => void;
  onTransitionClick?: (transition: StateTransition) => void;
  className?: string;
}

const NODE_W = 200;
const NODE_H = 80;
const H_SPACE = 280;
const V_SPACE = 130;
const PAD = 80;

// ============================================
// COLOR MAP
// ============================================

const STATE_COLORS: Record<StateType, { fill: string; stroke: string }> = {
  initial:          { fill: "#000000", stroke: "#eab308" }, // black filled, yellow stroke
  normal:           { fill: "#ffffff", stroke: "#000000" }, // white filled
  restricted:       { fill: "#000000", stroke: "#000000" },
  dangerous:        { fill: "#facc15", stroke: "#000000" }, // yellow filled
  trap:             { fill: "#ef4444", stroke: "#000000" }, // red filled
  absorbing_trap:   { fill: "#b91c1c", stroke: "#000000" }, // dark red
  terminal_safe:    { fill: "#22c55e", stroke: "#000000" }, // green
  terminal_warning: { fill: "#f59e0b", stroke: "#000000" },
  terminal_loss:    { fill: "#ef4444", stroke: "#000000" },
};

const STATE_ICONS: Record<StateType, string> = {
  initial: "▶",
  normal: "●",
  restricted: "🔒",
  dangerous: "⚠️",
  trap: "🪤",
  absorbing_trap: "💀",
  terminal_safe: "✅",
  terminal_warning: "⚠️",
  terminal_loss: "❌",
};

// ============================================
// LAYOUT ALGORITHM
// ============================================

function calculateLayout(sm: ContractStateMachine): Map<string, NodePosition> {
  const positions = new Map<string, NodePosition>();
  const layers: string[][] = [];
  const visited = new Set<string>();

  // Build adjacency list
  const adj = new Map<string, string[]>();
  for (const s of sm.states) adj.set(s.id, []);
  for (const t of sm.transitions) {
    const a = adj.get(t.fromStateId);
    if (a && !a.includes(t.toStateId)) a.push(t.toStateId);
  }

  // BFS from initial state to assign layers
  const queue: Array<{ id: string; depth: number }> = [
    { id: sm.initialStateId, depth: 0 },
  ];
  visited.add(sm.initialStateId);

  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    while (layers.length <= depth) layers.push([]);
    layers[depth].push(id);

    const neighbors = adj.get(id) || [];
    for (const n of neighbors) {
      if (!visited.has(n)) {
        visited.add(n);
        queue.push({ id: n, depth: depth + 1 });
      }
    }
  }

  // Add any unvisited states (disconnected components)
  for (const s of sm.states) {
    if (!visited.has(s.id)) {
      const lastLayerIdx = Math.max(layers.length - 1, 0);
      while (layers.length <= lastLayerIdx) layers.push([]);
      layers[lastLayerIdx].push(s.id);
    }
  }

  // Find tallest layer for centering
  const maxLayerHeight = Math.max(...layers.map((l) => l.length));

  // Assign positions
  for (let layer = 0; layer < layers.length; layer++) {
    const layerStates = layers[layer];
    const layerHeight = layerStates.length;
    const yOffset = ((maxLayerHeight - layerHeight) * V_SPACE) / 2;

    for (let idx = 0; idx < layerStates.length; idx++) {
      positions.set(layerStates[idx], {
        x: layer * H_SPACE + PAD,
        y: idx * V_SPACE + yOffset + PAD,
        layer,
        indexInLayer: idx,
      });
    }
  }

  return positions;
}

// ============================================
// EDGE BEZIER PATH GENERATOR
// ============================================

function getEdgePath(
  from: NodePosition,
  to: NodePosition,
  isSameLayer: boolean,
  isBackEdge: boolean
): string {
  const fx = from.x + NODE_W;
  const fy = from.y + NODE_H / 2;
  const tx = to.x;
  const ty = to.y + NODE_H / 2;

  if (isSameLayer) {
    // Same layer — arc above or below
    const midX = (from.x + to.x + NODE_W) / 2;
    const direction = from.indexInLayer < to.indexInLayer ? 1 : -1;
    const offset = 60 * direction;
    return `M ${fx} ${fy} C ${midX - 80} ${fy + offset}, ${midX - 80} ${ty + offset}, ${tx} ${ty}`;
  }

  if (isBackEdge) {
    // Back edge — arc above all nodes
    const arcY = Math.min(fy, ty) - 100;
    return `M ${fx} ${fy} C ${fx + 60} ${arcY}, ${tx - 60} ${arcY}, ${tx} ${ty}`;
  }

  // Forward edge — gentle S-curve
  const cx1 = fx + H_SPACE / 3;
  const cx2 = tx - H_SPACE / 3;
  return `M ${fx} ${fy} C ${cx1} ${fy}, ${cx2} ${ty}, ${tx} ${ty}`;
}

// ============================================
// TRUNCATE HELPER
// ============================================

function truncate(str: string, max: number): string {
  return str.length > max ? str.substring(0, max - 1) + "…" : str;
}

// ============================================
// MOBILE LIST VIEW
// ============================================

function MobileListView({
  stateMachine,
  report,
  onStateClick,
}: {
  stateMachine: ContractStateMachine;
  report: StateMachineReport;
  onStateClick?: (state: ContractState) => void;
}) {
  const positions = useMemo(() => calculateLayout(stateMachine), [stateMachine]);
  const sortedStates = useMemo(() => {
    return [...stateMachine.states].sort((a, b) => {
      const pa = positions.get(a.id);
      const pb = positions.get(b.id);
      if (!pa || !pb) return 0;
      return pa.layer - pb.layer || pa.indexInLayer - pb.indexInLayer;
    });
  }, [stateMachine.states, positions]);

  return (
    <div className="space-y-4 p-4">
      {sortedStates.map((state, idx) => {
        const colors = STATE_COLORS[state.type];
        const icon = STATE_ICONS[state.type];
        const isTrap = report.trapAnalysis.some((t) => t.stateId === state.id);
        const outgoing = stateMachine.transitions.filter((t) => t.fromStateId === state.id);

        return (
          <div key={state.id}>
            <button
              onClick={() => onStateClick?.(state)}
              className={`w-full text-left p-4 border-4 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] ${
                isTrap ? "border-red-600 bg-red-100" : "border-black bg-white"
              }`}
              style={{ borderLeftWidth: 8, borderLeftColor: colors.stroke !== "#000000" && colors.fill === "#000000" ? colors.stroke : colors.stroke === "#000000" && colors.fill !== "#ffffff" ? colors.fill : colors.stroke }}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg bg-gray-100 border-2 border-black p-1">{icon}</span>
                <span className="font-black uppercase tracking-widest text-black/90">{state.name}</span>
                <span
                  className="text-[10px] font-black uppercase tracking-widest px-2 py-1 ml-auto"
                  style={{ backgroundColor: colors.fill, color: colors.fill === "#ffffff" ? "#000000" : "#ffffff", border: `2px solid ${colors.stroke}` }}
                >
                  {state.type.replace(/_/g, " ")}
                </span>
              </div>
              <p className="text-xs font-bold text-black/70 mt-3 line-clamp-2">{state.description}</p>
              {state.financialImpact.amount && (
                <p className="text-xs font-black uppercase tracking-widest text-red-700 mt-2 bg-red-100 inline-block px-1 border-2 border-red-700">💰 {state.financialImpact.amount}</p>
              )}
            </button>

            {/* Show outgoing transitions */}
            {outgoing.length > 0 && idx < sortedStates.length - 1 && (
              <div className="pl-8 py-3 space-y-1">
                {outgoing.slice(0, 2).map((t) => (
                  <div key={t.id} className="flex items-center gap-2 text-xs font-bold text-black/60 uppercase tracking-widest">
                    <span className="text-black font-black">↓</span>
                    <span className="truncate">{t.trigger}</span>
                  </div>
                ))}
                {outgoing.length > 2 && (
                  <span className="text-[10px] font-black uppercase tracking-widest text-black/50">+{outgoing.length - 2} more</span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// DETAIL PANEL
// ============================================

function DetailPanel({
  state,
  transition,
  stateMachine,
  report,
  onClose,
}: {
  state?: ContractState | null;
  transition?: StateTransition | null;
  stateMachine: ContractStateMachine;
  report: StateMachineReport;
  onClose: () => void;
}) {
  if (!state && !transition) return null;

  if (state) {
    const colors = STATE_COLORS[state.type];
    const trap = report.trapAnalysis.find((t) => t.stateId === state.id);
    const incoming = stateMachine.transitions.filter((t) => t.toStateId === state.id);
    const outgoing = stateMachine.transitions.filter((t) => t.fromStateId === state.id);

    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="absolute right-0 top-0 bottom-0 w-[300px] sm:w-[350px] bg-white border-l-4 border-black overflow-y-auto z-20 shadow-[-8px_0_0_0_rgba(0,0,0,1)]"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b-4 border-black">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{STATE_ICONS[state.type]}</span>
              <h3 className="font-black uppercase tracking-widest text-black">{state.name}</h3>
            </div>
            <button onClick={onClose} className="p-2 border-2 border-black hover:bg-gray-200 hover:translate-y-0.5 shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-none transition-all">
              <X className="h-5 w-5 text-black" />
            </button>
          </div>

          <span
            className="text-[10px] font-black uppercase tracking-widest px-3 py-1"
            style={{ backgroundColor: colors.fill, color: colors.fill === "#ffffff" ? "#000000" : "#ffffff", border: `2px solid ${colors.stroke}` }}
          >
            {state.type.replace(/_/g, " ")}
          </span>

          <p className="text-sm font-bold text-black mt-5 leading-relaxed bg-gray-100 p-4 border-4 border-black">{state.description}</p>

          {state.duration && (
            <div className="mt-5 p-3 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
              <p className="text-[10px] font-black uppercase tracking-widest text-black/60">Duration</p>
              <p className="text-sm font-black text-black">{state.duration.value} {state.duration.unit}{state.duration.isFixed ? " (fixed)" : ""}</p>
            </div>
          )}

          {state.financialImpact.type !== "none" && (
            <div className="mt-4 p-3 bg-red-100 border-4 border-red-900 shadow-[4px_4px_0_0_rgba(127,29,29,1)]">
              <p className="text-[10px] font-black uppercase tracking-widest text-red-900">Financial Impact</p>
              <p className="text-sm font-black text-red-900">{state.financialImpact.amount || state.financialImpact.type}</p>
            </div>
          )}

          {state.legalIssues && state.legalIssues.length > 0 && (
            <div className="mt-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-black/60 mb-2">Legal Issues</p>
              {state.legalIssues.map((issue, i) => (
                <p key={i} className="text-xs font-bold text-black bg-blue-100 border-2 border-blue-900 px-2 py-1 mb-2 shadow-[2px_2px_0_0_rgba(30,58,138,1)]">⚖️ {issue}</p>
              ))}
            </div>
          )}

          {trap && (
            <div className="mt-5 p-4 bg-yellow-400 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
              <p className="text-xs font-black uppercase tracking-widest text-black mb-2">🪤 Trap State — {trap.severity.toUpperCase()}</p>
              <p className="text-xs font-bold text-black leading-relaxed">{trap.description.substring(0, 150)}</p>
            </div>
          )}

          {incoming.length > 0 && (
            <div className="mt-5 border-t-4 border-black pt-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-black/60 mb-2">Incoming ({incoming.length})</p>
              {incoming.slice(0, 5).map((t) => {
                const from = stateMachine.states.find((s) => s.id === t.fromStateId);
                return (
                  <p key={t.id} className="text-xs font-bold text-black mt-2 bg-gray-50 border-2 border-black p-2">
                    <span className="font-black text-black">← {from?.name || "Unknown"}</span><br/>
                    <span className="text-black/60 uppercase text-[10px]">{truncate(t.trigger, 40)}</span>
                  </p>
                );
              })}
            </div>
          )}

          {outgoing.length > 0 && (
            <div className="mt-5 border-t-4 border-black pt-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-black/60 mb-2">Outgoing ({outgoing.length})</p>
              {outgoing.slice(0, 5).map((t) => {
                const to = stateMachine.states.find((s) => s.id === t.toStateId);
                return (
                  <p key={t.id} className="text-xs font-bold text-black mt-2 bg-gray-50 border-2 border-black p-2">
                    <span className="font-black text-black">→ {to?.name || "Unknown"}</span><br/>
                    <span className="text-black/60 uppercase text-[10px]">{truncate(t.trigger, 40)}</span>
                  </p>
                );
              })}
            </div>
          )}

          {state.clauseReferences && state.clauseReferences.length > 0 && (
            <div className="mt-5 border-t-4 border-black pt-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-black/60 mb-2">Referenced Clauses</p>
              <div className="flex flex-wrap gap-2">
                {state.clauseReferences.map(ref => (
                  <span key={ref} className="text-xs font-black bg-white border-2 border-black px-2 py-1 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">{ref}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  if (transition) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="absolute right-0 top-0 bottom-0 w-[300px] sm:w-[350px] bg-white border-l-4 border-black overflow-y-auto z-20 shadow-[-8px_0_0_0_rgba(0,0,0,1)]"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b-4 border-black">
            <h3 className="font-black uppercase tracking-widest text-black">Transition Details</h3>
            <button onClick={onClose} className="p-2 border-2 border-black hover:bg-gray-200 hover:translate-y-0.5 shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-none transition-all">
              <X className="h-5 w-5 text-black" />
            </button>
          </div>

          <p className="text-sm font-bold text-black bg-gray-100 p-4 border-4 border-black mb-6 leading-relaxed">{transition.trigger}</p>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="p-3 bg-white border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
              <p className="text-[10px] font-black uppercase tracking-widest text-black/60">Type</p>
              <p className="text-xs font-black text-black">{transition.triggerType.replace(/_/g, " ")}</p>
            </div>
            <div className="p-3 bg-white border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
              <p className="text-[10px] font-black uppercase tracking-widest text-black/60">Party</p>
              <p className="text-xs font-black text-black">{transition.party}</p>
            </div>
            <div className="p-3 bg-white border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
              <p className="text-[10px] font-black uppercase tracking-widest text-black/60">Voluntary</p>
              <p className="text-xs font-black text-black">{transition.isVoluntary ? "Yes" : "No"}</p>
            </div>
            <div className="p-3 bg-white border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
              <p className="text-[10px] font-black uppercase tracking-widest text-black/60">Reversible</p>
              <p className="text-xs font-black text-black">{transition.isReversible ? "Yes" : "No"}</p>
            </div>
          </div>

          {transition.condition && (
            <div className="mt-6 pt-5 border-t-4 border-black">
              <p className="text-[10px] font-black uppercase tracking-widest text-black/60">Condition</p>
              <p className="text-xs font-bold text-black mt-2 bg-yellow-100 border-2 border-yellow-600 p-2 shadow-[2px_2px_0_0_rgba(202,138,4,1)]">{transition.condition}</p>
            </div>
          )}

          {transition.financialConsequence && (
            <div className="mt-5 p-3 bg-red-100 border-4 border-red-900 shadow-[4px_4px_0_0_rgba(127,29,29,1)]">
              <p className="text-[10px] font-black uppercase tracking-widest text-red-900 mb-1">Financial Impact</p>
              <p className="text-xs font-black text-red-900">💰 {transition.financialConsequence}</p>
            </div>
          )}

          {transition.clauseReference && (
            <div className="mt-5 border-t-4 border-black pt-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-black/60 mb-2">Clause Reference</p>
              <span className="text-xs font-black bg-white border-2 border-black px-2 py-1 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">{transition.clauseReference}</span>
            </div>
          )}

          <div className="mt-5 border-t-4 border-black pt-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-black/60 mb-2">Probability</p>
            <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] inline-block ${
              transition.probability === "certain" ? "bg-green-400 text-black" :
              transition.probability === "likely" ? "bg-blue-400 text-black" :
              transition.probability === "possible" ? "bg-yellow-400 text-black" :
              "bg-gray-200 text-black"
            }`}>
              {transition.probability}
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  return null;
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function StateGraph({
  stateMachine,
  report,
  mode,
  selectedPath,
  onStateClick,
  onTransitionClick,
  className = "",
}: StateGraphProps) {
  const [selectedStateId, setSelectedStateId] = useState<string | null>(null);
  const [selectedTransitionId, setSelectedTransitionId] = useState<string | null>(null);
  const [hoveredStateId, setHoveredStateId] = useState<string | null>(null);
  const [simulateCurrentId, setSimulateCurrentId] = useState(stateMachine.initialStateId);
  const [simulateHistory, setSimulateHistory] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [viewMode, setViewMode] = useState<"graph" | "list">("graph");
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Default to list on mobile
  useEffect(() => {
    if (isMobile) setViewMode("list");
  }, [isMobile]);

  // Layout
  const positions = useMemo(() => calculateLayout(stateMachine), [stateMachine]);

  // Path state IDs set for highlighting
  const pathStateSet = useMemo(() => {
    if (!selectedPath) return new Set<string>();
    return new Set(selectedPath.states);
  }, [selectedPath]);

  const pathTransSet = useMemo(() => {
    if (!selectedPath) return new Set<string>();
    return new Set(selectedPath.transitions);
  }, [selectedPath]);

  // SVG viewBox bounds
  const svgBounds = useMemo(() => {
    let maxX = 0;
    let maxY = 0;
    positions.forEach((pos) => {
      maxX = Math.max(maxX, pos.x + NODE_W);
      maxY = Math.max(maxY, pos.y + NODE_H);
    });
    return { width: maxX + PAD * 2, height: maxY + PAD * 2 };
  }, [positions]);

  // Handlers
  const handleStateClick = useCallback(
    (state: ContractState) => {
      if (mode === "simulate") {
        // In simulate mode, don't select — simulate is handled via transitions
        setSelectedStateId(state.id);
        setSelectedTransitionId(null);
        onStateClick?.(state);
        return;
      }
      setSelectedStateId((prev) => (prev === state.id ? null : state.id));
      setSelectedTransitionId(null);
      onStateClick?.(state);
    },
    [mode, onStateClick]
  );

  const handleTransitionClick = useCallback(
    (trans: StateTransition) => {
      if (mode === "simulate" && trans.fromStateId === simulateCurrentId) {
        // Simulate: move to next state
        setSimulateHistory((prev) => [...prev, simulateCurrentId]);
        setSimulateCurrentId(trans.toStateId);
        return;
      }
      setSelectedTransitionId((prev) => (prev === trans.id ? null : trans.id));
      setSelectedStateId(null);
      onTransitionClick?.(trans);
    },
    [mode, simulateCurrentId, onTransitionClick]
  );

  const handleSimUndo = useCallback(() => {
    if (simulateHistory.length === 0) return;
    const prev = simulateHistory[simulateHistory.length - 1];
    setSimulateHistory((h) => h.slice(0, -1));
    setSimulateCurrentId(prev);
  }, [simulateHistory]);

  const handleSimReset = useCallback(() => {
    setSimulateCurrentId(stateMachine.initialStateId);
    setSimulateHistory([]);
  }, [stateMachine.initialStateId]);

  const handleZoom = useCallback((delta: number) => {
    setZoom((z) => Math.max(0.3, Math.min(2.0, z + delta)));
  }, []);

  const handleFit = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Pan handlers
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    },
    [pan]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isPanning) return;
      setPan({
        x: panStart.current.panX + (e.clientX - panStart.current.x) / zoom,
        y: panStart.current.panY + (e.clientY - panStart.current.y) / zoom,
      });
    },
    [isPanning, zoom]
  );

  const handlePointerUp = useCallback(() => setIsPanning(false), []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      handleZoom(e.deltaY > 0 ? -0.1 : 0.1);
    },
    [handleZoom]
  );

  // Selected objects for panel
  const selectedState = selectedStateId
    ? stateMachine.states.find((s) => s.id === selectedStateId) || null
    : null;
  const selectedTransition = selectedTransitionId
    ? stateMachine.transitions.find((t) => t.id === selectedTransitionId) || null
    : null;

  // LIST VIEW toggle
  if (viewMode === "list") {
    return (
      <div className={`relative ${className}`}>
        <div className="flex items-center justify-between px-6 py-4 bg-gray-100 border-4 border-black mb-4">
          <span className="text-xs font-black uppercase tracking-widest text-black/60">{stateMachine.metadata.totalStates} states</span>
          <button
            onClick={() => setViewMode("graph")}
            className="text-xs font-black uppercase tracking-widest text-black hover:text-blue-700 bg-white border-2 border-black px-3 py-1 shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all hover:translate-y-0.5 hover:shadow-none"
          >
            Switch to Graph View
          </button>
        </div>
        <MobileListView
          stateMachine={stateMachine}
          report={report}
          onStateClick={onStateClick}
        />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-gray-100 border-4 border-black shadow-[inset_6px_6px_0_0_rgba(0,0,0,0.1)] ${className}`}>
      {/* TOOLBAR */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <button onClick={() => handleZoom(0.15)} className="p-2 bg-white hover:bg-yellow-400 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all text-black">
          <ZoomIn className="h-5 w-5" />
        </button>
        <button onClick={() => handleZoom(-0.15)} className="p-2 bg-white hover:bg-yellow-400 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all text-black">
          <ZoomOut className="h-5 w-5" />
        </button>
        <button onClick={handleFit} className="p-2 bg-white hover:bg-yellow-400 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all text-black">
          <Maximize2 className="h-5 w-5" />
        </button>
        <button
          onClick={() => setViewMode("list")}
          className="px-4 py-2 text-xs font-black uppercase tracking-widest text-black bg-white hover:bg-yellow-400 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all"
        >
          List
        </button>
      </div>

      {/* SIMULATE CONTROLS */}
      {mode === "simulate" && (
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button onClick={handleSimUndo} disabled={simulateHistory.length === 0} className="p-2 bg-white text-black hover:bg-yellow-400 disabled:bg-gray-200 disabled:text-gray-500 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] disabled:shadow-none disabled:translate-y-1 hover:translate-y-1 hover:shadow-none transition-all">
            <Undo2 className="h-5 w-5" />
          </button>
          <button onClick={handleSimReset} className="p-2 bg-white text-black hover:bg-yellow-400 hover:text-black border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all">
            <RotateCcw className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* SVG CANVAS */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${svgBounds.width} ${svgBounds.height}`}
        className="w-full"
        style={{ height: "100%", minHeight: 400, cursor: isPanning ? "grabbing" : "grab" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={handleWheel}
        role="img"
        aria-label={`Contract state machine graph with ${stateMachine.metadata.totalStates} states`}
      >
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" opacity="0.7" />
          </marker>
          <marker id="arrowhead-red" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" opacity="0.7" />
          </marker>
          <marker id="arrowhead-green" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#22c55e" opacity="0.7" />
          </marker>
        </defs>

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* EDGES */}
          {stateMachine.transitions.map((trans) => {
            const fromPos = positions.get(trans.fromStateId);
            const toPos = positions.get(trans.toStateId);
            if (!fromPos || !toPos) return null;

            const isSameLayer = fromPos.layer === toPos.layer;
            const isBackEdge = toPos.layer < fromPos.layer || (isSameLayer && trans.toStateId !== trans.fromStateId && fromPos.layer === toPos.layer);
            const isOnPath = mode === "path" && pathTransSet.has(trans.id);
            const isHighlighted = trans.id === selectedTransitionId || trans.id === hoveredStateId;
            const isSimAvailable = mode === "simulate" && trans.fromStateId === simulateCurrentId;

            const edgePath = getEdgePath(fromPos, toPos, isSameLayer, isBackEdge);
            const hasFinancialConsequence = !!trans.financialConsequence;

            let strokeColor = "#64748b50";
            let markerEnd = "url(#arrowhead)";
            if (hasFinancialConsequence) {
              strokeColor = "#ef444450";
              markerEnd = "url(#arrowhead-red)";
            }
            if (isOnPath) {
              strokeColor = "#22c55e";
              markerEnd = "url(#arrowhead-green)";
            }
            if (isSimAvailable) {
              strokeColor = "#3b82f6";
            }

            const opacity = mode === "path" && !isOnPath ? 0.12 : isHighlighted ? 1 : 0.6;
            const strokeDash = trans.triggerType === "automatic" ? "6,4" : undefined;

            // Midpoint for label
            const midX = (fromPos.x + NODE_W + toPos.x) / 2;
            const midY = (fromPos.y + NODE_H / 2 + toPos.y + NODE_H / 2) / 2;

            return (
              <g key={trans.id}>
                <path
                  d={edgePath}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={isOnPath || isHighlighted || isSimAvailable ? 2.5 : 1.5}
                  strokeDasharray={strokeDash}
                  opacity={opacity}
                  markerEnd={markerEnd}
                  className="transition-all duration-300 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTransitionClick(trans);
                  }}
                />

                {/* Edge label — show on hover or if highlighted */}
                {(isHighlighted || isOnPath || isSimAvailable) && (
                  <g>
                    <rect
                      x={midX - 60}
                      y={midY - 10 - (isSameLayer || isBackEdge ? 20 : 0)}
                      width={120}
                      height={18}
                      rx={4}
                      fill="#0f172a"
                      fillOpacity={0.9}
                      stroke="#334155"
                      strokeWidth={0.5}
                    />
                    <text
                      x={midX}
                      y={midY + 2 - (isSameLayer || isBackEdge ? 20 : 0)}
                      textAnchor="middle"
                      fontSize={9}
                      fill="#94a3b8"
                      className="pointer-events-none select-none"
                    >
                      {truncate(trans.trigger, 22)}
                    </text>
                  </g>
                )}

                {/* Simulate click target highlight */}
                {isSimAvailable && (
                  <text
                    x={midX}
                    y={midY + 18}
                    textAnchor="middle"
                    fontSize={8}
                    fill="#3b82f6"
                    className="pointer-events-none animate-pulse"
                  >
                    Click to move →
                  </text>
                )}
              </g>
            );
          })}

          {/* STATE NODES */}
          {stateMachine.states.map((state) => {
            const pos = positions.get(state.id);
            if (!pos) return null;

            const colors = STATE_COLORS[state.type];
            const icon = STATE_ICONS[state.type];
            const isSelected = state.id === selectedStateId;
            const isHovered = state.id === hoveredStateId;
            const isOnPath = mode === "path" && pathStateSet.has(state.id);
            const isSimActive = mode === "simulate" && state.id === simulateCurrentId;
            const isTrap = state.isTrap;

            const opacity = mode === "path" && !isOnPath ? 0.25 : 1;

            // Subtitle: duration or financial impact
            let subtitle = "";
            if (state.duration) subtitle = `${state.duration.value} ${state.duration.unit}`;
            else if (state.financialImpact.amount) subtitle = state.financialImpact.amount;

            return (
              <motion.g
                key={state.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity, scale: 1 }}
                transition={{ delay: (pos.layer * 0.08) + (pos.indexInLayer * 0.04), duration: 0.3 }}
              >
                {/* Shadow */}
                <rect
                  x={pos.x + 8}
                  y={pos.y + 8}
                  width={NODE_W}
                  height={NODE_H}
                  rx={0}
                  fill="black"
                  className="pointer-events-none"
                />

                {/* Trap pulse background */}
                {isTrap && (
                  <rect
                    x={pos.x - 6}
                    y={pos.y - 6}
                    width={NODE_W + 12}
                    height={NODE_H + 12}
                    fill="none"
                    stroke={colors.fill}
                    strokeWidth={4}
                    opacity={0.3}
                    className="animate-pulse pointer-events-none"
                  />
                )}

                {/* Simulate active border */}
                {isSimActive && (
                  <rect
                    x={pos.x - 6}
                    y={pos.y - 6}
                    width={NODE_W + 12}
                    height={NODE_H + 12}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth={6}
                    className="animate-pulse pointer-events-none"
                  />
                )}

                {/* Node background */}
                <rect
                  x={pos.x}
                  y={pos.y}
                  width={NODE_W}
                  height={NODE_H}
                  rx={0}
                  fill={colors.fill}
                  stroke={colors.stroke === "#000000" && colors.fill === "#000000" ? "#ffffff" : colors.stroke}
                  strokeWidth={isSelected ? 6 : 4}
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredStateId(state.id)}
                  onMouseLeave={() => setHoveredStateId(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStateClick(state);
                  }}
                  role="button"
                  aria-label={`${state.name}, ${state.type.replace(/_/g, " ")} state`}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleStateClick(state);
                  }}
                />

                {/* Type icon box */}
                <rect
                  x={pos.x}
                  y={pos.y}
                  width={NODE_H}
                  height={NODE_H}
                  fill="white"
                  stroke={colors.stroke === "#000000" && colors.fill === "#000000" ? "#ffffff" : colors.stroke}
                  strokeWidth={4}
                  className="pointer-events-none"
                />
                
                <text
                  x={pos.x + NODE_H / 2}
                  y={pos.y + NODE_H / 2 + 8}
                  textAnchor="middle"
                  fontSize={24}
                  className="pointer-events-none select-none"
                >
                  {icon}
                </text>

                {/* State name */}
                <text
                  x={pos.x + NODE_H + (NODE_W - NODE_H) / 2}
                  y={pos.y + (subtitle ? 35 : 45)}
                  textAnchor="middle"
                  fontSize={14}
                  fontFamily="sans-serif"
                  fontWeight={900}
                  fill={colors.fill === "#ffffff" ? "#000000" : "#ffffff"}
                  className="uppercase tracking-wider pointer-events-none select-none"
                >
                  {truncate(state.name, 12)}
                </text>

                {/* Subtitle */}
                {subtitle && (
                  <text
                    x={pos.x + NODE_H + (NODE_W - NODE_H) / 2}
                    y={pos.y + 55}
                    textAnchor="middle"
                    fontSize={11}
                    fontWeight={700}
                    fill={colors.fill === "#ffffff" ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.7)"}
                    className="pointer-events-none select-none uppercase tracking-widest"
                  >
                    {truncate(subtitle, 15)}
                  </text>
                )}

                {/* Sim active label */}
                {isSimActive && (
                  <g className="pointer-events-none">
                    <rect 
                      x={pos.x + NODE_W / 2 - 45} 
                      y={pos.y - 25} 
                      width={90} 
                      height={20} 
                      fill="#2563eb" 
                      stroke="#000000" 
                      strokeWidth={2} 
                    />
                    <text
                      x={pos.x + NODE_W / 2}
                      y={pos.y - 12}
                      textAnchor="middle"
                      fontSize={10}
                      fontWeight={900}
                      fill="white"
                      className="uppercase tracking-widest"
                    >
                      YOU ARE HERE
                    </text>
                  </g>
                )}

                {/* Selection ring removed since thick border is used */}
              </motion.g>
            );
          })}
        </g>
      </svg>

      {/* DETAIL PANEL */}
      <AnimatePresence>
        {(selectedState || selectedTransition) && (
          <DetailPanel
            state={selectedState}
            transition={selectedTransition}
            stateMachine={stateMachine}
            report={report}
            onClose={() => {
              setSelectedStateId(null);
              setSelectedTransitionId(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Simulate breadcrumbs */}
      {mode === "simulate" && simulateHistory.length > 0 && (
        <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap">
          <div className="flex items-center gap-2 p-3 bg-white border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] overflow-x-auto max-w-full">
            <span className="text-xs font-black uppercase tracking-widest text-black flex-shrink-0 bg-yellow-400 px-2 py-1 border-2 border-black">Path</span>
            <div className="flex items-center gap-2">
            {[...simulateHistory, simulateCurrentId].map((sid, i) => {
              const st = stateMachine.states.find((s) => s.id === sid);
              return (
                <span key={`${sid}-${i}`} className="flex items-center gap-2 flex-shrink-0">
                  {i > 0 && <span className="text-black font-black">→</span>}
                  <span className={`text-xs font-bold uppercase tracking-widest px-2 py-1 border-2 border-black ${
                    sid === simulateCurrentId ? "bg-blue-200 text-blue-900" : "bg-gray-100 text-gray-800"
                  }`}>
                    {st?.name || sid}
                  </span>
                </span>
              );
            })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
