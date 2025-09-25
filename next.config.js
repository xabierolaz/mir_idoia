/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Configuración de CORS - restrictivo en producción
  async headers() {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    return [
      {
        source: '/api/:path*',
        headers: [
          { 
            key: 'Access-Control-Allow-Origin', 
            value: isDevelopment ? '*' : process.env.NEXT_PUBLIC_APP_URL || 'https://ope-medicina.vercel.app' 
          },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ];
  },
}

module.exports = nextConfig