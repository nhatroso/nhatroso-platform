import { useEffect, useState, useRef } from 'react';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
// Derive WS URL from API_URL
const WS_BASE_URL = API_URL.replace('http', 'ws').replace('/api', '');

export const usePaymentSocket = (
  invoiceId: number | string | undefined,
  token: string | null | undefined,
  onSuccess: () => void,
) => {
  const [status, setStatus] = useState<
    'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR'
  >('DISCONNECTED');
  const ws = useRef<WebSocket | null>(null);
  const successCallback = useRef(onSuccess);

  // Update ref when onSuccess changes
  useEffect(() => {
    successCallback.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    if (!invoiceId || !token) return;

    const wsUrl = `${WS_BASE_URL}/api/v1/payments/ws?token=${token}`;
    console.log('[WebSocket] Connecting with token...');

    setStatus('CONNECTING');
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('[WebSocket] Connected');
      setStatus('CONNECTED');
    };

    ws.current.onmessage = (e) => {
      console.log('[WebSocket] Message:', e.data);
      try {
        const data = JSON.parse(e.data);
        if (data.status === 'SUCCESS') {
          successCallback.current();
        }
      } catch (err) {
        console.error('[WebSocket] Failed to parse message', err);
      }
    };

    ws.current.onerror = (e) => {
      // Logic: Only log as error if socket was supposed to stay open
      if (ws.current?.readyState === WebSocket.OPEN) {
        console.error('[WebSocket] Error:', e);
        setStatus('ERROR');
      }
    };

    ws.current.onclose = (e) => {
      console.log('[WebSocket] Closed:', e.code, e.reason);
      setStatus('DISCONNECTED');
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [invoiceId, token]);

  return { status };
};
