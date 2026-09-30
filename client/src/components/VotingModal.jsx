import React, { useState } from 'react';
import { AlertOctagon, CheckCircle2, XCircle, ShieldAlert, X, Users } from 'lucide-react';
import { socket } from '../services/socket';
import { sound } from '../services/sound';

export default function VotingModal({
  isOpen,
  onClose,
  room,
  myPlayer,
  onStartAccusation
}) {
  const accusation = room?.round?.accusation;
  const isAccusationActive = room?.state === 'accusation' && Boolean(accusation);

  const [selectedSuspectId, setSelectedSuspectId] = useState('');

  if (!isOpen && !isAccusationActive) return null;

  // Si no hay acusación en marcha, mostrar lista para seleccionar a quién acusar
  if (!isAccusationActive) {
    const candidatePlayers = room.players.filter(p => p.id !== myPlayer?.id);

    const handleConfirmAccusation = () => {
      if (!selectedSuspectId) return;
      sound.playAlert();
      socket.emit('start-accusation', {
        roomCode: room.code,
        suspectId: selectedSuspectId
      });
      onClose();
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
        <div className="bg-slate-900 border border-slate-700 max-w-md w-full rounded-2xl p-6 shadow-2xl relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Acusar a un Sospechoso</h3>
              <p className="text-xs text-slate-400">Se pausará el tiempo para una votación unánime</p>
            </div>
          </div>

          <p className="text-xs text-slate-300 mb-4 leading-relaxed">
            Elige al agente que crees que no conoce la ubicación y está fingiendo:
          </p>

          <div className="space-y-2 mb-6 max-h-60 overflow-y-auto pr-1">
            {candidatePlayers.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedSuspectId(p.id)}
                className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
                  selectedSuspectId === p.id
                    ? 'bg-rose-500/20 border-rose-500 text-white shadow-md'
                    : 'bg-slate-800/80 border-slate-700/80 hover:bg-slate-800 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{p.avatar}</span>
                  <span className="font-bold text-sm">{p.name}</span>
                </div>
                {selectedSuspectId === p.id && (
                  <span className="text-rose-400 font-mono text-xs font-bold uppercase">
                    Seleccionado
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmAccusation}
              disabled={!selectedSuspectId}
              className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-lg shadow-rose-900/30 disabled:opacity-40"
            >
              Iniciar Votación
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Si la acusación ya está activa (fase de votación en vivo)
  const isSuspect = accusation.suspectId === myPlayer?.id;
  const hasVoted = accusation.votes[myPlayer?.id] !== undefined;
  const isAccuser = accusation.accuserId === myPlayer?.id;
  const isHost = myPlayer?.isHost;

  const totalRequired = accusation.requiredVoters.length;
  const votesCount = Object.keys(accusation.votes).length;

  const handleVote = (voteBool) => {
    sound.playAlert();
    socket.emit('cast-vote', {
      roomCode: room.code,
      vote: voteBool
    });
  };

  const handleCancel = () => {
    socket.emit('cancel-accusation', { roomCode: room.code });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-rose-500/50 max-w-md w-full rounded-2xl p-6 shadow-2xl shadow-rose-950/50 text-center relative">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
          <ShieldAlert className="w-8 h-8 animate-pulse" />
        </div>

        <span className="stamp-classified text-xs mb-2">VOTACIÓN DE EMERGENCIA</span>

        <h3 className="text-xl font-black text-white mt-2">
          ¿{accusation.suspectName} es el Espía?
        </h3>

        <p className="text-xs text-slate-400 mt-1 mb-4">
          Acusación presentada por <strong className="text-slate-200">{accusation.accuserName}</strong>.
          Se requiere <span className="text-rose-400 font-bold">unanimidad</span> de todos los agentes.
        </p>

        {/* Progreso de la votación */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 mb-6">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="flex items-center gap-1.5 font-mono">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>Votos emitidos: {votesCount} / {totalRequired}</span>
            </span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-500 transition-all duration-300 rounded-full"
              style={{ width: `${(votesCount / totalRequired) * 100}%` }}
            />
          </div>
        </div>

        {/* Acciones de votación */}
        {isSuspect ? (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs leading-relaxed">
            🚨 Has sido formalmente acusado. Los demás agentes están deliberando y votando en este momento.
          </div>
        ) : hasVoted ? (
          <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono">
            ✓ Tu voto ha sido registrado. Esperando a los demás agentes...
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => handleVote(true)}
              className="py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-900/40 active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>¡Es el Espía!</span>
            </button>
            <button
              onClick={() => handleVote(false)}
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all border border-slate-700 active:scale-95"
            >
              <XCircle className="w-4 h-4" />
              <span>Es Inocente</span>
            </button>
          </div>
        )}

        {/* Retirar acusación */}
        {(isAccuser || isHost) && (
          <div className="mt-4 pt-4 border-t border-slate-800">
            <button
              onClick={handleCancel}
              className="text-xs text-slate-400 hover:text-slate-200 underline font-mono transition-colors"
            >
              Retirar acusación y reanudar tiempo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
