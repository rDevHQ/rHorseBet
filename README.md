# 🎯 Poängsystem – Travanalys

Detta projekt beräknar totalpoäng för varje häst i ett travlopp baserat på flera kategorier. Alla kategorier är normaliserade så att poängen är **relativa till fältet**, vilket innebär att en häst bedöms utifrån hur den står sig mot konkurrenterna – inte bara mot ett absolut värde.

## 🧮 Totalpoäng

Totalpoängen för en häst är summan av följande poängkategorier:

- Folket (bettingprocent)
- Startspår
- Form
- Tid
- H2H (Head-to-head)
- Kusk
- Tränare
- Utrustning
- Klass

Varje kategori har en definierad `MAX_CATEGORY_POINTS` som anger hur mycket den maximalt kan påverka totalpoängen.

---

## 📊 Kategorier och beräkningar

### 🔹 Folket
**Baserat på bettingprocent.**

- Den mest spelade hästen får **maxpoäng**
- Den minst spelade får **0**
- Övriga skalas proportionellt däremellan

> **Normalisering:** `(dinBet - minBet) / (maxBet - minBet) * MAX_POINTS.folket`

---

### 🔹 Startspår
**Poäng baserat på historisk segerprocent för spår.**

- Varje spår tilldelas ett **råvärde** enligt historisk statistik
- Poängen normaliseras inom fältet: bästa spåret får maxpoäng, sämsta 0

---

### 🔹 Form
**Baserat på de 5 senaste starterna + 3-månaderssummering.**

- Placeringar (1–3) viktas: nyare starter väger mer
- Summering (antal 1:a, 2:a, 3:e platser) ger bonuspoäng
- Råpoängen normaliseras mellan fältets min–max till `MAX_POINTS.form`

---

### 🔹 Tid
**Analyserar hästens kilometertid (km-tid) på aktuell distans.**

- En viktad snittid beräknas för varje häst
- Tidsdifferensen mot fältets snitt matchas mot ett tröskelvärde (positiv/neutral/negativ)
- Bonus ges om hästen har snabbast eller färskaste tid
- Totalpoängen begränsas till `MAX_POINTS.tid`

---

### 🔹 H2H (Head-to-head)
**Jämför hur hästen presterat mot andra i samma lopp.**

- För varje gemensamt lopp: +poäng om bättre, −poäng om sämre
- Summan normaliseras relativt till fältets bästa/sämsta H2H
- Maxpoäng styrs av `MAX_POINTS.h2h`

---

### 🔹 Kusk
**Viktad vinstprocent (nuvarande + förra året).**

- Bästa kusken i fältet får `MAX_POINTS.kusk`
- Övriga kuskar får poäng utifrån relativ vinstprocent

---

### 🔹 Tränare
**Precis som kusk – baserat på vinstprocent över två år.**

- Poängen skalas relativt till bästa tränaren i fältet

---

### 🔹 Utrustning
**Belönar unika utrustningsändringar:**

- Barfota, jänkarvagn, etc. ger poäng
- Om många hästar gör samma ändring reduceras poängen (avtagande effekt)
- Normaliseras för att aldrig överskrida `MAX_POINTS.utrustning`

---

### 🔹 Klass
**Bygger på hästens snittprispengar:**

- Både 3-månaderssnitt och snitt från senaste starter beaktas
- Totalpoängen (råklass) normaliseras mellan fältets min–max
- Resultatet begränsas till `MAX_POINTS.klass`

---

## 🧩 Övrigt

- Alla poängfunktioner använder `MAX_CATEGORY_POINTS` från `pointsConfig.js`
- Logik och trösklar (t.ex. bonuspoäng, vikter, placeringar) styrs från konfigfiler
- Fältets data analyseras dynamiskt för att alltid vara relativt

---

## ✅ Exempel: Totalpoängsformel

```js
totalPoints = 
  folket +
  startspår +
  form +
  tid +
  h2h +
  kusk +
  tränare +
  utrustning +
  klass
```

Alla komponenter är 0–X beroende på sin vikt – detta ger en rättvis, transparent och dynamisk poängmodell för ranking och analys.

---

För ytterligare detaljer, se respektive `calculate*.js`-fil.
