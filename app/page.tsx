"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"

import { DynamicSection } from "@/components/dynamic-section"
import { AddressSection } from "@/components/address-section"
import { AffiliationsSection } from "@/components/affiliations-section"
import { Footer } from "@/components/footer"
import { ScrollToTop } from "@/components/scroll-to-top"
import { type Category } from "@/lib/supabase/types"

export default function Home() {
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    // Fetch categories on mount
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCategories(data)
        }
      })
      .catch((err) => console.error("Error fetching categories:", err))
  }, [])

return (<>
  <main className="bg-background min-h-screen flex flex-col p-0 m-0">
    
    <div className="flex-1 flex flex-col">
      <Navbar />
      <HeroSection />
      {categories.length > 0 ? (
        categories.map((cat) => (
          <DynamicSection key={cat.id} categoryId={cat.id} />
        ))
      ) : (
        <section className="py-12 bg-background text-center">
          <p className="text-foreground/60">Nenhuma categoria disponível</p>
        </section>
      )}


      <AffiliationsSection />
      <AddressSection />
    </div>

    
    {showScrollTop && <ScrollToTop />}
  </main>
  <Footer />
  </>
)
}
