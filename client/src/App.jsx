import React, { useState, useEffect } from 'react';
import { socket } from './services/socket';
import Navbar from './components/Navbar';
import HowToPlayModal from './components/HowToPlayModal';
import Lobby from './components/Lobby';
import WaitingRoom from './components/WaitingRoom';
import GameView from './components/GameView';
import RoundResults from './components/RoundResults';

function getSessionId() {
  let id = localStorage.getItem('spyfall_session_id');
  if (!id) {
    id = 'agent_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now();
    localStorage.setItem('spyfall_session_id', id);
  }
  return id;
}

export default function App() {
  const [sessionId] = useState(getSessionId());
  const [roomData, setRoomData] = useState(null);
  const [initialRoomCode, setInitialRoomCode] = useState('');
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    // Detectar si el usuario llegó con un enlace de sala: ?room=XYZ
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('room');
    if (roomFromUrl) {
      setInitialRoomCode(roomFromUrl.toUpperCase());
    }

    function tryAutoReconnect() {
      const savedRoom = localStorage.getItem('spyfall_current_room');
      if (savedRoom) {
        setIsReconnecting(true);
        socket.emit('reconnect-session', {
          roomCode: savedRoom,
          sessionId
        });
      }
    }

    function onConnect() {
      setIsConnected(true);
      setServerError('');
      tryAutoReconnect();
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onRoomJoined({ roomCode }) {
      setIsReconnecting(false);
      localStorage.setItem('spyfall_current_room', roomCode);
    }

    function onGameUpdate(data) {
      setIsReconnecting(false);
      setRoomData(data);
    }

    function onReconnectFailed() {
      setIsReconnecting(false);
      localStorage.removeItem('spyfall_current_room');
      setRoomData(null);
    }

    function onLeftRoomSuccess() {
      localStorage.removeItem('spyfall_current_room');
      setRoomData(null);
    }

    function onErrorMessage(msg) {
      setIsReconnecting(false);
      setServerError(msg);
      setTimeout(() => setServerError(''), 6000);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('room-joined', onRoomJoined);
    socket.on('game-update', onGameUpdate);
    socket.on('reconnect-failed', onReconnectFailed);
    socket.on('left-room-success', onLeftRoomSuccess);
    socket.on('error-message', onErrorMessage);

    // Si ya está conectado al montar el componente
    if (socket.connected) {
      tryAutoReconnect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('room-joined', onRoomJoined);
      socket.off('game-update', onGameUpdate);
      socket.off('reconnect-failed', onReconnectFailed);
      socket.off('left-room-success', onLeftRoomSuccess);
      socket.off('error-message', onErrorMessage);
    };
  }, [sessionId]);

  const handleLeaveRoom = () => {
    if (roomData?.code) {
      socket.emit('leave-room', {
        roomCode: roomData.code,
        sessionId
      });
    }
    localStorage.removeItem('spyfall_current_room');
    setRoomData(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-slate-100 selection:bg-rose-500 selection:text-white">
      <Navbar
        roomCode={roomData?.code}
        onOpenHelp={() => setShowHelpModal(true)}
        onLeaveRoom={roomData ? handleLeaveRoom : null}
      />

      {/* Alerta de reconexión o desconexión */}
      {!isConnected && (
        <div className="bg-amber-600/90 text-white text-xs font-mono py-1.5 px-4 text-center">
          Conexión interrumpida. Reconectando con el servidor central...
        </div>
      )}

      {isReconnecting && isConnected && (
        <div className="bg-cyan-600/90 text-white text-xs font-mono py-1.5 px-4 text-center animate-pulse">
          Recuperando tu sesión anterior en la sala {localStorage.getItem('spyfall_current_room')}...
        </div>
      )}

      {serverError && (
        <div className="max-w-md mx-auto mt-4 px-4 w-full">
          <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500 text-rose-300 text-xs font-medium flex items-center justify-between shadow-lg">
            <span>⚠️ {serverError}</span>
            <button
              onClick={() => setServerError('')}
              className="text-slate-400 hover:text-white text-base ml-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Contenido principal según el estado */}
      <main className="flex-1 pb-8">
        {!roomData && (
          <Lobby
            initialCode={initialRoomCode}
            sessionId={sessionId}
          />
        )}

        {roomData && roomData.state === 'lobby' && (
          <WaitingRoom
            room={roomData}
            myPlayer={roomData.myPlayer}
            onLeaveRoom={handleLeaveRoom}
          />
        )}

        {roomData && (roomData.state === 'playing' || roomData.state === 'accusation') && (
          <GameView
            room={roomData}
            myPlayer={roomData.myPlayer}
          />
        )}

        {roomData && roomData.state === 'round_end' && (
          <RoundResults
            room={roomData}
            myPlayer={roomData.myPlayer}
          />
        )}
      </main>

      {/* Modal de Reglas */}
      <HowToPlayModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />

      {/* Pie de página */}
      <footer className="py-4 border-t border-slate-900 text-center text-xs text-slate-400 font-mono">
        Spyfall Multijugador // Sesión persistente ante recargas o cambios de app
      </footer>
    </div>
  );
}
