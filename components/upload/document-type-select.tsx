// DocumentTypeSelect component - Dropdown for selecting document type
"use client";

export function DocumentTypeSelect() {
  return (
    <div className="space-y-2">
      <label
        htmlFor="document-type"
        className="text-sm font-black uppercase tracking-wider text-foreground"
      >
        Document Type
      </label>
      <select
        id="document-type"
        className="border-2 border-foreground shadow-[inset_2px_2px_0px_0px_rgba(10,10,10,0.05)] bg-background px-3 h-11 font-bold w-full focus:border-primary focus:outline-none"
      >
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
