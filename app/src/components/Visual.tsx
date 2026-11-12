import type { Card } from "../types";

type Gold = Card["back"]["gold"];
interface Shot { x: number; y: number; xg: number | null; result: string }

const COLOURS: Record<string, string> = { goal: "var(--green-500)", saved: "var(--blue-500)", blocked: "var(--muted)", missed: "var(--red-500)" };

export function Visual({ gold }: { gold: Gold }) {
  const d = gold.data as Record<string, unknown>;
  if (gold.visual === "shotmap" && Array.isArray(d.shots)) {
    return (
      <svg class="shotmap" viewBox="0 -13.5 31 27" role="img" aria-label="Shot map, attacking right">
        <rect x="0" y="-13.5" width="31" height="27" fill="none" stroke="var(--border)" />
        <line x1="26" y1="-13.5" x2="26" y2="13.5" stroke="var(--red-500)" stroke-width="0.2" />
        {(d.shots as Shot[]).map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={0.6 + (s.xg ?? 0.05) * 4} fill={COLOURS[s.result] ?? "var(--muted)"} opacity="0.8">
            <title>{`${s.result}${s.xg != null ? `, xG ${s.xg}` : ""}`}</title>
          </circle>
        ))}
      </svg>
    );
  }
  if (gold.visual === "timeline" && Array.isArray(d.points)) {
    const pts = (d.points as [number, number][]).map(([t, p]) => `${(t / 3600) * 100},${(1 - p) * 40}`).join(" ");
    return (
      <svg class="timeline" viewBox="0 0 100 40" preserveAspectRatio="none" role="img" aria-label={`Win probability of ${String(d.team ?? "the team")}`}>
        <line x1="0" y1="20" x2="100" y2="20" stroke="var(--border)" stroke-width="0.3" />
        <polyline points={pts} fill="none" stroke="var(--blue-500)" stroke-width="0.8" />
      </svg>
    );
  }
  if (Array.isArray(d.rows)) {
    return (
      <table class="facts"><tbody>
        {(d.rows as string[][]).map((r, i) => <tr key={i}><th>{r[0]}</th><td>{r[1]}</td></tr>)}
      </tbody></table>
    );
  }
  return null;
}
