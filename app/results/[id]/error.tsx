"use client";

import { useEffect } from "react";

export default function ResultsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ClauseWall] Results page error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4">📄</div>
        <h2 className="text-xl font-bold text-foreground mb-3">
          Could not load analysis results
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed mb-6">
          There was a problem loading your contract analysis. This could be a
          temporary issue — try refreshing.
        </p>
        {error?.digest && (
          <p className="text-xs text-zinc-600 font-mono mb-4">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            Try Again
          </button>
          <a
            href="/upload"
            className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-sm font-semibold transition-colors"
          >
            Upload New Contract
          </a>
          <a
            href="/"
            className="px-5 py-2.5 border border-zinc-700 hover:bg-zinc-800 text-zinc-300 rounded-lg text-sm font-semibold transition-colors"
          >
            Home
          </a>
        </div>
      </div>
    </div>
  );
}
