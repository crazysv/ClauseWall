// ClauseList component - List of all analyzed clauses
export function ClauseList({ clauses }: { clauses: any[] }) {
  return (
    <div className="clause-list">
      <h3>Analyzed Clauses</h3>
      <div className="clauses-container">
        {clauses.map((clause) => (
          <div key={clause.id} className="clause-item">
            <h4>Clause {clause.id}</h4>
            <p>{clause.text}</p>
            <span className={`risk-badge ${clause.riskLevel}`}>{clause.riskLevel}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
