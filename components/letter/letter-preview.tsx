// LetterPreview component - Preview of generated response letter
export function LetterPreview({ letter }: { letter: any }) {
  if (!letter) return null;

  return (
    <div className="border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8">
      <h3 className="font-black text-xl uppercase tracking-widest text-black mb-6 border-b-2 border-black/10 pb-4">
        Response Letter Preview
      </h3>
      <div className="space-y-6">
        <div className="flex justify-between items-start border-b-2 border-black/5 pb-4">
          <h4 className="font-bold text-lg text-black">
            {letter.subject || "Subject: Important Notice"}
          </h4>
          <p className="font-bold uppercase tracking-wider text-xs text-muted-foreground bg-gray-100 px-3 py-1 border-2 border-black">
            Date: {letter.date || new Date().toLocaleDateString()}
          </p>
        </div>
        <div className="min-h-[200px] font-mono text-sm leading-relaxed text-black/80 whitespace-pre-wrap bg-gray-50 p-6 border-2 border-black shadow-[inset_4px_4px_0px_0px_rgba(0,0,0,0.05)]">
          {letter.content || "Letter content will appear here..."}
        </div>
        <div className="pt-4 border-t-2 border-black/10">
          <p className="font-bold text-black">Sincerely,</p>
          <p className="font-black uppercase tracking-widest text-black mt-2">
            {letter.signature || "[Your Name]"}
          </p>
        </div>
      </div>
    </div>
  );
}
