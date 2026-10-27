/* Dijital Oyun Atölyesi checkpoint SDK v1. Bundle this file with your game. */
(function () {
  const app = "dijitalatolye:v1";
  const nonce = crypto.randomUUID();
  let parentOrigin,
    sessionId,
    revision = 0,
    persistent = false,
    settled = false,
    fatal;
  let resolveReady;
  const initialized = new Promise((resolve) => {
    resolveReady = resolve;
  });
  const pending = new Map();
  let queue = Promise.resolve();
  function hello() {
    if (window.parent !== window)
      window.parent.postMessage({ app, type: "ready", nonce }, "*");
  }
  const timer = setInterval(hello, 250);
  const timeout = setTimeout(() => {
    if (!settled) {
      settled = true;
      clearInterval(timer);
      resolveReady(null);
    }
  }, 3000);
  window.addEventListener("message", (event) => {
    const m = event.data;
    if (event.source !== window.parent || m?.app !== app || m.nonce !== nonce)
      return;
    if (m.type === "init" && !settled) {
      settled = true;
      clearInterval(timer);
      clearTimeout(timeout);
      parentOrigin = event.origin;
      sessionId = m.sessionId;
      revision = m.revision;
      persistent = m.persistent === true;
      resolveReady(
        persistent
          ? {
              state: m.state,
              progress: m.progress,
              score: m.score,
              completed: m.completed,
            }
          : null,
      );
    } else if (
      m.type === "ack" &&
      event.origin === parentOrigin &&
      m.sessionId === sessionId
    ) {
      const task = pending.get(m.requestId);
      if (!task) return;
      pending.delete(m.requestId);
      if (m.error) {
        fatal = new Error(m.error);
        task.reject(fatal);
      } else {
        revision = m.revision;
        task.resolve({ saved: true, revision });
      }
    }
  });
  function send(value, complete) {
    // Snapshot now: the game may mutate its state before this queued save is sent.
    const snapshot = JSON.parse(JSON.stringify(value));
    const requestId = crypto.randomUUID();
    // Announce queued changes immediately, so an earlier acknowledgement cannot
    // make the player claim the current game state is already durable.
    initialized.then(() => {
      if (persistent && !fatal)
        window.parent.postMessage(
          { app, type: "pending", nonce, sessionId, requestId },
          parentOrigin,
        );
    });
    const operation = queue.then(async () => {
      await initialized;
      if (fatal) throw fatal;
      if (!persistent) return { saved: false };
      return new Promise((resolve, reject) => {
        pending.set(requestId, { resolve, reject });
        window.parent.postMessage(
          {
            app,
            type: "save",
            nonce,
            sessionId,
            requestId,
            revision,
            state: snapshot.state,
            progress: snapshot.progress,
            score: snapshot.score,
            complete,
          },
          parentOrigin,
        );
      });
    });
    queue = operation.catch(() => {});
    return operation;
  }
  window.DijitalAtolye = Object.freeze({
    ready: () => initialized,
    save: (value) => send(value, false),
    complete: (value) => send(value, true),
  });
  hello();
})();
