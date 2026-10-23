import React, { useState, useEffect } from 'react';

// Bazy haseł dla kategorii
const bazyHasel = {
  impreza: [
    "Ktoś szuka ładowarki", "Rozmowa o byłych", "Ktoś rozlewa drinka",
    "Ktoś zgubił telefon", "Ktoś zasnął na kanapie", "Dyskusja o polityce",
    "„Muszę z Tobą porozmawiać”", "Słyszę ten sam hit 3. raz", "Zdrada tajemnicy"
  ],
  studia: [
    "Wykładowca spóźnia się 15 minut", "Pytanie „Czy to będzie na kolokwium?”",
    "Komuś dzwoni telefon", "Ktoś zasypia na wykładzie", "Walka o przedłużacz",
    "Prezentacja w PowerPoint z samymi tekstami", "Pytanie bez odpowiedzi z sali",
    "„Dla mnie to jest oczywiste”", "Przerwa techniczna"
  ],
  sesja: [
    "Płacz nad notatkami", "Kawa pita jako zupa", "„Zaczynam się uczyć od rana” (była 3 w nocy)",
    "Przeglądanie grupki na FB", "Dźwięk powiadomienia z dziekanatu",
    "Nagłe sprzątanie całego pokoju przed nauką", "Nadzieja na warunk",
    "„Dam radę, to tylko 400 stron”", "Zgłaszanie błędu w pytaniach"
  ]
};

export default function Board({ nick, kategoria, kodPokoju, socket, poczatkowiGracze, onWyjscie }) {
  const [hasla, setHasla] = useState([]);
  const [zaznaczone, Zaznaczone] = useState(Array(9).fill(false));
  const [komunikatWygranej, setKomunikatWygranej] = useState("");
  const [powiadomienia, setPowiadomienia] = useState([]);
  const [listaGraczy, setListaGraczy] = useState(poczatkowiGracze || []);

  useEffect(() => {
    // Losowanie haseł dla wybranej kategorii
    const wybraneHasla = bazyHasel[kategoria] || bazyHasel.impreza;
    const wylosowane = [...wybraneHasla].sort(() => 0.5 - Math.random()).slice(0, 9);
    setHasla(wylosowane);

    // Nasłuchiwanie Socket.io
    socket.on('ogloszenie-wygranej', (tresc) => {
      setKomunikatWygranej(tresc);
    });

    socket.on('powiadomienie', (msg) => {
      setPowiadomienia(prev => [msg, ...prev.slice(0, 4)]); // Trzymaj ostatnie 5 powiadomień
    });

    socket.on('aktualizacja-graczy', (gracze) => {
      setListaGraczy(gracze);
    });

    return () => {
      socket.off('ogloszenie-wygranej');
      socket.off('powiadomienie');
      socket.off('aktualizacja-graczy');
    };
  }, [kategoria, socket]);

  const toggleKafelek = (index) => {
    const noweZaznaczone = [...zaznaczone];
    noweZaznaczone[index] = !noweZaznaczone[index];
    Zaznaczone(noweZaznaczone);

    // Sprawdzenie warunków Bingo (linie pionowe, poziome, ukośne)
    const w = noweZaznaczone;
    const czyWygrana = 
      (w[0] && w[1] && w[2]) || (w[3] && w[4] && w[5]) || (w[6] && w[7] && w[8]) || // poziome
      (w[0] && w[3] && w[6]) || (w[1] && w[4] && w[7]) || (w[2] && w[5] && w[8]) || // pionowe
      (w[0] && w[4] && w[8]) || (w[2] && w[4] && w[6]); // ukośne

    if (czyWygrana && !komunikatWygranej) {
      socket.emit('bingo-wygrana');
    }
  };

  const resetujPlansze = () => {
    const wybraneHasla = bazyHasel[kategoria] || bazyHasel.impreza;
    const wylosowane = [...wybraneHasla].sort(() => 0.5 - Math.random()).slice(0, 9);
    setHasla(wylosowane);
    Zaznaczone(Array(9).fill(false));
    setKomunikatWygranej("");
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start justify-center p-4 w-full max-w-5xl mx-auto">
      
      {/* GŁÓWNA PLANSZA BINGO */}
      <div className="bg-slate-800 p-6 rounded-2xl shadow-2xl border border-slate-700 flex-1 w-full">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-indigo-400">Bingo: {nick}</h1>
          <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">
            Kategoria: <span className="text-white font-semibold">{kategoria}</span> | Pokój: <span className="font-mono text-amber-400 font-bold">{kodPokoju}</span>
          </p>
        </div>

        {komunikatWygranej && (
          <div className="mb-6 p-4 bg-amber-500/20 border border-amber-500 text-amber-300 rounded-xl text-center font-bold animate-bounce shadow-lg">
            {komunikatWygranej}
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mb-6">
          {hasla.map((haslo, index) => (
            <button
              key={index}
              onClick={() => toggleKafelek(index)}
              className={`p-4 h-28 rounded-xl text-xs md:text-sm font-semibold transition duration-200 flex items-center justify-center text-center cursor-pointer select-none ${
                zaznaczone[index]
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 scale-[0.98]'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-700/80 border border-slate-700'
              }`}
            >
              {haslo}
            </button>
          ))}
        </div>

        <div className="flex gap-4">
          <button 
            onClick={resetujPlansze}
            className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 font-semibold rounded-xl transition cursor-pointer"
          >
            Nowa plansza
          </button>
          <button 
            onClick={onWyjscie}
            className="px-6 py-3 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-semibold rounded-xl transition cursor-pointer"
          >
            Wyjdź
          </button>
        </div>
      </div>

      {/* PANEL BOCZNY: LICZNIK I GRACZE ONLINE */}
      <div className="w-full lg:w-80 bg-slate-800 p-6 rounded-2xl shadow-2xl border border-slate-700 space-y-6">
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold text-indigo-400">Gracze w pokoju</h2>
            <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-bold rounded-full border border-indigo-500/30">
              🟢 {listaGraczy.length} online
            </span>
          </div>
          
          <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {listaGraczy.map((g, idx) => (
              <li key={idx} className="flex items-center gap-2 px-3 py-2 bg-slate-900 rounded-lg border border-slate-700/60 text-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-medium text-slate-200 truncate">{g.nick}</span>
                {g.nick === nick && <span className="ml-auto text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">Ty</span>}
              </li>
            ))}
          </ul>
        </div>

        {/* LOG POWIADOMIENIA */}
        <div>
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Aktywność</h2>
          <div className="space-y-1.5 text-xs text-slate-400 max-h-36 overflow-y-auto">
            {powiadomienia.length === 0 ? (
              <p className="italic text-slate-500">Brak nowych zdarzeń...</p>
            ) : (
              powiadomienia.map((msg, idx) => (
                <div key={idx} className="p-2 bg-slate-900/60 rounded border border-slate-700/40">
                  {msg}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
}