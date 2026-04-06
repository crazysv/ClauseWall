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
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
            <div className="hidden lg:flex items-center gap-6 overflow-visible">
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

              {/* Tools Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
                  >
                    Tools <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48 bg-background border-2 border-foreground shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/builder" className="w-full font-bold"><Hammer className="h-4 w-4 mr-2" /> Builder</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/evidence" className="w-full font-bold"><Shield className="h-4 w-4 mr-2" /> Evidence Chain</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/complaint" className="w-full font-bold"><Gavel className="h-4 w-4 mr-2" /> File Complaint</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/negotiate/live" className="w-full font-bold"><Handshake className="h-4 w-4 mr-2" /> Live Negotiate</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/compare" className="w-full font-bold"><ArrowLeftRight className="h-4 w-4 mr-2" /> Compare</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/shadow" className="w-full font-bold"><FileSearch className="h-4 w-4 mr-2" /> Shadow Detector</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/vault" className="w-full font-bold"><FileStack className="h-4 w-4 mr-2" /> Vault</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/voice" className="w-full font-bold"><Mic className="h-4 w-4 mr-2" /> Voice Aid</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Intelligence Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
                  >
                    Intelligence <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48 bg-background border-2 border-foreground shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/authority" className="w-full font-bold"><Building2 className="h-4 w-4 mr-2" /> Legal Authority</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/market" className="w-full font-bold"><TrendingUp className="h-4 w-4 mr-2" /> Market Intel</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/lawchange" className="w-full font-bold"><Scale className="h-4 w-4 mr-2" /> Law Monitor</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/watchdog" className="w-full font-bold"><Eye className="h-4 w-4 mr-2" /> Watchdog</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/wall-of-shame" className="w-full font-bold"><Skull className="h-4 w-4 mr-2" /> Wall of Shame</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/collective" className="w-full font-bold"><Users className="h-4 w-4 mr-2" /> Collectives</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
                <button className="bg-primary text-primary-foreground font-bold px-6 py-2.5 rounded-lg hover:bg-red-700 transition-colors duration-150 gap-2 flex items-center shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                  <Upload className="h-4 w-4" />
                  Analyze New
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
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className={getMobileNavClass(isActive("/dashboard"))}
                >
                  <BarChart3 className="h-4 w-4" /> Dashboard
                </Link>

                <div className="pt-4 pb-2">
                  <p className="px-3 text-xs font-black uppercase tracking-wider text-muted-foreground mb-2">Action Tools</p>
                  <div className="space-y-1">
                    <Link href="/builder" onClick={() => setMobileOpen(false)} className={getMobileNavClass(isActive("/builder"))}>
                      <Hammer className="h-4 w-4" /> Builder
                    </Link>
                    <Link href="/evidence" onClick={() => setMobileOpen(false)} className={getMobileNavClass(isActive("/evidence"))}>
                      <Shield className="h-4 w-4" /> Evidence Chain
                    </Link>
                    <Link href="/complaint" onClick={() => setMobileOpen(false)} className={getMobileNavClass(isActive("/complaint"))}>
                      <Gavel className="h-4 w-4" /> File Complaint
                    </Link>
                    <Link href="/negotiate/live" onClick={() => setMobileOpen(false)} className={getMobileNavClass(isActive("/negotiate/live"))}>
                      <Handshake className="h-4 w-4" /> Live Negotiate
                    </Link>
                    <Link href="/compare" onClick={() => setMobileOpen(false)} className={getMobileNavClass(isActive("/compare"))}>
                      <ArrowLeftRight className="h-4 w-4" /> Compare
                    </Link>
                    <Link href="/shadow" onClick={() => setMobileOpen(false)} className={getMobileNavClass(isActive("/shadow"))}>
                      <FileSearch className="h-4 w-4" /> Shadow Detector
                    </Link>
                    <Link href="/vault" onClick={() => setMobileOpen(false)} className={getMobileNavClass(isActive("/vault"))}>
                      <FileStack className="h-4 w-4" /> Vault
                    </Link>
                    <Link href="/voice" onClick={() => setMobileOpen(false)} className={getMobileNavClass(isActive("/voice"))}>
                      <Mic className="h-4 w-4" /> Voice Aid
                    </Link>
                  </div>
                </div>

                <div className="pt-2 pb-2">
                  <p className="px-3 text-xs font-black uppercase tracking-wider text-muted-foreground mb-2">Intelligence</p>
                  <div className="space-y-1">
                    <Link href="/authority" onClick={() => setMobileOpen(false)} className={getMobileNavClass(isActive("/authority"))}>
                      <Building2 className="h-4 w-4" /> Legal Authority
                    </Link>
                    <Link href="/market" onClick={() => setMobileOpen(false)} className={getMobileNavClass(isActive("/market"))}>
                      <TrendingUp className="h-4 w-4" /> Market Intel
                    </Link>
                    <Link href="/lawchange" onClick={() => setMobileOpen(false)} className={getMobileNavClass(isActive("/lawchange"))}>
                      <Scale className="h-4 w-4" /> Law Monitor
                    </Link>
                    <Link href="/watchdog" onClick={() => setMobileOpen(false)} className={getMobileNavClass(isActive("/watchdog"))}>
                      <Eye className="h-4 w-4" /> Contract Watchdog
                    </Link>
                    <Link href="/wall-of-shame" onClick={() => setMobileOpen(false)} className={getMobileNavClass(isActive("/wall-of-shame"))}>
                      <Skull className="h-4 w-4" /> Wall of Shame
                    </Link>
                    <Link href="/collective" onClick={() => setMobileOpen(false)} className={getMobileNavClass(isActive("/collective"))}>
                      <Users className="h-4 w-4" /> Collectives
                    </Link>
                  </div>
                </div>

                {/* Mobile Sound Toggle */}
                <button
                  onClick={toggleMute}
                  className="flex items-center gap-3 px-3 py-3 border-t border-border mt-2 text-base font-bold text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors w-full"
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
                    <button className="w-full flex items-center justify-center bg-primary text-primary-foreground font-bold px-6 py-3 rounded-lg hover:bg-red-700 transition-colors duration-150 gap-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                      <Upload className="h-4 w-4" />
                      Analyze New
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
