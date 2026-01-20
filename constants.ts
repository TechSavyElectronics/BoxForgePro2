
import { FluteType, MaterialProperties } from './types';

export const MATERIAL_DATA: Record<FluteType, MaterialProperties> = {
  [FluteType.E]: { thickness: 0.0625, ect: 29 }, // 1/16"
  [FluteType.B]: { thickness: 0.125, ect: 32 },  // 1/8"
  [FluteType.C]: { thickness: 0.1875, ect: 32 }, // 3/16"
  [FluteType.A]: { thickness: 0.25, ect: 32 },   // 1/4"
};

export const GLUE_TAB_WIDTH = 1.25; // inches

export const COLORS = {
  // Light Theme Palette
  CUT: '#000000',      // Black for dotted cut lines (as per user request)
  SCORE: '#000000',    // Black for solid fold lines (as per user request)
  DIMENSION: '#2563eb', // Blue for dimensions
  GLUE: '#fbbf24',     // Amber for glue zone
  BOARD: '#e5e7eb',    // Light gray board
  GRID: '#f1f5f9',
  TEXT: '#000000',
  BG_PAGE: '#ffffff',
  BG_SIDEBAR: '#f8fafc',
  BORDER: '#e2e8f0'
};

export const DEFAULT_TITLE_BLOCK: any = {
  companyName: 'Box Forge Industries',
  address: '123 Engineering Way, Industrial Park',
  designer: 'Lead Engineer',
  jobNumber: 'BF-2025-001'
};
