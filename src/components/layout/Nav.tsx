"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, useMotionValueEvent, useScroll, AnimatePresence } from "framer-motion";
import { Menu, X, PlaySquare } from "lucide-react";
import { VectorLogo } from "@/components/ui/VectorLogo";
import { Button } from "@/components/ui/Button";
import { navLinks } from "@/lib/nav-data";
import { youtubeChannels } from "@/lib/video-data";
import { cn } from "@/lib/utils";
import { brand } from "@/lib/site-data";

export function Nav() {
  const [condensed, setCondensed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const pathname = usePathname();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setCondensed(latest > 48);
  });

  // Close the mobile menu on route change. Adjusting state during render in
  // response to a changed prop (rather than in an effect) avoids an extra
  // cascading render — see https://react.dev/learn/you-might-not-need-an-effect.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMenuOpen(false);
  }

  // Close on Escape and lock background scroll while the menu is open.
  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <motion.header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-300",
          condensed
            ? "border-b border-mist-200 bg-white/85 shadow-sm backdrop-blur-md"
            : "border-b border-transparent bg-white/0",
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 sm:px-8">
          <motion.div
            animate={{ paddingTop: condensed ? 12 : 22, paddingBottom: condensed ? 12 : 22 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex items-center"
          >
            <Link href="/" onClick={() => setMenuOpen(false)}>
              <VectorLogo />
            </Link>
          </motion.div>

          <nav className="hidden items-center gap-5 xl:flex xl:gap-7">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="underline-grow text-sm font-medium text-ink-soft hover:text-royal-700"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-4 xl:flex">
            <a
              href={youtubeChannels.primary.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${brand.name} on YouTube`}
              className="text-mist-700 transition-colors hover:text-royal-700"
            >
              <PlaySquare size={20} strokeWidth={1.75} />
            </a>
            <Button href="/contact" size="md">
              Enquire Now
            </Button>
          </div>

          <button
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((v) => !v)}
            className="p-2 text-ink xl:hidden"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="fixed inset-x-0 top-0 z-40 overflow-hidden border-b border-mist-200 bg-white pt-20 shadow-lg xl:hidden"
          >
            <motion.nav
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
              }}
              className="flex flex-col gap-1 px-6 pb-8"
            >
              {navLinks.map((link) => (
                <motion.div
                  key={link.href}
                  variants={{
                    hidden: { opacity: 0, y: 12 },
                    visible: { opacity: 1, y: 0 },
                  }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="block border-b border-mist-100 py-3.5 text-lg font-medium text-ink-soft"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
                className="mt-4"
              >
                <Button href="/contact" size="lg" className="w-full">
                  Enquire Now
                </Button>
              </motion.div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
