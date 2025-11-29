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

const specialIcon = new L.Icon({
    // orange marker from pointhi/leaflet-color-markers
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
})

const defaultIcon = new L.Icon.Default()

export default function MapView({ events }: { events: RaceEvent[] }) {
    const defaultCenter: [number, number] = [48.8566, 2.3522] // Europe center

    const bounds: [number, number][] = events
        .filter(e => e.lat && e.lon)
        .map(e => [e.lat!, e.lon!] as [number, number])

    return (
        <MapContainer center={defaultCenter} zoom={4} style={{ height: '100%', width: '100%' }} bounds={bounds.length ? bounds as L.LatLngBoundsExpression : undefined}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {events.map(ev => ev.lat && ev.lon ? (
                <Marker key={ev.id} position={[ev.lat, ev.lon]} icon={isSpecialRace(ev.name) ? specialIcon : defaultIcon}>
                    <Popup>
                        <strong className={isSpecialRace(ev.name) ? 'popup-special' : ''}>{ev.name}</strong>
                        <div>{ev.date}</div>
                        {ev.locationText && <div>{ev.locationText}</div>}
                    </Popup>
                </Marker>
            ) : null)}
        </MapContainer>
    )
}
