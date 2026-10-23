import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Board from './components/Board';

const socket = io('http://localhost:3000');

export default function App() {
  const [zalogowany, setZalogowany] = useState(false);
  const [tryb, setTryb] = useState("wybor"); // "wybor", "host", "gracz"
  const [nick, setNick] = useState("");
  const [kodPokoju, setKodPokoju] = useState("");
  const [kategoria, setKategoria] = useState("impreza");
  const [poczatkowiGracze, setPoczatkowiGracze] = useState([]);
  const [blad, setBlad] = useState("");
  const [statusServera, setStatusServera] = useState("Łączenie z serwerem...");

  useEffect(() => {
    socket.on('connect', () => setStatusServera("Połączono z serwerem 🟢"));
    socket.on('disconnect', () => setStatusServera("Rozłączono z serwerem 🔴"));

    // Odbieramy potwierdzenie rozpoczęcia gry z serwera
    socket.on('start-gry', ({ kategoria, gracze }) => {
      setKategoria(kategoria);
      setPoczatkowiGracze(gracze || []);
      setZalogowany(true);
      setBlad("");
    });

    socket.on('blad', (komunikat) => {
      setBlad(komunikat);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('start-gry');
      socket.off('blad');
    };
  }, []);

  const generujKod = () => {
    const losowy = Math.random().toString(36).substring(2, 6).toUpperCase();
    setKodPokoju(losowy);
  };

  const handleUtworzPokoj = (e) => {
    e.preventDefault();
    if (!nick.trim() || !kodPokoju.trim()) {
      setBlad("Wpisz nick oraz kod pokoju!");
      return;
    }
    socket.emit('utworz-pokoj', { kodPokoju, nick, kategoria });
  };

  const handleDolaczPokoj = (e) => {
    e.preventDefault();
    if (!nick.trim() || !kodPokoju.trim()) {
      setBlad("Wpisz nick oraz kod pokoju!");
      return;
    }
    socket.emit('dolacz-do-pokoju', { kodPokoju, nick });
  };

  return (
    <div className="bg-slate-900 text-white min-h-screen flex items-center justify-center p-4">
      {!zalogowany ? (
        <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700">
          <div className="text-center mb-6">
            <span className="text-4xl">🎯</span>
            <h1 className="text-2xl font-bold mt-2 text-indigo-400">Live Bingo Pro</h1>
            <p className="text-slate-400 text-xs mt-1">{statusServera}</p>
          </div>

          {blad && (
            <div className="mb-4 p-3 bg-rose-500/20 border border-rose-500 text-rose-300 text-xs rounded-lg text-center">
              {blad}
            </div>
          )}

          {/* Wybór trybu: Host czy Gracz */}
          {tryb === "wybor" && (
            <div className="space-y-4">
              <button 
                onClick={() => { setTryb("host"); generujKod(); }}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 font-semibold rounded-xl transition shadow-lg cursor-pointer"
              >
                🏠 Stwórz nowy pokój (Host)
              </button>
              <button 
                onClick={() => setTryb("gracz")}
                className="w-full py-3 bg-slate-700 hover:bg-slate-600 font-semibold rounded-xl transition shadow-lg cursor-pointer"
              >
                🎮 Dołącz do pokoju (Gracz)
              </button>
            </div>
          )}

          {/* Formularz dla Hosta */}
          {tryb === "host" && (
            <form onSubmit={handleUtworzPokoj} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Twój Nick (Host)</label>
                <input 
                  type="text" 
                  value={nick} 
                  onChange={(e) => setNick(e.target.value)}
                  placeholder="np. SzefSzefow"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500 text-white"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Kod Pokoju</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={kodPokoju} 
                    onChange={(e) => setKodPokoju(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white uppercase font-mono"
                  />
                  <button type="button" onClick={generujKod} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs">Losuj</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Kategoria Gry (Wybiera Host)</label>
                <select 
                  value={kategoria} 
                  onChange={(e) => setKategoria(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                >
                  <option value="impreza">🎉 Impreza</option>
                  <option value="studia">📚 Wykład na uczelni</option>
                  <option value="sesja">🤯 Sesja egzaminacyjna</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => {setTryb("wybor"); setBlad(""); }} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm">Wstecz</button>
                <button type="submit" className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 font-semibold rounded-lg shadow-lg">Start gry</button>
              </div>
            </form>
          )}

          {/* Formularz dla Gracza (brak wyboru kategorii!) */}
          {tryb === "gracz" && (
            <form onSubmit={handleDolaczPokoj} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Twój Nick</label>
                <input 
                  type="text" 
                  value={nick} 
                  onChange={(e) => setNick(e.target.value)}
                  placeholder="np. Kacper"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500 text-white"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Kod Pokoju od Hosta</label>
                <input 
                  type="text" 
                  value={kodPokoju} 
                  onChange={(e) => setKodPokoju(e.target.value.toUpperCase())}
                  placeholder="np. AB12"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white uppercase font-mono"
                  autoComplete="off"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => {setTryb("wybor"); setBlad(""); }} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm">Wstecz</button>
                <button type="submit" className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 font-semibold rounded-lg shadow-lg">Dołącz do pokoju</button>
              </div>
            </form>
          )}

        </div>
      ) : (
        <Board nick={nick} kategoria={kategoria} kodPokoju={kodPokoju} socket={socket} poczatkowiGracze={poczatkowiGracze} onWyjscie={() => setZalogowany(false)} />
      )}
    </div>
  );
}