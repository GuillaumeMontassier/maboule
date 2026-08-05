import "leaflet/dist/leaflet.css";
import "../leaflet-icon-fix";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import type { BoulodromesFeatureCollection } from "../api/boulodromes";

const PARIS_CENTER: [number, number] = [48.8566, 2.3522];

interface BoulodromesMapProps {
  features: BoulodromesFeatureCollection;
}

export function BoulodromesMap({ features }: BoulodromesMapProps) {
  return (
    <MapContainer center={PARIS_CENTER} zoom={12} className="map">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {features.features.map((feature) => {
        // GeoJSON = [longitude, latitude], Leaflet = [latitude, longitude].
        const [longitude, latitude] = feature.geometry.coordinates;
        return (
          <Marker key={feature.properties.id} position={[latitude, longitude]}>
            <Popup>
              <strong>{feature.properties.name}</strong>
              {feature.properties.siteName && feature.properties.siteName !== feature.properties.name && (
                <>
                  <br />
                  {feature.properties.siteName}
                </>
              )}
              <br />
              {feature.properties.street}, {feature.properties.postalCode}{" "}
              {feature.properties.city}
              {(feature.properties.equipmentType || feature.properties.groundType) && (
                <>
                  <br />
                  {[feature.properties.equipmentType, feature.properties.groundType]
                    .filter(Boolean)
                    .join(" · ")}
                </>
              )}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
