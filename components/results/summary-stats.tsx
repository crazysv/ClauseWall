// SummaryStats component - Overview statistics for the analysis
export function SummaryStats({ stats }: { stats: any }) {
  return (
    <div className="summary-stats">
      <h3>Analysis Summary</h3>
      <div className="stats-grid">
        <div className="stat-item">
          <h4>{stats.totalClauses}</h4>
          <p>Total Clauses</p>
        </div>
        <div className="stat-item">
          <h4>{stats.dangerousClauses}</h4>
          <p>Dangerous Clauses</p>
        </div>
        <div className="stat-item">
          <h4>{stats.riskScore}</h4>
          <p>Risk Score</p>
        </div>
      </div>
    </div>
  );
}
