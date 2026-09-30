import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { socket } from '../services/socket';
import { sound } from '../services/sound';

export default function TimerBar({ round, roomCode, state }) {
  const [remainingSeconds, setRemainingSeconds] = useState(() => {
    if (!round?.endTime) return 0;
    return Math.max(0, Math.floor((round.endTime - Date.now()) / 1000));
  });

  useEffect(() => {
    if (!round?.endTime || state !== 'playing') return;

    const interval = setInterval(() => {
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
    }, 1000);

    return () => clearInterval(interval);
  }, [round?.endTime, state, roomCode]);

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
