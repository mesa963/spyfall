import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';

import {
  createRoom,
  joinRoom,
  reconnectSession,
  handleSocketDisconnect,
  leaveRoomExplicit,
  updateSettings,
  startGame,
  startAccusation,
  castVote,
  cancelAccusation,
  spyGuessLocation,
  handleTimeExpired,
  restartGame,
  getCleanRoomData,
  getRoom
} from './gameManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Verificación de estado
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'spyfall-server', timestamp: new Date() });
});

// Servir frontend compilado en producción
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Enviar estado de sala personalizado a cada jugador para garantizar que el espía NO reciba la ubicación
function broadcastRoom(room) {
  if (!room) return;
  room.players.forEach(p => {
    if (p.connected && p.id) {
      const cleanData = getCleanRoomData(room, p.id);
      io.to(p.id).emit('game-update', cleanData);
    }
  });
}

io.on('connection', (socket) => {
  console.log(`[Socket] Conectado: ${socket.id}`);

  // Crear una nueva sala
  socket.on('create-room', ({ playerName, avatar, sessionId }) => {
    const room = createRoom(socket.id);
    const result = joinRoom(room.code, socket.id, sessionId, playerName, avatar);
    if (result.error) {
      socket.emit('error-message', result.error);
      return;
    }

    socket.join(room.code);
    socket.emit('room-joined', { roomCode: room.code, playerId: socket.id, sessionId: result.player.sessionId });
    broadcastRoom(room);
    console.log(`[Sala] Creada ${room.code} por ${playerName} (${socket.id})`);
  });

  // Unirse a una sala existente
  socket.on('join-room', ({ roomCode, playerName, avatar, sessionId }) => {
    if (!roomCode) {
      socket.emit('error-message', 'El código de sala es requerido.');
      return;
    }

    const cleanCode = roomCode.toUpperCase().trim();
    const result = joinRoom(cleanCode, socket.id, sessionId, playerName, avatar);
    if (result.error) {
      socket.emit('error-message', result.error);
      return;
    }

    socket.join(result.room.code);
    socket.emit('room-joined', { roomCode: result.room.code, playerId: socket.id, sessionId: result.player.sessionId });
    broadcastRoom(result.room);
    console.log(`[Sala] ${playerName} entró a ${result.room.code} (Reconexión: ${result.reconnected})`);
  });

  // Intentar reconectar sesión guardada automáticamente
  socket.on('reconnect-session', ({ roomCode, sessionId }) => {
    if (!roomCode || !sessionId) {
      socket.emit('reconnect-failed');
      return;
    }

    const cleanCode = roomCode.toUpperCase().trim();
    const result = reconnectSession(cleanCode, socket.id, sessionId);
    if (result.error) {
      socket.emit('reconnect-failed', result.error);
      return;
    }

    socket.join(result.room.code);
    socket.emit('room-joined', { roomCode: result.room.code, playerId: socket.id, sessionId: result.player.sessionId });
    broadcastRoom(result.room);
    console.log(`[Reconexión Exitosa] Agente ${result.player.name} recuperó su sesión en sala ${result.room.code}`);
  });

  // Salir explícitamente de la sala (botón "Salir")
  socket.on('leave-room', ({ roomCode, sessionId }) => {
    const result = leaveRoomExplicit(socket.id, sessionId);
    socket.leave(roomCode);
    socket.emit('left-room-success');
    if (result && !result.roomClosed && result.room) {
      broadcastRoom(result.room);
    }
  });

  // Modificar configuraciones de partida
  socket.on('update-settings', ({ roomCode, settings }) => {
    const result = updateSettings(roomCode, socket.id, settings);
    if (result.error) {
      socket.emit('error-message', result.error);
      return;
    }
    broadcastRoom(result.room);
  });

  // Iniciar la partida
  socket.on('start-game', ({ roomCode }) => {
    const result = startGame(roomCode, socket.id);
    if (result.error) {
      socket.emit('error-message', result.error);
      return;
    }
    broadcastRoom(result.room);
    console.log(`[Partida] Iniciada en sala ${roomCode}`);
  });

  // Iniciar acusación a un jugador
  socket.on('start-accusation', ({ roomCode, suspectId }) => {
    const result = startAccusation(roomCode, socket.id, suspectId);
    if (result.error) {
      socket.emit('error-message', result.error);
      return;
    }
    broadcastRoom(result.room);
  });

  // Votar en una acusación
  socket.on('cast-vote', ({ roomCode, vote }) => {
    const result = castVote(roomCode, socket.id, vote);
    if (result.error) {
      socket.emit('error-message', result.error);
      return;
    }
    broadcastRoom(result.room);
  });

  // Cancelar acusación
  socket.on('cancel-accusation', ({ roomCode }) => {
    const result = cancelAccusation(roomCode, socket.id);
    if (result.error) {
      socket.emit('error-message', result.error);
      return;
    }
    broadcastRoom(result.room);
  });

  // El espía adivina la ubicación
  socket.on('spy-guess-location', ({ roomCode, locationId }) => {
    const result = spyGuessLocation(roomCode, socket.id, locationId);
    if (result.error) {
      socket.emit('error-message', result.error);
      return;
    }
    broadcastRoom(result.room);
  });

  // Verificación de fin de tiempo
  socket.on('time-expired', ({ roomCode }) => {
    const result = handleTimeExpired(roomCode);
    if (result && result.room) {
      broadcastRoom(result.room);
    }
  });

  // Reiniciar para otra ronda
  socket.on('restart-game', ({ roomCode }) => {
    const result = restartGame(roomCode, socket.id);
    if (result.error) {
      socket.emit('error-message', result.error);
      return;
    }
    broadcastRoom(result.room);
  });

  // Desconexión temporal (no destruye al jugador de inmediato para conservar la sesión)
  socket.on('disconnect', () => {
    console.log(`[Socket] Desconectado temporalmente: ${socket.id}`);
    const result = handleSocketDisconnect(socket.id);
    if (result && result.room) {
      broadcastRoom(result.room);
    }
  });
});

// Soporte para React Router o acceso directo en producción
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('Spyfall Server Running. Build frontend to view interface.');
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor de Spyfall escuchando en el puerto ${PORT}`);
});
