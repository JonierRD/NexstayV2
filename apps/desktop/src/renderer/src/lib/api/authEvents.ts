export type AuthEventName = 'unauthorized' | 'forbidden';

export type AuthEventDetail = {
  reason: string;
  status: number;
  path?: string;
};

export type AuthEventCallback = (detail: AuthEventDetail) => void;

class AuthEventBus {
  private listeners: Record<AuthEventName, Set<AuthEventCallback>> = {
    unauthorized: new Set(),
    forbidden: new Set()
  };

  on(event: AuthEventName, callback: AuthEventCallback): () => void {
    this.listeners[event].add(callback);

    return () => {
      this.listeners[event].delete(callback);
    };
  }

  emit(event: AuthEventName, detail: AuthEventDetail): void {
    for (const callback of this.listeners[event]) {
      callback(detail);
    }
  }
}

export const authEvents = new AuthEventBus();