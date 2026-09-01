# Content TODO

Everything below is placeholder, plausible-but-not-real, or otherwise needs a
real pass before this site goes live. Nothing here fabricates statistics,
accreditation, or outcome claims — but it should still be reviewed and
replaced with the real thing.

## Brand assets

- [ ] **Logo** — `src/components/ui/VectorLogo.tsx` is a built SVG wordmark
      (no real logo file exists yet). Replace with the real mark when
      available, and regenerate `public/favicon.svg` + `public/og-image.png`
      from it.
- [ ] **OG image** — `public/og-image.png` is a generated placeholder
      (royal blue background, wordmark, tagline). Replace with a designed
      one, ideally per-page.
- [x] **Founder photos** — `public/images/founder-portrait-1.jpg` and
      `founder-portrait-2.jpg` are real photos of Dr. A. Rajaram Prasad
      (rotated/resized from the originals in `assects/`). No action needed
      unless better photos become available.

## Copy

- [ ] **Founder bio** (`src/components/home/FounderIntro.tsx`,
      `src/app/faculty/page.tsx`) — written as plausible, generic bio copy.
      Name, title ("Consultant Interventional Cardiologist"), and
      credentials ("MD, DM, FSCAI") are now real — see
      [`src/lib/site-data.ts`](src/lib/site-data.ts), which every component
      reads from. Still needs the real career-detail narrative (fellowships,
      years in practice, current affiliation) once available.
- [ ] **About page story** (`src/app/about/page.tsx`) — philosophy and
      "Vector is the institution, [Dr. A. Rajaram Prasad] provides the
      credibility" framing is written per the brief, but should be reviewed
      against the real founder's voice.
- [ ] **Course module descriptions** (`src/lib/courses-data.ts`) — all five
      categories have plausible, non-specific curricula copy. Needs real
      module-by-module content once curricula are finalised. Keep claims
      generic (no invented outcome stats or accreditation).
- [ ] **Course format/duration** (`src/lib/courses-data.ts`) — duration and
      module-count figures are placeholder estimates, not confirmed
      curriculum data.

## Live classes / workshops

- [ ] Only one real session exists (`src/lib/sessions-data.ts`,
      `featuredSession` — Vector ECG Level 1, 23 Aug 2026). Add future
      sessions here as they're scheduled; the homepage carousel,
      `/live-classes`, and `/workshops` all read from this same file.
- [ ] **Venue** — deliberately omitted site-wide (no "IMA Hall", no "partner
      venues" placeholder, per correction). `SessionData.venue` is optional
      and only renders when set — add a real venue/city on `featuredSession`
      (and future sessions) once confirmed; leave it unset otherwise rather
      than filling in a placeholder.
- [ ] The "More live classes & workshops being scheduled" / "More workshops
      being scheduled" placeholder cards (home + `/workshops`) should be
      replaced by real upcoming entries as they're confirmed, and removed
      once there's a healthy pipeline of listed sessions.

## Certificates

- [ ] `CertificatePreview` renders with placeholder participant name,
      certificate number (`VCA-ECG1-000123`), and a fake QR-style pattern
      (not a real QR code). Needs a real numbering scheme and, eventually,
      an actual QR code generator if certificates go digital-verifiable.
- [ ] The `/certificates` verify form (`VerifyForm.tsx`) is UI-only — it
      mocks a lookup client-side (anything starting with "VCA" resolves as
      "found"). Needs a real backend/API route once certificates are
      actually issued and tracked.

## Contact form

- [x] **Delivery mechanism: Web3Forms.** `ContactForm.tsx` POSTs directly to
      the Web3Forms API on submit — no custom backend needed. Submissions are
      emailed to `contactEmail` (`vectorcardiologyacademy@gmail.com`) for
      real, regardless of the visitor's own device/email setup. The access
      key lives in [`src/lib/site-data.ts`](src/lib/site-data.ts)
      (`web3formsAccessKey`) — Web3Forms keys are designed to be public/
      client-side, not a secret. Manage or rotate the key at
      [web3forms.com](https://web3forms.com). An earlier mailto-based
      approach was replaced because it silently failed for visitors with no
      default email app configured.

## Faculty

- [ ] Only Dr. A. Rajaram Prasad is listed. The "More faculty joining soon"
      card (`src/app/faculty/page.tsx`) is a deliberate placeholder per the
      brief — replace/remove as real faculty are added.

## SEO / metadata

- [ ] `metadataBase` in `src/app/layout.tsx` points at a placeholder domain
      (`https://www.vectorcardiologyacademy.com`) — update once the real
      domain is confirmed.
- [ ] No `sitemap.ts` / `robots.ts` yet — add during deployment prep.

## Brand entity

- [x] The site presents the brand as **Vector Cardiology Academy** only —
      no parent-entity line anywhere (footer, certificate, or elsewhere).
