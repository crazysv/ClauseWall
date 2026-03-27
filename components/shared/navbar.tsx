"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  Shield,
  Menu,
  X,
  Upload,
  BarChart3,
  Skull,
  ArrowLeftRight,
  FileStack,
  Hammer,
  Volume2,
  VolumeX,
  Handshake,
  Users,
  Scale,
  Mic,
  Gavel,
  FileSearch,
  Eye,
  TrendingUp,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSound } from "@/lib/audio/sound-context";
import { LanguagePreferencesModal } from "@/components/bhasha/language-preferences-modal";
import { LANGUAGE_CONFIGS } from "@/lib/bhasha/constants";
import type { SupportedLanguage } from "@/types/bhasha";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isMuted, toggleMute } = useSound();
  const pathname = usePathname();
  const [langPref, setLangPref] = useState<string>("en");
  const [showLangModal, setShowLangModal] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("clausewall_lang_pref");
    if (saved) setLangPref(saved);
  }, []);

  const handleLangChange = (lang: string) => {
    setLangPref(lang);
    localStorage.setItem("clausewall_lang_pref", lang);
  };

  const langConfig = langPref !== "en" ? LANGUAGE_CONFIGS[langPref as keyof typeof LANGUAGE_CONFIGS] : null;
  const langBadgeText = langConfig?.nativeName?.slice(0, 2) || null;

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <>
    <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Shield className="h-8 w-8 text-blue-500 transition-transform group-hover:scale-110" />
              <div className="absolute inset-0 h-8 w-8 bg-blue-500/20 blur-xl rounded-full" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Clause<span className="text-blue-500">Wall</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link href="/upload">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 transition-colors ${isActive('/upload') || isActive('/results') ? 'text-foreground font-medium border-b-2 border-blue-500 rounded-b-none' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Upload className="h-4 w-4" />
                Analyze
              </Button>
            </Link>
            <Link href="/builder">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 transition-colors ${isActive('/builder') ? 'text-foreground font-medium border-b-2 border-blue-500 rounded-b-none' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Hammer className="h-4 w-4" />
                Builder
              </Button>
            </Link>
            <Link href="/compare">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 transition-colors ${isActive('/compare') ? 'text-foreground font-medium border-b-2 border-blue-500 rounded-b-none' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <ArrowLeftRight className="h-4 w-4" />
                Compare
              </Button>
            </Link>
            <Link href="/vault">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 transition-colors ${isActive('/vault') ? 'text-foreground font-medium border-b-2 border-indigo-500 rounded-b-none' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <FileStack className="h-4 w-4" />
                Vault
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 transition-colors ${isActive('/dashboard') ? 'text-foreground font-medium border-b-2 border-blue-500 rounded-b-none' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <Link href="/wall-of-shame">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 transition-colors ${isActive('/wall-of-shame') ? 'text-foreground font-medium border-b-2 border-blue-500 rounded-b-none' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Skull className="h-4 w-4" />
                Wall of Shame
              </Button>
            </Link>
            <Link href="/collective">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 transition-colors ${isActive('/collective') ? 'text-foreground font-medium border-b-2 border-amber-500 rounded-b-none' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Users className="h-4 w-4" />
                Collectives
              </Button>
            </Link>
            <Link href="/negotiate/live">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 transition-colors ${isActive('/negotiate/live') ? 'text-foreground font-medium border-b-2 border-emerald-500 rounded-b-none' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Handshake className="h-4 w-4" />
                Negotiate
              </Button>
            </Link>
            <Link href="/lawchange">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 transition-colors ${isActive('/lawchange') ? 'text-foreground font-medium border-b-2 border-indigo-500 rounded-b-none' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Scale className="h-4 w-4" />
                Law Monitor
              </Button>
            </Link>
            <Link href="/voice">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 transition-colors ${isActive('/voice') ? 'text-foreground font-medium border-b-2 border-emerald-500 rounded-b-none' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Mic className="h-4 w-4" />
                Voice Aid
              </Button>
            </Link>
            <Link href="/complaint">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 transition-colors ${isActive('/complaint') ? 'text-foreground font-medium border-b-2 border-orange-500 rounded-b-none' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Gavel className="h-4 w-4" />
                Complain
              </Button>
            </Link>
            <Link href="/shadow">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 transition-colors ${isActive('/shadow') ? 'text-foreground font-medium border-b-2 border-amber-500 rounded-b-none' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <FileSearch className="h-4 w-4" />
                Shadow
              </Button>
            </Link>
            <Link href="/watchdog">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 transition-colors ${isActive('/watchdog') ? 'text-foreground font-medium border-b-2 border-cyan-500 rounded-b-none' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Eye className="h-4 w-4" />
                Watchdog
              </Button>
            </Link>
            <Link href="/evidence">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 transition-colors ${isActive('/evidence') ? 'text-foreground font-medium border-b-2 border-blue-500 rounded-b-none' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Shield className="h-4 w-4" />
                Evidence
              </Button>
            </Link>
            <Link href="/market">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 transition-colors ${isActive('/market') ? 'text-foreground font-medium border-b-2 border-cyan-500 rounded-b-none' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <TrendingUp className="h-4 w-4" />
                Market
              </Button>
            </Link>
            <Link href="/authority">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 transition-colors ${isActive('/authority') ? 'text-foreground font-medium border-b-2 border-purple-500 rounded-b-none' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Building2 className="h-4 w-4" />
                Authority
              </Button>
            </Link>
          </div>

          {/* Language Badge + Sound Toggle + CTA + Mobile Toggle */}
          <div className="flex items-center gap-2">
            {/* Bhasha Language Badge */}
            {langBadgeText && (
              <button
                onClick={() => setShowLangModal(true)}
                className="relative px-2 py-1 rounded-lg text-xs font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 hover:bg-indigo-500/25 transition-all"
                title={`Language: ${langConfig?.name}. Click to change.`}
              >
                {langBadgeText}
              </button>
            )}
            {/* Sound Toggle */}
            <button
              onClick={toggleMute}
              className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
              aria-label={isMuted ? "Unmute sound effects" : "Mute sound effects"}
              title={isMuted ? "Sound effects off" : "Sound effects on"}
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
              {/* Active indicator dot */}
              {!isMuted && (
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-blue-500" />
              )}
            </button>

            <Link href="/upload" className="hidden md:block">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 gap-2">
                <Upload className="h-4 w-4" />
                Upload Contract
              </Button>
            </Link>

            <button
              className="md:hidden p-2 text-muted-foreground hover:text-foreground"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-white/5 py-4 space-y-2">
            <Link
              href="/upload"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive('/upload') || isActive('/results') ? 'text-foreground bg-white/5' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
            >
              <Upload className="h-4 w-4" />
              Analyze Contract
            </Link>
            <Link
              href="/builder"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive('/builder') ? 'text-foreground bg-white/5' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
            >
              <Hammer className="h-4 w-4" />
              Contract Builder
            </Link>
            <Link
              href="/compare"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive('/compare') ? 'text-foreground bg-white/5' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
            >
              <ArrowLeftRight className="h-4 w-4" />
              Compare Contracts
            </Link>
            <Link
              href="/vault"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive('/vault') ? 'text-foreground bg-white/5' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
            >
              <FileStack className="h-4 w-4" />
              Contract Vault
            </Link>
            <Link
              href="/dashboard"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive('/dashboard') ? 'text-foreground bg-white/5' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
            >
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              href="/wall-of-shame"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive('/wall-of-shame') ? 'text-foreground bg-white/5' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
            >
              <Skull className="h-4 w-4" />
              Wall of Shame
            </Link>
            <Link
              href="/collective"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive('/collective') ? 'text-foreground bg-white/5' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
            >
              <Users className="h-4 w-4" />
              Collectives
            </Link>
            <Link
              href="/negotiate/live"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive('/negotiate/live') ? 'text-foreground bg-white/5' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
            >
              <Handshake className="h-4 w-4" />
              Live Negotiate
            </Link>
            <Link
              href="/lawchange"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive('/lawchange') ? 'text-foreground bg-white/5' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
            >
              <Scale className="h-4 w-4" />
              Law Monitor
            </Link>
            <Link
              href="/voice"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive('/voice') ? 'text-foreground bg-white/5' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
            >
              <Mic className="h-4 w-4" />
              🎤 Voice Aid
            </Link>
            <Link
              href="/complaint"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive('/complaint') ? 'text-foreground bg-white/5' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
            >
              <Gavel className="h-4 w-4" />
              ⚖️ File Complaint
            </Link>
            <Link
              href="/shadow"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive('/shadow') ? 'text-foreground bg-white/5' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
            >
              <FileSearch className="h-4 w-4" />
              🔍 Shadow Detector
            </Link>
            <Link
              href="/watchdog"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive('/watchdog') ? 'text-foreground bg-white/5' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
            >
              <Eye className="h-4 w-4" />
              👁️ Contract Watchdog
            </Link>
            <Link
              href="/evidence"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive('/evidence') ? 'text-foreground bg-white/5' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
            >
              <Shield className="h-4 w-4" />
              🛡️ Evidence Chain
            </Link>
            <Link
              href="/market"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive('/market') ? 'text-foreground bg-white/5' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
            >
              <TrendingUp className="h-4 w-4" />
              📊 Market Intel
            </Link>
            <Link
              href="/authority"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive('/authority') ? 'text-foreground bg-white/5' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
            >
              <Building2 className="h-4 w-4" />
              ⚖️ Legal Authority
            </Link>

            {/* Mobile Sound Toggle */}
            <button
              onClick={toggleMute}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors w-full"
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
              {isMuted ? "Unmute Sound Effects" : "Mute Sound Effects"}
            </button>

            <div className="pt-2 px-3">
              <Link href="/upload" onClick={() => setMobileOpen(false)}>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Contract
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>

    {/* Language Preferences Modal */}
    <LanguagePreferencesModal
      isOpen={showLangModal}
      onClose={() => setShowLangModal(false)}
    />
  </>
  );
}