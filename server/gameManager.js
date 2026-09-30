import { LOCATIONS, AVATARS } from './data/locations.js';

// Almacén en memoria de salas activas
const rooms = new Map();

// Helper para generar código de sala de 5 letras
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Evita caracteres ambiguos como O, 0, I, 1
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Mezclador Fisher-Yates
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function createRoom(hostSocketId) {
  let code = generateRoomCode();
  while (rooms.has(code)) {
    code = generateRoomCode();
  }

  const room = {
    code,
    hostId: hostSocketId,
    createdAt: Date.now(),
    players: [],
    settings: {
      roundDuration: 0, // 0 = Tiempo Indefinido por defecto
      spyCount: 1,
      enableRoles: true
    },
    state: 'lobby', // 'lobby' | 'playing' | 'accusation' | 'spy_guessing' | 'round_end'
    round: null,
    usedLocations: [] // Historial para no repetir de inmediato la misma ubicación
  };

  rooms.set(code, room);
  return room;
}

export function getRoom(code) {
  if (!code) return null;
  return rooms.get(code.toUpperCase().trim());
}

export function getRoomBySocketId(socketId) {
  for (const room of rooms.values()) {
    if (room.players.some(p => p.id === socketId)) {
      return room;
    }
  }
  return null;
}

// Actualiza las referencias del jugador cuando cambia de socketId al reconectarse
function updatePlayerSocket(room, player, newSocketId) {
  const oldSocketId = player.id;
  player.id = newSocketId;
  player.connected = true;
  player.disconnectedAt = null;

  if (room.hostId === oldSocketId) {
    room.hostId = newSocketId;
  }

  if (room.round) {
    if (Array.isArray(room.round.spyIds)) {
      room.round.spyIds = room.round.spyIds.map(id => (id === oldSocketId ? newSocketId : id));
    }
    if (room.round.starterPlayer && room.round.starterPlayer.id === oldSocketId) {
      room.round.starterPlayer.id = newSocketId;
    }
    if (room.round.accusation) {
      const acc = room.round.accusation;
      if (acc.accuserId === oldSocketId) acc.accuserId = newSocketId;
      if (acc.suspectId === oldSocketId) acc.suspectId = newSocketId;
      if (acc.requiredVoters) {
        acc.requiredVoters = acc.requiredVoters.map(id => (id === oldSocketId ? newSocketId : id));
      }
      if (acc.votes && acc.votes[oldSocketId] !== undefined) {
        acc.votes[newSocketId] = acc.votes[oldSocketId];
        delete acc.votes[oldSocketId];
      }
    }
  }
}

export function joinRoom(roomCode, socketId, sessionId, playerName, avatar) {
  const room = getRoom(roomCode);
  if (!room) {
    return { error: 'La sala especificada no existe.' };
  }

  // 1. Verificar si este jugador ya estaba en la sala por su sessionId
  if (sessionId) {
    const existingPlayer = room.players.find(p => p.sessionId === sessionId);
    if (existingPlayer) {
      updatePlayerSocket(room, existingPlayer, socketId);
      if (playerName) existingPlayer.name = playerName.trim().substring(0, 16);
      if (avatar) existingPlayer.avatar = avatar;
      return { room, player: existingPlayer, reconnected: true };
    }
  }

  // 2. Si no es reconexión y la partida ya comenzó, no permitir unirse como nuevo
  if (room.state !== 'lobby') {
    return { error: 'La partida ya está en curso. Espera a que termine la ronda para unirte.' };
  }

  // 3. Crear nuevo jugador
  const defaultAvatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
  const isFirst = room.players.length === 0;

  const player = {
    id: socketId,
    sessionId: sessionId || socketId,
    name: (playerName || `Agente ${room.players.length + 1}`).trim().substring(0, 16),
    avatar: avatar || defaultAvatar,
    isHost: isFirst,
    score: 0,
    role: null,
    isSpy: false,
    connected: true,
    disconnectedAt: null
  };

  room.players.push(player);

  if (isFirst) {
    room.hostId = socketId;
    player.isHost = true;
  }

  return { room, player, reconnected: false };
}

// Reconexión silenciosa directa desde almacenamiento local
export function reconnectSession(roomCode, socketId, sessionId) {
  const room = getRoom(roomCode);
  if (!room) return { error: 'La sala ya no está activa.' };

  const player = room.players.find(p => p.sessionId === sessionId);
  if (!player) return { error: 'No se encontró la sesión en esta sala.' };

  updatePlayerSocket(room, player, socketId);
  return { room, player };
}

// Maneja desconexión de socket SIN borrar al jugador (para proteger sesiones de móviles y recargas)
export function handleSocketDisconnect(socketId) {
  const room = getRoomBySocketId(socketId);
  if (!room) return null;

  const player = room.players.find(p => p.id === socketId);
  if (!player) return null;

  player.connected = false;
  player.disconnectedAt = Date.now();

  // Si todos los jugadores se han desconectado, programar limpieza de sala en 10 minutos
  const anyConnected = room.players.some(p => p.connected);
  if (!anyConnected) {
    setTimeout(() => {
      const currentRoom = rooms.get(room.code);
      if (currentRoom && !currentRoom.players.some(p => p.connected)) {
        rooms.delete(room.code);
        console.log(`[Limpieza] Sala ${room.code} eliminada por inactividad prolongada.`);
      }
    }, 10 * 60 * 1000);
  }

  return { room, player };
}

// Salida voluntaria y explícita de la sala (botón "Salir de la sala")
export function leaveRoomExplicit(socketId, sessionId) {
  const room = getRoomBySocketId(socketId) || (sessionId ? Array.from(rooms.values()).find(r => r.players.some(p => p.sessionId === sessionId)) : null);
  if (!room) return null;

  const playerIndex = room.players.findIndex(p => p.id === socketId || (sessionId && p.sessionId === sessionId));
  if (playerIndex === -1) return null;

  const leavingPlayer = room.players[playerIndex];
  room.players.splice(playerIndex, 1);

  // Si no quedan jugadores, eliminar sala
  if (room.players.length === 0) {
    rooms.delete(room.code);
    return { roomCode: room.code, roomClosed: true };
  }

  // Si el que se fue era el host, pasar el host al primer jugador restante conectado
  if (leavingPlayer.isHost) {
    const nextHost = room.players.find(p => p.connected) || room.players[0];
    if (nextHost) {
      nextHost.isHost = true;
      room.hostId = nextHost.id;
    }
  }

  // Si la partida estaba en curso y quedaron menos de 3 jugadores, regresar a lobby
  if (room.state !== 'lobby' && room.players.length < 3) {
    room.state = 'lobby';
    room.round = null;
  }

  return { roomCode: room.code, roomClosed: false, room };
}

export function updateSettings(roomCode, socketId, newSettings) {
  const room = getRoom(roomCode);
  if (!room) return { error: 'Sala no encontrada.' };
  if (room.hostId !== socketId) return { error: 'Solo el anfitrión puede modificar la configuración.' };
  if (room.state !== 'lobby') return { error: 'No se puede modificar la configuración durante una ronda activa.' };

  if (typeof newSettings.roundDuration === 'number') {
    if (newSettings.roundDuration === 0) {
      room.settings.roundDuration = 0;
    } else {
      room.settings.roundDuration = Math.max(60, Math.min(900, newSettings.roundDuration));
    }
  }
  if (typeof newSettings.spyCount === 'number') {
    room.settings.spyCount = Math.max(1, Math.min(2, newSettings.spyCount));
  }
  if (typeof newSettings.enableRoles === 'boolean') {
    room.settings.enableRoles = newSettings.enableRoles;
  }

  return { room };
}

export function startGame(roomCode, socketId) {
  const room = getRoom(roomCode);
  if (!room) return { error: 'Sala no encontrada.' };
  if (room.hostId !== socketId) return { error: 'Solo el anfitrión puede iniciar la misión.' };
  if (room.players.length < 3) return { error: 'Se necesitan al menos 3 agentes para jugar a Spyfall.' };

  // Filtrar ubicaciones para no repetir las recientes
  let availableLocations = LOCATIONS.filter(loc => !room.usedLocations.includes(loc.id));
  if (availableLocations.length === 0) {
    room.usedLocations = [];
    availableLocations = [...LOCATIONS];
  }

  // Elegir ubicación secreta al azar
  const chosenLocation = availableLocations[Math.floor(Math.random() * availableLocations.length)];
  room.usedLocations.push(chosenLocation.id);

  // Determinar espías
  const actualSpyCount = Math.min(room.settings.spyCount, Math.floor(room.players.length / 3)) || 1;
  const shuffledPlayers = shuffleArray(room.players);
  const spyIds = shuffledPlayers.slice(0, actualSpyCount).map(p => p.id);

  // Asignar roles a los no espías
  const innocentPlayers = shuffledPlayers.slice(actualSpyCount);
  const shuffledRoles = shuffleArray(chosenLocation.roles);

  room.players.forEach(player => {
    player.isEliminated = false;
    if (spyIds.includes(player.id)) {
      player.isSpy = true;
      player.role = 'Espía Secreto';
    } else {
      player.isSpy = false;
      const roleIndex = innocentPlayers.findIndex(ip => ip.id === player.id);
      player.role = room.settings.enableRoles
        ? (shuffledRoles[roleIndex % shuffledRoles.length] || 'Agente de Campo')
        : 'Inocente en la ubicación';
    }
  });

  // Elegir jugador inicial para hacer la primera pregunta
  const starter = room.players[Math.floor(Math.random() * room.players.length)];

  const now = Date.now();
  const isUnlimited = room.settings.roundDuration === 0;
  const endTime = isUnlimited ? null : now + room.settings.roundDuration * 1000;

  room.state = 'playing';
  room.round = {
    location: chosenLocation,
    spyIds,
    starterPlayer: {
      id: starter.id,
      name: starter.name
    },
    startTime: now,
    endTime,
    durationSeconds: room.settings.roundDuration,
    isUnlimited,
    accusation: null,
    spyGuess: null,
    result: null,
    lastVoteNotice: null
  };

  return { room };
}

export function startAccusation(roomCode, accuserSocketId, suspectSocketId) {
  const room = getRoom(roomCode);
  if (!room || room.state !== 'playing') {
    return { error: 'No se puede iniciar una acusación en este momento.' };
  }

  const accuser = room.players.find(p => p.id === accuserSocketId);
  const suspect = room.players.find(p => p.id === suspectSocketId);

  if (!accuser || !suspect) return { error: 'Jugadores inválidos.' };
  if (accuser.id === suspect.id) return { error: 'No puedes acusarte a ti mismo.' };
  if (accuser.isEliminated) return { error: 'Los agentes eliminados no pueden acusar.' };
  if (suspect.isEliminated) return { error: 'Este jugador ya ha sido eliminado.' };

  // Pausar el tiempo de juego durante la acusación (si no es tiempo indefinido)
  const now = Date.now();
  const remainingMs = room.round.endTime ? Math.max(0, room.round.endTime - now) : null;

  // Solo los jugadores activos (no eliminados) y distintos al sospechoso pueden votar
  const activeVoters = room.players.filter(p => !p.isEliminated && p.id !== suspect.id).map(p => p.id);

  room.state = 'accusation';
  room.round.pausedRemainingMs = remainingMs;
  room.round.lastVoteNotice = null; // Limpiar avisos anteriores
  room.round.accusation = {
    accuserId: accuser.id,
    accuserName: accuser.name,
    suspectId: suspect.id,
    suspectName: suspect.name,
    suspectAvatar: suspect.avatar,
    // Votos de los demás jugadores (excluye al sospechoso)
    votes: {
      [accuser.id]: true // El acusador vota sí automáticamente
    },
    requiredVoters: activeVoters
  };

  return { room };
}

export function castVote(roomCode, voterSocketId, voteBool) {
  const room = getRoom(roomCode);
  if (!room || room.state !== 'accusation' || !room.round || !room.round.accusation) {
    return { error: 'No hay ninguna votación activa.' };
  }

  const voter = room.players.find(p => p.id === voterSocketId);
  if (voter && voter.isEliminated) {
    return { error: 'Los agentes eliminados no pueden votar.' };
  }

  const accusation = room.round.accusation;
  if (!accusation.requiredVoters.includes(voterSocketId)) {
    return { error: 'No puedes votar en esta acusación.' };
  }

  accusation.votes[voterSocketId] = Boolean(voteBool);

  // Verificar si todos los votantes requeridos han emitido su voto
  const totalRequired = accusation.requiredVoters.length;
  const votedCount = Object.keys(accusation.votes).length;

  if (votedCount >= totalRequired) {
    // Todos han votado: verificar resultado
    const yesVotes = Object.values(accusation.votes).filter(v => v === true).length;
    const noVotes = totalRequired - yesVotes;
    // Para condenar en Spyfall, se requiere unanimidad de los votantes (todos excepto el acusado)
    const isUnanimous = yesVotes === totalRequired;

    if (isUnanimous) {
      // ¡Acusado condenado y eliminado!
      const suspect = room.players.find(p => p.id === accusation.suspectId);
      const isSuspectSpy = suspect ? suspect.isSpy : false;

      if (isSuspectSpy) {
        // Los agentes atraparon al espía: ¡Fin de la partida y victoria de los agentes sobrevivientes!
        room.round.lastVoteNotice = {
          suspectName: suspect ? suspect.name : accusation.suspectName,
          suspectAvatar: accusation.suspectAvatar,
          eliminated: true,
          wasSpy: true,
          yesVotes,
          noVotes,
          totalRequired,
          timestamp: Date.now(),
          message: `🚨 ¡${suspect ? suspect.name : 'El sospechoso'} FUE ELIMINADO por decisión unánime (${yesVotes}/${totalRequired}) y ERA EL ESPÍA! Misión completada con éxito.`
        };

        return endRound(room, {
          winner: 'innocents',
          reason: `¡Agentes victoriosos! ${suspect ? suspect.name : 'El acusado'} fue eliminado por votación unánime y era el espía.`
        });
      } else {
        // ¡El sospechoso era INOCENTE! Se elimina SOLO a ese jugador, los demás siguen jugando
        if (suspect) {
          suspect.isEliminated = true;
        }

        // Contar agentes inocentes vivos restantes
        const survivingInnocents = room.players.filter(p => !p.isEliminated && !p.isSpy);
        const survivingSpies = room.players.filter(p => !p.isEliminated && p.isSpy);

        // Si quedan 1 o 0 inocentes vivos, el espía gana porque ya no hay agentes suficientes para votar
        if (survivingInnocents.length <= 1) {
          const spyNames = room.players.filter(p => p.isSpy).map(p => p.name).join(', ');
          room.round.lastVoteNotice = {
            suspectName: suspect ? suspect.name : accusation.suspectName,
            suspectAvatar: accusation.suspectAvatar,
            eliminated: true,
            wasSpy: false,
            yesVotes,
            noVotes,
            totalRequired,
            timestamp: Date.now(),
            message: `☠️ ¡${suspect ? suspect.name : 'El sospechoso'} era inocente y ha sido eliminado! Al no quedar agentes suficientes, ¡el espía (${spyNames}) gana la partida!`
          };

          return endRound(room, {
            winner: 'spies',
            reason: `¡Victoria del Espía! Los agentes se autoeliminaron por error y no quedaron suficientes para continuar. El verdadero espía era: ${spyNames}.`
          });
        }

        // Si aún quedan 2 o más agentes inocentes vivos, ¡LA PARTIDA CONTINÚA PARA LOS SOBREVIVIENTES!
        room.round.lastVoteNotice = {
          suspectName: suspect ? suspect.name : accusation.suspectName,
          suspectAvatar: accusation.suspectAvatar,
          eliminated: true,
          wasSpy: false,
          yesVotes,
          noVotes,
          totalRequired,
          timestamp: Date.now(),
          message: `⚠️ ¡${suspect ? suspect.name : 'El sospechoso'} FUE ELIMINADO (${yesVotes}/${totalRequired}), pero ERA INOCENTE! Pasa a ser espectador. ¡Los agentes restantes siguen jugando para descubrir al espía!`
        };

        if (room.round.pausedRemainingMs) {
          room.round.endTime = Date.now() + room.round.pausedRemainingMs;
        }
        room.round.accusation = null;
        room.state = 'playing';
        return { room, voteFailed: false, innocentEliminated: true };
      }
    } else {
      // La votación fracasó, NO fue eliminado
      room.round.lastVoteNotice = {
        suspectName: accusation.suspectName,
        suspectAvatar: accusation.suspectAvatar,
        eliminated: false,
        wasSpy: null,
        yesVotes,
        noVotes,
        totalRequired,
        timestamp: Date.now(),
        message: `🛡️ Votación terminada: ${accusation.suspectName} NO FUE ELIMINADO (${yesVotes} votos a favor, ${noVotes} en contra. Se requería unanimidad). La misión continúa.`
      };

      if (room.round.pausedRemainingMs) {
        room.round.endTime = Date.now() + room.round.pausedRemainingMs;
      }
      room.round.accusation = null;
      room.state = 'playing';
      return { room, voteFailed: true, yesVotes, totalRequired };
    }
  }

  return { room };
}

export function cancelAccusation(roomCode, socketId) {
  const room = getRoom(roomCode);
  if (!room || room.state !== 'accusation' || !room.round || !room.round.accusation) {
    return { error: 'No hay votación para cancelar.' };
  }

  if (room.round.accusation.accuserId !== socketId && room.hostId !== socketId) {
    return { error: 'Solo el acusador o el anfitrión pueden retirar la acusación.' };
  }

  room.round.lastVoteNotice = {
    suspectName: room.round.accusation.suspectName,
    eliminated: false,
    timestamp: Date.now(),
    message: `ℹ️ La acusación contra ${room.round.accusation.suspectName} fue cancelada. La misión continúa.`
  };

  if (room.round.pausedRemainingMs) {
    room.round.endTime = Date.now() + room.round.pausedRemainingMs;
  }
  room.round.accusation = null;
  room.state = 'playing';

  return { room };
}

export function spyGuessLocation(roomCode, socketId, locationId) {
  const room = getRoom(roomCode);
  if (!room || (room.state !== 'playing' && room.state !== 'accusation')) {
    return { error: 'No se puede intentar adivinar en este momento.' };
  }

  const player = room.players.find(p => p.id === socketId);
  if (!player || !player.isSpy) {
    return { error: 'Solo el espía puede revelar su identidad y adivinar la ubicación.' };
  }

  const guessedLoc = LOCATIONS.find(l => l.id === locationId);
  const actualLoc = room.round.location;

  const isCorrect = actualLoc && actualLoc.id === locationId;

  if (isCorrect) {
    return endRound(room, {
      winner: 'spies',
      reason: `¡El espía ${player.name} reveló su identidad y adivinó correctamente la ubicación secreta: ${actualLoc.name}!`,
      guess: guessedLoc ? guessedLoc.name : locationId
    });
  } else {
    return endRound(room, {
      winner: 'innocents',
      reason: `¡El espía ${player.name} falló al adivinar! Creyó que era "${guessedLoc ? guessedLoc.name : locationId}", pero era "${actualLoc.name}".`,
      guess: guessedLoc ? guessedLoc.name : locationId
    });
  }
}

export function handleTimeExpired(roomCode) {
  const room = getRoom(roomCode);
  if (!room || room.state !== 'playing' || !room.round) return null;

  // Si se acaba el tiempo y nadie descubrió al espía, el espía gana
  const spyNames = room.players.filter(p => p.isSpy).map(p => p.name).join(', ');
  return endRound(room, {
    winner: 'spies',
    reason: `¡Se agotó el tiempo de interrogatorio! El espía (${spyNames}) logró mantener su cobertura en secreto.`
  });
}

function endRound(room, { winner, reason, guess = null }) {
  room.state = 'round_end';

  // Asignar puntos individuales: solo los agentes sobrevivientes no eliminados puntúan
  if (winner === 'spies') {
    room.players.forEach(p => {
      if (p.isSpy) p.score += 2;
    });
  } else {
    room.players.forEach(p => {
      if (!p.isSpy && !p.isEliminated) p.score += 1;
    });
  }

  room.round.result = {
    winner,
    reason,
    guess,
    secretLocation: {
      id: room.round.location.id,
      name: room.round.location.name,
      emoji: room.round.location.emoji
    },
    spies: room.players.filter(p => p.isSpy).map(p => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar
    }))
  };

  return { room };
}

export function restartGame(roomCode, socketId) {
  const room = getRoom(roomCode);
  if (!room) return { error: 'Sala no encontrada.' };
  if (room.hostId !== socketId) return { error: 'Solo el anfitrión puede preparar la siguiente ronda.' };

  room.state = 'lobby';
  room.round = null;
  room.players.forEach(p => {
    p.role = null;
    p.isSpy = false;
    p.isEliminated = false;
  });

  return { room };
}

// Retorna los datos limpios y seguros para el cliente específico (NUNCA filtra la ubicación al espía)
export function getCleanRoomData(room, recipientSocketId) {
  if (!room) return null;

  const me = room.players.find(p => p.id === recipientSocketId);
  const isSpy = me ? me.isSpy : false;

  let clientRound = null;
  if (room.round) {
    // Si la ronda terminó, todos pueden ver la ubicación y los espías
    const isGameOver = room.state === 'round_end';

    clientRound = {
      startTime: room.round.startTime,
      endTime: room.round.endTime,
      durationSeconds: room.round.durationSeconds,
      isUnlimited: room.round.isUnlimited,
      starterPlayer: room.round.starterPlayer,
      accusation: room.round.accusation,
      result: room.round.result,
      lastVoteNotice: room.round.lastVoteNotice,
      // Información de ubicación:
      location: (isGameOver || !isSpy)
        ? {
            id: room.round.location.id,
            name: room.round.location.name,
            emoji: room.round.location.emoji
          }
        : null
    };
  }

  // Lista de jugadores: oculta si son espías a menos que haya terminado la ronda
  const cleanPlayers = room.players.map(p => ({
    id: p.id,
    sessionId: p.sessionId,
    name: p.name,
    avatar: p.avatar,
    isHost: p.isHost,
    score: p.score,
    connected: p.connected,
    isStarter: room.round?.starterPlayer?.id === p.id,
    hasVoted: room.round?.accusation?.votes ? room.round.accusation.votes[p.id] !== undefined : false,
    isAccused: room.round?.accusation?.suspectId === p.id,
    isEliminated: Boolean(p.isEliminated),
    // Solo revela rol si es el propio jugador o si la ronda terminó
    role: (room.state === 'round_end' || p.id === recipientSocketId) ? p.role : null,
    isSpy: (room.state === 'round_end' || p.id === recipientSocketId) ? p.isSpy : null
  }));

  // Lista de todas las ubicaciones para la cuadrícula interactiva
  const allLocations = LOCATIONS.map(loc => ({
    id: loc.id,
    name: loc.name,
    category: loc.category,
    emoji: loc.emoji
  }));

  return {
    code: room.code,
    hostId: room.hostId,
    state: room.state,
    settings: room.settings,
    players: cleanPlayers,
    round: clientRound,
    myPlayer: me ? {
      id: me.id,
      sessionId: me.sessionId,
      name: me.name,
      avatar: me.avatar,
      isHost: me.isHost,
      score: me.score,
      role: me.role,
      isSpy: me.isSpy,
      isEliminated: Boolean(me.isEliminated),
      connected: me.connected
    } : null,
    allLocations
  };
}
