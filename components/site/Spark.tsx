/** Small per-niche signature drawings for the niche cards. Decorative only. */
export function Spark({ kind }: { kind: "forex" | "product" | "manual_testing" }) {
  if (kind === "forex")
    return (
      <svg className="niche-spark" viewBox="0 0 200 44" preserveAspectRatio="none" aria-hidden="true">
        <line x1="0" y1="12" x2="200" y2="12" stroke="#ff8f8f" strokeDasharray="3 4" strokeWidth="1" opacity=".6" />
        <polyline fill="none" stroke="#7fd3ff" strokeWidth="2" points="0,34 18,30 32,36 50,24 66,28 84,18 100,22 118,16 134,20 152,14 170,19 200,15" />
        <circle cx="152" cy="14" r="3" fill="#7fd3ff" />
      </svg>
    );
  if (kind === "product")
    return (
      <svg className="niche-spark" viewBox="0 0 200 44" aria-hidden="true">
        <rect x="0" y="4" width="92" height="8" rx="4" fill="#c3b7ff" />
        <rect x="40" y="18" width="88" height="8" rx="4" fill="#c3b7ff" opacity=".55" />
        <rect x="104" y="32" width="96" height="8" rx="4" fill="#c3b7ff" opacity=".8" />
      </svg>
    );
  return (
    <svg className="niche-spark" viewBox="0 0 200 44" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i} transform={`translate(${i * 40} 4)`}>
          <rect width="28" height="20" rx="5" fill="none" stroke={i < 4 ? "#7fe3b4" : "#2d3d63"} />
          {i < 4 && <polyline points="8,10 12,14 20,6" fill="none" stroke="#7fe3b4" strokeWidth="2" />}
        </g>
      ))}
      <rect x="0" y="34" width="200" height="5" rx="2.5" fill="#1f2c4a" />
      <rect x="0" y="34" width="160" height="5" rx="2.5" fill="#7fe3b4" />
    </svg>
  );
}
