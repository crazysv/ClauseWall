// TextInput component - Text area for direct contract text input
'use client';

export function TextInput() {
  return (
    <div className="space-y-2">
      <label htmlFor="contract-text" className="text-sm font-bold text-foreground">Paste Contract Text</label>
      <textarea
        id="contract-text"
        placeholder="Paste your contract text here..."
        rows={10}
        className="min-h-[200px] w-full rounded-lg border-2 border-input bg-background px-4 py-3 text-sm font-medium placeholder:text-muted-foreground focus:border-foreground focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}
