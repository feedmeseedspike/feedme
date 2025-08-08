/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["c7jc2vm8-3000.uks1.devtunnels.ms", "localhost:3000","shopfeedme.com","www.shopfeedme.com"],
    },
  },
  
  async redirects() {
    return [
      // Redirect www to non-www
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.shopfeedme.com',
          },
        ],
        destination: 'https://shopfeedme.com/:path*',
        permanent: true,
      },
      // Redirect HTTP to HTTPS
      {
        source: '/:path*',
        has: [
          {
            type: 'header',
            key: 'x-forwarded-proto',
            value: 'http',
          },
        ],
        destination: 'https://shopfeedme.com/:path*',
        permanent: true,
      },
    ]
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'index, follow',
          },
        ],
      },
    ]
  },
  images: {
    // unoptimized: process.env.NODE_ENV === 'production',
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
      {
        protocol: "https",
        hostname: "qafbcposwxopeoiuwyji.supabase.co",
        port: "",
        pathname: "**/*",
      },
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
      {
        protocol: "https",
        hostname: "images.pexels.com",
        port: "",
        pathname: "**/*",
      },
    ],
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    
    // Ignore specific warnings in webpack
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
