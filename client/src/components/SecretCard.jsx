import React, { useState } from 'react';
import { Eye, EyeOff, ShieldAlert, MapPin, Briefcase, KeyRound } from 'lucide-react';
import { sound } from '../services/sound';

export default function SecretCard({ myPlayer, round, onOpenSpyGuess }) {
  const [revealed, setRevealed] = useState(false);

  const toggleReveal = () => {
    sound.playReveal();
    setRevealed(!revealed);
  };

  const isSpy = myPlayer?.isSpy;
  const location = round?.location;
  const role = myPlayer?.role;

  return (
    <div className="w-full">
      <div
        className={`dossier-card rounded-2xl p-5 border transition-all duration-300 relative overflow-hidden select-none ${
          revealed
            ? (isSpy ? 'border-rose-500/80 bg-rose-950/20 shadow-rose-950/50 shadow-2xl' : 'border-cyan-500/70 bg-slate-900/90 shadow-cyan-950/40 shadow-2xl')
            : 'border-slate-700 bg-slate-900/95 cursor-pointer hover:border-slate-500'
        }`}
        onClick={toggleReveal}
      >
        {/* Cabecera del expediente */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <KeyRound className={`w-4 h-4 ${revealed ? (isSpy ? 'text-rose-400' : 'text-cyan-400') : 'text-slate-400'}`} />
            <span className="text-[11px] font-mono tracking-widest uppercase text-slate-300">
              EXPEDIENTE CONFIDENCIAL
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">
              {revealed ? 'Toca para ocultar' : 'Toca para ver'}
            </span>
            <div className={`p-1.5 rounded-lg border ${revealed ? 'bg-slate-800 border-slate-700 text-white' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
              {revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </div>
          </div>
        </div>

        {/* Vista Oculta (Protección anti-miradas indiscretas) */}
        {!revealed ? (
          <div className="py-6 text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-3xl shadow-inner">
              🔒
            </div>
            <div className="mb-2">
              <span className="stamp-classified text-sm">ULTRA SECRETO</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              Tu Identidad Está Protegida
            </h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Presiona aquí para revelar tu ubicación y rol en privado. Asegúrate de que nadie mire tu pantalla.
            </p>
          </div>
        ) : (
          /* Vista Revelada */
          <div className="py-2 animate-fadeIn">
            {isSpy ? (
              /* Tarjeta de Espía */
              <div className="text-center">
                <div className="mb-2">
                  <span className="stamp-classified text-sm bg-rose-600 text-white border-white">
                    ¡ERES EL ESPÍA!
                  </span>
                </div>
                <div className="text-5xl my-3">🕵️‍♂️</div>
                <h3 className="text-xl font-black text-rose-400 tracking-wide mb-1">
                  NO SABES LA UBICACIÓN
                </h3>
                <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed mb-4">
                  Tu objetivo es disimular, escuchar atentamente las preguntas de los demás y deducir dónde están antes de que descubran quién eres.
                </p>

                {onOpenSpyGuess && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenSpyGuess();
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-rose-900/40 active:scale-95 flex items-center justify-center gap-2 mx-auto"
                  >
                    <span>🎯 Intentar Adivinar Ubicación</span>
                  </button>
                )}
              </div>
            ) : (
              /* Tarjeta de Agente Inocente */
              <div className="space-y-4">
                <div className="text-center mb-1">
                  <span className="stamp-top-secret text-xs">AGENTE DE INTELIGENCIA</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-3xl shrink-0 shadow-inner">
                    {location?.emoji || '📍'}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-mono uppercase tracking-wider">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Ubicación Secreta</span>
                    </div>
                    <div className="text-xl font-black text-white tracking-wide mt-0.5">
                      {location?.name || 'Cargando...'}
                    </div>
                  </div>
                </div>

                {role && (
                  <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-800 text-slate-300 shrink-0">
                      <Briefcase className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 uppercase font-mono block">
                        Tu Rol en este lugar
                      </span>
                      <span className="text-sm font-bold text-amber-300">
                        {role}
                      </span>
                    </div>
                  </div>
                )}

                <p className="text-[11px] text-slate-400 text-center italic">
                  💡 Haz preguntas inteligentes relacionadas con el lugar, pero sin ser tan obvio para que el espía no lo deduzca.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
