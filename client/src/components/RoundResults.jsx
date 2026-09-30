import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, ShieldCheck, MapPin, Crown, AlertCircle } from 'lucide-react';
import { socket } from '../services/socket';
import { sound } from '../services/sound';

export default function RoundResults({ room, myPlayer }) {
  const result = room?.round?.result;
  const isHost = myPlayer?.isHost;

  useEffect(() => {
    sound.playVictory();
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // Confetti fallback
    }
  }, []);

  const handleNextRound = () => {
    socket.emit('restart-game', { roomCode: room.code });
  };

  const isSpyWinner = result?.winner === 'spies';

  return (
    <div className="max-w-xl mx-auto my-6 px-4 animate-fadeIn">
      <div className="dossier-card rounded-2xl p-6 border border-slate-700/80 text-center relative overflow-hidden">
        {/* Sello de resolución */}
        <div className="mb-4">
          <span className={isSpyWinner ? 'stamp-classified text-sm' : 'stamp-top-secret text-sm'}>
            CASO RESUELTO
          </span>
        </div>

        {/* Titular del Ganador */}
        <div className="mb-4">
          <div className="text-5xl mb-2">
            {isSpyWinner ? '🕵️‍♂️' : '🛡️'}
          </div>
          <h2 className={`text-2xl sm:text-3xl font-black tracking-wide ${isSpyWinner ? 'text-rose-400' : 'text-emerald-400'}`}>
            {isSpyWinner ? '¡VICTORIA DEL ESPÍA!' : '¡VICTORIA DE LOS AGENTES!'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-md mx-auto leading-relaxed">
            {result?.reason}
          </p>
        </div>

        {/* Revelación de Secretos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-6">
          {/* Ubicación secreta */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-left flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-2xl shrink-0">
              {result?.secretLocation?.emoji || '📍'}
            </div>
            <div>
              <span className="text-[10px] text-cyan-400 uppercase font-mono tracking-wider block">
                Ubicación Secreta
              </span>
              <strong className="text-white text-base">
                {result?.secretLocation?.name || 'Desconocida'}
              </strong>
            </div>
          </div>

          {/* El Espía */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-left flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-2xl shrink-0">
              {result?.spies?.[0]?.avatar || '🕵️'}
            </div>
            <div>
              <span className="text-[10px] text-rose-400 uppercase font-mono tracking-wider block">
                El Espía Infiltrado
              </span>
              <strong className="text-white text-base">
                {result?.spies?.map(s => s.name).join(', ') || 'Nadie'}
              </strong>
            </div>
          </div>
        </div>

        {/* Roles de todos los jugadores */}
        <div className="text-left mt-6 pt-5 border-t border-slate-800">
          <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
            <span>Identidades Reveladas</span>
            <span className="text-amber-400 font-bold">Puntos</span>
          </h4>

          <div className="space-y-2">
            {room.players.map((p) => (
              <div
                key={p.id}
                className={`p-2.5 rounded-xl border flex items-center justify-between ${
                  p.isSpy
                    ? 'bg-rose-950/20 border-rose-500/40'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{p.avatar}</span>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {p.name} {p.id === myPlayer?.id && '(Tú)'}
                    </span>
                    <span className={`text-[11px] ${p.isSpy ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
                      {p.isSpy ? '🕵️ Espía Secreto' : `${p.role} ${p.isEliminated ? '— ☠️ Eliminado' : '— 🛡️ Sobrevivió'}`}
                    </span>
                  </div>
                </div>

                <div className="font-mono text-sm font-bold text-amber-400 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                  {p.score} pts
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Botón Siguiente Ronda */}
        <div className="mt-8">
          {isHost ? (
            <button
              onClick={handleNextRound}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-extrabold text-sm uppercase tracking-wider transition-all shadow-xl shadow-rose-900/40 flex items-center justify-center gap-2 active:scale-98"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Siguiente Ronda</span>
            </button>
          ) : (
            <div className="text-center py-3 px-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-mono">
              Esperando a que el anfitrión prepare la siguiente ronda...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
