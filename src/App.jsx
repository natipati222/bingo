import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Board from './components/Board';

// Połączenie z serwerem Node.js (na porcie 3000)
const socket = io('http://localhost:3000');

export default function App() {
  const [zalogowany, setZalogowany] = useState(false);
  const [nick, setNick] = useState("");
  const [kategoria, setKategoria] = useState("impreza");
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

  const handleStart = (e) => {
    e.preventDefault();
    if (!nick.trim()) {
      alert("Proszę wpisać nick!");
      return;
    }
    setZalogowany(true);
    socket.emit('ustaw-nick', nick);
  };

  return (
    <div className="bg-slate-900 text-white min-h-screen flex items-center justify-center">
      {!zalogowany ? (
        // Ekran logowania
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
              Dołącz do gry
            </button>
          </form>
        </div>
      ) : (
        // Plansza Bingo (komponent z folderu components)
        <Board nick={nick} kategoria={kategoria} socket={socket} onWyjscie={() => setZalogowany(false)} />
      )}
    </div>
  );
}