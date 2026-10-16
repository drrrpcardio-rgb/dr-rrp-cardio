import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-data";

export const dynamic = "force-static";

/** Crawlers that harvest content for AI training or bulk copying. Well-behaved bots honour this. */
const blockedBots = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "CCBot",
  "ClaudeBot",
  "anthropic-ai",
  "Google-Extended",
  "PerplexityBot",
  "Bytespider",
  "Amazonbot",
  "FacebookBot",
  "Applebot-Extended",
  "cohere-ai",
  "Diffbot",
  "ImagesiftBot",
  "Omgilibot",
  "Scrapy",
  "HTTrack",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: blockedBots, disallow: "/" },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
