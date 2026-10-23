import express from 'express';
import http from 'node:http';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const pokoje = {};

io.on('connection', (socket) => {
  console.log('🟢 Użytkownik połączył się:', socket.id);

  // Host tworzy pokój z własnymi lub domyślnymi hasłami
  socket.on('utworz-pokoj', ({ kodPokoju, nick, kategoria, wlasneHasla }) => {
    socket.join(kodPokoju);
    socket.data.nick = nick;
    socket.data.kodPokoju = kodPokoju;
    socket.data.isHost = true;

    pokoje[kodPokoju] = {
      kategoria,
      wlasneHasla: wlasneHasla || [],
      host: socket.id,
      gracze: [{ id: socket.id, nick }]
    };

    console.log(`🏠 Host "${nick}" utworzył pokój [${kodPokoju}]`);
    socket.emit('start-gry', { kategoria, wlasneHasla: pokoje[kodPokoju].wlasneHasla, gracze: pokoje[kodPokoju].gracze, isHost: true });
    io.to(kodPokoju).emit('aktualizacja-graczy', pokoje[kodPokoju].gracze);
  });

  // Gracz dołącza do pokoju
  socket.on('dolacz-do-pokoju', ({ kodPokoju, nick }) => {
    if (!pokoje[kodPokoju]) {
      socket.emit('blad', 'Taki pokój nie istnieje! Sprawdź kod.');
      return;
    }

    socket.join(kodPokoju);
    socket.data.nick = nick;
    socket.data.kodPokoju = kodPokoju;
    socket.data.isHost = false;

    pokoje[kodPokoju].gracze.push({ id: socket.id, nick });

    const pokoj = pokoje[kodPokoju];
    console.log(`👤 Gracz "${nick}" dołączył do pokoju [${kodPokoju}]`);

    socket.emit('start-gry', { kategoria: pokoj.kategoria, wlasneHasla: pokoj.wlasneHasla, gracze: pokoj.gracze, isHost: false });
    
    io.to(kodPokoju).emit('aktualizacja-graczy', pokoj.gracze);
    io.to(kodPokoju).emit('powiadomienie', `Gracz ${nick} dołączył do pokoju!`);
  });

  // Wygrana w pokoju
  socket.on('bingo-wygrana', () => {
    const { nick, kodPokoju } = socket.data;
    if (kodPokoju) {
      io.to(kodPokoju).emit('ogloszenie-wygranej', `🎉 Gracz ${nick} właśnie zdobył BINGO!`);
    }
  });

  // Rozłączenie
  socket.on('disconnect', () => {
    const { kodPokoju, nick } = socket.data;
    if (kodPokoju && pokoje[kodPokoju]) {
      pokoje[kodPokoju].gracze = pokoje[kodPokoju].gracze.filter(g => g.id !== socket.id);
      
      if (pokoje[kodPokoju].gracze.length === 0) {
        delete pokoje[kodPokoju];
        console.log(`🗑️ Pokój [${kodPokoju}] zamknięty.`);
      } else {
        io.to(kodPokoju).emit('aktualizacja-graczy', pokoje[kodPokoju].gracze);
        io.to(kodPokoju).emit('powiadomienie', `Gracz ${nick} opuścił pokój.`);
      }
    }
    console.log('🔴 Użytkownik rozłączył się:', socket.id);
  });
});

server.listen(3000, () => {
  console.log('🚀 Serwer Socket.io działa na porcie 3000');
});