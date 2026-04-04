"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, Shield, Mail, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleOAuth = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Welcome back to ClauseWall!");
        // Use back() so if they were sent here from the defuser, they go right back to their document
        router.back();
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Account created successfully!");
        router.back();
      }
    } catch (error: any) {
      console.error("[Auth] Error:", error);
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel (form side) */}
      <div className="flex-1 flex items-center justify-center px-4 md:px-8 py-12 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Shield className="w-12 h-12 text-foreground mx-auto mb-4 border-2 border-foreground p-2 shadow-[2px_2px_0px_0px_rgba(10,10,10,1)]" />
            <h1 className="text-impact-heading text-foreground">
              {isLogin ? "Welcome back" : "Join ClauseWall"}
            </h1>
            <p className="text-lg text-muted-foreground mt-4 font-bold">
              {isLogin
                ? "Sign in to access your saved contracts."
                : "Sign up to track contract deadlines securely."}
            </p>
          </div>

          <button
            type="button"
            onClick={handleOAuth}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-none border-2 border-foreground bg-background shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] text-foreground font-black uppercase tracking-wider hover:bg-foreground hover:text-background hover:-translate-y-[2px] transition-all duration-150"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-0.5 bg-foreground" />
            <span className="text-sm font-black uppercase tracking-wider text-muted-foreground">OR</span>
            <div className="flex-1 h-0.5 bg-foreground" />
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <div>
              <label className="block text-sm font-black text-foreground mb-2 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-background border-2 border-foreground rounded-none shadow-[inset_2px_2px_0px_0px_rgba(10,10,10,0.05)] text-foreground font-bold focus:border-primary focus:ring-0 focus:outline-none transition-all placeholder:text-muted-foreground"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-black text-foreground mb-2 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-background border-2 border-foreground rounded-none shadow-[inset_2px_2px_0px_0px_rgba(10,10,10,0.05)] text-foreground font-bold focus:border-primary focus:ring-0 focus:outline-none transition-all placeholder:text-muted-foreground"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-8 px-8 py-4 bg-primary text-primary-foreground font-black uppercase tracking-wider rounded-none text-base border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] hover:-translate-y-[2px] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Loader2 className="w-5 h-5 animate-spin border-0" />
                    {isLogin ? "Signing in..." : "Creating account..."}
                  </motion.div>
                ) : (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {isLogin ? "Sign In" : "Create Account"}
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </form>

          {/* Links below form */}
          <div className="mt-8 text-center flex flex-col gap-3">
            <span className="text-sm font-bold text-muted-foreground">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary font-black uppercase tracking-wider hover:text-red-700 transition-colors"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </span>
            {isLogin && (
              <button className="text-sm text-primary font-black uppercase tracking-wider hover:text-red-700 transition-colors">
                Forgot password?
              </button>
            )}
            {!isLogin && (
              <p className="text-xs font-bold text-muted-foreground mt-4">
                Free forever. No credit card required.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Right panel (visual side) */}
      <div className="hidden lg:flex flex-1 bg-foreground text-background flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] border-l-2 border-b-2 border-background/20 rounded-bl-full opacity-50" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] border-r-2 border-t-2 border-background/20 rounded-tr-full opacity-50" />
        
        <div className="max-w-md relative z-10 text-center">
          <Shield className="w-20 h-20 text-primary mx-auto mb-8 border-4 border-background p-3" />
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-tight text-background mb-8">
            DONT SIGN BLIND. KNOW YOUR RISKS.
          </h2>
          <div className="bg-background/10 border-2 border-background p-6 inline-block">
            <p className="text-5xl font-black text-primary drop-shadow-[2px_2px_0px_background]">100%</p>
            <p className="text-sm font-black uppercase tracking-wider mt-2">Free Contract Analysis</p>
          </div>
        </div>
      </div>
    </div>
  );
}
