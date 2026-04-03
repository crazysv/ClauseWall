// JurisdictionSelect component - Dropdown for selecting legal jurisdiction
'use client';

export function JurisdictionSelect() {
  return (
    <div className="space-y-2">
      <label htmlFor="jurisdiction" className="text-sm font-bold text-foreground">Jurisdiction</label>
      <select id="jurisdiction" className="rounded-lg border-2 border-input bg-background px-3 h-11 font-medium w-full">
        <option value="">Select jurisdiction</option>
        <option value="california">California</option>
        <option value="new-york">New York</option>
        <option value="texas">Texas</option>
        <option value="federal">Federal</option>
        <option value="other">Other</option>
      </select>
    </div>
  );
}
