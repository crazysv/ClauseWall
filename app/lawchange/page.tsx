"use client";

import dynamic from "next/dynamic";
import { Scale, Shield } from "lucide-react";

const LawChangeFeed = dynamic(
  () => import("@/components/lawchange/law-change-feed"),
  { ssr: false },
);

export default function LawChangePage() {
  return (
    <div className="relative px-4 sm:px-6 lg:px-8 py-8">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="relative">
            <Scale className="h-8 w-8 text-indigo-400" />
            <div className="absolute inset-0 h-8 w-8 bg-indigo-500/20 blur-xl rounded-full" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              Law <span className="text-indigo-400">Monitor</span>
            </h1>
            <p className="text-muted-foreground text-sm">
              Track legal changes affecting your contracts in real-time
            </p>
          </div>
        </div>

        {/* Feed */}
        <LawChangeFeed />
      </div>
    </div>
  );
}
