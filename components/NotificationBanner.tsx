'use client';

import { useEffect, useState } from 'react';
import { getUser } from '@/lib/api';

/**
 * Banner de opt-in para notificaciones push — aparece una sola vez.
 * Sigue el mismo patrón que toqui.app: muestra el banner propio primero,
 * y solo solicita el permiso nativo del navegador cuando el usuario acepta.
 */
export default function NotificationBanner() {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(true); // empezar oculto

  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') return;

    // Verificar soporte
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      return;
    }

    // Si ya tienen permiso concedido o denegado, no mostrar el banner
    if (Notification.permission !== 'default') {
      // Si ya está concedido, registrar silenciosamente en segundo plano
      if (Notification.permission === 'granted') {
        import('@/lib/push').then(({ inicializarPush }) => inicializarPush()).catch(() => {});
      }
      return;
    }

    const user = getUser();
    if (!user) return;

    // Verificar si el usuario ya descartó el banner
    const dismissKey = `quinela:push-prompt-dismissed:${user.id || user.cedula}`;
    if (localStorage.getItem(dismissKey)) return;

    // Mostrar el banner después de 2 segundos (igual que toqui.app usa 1.5s)
    const timer = setTimeout(() => {
      setDismissed(false);
      setVisible(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleActivar = async () => {
    setLoading(true);
    try {
      const { inicializarPush } = await import('@/lib/push');
      await inicializarPush();
    } catch (err) {
      console.error('Error al activar notificaciones:', err);
    } finally {
      setLoading(false);
      cerrar();
    }
  };

  const cerrar = () => {
    setVisible(false);
    // Guardar que el usuario ya fue consultado para no volver a molestarle
    const user = getUser();
    if (user) {
      const dismissKey = `quinela:push-prompt-dismissed:${user.id || user.cedula}`;
      localStorage.setItem(dismissKey, '1');
    }
    setTimeout(() => setDismissed(true), 400); // esperar animación de salida
  };

  if (dismissed) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '80px', // encima del BottomNav
        left: '50%',
        transform: `translateX(-50%) translateY(${visible ? '0' : '120px'})`,
        transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
        opacity: visible ? 1 : 0,
        zIndex: 100,
        width: 'calc(100% - 32px)',
        maxWidth: '420px',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(15,23,42,0.97) 0%, rgba(30,27,75,0.97) 100%)',
          border: '1px solid rgba(56,189,248,0.25)',
          borderRadius: '20px',
          padding: '20px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(56,189,248,0.1)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Icono + texto */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '18px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontSize: '22px',
            }}
          >
            🔔
          </div>
          <div>
            <p
              style={{
                margin: 0,
                color: '#f0f6ff',
                fontWeight: 700,
                fontSize: '15px',
                lineHeight: '1.3',
                marginBottom: '4px',
              }}
            >
              Activa las notificaciones
            </p>
            <p
              style={{
                margin: 0,
                color: '#94a3b8',
                fontSize: '13px',
                lineHeight: '1.5',
              }}
            >
              Recibe el resultado de cada partido al instante, aunque tengas la app cerrada.
            </p>
          </div>
        </div>

        {/* Botones */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={cerrar}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '12px',
              border: '1px solid rgba(148,163,184,0.2)',
              background: 'transparent',
              color: '#64748b',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Ahora no
          </button>
          <button
            onClick={handleActivar}
            disabled={loading}
            style={{
              flex: 2,
              padding: '12px',
              borderRadius: '12px',
              border: 'none',
              background: loading
                ? 'rgba(56,189,248,0.3)'
                : 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {loading ? (
              <>
                <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
                Activando...
              </>
            ) : (
              <>Activar notificaciones</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
