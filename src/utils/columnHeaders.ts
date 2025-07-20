export const getColumnHeaders = (race: any, gameType: string): string[] => {
  const isGallop = race.sport?.toLowerCase() === "gallop";

  // Get dynamic header for % column based on bet type
  const getBettingPercentageHeader = () => {
    if (gameType.toUpperCase() === 'VINNARE') {
      return null; // Hide % column for Winner betting
    }
    return `${gameType.toUpperCase()} %`;
  };

  // Use correct header based on sport type
  const driverJockeyHeader = isGallop ? "Jockey" : "Driver";

  const columnHeaders = [
    "Res", "Rank", "Points", "👥", "Nr", "Horse Name", driverJockeyHeader, "Trainer", "Odds", "%", "Public", "Form", "H2H", "Driver Pts", "Trainer Pts", "Equipment"
  ];

  // Replace the % header with dynamic header or remove it for Winner betting
  const bettingPercentageHeader = getBettingPercentageHeader();
  if (bettingPercentageHeader) {
    const percentIndex = columnHeaders.indexOf("%");
    if (percentIndex !== -1) {
      columnHeaders[percentIndex] = bettingPercentageHeader;
    }
  } else {
    // Remove % column for Winner betting
    const percentIndex = columnHeaders.indexOf("%");
    if (percentIndex !== -1) {
      columnHeaders.splice(percentIndex, 1);
    }
  }

  if (isGallop) {
    columnHeaders.splice(16, 0, "Rating", "$/start this year", "$/start 2 years");
  } else {
    columnHeaders.splice(16, 0, "Time 10 Starts", "Starting Position", "Class");
  }

  return columnHeaders;
};
