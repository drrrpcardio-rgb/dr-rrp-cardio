import { Reveal } from "@/components/ui/Reveal";
import { AgendaItem } from "@/lib/sessions-data";

/** Vertical timeline: time on the left, session content on the right. */
export function SessionAgenda({ agenda }: { agenda: AgendaItem[] }) {
  return (
    <ol className="relative border-l border-mist-200 pl-8">
      {agenda.map((item, i) => (
        <Reveal key={item.time} delay={i * 0.1} as="li" className="relative pb-10 last:pb-0">
          <span className="absolute top-1 -left-[41px] h-3.5 w-3.5 rounded-full border-2 border-royal-700 bg-white" />
          <div className="grid gap-1 sm:grid-cols-[180px_1fr] sm:gap-6">
            <span className="text-sm font-semibold text-royal-700">{item.time}</span>
            <div>
              <h4 className="font-heading text-base font-semibold text-ink">{item.title}</h4>
              {item.description && (
                <p className="mt-1 text-sm leading-relaxed text-mist-700">{item.description}</p>
              )}
            </div>
          </div>
        </Reveal>
      ))}
    </ol>
  );
}
