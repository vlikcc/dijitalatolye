/* Four checkpoint-capable pilot mechanics; all durable UI state lives in state. */
(async function () {
  const game = JSON.parse(document.getElementById("game-data").textContent);
  const saved = await DijitalAtolye.ready();
  let state = saved?.state || {
    round: 0,
    tries: 0,
    correct: 0,
    solved: [],
    selected: null,
    picked: [],
    done: false,
    finished: false,
    feedback: "",
  };
  const intro = document.getElementById("intro"),
    play = document.getElementById("play"),
    finish = document.getElementById("finish");
  const controls = document.getElementById("controls"),
    feedback = document.getElementById("feedback"),
    next = document.getElementById("next");
  intro.hidden = true;
  const score = () =>
    state.tries ? Math.round((100 * state.correct) / state.tries) : 0;
  function persist(complete = false) {
    const value = {
      state,
      progress: state.finished
        ? 100
        : Math.floor((state.round / game.rounds.length) * 100),
      score: score(),
    };
    (complete
      ? DijitalAtolye.complete(value)
      : DijitalAtolye.save(value)
    ).catch((e) => {
      feedback.textContent = e.message;
      controls.querySelectorAll("button").forEach((b) => (b.disabled = true));
      next.disabled = true;
    });
  }
  function button(label, fn, cls = "answer") {
    const b = document.createElement("button");
    b.type = "button";
    b.className = cls;
    b.textContent = label;
    b.onclick = fn;
    return b;
  }
  function action(fn) {
    fn();
    render();
    persist(state.finished);
  }
  function judge(ok) {
    state.tries++;
    if (ok) state.correct++;
    state.feedback = ok ? "Doğru!" : "Bir daha deneyelim.";
    return ok;
  }
  function render() {
    play.hidden = state.finished;
    finish.hidden = !state.finished;
    const restart = document.getElementById("restart");
    restart.hidden = !!saved;
    if (state.finished) {
      document.getElementById("result").textContent =
        game.rounds.length + " etkinliği tamamladın. Puanın: " + score();
      return;
    }
    const r = game.rounds[state.round];
    controls.replaceChildren();
    controls.className = "controls " + r.type;
    document.getElementById("prompt").textContent = r.prompt;
    feedback.textContent = state.feedback;
    document.getElementById("progress-label").textContent =
      "Etkinlik " + (state.round + 1) + " / " + game.rounds.length;
    document.getElementById("progress").value = state.round;
    document.getElementById("hint").textContent =
      r.type === "match"
        ? "Önce soldan, sonra sağdan seç."
        : r.type === "order"
          ? "Parçaları sıraya yerleştir."
          : r.type === "sort"
            ? "Örneği seç, ardından grubuna dokun."
            : "Bir cevap seç.";
    next.hidden = !state.done;
    next.textContent =
      state.round === game.rounds.length - 1
        ? "Sonucu gör"
        : "Sonraki etkinlik";
    if (r.type === "choice")
      r.options.forEach((label) => {
        const b = button(label, () =>
          action(() => {
            state.selected = label;
            if (judge(label === r.answer)) state.done = true;
          }),
        );
        b.disabled = state.done;
        b.classList.toggle("selected", state.selected === label);
        controls.append(b);
      });
    else if (r.type === "match") {
      const left = document.createElement("div"),
        right = document.createElement("div");
      left.className = right.className = "match-column";
      controls.append(left, right);
      r.pairs.forEach((pair, i) => {
        const b = button(pair[0], () =>
          action(() => {
            state.selected = i;
          }),
        );
        b.disabled = state.solved.includes(i);
        b.setAttribute("aria-pressed", String(state.selected === i));
        b.classList.toggle("selected", state.selected === i);
        left.append(b);
      });
      [...r.pairs].reverse().forEach((pair) => {
        const i = r.pairs.findIndex((p) => p[1] === pair[1]);
        const b = button(pair[1], () =>
          action(() => {
            if (state.selected === null) {
              state.feedback = "Önce soldan bir sözcük seç.";
              return;
            }
            if (judge(r.pairs[state.selected][1] === pair[1])) {
              state.solved.push(state.selected);
              state.selected = null;
              state.done = state.solved.length === r.pairs.length;
            }
          }),
        );
        b.disabled = state.solved.includes(i);
        right.append(b);
      });
    } else if (r.type === "order") {
      const output = document.createElement("div");
      output.className = "ordered";
      controls.append(output);
      state.picked.forEach((item, i) =>
        output.append(
          button(
            i + 1 + ". " + item,
            () =>
              action(() => {
                state.picked.splice(i, 1);
              }),
            "sequence-item",
          ),
        ),
      );
      const available = document.createElement("div");
      available.className = "order-pool";
      controls.append(available);
      [...r.items].reverse().forEach((item) => {
        const b = button(item, () =>
          action(() => {
            state.picked.push(item);
          }),
        );
        b.disabled = state.picked.includes(item) || state.done;
        available.append(b);
      });
      const check = button(
        "Sıralamayı kontrol et",
        () =>
          action(() => {
            if (judge(state.picked.every((item, i) => item === r.items[i])))
              state.done = true;
          }),
        "check",
      );
      check.disabled = state.picked.length !== r.items.length || state.done;
      controls.append(check);
    } else {
      const items = document.createElement("div"),
        groups = document.createElement("div");
      items.className = "sort-pool";
      groups.className = "sort-groups";
      controls.append(items, groups);
      r.items.forEach((item, i) => {
        const b = button(item.label, () =>
          action(() => {
            state.selected = i;
          }),
        );
        b.disabled = state.solved.includes(i);
        b.classList.toggle("selected", state.selected === i);
        b.setAttribute("aria-pressed", String(state.selected === i));
        items.append(b);
      });
      r.groups.forEach((group) =>
        groups.append(
          button(
            group,
            () =>
              action(() => {
                if (state.selected === null) {
                  state.feedback = "Önce bir örnek seç.";
                  return;
                }
                if (judge(r.items[state.selected].group === group)) {
                  state.solved.push(state.selected);
                  state.selected = null;
                  state.done = state.solved.length === r.items.length;
                }
              }),
            "group",
          ),
        ),
      );
    }
    if (state.done) {
      feedback.textContent = r.explanation;
      controls.querySelectorAll("button").forEach((b) => (b.disabled = true));
    }
  }
  next.onclick = () =>
    action(() => {
      if (!state.done) return;
      state.round++;
      state.finished = state.round === game.rounds.length;
      state.done = false;
      state.solved = [];
      state.picked = [];
      state.selected = null;
      state.feedback = "";
    });
  document.getElementById("restart").onclick = () => location.reload();
  const viewport = document.getElementById("game-viewport"),
    content = document.getElementById("game-content");
  function fit() {
    const w = viewport.clientWidth,
      h = viewport.clientHeight;
    content.style.width = Math.max(320, Math.min(w, 1440)) + "px";
    const scale = Math.min(
      1,
      w / content.offsetWidth,
      h / content.offsetHeight,
    );
    content.style.transform = "scale(" + scale + ")";
  }
  new ResizeObserver(fit).observe(content);
  window.addEventListener("resize", fit);
  document.fonts.ready.then(fit);
  render();
  fit();
})();
