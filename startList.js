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

let previousDownloadUrl = null;

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
                <th>Rank</th>
                <th>Startnr</th>
                <th>Hästnamn</th>
                <th>Odds</th>
                <th>Spelprocent</th>
                <th>Folket</th>
                <th>Startspårs</th>
                <th>Form</th>
                <th>Tid</th>
                <th>H2H</th>
                <th>Kusk</th>
                <th>Tränare</th>
                <th>Utrustning</th>
                <th>Klass</th>
                <th>Totalt</th>
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

        // Kopiera lastFiveStarts för att säkerställa att varje häst har sin egen version
        const lastFiveStartsCopy = start.lastFiveStarts ? [...start.lastFiveStarts] : [];

        const startPositionPoints = calculateStartPositionPoints(start, validHorses, race.startMethod);
        const formPoints = calculateFormPoints(
            start.horse?.name ?? "Okänd häst",
            lastFiveStartsCopy,
            start.last3MonthsSummary ?? {},
            validHorses
        );
        const timePoints = calculateTimePerformance(
            lastFiveStartsCopy,  // Använd kopian istället
            race.distance,
            validHorses,
            start.horse?.name ?? "Okänd häst"
        );
        const headToHeadPoints = calculateHeadToHeadPoints(
            lastFiveStartsCopy,  // Använd kopian istället
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
            driverPoints,
            trainerPoints,
            equipmentPoints: equipment.points,
            equipmentDescription: equipment.description,
            classPoints,
            totalPoints,
            scratched: start.scratched ?? false,
            place: start.place ?? start?.horse?.place ?? null
        });
    });

    horses.sort((a, b) => {
        if (a.scratched && !b.scratched) return 1;
        if (!a.scratched && b.scratched) return -1;
        return b.totalPoints - a.totalPoints;
    });

    horses.forEach((horse, index) => {
        const row = tbody.insertRow();
        row.classList.add("horse-row"); // För hover-effekten

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

        [
            index + 1,
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
            horse.totalPoints
        ].forEach((value, i) => {
            const cell = row.insertCell();
            cell.textContent = value;

            // Styla spelprocent-kolumnen
            if (i === 3) cell.classList.add("spelprocent");
            if (i === 12) cell.title = horse.equipmentDescription;
        });
    });

    // eventlistener för kopieringsknappen
    document.getElementById("copy-startlist-btn").addEventListener("click", () => copyStartListToClipboard(race, horses));

    const downloadButton = document.getElementById('download-ml-csv');
    downloadButton.style.display = 'block';
    downloadButton.onclick = () => downloadCsvForML(race, horses);
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