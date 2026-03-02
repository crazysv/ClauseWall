// Dropzone component - File upload drag and drop area
'use client';

export function Dropzone() {
  return (
    <div className="dropzone">
      <div className="dropzone-content">
        <h3>Drop your file here</h3>
        <p>or click to browse</p>
        <p>Supported formats: PDF, DOC, DOCX</p>
      </div>
    </div>
  );
}
