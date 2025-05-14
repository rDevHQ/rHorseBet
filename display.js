import { displayStartList } from './startList.js';

export function displayRaces(races) {
    console.log(`📌 Kör displayRaces() - Antal lopp: ${races.length}`);

    const racesList = document.getElementById("races");
    racesList.innerHTML = "";

    races.forEach(race => {
        const div = document.createElement("div");
        div.classList.add("card");
        div.textContent = `Race ${race.number}`;

        div.addEventListener("click", () => {
            console.log(`📌 Klickade på lopp ${race.number}, anropar displayRaceDetails()`);
            document.querySelectorAll("#races .card").forEach(btn => btn.classList.remove("selected-race"));
            div.classList.add("selected-race");
            displayRaceDetails(race);
        });

        racesList.appendChild(div);
    });
}

export function displayRaceDetails(race) {
    console.log(`📌 KÖR displayRaceDetails() för lopp ${race.number}`);
    document.getElementById("details").textContent = JSON.stringify(race, null, 2);
    displayStartList(race);
}