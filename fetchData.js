import { transformRaces } from './transform.js';
import { displayRaces } from './display.js';

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

    const tracksList = document.getElementById('tracks');
    tracksList.innerHTML = '';

    if (!response.ok) {
        tracksList.innerHTML = '<div class="card">Error loading tracks</div>';
        return;
    }

    const data = await response.json();
    data.tracks.forEach(track => {
        const div = document.createElement('div');
        div.classList.add('card');
        div.textContent = track.name;
        div.addEventListener('click', () => displayGamesForTrack(track, data.games));
        tracksList.appendChild(div);
    });
}

function displayGamesForTrack(track, gamesData) {
    const gamesList = document.getElementById('games');
    gamesList.innerHTML = '';

    const excludedTypes = ['plats', 'trio', 'komb', 'tvilling', 'vp', 'raket'];
    const gamesForTrack = [];

    Object.keys(gamesData).forEach(gameType => {
        gamesData[gameType].forEach(game => {
            if (game.status === 'bettable' && game.tracks.includes(track.id) && !excludedTypes.includes(gameType.toLowerCase())) {
                gamesForTrack.push({ type: gameType, ...game });
            }
        });
    });

    gamesForTrack.forEach(game => {
        const div = document.createElement('div');
        div.classList.add('card');
        const gameTime = new Date(game.startTime).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
        div.textContent = `${game.type} - ${gameTime}`;
        div.addEventListener('click', () => fetchGameDetails(game.id));
        gamesList.appendChild(div);
    });
}

async function fetchGameDetails(gameId) {
    selectedGame = gameId; // Spara det valda spelet
    console.log(`📌 Valde spel: ${selectedGame}`);

    setSelectedGame(gameId);  // Uppdatera spelform när spelet väljs
    console.log(`✅ Uppdaterade selectedGame till: ${selectedGame}`);
    
    const apiUrl = gameApiBaseUrl + gameId;
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Error loading game details');
        const data = await response.json();
        const races = data.races;
        const startsData = await fetchStartData(races); // Hämtar detaljerad startdata

        const transformedRaces = transformRaces(races, startsData);
        displayRaces(transformedRaces);

        const detailsContainer = document.getElementById('details');
        detailsContainer.textContent = JSON.stringify(transformedRaces, null, 2);

        const downloadButton = document.getElementById('download-json');
        downloadButton.style.display = 'block';
        downloadButton.onclick = () => downloadJSON(transformedRaces, `${gameId}.json`);
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
            const horseId = start.horse.id;
            const raceId = race.id;
            const startNumber = start.number;
            const startApiUrl = `https://www.atg.se/services/racinginfo/v1/api/races/${raceId}/start/${startNumber}`;

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