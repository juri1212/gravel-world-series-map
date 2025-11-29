import type { RaceEvent } from '../App'

export default function EventList({ events }: { events: RaceEvent[] }) {
    if (!events.length) return <p>No events found.</p>

    return (
        <ul className="event-list">
            {events.map(ev => (
                <li key={ev.id} className="event-item">
                    <div className="event-name">{ev.name}</div>
                    <div className="event-date">{ev.date}</div>
                    <div className="event-location">{ev.locationText || (ev.lat && ev.lon ? `${ev.lat.toFixed(3)}, ${ev.lon.toFixed(3)}` : '')}</div>
                </li>
            ))}
        </ul>
    )
}
