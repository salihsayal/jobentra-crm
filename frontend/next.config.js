const ALLOWED_ORIGINS_RAW = process.env.ALLOWED_DEV_ORIGINS || 'localhost:3000,127.0.0.1:3000';
const allowedOrigins = ALLOWED_ORIGINS_RAW.split(',').flatMap(h => {
  const host = h.trim();
  if (!host) return [];
  return [host, host.replace(/:\d+$/, '')];
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: allowedOrigins,
};

module.exports = nextConfig;
