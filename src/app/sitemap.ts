import type { MetadataRoute } from "next";
import { courseCategories } from "@/lib/courses-data";
import { getAllPosts } from "@/lib/blog";
import { siteUrl } from "@/lib/site-data";

const staticRoutes = [
  "",
  "/about",
  "/courses",
  "/faculty",
  "/live-classes",
  "/workshops",
  "/certificates",
  "/free-learning",
  "/ecg-mastery",
  "/cheat-sheets",
  "/ecg-cheat-sheet",
  "/cath-lab",
  "/simulators",
  "/echo-simulator",
  "/ct-simulator",
  "/echo-calculators",
  "/cath-lab-cheat-sheet",
  "/contact",
  "/blog",
  "/privacy-policy",
  "/terms",
];

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    ...staticRoutes,
    ...courseCategories.map((c) => `/courses/${c.slug}`),
    ...getAllPosts().map((p) => `/blog/${p.slug}`),
  ];
  return routes.map((route) => ({
    url: `${siteUrl}${route}${route ? "/" : ""}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
