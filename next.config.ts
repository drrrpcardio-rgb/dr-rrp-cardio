import type { NextConfig } from "next";

// `next dev` does not serve index.html for folders inside /public, so the prebuilt
// tools (/ecg-simulator, /cath-sim, /ct-lab) would 404 on their folder URLs while developing.
// Static hosts do this natively, and rewrites are not allowed in a static export,
// so they are only added for the dev server.
const devRewrites =
  process.env.NODE_ENV === "development"
    ? {
        async rewrites() {
          return [
            { source: "/ecg-simulator/", destination: "/ecg-simulator/index.html" },
            { source: "/cath-sim/", destination: "/cath-sim/index.html" },
            { source: "/ct-lab/", destination: "/ct-lab/index.html" },
            { source: "/cath-sim/:page/", destination: "/cath-sim/:page/index.html" },
          ];
        },
      }
    : {};

const nextConfig: NextConfig = {
  ...devRewrites,
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
