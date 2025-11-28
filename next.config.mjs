/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable compression
  compress: true,
  // Optimize production builds
  swcMinify: true,
  // Optimize images
  poweredByHeader: false,
  experimental: {
    serverActions: {
      allowedOrigins: ["c7jc2vm8-3000.uks1.devtunnels.ms", "localhost:3000","shopfeedme.com","www.shopfeedme.com"],
    },
    // Optimize package imports
    optimizePackageImports: [
      '@tanstack/react-query',
      'framer-motion',
      'lucide-react',
      '@supabase/supabase-js',
    ],
  },
  images: {
    unoptimized: false,
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "t4.ftcdn.net",
        port: "",
        pathname: "**/*",
      },
      {
        protocol: "https",
        hostname: "th.bing.com",
        port: "",
        pathname: "**/*",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "**/*",
      },
      {
        protocol: "https",
        hostname: "www.google.com",
        port: "",
        pathname: "**/*",
      },
      {
        protocol: "https",
        hostname: "www.facebook.com",
        port: "",
        pathname: "**/*",
      },
      {
        protocol: "https",
        hostname: "www.instagram.com",
        port: "",
        pathname: "**/*",
      },
      {
        protocol: "https",
        hostname: "www.twitter.com",
        port: "",
        pathname: "**/*",
      },
      {
        protocol: "https",
        hostname: "www.pinterest.com",
        port: "",
        pathname: "**/*",
      },
      {
        protocol: "https",
        hostname: "www.whatsapp.com",
        port: "",
        pathname: "**/*",
      },
      {
        protocol: "https",
        hostname: "www.telegram.com",
        port: "",
        pathname: "**/*",
      },
      {
        protocol: "https",
        hostname: "asset.cloudinary.com",
        port: "",
        pathname: "**/*",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "source.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "encrypted-tbn0.gstatic.com",
        port: "",
        pathname: "**/*",
      },
      {
        protocol: "https",
        hostname: "media.istockphoto.com",
        port: "",
        pathname: "**/*",
      },
      {
        protocol: "https",
        hostname: "penguinui.s3.amazonaws.com",
        port: "",
        pathname: "**/*",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
        pathname: "**/*",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
        port: "",
        pathname: "**/*",
      },
      // {
      //   protocol: "https",
      //   hostname: "qafbcposwxopeoiuwyji.supabase.co",
      //   port: "",
      //   pathname: "**/*",
      // },
      {
        protocol: "https",
        hostname: "fyldgskqxrfmrhyluxmw.supabase.co",
        port: "",
        pathname: "**/*",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        port: "",
        pathname: "**/*",
      },
    ],
    domains: ["images.unsplash.com", "images.pexels.com"],
  },
  webpack(config, { isServer, dev }) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    
    // Optimize bundle splitting
    if (!isServer && !dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk for large libraries
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            // Separate chunk for common modules
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
            // React and React-DOM
            react: {
              name: 'react',
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              chunks: 'all',
              priority: 30,
            },
            // Framer Motion
            framerMotion: {
              name: 'framer-motion',
              test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
              chunks: 'all',
              priority: 25,
            },
          },
        },
      };
    }
    
    // Move ignoreWarnings into webpack config (root-level ignoreWarnings is invalid in Next 14)
    config.ignoreWarnings = [
      (warning) =>
        typeof warning.message === "string" &&
        warning.message.includes(
          "Critical dependency: the request of a dependency is an expression"
        ),
    ];
    return config;
  },
};

export default nextConfig;
