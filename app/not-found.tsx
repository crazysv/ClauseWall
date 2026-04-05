import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold text-foreground mb-3">
          Page Not Found
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed mb-6">
          The page you're looking for doesn't exist or may have been moved. If
          you were analyzing a contract, it may have expired.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            Go Home
          </Link>
          <Link
            href="/upload"
            className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-sm font-semibold transition-colors"
          >
            Upload Contract
          </Link>
        </div>
      </div>
    </div>
  );
}
