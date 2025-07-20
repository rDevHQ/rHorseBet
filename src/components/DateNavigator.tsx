import React from 'react';

interface DateNavigatorProps {
  currentDate: Date;
  onDateChange: (newDate: Date) => void;
}

const DateNavigator: React.FC<DateNavigatorProps> = ({ currentDate, onDateChange }) => {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('sv-SE', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatDateISO = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const handlePrevDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    onDateChange(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    onDateChange(newDate);
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = new Date(e.target.value);
    onDateChange(selectedDate);
  };

  return (
    <div className="group mb-8">
      <div className="bg-gradient-to-r from-white/80 to-slate-50/80 backdrop-blur-sm rounded-3xl shadow-xl border border-slate-200/50 p-8 transition-all duration-300 hover:shadow-2xl">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
            Select Racing Date
          </h2>
          <p className="text-slate-500 text-sm">Choose the date for race analysis</p>
        </div>
        
        <div className="flex items-center justify-center space-x-6">
          <button
            className="group/btn bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
            onClick={handlePrevDay}
          >
            <svg className="w-5 h-5 transition-transform group-hover/btn:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Previous</span>
          </button>
          
          <div className="text-center bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-inner min-w-[280px]">
            <div className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
              {formatDate(currentDate)}
            </div>
            <input
              type="date"
              value={formatDateISO(currentDate)}
              onChange={handleDateInputChange}
              className="w-full bg-transparent border-2 border-slate-200 hover:border-blue-300 focus:border-blue-500 rounded-xl px-4 py-2 text-center font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-200"
            />
          </div>
          
          <button
            className="group/btn bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
            onClick={handleNextDay}
          >
            <span>Next</span>
            <svg className="w-5 h-5 transition-transform group-hover/btn:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DateNavigator;
