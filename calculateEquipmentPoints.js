import { EQUIPMENT_POINTS, MAX_CATEGORY_POINTS } from "./pointsConfig.js";

/**
 * Beräknar utrustningspoäng utifrån ändringar i skor och sulky,
 * och justerar poängen beroende på hur vanligt förekommande ändringen är i fältet.
 */
export function calculateEquipmentPoints(horse, allHorses) {
   
    let baseScore = 0;
    const horseName = horse.name ?? "Okänd häst";

    console.log(`🧪 [${horseName}] shoes:`, horse.shoes);
    console.log(`🧪 [${horseName}] sulky:`, horse.sulky);

    // Identifiera ändringar
    const isFrontBarefoot = horse.shoes?.front?.changed === true && horse.shoes?.front?.hasShoe === false;
    const isBackBarefoot = horse.shoes?.back?.changed === true && horse.shoes?.back?.hasShoe === false;
    const isSwitchToShoes = (
        (horse.shoes?.front?.changed === true && horse.shoes?.front?.hasShoe === true) ||
        (horse.shoes?.back?.changed === true && horse.shoes?.back?.hasShoe === true)
    );
    const isYankee = horse.sulky?.type?.changed === true &&
        horse.sulky?.type?.text?.toLowerCase().includes("amerikansk");

    if (isFrontBarefoot) baseScore += EQUIPMENT_POINTS.FIRST_TIME_BAREFOOT;
    if (isBackBarefoot) baseScore += EQUIPMENT_POINTS.FIRST_TIME_BAREFOOT;
    if (isSwitchToShoes) baseScore += EQUIPMENT_POINTS.SHOES_INSTEAD_OF_BAREFOOT;
    if (isYankee) baseScore += EQUIPMENT_POINTS.SWITCH_TO_YANKER;

    const changes = [];
    if (isFrontBarefoot) changes.push("Barfota fram");
    if (isBackBarefoot) changes.push("Barfota bak");
    if (isSwitchToShoes) changes.push("Till skor");
    if (isYankee) changes.push("Jänkarvagn");

    if (baseScore === 0) {
        console.log(`⚠️ [${horseName}] Inga utrustningsändringar. Poäng: 0`);
        return 0;
    }

    // Identifiera hur många andra har gjort liknande ändringar
    let similarChangeCount = 0;

    allHorses.forEach(other => {
        const otherHorse = other.horse ?? other;
        const otherName = otherHorse.name;
        if (otherName === horseName) return;
    
        const otherFrontBarefoot = otherHorse.shoes?.front?.changed === true && otherHorse.shoes?.front?.hasShoe === false;
        const otherBackBarefoot = otherHorse.shoes?.back?.changed === true && otherHorse.shoes?.back?.hasShoe === false;
        const otherYankee = otherHorse.sulky?.type?.changed === true &&
            otherHorse.sulky?.type?.text?.toLowerCase().includes("amerikansk");
    
        const sharesChange =
            (isFrontBarefoot && otherFrontBarefoot) ||
            (isBackBarefoot && otherBackBarefoot) ||
            (isYankee && otherYankee);
    
        if (sharesChange) {
            similarChangeCount++;
        }
    });

    const adjustmentFactor = 1 - Math.min(similarChangeCount / allHorses.length, 0.8);
    const adjustedScore = Math.round(baseScore * adjustmentFactor);
    const finalScore = Math.max(0, Math.min(adjustedScore, MAX_CATEGORY_POINTS.utrustning));

    console.log(`🔧 [${horseName}] Ändringar: ${changes.join(", ") || "Inga"}`);
    console.log(`📊 [${horseName}] Grundpoäng: ${baseScore}, Delar ändring med ${similarChangeCount} andra → Justerad poäng: ${finalScore}`);

    return finalScore;
}