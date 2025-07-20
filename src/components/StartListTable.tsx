import React, { useState, useEffect } from 'react';
import { useColumnVisibility } from '../contexts/ColumnVisibilityContext';
import { getColumnHeaders } from '../utils/columnHeaders';

interface HorseData {
  startNumber: number;
  horse: {
    name: string;
    place: number | null;
    odds: string;
  };
  driver: {
    name: string;
  };
  trainer?: {
    name: string;
  };
  bettingPercentage: number | "N/A";
  bettingPercentagePoints: number;
  headToHeadPoints: number;
  h2hMeetings: any[];
  driverPoints: number;
  trainerPoints: number;
  formPoints: number;
  equipmentPoints: number;
  equipmentDescription: string;
  weightAdjustedRatingPoints?: number; // Gallop specific
  earningsPerStartCurrentYearPoints?: number; // Gallop specific
  earningsPerStartLastTwoYearsPoints?: number; // Gallop specific
  startPositionPoints?: number; // Trot specific
  timePerformanceLastTenStartsPoints?: number; // Trot specific
  timePerformanceLastTenStartsTooltip?: string; // Trot specific
  classPoints?: number; // Trot specific
  totalPoints: number;
  mlPoints: number;
  mlUpsetScore: number;
  folkRank?: number;
  mlRank?: number;
  mlUpsetRank?: number;
  scratched: boolean;
}

interface StartListTableProps {
  horses: HorseData[];
  race: any; // Full race object to get sport, distance, startMethod etc.
  gameType: string; // Bet type (V4, V75, Vinnare, etc.)
}

const StartListTable: React.FC<StartListTableProps> = ({ horses, race, gameType }) => {
  const [sortedHorses, setSortedHorses] = useState<HorseData[]>([]);
  const [sortColumn, setSortColumn] = useState<string | null>('Rank');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Use global column visibility state
  const { hiddenColumns } = useColumnVisibility();

  const isGallop = race.sport?.toLowerCase() === "gallop";

  useEffect(() => {
    // Apply default sorting by Rank when horses data changes
    if (horses.length > 0) {
      const sorted = [...horses].sort((a, b) => {
        const valA = a.mlRank;
        const valB = b.mlRank;
        
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        
        return valA - valB; // Ascending order for rank
      });
      
      setSortedHorses(sorted);
      setSortColumn('Rank');
      setSortDirection('asc');
    } else {
      setSortedHorses(horses);
    }
  }, [horses]);

  const handleSort = (column: string) => {
    const isAsc = sortColumn === column && sortDirection === 'asc';
    const direction = isAsc ? 'desc' : 'asc';

    const sorted = [...horses].sort((a, b) => {
      let valA: any;
      let valB: any;

      switch (column) {
        case "Res":
          valA = a.horse.place;
          valB = b.horse.place;
          break;
        case "Rank":
          valA = a.mlRank;
          valB = b.mlRank;
          break;
        case "Points":
          valA = a.mlPoints;
          valB = b.mlPoints;
          break;
        case "👥":
          valA = a.folkRank;
          valB = b.folkRank;
          break;
        case "Nr":
          valA = a.startNumber;
          valB = b.startNumber;
          break;
        case "Horse Name":
          valA = a.horse.name;
          valB = b.horse.name;
          break;
        case "Driver/Jockey":
        case "Driver":
        case "Jockey":
          valA = a.driver.name;
          valB = b.driver.name;
          break;
        case "Driver Pts":
          valA = a.driverPoints;
          valB = b.driverPoints;
          break;
        case "Odds":
          valA = parseFloat(a.horse.odds);
          valB = parseFloat(b.horse.odds);
          break;
        case "%":
          // Handle betting percentage which might be number, string number, or "N/A"
          if (a.bettingPercentage === "N/A") {
            valA = -1;
          } else if (typeof a.bettingPercentage === 'number') {
            valA = a.bettingPercentage;
          } else {
            valA = parseFloat(String(a.bettingPercentage)) || -1;
          }
          
          if (b.bettingPercentage === "N/A") {
            valB = -1;
          } else if (typeof b.bettingPercentage === 'number') {
            valB = b.bettingPercentage;
          } else {
            valB = parseFloat(String(b.bettingPercentage)) || -1;
          }
          break;
        case "Public":
          valA = a.bettingPercentagePoints;
          valB = b.bettingPercentagePoints;
          break;
        case "Form":
          valA = a.formPoints;
          valB = b.formPoints;
          break;
        case "H2H":
          valA = a.headToHeadPoints;
          valB = b.headToHeadPoints;
          break;
        case "Trainer":
          // Sort by trainer name alphabetically
          valA = a.trainer?.name || 'ZZZ'; // Put missing trainer names at the end
          valB = b.trainer?.name || 'ZZZ';
          break;
        case "Trainer Pts":
          valA = a.trainerPoints;
          valB = b.trainerPoints;
          break;
        case "Equipment":
          valA = a.equipmentPoints;
          valB = b.equipmentPoints;
          break;
        case "Rating": // Gallop specific
          valA = a.weightAdjustedRatingPoints;
          valB = b.weightAdjustedRatingPoints;
          break;
        case "$/start this year": // Gallop specific
          valA = a.earningsPerStartCurrentYearPoints;
          valB = b.earningsPerStartCurrentYearPoints;
          break;
        case "$/start 2 years": // Gallop specific
          valA = a.earningsPerStartLastTwoYearsPoints;
          valB = b.earningsPerStartLastTwoYearsPoints;
          break;
        case "Time 10 Starts": // Trot specific
          valA = a.timePerformanceLastTenStartsPoints;
          valB = b.timePerformanceLastTenStartsPoints;
          break;
        case "Starting Position": // Trot specific
          valA = a.startPositionPoints;
          valB = b.startPositionPoints;
          break;
        case "Class": // Trot specific
          valA = a.classPoints;
          valB = b.classPoints;
          break;
        default:
          // Handle dynamic betting percentage headers (e.g., "V4 %", "V75 %")
          if (column.endsWith(" %")) {
            // Handle betting percentage which might be number, string number, or "N/A"
            if (a.bettingPercentage === "N/A") {
              valA = -1;
            } else if (typeof a.bettingPercentage === 'number') {
              valA = a.bettingPercentage;
            } else {
              valA = parseFloat(String(a.bettingPercentage)) || -1;
            }
            
            if (b.bettingPercentage === "N/A") {
              valB = -1;
            } else if (typeof b.bettingPercentage === 'number') {
              valB = b.bettingPercentage;
            } else {
              valB = parseFloat(String(b.bettingPercentage)) || -1;
            }
          } else {
            return 0;
          }
          break;
      }

      if (valA === null || valA === undefined) return direction === 'asc' ? 1 : -1;
      if (valB === null || valB === undefined) return direction === 'asc' ? -1 : 1;

      if (typeof valA === 'string' && typeof valB === 'string') {
        return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else {
        return direction === 'asc' ? valA - valB : valB - valA;
      }
    });

    setSortedHorses(sorted);
    setSortColumn(column);
    setSortDirection(direction);
  };

  const formatBettingPercentage = (value: number | "N/A") => {
    if (typeof value === 'number') {
      return value.toFixed(2).replace(".", ",");
    }
    return value;
  };

  const columnHeaders = getColumnHeaders(race, gameType);

  // Filter visible columns
  const visibleHeaders = columnHeaders.filter(header => !hiddenColumns.has(header));

  const renderCell = (header: string, horse: HorseData) => {
    switch (header) {
      case "Res":
        return (
          <td key={header} className="py-4 px-4 text-sm font-medium text-slate-700 text-center">
            {horse.horse.place && (
              <div className="flex items-center justify-center">
                {horse.horse.place === 1 && <span className="text-yellow-600 font-bold">🥇</span>}
                {horse.horse.place === 2 && <span className="text-gray-600 font-bold">🥈</span>}
                {horse.horse.place === 3 && <span className="text-orange-600 font-bold">🥉</span>}
                {horse.horse.place > 3 && <span className="font-semibold">{horse.horse.place}</span>}
              </div>
            )}
          </td>
        );
      case "Rank":
        return (
          <td key={header} className="py-4 px-4 text-sm font-semibold text-slate-800 text-center">
            <div className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full text-xs font-bold mx-auto">
              {horse.mlRank}
            </div>
          </td>
        );
      case "Points":
        return (
          <td key={header} className="py-4 px-4 text-sm font-bold text-slate-800 text-center">
            <div className="inline-block bg-slate-100 px-3 py-1 rounded-full">{horse.mlPoints.toFixed(0)}</div>
          </td>
        );
      case "👥":
        return (
          <td key={header} className="py-4 px-4 text-sm font-medium text-slate-700 text-center">
            {horse.folkRank}
          </td>
        );
      case "Nr":
        return (
          <td key={header} className="py-4 px-4 text-sm font-bold text-slate-800 text-center">
            <div className="inline-flex items-center justify-center w-8 h-8 bg-slate-200 text-slate-700 rounded-full text-xs font-bold mx-auto">
              {horse.startNumber}
            </div>
          </td>
        );
      case "Horse Name":
        return (
          <td key={header} className="py-4 px-4 text-sm text-slate-800">
            <div className="flex items-center space-x-2">
              <span className="font-semibold whitespace-nowrap">{horse.horse.name}</span>
              <div className="flex space-x-1">
                {Math.round(horse.mlUpsetScore) >= (isGallop ? 83 : 85) && horse.bettingPercentagePoints < 60 && 
                  <span title={`High upset potential (ML Upset Score ${horse.mlUpsetScore.toFixed(0)}, Upset Rank ${horse.mlUpsetRank})`} className="text-lg">🔥🔥🔥</span>}
                {Math.round(horse.mlUpsetScore) >= (isGallop ? 77 : 80) && Math.round(horse.mlUpsetScore) < (isGallop ? 83 : 85) && horse.bettingPercentagePoints < 60 && 
                  <span title={`High upset potential (ML Upset Score ${horse.mlUpsetScore.toFixed(0)}, Upset Rank ${horse.mlUpsetRank})`} className="text-lg">🔥🔥</span>}
                {Math.round(horse.mlUpsetScore) >= (isGallop ? 70 : 75) && Math.round(horse.mlUpsetScore) < (isGallop ? 77 : 80) && horse.bettingPercentagePoints < 60 && 
                  <span title={`High upset potential (ML Upset Score ${horse.mlUpsetScore.toFixed(0)}, Upset Rank ${horse.mlUpsetRank})`} className="text-lg">🔥</span>}
              </div>
            </div>
          </td>
        );
      case "Driver/Jockey":
      case "Driver":
      case "Jockey":
        return <td key={header} className="py-4 px-4 text-sm text-slate-700 text-left min-w-[120px] whitespace-nowrap">{horse.driver.name}</td>;
      case "Trainer":
        return <td key={header} className="py-4 px-4 text-sm text-slate-700 text-left min-w-[120px] whitespace-nowrap">{horse.trainer?.name || 'N/A'}</td>;
      case "Odds":
        return (
          <td key={header} className="py-4 px-4 text-sm font-medium text-slate-800 text-center">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">{horse.horse.odds}</span>
          </td>
        );
      case "%":
        return <td key={header} className="py-4 px-4 text-sm text-slate-700 text-center">{formatBettingPercentage(horse.bettingPercentage)}</td>;
      case "Public":
        return <td key={header} className="py-4 px-4 text-sm text-slate-700 text-center">{horse.bettingPercentagePoints}</td>;
      case "Form":
        return <td key={header} className="py-4 px-4 text-sm text-slate-700 text-center">{horse.formPoints}</td>;
      case "H2H":
        return <td key={header} className="py-4 px-4 text-sm text-slate-700 text-center">{horse.headToHeadPoints}</td>;
      case "Driver Pts":
        return <td key={header} className="py-4 px-4 text-sm text-slate-700 text-center">{horse.driverPoints}</td>;
      case "Trainer Pts":
        return <td key={header} className="py-4 px-4 text-sm text-slate-700 text-center">{horse.trainerPoints}</td>;
      case "Equipment":
        return <td key={header} className="py-4 px-4 text-sm text-slate-700 text-center">{horse.equipmentPoints}</td>;
      case "Rating":
        return <td key={header} className="py-4 px-4 text-sm text-slate-700 text-center">{horse.weightAdjustedRatingPoints}</td>;
      case "$/start this year":
        return <td key={header} className="py-4 px-4 text-sm text-slate-700 text-center">{horse.earningsPerStartCurrentYearPoints}</td>;
      case "$/start 2 years":
        return <td key={header} className="py-4 px-4 text-sm text-slate-700 text-center">{horse.earningsPerStartLastTwoYearsPoints}</td>;
      case "Time 10 Starts":
        return <td key={header} className="py-4 px-4 text-sm text-slate-700 text-center">{horse.timePerformanceLastTenStartsPoints}</td>;
      case "Starting Position":
        return <td key={header} className="py-4 px-4 text-sm text-slate-700 text-center">{horse.startPositionPoints}</td>;
      case "Class":
        return <td key={header} className="py-4 px-4 text-sm text-slate-700 text-center">{horse.classPoints}</td>;
      default:
        // Handle dynamic betting percentage headers (e.g., "V4 %", "V75 %")
        if (header.endsWith(" %")) {
          return <td key={header} className="py-4 px-4 text-sm text-slate-700 text-center">{formatBettingPercentage(horse.bettingPercentage)}</td>;
        }
        return <td key={header} className="py-4 px-4 text-sm text-slate-700 text-center">-</td>;
    }
  };

  return (
    <div className="p-8 relative z-10">
      <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-slate-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                {visibleHeaders.map((header) => (
                  <th
                    key={header}
                    className={`py-4 px-4 text-xs font-bold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-200/50 transition-all duration-200 group ${
                      header === 'Driver/Jockey' || header === 'Driver' || header === 'Jockey' || header === 'Trainer' || header === 'Horse Name' ? 'text-left min-w-[120px]' : header === '👥' || header === 'Rank' || header === 'Points' || header === 'Nr' || header === 'Odds' || header === '%' || header.endsWith(' %') ? 'text-right' : 'text-center'
                    }`}
                    onClick={() => handleSort(header)}
                  >
                    <div className={`flex items-center space-x-2 ${
                      header === 'Driver/Jockey' || header === 'Driver' || header === 'Jockey' || header === 'Trainer' || header === 'Horse Name' ? 'justify-start' : header === '👥' || header === 'Rank' || header === 'Points' || header === 'Nr' || header === 'Odds' || header === '%' || header.endsWith(' %') ? 'justify-end' : 'justify-center'
                    }`}>
                      <span className={header === '👥' ? 'text-base' : ''}>{header}</span>
                      {sortColumn === header && (
                        <span className="text-blue-500 font-bold">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                      <svg className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                      </svg>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>            <tbody>
            {sortedHorses.map((horse) => {
              const scoreVal = Number(horse.mlPoints.toFixed(0));
              let rowClass = "transition-all duration-200 hover:bg-slate-50/50";
              
              // Score-based row coloring with modern colors
              if (isGallop) {
                if (scoreVal >= 68) rowClass += " bg-emerald-50/70 border-l-4 border-emerald-400";
                else if (scoreVal >= 50) rowClass += " bg-blue-50/70 border-l-4 border-blue-400";
                else if (scoreVal >= 32) rowClass += " bg-amber-50/70 border-l-4 border-amber-400";
                else rowClass += " bg-red-50/70 border-l-4 border-red-400";
              } else {
                if (scoreVal >= 72) rowClass += " bg-emerald-50/70 border-l-4 border-emerald-400";
                else if (scoreVal >= 57) rowClass += " bg-blue-50/70 border-l-4 border-blue-400";
                else if (scoreVal >= 44) rowClass += " bg-amber-50/70 border-l-4 border-amber-400";
                else rowClass += " bg-red-50/70 border-l-4 border-red-400";
              }

              if (horse.scratched) {
                rowClass += " line-through opacity-60";
              }

              // Podium highlighting
              if (horse.horse.place === 1) rowClass += " bg-gradient-to-r from-yellow-100 to-yellow-200 border-l-4 border-yellow-500";
              else if (horse.horse.place === 2) rowClass += " bg-gradient-to-r from-gray-100 to-gray-200 border-l-4 border-gray-500";
              else if (horse.horse.place === 3) rowClass += " bg-gradient-to-r from-orange-100 to-orange-200 border-l-4 border-orange-500";

              return (
                <React.Fragment key={horse.startNumber}>
                  <tr className={`border-b border-slate-200/50 ${rowClass}`}>
                    {visibleHeaders.map(header => renderCell(header, horse))}
                  </tr>
                  {/* Expandable details row */}
                  <tr className="details-row hidden">
                    <td colSpan={visibleHeaders.length} className="p-6 bg-gradient-to-r from-blue-50/50 to-slate-50/50 text-sm text-slate-700 border-b border-slate-200/50">
                      <div className="space-y-3">
                        {horse.equipmentDescription && (
                          <div className="flex items-start space-x-2">
                            <span className="font-semibold text-slate-800">⚙️ Equipment:</span>
                            <span>{horse.equipmentDescription}</span>
                          </div>
                        )}
                        {horse.timePerformanceLastTenStartsTooltip && (
                          <div className="flex items-start space-x-2">
                            <span className="font-semibold text-slate-800">⏱️ Time points last 10 starts:</span>
                            <span>{horse.timePerformanceLastTenStartsTooltip}</span>
                          </div>
                        )}
                        {horse.h2hMeetings && horse.h2hMeetings.length > 0 && (
                          <div>
                            <div className="font-semibold text-slate-800 mb-2">🥊 H2H meetings:</div>
                            <ul className="space-y-1 ml-4">
                              {horse.h2hMeetings.map((m, idx) => (
                                <li key={idx} className="text-xs bg-white rounded px-2 py-1 border border-slate-200">
                                  {m.raceId}: {m.result} ({m.selfPosition} vs {m.opponentPosition}) against {m.opponent} (strength {m.opponentBettingPoints ?? 0})
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
            </tbody>
        </table>
      </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-4 justify-center">
        <button
          className="group flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          onClick={() => console.log("Copy to clipboard (Not implemented yet)")}
        >
          <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
          <span>Copy Start List</span>
        </button>
        
        <button
          className="group flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          onClick={() => console.log("Download CSV (Not implemented yet)")}
        >
          <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Download CSV</span>
        </button>
      </div>
    </div>
  );
};

export default StartListTable;
