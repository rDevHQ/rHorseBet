import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import GameDetails from './components/GameDetails';
import DataCollectionPanel from './components/DataCollectionPanel';
import useTracks from './hooks/useTracks';
import useGames from './hooks/useGames';
import { ColumnVisibilityProvider } from './contexts/ColumnVisibilityContext';

function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [selectedGameType, setSelectedGameType] = useState<string | null>(null);
  const [showCustomCalendar, setShowCustomCalendar] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [isAdminMode, setIsAdminMode] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Get data for dropdowns
  const { tracks } = useTracks(currentDate);
  const { games, loading: gamesLoading } = useGames(currentDate, selectedTrackId);

  // Helper functions
  const formatBetTypeDisplay = (game: any) => {
    if (game.type.toLowerCase() === 'vinnare' && game.raceNumber) {
      return `Race ${game.raceNumber}`;
    }
    return game.type;
  };

  const getSportIcon = (sport?: string) => {
    switch (sport?.toLowerCase()) {
      case 'galopp':
      case 'gallop':
        return <img src="/gallop.png" alt="Gallop" className="w-8 h-8" />;
      case 'trav':
        return <img src="/trotting.png" alt="Trotting" className="w-8 h-8" />;
      default:
        return <span className="text-2xl">🏁</span>;
    }
  };

  const handleDateChange = (newDate: Date) => {
    setCurrentDate(newDate);
    setSelectedTrackId(null); // Reset selected track when date changes
    setSelectedGameId(null); // Reset selected game when date changes
    setSelectedGameType(null); // Reset selected game type when date changes
  };

  const handleTrackSelect = (trackId: string) => {
    setSelectedTrackId(trackId);
    setSelectedGameId(null); // Reset selected game when track changes
    setSelectedGameType(null); // Reset selected game type when track changes
  };

  const handleGameSelect = (gameId: string, gameType: string) => {
    setSelectedGameId(gameId);
    setSelectedGameType(gameType);
  };

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    // Convert Sunday (0) to be last day (6), and Monday (1) to be first day (0)
    return firstDay === 0 ? 6 : firstDay - 1;
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(calendarDate);
    const firstDay = getFirstDayOfMonth(calendarDate);
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  // Calendar positioning for fixed position
  const [calendarPosition, setCalendarPosition] = useState({ top: 0, left: 0 });

  // Update calendar position when it opens
  useEffect(() => {
    if (showCustomCalendar && calendarRef.current) {
      const rect = calendarRef.current.getBoundingClientRect();
      // Center calendar horizontally in the entire viewport
      const viewportWidth = window.innerWidth;
      setCalendarPosition({
        top: rect.bottom + 8,
        left: (viewportWidth / 2) - 140 // Center in entire viewport (280px / 2 = 140px)
      });
    }
  }, [showCustomCalendar]);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCustomCalendar(false);
      }
    };

    if (showCustomCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCustomCalendar]);

  // Admin mode keyboard shortcut (Ctrl+Shift+A)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'A') {
        event.preventDefault();
        setIsAdminMode(prev => !prev);
        console.log('Admin mode:', !isAdminMode ? 'enabled' : 'disabled');
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAdminMode]);

  return (
    <ColumnVisibilityProvider>
      <style>{`
        /* Hide the fallback date input */
        #date-input {
          pointer-events: none;
        }
        
        /* Custom scrollbar styling */
        .scrollbar-thin::-webkit-scrollbar {
          height: 6px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        
        .scrollbar-track-transparent::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .scrollbar-thumb-slate-300::-webkit-scrollbar-thumb {
          background: #cbd5e1;
        }
      `}</style>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Modern Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-slate-200/50 sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto py-4 px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="flex justify-center relative">
            {/* Hidden Admin Toggle Button */}
            <button
              onClick={() => setIsAdminMode(prev => !prev)}
              className="absolute left-0 top-0 w-4 h-4 opacity-0 hover:opacity-20 transition-opacity"
              title="Toggle Admin Mode"
            >
              🔧
            </button>
            
            {/* rHorseBet PNG Logo */}
            <img 
              src="/rHorseBet.png" 
              alt="rHorseBet - Advanced Horse Racing Analytics" 
              className="h-16 w-auto flex-shrink-0"
            />
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        {/* ML Data Collection Panel - Admin Only */}
        <DataCollectionPanel isVisible={isAdminMode} />
        
        {/* Admin Mode Indicator */}
        {isAdminMode && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 text-sm">
            🔧 <strong>Admin Mode Active</strong> - Press Ctrl+Shift+A to toggle
          </div>
        )}
        
        {/* Modern Navigation Interface */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 p-6 mb-8 space-y-6">
          
          {/* Date Selection Row - Centered */}
          <div className="flex justify-center">
            <div className="flex items-center space-x-4">
              {/* Previous Day Button */}
              <button
                type="button"
                onClick={() => handleDateChange(new Date(currentDate.getTime() - 24 * 60 * 60 * 1000))}
                className="flex items-center justify-center w-9 h-9 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-lg text-slate-600 hover:text-slate-800 transition-all duration-200 shadow-sm hover:shadow-md"
                title="Previous day"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              {/* Date Picker */}
              <div className="relative" ref={calendarRef}>
                <div 
                  className="flex items-center space-x-2 bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-all duration-200 min-w-[180px]"
                  onClick={() => setShowCustomCalendar(!showCustomCalendar)}
                >
                  <span className="text-emerald-600 text-lg">📅</span>
                  <span className="font-medium text-slate-700">
                    {currentDate.toLocaleDateString('en-GB', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                
                {/* Custom Modern Calendar */}
                {showCustomCalendar && createPortal(
                  <div 
                    className="fixed bg-white rounded-xl shadow-2xl border border-slate-200 p-4 min-w-[280px]"
                    style={{
                      top: `${calendarPosition.top}px`,
                      left: `${calendarPosition.left}px`,
                      zIndex: 9999999
                    }}
                  >
                    {/* Calendar Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => setCalendarDate(new Date(calendarDate.getFullYear() - 1, calendarDate.getMonth()))}
                          className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-slate-700"
                          title="Previous year"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1))}
                          className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Previous month"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                      </div>
                      
                      <h3 className="font-semibold text-slate-800 text-center">
                        {calendarDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                      </h3>
                      
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1))}
                          className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Next month"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setCalendarDate(new Date(calendarDate.getFullYear() + 1, calendarDate.getMonth()))}
                          className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-slate-700"
                          title="Next year"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    {/* Days of week header */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                        <div key={day} className="text-center text-xs font-medium text-slate-500 p-2">
                          {day}
                        </div>
                      ))}
                    </div>
                    
                    {/* Calendar Days */}
                    <div className="grid grid-cols-7 gap-1">
                      {generateCalendarDays().map((day, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            if (day) {
                              const newDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day);
                              handleDateChange(newDate);
                              setShowCustomCalendar(false);
                            }
                          }}
                          disabled={!day}
                          className={`
                            p-2 text-sm rounded-lg transition-all duration-200 hover:bg-emerald-50
                            ${!day ? 'invisible' : ''}
                            ${day && isSameDay(new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day), currentDate) 
                              ? 'bg-emerald-500 text-white font-semibold shadow-md' 
                              : 'text-slate-700 hover:text-emerald-600'
                            }
                            ${day && isSameDay(new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day), new Date()) 
                              ? 'ring-2 ring-emerald-200' 
                              : ''
                            }
                          `}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                    
                    {/* Today button */}
                    <div className="mt-4 pt-3 border-t border-slate-200">
                      <button
                        onClick={() => {
                          const today = new Date();
                          handleDateChange(today);
                          setCalendarDate(today);
                          setShowCustomCalendar(false);
                        }}
                        className="w-full px-3 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition-colors text-sm font-medium"
                      >
                        Today
                      </button>
                    </div>
                  </div>,
                  document.body
                )}
                
                {/* Hidden native input for fallback */}
                <input
                  type="date"
                  value={currentDate.toISOString().split('T')[0]}
                  onChange={(e) => handleDateChange(new Date(e.target.value))}
                  className="absolute opacity-0 w-full h-full top-0 left-0"
                  id="date-input"
                  style={{
                    zIndex: -1,
                    pointerEvents: 'none'
                  }}
                />
              </div>
              
              {/* Next Day Button */}
              <button
                type="button"
                onClick={() => handleDateChange(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000))}
                className="flex items-center justify-center w-9 h-9 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-lg text-slate-600 hover:text-slate-800 transition-all duration-200 shadow-sm hover:shadow-md"
                title="Next day"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Track Selection - Horizontal Scrolling Cards */}
          <div>
            
            {tracks.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-slate-400">
                <div className="text-center">
                  <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p className="text-sm">No tracks available</p>
                </div>
              </div>
            ) : (
              <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                {tracks.map((track: any) => (
                  <button
                    key={track.id}
                    onClick={() => handleTrackSelect(track.id)}
                    className={`
                      flex-shrink-0 flex items-center space-x-3 px-4 py-3 rounded-xl border-2 transition-all duration-200 min-w-[220px]
                      ${selectedTrackId === track.id 
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md' 
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md text-slate-700'
                      }
                    `}
                  >
                    <div className="text-2xl">{getSportIcon(track.sport)}</div>
                    <div className="text-left flex-1">
                      <div className="font-medium">{track.name}</div>
                      <div className="text-xs opacity-75">
                        {track.firstStartTime && (
                          <span className="text-emerald-600 font-medium">
                            {new Date(track.firstStartTime).toLocaleTimeString('sv-SE', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Game Selection - Timeline View */}
          {selectedTrackId && (
            <div>
              
              {gamesLoading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                  <span className="ml-2 text-slate-500">Loading games...</span>
                </div>
              ) : !games || games.length === 0 ? (
                <div className="flex items-center justify-center py-6 text-slate-400">
                  <div className="text-center">
                    <svg className="w-6 h-6 mx-auto mb-1 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm">No games available</p>
                  </div>
                </div>
              ) : (
                <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                  {games.map((game: any) => (
                    <button
                      key={`${game.id}-${game.type}`}
                      onClick={() => handleGameSelect(game.id, game.type)}
                      className={`
                        flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-lg border transition-all duration-200 min-w-[90px]
                        ${selectedGameId === game.id 
                          ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-md' 
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm text-slate-700'
                        }
                      `}
                    >
                      <div className="text-xs font-medium mb-1">
                        {new Date(game.startTime).toLocaleTimeString('sv-SE', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                      <div className="text-xs font-semibold">
                        {formatBetTypeDisplay(game)}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        {selectedGameId && selectedGameType && (
          <GameDetails 
            gameId={selectedGameId} 
            gameType={selectedGameType} 
          />
        )}
      </main>
    </div>
    </ColumnVisibilityProvider>
  )
}

export default App
