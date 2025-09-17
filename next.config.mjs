/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["c7jc2vm8-3000.uks1.devtunnels.ms", "localhost:3000","shopfeedme.com","www.shopfeedme.com"],
    },
  },
  // Use a custom dist directory to avoid OneDrive locking `.next` on Windows
  distDir: "build",
  images: {
    unoptimized: process.env.NODE_ENV === 'production',
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
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
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
