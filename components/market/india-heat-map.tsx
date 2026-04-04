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
  const [selectedState, setSelectedState] = useState<GeographicRiskData | null>(
    null,
  );

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
    const name = (
      geo.properties?.ST_NM ||
      geo.properties?.name ||
      geo.properties?.NAME_1 ||
      ""
    ).toLowerCase();
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
      <div className="relative rounded-none overflow-hidden border-4 border-foreground bg-background shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
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
                  const geoName =
                    geo.properties?.ST_NM ||
                    geo.properties?.name ||
                    geo.properties?.NAME_1 ||
                    "Unknown";
                  const regionData = findRegionData(geo);

                  return (
                    <Geography
                      key={geo.rpiKey || geo.properties?.ST_NM || Math.random()}
                      geography={geo}
                      fill={getFillColor(geo)}
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: "none" },
                        hover: {
                          fill: regionData
                            ? getRiskColor(regionData.avg_risk_score) + "cc"
                            : "rgba(255,255,255,0.08)",
                          outline: "none",
                          stroke: "rgba(255,255,255,0.3)",
                          strokeWidth: 1,
                          cursor: "pointer",
                        },
                        pressed: { outline: "none" },
                      }}
                      onMouseEnter={(evt) => {
                        const rect = (evt.target as SVGElement)
                          .closest("svg")
                          ?.getBoundingClientRect();
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
            <div className="rounded-none bg-background border-2 border-foreground p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] min-w-[160px]">
              <p className="text-sm font-black text-foreground uppercase tracking-wider">
                {tooltip.name}
              </p>
              {tooltip.data ? (
                <div className="mt-1.5 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/50">Risk Score</span>
                    <span
                      className="font-medium"
                      style={{
                        color: getRiskColor(tooltip.data.avg_risk_score),
                      }}
                    >
                      {tooltip.data.avg_risk_score}/100
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/50">Contracts</span>
                    <span className="text-white/70">
                      {tooltip.data.total_contracts}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/50">High Risk</span>
                    <span className="text-red-400">
                      {tooltip.data.high_risk_count}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-[10px] text-white/30 mt-1">No data yet</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-3 px-1">
        <div className="flex items-center gap-3 text-[10px] text-white/40">
          <span className="flex items-center gap-1">
            <span
              className="w-3 h-3 rounded-sm"
              style={{ background: "#22c55e" }}
            />
            Low Risk (≤30)
          </span>
          <span className="flex items-center gap-1">
            <span
              className="w-3 h-3 rounded-sm"
              style={{ background: "#f59e0b" }}
            />
            Medium (31-55)
          </span>
          <span className="flex items-center gap-1">
            <span
              className="w-3 h-3 rounded-sm"
              style={{ background: "#f97316" }}
            />
            High (56-75)
          </span>
          <span className="flex items-center gap-1">
            <span
              className="w-3 h-3 rounded-sm"
              style={{ background: "#ef4444" }}
            />
            Critical (76+)
          </span>
        </div>
        <span className="text-[10px] text-white/20">
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
            className="mt-4 p-4 rounded-none card-impact bg-muted border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-cyan-400" />
                <h4 className="font-semibold text-white">
                  {selectedState.state_name}
                </h4>
              </div>
              <button
                onClick={() => setSelectedState(null)}
                className="text-white/30 hover:text-white/60"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="text-center p-2 rounded-lg bg-white/[0.03]">
                <p
                  className="text-lg font-bold"
                  style={{ color: getRiskColor(selectedState.avg_risk_score) }}
                >
                  {selectedState.avg_risk_score}
                </p>
                <p className="text-[10px] text-white/40">Avg Risk Score</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-white/[0.03]">
                <p className="text-lg font-bold text-white">
                  {selectedState.total_contracts}
                </p>
                <p className="text-[10px] text-white/40">Contracts</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-white/[0.03]">
                <p className="text-lg font-bold text-red-400">
                  {selectedState.high_risk_count}
                </p>
                <p className="text-[10px] text-white/40">High Risk</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-white/[0.03]">
                <p className="text-lg font-bold text-green-400">
                  {selectedState.low_risk_count}
                </p>
                <p className="text-[10px] text-white/40">Low Risk</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const IndiaHeatMap = memo(IndiaHeatMapComponent);
export default IndiaHeatMap;
