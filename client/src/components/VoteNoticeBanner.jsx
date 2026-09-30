import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, X, AlertCircle } from 'lucide-react';
import { sound } from '../services/sound';

export default function VoteNoticeBanner({ notice }) {
  const [dismissedTimestamp, setDismissedTimestamp] = useState(null);

  useEffect(() => {
    if (notice?.timestamp) {
      sound.playAlert();
    }
  }, [notice?.timestamp]);

  if (!notice || notice.timestamp === dismissedTimestamp) return null;

  const isEliminated = notice.eliminated;

  return (
    <div className="w-full animate-fadeIn my-2">
      <div
        className={`p-4 rounded-2xl border shadow-xl flex items-start justify-between gap-3 relative ${
          isEliminated
            ? 'bg-rose-950/90 border-rose-500 text-white shadow-rose-950/50'
            : 'bg-slate-900/95 border-cyan-500/60 text-slate-100 shadow-cyan-950/40'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 mt-0.5 border ${
              isEliminated
                ? 'bg-rose-600/30 border-rose-500 text-rose-300'
                : 'bg-cyan-600/20 border-cyan-500 text-cyan-300'
            }`}
          >
            {isEliminated ? (notice.wasSpy ? '🎯' : '☠️') : '🛡️'}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-[10px] font-mono uppercase font-black px-2 py-0.5 rounded tracking-wider border ${
                  isEliminated
                    ? 'bg-rose-600 text-white border-rose-400'
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                }`}
              >
                {isEliminated ? 'AGENTE ELIMINADO' : 'AGENTE SALVADO / NO ELIMINADO'}
              </span>
            </div>

            <p className="text-xs sm:text-sm font-semibold leading-relaxed">
              {notice.message}
            </p>

            {notice.totalRequired && (
              <p className="text-[11px] text-slate-300 font-mono mt-1 opacity-90">
                Detalle del veredicto: {notice.yesVotes} votos culpables vs {notice.noVotes || 0} votos inocentes (Unanimidad de {notice.totalRequired} requerida).
              </p>
            )}
          </div>
        </div>

        <button
          onClick={() => setDismissedTimestamp(notice.timestamp)}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
          title="Cerrar aviso"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
