# Dr. RRP Cardio — Website

Marketing + LMS-teaser site for Dr. RRP Cardio, built with Next.js (App
Router) + TypeScript + Tailwind CSS v4, animated with Framer Motion and
GSAP/ScrollTrigger, with Lenis for site-wide smooth scrolling.

## Stack

- **Next.js 16** (App Router, Turbopack) + TypeScript
- **Tailwind CSS v4** — design tokens (colours, fonts) live in
  [`src/app/globals.css`](src/app/globals.css) via `:root` variables and the
  `@theme inline` block. There is no `tailwind.config.js` — v4 reads tokens
  straight from CSS.
- **Framer Motion** — component-level animation (reveals, hovers, route
  transitions, nav condensing, form states)
- **GSAP + ScrollTrigger** — the hero's SVG line "draw", the final CTA's
  scroll-scrubbed background
- **Lenis** — smooth inertial scrolling, synced to ScrollTrigger in
  [`src/lib/smooth-scroll-provider.tsx`](src/lib/smooth-scroll-provider.tsx)
- **lucide-react** — icons (note: this major version dropped brand icons
  like "Youtube" for trademark reasons; `PlaySquare` stands in for YouTube
  links across the site)

## Structure

```
src/
  app/                 routes (App Router) — one folder per page
  components/
    layout/            Nav, Footer, PageTransition
    ui/                Button, Reveal/StaggerGroup, SectionHeading, PageHero, Logo
    home/               homepage sections
    courses/            course category + module cards
    sessions/           SessionCard, SessionAgenda, live-classes filter list
    certificate/        CertificatePreview, VerifyForm
    video/              VideoCard (lite YouTube facade), VideoGridItem
    forms/              ContactForm
  lib/
    courses-data.ts     course categories + modules (the naming source of truth)
    sessions-data.ts     live class / workshop session data
    video-data.ts        free YouTube videos + channel links
    nav-data.ts           nav links
    site-data.ts          brand name/wordmark, course-title prefix, founder
                          name/credentials, official enquiry email — single
                          source of truth every component reads from
    smooth-scroll-provider.tsx   Lenis + ScrollTrigger wiring
    motion-provider.tsx  Framer Motion MotionConfig (reduced-motion handling)
    use-reduced-motion.ts
public/
  images/               founder photos, favicon, OG image
```

## Adding a new course module

Edit [`src/lib/courses-data.ts`](src/lib/courses-data.ts). Each category has
a `modules` array — add an entry following the existing naming convention
(`RRP Cardio <Category> – Level N` or `RRP Cardio <Category> <Descriptor>`):

```ts
{
  name: "RRP Cardio ECG – Level 3",
  description: "...",
  format: "Recorded" | "Live" | "Recorded + Live",
  duration: "6 modules · ~8 hours",
}
```

New course *categories* need a new entry in the `courseCategories` array
(pick a `slug`, `icon` from `lucide-react`, etc.) — the `/courses` index and
`/courses/[slug]` route pick it up automatically via
`generateStaticParams`.

## Adding a new live class / workshop

Edit [`src/lib/sessions-data.ts`](src/lib/sessions-data.ts) and push a new
entry onto `allSessions` (or replace `featuredSession` when a newer one
should headline `/live-classes` and the homepage carousel). Every session
follows the same lecture → break → hands-on shape via `<SessionAgenda>`.

## Swapping in real assets later

- **Logo**: replace [`src/components/ui/Logo.tsx`](src/components/ui/Logo.tsx)
  — either edit the inline SVG or swap it for an `<Image>` pointing at a real
  logo file placed in `public/`. Regenerate `public/favicon.svg` and
  `public/og-image.png` from the real logo at that point.
- **Brand name**: the site name, logo wordmark text, course-title prefix, and
  certificate-number prefix all live in `brand` in
  [`src/lib/site-data.ts`](src/lib/site-data.ts) — change `brand.name`,
  `brand.wordmarkTop`/`wordmarkBottom`, `brand.coursePrefix`, and
  `brand.certificatePrefix` there and it propagates everywhere (nav, footer,
  metadata, certificate template, course titles). Regenerate
  `public/og-image.png` to match after a rename.
- **Founder identity**: name, title, and credentials live in the same file
  — update `founder.name`, `founder.title`, `founder.credentials` there and
  every page picks it up. The official enquiry email (`contactEmail`) lives
  there too.
- **Founder photo**: `public/images/founder-portrait-1.jpg` is the portrait
  used in the hero, founder section and faculty page. Swap the file (same
  name) to update everywhere. `founder-portrait-2.jpg` (scrub-suit photo) is
  currently unused.
- **Content**: see [`CONTENT-TODO.md`](CONTENT-TODO.md) for everything still
  placeholder (bio copy, curricula detail, accreditation, etc.).

## Development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint
```

## Notes on the animation system

- `SmoothScrollProvider` (in the root layout) skips Lenis entirely when
  `prefers-reduced-motion` is set, falling back to native scroll.
- `MotionProvider` wraps the app in Framer Motion's `<MotionConfig
  reducedMotion="user">`, which strips transform-based animation for
  reduced-motion users app-wide without each component branching on it.
- GSAP-driven pieces (`Hero`, `FinalCTA`) check `useReducedMotion()`
  manually and skip straight to the end state.
- `<Reveal>` / `<StaggerGroup>` in `src/components/ui/Reveal.tsx` are the
  house scroll-reveal primitives — reach for these before writing a new
  bespoke scroll animation.
