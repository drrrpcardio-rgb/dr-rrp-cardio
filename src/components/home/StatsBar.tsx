import Link from "next/link";
import { Activity, GraduationCap, HeartPulse, Waves } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";

// What the academy offers, as a quick strip under the hero
const highlights = [
  { icon: GraduationCap, title: "Structured courses", text: "ECG to interventional", href: "/courses" },
  { icon: Waves, title: "3D echo simulator", text: "Scan, measure, diagnose", href: "/echo-simulator" },
  { icon: Activity, title: "Live 12-lead ECG", text: "Rhythms and quizzes", href: "/ecg-mastery" },
  { icon: HeartPulse, title: "Virtual cath lab", text: "Views, devices, procedures", href: "/cath-lab" },
];

export function StatsBar() {
  return (
    <section className="relative z-10 mx-auto -mt-12 max-w-6xl px-5 sm:px-8">
      <Reveal>
        <ul className="grid grid-cols-2 gap-2 rounded-3xl border border-mist-200 bg-white p-2 shadow-xl shadow-royal-900/10 lg:grid-cols-4">
          {highlights.map(({ icon: Icon, ...h }) => (
            <li key={h.title}>
              <Link href={h.href} className="group flex h-full items-center gap-3 rounded-2xl p-3 transition-colors hover:bg-royal-50 sm:gap-4 sm:p-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-royal-900 text-gold-400 transition-colors group-hover:bg-gold-400 group-hover:text-royal-950 sm:size-12">
                  <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-ink sm:text-base">{h.title}</span>
                  <span className="block text-xs text-mist-600">{h.text}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
