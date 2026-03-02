// TextInput component - Text area for direct contract text input
'use client';

export function TextInput() {
  return (
    <div className="text-input-container">
      <label htmlFor="contract-text">Paste Contract Text</label>
      <textarea
        id="contract-text"
        placeholder="Paste your contract text here..."
        rows={10}
      />
    </div>
  );
}
