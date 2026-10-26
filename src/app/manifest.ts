import type { MetadataRoute } from "next";
import { brand } from "@/lib/site-data";

export const dynamic = "force-static";

// Lets visitors install the site (and its simulators) on a phone home screen
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: brand.name,
    short_name: brand.wordmarkTop,
    description: "Practical cardiology education: ECG, echo, cath lab, simulators and calculators.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0b1638",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
