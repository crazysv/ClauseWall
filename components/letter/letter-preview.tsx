// LetterPreview component - Preview of generated response letter
export function LetterPreview({ letter }: { letter: any }) {
  return (
    <div className="letter-preview">
      <h3>Response Letter Preview</h3>
      <div className="letter-content">
        <div className="letter-header">
          <h4>{letter.subject}</h4>
          <p>Date: {letter.date}</p>
        </div>
        <div className="letter-body">
          <p>{letter.content}</p>
        </div>
        <div className="letter-footer">
          <p>Sincerely,</p>
          <p>{letter.signature}</p>
        </div>
      </div>
    </div>
  );
}
