'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { leaderboardApi, getToken, getUser, type LeaderboardEntry } from '@/lib/api';

const MEDALLAS = ['🥇', '🥈', '🥉'];

function LeaderboardRow({
  entry,
  esMiUsuario,
  index,
}: {
  entry: LeaderboardEntry;
  esMiUsuario: boolean;
  index: number;
}) {
  return (
    <div
      className={`flex items-center gap-3 p-3.5 stagger-item transition-all duration-200 ${
        esMiUsuario
          ? 'glass-accent glass-glow-accent'
          : 'glass'
      }`}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Posición */}
      <div className="w-8 text-center shrink-0">
        {entry.posicion <= 3 ? (
          <span className="text-xl">{MEDALLAS[entry.posicion - 1]}</span>
        ) : (
          <span className="text-slate-500 font-bold text-sm">{entry.posicion}</span>
        )}
      </div>

      {/* Avatar inicial */}
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
          esMiUsuario
            ? 'text-white'
            : 'bg-slate-800 border border-slate-700/50 text-slate-300'
        }`}
        style={esMiUsuario ? { background: 'linear-gradient(135deg, #38bdf8, #818cf8)' } : {}}
      >
        {entry.nombre.charAt(0).toUpperCase()}
      </div>

      {/* Nombre */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className={`font-semibold truncate text-sm ${esMiUsuario ? 'text-sky-300' : 'text-white'}`}>
            {entry.nombre}
          </p>
          {esMiUsuario && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
              style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#7dd3fc' }}>
              Tú
            </span>
          )}
        </div>
        <div className="flex items-center gap-2.5 mt-0.5">
          <span className="text-[10px] text-slate-500 font-medium">🎯{entry.exactos}</span>
          <span className="text-[10px] text-slate-500 font-medium">✅{entry.parciales}</span>
          <span className="text-[10px] text-slate-500 font-medium">❌{entry.fallos}</span>
        </div>
      </div>

      {/* Puntos */}
      <div className="text-right shrink-0">
        <p className={`text-lg font-extrabold ${esMiUsuario ? 'text-gradient' : 'text-white'}`}>
          {entry.puntosTotales}
        </p>
        <p className="text-[10px] text-slate-500 font-semibold">PTS</p>
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [miPosicion, setMiPosicion] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const user = getUser();

  const cargar = useCallback(async () => {
    try {
      const data = await leaderboardApi.ranking();
      setLeaderboard(data.leaderboard);
      setMiPosicion(data.miPosicion);
    } catch {
      /* no-op */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!getToken()) { router.push('/'); return; }
    cargar();
  }, [cargar, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="text-center">
          <div className="text-5xl animate-float mb-4">🏆</div>
          <p className="text-slate-500 text-sm font-medium">Cargando ranking...</p>
        </div>
      </div>
    );
  }

  const top3 = leaderboard.slice(0, 3);

  return (
    <div className="p-4 animate-fade-in">
      {/* Header */}
      <div className="pt-6 mb-5">
        <h1 className="text-xl font-bold text-white">Tabla de Posiciones <span className="text-gradient-gold">🏆</span></h1>
        {miPosicion && (
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Tu posición: <span className="text-sky-400 font-bold">#{miPosicion}</span>
            {' de '}
            {leaderboard.length} participantes
          </p>
        )}
      </div>

      {/* Podio top 3 */}
      {top3.length >= 2 && (
        <div className="flex items-end justify-center gap-3 mb-6 pt-2 animate-fade-in-delay-1">
          {/* 2do lugar */}
          {top3[1] && (
            <div className="flex-1 text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-1.5 glass" style={{ borderColor: 'rgba(148, 163, 184, 0.2)' }}>
                {top3[1].nombre.charAt(0)}
              </div>
              <p className="text-xs text-slate-300 truncate font-semibold">{top3[1].nombre.split(' ')[0]}</p>
              <div className="mt-1.5 glass rounded-t-xl h-16 flex items-center justify-center" style={{ borderRadius: '0.75rem 0.75rem 0 0' }}>
                <div className="text-center">
                  <p className="text-xl">🥈</p>
                  <p className="text-sm font-extrabold text-white">{top3[1].puntosTotales}</p>
                </div>
              </div>
            </div>
          )}
          {/* 1er lugar */}
          {top3[0] && (
            <div className="flex-1 text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-1.5 animate-pulse-glow"
                style={{ background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.15))', border: '2px solid rgba(251, 191, 36, 0.3)' }}>
                {top3[0].nombre.charAt(0)}
              </div>
              <p className="text-xs text-gradient-gold truncate font-bold">{top3[0].nombre.split(' ')[0]}</p>
              <div className="mt-1.5 h-24 flex items-center justify-center" style={{
                background: 'linear-gradient(180deg, rgba(251, 191, 36, 0.08), rgba(251, 191, 36, 0.03))',
                border: '1px solid rgba(251, 191, 36, 0.15)',
                borderRadius: '0.75rem 0.75rem 0 0',
              }}>
                <div className="text-center">
                  <p className="text-2xl">🥇</p>
                  <p className="text-lg font-extrabold text-gradient-gold">{top3[0].puntosTotales}</p>
                </div>
              </div>
            </div>
          )}
          {/* 3er lugar */}
          {top3[2] && (
            <div className="flex-1 text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-1.5 glass" style={{ borderColor: 'rgba(148, 163, 184, 0.15)' }}>
                {top3[2].nombre.charAt(0)}
              </div>
              <p className="text-xs text-slate-300 truncate font-semibold">{top3[2].nombre.split(' ')[0]}</p>
              <div className="mt-1.5 glass h-12 flex items-center justify-center" style={{ borderRadius: '0.75rem 0.75rem 0 0' }}>
                <div className="text-center">
                  <p className="text-xl">🥉</p>
                  <p className="text-sm font-extrabold text-white">{top3[2].puntosTotales}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Glow separator */}
      <div className="glow-line mb-4 animate-fade-in-delay-2" />

      {/* Lista completa */}
      <div className="space-y-2.5 animate-fade-in-delay-2">
        {leaderboard.map((entry, i) => (
          <LeaderboardRow
            key={entry.id}
            entry={entry}
            esMiUsuario={entry.id === user?.id}
            index={i}
          />
        ))}

        {leaderboard.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <p className="text-4xl mb-3">🏆</p>
            <p className="font-medium">Aún no hay participantes con puntos</p>
          </div>
        )}
      </div>

      <div className="h-6" />
    </div>
  );
}
