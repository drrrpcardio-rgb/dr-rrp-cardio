interface NavLink {
  label: string;
  href: string;
  /** Render as a plain <a> (full navigation) instead of Next's <Link>. */
  external?: boolean;
}

export interface NavGroup {
  label: string;
  items: (NavLink & { description?: string })[];
}

/** Header navigation: dropdown groups first, then plain links. */
export const navGroups: NavGroup[] = [
  {
    label: "Learn",
    items: [
      { label: "Courses", href: "/courses", description: "ECG, Echo, Cath Lab, IVUS and more" },
      { label: "Live Classes", href: "/live-classes", description: "Scheduled teaching sessions" },
      { label: "Workshops", href: "/workshops", description: "Hands-on practical days" },
      { label: "Free Learning", href: "/free-learning", description: "Videos on YouTube" },
      { label: "Cheat Sheets", href: "/cheat-sheets", description: "ECG and Cath Lab views, free PDFs" },
      { label: "Blog", href: "/blog", description: "Cases and teaching notes" },
    ],
  },
  {
    label: "Simulators",
    items: [
      { label: "ECG Mastery", href: "/ecg-mastery", description: "12-lead ECG simulator and library" },
      { label: "Cath Lab", href: "/cath-lab", description: "Virtual angiography, devices, procedures" },
      { label: "3D Angiography Views", href: "/angio-3d", description: "Move a C-arm around a 3D coronary tree" },
      { label: "Echo Simulator", href: "/echo-simulator", description: "Practise probe placement and echo windows" },
      { label: "Echo Calculators", href: "/echo-calculators", description: "Graded echo measurements and formulas" },
    ],
  },
  {
    label: "About",
    items: [
      { label: "About", href: "/about", description: "Our story and approach" },
      { label: "Faculty", href: "/faculty", description: "Meet the teachers" },
      { label: "Certificates", href: "/certificates", description: "Certification and verification" },
    ],
  },
];

export const navPlainLinks: NavLink[] = [{ label: "Contact", href: "/contact" }];

/** Flat list (used by the footer). */
export const navLinks: NavLink[] = [
  ...navGroups.flatMap((g) => g.items.map(({ label, href, external }) => ({ label, href, external }))),
  ...navPlainLinks,
];
