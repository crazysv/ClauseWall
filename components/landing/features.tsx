// Features component - Landing page key features showcase
export function Features() {
  return (
    <section className="bg-muted py-20 md:py-32 px-4 md:px-6">
      <div className="max-w-3xl mx-auto text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
          Key Features
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground mt-4 max-w-2xl mx-auto">
          Everything you need to stay safe.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        <div className="bg-card rounded-lg border-2 border-border p-8 shadow-sm hover:border-foreground/20 hover:shadow-md transition-all duration-150">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
            <div className="text-primary font-bold">1</div>
          </div>
          <h3 className="text-xl font-bold text-foreground mt-4">AI Analysis</h3>
          <p className="text-muted-foreground mt-2 leading-relaxed">Advanced AI detects predatory clauses</p>
        </div>
        <div className="bg-card rounded-lg border-2 border-border p-8 shadow-sm hover:border-foreground/20 hover:shadow-md transition-all duration-150">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
            <div className="text-primary font-bold">2</div>
          </div>
          <h3 className="text-xl font-bold text-foreground mt-4">Legal Database</h3>
          <p className="text-muted-foreground mt-2 leading-relaxed">Comprehensive legal rules database</p>
        </div>
        <div className="bg-card rounded-lg border-2 border-border p-8 shadow-sm hover:border-foreground/20 hover:shadow-md transition-all duration-150">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
            <div className="text-primary font-bold">3</div>
          </div>
          <h3 className="text-xl font-bold text-foreground mt-4">Risk Scoring</h3>
          <p className="text-muted-foreground mt-2 leading-relaxed">Clear risk assessment for each clause</p>
        </div>
      </div>
    </section>
  );
}
