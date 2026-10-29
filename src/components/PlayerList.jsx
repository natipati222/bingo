import React, { useState, useEffect, useRef } from 'react';
import { styleMotywow } from '../utils/ThemeManager';

export default function PlayerList({ nick, listaGraczy, powiadomienia, historiaCzatu, socket, motyw }) {
  const [wiadomosc, setWiadomosc] = useState("");
  const chatEndRef = useRef(null);
  const obecnyStyl = styleMotywow[motyw] || styleMotywow.indigo;

  // Automatyczny scroll do najnowszej wiadomości w czacie
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [historiaCzatu]);

  const wyslijWiadomosc = (e) => {
    e.preventDefault();
    if (wiadomosc.trim() && socket) {
      socket.emit('wiadomosc-czat', wiadomosc.trim());
      setWiadomosc("");
    }
  };

  return (
    <div className={`w-full lg:w-80 bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-2xl border border-slate-700 flex flex-col gap-4 sm:gap-6 h-full max-h-[850px] transition-colors`}>
      
      {/* 1. SEKCJA: GRACZE */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className={`text-lg font-bold ${obecnyStyl.naglowek}`}>Gracze</h2>
          <span className={`px-2.5 py-1 ${obecnyStyl.tloOdznaki} ${obecnyStyl.naglowek} text-xs font-bold rounded-full border ${obecnyStyl.ramkaPanelu}`}>
            🟢 {listaGraczy.length} online
          </span>
        </div>
        <ul className="space-y-2 max-h-32 overflow-y-auto pr-1">
          {listaGraczy.map((g, idx) => (
            <li key={idx} className="flex items-center gap-2 px-3 py-2 bg-slate-900 rounded-lg border border-slate-700 text-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-medium text-slate-200 truncate">{g.nick}</span>
              {g.nick === nick && <span className="ml-auto text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">Ty</span>}
            </li>
          ))}
        </ul>
      </div>

      {/* 2. SEKCJA: AKTYWNOŚĆ (BINGO) */}
      <div >
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Aktywność</h2>
        <div className="space-y-1.5 text-xs text-slate-400 max-h-24 overflow-y-auto pr-1 bg-slate-800 rounded-lg">
          {powiadomienia.length === 0 ? (
            <p className="italic text-slate-500">Brak nowych zdarzeń...</p>
          ) : (
            powiadomienia.map((msg, idx) => (
              <div key={idx} className="p-1.5 bg-slate-800 rounded border border-slate-700 text-amber-300 font-medium">
                {msg}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. SEKCJA: CZAT */}
      <div className={`flex flex-col flex-1 min-h-[250px] bg-slate-900 rounded-xl border border-slate-700 overflow-hidden`}>
        <div className={`${obecnyStyl.tloPanelu} px-3 py-2 border-b border-slate-700 flex justify-between items-center`}>
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Czat pokoju</h2>
          <span className="text-[10px] text-slate-500">Na żywo</span>
        </div>
        
        {/* Okno z dymkami */}
        <div className="flex-1 p-3 overflow-y-auto space-y-3 text-sm">
          {historiaCzatu.length === 0 ? (
            <p className="text-xs text-slate-500 italic text-center mt-4">Napisz coś, aby rozpocząć rozmowę...</p>
          ) : (
            historiaCzatu.map((msg, idx) => {
              const toJa = msg.autor === nick;
              return (
                <div key={idx} className={`flex flex-col ${toJa ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] text-slate-500 mb-0.5 px-1">
                    {toJa ? 'Ty' : msg.autor} • {msg.czas}
                  </span>
                  <div className={`px-3 py-1.5 rounded-lg max-w-[90%] wrap-break-words ${
                    toJa 
                      ? `${obecnyStyl.przyciskAktywny} rounded-tr-none` 
                      : 'bg-slate-700 text-slate-200 rounded-tl-none'
                  }`}>
                    {msg.tresc}
                  </div>
                </div>
              );
            })
          )}
          {/* Niewidzialny punkt kotwiczenia dla autoscrolla */}
          <div ref={chatEndRef} />
        </div>

        {/* Input wysyłania */}
        <form onSubmit={wyslijWiadomosc} className="p-2 bg-slate-800 border-t border-slate-700 flex gap-2">
          <input
            type="text"
            value={wiadomosc}
            onChange={(e) => setWiadomosc(e.target.value)}
            placeholder="Napisz wiadomość..."
            className="flex-1 bg-slate-900 text-white text-sm px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-500"
            autoComplete="off"
          />
          <button 
            type="submit"
            disabled={!wiadomosc.trim()}
            className={`${obecnyStyl.przyciskGlowny} disabled:bg-slate-700 disabled:text-slate-500 px-3 py-2 rounded-lg text-sm font-bold transition cursor-pointer`}
          >
            Wyślij
          </button>
        </form>
      </div>

    </div>
  );
}