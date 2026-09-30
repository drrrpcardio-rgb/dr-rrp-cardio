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
  { label: "ECG Mastery", href: "/ecg-mastery" },
  { label: "Contact", href: "/contact" },
];
