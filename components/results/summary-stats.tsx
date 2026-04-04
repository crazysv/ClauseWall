// SummaryStats component - Overview statistics for the analysis
export function SummaryStats({ stats }: { stats: any }) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-xl font-black uppercase text-foreground">
        Analysis Summary
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-impact p-4 border-2 border-foreground flex flex-col items-center justify-center text-center">
          <h4 className="text-4xl font-black text-foreground">
            {stats.totalClauses || 0}
          </h4>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-2">
            Total Clauses
          </p>
        </div>
        <div className="card-impact p-4 border-2 border-red-600 bg-red-50 dark:bg-red-950 flex flex-col items-center justify-center text-center">
          <h4 className="text-4xl font-black text-red-600 dark:text-red-400">
            {stats.dangerousClauses || 0}
          </h4>
          <p className="text-xs font-bold text-red-800 dark:text-red-300 uppercase tracking-wider mt-2">
            Dangerous Clauses
          </p>
        </div>
        <div className="card-impact p-4 border-2 border-yellow-600 bg-yellow-50 dark:bg-yellow-950 flex flex-col items-center justify-center text-center">
          <h4 className="text-4xl font-black text-yellow-600 dark:text-yellow-400">
            {stats.riskScore || 0}
          </h4>
          <p className="text-xs font-bold text-yellow-800 dark:text-yellow-300 uppercase tracking-wider mt-2">
            Risk Score
          </p>
        </div>
      </div>
    </div>
  );
}
