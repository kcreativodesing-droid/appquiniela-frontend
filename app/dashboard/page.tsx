'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { partidosApi, getUser, getToken, removeToken, type Partido } from '@/lib/api';
import { getFlagUrl } from '@/lib/flags';

function useCountdown(targetDate: string) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calcular = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('¡En juego!'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (h > 24) {
        const d = Math.floor(h / 24);
        setTimeLeft(`${d}d ${h % 24}h ${m}m`);
      } else {
        setTimeLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
      }
    };
    calcular();
    const interval = setInterval(calcular, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

function PartidoCard({ partido, index }: { partido: Partido; index: number }) {
  const fecha = new Date(partido.fechaHora);

  return (
    <div
      className="glass glass-glow p-3.5 stagger-item"
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`badge ${
          partido.estado === 'Finalizado' ? 'badge-done' :
          partido.estado === 'En Juego' ? 'badge-live' : 'badge-pending'
        }`}>
          {partido.estado === 'Finalizado' ? '✅ Final' :
           partido.estado === 'En Juego' ? '🔴 En Vivo' : '🕐 Pendiente'}
        </span>
        <span className="text-xs text-slate-500 font-medium">
          {fecha.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex-1 flex items-center justify-end gap-2 overflow-hidden pr-3">
          <span className="text-sm font-semibold text-white truncate text-right">
            {partido.equipoLocal}
          </span>
          <img
            src={getFlagUrl(partido.equipoLocal)}
            alt={partido.equipoLocal}
            className="w-5 h-3.5 object-cover rounded-sm border border-white/10 shrink-0"
          />
        </div>
        {partido.estado === 'Finalizado' ? (
          <span className="text-lg font-extrabold text-gradient px-2 whitespace-nowrap">
            {partido.golesLocal} - {partido.golesVisitante}
          </span>
        ) : (
          <span className="text-slate-600 px-3 text-xs font-bold tracking-widest">VS</span>
        )}
        <div className="flex-1 flex items-center gap-2 overflow-hidden pl-3">
          <img
            src={getFlagUrl(partido.equipoVisitante)}
            alt={partido.equipoVisitante}
            className="w-5 h-3.5 object-cover rounded-sm border border-white/10 shrink-0"
          />
          <span className="text-sm font-semibold text-white truncate">
            {partido.equipoVisitante}
          </span>
        </div>
      </div>
    </div>
  );
}

function ProximoPartido({ partido, tienePrediccion }: { partido: Partido; tienePrediccion: boolean }) {
  const router = useRouter();
  const countdown = useCountdown(partido.fechaHora);

  return (
    <div className="glass-accent glass-glow-accent p-5 mb-6 animate-fade-in-delay-1 animate-pulse-glow">
      <p className="text-xs font-bold uppercase tracking-[0.2em] mb-4" style={{ color: '#7dd3fc' }}>
        ⚡ Próximo Partido
      </p>
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1 flex flex-col items-center">
          <p className="font-bold text-white text-sm leading-tight text-center">{partido.equipoLocal}</p>
          <img
            src={getFlagUrl(partido.equipoLocal)}
            alt={partido.equipoLocal}
            className="w-10 h-7 object-cover rounded border border-white/10 mt-2"
          />
        </div>
        <div className="px-4 text-center">
          <p className="text-slate-500 text-xs font-semibold tracking-widest">VS</p>
          <p className="text-sky-400 font-mono font-extrabold text-xl mt-1 animate-countdown">{countdown}</p>
        </div>
        <div className="flex-1 flex flex-col items-center">
          <p className="font-bold text-white text-sm leading-tight text-center">{partido.equipoVisitante}</p>
          <img
            src={getFlagUrl(partido.equipoVisitante)}
            alt={partido.equipoVisitante}
            className="w-10 h-7 object-cover rounded border border-white/10 mt-2"
          />
        </div>
      </div>
      <p className="text-xs text-slate-500 text-center mb-4 font-medium">
        {new Date(partido.fechaHora).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}
        {partido.fase && ` · ${partido.fase}`}
      </p>
      {!tienePrediccion ? (
        <button
          onClick={() => router.push('/quiniela')}
          className="w-full btn-primary text-sm py-3"
        >
          🎯 ¡Ingresa tu Predicción!
        </button>
      ) : (
        <div className="text-center text-sky-400 text-sm font-semibold py-2">
          ✅ Ya ingresaste tu predicción
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [proximo, setProximo] = useState<{ partido: Partido; tienePrediccion: boolean } | null>(null);
  const [partidosHoy, setPartidosHoy] = useState<Partido[]>([]);
  const [loading, setLoading] = useState(true);
  const user = getUser();

  const cargarDatos = useCallback(async () => {
    try {
      const [proxData, todos] = await Promise.all([
        partidosApi.proximo().catch(() => null),
        partidosApi.listar(),
      ]);

      setProximo(proxData);

      const hoy = new Date();
      const todayStr = hoy.toDateString();
      const hoyPartidos = todos.filter(
        (p) => new Date(p.fechaHora).toDateString() === todayStr
      );
      setPartidosHoy(hoyPartidos);
    } catch {
      /* no-op */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!getToken()) { router.push('/'); return; }
    cargarDatos();
  }, [cargarDatos, router]);

  const handleLogout = () => {
    removeToken();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="text-center">
          <div className="text-5xl animate-float mb-4">⚽</div>
          <p className="text-slate-500 text-sm font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pt-6">
        <div>
          <h1 className="text-xl font-bold text-white">¡Hola, {user?.nombre?.split(' ')[0]}! 👋</h1>
          <p className="text-slate-500 text-sm font-medium mt-0.5">Mundial FIFA 2026</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass px-3.5 py-2 text-center glass-glow">
            <p className="text-sky-400 font-extrabold text-lg leading-none">{user?.puntosTotales ?? 0}</p>
            <p className="text-slate-500 text-[10px] font-semibold mt-0.5">PTS</p>
          </div>
        </div>
      </div>

      {/* Próximo partido */}
      {proximo ? (
        <ProximoPartido partido={proximo.partido} tienePrediccion={proximo.tienePrediccion} />
      ) : (
        <div className="glass glass-glow p-6 text-center mb-6 animate-fade-in-delay-1">
          <p className="text-3xl mb-2">🏆</p>
          <p className="text-slate-300 font-semibold">No hay partidos próximos</p>
          <p className="text-slate-500 text-sm mt-1">Todos los partidos del día han concluido</p>
        </div>
      )}

      {/* Partidos de hoy */}
      {partidosHoy.length > 0 && (
        <div className="animate-fade-in-delay-2">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-3">
            Partidos de Hoy
          </h2>
          <div className="space-y-2.5">
            {partidosHoy.map((p, i) => (
              <PartidoCard key={p.id} partido={p} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Cerrar sesión */}
      <div className="mt-8 text-center animate-fade-in-delay-3">
        <button onClick={handleLogout} className="btn-ghost text-xs">
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
