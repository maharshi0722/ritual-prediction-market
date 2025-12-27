// lib/sseStore.js
export const sseStore = globalThis.__SSE_STORE__ || {
  clients: new Set(),
};

if (!globalThis.__SSE_STORE__) {
  globalThis.__SSE_STORE__ = sseStore;
}
