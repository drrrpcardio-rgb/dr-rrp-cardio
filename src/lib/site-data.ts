/**
 * Single source of truth for brand identity, founder identity, and the
 * official enquiry email. Every component should reference these rather
 * than hardcoding the name/brand/email, so a future correction only needs
 * to happen here.
 */
export const brand = {
  /** Full brand name — used in titles, footer, certificate wordmark, etc. */
  name: "Dr. RRP Cardio",
  /** Two-line logo lockup: top line (bold) + bottom line (small, tracked). */
  wordmarkTop: "Dr. RRP",
  wordmarkBottom: "Cardio",
  /** Prefix used on every course/module name, e.g. "RRP Cardio ECG – Level 1". */
  coursePrefix: "RRP Cardio",
  /** Prefix for generated certificate numbers, e.g. "RRPC-ECG1-000123". */
  certificatePrefix: "RRPC",
  tagline: "Learn. Understand. Apply.",
};

export const founder = {
  /** Always use the full name — never shorten to "Dr. Rajaram Prasad". */
  name: "Dr. A. Rajaram Prasad",
  title: "Consultant Interventional Cardiologist",
  credentials: "MD, DM, FSCAI",
  role: "Founder & Course Director",
};

/**
 * Public site URL. Placeholder until the real domain is bought/connected —
 * update it here and the metadata, sitemap and robots.txt all follow.
 */
export const siteUrl = "https://rrpcardio.com";

export const contactEmail = "drrrpcardio@gmail.com";

/**
 * Site-wide announcement bar (below the nav). Set `enabled: false` to turn
 * it off without deleting the config. `id` is stored in the visitor's
 * browser when they dismiss it — change `id` (not just the text) whenever
 * you want a dismissed banner to reappear for returning visitors.
 */
export const announcement = {
  enabled: true,
  id: "ecg-level-2-2026",
  text: "RRP Cardio ECG – Level 2 is coming in October — enquiries now open.",
  href: "/courses/ecg",
  linkLabel: "View course",
};

/**
 * Web3Forms access key — delivers ContactForm submissions to `contactEmail`
 * as real emails via https://api.web3forms.com/submit. This key is designed
 * by Web3Forms to be used client-side (it's not a secret credential), so
 * it's safe to ship in the bundle. Get/rotate it at https://web3forms.com.
 */
export const web3formsAccessKey = "bab3cb3a-479c-4d2b-af98-2696ea90b88e";
