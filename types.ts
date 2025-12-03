export type TargetType = 'CONTINENT' | 'OCEAN';

export interface GameTarget {
  id: string;
  name: string; // Display name
  type: TargetType;
  // Centroid for ocean distance checks
  lat?: number;
  lng?: number;
  // For continents, match against GeoJSON properties
  matchKeys?: string[];
  color?: string; // Color when found
}

export interface GameState {
  isGameComplete: boolean;
  placedTargets: string[]; // IDs of targets correctly placed
}

export interface GeoJsonFeature {
  type: string;
  properties: {
    CONTINENT?: string;
    NAME?: string;
    [key: string]: any;
  };
  geometry: {
    type: string; // Polygon or MultiPolygon
    coordinates: any[];
  };
}