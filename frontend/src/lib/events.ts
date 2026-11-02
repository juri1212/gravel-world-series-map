export type RaceEvent = {
  id: string
  name: string
  date: string
  season?: string
  locationText?: string
  link?: string
  lat?: number
  lon?: number
}

const SPECIAL_RACES = [
  'UEC European Gravel Championships',
  'UCI Gravel World Championships',
]

export function isSpecialRace(name?: string) {
  if (!name) return false
  return SPECIAL_RACES.some(s => name.includes(s))
}

// Parse a representative Date from various date strings.
// For ranges like "10 Oct 2026 - 11 Oct 2026" this returns the first valid date.
export function parseRepresentativeDate(dateStr: string): Date | null {
  if (!dateStr) return null
  const parts = dateStr.split(/[-–—]/).map(p => p.trim()).filter(Boolean)

  for (const part of parts) {
    const d = new Date(part)
    if (!isNaN(d.getTime())) return d

    const parsed = Date.parse(part)
    if (!isNaN(parsed)) return new Date(parsed)
  }

  // Fallback: try to extract a 4-digit year and return Jan 1 of that year
  const m = dateStr.match(/(20\d{2}|19\d{2})/)
  if (m) return new Date(Number(m[0]), 0, 1)
  return null
}

// Chronological order; undated events (e.g. "Postponed") go last.
// The source lists seasons newest-first, so "All" would otherwise jump backwards in time.
export function sortByDate(events: RaceEvent[]): RaceEvent[] {
  const time = (ev: RaceEvent) => parseRepresentativeDate(ev.date)?.getTime() ?? Number.MAX_SAFE_INTEGER
  return [...events].sort((a, b) => time(a) - time(b))
}

// Last day of the event, so multi-day races still count as upcoming while they run
function parseEndDate(dateStr: string): Date | null {
  const matches = [...dateStr.matchAll(/(\d{1,2}) ([A-Za-z]{3}) (\d{4})/g)]
  if (!matches.length) return null
  const [, d, mon, y] = matches[matches.length - 1]
  const end = new Date(`${d} ${mon} ${y}`)
  if (isNaN(end.getTime())) return null
  end.setHours(23, 59, 59)
  return end
}

export function isPast(ev: RaceEvent, now = new Date()) {
  const end = parseEndDate(ev.date)
  return !!end && end.getTime() < now.getTime()
}

// Events are grouped by UCI season (e.g. Oct 2026 races qualify for the 2027 season)
export function seasonOf(ev: RaceEvent): string | null {
  if (ev.season) return ev.season
  const m = ev.date.match(/(20\d{2}|19\d{2})/)
  return m ? m[0] : null
}

export type DateBadge = { day: string, month: string, weekday?: string } | null

// Compact calendar-tile parts, e.g. "Saturday 05 Sep 2026 - 06 Sep 2026" -> { day: '5–6', month: 'Sep' }
export function dateBadge(dateStr: string): DateBadge {
  const matches = [...dateStr.matchAll(/(\d{1,2}) ([A-Za-z]{3}) (\d{4})/g)]
  if (!matches.length) return null
  const first = matches[0]
  const last = matches[matches.length - 1]
  const weekday = dateStr.match(/^([A-Za-z]{3})[a-z]*day\b/)?.[1]
  const day = String(Number(first[1]))
  if (matches.length > 1 && last[1] !== first[1]) {
    const month = first[2] === last[2] ? first[2] : `${first[2]}–${last[2]}`
    return { day: `${day}–${Number(last[1])}`, month, weekday }
  }
  return { day, month: first[2], weekday }
}

// Section heading for the list, e.g. "October 2026"; undated events fall into "Date to be confirmed"
export function monthLabel(dateStr: string): string {
  const m = dateStr.match(/\d{1,2} ([A-Za-z]{3}) (\d{4})/)
  if (!m) return 'Date to be confirmed'
  const d = new Date(`1 ${m[1]} ${m[2]}`)
  if (isNaN(d.getTime())) return 'Date to be confirmed'
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}
