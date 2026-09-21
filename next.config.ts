import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every page is static, so build to plain files (./out) that any static host
  // (Cloudflare Pages, Netlify, GitHub Pages...) can serve without a server.
  output: "export",
  // Emit /about/index.html rather than /about.html so both /about and /about/
  // resolve on GitHub Pages (which otherwise 404s the trailing-slash form).
  trailingSlash: true,
  images: {
    // The image optimiser needs a server, which a static export doesn't have.
    // The portrait photos are already resized/compressed in public/images.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
    ],
  },
};

export default nextConfig;
