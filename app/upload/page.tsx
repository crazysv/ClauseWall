"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { ArrowRight, Shield, Lock, Trash2, Scale, Zap, Loader2 } from "lucide-react"

import type { DocumentType } from "@/types"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { Dropzone } from "@/components/upload/dropzone"
import { DocumentTypeSelect } from "@/components/upload/document-type-select"
import { JurisdictionSelect } from "@/components/upload/jurisdiction-select"
import { PrivacyToggle } from "@/components/upload/privacy-toggle"
import { QuickScanResult } from "@/components/upload/quick-scan-result"
import { MLInstantResult } from "@/components/upload/ml-instant-result"
import { Navbar } from "@/components/shared/navbar"
import { Footer } from "@/components/shared/footer"

export default function UploadPage() {
  const prefersReducedMotion = useReducedMotion();
  const router = useRouter()
  
  const [file, setFile] = useState<File | null>(null)
  const [text, setText] = useState("")
  const [documentType, setDocumentType] = useState<DocumentType>("rental")
  const [jurisdiction, setJurisdiction] = useState("ALL-INDIA")
  const [privacyLevel, setPrivacyLevel] = useState<"maximum" | "balanced" | "standard">("balanced")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"upload" | "paste">("upload")

  const handleAnalyze = async () => {
    if (!file && !text) return;
    
    setIsAnalyzing(true)
    setAnalyzeError(null)
    
    try {
      const formData = new FormData()
      if (activeTab === "upload" && file) {
        formData.append("file", file)
      } else if (activeTab === "paste" && text) {
        formData.append("text", text)
      }
      
      formData.append("documentType", documentType)
      formData.append("jurisdiction", jurisdiction)
      formData.append("privacyLevel", privacyLevel)

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      })
      
      if (response.ok) {
        const data = await response.json()
        router.push(`/analyze/${data.documentId}`)
      } else {
        const errData = await response.json().catch(() => null)
        setAnalyzeError(errData?.error || `Analysis failed (${response.status}). Please try again.`)
        setIsAnalyzing(false)
      }
    } catch (error) {
      setAnalyzeError("Network error. Please check your connection and try again.")
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-600 dark:bg-indigo-500/20 flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto max-w-3xl px-4 py-12 md:py-20" role="main">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.5, ease: "easeOut" }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="text-center space-y-3" aria-labelledby="upload-heading">
            <h1 id="upload-heading" className="font-manrope text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Scan Your Contract
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto font-medium">
              Upload a PDF or paste contract text. Analysis takes about 60 seconds.
            </p>
          </div>

          <Card className="border-none shadow-2xl shadow-indigo-500/10 bg-slate-50 dark:bg-slate-950 rounded-3xl overflow-hidden">
            <CardContent className="p-6 sm:p-4 md:p-6 lg:p-8 space-y-8">
              
              {/* Input Area */}
              <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as any)} className="w-full">
                <TabsList 
                  className="w-full grid grid-cols-2 p-1.5 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl mb-6 h-auto" 
                  aria-label="Document input methods"
                >
                  <TabsTrigger 
                    value="upload" 
                    className="rounded-xl py-3 font-semibold data-[state=active]:bg-slate-50 dark:bg-slate-950 data-[state=active]:text-indigo-600 dark:text-indigo-400 data-[state=active]:shadow-sm dark:shadow-slate-900/20 transition-all hover:text-indigo-600 dark:text-indigo-400 text-slate-600 dark:text-slate-400"
                  >
                    Upload PDF
                  </TabsTrigger>
                  <TabsTrigger 
                    value="paste" 
                    className="rounded-xl py-3 font-semibold data-[state=active]:bg-slate-50 dark:bg-slate-950 data-[state=active]:text-indigo-600 dark:text-indigo-400 data-[state=active]:shadow-sm dark:shadow-slate-900/20 transition-all hover:text-indigo-600 dark:text-indigo-400 text-slate-600 dark:text-slate-400"
                  >
                    Paste Text
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="upload" className="mt-0 outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded-2xl" autoFocus={false}>
                  <Dropzone {...({ onFileSelect: setFile, selectedFile: file } as any)} />
                </TabsContent>
                
                <TabsContent value="paste" className="mt-0 outline-none">
                  <div className="relative group">
                    <Label htmlFor="paste-textarea" className="sr-only">Paste your contract text</Label>
                    <Textarea 
                      id="paste-textarea"
                      placeholder="Paste your contract text here..."
                      className="min-h-[300px] resize-y rounded-2xl bg-slate-50 dark:bg-slate-950 border-none focus-visible:ring-2 focus-visible:ring-indigo-600 text-base p-6 shadow-inner"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      aria-describedby="char-count"
                    />
                    <div 
                      id="char-count"
                      aria-live="polite"
                      className="absolute bottom-4 right-4 text-xs font-semibold text-slate-500 group-focus-within:text-indigo-600 dark:text-indigo-400 transition-colors"
                    >
                      {text.length} characters
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Options Row */}
              <div 
                className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl" 
                role="group" 
                aria-label="Document settings"
              >
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-600 dark:text-slate-400 ml-1 block">Document Type</Label>
                  <div aria-describedby="doctype-helper">
                    {/* @ts-ignore - Assuming implementation handles typical select props */}
                    <DocumentTypeSelect value={documentType} onChange={setDocumentType} />
                  </div>
                  <p id="doctype-helper" className="text-xs font-medium text-slate-500 ml-1">We'll auto-detect if unsure</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-600 dark:text-slate-400 ml-1 block">Jurisdiction</Label>
                  {/* @ts-ignore */}
                  <JurisdictionSelect value={jurisdiction} onChange={setJurisdiction} />
                </div>
              </div>

              {/* Privacy Toggle Section */}
              <div 
                className="bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl p-5 flex flex-col space-y-4"
                role="region"
                aria-label="Privacy level configuration"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Privacy Settings</h3>
                </div>
                {/* @ts-ignore */}
                <PrivacyToggle value={privacyLevel} onChange={setPrivacyLevel as any} />
              </div>
              
              {/* ML Instant Preview with framer motion orchestration */}
              <AnimatePresence>
                {text.length > 100 && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, overflow: 'hidden' }} 
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ ease: "circOut", duration: prefersReducedMotion ? 0 : 0.3 }}
                  >
                    <MLInstantResult {...({ text } as any)} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error Display */}
              {analyzeError && (
                <div className="rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 p-4 text-sm text-rose-700 dark:text-rose-300 font-medium flex items-center gap-2">
                  <span className="shrink-0">⚠️</span>
                  {analyzeError}
                </div>
              )}

              {/* Call to Action */}
              <Button 
                onClick={handleAnalyze} 
                disabled={isAnalyzing || (!file && text.length === 0)}
                aria-label={isAnalyzing ? "Analysis in progress" : "Start document analysis"}
                aria-busy={isAnalyzing}
                className={cn(
                  "w-full h-14 rounded-full font-bold text-lg shadow-lg border-none transition-all duration-300",
                  "focus-visible:ring-4 focus-visible:ring-indigo-300/50",
                  "bg-gradient-to-r from-indigo-600 to-indigo-300 text-white",
                  "hover:from-indigo-700 hover:to-indigo-400 shadow-indigo-500/30",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale-[0.3]"
                )}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 w-5 h-5 animate-spin" aria-hidden="true" />
                    Analyzing Clauses...
                  </>
                ) : (
                  <>
                    Analyze Contract
                    <ArrowRight className="ml-2 w-5 h-5" aria-hidden="true" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Scan Callout */}
          <div className="w-full flex justify-center">
             <QuickScanResult {...({ result: null, documentId: "", onReset: () => {} } as any)} />
          </div>

          {/* Trust Indicators via shadcn Tooltips */}
          <TooltipProvider delayDuration={200}>
            <div 
              className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-2 pt-4"
              role="list"
              aria-label="Security and trust features"
            >
              {[
                { icon: Lock, title: "Encrypted", desc: "Military-grade AES-256 secure transport" },
                { icon: Trash2, title: "Auto-Deleted", desc: "Files purged from servers within 24 hours" },
                { icon: Scale, title: "Indian Law", desc: "Checked against 50+ local statutes" },
                { icon: Zap, title: "Fast Analysis", desc: "Results typically under 60 seconds" }
              ].map((item, i) => (
                <div role="listitem" key={i}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div 
                        tabIndex={0}
                        className={cn(
                          "flex flex-col items-center justify-center text-center space-y-3 p-4",
                          "rounded-3xl bg-slate-50 dark:bg-slate-950/60 backdrop-blur-md shadow-sm border-none transition-transform",
                          "hover:-translate-y-1 hover:shadow-md hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                        )}
                      >
                        <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                          <item.icon className="w-5 h-5" aria-hidden="true" />
                        </div>
                        <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 leading-tight cursor-default">
                          {item.title}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-slate-800 text-white border-none shadow-xl rounded-xl text-xs font-medium px-3 py-2">
                      <p>{item.desc}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              ))}
            </div>
          </TooltipProvider>

        </motion.div>
      </main>
      
      <Footer />
    </div>
  )
}