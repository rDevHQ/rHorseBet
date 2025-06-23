export function calculateEquipmentPointsGalopp(horse) {
    const MAX_CATEGORY_POINTS = 100;

    let points = 0;
    let description = "";

    const current = horse.horse.blinders?.toLowerCase() ?? "";
    const previous = horse.horse.blindersLastStart?.toLowerCase() ?? "";

    if (current === previous) {
        points  = 0;
        description = "Ingen utrustningsförändring: " + (current ? `(${current})` : "");
    } else {
        points = 100;
        description = ("Utrustning ändrad från: " + (previous || "Ingen") + " till: " + (current || "Ingen"));
    }

    console.log(`🐎 Utrustningspoäng för ${horse.horse.name}:`, points, "Beskrivning:", description);
    return { points, description };
}