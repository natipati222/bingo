const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('🟢 Nowy gracz połączył się:', socket.id);

  // Dołączanie do pokoju
  socket.on('dolacz-do-pokoju', ({ kodPokoju, nick }) => {
    socket.join(kodPokoju);
    socket.data.nick = nick;
    socket.data.kodPokoju = kodPokoju;

    console.log(`👤 Gracz "${nick}" dołączył do pokoju: ${kodPokoju}`);
    
    // Informujemy wszystkich w pokoju, że ktoś doszedł
    io.to(kodPokoju).emit('powiadomienie', `Gracz ${nick} dołączył do pokoju!`);
  });

  // Reakcja na wygraną gracza w konkretnym pokoju
  socket.on('bingo-wygrana', () => {
    const { nick, kodPokoju } = socket.data;
    if (kodPokoju) {
      console.log(`🎉 BINGO w pokoju ${kodPokoju}! Wygrał: ${nick}`);
      // Wysyłamy ogłoszenie o wygranej TYLKO do graczy w tym samym pokoju
      io.to(kodPokoju).emit('ogloszenie-wygranej', `🎉 Gracz ${nick} właśnie zdobył BINGO!`);
    }
  });

  socket.on('disconnect', () => {
    console.log('🔴 Gracz rozłączył się:', socket.id);
  });
});

server.listen(3000, () => {
  console.log('🚀 Serwer Socket.io działa na porcie 3000 (obsługa pokoi)');
});