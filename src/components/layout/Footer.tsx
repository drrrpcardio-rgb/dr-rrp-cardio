import Link from "next/link";
import { ArrowRight, Mail, PlaySquare } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { HeartbeatLine } from "@/components/ui/Motion";
import { navGroups } from "@/lib/nav-data";
import { youtubeChannels } from "@/lib/video-data";
import { brand, founder, contactEmail } from "@/lib/site-data";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="no-print relative overflow-hidden border-t border-white/10 bg-royal-950 text-royal-100">
      <div aria-hidden="true" className="bg-grid pointer-events-none absolute inset-0 opacity-20" />
      <HeartbeatLine beats={8} className="absolute inset-x-0 top-0 h-14 w-full opacity-40" />

      <div className="relative mx-auto max-w-7xl px-5 pt-24 pb-10 sm:px-8">
        {/* Sign-off band */}
        <div className="flex flex-col items-start justify-between gap-8 border-b border-white/10 pb-14 lg:flex-row lg:items-end">
          <div>
            <p className="font-heading text-4xl leading-tight font-semibold text-white sm:text-5xl">
              Learn. Understand. <span className="text-gold-400">Apply.</span>
            </p>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-royal-200">
              Structured, practical cardiology education for doctors, postgraduates, nurses, and cath lab &amp; echo technicians.
            </p>
          </div>
          <Button href="/contact" variant="gold" size="lg" icon={<ArrowRight size={18} />}>
            Enquire Now
          </Button>
        </div>

        <div className="grid gap-12 py-14 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr_1.2fr]">
          <div>
            <Logo light />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-royal-200">
              Founded &amp; led by {founder.name}, {founder.credentials}, {founder.title}.
            </p>
          </div>

          {navGroups.map((group) => (
            <div key={group.label}>
              <h3 className="text-xs font-semibold tracking-[0.18em] text-gold-300 uppercase">{group.label}</h3>
              <ul className="mt-5 space-y-3">
                {group.items.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="underline-grow text-sm text-royal-100 transition-colors hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="text-xs font-semibold tracking-[0.18em] text-gold-300 uppercase">Connect</h3>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <a href={youtubeChannels.primary.url} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-2.5 hover:text-white">
                  <PlaySquare size={17} className="shrink-0 text-gold-400" aria-hidden="true" />
                  <span className="underline-grow">Main YouTube channel</span>
                </a>
              </li>
              <li>
                <a href={youtubeChannels.pov.url} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-2.5 hover:text-white">
                  <PlaySquare size={17} className="shrink-0 text-gold-400" aria-hidden="true" />
                  <span className="underline-grow">POV channel</span>
                </a>
              </li>
              <li>
                <a href={`mailto:${contactEmail}`} className="group inline-flex items-center gap-2.5 break-all hover:text-white">
                  <Mail size={17} className="shrink-0 text-gold-400" aria-hidden="true" />
                  <span className="underline-grow">{contactEmail}</span>
                </a>
              </li>
              <li>
                <Link href="/contact" className="underline-grow hover:text-white">
                  Contact form
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 pt-6 pr-16 text-xs text-royal-300 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {brand.name}. All rights reserved. Content and simulators may not be copied or redistributed without written permission.
          </p>
          <ul className="flex gap-5">
            <li>
              <Link href="/privacy-policy" className="underline-grow hover:text-white">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="underline-grow hover:text-white">
                Terms &amp; Conditions
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
