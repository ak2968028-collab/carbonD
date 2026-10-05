import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface Props {
  label: string;
  value: string;
  sub?: string;
  /** Signed change; `goodWhenDown` decides whether a fall is shown as good */
  delta?: { value: string; down: boolean; goodWhenDown?: boolean; note?: string };
  icon?: React.ReactNode;
  className?: string;
}

export default function StatTile({ label, value, sub, delta, icon, className = "" }: Props) {
  const good = delta ? delta.down === (delta.goodWhenDown ?? true) : false;
  return (
    <div className={`rounded-2xl border border-line bg-surface-2 p-4 ${className}`}>
      <div className="flex items-center gap-2 text-[13px] text-muted">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
      {delta && (
        <p className={`mt-2 inline-flex items-center gap-1 text-xs font-medium ${good ? "text-good-text" : "text-bad-text"}`}>
          {delta.down ? <ArrowDownRight className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
          {delta.value}
          {delta.note && <span className="font-normal text-muted">{delta.note}</span>}
        </p>
      )}
    </div>
  );
}
