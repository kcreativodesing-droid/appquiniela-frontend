const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: [/middleware-manifest\.json$/],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // next-pwa requiere webpack (no compatible con Turbopack)
  // Se agrega turbopack vacio para silenciar advertencia
  experimental: {},
};

module.exports = withPWA(nextConfig);

