import React from 'react';
import { useColumnVisibility } from '../contexts/ColumnVisibilityContext';
import { getColumnHeaders } from '../utils/columnHeaders';

interface ColumnVisibilityControlsProps {
  race: any;
  gameType: string;
}

const ColumnVisibilityControls: React.FC<ColumnVisibilityControlsProps> = ({ race, gameType }) => {
  const { hiddenColumns, toggleColumnVisibility, resetToDefaults, toggleAll } = useColumnVisibility();

  const columnHeaders = getColumnHeaders(race, gameType);

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200 p-4 mb-4 shadow-sm">
      <details className="group">
        <summary className="cursor-pointer flex items-center justify-between text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 transform group-open:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span>Column Settings</span>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded">
              {columnHeaders.length - hiddenColumns.size}/{columnHeaders.length} visible
            </span>
          </div>
        </summary>
        
        <div className="mt-4 space-y-4">
          {/* Control buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={resetToDefaults}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-3 py-1.5 rounded-lg transition-colors border border-slate-200"
            >
              Reset to Default
            </button>
            <button
              onClick={toggleAll}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-3 py-1.5 rounded-lg transition-colors border border-slate-200"
            >
              {hiddenColumns.size === 0 ? 'Hide All Optional' : 'Show All'}
            </button>
          </div>
          
          {/* Column checkboxes */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {columnHeaders.map(header => (
              <label key={header} className="flex items-center space-x-2 text-xs cursor-pointer hover:bg-slate-50 p-1 rounded">
                <input
                  type="checkbox"
                  checked={!hiddenColumns.has(header)}
                  onChange={() => toggleColumnVisibility(header)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                />
                <span className="text-slate-700 font-medium">{header}</span>
              </label>
            ))}
          </div>
        </div>
      </details>
    </div>
  );
};

export default ColumnVisibilityControls;
