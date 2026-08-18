import { BoardCoordinate, PlayerColor } from '../types';

// 52 Common Path Cells around the 15x15 Ludo board in clockwise order
export const COMMON_TRACK_COORDS: BoardCoordinate[] = [
  /* 0  - Red Start */   { row: 6, col: 1 },
  /* 1  */               { row: 6, col: 2 },
  /* 2  */               { row: 6, col: 3 },
  /* 3  */               { row: 6, col: 4 },
  /* 4  */               { row: 6, col: 5 },
  /* 5  */               { row: 5, col: 6 },
  /* 6  */               { row: 4, col: 6 },
  /* 7  */               { row: 3, col: 6 },
  /* 8  - Star Safe */   { row: 2, col: 6 },
  /* 9  */               { row: 1, col: 6 },
  /* 10 */               { row: 0, col: 6 },
  /* 11 */               { row: 0, col: 7 },
  /* 12 */               { row: 0, col: 8 },
  /* 13 - Green Start */ { row: 1, col: 8 },
  /* 14 */               { row: 2, col: 8 },
  /* 15 */               { row: 3, col: 8 },
  /* 16 */               { row: 4, col: 8 },
  /* 17 */               { row: 5, col: 8 },
  /* 18 */               { row: 6, col: 9 },
  /* 19 */               { row: 6, col: 10 },
  /* 20 */               { row: 6, col: 11 },
  /* 21 - Star Safe */   { row: 6, col: 12 },
  /* 22 */               { row: 6, col: 13 },
  /* 23 */               { row: 6, col: 14 },
  /* 24 */               { row: 7, col: 14 },
  /* 25 */               { row: 8, col: 14 },
  /* 26 - Yellow Start */{ row: 8, col: 13 },
  /* 27 */               { row: 8, col: 12 },
  /* 28 */               { row: 8, col: 11 },
  /* 29 */               { row: 8, col: 10 },
  /* 30 */               { row: 8, col: 9 },
  /* 31 */               { row: 9, col: 8 },
  /* 32 */               { row: 10, col: 8 },
  /* 33 */               { row: 11, col: 8 },
  /* 34 - Star Safe */   { row: 12, col: 8 },
  /* 35 */               { row: 13, col: 8 },
  /* 36 */               { row: 14, col: 8 },
  /* 37 */               { row: 14, col: 7 },
  /* 38 */               { row: 14, col: 6 },
  /* 39 - Blue Start */  { row: 13, col: 6 },
  /* 40 */               { row: 12, col: 6 },
  /* 41 */               { row: 11, col: 6 },
  /* 42 */               { row: 10, col: 6 },
  /* 43 */               { row: 9, col: 6 },
  /* 44 */               { row: 8, col: 5 },
  /* 45 */               { row: 8, col: 4 },
  /* 46 */               { row: 8, col: 3 },
  /* 47 - Star Safe */   { row: 8, col: 2 },
  /* 48 */               { row: 8, col: 1 },
  /* 49 */               { row: 8, col: 0 },
  /* 50 */               { row: 7, col: 0 },
  /* 51 */               { row: 6, col: 0 },
];

// Start offsets in the 52-cell array
export const PLAYER_START_OFFSETS: Record<number, number> = {
  0: 0,  // Red
  1: 13, // Green
  2: 26, // Yellow
  3: 39, // Blue
};

// Safe squares indices in COMMON_TRACK_COORDS
export const SAFE_TRACK_INDICES = new Set<number>([
  0,  // Red Start
  8,  // Red side star
  13, // Green Start
  21, // Green side star
  26, // Yellow Start
  34, // Yellow side star
  39, // Blue Start
  47, // Blue side star
]);

// 5 Home path steps for each player
export const HOME_PATHS: Record<number, BoardCoordinate[]> = {
  0: [ // Red
    { row: 7, col: 1 },
    { row: 7, col: 2 },
    { row: 7, col: 3 },
    { row: 7, col: 4 },
    { row: 7, col: 5 },
  ],
  1: [ // Green
    { row: 1, col: 7 },
    { row: 2, col: 7 },
    { row: 3, col: 7 },
    { row: 4, col: 7 },
    { row: 5, col: 7 },
  ],
  2: [ // Yellow
    { row: 7, col: 13 },
    { row: 7, col: 12 },
    { row: 7, col: 11 },
    { row: 7, col: 10 },
    { row: 7, col: 9 },
  ],
  3: [ // Blue
    { row: 13, col: 7 },
    { row: 12, col: 7 },
    { row: 11, col: 7 },
    { row: 10, col: 7 },
    { row: 9, col: 7 },
  ],
};

// Final home coordinates (Center Triangle)
export const FINAL_HOME_COORDS: Record<number, BoardCoordinate> = {
  0: { row: 7, col: 6 }, // Red center triangle tip
  1: { row: 6, col: 7 }, // Green center triangle tip
  2: { row: 7, col: 8 }, // Yellow center triangle tip
  3: { row: 8, col: 7 }, // Blue center triangle tip
};

// Base slots for 4 tokens per player
export const BASE_TOKEN_COORDS: Record<number, BoardCoordinate[]> = {
  0: [ // Red Base
    { row: 2, col: 2 },
    { row: 2, col: 3 },
    { row: 3, col: 2 },
    { row: 3, col: 3 },
  ],
  1: [ // Green Base
    { row: 2, col: 11 },
    { row: 2, col: 12 },
    { row: 3, col: 11 },
    { row: 3, col: 12 },
  ],
  2: [ // Yellow Base
    { row: 11, col: 11 },
    { row: 11, col: 12 },
    { row: 12, col: 11 },
    { row: 12, col: 12 },
  ],
  3: [ // Blue Base
    { row: 11, col: 2 },
    { row: 11, col: 3 },
    { row: 12, col: 2 },
    { row: 12, col: 3 },
  ],
};

export const COLOR_CONFIG: Record<PlayerColor, {
  name: string;
  bgHex: string;
  badgeHex: string;
  lightHex: string;
  tailwindBg: string;
  tailwindBorder: string;
  tailwindText: string;
}> = {
  red: {
    name: 'Red',
    bgHex: '#DC2626',
    badgeHex: '#B91C1C',
    lightHex: '#FEE2E2',
    tailwindBg: 'bg-red-600',
    tailwindBorder: 'border-red-600',
    tailwindText: 'text-red-600',
  },
  green: {
    name: 'Green',
    bgHex: '#16A34A',
    badgeHex: '#15803D',
    lightHex: '#DCFCE7',
    tailwindBg: 'bg-emerald-600',
    tailwindBorder: 'border-emerald-600',
    tailwindText: 'text-emerald-600',
  },
  yellow: {
    name: 'Yellow',
    bgHex: '#EAB308',
    badgeHex: '#CA8A04',
    lightHex: '#FEF9C3',
    tailwindBg: 'bg-amber-500',
    tailwindBorder: 'border-amber-500',
    tailwindText: 'text-amber-600',
  },
  blue: {
    name: 'Blue',
    bgHex: '#2563EB',
    badgeHex: '#1D4ED8',
    lightHex: '#DBEAFE',
    tailwindBg: 'bg-blue-600',
    tailwindBorder: 'border-blue-600',
    tailwindText: 'text-blue-600',
  },
};
