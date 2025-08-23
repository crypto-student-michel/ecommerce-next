import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // No romper el build por ESLint / TS mientras desarrollas
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  // Redirección (no permanente) del singular al plural
  async redirects() {
    return [
      {
        source: "/product/:id(\\d+)",
        destination: "/products/:id",
        permanent: false, // ⬅ evita cacheo del navegador
      },
    ];
  },
  
};

export default nextConfig;
