// DocumentTypeSelect component - Dropdown for selecting document type
'use client';

export function DocumentTypeSelect() {
  return (
    <div className="space-y-2">
      <label htmlFor="document-type" className="text-sm font-bold text-foreground">Document Type</label>
      <select id="document-type" className="rounded-lg border-2 border-input bg-background px-3 h-11 font-medium w-full">
        <option value="">Select document type</option>
        <option value="lease">Lease Agreement</option>
        <option value="employment">Employment Contract</option>
        <option value="service">Service Agreement</option>
        <option value="loan">Loan Agreement</option>
        <option value="other">Other</option>
      </select>
    </div>
  );
}
