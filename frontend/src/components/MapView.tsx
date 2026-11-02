import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'
import { isPast, isSpecialRace, type RaceEvent } from '../lib/events'
import { ExternalIcon } from './Icons'

// Pure-CSS pins (styled in styles.css) so they follow the theme and selection state
function markerIcon(special: boolean, selected: boolean, past: boolean) {
    const cls = ['race-marker', special && 'is-special', selected && 'is-selected', past && 'is-past'].filter(Boolean).join(' ')
    return L.divIcon({
        className: 'race-marker-wrap',
        html: `<span class="${cls}"></span>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -4],
    })
}

const TILES = {
    light: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    dark: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
}

// Keep fitted markers clear of the floating panel (desktop) or header (mobile)
const PANEL_PADDING = 420

type Props = {
    events: RaceEvent[]
    selectedId?: string | null
    onSelect?: (id: string | null) => void
    isMobile?: boolean
    isDark?: boolean
}

export default function MapView({ events, selectedId = null, onSelect, isMobile = false, isDark = false }: Props) {
    const defaultCenter: [number, number] = [48.8566, 2.3522] // Europe center

    const bounds: [number, number][] = events
        .filter(e => e.lat && e.lon)
        .map(e => [e.lat!, e.lon!] as [number, number])
    // refs to marker instances by id
    const markerRefs = useRef<Record<string, L.Marker | null>>({})

    return (
        <MapContainer center={defaultCenter} zoom={4} zoomControl={false} worldCopyJump style={{ height: '100%', width: '100%' }}>
            <TileLayer
                key={isDark ? 'dark' : 'light'}
                attribution='Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors'
                url={isDark ? TILES.dark : TILES.light}
                maxZoom={16}
            />
            <ZoomControl position="bottomright" />
            {events.map(ev => ev.lat && ev.lon ? (
                <Marker
                    key={ev.id}
                    position={[ev.lat, ev.lon]}
                    icon={markerIcon(isSpecialRace(ev.name), selectedId === ev.id, isPast(ev))}
                    zIndexOffset={selectedId === ev.id ? 1000 : isSpecialRace(ev.name) ? 500 : 0}
                    ref={m => {
                        if (m) markerRefs.current[ev.id] = m as L.Marker
                        else markerRefs.current[ev.id] = null
                    }}
                    eventHandlers={{
                        click: () => onSelect && onSelect(ev.id),
                        // avoid opening popups on mobile; parent will show bottom card
                        popupopen: (e: L.LeafletEvent) => {
                            if (isMobile) {
                                try { (e.target as unknown as L.Marker).closePopup() } catch { void 0 }
                            } else {
                                if (onSelect) onSelect(ev.id)
                            }
                        },
                        // only clear selection when popup is closed on non-mobile
                        popupclose: () => {
                            if (isMobile) return
                            if (selectedId === ev.id) {
                                if (onSelect) onSelect(null)
                            }
                        }
                    }}
                >
                    <Popup className="map-popup" closeButton={false}>
                        {isSpecialRace(ev.name) && <div className="map-popup-eyebrow">Championship</div>}
                        <div className="map-popup-title">{ev.name}</div>
                        <div className="map-popup-meta">{ev.date}</div>
                        {ev.locationText && <div className="map-popup-meta">{ev.locationText}</div>}
                        {ev.link && (
                            <a className="map-popup-link" href={ev.link} target="_blank" rel="noopener noreferrer">
                                Event page <ExternalIcon />
                            </a>
                        )}
                    </Popup>
                </Marker>
            ) : null)}
            <FitBounds bounds={bounds} isMobile={isMobile} />
            <MapSelectionHandler markersRef={markerRefs} selectedId={selectedId} isMobile={isMobile} />
        </MapContainer>
    )
}

// MapContainer only reads `bounds` on mount, but events arrive asynchronously and
// change with the season filter, so refit whenever the set of coordinates changes.
function FitBounds({ bounds, isMobile }: { bounds: [number, number][], isMobile: boolean }) {
    const map = useMap()
    const key = JSON.stringify(bounds)
    useEffect(() => {
        const points = JSON.parse(key) as [number, number][]
        // container size may have changed after layout (sidebar, header)
        map.invalidateSize()
        if (!points.length) return
        map.fitBounds(points, {
            paddingTopLeft: isMobile ? [32, 110] : [PANEL_PADDING, 48],
            paddingBottomRight: [48, 48],
            maxZoom: 8,
        })
    }, [map, key, isMobile])
    return null
}

function MapSelectionHandler({ markersRef, selectedId, isMobile }: { markersRef: React.RefObject<Record<string, L.Marker | null>>, selectedId?: string | null, isMobile?: boolean }) {
    const map = useMap()
    useEffect(() => {
        if (!selectedId) return
        const marker = markersRef.current[selectedId]
        if (!marker) return

        // center map on marker and open popup (only on non-mobile)
        const latlng = marker.getLatLng()
        map.flyTo(latlng, Math.max(map.getZoom(), 8), { duration: 0.6 })
        if (!isMobile) {
            const maybe = marker as unknown as { openPopup?: () => void }
            maybe.openPopup?.()
        }
    }, [selectedId, markersRef, map, isMobile])
    return null
}
