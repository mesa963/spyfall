import React, { useState } from 'react';
import { AlertOctagon, Target, MessageSquare, ShieldAlert, Sparkles } from 'lucide-react';
import TimerBar from './TimerBar';
import SecretCard from './SecretCard';
import LocationsGrid from './LocationsGrid';
import VotingModal from './VotingModal';
import SpyGuessModal from './SpyGuessModal';
import PlayersStatusPanel from './PlayersStatusPanel';
import VoteNoticeBanner from './VoteNoticeBanner';

export default function GameView({ room, myPlayer }) {
  const [showAccusationModal, setShowAccusationModal] = useState(false);
  const [showSpyGuessModal, setShowSpyGuessModal] = useState(false);

  const round = room?.round;
  const isSpy = myPlayer?.isSpy;

  return (
    <div className="max-w-4xl mx-auto my-4 px-4 space-y-4 animate-fadeIn">
      {/* Aviso de resultado de la votación (Si eliminaron o no a la persona) */}
      {round?.lastVoteNotice && (
        <VoteNoticeBanner notice={round.lastVoteNotice} />
      )}

      {/* Barra de tiempo y estado (Soporta tiempo indefinido y cuenta regresiva) */}
      <TimerBar
        round={round}
        roomCode={room.code}
        state={room.state}
      />

      {/* Panel con el estado detallado de todos los agentes */}
      <PlayersStatusPanel
        players={room.players || []}
        myPlayer={myPlayer}
        isAccusationActive={room.state === 'accusation'}
      />

      {/* Banner de Jugador Inicial para la primera pregunta */}
      {round?.starterPlayer && (
        <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-950/70 via-slate-900 to-slate-950 border border-cyan-500/30 flex items-center justify-between gap-3 text-xs shadow-md">
          <div className="flex items-center gap-2 text-cyan-300 font-medium">
            <span className="text-base">🎙️</span>
            <span>
              Primera Pregunta: <strong className="text-white font-bold">{round.starterPlayer.name}</strong> inicia preguntando a quien desee.
            </span>
          </div>
          <span className="text-[10px] text-cyan-400/80 font-mono hidden sm:inline">
            REGLA: El interrogado responde y luego pregunta a otro.
          </span>
        </div>
      )}

      {/* Tarjeta de Identidad Secreta */}
      <SecretCard
        myPlayer={myPlayer}
        round={round}
        onOpenSpyGuess={() => setShowSpyGuessModal(true)}
      />

      {/* Botones de Acción Táctica */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => setShowAccusationModal(true)}
          className="p-3.5 rounded-xl bg-slate-900 border border-rose-500/40 hover:border-rose-500 hover:bg-rose-950/20 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 group"
        >
          <AlertOctagon className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
          <span>Acusar a un Sospechoso</span>
        </button>

        {isSpy ? (
          <button
            onClick={() => setShowSpyGuessModal(true)}
            className="p-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-950/50 active:scale-98"
          >
            <Target className="w-4 h-4" />
            <span>🎯 Adivinar Ubicación Secreta</span>
          </button>
        ) : (
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 text-xs flex items-center justify-center gap-1.5 font-mono">
            <span>🛡️ Mantén tu cobertura y detecta inconsistencias.</span>
          </div>
        )}
      </div>

      {/* Cuadrícula de Ubicaciones */}
      <LocationsGrid allLocations={room.allLocations || []} />

      {/* Modales */}
      <VotingModal
        isOpen={showAccusationModal}
        onClose={() => setShowAccusationModal(false)}
        room={room}
        myPlayer={myPlayer}
      />

      {isSpy && (
        <SpyGuessModal
          isOpen={showSpyGuessModal}
          onClose={() => setShowSpyGuessModal(false)}
          room={room}
          allLocations={room.allLocations || []}
        />
      )}
    </div>
  );
}
