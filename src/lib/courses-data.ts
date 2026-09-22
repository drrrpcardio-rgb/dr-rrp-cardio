import { Activity, HeartPulse, Radio, Waves, GitBranch, LucideIcon } from "lucide-react";

export type CourseFormat = "Recorded" | "Live" | "Recorded + Live";

export interface CourseModule {
  name: string;
  description: string;
  format: CourseFormat;
  duration: string;
  /**
   * Whether new enrollments are currently being taken. Defaults to "open" —
   * only set to "closed" once a module has genuinely stopped accepting
   * enrollments. A closed module shows a "Completed" badge instead of
   * "Enquire Now", and drops out of the contact form's course dropdown.
   */
  enrollmentStatus?: "open" | "closed";
}

export interface CourseCategory {
  slug: string;
  name: string;
  shortName: string;
  icon: LucideIcon;
  tagline: string;
  description: string;
  modules: CourseModule[];
}

export const courseCategories: CourseCategory[] = [
  {
    slug: "ecg",
    name: "RRP Cardio ECG",
    shortName: "ECG",
    icon: Activity,
    tagline: "Read the strip with confidence",
    description:
      "A structured path from first-principles ECG interpretation to pattern recognition in real clinical cases — built for doctors, postgraduates, and nurses who read ECGs every day.",
    modules: [
      {
        name: "RRP Cardio ECG – Level 1",
        description:
          "The foundation course: how the ECG is generated, a systematic reading approach, rhythm basics, and the common abnormalities every frontline clinician should recognise on sight.",
        format: "Recorded + Live",
        duration: "6 modules · ~8 hours",
        enrollmentStatus: "closed",
      },
      {
        name: "RRP Cardio ECG – Level 2",
        description:
          "Builds on Level 1 with advanced axis and hypertrophy patterns, ischaemia and infarction localisation, conduction blocks, and a structured approach to complex arrhythmias.",
        format: "Recorded + Live",
        duration: "8 modules · ~10 hours",
      },
    ],
  },
  {
    slug: "echo",
    name: "RRP Cardio Echo",
    shortName: "Echo",
    icon: Waves,
    tagline: "Build a systematic scanning eye",
    description:
      "Practical transthoracic echocardiography training focused on a repeatable window-by-window protocol, chamber quantification, and recognising common structural and functional abnormalities.",
    modules: [
      {
        name: "RRP Cardio Echo – Level 1",
        description:
          "Standard views and windows, basic chamber and valve assessment, ejection fraction estimation, and a checklist-driven approach to a complete study.",
        format: "Recorded + Live",
        duration: "7 modules · ~9 hours",
      },
    ],
  },
  {
    slug: "cath-lab",
    name: "RRP Cardio Cath Lab",
    shortName: "Cath Lab",
    icon: GitBranch,
    tagline: "Understand the room, not just the images",
    description:
      "A practical orientation to the cardiac catheterisation laboratory — workflow, equipment, sterile technique, and the fundamentals of coronary angiography for technologists and trainees.",
    modules: [
      {
        name: "RRP Cardio Cath Lab Basics",
        description:
          "Cath lab workflow and safety, C-arm and imaging fundamentals, vascular access, contrast and radiation basics, and how to read a standard angiography run.",
        format: "Recorded",
        duration: "5 modules · ~6 hours",
      },
    ],
  },
  {
    slug: "ivus",
    name: "RRP Cardio IVUS",
    shortName: "IVUS",
    icon: Radio,
    tagline: "Intravascular imaging, made systematic",
    description:
      "A focused masterclass on intravascular ultrasound for interventional cardiology trainees — image acquisition, vessel and lesion assessment, and stent optimisation.",
    modules: [
      {
        name: "RRP Cardio IVUS Masterclass",
        description:
          "IVUS fundamentals, systematic pullback interpretation, lesion severity and plaque characterisation, and using IVUS to guide and optimise stent deployment.",
        format: "Live",
        duration: "4 modules · ~5 hours",
      },
    ],
  },
  {
    slug: "interventional-cardiology",
    name: "RRP Cardio Interventional Cardiology",
    shortName: "Interventional",
    icon: HeartPulse,
    tagline: "From indication to procedure",
    description:
      "A structured overview of interventional cardiology practice — case selection, procedural planning, device fundamentals, and the clinical reasoning behind common interventions.",
    modules: [
      {
        name: "RRP Cardio Interventional Cardiology",
        description:
          "Case-based teaching covering patient selection, procedural planning, common device and technique fundamentals, and periprocedural care.",
        format: "Recorded + Live",
        duration: "9 modules · ~12 hours",
      },
    ],
  },
];

export function getCourseCategory(slug: string) {
  return courseCategories.find((c) => c.slug === slug);
}
