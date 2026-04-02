"use client";

import { useState, useMemo, memo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, X } from "lucide-react";
import type { GeographicRiskData } from "@/types/market";
import { getRiskColor } from "@/lib/market/constants";

const GEO_URL = "/geo/india-states.json";

interface IndiaHeatMapProps {
  regions: GeographicRiskData[];
  nationalAverage: number;
  totalContracts: number;
}

function IndiaHeatMapComponent({
  regions,
  nationalAverage,
  totalContracts,
}: IndiaHeatMapProps) {
  const [tooltip, setTooltip] = useState<{
    name: string;
    data: GeographicRiskData | null;
    x: number;
    y: number;
  } | null>(null);
  const [selectedState, setSelectedState] = useState<GeographicRiskData | null>(null);

  // Build lookup by state name
  const regionMap = useMemo(() => {
    const map = new Map<string, GeographicRiskData>();
    for (const r of regions) {
      map.set(r.state_name.toLowerCase(), r);
      map.set(r.state_code.toLowerCase(), r);
    }
    return map;
  }, [regions]);

  const findRegionData = (geo: any): GeographicRiskData | null => {
    const name = (geo.properties?.ST_NM || geo.properties?.name || geo.properties?.NAME_1 || "").toLowerCase();
    return regionMap.get(name) || null;
  };

  const getFillColor = (geo: any): string => {
    const data = findRegionData(geo);
    if (!data) return "rgba(255,255,255,0.03)";
    return getRiskColor(data.avg_risk_score);
  };

  return (
    <div className="relative">
      {/* Map */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 shadow-inner">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 1000,
            center: [82, 22],
          }}
          width={600}
          height={620}
          style={{ width: "100%", height: "auto" }}
        >
          <ZoomableGroup center={[82, 22]} zoom={1}>
            <Geographies geography={GEO_URL}>
              {({ geographies }: { geographies: any[] }) =>
                geographies.map((geo) => {
                  const geoName = geo.properties?.ST_NM || geo.properties?.name || geo.properties?.NAME_1 || "Unknown";
                  const regionData = findRegionData(geo);

                  return (
                    <Geography
                      key={geo.rpiKey || geo.properties?.ST_NM || Math.random()}
                      geography={geo}
                      fill={getFillColor(geo)}
                      stroke="#cbd5e1"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: "none" },
                        hover: {
                          fill: regionData
                            ? getRiskColor(regionData.avg_risk_score) + "cc"
                            : "#cbd5e1",
                          outline: "none",
                          stroke: "#94a3b8",
                          strokeWidth: 1,
                          cursor: "pointer",
                        },
                        pressed: { outline: "none" },
                      }}
                      onMouseEnter={(evt) => {
                        const rect = (evt.target as SVGElement).closest("svg")?.getBoundingClientRect();
                        setTooltip({
                          name: geoName,
                          data: regionData,
                          x: evt.clientX - (rect?.left || 0),
                          y: evt.clientY - (rect?.top || 0),
                        });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                      onClick={() => {
                        if (regionData) setSelectedState(regionData);
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute z-20 pointer-events-none"
            style={{
              left: Math.min(tooltip.x + 10, 400),
              top: tooltip.y - 60,
            }}
          >
            <div className="rounded-xl bg-white dark:bg-card border border-slate-200 dark:border-slate-700 p-3.5 shadow-xl min-w-[160px]">
              <p className="text-sm font-black text-slate-900 dark:text-slate-100">{tooltip.name}</p>
              {tooltip.data ? (
                <div className="mt-2 space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-500 dark:text-slate-400">Risk Score</span>
                    <span
                      style={{ color: getRiskColor(tooltip.data.avg_risk_score) }}
                    >
                      {tooltip.data.avg_risk_score}/100
                    </span>
                  </div>
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-500 dark:text-slate-400">Contracts</span>
                    <span className="text-slate-700">{tooltip.data.total_contracts}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-500 dark:text-slate-400">High Risk</span>
                    <span className="text-red-500">{tooltip.data.high_risk_count}</span>
                  </div>
                </div>
              ) : (
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-2">No data yet</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-4 px-2">
        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm shadow-sm dark:shadow-slate-900/20" style={{ background: "#22c55e" }} />
            Low Risk (≤30)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm shadow-sm dark:shadow-slate-900/20" style={{ background: "#f59e0b" }} />
            Medium (31-55)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm shadow-sm dark:shadow-slate-900/20" style={{ background: "#f97316" }} />
            High (56-75)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm shadow-sm dark:shadow-slate-900/20" style={{ background: "#ef4444" }} />
            Critical (76+)
          </span>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          National avg: {nationalAverage}/100
        </span>
      </div>

      {/* Selected State Detail */}
      <AnimatePresence>
        {selectedState && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-5 p-5 rounded-2xl bg-white dark:bg-card border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <MapPin className="h-5 w-5 text-teal-600" />
                <h4 className="font-black text-slate-900 dark:text-slate-100 text-lg">{selectedState.state_name}</h4>
              </div>
              <button
                onClick={() => setSelectedState(null)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-400 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100">
                <p
                  className="text-lg md:text-xl lg:text-2xl font-black"
                  style={{ color: getRiskColor(selectedState.avg_risk_score) }}
                >
                  {selectedState.avg_risk_score}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1">Avg Risk Score</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100">
                <p className="text-lg md:text-xl lg:text-2xl font-black text-slate-700">{selectedState.total_contracts}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1">Contracts</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100">
                <p className="text-lg md:text-xl lg:text-2xl font-black text-red-600">{selectedState.high_risk_count}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1">High Risk</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100">
                <p className="text-lg md:text-xl lg:text-2xl font-black text-emerald-600">{selectedState.low_risk_count}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1">Low Risk</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const IndiaHeatMap = memo(IndiaHeatMapComponent);
export { IndiaHeatMap };
