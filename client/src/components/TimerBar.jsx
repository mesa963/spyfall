import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, Infinity } from 'lucide-react';
import { socket } from '../services/socket';
import { sound } from '../services/sound';

export default function TimerBar({ round, roomCode, state }) {
  const isUnlimited = round?.isUnlimited || round?.durationSeconds === 0 || !round?.endTime;

  const [remainingSeconds, setRemainingSeconds] = useState(() => {
    if (!round?.endTime) return 0;
    return Math.max(0, Math.floor((round.endTime - Date.now()) / 1000));
  });

  const [elapsedSeconds, setElapsedSeconds] = useState(() => {
    if (!round?.startTime) return 0;
    return Math.max(0, Math.floor((Date.now() - round.startTime) / 1000));
  });

  useEffect(() => {
    if (state !== 'playing' && state !== 'accusation') return;

    if (isUnlimited) {
      // Cronómetro ascendente para tiempo indefinido
      const interval = setInterval(() => {
        if (state === 'playing') {
          const elapsed = Math.max(0, Math.floor((Date.now() - (round?.startTime || Date.now())) / 1000));
          setElapsedSeconds(elapsed);
        }
      }, 1000);
      return () => clearInterval(interval);
    } else {
      // Cuenta regresiva estándar
      if (!round?.endTime) return;
      const interval = setInterval(() => {
        if (state === 'playing') {
          const remaining = Math.max(0, Math.floor((round.endTime - Date.now()) / 1000));
          setRemainingSeconds(remaining);

          // Sonido de cuenta regresiva en los últimos 10 segundos
          if (remaining <= 10 && remaining > 0) {
            sound.playTick();
          }

          if (remaining <= 0) {
            clearInterval(interval);
            socket.emit('time-expired', { roomCode });
          }
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [round?.endTime, round?.startTime, state, roomCode, isUnlimited]);

  if (isUnlimited) {
    const elapsedMin = Math.floor(elapsedSeconds / 60);
    const elapsedSec = elapsedSeconds % 60;
    const formattedElapsed = `${String(elapsedMin).padStart(2, '0')}:${String(elapsedSec).padStart(2, '0')}`;

    return (
      <div className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl p-3 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono uppercase text-slate-300 flex items-center gap-1.5">
              <span>Tiempo de Juego</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold border border-emerald-500/30 flex items-center gap-1">
                <Infinity className="w-3 h-3" /> Indefinido
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">Transcurrido:</span>
            <span className="font-mono text-lg font-black tracking-widest text-emerald-400">
              {formattedElapsed}
            </span>
          </div>
        </div>

        {/* Barra estética para modo libre */}
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full w-full opacity-60 animate-pulse" />
        </div>
      </div>
    );
  }

  // Modo cuenta regresiva limitada
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isLowTime = remainingSeconds <= 60;
  const totalSeconds = round?.durationSeconds || 480;
  const progressPercent = Math.min(100, Math.max(0, (remainingSeconds / totalSeconds) * 100));

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Clock className={`w-4 h-4 ${isLowTime ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`} />
          <span className="text-xs font-mono uppercase text-slate-400">
            Tiempo de Interrogatorio
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isLowTime && (
            <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider animate-pulse flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> ¡Último minuto!
            </span>
          )}
          <span
            className={`font-mono text-lg font-black tracking-widest ${
              isLowTime ? 'text-rose-500 animate-pulse' : 'text-white'
            }`}
          >
            {formattedTime}
          </span>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 rounded-full ${
            isLowTime ? 'bg-rose-500' : 'bg-cyan-500'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
