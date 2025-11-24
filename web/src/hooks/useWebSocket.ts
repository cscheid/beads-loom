/**
 * WebSocket hook for real-time updates
 */
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '@/stores/uiStore';
import type { WSMessage } from '@loom/shared';

const WS_URL =
  import.meta.env.VITE_WS_URL ||
  `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;

export function useWebSocket() {
  const queryClient = useQueryClient();
  const setWsConnected = useUIStore((state) => state.setWsConnected);
  const setHasPendingUpdate = useUIStore((state) => state.setHasPendingUpdate);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);

        switch (message.type) {
          case 'issues_updated':
          case 'issue_created':
          case 'issue_updated':
          case 'issue_deleted': {
            // Check if user has unsaved changes by reading current state
            const hasUnsavedChanges = useUIStore.getState().hasUnsavedChanges;

            if (hasUnsavedChanges) {
              // Set flag to show update notification instead of auto-refreshing
              setHasPendingUpdate(true);
            } else {
              // No unsaved changes - safe to invalidate and refetch
              queryClient.invalidateQueries({ queryKey: ['issues'] });
              queryClient.invalidateQueries({ queryKey: ['issue'] });
            }
            break;
          }

          default:
            console.log('Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setWsConnected(false);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setWsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [queryClient, setWsConnected]);

  return wsRef.current;
}
