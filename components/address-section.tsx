"use client"

import { MapPin, Phone, Mail, Instagram } from "lucide-react"
import { FaWhatsapp } from "react-icons/fa"

export function AddressSection() {
  return (
    <section className="py-16 bg-background border-b-0">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="font-serif text-4xl font-bold text-center mb-12 text-foreground">Localização e Contato</h2>

        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div className="flex gap-4">
              <MapPin className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-foreground mb-2">Endereço</h3>
                <p className="text-foreground/70">
                  Rizzo Plaza, Rua 94, nº 831
                  <br />
                  Salas 103 e 105 - Setor Sul
                  <br />
                  Goiânia - GO
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Phone className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-foreground mb-2">Telefone</h3>
                <p className="text-foreground/70">
                  <a href="tel:+556232253316" className="hover:text-primary transition">
                    (62) 3225-3316
                  </a>
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Mail className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-foreground mb-2">Email</h3>
                <p className="text-foreground/70">
                  <a href="mailto:sbpgoiania@sbpgoiania.com.br" className="hover:text-primary transition">
                    sbpgoiania@sbpgoiania.com.br
                  </a>
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <FaWhatsapp className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-foreground mb-2">WhatsApp</h3>
                <p className="text-foreground/70">
                  <a href="https://wa.me/5562994423723" className="hover:text-primary transition">
                    (62) 9 9442-3723
                  </a>
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Instagram className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-foreground mb-2">Instagram</h3>
                <p className="text-foreground/70">
                  <a href="https://www.instagram.com/sbpgoiania/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition">
                    @sbpgoiania
                  </a>
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl overflow-hidden h-96">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3821.8335783868242!2d-49.25869312396093!3d-16.6852093455225!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x935ef16fa0eadf49%3A0x2055e95a1b8d25cf!2sRizzo%20Imobili%C3%A1ria!5e0!3m2!1spt-BR!2sbr!4v1764627983618!5m2!1spt-BR!2sbr"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
