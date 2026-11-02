import { useEffect, useRef } from 'react'
import { dateBadge, isPast, isSpecialRace, monthLabel, type RaceEvent } from '../lib/events'
import { ExternalIcon, PinIcon, PinOffIcon, TrophyIcon } from './Icons'

type Props = {
    events: RaceEvent[]
    onSelect: (id: string) => void
    selectedId?: string | null
    nextId?: string | null
    loading?: boolean
}

export default function EventList({ events, onSelect, selectedId = null, nextId = null, loading = false }: Props) {
    const itemRefs = useRef<Record<string, HTMLLIElement | null>>({})
    const orderKey = events.map(e => e.id).join()

    useEffect(() => {
        if (!selectedId) return
        // scroll so the item is comfortably visible
        itemRefs.current[selectedId]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, [selectedId])

    // Past races come first, so start the list at the next upcoming race instead
    useEffect(() => {
        if (selectedId || !nextId) return
        const el = itemRefs.current[nextId]
        const container = el?.closest('.panel-scroll')
        if (!el || !container) return
        const groupTitleHeight = 40
        container.scrollTop += el.getBoundingClientRect().top - container.getBoundingClientRect().top - groupTitleHeight
        // eslint-disable-next-line react-hooks/exhaustive-deps -- only on list changes, not on selection
    }, [orderKey, nextId])

    if (loading && !events.length) {
        return (
            <div className="event-skeletons" aria-busy="true" aria-label="Loading events">
                {Array.from({ length: 6 }, (_, i) => <div key={i} className="event-skeleton" />)}
            </div>
        )
    }

    if (!events.length) return <p className="empty-state">No events found.</p>

    // events arrive sorted by date, so consecutive runs share a month
    const groups: { label: string, events: RaceEvent[] }[] = []
    for (const ev of events) {
        const label = monthLabel(ev.date)
        const last = groups[groups.length - 1]
        if (last && last.label === label) last.events.push(ev)
        else groups.push({ label, events: [ev] })
    }

    return (
        <div className="event-groups">
            {groups.map(group => (
                <section key={group.label} className="event-group">
                    <h3 className="event-group-title">{group.label}</h3>
                    <ul className="event-list">
                        {group.events.map(ev => {
                            const special = isSpecialRace(ev.name)
                            const badge = dateBadge(ev.date)
                            const hasCoords = !!(ev.lat && ev.lon)
                            const cls = ['event',
                                special && 'is-special',
                                selectedId === ev.id && 'is-selected',
                                isPast(ev) && 'is-past',
                            ].filter(Boolean).join(' ')
                            return (
                                <li key={ev.id} ref={el => { itemRefs.current[ev.id] = el }} className={cls}>
                                    <button
                                        type="button"
                                        className="event-main"
                                        onClick={() => onSelect(ev.id)}
                                        aria-current={selectedId === ev.id ? 'true' : undefined}
                                    >
                                        <span className="date-tile" aria-hidden>
                                            {badge ? (
                                                <>
                                                    <span className="date-tile-month">{badge.month}</span>
                                                    <span className={`date-tile-day${badge.day.includes('–') ? ' is-range' : ''}`}>{badge.day}</span>
                                                </>
                                            ) : <span className="date-tile-month">TBC</span>}
                                        </span>
                                        <span className="event-body">
                                            {(special || ev.id === nextId) && (
                                                <span className="event-tags">
                                                    {ev.id === nextId && <span className="tag tag--next">Next up</span>}
                                                    {special && <span className="tag tag--special"><TrophyIcon />Championship</span>}
                                                </span>
                                            )}
                                            <span className="event-name">{ev.name}</span>
                                            <span className="event-sub">
                                                {hasCoords ? <PinIcon /> : <PinOffIcon />}
                                                <span>{ev.locationText || 'Location unknown'}</span>
                                                <span className="sr-only">, {ev.date}</span>
                                            </span>
                                        </span>
                                    </button>
                                    {ev.link && (
                                        <a
                                            className="icon-btn event-link"
                                            href={ev.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title="Open event page"
                                            aria-label={`Open event page for ${ev.name}`}
                                        >
                                            <ExternalIcon />
                                        </a>
                                    )}
                                </li>
                            )
                        })}
                    </ul>
                </section>
            ))}
        </div>
    )
}
