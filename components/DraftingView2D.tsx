import React, { useState, useRef } from 'react';
import { BoxDimensions } from '../types';
import { calculatePanelDimensions } from '../utils/formulas';
import { COLORS } from '../constants';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';

interface DraftingView2DProps {
  dimensions: BoxDimensions;
  isPrinting?: boolean;
  isMetric?: boolean;
}

export const DraftingView2D: React.FC<DraftingView2DProps> = ({ dimensions, isPrinting = false, isMetric = false }) => {
  const panels = calculatePanelDimensions(dimensions, isMetric);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const padding = 10;
  const viewBoxWidth = panels.totalWidth + padding * 2;
  const viewBoxHeight = panels.totalHeight + padding * 2;
  
  const x0 = padding;
  const xGlue = x0 + panels.glueTab;
  const x1 = xGlue + panels.L_Panel;
  const x2 = x1 + panels.W_Panel;
  const x3 = x2 + panels.L_Panel;
  const x4 = x3 + panels.W_Panel;
  
  const y0 = padding;
  const yFlapTop = y0 + panels.Flap_H;
  const yBodyBottom = yFlapTop + panels.H_Panel;
  const yTotalBottom = yBodyBottom + panels.Flap_H;

  const handleStart = (clientX: number, clientY: number) => {
    if (isPrinting) return;
    isDragging.current = true;
    lastPos.current = { x: clientX, y: clientY };
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging.current) return;
    const dx = (clientX - lastPos.current.x) / zoom;
    const dy = (clientY - lastPos.current.y) / zoom;
    setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    lastPos.current = { x: clientX, y: clientY };
  };

  const handleEnd = () => { isDragging.current = false; };

  const Line = ({ x1, y1, x2, y2, type = 'cut' }: { x1: number, y1: number, x2: number, y2: number, type?: 'cut' | 'fold' }) => (
    <line 
      x1={x1} y1={y1} x2={x2} y2={y2} 
      stroke="#000000"
      strokeWidth={0.12}
      strokeDasharray={type === 'cut' ? '0.2,0.15' : 'none'}
    />
  );

  const Dimension = ({ x1, y1, x2, y2, label, vertical = false, offsetScale = 1 }: { x1: number, y1: number, x2: number, y2: number, label: string, vertical?: boolean, offsetScale?: number }) => {
    const offsetDist = (isMetric ? 8 : 2.4) * offsetScale;
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const fontSize = isMetric ? 4 : 1.35;
    
    return (
      <g className="select-none font-black">
        <line x1={x1} y1={y1} x2={vertical ? x1 + offsetDist : x1} y2={vertical ? y1 : y1 - offsetDist} stroke="#cbd5e1" strokeWidth={0.04} />
        <line x1={x2} y1={y2} x2={vertical ? x2 + offsetDist : x2} y2={vertical ? y2 : y2 - offsetDist} stroke="#cbd5e1" strokeWidth={0.04} />
        <line 
          x1={vertical ? x1 + offsetDist : x1} 
          y1={vertical ? y1 : y1 - offsetDist} 
          x2={vertical ? x2 + offsetDist : x2} 
          y2={vertical ? y2 : y2 - offsetDist} 
          stroke={COLORS.DIMENSION} 
          strokeWidth={0.1} 
        />
        <text 
          x={vertical ? midX + offsetDist + (isMetric ? 2 : 0.8) : midX} 
          y={vertical ? midY : midY - offsetDist - (isMetric ? 2 : 0.9)} 
          fill={COLORS.DIMENSION} 
          fontSize={fontSize} 
          textAnchor="middle" 
          className="font-mono"
          transform={vertical ? `rotate(90, ${midX + offsetDist + (isMetric ? 2 : 0.8)}, ${midY})` : ""}
        >
          {label}{panels.unit}
        </text>
      </g>
    );
  };

  const slotW = panels.Slot_Width / 2;
  const panelNodes = [xGlue, x1, x2, x3, x4];

  return (
    <div className={`w-full h-full relative ${isPrinting ? 'bg-white' : 'bg-slate-100'} overflow-hidden flex flex-col`}>
      <div 
        className="flex-1 overflow-hidden touch-none"
        onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
        onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={handleEnd}
      >
        <svg 
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          className="w-full h-full"
          style={{ 
            transform: isPrinting ? 'none' : `scale(${zoom}) translate(${offset.x}px, ${offset.y}px)`,
            transformOrigin: 'center center',
            vectorEffect: 'non-scaling-stroke'
          }}
        >
          {!isPrinting && (
            <defs>
              <pattern id="grid-pro" width={isMetric ? 20 : 4} height={isMetric ? 20 : 4} patternUnits="userSpaceOnUse">
                <path d={isMetric ? "M 20 0 L 0 0 0 20" : "M 4 0 L 0 0 0 4"} fill="none" stroke="#e2e8f0" strokeWidth="0.08" />
              </pattern>
            </defs>
          )}
          {!isPrinting && <rect width="100%" height="100%" fill="url(#grid-pro)" />}

          <g>
            <path 
              d={`M ${x0 + 0.4},${yFlapTop} L ${xGlue},${yFlapTop} L ${xGlue},${yBodyBottom} L ${x0 + 0.4},${yBodyBottom} L ${x0},${yBodyBottom - 0.6} L ${x0},${yFlapTop + 0.6} Z`} 
              fill="none" stroke="#000" strokeWidth="0.12" strokeDasharray="0.2,0.15" 
            />

            {panelNodes.map((x, i) => {
              if (i === 0) return null;
              return (
                <React.Fragment key={`slots-${i}`}>
                  <path d={`M ${x - slotW},${y0} L ${x + slotW},${y0} L ${x + slotW * 0.5},${yFlapTop} L ${x - slotW * 0.5},${yFlapTop} Z`} fill="none" stroke="#000" strokeWidth="0.12" strokeDasharray="0.2,0.15" />
                  <path d={`M ${x - slotW * 0.5},${yBodyBottom} L ${x + slotW * 0.5},${yBodyBottom} L ${x + slotW},${yTotalBottom} L ${x - slotW},${yTotalBottom} Z`} fill="none" stroke="#000" strokeWidth="0.12" strokeDasharray="0.2,0.15" />
                </React.Fragment>
              );
            })}

            <Line x1={xGlue} y1={y0} x2={x4} y2={y0} type="cut" />
            <Line x1={xGlue} y1={yTotalBottom} x2={x4} y2={yTotalBottom} type="cut" />
            <Line x1={x4} y1={yFlapTop} x2={x4} y2={yBodyBottom} type="cut" />

            <Line x1={xGlue} y1={yFlapTop} x2={xGlue} y2={yBodyBottom} type="fold" />
            <Line x1={x1} y1={yFlapTop} x2={x1} y2={yBodyBottom} type="fold" />
            <Line x1={x2} y1={yFlapTop} x2={x2} y2={yBodyBottom} type="fold" />
            <Line x1={x3} y1={yFlapTop} x2={x3} y2={yBodyBottom} type="fold" />
            <Line x1={xGlue} y1={yFlapTop} x2={x4} y2={yFlapTop} type="fold" />
            <Line x1={xGlue} y1={yBodyBottom} x2={x4} y2={yBodyBottom} type="fold" />

            <g className="font-mono font-black select-none">
              <text x={x0 + panels.glueTab/2} y={yFlapTop + panels.H_Panel/2} fill="#000" fontSize={isMetric ? 3 : 1.15} textAnchor="middle" className="opacity-30" transform={`rotate(-90, ${x0 + panels.glueTab/2}, ${yFlapTop + panels.H_Panel/2})`}>GLUE TAB</text>
              <text x={xGlue + panels.L_Panel/2} y={yFlapTop + panels.H_Panel/2} textAnchor="middle" fill="#000" fontSize={isMetric ? 6 : 2.25}>A</text>
              <text x={x1 + panels.W_Panel/2} y={yFlapTop + panels.H_Panel/2} textAnchor="middle" fill="#000" fontSize={isMetric ? 6 : 2.25}>B</text>
              <text x={x2 + panels.L_Panel/2} y={yFlapTop + panels.H_Panel/2} textAnchor="middle" fill="#000" fontSize={isMetric ? 6 : 2.25}>C</text>
              <text x={x3 + panels.W_Panel/2} y={yFlapTop + panels.H_Panel/2} textAnchor="middle" fill="#000" fontSize={isMetric ? 6 : 2.25}>D</text>
            </g>

            <Dimension x1={xGlue} y1={yFlapTop} x2={x1} y2={yFlapTop} label={panels.L_Panel.toFixed(1)} />
            <Dimension x1={x1} y1={yFlapTop} x2={x2} y2={yFlapTop} label={panels.W_Panel.toFixed(1)} />
            <Dimension x1={xGlue} y1={yFlapTop} x2={xGlue} y2={yBodyBottom} label={panels.H_Panel.toFixed(1)} vertical />
            <Dimension x1={xGlue} y1={y0} x2={xGlue} y2={yFlapTop} label={panels.Flap_H.toFixed(1)} vertical offsetScale={2} />
          </g>
        </svg>
      </div>

      <div className="absolute top-4 right-4 flex flex-col gap-2 no-export no-print">
        <button onClick={() => setZoom(z => z * 1.2)} className="bg-white/90 p-3 rounded-xl shadow-lg border border-slate-200 backdrop-blur-sm"><ZoomIn size={20}/></button>
        <button onClick={() => setZoom(z => z / 1.2)} className="bg-white/90 p-3 rounded-xl shadow-lg border border-slate-200 backdrop-blur-sm"><ZoomOut size={20}/></button>
        <button onClick={() => { setZoom(1); setOffset({x:0, y:0}); }} className="bg-white/90 p-3 rounded-xl shadow-lg border border-slate-200 backdrop-blur-sm"><Maximize size={20}/></button>
      </div>
    </div>
  );
};