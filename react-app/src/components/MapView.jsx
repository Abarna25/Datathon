import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom Icon generator based on node type
const getCustomIcon = (type, color) => {
    return new L.DivIcon({
        className: 'custom-leaflet-icon',
        html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px ${color}80;"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
    });
};

const NODE_STYLE = {
    case: { color: '#2563EB', icon: '📁', label: 'CASE' }, 
    suspect: { color: '#DC2626', icon: '🛑', label: 'SUSPECT' }, 
    victim: { color: '#16A34A', icon: '👤', label: 'VICTIM' }, 
    witness: { color: '#EA580C', icon: '👁️', label: 'WITNESS' }, 
    officer: { color: '#4F46E5', icon: '👮', label: 'OFFICER' }, 
    police: { color: '#4F46E5', icon: '👮', label: 'OFFICER' },
    evidence: { color: '#9333EA', icon: '🧬', label: 'EVIDENCE' }, 
    vehicle: { color: '#EAB308', icon: '🚗', label: 'VEHICLE' }, 
    phone: { color: '#06b6d4', icon: '📱', label: 'PHONE' },
    location: { color: '#92400e', icon: '📍', label: 'LOCATION' }, 
    court: { color: '#4f46e5', icon: '🏛️', label: 'COURT' },
    analytical: { color: '#475569', icon: '🧠', label: 'AI ANALYSIS' },
    default: { color: '#64748b', icon: '❓', label: 'ENTITY' }
};

// Component to auto-fit bounds
const AutoFitBounds = ({ nodes }) => {
    const map = useMap();
    useEffect(() => {
        if (nodes.length > 0) {
            const validNodes = nodes.filter(n => n.lat && n.lng);
            if (validNodes.length > 0) {
                const bounds = L.latLngBounds(validNodes.map(n => [n.lat, n.lng]));
                map.fitBounds(bounds, { padding: [50, 50] });
            }
        }
    }, [nodes, map]);
    return null;
};

const MapView = ({ nodes, onNodeSelect }) => {
    // Generate dummy coordinates if real ones are missing for demo purposes
    const mapNodes = nodes.map((node, i) => {
        // Base center (Mysore area for example)
        const baseLat = 12.2958;
        const baseLng = 76.6394;
        
        // Use real lat/lng if present, otherwise scatter them around
        const lat = node.lat || baseLat + (Math.random() - 0.5) * 0.1;
        const lng = node.lng || baseLng + (Math.random() - 0.5) * 0.1;
        
        return { ...node, lat, lng };
    });

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', borderRadius: '16px', overflow: 'hidden', zIndex: 1, animation: 'fadeIn 0.5s ease-out' }}>
            <MapContainer 
                center={[12.2958, 76.6394]} 
                zoom={12} 
                style={{ width: '100%', height: '100%' }}
                zoomControl={false}
            >
                <style>{`
                    .dark-map-tiles {
                        filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(85%);
                    }
                `}</style>
                {/* Standard OpenStreetMap with CSS Invert for an excellent, highly visible Dark Mode */}
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    className="dark-map-tiles"
                />
                
                <AutoFitBounds nodes={mapNodes} />

                {mapNodes.map((node) => {
                    const style = NODE_STYLE[node.type] || NODE_STYLE.default;
                    return (
                        <Marker 
                            key={node.id} 
                            position={[node.lat, node.lng]}
                            icon={getCustomIcon(node.type, style.color)}
                            eventHandlers={{
                                click: () => {
                                    if (onNodeSelect) onNodeSelect(node);
                                }
                            }}
                        >
                            <Popup>
                                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#0F172A' }}>{node.label}</div>
                                <div style={{ fontSize: '11px', color: style.color, textTransform: 'uppercase', marginTop: '2px', fontWeight: 'bold' }}>{style.label}</div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
};

export default MapView;
