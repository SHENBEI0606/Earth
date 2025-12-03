import { GameTarget } from './types';

export const TARGETS: GameTarget[] = [
  // Continents
  { 
    id: 'asia', 
    name: '亚洲', 
    type: 'CONTINENT', 
    matchKeys: ['Asia'],
    color: '#ef4444', // Red
    lat: 45,
    lng: 90
  },
  { 
    id: 'africa', 
    name: '非洲', 
    type: 'CONTINENT', 
    matchKeys: ['Africa'],
    color: '#eab308', // Yellow
    lat: 0,
    lng: 20
  },
  { 
    id: 'europe', 
    name: '欧洲', 
    type: 'CONTINENT', 
    matchKeys: ['Europe'],
    color: '#3b82f6', // Blue
    lat: 48,
    lng: 15
  },
  { 
    id: 'north_america', 
    name: '北美洲', 
    type: 'CONTINENT', 
    matchKeys: ['North America'],
    color: '#f97316', // Orange
    lat: 45,
    lng: -100
  },
  { 
    id: 'south_america', 
    name: '南美洲', 
    type: 'CONTINENT', 
    matchKeys: ['South America'],
    color: '#22c55e', // Green
    lat: -15,
    lng: -60
  },
  { 
    id: 'oceania', 
    name: '大洋洲', 
    type: 'CONTINENT', 
    matchKeys: ['Oceania'],
    color: '#a855f7', // Purple
    lat: -25,
    lng: 135
  },
  { 
    id: 'antarctica', 
    name: '南极洲', 
    type: 'CONTINENT', 
    matchKeys: ['Antarctica'],
    color: '#cbd5e1', // Slate/White
    lat: -80,
    lng: 0
  },
  // Oceans
  { 
    id: 'pacific_ocean', 
    name: '太平洋', 
    type: 'OCEAN', 
    lat: 0, 
    lng: -160,
    color: '#0ea5e9'
  },
  { 
    id: 'atlantic_ocean', 
    name: '大西洋', 
    type: 'OCEAN', 
    lat: 0, 
    lng: -30,
    color: '#0ea5e9'
  },
  { 
    id: 'indian_ocean', 
    name: '印度洋', 
    type: 'OCEAN', 
    lat: -20, 
    lng: 80,
    color: '#0ea5e9'
  },
  { 
    id: 'arctic_ocean', 
    name: '北冰洋', 
    type: 'OCEAN', 
    lat: 85, 
    lng: 0,
    color: '#0ea5e9'
  }
];

export const GEOJSON_URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson';

// Puzzle Colors
export const COLOR_OCEAN_BG = '#0f172a'; // Deep dark blue
export const COLOR_LAND_UNFOUND = '#334155'; // Slate 700 (Dark Grey for empty slots)
export const COLOR_LAND_HOVER = '#475569'; // Slate 600
export const COLOR_BORDER = '#1e293b'; // Slate 800