import React from 'react';
import useGames from '../hooks/useGames';

interface BetTypeListProps {
  currentDate: Date;
  selectedTrackId: string;
  onGameSelect: (gameId: string, gameType: string) => void;
  selectedGameId: string | null;
}

const BetTypeList: React.FC<BetTypeListProps> = ({ currentDate, selectedTrackId, onGameSelect, selectedGameId }) => {
  const { games, loading, error } = useGames(currentDate, selectedTrackId);

  if (loading) {
    return (
      <div className="group mb-8">
        <div className="bg-gradient-to-r from-white/80 to-slate-50/80 backdrop-blur-sm rounded-3xl shadow-xl border border-slate-200/50 p-6 transition-all duration-300">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
              Available Bet Types
            </h2>
            <p className="text-slate-500 text-sm">Select a game type to analyze</p>
          </div>
          <div className="text-center py-12">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-blue-500 mx-auto mb-6"></div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-pulse"></div>
            </div>
            <p className="text-slate-600 font-medium">Loading bet types...</p>
            <p className="text-slate-400 text-sm mt-1">Please wait while we fetch available games</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="group mb-8">
        <div className="bg-gradient-to-r from-white/80 to-slate-50/80 backdrop-blur-sm rounded-3xl shadow-xl border border-red-200/50 p-6 transition-all duration-300">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
              Available Bet Types
            </h2>
            <p className="text-slate-500 text-sm">Select a game type to analyze</p>
          </div>
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-r from-red-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="text-white text-3xl">⚠️</span>
            </div>
            <p className="text-red-600 font-semibold text-lg mb-2">Unable to Load Bet Types</p>
            <p className="text-slate-600 bg-red-50 rounded-xl px-4 py-2 inline-block">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group mb-8">
      <div className="bg-gradient-to-r from-white/80 to-slate-50/80 backdrop-blur-sm rounded-3xl shadow-xl border border-slate-200/50 p-6 transition-all duration-300 hover:shadow-2xl">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
            Available Bet Types
          </h2>
          <p className="text-slate-500 text-sm">Select a game type to analyze races and horses</p>
        </div>
        
        {games.length > 0 ? (
          <>
            {/* Vinnare Games Section */}
            {(() => {
              const vinnareGames = games.filter(game => game.type.toLowerCase() === 'vinnare');
              return vinnareGames.length > 0 ? (
                <div className="mb-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3">
                    {vinnareGames.map((game, index) => (
                      <div
                        key={game.id}
                        className={`group/card relative overflow-hidden rounded-lg cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
                          selectedGameId === game.id 
                            ? 'ring-2 ring-blue-400/50 shadow-lg' 
                            : 'hover:shadow-md'
                        }`}
                        onClick={() => onGameSelect(game.id, game.type)}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className={`relative p-3 h-full transition-all duration-300 ${
                          selectedGameId === game.id
                            ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                            : 'bg-gradient-to-br from-white to-slate-50 hover:from-slate-50 hover:to-white border border-slate-200 text-slate-800'
                        }`}>
                          
                          {/* Background pattern */}
                          <div className="absolute inset-0 opacity-5">
                            <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-current to-transparent rounded-full transform translate-x-4 -translate-y-4"></div>
                            <div className="absolute bottom-0 left-0 w-10 h-10 bg-gradient-to-tr from-current to-transparent rounded-full transform -translate-x-2 translate-y-2"></div>
                          </div>
                          
                          {/* Game type icon and label */}
                          <div className="relative z-10 text-center">
                            <div className={`w-10 h-10 mx-auto mb-2 rounded-lg flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                              selectedGameId === game.id
                                ? 'bg-white/20 text-white shadow-lg'
                                : 'bg-gradient-to-br from-blue-100 to-purple-100 text-blue-600 group-hover/card:from-blue-200 group-hover/card:to-purple-200'
                            }`}>
                              {game.type.toLowerCase() === 'vinnare' ? game.raceNumber || '?' : (game.type.length > 4 ? game.type.substring(0, 4).toUpperCase() : game.type.toUpperCase())}
                            </div>
                            
                            <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                              selectedGameId === game.id
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-100 text-slate-600 group-hover/card:bg-slate-200'
                            }`}>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>
                                {new Date(game.startTime).toLocaleTimeString('sv-SE', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                            </div>
                          </div>
                          
                          {/* Selected indicator */}
                          {selectedGameId === game.id && (
                            <div className="absolute top-1.5 right-1.5">
                              <div className="w-4 h-4 bg-white/30 rounded-full flex items-center justify-center">
                                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          )}
                          
                          {/* Hover effect indicator */}
                          <div className={`absolute inset-x-0 bottom-0 h-1 transition-all duration-300 ${
                            selectedGameId === game.id
                              ? 'bg-white/40'
                              : 'bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover/card:opacity-100'
                          }`}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}

            {/* Other Bet Types Section */}
            {(() => {
              const otherGames = games.filter(game => game.type.toLowerCase() !== 'vinnare');
              return otherGames.length > 0 ? (
                <div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3">
                    {otherGames.map((game, index) => (
                      <div
                        key={game.id}
                        className={`group/card relative overflow-hidden rounded-lg cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
                          selectedGameId === game.id 
                            ? 'ring-2 ring-blue-400/50 shadow-lg' 
                            : 'hover:shadow-md'
                        }`}
                        onClick={() => onGameSelect(game.id, game.type)}
                        style={{ animationDelay: `${(index + games.filter(g => g.type.toLowerCase() === 'vinnare').length) * 50}ms` }}
                      >
                        <div className={`relative p-3 h-full transition-all duration-300 ${
                          selectedGameId === game.id
                            ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                            : 'bg-gradient-to-br from-white to-slate-50 hover:from-slate-50 hover:to-white border border-slate-200 text-slate-800'
                        }`}>
                          
                          {/* Background pattern */}
                          <div className="absolute inset-0 opacity-5">
                            <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-current to-transparent rounded-full transform translate-x-4 -translate-y-4"></div>
                            <div className="absolute bottom-0 left-0 w-10 h-10 bg-gradient-to-tr from-current to-transparent rounded-full transform -translate-x-2 translate-y-2"></div>
                          </div>
                          
                          {/* Game type icon and label */}
                          <div className="relative z-10 text-center">
                            <div className={`w-10 h-10 mx-auto mb-2 rounded-lg flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                              selectedGameId === game.id
                                ? 'bg-white/20 text-white shadow-lg'
                                : 'bg-gradient-to-br from-blue-100 to-purple-100 text-blue-600 group-hover/card:from-blue-200 group-hover/card:to-purple-200'
                            }`}>
                              {game.type.length > 4 ? game.type.substring(0, 4).toUpperCase() : game.type.toUpperCase()}
                            </div>
                            
                            <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                              selectedGameId === game.id
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-100 text-slate-600 group-hover/card:bg-slate-200'
                            }`}>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>
                                {new Date(game.startTime).toLocaleTimeString('sv-SE', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                            </div>
                          </div>
                          
                          {/* Selected indicator */}
                          {selectedGameId === game.id && (
                            <div className="absolute top-1.5 right-1.5">
                              <div className="w-4 h-4 bg-white/30 rounded-full flex items-center justify-center">
                                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          )}
                          
                          {/* Hover effect indicator */}
                          <div className={`absolute inset-x-0 bottom-0 h-1 transition-all duration-300 ${
                            selectedGameId === game.id
                              ? 'bg-white/40'
                              : 'bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover/card:opacity-100'
                          }`}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}
          </>
        ) : (
          <div className="col-span-full text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-r from-slate-200 to-slate-300 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <span className="text-slate-500 text-3xl">🎯</span>
            </div>
            <p className="text-slate-600 font-semibold text-lg mb-2">No Bet Types Available</p>
            <p className="text-slate-500">Please select a different track or date.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BetTypeList;
