'use client';

import { useEffect, useState } from 'react';
import { getUser } from '@/lib/api';

export default function NotificationBanner() {
  const [visible, setVisible]   = useState(false);
  const [mounted, setMounted]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return;

    // Si ya tienen permiso, registrar silenciosamente y no mostrar el banner
    if (Notification.permission === 'granted') {
      import('@/lib/push').then(({ sincronizarPushSilencioso }) => sincronizarPushSilencioso()).catch(() => {});
      return;
    }

    // Si ya denegaron, no molestar
    if (Notification.permission === 'denied') return;

    const user = getUser();
    if (!user) return;

    const dismissKey = `quinela:push-dismissed:${user.cedula || user.id}`;
    if (localStorage.getItem(dismissKey)) return;

    setMounted(true);
    const timer = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const guardarDismiss = () => {
    const user = getUser();
    if (user) {
      const dismissKey = `quinela:push-dismissed:${user.cedula || user.id}`;
      localStorage.setItem(dismissKey, '1');
    }
  };

  const cerrar = () => {
    setVisible(false);
    guardarDismiss();
    setTimeout(() => setMounted(false), 400);
  };

  const handleActivar = async () => {
    setLoading(true);
    setError('');

    // Timeout de seguridad — si tarda más de 10 segundos, mostrar error
    const timeout = setTimeout(() => {
      setLoading(false);
      setError('La operación tardó demasiado. Intenta recargar la página.');
    }, 10000);

    try {
      const { inicializarPush } = await import('@/lib/push');
      await inicializarPush();

      clearTimeout(timeout);
      setSuccess(true);
      setLoading(false);
      guardarDismiss();

      // Cerrar el banner automáticamente tras 2 segundos de éxito
      setTimeout(cerrar, 2000);
    } catch (err: any) {
      clearTimeout(timeout);
      setLoading(false);
      const msg = err?.message || 'No se pudieron activar las notificaciones.';
      setError(msg);

      // Si denegó permisos, cerrar el banner definitivamente
      if (msg.includes('denegado') || msg.includes('denied')) {
        setTimeout(cerrar, 3000);
      }
    }
  };

  if (!mounted) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '84px',
        left: '50%',
        transform: `translateX(-50%) translateY(${visible ? '0' : '140px'})`,
        transition: 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        zIndex: 100,
        width: 'calc(100% - 24px)',
        maxWidth: '440px',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(15,23,42,0.97) 0%, rgba(30,27,75,0.97) 100%)',
          border: `1px solid ${success ? 'rgba(34,197,94,0.4)' : error ? 'rgba(239,68,68,0.35)' : 'rgba(56,189,248,0.25)'}`,
          borderRadius: '20px',
          padding: '18px 20px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.45), 0 0 0 1px rgba(56,189,248,0.08)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Estado: éxito */}
        {success ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '13px', flexShrink: 0,
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
            }}>✓</div>
            <div>
              <p style={{ margin: 0, color: '#86efac', fontWeight: 700, fontSize: '15px' }}>
                ¡Notificaciones activadas!
              </p>
              <p style={{ margin: 0, color: '#64748b', fontSize: '13px', marginTop: '3px' }}>
                Te avisaremos de cada resultado en tiempo real.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '16px' }}>
              <div style={{
                width: '46px', height: '46px', borderRadius: '13px', flexShrink: 0,
                background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
              }}>
                🔔
              </div>
              <div>
                <p style={{ margin: 0, color: '#f1f5f9', fontWeight: 700, fontSize: '15px', lineHeight: '1.3', marginBottom: '4px' }}>
                  Activa las notificaciones
                </p>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px', lineHeight: '1.5' }}>
                  Recibe el resultado de cada partido al instante, aunque la app esté cerrada.
                </p>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: '10px',
                padding: '10px 12px',
                marginBottom: '14px',
              }}>
                <p style={{ margin: 0, color: '#fca5a5', fontSize: '12px', lineHeight: '1.5' }}>
                  ⚠️ {error}
                </p>
              </div>
            )}

            {/* Botones */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={cerrar}
                disabled={loading}
                style={{
                  flex: 1, padding: '11px 12px', borderRadius: '11px',
                  border: '1px solid rgba(148,163,184,0.15)', background: 'transparent',
                  color: '#64748b', fontSize: '13px', fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.5 : 1,
                }}
              >
                Ahora no
              </button>

              <button
                onClick={handleActivar}
                disabled={loading}
                style={{
                  flex: 2, padding: '11px 12px', borderRadius: '11px', border: 'none',
                  background: loading
                    ? 'rgba(56,189,248,0.25)'
                    : 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)',
                  color: loading ? '#94a3b8' : '#fff',
                  fontSize: '13px', fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  transition: 'all 0.2s',
                }}
              >
                {loading ? (
                  <>
                    <SpinIcon />
                    Activando...
                  </>
                ) : (
                  error ? '🔄 Reintentar' : 'Activar notificaciones'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SpinIcon() {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      style={{ animation: 'spin 0.8s linear infinite', display: 'inline-block' }}
    >
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
