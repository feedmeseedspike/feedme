/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
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
        pathname: "**/*",
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


    ],
  },
  headers: [
    { key: "Access-Control-Allow-Credentials", value: "true" },
    { key: "Access-Control-Allow-Origin", value: "*" },
    { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
    { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
  ],
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    return config;
  },
};

export default nextConfig;
