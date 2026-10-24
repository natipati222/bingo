import React, { useState } from 'react';

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

export default function CreateRoomModal({ socket, nick, kodPokoju, onNickChange, onWstecz }) {
  const [rodzajGry, setRodzajGry] = useState("kategoria"); // "kategoria" lub "wlasne"
  const [kategoria, setKategoria] = useState("impreza");
  const [tytulBingo, setTytulBingo] = useState("Moje Super Bingo");
  const [polaZadan, setPolaZadan] = useState(Array(9).fill(""));
  const [blad, setBlad] = useState("");

  const handleZmianaPola = (index, tekst) => {
    const nowePola = [...polaZadan];
    nowePola[index] = tekst;
    setPolaZadan(nowePola);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nick.trim()) {
      setBlad("Wpisz swój nick!");
      return;
    }

    let finalneZadania = [];
    let finalnaKategoria = "";

    if (rodzajGry === "kategoria") {
      const pula = bazyHasel[kategoria] || bazyHasel.impreza;
      finalneZadania = [...pula].sort(() => 0.5 - Math.random()).slice(0, 9);
      finalnaKategoria = kategoria; // Przekazujemy nazwę kategorii
    } else {
      if (polaZadan.some(p => !p.trim())) {
        setBlad("Wypełnij wszystkie 9 pól zadań na planszy!");
        return;
      }
      finalneZadania = polaZadan;
      finalnaKategoria = tytulBingo; // Lub traktujemy to jako tytuł własny
    }

    socket.emit('utworz-pokoj', { 
      kodPokoju, 
      nick, 
      kategoria: finalnaKategoria, 
      wlasneHasla: finalneZadania
    });
  };

  return (
    <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-xl border border-slate-700">
      <div className="text-center mb-6">
        <span className="text-4xl">🎯</span>
        <h1 className="text-2xl font-bold mt-2 text-indigo-400">Stwórz Pokój </h1>
      </div>

      {blad && (
        <div className="mb-4 p-3 bg-rose-500/20 border border-rose-500 text-rose-300 text-xs rounded-lg text-center">
          {blad}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Twój Nick (Host)</label>
          <input 
            type="text" 
            value={nick} 
            onChange={(e) => onNickChange(e.target.value)}
            placeholder="np. Szef"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Typ planszy</label>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              type="button"
              onClick={() => { setRodzajGry("kategoria"); setBlad(""); }}
              className={`py-2 px-3 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                rodzajGry === "kategoria" 
                  ? 'bg-indigo-600 border-indigo-500 text-white' 
                  : 'bg-slate-900 border-slate-700 text-slate-400'
              }`}
            >
              🎲 Gotowa kategoria
            </button>
            <button
              type="button"
              onClick={() => { setRodzajGry("wlasne"); setBlad(""); }}
              className={`py-2 px-3 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                rodzajGry === "wlasne" 
                  ? 'bg-indigo-600 border-indigo-500 text-white' 
                  : 'bg-slate-900 border-slate-700 text-slate-400'
              }`}
            >
              ✍️ Własne zadania
            </button>
          </div>
        </div>

        {rodzajGry === "kategoria" ? (
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Wybierz kategorię</label>
            <select 
              value={kategoria} 
              onChange={(e) => setKategoria(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
            >
              <option value="impreza">🎉 Impreza</option>
              <option value="studia">📚 Wykład na uczelni</option>
              <option value="sesja">🤯 Sesja egzaminacyjna</option>
            </select>
          </div>
        ) : (
          <>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Nazwa Twojego Bingo</label>
              <input 
                type="text" 
                value={tytulBingo} 
                onChange={(e) => setTytulBingo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">Wpisz 9 zadań / haseł na planszę:</label>
              <div className="grid grid-cols-3 gap-2">
                {polaZadan.map((pole, idx) => (
                  <input
                    key={idx}
                    type="text"
                    value={pole}
                    onChange={(e) => handleZmianaPola(idx, e.target.value)}
                    placeholder={`Pole ${idx + 1}`}
                    className="p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white text-center focus:border-indigo-500 focus:outline-none"
                  />
                ))}
              </div>
            </div>
          </>
        )}

        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onWstecz} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs cursor-pointer">Wstecz</button>
          <button type="submit" className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 font-semibold rounded-lg shadow-lg text-sm cursor-pointer">Stwórz i graj!</button>
        </div>
      </form>
    </div>
  );
}