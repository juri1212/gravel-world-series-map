import { useEffect, useState } from 'react'
import MapView from './components/MapView'
import EventList from './components/EventList'

export type RaceEvent = {
  id: string
  name: string
  date: string
  locationText?: string
  lat?: number
  lon?: number
}

function App() {
  const [events, setEvents] = useState<RaceEvent[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true)
      try {
        const staticRes = await fetch('/calendar.json')
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

  return (
    <div className="app-root">
      <aside className="sidebar">
        <h2>UCI Gravel Worlds Calendar</h2>
        {loading && <p>Loading events…</p>}
        <EventList events={events} />
      </aside>
      <main className="map-area">
        <MapView events={events} />
      </main>
    </div>
  )
}

export default App
