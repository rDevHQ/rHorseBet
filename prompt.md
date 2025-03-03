# 🔥 SLUTGILTIG OPTIMERAD TRAVANALYS-PROMPT 🔥  

Denna analys beräknar **normaliserade vinstchanser** för varje häst baserat på de senaste prestationerna, tider, kusk/tränare, utrustning och konkurrensnivå.  

All data för varje lopp finns i den json-fil som kommer laddas upp.

📌 **Resultatet presenteras i en tabell som är Google Sheets-vänlig (TAB-separerad).**  
📌 **Varje kolumn beräknas strikt enligt de instruktioner som följer.**  
📌 **Folkets Rank inkluderas men påverkar inte beräkningen av vinstchansen.**  

---

## 📊 Viktade analysfaktorer (Maxpoäng per kategori i parentes)  

### 1️⃣ Startspår (Max 10 poäng) – Fasta poäng enligt startmetod
📌 **Voltstart:**  
- **Spår 1, 2, 3, 4** → **10 poäng**  
- **Spår 5, 6, 7** → **8 poäng**  
- **Spår 8-12** → **4 poäng**  

📌 **Autostart:**  
- **Spår 1, 2, 3** → **10 poäng**  
- **Spår 4, 5, 6** → **7 poäng**  
- **Spår 7, 8** → **5 poäng**  
- **Spår 9-12** → **2 poäng**  

---

## 2️⃣ Prestationer – Separata kolumner för placering och tid  
### **Prestationer (placering) – Ingen maxgräns**
📌 **Poäng per lopp (senaste 5 starterna)**  
- **5 poäng** → Vinst  
- **3 poäng** → 2:a plats  
- **2 poäng** → 3:e plats  
- **1 poäng** → 4-5:e plats  
- **0 poäng** → Oplacerad eller diskad  

📌 **Bonuspoäng:**  
- **+2 poäng** → Om hästen varit på pallen **minst 3 gånger senaste 5 loppen** (formbonus).  
- **+2 poäng** → Om hästen tävlat i **högklassiga lopp** baserat på snittprissumman (“firstPrizeAverage”).  

---

### **Prestationer (tid) – Max 10 poäng**
**1️⃣ Beräkna viktat snitt av hästens kilometertider på aktuell distans**  
📌 **Viktning för senaste fem loppen (senaste start = högst vikt):**  
\[
\text{Hästens snittid} = \frac{(S_1 \times 0.35) + (S_2 \times 0.25) + (S_3 \times 0.20) + (S_4 \times 0.12) + (S_5 \times 0.08)}{1.00}
\]
där:  
- **S₁ = Senaste start (35%)**  
- **S₂ = Näst senaste start (25%)**  
- **S₃ = Tredje senaste start (20%)**  
- **S₄ = Fjärde senaste start (12%)**  
- **S₅ = Femte senaste start (8%)**  

📌 **Om hästen inte har 5 lopp på aktuell distans, används bara de lopp som finns.**  

**2️⃣ Beräkna fältets genomsnittliga snittid på aktuell distans**  
\[
\text{Fältets snittid} = \frac{\sum \text{Alla hästars snittider}}{\text{Antal hästar i loppet}}
\]

**3️⃣ Poängsättning baserat på relativ snabbhet**  

| **Skillnad mot fältets snittid** | **Modifiering (Max 10 poäng)** |
|---------------------------------|----------------------|
| **0,5 sek/km snabbare än snittet** | **+10 poäng** |
| **0,3 – 0,5 sek/km snabbare än snittet** | **+7 poäng** |
| **0,1 – 0,3 sek/km snabbare än snittet** | **+5 poäng** |
| **0,1 – 0,3 sek/km långsammare än snittet** | **+2 poäng** |
| **0,3 – 0,5 sek/km långsammare än snittet** | **0 poäng** |
| **0,5 – 1,0 sek/km långsammare än snittet** | **-3 poäng** |
| **1,0 sek/km eller mer långsammare än snittet** | **-5 poäng** |

📌 **Extra tidsbonus:**  
- **+2 poäng** → Om hästens **bästa tid på distansen** är snabbare än fältets bästa snittid.  
- **+2 poäng** → Om hästens **senaste start är snabbare än fältets snittid**.  

---

## 3️⃣ Kusk (Max 10 poäng)
\[
\text{Total kuskpoäng} = (\text{innevarande års vinstprocent} \times 0.7) + (\text{föregående års vinstprocent} \times 0.3)
\]

## 4️⃣ Tränare (Max 6 poäng)
\[
\text{Total tränarpoäng} = (\text{innevarande års vinstprocent} \times 0.7) + (\text{föregående års vinstprocent} \times 0.3)
\]

---

## 5️⃣ Utrustning (Max 5 poäng)
- **+2 poäng** → Om hästen **går barfota fram/bak för första gången på länge.**  
- **+2 poäng** → Om hästen **byter till jänkarvagn.**  
- **-2 poäng avdrag** → Om hästen **går med skor istället för barfota.**  

---

## 6️⃣ Konkurrensnivå (Max 10 poäng)
📌 **Baserat på snittprissumman (“firstPrizeAverage”) i senaste loppen:**  
- **10 poäng** → Hästen har tävlat i lopp med **klart högre snittprissumma än dagens fält.**  
- **7 poäng** → Hästen har tävlat i lopp med **likvärdig snittprissumma.**  
- **4 poäng** → Hästen har tävlat i lopp med **lägre snittprissumma än dagens lopp.**  

---

## 7️⃣ Inbördes möten (Max 10 poäng)
📌 **Hästar som har mött varandra i de senaste 5 loppen analyseras:**  
- **10 poäng** → Vunnit mot **minst 3 konkurrenter flera gånger**.  

---

## 8️⃣ Diskvalifikationer och strukna hästar
- **❌ Struken** → Markera tydligt i tabellen och ge **0% vinstchans**.  

---

## 📌 Tabellstruktur
Tabellen ska vara i Google Sheets-vänligt format med TAB som avgränsare.

| Datum       | Bana       | Lopp | Distans | Startmetod |
|------------|-----------|------|---------|------------|
| [ÅÅÅÅ-MM-DD] | [Bananamn] | [Loppnummer] | [Distans] | [Startmetod] |

| Vinnare | Folkets Rank | Rank | Hästnr | Hästnamn | Startspår (Poäng) | Prestationer (placering) (Poäng) | Prestationer (tid) (Poäng) | Kusk (Poäng) | Tränare (Poäng) | Utrustning (Poäng) | Konkurrensnivå (Poäng) | Inbördes mötespoäng | Totalpoäng | Poängavstånd | Vinstchans % | Förklaring |
|---------|--------------|------|--------|-----------|-------------------|----------------------------------|----------------------|--------------|----------------|----------------|----------------|---------------------|-----------------|------------|---------------|--------------|------------|
| [LÄMNA TOM] | [Folkets rank baserat på spelprocent] | 🔥⭐️ 1 | [Hästnr] | [Hästens Namn] | [Poäng enligt startspårstabellen] | [Poäng enligt placeringstabellen] | [Poäng baserat på snittid mot fältet] | [Poäng baserat på kuskstatistik] | [Poäng baserat på tränarstatistik] | [Poäng för barfota/jänkarvagn/utrustningsändringar] | [Poäng för konkurrensnivå i tidigare lopp] | [Poäng för inbördes möten] | [Totalpoäng] | [Poängavstånd till närmast rankade] | [Normaliserad vinstchans %] | 🔥 Spikförslag – [Förklaring varför det kan vara en spik] |
| [LÄMNA TOM] | [Folkets rank baserat på spelprocent] | 2 | [Hästnr] | [Hästens Namn] | [Poäng enligt startspårstabellen] | [Poäng enligt placeringstabellen] | [Poäng baserat på snittid mot fältet] | [Poäng baserat på kuskstatistik] | [Poäng baserat på tränarstatistik] | [Poäng för barfota/jänkarvagn/utrustningsändringar] | [Poäng för konkurrensnivå i tidigare lopp] | [Poäng för inbördes möten] | [Totalpoäng] | [Poängavstånd till närmast rankade] | [Normaliserad vinstchans %] |  |
| [LÄMNA TOM]| [Folkets rank baserat på spelprocent] | 3 | [Hästnr] | [Hästens Namn] | [Poäng enligt startspårstabellen] | [Poäng enligt placeringstabellen] | [Poäng baserat på snittid mot fältet] | [Poäng baserat på kuskstatistik] | [Poäng baserat på tränarstatistik] | [Poäng för barfota/jänkarvagn/utrustningsändringar] | [Poäng för konkurrensnivå i tidigare lopp] | [Poäng för inbördes möten] | [Totalpoäng] | [Poängavstånd till närmast rankade] | [Normaliserad vinstchans %] |  |
| [LÄMNA TOM] | [Folkets rank baserat på spelprocent] | ⚠️ 4 | [Hästnr] | [Hästens Namn] | [Poäng enligt startspårstabellen] | [Poäng enligt placeringstabellen] | [Poäng baserat på snittid mot fältet] | [Poäng baserat på kuskstatistik] | [Poäng baserat på tränarstatistik] | [Poäng för barfota/jänkarvagn/utrustningsändringar] | [Poäng för konkurrensnivå i tidigare lopp] | [Poäng för inbördes möten] | [Totalpoäng] | [Poängavstånd till närmast rankade] | [Normaliserad vinstchans %] | ⚠️ Möjlig skräll – [Förklaring varför det kan vara en skräll] |
| [LÄMNA TOM] | [Folkets rank baserat på spelprocent] | 5 | [Hästnr] | [Hästens Namn] | [Poäng enligt startspårstabellen] | [Poäng enligt placeringstabellen] | [Poäng baserat på snittid mot fältet] | [Poäng baserat på kuskstatistik] | [Poäng baserat på tränarstatistik] | [Poäng för barfota/jänkarvagn/utrustningsändringar] | [Poäng för konkurrensnivå i tidigare lopp] | [Poäng för inbördes möten] | [Totalpoäng] | [Poängavstånd till närmast rankade] | [Normaliserad vinstchans %] |  |
| - | ❌ Struken | X | [Hästnr] | [Hästens Namn] | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0% |  |
