/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Enable experimental features if needed
  experimental: {
    // appDir: true, // Uncomment if using app directory (Next.js 13+)
  },
  
  // Environment variables that should be exposed to the browser
  // (Don't put sensitive keys here!)
  env: {
    NEXT_PUBLIC_APP_NAME: 'SEI Token Faucet',
  },
  
  // Webpack configuration (if needed)
  webpack: (config, { isServer }) => {
    // Fix for ethers.js in browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig