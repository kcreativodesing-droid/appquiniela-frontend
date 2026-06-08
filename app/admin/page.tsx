'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, getUser, type Partido } from '@/lib/api';
import { getFlagUrl } from '@/lib/flags';

export default function AdminPage() {
  const router = useRouter();
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Estados locales para los inputs de goles por partido
  const [resultados, setResultados] = useState<Record<string, { local: string; visitante: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [filtroFase, setFiltroFase] = useState<string>('Jornada 1');

  useEffect(() => {
    const user = getUser();
    if (!user || user.rol !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
    setIsAdmin(true);
    cargarPartidos();
  }, [router]);

  useEffect(() => {
    if (isAdmin) cargarPartidos();
  }, [filtroFase]);

  const cargarPartidos = async () => {
    try {
      const data = await apiFetch<Partido[]>(`/api/partidos?fase=${encodeURIComponent(filtroFase)}`);
      setPartidos(data);
      // Inicializar el estado de los inputs
      const initResultados: Record<string, { local: string; visitante: string }> = {};
      data.forEach((p: Partido) => {
        initResultados[p.id] = {
          local: p.golesLocal?.toString() ?? '',
          visitante: p.golesVisitante?.toString() ?? '',
        };
      });
      setResultados(initResultados);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (id: string, field: 'local' | 'visitante', val: string) => {
    if (!/^\d*$/.test(val)) return; // Solo números
    setResultados(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: val }
    }));
  };

  const handleFinalizar = async (partidoId: string) => {
    const res = resultados[partidoId];
    if (res.local === '' || res.visitante === '') {
      alert('Debes ingresar ambos goles para finalizar el partido');
      return;
    }

    if (!confirm('¿Estás seguro de finalizar este partido? Esto calculará los puntos de todos los usuarios.')) {
      return;
    }

    setSavingId(partidoId);
    try {
      await apiFetch(`/api/admin/partidos/${partidoId}`, {
        method: 'PUT',
        body: JSON.stringify({
          golesLocal: parseInt(res.local),
          golesVisitante: parseInt(res.visitante),
          estado: 'Finalizado'
        })
      });
      alert('✅ Partido finalizado y puntos calculados');
      cargarPartidos();
    } catch (error: any) {
      alert(error.message || 'Error al actualizar');
    } finally {
      setSavingId(null);
    }
  };

  const fases = ['Jornada 1', 'Jornada 2', 'Jornada 3'];

  if (!isAdmin || loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="text-center">
          <div className="text-5xl animate-float mb-4">⚙️</div>
          <p className="text-slate-500 text-sm font-medium">Cargando panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 animate-fade-in">
      <div className="pt-6 mb-4">
        <h1 className="text-xl font-bold text-white">Panel de Administración <span className="text-gradient">⚙️</span></h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">
          Ingresa resultados y calcula los puntos de todos los participantes.
        </p>
      </div>

      {/* Filtro */}
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

      <div className="space-y-3">
        {partidos.map((partido, index) => {
          const res = resultados[partido.id] || { local: '', visitante: '' };
          const isFinalizado = partido.estado === 'Finalizado';
          const isSaving = savingId === partido.id;

          return (
            <div
              key={partido.id}
              className={`p-4 stagger-item ${isFinalizado ? 'glass' : 'glass glass-glow'}`}
              style={{
                animationDelay: `${index * 0.04}s`,
                ...(isFinalizado ? { borderColor: 'rgba(52, 211, 153, 0.15)', background: 'rgba(52, 211, 153, 0.04)' } : {})
              }}
            >
              <div className="flex justify-between items-center text-xs mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-semibold">Gr. {partido.grupo}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-500 font-medium">{partido.fase}</span>
                </div>
                <span className={`badge ${isFinalizado ? 'badge-done' : 'badge-pending'}`}>
                  {isFinalizado ? '✓ FINAL' : 'PENDIENTE'}
                </span>
              </div>

              <div className="flex items-center justify-between mb-4">
                {/* Local */}
                <div className="flex flex-col items-center flex-1 overflow-hidden">
                  <img
                    src={getFlagUrl(partido.equipoLocal)}
                    alt={partido.equipoLocal}
                    className="w-8 h-5.5 object-cover rounded border border-white/10 mb-1.5 shrink-0"
                  />
                  <span className="font-bold text-white text-xs truncate max-w-full text-center">
                    {partido.equipoLocal}
                  </span>
                </div>

                {/* Inputs de Goles */}
                <div className="flex items-center gap-2 px-3">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={res.local}
                    onChange={(e) => handleChange(partido.id, 'local', e.target.value)}
                    disabled={isFinalizado || isSaving}
                    className="input-score"
                  />
                  <span className="text-slate-600 font-extrabold text-xs">—</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={res.visitante}
                    onChange={(e) => handleChange(partido.id, 'visitante', e.target.value)}
                    disabled={isFinalizado || isSaving}
                    className="input-score"
                  />
                </div>

                {/* Visitante */}
                <div className="flex flex-col items-center flex-1 overflow-hidden">
                  <img
                    src={getFlagUrl(partido.equipoVisitante)}
                    alt={partido.equipoVisitante}
                    className="w-8 h-5.5 object-cover rounded border border-white/10 mb-1.5 shrink-0"
                  />
                  <span className="font-bold text-white text-xs truncate max-w-full text-center">
                    {partido.equipoVisitante}
                  </span>
                </div>
              </div>

              {!isFinalizado && (
                <button
                  onClick={() => handleFinalizar(partido.id)}
                  disabled={isSaving}
                  className="w-full py-2.5 text-sm font-bold rounded-xl transition-all duration-200 active:scale-97 flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.8), rgba(220, 38, 38, 0.9))',
                    boxShadow: '0 4px 20px -4px rgba(239, 68, 68, 0.3)',
                    opacity: isSaving ? 0.5 : 1,
                  }}
                >
                  {isSaving ? '⏳ Procesando...' : '⚙️ Finalizar y Calcular Puntos'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
