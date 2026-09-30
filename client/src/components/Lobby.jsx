import React, { useState, useEffect } from 'react';
import { Shield, Users, ArrowRight, Sparkles } from 'lucide-react';
import { socket } from '../services/socket';

const AVATARS = [
  '🕵️‍♂️', '🕵️‍♀️', '🕵️', '🎩', '🕶️', '💼', '🔍', '📱',
  '👠', '🦊', '🦉', '🐱', '🐺', '🦅', '🎯', '⚡'
];

export default function Lobby({ onRoomJoined, initialCode = '' }) {
  const [tab, setTab] = useState(initialCode ? 'join' : 'create');
  const [name, setName] = useState(localStorage.getItem('spyfall_player_name') || '');
  const [selectedAvatar, setSelectedAvatar] = useState(
    localStorage.getItem('spyfall_player_avatar') || AVATARS[0]
  );
  const [roomCode, setRoomCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialCode) {
      setRoomCode(initialCode.toUpperCase());
      setTab('join');
    }
  }, [initialCode]);

  const handleAvatarSelect = (avatar) => {
    setSelectedAvatar(avatar);
    localStorage.setItem('spyfall_player_avatar', avatar);
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    localStorage.setItem('spyfall_player_name', val);
  };

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor escribe tu nombre de agente.');
      return;
    }
    setError('');
    setLoading(true);
    socket.emit('create-room', {
      playerName: name.trim(),
      avatar: selectedAvatar
    });
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor escribe tu nombre de agente.');
      return;
    }
    if (!roomCode.trim()) {
      setError('Por favor ingresa el código de la sala.');
      return;
    }
    setError('');
    setLoading(true);
    socket.emit('join-room', {
      roomCode: roomCode.trim().toUpperCase(),
      playerName: name.trim(),
      avatar: selectedAvatar
    });
  };

  return (
    <div className="max-w-md mx-auto my-6 px-4 animate-fadeIn">
      {/* Tarjeta de bienvenida */}
      <div className="dossier-card rounded-2xl p-6 relative overflow-hidden border border-slate-700/80">
        <div className="absolute top-3 right-3 opacity-30 select-none">
          <span className="stamp-top-secret text-xs">CONFIDENCIAL</span>
        </div>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 shadow-lg shadow-rose-900/40 text-3xl mb-3">
            🕵️
          </div>
          <h2 className="text-2xl font-black text-white tracking-wide">
            CENTRO DE OPERACIONES
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Identifícate antes de ingresar a la misión
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Selección de avatar y nombre */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
              Nombre de Agente / Alias
            </label>
            <input
              type="text"
              maxLength={16}
              value={name}
              onChange={handleNameChange}
              placeholder="Ej: Agente 007, Mateo..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-sm font-medium transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Avatar Encubierto</span>
              <span className="text-[11px] text-slate-400">Elige tu icono</span>
            </label>
            <div className="grid grid-cols-8 gap-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              {AVATARS.map((av) => (
                <button
                  key={av}
                  type="button"
                  onClick={() => handleAvatarSelect(av)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-transform active:scale-90 ${
                    selectedAvatar === av
                      ? 'bg-rose-600/30 border-2 border-rose-500 scale-110 shadow-md'
                      : 'hover:bg-slate-800 border border-transparent'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Pestañas Crear / Unirse */}
        <div className="flex border-b border-slate-700 mb-5">
          <button
            type="button"
            onClick={() => setTab('create')}
            className={`flex-1 pb-2.5 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 border-b-2 ${
              tab === 'create'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Crear Sala
          </button>
          <button
            type="button"
            onClick={() => setTab('join')}
            className={`flex-1 pb-2.5 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 border-b-2 ${
              tab === 'join'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Unirse a Sala
          </button>
        </div>

        {/* Formulario Crear Sala */}
        {tab === 'create' && (
          <form onSubmit={handleCreateRoom} className="space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              Crea una sala nueva para tus amigos. Al crearla obtendrás un enlace y código para invitarlos al instante.
            </p>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-sm tracking-wide transition-all shadow-lg shadow-rose-900/30 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98"
            >
              <span>{loading ? 'Creando misión...' : 'Crear Nueva Sala'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Formulario Unirse */}
        {tab === 'join' && (
          <form onSubmit={handleJoinRoom} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                Código de la Sala (5 letras)
              </label>
              <input
                type="text"
                maxLength={6}
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="EJ: 9XK4P"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 text-center tracking-widest font-mono text-base font-bold uppercase transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm tracking-wide transition-all shadow-lg shadow-cyan-900/30 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98"
            >
              <span>{loading ? 'Ingresando...' : 'Unirse a la Misión'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
