import React, { useState, useEffect } from 'react';

const bazyHasel = {
  impreza: [
    "Ktoś rozlewa drinka", "Rozmowa o byłych", "Ktoś zgubił telefon",
    "Słyszę ten sam hit 3. raz", "Ktoś zasnął na kanapie", "Dyskusja o polityce",
    "Zdrada tajemnicy", "Ktoś szuka ładowarki", "„Muszę z Tobą porozmawiać”"
  ],
  studia: [
    "Profesor się spóźnia", "Ktoś pyta o obecność", "Zepsuł się rzutnik",
    "Aluzja do trudnego kolokwium", "Ktoś chrapie w pierwszym rzędzie", "Wykład przeciąga się po czasie",
    "Pytanie „czy to będzie na egzaminie?”", "Ktoś otwiera puszkę z jedzeniem", "Dźwięk powiadomienia z Messengera"
  ],
  sesja: [
    "Panika na grupie na Discordzie", "Płacz nad notatkami o 3 w nocy", "Kawa pita jako woda",
    "Obietnica „od jutra się uczę”", "Sprawdzanie ocen w USOS-ie po raz 50.", "Otwartych 40 kart w przeglądarce",
    "Rezygnacja z kierunku studiów (chwilowa)", "Szukanie ratunku w YouTube", "Losowe strzelanie w testach próbnych"
  ]
};

export default function Board({ nick, kategoria, kodPokoju, socket, onWyjscie }) {
  const [haslaPlanszy, setHaslaPlanszy] = useState([]);
  const [zaznaczone, setZaznaczone] = useState(Array(9).fill(false));
  const [komunikat, setKomunikat] = useState("");

  const generujNowaPlansze = () => {
    const dostepne = bazyHasel[kategoria] || bazyHasel.impreza;
    const wylosowane = [...dostepne].sort(() => 0.5 - Math.random()).slice(0, 9);
    setHaslaPlanszy(wylosowane);
    setZaznaczone(Array(9).fill(false));
    setKomunikat("");
  };

  useEffect(() => {
    generujNowaPlansze();

    socket.on('ogloszenie-wygranej', (tekst) => {
      setKomunikat(tekst);
    });

    return () => {
      socket.off('ogloszenie-wygranej');
    };
  }, [kategoria]);

  const toggleKafel = (index) => {
    const noweZaznaczone = [...zaznaczone];
    noweZaznaczone[index] = !noweZaznaczone[index];
    setZaznaczone(noweZaznaczone);
    sprawdzWygrana(noweZaznaczone);
  };

  const sprawdzWygrana = (stanZaznaczen) => {
    const wygrywajuceLinie = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // poziome
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // pionowe
      [0, 4, 8], [2, 4, 6]             // skośne
    ];

    for (let linia of wygrywajuceLinie) {
      const [a, b, c] = linia;
      if (stanZaznaczen[a] && stanZaznaczen[b] && stanZaznaczen[c]) {
        setKomunikat("🎉 BINGO! Masz wygraną!");
        socket.emit('bingo-wygrana');
        return;
      }
    }
  };

  return (
    <div className="flex flex-col items-center p-4 max-w-md w-full text-white">
      
      {/* Nagłówek gry */}
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold text-indigo-400">Bingo: {nick}</h1>
        <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">
          Kategoria: {kategoria} | Pokój: <span className="font-mono text-amber-400 font-bold">{kodPokoju}</span>
        </p>
      </div>

      {/* Komunikat o wygranej */}
      <div className="h-10 flex items-center justify-center mb-2">
        <p className="text-emerald-400 font-bold text-lg animate-pulse">{komunikat}</p>
      </div>

      {/* Siatka planszy 3x3 */}
      <div className="grid grid-cols-3 gap-3 bg-slate-800 p-4 rounded-2xl shadow-2xl border border-slate-700 w-full aspect-square">
        {haslaPlanszy.map((haslo, index) => (
          <div 
            key={index}
            onClick={() => toggleKafel(index)}
            className={`flex items-center justify-center text-center p-2 rounded-xl text-xs sm:text-sm font-semibold cursor-pointer select-none transition-all duration-200 ${
              zaznaczone[index] 
                ? 'bg-emerald-600 text-white line-through shadow-inner scale-95' 
                : 'bg-slate-700 hover:bg-slate-600 text-slate-200 shadow-md'
            }`}
          >
            {haslo}
          </div>
        ))}
      </div>

      {/* Przyciski sterujące */}
      <div className="flex gap-3 w-full mt-6">
        <button 
          onClick={generujNowaPlansze}
          className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 font-semibold rounded-xl transition duration-200 shadow-lg cursor-pointer"
        >
          Nowa plansza
        </button>
        <button 
          onClick={onWyjscie}
          className="px-4 py-3 bg-rose-600/80 hover:bg-rose-600 font-semibold rounded-xl transition duration-200 cursor-pointer"
        >
          Wyjdź
        </button>
      </div>
    </div>
  );
}