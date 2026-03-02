// Analysis page - Shows real-time analysis progress
export default function AnalyzePage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1>Analyzing Document</h1>
      <p>Analysis ID: {params.id}</p>
      <p>Document analysis in progress...</p>
    </div>
  );
}
