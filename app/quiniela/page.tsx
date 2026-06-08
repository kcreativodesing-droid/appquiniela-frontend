'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { partidosApi, prediccionesApi, getToken, type Partido, type Prediccion } from '@/lib/api';
import { getFlagUrl } from '@/lib/flags';

function PartidoRow({
  partido,
  prediccion,
  onSave,
  index,
}: {
  partido: Partido;
  prediccion?: Prediccion;
  onSave: (partidoId: string, gl: number, gv: number) => Promise<void>;
  index: number;
}) {
  const [gl, setGl] = useState(prediccion?.predGolesLocal?.toString() ?? '');
  const [gv, setGv] = useState(prediccion?.predGolesVisitante?.toString() ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const abierto = partido.estado === 'Pendiente';
  const deadline = new Date(partido.fechaHora).getTime() - 5 * 60 * 1000;
  const puedeEditar = abierto && Date.now() < deadline;

  const handleSave = async () => {
    if (!puedeEditar || gl === '' || gv === '') return;
    setSaving(true);
    try {
      await onSave(partido.id, parseInt(gl), parseInt(gv));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={`glass p-4 stagger-item ${puedeEditar ? 'glass-glow' : ''}`}
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      {/* Header del partido */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`badge ${
            partido.estado === 'Finalizado' ? 'badge-done' :
            partido.estado === 'En Juego' ? 'badge-live' : 'badge-pending'
          }`}>
            {partido.estado === 'Finalizado' ? '✅ Final' :
             partido.estado === 'En Juego' ? '🔴 En Vivo' : '🕐 Pendiente'}
          </span>
          {partido.grupo && (
            <span className="text-[10px] text-slate-600 font-semibold">Gr. {partido.grupo}</span>
          )}
        </div>
        <span className="text-xs text-slate-500 font-medium">
          {new Date(partido.fechaHora).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
          {' · '}
          {new Date(partido.fechaHora).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Equipos e inputs */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center justify-end gap-2 overflow-hidden">
          <span className="text-sm font-bold text-white truncate text-right">
            {partido.equipoLocal}
          </span>
          <img
            src={getFlagUrl(partido.equipoLocal)}
            alt={partido.equipoLocal}
            className="w-5 h-3.5 object-cover rounded-sm border border-white/10 shrink-0"
          />
        </div>

        {puedeEditar ? (
          <div className="flex items-center gap-2 shrink-0">
            <input
              type="number"
              inputMode="numeric"
              min="0" max="20"
              value={gl}
              onChange={(e) => setGl(e.target.value)}
              className="input-score"
              placeholder="?"
            />
            <span className="text-slate-600 font-extrabold text-xs">—</span>
            <input
              type="number"
              inputMode="numeric"
              min="0" max="20"
              value={gv}
              onChange={(e) => setGv(e.target.value)}
              className="input-score"
              placeholder="?"
            />
          </div>
        ) : partido.estado === 'Finalizado' ? (
          <div className="shrink-0 px-3 py-1.5 glass text-center" style={{ borderRadius: '0.75rem' }}>
            <span className="text-lg font-extrabold text-gradient">
              {partido.golesLocal ?? '-'} - {partido.golesVisitante ?? '-'}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 shrink-0 opacity-40">
            <div className="input-score flex items-center justify-center">
              <span className="text-slate-500">{prediccion?.predGolesLocal ?? '?'}</span>
            </div>
            <span className="text-slate-700">—</span>
            <div className="input-score flex items-center justify-center">
              <span className="text-slate-500">{prediccion?.predGolesVisitante ?? '?'}</span>
            </div>
          </div>
        )}

        <div className="flex-1 flex items-center gap-2 overflow-hidden">
          <img
            src={getFlagUrl(partido.equipoVisitante)}
            alt={partido.equipoVisitante}
            className="w-5 h-3.5 object-cover rounded-sm border border-white/10 shrink-0"
          />
          <span className="text-sm font-bold text-white truncate">
            {partido.equipoVisitante}
          </span>
        </div>
      </div>

      {/* Fila inferior */}
      <div className="flex items-center justify-between mt-3">
        {/* Puntos ganados */}
        {partido.estado === 'Finalizado' && prediccion && (
          <span className={`badge ${
            prediccion.puntosObtenidos === 3 ? 'badge-pending' :
            prediccion.puntosObtenidos === 1 ? 'badge-done' :
            'badge-live'
          }`}>
            {prediccion.puntosObtenidos === 3 ? '🎯 +3 pts Exacto' :
             prediccion.puntosObtenidos === 1 ? '✅ +1 pt Parcial' :
             prediccion.puntosObtenidos === 0 ? '❌ 0 pts' :
             '⏳ Sin calcular'}
          </span>
        )}
        {!prediccion && partido.estado === 'Finalizado' && (
          <span className="text-xs text-slate-600 font-medium">Sin predicción</span>
        )}
        <div className="flex-1" />

        {/* Botón guardar */}
        {puedeEditar && (
          <button
            onClick={handleSave}
            disabled={saving || gl === '' || gv === ''}
            className={`text-xs font-bold px-4 py-2 rounded-lg transition-all duration-200 active:scale-95 ${
              saved
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                : saving
                ? 'glass text-slate-400'
                : 'btn-primary !text-xs !px-4 !py-2'
            }`}
          >
            {saved ? '✓ Guardado' : saving ? '...' : 'Guardar'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function QuinielaPage() {
  const router = useRouter();
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [predicciones, setPredicciones] = useState<Map<string, Prediccion>>(new Map());
  const [loading, setLoading] = useState(true);
  const [filtroFase, setFiltroFase] = useState<string>('Jornada 1');
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      const [todosPartidos, misPredicciones] = await Promise.all([
        partidosApi.listar({ fase: filtroFase }),
        prediccionesApi.mis(),
      ]);
      setPartidos(todosPartidos);
      const map = new Map(misPredicciones.map((p) => [p.partidoId, p]));
      setPredicciones(map);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  }, [filtroFase]);

  useEffect(() => {
    if (!getToken()) { router.push('/'); return; }
    cargar();
  }, [cargar, router]);

  const handleGuardar = async (partidoId: string, gl: number, gv: number) => {
    const pred = await prediccionesApi.guardar(partidoId, gl, gv);
    setPredicciones((prev) => new Map(prev).set(partidoId, pred));
  };

  const fases = ['Jornada 1', 'Jornada 2', 'Jornada 3'];

  const pendientes = partidos.filter((p) => p.estado === 'Pendiente').length;
  const conPrediccion = partidos.filter((p) => predicciones.has(p.id)).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="text-center">
          <div className="text-5xl animate-float mb-4">🎯</div>
          <p className="text-slate-500 text-sm font-medium">Cargando partidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 animate-fade-in">
      {/* Header */}
      <div className="pt-6 mb-5">
        <h1 className="text-xl font-bold text-white">Mi Quiniela <span className="text-gradient">🎯</span></h1>
        <p className="text-slate-500 text-sm mt-1 font-medium">
          {conPrediccion}/{partidos.length} predicciones · {pendientes} pendientes
        </p>
      </div>

      {/* Filtro de fases */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide animate-fade-in-delay-1">
        {fases.map((fase) => (
          <button
            key={fase}
            onClick={() => setFiltroFase(fase)}
            className={`tab-pill ${filtroFase === fase ? 'tab-pill-active' : ''}`}
          >
            {fase}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="glass p-3 mb-4 animate-fade-in" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.08)' }}>
          <p className="text-red-400 text-sm font-medium">⚠️ {error}</p>
        </div>
      )}

      {/* Lista de partidos */}
      <div className="space-y-3">
        {partidos.length === 0 ? (
          <div className="text-center py-16 text-slate-500 animate-fade-in">
            <p className="text-4xl mb-3">📭</p>
            <p className="font-medium">No hay partidos en esta fase</p>
          </div>
        ) : (
          partidos.map((partido, i) => (
            <PartidoRow
              key={partido.id}
              partido={partido}
              prediccion={predicciones.get(partido.id)}
              onSave={handleGuardar}
              index={i}
            />
          ))
        )}
      </div>

      <div className="h-6" />
    </div>
  );
}
