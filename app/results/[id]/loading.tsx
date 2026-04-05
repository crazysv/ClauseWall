export default function ResultsLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="relative mx-auto mb-6 h-12 w-12">
          <div className="absolute inset-0 rounded-full border-2 border-zinc-700" />
          <div className="absolute inset-0 rounded-full border-2 border-t-violet-500 animate-spin" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">
          Loading Analysis
        </h2>
        <p className="text-sm text-muted-foreground">
          Fetching your contract analysis results…
        </p>
      </div>
    </div>
  );
}
