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

// Słownik przechowujący pokoje: kod -> { kategoria, host, gracze: [{ id, nick }] }
const pokoje = {};

io.on('connection', (socket) => {
  console.log('🟢 Użytkownik połączył się:', socket.id);

  // 1. Host tworzy pokój
  socket.on('utworz-pokoj', ({ kodPokoju, nick, kategoria }) => {
    socket.join(kodPokoju);
    socket.data.nick = nick;
    socket.data.kodPokoju = kodPokoju;
    socket.data.isHost = true;

    pokoje[kodPokoju] = {
      kategoria,
      host: socket.id,
      gracze: [{ id: socket.id, nick }]
    };

    console.log(`🏠 Host "${nick}" utworzył pokój [${kodPokoju}]`);
    socket.emit('start-gry', { kategoria, gracze: pokoje[kodPokoju].gracze, isHost: true });
    
    // Wysyłamy aktualną listę graczy do pokoju
    io.to(kodPokoju).emit('aktualizacja-graczy', pokoje[kodPokoju].gracze);
  });

  // 2. Gracz dołącza do pokoju
  socket.on('dolacz-do-pokoju', ({ kodPokoju, nick }) => {
    if (!pokoje[kodPokoju]) {
      socket.emit('blad', 'Taki pokój nie istnieje! Sprawdź kod.');
      return;
    }

    socket.join(kodPokoju);
    socket.data.nick = nick;
    socket.data.kodPokoju = kodPokoju;
    socket.data.isHost = false;

    // Dodajemy gracza do listy w pokoju
    pokoje[kodPokoju].gracze.push({ id: socket.id, nick });

    const kategoriaPokoju = pokoje[kodPokoju].kategoria;
    console.log(`👤 Gracz "${nick}" dołączył do pokoju [${kodPokoju}]`);

    socket.emit('start-gry', { kategoria: kategoriaPokoju, gracze: pokoje[kodPokoju].gracze, isHost: false });
    
    // Wysyłamy nową listę graczy do wszystkich w pokoju
    io.to(kodPokoju).emit('aktualizacja-graczy', pokoje[kodPokoju].gracze);
    io.to(kodPokoju).emit('powiadomienie', `Gracz ${nick} dołączył do pokoju!`);
  });

  // 3. Wygrana w pokoju
  socket.on('bingo-wygrana', () => {
    const { nick, kodPokoju } = socket.data;
    if (kodPokoju) {
      io.to(kodPokoju).emit('ogloszenie-wygranej', `🎉 Gracz ${nick} właśnie zdobył BINGO!`);
    }
  });

  // 4. Obsługa rozłączenia
  socket.on('disconnect', () => {
    const { kodPokoju, nick } = socket.data;
    if (kodPokoju && pokoje[kodPokoju]) {
      // Usuwamy gracza z listy pokoju
      pokoje[kodPokoju].gracze = pokoje[kodPokoju].gracze.filter(g => g.id !== socket.id);
      
      // Jeśli pokój jest pusty, usuwamy go całkowicie
      if (pokoje[kodPokoju].gracze.length === 0) {
        delete pokoje[kodPokoju];
        console.log(`🗑️ Pokój [${kodPokoju}] został zamknięty (brak graczy).`);
      } else {
        // Inaczej wysyłamy odświeżoną listę do pozostałych
        io.to(kodPokoju).emit('aktualizacja-graczy', pokoje[kodPokoju].gracze);
        io.to(kodPokoju).emit('powiadomienie', `Gracz ${nick} opuścił pokój.`);
      }
    }
    console.log('🔴 Użytkownik rozłączył się:', socket.id);
  });
});

server.listen(3000, () => {
  console.log('🚀 Serwer Socket.io działa na porcie 3000 (System graczy online)');
});