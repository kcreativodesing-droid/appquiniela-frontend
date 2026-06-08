'use client';

import { useEffect, useRef, useState } from 'react';
import { getUser } from '@/lib/api';

export default function NotificationBanner() {
  const [visible, setVisible]   = useState(false);
  const [mounted, setMounted]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const retryRef                = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef               = useRef(true); // para cancelar reintentos si el componente se desmonta

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return;

    // Si ya dieron permiso → sincronizar silenciosamente, no mostrar banner
    if (Notification.permission === 'granted') {
      import('@/lib/push').then(({ sincronizarPushSilencioso }) => sincronizarPushSilencioso()).catch(() => {});
      return;
    }

    // Si denegaron → no molestar nunca más
    if (Notification.permission === 'denied') return;

    const user = getUser();
    if (!user) return;

    const dismissKey = `quinela:push-dismissed:${user.cedula || user.id}`;
    if (localStorage.getItem(dismissKey)) return;

    setMounted(true);
    const timer = setTimeout(() => setVisible(true), 2000);

    return () => {
      clearTimeout(timer);
      activeRef.current = false;
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, []);

  const guardarDismiss = () => {
    const user = getUser();
    if (user) {
      const key = `quinela:push-dismissed:${user.cedula || user.id}`;
      localStorage.setItem(key, '1');
    }
  };

  const cerrar = () => {
    setVisible(false);
    guardarDismiss();
    if (retryRef.current) clearTimeout(retryRef.current);
    setTimeout(() => setMounted(false), 400);
  };

  /**
   * Intenta activar push. Si falla, reintenta automáticamente cada 2 s
   * hasta que se logre o el usuario desmonte el componente.
   * Solo se detiene definitivamente si el permiso fue denegado.
   */
  const intentarActivar = async () => {
    if (!activeRef.current) return;
    setLoading(true);

    try {
      const { inicializarPush } = await import('@/lib/push');
      await inicializarPush();

      if (!activeRef.current) return;
      // ✅ Éxito
      setLoading(false);
      setSuccess(true);
      guardarDismiss();
      setTimeout(cerrar, 2000);
    } catch (err: any) {
      if (!activeRef.current) return;

      const msg: string = err?.message ?? '';

      // Si el usuario negó el permiso explícitamente → cerrar sin reintentar
      if (
        msg.toLowerCase().includes('denegado') ||
        msg.toLowerCase().includes('denied') ||
        Notification.permission === 'denied'
      ) {
        setLoading(false);
        cerrar();
        return;
      }

      // Para cualquier otro error → reintentar silenciosamente después de 2 s
      retryRef.current = setTimeout(() => {
        if (activeRef.current) intentarActivar();
      }, 2000);
    }
  };

  const handleActivar = () => {
    if (loading) return;
    intentarActivar();
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
          border: `1px solid ${success ? 'rgba(34,197,94,0.4)' : 'rgba(56,189,248,0.25)'}`,
          borderRadius: '20px',
          padding: '18px 20px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.45), 0 0 0 1px rgba(56,189,248,0.08)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {success ? (
          /* ── Estado: éxito ── */
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '13px', flexShrink: 0,
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px',
            }}>
              ✓
            </div>
            <div>
              <p style={{ margin: 0, color: '#86efac', fontWeight: 700, fontSize: '15px' }}>
                ¡Notificaciones activadas!
              </p>
              <p style={{ margin: 0, color: '#64748b', fontSize: '13px', marginTop: '3px' }}>
                Te avisaremos de cada resultado al instante.
              </p>
            </div>
          </div>
        ) : (
          /* ── Estado: normal / cargando ── */
          <>
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
                  {loading
                    ? 'Configurando… un momento por favor.'
                    : 'Recibe el resultado de cada partido al instante, aunque la app esté cerrada.'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={cerrar}
                disabled={loading}
                style={{
                  flex: 1, padding: '11px 12px', borderRadius: '11px',
                  border: '1px solid rgba(148,163,184,0.15)', background: 'transparent',
                  color: loading ? '#374151' : '#64748b', fontSize: '13px', fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
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
                    ? 'rgba(56,189,248,0.18)'
                    : 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)',
                  color: loading ? '#94a3b8' : '#fff',
                  fontSize: '13px', fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  transition: 'background 0.25s',
                }}
              >
                {loading ? <><SpinIcon /> Activando…</> : 'Activar notificaciones'}
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
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
