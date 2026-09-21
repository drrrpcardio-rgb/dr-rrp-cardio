import Link from "next/link";
import { PlaySquare, Mail } from "lucide-react";
import { VectorLogo } from "@/components/ui/VectorLogo";
import { navLinks } from "@/lib/nav-data";
import { youtubeChannels } from "@/lib/video-data";
import { brand, founder, contactEmail } from "@/lib/site-data";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-mist-200 bg-mist-50">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <VectorLogo />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-mist-700">
              Structured, practical cardiology education for doctors,
              postgraduates, nurses, and cath lab &amp; echo technicians.
              Learn. Understand. Apply.
            </p>
            <p className="mt-4 text-sm font-medium text-royal-800">
              Founded &amp; Led by {founder.name}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold tracking-[0.16em] text-mist-600 uppercase">
              Quick Links
            </h3>
            <ul className="mt-4 space-y-2.5">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="underline-grow text-sm text-ink-soft hover:text-royal-700"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold tracking-[0.16em] text-mist-600 uppercase">
              Connect
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-ink-soft">
              <li className="flex items-center gap-2.5">
                <PlaySquare size={17} className="shrink-0 text-mist-500" />
                <a
                  href={youtubeChannels.primary.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline-grow hover:text-royal-700"
                >
                  Main Channel
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <PlaySquare size={17} className="shrink-0 text-mist-500" />
                <a
                  href={youtubeChannels.pov.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline-grow hover:text-royal-700"
                >
                  POV Channel
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail size={17} className="shrink-0 text-mist-500" />
                <a href={`mailto:${contactEmail}`} className="underline-grow hover:text-royal-700">
                  {contactEmail}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 border-t border-mist-200 pt-6 text-xs text-mist-600">
          <p>© {year} {brand.name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
