/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Optimizaciones para archivos grandes y build performance
  experimental: {
    largePageDataBytes: 128 * 1000, // 128KB
  },
  
  // Configuración de webpack para manejar archivos grandes
  webpack: (config, { isServer }) => {
    // Optimizar el manejo de archivos JSON grandes
    config.module.rules.push({
      test: /\.json$/,
      type: 'json',
    });
    
    return config;
  },
  
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