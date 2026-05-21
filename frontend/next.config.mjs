/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  // Proxy semua request /api/v1/* ke Laravel lokal
  // Sehingga frontend hanya butuh 1 URL publik (ngrok port 3000)
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:8000/api/v1/:path*',
      },
    ]
  },
}

export default nextConfig
