// Features component - Landing page key features showcase
export function Features() {
  return (
    <section className="features-section">
      <h2>Key Features</h2>
      <div className="features-grid">
        <div className="feature-card">
          <h3>AI Analysis</h3>
          <p>Advanced AI detects predatory clauses</p>
        </div>
        <div className="feature-card">
          <h3>Legal Database</h3>
          <p>Comprehensive legal rules database</p>
        </div>
        <div className="feature-card">
          <h3>Risk Scoring</h3>
          <p>Clear risk assessment for each clause</p>
        </div>
      </div>
    </section>
  );
}
