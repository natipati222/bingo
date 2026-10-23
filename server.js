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

// Obiekt przechowujący aktywne pokoje i ich ustawienia
const pokoje = {};

io.on('connection', (socket) => {
  console.log('🟢 Nowy użytkownik połączył się:', socket.id);

  // 1. Host tworzy pokój (wybiera kategorię i kod)
  socket.on('utworz-pokoj', ({ kodPokoju, nick, kategoria }) => {
    socket.join(kodPokoju);
    socket.data.nick = nick;
    socket.data.kodPokoju = kodPokoju;
    socket.data.isHost = true;

    // Zapisujemy pokój na serwerze
    pokoje[kodPokoju] = { kategoria, host: socket.id };
    console.log(`🏠 Host "${nick}" utworzył pokój [${kodPokoju}] z kategorią: ${kategoria}`);

    // Potwierdzamy hostowi wejście do gry
    socket.emit('start-gry', { kategoria, isHost: true });
  });

  // 2. Gracz dołącza do istniejącego pokoju (NIE wybiera kategorii)
  socket.on('dolacz-do-pokoju', ({ kodPokoju, nick }) => {
    if (!pokoje[kodPokoju]) {
      socket.emit('blad', 'Taki pokój nie istnieje! Sprawdź kod.');
      return;
    }

    socket.join(kodPokoju);
    socket.data.nick = nick;
    socket.data.kodPokoju = kodPokoju;
    socket.data.isHost = false;

    const kategoriaPokoju = pokoje[kodPokoju].kategoria;
    console.log(`👤 Gracz "${nick}" dołączył do pokoju [${kodPokoju}] (kategoria: ${kategoriaPokoju})`);

    // Wysyłamy graczowi kategorię przypisaną do tego pokoju
    socket.emit('start-gry', { kategoria: kategoriaPokoju, isHost: false });
    
    // Powiadamiamy innych w pokoju
    io.to(kodPokoju).emit('powiadomienie', `Gracz ${nick} dołączył do pokoju!`);
  });

  // 3. Wygrana w pokoju
  socket.on('bingo-wygrana', () => {
    const { nick, kodPokoju } = socket.data;
    if (kodPokoju) {
      console.log(`🎉 BINGO w pokoju ${kodPokoju}! Wygrał: ${nick}`);
      io.to(kodPokoju).emit('ogloszenie-wygranej', `🎉 Gracz ${nick} właśnie zdobył BINGO!`);
    }
  });

  socket.on('disconnect', () => {
    console.log('🔴 Użytkownik rozłączył się:', socket.id);
  });
});

server.listen(3000, () => {
  console.log('🚀 Serwer Socket.io działa na porcie 3000 (System Host / Gracz)');
});