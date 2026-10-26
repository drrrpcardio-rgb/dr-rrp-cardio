/** Every free simulator and tool, used by the home page and the /simulators hub. */
export const simulators = [
  {
    id: "echo",
    title: "Echo Simulator",
    tag: "New",
    text: "Move a probe on a 3D patient and get a realistic echo image: 15 views, colour and spectral Doppler, M-mode, measurements, 22 pathology cases, a quiz and a guided lesson.",
    href: "/echo-simulator",
    image: "/images/echo-sim-lab.jpg",
    points: ["15 standard TTE views", "Colour, PW, CW and tissue Doppler", "22 cases with quiz and report"],
  },
  {
    id: "ecg",
    title: "ECG Mastery",
    tag: "Simulator",
    text: "A 12-lead ECG simulator with 97 presets, a library of 111 topics, lead placement practice and a quiz.",
    href: "/ecg-mastery",
    image: "/images/sim-ecg.jpg",
    points: ["97 rhythm presets", "111-topic library", "Lead placement practice"],
  },
  {
    id: "cath",
    title: "Cath Lab",
    tag: "Simulator",
    text: "Virtual coronary angiography with a moving C-arm, 141 devices in procedure order and 29 step-by-step procedures.",
    href: "/cath-lab",
    image: "/images/sim-cath.jpg",
    points: ["3D angiography views", "141 devices", "29 procedures"],
  },
  {
    id: "calc",
    title: "Echo Calculators",
    tag: "Tool",
    text: "30 echo calculators graded against ASE/EACVI and ACC/AHA cut-offs, with formulas, reference ranges and a printable report.",
    href: "/echo-calculators",
    image: "/images/sim-calculators.jpg",
    points: ["30 graded calculators", "Shared patient BSA", "Copy or print a report"],
  },
] as const;

/** The two free interactive tools hosted under this site (prebuilt static apps in /public). */
export const ecgTool = {
  title: "ECG Mastery",
  text: "A 12-lead ECG simulator with 97 presets, a library of 111 topics, lead placement practice and a quiz.",
  href: "/ecg-mastery",
  launch: "/ecg-simulator/#machine",
};

export const cathLabTools = [
  {
    title: "Explore: virtual coronary angiography",
    text: "Rotate a 3D heart and coronary tree, move the C-arm and see how projection angles change what an angiogram shows. Includes a best-view finder and bypass grafts.",
    href: "/cath-sim/",
  },
  {
    title: "Cath lab equipment",
    text: "141 devices in procedure order, from access sheaths and wires to stents, EP catheters, valves and vessel devices, with overviews, uses and safety points.",
    href: "/cath-sim/equipment/",
  },
  {
    title: "Procedures",
    text: "29 cath lab and vascular procedures from indications and contraindications through puncture to closure, with equipment, formulas, complications and aftercare.",
    href: "/cath-sim/procedures/",
  },
];
