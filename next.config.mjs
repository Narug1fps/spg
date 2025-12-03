/** @type {import('next').NextConfig} */
import { resolve } from 'path'

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // ❌ Remover completamente turbopack, pois não é mais suportado
}

export default nextConfig
