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
  QrCode,
  Chrome,
  MessageSquare,
  Smartphone,
  Globe,
  Sparkles,
  Users,
  BadgeCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  return (
    <main className="w-full">
      {/* Background Effects structure kept hidden for visual flatness */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
      </div>

      {/* Hero Section */}
      <section className="min-h-[90vh] flex items-center bg-background px-4 md:px-6">
        <div className="mx-auto max-w-7xl text-center w-full pt-20 pb-32">
          <div className="animate-fade-in-up mb-8">
            <Badge
              variant="outline"
              className="px-4 py-1.5 text-sm border-2 border-foreground bg-background text-foreground font-black uppercase tracking-wider"
            >
              <Zap className="h-3.5 w-3.5 mr-1.5 text-foreground" />
              Free & Open Source — No Sign Up Required
            </Badge>
          </div>

          <h1 className="animate-fade-in-up stagger-1 text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-none text-foreground">
            Your Last Line of{" "}
            <span className="relative text-primary">
              Defense
            </span>{" "}
            <br className="hidden sm:block" />
            Before Signing
          </h1>

          <p className="animate-fade-in-up stagger-2 mt-6 text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
            India&apos;s first AI contract analyzer. ClauseWall finds clauses{" "}
            <span className="text-primary font-bold">designed to trap you</span>
            , cites the{" "}
            <span className="text-foreground font-bold">exact Indian laws they violate</span>
            , and helps you{" "}
            <span className="text-green-600 font-bold">negotiate with confidence</span>.
          </p>

          <div className="animate-fade-in-up stagger-3 mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/upload">
              <span className="inline-flex items-center justify-center button text-impact-heading border-2 border-foreground bg-primary text-primary-foreground px-8 py-4 text-lg hover:bg-red-700 transition-all duration-150 shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] hover:-translate-y-[2px] gap-2 w-full sm:w-auto">
                <Upload className="h-5 w-5" />
                Analyze Your Contract
                <ArrowRight className="h-5 w-5" />
              </span>
            </Link>
            <Link href="#features">
              <span className="inline-flex items-center justify-center button text-impact-heading border-2 border-foreground bg-muted text-foreground px-8 py-4 text-lg hover:bg-background transition-all duration-150 shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] hover:-translate-y-[2px] gap-2 w-full sm:w-auto">
                <Eye className="h-5 w-5" />
                See All Features
              </span>
            </Link>
          </div>

          <div className="animate-fade-in-up stagger-4 mt-12 flex flex-wrap items-center justify-center gap-6 text-sm font-semibold text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span><span className="text-foreground font-bold">100%</span> Free</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span><span className="text-foreground font-bold">750+</span> Legal Rules</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span><span className="text-foreground font-bold">Indian</span> Laws</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span><span className="text-foreground font-bold">Browser</span> Extension</span>
            </div>
          </div>
        </div>
      </section>

      {/* Extension Highlight Banner */}
      <section className="bg-muted py-16 px-4 md:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="card-impact border-2 border-foreground p-6 sm:p-8 bg-card">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                <div className="h-16 w-16 border-2 border-foreground bg-primary flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(10,10,10,1)]">
                  <Chrome className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  <h3 className="text-xl font-black uppercase tracking-wider text-foreground">Browser Extension</h3>
                  <Badge className="bg-primary text-primary-foreground font-black uppercase tracking-wider border-2 border-primary">
                    NEW
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm font-bold mt-2">
                  Automatically scan Terms of Service on any website. Visit Spotify, Uber, or any app&apos;s
                  legal page — ClauseWall highlights dangerous clauses in real-time.
                </p>
              </div>
              <div className="flex-shrink-0 mt-4 md:mt-0">
                <Link href="#extension">
                  <span className="inline-flex items-center justify-center button text-impact-heading border-2 border-foreground px-6 py-2.5 bg-foreground text-background hover:bg-muted hover:text-foreground transition-all duration-150 hover:-translate-y-[2px] shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] gap-2 text-sm">
                    <Globe className="h-4 w-4" />
                    Learn More
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Preview */}
      <section className="bg-background py-24 px-4 md:px-6 border-y-2 border-border">
        <div className="mx-auto max-w-5xl">
          <div className="card-impact border-2 border-foreground p-6 sm:p-8 bg-card relative shadow-[8px_8px_0px_0px_rgba(10,10,10,1)]">
            <div className="flex items-center gap-3 mb-8 border-b-2 border-foreground pb-4">
              <div className="h-3 w-3 rounded-full bg-red-600" />
              <div className="h-3 w-3 rounded-full bg-yellow-600" />
              <div className="h-3 w-3 rounded-full bg-green-600" />
              <span className="text-sm font-black text-foreground ml-2 uppercase tracking-wider">
                ClauseWall — sample_rental_agreement.pdf
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="border-2 border-foreground card-impact p-6 text-center bg-background">
                <div className="text-primary text-5xl font-black tabular-nums">73</div>
                <div className="text-sm font-black text-muted-foreground uppercase tracking-wider mt-2">Overall Risk Score</div>
              </div>
              <div className="border-2 border-foreground card-impact p-6 text-center bg-background">
                <div className="text-foreground text-5xl font-black tabular-nums">12</div>
                <div className="text-sm font-black text-muted-foreground uppercase tracking-wider mt-2">Clauses Analyzed</div>
              </div>
              <div className="border-2 border-foreground card-impact p-6 text-center bg-background">
                <div className="text-purple-600 text-5xl font-black tabular-nums">3</div>
                <div className="text-sm font-black text-muted-foreground uppercase tracking-wider mt-2">Illegal Clauses Found</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-background card-impact p-6 border-l-8 border-l-purple-600 border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] relative ml-2">
                <div className="flex items-center justify-between mb-4">
                  <Badge className="bg-purple-600 text-white font-black uppercase tracking-wider border-2 border-purple-600">
                    ⛔ ILLEGAL
                  </Badge>
                  <span className="text-sm font-black text-foreground uppercase tracking-wider">Score: 92/100</span>
                </div>
                <p className="text-sm text-foreground font-bold italic border-l-2 border-foreground/20 pl-4 py-1">
                  &quot;The security deposit of 10 months rent shall be forfeited entirely if tenant
                  terminates before lock-in period...&quot;
                </p>
                <p className="text-sm font-black text-purple-700 mt-4 uppercase tracking-wider leading-relaxed">
                  <span className="text-xl inline-block mr-2 relative top-0.5">⚖️</span>
                  Violates Model Tenancy Act, 2021 — Security deposit cannot exceed 2 months rent for residential property.
                </p>
              </div>

              <div className="bg-background card-impact p-6 border-l-8 border-l-primary border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] relative ml-2">
                <div className="flex items-center justify-between mb-4">
                  <Badge className="bg-primary text-primary-foreground font-black uppercase tracking-wider border-2 border-primary">
                    🔴 DANGEROUS
                  </Badge>
                  <span className="text-sm font-black text-foreground uppercase tracking-wider">Score: 74/100</span>
                </div>
                <p className="text-sm text-foreground font-bold italic border-l-2 border-foreground/20 pl-4 py-1">
                  &quot;Tenant shall not be entitled to any interest on the security deposit
                  amount for the entire duration...&quot;
                </p>
                <p className="text-sm font-black text-primary mt-4 uppercase tracking-wider leading-relaxed">
                  <span className="text-xl inline-block mr-2 relative top-0.5">⚖️</span>
                  Potential violation of Maharashtra Rent Control Act — Landlord must pay interest on deposit in certain states.
                </p>
              </div>

              <div className="bg-background card-impact p-6 border-l-8 border-l-green-600 border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] relative ml-2">
                <div className="flex items-center justify-between mb-4">
                  <Badge className="bg-green-600 text-white font-black uppercase tracking-wider border-2 border-green-600">
                    ✅ SAFE
                  </Badge>
                  <span className="text-sm font-black text-foreground uppercase tracking-wider">Score: 8/100</span>
                </div>
                <p className="text-sm text-foreground font-bold italic border-l-2 border-foreground/20 pl-4 py-1">
                  &quot;The monthly rent shall be ₹25,000 payable on or before the 5th of each
                  month via bank transfer...&quot;
                </p>
                <p className="text-sm font-black text-green-700 mt-4 uppercase tracking-wider leading-relaxed">
                  Standard rent payment clause. Fair and straightforward.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-muted py-20 md:py-32 px-4 md:px-6 border-t-2 border-border">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            Not Just Another <span className="text-primary">AI Tool</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mt-4 max-w-2xl mx-auto font-medium">
            ChatGPT gives vague advice. ClauseWall gives you exact Indian laws, risk scores,
            negotiation scripts, and legal notices.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Existing Features */}
          <Link href="/upload" className="block group">
            <Card className="card-impact border-2 border-foreground p-8 hover:-translate-y-[4px] hover:shadow-[8px_8px_0px_0px_rgba(10,10,10,1)] transition-all duration-150 h-full">
              <CardContent className="p-0">
                <div className="w-12 h-12 border-2 border-foreground bg-muted flex items-center justify-center mb-4 transition-transform group-hover:-translate-y-1">
                  <Scale className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-wider text-foreground mt-4 mb-2">750+ Legal Rules</h3>
                <p className="text-muted-foreground font-bold leading-relaxed text-sm">
                  Verified against Indian Contract Act, RERA, Model Tenancy Act, and state-specific
                  laws. Not AI guesses — real legal database.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/upload" className="block group">
            <Card className="card-impact border-2 border-foreground p-8 hover:-translate-y-[4px] hover:shadow-[8px_8px_0px_0px_rgba(10,10,10,1)] transition-all duration-150 h-full">
              <CardContent className="p-0">
                <div className="w-12 h-12 border-2 border-foreground bg-muted flex items-center justify-center mb-4 transition-transform group-hover:-translate-y-1">
                  <AlertTriangle className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-wider text-foreground mt-4 mb-2">Clause-by-Clause Scoring</h3>
                <p className="text-muted-foreground font-bold leading-relaxed text-sm">
                  Every clause gets a 0-100 risk score with plain English explanation. No legal
                  jargon. No confusion.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/upload" className="block group">
            <Card className="card-impact border-2 border-foreground p-8 hover:-translate-y-[4px] hover:shadow-[8px_8px_0px_0px_rgba(10,10,10,1)] transition-all duration-150 h-full">
              <CardContent className="p-0">
                <div className="w-12 h-12 border-2 border-foreground bg-muted flex items-center justify-center mb-4 transition-transform group-hover:-translate-y-1">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-wider text-foreground mt-4 mb-2">Legal Notice Generator</h3>
                <p className="text-muted-foreground font-bold leading-relaxed text-sm">
                  Don&apos;t just find problems — fight back. Auto-generate a professional legal
                  notice citing every violation.
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* NEW Feature Cards */}
          <Link href="/upload" className="block group">
            <Card className="card-impact border-2 border-foreground p-8 hover:-translate-y-[4px] hover:shadow-[8px_8px_0px_0px_rgba(10,10,10,1)] transition-all duration-150 h-full relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <Badge className="bg-foreground text-background font-black uppercase tracking-wider text-[10px] border-2 border-foreground">
                  NEW
                </Badge>
              </div>
              <CardContent className="p-0">
                <div className="w-12 h-12 border-2 border-foreground bg-muted flex items-center justify-center mb-4 transition-transform group-hover:-translate-y-1">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-wider text-foreground mt-4 mb-2">Negotiation Playbook</h3>
                <p className="text-muted-foreground font-bold leading-relaxed text-sm">
                  Get exact scripts for what to say to your landlord. Counter-responses for every
                  pushback. Share to WhatsApp.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Card id="extension" className="card-impact border-2 border-foreground p-8 hover:-translate-y-[4px] hover:shadow-[8px_8px_0px_0px_rgba(10,10,10,1)] transition-all duration-150 h-full relative overflow-hidden group">
            <div className="absolute top-4 right-4">
              <Badge className="bg-foreground text-background font-black uppercase tracking-wider text-[10px] border-2 border-foreground">
                NEW
              </Badge>
            </div>
            <CardContent className="p-0">
              <div className="w-12 h-12 border-2 border-foreground bg-muted flex items-center justify-center mb-4 transition-transform group-hover:-translate-y-1">
                <Chrome className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-wider text-foreground mt-4 mb-2">Browser Extension</h3>
              <p className="text-muted-foreground font-bold leading-relaxed text-sm">
                Auto-scan Terms of Service on any website. Extension highlights dangerous clauses
                in real-time. Works on Chrome, Brave, Edge.
              </p>
            </CardContent>
          </Card>

          <Card className="card-impact border-2 border-foreground p-8 hover:-translate-y-[4px] hover:shadow-[8px_8px_0px_0px_rgba(10,10,10,1)] transition-all duration-150 h-full relative overflow-hidden group">
            <div className="absolute top-4 right-4">
              <Badge className="bg-foreground text-background font-black uppercase tracking-wider text-[10px] border-2 border-foreground">
                NEW
              </Badge>
            </div>
            <CardContent className="p-0">
              <div className="w-12 h-12 border-2 border-foreground bg-muted flex items-center justify-center mb-4 transition-transform group-hover:-translate-y-1">
                <QrCode className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-wider text-foreground mt-4 mb-2">QR Verification Badge</h3>
              <p className="text-muted-foreground font-bold leading-relaxed text-sm">
                &quot;Scan Before You Sign&quot; — Generate a QR badge for your contract. Tenant scans,
                sees verification status. Build trust.
              </p>
            </CardContent>
          </Card>

          <Card className="card-impact border-2 border-foreground p-8 hover:-translate-y-[4px] hover:shadow-[8px_8px_0px_0px_rgba(10,10,10,1)] transition-all duration-150 h-full group">
            <CardContent className="p-0">
              <div className="w-12 h-12 border-2 border-foreground bg-muted flex items-center justify-center mb-4 transition-transform group-hover:-translate-y-1">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-wider text-foreground mt-4 mb-2">Fair Alternative Suggestions</h3>
              <p className="text-muted-foreground font-bold leading-relaxed text-sm">
                For every predatory clause, we show how it SHOULD read. Copy-paste the fair
                version into your counter-proposal.
              </p>
            </CardContent>
          </Card>

          <Card className="card-impact border-2 border-foreground p-8 hover:-translate-y-[4px] hover:shadow-[8px_8px_0px_0px_rgba(10,10,10,1)] transition-all duration-150 h-full group">
            <CardContent className="p-0">
              <div className="w-12 h-12 border-2 border-foreground bg-muted flex items-center justify-center mb-4 transition-transform group-hover:-translate-y-1">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-wider text-foreground mt-4 mb-2">Community Intelligence</h3>
              <p className="text-muted-foreground font-bold leading-relaxed text-sm">
                &quot;This clause pattern has been flagged 47 times in Mumbai.&quot; Learn from
                others&apos; experiences. Crowdsourced protection.
              </p>
            </CardContent>
          </Card>

          <Link href="/wall-of-shame" className="block group">
            <Card className="card-impact border-2 border-foreground p-8 hover:-translate-y-[4px] hover:shadow-[8px_8px_0px_0px_rgba(10,10,10,1)] transition-all duration-150 h-full">
              <CardContent className="p-0">
                <div className="w-12 h-12 border-2 border-foreground bg-muted flex items-center justify-center mb-4 transition-transform group-hover:-translate-y-1">
                  <Blocks className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-wider text-foreground mt-4 mb-2">Wall of Shame</h3>
                <p className="text-muted-foreground font-bold leading-relaxed text-sm">
                  &quot;This landlord&apos;s contracts have been flagged 47
                  times.&quot; Check entity reputation before you sign.
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-background py-20 md:py-32 px-4 md:px-6 border-t-2 border-border">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            Three Steps to <span className="text-primary">Protection</span>
          </h2>
          <p className="text-lg text-muted-foreground mt-4 font-medium">
            It takes just seconds to protect yourself from predatory clauses.
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-start gap-12 md:gap-8 max-w-7xl mx-auto">
          <div className="flex-1 text-center md:text-left relative group w-full">
            <div className="hidden md:block absolute top-[24px] left-[60px] lg:left-[80px] right-[-20%] lg:right-[-10%] border-t-2 border-dashed border-foreground/30" />
            <div className="w-12 h-12 border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] bg-primary text-primary-foreground font-black text-lg flex items-center justify-center mb-6 mx-auto md:mx-0 relative z-10 transition-transform group-hover:-translate-y-1">
              1
            </div>
            <h3 className="text-xl font-black uppercase tracking-wider text-foreground mt-4 mb-3">Upload</h3>
            <p className="text-sm text-muted-foreground font-bold leading-relaxed">
              Drop your PDF or paste the contract text. Rental agreements, offer letters,
              loan documents — we handle them all.
            </p>
          </div>

          <div className="flex-1 text-center md:text-left relative group w-full">
            <div className="hidden md:block absolute top-[24px] left-[60px] lg:left-[80px] right-[-20%] lg:right-[-10%] border-t-2 border-dashed border-foreground/30" />
            <div className="w-12 h-12 border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] bg-primary text-primary-foreground font-black text-lg flex items-center justify-center mb-6 mx-auto md:mx-0 relative z-10 transition-transform group-hover:-translate-y-1">
              2
            </div>
            <h3 className="text-xl font-black uppercase tracking-wider text-foreground mt-4 mb-3">Analyze</h3>
            <p className="text-sm text-muted-foreground font-bold leading-relaxed">
              Quick scan in 5 seconds. Full verified analysis in 60 seconds.
            </p>
          </div>

          <div className="flex-1 text-center md:text-left relative group w-full">
            <div className="w-12 h-12 border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] bg-primary text-primary-foreground font-black text-lg flex items-center justify-center mb-6 mx-auto md:mx-0 relative z-10 transition-transform group-hover:-translate-y-1">
              3
            </div>
            <h3 className="text-xl font-black uppercase tracking-wider text-foreground mt-4 mb-3">Protect</h3>
            <p className="text-sm text-muted-foreground font-bold leading-relaxed">
              Get negotiation scripts, generate legal notices, share QR badge.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-background px-4 md:px-6">
        <div className="max-w-7xl mx-auto border-t-2 border-border pt-16 pb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center md:text-left">
            <div>
              <div className="text-5xl md:text-6xl font-black tabular-nums text-foreground">750+</div>
              <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider mt-2">Legal Rules</div>
            </div>
            <div>
              <div className="text-5xl md:text-6xl font-black tabular-nums text-foreground">21</div>
              <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider mt-2">Indian States</div>
            </div>
            <div>
              <div className="text-5xl md:text-6xl font-black tabular-nums text-foreground">10</div>
              <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider mt-2">Contract Types</div>
            </div>
            <div>
              <div className="text-5xl md:text-6xl font-black tabular-nums text-foreground">5 sec</div>
              <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider mt-2">Quick Scan</div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-muted py-24 px-4 md:px-6 border-t-2 border-border">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-foreground mb-6">
            Your Next Contract Could Cost You{" "}
            <span className="text-primary">Everything</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl mx-auto font-medium">
            Lakhs of Indians sign predatory rental agreements every year. Employment bonds
            with illegal clauses trap workers. Build your wall.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/upload">
              <span className="inline-flex items-center justify-center button text-impact-heading border-2 border-foreground bg-primary text-primary-foreground px-10 py-5 hover:bg-red-700 transition-all duration-150 shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] hover:-translate-y-[2px] gap-3">
                <Shield className="h-6 w-6" />
                Build Your Wall — It&apos;s Free
                <ChevronRight className="h-6 w-6" />
              </span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}