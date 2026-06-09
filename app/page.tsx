'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, setToken, setUser } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [modo, setModo] = useState<'login' | 'registro'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Campos
  const [cedula, setCedula] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let resultado;
      if (modo === 'login') {
        resultado = await authApi.login(cedula, password);
      } else {
        if (!nombre.trim()) { setError('El nombre es requerido'); setLoading(false); return; }
        resultado = await authApi.register({ cedula, nombre, telefono: telefono || undefined, password });
      }

      setToken(resultado.token);
      setUser(resultado.usuario);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-6 animate-fade-in">
      {/* Logo area */}
      <div className="mb-10 text-center">
        <div className="flex justify-center mb-4">
          <img
            src="/icons/icon_Balon icon .svg"
            alt="Balón"
            className="w-20 h-20 animate-float"
          />
        </div>
        <h1 className="text-3xl font-extrabold text-gradient tracking-tight">Quiniela GGTIC</h1>
        <p className="text-slate-500 text-sm mt-1.5 font-medium tracking-widest uppercase">Mundial FIFA 2026</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm glass-strong glass-glow p-6 animate-fade-in-delay-1">
        {/* Toggle Login / Registro */}
        <div className="flex glass p-1 mb-6" style={{ borderRadius: '0.75rem' }}>
          {(['login', 'registro'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setModo(m); setError(''); }}
              className={`flex-1 py-2.5 rounded-[0.6rem] text-sm font-semibold transition-all duration-300 ${modo === m
                ? 'btn-primary !p-0 !py-2.5 shadow-lg'
                : 'text-slate-400 hover:text-white'
                }`}
            >
              {m === 'login' ? 'Iniciar Sesión' : 'Registrarse'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cédula */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-semibold uppercase tracking-wider">
              Cédula de Identidad
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Ej: 12345678"
              value={cedula}
              onChange={(e) => setCedula(e.target.value.replace(/\D/g, ''))}
              required
              maxLength={15}
              className="input-glass text-lg tracking-widest font-semibold"
            />
          </div>

          {/* Nombre (solo registro) */}
          {modo === 'registro' && (
            <div className="animate-fade-in">
              <label className="block text-xs text-slate-400 mb-1.5 font-semibold uppercase tracking-wider">
                Nombre Completo
              </label>
              <input
                type="text"
                placeholder="Juan Pérez"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                className="input-glass"
              />
            </div>
          )}

          {/* Teléfono (solo registro, opcional) */}
          {modo === 'registro' && (
            <div className="animate-fade-in-delay-1">
              <label className="block text-xs text-slate-400 mb-1.5 font-semibold uppercase tracking-wider">
                Teléfono <span className="text-slate-600">(opcional)</span>
              </label>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="0414-1234567"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="input-glass"
              />
            </div>
          )}

          {/* Contraseña */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-semibold uppercase tracking-wider">
              Contraseña
            </label>
            <input
              type="password"
              placeholder={modo === 'registro' ? 'Mínimo 6 caracteres' : '••••••••'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="input-glass"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="glass p-3 animate-fade-in" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.08)' }}>
              <p className="text-red-400 text-sm font-medium">⚠️ {error}</p>
            </div>
          )}

          {/* Botón */}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary text-base py-3.5 mt-2"
          >
            {loading ? '⏳ Procesando...' : modo === 'login' ? 'Entrar' : 'Crear Cuenta'}
          </button>
        </form>

        {/* Info */}
        <p className="text-center text-xs text-slate-600 mt-5">
          {modo === 'login'
            ? '¿Olvidaste tu clave? Contacta al administrador.'
            : 'Solo un registro por persona (cédula única).'}
        </p>
      </div>

    </div>
  );
}
