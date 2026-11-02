import type { ReactNode } from 'react'

// Small stroke icons (Lucide-style), sized via font-size / currentColor
type IconProps = { className?: string }

function Svg({ className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      className={'icon' + (className ? ` ${className}` : '')}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  )
}

export const PinIcon = (p: IconProps) => (
  <Svg {...p}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></Svg>
)

export const PinOffIcon = (p: IconProps) => (
  <Svg {...p}><path d="M5.4 5.4A8 8 0 0 0 4 10c0 6 8 12 8 12a29 29 0 0 0 4.8-4.7" /><path d="M19.6 14.5A9 9 0 0 0 20 10a8 8 0 0 0-12.8-6.4" /><path d="m2 2 20 20" /></Svg>
)

export const ExternalIcon = (p: IconProps) => (
  <Svg {...p}><path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></Svg>
)

export const CloseIcon = (p: IconProps) => (
  <Svg {...p}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></Svg>
)

export const ListIcon = (p: IconProps) => (
  <Svg {...p}><path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" /><path d="M3 6h.01" /><path d="M3 12h.01" /><path d="M3 18h.01" /></Svg>
)

export const MapIcon = (p: IconProps) => (
  <Svg {...p}><path d="M14.1 5.6 9.9 3.4a2 2 0 0 0-1.8 0L3.6 5.7A1 1 0 0 0 3 6.6v13.8a1 1 0 0 0 1.4.9l3.7-1.9a2 2 0 0 1 1.8 0l4.2 2.2a2 2 0 0 0 1.8 0l4.5-2.3a1 1 0 0 0 .6-.9V4.6a1 1 0 0 0-1.4-.9l-3.7 1.9a2 2 0 0 1-1.8 0Z" /><path d="M15 5.8v15" /><path d="M9 3.2v15" /></Svg>
)

export const TrophyIcon = (p: IconProps) => (
  <Svg {...p}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.7V17c0 .6-.5 1-1 1.2-1.2.5-2 2-2 3.8" /><path d="M14 14.7V17c0 .6.5 1 1 1.2 1.2.5 2 2 2 3.8" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></Svg>
)
