import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const mockMapData = [
  { id: 1, lat: 24.7136, lng: 46.6753, title: 'مشروع تطوير وسط المدينة', category: 'تجاري', desc: 'تطوير البنية التحتية للمنطقة المركزية.' },
  { id: 2, lat: 24.7236, lng: 46.6853, title: 'الحديقة الكبرى', category: 'ترفيهي', desc: 'إنشاء حديقة عامة بمساحة 500 فدان.' },
];

const MapComponent = () => {
  return (
    <div style={{ height: '500px', width: '100%', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}>
      <MapContainer center={[24.7136, 46.6753]} zoom={12} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {mockMapData.map(marker => (
          <Marker key={marker.id} position={[marker.lat, marker.lng]}>
            <Popup>
              <div className="text-end">
                <h6 className="text-primary mb-1 fw-bold">{marker.title}</h6>
                <span className="badge bg-warning text-dark mb-2">{marker.category}</span>
                <p className="mb-0 small">{marker.desc}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapComponent;
