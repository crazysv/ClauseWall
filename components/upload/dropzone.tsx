// Dropzone component - File upload drag and drop area
"use client";

export function Dropzone() {
  return (
    <div className="border-2 border-dashed border-foreground p-12 md:p-16 text-center cursor-pointer transition-colors duration-150 hover:bg-foreground hover:text-background shadow-[4px_4px_0px_0px_rgba(10,10,10,0.1)] hover:shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] bg-background">
      <div className="dropzone-content">
        <h3 className="text-lg font-black uppercase tracking-wider mt-4">
          Drop your file here
        </h3>
        <p className="text-sm font-bold mt-1">or click to browse</p>
        <p className="text-xs font-bold opacity-70 mt-4">
          Supported formats: PDF, DOC, DOCX
        </p>
      </div>
    </div>
  );
}
