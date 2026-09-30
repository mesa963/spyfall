import React from 'react';
import { Volume2, VolumeX, HelpCircle, Shield, Copy, Check, LogOut } from 'lucide-react';
import { sound } from '../services/sound';

export default function Navbar({ roomCode, onOpenHelp, onLeaveRoom }) {
  const [muted, setMuted] = React.useState(sound.isMuted());
  const [copied, setCopied] = React.useState(false);

  const toggleSound = () => {
    const isMuted = sound.toggleMute();
    setMuted(isMuted);
  };

  const copyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const confirmLeave = () => {
    if (window.confirm('¿Seguro que deseas salir de esta sala?')) {
      onLeaveRoom();
    }
  };

  return (
    <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-xl shadow-inner">
            🕵️
          </div>
          <div>
            <h1 className="font-extrabold text-lg sm:text-xl tracking-wider text-white flex items-center gap-1.5 leading-none">
              SPYFALL
              <span className="text-[10px] uppercase font-mono tracking-widest bg-rose-500/20 text-rose-400 border border-rose-500/30 px-1.5 py-0.5 rounded">
                ESPAÑOL
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-mono tracking-tight hidden sm:block">
              EL ESPÍA OCULTO // MULTIJUGADOR
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {roomCode && (
            <button
              onClick={copyCode}
              title="Copiar código de sala"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-600 text-xs font-mono text-slate-200 transition-all hover:bg-slate-750 active:scale-95"
            >
              <Shield className="w-3.5 h-3.5 text-rose-400" />
              <span>SALA: <strong className="text-white tracking-wider">{roomCode}</strong></span>
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            </button>
          )}

          <button
            onClick={onOpenHelp}
            title="¿Cómo se juega?"
            className="p-2 rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white transition-all active:scale-95 flex items-center gap-1 text-xs"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span className="hidden md:inline font-medium">Reglas</span>
          </button>

          <button
            onClick={toggleSound}
            title={muted ? 'Activar sonido' : 'Silenciar sonido'}
            className="p-2 rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white transition-all active:scale-95"
          >
            {muted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {onLeaveRoom && (
            <button
              onClick={confirmLeave}
              title="Salir de la sala"
              className="p-2 rounded-lg bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 transition-all active:scale-95 flex items-center gap-1 text-xs"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline font-mono">Salir</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
