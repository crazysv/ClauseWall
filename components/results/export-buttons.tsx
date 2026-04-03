'use client';

export function ExportButtons() {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-xl font-black uppercase tracking-wider text-foreground">Export Results</h3>
      <div className="flex flex-wrap gap-2">
        <button className="px-4 py-2 border-2 border-foreground bg-foreground text-background font-bold tracking-wider uppercase hover:bg-muted hover:text-foreground transition-colors">Export as PDF</button>
        <button className="px-4 py-2 border-2 border-foreground bg-muted text-foreground font-bold tracking-wider uppercase hover:bg-foreground hover:text-background transition-colors">Export as JSON</button>
        <button className="px-4 py-2 border-2 border-foreground bg-muted text-foreground font-bold tracking-wider uppercase hover:bg-foreground hover:text-background transition-colors">Share Link</button>
        <button className="px-4 py-2 border-2 border-foreground bg-muted text-foreground font-bold tracking-wider uppercase hover:bg-foreground hover:text-background transition-colors">Print Report</button>
      </div>
    </div>
  );
}
