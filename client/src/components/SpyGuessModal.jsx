import React, { useState } from 'react';
import { Target, X, AlertTriangle } from 'lucide-react';
import { socket } from '../services/socket';
import { sound } from '../services/sound';

export default function SpyGuessModal({ isOpen, onClose, room, allLocations = [] }) {
  const [selectedLocId, setSelectedLocId] = useState('');

  if (!isOpen) return null;

  const handleConfirmGuess = () => {
    if (!selectedLocId) return;
    sound.playAlert();
    socket.emit('spy-guess-location', {
      roomCode: room.code,
      locationId: selectedLocId
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-amber-500/60 max-w-lg w-full rounded-2xl p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">El Espía Adivina la Ubicación</h3>
            <p className="text-xs text-amber-400 font-mono">¡Todo o nada!</p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs mb-4 shrink-0 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            Al pulsar confirmar revelarás tu identidad de espía. Si aciertas el lugar ganas la partida. Si te equivocas, ¡ganan los agentes!
          </p>
        </div>

        {/* Lista seleccionable con scroll */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-2 mb-4">
          {allLocations.map((loc) => (
            <button
              key={loc.id}
              onClick={() => setSelectedLocId(loc.id)}
              className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                selectedLocId === loc.id
                  ? 'bg-amber-500/20 border-amber-500 text-white shadow-md'
                  : 'bg-slate-800/80 border-slate-700/80 hover:bg-slate-800 text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{loc.emoji}</span>
                <span className="text-xs font-semibold">{loc.name}</span>
              </div>
              {selectedLocId === loc.id && (
                <span className="text-amber-400 font-mono text-[11px] font-bold">
                  ✓ Seleccionado
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex gap-2 shrink-0 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
          >
            Volver a Pensar
          </button>
          <button
            onClick={handleConfirmGuess}
            disabled={!selectedLocId}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-900/40 disabled:opacity-40"
          >
            Confirmar Adivinanza
          </button>
        </div>
      </div>
    </div>
  );
}
