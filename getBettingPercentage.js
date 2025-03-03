// Funktion för att hämta rätt spelprocent baserat på det valda spelet
export function getBettingPercentage(horse, selectedGame) {
   const gameKey = selectedGame.toUpperCase(); // Konvertera för att matcha nycklar

    if (horse.hasOwnProperty(gameKey) && horse[gameKey] !== "N/A") {
        return horse[gameKey];
    }

    return "N/A %";
}