"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck, User, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function SignupPage() {
  const prefersReducedMotion = useReducedMotion();
  const router = useRouter();
  
  // State management
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<"weak" | "medium" | "strong" | null>(null);

  // Check Password Strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength(null);
      return;
    }
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    if (strength <= 1) setPasswordStrength("weak");
    else if (strength <= 2) setPasswordStrength("medium");
    else setPasswordStrength("strong");
  }, [password]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    
    // Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    
    if (!agreedToTerms) {
      setError("You must agree to the Terms of Service.");
      return;
    }
    
    if (passwordStrength === "weak") {
      setError("Password is too weak. Please include at least 8 characters, a number, and a special character.");
      return;
    }

    setIsLoading(true);
    
    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });
      
      if (authError) {
        throw new Error(authError.message);
      }
      
      if (data?.session) {
        router.push("/dashboard");
      } else {
        setSuccessMsg("We've sent a confirmation link to your email.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create an account.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError(null);
    setIsLoading(true);
    
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (authError) {
        throw new Error(authError.message);
      }
      // Redirect happens automatically
    } catch (err: any) {
      setError(err.message || "Failed to initialize Google signup.");
      setIsLoading(false);
    }
  };

  const strengthConfig = {
    weak: { color: "bg-rose-500", width: "w-1/3", text: "Weak" },
    medium: { color: "bg-amber-500", width: "w-2/3", text: "Fair" },
    strong: { color: "bg-emerald-500", width: "w-full", text: "Strong" },
    null: { color: "bg-slate-200", width: "w-0", text: "" }
  } as const;

  const currentStrength = passwordStrength ? strengthConfig[passwordStrength] : strengthConfig.null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800 flex flex-col items-center justify-center p-4 py-6 md:py-8 lg:py-12 relative overflow-hidden font-sans">
      {/* Subtle background pattern (Dots) */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='1.5'/%3E%3Ccircle cx='13' cy='13' r='1.5'/%3E%3C/g%3E%3C/svg%3E")` }}
      />
      
      {/* Glow effect behind the card */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none z-0" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.6, ease: "easeOut" }}
        className="w-full max-w-[440px] z-10"
      >
        <Card className="w-full border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/50 bg-white dark:bg-card/95 backdrop-blur-sm rounded-3xl overflow-hidden">
          <CardHeader className="space-y-6 pt-10 pb-6 px-4 md:px-4 md:px-6 lg:px-8 text-center">
            {/* ClauseWall Logo & Tagline */}
            <div className="mx-auto bg-indigo-50 border border-indigo-100 w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-8 h-8 text-indigo-600" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Create Your Account</h1>
              <p className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Join the Sovereign Contract Sentinel
              </p>
            </div>
            
            {/* Error & Success Messages */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold p-3 rounded-xl text-left flex items-start gap-2"
                >
                  <span className="mt-0.5">⚠️</span>
                  <span>{error}</span>
                </motion.div>
              )}
              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold p-3 rounded-xl text-left flex items-start gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 mt-0.5" />
                  <span>{successMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </CardHeader>
          
          <CardContent className="px-4 md:px-4 md:px-6 lg:px-8 pb-8 space-y-6">
            {/* Google OAuth Button */}
            <Button 
              type="button" 
              variant="outline" 
              className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-card hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 font-bold shadow-sm dark:shadow-slate-900/20 flex items-center justify-center gap-3 transition-all"
              onClick={handleGoogleSignup}
              disabled={isLoading}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign up with Google
            </Button>
            
            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full border-t border-slate-200 dark:border-slate-700" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest text-slate-400">
                <span className="bg-white dark:bg-slate-900 px-3">or sign up with email</span>
              </div>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="pl-10 h-12 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 h-12 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 shadow-inner"
                  />
                </div>
              </div>

              {/* Password Group */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-10 pr-10 h-12 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-400 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Password Strength Indicator */}
                {password.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: "auto" }} 
                    className="px-1"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Strength</span>
                      <span className={cn("text-[10px] font-bold uppercase tracking-widest", currentStrength.color.replace("bg-", "text-"))}>
                        {currentStrength.text}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                       <motion.div 
                         className={cn("h-full rounded-full transition-all duration-500", currentStrength.color, currentStrength.width)} 
                       />
                    </div>
                  </motion.div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="pl-10 pr-10 h-12 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 shadow-inner"
                    />
                  </div>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-3 mt-6 mb-2">
                <Checkbox 
                  id="terms" 
                  checked={agreedToTerms} 
                  onCheckedChange={(c) => setAgreedToTerms(c as boolean)} 
                  className="mt-1 border-slate-300 dark:border-slate-600 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                />
                <Label htmlFor="terms" className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed cursor-pointer">
                  I agree to the <Link href="/legal/terms" className="text-indigo-600 hover:text-indigo-700 font-bold underline decoration-indigo-200 underline-offset-2">Terms of Service</Link> and <Link href="/legal/privacy" className="text-indigo-600 hover:text-indigo-700 font-bold underline decoration-indigo-200 underline-offset-2">Privacy Policy</Link>. I understand ClauseWall is not providing legal representation.
                </Label>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !agreedToTerms}
                className="w-full h-12 mt-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black tracking-widest uppercase text-xs transition-all shadow-md group disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Create Account
                    <motion.span 
                      className="ml-2 inline-block"
                      initial={{ x: 0 }}
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: prefersReducedMotion ? 0 : 1.5, repeat: Infinity }}
                    >
                      →
                    </motion.span>
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="bg-slate-50 dark:bg-slate-800 border-t border-slate-100 p-6 flex justify-center">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Already have an account?{" "}
              <Link 
                href="/auth/login" 
                className="font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
