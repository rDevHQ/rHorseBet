import React, { useState, useEffect } from 'react';
import useTracks from '../hooks/useTracks';
import useGames from '../hooks/useGames';

interface StickyNavigationProps {
  currentDate: Date;
  selectedTrackId: string | null;
  selectedGameId: string | null;
  selectedGameType: string | null;
  onDateChange: (date: Date) => void;
  onTrackSelect: (trackId: string) => void;
  onGameSelect: (gameId: string, gameType: string) => void;
  transformedRaces?: any[]; // For race navigation
}

const StickyNavigation: React.FC<StickyNavigationProps> = ({
  currentDate,
  selectedTrackId,
  selectedGameId,
  selectedGameType,
  onDateChange,
  onTrackSelect,
  onGameSelect,
  transformedRaces = []
}) => {
  const { tracks } = useTracks(currentDate);
  const { games } = useGames(currentDate, selectedTrackId);
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTrackDropdown, setShowTrackDropdown] = useState(false);
  const [showBetTypeDropdown, setShowBetTypeDropdown] = useState(false);
  const [currentVisibleRace, setCurrentVisibleRace] = useState(0);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      // Check if the click is inside any dropdown container
      const isInsideDropdown = target.closest('.dropdown-container') !== null;
      
      if (!isInsideDropdown) {
        console.log('Clicking outside dropdown, closing all');
        setShowDatePicker(false);
        setShowTrackDropdown(false);
        setShowBetTypeDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Track currently visible race
  useEffect(() => {
    const handleScroll = () => {
      const raceElements = document.querySelectorAll('[data-race-index]');
      let visibleIndex = 0;
      const navOffset = 180; // Account for sticky nav + header
      
      for (let i = 0; i < raceElements.length; i++) {
        const rect = raceElements[i].getBoundingClientRect();
        // Check if the race is in the visible area (considering the nav offset)
        if (rect.top <= navOffset && rect.bottom >= navOffset) {
          visibleIndex = i;
          break;
        }
        // If we've scrolled past this race, it might be the current one
        if (rect.top < navOffset && i < raceElements.length - 1) {
          const nextRect = raceElements[i + 1].getBoundingClientRect();
          if (nextRect.top > navOffset) {
            visibleIndex = i;
            break;
          }
        }
      }
      
      setCurrentVisibleRace(visibleIndex);
    };

    // Initial call
    handleScroll();
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [transformedRaces]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey) { // Alt + arrow keys for race navigation
        switch (event.key) {
          case 'ArrowLeft':
            event.preventDefault();
            if (currentVisibleRace > 0) {
              scrollToRace(currentVisibleRace - 1);
            }
            break;
          case 'ArrowRight':
            event.preventDefault();
            if (currentVisibleRace < transformedRaces.length - 1) {
              scrollToRace(currentVisibleRace + 1);
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentVisibleRace, transformedRaces]);

  // Get current selections for display
  const selectedTrack = tracks.find((track: any) => track.id === selectedTrackId);
  const selectedGame = games.find((game: any) => game.id === selectedGameId);

  // Format date for display
  const formatDateDisplay = (date: Date) => {
    return date.toLocaleDateString('sv-SE', { 
      month: 'short', 
      day: 'numeric',
      weekday: 'short'
    });
  };

  // Get sport icon
  const getSportIcon = (sport?: string) => {
    switch (sport?.toLowerCase()) {
      case 'galopp':
      case 'gallop':
        return '🐎';
      case 'trav':
        return '🏇';
      default:
        return '🏁';
    }
  };

  // Helper function to format bet type display
  const formatBetTypeDisplay = (game: any) => {
    if (game.type.toLowerCase() === 'vinnare' && game.raceNumber) {
      return `Race ${game.raceNumber}`;
    }
    return game.type;
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    onDateChange(newDate);
    setShowDatePicker(false);
  };

  const scrollToRace = (raceIndex: number) => {
    // First try with data-race-index
    let raceElement = document.querySelector(`[data-race-index="${raceIndex}"]`);
    
    // Fallback: try to find by position if data attributes aren't ready
    if (!raceElement) {
      const allRaceElements = document.querySelectorAll('.group');
      if (allRaceElements[raceIndex]) {
        raceElement = allRaceElements[raceIndex];
      }
    }
    
    if (raceElement) {
      // Fixed offset calculation for sticky header + sticky nav
      const headerHeight = 80;  // Main header
      const navHeight = 80;     // Sticky nav
      const padding = 20;       // Extra spacing
      const totalOffset = headerHeight + navHeight + padding;
      
      // Get the element's position relative to the document
      const elementTop = raceElement.getBoundingClientRect().top + window.pageYOffset;
      const targetPosition = elementTop - totalOffset;

      // Smooth scroll to the calculated position
      window.scrollTo({
        top: Math.max(0, targetPosition), // Ensure we don't scroll to negative values
        behavior: 'smooth'
      });
      
      // Update the current visible race immediately for better UX
      setCurrentVisibleRace(raceIndex);
    }
  };

  return (
    <div className="fixed top-20 left-0 right-0 z-[9990] bg-white/95 backdrop-blur-md shadow-lg border-b border-slate-200/50 animate-in slide-in-from-top duration-300 overflow-visible">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 overflow-visible">
        <div className="flex items-center justify-between py-3 pb-4 overflow-visible">
          {/* Left side - Current selections */}
          <div className="flex items-center space-x-2 sm:space-x-4 text-sm overflow-visible">
            {/* Date */}
            <div className="relative flex-shrink-0 dropdown-container" style={{ zIndex: 10000 }}>
              <button
                onClick={() => {
                  setShowDatePicker(!showDatePicker);
                  setShowTrackDropdown(false);
                  setShowBetTypeDropdown(false);
                }}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md"
              >
                <span>📅</span>
                <span className="font-medium hidden sm:inline">{formatDateDisplay(currentDate)}</span>
                <span className="font-medium sm:hidden">{currentDate.getDate()}/{currentDate.getMonth() + 1}</span>
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showDatePicker && (
                <div 
                  className="absolute top-full mt-2 left-0 bg-white rounded-lg shadow-xl border border-slate-200 p-3 min-w-max"
                  style={{ zIndex: 10001 }}
                >
                  <input
                    type="date"
                    value={currentDate.toISOString().split('T')[0]}
                    onChange={handleDateInputChange}
                    className="border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}
            </div>

            {/* Track */}
            {selectedTrack && (
              <div className="relative flex-shrink-0 dropdown-container" style={{ zIndex: 10000 }}>
                <button
                  onClick={() => {
                    setShowTrackDropdown(!showTrackDropdown);
                    setShowDatePicker(false);
                    setShowBetTypeDropdown(false);
                  }}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-blue-100 hover:bg-blue-200 transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md"
                >
                  <span>{getSportIcon(selectedTrack.sport)}</span>
                  <span className="font-medium hidden md:inline">{selectedTrack.name}</span>
                  <span className="font-medium md:hidden">{selectedTrack.name.substring(0, 8)}...</span>
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showTrackDropdown && (
                  <div 
                    className="absolute top-full mt-2 left-0 bg-white rounded-lg shadow-xl border border-slate-200 max-h-60 overflow-y-auto min-w-48"
                    style={{ zIndex: 10001 }}
                  >
                    {tracks.map((track: any) => (
                      <button
                        key={track.id}
                        onClick={() => {
                          onTrackSelect(track.id);
                          setShowTrackDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center space-x-2 ${
                          track.id === selectedTrackId ? 'bg-blue-50 text-blue-700' : 'text-slate-700'
                        }`}
                      >
                        <span>{getSportIcon(track.sport)}</span>
                        <span>{track.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Bet Type */}
            {selectedGame && (
              <div className="relative flex-shrink-0 dropdown-container" style={{ zIndex: 10000 }}>
                <button
                  onClick={() => {
                    setShowBetTypeDropdown(!showBetTypeDropdown);
                    setShowDatePicker(false);
                    setShowTrackDropdown(false);
                  }}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-purple-100 hover:bg-purple-200 transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md"
                >
                  <span>🎯</span>
                  <span className="font-medium">{formatBetTypeDisplay(selectedGame)}</span>
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showBetTypeDropdown && (
                  <div 
                    className="absolute top-full mt-2 left-0 bg-white rounded-lg shadow-xl border border-slate-200 max-h-60 overflow-y-auto min-w-32"
                    style={{ zIndex: 10001 }}
                  >
                    {games.map((game: any) => (
                      <button
                        key={`${game.id}-${game.type}`}
                        onClick={() => {
                          onGameSelect(game.id, game.type);
                          setShowBetTypeDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-slate-50 ${
                          game.id === selectedGameId && game.type === selectedGameType ? 'bg-purple-50 text-purple-700' : 'text-slate-700'
                        }`}
                      >
                        {formatBetTypeDisplay(game)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right side - Race navigation */}
          {transformedRaces.length > 0 && (
            <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
              <span className="text-sm text-slate-600 font-medium hidden sm:inline">Races:</span>
              <span className="text-xs text-slate-600 font-medium sm:hidden">R:</span>
              <div className="flex space-x-1 bg-slate-100 rounded-lg p-1 max-w-xs sm:max-w-none overflow-x-auto">
                {transformedRaces.map((race, index) => (
                  <button
                    key={race.id}
                    onClick={() => scrollToRace(index)}
                    className={`min-w-[28px] sm:min-w-[32px] h-7 sm:h-8 rounded-md transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md transform hover:scale-105 flex-shrink-0 text-xs sm:text-sm font-medium ${
                      currentVisibleRace === index 
                        ? 'bg-blue-500 text-white shadow-lg scale-105' 
                        : 'bg-white hover:bg-blue-50 hover:text-blue-600'
                    }`}
                    title={`Race ${race.number} - ${race.name} ${currentVisibleRace === index ? '(Current)' : ''}`}
                  >
                    {race.number}
                  </button>
                ))}
              </div>
              {transformedRaces.length > 1 && (
                <div className="flex space-x-1">
                  <button
                    onClick={() => {
                      const prevIndex = Math.max(0, currentVisibleRace - 1);
                      scrollToRace(prevIndex);
                    }}
                    disabled={currentVisibleRace === 0}
                    className={`w-7 sm:w-8 h-7 sm:h-8 rounded-md transition-all duration-200 flex items-center justify-center text-xs sm:text-sm ${
                      currentVisibleRace === 0 
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-600 hover:text-slate-800 hover:scale-105'
                    }`}
                    title={`Previous race ${currentVisibleRace > 0 ? `(Race ${transformedRaces[currentVisibleRace - 1]?.number})` : ''} • Alt+←`}
                  >
                    ←
                  </button>
                  <button
                    onClick={() => {
                      const nextIndex = Math.min(transformedRaces.length - 1, currentVisibleRace + 1);
                      scrollToRace(nextIndex);
                    }}
                    disabled={currentVisibleRace === transformedRaces.length - 1}
                    className={`w-7 sm:w-8 h-7 sm:h-8 rounded-md transition-all duration-200 flex items-center justify-center text-xs sm:text-sm ${
                      currentVisibleRace === transformedRaces.length - 1 
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-600 hover:text-slate-800 hover:scale-105'
                    }`}
                    title={`Next race ${currentVisibleRace < transformedRaces.length - 1 ? `(Race ${transformedRaces[currentVisibleRace + 1]?.number})` : ''} • Alt+→`}
                  >
                    →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StickyNavigation;
