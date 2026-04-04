// JurisdictionSelect component - Dropdown for selecting legal jurisdiction
"use client";

export function JurisdictionSelect() {
  return (
    <div className="space-y-2">
      <label
        htmlFor="jurisdiction"
        className="text-sm font-black uppercase tracking-wider text-foreground"
      >
        Jurisdiction
      </label>
      <select
        id="jurisdiction"
        className="border-2 border-foreground shadow-[inset_2px_2px_0px_0px_rgba(10,10,10,0.05)] bg-background px-3 h-11 font-bold w-full focus:border-primary focus:outline-none"
      >
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
