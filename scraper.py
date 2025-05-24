import requests
import csv
from datetime import datetime, timedelta

# Anpassa dessa!
FILTERED_GAMES = ["V75", "V86", "GS75"] # Endast spelformer
START_DATE = "2025-05-10" # YYYY-MM-DD
END_DATE = "2025-05-22"   # YYYY-MM-DD

def daterange(start_date, end_date):
    for n in range(int((end_date - start_date).days) + 1):
        yield start_date + timedelta(n)

def fetch_calendar(date):
    url = f"https://www.atg.se/services/racinginfo/v1/api/calendar/day/{date}"
    r = requests.get(url)
    r.raise_for_status()
    return r.json()

def fetch_game(game_id):
    url = f"https://www.atg.se/services/racinginfo/v1/api/games/{game_id}"
    r = requests.get(url)
    r.raise_for_status()
    return r.json()

def to_csv(horses, race, filename):
    with open(filename, "w", newline="", encoding="utf-8") as csvfile:
        writer = csv.writer(csvfile, delimiter=";")
        writer.writerow(["Startnummer", "Horse", "Odds", "Driver", "Trainer"])
        for h in horses:
            writer.writerow([
                h.get("startNumber"),
                h.get("horse", {}).get("name", ""),
                h.get("horse", {}).get("odds", ""),
                h.get("driver", {}).get("name", ""),
                h.get("trainer", {}).get("name", "")
            ])

start = datetime.strptime(START_DATE, "%Y-%m-%d")
end = datetime.strptime(END_DATE, "%Y-%m-%d")

for single_date in daterange(start, end):
    date_str = single_date.strftime("%Y-%m-%d")
    print(f"Hämtar för datum: {date_str}")
    calendar = fetch_calendar(date_str)
    games_for_day = []
    for game_type, g_list in calendar.get("games", {}).items():
        if game_type.upper() in FILTERED_GAMES:
            for g in g_list:
                g["game_type"] = game_type  # Spara spelformen i objektet
                games_for_day.append(g)
    print(f"  Hittade {len(games_for_day)} games för {date_str}")
    for game in games_for_day:
        game_data = fetch_game(game["id"])
        print(f"    Game {game['id']} har {len(game_data.get('races', []))} races")
        for race in game_data.get("races", []):
            starts = race.get("starts", [])
            print(f"      Race {race['number']} har {len(starts)} hästar")
            if starts:
                filename = f"startlista_{date_str}_{game['game_type']}_{race['number']}.csv"
                to_csv(starts, race, filename)
                print("Sparade:", filename)