import React, { useState } from 'react';
import { Users, Crown, Wifi, WifiOff, CheckCircle2, Clock, AlertTriangle, ChevronDown, ChevronUp, Skull } from 'lucide-react';

export default function PlayersStatusPanel({ players = [], myPlayer, isAccusationActive, accusation }) {
  const [collapsed, setCollapsed] = useState(false);

  const activeCount = players.filter(p => !p.isEliminated && p.connected).length;

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
      <div
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-cyan-400" />
          <h3 className="font-extrabold text-sm text-white">
            Estado de los Agentes ({players.length})
          </h3>
          <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
            {activeCount} activos en misión
          </span>
        </div>

        <button
          type="button"
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {!collapsed && (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1">
          {players.map((p) => {
            const isMe = p.id === myPlayer?.id || p.sessionId === myPlayer?.sessionId;
            const isEliminated = p.isEliminated;

            return (
              <div
                key={p.sessionId || p.id}
                className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                  isEliminated
                    ? 'bg-slate-950/80 border-slate-900 opacity-50'
                    : p.isAccused
                      ? 'bg-rose-950/40 border-rose-500 shadow-md shadow-rose-950/50 animate-pulse'
                      : !p.connected
                        ? 'bg-slate-950/70 border-dashed border-slate-800 opacity-60'
                        : isMe
                          ? 'bg-slate-800/90 border-cyan-500/40'
                          : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-lg shrink-0 relative">
                    {p.avatar}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-950 ${
                        isEliminated
                          ? 'bg-slate-600'
                          : p.connected
                            ? 'bg-emerald-500'
                            : 'bg-amber-500 animate-pulse'
                      }`}
                      title={isEliminated ? 'Eliminado' : (p.connected ? 'En línea' : 'Reconectando...')}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 leading-tight">
                      <span
                        className={`font-bold text-xs truncate max-w-[110px] ${
                          isEliminated ? 'line-through text-slate-500' : 'text-white'
                        }`}
                      >
                        {p.name}
                      </span>
                      {isMe && (
                        <span className="text-[9px] text-cyan-400 bg-cyan-500/10 px-1 py-0.2 rounded font-mono shrink-0">
                          TÚ
                        </span>
                      )}
                    </div>

                    {/* Estado dinámico */}
                    <div className="flex items-center gap-1 mt-0.5">
                      {isEliminated ? (
                        <span className="text-[10px] text-rose-400 font-bold flex items-center gap-1 font-mono">
                          <Skull className="w-2.5 h-2.5" /> Eliminado
                        </span>
                      ) : !p.connected ? (
                        <span className="text-[10px] text-amber-400 flex items-center gap-1 font-mono">
                          <WifiOff className="w-2.5 h-2.5" /> Reconectando
                        </span>
                      ) : p.isAccused ? (
                        <span className="text-[10px] text-rose-400 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" /> Acusado
                        </span>
                      ) : isAccusationActive ? (
                        isMe && accusation?.requiredVoters && !accusation.requiredVoters.includes(p.id) ? (
                          <span className="text-[10px] text-purple-400 flex items-center gap-1 font-mono">
                            🚫 Bloqueado
                          </span>
                        ) : p.hasVoted ? (
                          <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Voto listo
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                            <Clock className="w-2.5 h-2.5" /> Votando...
                          </span>
                        )
                      ) : p.isStarter ? (
                        <span className="text-[10px] text-cyan-400 font-medium">
                          🎙️ Inicia ronda
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                          <Wifi className="w-2.5 h-2.5" /> En línea
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 gap-0.5">
                  {p.isHost && (
                    <span title="Anfitrión" className="text-amber-400">
                      <Crown className="w-3 h-3" />
                    </span>
                  )}
                  {p.score > 0 && (
                    <span className="text-[10px] text-amber-400 font-mono font-bold">
                      {p.score}p
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
