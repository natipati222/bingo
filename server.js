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

  socket.on('utworz-pokoj', ({ kodPokoju, nick, kategoria, wlasneHasla }) => {
    socket.join(kodPokoju);
    socket.data.nick = nick;
    socket.data.kodPokoju = kodPokoju;
    socket.data.isHost = true;

    pokoje[kodPokoju] = {
      kategoria,
      wlasneHasla: wlasneHasla || [],
      host: socket.id,
      gracze: [{ id: socket.id, nick }],
      zwyciezcy: [] // Lista osób, które zrobiły Bingo w kolejności
    };

    console.log(`🏠 Host "${nick}" utworzył pokój [${kodPokoju}]`);
    socket.emit('start-gry', { kategoria, wlasneHasla: pokoje[kodPokoju].wlasneHasla, gracze: pokoje[kodPokoju].gracze, isHost: true });
    io.to(kodPokoju).emit('aktualizacja-graczy', pokoje[kodPokoju].gracze);
  });

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

  // Obsługa zdobycia Bingo z zachowaniem miejsc
  socket.on('bingo-wygrana', () => {
    const { nick, kodPokoju } = socket.data;
    if (kodPokoju && pokoje[kodPokoju]) {
      const pokoj = pokoje[kodPokoju];

      // Sprawdzamy czy ten gracz nie ma już przypisanego miejsca
      const czyJuzWygral = pokoj.zwyciezcy.some(z => z.nick === nick);
      if (!czyJuzWygral) {
        const miejsce = pokoj.zwyciezcy.length + 1; // 1, 2, lub 3 miejsce
        if (miejsce <= 3) {
          pokoj.zwyciezcy.push({ nick, miejsce });
        }

        let trescOgloszenia = `🎉 Gracz ${nick} zdobył ${miejsce}. miejsce z BINGO!`;
        console.log(`🎉 Pokój [${kodPokoju}]: ${trescOgloszenia}`);

        // Wysyłamy informację do wszystkich w pokoju (w tym do panelu aktywności)
        io.to(kodPokoju).emit('ogloszenie-wygranej', { 
          tresc: trescOgloszenia, 
          zwyciezcy: pokoj.zwyciezcy,
          zwyciezcaOstatni: nick,
          miejsce
        });
        
        io.to(kodPokoju).emit('powiadomienie', `🏆 ${nick} zdobył ${miejsce}. miejsce!`);
      }
    }
  });

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
  console.log('🚀 Serwer Socket.io działa na porcie 3000 (Podium i Miejsca)');
});