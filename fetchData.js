import { transformRaces } from './transform.js';
import { displayRaces } from './display.js';
import { displayRaceDetails } from './display.js';

const apiCalendarUrl = 'https://www.atg.se/services/racinginfo/v1/api/calendar/day/';
const gameApiBaseUrl = 'https://www.atg.se/services/racinginfo/v1/api/games/';
let currentDate = new Date();

export let selectedGame = "Vinnarodds"; // Standardvärde

export function setSelectedGame(gameId) {
    console.log(`🔍 Fullt gameId: ${gameId}`); // Debug-logg
    selectedGame = gameId.split("_")[0].toUpperCase(); // Ta första delen
    console.log(`📌 Valde spel: ${selectedGame}`); // Ska visa "V75", "V4", etc.
}
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

async function loadTracks(date) {
    const formattedDate = formatDate(date);
    document.getElementById('current-date').textContent = `${formattedDate}`;
    const response = await fetch(apiCalendarUrl + formattedDate);

    console.log("🔍 tracks raw data:", response);

    const tracksList = document.getElementById('tracks');
    tracksList.innerHTML = '';
    document.getElementById('start-list-container').style.display = 'none';
    // Clear details and races sections when loading new tracks
    document.getElementById('details').innerHTML = '';
    document.getElementById('details').style.display = 'none';
    document.getElementById('races').innerHTML = '';
    document.getElementById('races').style.display = 'none';
    document.getElementById('games').innerHTML = '';

    if (!response.ok) {
        tracksList.innerHTML = '<div class="card">Error loading tracks</div>';
        return;
    }

    const data = await response.json();

    data.tracks.sort((a, b) => {
        const getStart = trackId =>
            Math.min(...Object.values(data.games).flat().filter(g => g.tracks.includes(trackId)).map(g => new Date(g.startTime).getTime()));
        return getStart(a.id) - getStart(b.id);
    });

    data.tracks.forEach(track => {
        // Find earliest start time for this track
        const trackGames = Object.values(data.games).flat().filter(g => g.tracks.includes(track.id));
        const earliestStart = trackGames.length > 0
            ? new Date(Math.min(...trackGames.map(g => new Date(g.startTime)))).toLocaleTimeString('sv-SE', {
                hour: '2-digit',
                minute: '2-digit',
            })
            : "–";

        const div = document.createElement('div');
        div.classList.add('card');
        div.innerHTML = `<strong>${track.name}</strong><div style="font-size: 0.9em; color: #555;">${earliestStart}</div>`;

        div.addEventListener('click', () => {
            document.querySelectorAll('#tracks .card').forEach(btn => btn.classList.remove('selected-card'));
            div.classList.add('selected-card');
            document.getElementById('races').innerHTML = '';
            document.getElementById('details').innerHTML = '';
            // Additional clear as requested
            document.getElementById('races').innerHTML = '';
            document.getElementById('details').innerHTML = '';
            displayGamesForTrack(track, data.games);
        });

        tracksList.appendChild(div);
    });
}

function displayGamesForTrack(track, gamesData) {
    // Clear previous game/race/detail views when switching tracks
    document.getElementById('games').innerHTML = '';
    document.getElementById('races').innerHTML = '';
    document.getElementById('details').innerHTML = '';
    document.getElementById('races').style.display = 'none';
    document.getElementById('details').style.display = 'none';
    // Additional clear as requested
    document.getElementById('details').innerHTML = '';
    document.getElementById('start-list-container').style.display = 'none';

    const gamesList = document.getElementById('games');
    // gamesList.innerHTML = ''; // Already cleared above

    const excludedTypes = ['plats', 'trio', 'komb', 'tvilling', 'vp', 'raket'];
    const gamesForTrack = [];

    Object.keys(gamesData).forEach(gameType => {
        gamesData[gameType].forEach(game => {
            if (game.tracks.includes(track.id) && !excludedTypes.includes(gameType.toLowerCase())) {
                gamesForTrack.push({ type: gameType, ...game });
            }
        });
    });

    // console.log("🔍 gamesForTrack raw data:", gamesForTrack);

    (async () => {
        const vinnareGames = [];
        const otherGames = [];

        for (const game of gamesForTrack) {
            if (game.type.toUpperCase() === "VINNARE") {
                const raceNumber = await getRaceNumberFromGame(game.id);
                vinnareGames.push({ ...game, raceNumber });
            } else {
                otherGames.push(game);
            }
        }

        vinnareGames.sort((a, b) => (a.raceNumber ?? 0) - (b.raceNumber ?? 0));
        otherGames.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
        const sortedGames = [...vinnareGames, ...otherGames];

        sortedGames.forEach(game => {
            const div = document.createElement('div');
            div.classList.add('card');
            div.classList.add(`status-${game.status}`);

            const gameTime = new Date(game.startTime).toLocaleTimeString('sv-SE', {
                hour: '2-digit',
                minute: '2-digit',
            });

            const isVinnare = game.type.toUpperCase() === "VINNARE";
            const gameTypeLabel = isVinnare
                ? `Vinnare Race ${game.raceNumber ?? "?"}`
                : game.type.toUpperCase();

            const label = `<strong>${gameTypeLabel}</strong><div>${gameTime}</div><div class="status-line">(${game.status})</div>`;

            div.innerHTML = label;
            div.style.marginBottom = "1em";
            div.addEventListener('click', () => {
                document.querySelectorAll('#games .card').forEach(btn => btn.classList.remove('selected-card'));
                div.classList.add('selected-card');
                fetchGameDetails(game.id);
            });
            gamesList.appendChild(div);
        });
    })();
}

async function getRaceNumberFromGame(gameId) {
    const apiUrl = gameApiBaseUrl + gameId;
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Error loading game info');
        const data = await response.json();
        const raceNumber = data?.races?.[0]?.number ?? null;
        console.log(`🔎 Hämtade loppnummer för ${gameId}:`, raceNumber);
        return raceNumber;
    } catch (error) {
        console.error('❌ Fel vid hämtning av loppnummer:', error);
        return null;
    }
}

async function fetchGameDetails(gameId) {
    const currentGameId = gameId; // persist for download scope

    selectedGame = gameId; // Spara det valda spelet

    setSelectedGame(gameId);  // Uppdatera spelform när spelet väljs

    const apiUrl = gameApiBaseUrl + gameId;
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Error loading game details');
        const data = await response.json();
        const races = data.races;
        const startsData = await fetchStartData(races); // Hämtar detaljerad startdata

        const transformedRaces = transformRaces(races, startsData);

        // Specialhantering för VINNARE
        if (races.length === 1 && selectedGame.toUpperCase() === "VINNARE") {
            displayRaces(transformedRaces);
            displayRaceDetails(transformedRaces[0]);
            document.getElementById('races').style.display = 'none';
        
            // ✅ Flytta detta hit
            const downloadButton = document.getElementById('download-json');
            downloadButton.style.display = 'block';
            downloadButton.onclick = () => downloadJSON(transformedRaces, `${currentGameId}.json`);
            document.getElementById('start-list-container').style.display = 'block';
            return;
        }

        displayRaces(transformedRaces);
        // Visa race-knapplistan i vanliga fall
        document.getElementById('races').style.display = 'flex';

        document.getElementById('details').style.display = 'none';

        const downloadButton = document.getElementById('download-json');
        downloadButton.style.display = 'block';
        downloadButton.onclick = () => downloadJSON(transformedRaces, `${currentGameId}.json`);
        document.getElementById('start-list-container').style.display = 'block';
    } catch (error) {
        console.error('Error fetching game details:', error);
        document.getElementById('details').textContent = 'Error loading game details';
    }
}

/**
 * Hämtar extra startdata för varje häst i loppet
 */
async function fetchStartData(races) {
    const startsData = {};

    for (const race of races) {
        for (const start of race.starts) {
            const horseId = start.horse.id || `${race.id}_${start.number}`;
            const raceId = race.id;
            const startNumber = start.number;
            const startApiUrl = `https://www.atg.se/services/racinginfo/v1/api/races/${raceId}/start/${startNumber}`;

            console.log(`🔗 Hämta startdata från: ${startApiUrl}`);

            try {
                const startResponse = await fetch(startApiUrl);
                if (startResponse.ok) {
                    const startData = await startResponse.json();
                    startsData[horseId] = startData;
                }
            } catch (error) {
                console.error(`Error fetching start data for horse ID ${horseId}:`, error);
            }
        }
    }

    return startsData;
}

function downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

document.getElementById('prev-day').addEventListener('click', () => {
    currentDate.setDate(currentDate.getDate() - 1);
    loadTracks(currentDate);
});

document.getElementById('next-day').addEventListener('click', () => {
    currentDate.setDate(currentDate.getDate() + 1);
    loadTracks(currentDate);
});

loadTracks(currentDate);