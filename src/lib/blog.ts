import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";
import { parse as parseYaml } from "yaml";

/**
 * Blog posts are Markdown files in /content/blog (one file per post, filename = URL slug). The front matter
 * holds the title, date, tags and optional call-to-action buttons. Everything is read at build time, so the
 * site stays a plain static export. Posts with `draft: true` are only listed while running `next dev`.
 */
const POSTS_DIR = path.join(process.cwd(), "content", "blog");

export interface PostCta {
  label: string;
  url: string;
}

export interface PostMeta {
  slug: string;
  title: string;
  description: string;
  /** ISO date, YYYY-MM-DD. */
  date: string;
  tags: string[];
  kicker?: string;
  author?: string;
  authorTitle?: string;
  cta: PostCta[];
  draft: boolean;
  /** Cover image shown on the blog cards. */
  cover?: string;
  /** Short take-aways shown in a box at the top of the post. */
  keyPoints: string[];
  readingMinutes: number;
}

export interface TocItem {
  id: string;
  text: string;
}

export interface Post extends PostMeta {
  html: string;
  toc: TocItem[];
}

function readPost(file: string): { meta: PostMeta; body: string } {
  const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf8").replace(/\r\n/g, "\n");
  const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(raw);
  if (!m) throw new Error(`${file}: missing front matter`);
  const fm = parseYaml(m[1]) as Record<string, unknown>;
  for (const k of ["title", "description", "date"]) {
    if (!fm[k]) throw new Error(`${file}: front matter needs "${k}"`);
  }
  const meta: PostMeta = {
    slug: file.replace(/\.md$/, ""),
    title: String(fm.title),
    description: String(fm.description),
    // YAML turns an unquoted 2026-10-21 into a Date, so normalise it back to a plain date string.
    date: fm.date instanceof Date ? fm.date.toISOString().slice(0, 10) : String(fm.date),
    tags: Array.isArray(fm.tags) ? fm.tags.map(String) : [],
    kicker: fm.kicker ? String(fm.kicker) : undefined,
    author: fm.author ? String(fm.author) : undefined,
    authorTitle: fm.author_title ? String(fm.author_title) : undefined,
    cta: Array.isArray(fm.cta) ? (fm.cta as PostCta[]) : [],
    draft: fm.draft === true,
    cover: fm.cover ? String(fm.cover) : undefined,
    keyPoints: Array.isArray(fm.key_points) ? fm.key_points.map(String) : [],
    readingMinutes: Math.max(1, Math.round(m[2].split(/\s+/).filter(Boolean).length / 200)),
  };
  return { meta, body: m[2] };
}

/** Turns the `<!-- VIDEO: /path/clip.mp4 -->` placeholders into players (poster = the .png with the same name). */
function withVideos(md: string): string {
  return md.replace(/<!--\s*VIDEO:\s*(\S+?\.mp4)[^>]*-->/g, (_all, src: string) => {
    const poster = src.replace(/\.mp4$/, ".png");
    return `<video controls preload="none" playsinline poster="${poster}" src="${src}"></video>`;
  });
}

function visible(meta: PostMeta): boolean {
  return !meta.draft || process.env.NODE_ENV === "development";
}

export function getAllPosts(): PostMeta[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => readPost(f).meta)
    .filter(visible)
    .sort((a, b) => b.date.localeCompare(a.date));
}

const slugify = (t: string): string =>
  t.toLowerCase().replace(/<[^>]+>/g, "").replace(/&[a-z#0-9]+;/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Gives every <h2> an id and returns the list of them for the table of contents. */
function withHeadingIds(html: string): { html: string; toc: TocItem[] } {
  const toc: TocItem[] = [];
  const out = html.replace(/<h2>([\s\S]*?)<\/h2>/g, (_all, inner: string) => {
    const id = slugify(inner) || `section-${toc.length + 1}`;
    toc.push({ id, text: inner.replace(/<[^>]+>/g, "") });
    return `<h2 id="${id}">${inner}</h2>`;
  });
  return { html: out, toc };
}

export function getPost(slug: string): Post | null {
  const file = `${slug}.md`;
  if (!fs.existsSync(path.join(POSTS_DIR, file))) return null;
  const { meta, body } = readPost(file);
  if (!visible(meta)) return null;
  // The post files are written by the site owner and live in the repository, so the HTML they produce is trusted.
  const raw = marked.parse(withVideos(body), { async: false }) as string;
  const { html, toc } = withHeadingIds(raw);
  return { ...meta, html, toc };
}

export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}
