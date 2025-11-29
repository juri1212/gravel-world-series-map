import type { RaceEvent } from '../App'
import { useEffect, useRef } from 'react'

const SPECIAL_RACES = [
    'UEC European Gravel Championships',
    'UCI Gravel World Championships',
]

function isSpecialRace(name?: string) {
    if (!name) return false
    return SPECIAL_RACES.some(s => name.includes(s))
}

type Props = {
    events: RaceEvent[]
    onSelect?: (id: string) => void
    selectedId?: string | null
    fullscreen?: boolean
    years?: string[]
    year?: string
    onYearChange?: (year: string) => void
}

export default function EventList({ events, onSelect, selectedId = null, fullscreen, years, year, onYearChange }: Props) {
    const listRef = useRef<HTMLUListElement | null>(null)
    const itemRefs = useRef<Record<string, HTMLLIElement | null>>({})

    useEffect(() => {
        if (!selectedId) return
        const el = itemRefs.current[selectedId]
        if (el && listRef.current) {
            // scroll so the item is comfortably visible
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
    }, [selectedId])

    if (!events.length) return <p>No events found.</p>
    const list = (
        <ul className="event-list" ref={listRef}>
            {events.map(ev => {
                const special = isSpecialRace(ev.name)
                const cls = "event-item" + (special ? ' event-item--special' : '') + (selectedId === ev.id ? ' event-item--selected' : '')
                return (
                    <li
                        key={ev.id}
                        ref={el => { itemRefs.current[ev.id] = el }}
                        className={cls + (onSelect ? ' event-item--clickable' : '')}
                        onClick={() => onSelect && onSelect(ev.id)}
                        role={onSelect ? 'button' : undefined}
                        tabIndex={onSelect ? 0 : undefined}
                        onKeyDown={e => {
                            if (!onSelect) return
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                onSelect(ev.id)
                            }
                        }}
                    >
                        <div className="flex-between">
                            <div>
                                <div className="event-name">{ev.name}</div>
                                <div className="event-date muted">{ev.date}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {special && <div className="badge accent">Championship</div>}
                                {ev.link && (
                                    <a
                                        className="event-link-icon"
                                        href={ev.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Open event page"
                                        onClick={e => e.stopPropagation()}
                                        onKeyDown={e => e.stopPropagation()}
                                    >
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

    if (fullscreen) {
        return (
            <div className="event-list-modal">
                <div className="event-list-modal-header">
                    {years && onYearChange && (
                        <div className="year-select">
                            <label htmlFor="year-mobile">Year: </label>
                            <select id="year-mobile" value={year} onChange={e => onYearChange(e.target.value)}>
                                <option value="all">All</option>
                                {years.map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
                <div className="event-list-modal-body">
                    {list}
                </div>
            </div>
        )
    }
    return list
}
