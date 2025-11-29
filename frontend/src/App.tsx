import { useEffect, useState } from 'react'
import MapView from './components/MapView'
import EventList from './components/EventList'

export type RaceEvent = {
  id: string
  name: string
  date: string
  locationText?: string
  link?: string
  lat?: number
  lon?: number
}

function App() {
  const [events, setEvents] = useState<RaceEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [year, setYear] = useState<string>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState<boolean>(false)
  const [listOpen, setListOpen] = useState<boolean>(false)

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true)
      try {
        const staticRes = await fetch(`${import.meta.env.BASE_URL}calendar.json`)
        if (!staticRes.ok) throw new Error('calendar.json not found')
        const data = await staticRes.json()
        const list = data && Array.isArray(data.events) ? data.events : []
        setEvents(list)
      } catch (e) {
        console.error('Failed to load calendar.json:', e)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  function extractYear(dateStr: string): string | null {
    if (!dateStr) return null

    // If it contains a range like "10 Oct 2026 - 11 Oct 2026", take the first or last parsable year.
    const parts = dateStr.split(/[-–—]/).map(p => p.trim()).filter(Boolean)

    for (const part of parts) {
      // Try ISO / regular Date parse first
      const d = new Date(part)
      if (!isNaN(d.getTime())) return d.getFullYear().toString()

      // Try to parse formats like '10 Oct 2026' using a temporary parse by adding a time
      const tryParse = Date.parse(part)
      if (!isNaN(tryParse)) return new Date(tryParse).getFullYear().toString()
    }

    // Fallback: look for a 4-digit year in the string
    const m = dateStr.match(/(20\d{2}|19\d{2})/)
    return m ? m[0] : null
  }

  // Parse a representative Date from various date strings.
  // For ranges like "10 Oct 2026 - 11 Oct 2026" this returns the first valid date.
  function parseRepresentativeDate(dateStr: string): Date | null {
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

  // When events load, preselect the year that contains the next upcoming race (if any)
  useEffect(() => {
    if (!events.length) return
    const now = new Date()
    const upcoming = events
      .map(e => ({ e, d: parseRepresentativeDate(e.date) }))
      .filter(x => x.d && x.d.getTime() >= now.getTime())
      .sort((a, b) => (a.d!.getTime() - b.d!.getTime()))

    if (upcoming.length) {
      const y = upcoming[0].d!.getFullYear().toString()
      setYear(y)
    }
  }, [events])

  const years = Array.from(new Set(events.map(e => extractYear(e.date)).filter(Boolean) as string[])).sort((a, b) => Number(b) - Number(a))

  const filteredEvents = year === 'all' ? events : events.filter(e => {
    const y = extractYear(e.date)
    return y === year
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(max-width: 720px)')
    const onChange = (ev: MediaQueryListEvent) => setIsMobile(ev.matches)
    setIsMobile(mq.matches)
    if (mq.addEventListener) mq.addEventListener('change', onChange)
    else mq.addListener(onChange)
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange)
      else mq.removeListener(onChange)
    }
  }, [])

  return (
    <div className="app-root">
      <button className="mobile-menu-btn" aria-label="Open events" onClick={() => setListOpen(true)}>☰</button>

      <aside className="sidebar">
        <h2>UCI Gravel Worlds Calendar</h2>
        {loading && <p>Loading events…</p>}
        <div className="year-select">
          <label htmlFor="year">Year: </label>
          <select id="year" value={year} onChange={e => setYear(e.target.value)}>
            <option value="all">All</option>
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <EventList events={filteredEvents} onSelect={id => setSelectedId(id)} selectedId={selectedId} />
      </aside>
      <main className="map-area">
        <MapView events={filteredEvents} selectedId={selectedId} onSelect={id => setSelectedId(id)} isMobile={isMobile} />
      </main>

      {isMobile && listOpen && (
        <EventList
          events={filteredEvents}
          selectedId={selectedId}
          onSelect={id => {
            setSelectedId(id)
            setListOpen(false)
          }}
          // @ts-ignore - pass custom props for modal behavior
          fullscreen
          // @ts-ignore
          onClose={() => setListOpen(false)}
        />
      )}

      {isMobile && selectedId && (() => {
        const ev = events.find(e => e.id === selectedId)
        if (!ev) return null
        return (
          <div className="selected-event-card card">
            <div className="flex-between">
              <div>
                <div className="event-name">{ev.name}</div>
                <div className="event-date muted">{ev.date}</div>
                {ev.locationText && <div className="event-location muted">{ev.locationText}</div>}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {ev.link && <a className="event-link-icon" href={ev.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>🔗</a>}
                <button className="btn-close" onClick={() => setSelectedId(null)} aria-label="Close">✕</button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

export default App
