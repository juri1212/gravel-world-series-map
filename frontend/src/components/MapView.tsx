import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { RaceEvent } from '../App'
import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'

type IconDefaultPrototype = { _getIconUrl?: () => string | undefined }
delete (L.Icon.Default.prototype as unknown as IconDefaultPrototype)._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const SPECIAL_RACES = [
    'UEC European Gravel Championships',
    'UCI Gravel World Championships',
]

function isSpecialRace(name?: string) {
    if (!name) return false
    return SPECIAL_RACES.some(s => name.includes(s))
}

// Custom SVG marker generators (small modern marker)
function svgDataUrl(circleColor: string, strokeColor = 'rgba(0,0,0,0.15)') {
    const svg = encodeURIComponent(`
            <svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'>
                <defs>
                    <filter id='f' x='-50%' y='-50%' width='200%' height='200%'>
                        <feDropShadow dx='0' dy='2' stdDeviation='2' flood-color='${strokeColor}' flood-opacity='0.6'/>
                    </filter>
                </defs>
                <circle cx='14' cy='10' r='7' fill='${circleColor}' stroke='rgba(255,255,255,0.06)' stroke-width='1' filter='url(#f)' />
            </svg>
        `)
    return `data:image/svg+xml;charset=UTF-8,${svg}`
}

const defaultIcon = new L.Icon({
    iconUrl: svgDataUrl('#7c5cff'),
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -12],
    className: 'custom-marker-default'
})

const specialIcon = new L.Icon({
    iconUrl: svgDataUrl('#00d4a2'),
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -12],
    className: 'custom-marker-special'
})

type Props = {
    events: RaceEvent[]
    selectedId?: string | null
    onSelect?: (id: string | null) => void
    isMobile?: boolean
}

export default function MapView({ events, selectedId = null, onSelect, isMobile = false }: Props) {
    const defaultCenter: [number, number] = [48.8566, 2.3522] // Europe center

    const bounds: [number, number][] = events
        .filter(e => e.lat && e.lon)
        .map(e => [e.lat!, e.lon!] as [number, number])
    // refs to marker instances by id
    const markerRefs = useRef<Record<string, L.Marker | null>>({})

    return (
        <div className="card map-card">
            <div className="map-header flex-between">
                <div className="map-title">
                    <strong>Race Map</strong>
                </div>
            </div>
            <div className="map-body">
                <MapContainer center={defaultCenter} zoom={4} style={{ height: '100%', width: '100%' }} bounds={bounds.length ? bounds as L.LatLngBoundsExpression : undefined}>
                    <TileLayer
                        attribution='&copy; <a href="https://carto.com/attributions">Carto</a> &mdash; © OpenStreetMap contributors'
                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    />
                    {events.map(ev => ev.lat && ev.lon ? (
                        <Marker
                            key={ev.id}
                            position={[ev.lat, ev.lon]}
                            icon={isSpecialRace(ev.name) ? specialIcon : defaultIcon}
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
                                        onSelect && onSelect(ev.id)
                                    }
                                },
                                // only clear selection when popup is closed on non-mobile
                                popupclose: () => {
                                    if (isMobile) return
                                    if (selectedId === ev.id) {
                                        onSelect && onSelect(null)
                                    }
                                }
                            }}
                        >
                            <Popup className="map-popup">
                                <strong className={isSpecialRace(ev.name) ? 'popup-special' : ''}>{ev.name}</strong>
                                <div className="muted">{ev.date}</div>
                                {ev.locationText && <div className="muted">{ev.locationText}</div>}
                            </Popup>
                        </Marker>
                    ) : null)}
                    <MapSelectionHandler markersRef={markerRefs} selectedId={selectedId} isMobile={isMobile} />
                </MapContainer>
            </div>
        </div>
    )
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
