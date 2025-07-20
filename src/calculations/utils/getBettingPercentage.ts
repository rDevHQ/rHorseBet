// Function to get the appropriate betting percentage based on the selected game
interface HorseData {
    [key: string]: any; // Allow indexing with string
}

export function getBettingPercentage(horse: HorseData, gameType: string): number | null {
  // Define the priority order for betting pools based on game type
  const poolPriority = gameType === 'V75' ? ['V75', 'V86', 'V65', 'V64', 'GS75', 'V85', 'V5', 'V4', 'V3'] :
                      gameType === 'V86' ? ['V86', 'V75', 'V65', 'V64', 'GS75', 'V85', 'V5', 'V4', 'V3'] :
                      ['V75', 'V86', 'V65', 'V64', 'GS75', 'V85', 'V5', 'V4', 'V3'];

  // Try to find the first available betting percentage
  for (const poolType of poolPriority) {
    const value = horse[poolType];
    if (typeof value === 'number' && value > 0) {
      return value;
    }
  }

  return null; // No betting percentage found
}
