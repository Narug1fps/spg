"use client"

import { ChevronUp } from "lucide-react"

export function ScrollToTop() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-8 cursor-pointer right-8 z-40 p-3 bg-primary text-white rounded-full hover:bg-primary/90 transition shadow-lg"
      aria-label="Voltar ao topo"
    >
      <ChevronUp className="w-6 h-6" />
    </button>
  )
}
