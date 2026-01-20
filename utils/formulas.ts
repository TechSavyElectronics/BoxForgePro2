import { BoxDimensions, MaterialProperties, StructuralAnalysis } from '../types';
import { MATERIAL_DATA, GLUE_TAB_WIDTH } from '../constants';

export const IN_TO_MM = 25.4;
export const LBS_TO_KG = 0.453592;
export const LBF_TO_N = 4.44822;

export const calculateFoldAllowance = (thickness: number) => 4 * thickness;

export const calculatePanelDimensions = (dims: BoxDimensions, isMetric: boolean = false) => {
  const mat = MATERIAL_DATA[dims.flute];
  const scale = isMetric ? IN_TO_MM : 1;
  
  const thickness = mat.thickness * scale;
  const FA = calculateFoldAllowance(thickness);
  const glueTab = GLUE_TAB_WIDTH * scale;
  
  const L_Panel = dims.length + FA;
  const W_Panel = dims.width + FA;
  const H_Panel = dims.height;
  
  // Professional flap height is half the width to meet in the middle
  const Flap_H = (dims.width / 2) + (thickness / 2);

  // Slot width for folding clearance
  const Slot_Width = thickness * 1.5;

  return {
    L_Panel,
    W_Panel,
    H_Panel,
    Flap_H,
    Slot_Width,
    totalWidth: glueTab + (L_Panel * 2) + (W_Panel * 2),
    totalHeight: H_Panel + (Flap_H * 2),
    thickness,
    glueTab,
    unit: isMetric ? 'mm' : 'in'
  };
};

export const performStructuralAnalysis = (dims: BoxDimensions, isMetric: boolean = false): StructuralAnalysis => {
  const mat = MATERIAL_DATA[dims.flute];
  const perimeter = 2 * (dims.length + dims.width);
  
  // Base BCT logic (Imperial)
  const bctValueImp = 5.87 * mat.ect * Math.sqrt(perimeter * mat.thickness);
  const safetyFactor = 3;
  const maxLoadImp = bctValueImp / safetyFactor;

  if (isMetric) {
    return {
      bctValue: bctValueImp * LBF_TO_N,
      maxLoad: maxLoadImp * LBS_TO_KG,
      safetyFactor,
      isSafe: true,
      unitLabel: 'N',
      loadLabel: 'KG'
    };
  }

  return {
    bctValue: bctValueImp,
    maxLoad: maxLoadImp,
    safetyFactor,
    isSafe: true,
    unitLabel: 'LBF',
    loadLabel: 'LBS'
  };
};