import React, { useState } from 'react';
import { Search, RotateCcw, MapPin, Check } from 'lucide-react';

export default function LocationsGrid({ allLocations = [] }) {
  const [crossedOut, setCrossedOut] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const toggleCrossOut = (id) => {
    setCrossedOut(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleResetCrossed = () => {
    setCrossedOut(new Set());
  };

  const filteredLocations = allLocations.filter(loc =>
    loc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800 mb-4">
        <div>
          <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-cyan-400" />
            <span>Posibles Ubicaciones ({allLocations.length})</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Toca una ubicación para tacharla como descarte personal mientras escuchas las preguntas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {crossedOut.size > 0 && (
            <button
              onClick={handleResetCrossed}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-colors active:scale-95"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Desmarcar ({crossedOut.size})</span>
            </button>
          )}

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar lugar..."
              className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-36 sm:w-44 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Cuadrícula de tarjetas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
        {filteredLocations.map((loc) => {
          const isCrossed = crossedOut.has(loc.id);
          return (
            <button
              key={loc.id}
              onClick={() => toggleCrossOut(loc.id)}
              className={`p-2.5 rounded-xl border text-left transition-all duration-150 flex items-center gap-2.5 relative select-none ${
                isCrossed
                  ? 'strikethrough-location bg-slate-950/60 border-slate-800/60'
                  : 'bg-slate-800/70 border-slate-700/70 hover:border-slate-500 hover:bg-slate-800 active:scale-97'
              }`}
            >
              <span className="text-xl shrink-0">{loc.emoji}</span>
              <span className="text-xs font-medium text-slate-200 line-clamp-1 leading-snug">
                {loc.name}
              </span>
              {isCrossed && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-rose-500 font-bold text-xs">
                  ✕
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
