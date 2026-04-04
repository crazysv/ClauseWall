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

  const langConfig =
    langPref !== "en"
      ? LANGUAGE_CONFIGS[langPref as keyof typeof LANGUAGE_CONFIGS]
      : null;
  const langBadgeText = langConfig?.nativeName?.slice(0, 2) || null;

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname.startsWith(href);

  const getDesktopNavClass = (active: boolean) =>
    `gap-2 transition-colors duration-150 ${active ? "text-foreground font-bold border-b-2 border-foreground rounded-none" : "text-sm font-semibold text-muted-foreground hover:text-foreground"}`;

  const getMobileNavClass = (active: boolean) =>
    `flex items-center gap-3 px-3 py-3 rounded-lg border-b border-border text-base font-bold transition-colors ${active ? "text-foreground bg-foreground/5" : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"}`;

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b-2 border-foreground/10 bg-background h-16">
        <div className="mx-auto max-w-7xl px-4 md:px-6 h-full">
          <div className="flex h-full items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <Shield className="h-8 w-8 text-primary transition-transform group-hover:scale-110" />
              <span className="text-xl font-black tracking-tight">
                Clause<span className="text-primary">Wall</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-8 overflow-x-auto no-scrollbar">
              <Link href="/upload">
                <Button
                  variant="ghost"
                  size="sm"
                  className={getDesktopNavClass(
                    isActive("/upload") || isActive("/results"),
                  )}
                >
                  <Upload className="h-4 w-4" />
                  Analyze
                </Button>
              </Link>
              <Link href="/builder">
                <Button
                  variant="ghost"
                  size="sm"
                  className={getDesktopNavClass(isActive("/builder"))}
                >
                  <Hammer className="h-4 w-4" />
                  Builder
                </Button>
              </Link>
              <Link href="/compare">
                <Button
                  variant="ghost"
                  size="sm"
                  className={getDesktopNavClass(isActive("/compare"))}
                >
                  <ArrowLeftRight className="h-4 w-4" />
                  Compare
                </Button>
              </Link>
              <Link href="/vault">
                <Button
                  variant="ghost"
                  size="sm"
                  className={getDesktopNavClass(isActive("/vault"))}
                >
                  <FileStack className="h-4 w-4" />
                  Vault
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  size="sm"
                  className={getDesktopNavClass(isActive("/dashboard"))}
                >
                  <BarChart3 className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/wall-of-shame">
                <Button
                  variant="ghost"
                  size="sm"
                  className={getDesktopNavClass(isActive("/wall-of-shame"))}
                >
                  <Skull className="h-4 w-4" />
                  Wall of Shame
                </Button>
              </Link>
              <Link href="/collective">
                <Button
                  variant="ghost"
                  size="sm"
                  className={getDesktopNavClass(isActive("/collective"))}
                >
                  <Users className="h-4 w-4" />
                  Collectives
                </Button>
              </Link>
              <Link href="/negotiate/live">
                <Button
                  variant="ghost"
                  size="sm"
                  className={getDesktopNavClass(isActive("/negotiate/live"))}
                >
                  <Handshake className="h-4 w-4" />
                  Negotiate
                </Button>
              </Link>
              <Link href="/lawchange">
                <Button
                  variant="ghost"
                  size="sm"
                  className={getDesktopNavClass(isActive("/lawchange"))}
                >
                  <Scale className="h-4 w-4" />
                  Law Monitor
                </Button>
              </Link>
              <Link href="/voice">
                <Button
                  variant="ghost"
                  size="sm"
                  className={getDesktopNavClass(isActive("/voice"))}
                >
                  <Mic className="h-4 w-4" />
                  Voice Aid
                </Button>
              </Link>
              <Link href="/complaint">
                <Button
                  variant="ghost"
                  size="sm"
                  className={getDesktopNavClass(isActive("/complaint"))}
                >
                  <Gavel className="h-4 w-4" />
                  Complain
                </Button>
              </Link>
              <Link href="/shadow">
                <Button
                  variant="ghost"
                  size="sm"
                  className={getDesktopNavClass(isActive("/shadow"))}
                >
                  <FileSearch className="h-4 w-4" />
                  Shadow
                </Button>
              </Link>
              <Link href="/watchdog">
                <Button
                  variant="ghost"
                  size="sm"
                  className={getDesktopNavClass(isActive("/watchdog"))}
                >
                  <Eye className="h-4 w-4" />
                  Watchdog
                </Button>
              </Link>
              <Link href="/evidence">
                <Button
                  variant="ghost"
                  size="sm"
                  className={getDesktopNavClass(isActive("/evidence"))}
                >
                  <Shield className="h-4 w-4" />
                  Evidence
                </Button>
              </Link>
              <Link href="/market">
                <Button
                  variant="ghost"
                  size="sm"
                  className={getDesktopNavClass(isActive("/market"))}
                >
                  <TrendingUp className="h-4 w-4" />
                  Market
                </Button>
              </Link>
              <Link href="/authority">
                <Button
                  variant="ghost"
                  size="sm"
                  className={getDesktopNavClass(isActive("/authority"))}
                >
                  <Building2 className="h-4 w-4" />
                  Authority
                </Button>
              </Link>
            </div>

            {/* Language Badge + Sound Toggle + CTA + Mobile Toggle */}
            <div className="flex items-center gap-2">
              {langBadgeText && (
                <button
                  onClick={() => setShowLangModal(true)}
                  className="relative px-2 py-1 rounded-lg text-xs font-bold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all font-semibold"
                  title={`Language: ${langConfig?.name}. Click to change.`}
                >
                  {langBadgeText}
                </button>
              )}
              <button
                onClick={toggleMute}
                className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors duration-150"
                aria-label={
                  isMuted ? "Unmute sound effects" : "Mute sound effects"
                }
                title={isMuted ? "Sound effects off" : "Sound effects on"}
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
                {!isMuted && (
                  <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </button>

              <Link href="/upload" className="hidden lg:block">
                <button className="bg-primary text-primary-foreground font-bold px-6 py-2.5 rounded-lg hover:bg-red-700 transition-colors duration-150 gap-2 flex items-center">
                  <Upload className="h-4 w-4" />
                  Upload Contract
                </button>
              </Link>

              <button
                className="lg:hidden p-2 text-muted-foreground hover:text-foreground border-2 border-transparent rounded-lg hover:border-foreground/10 transition-colors"
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
            <div className="lg:hidden bg-background border-b-2 border-foreground/10 absolute left-0 right-0 top-16 shadow-lg pb-4 max-h-[80vh] overflow-y-auto z-40">
              <div className="px-4 py-2 space-y-1">
                <Link
                  href="/upload"
                  onClick={() => setMobileOpen(false)}
                  className={getMobileNavClass(
                    isActive("/upload") || isActive("/results"),
                  )}
                >
                  <Upload className="h-4 w-4" /> Analyze
                </Link>
                <Link
                  href="/builder"
                  onClick={() => setMobileOpen(false)}
                  className={getMobileNavClass(isActive("/builder"))}
                >
                  <Hammer className="h-4 w-4" /> Builder
                </Link>
                <Link
                  href="/compare"
                  onClick={() => setMobileOpen(false)}
                  className={getMobileNavClass(isActive("/compare"))}
                >
                  <ArrowLeftRight className="h-4 w-4" /> Compare
                </Link>
                <Link
                  href="/vault"
                  onClick={() => setMobileOpen(false)}
                  className={getMobileNavClass(isActive("/vault"))}
                >
                  <FileStack className="h-4 w-4" /> Vault
                </Link>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className={getMobileNavClass(isActive("/dashboard"))}
                >
                  <BarChart3 className="h-4 w-4" /> Dashboard
                </Link>
                <Link
                  href="/wall-of-shame"
                  onClick={() => setMobileOpen(false)}
                  className={getMobileNavClass(isActive("/wall-of-shame"))}
                >
                  <Skull className="h-4 w-4" /> Wall of Shame
                </Link>
                <Link
                  href="/collective"
                  onClick={() => setMobileOpen(false)}
                  className={getMobileNavClass(isActive("/collective"))}
                >
                  <Users className="h-4 w-4" /> Collectives
                </Link>
                <Link
                  href="/negotiate/live"
                  onClick={() => setMobileOpen(false)}
                  className={getMobileNavClass(isActive("/negotiate/live"))}
                >
                  <Handshake className="h-4 w-4" /> Live Negotiate
                </Link>
                <Link
                  href="/lawchange"
                  onClick={() => setMobileOpen(false)}
                  className={getMobileNavClass(isActive("/lawchange"))}
                >
                  <Scale className="h-4 w-4" /> Law Monitor
                </Link>
                <Link
                  href="/voice"
                  onClick={() => setMobileOpen(false)}
                  className={getMobileNavClass(isActive("/voice"))}
                >
                  <Mic className="h-4 w-4" /> Voice Aid
                </Link>
                <Link
                  href="/complaint"
                  onClick={() => setMobileOpen(false)}
                  className={getMobileNavClass(isActive("/complaint"))}
                >
                  <Gavel className="h-4 w-4" /> File Complaint
                </Link>
                <Link
                  href="/shadow"
                  onClick={() => setMobileOpen(false)}
                  className={getMobileNavClass(isActive("/shadow"))}
                >
                  <FileSearch className="h-4 w-4" /> Shadow Detector
                </Link>
                <Link
                  href="/watchdog"
                  onClick={() => setMobileOpen(false)}
                  className={getMobileNavClass(isActive("/watchdog"))}
                >
                  <Eye className="h-4 w-4" /> Contract Watchdog
                </Link>
                <Link
                  href="/evidence"
                  onClick={() => setMobileOpen(false)}
                  className={getMobileNavClass(isActive("/evidence"))}
                >
                  <Shield className="h-4 w-4" /> Evidence Chain
                </Link>
                <Link
                  href="/market"
                  onClick={() => setMobileOpen(false)}
                  className={getMobileNavClass(isActive("/market"))}
                >
                  <TrendingUp className="h-4 w-4" /> Market Intel
                </Link>
                <Link
                  href="/authority"
                  onClick={() => setMobileOpen(false)}
                  className={getMobileNavClass(isActive("/authority"))}
                >
                  <Building2 className="h-4 w-4" /> Legal Authority
                </Link>

                {/* Mobile Sound Toggle */}
                <button
                  onClick={toggleMute}
                  className="flex items-center gap-3 px-3 py-3 border-b border-border rounded-lg text-base font-bold text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors w-full"
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                  {isMuted ? "Unmute Sound Effects" : "Mute Sound Effects"}
                </button>

                <div className="pt-4 pb-2 px-3">
                  <Link href="/upload" onClick={() => setMobileOpen(false)}>
                    <button className="w-full flex items-center justify-center bg-primary text-primary-foreground font-bold px-6 py-3 rounded-lg hover:bg-red-700 transition-colors duration-150 gap-2">
                      <Upload className="h-4 w-4" />
                      Upload Contract
                    </button>
                  </Link>
                </div>
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
