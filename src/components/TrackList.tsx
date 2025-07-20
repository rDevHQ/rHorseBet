import React from 'react';
import useTracks from '../hooks/useTracks';

interface TrackListProps {
  currentDate: Date;
  onTrackSelect: (trackId: string) => void;
  selectedTrackId: string | null;
}

// Helper function to format time from ISO string
const formatStartTime = (isoString: string | undefined): string => {
  if (!isoString) return 'TBA';
  
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('sv-SE', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'Europe/Stockholm'
    });
  } catch (error) {
    return 'TBA';
  }
};

const TrackList: React.FC<TrackListProps> = ({ currentDate, onTrackSelect, selectedTrackId }) => {
  const { tracks, loading, error } = useTracks(currentDate);

  if (loading) {
    return (
      <div className="group mb-8">
        <div className="bg-gradient-to-r from-white/80 to-slate-50/80 backdrop-blur-sm rounded-3xl shadow-xl border border-slate-200/50 p-8 transition-all duration-300">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
              Racing Venues
            </h2>
            <p className="text-slate-500 text-sm">Select a track to view available races</p>
          </div>
          <div className="text-center py-12">
            <div className="relative">
              <div className="w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-500 rounded-full animate-spin"></div>
                <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center shadow-inner">
                  <span className="text-3xl animate-bounce">🏁</span>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-green-200/30 to-blue-200/30 rounded-full animate-pulse"></div>
            </div>
            <p className="text-slate-600 font-medium">Loading racing venues...</p>
            <p className="text-slate-400 text-sm mt-1">Please wait while we fetch track information</p>
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
            <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
              Racing Venues
            </h2>
            <p className="text-slate-500 text-sm">Select a track to view available races</p>
          </div>
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-r from-red-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="text-white text-4xl">⚠️</span>
            </div>
            <p className="text-red-600 font-semibold text-lg mb-2">Unable to Load Tracks</p>
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
            Racing Venues
          </h2>
          <p className="text-slate-500 text-sm">Select a track to view available races and betting options</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {tracks.length > 0 ? (
            tracks.map((track, index) => (
              <div
                key={track.id}
                className={`group/track relative overflow-hidden rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
                  selectedTrackId === track.id 
                    ? 'ring-2 ring-green-400/50 shadow-xl' 
                    : 'hover:shadow-lg'
                }`}
                onClick={() => onTrackSelect(track.id)}
                style={{ animationDelay: `${index * 75}ms` }}
              >
                <div className={`relative p-4 h-full transition-all duration-300 ${
                  selectedTrackId === track.id
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
                    : 'bg-gradient-to-br from-white to-slate-50 hover:from-slate-50 hover:to-white border border-slate-200 text-slate-800'
                }`}>
                  
                  {/* Background decorative elements */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-current to-transparent rounded-full transform translate-x-6 -translate-y-6"></div>
                    <div className="absolute bottom-0 left-0 w-14 h-14 bg-gradient-to-tr from-current to-transparent rounded-full transform -translate-x-4 translate-y-4"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-current rounded-full opacity-20"></div>
                  </div>
                  
                  {/* Track information */}
                  <div className="relative z-10 text-center">
                    <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center text-xl font-bold transition-all duration-300 ${
                      selectedTrackId === track.id
                        ? 'bg-white/20 text-white shadow-lg'
                        : 'bg-gradient-to-br from-green-100 to-emerald-100 text-green-600 group-hover/track:from-green-200 group-hover/track:to-emerald-200'
                    }`}>
                      {track.sport === 'galopp' ? '🏇' : 
                       track.sport === 'mixed' ? '🏁' : 
                       '🐎'}
                    </div>
                    
                    <h3 className={`text-base font-bold mb-2 transition-all duration-300 leading-tight ${
                      selectedTrackId === track.id
                        ? 'text-white'
                        : 'text-slate-800 group-hover/track:text-slate-900'
                    }`}>
                      {track.name}
                    </h3>
                    
                    <div className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                      selectedTrackId === track.id
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-600 group-hover/track:bg-slate-200'
                    }`}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{formatStartTime(track.firstStartTime)}</span>
                    </div>
                  </div>
                  
                  {/* Selected indicator */}
                  {selectedTrackId === track.id && (
                    <div className="absolute top-2 right-2">
                      <div className="w-5 h-5 bg-white/30 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                  
                  {/* Hover effect indicator */}
                  <div className={`absolute inset-x-0 bottom-0 h-1 transition-all duration-300 ${
                    selectedTrackId === track.id
                      ? 'bg-white/40'
                      : 'bg-gradient-to-r from-green-400 to-emerald-400 opacity-0 group-hover/track:opacity-100'
                  }`}></div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-r from-slate-200 to-slate-300 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <span className="text-slate-500 text-3xl">🏁</span>
              </div>
              <p className="text-slate-600 font-semibold text-lg mb-2">No Tracks Available</p>
              <p className="text-slate-500">Please select a different date or check back later.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackList;
