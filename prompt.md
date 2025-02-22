Här är en JSON-fil med startlistor för ett travlopp. Analysera filen och beräkna varje hästs vinstchans med följande poängmodell:

1️⃣ Startspårspoäng (0-3 poäng)
•	Spår 1-3 = 3 poäng
•	Spår 4-6 = 2 poäng
•	Spår 7-9 = 1 poäng
•	Spår 10-12 = 0 poäng

2️⃣ Prestationer (0-7 poäng)
•	Senaste 5 starter:
•	1 vinst = +3 poäng
•	2 andraplatser = +2 poäng
•	3 tredjeplatser = +1 poäng
•	Extra: Vinstprocent över 30% = +2 poäng, 15-30% = +1 poäng

3️⃣ Odds (0-3 poäng)
•	1.00 - 3.99 = 3 poäng
•	4.00 - 9.99 = 2 poäng
•	10.00 - 19.99 = 1 poäng
•	20.00+ = 0 poäng

4️⃣ Barfotaeffekt (0-1 poäng)
•	Barfota runt om & presterat bra tidigare = +1 poäng
•	Barfota första gången = +0.5 poäng
•	Skor på som vanligt = 0 poäng

5️⃣ Rekord på distansen (0-1 poäng)
•	Hästen med loppets snabbaste rekord på distansen får +1 poäng

6️⃣ Kusk & tränarform (0-1 poäng)
•	Kusk/tränare med över 20% segrar senaste månaden får +1 poäng

Steg för steg:
1.	Läs in filen och identifiera startlistan.
2.	Beräkna varje hästs totalpoäng enligt modellen ovan.
3.	Normalisera poängen så att summan av alla hästars vinstchanser blir 100%.
4.	Presentera resultatet i en tabell med Hästnr, Hästens namn, Totalpoäng och Normaliserad % chans.
5.	Sätt en ⭐ framför den häst som har högst chans att vinna (spikförslag).
