import Link from "next/link";
import { Shield } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-semibold">
              Clause<span className="text-blue-500">Wall</span>
            </span>
            <span className="text-xs text-muted-foreground">
              — A wall between you and predatory contracts
            </span>
          </div>

          <div className="flex items-center gap-6">
            <Link
              href="/upload"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Analyze
            </Link>
            <Link
              href="/wall-of-shame"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Wall of Shame
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              GitHub
            </a>
          </div>

          <p className="text-xs text-muted-foreground">
            Free & open source. Not legal advice.
          </p>
        </div>
      </div>
    </footer>
  );
}