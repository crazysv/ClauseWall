// Dropzone component - File upload drag and drop area
'use client';

export function Dropzone() {
  return (
    <div className="border-2 border-dashed border-border rounded-lg p-12 md:p-16 text-center cursor-pointer transition-colors duration-150 hover:border-primary hover:bg-primary/5">
      <div className="dropzone-content">
        <h3 className="text-lg font-bold text-foreground mt-4">Drop your file here</h3>
        <p className="text-sm text-muted-foreground mt-1">or click to browse</p>
        <p className="text-xs text-muted-foreground mt-4">Supported formats: PDF, DOC, DOCX</p>
      </div>
    </div>
  );
}
