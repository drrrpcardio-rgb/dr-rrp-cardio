import type { ReactNode } from "react";

export function Card({
  id,
  n,
  title,
  note,
  children,
  className = "",
}: {
  id?: string;
  n?: number;
  title: string;
  note?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div id={id} className={`scroll-mt-28 rounded-2xl border border-mist-200 bg-white p-6 shadow-sm ${className}`}>
      <div className="flex items-center gap-3">
        {n !== undefined && (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold-400 text-sm font-bold text-ink">
            {n}
          </span>
        )}
        <h3 className="font-heading text-xl font-semibold text-royal-800">{title}</h3>
        {note && <span className="text-xs text-mist-600">{note}</span>}
      </div>
      <div className="mt-4 text-sm leading-relaxed text-ink-soft">{children}</div>
    </div>
  );
}

export function Bullets({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-2 pl-5 marker:text-royal-400">{children}</ul>;
}

export function Table({ head, rows }: { head: ReactNode[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[260px] border-collapse text-left text-sm">
        <thead>
          <tr className="bg-royal-50 text-royal-800">
            {head.map((h, i) => (
              <th key={i} className="px-3 py-2 text-xs font-semibold tracking-wide uppercase">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-mist-100 align-top last:border-0">
              {r.map((c, j) => (
                <td key={j} className={`px-3 py-2 ${j === 0 ? "font-medium text-ink" : ""}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const Muted = ({ children }: { children: ReactNode }) => (
  <p className="mt-3 text-xs text-mist-600">{children}</p>
);
