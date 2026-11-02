import { useEffect, useState } from 'react'
import MapView from './components/MapView'
import EventList from './components/EventList'
import Header from './components/Header'
import { CloseIcon, ExternalIcon, PinIcon, TrophyIcon } from './components/Icons'
import { isPast, isSpecialRace, parseRepresentativeDate, seasonOf, sortByDate, type RaceEvent } from './lib/events'
import { useMediaQuery } from './lib/useMediaQuery'

function App() {
  const [events, setEvents] = useState<RaceEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState<string>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [listOpen, setListOpen] = useState<boolean>(false)
  const isMobile = useMediaQuery('(max-width: 720px)')
  const isDark = useMediaQuery('(prefers-color-scheme: dark)')

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true)
      try {
        // revalidate on every load; the data changes daily and stale copies lack newer fields
        const staticRes = await fetch(`${import.meta.env.BASE_URL}calendar.json`, { cache: 'no-cache' })
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

  const upcoming = events
    .map(e => ({ e, d: parseRepresentativeDate(e.date) }))
    .filter(x => x.d && !isPast(x.e))
    .sort((a, b) => (a.d!.getTime() - b.d!.getTime()))
  const nextId = upcoming.length ? upcoming[0].e.id : null

  // When events load, preselect the season that contains the next upcoming race (if any)
  useEffect(() => {
    const next = events.find(e => e.id === nextId)
    const y = next && seasonOf(next)
    if (y) setYear(y)
  }, [events, nextId])

  const years = Array.from(new Set(events.map(seasonOf).filter(Boolean) as string[])).sort((a, b) => Number(b) - Number(a))

  const filteredEvents = sortByDate(year === 'all' ? events : events.filter(e => seasonOf(e) === year))
  const upcomingCount = filteredEvents.filter(e => !isPast(e)).length

  const selected = selectedId ? events.find(e => e.id === selectedId) : undefined

  return (
    <div className="app">
      <main className="map-layer">
        <MapView events={filteredEvents} selectedId={selectedId} onSelect={setSelectedId} isMobile={isMobile} isDark={isDark} />
      </main>

      <aside className={`panel${listOpen ? ' is-open' : ''}`}>
        <Header menuOpen={listOpen} onToggleMenu={() => setListOpen(v => !v)} />

        {/* mounted only while visible on mobile, so the list can scroll to the next race when opened */}
        {(!isMobile || listOpen) && <div className="panel-body">
          <div className="panel-controls">
            <div className="segmented" role="group" aria-label="Season">
              {['all', ...years].map(y => (
                <button
                  key={y}
                  type="button"
                  className="segmented-option"
                  aria-pressed={year === y}
                  onClick={() => setYear(y)}
                >
                  {y === 'all' ? 'All' : `Season ${y}`}
                </button>
              ))}
            </div>
            {!loading && (
              <p className="panel-summary">
                <strong>{filteredEvents.length}</strong> races
                <span className="dot-sep" aria-hidden>·</span>
                <strong>{upcomingCount}</strong> upcoming
              </p>
            )}
          </div>

          <div className="panel-scroll">
            <EventList
              events={filteredEvents}
              loading={loading}
              selectedId={selectedId}
              nextId={nextId}
              onSelect={id => {
                setSelectedId(id)
                setListOpen(false)
              }}
            />
          </div>
        </div>}
      </aside>

      {isMobile && !listOpen && selected && (
        <div className={`selected-card${isSpecialRace(selected.name) ? ' is-special' : ''}`} role="dialog" aria-label={selected.name}>
          <div className="selected-card-body">
            {isSpecialRace(selected.name) && <span className="tag tag--special"><TrophyIcon />Championship</span>}
            <div className="selected-card-name">{selected.name}</div>
            <div className="selected-card-date">{selected.date}</div>
            {selected.locationText && <div className="event-sub"><PinIcon /><span>{selected.locationText}</span></div>}
          </div>
          <div className="selected-card-actions">
            <button type="button" className="icon-btn" onClick={() => setSelectedId(null)} aria-label="Close">
              <CloseIcon />
            </button>
            {selected.link && (
              <a className="btn-primary" href={selected.link} target="_blank" rel="noopener noreferrer">
                Event page <ExternalIcon />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
