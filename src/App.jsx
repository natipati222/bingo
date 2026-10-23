import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Board from './components/Board';

const socket = io('http://localhost:3000');

export default function App() {
  const [zalogowany, setZalogowany] = useState(false);
  const [nick, setNick] = useState("");
  const [kategoria, setKategoria] = useState("impreza");
  const [kodPokoju, setKodPokoju] = useState("");
  const [statusServera, setStatusServera] = useState("Łączenie z serwerem...");

  useEffect(() => {
    socket.on('connect', () => {
      setStatusServera("Połączono z serwerem 🟢");
    });

    socket.on('disconnect', () => {
      setStatusServera("Rozłączono z serwerem 🔴");
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  const generujKod = () => {
    // Losowy 4-literowy/cyfrowy kod pokoju np. "AB12"
    const losowy = Math.random().toString(36).substring(2, 6).toUpperCase();
    setKodPokoju(losowy);
  };

  const handleStart = (e) => {
    e.preventDefault();
    if (!nick.trim()) {
      alert("Proszę wpisać nick!");
      return;
    }
    if (!kodPokoju.trim()) {
      alert("Wpisz lub wygeneruj kod pokoju!");
      return;
    }

    setZalogowany(true);
    // Wysyłamy informację do serwera o dołączeniu do pokoju
    socket.emit('dolacz-do-pokoju', { kodPokoju, nick });
  };

  return (
    <div className="bg-slate-900 text-white min-h-screen flex items-center justify-center">
      {!zalogowany ? (
        <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-96 border border-slate-700 text-white">
          <div className="text-center mb-6">
            <span className="text-4xl">🎯</span>
            <h1 className="text-2xl font-bold mt-2 text-indigo-400">Live Bingo Pro</h1>
            <p className="text-slate-400 text-sm mt-1">{statusServera}</p>
          </div>
          <form onSubmit={handleStart} className="space-y-4">
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
              <label className="block text-sm font-medium text-slate-300 mb-1">Kod Pokoju</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={kodPokoju} 
                  onChange={(e) => setKodPokoju(e.target.value.toUpperCase())}
                  placeholder="np. BINGO"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500 text-white uppercase font-mono"
                  autoComplete="off"
                />
                <button 
                  type="button"
                  onClick={generujKod}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-semibold transition"
                  title="Wygeneruj losowy kod"
                >
                  Losuj
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Kategoria Gry</label>
              <select 
                value={kategoria} 
                onChange={(e) => setKategoria(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500 text-white"
              >
                <option value="impreza">🎉 Impreza</option>
                <option value="studia">📚 Wykład na uczelni</option>
                <option value="sesja">🤯 Sesja egzaminacyjna</option>
              </select>
            </div>

            <button 
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 font-semibold rounded-lg transition duration-200 shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              Wejdź do pokoju
            </button>
          </form>
        </div>
      ) : (
        <Board nick={nick} kategoria={kategoria} kodPokoju={kodPokoju} socket={socket} onWyjscie={() => setZalogowany(false)} />
      )}
    </div>
  );
}