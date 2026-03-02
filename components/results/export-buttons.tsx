// ExportButtons component - Buttons for exporting results
'use client';

export function ExportButtons() {
  return (
    <div className="export-buttons">
      <h3>Export Results</h3>
      <div className="button-group">
        <button className="export-btn">Export as PDF</button>
        <button className="export-btn">Export as JSON</button>
        <button className="export-btn">Share Link</button>
        <button className="export-btn">Print Report</button>
      </div>
    </div>
  );
}
