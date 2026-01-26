// lib/sseStore.js
// Small in-process SSE client store that survives HMR in dev by living on globalThis.
// Exports named helpers: sseStore, addClient, removeClient, broadcast

const GLOBAL_KEY = "__RITUAL_SSE_STORE_v1";

if (!globalThis[GLOBAL_KEY]) {
  globalThis[GLOBAL_KEY] = {
    clients: new Map(), // clientId -> pushCallback(payloadString)
    addClient(id, cb) {
      this.clients.set(id, cb);
    },
    removeClient(id) {
      this.clients.delete(id);
    },
    broadcast(data) {
      const payload = `data: ${JSON.stringify(data)}\n\n`;
      for (const cb of this.clients.values()) {
        try {
          cb(payload);
        } catch (err) {
          // callback failures are non-fatal; they will be cleaned up on abort
          console.error("SSE client callback error:", err);
        }
      }
    },
    clientCount() {
      return this.clients.size;
    },
  };
}

const store = globalThis[GLOBAL_KEY];

// Named exports so Next/Turbopack can statically analyze imports
export const sseStore = store;
export function addClient(id, cb) {
  store.addClient(id, cb);
}
export function removeClient(id) {
  store.removeClient(id);
}
export function broadcast(data) {
  store.broadcast(data);
}
export function clientCount() {
  return store.clientCount();
}