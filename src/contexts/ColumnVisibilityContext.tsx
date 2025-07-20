import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface ColumnVisibilityContextType {
  hiddenColumns: Set<string>;
  toggleColumnVisibility: (columnName: string) => void;
  resetToDefaults: () => void;
  toggleAll: () => void;
  getDefaultHiddenColumns: () => Set<string>;
}

const ColumnVisibilityContext = createContext<ColumnVisibilityContextType | undefined>(undefined);

// Default hidden columns including the three requested ones
const getDefaultHiddenColumns = (): Set<string> => new Set([
  'Public', 'Form', 'H2H', 'Driver Pts', 'Trainer Pts', 'Equipment', 
  'Time 10 Starts', 'Starting Position', 'Class',
  'Rating', '$/start this year', '$/start 2 years' // Hide these by default
]);

interface ColumnVisibilityProviderProps {
  children: ReactNode;
}

export const ColumnVisibilityProvider: React.FC<ColumnVisibilityProviderProps> = ({ children }) => {
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(getDefaultHiddenColumns());

  const toggleColumnVisibility = (columnName: string) => {
    setHiddenColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(columnName)) {
        newSet.delete(columnName);
      } else {
        newSet.add(columnName);
      }
      return newSet;
    });
  };

  const resetToDefaults = () => {
    setHiddenColumns(getDefaultHiddenColumns());
  };

  const toggleAll = () => {
    setHiddenColumns(prev => {
      // If all columns are visible, hide all non-essential columns
      if (prev.size === 0) {
        return getDefaultHiddenColumns();
      } else {
        // If some columns are hidden, show all columns
        return new Set();
      }
    });
  };

  const value: ColumnVisibilityContextType = {
    hiddenColumns,
    toggleColumnVisibility,
    resetToDefaults,
    toggleAll,
    getDefaultHiddenColumns
  };

  return (
    <ColumnVisibilityContext.Provider value={value}>
      {children}
    </ColumnVisibilityContext.Provider>
  );
};

export const useColumnVisibility = (): ColumnVisibilityContextType => {
  const context = useContext(ColumnVisibilityContext);
  if (context === undefined) {
    throw new Error('useColumnVisibility must be used within a ColumnVisibilityProvider');
  }
  return context;
};
