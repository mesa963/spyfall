import React, { useState, useEffect } from 'react';
import { socket } from './services/socket';
import Navbar from './components/Navbar';
import HowToPlayModal from './components/HowToPlayModal';
import Lobby from './components/Lobby';
import WaitingRoom from './components/WaitingRoom';
import GameView from './components/GameView';
import RoundResults from './components/RoundResults';

export default function App() {
  const [roomData, setRoomData] = useState(null);
  const [initialRoomCode, setInitialRoomCode] = useState('');
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    // Detectar si el usuario llegó con un enlace de sala: ?room=XYZ
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('room');
    if (roomFromUrl) {
      setInitialRoomCode(roomFromUrl.toUpperCase());
    }

    function onConnect() {
      setIsConnected(true);
      setServerError('');
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onGameUpdate(data) {
      setRoomData(data);
    }

    function onErrorMessage(msg) {
      setServerError(msg);
      setTimeout(() => setServerError(''), 6000);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('game-update', onGameUpdate);
    socket.on('error-message', onErrorMessage);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('game-update', onGameUpdate);
      socket.off('error-message', onErrorMessage);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-slate-100 selection:bg-rose-500 selection:text-white">
      <Navbar
        roomCode={roomData?.code}
        onOpenHelp={() => setShowHelpModal(true)}
      />

      {/* Alerta de desconexión o error */}
      {!isConnected && (
        <div className="bg-amber-600/90 text-white text-xs font-mono py-1.5 px-4 text-center">
          Conectando con el servidor central de inteligencia...
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
          <Lobby initialCode={initialRoomCode} />
        )}

        {roomData && roomData.state === 'lobby' && (
          <WaitingRoom
            room={roomData}
            myPlayer={roomData.myPlayer}
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
        Spyfall Multijugador // Creado para jugar en grupo desde celular o PC
      </footer>
    </div>
  );
}
