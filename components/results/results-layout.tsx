"use client";

import React from "react";

interface ResultsLayoutProps {
  /** Content for the scrollable main column (clauses, banners, tail sections) */
  main: React.ReactNode;
  /** Content for the sticky context rail (score, summary, actions, tools) */
  rail: React.ReactNode;
  /** Content rendered above the split layout, full width (header, mood ring) */
  header?: React.ReactNode;
  /** Content rendered below the split layout, full width (modals, overlays) */
  footer?: React.ReactNode;
}

/**
 * Split workspace layout for the Results page.
 *
 * Desktop (≥1024px): Two columns — 65% main (scrollable) + 35% rail (sticky).
 * Mobile (<1024px): Single column — rail content above, main below.
 * The rail sticks to the top of the viewport as the user scrolls the main column.
 */
export default function ResultsLayout({
  main,
  rail,
  header,
  footer,
}: ResultsLayoutProps) {
  return (
    <>
      {header}
      <div className="relative px-4 sm:px-6 md:px-8 py-8 pb-24 sm:pb-12 min-h-screen" style={{ backgroundColor: '#0a0a0a' }}>

        <div className="relative mx-auto max-w-7xl">
          {/* Split workspace: main column (63%) + context rail (37%) */}
          <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-8 xl:grid-cols-[1fr_400px]">
            {/* Main column — scrollable, clause reading zone */}
            <div className="min-w-0">
              {main}
            </div>

            {/* Context rail — sticky sidebar */}
            <aside className="hidden lg:block">
              <div className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent pr-2">
                <div className="w-full">
                  {rail}
                </div>
              </div>
            </aside>
          </div>

          {/* Mobile: rail content appears inline above clause list — 
              handled by page.tsx rendering rail content conditionally */}
        </div>
      </div>
      {footer}
    </>
  );
}
