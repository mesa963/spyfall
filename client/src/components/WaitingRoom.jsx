import React, { useState } from 'react';
import { Copy, Check, Share2, QrCode, Play, Crown, Clock, Users, X, AlertCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { socket } from '../services/socket';

export default function WaitingRoom({ room, myPlayer }) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const shareUrl = `${window.location.origin}/?room=${room.code}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `¡Únete a nuestra partida de Spyfall (El Espía Oculto)! 🕵️‍♂️\nCódigo de sala: ${room.code}\nEnlace directo: ${shareUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleDurationChange = (e) => {
    socket.emit('update-settings', {
      roomCode: room.code,
      settings: { ...room.settings, roundDuration: Number(e.target.value) }
    });
  };

  const handleSpyCountChange = (count) => {
    socket.emit('update-settings', {
      roomCode: room.code,
      settings: { ...room.settings, spyCount: count }
    });
  };

  const handleRolesToggle = () => {
    socket.emit('update-settings', {
      roomCode: room.code,
      settings: { ...room.settings, enableRoles: !room.settings.enableRoles }
    });
  };

  const handleStartGame = () => {
    socket.emit('start-game', { roomCode: room.code });
  };

  const isHost = myPlayer?.isHost;
  const canStart = room.players.length >= 3;

  return (
    <div className="max-w-2xl mx-auto my-6 px-4 animate-fadeIn">
      {/* Encabezado de la Sala */}
      <div className="dossier-card rounded-2xl p-6 border border-slate-700/80 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <span className="text-[11px] font-mono tracking-widest text-rose-400 uppercase bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
              Sala de Espera
            </span>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-3xl sm:text-4xl font-black font-mono tracking-widest text-white">
                {room.code}
              </span>
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all active:scale-95"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? '¡Copiado!' : 'Copiar enlace'}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={() => setShowQr(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <QrCode className="w-3.5 h-3.5 text-cyan-400" />
              <span>Código QR</span>
            </button>
          </div>
        </div>

        {/* Lista de Jugadores */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Agentes Conectados ({room.players.length})</span>
            </h3>
            {room.players.length < 3 && (
              <span className="text-[11px] text-amber-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Se necesitan mín. 3 jugadores
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {room.players.map((p) => (
              <div
                key={p.id}
                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  p.id === myPlayer?.id
                    ? 'bg-slate-800/90 border-rose-500/40 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xl">
                    {p.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-white">{p.name}</span>
                      {p.id === myPlayer?.id && (
                        <span className="text-[10px] text-rose-400 bg-rose-500/10 px-1.5 py-0.2 rounded font-mono">
                          TÚ
                        </span>
                      )}
                    </div>
                    {p.score > 0 && (
                      <span className="text-[11px] text-amber-400 font-mono">
                        Puntos: {p.score}
                      </span>
                    )}
                  </div>
                </div>

                {p.isHost && (
                  <span className="flex items-center gap-1 text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 font-medium">
                    <Crown className="w-3 h-3" /> Anfitrión
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Configuración de partida (Solo anfitrión puede editar) */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-rose-400" />
            <span>Configuración de la Misión</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Duración */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <label className="block text-[11px] text-slate-400 mb-1">Duración de la Ronda</label>
              {isHost ? (
                <select
                  value={room.settings.roundDuration}
                  onChange={handleDurationChange}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:border-rose-500"
                >
                  <option value={300}>5 minutos</option>
                  <option value={360}>6 minutos</option>
                  <option value={420}>7 minutos</option>
                  <option value={480}>8 minutos (Recomendado)</option>
                  <option value={600}>10 minutos</option>
                </select>
              ) : (
                <span className="text-xs font-bold text-white">
                  {Math.floor(room.settings.roundDuration / 60)} minutos
                </span>
              )}
            </div>

            {/* Cantidad de Espías */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <label className="block text-[11px] text-slate-400 mb-1">Número de Espías</label>
              {isHost ? (
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSpyCountChange(1)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      room.settings.spyCount === 1
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    1 Espía
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSpyCountChange(2)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      room.settings.spyCount === 2
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    2 Espías
                  </button>
                </div>
              ) : (
                <span className="text-xs font-bold text-white">
                  {room.settings.spyCount} {room.settings.spyCount === 1 ? 'Espía' : 'Espías'}
                </span>
              )}
            </div>

            {/* Roles Específicos */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <label className="block text-[11px] text-slate-400 mb-1">Roles Profesionales</label>
              {isHost ? (
                <button
                  type="button"
                  onClick={handleRolesToggle}
                  className={`w-full py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    room.settings.enableRoles
                      ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {room.settings.enableRoles ? 'Activados' : 'Desactivados'}
                </button>
              ) : (
                <span className="text-xs font-bold text-white">
                  {room.settings.enableRoles ? 'Activados' : 'Desactivados'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Botón de Iniciar */}
        <div className="mt-8">
          {isHost ? (
            <button
              onClick={handleStartGame}
              disabled={!canStart}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-extrabold text-base tracking-wide transition-all shadow-xl shadow-rose-900/40 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed active:scale-98"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>{canStart ? '¡Iniciar Misión!' : 'Esperando más agentes (mín. 3)'}</span>
            </button>
          ) : (
            <div className="text-center py-3 px-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-mono">
              Esperando a que el anfitrión inicie la partida...
            </div>
          )}
        </div>
      </div>

      {/* Modal de Código QR */}
      {showQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-xs w-full text-center relative shadow-2xl">
            <button
              onClick={() => setShowQr(false)}
              className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-white text-base mb-1">Escanear para Unirse</h3>
            <p className="text-xs text-slate-400 mb-4">Abre la cámara de tu celular</p>
            <div className="bg-white p-4 rounded-xl inline-block shadow-lg">
              <QRCodeSVG value={shareUrl} size={180} />
            </div>
            <p className="font-mono text-xs text-rose-400 mt-4 tracking-widest font-bold">
              SALA: {room.code}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
