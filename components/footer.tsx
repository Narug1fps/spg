"use client"

import Link from "next/link"
import Image from "next/image"
import { Facebook, Instagram} from "lucide-react"
import { FaWhatsapp } from "react-icons/fa"

export function Footer() {
  return (
    <footer className="bg-black text-background mt-auto  py-6">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
              <Image
                src="/spg2.png"
                alt="SBPG - Sociedade Brasileira de Psicanálise de Goiânia"
                width={80}
                height={80}
                className="w-20 h-20"
              />
             
            </Link>
          </div>

          {/* Social Links */}
          <div className="flex gap-6">
            <a 
              href="https://www.facebook.com/sbpgoiania/?locale=pt_BR" 
              className="text-background/80 hover:text-accent transition duration-300"
              aria-label="Facebook"
            >
              <Facebook className="w-6 h-6" />
            </a>
            <a 
              href="#" 
              className="text-background/80 hover:text-accent transition duration-300"
              aria-label="Instagram"
            >
              <Instagram className="w-6 h-6" />
            </a>
            <a 
              href="https://wa.me/5562994423723" 
              className="text-background/80 hover:text-accent transition duration-300"
              aria-label="Whatsapp"
            >
              <FaWhatsapp className="w-6 h-6" />
            </a>
          </div>

          {/* Copyright */}
          <div className="text-sm text-background/60 text-center md:text-right">
            <p>© 2025 SBPG. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
