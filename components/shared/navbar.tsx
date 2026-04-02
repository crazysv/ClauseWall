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
import { ThemeToggle } from "@/components/shared/theme-toggle";

export function Navbar() {
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
    <nav role="navigation" aria-label="Main navigation" data-no-print className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-700/60 bg-white dark:bg-card/90 backdrop-blur-xl shadow-sm dark:shadow-slate-900/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Shield className="h-8 w-8 text-indigo-600 transition-transform group-hover:scale-110" />
              <div className="absolute inset-0 h-8 w-8 bg-indigo-600/20 blur-xl rounded-full" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Clause<span className="text-indigo-600">Wall</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          {/* Added custom masking for a smooth fade if links overflow */}
          <div className="hidden md:flex items-center gap-1 overflow-x-auto no-scrollbar max-w-3xl">
            {[
              { href: '/upload', icon: Upload, label: 'Analyze' },
              { href: '/builder', icon: Hammer, label: 'Builder' },
              { href: '/compare', icon: ArrowLeftRight, label: 'Compare' },
              { href: '/vault', icon: FileStack, label: 'Vault' },
              { href: '/dashboard', icon: BarChart3, label: 'Dashboard' },
              { href: '/wall-of-shame', icon: Skull, label: 'Wall of Shame' },
              { href: '/collective', icon: Users, label: 'Collectives' },
              { href: '/negotiate/live', icon: Handshake, label: 'Negotiate' },
              { href: '/lawchange', icon: Scale, label: 'Law Monitor' },
              { href: '/voice', icon: Mic, label: 'Voice Aid' },
              { href: '/complaint', icon: Gavel, label: 'Complain' },
              { href: '/shadow', icon: FileSearch, label: 'Shadow' },
              { href: '/watchdog', icon: Eye, label: 'Watchdog' },
              { href: '/evidence', icon: Shield, label: 'Evidence' },
              { href: '/market', icon: TrendingUp, label: 'Market' },
              { href: '/authority', icon: Building2, label: 'Authority' },
            ].map(({ href, icon: Icon, label }) => {
              const active = href === '/upload' ? (isActive('/upload') || isActive('/results')) : isActive(href);
              return (
                <Link key={href} href={href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`gap-2 transition-all shrink-0 ${ active ? 'text-indigo-700 font-semibold border-b-2 border-indigo-600 rounded-b-none bg-indigo-50/50 hover:bg-indigo-50 hover:text-indigo-800' : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800' }`}
                  >
                    <Icon className={`h-4 w-4 ${active ? 'text-indigo-600' : 'text-slate-400'}`} />
                    {label}
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Language Badge + Sound Toggle + CTA + Mobile Toggle */}
          <div className="flex items-center gap-3">
            {/* Bhasha Language Badge */}
            {langBadgeText && (
              <button
                onClick={() => setShowLangModal(true)}
                className="relative px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 transition-all shadow-sm dark:shadow-slate-900/20"
                title={`Language: ${langConfig?.name}. Click to change.`}
              >
                {langBadgeText}
              </button>
            )}
            {/* Sound Toggle */}
            <button
              onClick={toggleMute}
              className="relative p-2 rounded-full text-slate-500 dark:text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all"
              aria-label={isMuted ? "Unmute sound effects" : "Mute sound effects"}
              title={isMuted ? "Sound effects off" : "Sound effects on"}
            >
              {isMuted ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
              {/* Active indicator dot */}
              {!isMuted && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-teal-500 ring-2 ring-white" />
              )}
            </button>
            <ThemeToggle />

            <Link href="/upload" className="hidden md:block">
              <Button size="sm" className="rounded-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white shadow-md hover:shadow-lg transition-all gap-2 px-5 font-semibold border-none">
                <Upload className="h-4 w-4" />
                Upload Contract
              </Button>
            </Link>

            <button
              className="md:hidden p-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-100 py-4 space-y-2 bg-white dark:bg-card rounded-b-xl shadow-lg px-2 absolute left-0 right-0 z-50 max-h-[85vh] overflow-y-auto">
            {[
              { href: '/upload', icon: Upload, label: 'Analyze Contract' },
              { href: '/builder', icon: Hammer, label: 'Contract Builder' },
              { href: '/compare', icon: ArrowLeftRight, label: 'Compare Contracts' },
              { href: '/vault', icon: FileStack, label: 'Contract Vault' },
              { href: '/dashboard', icon: BarChart3, label: 'Dashboard' },
              { href: '/wall-of-shame', icon: Skull, label: 'Wall of Shame' },
              { href: '/collective', icon: Users, label: 'Collectives' },
              { href: '/negotiate/live', icon: Handshake, label: 'Live Negotiate' },
              { href: '/lawchange', icon: Scale, label: 'Law Monitor' },
              { href: '/voice', icon: Mic, label: 'Voice Aid' },
              { href: '/complaint', icon: Gavel, label: 'File Complaint' },
              { href: '/shadow', icon: FileSearch, label: 'Shadow Detector' },
              { href: '/watchdog', icon: Eye, label: 'Contract Watchdog' },
              { href: '/evidence', icon: Shield, label: 'Evidence Chain' },
              { href: '/market', icon: TrendingUp, label: 'Market Intel' },
              { href: '/authority', icon: Building2, label: 'Legal Authority' },
            ].map(({ href, icon: Icon, label }) => {
              const active = href === '/upload' ? (isActive('/upload') || isActive('/results')) : isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${ active ? 'text-indigo-700 bg-indigo-50 shadow-sm dark:shadow-slate-900/20' : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800' }`}
                >
                  <Icon className={`h-5 w-5 ${active ? 'text-indigo-600' : 'text-slate-400'}`} />
                  {label}
                </Link>
              );
            })}

            {/* Mobile Sound Toggle */}
            <button
              onClick={toggleMute}
              className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800 transition-all w-full"
            >
              {isMuted ? (
                <VolumeX className="h-5 w-5 text-slate-400" />
              ) : (
                <Volume2 className="h-5 w-5 text-slate-400" />
              )}
              {isMuted ? "Unmute Sound Effects" : "Mute Sound Effects"}
            </button>

            <div className="pt-4 px-2 pb-2">
              <Link href="/upload" onClick={() => setMobileOpen(false)}>
                <Button className="w-full rounded-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white shadow-md py-6 text-base font-semibold gap-2 border-none">
                  <Upload className="h-5 w-5" />
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