import express from 'express';
import http from 'node:http';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      process.env.RENDER_EXTERNAL_URL,
      "http://localhost:5173"
    ].filter(Boolean),
    methods: ["GET", "POST"]
  }
});

app.use(express.static(join(process.cwd(), 'dist')));

const katalogDanych = process.env.BINGO_DATA_DIR || join(process.cwd(), '.bingo-data');
const plikPokoi = join(katalogDanych, 'rooms.json');
mkdirSync(dirname(plikPokoi), { recursive: true });
const pokoje = existsSync(plikPokoi)
  ? JSON.parse(readFileSync(plikPokoi, 'utf8'))
  : {};

for (const pokoj of Object.values(pokoje)) {
  if (!Array.isArray(pokoj.historiaCzatu)) {
    pokoj.historiaCzatu = [];
  }

  for (const gracz of pokoj.gracze) {
    gracz.socketId = null;
  }
}

const zapiszPokoje = () => {
  writeFileSync(plikPokoi, JSON.stringify(pokoje, null, 2));
};

const aktywniGracze = (pokoj) => pokoj.gracze
  .filter(gracz => gracz.socketId)
  .map(({ id, nick }) => ({ id, nick }));

const daneStartowe = (kodPokoju, pokoj, gracz) => ({
  kodPokoju,
  nick: gracz.nick,
  playerId: gracz.id,
  kategoria: pokoj.kategoria,
  wlasneHasla: pokoj.wlasneHasla,
  gracze: aktywniGracze(pokoj),
  isHost: pokoj.host === gracz.id,
  postep: {
    hasla: gracz.hasla,
    zaznaczone: gracz.zaznaczone,
    czyZrobilemBingo: gracz.czyZrobilemBingo
  },
  zwyciezcy: pokoj.zwyciezcy,
  ostatnieOgloszenie: pokoj.ostatnieOgloszenie || "",
  historiaCzatu: pokoj.historiaCzatu
});

const dolaczGracza = (socket, kodPokoju, pokoj, gracz) => {
  const poprzedniSocket = gracz.socketId && io.sockets.sockets.get(gracz.socketId);
  if (poprzedniSocket && poprzedniSocket.id !== socket.id) {
    poprzedniSocket.disconnect(true);
  }

  gracz.socketId = socket.id;
  socket.join(kodPokoju);
  socket.data.nick = gracz.nick;
  socket.data.kodPokoju = kodPokoju;
  socket.data.playerId = gracz.id;
  zapiszPokoje();
  socket.emit('start-gry', daneStartowe(kodPokoju, pokoj, gracz));
  io.to(kodPokoju).emit('aktualizacja-graczy', aktywniGracze(pokoj));
};

io.on('connection', (socket) => {
  console.log('🟢 Użytkownik połączył się:', socket.id);

  socket.on('utworz-pokoj', ({ kodPokoju, nick, kategoria, wlasneHasla, playerId }) => {
    if (pokoje[kodPokoju]) {
      socket.emit('blad', 'Ten kod pokoju jest już zajęty. Wylosuj nowy.');
      return;
    }

    const idGracza = playerId || socket.id;
    const pulaHasel = Array.isArray(wlasneHasla) ? wlasneHasla : [];
    const pokoj = {
      kategoria,
      wlasneHasla: pulaHasel,
      host: idGracza,
      gracze: [{
        id: idGracza,
        nick,
        socketId: null,
        hasla: [...pulaHasel].sort(() => Math.random() - 0.5).slice(0, 9),
        zaznaczone: Array(9).fill(false),
        czyZrobilemBingo: false
      }],
      zwyciezcy: [],
      ostatnieOgloszenie: "",
      historiaCzatu: []
    };

    pokoje[kodPokoju] = pokoj;
    const gracz = pokoj.gracze[0];
    console.log(`🏠 Host "${nick}" utworzył pokój [${kodPokoju}]`);
    dolaczGracza(socket, kodPokoju, pokoj, gracz);
  });

  socket.on('dolacz-do-pokoju', ({ kodPokoju, nick, playerId }) => {
    const pokoj = pokoje[kodPokoju];
    if (!pokoj) {
      socket.emit('blad', 'Taki pokój nie istnieje! Sprawdź kod.');
      return;
    }

    const idGracza = playerId || socket.id;
    let gracz = pokoj.gracze.find(osoba => osoba.id === idGracza);
    if (!gracz) {
      gracz = {
        id: idGracza,
        nick,
        socketId: null,
        hasla: [...pokoj.wlasneHasla].sort(() => Math.random() - 0.5).slice(0, 9),
        zaznaczone: Array(9).fill(false),
        czyZrobilemBingo: false
      };
      pokoj.gracze.push(gracz);
    } else {
      gracz.nick = nick;
    }

    console.log(`👤 Gracz "${nick}" dołączył do pokoju [${kodPokoju}]`);
    dolaczGracza(socket, kodPokoju, pokoj, gracz);
    io.to(kodPokoju).emit('powiadomienie', `Gracz ${nick} dołączył do pokoju!`);
  });

  socket.on('wznow-gre', ({ kodPokoju, playerId }) => {
    const pokoj = pokoje[kodPokoju];
    const gracz = pokoj?.gracze.find(osoba => osoba.id === playerId);
    if (!gracz) {
      socket.emit('wznowienie-nieudane');
      return;
    }

    dolaczGracza(socket, kodPokoju, pokoj, gracz);
  });

  socket.on('aktualizacja-postepu', ({ hasla, zaznaczone, czyZrobilemBingo }) => {
    const { kodPokoju, playerId } = socket.data;
    const pokoj = pokoje[kodPokoju];
    const gracz = pokoj?.gracze.find(osoba => osoba.id === playerId);
    if (!gracz || !Array.isArray(hasla) || hasla.length !== 9 || !Array.isArray(zaznaczone) || zaznaczone.length !== 9) {
      return;
    }

    gracz.hasla = hasla;
    gracz.zaznaczone = zaznaczone.map(Boolean);
    gracz.czyZrobilemBingo = Boolean(czyZrobilemBingo);
    zapiszPokoje();
  });

  socket.on('opusc-gre', () => {
    const { kodPokoju, playerId } = socket.data;
    const pokoj = pokoje[kodPokoju];
    const gracz = pokoj?.gracze.find(osoba => osoba.id === playerId);
    if (gracz?.socketId === socket.id) {
      gracz.socketId = null;
      socket.leave(kodPokoju);
      socket.data.kodPokoju = null;
      zapiszPokoje();
      io.to(kodPokoju).emit('aktualizacja-graczy', aktywniGracze(pokoj));
    }
  });

  socket.on('bingo-wygrana', () => {
    const { nick, kodPokoju, playerId } = socket.data;
    const pokoj = pokoje[kodPokoju];
    const gracz = pokoj?.gracze.find(osoba => osoba.id === playerId);
    if (!pokoj || !gracz) return;

    gracz.czyZrobilemBingo = true;
    const czyJuzWygral = pokoj.zwyciezcy.some(z => z.playerId === playerId);
    if (!czyJuzWygral) {
      const miejsce = pokoj.zwyciezcy.length + 1;
      if (miejsce <= 3) {
        pokoj.zwyciezcy.push({ playerId, nick, miejsce });
      }

      const trescOgloszenia = `🎉 Gracz ${nick} zdobył ${miejsce}. miejsce z BINGO!`;
      pokoj.ostatnieOgloszenie = trescOgloszenia;
      console.log(`🎉 Pokój [${kodPokoju}]: ${trescOgloszenia}`);
      zapiszPokoje();

      io.to(kodPokoju).emit('ogloszenie-wygranej', {
        tresc: trescOgloszenia,
        zwyciezcy: pokoj.zwyciezcy,
        zwyciezcaOstatni: nick,
        miejsce
      });
      io.to(kodPokoju).emit('powiadomienie', `🏆 ${nick} zdobył ${miejsce}. miejsce!`);
    } else {
      zapiszPokoje();
    }
  });

  socket.on('wiadomosc-czat', (tresc) => {
    const { kodPokoju, nick } = socket.data;
    if (kodPokoju && typeof tresc === 'string' && tresc.trim()) {
      const czas = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const wiadomosc = {
        autor: nick,
        tresc: tresc.trim(),
        czas: czas
      };
      pokoje[kodPokoju].historiaCzatu.push(wiadomosc);
      zapiszPokoje();
      io.to(kodPokoju).emit('nowa-wiadomosc', wiadomosc);
    }
  });

  socket.on('opusc-pokoj', () => {
    const { kodPokoju, nick, playerId } = socket.data;
    const pokoj = pokoje[kodPokoju];
    const gracz = pokoj?.gracze.find(osoba => osoba.id === playerId);
    if (!gracz || gracz.socketId !== socket.id) return;

    pokoj.gracze = pokoj.gracze.filter(osoba => osoba.id !== playerId);
    socket.leave(kodPokoju);
    socket.data.kodPokoju = null;
    socket.data.playerId = null;

    if (pokoj.gracze.length === 0) {
      delete pokoje[kodPokoju];
      console.log(`🗑️ Pokój [${kodPokoju}] zamknięty (wszyscy wyszli).`);
    } else {
      if (pokoj.host === playerId) {
        pokoj.host = pokoj.gracze.find(osoba => osoba.socketId)?.id || pokoj.gracze[0].id;
      }
      io.to(kodPokoju).emit('aktualizacja-graczy', aktywniGracze(pokoj));
      io.to(kodPokoju).emit('powiadomienie', `Gracz ${nick} opuścił pokój.`);
    }

    zapiszPokoje();
  });

  socket.on('disconnect', () => {
    const { kodPokoju, nick, playerId } = socket.data;
    const pokoj = pokoje[kodPokoju];
    const gracz = pokoj?.gracze.find(osoba => osoba.id === playerId);
    if (gracz?.socketId === socket.id) {
      gracz.socketId = null;
      zapiszPokoje();
      io.to(kodPokoju).emit('aktualizacja-graczy', aktywniGracze(pokoj));
      io.to(kodPokoju).emit('powiadomienie', `Gracz ${nick} opuścił pokój.`);
    }
    console.log('🔴 Użytkownik rozłączył się:', socket.id);
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`🚀 Serwer Bingo działa na porcie ${port}`);
});
