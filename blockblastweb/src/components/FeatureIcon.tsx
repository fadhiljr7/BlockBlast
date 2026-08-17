/**
 * One flat, geometric icon per feature, drawn from the same 48-unit grid so the
 * set reads as a family. Decorative — every card states its meaning in text —
 * so all of them are hidden from assistive technology.
 */
export function FeatureIcon({ id }: { id: string }) {
  const common = {
    viewBox: '0 0 48 48',
    width: 34,
    height: 34,
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: 2.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: 'false' as const,
  }

  switch (id) {
    case 'sonic-navigation':
      // Concentric arcs radiating from a cell: sound leaving a point on the board.
      return (
        <svg {...common}>
          <rect x="6" y="19" width="10" height="10" rx="2.5" fill="currentColor" stroke="none" />
          <path d="M22 17a10 10 0 0 1 0 14" />
          <path d="M29 12a18 18 0 0 1 0 24" />
          <path d="M36 7a26 26 0 0 1 0 34" />
        </svg>
      )

    case 'pattern-system':
      // Four cells, four different fills — the point of the whole system.
      return (
        <svg {...common}>
          <rect x="6" y="6" width="16" height="16" rx="3" />
          <circle cx="14" cy="14" r="2.6" fill="currentColor" stroke="none" />
          <rect x="26" y="6" width="16" height="16" rx="3" />
          <path d="M29 11h10M29 14h10M29 17h10" strokeWidth="2" />
          <rect x="6" y="26" width="16" height="16" rx="3" />
          <path d="M11 29v10M14 29v10M17 29v10" strokeWidth="2" />
          <rect x="26" y="26" width="16" height="16" rx="3" />
          <path d="M29 34h10M34 29v10" strokeWidth="2" />
        </svg>
      )

    case 'three-ways-to-play':
      // Three routes from one piece to one destination.
      return (
        <svg {...common}>
          <rect x="4" y="19" width="10" height="10" rx="2.5" fill="currentColor" stroke="none" />
          <rect x="34" y="19" width="10" height="10" rx="2.5" strokeDasharray="3 3" />
          <path d="M16 24h16" />
          <path d="M16 17c8-6 12-6 17 3" />
          <path d="M16 31c8 6 12 6 17-3" />
        </svg>
      )

    case 'voiceover-native':
      // A spoken label leaving a cell.
      return (
        <svg {...common}>
          <rect x="5" y="9" width="26" height="20" rx="5" />
          <path d="M12 29v7l8-7" />
          <path d="M11 16h14M11 22h8" strokeWidth="2" />
          <path d="M37 15a11 11 0 0 1 0 18" />
          <path d="M43 10a19 19 0 0 1 0 28" opacity="0.55" />
        </svg>
      )

    case 'zen-mode':
      // An open circle: the run that never closes.
      return (
        <svg {...common}>
          <path d="M34 11a17 17 0 1 0 5 12" />
          <rect x="19" y="19" width="10" height="10" rx="2.5" fill="currentColor" stroke="none" />
        </svg>
      )

    case 'icloud-sync':
      // Two devices, one state passing between them.
      return (
        <svg {...common}>
          <rect x="4" y="10" width="16" height="28" rx="4" />
          <rect x="28" y="6" width="16" height="24" rx="3.5" />
          <path d="M22 20h4" opacity="0.5" />
          <path d="M24 34c6 4 14 2 18-4" />
          <path d="M38 30l4 0 0 4" />
        </svg>
      )

    default:
      return (
        <svg {...common}>
          <rect x="10" y="10" width="28" height="28" rx="6" />
        </svg>
      )
  }
}
