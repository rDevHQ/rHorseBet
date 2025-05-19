import { calculateBettingPercentagePoints } from "./calculateBettingPercentagePoints.js";
import { calculateOddsPoints } from "./calculateOddsPoints.js";
import { calculateStartPositionPoints } from "./calculateStartPositionPoints.js";
import { calculateFormPoints } from "./calculateFormPoints.js";
import { calculateTimePerformance } from "./calculateTimePerformance.js";
import { calculateDriverPoints } from "./calculateDriverPoints.js";
import { calculateTrainerPoints } from "./calculateTrainerPoints.js";
import { calculateEquipmentPoints } from "./calculateEquipmentPoints.js";
import { calculateClassPoints } from "./calculateClassPoints.js";
import { calculateHeadToHeadPoints } from "./calculateHeadToHeadPoints.js";
import { selectedGame } from './fetchData.js';
import { getBettingPercentage } from './getBettingPercentage.js';
import { ML_CATEGORY_WEIGHTS } from "./pointsMLConfig.js";
import { ML_CATEGORY_WEIGHTS as UPSCORE_WEIGHTS } from "./pointsConfigUpsets.js";
import { ML_CATEGORY_WEIGHTS as SPIK_WEIGHTS } from "./pointsConfigSpik.js";

export function displayStartList(race) {
    const container = document.getElementById("start-list-container");
    const gameType = selectedGame ?? "Vinnarodds"; // Standard om inget spel valts

    const validHorses = race.horses.filter(h => !h.scratched);

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
                <th data-sortable="true">Edge %</th>
                <th data-sortable="true">ML Edge %</th>
                <th data-sortable="true">ML Spik %</th>
            </tr>
        </thead>
        <tbody></tbody>
    </table>
    <br>`;

    const tbody = document.querySelector("#start-list tbody");

    let allDrivers = validHorses.map(start => start.driver);
    let allTrainers = validHorses.map(start => start.trainer);
    let allBettingPercentages = validHorses.map(start => getBettingPercentage(start.horse, selectedGame));

    let horses = [];

    race.horses.forEach((start, index) => {
        // console.log(`🐴 Häst: ${start.horse.name}, lastFiveStarts:`, start.lastFiveStarts);

        // Kopiera lastTenStarts för att säkerställa att varje häst har sin egen version
        const lastTenStartsCopy = start.lastTenStarts ? [...start.lastTenStarts] : [];

        const startPositionPoints = calculateStartPositionPoints(start, validHorses, race.startMethod);
        const formPoints = calculateFormPoints(
            start.horse?.name ?? "Okänd häst",
            lastTenStartsCopy,
            start.lastMonthSummary ?? {},
            validHorses
        );
        const timePoints = calculateTimePerformance(
            lastTenStartsCopy,
            race.distance,
            validHorses,
            start.horse?.name ?? "Okänd häst"
        );
        const { points: headToHeadPoints, meetings }= calculateHeadToHeadPoints(
            lastTenStartsCopy,
            validHorses,
            start.horse?.name ?? "Okänd häst"
        );
        const driverPoints = calculateDriverPoints(start.driver, allDrivers) || 1;
        const trainerPoints = calculateTrainerPoints(start.trainer, allTrainers) || 1;

        // console.log("✅ Kontroll av startdata:", start.horse?.name, start.horse.shoes, start.horse.sulky);
        const equipment = calculateEquipmentPoints(start.horse, validHorses);

        const classPoints = calculateClassPoints(start, validHorses);

        const odds = start.horse?.odds ?? "N/A";

        const bettingPercentage = getBettingPercentage(start.horse, gameType);
        let bettingPercentagePoints;
        if (bettingPercentage === "N/A" || bettingPercentage == null) {
            const allOdds = race.horses.map(s => parseFloat(s.horse.odds)).filter(o => !isNaN(o));
            const numericOdds = parseFloat(odds);
            bettingPercentagePoints = !isNaN(numericOdds)
                ? calculateOddsPoints(numericOdds, allOdds)
                : 0;
        } else {
            bettingPercentagePoints = calculateBettingPercentagePoints(bettingPercentage, allBettingPercentages);
        }

        const totalPoints = bettingPercentagePoints + startPositionPoints + formPoints + timePoints + headToHeadPoints + driverPoints + trainerPoints + equipment.points + classPoints;

        const mlTotalPoints =
            ML_CATEGORY_WEIGHTS.FolkScore * bettingPercentagePoints +
            ML_CATEGORY_WEIGHTS.Trainer * trainerPoints +
            ML_CATEGORY_WEIGHTS.HeadToHead * headToHeadPoints +
            ML_CATEGORY_WEIGHTS.Equipment * equipment.points +
            ML_CATEGORY_WEIGHTS.Driver * driverPoints +
            ML_CATEGORY_WEIGHTS.Class * classPoints +
            ML_CATEGORY_WEIGHTS.Form * formPoints +
            ML_CATEGORY_WEIGHTS.Time * timePoints +
            ML_CATEGORY_WEIGHTS.StartPositionScore * startPositionPoints;

        const mlUpsetScore =
            UPSCORE_WEIGHTS.FolkScore * bettingPercentagePoints +
            UPSCORE_WEIGHTS.Trainer * trainerPoints +
            UPSCORE_WEIGHTS.HeadToHead * headToHeadPoints +
            UPSCORE_WEIGHTS.Equipment * equipment.points +
            UPSCORE_WEIGHTS.Driver * driverPoints +
            UPSCORE_WEIGHTS.Class * classPoints +
            UPSCORE_WEIGHTS.Form * formPoints +
            UPSCORE_WEIGHTS.Time * timePoints +
            UPSCORE_WEIGHTS.StartPositionScore * startPositionPoints;

        const mlSpikScore =
            SPIK_WEIGHTS.FolkScore * bettingPercentagePoints +
            SPIK_WEIGHTS.Trainer * trainerPoints +
            SPIK_WEIGHTS.HeadToHead * headToHeadPoints +
            SPIK_WEIGHTS.Equipment * equipment.points +
            SPIK_WEIGHTS.Driver * driverPoints +
            SPIK_WEIGHTS.Class * classPoints +
            SPIK_WEIGHTS.Form * formPoints +
            SPIK_WEIGHTS.Time * timePoints +
            SPIK_WEIGHTS.StartPositionScore * startPositionPoints;

        const modelProbability = mlTotalPoints / 100;
        const marketProbability = (bettingPercentage ?? 0) / 100;
        const mlValueEdge = Math.round((modelProbability - marketProbability) * 100);

        const myProbability = totalPoints / 100;
        const myValueEdge = Math.round((myProbability - marketProbability) * 100);

        horses.push({
            startNumber: start.startNumber,
            horseName: start.horse.name,
            odds,
            bettingPercentage,
            bettingPercentagePoints,
            startPositionPoints,
            formPoints,
            timePoints,
            headToHeadPoints,
            h2hMeetings: meetings,
            driverPoints,
            trainerPoints,
            equipmentPoints: equipment.points,
            equipmentDescription: equipment.description,
            classPoints,
            totalPoints,
            mlValueEdge,
            myValueEdge,
            mlTotalPoints,
            mlUpsetScore,
            mlSpikScore,
            scratched: start.scratched ?? false,
            place: start.place ?? start?.horse?.place ?? null,
            _formRawTotal: formPoints._rawTotal ?? undefined,
        });
    });

    const totalMyPoints = horses.reduce((sum, h) => sum + h.totalPoints, 0);
    const totalMLPoints = horses.reduce((sum, h) => sum + h.mlTotalPoints, 0);

    horses.forEach(h => {
        h.myExpectedPercentage = Math.round((h.totalPoints / totalMyPoints) * 100);
        h.mlExpectedPercentage = Math.round((h.mlTotalPoints / totalMLPoints) * 100);
        h.myEdgeVsMarket = h.myExpectedPercentage - Math.round(h.bettingPercentage ?? 0);
        h.mlEdgeVsMarket = h.mlExpectedPercentage - Math.round(h.bettingPercentage ?? 0);
    });

    // ML Upset Percentage calculation
    const totalUpsetScore = horses.reduce((sum, h) => sum + h.mlUpsetScore, 0);
    horses.forEach(h => {
        h.mlUpsetPercentage = Math.round((h.mlUpsetScore / totalUpsetScore) * 100);
    });

    // ML Spik Percentage calculation
    const totalSpikScore = horses.reduce((sum, h) => sum + h.mlSpikScore, 0);
    horses.forEach(h => {
        h.mlSpikPercentage = Math.round((h.mlSpikScore / totalSpikScore) * 100);
    });
    // Find top two ML Spik percentages and their gap
    const sortedSpik = horses.slice().sort((a, b) => b.mlSpikPercentage - a.mlSpikPercentage);
    const topSpik = sortedSpik[0]?.mlSpikPercentage ?? 0;
    const secondSpik = sortedSpik[1]?.mlSpikPercentage ?? 0;
    const spikGap = topSpik - secondSpik;

    horses.sort((a, b) => b.mlTotalPoints - a.mlTotalPoints);
    horses.forEach((h, i) => h.mlRank = i + 1);

    // Folk Rank: Sort by bettingPercentage descending
    horses.sort((a, b) => b.bettingPercentage - a.bettingPercentage);
    horses.forEach((h, i) => h.folkRank = i + 1);

    horses.sort((a, b) => {
        if (a.scratched && !b.scratched) return 1;
        if (!a.scratched && b.scratched) return -1;
        return b.totalPoints - a.totalPoints;
    });

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
            horse.myEdgeVsMarket,
            horse.mlEdgeVsMarket,
            horse.mlSpikPercentage
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

    // eventlistener för kopieringsknappen
    document.getElementById("copy-startlist-btn").addEventListener("click", () => copyStartListToClipboard(race, horses));

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
    let csv = "Startnummer;Horse;Placement;Won;Form;Odds;BettingPercentage;Driver;Trainer;Equipment;Class;HeadToHead;Time;StartPositionScore;FolkScore\n";
    const sortedHorses = horses.slice().sort((a, b) => a.startNumber - b.startNumber);

    sortedHorses.forEach(horse => {
        const placement = typeof horse.place === 'number' ? horse.place : 0;
        const won = placement === 1 ? 1 : 0;
        const row = [
            horse.startNumber,
            horse.horseName,
            placement,
            won,
            horse.formPoints,
            horse.odds ?? 0,
            horse.bettingPercentage ?? '',
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