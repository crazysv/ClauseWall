// Hero component - Landing page main hero section
export function Hero() {
  return (
    <section className="min-h-[90vh] flex items-center bg-background px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-none text-foreground">
          ClauseWall
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl leading-relaxed mt-6">
          <span className="text-primary">Predatory</span> Clause Detector
        </p>
        <p className="text-muted-foreground mt-2">
          Protect yourself from unfair contract terms
        </p>
      </div>
    </section>
  );
}
