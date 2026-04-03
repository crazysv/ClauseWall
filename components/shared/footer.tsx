import Link from "next/link";
import { Shield } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-foreground text-background border-t-2 border-foreground/20 w-full py-16 px-4 md:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2 group w-fit">
              <Shield className="h-6 w-6 text-primary transition-transform group-hover:scale-110" />
              <span className="text-xl font-black tracking-tight text-background">
                Clause<span className="text-primary">Wall</span>
              </span>
            </Link>
            <p className="text-sm text-background/60 leading-relaxed max-w-xs">
              A wall between you and predatory contracts. Empowering everyday people with AI-driven contract intelligence.
            </p>
          </div>

          <div className="col-span-1 flex flex-col gap-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-background/40 mb-4">Product</h3>
            <Link href="/upload" className="text-background/60 hover:text-background font-medium transition-colors duration-150 w-fit">
              Analyze Contract
            </Link>
            <Link href="/wall-of-shame" className="text-background/60 hover:text-background font-medium transition-colors duration-150 w-fit">
              Wall of Shame
            </Link>
            <Link href="/dashboard" className="text-background/60 hover:text-background font-medium transition-colors duration-150 w-fit">
              Dashboard
            </Link>
          </div>

          <div className="col-span-1 flex flex-col gap-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-background/40 mb-4">Legal</h3>
            <span className="text-background/60 font-medium cursor-pointer hover:text-background transition-colors w-fit">Privacy Policy</span>
            <span className="text-background/60 font-medium cursor-pointer hover:text-background transition-colors w-fit">Terms of Service</span>
            <span className="text-background/60 font-medium whitespace-nowrap">Not actual legal advice.</span>
          </div>

          <div className="col-span-1 flex flex-col gap-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-background/40 mb-4">Connect</h3>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-background/60 hover:text-background font-medium transition-colors duration-150 w-fit">
              GitHub
            </a>
            <a href="mailto:hello@clausewall.com" className="text-background/60 hover:text-background font-medium transition-colors duration-150 w-fit">
              Contact Us
            </a>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-background/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-background/40 font-medium">
            © 2024 ClauseWall. All rights reserved.
          </p>
          <p className="text-sm text-background/40 font-medium">
            Free & open source.
          </p>
        </div>
      </div>
    </footer>
  );
}