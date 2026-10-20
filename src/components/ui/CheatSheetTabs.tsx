import Link from "next/link";
import { cn } from "@/lib/utils";

const sheets = [
  { href: "/ecg-cheat-sheet", label: "ECG" },
  { href: "/cath-lab-cheat-sheet", label: "Cath Lab views" },
];

/** Switcher shown at the top of every cheat sheet so the two sheets read as one section. */
export function CheatSheetTabs({ current }: { current: string }) {
  return (
    <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-5 pt-8 sm:px-8">
      <Link href="/cheat-sheets" className="text-sm font-medium text-royal-700 underline-offset-2 hover:underline">
        All cheat sheets
      </Link>
      <span aria-hidden="true" className="text-mist-300">·</span>
      <div role="tablist" aria-label="Cheat sheet" className="inline-flex rounded-full border border-mist-200 bg-mist-50 p-1">
        {sheets.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            aria-current={current === s.href ? "page" : undefined}
            className={cn(
              "rounded-full px-5 py-1.5 text-sm font-medium transition-colors",
              current === s.href ? "bg-royal-700 text-white" : "text-mist-700 hover:text-royal-700",
            )}
          >
            {s.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
