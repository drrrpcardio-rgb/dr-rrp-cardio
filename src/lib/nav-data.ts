interface NavLink {
  label: string;
  href: string;
  /** Render as a plain <a> (full navigation) instead of Next's <Link>. */
  external?: boolean;
}

export const navLinks: NavLink[] = [
  { label: "About", href: "/about" },
  { label: "Courses", href: "/courses" },
  { label: "Faculty", href: "/faculty" },
  { label: "Live Classes", href: "/live-classes" },
  { label: "Workshops", href: "/workshops" },
  { label: "Certificates", href: "/certificates" },
  { label: "Free Learning", href: "/free-learning" },
  // Static build of the ECG Mastery simulator, dropped into public/ecg-mastery/
  // (see the separate ecg-simulator repo) rather than a Next.js page route —
  // `external: true` tells <Nav> to render this one as a plain <a> instead of
  // Next's <Link>, so clicking it does a real full-page navigation straight
  // to the static files instead of Next's client router trying (and failing)
  // to resolve it against its own page manifest. trailingSlash matches
  // next.config's output: "export" convention (avoids a redirect/404 on
  // static hosts).
  { label: "ECG Mastery", href: "/ecg-mastery/", external: true },
  { label: "Contact", href: "/contact" },
];
