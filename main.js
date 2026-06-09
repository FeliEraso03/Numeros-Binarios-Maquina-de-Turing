const transitions = [
  { from: "q0", read: "#", write: "0", move: "_", to: "q1" },
  { from: "q1", read: "0", write: "1", move: "_", to: "q2" },
  { from: "q2", read: "1", write: "0", move: "I", to: "q3" },
  { from: "q3", read: "1", write: "0", move: "I", to: "q3" },
  { from: "q3", read: "0", write: "1", move: "_", to: "q4" },
  { from: "q3", read: "#", write: "1", move: "_", to: "q4" },
  { from: "q2", read: "0", write: "1", move: "_", to: "q4" },
  { from: "q4", read: "0", write: "0", move: "D", to: "q4" },
  { from: "q4", read: "1", write: "1", move: "D", to: "q4" },
  { from: "q4", read: "#", write: "#", move: "I", to: "q2" },
];
const edgeMap = {
  "q0->q1": { edge: "edge-q0-q1", label: "elabel-q0-q1" },
  "q1->q2": { edge: "edge-q1-q2", label: "elabel-q1-q2" },
  "q2->q3": { edge: "edge-q2-q3", label: "elabel-q2-q3" },
  "q2->q4": { edge: "edge-q2-q4", label: "elabel-q2-q4" },
  "q3->q4": { edge: "edge-q3-q4", label: "elabel-q3-q4" },
  "q4->q2": { edge: "edge-q4-q2", label: "elabel-q4-q2" },
  "q3->q3": { edge: "edge-q3-q3", label: "elabel-q3-q3" },
  "q4->q4": { edge: "edge-q4-q4", label: "elabel-q4-q4" },
};
let tape = ["#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#"],
  headIndex = 8,
  currentState = "q0",
  stepCount = 0,
  runInterval = null,
  historyState = [];

function initApp() {
  const tbody = document.getElementById("table-body");
  transitions.forEach((t, i) => {
    const r = document.createElement("tr");
    r.id = `tr-${i}`;
    r.innerHTML = `<td>${t.from}</td><td>${t.read}</td><td>${t.write}</td><td>${t.move}</td><td>${t.to}</td>`;
    tbody.appendChild(r);
  });

  document.getElementById("btn-step").addEventListener("click", executeStep);
  document.getElementById("btn-step-back").addEventListener("click", stepBack);
  document.getElementById("btn-play").addEventListener("click", play);
  document.getElementById("btn-pause").addEventListener("click", pause);
  document.getElementById("btn-reset").addEventListener("click", reset);
  document.getElementById("speed").addEventListener("input", () => {
    if (runInterval) {
      pause();
      play();
    }
  });
  renderTape();
}

function clearHL() {
  document
    .querySelectorAll(".node-circle")
    .forEach((n) => {
      n.classList.remove("active");
      n.classList.remove("print-active");
    });
  document.querySelectorAll(".edge-line").forEach((e) => {
    e.classList.remove("active");
    e.setAttribute("marker-end", "url(#arr)");
  });
  document
    .querySelectorAll(".edge-label")
    .forEach((l) => l.classList.remove("active"));
  document
    .querySelectorAll("#table-body tr")
    .forEach((r) => r.classList.remove("active"));
}

function renderTape() {
  let minIdx = headIndex;
  let maxIdx = headIndex;
  for (let i = 0; i < tape.length; i++) {
    if (tape[i] !== "#") {
      if (i < minIdx) minIdx = i;
      if (i > maxIdx) maxIdx = i;
    }
  }
  
  let newTape = tape.slice(minIdx, maxIdx + 1);
  let newHead = headIndex - minIdx;
  
  if (newTape[0] !== "#") {
    newTape.unshift("#");
    newHead++;
  }
  if (newTape[newTape.length - 1] !== "#") {
    newTape.push("#");
  }
  
  tape = newTape;
  headIndex = newHead;

  const w = document.getElementById("tape-wrapper");
  w.innerHTML = "";
  tape.forEach((v, i) => {
    const c = document.createElement("div");
    c.className = "cell" + (i === headIndex ? " active" : "");
    c.textContent = v;
    w.appendChild(c);
    if (i === headIndex)
      requestAnimationFrame(() =>
        c.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        }),
      );
  });
  document.getElementById("lbl-state").textContent = currentState;
  document.getElementById("lbl-steps").textContent = stepCount;
  const an = document.getElementById("node-" + currentState);
  if (an) {
    if (currentState === "q2") {
      an.classList.add("print-active");
    } else {
      an.classList.add("active");
    }
  }
}

function executeStep() {
  const sym = tape[headIndex];
  const ti = transitions.findIndex(
    (t) => t.from === currentState && t.read === sym,
  );
  if (ti === -1) {
    pause();
    alert(
      `Máquina parada: No hay transición desde ${currentState} leyendo "${sym}"`,
    );
    return;
  }
  
  const th = document.getElementById("transition-history");
  const wh = document.getElementById("word-history");

  historyState.push({
    tape: [...tape],
    headIndex: headIndex,
    currentState: currentState,
    stepCount: stepCount,
    logHTML: th.innerHTML,
    wordHTML: wh.innerHTML
  });
  document.getElementById("btn-step-back").disabled = false;

  const rule = transitions[ti];
  
  const logItem = document.createElement("div");
  logItem.textContent = `[${stepCount + 1}] δ(${currentState}, ${sym}) -> (${rule.to}, ${rule.write}, ${rule.move})`;
  th.appendChild(logItem);
  th.scrollTop = th.scrollHeight;
  clearHL();
  document.getElementById("tr-" + ti).classList.add("active");
  const m = edgeMap[rule.from + "->" + rule.to];
  if (m) {
    const e = document.getElementById(m.edge),
      l = document.getElementById(m.label);
    if (e) {
      e.classList.add("active");
      e.setAttribute("marker-end", "url(#arr-a)");
    }
    if (l) l.classList.add("active");
  }
  tape[headIndex] = rule.write;
  if (rule.move === "I") headIndex--;
  else if (rule.move === "D") headIndex++;
  if (headIndex < 0) {
    tape.unshift("#");
    headIndex = 0;
  } else if (headIndex >= tape.length) {
    tape.push("#");
  }
  currentState = rule.to;
  stepCount++;
  renderTape();

  // Se registra la palabra cuando entra a q2 (números >= 1) o cuando entra a q1 (el 0 inicial)
  if ((rule.to === "q2" && rule.from !== "q2") || rule.to === "q1") {
    const word = tape.filter(c => c !== "#").join("");
    if (word) {
      const base10 = parseInt(word, 2);
      const wItem = document.createElement("div");
      wItem.innerHTML = `Palabra: <strong>${word}</strong> <span style="color:#636e84;">(Base 10: ${base10})</span>`;
      wh.appendChild(wItem);
      wh.scrollTop = wh.scrollHeight;
    }
  }
}

function stepBack() {
  if (historyState.length === 0) return;
  
  const prevState = historyState.pop();
  tape = [...prevState.tape];
  headIndex = prevState.headIndex;
  currentState = prevState.currentState;
  stepCount = prevState.stepCount;
  document.getElementById("transition-history").innerHTML = prevState.logHTML;
  document.getElementById("word-history").innerHTML = prevState.wordHTML;
  
  if (historyState.length === 0) {
    document.getElementById("btn-step-back").disabled = true;
  }
  
  clearHL();
  renderTape();
}

function play() {
  document.getElementById("btn-play").style.display = "none";
  document.getElementById("btn-pause").style.display = "inline-block";
  document.getElementById("btn-step").disabled = true;
  document.getElementById("btn-step-back").disabled = true;
  runInterval = setInterval(
    executeStep,
    1600 - document.getElementById("speed").value,
  );
}

function pause() {
  document.getElementById("btn-play").style.display = "inline-block";
  document.getElementById("btn-pause").style.display = "none";
  document.getElementById("btn-step").disabled = false;
  if (historyState.length > 0) {
    document.getElementById("btn-step-back").disabled = false;
  }
  clearInterval(runInterval);
  runInterval = null;
}

function reset() {
  pause();
  clearHL();
  tape = ["#", "#", "#", "#", "#"];
  headIndex = 2;
  currentState = "q0";
  stepCount = 0;
  historyState = [];
  document.getElementById("btn-step-back").disabled = true;
  document.getElementById("transition-history").innerHTML = "";
  document.getElementById("word-history").innerHTML = "";
  renderTape();
}

document.addEventListener("DOMContentLoaded", () => {
  fetch("graph.svg")
    .then((response) => {
      if (!response.ok) throw new Error("No se pudo cargar el SVG. ¿Estás usando un servidor local (Live Server)?");
      return response.text();
    })
    .then((svgData) => {
      document.getElementById("graph-container").innerHTML = svgData;
      initApp();
    })
    .catch((error) => {
      console.error(error);
      document.getElementById("graph-container").innerHTML = 
        `<p style="color:#e74c3c; text-align:center; padding:20px;">
          Error al cargar <b>graph.svg</b>.<br>
          Por favor, abre el proyecto usando un servidor local (ej. Live Server en VSCode) 
          debido a las políticas de CORS.
        </p>`;
    });
});
