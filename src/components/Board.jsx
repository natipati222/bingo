import React, { useState, useEffect } from 'react';
import { bazyHasel } from './EntriesDatabase';
import { playClickSound, playWinSound } from '../utils/SoundManager';
import PlayerList from './PlayerList';
import { styleMotywow, dostepneMotywy } from '../utils/ThemeManager';


export default function Board({ nick, kategoria, wlasneHasla, kodPokoju, socket, poczatkowiGracze, postep, zwyciezcy: poczatkowiZwyciezcy, ostatnieOgloszenie, historiaCzatu, onWyjscie }) {
  const [hasla, setHasla] = useState(() => postep?.hasla || []);
  const [zaznaczone, Zaznaczone] = useState(() => postep?.zaznaczone || Array(9).fill(false));
  const [komunikatWygranej, setKomunikatWygranej] = useState(ostatnieOgloszenie || "");
  const [zwyciezcy, setZwyciezcy] = useState(poczatkowiZwyciezcy || []);
  const [pokazModal, setPokazModal] = useState(Boolean(ostatnieOgloszenie));
  const [powiadomienia, setPowiadomienia] = useState([]);
  const [listaGraczy, setListaGraczy] = useState(poczatkowiGracze || []);
  const [skopiowano, setSkopiowano] = useState(false);
  const [czyZrobilemBingo, setCzyZrobilemBingo] = useState(Boolean(postep?.czyZrobilemBingo));
  const [pokazMenuMotywow, setPokazMenuMotywow] = useState(false);
  const [motyw, setMotyw] = useState(() => {
    return localStorage.getItem('bingo_motyw') || 'indigo';
  });

  useEffect(() => {
    socket.on('ogloszenie-wygranej', ({ tresc, zwyciezcy }) => {
      setKomunikatWygranej(tresc);
      setZwyciezcy(zwyciezcy);
      setPokazModal(true);
      playWinSound();
    });

    socket.on('powiadomienie', (msg) => {
      setPowiadomienia(prev => [msg, ...prev.slice(0, 4)]);
    });

    socket.on('aktualizacja-graczy', (gracze) => {
      setListaGraczy(gracze);
    });

    return () => {
      socket.off('ogloszenie-wygranej');
      socket.off('powiadomienie');
      socket.off('aktualizacja-graczy');
    };
  }, [kategoria, wlasneHasla, socket]);

  const zmienMotyw = (nowyMotyw) => {
    setMotyw(nowyMotyw);
    localStorage.setItem('bingo_motyw', nowyMotyw);
    setPokazMenuMotywow(false);
  };

  const kopiujKod = () => {
    const linkZaproszenia = `${window.location.origin}/?room=${kodPokoju}`;
    navigator.clipboard.writeText(linkZaproszenia);
    setSkopiowano(true);
    setTimeout(() => setSkopiowano(false), 2000);
  };

  const toggleKafelek = (index) => {
    if (czyZrobilemBingo) return; // Jeśli ten gracz ma już swoje Bingo, nie klika dalej

    playClickSound();
    const noweZaznaczone = [...zaznaczone];
    noweZaznaczone[index] = !noweZaznaczone[index];
    Zaznaczone(noweZaznaczone);

    const w = noweZaznaczone;
    const czyWygrana = 
      (w[0] && w[1] && w[2]) || (w[3] && w[4] && w[5]) || (w[6] && w[7] && w[8]) || 
      (w[0] && w[3] && w[6]) || (w[1] && w[4] && w[7]) || (w[2] && w[5] && w[8]) || 
      (w[0] && w[4] && w[8]) || (w[2] && w[4] && w[6]); 

    const czyZrobilemBingoTeraz = czyZrobilemBingo || czyWygrana;
    socket.emit('aktualizacja-postepu', {
      hasla,
      zaznaczone: noweZaznaczone,
      czyZrobilemBingo: czyZrobilemBingoTeraz
    });

    if (czyWygrana && !czyZrobilemBingo) {
      setCzyZrobilemBingo(true);
      socket.emit('bingo-wygrana');
    }
  };

  const resetujPlansze = () => {
    let pula = (wlasneHasla && wlasneHasla.length >= 9) ? wlasneHasla : (bazyHasel[kategoria] || bazyHasel.impreza);
    const wylosowane = [...pula].sort(() => 0.5 - Math.random()).slice(0, 9);
    setHasla(wylosowane);
    Zaznaczone(Array(9).fill(false));
    setKomunikatWygranej("");
    setPokazModal(false);
    setCzyZrobilemBingo(false);
    socket.emit('aktualizacja-postepu', {
      hasla: wylosowane,
      zaznaczone: Array(9).fill(false),
      czyZrobilemBingo: false
    });
  };

  const wyjdzZGry = () => {
    onWyjscie();
  };

  const obecnyStyl = styleMotywow[motyw];
  
  return (
    <div className={`min-h-screen w-full bg-slate-900 transition-colors`}>
      <div className="flex flex-col lg:flex-row gap-6 items-start justify-center p-4 w-full max-w-5xl mx-auto relative">
      
      {/* MODAL PODIUM */}
      {pokazModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border-2 border-amber-500/80 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl shadow-amber-500/20">
            <div className="text-5xl mb-3 animate-bounce">🏆</div>
            <h2 className="text-2xl font-extrabold text-amber-400 mb-1">Podsumowanie Rundy</h2>
            <p className="text-slate-300 text-xs mb-6">{komunikatWygranej}</p>

            {/* PODIUM */}
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 mb-6 space-y-2 text-left">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center mb-3">Podium Zwycięzców</h3>
              {zwyciezcy.map((z, idx) => (
                <div key={idx} className="flex items-center justify-between px-3 py-2 bg-slate-800 rounded-lg border border-slate-700">
                  <span className="font-bold text-sm flex items-center gap-2">
                    {z.miejsce === 1 && "🥇 1. Miejsce"}
                    {z.miejsce === 2 && "🥈 2. Miejsce"}
                    {z.miejsce === 3 && "🥉 3. Miejsce"}
                  </span>
                  <span className="font-semibold text-indigo-300">{z.nick}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={resetujPlansze}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition shadow-lg cursor-pointer text-sm"
              >
                Następna runda
              </button>
              <button 
                onClick={wyjdzZGry}
                className="px-5 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold rounded-xl transition cursor-pointer text-sm"
              >
                Wyjdź
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PLANSZA BINGO */}
      <div className="bg-slate-800 p-6 rounded-2xl shadow-2xl border border-slate-700 flex-1 w-full">
        <div className="flex justify-end mb-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setPokazMenuMotywow((pokaz) => !pokaz)}
              aria-expanded={pokazMenuMotywow}
              aria-haspopup="true"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-semibold transition cursor-pointer"
            >
              <span aria-hidden="true">🎨</span>
              Motyw
            </button>
            {pokazMenuMotywow && (
              <div className="absolute right-0 top-full mt-2 z-20 w-44 p-2 bg-slate-900 rounded-xl border border-slate-700 shadow-xl">
                {dostepneMotywy.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => zmienMotyw(m.id)}
                    aria-pressed={motyw === m.id}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition cursor-pointer ${
                      motyw === m.id ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full ${styleMotywow[m.id].bgKulki}`} />
                    {m.nazwa}
                    {motyw === m.id && <span className="ml-auto" aria-hidden="true">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
    
        <div className="text-center mb-6">
          <h1 className={`text-3xl font-bold ${obecnyStyl.naglowek}`}>Bingo: {nick}</h1>
          <div className="flex items-center justify-center gap-2 mt-1">
            <p className="text-xs text-slate-400 uppercase tracking-wider">
              Kategoria: <span className="text-white font-semibold">{kategoria}</span> | Pokój: 
            </p>
            <span className="font-mono text-amber-400 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
              {kodPokoju}
            </span>
            <button 
              onClick={kopiujKod} 
              className={`px-2 py-0.5 ${obecnyStyl.przyciskGlowny} text-xs font-semibold rounded transition cursor-pointer`}
            >
              {skopiowano ? "Skopiowano! ✓" : "Kopiuj Link"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {hasla.map((haslo, index) => (
            <button
              key={index}
              onClick={() => toggleKafelek(index)}
              className={`p-4 h-28 rounded-xl text-xs md:text-sm font-semibold transition duration-200 flex items-center justify-center text-center cursor-pointer select-none ${
                zaznaczone[index]
                  ? `${obecnyStyl.przyciskAktywny} scale-[0.98]`
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-700/80 border border-slate-700'
              }`}
            >
              {haslo}
            </button>
          ))}
        </div>

        <div className="flex justify-center">
          <button 
            onClick={wyjdzZGry}
            className="px-6 py-3 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-semibold rounded-xl transition cursor-pointer"
          >
            Wyjdź
          </button>
        </div>
      </div>

      {/* PANEL BOCZNY */}
      <PlayerList nick={nick} listaGraczy={listaGraczy} powiadomienia={powiadomienia} historiaCzatu={historiaCzatu} socket={socket} motyw={motyw} />

      </div>
    </div>
  );
}