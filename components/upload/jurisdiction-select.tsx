// JurisdictionSelect component - Dropdown for selecting legal jurisdiction
'use client';

export function JurisdictionSelect() {
  return (
    <div className="jurisdiction-select">
      <label htmlFor="jurisdiction">Jurisdiction</label>
      <select id="jurisdiction">
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
