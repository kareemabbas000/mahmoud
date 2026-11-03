/** First-visit-per-session curtain: the SCO tick draws itself, then the curtain lifts. CSS-only; skipped for returning visitors and reduced motion. */
export function IntroCurtain() {
  return (
    <div className="intro-curtain" aria-hidden="true">
      <svg viewBox="0 0 48 48" width="96" height="96">
        <rect x="4" y="9" width="32" height="32" rx="3" fill="none" stroke="#8f97ff" strokeWidth="4" className="intro-frame" />
        <path d="M11 25.5 18.5 33 44 6" fill="none" stroke="#ff6a2b" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" className="intro-tick" />
      </svg>
      <span className="intro-word">SCO</span>
    </div>
  );
}
