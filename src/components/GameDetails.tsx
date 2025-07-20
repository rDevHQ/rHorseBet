import React from 'react';
import useTransformedGameDetails from '../hooks/useTransformedGameDetails';
import StartListTable from './StartListTable';
import ColumnVisibilityControls from './ColumnVisibilityControls';

interface GameDetailsProps {
  gameId: string;
  gameType: string;
}

const GameDetails: React.FC<GameDetailsProps> = ({ gameId, gameType }) => {
  const { transformedRaces, loading, error } = useTransformedGameDetails(gameId, gameType);

  // Define which bet types are multi-race (show leg numbers)
  const isMultiRaceBetType = (betType: string): boolean => {
    const multiRaceTypes = ['V75', 'V86', 'V65', 'V64', 'GS75', 'V85', 'V5', 'V4', 'V3'];
    return multiRaceTypes.includes(betType.toUpperCase());
  };

  if (loading) {
    return (
      <div className="group mb-8">
        <div className="bg-gradient-to-r from-white/80 to-slate-50/80 backdrop-blur-sm rounded-3xl shadow-xl border border-slate-200/50 p-8 transition-all duration-300">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
              Race Analysis & Insights
            </h2>
            <p className="text-slate-500 text-sm">Advanced horse racing analytics powered by AI</p>
          </div>
          
          <div className="text-center py-16">
            <div className="relative mb-8">
              <div className="w-24 h-24 mx-auto relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 rounded-full animate-spin"></div>
                <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center shadow-inner">
                  <span className="text-4xl animate-pulse">📊</span>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-200/20 to-pink-200/20 rounded-full animate-ping"></div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-700">Analyzing Race Data</h3>
              <div className="max-w-2xl mx-auto space-y-3">
                <div className="flex items-center justify-center space-x-3 text-slate-600">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                  <span>Processing horse performance statistics</span>
                </div>
                <div className="flex items-center justify-center space-x-3 text-slate-600">
                  <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <span>Calculating form ratings and betting percentages</span>
                </div>
                <div className="flex items-center justify-center space-x-3 text-slate-600">
                  <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <span>Analyzing head-to-head comparisons</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="group mb-8">
        <div className="bg-gradient-to-r from-white/80 to-red-50/80 backdrop-blur-sm rounded-3xl shadow-xl border border-red-200/50 p-8 transition-all duration-300">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
              Race Analysis & Insights
            </h2>
            <p className="text-slate-500 text-sm">Advanced horse racing analytics powered by AI</p>
          </div>
          
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-r from-red-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
              <span className="text-white text-5xl">⚠️</span>
            </div>
            <h3 className="text-xl font-bold text-red-600 mb-4">Analysis Failed</h3>
            <div className="bg-red-50 rounded-2xl p-6 max-w-md mx-auto">
              <p className="text-red-700 font-medium mb-2">Unable to load race data</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!transformedRaces || transformedRaces.length === 0) {
    return (
      <div className="group mb-8">
        <div className="bg-gradient-to-r from-white/80 to-slate-50/80 backdrop-blur-sm rounded-3xl shadow-xl border border-slate-200/50 p-8 transition-all duration-300">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
              Race Analysis & Insights
            </h2>
            <p className="text-slate-500 text-sm">Advanced horse racing analytics powered by AI</p>
          </div>
          
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-r from-slate-200 to-slate-300 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <span className="text-slate-500 text-3xl">📋</span>
            </div>
            <p className="text-slate-600 font-semibold text-lg mb-2">No Race Data Available</p>
            <p className="text-slate-500">Please select a different game or check back later.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {transformedRaces.map((race, index) => (
        <div key={race.id} className="group" data-race-index={index}>
          <div className="bg-gradient-to-r from-white/80 to-slate-50/80 backdrop-blur-sm rounded-3xl shadow-xl border border-slate-200/50 overflow-hidden transition-all duration-300 hover:shadow-2xl">
            
            {/* Race Header */}
            <div className="relative bg-gradient-to-r from-slate-800 to-slate-700 p-6 text-white">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold">{race.number}</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-1">
                      {isMultiRaceBetType(gameType) ? `Leg ${index + 1}` : race.name}
                    </h3>
                    <p className="text-slate-200 flex items-center space-x-4">
                      <span className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{new Date(race.startTime).toLocaleTimeString('sv-SE', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{race.distance}m</span>
                      </span>
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center space-x-2 bg-white/20 rounded-full px-4 py-2">
                    <span className="text-2xl">🏇</span>
                    <span className="font-semibold">{race.horses.length} horses</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Column Visibility Controls */}
            <ColumnVisibilityControls race={race} gameType={gameType} />

            {/* Horses Table */}
            <StartListTable horses={race.horses} race={race} gameType={gameType} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default GameDetails;
