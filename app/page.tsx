"use client";

import SurgicalCanvas from "@/components/landing/surgical/SurgicalCanvas";

export default function HomePage() {
  return (
    <main className="w-full bg-[#0a0a0a] text-[#e5e5e5] selection:bg-red-500/30 font-sans">
      <SurgicalCanvas />
    </main>
  );
}
