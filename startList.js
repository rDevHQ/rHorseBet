import { calculateBettingPercentagePoints } from "./calculateBettingPercentagePoints.js";
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

export function displayStartList(race) {
    const container = document.getElementById("start-list-container");
    const gameType = selectedGame ?? "Vinnarodds"; // Standard om inget spel valts

    // Skapa rubrik
    const raceTitle = `${race.trackName} Lopp ${race.number} - ${race.distance}m ${race.startMethod}`;
    const raceName = race.name ? `<span class="race-name"> - ${race.name}</span>` : "";

    container.innerHTML = `<h2>${raceTitle}${raceName}</h2>
    <table id="start-list">
        <thead>
            <tr>
                <th>Rank</th>
                <th>Startnr</th>
                <th>Hästnamn</th>
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
    <button id="copy-startlist-btn">📋 Kopiera till Clipboard</button>`;

    const tbody = document.querySelector("#start-list tbody");

    let allDrivers = race.horses.map(start => start.driver);
    let allTrainers = race.horses.map(start => start.trainer);
    let allBettingPercentages = race.horses.map(start => getBettingPercentage(start.horse, selectedGame));

    let horses = [];

    race.horses.forEach((start, index) => {
        console.log(`🐴 Häst: ${start.horse.name}, lastFiveStarts:`, start.lastFiveStarts);

        // Kopiera lastFiveStarts för att säkerställa att varje häst har sin egen version
        const lastFiveStartsCopy = start.lastFiveStarts ? [...start.lastFiveStarts] : [];

        const startPositionPoints = calculateStartPositionPoints(start, race.horses, race.startMethod);
        const formPoints = calculateFormPoints(
            start.horse?.name ?? "Okänd häst",
            lastFiveStartsCopy,
            start.last3MonthsSummary ?? {},
            race.horses
        );
        const timePoints = calculateTimePerformance(
            lastFiveStartsCopy,  // Använd kopian istället
            race.distance,
            race.horses,
            start.horse?.name ?? "Okänd häst"
        );
        const headToHeadPoints = calculateHeadToHeadPoints(
            lastFiveStartsCopy,  // Använd kopian istället
            race.horses,
            start.horse?.name ?? "Okänd häst"
        );
        const driverPoints = calculateDriverPoints(start.driver, allDrivers) || 1;
        const trainerPoints = calculateTrainerPoints(start.trainer, allTrainers) || 1;
        
        console.log("✅ Kontroll av startdata:", start.horse?.name, start.horse.shoes, start.horse.sulky);
        const equipmentPoints = calculateEquipmentPoints(start.horse, race.horses);

        const classPoints = calculateClassPoints(start, race.horses);

        const bettingPercentage = getBettingPercentage(start.horse, gameType);
        const bettingPercentagePoints = calculateBettingPercentagePoints(bettingPercentage, allBettingPercentages);

        const totalPoints = bettingPercentagePoints + startPositionPoints + formPoints + timePoints + headToHeadPoints + driverPoints + trainerPoints + equipmentPoints + classPoints;

        horses.push({
            startNumber: start.startNumber,
            horseName: start.horse.name,
            bettingPercentage,
            bettingPercentagePoints,
            startPositionPoints,
            formPoints,
            timePoints,
            headToHeadPoints,
            driverPoints,
            trainerPoints,
            equipmentPoints,
            classPoints,
            totalPoints
        });
    });

    horses.sort((a, b) => b.totalPoints - a.totalPoints);

    horses.forEach((horse, index) => {
        const row = tbody.insertRow();
        row.classList.add("horse-row"); // För hover-effekten

        [
            index + 1,
            horse.startNumber,
            horse.horseName,
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
        });
    });

    // eventlistener för kopieringsknappen
    document.getElementById("copy-startlist-btn").addEventListener("click", () => copyStartListToClipboard(race, horses));

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

function formatSpelprocent(value) {
    return value.toString().replace(".", ",");
}