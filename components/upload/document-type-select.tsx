// DocumentTypeSelect component - Dropdown for selecting document type
'use client';

export function DocumentTypeSelect() {
  return (
    <div className="document-type-select">
      <label htmlFor="document-type">Document Type</label>
      <select id="document-type">
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
