import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, Settings, ShieldCheck, Layout, 
  BoxSelect, Upload, Layers, FileText, Download, X, CheckCircle2,
  Loader2, Play, Pause, RotateCcw, ChevronLeft, ChevronRight, EyeOff, Eye,
  Boxes
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { BoxDimensions, FluteType, TitleBlockInfo, StructuralAnalysis } from './types';
import { DEFAULT_TITLE_BLOCK } from './constants';
import { DraftingView2D } from './components/DraftingView2D';
import { BoxViewer3D } from './components/BoxViewer3D';
import { TitleBlock } from './components/TitleBlock';
import { performStructuralAnalysis, IN_TO_MM } from './utils/formulas';

const STORAGE_KEY = 'box_forge_pro_persist_v3';

const App: React.FC = () => {
  const [splashState, setSplashState] = useState<'showing' | 'fading' | 'hidden'>('showing');
  const [loadPercent, setLoadPercent] = useState(0);
  
  // Toggles
  const [isMetric, setIsMetric] = useState(false);
  const [isWireframe, setIsWireframe] = useState(false);
  const [isHide, setIsHide] = useState(false);

  const [dimensions, setDimensions] = useState<BoxDimensions>({ length: 12, width: 10, height: 8, flute: FluteType.B });
  const [viewMode, setViewMode] = useState<'2D' | '3D'>('2D');
  const [foldProgress, setFoldProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [titleBlock, setTitleBlock] = useState<TitleBlockInfo>(DEFAULT_TITLE_BLOCK);
  const [showSettings, setShowSettings] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStep, setExportStep] = useState<'confirm' | 'format'>('confirm');
  const [isExporting, setIsExporting] = useState(false);
  const [analysis, setAnalysis] = useState<StructuralAnalysis | null>(null);

  // Key to force-refresh views on critical mode changes
  const viewResetKey = useMemo(() => `${viewMode}-${isWireframe}-${isMetric}`, [viewMode, isWireframe, isMetric]);

  useEffect(() => {
    const duration = 1000;
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(100, (elapsed / duration) * 100);
      setLoadPercent(progress);
      if (elapsed >= duration) {
        clearInterval(interval);
        setSplashState('fading');
        setTimeout(() => setSplashState('hidden'), 300);
      }
    }, 16);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed) setTitleBlock(parsed);
      } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => { setAnalysis(performStructuralAnalysis(dimensions, isMetric)); }, [dimensions, isMetric]);

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setFoldProgress(prev => {
          if (prev >= 1) { setIsPlaying(false); return 1; }
          return prev + 0.005;
        });
      }, 16);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const toggleMetric = () => {
    const newMetric = !isMetric;
    const factor = newMetric ? IN_TO_MM : 1 / IN_TO_MM;
    setDimensions(prev => ({
      ...prev,
      length: parseFloat((prev.length * factor).toFixed(1)),
      width: parseFloat((prev.width * factor).toFixed(1)),
      height: parseFloat((prev.height * factor).toFixed(1)),
    }));
    setIsMetric(newMetric);
  };

  const toggleWireframe = () => {
    const newWireframe = !isWireframe;
    setIsWireframe(newWireframe);
    if (newWireframe) {
      setViewMode('3D');
      setFoldProgress(1);
    } else {
      setViewMode('2D');
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setTitleBlock(prev => ({ ...prev, logoUrl: event.target?.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const downloadFile = async (format: 'pdf' | 'png') => {
    const container = document.getElementById('main-view-container');
    if (!container) return;
    setIsExporting(true);
    const uiToHide = document.querySelectorAll('.no-export');
    uiToHide.forEach(el => (el as HTMLElement).style.display = 'none');
    try {
      const canvas = await html2canvas(container, { scale: 2.5, useCORS: true, backgroundColor: '#ffffff' });
      if (format === 'pdf') {
        const pdf = new jsPDF({ orientation: canvas.width > canvas.height ? 'landscape' : 'portrait', unit: 'px', format: [canvas.width, canvas.height] });
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`BoxForge-Job-${titleBlock.jobNumber || 'export'}.pdf`);
      } else {
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png', 1.0);
        link.download = `BoxForge-Job-${titleBlock.jobNumber || 'export'}.png`;
        link.click();
      }
    } finally {
      uiToHide.forEach(el => (el as HTMLElement).style.display = 'flex');
      setIsExporting(false);
      setShowExportModal(false);
      setExportStep('confirm');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen w-screen overflow-hidden bg-white text-slate-900 font-sans">
      {isExporting && (
        <div className="fixed inset-0 z-[200] bg-white/95 backdrop-blur-xl flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
          <h2 className="font-mono text-[10px] uppercase tracking-[0.4em] font-black">Synthesizing CAD</h2>
        </div>
      )}

      {splashState !== 'hidden' && (
        <div className={`fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center transition-opacity duration-300 ${splashState === 'fading' ? 'opacity-0' : 'opacity-100'}`}>
          <div className="bg-blue-600 p-5 rounded-[2rem] shadow-xl mb-8"><Box size={48} className="text-white" /></div>
          <div className="w-64 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <div className="h-full bg-blue-600 transition-all duration-100" style={{ width: `${loadPercent}%` }} />
          </div>
          <p className="mt-6 text-[9px] font-mono text-slate-400 uppercase tracking-[0.4em] font-black italic">Box Forge Lab</p>
        </div>
      )}

      {/* Inputs Section */}
      <aside className={`no-print w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50 flex flex-col z-20 shrink-0 ${isHide ? 'h-0 lg:w-0 overflow-hidden' : 'max-h-[50vh] lg:max-h-none overflow-y-auto'}`}>
        <header className="p-4 lg:p-6 border-b border-slate-200 flex items-center justify-between lg:justify-start gap-3">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg shadow-md"><Box size={18} className="text-white" /></div>
            <div>
              <h1 className="font-black text-sm lg:text-lg leading-none tracking-tight uppercase text-slate-900">BOX FORGE</h1>
              <span className="text-[8px] lg:text-[10px] text-blue-600 font-mono tracking-widest uppercase font-black">Pro Mobile</span>
            </div>
          </div>
          <div className="lg:hidden flex gap-2">
             <button onClick={() => setShowSettings(true)} className="p-2 text-slate-500 bg-white border border-slate-200 rounded-lg"><Settings size={18} /></button>
          </div>
        </header>

        <div className="p-4 lg:p-6 space-y-6 lg:space-y-10">
          <section>
            <h2 className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2 font-black border-b border-slate-200 pb-2"><BoxSelect size={12} /> Dimensions ({isMetric ? 'mm' : 'in'})</h2>
            <div className="grid grid-cols-3 lg:grid-cols-1 gap-2 lg:gap-4">
              {['length', 'width', 'height'].map((dim) => (
                <div key={dim}>
                  <label className="block text-[8px] lg:text-[10px] uppercase font-mono text-slate-400 mb-1 font-black tracking-widest">{dim}</label>
                  <input 
                    type="number" 
                    step={isMetric ? "1" : "0.1"}
                    value={dimensions[dim as keyof typeof dimensions] as number} 
                    onChange={(e) => setDimensions({...dimensions, [dim]: parseFloat(e.target.value) || 0})} 
                    className="w-full bg-white border border-slate-200 rounded-lg lg:rounded-xl p-2 lg:p-4 font-mono text-xs lg:text-sm focus:ring-2 focus:ring-blue-600/30 outline-none shadow-sm transition-all"
                  />
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2 font-black border-b border-slate-200 pb-2"><Layers size={12} /> Material</h2>
            <div className="grid grid-cols-4 lg:grid-cols-2 gap-2">
              {[ { type: FluteType.E, sub: 'E' }, { type: FluteType.C, sub: 'C' }, { type: FluteType.B, sub: 'B' }, { type: FluteType.A, sub: 'A' } ].map((opt) => (
                <button 
                  key={opt.type} 
                  onClick={() => setDimensions({...dimensions, flute: opt.type})} 
                  className={`py-2 px-1 lg:p-4 border rounded-lg lg:rounded-2xl text-center transition-all ${dimensions.flute === opt.type ? 'border-blue-600 bg-blue-50 text-blue-700 font-black ring-2 ring-blue-500/20' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}
                >
                  <div className="text-[10px] lg:text-base font-black uppercase tracking-tighter">{opt.sub}</div>
                </button>
              ))}
            </div>
          </section>

          <section className="hidden lg:block bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h2 className="text-xs font-mono uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2 font-black"><ShieldCheck size={14} className="text-emerald-600" /> Structural</h2>
            <div className="space-y-4">
              <div className="flex justify-between text-xs font-mono"><span className="text-slate-400 font-black uppercase text-[9px]">Max Weight:</span><span className="text-slate-900 font-black">{analysis?.maxLoad.toFixed(0)} {analysis?.loadLabel}</span></div>
              <div className="flex justify-between text-xs font-mono"><span className="text-slate-400 font-black uppercase text-[9px]">BCT Value:</span><span className="text-slate-900 font-black">{analysis?.bctValue.toFixed(1)} {analysis?.unitLabel}</span></div>
            </div>
          </section>
        </div>

        <footer className="mt-auto p-4 lg:p-6 border-t border-slate-200 bg-slate-100 grid grid-cols-2 lg:grid-cols-1 gap-2">
          <button onClick={() => setShowExportModal(true)} className="w-full bg-slate-900 hover:bg-black text-white font-mono text-[10px] lg:text-xs p-3 lg:p-5 rounded-xl lg:rounded-[2rem] flex items-center justify-center gap-2 transition-all font-black uppercase tracking-widest shadow-lg shadow-slate-200 active:scale-95"><Download size={14} /> Export</button>
          <button onClick={() => setShowSettings(true)} className="w-full border border-slate-200 bg-white text-slate-500 font-mono text-[10px] lg:text-xs p-3 lg:p-4 rounded-xl lg:rounded-2xl flex items-center justify-center gap-2 font-bold hover:bg-slate-50 transition-colors"><Settings size={14} /> Registry</button>
        </footer>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-white">
        {/* TOP TOGGLE BAR */}
        <nav className="no-print h-14 lg:h-16 border-b border-slate-200 flex items-center justify-center px-4 bg-slate-50/50 backdrop-blur-md z-30">
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/50 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
            {/* Metric Toggle */}
            <button 
              onClick={toggleMetric}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] lg:text-xs font-mono uppercase transition-all font-black tracking-widest whitespace-nowrap ${isMetric ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-300/50'}`}
            >
              Metric {isMetric ? 'ON' : 'OFF'}
            </button>
            {/* Wireframe Toggle */}
            <button 
              onClick={toggleWireframe}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] lg:text-xs font-mono uppercase transition-all font-black tracking-widest whitespace-nowrap ${isWireframe ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-300/50'}`}
            >
              <Boxes size={14} /> Wireframe {isWireframe ? 'ON' : 'OFF'}
            </button>
            {/* Hide Toggle */}
            <button 
              onClick={() => setIsHide(!isHide)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] lg:text-xs font-mono uppercase transition-all font-black tracking-widest whitespace-nowrap ${isHide ? 'bg-amber-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-300/50'}`}
            >
              {isHide ? <Eye size={14} /> : <EyeOff size={14} />} {isHide ? 'SHOW' : 'HIDE'} UI
            </button>
          </div>
        </nav>

        {/* View Mode Switcher (only show if not wireframe locked) */}
        {!isWireframe && (
          <div className="no-print flex justify-center p-2 bg-white/40 border-b border-slate-100 backdrop-blur-sm z-20">
            <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button onClick={() => setViewMode('2D')} className={`flex items-center gap-2 px-4 lg:px-6 py-1.5 rounded-lg text-[10px] lg:text-xs font-mono uppercase transition-all font-black tracking-widest ${viewMode === '2D' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}><Layout size={12} /> 2D Flat</button>
              <button onClick={() => setViewMode('3D')} className={`flex items-center gap-2 px-4 lg:px-6 py-1.5 rounded-lg text-[10px] lg:text-xs font-mono uppercase transition-all font-black tracking-widest ${viewMode === '3D' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}><Box size={12} /> 3D Assembly</button>
            </div>
          </div>
        )}

        <div id="main-view-container" className="flex-1 relative bg-white overflow-hidden">
          {viewMode === '2D' ? (
            <DraftingView2D dimensions={dimensions} isMetric={isMetric} key={`draft-2d-${viewResetKey}`} />
          ) : (
            <BoxViewer3D 
              dimensions={dimensions} 
              foldProgress={foldProgress} 
              isWireframe={isWireframe} 
              isMetric={isMetric} 
              key={`assemble-3d-${viewResetKey}`} 
            />
          )}
          
          <div className={`absolute bottom-2 lg:bottom-4 right-2 lg:right-4 pointer-events-none scale-75 lg:scale-100 origin-bottom-right transition-all duration-300 ${isHide ? 'opacity-0 translate-y-10' : 'opacity-100 translate-y-0'}`}>
            <TitleBlock info={titleBlock} onEdit={() => setShowSettings(true)} />
          </div>
        </div>

        {/* 3D Animation Controls */}
        {viewMode === '3D' && !isWireframe && (
          <div className="no-print h-20 lg:h-28 border-t border-slate-200 bg-white px-4 lg:px-10 flex items-center gap-4 lg:gap-10 z-10 shadow-inner">
            <div className="flex items-center gap-2 lg:gap-4">
              <button onClick={() => { setFoldProgress(0); setIsPlaying(false); }} className="p-2 lg:p-4 text-slate-400 border border-slate-200 rounded-lg lg:rounded-2xl hover:bg-slate-50 transition-colors"><RotateCcw size={18} /></button>
              <div className="flex gap-1">
                <button onClick={() => { setFoldProgress(p => Math.max(0, p - 0.05)); setIsPlaying(false); }} className="p-2 lg:p-4 text-slate-400 border border-slate-200 rounded-lg lg:rounded-2xl hover:bg-slate-50 transition-colors"><ChevronLeft size={18} /></button>
                <button onClick={() => setIsPlaying(!isPlaying)} className="w-12 h-12 lg:w-20 lg:h-20 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-700 active:scale-95 transition-all">
                  {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} className="ml-0.5" fill="currentColor" />}
                </button>
                <button onClick={() => { setFoldProgress(p => Math.min(1, p + 0.05)); setIsPlaying(false); }} className="p-2 lg:p-4 text-slate-400 border border-slate-200 rounded-lg lg:rounded-2xl hover:bg-slate-50 transition-colors"><ChevronRight size={18} /></button>
              </div>
            </div>
            <div className="flex-1">
              <input 
                type="range" min="0" max="1" step="0.001" value={foldProgress} 
                onChange={(e) => { setFoldProgress(parseFloat(e.target.value)); setIsPlaying(false); }} 
                className="w-full h-2 lg:h-4 bg-slate-100 rounded-full appearance-none accent-blue-600 cursor-pointer" 
              />
              <div className="flex justify-between mt-2 text-[8px] lg:text-[11px] font-mono text-slate-400 uppercase font-black tracking-widest">
                <span>Flat State</span>
                <span>Assembled Unit</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Export & Settings Modals */}
      {showExportModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 shadow-2xl">
            <header className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-sm flex items-center gap-2 text-slate-900 uppercase tracking-widest"><FileText className="text-blue-600" size={18} /> Export CAD</h3>
              <button onClick={() => { setShowExportModal(false); setExportStep('confirm'); }} className="text-slate-400 p-2 hover:text-slate-900 transition-colors"><X size={24}/></button>
            </header>
            <div className="p-6">
              {exportStep === 'confirm' ? (
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle2 size={32} /></div>
                  <h4 className="text-xl font-black mb-2 uppercase tracking-tighter">Ready for Production</h4>
                  <p className="text-slate-500 text-xs mb-8 font-medium px-4">Generate engineering documents for manufacture.</p>
                  <div className="flex gap-2">
                    <button onClick={() => setShowExportModal(false)} className="flex-1 py-4 border border-slate-200 rounded-xl font-black text-slate-400 uppercase text-[9px] hover:bg-slate-50">Cancel</button>
                    <button onClick={() => setExportStep('format')} className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-black uppercase text-[9px] hover:bg-blue-700 shadow-lg shadow-blue-100">Continue</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <button onClick={() => downloadFile('pdf')} className="w-full flex items-center gap-4 p-5 border border-slate-200 rounded-2xl hover:bg-blue-50 transition-all text-left group">
                    <div className="bg-red-50 text-red-600 p-3 rounded-xl group-hover:bg-red-100 transition-colors"><FileText size={24} /></div>
                    <div><div className="font-black text-slate-900 uppercase text-xs">PDF Vector</div><div className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">Scale: 1:1 Industry Print</div></div>
                  </button>
                  <button onClick={() => downloadFile('png')} className="w-full flex items-center gap-4 p-5 border border-slate-200 rounded-2xl hover:bg-blue-50 transition-all text-left group">
                    <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl group-hover:bg-emerald-100 transition-colors"><Download size={24} /></div>
                    <div><div className="font-black text-slate-900 uppercase text-xs">PNG Raster</div><div className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">4X High-Resolution Guide</div></div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 shadow-2xl">
            <header className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-sm flex items-center gap-2 text-slate-900 uppercase tracking-widest"><Settings className="text-blue-600" size={18} /> Lab Registry</h3>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 p-2 hover:text-slate-900 transition-colors"><X size={24} /></button>
            </header>
            <div className="p-6 space-y-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-[8px] uppercase font-mono text-slate-400 mb-1 font-black">Corporation</label>
                  <input type="text" value={titleBlock.companyName} onChange={(e) => setTitleBlock({...titleBlock, companyName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-xs focus:ring-2 focus:ring-blue-600/30 outline-none transition-all" />
                </div>
                <div className="w-20">
                  <label className="block text-[8px] uppercase font-mono text-slate-400 mb-1 font-black text-center">Seal</label>
                  <label className="flex flex-col items-center justify-center w-full h-12 bg-blue-50 border border-dashed border-blue-200 rounded-xl cursor-pointer hover:bg-blue-100 transition-colors shadow-inner"><Upload size={16} className="text-blue-600" /><input type="file" className="hidden" onChange={handleLogoUpload} accept="image/*" /></label>
                </div>
              </div>
              <div>
                <label className="block text-[8px] uppercase font-mono text-slate-400 mb-1 font-black">Address</label>
                <input type="text" value={titleBlock.address} onChange={(e) => setTitleBlock({...titleBlock, address: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-xs focus:ring-2 focus:ring-blue-600/30 outline-none transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[8px] uppercase font-mono text-slate-400 mb-1 font-black">Designer</label>
                  <input type="text" value={titleBlock.designer} onChange={(e) => setTitleBlock({...titleBlock, designer: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-xs focus:ring-2 focus:ring-blue-600/30 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-[8px] uppercase font-mono text-slate-400 mb-1 font-black">Job ID #</label>
                  <input type="text" value={titleBlock.jobNumber} onChange={(e) => setTitleBlock({...titleBlock, jobNumber: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-xs focus:ring-2 focus:ring-blue-600/30 outline-none transition-all" />
                </div>
              </div>
            </div>
            <footer className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-2">
              <button onClick={() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(titleBlock)); setShowSettings(false); }} className="flex-1 bg-slate-900 text-white font-mono text-[10px] p-4 rounded-xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-slate-200">Update Data</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;