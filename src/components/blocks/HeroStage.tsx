import { HeroTilt } from "./HeroTilt";

type Chip = { big: string; small: string };

/**
 * Hero centrepiece (CSS 3D, no WebGL): a working file of financial statements floats in perspective;
 * its chart builds, its ledger lines are ticked one by one, then the SCO mark comes down like a
 * seal and stamps the report. Glass chips carry real facts. Pointer moves tilt the whole scene.
 */
export function HeroStage({ chips, seal, ar }: { chips: Chip[]; seal: string; ar: boolean }) {
  const bars = [38, 56, 47, 70, 62, 86];
  return (
    <div className="hstage" data-hstage dir="ltr" aria-hidden="true">
      <HeroTilt />
      <div className="hs-glow" />
      <div className="hs-floor">
        <span />
        <span />
      </div>
      <div className="hs-scene">
        <div className="hs-sheet hs-s3" />
        <div className="hs-sheet hs-s2" />
        <div className="hs-sheet hs-s1">
          <div className="hs-head">
            <span className="hs-dot" />
            <span className="hs-line w-[46%]" />
            <span className="hs-line ms-auto w-[18%] opacity-60" />
          </div>
          <div className="hs-chart">
            <svg viewBox="0 0 240 110" preserveAspectRatio="none">
              {[0, 1, 2, 3].map((r) => (
                <line key={r} x1="0" x2="240" y1={14 + r * 30} y2={14 + r * 30} className="hs-grid" />
              ))}
              {bars.map((v, i) => (
                <rect key={i} x={12 + i * 38} y={104 - v} width="22" height={v} rx="4" className={`hs-bar ${i === 5 ? "is-hot" : ""}`} style={{ ["--i" as string]: i } as React.CSSProperties} />
              ))}
              <path d="M23 70 61 52 99 60 137 36 175 42 213 16" className="hs-trend" pathLength={1} />
              <circle cx="213" cy="16" r="4.5" className="hs-trend-dot" />
            </svg>
          </div>
          <ul className="hs-rows">
            {[72, 58, 80, 64].map((w, i) => (
              <li key={i} style={{ ["--i" as string]: i } as React.CSSProperties}>
                <span className="hs-tick">
                  <svg viewBox="0 0 16 16"><path d="M3.5 8.5 6.5 11.5 12.5 4.5" /></svg>
                </span>
                <span className="hs-line" style={{ width: `${w}%` }} />
                <span className="hs-line hs-amt" />
              </li>
            ))}
          </ul>
          <div className="hs-seal">
            <svg viewBox="0 0 120 120">
              <defs>
                <path id="hs-ring" d="M60 60m-44 0a44 44 0 1 1 88 0a44 44 0 1 1 -88 0" />
              </defs>
              <circle cx="60" cy="60" r="56" className="hs-seal-o" />
              <circle cx="60" cy="60" r="33" className="hs-seal-i" />
              <text className="hs-seal-t" lang={ar ? "ar" : "en"}>
                <textPath href="#hs-ring" startOffset="0">{seal}</textPath>
              </text>
              <path d="M44 61 55 72 78 47" className="hs-seal-tick" />
            </svg>
          </div>
          <span className="hs-shadow" />
        </div>
        <div className="hs-stamp">
          <svg viewBox="0 0 48 48">
            <defs>
              <linearGradient id="hs-frame" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#7d84ff" />
                <stop offset="0.55" stopColor="#2b2ff5" />
                <stop offset="1" stopColor="#04019f" />
              </linearGradient>
              <linearGradient id="hs-tickg" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0" stopColor="#ff8a4f" />
                <stop offset="1" stopColor="#fc4e08" />
              </linearGradient>
            </defs>
            <rect x="4" y="9" width="32" height="32" rx="4" fill="none" stroke="url(#hs-frame)" strokeWidth="5" />
            <path d="M11 25.5 18.5 33 44 6" fill="none" stroke="url(#hs-tickg)" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      {chips.map((c, i) => (
        <div key={i} className={`hs-chip hs-chip-${i}`} dir={ar ? "rtl" : "ltr"}>
          <b className="tnum" dir="ltr">{c.big}</b>
          <span>{c.small}</span>
        </div>
      ))}
    </div>
  );
}
