"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Check, Download, Link as LinkIcon, Mail, Printer } from "lucide-react";
import { cn } from "@/lib/utils";

interface TocItem {
  id: string;
  text: string;
}

const SIZES = ["sm", "md", "lg"] as const;
type Size = (typeof SIZES)[number];
const SIZE_KEY = "rrp-blog-text-size";

// The chosen text size lives in localStorage (with an in-memory fallback) and is read through a tiny store.
let memorySize: Size | null = null;
const sizeListeners = new Set<() => void>();
function subscribeSize(cb: () => void) {
  sizeListeners.add(cb);
  return () => sizeListeners.delete(cb);
}
function readSize(): Size {
  try {
    const saved = localStorage.getItem(SIZE_KEY) as Size | null;
    if (saved && SIZES.includes(saved)) return saved;
  } catch {
    /* storage unavailable */
  }
  return memorySize ?? "md";
}
function writeSize(s: Size) {
  try {
    localStorage.setItem(SIZE_KEY, s);
  } catch {
    /* storage unavailable: the size still changes for this visit */
  }
  memorySize = s;
  sizeListeners.forEach((l) => l());
}

function XLogo() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="currentColor">
      <path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3l-4.9-6.4L6.3 22H3.2l7.3-8.3L1 2h6.4l4.4 5.9L18.9 2Zm-1.1 18h1.7L6.3 3.9H4.5L17.8 20Z" />
    </svg>
  );
}

function WhatsAppLogo() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="currentColor">
      <path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.96L2 22l5.2-1.5A9.9 9.9 0 1 0 12.04 2Zm0 18.1a8.2 8.2 0 0 1-4.2-1.15l-.3-.18-3.08.9.9-3-.2-.31a8.2 8.2 0 1 1 6.88 3.74Zm4.5-6.14c-.25-.12-1.46-.72-1.69-.8-.23-.08-.39-.12-.55.12-.16.25-.63.8-.78.97-.14.16-.29.18-.53.06a6.7 6.7 0 0 1-3.34-2.92c-.25-.43.25-.4.72-1.33.08-.16.04-.3-.02-.43-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.41-.55-.42h-.47a.9.9 0 0 0-.65.3 2.73 2.73 0 0 0-.85 2.03 4.74 4.74 0 0 0 1 2.52 10.86 10.86 0 0 0 4.16 3.68c1.55.67 2.16.73 2.93.61.47-.07 1.46-.6 1.66-1.17.2-.58.2-1.07.15-1.17-.06-.1-.22-.16-.47-.28Z" />
    </svg>
  );
}

function LinkedInLogo() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="currentColor">
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4V21H3V9.75Zm6.5 0h3.8v1.6h.06c.53-1 1.84-2.06 3.79-2.06 4.05 0 4.8 2.67 4.8 6.13V21h-4v-4.9c0-1.17-.02-2.68-1.63-2.68-1.64 0-1.89 1.28-1.89 2.6V21h-4V9.75Z" />
    </svg>
  );
}

/** The bar under the post header: jump links, sharing, print and text size (like a magazine article page). */
export function PostToolbar({ toc, title, url }: { toc: TocItem[]; title: string; url: string }) {
  const size = useSyncExternalStore(subscribeSize, readSize, () => "md" as Size);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    document.getElementById("post-content")?.setAttribute("data-size", size);
  }, [size]);

  const pickSize = writeSize;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked */
    }
  };

  // The browser's print dialog saves the page as a PDF ("Save as PDF"), using the print layout in globals.css.
  // The page title becomes the file name, so it is set to the post title while the dialog is open.
  const downloadPdf = () => {
    const before = document.title;
    document.title = `${title} - Dr. RRP Cardio`;
    window.addEventListener("afterprint", () => (document.title = before), { once: true });
    window.print();
  };

  const enc = encodeURIComponent;
  const btn =
    "inline-flex size-9 items-center justify-center rounded-full border border-mist-200 bg-white text-royal-800 transition hover:border-royal-300 hover:bg-royal-50";

  return (
    <div className="no-print border-b border-mist-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-3 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
        {toc.length > 1 && (
          <nav aria-label="On this page" className="flex min-w-0 items-center gap-3">
            <span className="shrink-0 text-xs font-semibold tracking-widest text-mist-600 uppercase">On this page</span>
            <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:thin] lg:pb-0">
              {toc.map((t) => (
                <a
                  key={t.id}
                  href={`#${t.id}`}
                  className="shrink-0 rounded-full bg-royal-50 px-3 py-1 text-xs font-medium whitespace-nowrap text-royal-800 transition hover:bg-royal-100"
                >
                  {t.text}
                </a>
              ))}
            </div>
          </nav>
        )}
        <div className="flex shrink-0 items-center gap-1.5">
          <button type="button" onClick={copy} className={btn} title={copied ? "Link copied" : "Copy link"} aria-label="Copy link to this post">
            {copied ? <Check size={15} aria-hidden="true" /> : <LinkIcon size={15} aria-hidden="true" />}
          </button>
          <a className={btn} href={`https://x.com/intent/post?text=${enc(title)}&url=${enc(url)}`} target="_blank" rel="noopener" aria-label="Share on X">
            <XLogo />
          </a>
          <a className={btn} href={`https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`} target="_blank" rel="noopener" aria-label="Share on LinkedIn">
            <LinkedInLogo />
          </a>
          <a className={btn} href={`https://wa.me/?text=${enc(`${title}\n${url}`)}`} target="_blank" rel="noopener" aria-label="Share on WhatsApp" title="WhatsApp">
            <WhatsAppLogo />
          </a>
          {/* A mailto: link does nothing on computers with no mail app set up, so desktops open Gmail's compose window instead. */}
          <a
            className={btn}
            href={`mailto:?subject=${enc(title)}&body=${enc(url)}`}
            onClick={(e) => {
              if (window.matchMedia("(pointer: fine)").matches) {
                e.preventDefault();
                window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${enc(title)}&body=${enc(`${title}\n${url}`)}`, "_blank", "noopener");
              }
            }}
            aria-label="Share by email"
            title="Email"
          >
            <Mail size={15} aria-hidden="true" />
          </a>
          <button type="button" onClick={downloadPdf} className={btn} aria-label="Download this post as a PDF" title="Download PDF">
            <Download size={15} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => window.print()} className={btn} aria-label="Print this post" title="Print">
            <Printer size={15} aria-hidden="true" />
          </button>
          <span className="mx-1.5 h-6 w-px bg-mist-200" aria-hidden="true" />
          <div role="group" aria-label="Text size" className="flex items-end gap-0.5 rounded-full border border-mist-200 bg-white px-2 py-1">
            {SIZES.map((s, i) => (
              <button
                key={s}
                type="button"
                aria-pressed={size === s}
                aria-label={["Smaller text", "Normal text", "Larger text"][i]}
                onClick={() => pickSize(s)}
                className={cn(
                  "rounded-full px-1.5 leading-none font-semibold transition-colors",
                  ["text-xs", "text-sm", "text-base"][i],
                  size === s ? "text-royal-800" : "text-mist-500 hover:text-royal-700",
                )}
              >
                A
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
