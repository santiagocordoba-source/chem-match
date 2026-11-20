const QUESTIONS = [
  {
    formula: "NaCl",
    a1: { sym: "Na", en: "0.93" },
    a2: { sym: "Cl", en: "3.16" },
    info: "Sodio (Metal) + Cloro (No Metal) • ΔEN = 2.23",
    type: "Iónico",
    reason: "El sodio cede su electrón de valencia al cloro (ΔEN > 1.7), creando iones Na⁺ y Cl⁻."
  },
  {
    formula: "H₂O",
    a1: { sym: "H", en: "2.20" },
    a2: { sym: "O", en: "3.44" },
    info: "Hidrógeno + Oxígeno (No Metales) • ΔEN = 1.24",
    type: "Covalente Polar",
    reason: "Comparten electrones de forma desigual: el oxígeno los atrae con mayor fuerza."
  },
  {
    formula: "O₂",
    a1: { sym: "O", en: "3.44" },
    a2: { sym: "O", en: "3.44" },
    info: "Oxígeno + Oxígeno (No Metales) • ΔEN = 0.00",
    type: "Covalente No Polar",
    reason: "Átomos idénticos tiran de los electrones con exactamente la misma fuerza (ΔEN = 0)."
  },
  {
    formula: "Fe (s)",
    a1: { sym: "Fe", en: "1.83" },
    a2: { sym: "Fe", en: "1.83" },
    info: "Red cristalina de Hierro (Metales)",
    type: "Metálico",
    reason: "Los cationes de hierro flotan en un 'mar de electrones' libres que conducen electricidad."
  },
  {
    formula: "MgO",
    a1: { sym: "Mg", en: "1.31" },
    a2: { sym: "O", en: "3.44" },
    info: "Magnesio (Metal) + Oxígeno (No Metal) • ΔEN = 2.13",
    type: "Iónico",
    reason: "Transferencia de 2 electrones del metal alcalinotérreo al oxígeno (ΔEN > 1.7)."
  },
  {
    formula: "CO₂",
    a1: { sym: "C", en: "2.55" },
    a2: { sym: "O", en: "3.44" },
    info: "Enlaces individuales C=O • ΔEN = 0.89",
    type: "Covalente Polar",
    reason: "Cada enlace C=O tiene distribución desigual de carga hacia el oxígeno (ΔEN = 0.89)."
  },
  {
    formula: "CH₄",
    a1: { sym: "C", en: "2.55" },
    a2: { sym: "H", en: "2.20" },
    info: "Carbono + Hidrógeno (No Metales) • ΔEN = 0.35",
    type: "Covalente No Polar",
    reason: "La diferencia de electronegatividad es menor a 0.4, por lo que comparten casi por igual."
  },
  {
    formula: "Cu - Zn",
    a1: { sym: "Cu", en: "1.90" },
    a2: { sym: "Zn", en: "1.65" },
    info: "Aleación Latón (Cobre + Zinc metálicos)",
    type: "Metálico",
    reason: "Mezcla de átomos metálicos unidos por electrones deslocalizados compartidos."
  },
  {
    formula: "KF",
    a1: { sym: "K", en: "0.82" },
    a2: { sym: "F", en: "3.98" },
    info: "Potasio (Metal) + Flúor (No Metal) • ΔEN = 3.16",
    type: "Iónico",
    reason: "El flúor arranca el electrón del potasio generando una atracción electrostática intensa."
  },
  {
    formula: "NH₃",
    a1: { sym: "N", en: "3.04" },
    a2: { sym: "H", en: "2.20" },
    info: "Nitrógeno + Hidrógeno (No Metales) • ΔEN = 0.84",
    type: "Covalente Polar",
    reason: "El nitrógeno es más electronegativo y concentra densidad electrónica negativa."
  }
];

let currentQuestions = [];
let index = 0;
let score = 0;
let streak = 0;
let maxStreak = 0;
let correctCount = 0;
let lives = 3;
let timer = null;
let timeLeft = 15;
let soundEnabled = true;
let answeredCurrent = false;

// Motor de Efectos de Sonido (Web Audio API sin archivos externos)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(type) {
  if (!soundEnabled) return;
  if (audioCtx.state === "suspended") audioCtx.resume();

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  const now = audioCtx.currentTime;

  if (type === "correct") {
    osc.type = "triangle";
    osc.frequency.setValueAtTime(523.25, now); // Do5
    osc.frequency.setValueAtTime(659.25, now + 0.08); // Mi5
    osc.frequency.setValueAtTime(783.99, now + 0.16); // Sol5
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.start(now);
    osc.stop(now + 0.35);
  } else if (type === "wrong") {
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.linearRampToValueAtTime(110, now + 0.28);
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.start(now);
    osc.stop(now + 0.3);
  } else if (type === "win") {
    osc.type = "sine";
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      osc.frequency.setValueAtTime(freq, now + i * 0.1);
    });
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc.start(now);
    osc.stop(now + 0.55);
  }
}

const screens = {
  start: document.getElementById("start-screen"),
  game: document.getElementById("game-screen"),
  end: document.getElementById("end-screen")
};

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove("active"));
  screens[name].classList.add("active");
}

function startGame() {
  currentQuestions = [...QUESTIONS].sort(() => Math.random() - 0.5);
  index = 0;
  score = 0;
  streak = 0;
  maxStreak = 0;
  correctCount = 0;
  lives = 3;
  updateHUD();
  showScreen("game");
  loadQuestion();
}

function updateHUD() {
  document.getElementById("lives").textContent = "🛡️".repeat(lives) + " broken ".replace(" broken ", "💔".repeat(3 - lives));
  const streakEl = document.getElementById("streak-badge");
  streakEl.textContent = `🔥 Racha: ${streak}`;
  streakEl.classList.toggle("hot", streak >= 2);
  document.getElementById("score").textContent = `${score} PTS`;
  document.getElementById("progress").textContent = `Reacción ${Math.min(index + 1, currentQuestions.length)} de ${currentQuestions.length}`;
}

function loadQuestion() {
  clearInterval(timer);
  answeredCurrent = false;
  timeLeft = 15;

  const fill = document.getElementById("timer-fill");
  fill.style.width = "100%";
  fill.classList.remove("danger");
  document.getElementById("timer-text").textContent = "15.0s";
  document.getElementById("feedback-box").classList.add("hidden");

  const q = currentQuestions[index];
  document.getElementById("formula").textContent = q.formula;
  document.getElementById("elements-info").textContent = q.info;
  document.getElementById("atom1-sym").textContent = q.a1.sym;
  document.getElementById("atom1-en").textContent = `EN: ${q.a1.en}`;
  document.getElementById("atom2-sym").textContent = q.a2.sym;
  document.getElementById("atom2-en").textContent = `EN: ${q.a2.en}`;

  document.querySelectorAll(".option").forEach(btn => {
    btn.disabled = false;
    btn.classList.remove("correct", "wrong");
  });

  timer = setInterval(() => {
    timeLeft = Math.max(0, timeLeft - 0.1);
    const pct = (timeLeft / 15) * 100;
    fill.style.width = `${pct}%`;
    document.getElementById("timer-text").textContent = `${timeLeft.toFixed(1)}s`;
    if (timeLeft <= 4) fill.classList.add("danger");

    if (timeLeft <= 0) {
      clearInterval(timer);
      handleAnswer(null);
    }
  }, 100);
}

function handleAnswer(selectedType) {
  if (answeredCurrent) return;
  answeredCurrent = true;
  clearInterval(timer);

  const q = currentQuestions[index];
  const stage = document.getElementById("reactor-stage");
  const buttons = document.querySelectorAll(".option");

  buttons.forEach(btn => {
    btn.disabled = true;
    if (btn.dataset.type === q.type) btn.classList.add("correct");
    else if (btn.dataset.type === selectedType) btn.classList.add("wrong");
  });

  const feedbackText = document.getElementById("feedback-text");
  if (selectedType === q.type) {
    playTone("correct");
    const bonus = streak * 25;
    const speedBonus = Math.round(timeLeft * 2);
    const earned = 100 + bonus + speedBonus;
    score += earned;
    streak++;
    correctCount++;
    if (streak > maxStreak) maxStreak = streak;
    feedbackText.innerHTML = `✅ <strong>¡Reacción Estabilizada! (+${earned} pts)</strong><br>${q.reason}`;
  } else {
    playTone("wrong");
    lives--;
    streak = 0;
    stage.classList.remove("shake");
    void stage.offsetWidth; // Reinicia animación
    stage.classList.add("shake");
    const prefix = selectedType === null ? "⏰ <strong>¡Sobrecarga de Tiempo!</strong>" : "❌ <strong>¡Inestabilidad Molecular!</strong>";
    feedbackText.innerHTML = `${prefix} Era <strong>${q.type}</strong>.<br>${q.reason}`;
  }

  updateHUD();
  document.getElementById("feedback-box").classList.remove("hidden");
}

function nextStep() {
  index++;
  if (lives <= 0 || index >= currentQuestions.length) {
    endGame();
  } else {
    updateHUD();
    loadQuestion();
  }
}

function endGame() {
  clearInterval(timer);
  const won = lives > 0;
  if (won) {
    playTone("win");
    launchConfetti();
  }
  document.getElementById("end-emoji").textContent = won ? "🏆" : "💥";
  document.getElementById("end-title").textContent = won ? "¡Laboratorio Dominado!" : "Contención Fallida";
  document.getElementById("final-score-val").textContent = score;
  document.getElementById("final-acc-val").textContent = `${Math.round((correctCount / currentQuestions.length) * 100)}%`;
  document.getElementById("final-streak-val").textContent = `🔥 ${maxStreak}`;
  document.getElementById("end-summary").textContent = won
    ? "Excelente dominio analizando electronegatividad y tipos de enlace."
    : "Repasa las diferencias de electronegatividad (ΔEN) e inténtalo de nuevo.";
  showScreen("end");
}

// Confeti ligero en Canvas
function launchConfetti() {
  const canvas = document.getElementById("confetti-canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const pieces = Array.from({ length: 70 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height - canvas.height,
    r: Math.random() * 6 + 4,
    c: ["#38bdf8", "#a855f7", "#10b981", "#fde047"][Math.floor(Math.random() * 4)],
    vy: Math.random() * 3 + 2
  }));

  let frames = 0;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.y += p.vy;
      ctx.fillStyle = p.c;
      ctx.fillRect(p.x, p.y, p.r, p.r);
    });
    if (++frames < 140) requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  draw();
}

// Eventos
document.getElementById("start-btn").addEventListener("click", startGame);
document.getElementById("restart-btn").addEventListener("click", startGame);
document.getElementById("next-btn").addEventListener("click", nextStep);
document.getElementById("sound-toggle").addEventListener("click", (e) => {
  soundEnabled = !soundEnabled;
  e.target.textContent = soundEnabled ? "🔊" : "🔇";
});

document.querySelectorAll(".option").forEach(btn => {
  btn.addEventListener("click", () => handleAnswer(btn.dataset.type));
});

// Atajos de teclado (1-4 para responder, Enter para avanzar)
document.addEventListener("keydown", (e) => {
  if (!screens.game.classList.contains("active")) return;
  const map = { "1": "Iónico", "2": "Covalente Polar", "3": "Covalente No Polar", "4": "Metálico" };
  if (map[e.key] && !answeredCurrent) {
    handleAnswer(map[e.key]);
  } else if (e.key === "Enter" && answeredCurrent) {
    nextStep();
  }
});