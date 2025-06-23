import { calculatePointsForRace } from "./calculatePoints/index.js";
import { selectedGame } from './fetchData.js';
import { fetchStartData } from './fetchData.js';
import { transformRaces } from './transform.js';

export function displayStartList(race) {
    const container = document.getElementById("start-list-container");
    const gameType = selectedGame ?? "Vinnarodds";
    const isGallop = race.sport?.toLowerCase() === "gallop";

    // Skapa rubrik
    const formattedStartMethod = race.startMethod === "volte" ? "Voltstart" : race.startMethod;
    const raceTitle = `${race.trackName} Lopp ${race.number}`;
    const raceDistance = `${race.distance}m ${formattedStartMethod}`;
    const raceName = race.name ? `<span class="race-name">${race.name}</span>` : "";
    const raceId = race.id;

    let columnHeaders = [
        "Placering", "Folk Rank", "Poäng", "Rank", "Startnr", "Hästnamn", "Kusk/Jockey", "Odds", "Spelprocent", "Folket", "Form", "H2H", "Kusk/Jockey", "Tränare", "Utrustning"];
    if (isGallop) {
        columnHeaders.splice(16, 0, "Plustal");
        columnHeaders.splice(17, 0, "kr/start i år");
        columnHeaders.splice(18, 0, "kr/start 2 år");
    } else {
        columnHeaders.splice(9, 0, "Tid");
        columnHeaders.splice(10, 0, "Startspår");
        columnHeaders.splice(16, 0, "Klass");
    }
    const theadHtml = `<thead><tr>${columnHeaders.map(h => `<th data-sortable="true">${h}</th>`).join("")}</tr></thead>`;
    container.innerHTML = `<h2>${raceTitle}</h2>${raceDistance} - ${raceName}
    <table id="start-list">
        ${theadHtml}
        <tbody></tbody>
    </table>
    <br>`;

    // Legend för ML‐poäng efter percentilgränser
    const legend = document.createElement('div');
    legend.innerHTML = `
        <div style="display: flex; gap: 18px; margin: 4px 0 0 0; font-size: 0.92em;">
            <span class="1-percentile-score">Vinner ca 65 % av loppen (&gt; 72)</span>
            <span class="2-percentile-score">Vinner ca 25 % av loppen (57–72)</span>
            <span class="3-percentile-score">Vinner ca 7,5 % av loppen (44–57)</span>
            <span class="4-percentile-score">Vinner ca 2,5 % av loppen (&lt; 44)</span>
        </div>
    `;
    container.appendChild(legend);

    const tbody = document.querySelector("#start-list tbody");

    // --- NYTT: Använd ENDAST calculatePointsForRace ---
    let horses = calculatePointsForRace(race, gameType);

    // Beräkna skillnad i rankpoäng mellan första rankade och andra rankade
    const sortedRank = horses.slice().sort((a, b) => a.mlRank - b.mlRank);
    const firstPoints = sortedRank[0]?.mlPoints ?? 0;
    const secondPoints = sortedRank[1]?.mlPoints ?? 0;
    const thirdPoints = sortedRank[2]?.mlPoints ?? 0;
    const mlGapFirstToSecond = Math.round(firstPoints) - Math.round(secondPoints);
    const mlGapSecondToThird = Math.round(secondPoints) - Math.round(thirdPoints);

    // --- Efterbearbetning och sortering (om du vill ha ytterligare rank/edge) ---
    // (Du kan behålla din nuvarande kod här om du vill, men det mesta kan flyttas till calculatePointsForRace)

    // --- Bygg tabellrader från horses ---
    horses.forEach((horse, index) => {
        const row = tbody.insertRow();
        row.classList.add("horse-row"); // För hover-effekten

        // Highlight row by ML score
        const scoreVal = Number(horse.mlPoints.toFixed(0));
        if (scoreVal >= 72) {
            row.classList.add("1-percentile-score");
        } else if (scoreVal >= 57) {
            row.classList.add("2-percentile-score");
        } else if (scoreVal >= 44) {
            row.classList.add("3-percentile-score");
        } else {
            row.classList.add("4-percentile-score");
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

        // Dynamically build row values depending on isGallop
        const rowValues = [
            horse.place,
            horse.folkRank,
            horse.mlPoints.toFixed(0),
            horse.mlRank,
            horse.startNumber,
            horse.horseName,
            horse.driverName,
            horse.odds,
            formatSpelprocent(horse.bettingPercentage),

            horse.bettingPercentagePoints,
        ];

        console.log("Horse:", horse);
        if (isGallop) {
            rowValues.push(
                horse.formPoints,
                horse.headToHeadPoints,
                horse.driverPoints,
                horse.trainerPoints,
                horse.equipmentPoints,
                horse.weightAdjustedRatingPoints,
                horse.earningsPerStartCurrentYearPoints,
                horse.earningsPerStartLastTwoYearsPoints,
            );
        } else {
            rowValues.push(
                horse.timePoints,
                horse.startPositionPoints,
                horse.formPoints,
                horse.headToHeadPoints,
                horse.driverPoints,
                horse.trainerPoints,
                horse.equipmentPoints,
                horse.classPoints,
            );
        }


        // --- Expandable details row on click ---
        row.addEventListener("click", () => {
            // Remove detail row if this row is already expanded
            if (row.nextSibling?.classList?.contains("details-row")) {
                row.nextSibling.remove();
                return;
            }

            // First remove any other open detail rows
            document.querySelectorAll(".details-row").forEach(r => r.remove());

            // Create a new detail row directly after the clicked row
            const detailsRow = row.insertAdjacentElement("afterend", document.createElement("tr"));
            detailsRow.classList.add("details-row");
            const detailsCell = document.createElement("td");
            detailsCell.colSpan = theadRow.cells.length;
            detailsRow.appendChild(detailsCell);

            let html = `
                <div style="
                    padding: 12px 16px;
                    background: #eef4fc;
                    font-size: 0.95em;
                    border-top: 2px solid #c2d3f2;
                    box-shadow: inset 0 3px 6px rgba(0, 0, 0, 0.04);
                    animation: fadeSlideIn 0.3s ease-out;
                ">
            `;
            if (horse.equipmentDescription) {
                html += `<strong>Utrustning:</strong> ${horse.equipmentDescription}<br>`;
            }
            if (horse.horse?.handicapRating) {
                html += `<strong>Handicaptal:</strong> ${horse.horse.handicapRating}<br>`;
            }
            if (horse.weight) {
                html += `<strong>Vikt:</strong> ${horse.weight} kg<br>`;
            }
            if (horse.h2hMeetings && horse.h2hMeetings.length > 0) {
                html += `<br>H2H-möten:<br>`;
                html += horse.h2hMeetings.map(m =>
                    `${m.raceId}: ${m.result} (${m.selfPosition} vs ${m.opponentPosition}) mot ${m.opponent} (styrka ${m.opponentBettingPoints ?? 0}/100)`
                ).join("<br>") + "<br>";
            }
            html += "</div>";
            detailsCell.innerHTML = html;
        });

        rowValues.forEach((value, i) => {
            const cell = row.insertCell();
            // "Hästnamn" column
            if (theadRow?.cells[i]?.textContent === "Hästnamn") {
                let inner = value;
                // Visa eld-ikoner för skrällpotential (eldflammor)
                if (horse.mlUpsetScore.toFixed(0) >= 85 && horse.bettingPercentagePoints < 60) {
                    inner += ` <span title="Hög skrällpotential (ML Skrällpoäng ${horse.mlUpsetScore.toFixed(0)}, Skrällrank ${horse.mlUpsetRank})">🔥🔥🔥</span>`;
                } else if (horse.mlUpsetScore.toFixed(0) >= 80 && horse.bettingPercentagePoints < 60) {
                    inner += ` <span title="Hög skrällpotential (ML Skrällpoäng ${horse.mlUpsetScore.toFixed(0)}, Skrällrank ${horse.mlUpsetRank})">🔥🔥</span>`;
                } else if (horse.mlUpsetScore.toFixed(0) >= 75 && horse.bettingPercentagePoints < 60) {
                    inner += ` <span title="Hög skrällpotential (ML Skrällpoäng ${horse.mlUpsetScore.toFixed(0)}, Skrällrank ${horse.mlUpsetRank})">🔥</span>`;
                }

                // Avrunda värden till två decimaler
                const score = Number(horse.mlPoints.toFixed(2));           // ML-poängen för vinnaren
                const gap12 = Number(mlGapFirstToSecond.toFixed(2));       // Skillnad mellan 1:a och 2:a
                const gap23 = Number(mlGapSecondToThird.toFixed(2));       // Skillnad mellan 2:a och 3:e

                // 1) LÅS – när ML tror att tvåan är nästan lika stark som ettan (gap12 ≤ 3)
                //    men att det är ett stort glapp ner till trean (gap23 ≥ 10).
                //    Här är vi fortfarande i “Medium”-territoriet (score ≥ 70.43).
                if ((horse.mlRank === 1 || horse.mlRank === 2) && score >= 70.43 && gap12 <= 3 && gap23 >= 10) {
                    inner += ` <span title="Lås! (Score ${score}, Gap1–2: ${gap12}, Gap2–3: ${gap23})">🔒</span>`;

                    // 2) SPIK – när vi är extremt säkra (Very High).  
                    //    Tidigare definierad som ≥ 92% historisk träff, dvs score ≥ 82.41 och gap12 ≥ 43.79
                } else if (horse.mlRank === 1 && score >= 82.41 && gap12 >= 10) {
                    inner += ` <span title="Spik! (Score ${score}, Gap1–2: ${gap12})  – historisk träffsäkerhet 98 %">🎯🎯🎯</span>`;

                    // 3) SANNOLIK SPIK – hög säkerhet (≈95%).  
                    //    score ≥ 78.42 och gap12 ≥ 15.04
                } else if (horse.mlRank === 1 && score >= 78.42 && gap12 >= 10.00) {
                    inner += ` <span title="Sannolik spik (Score ${score}, Gap1–2: ${gap12}) – historisk träffsäkerhet 95 %">🎯🎯</span>`;

                    // 4) SPIKFÖRSLAG – medelhög säkerhet (≈90%).  
                    //    score ≥ 70.43 och gap12 ≥ 7
                } else if (horse.mlRank === 1 && score >= 70.43 && gap12 >= 10) {
                    inner += ` <span title="Spikförslag (Score ${score}, Gap1–2: ${gap12}) – historisk träffsäkerhet 90 %">🎯</span>`;
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
                    ? meetings.map(m =>
                        `${m.raceId}: ${m.result} (${m.selfPosition} vs ${m.opponentPosition}) mot ${m.opponent} (styrka ${m.opponentBettingPoints ?? 0})\n➗ Diff: ${(m.diff ?? 0).toFixed(2)}, Margin: ${(m.marginPoints ?? 0).toFixed(2)}, \nViktade poäng: ${m.weightedPoints.toFixed(2)}`
                    ).join("\n\n")
                    : "Inga H2H-möten hittades";
                cell.innerHTML = `<span title="${tooltip}">${value}</span>`;
                // Removed Tid tooltip logic
            } else {
                cell.textContent = value;
            }
            cell.style.textAlign = "center";

            // Styla spelprocent-kolumnen
            if (i === 8) cell.classList.add("spelprocent");
            // Ensure all cells are center aligned (redundant with above, but for completeness)
            cell.style.textAlign = "center";
        });
    });

    // eventlistener för kopieringsknappen
    document.getElementById("copy-startlist-btn").addEventListener("click", () => copyStartListToClipboard(race, horses));

    // Lägg till en knapp i HTML: <button id="fetch-multi-csv-btn">Ladda ner flera startlistor (CSV)</button>


    // Multi-race CSV download
    document.getElementById("fetch-multi-csv-btn").addEventListener("click", (event) => {
        event.preventDefault();
        downloadMultipleStartLists();
    });

    /**
     * Prompt user for date range and game types,
     * then fetch, transform, and zip CSV files for each race.
     */
    async function downloadMultipleStartLists() {
        try {
            let startDate, endDate, gameTypes, selectedSport;
            const defaultDate = new Date().toISOString().slice(0, 10);
            const defaultStartDate = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
            const defaultGames = "vinnare";
            const defaultSport = "galopp"; // Default to galopp

            startDate = prompt("Från vilket datum? (YYYY-MM-DD):", defaultStartDate);
            if (!startDate) return;

            endDate = prompt("Till vilket datum? (YYYY-MM-DD):", defaultDate);
            if (!endDate) return;

            const gameInput = prompt("Spelformer (kommaseparerat, t.ex. V75,V86):", defaultGames);
            if (!gameInput) return;
            gameTypes = gameInput.split(",").map(s => s.trim());

            selectedSport = prompt("Vilken sport vill du ladda ner? (trav, galopp, både)", defaultSport)?.toLowerCase();
            if (!selectedSport) return;

            const zip = new JSZip();
            let fileCount = 0;
            const dates = getDateRange(startDate, endDate);

            for (const dateStr of dates) {
                const calendarUrl = `https://www.atg.se/services/racinginfo/v1/api/calendar/day/${dateStr}`;
                console.log(`Hämtar kalenderdata för ${dateStr} från ${calendarUrl}`);
                const calendar = await fetch(calendarUrl).then(r => r.json());
                for (const gt of gameTypes) {
                    const games = calendar.games[gt] || [];
                    console.log(`Hämtar spel för ${gt} den ${dateStr} (${games.length} spel)`);
                    for (const game of games) {
                        const gameUrl = `https://www.atg.se/services/racinginfo/v1/api/games/${game.id}`;
                        console.log(`Hämtar speldata för: ${game.id} från ${gameUrl}`);
                        const gameData = await fetch(gameUrl).then(r => r.json());
                        // Defensive check for missing gameData or races
                        if (!gameData || !gameData.races) {
                            console.warn(`Hoppar över spel: ${game.id} – gameData saknar races (antal races: ${(gameData && gameData.races) ? gameData.races.length : 0})`);
                            continue;
                        }
                        //console.log(`✅ Antal races före filtrering: ${gameData.races.length}`);
                        // Filter races for fetching startdata based on selectedSport
                        const filteredRacesForStarts = gameData.races.filter(race => {
                            const isSwedish = race.track?.countryCode === "SE";
                            const isRidsport = race.track?.id === 47;
                            if (selectedSport === "trav") return race.sport?.toLowerCase() === "trot" && isSwedish;
                            if (selectedSport === "galopp") return race.sport?.toLowerCase() === "gallop" && isSwedish && !isRidsport;
                            return isSwedish; // både
                        });

                        const startsData = await fetchStartData(filteredRacesForStarts);
                        console.log("filteredRacesForStarts", filteredRacesForStarts);
                        console.log("startsData", startsData);
                        console.log("transformRaces input", filteredRacesForStarts, startsData);
                        const transformed = transformRaces(filteredRacesForStarts, startsData);
                        console.log("transformed", transformed);
                        for (const race of transformed) {
                            const horses = calculatePointsForRace(race, gt);
                            const csv = createCsvStringForHorses(horses, race.sport?.toLowerCase() === "gallop" ? "gallop" : "trav");
                            zip.file(`ML_${race.id}.csv`, csv);
                            fileCount++;
                        }
                    }
                }
            }
            console.warn(`⚠️ fileCount är ${fileCount}. Kontrollera om filtreringen av races missar något.`);
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
            console.error("Fel vid nedladdning:", err, JSON.stringify(err));
            alert("Ett fel uppstod vid nedladdning av startlistor: " + (err?.message || err));
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
            dates.push(curr.toISOString().slice(0, 10));
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
    const isGallop = race.sport?.toLowerCase() === "gallop";
    let tableData;
    if (isGallop) {
        tableData = "Datum\tBana\tLopp\tDistans\tStartmetod\tRank\tStartnr\tHästnamn\tSpelprocent\tFolket\tForm\tH2H\tKusk\tTränare\tUtrustning\tKlass\tTotalt\n";
    } else {
        tableData = "Datum\tBana\tLopp\tDistans\tStartmetod\tRank\tStartnr\tHästnamn\tSpelprocent\tFolket\tStartspår\tForm\tTid\tH2H\tKusk\tTränare\tUtrustning\tKlass\tTotalt\n";
    }
    horses.forEach((horse, index) => {
        if (isGallop) {
            tableData += `${date}\t${track}\t${raceNumber}\t${distance}\t${startMethod}\t${index + 1}\t${horse.startNumber}\t${horse.horseName}\t${formatSpelprocent(horse.bettingPercentage)}\t${horse.bettingPercentagePoints}\t${horse.formPoints}\t${horse.headToHeadPoints}\t${horse.driverPoints}\t${horse.trainerPoints}\t${horse.equipmentPoints}\t${horse.classPoints}\t${horse.totalPoints}\n`;
        } else {
            tableData += `${date}\t${track}\t${raceNumber}\t${distance}\t${startMethod}\t${index + 1}\t${horse.startNumber}\t${horse.horseName}\t${formatSpelprocent(horse.bettingPercentage)}\t${horse.bettingPercentagePoints}\t${horse.startPositionPoints}\t${horse.formPoints}\t${horse.timePoints}\t${horse.headToHeadPoints}\t${horse.driverPoints}\t${horse.trainerPoints}\t${horse.equipmentPoints}\t${horse.classPoints}\t${horse.totalPoints}\n`;
        }
    });
    navigator.clipboard.writeText(tableData)
        .catch(err => console.error("❌ Misslyckades att kopiera startlistan:", err));
}

function downloadCsvForML(race, horses) {
    try {
        console.log("🔄 Försöker skapa CSV för:", race.id, horses);
        const sport = race.sport?.toLowerCase() === "gallop" ? "gallop" : "trav";
        const csv = createCsvStringForHorses(horses, sport);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `ML_${race.id}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (err) {
        console.error("❌ Fel vid export av startlista:", err);
        console.log("❗️ Misslyckades att ladda ner CSV för race:", race.id);
    }
}

function createCsvStringForHorses(horses, sport) {
    // Header row

    let csv;
    if (sport === "gallop") {
        csv = "Startnumber;Horse;PeoplesRank;Placement;Won;formPoints;driverPoints;trainerPoints;equipmentPoints;weightAdjustedRatingPoints;headToHeadPoints;earningsPerStartCurrentYearPoints;earningsPerStartLastTwoYearsPoints;bettingPercentagePoints\n";
    } else {
        csv = "Startnumber;Horse;PeoplesRank;Placement;Won;formPoints;driverPoints;trainerPoints;equipmentPoints;classPoints;headToHeadPoints;timePoints;startPositionPoints;bettingPercentagePoints\n";
    }
    horses.forEach((horse) => {
        const placement = typeof horse.place === 'number' ? horse.place : 0;
        const won = placement === 1 ? 1 : 0;
        let row;
        if (sport === "gallop") {
            row = [
                horse.startNumber,
                horse.horseName,
                horse.folkRank,
                placement,
                won,
                horse.formPoints,
                horse.driverPoints,
                horse.trainerPoints,
                horse.equipmentPoints,
                horse.weightAdjustedRatingPoints,
                horse.headToHeadPoints,
                horse.earningsPerStartCurrentYearPoints,
                horse.earningsPerStartLastTwoYearsPoints,
                horse.bettingPercentagePoints
            ];
        } else {
            row = [
                horse.startNumber,
                horse.horseName,
                horse.folkRank,
                placement,
                won,
                horse.formPoints,
                horse.driverPoints,
                horse.trainerPoints,
                horse.equipmentPoints,
                horse.classPoints,
                horse.headToHeadPoints,
                horse.timePoints,
                horse.startPositionPoints,
                horse.bettingPercentagePoints
            ];
        }
        csv += row.join(";") + "\n";
    });
    return csv;
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
// Add fadeSlideIn animation for details row
const style = document.createElement('style');
style.textContent = `
@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
`;
document.head.appendChild(style);