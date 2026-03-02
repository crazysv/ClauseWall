// ClauseCard component - Individual clause analysis card
export function ClauseCard({ clause }: { clause: any }) {
  return (
    <div className="clause-card">
      <div className="clause-header">
        <h4>Clause {clause.id}</h4>
        <span className={`risk-badge ${clause.riskLevel}`}>{clause.riskLevel}</span>
      </div>
      <p className="clause-text">{clause.text}</p>
      <p className="clause-analysis">{clause.analysis}</p>
    </div>
  );
}
