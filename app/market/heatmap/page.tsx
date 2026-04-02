"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Map, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { MarketStatsFooter } from "@/components/market/market-stats-footer";
import type { GeographicRiskData } from "@/types/market";

const IndiaHeatMap = dynamic(
  () => import("@/components/market/india-heat-map").then((mod) => mod.IndiaHeatMap as React.ComponentType<any>),
  {
    ssr: false,
    loading: () => (
      <div className="h-[600px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
      </div>
    ),
  }
);

export default function HeatMapExplorerPage() {
  const [geoData, setGeoData] = useState<{
    regions: GeographicRiskData[];
    national_average: number;
    total_contracts: number;
    last_updated: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/market/geographic")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setGeoData({
            regions: data.regions || [],
            national_average: data.national_average || 0,
            total_contracts: data.total_contracts || 0,
            last_updated: data.last_updated || null,
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Link href="/market" className="text-xs text-white/30 hover:text-white/50 mb-3 flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Back to Market Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-green-500/20">
              <Map className="h-6 w-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl lg:text-2xl font-bold">Geographic Risk Map</h1>
              <p className="text-sm text-white/50">
                State-wise contract risk visualization across India
              </p>
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="h-[500px] flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
          </div>
        ) : geoData ? (
          <>
            <IndiaHeatMap
              regions={geoData.regions}
              nationalAverage={geoData.national_average}
              totalContracts={geoData.total_contracts}
            />
            <MarketStatsFooter
              totalContracts={geoData.total_contracts}
              lastUpdated={geoData.last_updated}
            />
          </>
        ) : (
          <p className="text-center text-white/30 py-20">
            No geographic data available yet.
          </p>
        )}
      </div>
    </div>
  );
}
