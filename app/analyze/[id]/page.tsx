"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { CheckCircle2, Circle, Loader2, AlertCircle, FileText, Info } from "lucide-react"

import { cn } from "@/lib/utils"
// Assuming standard Supabase client pattern - adjust import if your util is located elsewhere
import { createClient } from "@/lib/supabase/client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/shared/navbar"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"

const steps = [
  "Extracting text from document",
  "Splitting into clauses", 
  "Analyzing clauses against legal database",
  "Checking Indian law compliance",
  "Building proof trees",
  "Community pattern matching",
  "Calculating risk score",
  "Generating report"
]

const funFacts = [
  "78% of rental agreements in India contain at least one unfair clause",
  "The Indian Contract Act 1872 is one of the oldest contract laws still in use",
  "Security deposits above 2 months rent are illegal in many Indian states",
  "Non-compete clauses are generally unenforceable in India",
  "Under Consumer Protection Act 2019, unfair contract terms are voidable"
]

type AnalyzeStatus = "pending" | "analyzing" | "completed" | "failed"

interface AnalyzeProgressPageProps {
  // In Next.js 15+ / React 19, params is treated as a Promise. 
  // We type it accordingly and unwrap using React.use()
  params: Promise<{ id: string }> | { id: string }
}

export default function AnalyzeProgressPage({ params }: AnalyzeProgressPageProps) {
  const router = useRouter()
  // React 19 unwrap or fallback to direct access
  const unwrappedParams = params instanceof Promise ? use(params) : params
  const { id } = unwrappedParams
  const prefersReducedMotion = useReducedMotion()

  const [status, setStatus] = useState<AnalyzeStatus>("pending")
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)
  const [funFact, setFunFact] = useState(funFacts[0])
  const [documentName, setDocumentName] = useState("Your Document")
  const [loadingDoc, setLoadingDoc] = useState(true)

  // Initialize Supabase Client
  const supabase = createClient()

  // 1. Fetch Document Metadata once
  useEffect(() => {
    async function fetchDoc() {
      try {
        const { data, error } = await supabase
          .from("documents")
          .select("*")
          .eq("id", id)
          .single()
        
        if (data && data.filename) {
          setDocumentName(data.filename)
        }
      } catch (err) {
        console.error("Error fetching document context", err)
      } finally {
        setLoadingDoc(false)
      }
    }
    fetchDoc()
  }, [id, supabase])

  // 2. Poll API for progress every 2 seconds
  useEffect(() => {
    if (status === "completed" || status === "failed") return

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/analyze?id=${id}`)
        if (!response.ok) throw new Error("Failed to fetch status")
        
        const data = await response.json()
        
        // Ensure data mappings match state limits
        if (data.status) setStatus(data.status as AnalyzeStatus)
        if (data.progress !== undefined) setProgress(Math.min(100, data.progress))
        if (data.currentStep !== undefined) setCurrentStep(Math.min(steps.length - 1, data.currentStep))

        if (data.status === "completed") {
          clearInterval(pollInterval)
          router.push(`/results/${id}`)
        } else if (data.status === "failed") {
          clearInterval(pollInterval)
        }
      } catch (error) {
        console.error("Polling error", error)
        // Fallback simulation logic so UI doesn't freeze in dev environments if API isn't wired yet
        if (process.env.NODE_ENV === "development") {
          setStatus("analyzing")
          setProgress((prev) => {
            const next = prev + 12
            if (next >= 100) {
              return 100
            }
            return next
          })
          setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1))
        } else {
          setStatus("failed")
        }
      }
    }, 2000)

    return () => clearInterval(pollInterval)
  }, [id, status, router])

  // Handle redirect when dev simulation completes
  useEffect(() => {
    if (progress >= 100 && status !== "completed") {
      setStatus("completed")
      router.push(`/results/${id}`)
    }
  }, [progress, status, id, router])

  // 3. Rotate Fun Facts
  useEffect(() => {
    const factInterval = setInterval(() => {
      setFunFact((prev) => {
        const currentIndex = funFacts.indexOf(prev)
        const nextIndex = (currentIndex + 1) % funFacts.length
        return funFacts[nextIndex]
      })
    }, 5000)
    
    return () => clearInterval(factInterval)
  }, [])

  // If failed, render error state immediately
  if (status === "failed") {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col">
        <Navbar />
        <main role="main" className="flex-1 container mx-auto flex items-center justify-center p-4">
          <Card className="max-w-md w-full border-none shadow-2xl rounded-3xl overflow-hidden bg-white dark:bg-card">
            <CardContent className="p-4 md:p-6 lg:p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h2 className="text-lg md:text-xl lg:text-2xl font-manrope font-bold text-slate-900 dark:text-slate-100">Analysis Failed</h2>
              <p className="text-slate-600 dark:text-slate-400">We encountered an error while processing your document. Please try uploading it again.</p>
              <Button onClick={() => router.push('/upload')} className="w-full mt-4 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 rounded-xl h-12">
                Return to Upload
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col selection:bg-indigo-600 dark:bg-indigo-500/20 hidden-scrollbar">
      <Navbar />
      
      <main role="main" className="flex-1 container mx-auto max-w-4xl px-4 py-6 md:py-8 lg:py-12 flex flex-col items-center justify-center">
        
        {/* Document Context Header */}
        <div className="w-full text-center space-y-4 mb-10">
          <motion.div
            animate={prefersReducedMotion ? {} : { scale: [1, 1.05, 1] }} 
            transition={{ repeat: Infinity, duration: 2 }}
            className="inline-block"
          >
            <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-none px-4 py-1.5 rounded-full font-medium inline-flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Analysis in Progress
            </Badge>
          </motion.div>
          <h1 className="font-manrope text-3xl md:text-4xl font-extrabold tracking-tight">
             Securing your agreement
          </h1>
          <div className="flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400">
            <FileText className="w-4 h-4 text-slate-500" />
            {loadingDoc ? <Skeleton className="h-4 w-32" /> : <span className="font-medium text-sm">{documentName}</span>}
          </div>
        </div>

        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          
          {/* LEFT: Circular Progress Animation */}
          <div className="flex flex-col items-center justify-center relative">
            <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
               {/* Background Circle */}
              <svg className="absolute inset-0 w-full h-full drop-shadow-xl" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="white" />
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#eef0ff" strokeWidth="6" />
                
                {/* Animated Progress Ring */}
                <motion.circle 
                  cx="50" cy="50" r="40" 
                  fill="transparent" 
                  stroke="url(#progressGradient)" 
                  strokeWidth="6"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: 251.2, strokeDashoffset: 251.2 }}
                  animate={{ strokeDashoffset: 251.2 - (251.2 * progress) / 100 }}
                  transition={{ ease: "easeOut", duration: 0.8 }}
                  transform="rotate(-90 50 50)"
                />
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4a40e0" />
                    <stop offset="100%" stopColor="#0d9488" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <AnimatePresence mode="popLayout">
                  <motion.span 
                    key={progress}
                    initial={{ y: 5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -5, opacity: 0 }}
                    className="text-5xl md:text-6xl font-manrope font-extrabold text-slate-900 dark:text-slate-100 tracking-tighter"
                  >
                    {Math.round(progress)}<span className="text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl text-slate-500">%</span>
                  </motion.span>
                </AnimatePresence>
                <div className="text-slate-600 dark:text-slate-400 font-medium mt-1">Processed</div>
              </div>
            </div>
          </div>

          {/* RIGHT: Steps Tracker */}
          <div className="space-y-6 w-full max-w-sm mx-auto md:mx-0 bg-white dark:bg-card p-6 sm:p-4 md:p-6 lg:p-8 rounded-[2rem] shadow-2xl shadow-indigo-500/5">
            <div className="space-y-5">
              {steps.map((step, idx) => {
                const isCompleted = idx < currentStep
                const isActive = idx === currentStep
                const isPending = idx > currentStep

                return (
                  <motion.div 
                    key={step} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={cn(
                      "flex items-center gap-4 transition-all duration-300",
                      isCompleted ? "opacity-100" : isActive ? "opacity-100 scale-[1.02]" : "opacity-40"
                    )}
                  >
                    <div className="relative flex-shrink-0 flex items-center justify-center w-6 h-6">
                      {isCompleted ? (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                          <CheckCircle2 className="w-6 h-6 text-green-500" />
                        </motion.div>
                      ) : isActive ? (
                        <div className="relative">
                          <Loader2 className="w-5 h-5 animate-spin text-indigo-600 dark:text-indigo-400" />
                          <div className="absolute inset-0 animate-ping rounded-full bg-indigo-600 dark:bg-indigo-500/20 scale-150" />
                        </div>
                      ) : (
                        <Circle className="w-5 h-5 text-slate-400 stroke-[2]" />
                      )}
                    </div>
                    <span className={cn(
                      "text-sm font-medium leading-tight",
                      isCompleted ? "text-slate-900 dark:text-slate-100" : isActive ? "text-indigo-600 dark:text-indigo-400 font-bold" : "text-slate-600 dark:text-slate-400"
                    )}>
                      {step}
                    </span>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>

        {/* BOTTOM: Fun Fact Mutator */}
        <div className="mt-16 w-full max-w-2xl mx-auto">
          <Card className="border-none bg-indigo-50 dark:bg-indigo-950/30 shadow-inner rounded-3xl overflow-hidden">
             <CardContent className="p-5 flex items-start sm:items-center gap-4">
                <div className="bg-white dark:bg-card p-2 sm:p-3 rounded-2xl shadow-sm dark:shadow-slate-900/20 text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                  <Info className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="flex flex-col justify-center min-h-[3rem]">
                   <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">
                     Did You Know?
                   </span>
                   <AnimatePresence mode="wait">
                     <motion.p
                        key={funFact}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-snug"
                     >
                       {funFact}
                     </motion.p>
                   </AnimatePresence>
                </div>
             </CardContent>
          </Card>
        </div>

      </main>
    </div>
  )
}
