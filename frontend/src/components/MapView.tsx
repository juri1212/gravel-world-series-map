import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { RaceEvent } from '../App'

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

export default function MapView({ events }: { events: RaceEvent[] }) {
    const defaultCenter: [number, number] = [48.8566, 2.3522] // Europe center

    const bounds: [number, number][] = events
        .filter(e => e.lat && e.lon)
        .map(e => [e.lat!, e.lon!] as [number, number])

    return (
        <div className="card map-card" style={{ height: '100%' }}>
            <div className="map-header flex-between">
                <div className="map-title">
                    <strong>Race Map</strong>
                    <div className="muted">Interactive map of events</div>
                </div>
            </div>
            <div style={{ height: 'calc(100% - 56px)' }}>
                <MapContainer center={defaultCenter} zoom={4} style={{ height: '100%', width: '100%' }} bounds={bounds.length ? bounds as L.LatLngBoundsExpression : undefined}>
                    <TileLayer
                        attribution='&copy; <a href="https://carto.com/attributions">Carto</a> &mdash; © OpenStreetMap contributors'
                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    />
                    {events.map(ev => ev.lat && ev.lon ? (
                        <Marker key={ev.id} position={[ev.lat, ev.lon]} icon={isSpecialRace(ev.name) ? specialIcon : defaultIcon}>
                            <Popup className="map-popup">
                                <strong className={isSpecialRace(ev.name) ? 'popup-special' : ''}>{ev.name}</strong>
                                <div className="muted">{ev.date}</div>
                                {ev.locationText && <div className="muted">{ev.locationText}</div>}
                            </Popup>
                        </Marker>
                    ) : null)}
                </MapContainer>
            </div>
        </div>
    )
}
