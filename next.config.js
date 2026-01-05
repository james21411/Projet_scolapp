// Importer et configurer dotenv au tout début
const dotenv = require('dotenv');
dotenv.config();

/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Configuration pour mysql2
  experimental: {
    serverComponentsExternalPackages: ['mysql2']
  },
  // Configuration pour éviter les erreurs de build
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclure mysql2 du bundle client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        crypto: false,
      };
    }
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*/',
        destination: '/api/:path*'
      }
    ];
  }
};

module.exports = nextConfig;

