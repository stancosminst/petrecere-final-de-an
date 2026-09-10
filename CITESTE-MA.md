# Gestiune Petrecere

Aplicație de telefon pentru gestiunea unei săli de evenimente: invitați, mese, locuri libere și plăți.
Funcționează **complet offline**, iar toate datele se salvează **doar pe telefonul tău**.

---

## Ce poate face

**Acasă** — imaginea de ansamblu
- câți invitați s-au înscris, câți au achitat, câți nu au achitat
- câte locuri mai sunt libere din total
- bare de progres pentru încasări și pentru ocuparea sălii
- acțiuni rapide: adaugă invitat, adaugă o listă întreagă, „cine n-a plătit”, „fără masă”

**Mese**
- toate mesele cu ocuparea lor (ex. `7/10`), inel auriu de progres
- etichete: câte locuri libere / `PLIN` / `+2 peste` (dacă ai pus mai mulți decât locuri)
- apeși pe o masă → vezi harta locurilor, cine stă acolo, cine a plătit
- din masă poți: adăuga un invitat, adăuga o listă, redenumi masa, schimba numărul de locuri, șterge masa
- jos apar invitații care nu au încă masă

**Invitați**
- căutare după nume, telefon sau masă, **fără grija diacriticelor** („tanase" îl găsește pe „Tănase")
- filtre: toți / neachitat / achitat / fără masă
- bifezi plata cu **o singură apăsare** pe cerculețul din dreapta
- apeși pe un invitat → editezi numele, telefonul, masa, plata, observațiile; îl poți suna direct sau șterge
- te avertizează dacă numele există deja în listă (și îți arată la ce masă stă), înainte de a-l adăuga a doua oară
- la „Adaugă o listă" separă numele noi de cele care există deja: poți adăuga doar cele noi sau tot
- după orice ștergere apare jos butonul **Anulează** câteva secunde — pune totul înapoi exact cum era

**Setări**
- numele, data și locația evenimentului
- adaugi mese noi sau schimbi capacitatea tuturor meselor dintr-o mișcare
- **Salvează o copie** → descarcă un fișier cu toate datele (fă asta din când în când!)
- **Încarcă o copie** → restaurează dintr-un fișier salvat
- **Trimite lista ca text** → lista pe mese, gata de trimis pe WhatsApp sau la restaurant
- resetare plăți / ștergere totală

La prima pornire ai deja **10 mese × 10 locuri**.

---

## Cum îl pun pe telefon

### Varianta rapidă (test în aceeași rețea Wi-Fi)
1. Pe calculator, în folderul aplicației, pornește serverul:

   ```bash
   python -m http.server 8123
   ```

2. Pe telefon (conectat la **același** Wi-Fi), deschide în Chrome:
   `http://192.168.1.141:8123`

Merge tot, dar are nevoie de calculatorul pornit și **nu** se poate instala ca aplicație.

### Varianta finală (instalată pe ecranul principal, offline)
Fișierele trebuie găzduite pe o adresă `https://` (de ex. GitHub Pages — gratuit).
După ce ai adresa:

1. deschizi adresa în Chrome pe telefon;
2. meniul `⋮` → **Instalează aplicația** / *Adaugă la ecranul principal*;
3. de atunci pornește ca o aplicație normală: icon propriu, fără bară de browser,
   funcționează fără internet.

---

## Copie de siguranță — important

Datele stau în memoria browserului de pe telefon. Se pierd dacă:
- dezinstalezi aplicația,
- ștergi datele Chrome pentru acest site.

De aceea: **Setări → Salvează o copie** înainte și după fiecare sesiune mai mare de introducere de date.
Fișierul ajunge în *Descărcări* și îl poți pune pe Google Drive.

---

## Fișierele proiectului

| Fișier | Rol |
|---|---|
| `index.html` | structura ecranelor |
| `app.css` | tot aspectul vizual (culori, carduri, animații) |
| `app.js` | logica: invitați, mese, plăți, salvare, copii de siguranță |
| `manifest.webmanifest` | datele de instalare (nume, icon, culoare) |
| `sw.js` | face aplicația să funcționeze offline |
| `icons/` | iconițele aplicației |

Nu are nevoie de internet, de cont sau de altă aplicație instalată.
