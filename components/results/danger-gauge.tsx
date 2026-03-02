// DangerGauge component - Visual gauge showing overall danger level
export function DangerGauge({ score }: { score: number }) {
  return (
    <div className="danger-gauge">
      <h3>Risk Level</h3>
      <div className="gauge-container">
        <div className="gauge" style={{ width: `${score}%` }}></div>
      </div>
      <p className="score-text">{score}/100</p>
    </div>
  );
}
