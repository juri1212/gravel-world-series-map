import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { RaceEvent } from '../App'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export default function MapView({ events }: { events: RaceEvent[] }) {
    const defaultCenter: [number, number] = [48.8566, 2.3522] // Europe center

    const bounds = events.filter(e => e.lat && e.lon).map(e => [e.lat!, e.lon!] as [number, number])

    return (
        <MapContainer center={defaultCenter} zoom={4} style={{ height: '100%', width: '100%' }} bounds={bounds.length ? bounds as any : undefined}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {events.map(ev => ev.lat && ev.lon ? (
                <Marker key={ev.id} position={[ev.lat, ev.lon]}>
                    <Popup>
                        <strong>{ev.name}</strong>
                        <div>{ev.date}</div>
                        {ev.locationText && <div>{ev.locationText}</div>}
                    </Popup>
                </Marker>
            ) : null)}
        </MapContainer>
    )
}
