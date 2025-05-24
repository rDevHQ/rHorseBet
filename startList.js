import { calculatePointsForRace } from "./calculatePoints.js";
import { selectedGame } from './fetchData.js';
import { getBettingPercentage } from './getBettingPercentage.js';
import { ML_CATEGORY_WEIGHTS } from "./pointsMLConfig.js";
import { ML_CATEGORY_WEIGHTS as UPSCORE_WEIGHTS } from "./pointsConfigUpsets.js";
import { ML_CATEGORY_WEIGHTS as SPIK_WEIGHTS } from "./pointsConfigSpik.js";
import { fetchStartData } from './fetchData.js';
import { transformRaces } from './transform.js';

export function displayStartList(race) {
    const container = document.getElementById("start-list-container");
    const gameType = selectedGame ?? "Vinnarodds";

    // Skapa rubrik
    const formattedStartMethod = race.startMethod === "volte" ? "Voltstart" : race.startMethod;
    const raceTitle = `${race.trackName} Lopp ${race.number} - ${race.distance}m ${formattedStartMethod}`;
    const raceName = race.name ? `<span class="race-name"> - ${race.name}</span>` : "";
    const raceId = race.id;

    container.innerHTML = `<h2>${raceTitle}${raceName} (${raceId})</h2>
    <table id="start-list">
        <thead>
            <tr>
                <th data-sortable="true">Rank</th>
                <th data-sortable="true">ML Rank</th>
                <th data-sortable="true">Folk Rank</th>
                <th data-sortable="true">Startnr</th>
                <th data-sortable="true">Hästnamn</th>
                <th data-sortable="true">Odds</th>
                <th data-sortable="true">Spelprocent</th>
                <th data-sortable="true">Folket</th>
                <th data-sortable="true">Startspår</th>
                <th data-sortable="true">Form</th>
                <th data-sortable="true">Tid</th>
                <th data-sortable="true">H2H</th>
                <th data-sortable="true">Kusk</th>
                <th data-sortable="true">Tränare</th>
                <th data-sortable="true">Utrustning</th>
                <th data-sortable="true">Klass</th>
                <th data-sortable="true">Totalt</th>
                <th data-sortable="true">Totalt %</th>
                <th data-sortable="true">ML %</th>
                <th data-sortable="true">ML Spik %</th>
                <th data-sortable="true">ML Skräll %</th>
                <th data-sortable="true">Edge %</th>
                <th data-sortable="true">ML Edge %</th>
                </tr>
        </thead>
        <tbody></tbody>
    </table>
    <br>`;

    const tbody = document.querySelector("#start-list tbody");

    // --- NYTT: Använd ENDAST calculatePointsForRace ---
    let horses = calculatePointsForRace(race, gameType);

    // Beräkna topSpik och spikGap för spik-ikoner
    const sortedSpik = horses.slice().sort((a, b) => b.mlSpikPercentage - a.mlSpikPercentage);
    const topSpik = sortedSpik[0]?.mlSpikPercentage ?? 0;
    const secondSpik = sortedSpik[1]?.mlSpikPercentage ?? 0;
    const spikGap = topSpik - secondSpik;

    // --- Efterbearbetning och sortering (om du vill ha ytterligare rank/edge) ---
    // (Du kan behålla din nuvarande kod här om du vill, men det mesta kan flyttas till calculatePointsForRace)

    // --- Bygg tabellrader från horses ---
    horses.forEach((horse, index) => {
        const row = tbody.insertRow();
        row.classList.add("horse-row"); // För hover-effekten

        // Add skräll-kandidat class if ML Upset ≥ 15% and Spelprocent < 10%
        if (horse.mlUpsetPercentage >= 15 && horse.bettingPercentage < 10) {
            row.classList.add("skrall-kandidat");
        }

        if (horse.scratched) {
            row.style.textDecoration = "line-through";
            row.style.opacity = "0.6"; // Optional: dim the row
        }

        if (horse.place === 1) {
            row.style.backgroundColor = "#c6f7d0"; // Green for 1st
        } else if (horse.place === 2) {
            row.style.backgroundColor = "#fdf3c0"; // Yellow for 2nd
        } else if (horse.place === 3) {
            row.style.backgroundColor = "#e2e4f6"; // Blue-ish for 3rd
        }

        // Get thead row for column headers
        const theadRow = document.querySelector("#start-list thead tr");

        [
            index + 1,
            horse.mlRank,
            horse.folkRank,
            horse.startNumber,
            horse.horseName,
            horse.odds,
            formatSpelprocent(horse.bettingPercentage),
            horse.bettingPercentagePoints,
            horse.startPositionPoints,
            horse.formPoints,
            horse.timePoints,
            horse.headToHeadPoints,
            horse.driverPoints,
            horse.trainerPoints,
            horse.equipmentPoints,
            horse.classPoints,
            horse.totalPoints,
            horse.myExpectedPercentage,
            horse.mlExpectedPercentage,
            horse.mlSpikPercentage,
            horse.mlUpsetPercentage,
            horse.myEdgeVsMarket,
            horse.mlEdgeVsMarket,
        ].forEach((value, i) => {
            const cell = row.insertCell();
            // "Hästnamn" column
            if (theadRow?.cells[i]?.textContent === "Hästnamn") {
                let inner = value;
                if (horse.mlUpsetPercentage >= 15 && horse.bettingPercentage < 10) {
                    inner += ` <span title="Hög skrällpotential (ML Upset ${horse.mlUpsetPercentage}%, Spelprocent ${horse.bettingPercentage}%)">🔥</span>`;
                }
                // New spik icon logic
                const isFavorite = horse.folkRank === 1;
                const isTopSpik = horse.mlSpikPercentage === topSpik;
                if (isFavorite && isTopSpik && spikGap >= 3) {
                    let locks = "";
                    if (topSpik >= 50) {
                        locks = "🔒🔒🔒";
                    } else if (topSpik >= 40) {
                        locks = "🔒🔒";
                    } else {
                        locks = "🔒";
                    }
                    inner += ` <span title="Modellen markerar spik pga högst ML Spik (${horse.mlSpikPercentage}%) och tydligt gap till nästa (${spikGap}%)">${locks}</span>`;
                }
                cell.innerHTML = inner;
            } else if (theadRow?.cells[i]?.textContent === "Form") {
                // Show tooltip for Form column: last 10 starts, total points before log
                const wins = horse.lastTenStarts?.filter(s => s.placement === 1).length ?? 0;
                const seconds = horse.lastTenStarts?.filter(s => s.placement === 2).length ?? 0;
                const thirds = horse.lastTenStarts?.filter(s => s.placement === 3).length ?? 0;
                const totalPointsBeforeLog = horse._formRawTotal ?? "?";
                const tooltip = `Placeringar (10 senaste starter):\n1:a: ${wins}\n2:a: ${seconds}\n3:e: ${thirds}\nPoäng före log: ${totalPointsBeforeLog}`;
                cell.innerHTML = `<span title="${tooltip}">${value}</span>`;
            } else if (theadRow?.cells[i]?.textContent === "H2H") {
                const meetings = horse.h2hMeetings ?? [];
                const tooltip = meetings.length
                    ? meetings.map(m => `${m.raceId}: ${m.result} (${m.selfPosition} vs ${m.opponentPosition}) mot ${m.opponent}`).join("\n")
                    : "Inga H2H-möten hittades";
                cell.innerHTML = `<span title="${tooltip}">${value}</span>`;
            } else if (theadRow?.cells[i]?.textContent === "Tid") {
                // Visa tooltip för Tid-kolumnen
                cell.innerHTML = `<span title="${horse.timeTooltip ?? ''}">${value}</span>`;
            } else {
                cell.textContent = value;
            }
            cell.style.textAlign = "center";

            // Styla spelprocent-kolumnen
            if (i === 5) cell.classList.add("spelprocent");
            if (i === 14) cell.title = horse.equipmentDescription;

            // Highlight edge columns in green/red
            if (["Edge %", "ML Edge %"].includes(theadRow?.cells[i]?.textContent)) {
                const val = parseInt(value, 10);
                if (val > 4) cell.style.color = "green";
                else if (val < -4) cell.style.color = "red";
            }
            // Ensure all cells are center aligned (redundant with above, but for completeness)
            cell.style.textAlign = "center";
        });
    });

    function createCsvStringForHorses(horses) {
        // Header row
        let csv = "Startnummer;Horse;Placement;Won;Form;Odds;BettingPercentage;Driver;Trainer;Equipment;Class;HeadToHead;Time;StartPositionScore;FolkScore\n";

        horses.forEach((horse) => {
            const placement = typeof horse.place === 'number' ? horse.place : 0;
            const won = placement === 1 ? 1 : 0;

            console.log("horse.startNumber:", horse.startNumber);
            console.log("formatSpelprocent(horse.bettingPercentage):", formatSpelprocent(horse.bettingPercentage));
            console.log("horse.classPoints:", horse.classPoints);


            const row = [
                horse.startNumber,
                horse.horseName,
                placement,
                won,
                horse.formPoints,
                horse.odds,
                formatSpelprocent(horse.bettingPercentage),
                horse.driverPoints,
                horse.trainerPoints,
                horse.equipmentPoints,
                horse.classPoints,
                horse.headToHeadPoints,
                horse.timePoints,
                horse.startPositionPoints,
                horse.bettingPercentagePoints
            ];
            csv += row.join(";") + "\n";
        });

        return csv;
    }

    // eventlistener för kopieringsknappen
    document.getElementById("copy-startlist-btn").addEventListener("click", () => copyStartListToClipboard(race, horses));

    // Lägg till en knapp i HTML: <button id="fetch-multi-csv-btn">Ladda ner flera startlistor (CSV)</button>


    // Multi-race CSV download
    document.getElementById("fetch-multi-csv-btn").addEventListener("click", downloadMultipleStartLists);

    /**
     * Prompt user for date range and game types,
     * then fetch, transform, and zip CSV files for each race.
     */
    async function downloadMultipleStartLists() {
        try {
            const defaultDate = new Date().toISOString().slice(0,10);
            const startDate = prompt("Från vilket datum? (YYYY-MM-DD):", defaultDate) || defaultDate;
            const endDate = prompt("Till vilket datum? (YYYY-MM-DD):", startDate) || startDate;
            const defaultGames = "V75,V86";
            const gameTypes = (prompt("Spelformer (kommaseparerat, t.ex. V75,V86):", defaultGames) || defaultGames)
                .split(",")
                .map(s => s.trim().toUpperCase());

            const zip = new JSZip();
            let fileCount = 0;
            const dates = getDateRange(startDate, endDate);

            for (const dateStr of dates) {
                const calendarUrl = `https://www.atg.se/services/racinginfo/v1/api/calendar/day/${dateStr}`;
                const calendar = await fetch(calendarUrl).then(r => r.json());
                for (const gt of gameTypes) {
                    const games = calendar.games[gt] || [];
                    for (const game of games) {
                        const gameUrl = `https://www.atg.se/services/racinginfo/v1/api/games/${game.id}`;
                        const gameData = await fetch(gameUrl).then(r => r.json());
                        const startsData = await fetchStartData(gameData.races);
                        const transformed = transformRaces(gameData.races, startsData);
                        for (const race of transformed) {
                            const horses = calculatePointsForRace(race, gt);
                            const csv = createCsvStringForHorses(horses);
                            zip.file(`ML_${race.id}.csv`, csv);
                            fileCount++;
                        }
                    }
                }
            }

            if (fileCount === 0) {
                alert("Inga startlistor hittades för valt intervall och spelform(er).");
                return;
            }

            const blob = await zip.generateAsync({ type: "blob" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `startlistor_${startDate}_till_${endDate}.zip`;
            link.click();
            URL.revokeObjectURL(link.href);
        } catch (err) {
            console.error("Fel vid nedladdning:", err);
            alert("Ett fel uppstod vid nedladdning av startlistor.");
        }
    }

    /**
     * Return an array of YYYY-MM-DD strings from start to end inclusive.
     */
    function getDateRange(start, end) {
        const dates = [];
        let curr = new Date(start);
        const last = new Date(end);
        while (curr <= last) {
            dates.push(curr.toISOString().slice(0,10));
            curr.setDate(curr.getDate() + 1);
        }
        return dates;
    }

    const downloadButton = document.getElementById('download-ml-csv');
    downloadButton.style.display = 'block';
    downloadButton.onclick = () => downloadCsvForML(race, horses);

    makeTableSortable();
}

function copyStartListToClipboard(race, horses) {
    const date = race.date ?? "okänt datum";
    const track = race.trackName ?? "okänd bana";
    const raceNumber = race.number ?? "N/A";
    const distance = race.distance ?? "N/A";
    const startMethod = race.startMethod ?? "N/A";

    // let tableData = `${raceTitle}\n`; // Lägg till rubriken

    // Lägg till tab-separerade rubriker
    let tableData = "Datum\tBana\tLopp\tDistans\tStartmetod\tRank\tStartnr\tHästnamn\tSpelprocent\tFolket\tStartspår\tForm\tTid\tH2H\tKusk\tTränare\tUtrustning\tKlass\tTotalt\n";

    // Lägg till varje hästs data
    horses.forEach((horse, index) => {
        tableData += `${date}\t${track}\t${raceNumber}\t${distance}\t${startMethod}\t${index + 1}\t${horse.startNumber}\t${horse.horseName}\t${formatSpelprocent(horse.bettingPercentage)}\t${horse.bettingPercentagePoints}\t${horse.startPositionPoints}\t${horse.formPoints}\t${horse.timePoints}\t${horse.headToHeadPoints}\t${horse.driverPoints}\t${horse.trainerPoints}\t${horse.equipmentPoints}\t${horse.classPoints}\t${horse.totalPoints}\n`;
    });

    // Kopiera till clipboard
    navigator.clipboard.writeText(tableData)
        .catch(err => console.error("❌ Misslyckades att kopiera startlistan:", err));
}

function downloadCsvForML(race, horses) {
    const csv = createCsvStringForHorses(horses);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ML_${race.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

function formatSpelprocent(value) {
    return value.toString().replace(".", ",");
}

function makeTableSortable() {
    const STORAGE_KEY = "startListSort";
    const table = document.querySelector("#start-list");
    const tbody = table.querySelector("tbody");
    const headers = table.querySelectorAll("th[data-sortable='true']");

    function clearSortIndicators() {
        headers.forEach(h => {
            h.textContent = h.textContent.replace(/ ▲| ▼/g, "");
            h.classList.remove("sorted-asc", "sorted-desc");
        });
    }

    function sortTable(columnIndex, ascending) {
        const rows = Array.from(tbody.querySelectorAll("tr"));

        rows.sort((a, b) => {
            const parseValue = (cell) => {
                const text = cell.textContent.trim().replace(",", ".");
                const num = parseFloat(text);
                return isNaN(num) ? Number.NEGATIVE_INFINITY : num;
            };

            const aIsScratched = a.style.textDecoration === "line-through";
            const bIsScratched = b.style.textDecoration === "line-through";

            if (aIsScratched && !bIsScratched) return 1;
            if (!aIsScratched && bIsScratched) return -1;

            const aCell = a.cells[columnIndex];
            const bCell = b.cells[columnIndex];
            const aVal = parseValue(aCell);
            const bVal = parseValue(bCell);

            return ascending ? aVal - bVal : bVal - aVal;
        });

        clearSortIndicators();
        const header = headers[columnIndex];
        header.classList.add(ascending ? "sorted-asc" : "sorted-desc");
        header.textContent = header.textContent.replace(/ ▲| ▼/g, "") + (ascending ? " ▲" : " ▼");
        rows.forEach(row => tbody.appendChild(row));
    }

    headers.forEach((header) => {
        header.style.cursor = "pointer";
        header.addEventListener("click", () => {
            const allThs = Array.from(header.parentElement.children);
            const columnIndex = allThs.indexOf(header);
            const ascending = !header.classList.contains("sorted-asc");
            sortTable(columnIndex, ascending);
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ columnIndex, ascending }));
        });
    });

    // Apply saved sort if exists
    const savedSort = localStorage.getItem(STORAGE_KEY);
    if (savedSort) {
        try {
            const { columnIndex, ascending } = JSON.parse(savedSort);
            if (columnIndex >= 0 && columnIndex < headers.length) {
                // Programmatically trigger sort
                sortTable(columnIndex, ascending);
            }
        } catch {
            // ignore JSON parse errors
        }
    }
}