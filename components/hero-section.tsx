"use client"

import { HeroSliderSimple } from "./hero-slider-simple"

export function HeroSection() {
  return (
    <section className="relative h-screen overflow-hidden">
      <HeroSliderSimple />
      
      {/* Content Overlay */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="max-w-4xl mx-auto px-4 text-center text-white space-y-6">
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-balance leading-tight">
            Bem-vindo à SBPG
          </h1>
          <p className="text-lg md:text-xl text-white/90 text-balance leading-relaxed max-w-2xl mx-auto">
            Sociedade Brasileira de Psicanálise de Goiânia
          </p>
          <div className="flex gap-4 justify-center pt-6">
            <a
              href="https://api.whatsapp.com/send?phone=5562994423723&text=Oi%20tudo%20bom%3F%20Estou%20interessado(a)%20nos%20cursos"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold rounded-lg transition transform hover:scale-105"
            >
              Inscrições em Cursos
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
