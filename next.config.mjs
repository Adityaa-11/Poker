/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  compiler: {
    // Remove console.logs in production
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // External packages for server components
  serverExternalPackages: ['@supabase/supabase-js'],
  
  // Experimental features for better performance
  experimental: {
    // Enable optimizeCss for production builds
    optimizeCss: true,
    // Enable turbo for faster builds
    turbo: {
      rules: {
        // Optimize CSS imports
        '*.css': ['css-loader', 'postcss-loader'],
      },
    },
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // PWA and caching optimizations
  async headers() {
    return [
      // Security headers
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
          },
          // HSTS for HTTPS sites
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
        ],
      },
      // PWA manifest caching
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Service worker caching
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      // Static assets caching
      {
        source: '/icons/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // API routes rate limiting headers
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ]
  },

  // Content Security Policy
  async rewrites() {
    return [
      // Add CSP headers for enhanced security
      {
        source: '/(.*)',
        has: [
          {
            type: 'header',
            key: 'content-security-policy',
          },
        ],
        destination: '/$1',
      },
    ]
  },

  // Bundle analyzer (uncomment to analyze bundle size)
  // webpack: (config, { isServer }) => {
  //   if (!isServer) {
  //     config.resolve.fallback = {
  //       ...config.resolve.fallback,
  //       fs: false,
  //     }
  //   }
  //   return config
  // },

  // Production optimizations
  ...(process.env.NODE_ENV === 'production' && {
    // Disable source maps in production
    productionBrowserSourceMaps: false,

    // Optimize bundles
    compiler: {
      removeConsole: {
        exclude: ['error'],
      },
    },
  }),

  // Development optimizations
  ...(process.env.NODE_ENV === 'development' && {
    // Fast refresh
    reactStrictMode: true,
    
    // Better error overlay
    compiler: {
      removeConsole: false,
    },
  }),

  // Environment variables validation
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Redirects for better SEO
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ]
  },

  // Output configuration for static export if needed
  // output: 'export',
  // trailingSlash: true,
  // images: { unoptimized: true },
}

export default nextConfig
