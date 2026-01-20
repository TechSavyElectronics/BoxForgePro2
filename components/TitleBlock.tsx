
import React from 'react';
import { TitleBlockInfo } from '../types';

interface TitleBlockProps {
  info: TitleBlockInfo;
  onEdit: () => void;
}

export const TitleBlock: React.FC<TitleBlockProps> = ({ info, onEdit }) => {
  return (
    <div 
      className="absolute bottom-4 right-4 bg-white border-2 border-slate-300 w-80 p-0 text-[10px] font-mono leading-tight uppercase group cursor-pointer hover:border-blue-500 transition-colors shadow-sm"
      onClick={onEdit}
    >
      <div className="grid grid-cols-4 border-b border-slate-200">
        <div className="col-span-1 border-r border-slate-200 p-2 flex items-center justify-center bg-slate-50">
          {info.logoUrl ? (
            <img src={info.logoUrl} alt="Logo" className="max-h-8 max-w-full" />
          ) : (
            <div className="text-slate-400 italic">LOGO</div>
          )}
        </div>
        <div className="col-span-3 p-2">
          <div className="text-slate-900 font-bold text-xs">{info.companyName}</div>
          <div className="text-slate-500 text-[9px]">{info.address}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 text-slate-900">
        <div className="border-r border-slate-200 p-1 px-2 border-b">
          <span className="text-slate-400 mr-2">DESIGNER:</span>
          <span className="font-semibold">{info.designer}</span>
        </div>
        <div className="p-1 px-2 border-b">
          <span className="text-slate-400 mr-2">JOB #:</span>
          <span className="font-semibold">{info.jobNumber}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 text-slate-900">
        <div className="border-r border-slate-200 p-1 px-2">
          <span className="text-slate-400 mr-2">SCALE:</span>
          <span>1:1 (UNITS: IN)</span>
        </div>
        <div className="p-1 px-2">
          <span className="text-slate-400 mr-2">DATE:</span>
          <span>{new Date().toLocaleDateString()}</span>
        </div>
      </div>
      <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
        <span className="bg-blue-600 text-white px-2 py-1 rounded text-[8px] font-bold">CLICK TO EDIT</span>
      </div>
    </div>
  );
};
