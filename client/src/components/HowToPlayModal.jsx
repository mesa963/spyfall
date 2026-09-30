import React from 'react';
import { X, HelpCircle, Eye, MessageSquare, AlertTriangle, Trophy } from 'lucide-react';

export default function HowToPlayModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 max-w-lg w-full rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">¿Cómo se juega a Spyfall?</h2>
            <p className="text-xs text-slate-400">El Espía Oculto - Manual de Campo</p>
          </div>
        </div>

        <div className="space-y-4 text-sm text-slate-300">
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 shrink-0 mt-0.5">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white mb-1">1. Asignación Secreta de Roles</h3>
              <p className="text-xs leading-relaxed text-slate-300">
                Al comenzar, todos los jugadores reciben la <strong>misma ubicación secreta</strong> (ej. <em>Submarino</em> o <em>Playa</em>) y su rol específico, <strong>excepto uno al azar que es el Espía</strong>. El Espía no sabe dónde están.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white mb-1">2. El Interrogatorio</h3>
              <p className="text-xs leading-relaxed text-slate-300">
                El sistema elige quién hace la primera pregunta a cualquier compañero. Haz preguntas sutiles (ej: <em>"¿Trajiste abrigo hoy?"</em> o <em>"¿Qué olor sientes aquí?"</em>). El interrogado responde y luego pregunta a otro jugador distinto.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white mb-1">3. Sospecha y Acusación</h3>
              <p className="text-xs leading-relaxed text-slate-300">
                Cualquier jugador puede pulsar <strong>"Acusar"</strong> para señalar a quien crea que es el espía. Si todos los demás votan unánimemente que sí, se revela la verdad.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white mb-1">4. ¿Cómo se Gana?</h3>
              <ul className="text-xs space-y-1.5 list-disc list-inside text-slate-300 mt-1">
                <li><strong className="text-emerald-400">Los Agentes ganan:</strong> si descubren al espía por votación o si el espía adivina mal el lugar.</li>
                <li><strong className="text-rose-400">El Espía gana:</strong> si en cualquier momento pulsa <em>"Adivinar Ubicación"</em> y acierta cuál es, o si sobrevive sin ser acusado al agotarse el tiempo.</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-rose-900/30"
          >
            ¡Entendido, Agente!
          </button>
        </div>
      </div>
    </div>
  );
}
