export enum FluteType {
  A = 'A-Flute',
  B = 'B-Flute',
  C = 'C-Flute',
  E = 'E-Flute'
}

export interface MaterialProperties {
  thickness: number; // in inches (internal storage)
  ect: number; // Edge Crush Test value (lbs/in)
}

export interface BoxDimensions {
  length: number;
  width: number;
  height: number;
  flute: FluteType;
}

export interface TitleBlockInfo {
  companyName: string;
  address: string;
  designer: string;
  jobNumber: string;
  logoUrl?: string;
}

export interface StructuralAnalysis {
  maxLoad: number;
  safetyFactor: number;
  isSafe: boolean;
  bctValue: number;
  unitLabel: string;
  loadLabel: string;
}