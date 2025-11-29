import type { RaceEvent } from '../App'

const SPECIAL_RACES = [
    'UEC European Gravel Championships',
    'UCI Gravel World Championships',
]

function isSpecialRace(name?: string) {
    if (!name) return false
    return SPECIAL_RACES.some(s => name.includes(s))
}

export default function EventList({ events }: { events: RaceEvent[] }) {
    if (!events.length) return <p>No events found.</p>
    return (
        <ul className="event-list">
            {events.map(ev => {
                const special = isSpecialRace(ev.name)
                return (
                    <li key={ev.id} className={"event-item" + (special ? ' event-item--special' : '')}>
                        <div className="flex-between">
                            <div>
                                <div className="event-name">{ev.name}</div>
                                <div className="event-date muted">{ev.date}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {special && <div className="badge accent">Championship</div>}
                                {ev.link && (
                                    <a className="event-link-icon" href={ev.link} target="_blank" rel="noopener noreferrer" title="Open event page">
                                        🔗
                                    </a>
                                )}
                            </div>
                        </div>
                        <div className="event-location muted">{ev.locationText || (ev.lat && ev.lon ? `${ev.lat.toFixed(3)}, ${ev.lon.toFixed(3)}` : '')}</div>
                    </li>
                )
            })}
        </ul>
    )
}
