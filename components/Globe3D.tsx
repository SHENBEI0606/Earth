import React, { useEffect, useRef, useState, useCallback } from 'react';
import Globe, { GlobeMethods } from 'react-globe.gl';
import { GameTarget, GeoJsonFeature } from '../types';
import { COLOR_LAND_UNFOUND, COLOR_LAND_HOVER, GEOJSON_URL, COLOR_BORDER } from '../constants';

interface Globe3DProps {
  targets: GameTarget[];
  placedTargets: string[];
  activeHint: GameTarget | null;
  onPieceDrop: (pieceId: string, lat: number, lng: number, hitFeature: GeoJsonFeature | null) => void;
}

// Helper: Point in Polygon (Ray Casting)
const isPointInPolygon = (point: [number, number], vs: [number, number][]) => {
  // point = [lng, lat]
  const x = point[0], y = point[1];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0], yi = vs[i][1];
    const xj = vs[j][0], yj = vs[j][1];
    const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

// Check if point matches a GeoJSON feature geometry
const checkFeatureIntersection = (lat: number, lng: number, feature: GeoJsonFeature) => {
  const { geometry } = feature;
  if (!geometry) return false;

  const point: [number, number] = [lng, lat]; // GeoJSON is [lng, lat]

  if (geometry.type === 'Polygon') {
    return isPointInPolygon(point, geometry.coordinates[0]);
  } else if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.some((polygon: any[]) => isPointInPolygon(point, polygon[0]));
  }
  return false;
};

const Globe3D: React.FC<Globe3DProps> = ({ 
  targets, 
  placedTargets,
  activeHint,
  onPieceDrop
}) => {
  const globeEl = useRef<GlobeMethods | undefined>(undefined);
  const [countries, setCountries] = useState<any>({ features: [] });
  const [hoverFeature, setHoverFeature] = useState<GeoJsonFeature | null>(null);

  useEffect(() => {
    fetch(GEOJSON_URL)
      .then(res => res.json())
      .then(data => {
        setCountries(data);
      })
      .catch(err => console.error("Failed to load map data", err));
  }, []);

  useEffect(() => {
    // Initial auto-rotate
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.3;
      const controls = globeEl.current.controls();
      controls.addEventListener('start', () => {
        controls.autoRotate = false;
      });
    }
  }, []);

  // Handle Hint Camera Rotation
  useEffect(() => {
    if (activeHint && globeEl.current && activeHint.lat !== undefined && activeHint.lng !== undefined) {
      globeEl.current.pointOfView({
        lat: activeHint.lat,
        lng: activeHint.lng,
        altitude: 2.0 // Zoom out a bit to see the whole area
      }, 1000); // 1 second animation
    }
  }, [activeHint]);

  // Visuals
  const getPolygonColor = useCallback((feature: GeoJsonFeature) => {
    const continentName = feature.properties.CONTINENT;
    // Check if this continent is placed
    const target = targets.find(t => t.type === 'CONTINENT' && t.matchKeys?.includes(continentName || ''));
    
    // Hint Highlighting
    if (activeHint && activeHint.type === 'CONTINENT' && activeHint.matchKeys?.includes(continentName || '')) {
      return '#fde047'; // Bright yellow for hint
    }

    if (target && placedTargets.includes(target.id)) {
      return target.color || '#10b981';
    }
    
    if (feature === hoverFeature) return COLOR_LAND_HOVER;
    return COLOR_LAND_UNFOUND;
  }, [targets, placedTargets, hoverFeature, activeHint]);

  // Labels for found items
  const getLabelsData = useCallback(() => {
    // 1. Continent Labels (Use a central point or first feature centroid approximation)
    const foundContinents = targets
      .filter(t => t.type === 'CONTINENT' && placedTargets.includes(t.id))
      .map(t => {
        return null; // Labels for continents handled by polygon interaction or could be added here
      }).filter(Boolean);

    // 2. Ocean Labels
    const foundOceans = targets
      .filter(t => t.type === 'OCEAN' && placedTargets.includes(t.id))
      .map(t => ({
        lat: t.lat,
        lng: t.lng,
        text: t.name,
        color: 'white'
      }));

    return [...foundContinents, ...foundOceans] as any[];
  }, [targets, placedTargets, countries]);

  // Rings for hint
  const getRingsData = useCallback(() => {
    if (!activeHint || activeHint.lat === undefined || activeHint.lng === undefined) return [];
    return [{
      lat: activeHint.lat,
      lng: activeHint.lng,
      color: 'white',
      maxRadius: 15,
      propagationSpeed: 5,
      repeatPeriod: 800
    }];
  }, [activeHint]);

  // Handle Drop Event on the Container
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Allow drop
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const pieceId = e.dataTransfer.getData('text/plain');
    if (!pieceId || !globeEl.current) return;

    // Convert Screen Coords to Globe Coords
    const { clientX, clientY } = e;
    const coords = globeEl.current.toGlobeCoords(clientX, clientY);
    
    if (!coords) return; // Drop off-globe

    const { lat, lng } = coords;

    // Determine if we hit a polygon (Continent detection)
    let hitFeature: GeoJsonFeature | null = null;
    
    for (const feature of countries.features) {
       // Only check features that map to a continent we care about
       if (feature.properties.CONTINENT && feature.properties.CONTINENT !== 'Seven seas (open ocean)') {
          if (checkFeatureIntersection(lat, lng, feature)) {
             hitFeature = feature;
             break;
          }
       }
    }

    onPieceDrop(pieceId, lat, lng, hitFeature);
  };

  return (
    <div 
      className="w-full h-full cursor-move"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <Globe
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        polygonsData={countries.features.filter((d: any) => d.properties.CONTINENT !== 'Seven seas (open ocean)')}
        polygonAltitude={0.01}
        polygonCapColor={getPolygonColor}
        polygonSideColor={() => 'rgba(0, 0, 0, 0.3)'}
        polygonStrokeColor={() => COLOR_BORDER}
        polygonLabel={({ properties }: any) => `
          <div style="background: rgba(0,0,0,0.8); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
             ${properties.CONTINENT}
          </div>
        `}
        onPolygonHover={setHoverFeature as any}
        labelsData={getLabelsData()}
        labelLat={d => (d as any).lat}
        labelLng={d => (d as any).lng}
        labelText={d => (d as any).text}
        labelSize={1.5}
        labelColor={d => (d as any).color}
        labelDotRadius={0.5}
        atmosphereColor="#3a228a"
        atmosphereAltitude={0.15}
        // Hint Rings
        ringsData={getRingsData()}
        ringColor={(d: any) => d.color}
        ringMaxRadius={(d: any) => d.maxRadius}
        ringPropagationSpeed={(d: any) => d.propagationSpeed}
        ringRepeatPeriod={(d: any) => d.repeatPeriod}
      />
    </div>
  );
};

export default Globe3D;