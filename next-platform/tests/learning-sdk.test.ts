import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import { webcrypto } from "node:crypto";
import { setImmediate } from "node:timers/promises";
import { it, expect } from "vitest";

it("SDK announces all queued changes, snapshots state, and advances only on the bound parent's acknowledgement", async () => {
  const sent: { message: any; origin: string }[] = [];
  let receive: (event: any) => void;
  const parent = {
    postMessage: (message: any, origin: string) =>
      sent.push({ message, origin }),
  };
  const window: any = {
    parent,
    addEventListener: (_: string, listener: typeof receive) => {
      receive = listener;
    },
  };
  runInNewContext(await readFile("sdk/dijital-atolye.js", "utf8"), {
    window,
    crypto: webcrypto,
    setTimeout: () => 0,
    setInterval: () => 0,
    clearTimeout() {},
    clearInterval() {},
  });
  const { app, nonce } = sent[0].message;
  const origin = "https://platform.example";
  const respond = (data: any, source = parent, from = origin) =>
    receive({
      source,
      origin: from,
      data: { app, nonce, sessionId: "session", ...data },
    });
  respond({ type: "init", persistent: true, state: { round: 2 }, revision: 4 });
  expect(await window.DijitalAtolye.ready()).toMatchObject({
    state: { round: 2 },
  });
  const mutable = { round: 3 };
  const first = window.DijitalAtolye.save({ state: mutable, progress: 30 });
  mutable.round = 4;
  const second = window.DijitalAtolye.complete({ state: mutable, score: 75 });
  mutable.round = 99;
  await setImmediate();
  const pending = sent.filter((s) => s.message.type === "pending");
  expect(pending).toHaveLength(2);
  expect(sent.filter((s) => s.message.type === "save")).toHaveLength(1);
  const save1 = sent.find((s) => s.message.type === "save")!;
  expect(save1).toMatchObject({
    origin,
    message: { state: { round: 3 }, revision: 4 },
  });
  expect(pending[0].message.requestId).toBe(save1.message.requestId);
  respond(
    { type: "ack", requestId: save1.message.requestId, revision: 5 },
    {} as typeof parent,
  );
  respond(
    { type: "ack", requestId: save1.message.requestId, revision: 5 },
    parent,
    "https://other.example",
  );
  await setImmediate();
  expect(sent.filter((s) => s.message.type === "save")).toHaveLength(1);
  respond({ type: "ack", requestId: save1.message.requestId, revision: 5 });
  expect(await first).toEqual({ saved: true, revision: 5 });
  await setImmediate();
  const save2 = sent.filter((s) => s.message.type === "save")[1];
  expect(save2).toMatchObject({
    origin,
    message: { state: { round: 4 }, revision: 5, complete: true },
  });
  expect(pending[1].message.requestId).toBe(save2.message.requestId);
  respond({ type: "ack", requestId: save2.message.requestId, revision: 6 });
  expect(await second).toEqual({ saved: true, revision: 6 });
});
