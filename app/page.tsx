"use client";

import Link from "next/link";
import {
  Shield,
  Upload,
  AlertTriangle,
  Scale,
  FileText,
  ArrowRight,
  CheckCircle2,
  Zap,
  Eye,
  BookOpen,
  ChevronRight,
  Blocks,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  return (
    <div className="relative">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
      </div>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-20 pb-32">
        <div className="mx-auto max-w-7xl text-center">
          <div className="animate-fade-in-up mb-8">
            <Badge
              variant="outline"
              className="px-4 py-1.5 text-sm border-blue-500/30 bg-blue-500/5 text-blue-400"
            >
              <Zap className="h-3.5 w-3.5 mr-1.5" />
              Free & Open Source — No Sign Up Required
            </Badge>
          </div>

          <h1 className="animate-fade-in-up stagger-1 text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
            Your Last Line of{" "}
            <span className="relative">
              <span className="gradient-text">Defense</span>
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
            </span>{" "}
            <br className="hidden sm:block" />
            Before Signing
          </h1>

          <p className="animate-fade-in-up stagger-2 mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            India&apos;s first AI contract analyzer. ClauseWall finds clauses{" "}
            <span className="text-red-400 font-medium">designed to trap you</span>
            , cites the{" "}
            <span className="text-blue-400 font-medium">exact Indian laws they violate</span>
            , and builds a{" "}
            <span className="text-green-400 font-medium">wall of protection</span>{" "}
            around you.
          </p>

          <div className="animate-fade-in-up stagger-3 mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/upload">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6 gap-2 shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40 hover:scale-105"
              >
                <Upload className="h-5 w-5" />
                Analyze Your Contract
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 py-6 gap-2 border-white/10 hover:bg-white/5"
              >
                <Eye className="h-5 w-5" />
                See How It Works
              </Button>
            </Link>
          </div>

          <div className="animate-fade-in-up stagger-4 mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>100% Free</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>No Data Stored</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Indian Laws</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Real Legal Citations</span>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Preview */}
      <section className="relative px-4 sm:px-6 lg:px-8 pb-24">
        <div className="mx-auto max-w-5xl">
          <div className="glass rounded-2xl p-6 sm:p-8 glow-blue">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span className="text-sm text-muted-foreground ml-2">
                ClauseWall — sample_rental_agreement.pdf
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="glass rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-red-400">73</div>
                <div className="text-xs text-muted-foreground mt-1">Overall Risk Score</div>
              </div>
              <div className="glass rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-foreground">12</div>
                <div className="text-xs text-muted-foreground mt-1">Clauses Analyzed</div>
              </div>
              <div className="glass rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-purple-400">3</div>
                <div className="text-xs text-muted-foreground mt-1">Illegal Clauses Found</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="glass rounded-xl p-4 border-l-4 border-l-purple-500">
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                    ⛔ ILLEGAL
                  </Badge>
                  <span className="text-sm text-muted-foreground">Score: 92/100</span>
                </div>
                <p className="text-sm text-muted-foreground italic">
                  &quot;The security deposit of 10 months rent shall be forfeited entirely if tenant
                  terminates before lock-in period...&quot;
                </p>
                <p className="text-sm text-red-400 mt-2">
                  ⚖️ Violates Model Tenancy Act, 2021 — Security deposit cannot exceed 2 months
                  rent for residential property.
                </p>
              </div>

              <div className="glass rounded-xl p-4 border-l-4 border-l-red-500">
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                    🔴 DANGEROUS
                  </Badge>
                  <span className="text-sm text-muted-foreground">Score: 74/100</span>
                </div>
                <p className="text-sm text-muted-foreground italic">
                  &quot;Tenant shall not be entitled to any interest on the security deposit
                  amount for the entire duration...&quot;
                </p>
                <p className="text-sm text-yellow-400 mt-2">
                  ⚖️ Potential violation of Maharashtra Rent Control Act — Landlord must pay
                  interest on deposit in certain states.
                </p>
              </div>

              <div className="glass rounded-xl p-4 border-l-4 border-l-green-500">
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    ✅ SAFE
                  </Badge>
                  <span className="text-sm text-muted-foreground">Score: 8/100</span>
                </div>
                <p className="text-sm text-muted-foreground italic">
                  &quot;The monthly rent shall be ₹25,000 payable on or before the 5th of each
                  month via bank transfer...&quot;
                </p>
                <p className="text-sm text-green-400 mt-2">
                  Standard rent payment clause. Fair and straightforward.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-24 border-t border-white/5">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Not Just Another <span className="gradient-text">AI Tool</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              ChatGPT gives vague advice. ClauseWall gives you exact Indian laws, risk scores,
              and legal notices.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="glass border-white/5 hover:border-blue-500/20 transition-all hover:glow-blue group">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Scale className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">State-Aware Analysis</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Not generic advice. We check YOUR state&apos;s specific laws — Maharashtra Rent
                  Control Act, Delhi Rent Act, Karnataka Rent Act, and more.
                </p>
              </CardContent>
            </Card>

            <Card className="glass border-white/5 hover:border-red-500/20 transition-all hover:glow-red group">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <AlertTriangle className="h-6 w-6 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Clause-by-Clause Scoring</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Every clause gets a 0-100 risk score with plain English explanation. No legal
                  jargon. No confusion.
                </p>
              </CardContent>
            </Card>

            <Card className="glass border-white/5 hover:border-green-500/20 transition-all hover:glow-green group">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileText className="h-6 w-6 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Legal Notice Generator</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Don&apos;t just find problems — fight back. Auto-generate a professional legal
                  notice under Indian law citing every violation.
                </p>
              </CardContent>
            </Card>

            <Card className="glass border-white/5 hover:border-purple-500/20 transition-all hover:glow-purple group">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BookOpen className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Fair Alternative Suggestions</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  For every predatory clause, we show how it SHOULD read. Copy-paste the fair
                  version into your counter-proposal.
                </p>
              </CardContent>
            </Card>

            <Card className="glass border-white/5 hover:border-yellow-500/20 transition-all group">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-xl bg-yellow-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Eye className="h-6 w-6 text-yellow-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Comparison Engine</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  &quot;This deposit clause is harsher than 94% of similar agreements in
                  Mumbai.&quot; Know exactly where you stand.
                </p>
              </CardContent>
            </Card>

            <Card className="glass border-white/5 hover:border-red-500/20 transition-all hover:glow-red group">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Blocks className="h-6 w-6 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Wall of Shame</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Community-powered. &quot;This landlord&apos;s contracts have been flagged 47
                  times.&quot; Check before you sign.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative px-4 sm:px-6 lg:px-8 py-24 border-t border-white/5">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Three Steps to <span className="gradient-text">Protection</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Upload className="h-8 w-8 text-blue-400" />
              </div>
              <div className="text-sm font-medium text-blue-400 mb-2">Step 1</div>
              <h3 className="text-xl font-semibold mb-3">Upload</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Drop your PDF or paste the contract text. Rental agreements, offer letters,
                loan documents — we handle them all.
              </p>
            </div>

            <div className="text-center group relative">
              <div className="hidden md:block absolute top-8 -left-4 w-8 border-t border-dashed border-white/10" />
              <div className="hidden md:block absolute top-8 -right-4 w-8 border-t border-dashed border-white/10" />
              <div className="mx-auto h-16 w-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="h-8 w-8 text-purple-400" />
              </div>
              <div className="text-sm font-medium text-purple-400 mb-2">Step 2</div>
              <h3 className="text-xl font-semibold mb-3">Analyze</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                ClauseWall breaks down every clause, checks against Indian laws and your
                state&apos;s specific regulations, and scores each one.
              </p>
            </div>

            <div className="text-center group">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-green-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="h-8 w-8 text-green-400" />
              </div>
              <div className="text-sm font-medium text-green-400 mb-2">Step 3</div>
              <h3 className="text-xl font-semibold mb-3">Protect</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Get your risk report, generate a legal notice, and sign with confidence — or
                walk away with proof.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-24 border-t border-white/5">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Your Next Contract Could Cost You{" "}
            <span className="text-red-400">Everything</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
            Lakhs of Indians sign predatory rental agreements every year. Employment bonds
            with illegal clauses trap workers. Build your wall.
          </p>
          <Link href="/upload">
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-lg px-10 py-7 gap-3 shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40 hover:scale-105"
            >
              <Shield className="h-5 w-5" />
              Build Your Wall — It&apos;s Free
              <ChevronRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}