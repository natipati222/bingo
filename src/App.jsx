import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Board from './components/Board';
import CreateRoomModal from './components/CreateRoomModal';

const socket = io(
  import.meta.env.DEV ? 'http://localhost:3000' : window.location.origin
);
const sesjaKey = 'live-bingo-session';
const playerIdKey = 'live-bingo-player-id';

const odczytajSesje = () => {
  const zapisana = localStorage.getItem(sesjaKey);
  if (!zapisana) return null;

  try {
    const sesja = JSON.parse(zapisana);
    return sesja?.kodPokoju && sesja?.playerId ? sesja : null;
  } catch (error) {
    console.error('Nie udało się odczytać zapisanej sesji Bingo:', error);
    localStorage.removeItem(sesjaKey);
    return null;
  }
};

const utworzPlayerId = () => {
  const zapisany = localStorage.getItem(playerIdKey);
  if (zapisany) return zapisany;

  const id = globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
  localStorage.setItem(playerIdKey, id);
  return id;
};

export default function App() {
  const [zalogowany, setZalogowany] = useState(false);
  const [tryb, setTryb] = useState("wybor"); // "wybor", "host", "gracz"
  const [nick, setNick] = useState("");
  const [kodPokoju, setKodPokoju] = useState("");
  const [playerId] = useState(utworzPlayerId);
  const [kategoria, setKategoria] = useState("impreza");
  const [wlasneHaslaTekst, setWlasneHaslaTekst] = useState("");
  const [daneGry, setDaneGry] = useState({ kategoria: "impreza", wlasneHasla: [], gracze: [] });
  const [historiaCzatu, setHistoriaCzatu] = useState([]);
  const [blad, setBlad] = useState("");
  const [statusServera, setStatusServera] = useState("Łączenie z serwerem...");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlRoom = params.get('room');

    if (urlRoom) {
      setKodPokoju(urlRoom.toUpperCase());
      setTryb("gracz");
    }

    const wznowGre = () => {
      const sesja = odczytajSesje();
      if (sesja) {
        socket.emit('wznow-gre', sesja);
      }
    };

    socket.on('connect', () => {
      setStatusServera("Połączono z serwerem 🟢");
      wznowGre();
    });
    socket.on('disconnect', () => setStatusServera("Rozłączono z serwerem 🔴"));

    socket.on('start-gry', (dane) => {
      setDaneGry(dane);
      setHistoriaCzatu(dane.historiaCzatu || []);
      setNick(dane.nick);
      setKodPokoju(dane.kodPokoju);
      setZalogowany(true);
      setBlad("");
      localStorage.setItem(sesjaKey, JSON.stringify({
        playerId: dane.playerId,
        kodPokoju: dane.kodPokoju
      }));
    });

    socket.on('blad', (komunikat) => setBlad(komunikat));
    socket.on('nowa-wiadomosc', (wiadomosc) => {
      setHistoriaCzatu(prev => [...prev, wiadomosc]);
    });
    socket.on('wznowienie-nieudane', () => {
      localStorage.removeItem(sesjaKey);
    });

    if (socket.connected) wznowGre();

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('start-gry');
      socket.off('blad');
      socket.off('nowa-wiadomosc');
      socket.off('wznowienie-nieudane');
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
    // Przekształcamy tekst z hasłami po przecinku na tablicę (jeśli host coś wpisał)
    const wlasneHasla = wlasneHaslaTekst
      .split('\n')
      .map(h => h.trim())
      .filter(h => h.length > 0);

    socket.emit('utworz-pokoj', { kodPokoju, nick, kategoria, wlasneHasla, playerId });
  };

  const handleDolaczPokoj = (e) => {
    e.preventDefault();
    if (!nick.trim() || !kodPokoju.trim()) {
      setBlad("Wpisz nick oraz kod pokoju!");
      return;
    }
    socket.emit('dolacz-do-pokoju', { kodPokoju, nick, playerId });
  };

  const handleWyjscie = () => {
    localStorage.removeItem(`bingo_zaznaczone_${kodPokoju}_${nick}`);
    localStorage.removeItem('bingo_nick');
    localStorage.removeItem('bingo_pokoj');
    localStorage.removeItem(sesjaKey);

    socket.emit('opusc-pokoj');

    // Czyści parametr ?room= z paska adresu
    window.history.replaceState({}, document.title, window.location.pathname);

    setZalogowany(false);
    setTryb("wybor");
    setKodPokoju("");
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

          {tryb === "wybor" && (
            <div className="space-y-4">
              <button 
                onClick={() => { setTryb("host"); generujKod(); }}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 font-semibold rounded-xl transition shadow-lg cursor-pointer"
              >
                🏠 Stwórz pokój (Host)
              </button>
              <button 
                onClick={() => { setTryb("gracz"); setBlad(""); }}
                className="w-full py-3 bg-slate-700 hover:bg-slate-600 font-semibold rounded-xl transition shadow-lg cursor-pointer"
              >
                🎮 Dołącz do pokoju (Gracz)
              </button>
            </div>
          )}

          {tryb === "host" && (
            <CreateRoomModal 
              socket={socket} 
              nick={nick}
              kodPokoju={kodPokoju}
              onNickChange={setNick}
              onWstecz={() => { setTryb("wybor"); setBlad(""); }} 
            />
          )}

          {tryb === "gracz" && (
            <form onSubmit={handleDolaczPokoj} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Twój Nick</label>
                <input 
                  type="text" 
                  value={nick} 
                  onChange={(e) => setNick(e.target.value)}
                  placeholder="np. Olek"
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
                <button type="button" onClick={() => { setTryb("wybor"); setBlad(""); }} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm cursor-pointer">Wstecz</button>
                <button type="submit" className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 font-semibold rounded-lg shadow-lg cursor-pointer">Dołącz do pokoju</button>
              </div>
            </form>
          )}

        </div>
      ) : (
        <Board 
          nick={nick} 
          kategoria={daneGry.kategoria} 
          wlasneHasla={daneGry.wlasneHasla} 
          kodPokoju={kodPokoju} 
          socket={socket} 
          poczatkowiGracze={daneGry.gracze} 
          postep={daneGry.postep}
          zwyciezcy={daneGry.zwyciezcy}
          ostatnieOgloszenie={daneGry.ostatnieOgloszenie}
          historiaCzatu={historiaCzatu}
          onWyjscie={handleWyjscie}
        />
      )}
    </div>
  );
}