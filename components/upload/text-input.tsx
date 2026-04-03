// TextInput component - Text area for direct contract text input
'use client';

export function TextInput() {
  return (
    <div className="space-y-2">
      <label htmlFor="contract-text" className="text-sm font-black uppercase tracking-wider text-foreground">Paste Contract Text</label>
      <textarea
        id="contract-text"
        placeholder="Paste your contract text here..."
        rows={10}
        className="min-h-[200px] w-full border-2 border-foreground shadow-[inset_4px_4px_0px_0px_rgba(10,10,10,0.05)] bg-background px-4 py-3 text-sm font-bold placeholder:text-muted-foreground focus:border-primary focus:ring-0 focus:outline-none"
      />
    </div>
  );
}
