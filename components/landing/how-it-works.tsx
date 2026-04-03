// HowItWorks component - Landing page process explanation
export function HowItWorks() {
  return (
    <section className="bg-background py-20 md:py-32 px-4 md:px-6">
      <div className="max-w-3xl mx-auto text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
          How It Works
        </h2>
      </div>
      <div className="flex flex-col md:flex-row items-start gap-8 md:gap-12 max-w-7xl mx-auto">
        <div className="flex-1 relative">
          <div className="hidden md:block absolute top-[24px] left-[60px] right-[-30px] border-t-2 border-dashed border-border" />
          <div className="w-12 h-12 rounded-full bg-foreground text-background font-black text-lg flex items-center justify-center mb-6 relative z-10">
            1
          </div>
          <h3 className="text-xl font-bold text-foreground mt-4">Upload</h3>
          <p className="text-muted-foreground mt-2 leading-relaxed">Upload your contract or paste text</p>
        </div>
        <div className="flex-1 relative">
          <div className="hidden md:block absolute top-[24px] left-[60px] right-[-30px] border-t-2 border-dashed border-border" />
          <div className="w-12 h-12 rounded-full bg-foreground text-background font-black text-lg flex items-center justify-center mb-6 relative z-10">
            2
          </div>
          <h3 className="text-xl font-bold text-foreground mt-4">Analyze</h3>
          <p className="text-muted-foreground mt-2 leading-relaxed">AI analyzes each clause for risks</p>
        </div>
        <div className="flex-1 relative">
          <div className="w-12 h-12 rounded-full bg-foreground text-background font-black text-lg flex items-center justify-center mb-6 relative z-10">
            3
          </div>
          <h3 className="text-xl font-bold text-foreground mt-4">Review</h3>
          <p className="text-muted-foreground mt-2 leading-relaxed">Get detailed results and recommendations</p>
        </div>
      </div>
    </section>
  );
}
