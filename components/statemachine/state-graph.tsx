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
  initial:          { fill: "#1e293b", stroke: "#64748b" },
  normal:           { fill: "#022c22", stroke: "#10b981" },
  restricted:       { fill: "#451a03", stroke: "#f59e0b" },
  dangerous:        { fill: "#431407", stroke: "#f97316" },
  trap:             { fill: "#450a0a", stroke: "#ef4444" },
  absorbing_trap:   { fill: "#450a0a", stroke: "#dc2626" },
  terminal_safe:    { fill: "#052e16", stroke: "#22c55e" },
  terminal_warning: { fill: "#451a03", stroke: "#eab308" },
  terminal_loss:    { fill: "#450a0a", stroke: "#ef4444" },
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
    <div className="space-y-2 p-4">
      {sortedStates.map((state, idx) => {
        const colors = STATE_COLORS[state.type];
        const icon = STATE_ICONS[state.type];
        const isTrap = report.trapAnalysis.some((t) => t.stateId === state.id);
        const outgoing = stateMachine.transitions.filter((t) => t.fromStateId === state.id);

        return (
          <div key={state.id}>
            <button
              onClick={() => onStateClick?.(state)}
              className={`w-full text-left p-3 rounded-lg border transition-all hover:scale-[1.01] ${
                isTrap ? "border-red-500/50 bg-red-500/5" : "border-white/10 bg-white/[0.02]"
              }`}
              style={{ borderLeftWidth: 4, borderLeftColor: colors.stroke }}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{icon}</span>
                <span className="font-medium text-sm">{state.name}</span>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full ml-auto"
                  style={{ backgroundColor: colors.fill, color: colors.stroke, border: `1px solid ${colors.stroke}40` }}
                >
                  {state.type.replace(/_/g, " ")}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1 line-clamp-2">{state.description}</p>
              {state.financialImpact.amount && (
                <p className="text-xs text-amber-400 mt-1">💰 {state.financialImpact.amount}</p>
              )}
            </button>

            {/* Show outgoing transitions */}
            {outgoing.length > 0 && idx < sortedStates.length - 1 && (
              <div className="pl-6 py-1">
                {outgoing.slice(0, 2).map((t) => (
                  <div key={t.id} className="flex items-center gap-2 text-[11px] text-gray-500">
                    <span className="text-gray-600">↓</span>
                    <span className="truncate">{t.trigger}</span>
                  </div>
                ))}
                {outgoing.length > 2 && (
                  <span className="text-[10px] text-gray-600">+{outgoing.length - 2} more</span>
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
        className="absolute right-0 top-0 bottom-0 w-[300px] bg-gray-900/95 backdrop-blur-xl border-l border-white/10 overflow-y-auto z-20"
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">{STATE_ICONS[state.type]}</span>
              <h3 className="font-semibold text-sm">{state.name}</h3>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded">
              <X className="h-4 w-4" />
            </button>
          </div>

          <span
            className="text-[10px] px-2 py-0.5 rounded-full"
            style={{ backgroundColor: colors.fill, color: colors.stroke, border: `1px solid ${colors.stroke}40` }}
          >
            {state.type.replace(/_/g, " ")}
          </span>

          <p className="text-sm text-gray-300 mt-3">{state.description}</p>

          {state.duration && (
            <div className="mt-3 p-2 rounded-lg bg-white/[0.03] border border-white/5">
              <p className="text-xs text-gray-400">Duration</p>
              <p className="text-sm font-medium">{state.duration.value} {state.duration.unit}{state.duration.isFixed ? " (fixed)" : ""}</p>
            </div>
          )}

          {state.financialImpact.type !== "none" && (
            <div className="mt-2 p-2 rounded-lg bg-white/[0.03] border border-white/5">
              <p className="text-xs text-gray-400">Financial Impact</p>
              <p className="text-sm font-medium text-amber-400">{state.financialImpact.amount || state.financialImpact.type}</p>
            </div>
          )}

          {state.legalIssues && state.legalIssues.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-gray-400 mb-1">Legal Issues</p>
              {state.legalIssues.map((issue, i) => (
                <p key={i} className="text-xs text-red-400 mt-0.5">⚖️ {issue}</p>
              ))}
            </div>
          )}

          {trap && (
            <div className="mt-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-xs font-medium text-red-400 mb-1">🪤 Trap State — {trap.severity.toUpperCase()}</p>
              <p className="text-xs text-red-300">{trap.description.substring(0, 150)}</p>
            </div>
          )}

          {incoming.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-gray-400 mb-1">Incoming ({incoming.length})</p>
              {incoming.slice(0, 5).map((t) => {
                const from = stateMachine.states.find((s) => s.id === t.fromStateId);
                return (
                  <p key={t.id} className="text-xs text-gray-300 mt-0.5">
                    ← {from?.name || "Unknown"}: {truncate(t.trigger, 40)}
                  </p>
                );
              })}
            </div>
          )}

          {outgoing.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-gray-400 mb-1">Outgoing ({outgoing.length})</p>
              {outgoing.slice(0, 5).map((t) => {
                const to = stateMachine.states.find((s) => s.id === t.toStateId);
                return (
                  <p key={t.id} className="text-xs text-gray-300 mt-0.5">
                    → {to?.name || "Unknown"}: {truncate(t.trigger, 40)}
                  </p>
                );
              })}
            </div>
          )}

          {state.clauseReferences && state.clauseReferences.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-gray-400">Referenced Clauses</p>
              <p className="text-xs text-blue-400">{state.clauseReferences.join(", ")}</p>
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
        className="absolute right-0 top-0 bottom-0 w-[300px] bg-gray-900/95 backdrop-blur-xl border-l border-white/10 overflow-y-auto z-20"
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">Transition Details</h3>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded">
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="text-sm text-gray-300">{transition.trigger}</p>

          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5">
              <p className="text-[10px] text-gray-500">Type</p>
              <p className="text-xs">{transition.triggerType.replace(/_/g, " ")}</p>
            </div>
            <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5">
              <p className="text-[10px] text-gray-500">Party</p>
              <p className="text-xs">{transition.party}</p>
            </div>
            <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5">
              <p className="text-[10px] text-gray-500">Voluntary</p>
              <p className="text-xs">{transition.isVoluntary ? "Yes" : "No"}</p>
            </div>
            <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5">
              <p className="text-[10px] text-gray-500">Reversible</p>
              <p className="text-xs">{transition.isReversible ? "Yes" : "No"}</p>
            </div>
          </div>

          {transition.condition && (
            <div className="mt-3">
              <p className="text-xs text-gray-400">Condition</p>
              <p className="text-xs text-amber-300 mt-0.5">{transition.condition}</p>
            </div>
          )}

          {transition.financialConsequence && (
            <div className="mt-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs text-amber-400">💰 {transition.financialConsequence}</p>
            </div>
          )}

          {transition.clauseReference && (
            <div className="mt-3">
              <p className="text-xs text-gray-400">Clause Reference</p>
              <p className="text-xs text-blue-400">{transition.clauseReference}</p>
            </div>
          )}

          <div className="mt-3">
            <p className="text-xs text-gray-400">Probability</p>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              transition.probability === "certain" ? "bg-green-500/20 text-green-400" :
              transition.probability === "likely" ? "bg-blue-500/20 text-blue-400" :
              transition.probability === "possible" ? "bg-amber-500/20 text-amber-400" :
              "bg-gray-500/20 text-gray-400"
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
        <div className="flex items-center justify-between px-4 py-2 bg-gray-900/50 border-b border-white/5">
          <span className="text-xs text-gray-400">{stateMachine.metadata.totalStates} states</span>
          <button
            onClick={() => setViewMode("graph")}
            className="text-xs text-blue-400 hover:text-blue-300"
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
    <div className={`relative overflow-hidden bg-gray-950/50 rounded-xl border border-white/5 ${className}`}>
      {/* TOOLBAR */}
      <div className="absolute top-3 left-3 z-10 flex gap-1.5">
        <button onClick={() => handleZoom(0.15)} className="p-1.5 bg-gray-800/90 hover:bg-gray-700 rounded-lg border border-white/10 transition-colors">
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => handleZoom(-0.15)} className="p-1.5 bg-gray-800/90 hover:bg-gray-700 rounded-lg border border-white/10 transition-colors">
          <ZoomOut className="h-3.5 w-3.5" />
        </button>
        <button onClick={handleFit} className="p-1.5 bg-gray-800/90 hover:bg-gray-700 rounded-lg border border-white/10 transition-colors">
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => setViewMode("list")}
          className="px-2 py-1.5 text-[10px] bg-gray-800/90 hover:bg-gray-700 rounded-lg border border-white/10 transition-colors"
        >
          List
        </button>
      </div>

      {/* SIMULATE CONTROLS */}
      {mode === "simulate" && (
        <div className="absolute top-3 right-3 z-10 flex gap-1.5">
          <button onClick={handleSimUndo} disabled={simulateHistory.length === 0} className="p-1.5 bg-gray-800/90 hover:bg-gray-700 rounded-lg border border-white/10 disabled:opacity-30 transition-colors">
            <Undo2 className="h-3.5 w-3.5" />
          </button>
          <button onClick={handleSimReset} className="p-1.5 bg-gray-800/90 hover:bg-gray-700 rounded-lg border border-white/10 transition-colors">
            <RotateCcw className="h-3.5 w-3.5" />
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
                {/* Trap pulse */}
                {isTrap && (
                  <rect
                    x={pos.x - 6}
                    y={pos.y - 6}
                    width={NODE_W + 12}
                    height={NODE_H + 12}
                    rx={16}
                    fill="none"
                    stroke={colors.stroke}
                    strokeWidth={1}
                    opacity={0.3}
                    className="animate-trap-pulse"
                  />
                )}

                {/* Simulate active glow */}
                {isSimActive && (
                  <rect
                    x={pos.x - 4}
                    y={pos.y - 4}
                    width={NODE_W + 8}
                    height={NODE_H + 8}
                    rx={15}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    opacity={0.6}
                    className="animate-pulse"
                  />
                )}

                {/* Node background */}
                <rect
                  x={pos.x}
                  y={pos.y}
                  width={NODE_W}
                  height={NODE_H}
                  rx={12}
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth={isSelected ? 3 : 2}
                  className="cursor-pointer transition-all duration-200"
                  filter={isSelected ? "drop-shadow(0 0 8px rgba(255,255,255,0.15))" : undefined}
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

                {/* Type icon */}
                <text
                  x={pos.x + 12}
                  y={pos.y + 20}
                  fontSize={14}
                  className="pointer-events-none select-none"
                >
                  {icon}
                </text>

                {/* State name */}
                <text
                  x={pos.x + NODE_W / 2}
                  y={pos.y + (subtitle ? 35 : 42)}
                  textAnchor="middle"
                  fontSize={12}
                  fontWeight={600}
                  fill="white"
                  className="pointer-events-none select-none"
                >
                  {truncate(state.name, 22)}
                </text>

                {/* Subtitle */}
                {subtitle && (
                  <text
                    x={pos.x + NODE_W / 2}
                    y={pos.y + 52}
                    textAnchor="middle"
                    fontSize={10}
                    fill="rgba(255,255,255,0.5)"
                    className="pointer-events-none select-none"
                  >
                    {truncate(subtitle, 28)}
                  </text>
                )}

                {/* Sim active label */}
                {isSimActive && (
                  <text
                    x={pos.x + NODE_W / 2}
                    y={pos.y - 10}
                    textAnchor="middle"
                    fontSize={9}
                    fontWeight={700}
                    fill="#3b82f6"
                    className="pointer-events-none"
                  >
                    YOU ARE HERE
                  </text>
                )}

                {/* Selection ring */}
                {isSelected && (
                  <rect
                    x={pos.x - 3}
                    y={pos.y - 3}
                    width={NODE_W + 6}
                    height={NODE_H + 6}
                    rx={14}
                    fill="none"
                    stroke="#60a5fa"
                    strokeWidth={1.5}
                    strokeDasharray="4,3"
                    className="pointer-events-none"
                  />
                )}
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
        <div className="absolute bottom-3 left-3 right-3 z-10">
          <div className="flex items-center gap-1 px-3 py-2 bg-gray-800/90 rounded-lg border border-white/10 overflow-x-auto">
            <span className="text-[10px] text-gray-400 flex-shrink-0">Path:</span>
            {[...simulateHistory, simulateCurrentId].map((sid, i) => {
              const st = stateMachine.states.find((s) => s.id === sid);
              return (
                <span key={`${sid}-${i}`} className="flex items-center gap-1 flex-shrink-0">
                  {i > 0 && <span className="text-gray-600 text-[10px]">→</span>}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    sid === simulateCurrentId ? "bg-blue-500/20 text-blue-300" : "text-gray-400"
                  }`}>
                    {st?.name || sid}
                  </span>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
