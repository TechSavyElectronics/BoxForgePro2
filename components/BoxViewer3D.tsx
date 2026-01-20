
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows, Text, Edges, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { BoxDimensions } from '../types';
import { calculatePanelDimensions } from '../utils/formulas';
import { RefreshCw, AlertCircle } from 'lucide-react';

// Enhanced Cardboard Colors
const CARDBOARD_MAIN = '#d2b48c'; 
const CARDBOARD_INNER = '#c1a173'; 
const GLUE_COLOR = '#ff9800'; 
const OUTLINE_COLOR = '#3e2723'; 

interface BoxViewer3DProps {
  dimensions: BoxDimensions;
  foldProgress: number;
  isWireframe?: boolean;
  isMetric?: boolean;
}

const CardboardMaterial = ({ color, wireframe }: { color: string, wireframe?: boolean }) => {
  // We use a high-roughness material to simulate the matte finish of cardboard.
  return (
    <meshStandardMaterial
      color={color}
      roughness={0.85}
      metalness={0.0}
      wireframe={wireframe}
      transparent={wireframe}
      opacity={wireframe ? 0.35 : 1}
      flatShading={false}
    />
  );
};

const FoldingPanel: React.FC<{
  width: number;
  height: number;
  thickness: number;
  rotation: [number, number, number];
  position: [number, number, number];
  color?: string;
  highlight?: boolean;
  label?: string;
  wireframe?: boolean;
  children?: React.ReactNode;
}> = ({ width, height, thickness, rotation, position, color = CARDBOARD_MAIN, highlight, label, wireframe, children }) => {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[width / 2, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, thickness]} />
        <CardboardMaterial color={highlight ? GLUE_COLOR : color} wireframe={wireframe} />
        {!wireframe && (
          <Edges 
            color={OUTLINE_COLOR} 
            threshold={20} 
            opacity={0.4} 
            transparent 
          />
        )}
        {label && (
          <Text
            position={[0, 0, thickness / 2 + 0.06]}
            fontSize={Math.max(height * 0.3, 0.5)}
            color={wireframe ? "#3b82f6" : "#4e342e"}
            anchorX="center"
            anchorY="middle"
            font="https://fonts.gstatic.com/s/jetbrainsmono/v18/tDb32oWUg0MKqScQ7qzPP_v_S5S6f8_V.woff2"
          >
            {label}
          </Text>
        )}
      </mesh>
      {children}
    </group>
  );
};

const BoxScene: React.FC<BoxViewer3DProps> = ({ dimensions, foldProgress, isWireframe, isMetric }) => {
  const panels = useMemo(() => calculatePanelDimensions(dimensions, isMetric), [dimensions, isMetric]);
  
  const p1 = THREE.MathUtils.lerp(0, Math.PI / 2, Math.min(Math.max(foldProgress * 4.2, 0), 1));
  const p2 = THREE.MathUtils.lerp(0, Math.PI / 2, Math.min(Math.max((foldProgress - 0.2) * 4.2, 0), 1));
  const p3 = THREE.MathUtils.lerp(0, Math.PI / 2, Math.min(Math.max((foldProgress - 0.4) * 4.2, 0), 1));
  const tab = THREE.MathUtils.lerp(0, Math.PI / 2, Math.min(Math.max((foldProgress - 0.6) * 4.2, 0), 1));
  const flaps = THREE.MathUtils.lerp(0, Math.PI / 2, Math.min(Math.max((foldProgress - 0.8) * 5.0, 0), 1));

  // Center vertically on the floor
  const yOffset = panels.H_Panel / 2 + panels.Flap_H;

  return (
    <group position={[0, yOffset, 0]}>
      <group rotation={[0, -Math.PI / 4, 0]} position={[-panels.L_Panel / 2, 0, 0]}>
        <FoldingPanel width={panels.L_Panel} height={panels.H_Panel} thickness={panels.thickness} position={[0, 0, 0]} rotation={[0, 0, 0]} label="A" wireframe={isWireframe}>
          <FoldingPanel width={panels.L_Panel} height={panels.Flap_H} thickness={panels.thickness} position={[0, panels.H_Panel / 2, 0]} rotation={[-flaps, 0, 0]} color={CARDBOARD_INNER} wireframe={isWireframe} />
          <FoldingPanel width={panels.L_Panel} height={panels.Flap_H} thickness={panels.thickness} position={[0, -panels.H_Panel / 2 - panels.Flap_H, 0]} rotation={[flaps, 0, 0]} color={CARDBOARD_INNER} wireframe={isWireframe} />

          <FoldingPanel width={panels.W_Panel} height={panels.H_Panel} thickness={panels.thickness} position={[panels.L_Panel, 0, 0]} rotation={[0, -p1, 0]} label="B" wireframe={isWireframe}>
            <FoldingPanel width={panels.W_Panel} height={panels.Flap_H} thickness={panels.thickness} position={[0, panels.H_Panel / 2, 0]} rotation={[-flaps, 0, 0]} color={CARDBOARD_INNER} wireframe={isWireframe} />
            <FoldingPanel width={panels.W_Panel} height={panels.Flap_H} thickness={panels.thickness} position={[0, -panels.H_Panel / 2 - panels.Flap_H, 0]} rotation={[flaps, 0, 0]} color={CARDBOARD_INNER} wireframe={isWireframe} />

            <FoldingPanel width={panels.L_Panel} height={panels.H_Panel} thickness={panels.thickness} position={[panels.W_Panel, 0, 0]} rotation={[0, -p2, 0]} label="C" wireframe={isWireframe}>
              <FoldingPanel width={panels.L_Panel} height={panels.Flap_H} thickness={panels.thickness} position={[0, panels.H_Panel / 2, 0]} rotation={[-flaps, 0, 0]} color={CARDBOARD_INNER} wireframe={isWireframe} />
              <FoldingPanel width={panels.L_Panel} height={panels.Flap_H} thickness={panels.thickness} position={[0, -panels.H_Panel / 2 - panels.Flap_H, 0]} rotation={[flaps, 0, 0]} color={CARDBOARD_INNER} wireframe={isWireframe} />

              <FoldingPanel width={panels.W_Panel} height={panels.H_Panel} thickness={panels.thickness} position={[panels.L_Panel, 0, 0]} rotation={[0, -p3, 0]} label="D" wireframe={isWireframe}>
                <FoldingPanel width={panels.W_Panel} height={panels.Flap_H} thickness={panels.thickness} position={[0, panels.H_Panel / 2, 0]} rotation={[-flaps, 0, 0]} color={CARDBOARD_INNER} wireframe={isWireframe} />
                <FoldingPanel width={panels.W_Panel} height={panels.Flap_H} thickness={panels.thickness} position={[0, -panels.H_Panel / 2 - panels.Flap_H, 0]} rotation={[flaps, 0, 0]} color={CARDBOARD_INNER} wireframe={isWireframe} />
                <FoldingPanel width={panels.thickness * 8} height={panels.H_Panel} thickness={panels.thickness} position={[panels.W_Panel, 0, 0]} rotation={[0, -tab, 0]} highlight={foldProgress > 0.65 && foldProgress < 0.9} wireframe={isWireframe} />
              </FoldingPanel>
            </FoldingPanel>
          </FoldingPanel>
        </FoldingPanel>
      </group>
    </group>
  );
};

export const BoxViewer3D: React.FC<BoxViewer3DProps> = ({ dimensions, foldProgress, isWireframe, isMetric }) => {
  const [contextLost, setContextLost] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const handleCreated = useCallback((state: any) => {
    const gl = state.gl.getContext().canvas;
    
    const onLost = (event: Event) => {
      event.preventDefault();
      console.warn("BoxForge: WebGL Context Lost");
      setContextLost(true);
    };

    const onRestored = () => {
      console.info("BoxForge: WebGL Context Restored");
      setContextLost(false);
      setRetryKey(prev => prev + 1);
    };

    gl.addEventListener('webglcontextlost', onLost, false);
    gl.addEventListener('webglcontextrestored', onRestored, false);

    return () => {
      gl.removeEventListener('webglcontextlost', onLost);
      gl.removeEventListener('webglcontextrestored', onRestored);
    };
  }, []);

  // To fix the "blank model" issue when dimensions are very small/large due to units, 
  // we normalize the scene scale so the camera distance is always appropriate.
  const sceneScale = isMetric ? 0.03937 : 1.0; 
  const cameraDist = 80;

  if (contextLost) {
    return (
      <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
        <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-200 max-w-sm">
          <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={48} />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Graphics Pipeline Idle</h2>
          <p className="text-slate-500 text-xs font-medium mb-8 uppercase tracking-widest leading-relaxed">
            The WebGL context was lost due to system resource constraints or view switching.
          </p>
          <button 
            onClick={() => { setContextLost(false); setRetryKey(k => k + 1); }} 
            className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 shadow-lg hover:bg-blue-700 transition-all"
          >
            <RefreshCw size={16} /> Re-Initialize GPU
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-slate-50 relative flex items-center justify-center overflow-hidden">
      <Canvas 
        key={retryKey}
        shadows 
        onCreated={handleCreated}
        gl={{ 
          antialias: true, 
          alpha: true, 
          powerPreference: "high-performance",
          preserveDrawingBuffer: true 
        }} 
        dpr={[1, 2]}
      >
        <color attach="background" args={['#f8fafc']} />
        
        <PerspectiveCamera 
          makeDefault 
          position={[cameraDist, cameraDist * 0.6, cameraDist]} 
          fov={32} 
          far={3000} 
          near={0.1}
        />
        
        <OrbitControls 
          enableDamping 
          dampingFactor={0.05} 
          minDistance={10} 
          maxDistance={2000} 
          autoRotate={!isWireframe && foldProgress === 1} 
          autoRotateSpeed={0.4} 
        />
        
        {/* Cinematic studio lighting */}
        <ambientLight intensity={0.7} />
        <directionalLight 
          position={[10, 40, 20]} 
          intensity={1.1} 
          castShadow 
          shadow-mapSize={[1024, 1024]} 
          shadow-camera-far={1000}
        />
        <spotLight 
          position={[-20, 50, 10]} 
          angle={0.15} 
          penumbra={1} 
          intensity={0.8} 
          castShadow 
        />
        
        <group scale={[sceneScale, sceneScale, sceneScale]}>
          <BoxScene 
            dimensions={dimensions} 
            foldProgress={foldProgress} 
            isWireframe={isWireframe} 
            isMetric={isMetric} 
          />
          <ContactShadows 
            position={[0, -0.01, 0]} 
            opacity={0.35} 
            scale={isMetric ? 2500 : 150} 
            blur={2.5} 
            far={100} 
            resolution={512} 
          />
        </group>

        {/* Fix: Changed preset from 'neutral' to 'studio' as 'neutral' is not a valid preset type */}
        <Environment preset="studio" />
      </Canvas>

      <div className="absolute top-4 left-4 pointer-events-none z-10 flex flex-col gap-1">
        <span className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-[0.4em]">BoxForge GPU v3.2</span>
        <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest bg-white/60 backdrop-blur-sm px-2 py-1 rounded-md border border-slate-200">
          {isMetric ? 'Metric Rasterization' : 'Imperial Rasterization'}
        </span>
      </div>
    </div>
  );
};
