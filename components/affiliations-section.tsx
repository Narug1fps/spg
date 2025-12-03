"use client"

export function AffiliationsSection() {
  return (
    <section className="py-16 bg-gradient-to-b from-background to-background">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="font-serif text-4xl font-bold text-center mb-4 text-foreground">
          Nossas Filiações
        </h2>
        <p className="text-center text-foreground/60 mb-12 max-w-2xl mx-auto">
          A Sociedade Brasileira de Psicanálise de Goiânia é filiada a organizações internacionais 
          reconhecidas em todo o mundo
        </p>

        <div className="grid md:grid-cols-2 gap-12 items-center justify-items-center">
          {/* FEBRAPSI */}
            
            <div className="flex flex-col items-center gap-4 group cursor-pointer">
          <a href="https://www.instagram.com/febrapsi/br/" target="_blank" rel="noopener noreferrer">
              <div className="w-48 h-48 flex items-center justify-center p-4 bg-white rounded-lg shadow-md border border-border hover:shadow-xl transition transform group-hover:scale-105">
                <img
                  src="/febrapsi.png"
                  alt="FEBRAPSI - Federação Brasileira de Psicanálise"
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    // Fallback se a imagem não carregar
                    const img = e.target as HTMLImageElement
                    img.style.display = 'none'
                    img.nextElementSibling?.setAttribute('style', 'display:block')
                  }}
                />
                <div style={{ display: 'none' }} className="text-center text-primary font-bold text-2xl">
                  FEBRAPSI
                </div>
              </div>
          </a>
            <div className="text-center">
              <h3 className="font-semibold text-lg text-foreground mb-1">FEBRAPSI</h3>
              <p className="text-sm text-foreground/60">
                Federação Brasileira de Psicanálise
              </p>
            </div>
          </div>

          {/* IPA */}
          <div className="flex flex-col items-center gap-4 group cursor-pointer"><a href="https://www.instagram.com/psychoanalysis4all/"  target="_blank" rel="noopener noreferrer">
            
              <div className="w-48 h-48 flex items-center justify-center p-4 bg-white rounded-lg shadow-md border border-border hover:shadow-xl transition transform group-hover:scale-105">
                <img
                  src="/ipa.jpg"
                  alt="IPA - International Psychoanalytical Association"
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    // Fallback se a imagem não carregar
                    const img = e.target as HTMLImageElement
                    img.style.display = 'none'
                    img.nextElementSibling?.setAttribute('style', 'display:block')
                  }}
                />
                <div style={{ display: 'none' }} className="text-center text-primary font-bold text-2xl">
                  IPA
                </div>
              </div>
          </a>
            <div className="text-center">
              <h3 className="font-semibold text-lg text-foreground mb-1">IPA</h3>
              <p className="text-sm text-foreground/60">
                International Psychoanalytical Association
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-foreground/70 max-w-3xl mx-auto">
            Como membro filiado, nos comprometemos com os mais altos padrões de formação, 
            ética e prática psicanalítica, promovendo a difusão e o desenvolvimento da psicanálise 
            em consonância com as normas internacionais.
          </p>
        </div>
      </div>
    </section>
  )
}
