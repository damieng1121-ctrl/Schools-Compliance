/**
 * Placeholder recreation of the Education Lincs wordmark, used until the
 * real logo file lands at public/logo.png (or similar) — swap this out for
 * an <img src="/logo.png"> once that exists.
 */
export function PlatformBadge({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <rect width="40" height="40" rx="9" fill="#E5241C" />
      <text
        x="20"
        y="17"
        textAnchor="middle"
        fill="white"
        fontFamily="system-ui, sans-serif"
        fontSize="7"
        fontWeight="500"
        textLength="30"
        lengthAdjust="spacingAndGlyphs"
      >
        Education
      </text>
      <text
        x="20"
        y="30"
        textAnchor="middle"
        fill="white"
        fontFamily="system-ui, sans-serif"
        fontSize="13"
        fontWeight="800"
        letterSpacing="-0.3"
      >
        Lincs
      </text>
    </svg>
  );
}
