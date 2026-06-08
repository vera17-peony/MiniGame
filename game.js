/* =============================================
   MINI GAME ARCADE - GAME.JS
   All game logic, audio, effects, state
   ============================================= */

"use strict";

// ===== AUDIO ENGINE (Web Audio API) =====
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx;
let bgGainNode;
let sfxGainNode;
let musicMuted = false;
let bgOscNodes = [];
let musicPlaying = false;

function initAudio() {
  if (audioCtx) return;
  audioCtx = new AudioCtx();
  bgGainNode = audioCtx.createGain();
  bgGainNode.gain.value = 0.15;
  bgGainNode.connect(audioCtx.destination);
  sfxGainNode = audioCtx.createGain();
  sfxGainNode.gain.value = 0.4;
  sfxGainNode.connect(audioCtx.destination);
}

function playTone(freq, type = "sine", duration = 0.15, vol = 0.3, delay = 0) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(sfxGainNode);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delay);
  gain.gain.setValueAtTime(0, audioCtx.currentTime + delay);
  gain.gain.linearRampToValueAtTime(vol, audioCtx.currentTime + delay + 0.01);
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    audioCtx.currentTime + delay + duration,
  );
  osc.start(audioCtx.currentTime + delay);
  osc.stop(audioCtx.currentTime + delay + duration + 0.01);
}

function playClick() {
  initAudio();
  playTone(660, "sine", 0.08, 0.25);
}
function playFlip() {
  initAudio();
  playTone(440, "triangle", 0.12, 0.3);
}
function playMatch() {
  initAudio();
  playTone(523, "sine", 0.1, 0.4);
  playTone(659, "sine", 0.15, 0.4, 0.1);
  playTone(784, "sine", 0.2, 0.4, 0.2);
}
function playWrong() {
  initAudio();
  playTone(220, "sawtooth", 0.2, 0.3);
  playTone(180, "sawtooth", 0.2, 0.3, 0.1);
}
function playWin() {
  initAudio();
  [523, 659, 784, 1047].forEach((f, i) =>
    playTone(f, "sine", 0.25, 0.4, i * 0.12),
  );
}
function playLose() {
  initAudio();
  [392, 349, 294, 247].forEach((f, i) =>
    playTone(f, "sawtooth", 0.2, 0.3, i * 0.1),
  );
}
function playGameOver() {
  initAudio();
  playTone(330, "sawtooth", 0.15, 0.4);
  playTone(247, "sawtooth", 0.25, 0.4, 0.15);
  playTone(165, "sawtooth", 0.4, 0.4, 0.3);
}
function playCollect() {
  initAudio();
  playTone(880, "sine", 0.1, 0.3);
  playTone(1100, "sine", 0.12, 0.3, 0.08);
}
function playBoom() {
  initAudio();
  playTone(80, "sawtooth", 0.3, 0.5);
  playTone(60, "sawtooth", 0.35, 0.5, 0.05);
}
function playEat() {
  initAudio();
  playTone(700, "sine", 0.08, 0.3);
  playTone(900, "sine", 0.08, 0.3, 0.07);
}
function playDraw() {
  initAudio();
  playTone(440, "triangle", 0.3, 0.3);
}

function startBackgroundMusic() {
  if (!audioCtx || musicPlaying) return;
  musicPlaying = true;
  const baseNotes = [261, 294, 330, 349, 392, 440, 494, 523];
  let noteIndex = 0;
  function playNextNote() {
    if (!musicPlaying || musicMuted) {
      setTimeout(playNextNote, 800);
      return;
    }
    const n = baseNotes[noteIndex % baseNotes.length];
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(bgGainNode);
    osc.type = "sine";
    osc.frequency.value = n;
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.55);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.6);
    noteIndex++;
    setTimeout(playNextNote, 600);
  }
  playNextNote();
}

function toggleMusic() {
  initAudio();
  musicMuted = !musicMuted;
  bgGainNode.gain.value = musicMuted ? 0 : 0.15;
  document.getElementById("music-toggle").textContent = musicMuted
    ? "🔇"
    : "🔊";
  if (!musicPlaying) startBackgroundMusic();
}

// ===== THEME TOGGLE =====
function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute("data-theme") === "dark";
  html.setAttribute("data-theme", isDark ? "light" : "dark");
  document.getElementById("theme-toggle").textContent = isDark ? "☀️" : "🌙";
  playClick();
}

// ===== PAGE NAVIGATION =====
function showPage(id) {
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  const el = document.getElementById("page-" + id);
  if (el) {
    el.classList.add("active");
    window.scrollTo(0, 0);
  }
}

// ===== POPUP SYSTEM =====
function showPopup(icon, title, msg, btn2Text, btn2Action) {
  document.getElementById("popup-icon").textContent = icon;
  document.getElementById("popup-title").textContent = title;
  document.getElementById("popup-message").textContent = msg;
  const overlay = document.getElementById("popup-overlay");
  overlay.classList.add("show");
  const btn2 = document.getElementById("popup-btn2");
  if (btn2Text) {
    btn2.style.display = "inline-flex";
    btn2.textContent = btn2Text;
    btn2.onclick = () => {
      closePopup();
      btn2Action();
    };
  } else {
    btn2.style.display = "none";
  }
}

function closePopup() {
  document.getElementById("popup-overlay").classList.remove("show");
}

// ===== CONFETTI =====
const confettiCanvas = document.getElementById("confetti-canvas");
const confettiCtx = confettiCanvas.getContext("2d");
let confettiParticles = [];
let confettiAnim = null;

function launchConfetti() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
  confettiParticles = [];
  const colors = [
    "#ff85c2",
    "#7fffda",
    "#7ec8ff",
    "#ffe97f",
    "#c77dff",
    "#ffa07a",
  ];
  for (let i = 0; i < 180; i++) {
    confettiParticles.push({
      x: Math.random() * confettiCanvas.width,
      y: Math.random() * -200,
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 4 + 2,
      size: Math.random() * 10 + 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 10,
    });
  }
  if (confettiAnim) cancelAnimationFrame(confettiAnim);
  animateConfetti();
  setTimeout(() => {
    if (confettiAnim) cancelAnimationFrame(confettiAnim);
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  }, 4000);
}

function animateConfetti() {
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  confettiParticles.forEach((p) => {
    p.x += p.vx;
    p.y += p.vy;
    p.rotation += p.rotSpeed;
    p.vy += 0.08;
    confettiCtx.save();
    confettiCtx.translate(p.x, p.y);
    confettiCtx.rotate((p.rotation * Math.PI) / 180);
    confettiCtx.fillStyle = p.color;
    confettiCtx.globalAlpha = Math.max(0, 1 - p.y / confettiCanvas.height);
    confettiCtx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    confettiCtx.restore();
  });
  confettiAnim = requestAnimationFrame(animateConfetti);
}

// ===== HIGH SCORES =====
function getHS(key) {
  return parseInt(localStorage.getItem("hs_" + key) || "0");
}
function setHS(key, val) {
  const cur = getHS(key);
  if (val > cur) localStorage.setItem("hs_" + key, val);
}

// ===== LOADING SCREEN =====
function runLoading() {
  const bar = document.getElementById("loading-bar");
  const text = document.getElementById("loading-text");
  const msgs = [
    "Memuat game...",
    "Menyiapkan kartu...",
    "Mengompilasi AI...",
    "Siap bermain! 🎮",
  ];
  let pct = 0;
  const iv = setInterval(() => {
    pct += Math.random() * 18 + 5;
    if (pct > 100) pct = 100;
    bar.style.width = pct + "%";
    text.textContent =
      msgs[Math.floor((pct / 100) * msgs.length)] || msgs[msgs.length - 1];
    if (pct >= 100) {
      clearInterval(iv);
      setTimeout(() => {
        document.getElementById("loading-screen").classList.add("hidden");
        showPage("home");
        initAudio();
        startBackgroundMusic();
      }, 500);
    }
  }, 150);
}

// Loading particles
function spawnLoadingParticles() {
  const c = document.getElementById("loading-particles");
  const colors = ["#ff85c2", "#7fffda", "#7ec8ff", "#ffe97f", "#c77dff"];
  for (let i = 0; i < 30; i++) {
    const p = document.createElement("div");
    p.className = "loading-particle";
    p.style.cssText = `left:${Math.random() * 100}%;background:${colors[i % colors.length]};width:${Math.random() * 8 + 4}px;height:${Math.random() * 8 + 4}px;animation-duration:${Math.random() * 5 + 4}s;animation-delay:${Math.random() * 3}s`;
    c.appendChild(p);
  }
}

// Floating emojis on home
function spawnFloatingEmojis() {
  const c = document.getElementById("floating-emojis");
  const emojis = ["🎮", "🏆", "⭐", "🎯", "🎲", "💥", "🌟", "✨", "🎊", "🎈"];
  for (let i = 0; i < 15; i++) {
    const e = document.createElement("div");
    e.className = "float-emoji";
    e.textContent = emojis[i % emojis.length];
    e.style.cssText = `left:${Math.random() * 100}%;animation-duration:${Math.random() * 8 + 6}s;animation-delay:${Math.random() * 6}s;font-size:${Math.random() * 1 + 0.9}rem`;
    c.appendChild(e);
  }
}

// ===================================================
//   GAME 1: MEMORY GAME
// ===================================================
const EMOJIS = [
  "🍩",
  "☕",
  "🍪",
  "🍫",
  "🧁",
  "🍰",
  "🍓",
  "🍋",
  "🍇",
  "🍒",
  "🌮",
  "🍕",
];
let memCards = [],
  memFlipped = [],
  memMatched = 0,
  memTotal = 0;
let memTimer = 0,
  memTimerIv = null,
  memMoves = 0,
  memLocked = false;
let memCols = 2,
  memRows = 2,
  memLevelLabel = "Mudah";

function startMemory(cols, rows, label) {
  memCols = cols;
  memRows = rows;
  memLevelLabel = label;
  document.getElementById("mem-level-select").style.display = "none";
  document.getElementById("mem-game-area").style.display = "block";
  document.getElementById("mem-level-label").textContent = label;
  resetMemory();
}

function resetMemory() {
  clearInterval(memTimerIv);
  memTimer = 0;
  memMoves = 0;
  memMatched = 0;
  memLocked = false;
  memFlipped = [];
  document.getElementById("mem-timer").textContent = "0";
  document.getElementById("mem-moves").textContent = "0";
  document.getElementById("mem-best").textContent =
    getHS("mem_" + memLevelLabel) || "--";
  document.getElementById("mem-progress").style.width = "0%";

  const count = memCols * memRows;
  memTotal = count / 2;
  const pool = EMOJIS.slice(0, memTotal);
  let deck = [...pool, ...pool];
  deck.sort(() => Math.random() - 0.5);

  const board = document.getElementById("mem-board");
  board.innerHTML = "";
  board.style.gridTemplateColumns = `repeat(${memCols}, 1fr)`;

  deck.forEach((emoji, i) => {
    const card = document.createElement("div");
    card.className = "mem-card";
    card.dataset.value = emoji;
    card.dataset.index = i;
    card.innerHTML = `<div class="mem-card-inner"><div class="mem-card-front">❓</div><div class="mem-card-back">${emoji}</div></div>`;
    card.addEventListener("click", () => flipMemCard(card));
    board.appendChild(card);
  });

  memTimerIv = setInterval(() => {
    memTimer++;
    document.getElementById("mem-timer").textContent = memTimer;
  }, 1000);
}

function flipMemCard(card) {
  if (
    memLocked ||
    card.classList.contains("flipped") ||
    card.classList.contains("matched")
  )
    return;
  playFlip();
  card.classList.add("flipped");
  memFlipped.push(card);
  if (memFlipped.length === 2) {
    memMoves++;
    document.getElementById("mem-moves").textContent = memMoves;
    memLocked = true;
    if (memFlipped[0].dataset.value === memFlipped[1].dataset.value) {
      memFlipped[0].classList.add("matched");
      memFlipped[1].classList.add("matched");
      memMatched++;
      const prog = (memMatched / memTotal) * 100;
      document.getElementById("mem-progress").style.width = prog + "%";
      playMatch();
      memFlipped = [];
      memLocked = false;
      if (memMatched === memTotal) {
        clearInterval(memTimerIv);
        setHS(
          "mem_" + memLevelLabel,
          Math.max(0, 1000 - memMoves * 10 - memTimer),
        );
        document.getElementById("mem-best").textContent = getHS(
          "mem_" + memLevelLabel,
        );
        setTimeout(() => {
          playWin();
          launchConfetti();
          showPopup(
            "🎉",
            "Selamat!",
            `Level ${memLevelLabel} selesai!\n⏱️ ${memTimer}s | 👆 ${memMoves} moves`,
            "Main Lagi",
            resetMemory,
          );
        }, 400);
      }
    } else {
      playWrong();
      setTimeout(() => {
        memFlipped.forEach((c) => c.classList.remove("flipped"));
        memFlipped = [];
        memLocked = false;
      }, 900);
    }
  }
}

function showMemoryLevelSelect() {
  document.getElementById("mem-level-select").style.display = "block";
  document.getElementById("mem-game-area").style.display = "none";
  clearInterval(memTimerIv);
}

// ===================================================
//   GAME 2: TIC TAC TOE
// ===================================================
let tttBoard = Array(9).fill(null);
let tttCurrent = "X";
let tttMode = "friend";
let tttScores = { X: 0, O: 0, draw: 0 };
let tttGameOver = false;
const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function startTTT(mode) {
  tttMode = mode;
  document.getElementById("ttt-mode-select").style.display = "none";
  document.getElementById("ttt-game-area").style.display = "block";
  resetTTT();
}

function resetTTT() {
  tttBoard = Array(9).fill(null);
  tttCurrent = "X";
  tttGameOver = false;
  renderTTT();
  setTurnLabel();
}

function renderTTT() {
  const board = document.getElementById("ttt-board");
  board.innerHTML = "";
  tttBoard.forEach((cell, i) => {
    const div = document.createElement("div");
    div.className =
      "ttt-cell" +
      (cell ? " taken" : "") +
      (cell === "X" ? " x-cell" : cell === "O" ? " o-cell" : "");
    div.textContent = cell || "";
    if (!cell && !tttGameOver) div.addEventListener("click", () => tttClick(i));
    board.appendChild(div);
  });
}

function setTurnLabel() {
  if (tttGameOver) return;
  const sym = tttCurrent === "X" ? "❌" : "⭕";
  const name =
    tttMode === "bot" && tttCurrent === "O" ? "🤖 Bot" : `Pemain ${tttCurrent}`;
  document.getElementById("ttt-turn-label").textContent =
    `Giliran: ${sym} ${name}`;
}

function tttClick(i) {
  if (tttBoard[i] || tttGameOver) return;
  playClick();
  tttBoard[i] = tttCurrent;
  renderTTT();
  const result = checkTTT();
  if (result) {
    handleTTTEnd(result);
    return;
  }
  tttCurrent = tttCurrent === "X" ? "O" : "X";
  setTurnLabel();
  if (tttMode === "bot" && tttCurrent === "O" && !tttGameOver) {
    tttGameOver = true; // prevent clicking during bot turn
    document.getElementById("ttt-turn-label").textContent =
      "🤖 Bot sedang berpikir...";
    setTimeout(botMoveTTT, 700);
  }
}

function botMoveTTT() {
  tttGameOver = false;
  // Smart bot: try to win, then block, then random
  const move = getBotMove();
  tttBoard[move] = "O";
  playClick();
  renderTTT();
  const result = checkTTT();
  if (result) {
    handleTTTEnd(result);
    return;
  }
  tttCurrent = "X";
  setTurnLabel();
}

function getBotMove() {
  // Try to win
  for (let i = 0; i < 9; i++) {
    if (!tttBoard[i]) {
      tttBoard[i] = "O";
      if (checkTTT()) {
        tttBoard[i] = null;
        return i;
      }
      tttBoard[i] = null;
    }
  }
  // Block player
  for (let i = 0; i < 9; i++) {
    if (!tttBoard[i]) {
      tttBoard[i] = "X";
      if (checkTTT()) {
        tttBoard[i] = null;
        return i;
      }
      tttBoard[i] = null;
    }
  }
  // Prefer center
  if (!tttBoard[4]) return 4;
  // Random
  const empty = tttBoard
    .map((v, i) => (v === null ? i : -1))
    .filter((v) => v >= 0);
  return empty[Math.floor(Math.random() * empty.length)];
}

function checkTTT() {
  for (const [a, b, c] of WIN_LINES) {
    if (
      tttBoard[a] &&
      tttBoard[a] === tttBoard[b] &&
      tttBoard[a] === tttBoard[c]
    )
      return { winner: tttBoard[a], line: [a, b, c] };
  }
  if (tttBoard.every((v) => v !== null)) return { winner: "draw" };
  return null;
}

function handleTTTEnd(result) {
  tttGameOver = true;
  if (result.winner === "draw") {
    tttScores.draw++;
    document.getElementById("ttt-score-draw").textContent = tttScores.draw;
    document.getElementById("ttt-turn-label").textContent = "🤝 Seri!";
    playDraw();
    setTimeout(
      () =>
        showPopup(
          "🤝",
          "Seri!",
          "Tidak ada yang menang kali ini.",
          "Main Lagi",
          resetTTT,
        ),
      300,
    );
  } else {
    if (result.line) {
      result.line.forEach((i) => {
        document.querySelectorAll(".ttt-cell")[i].classList.add("win-cell");
      });
    }
    if (result.winner === "X") {
      tttScores.X++;
      document.getElementById("ttt-score-x").textContent = tttScores.X;
      const isBot = tttMode === "bot";
      document.getElementById("ttt-turn-label").textContent = `❌ X Menang!`;
      playWin();
      launchConfetti();
      setTimeout(
        () =>
          showPopup(
            "🎉",
            isBot ? "Kamu Menang!" : "Pemain X Menang!",
            isBot ? "Kamu berhasil mengalahkan bot! 🤖" : "Selamat Pemain X!",
            "Main Lagi",
            resetTTT,
          ),
        300,
      );
    } else {
      tttScores.O++;
      document.getElementById("ttt-score-o").textContent = tttScores.O;
      const isBot = tttMode === "bot";
      document.getElementById("ttt-turn-label").textContent = `⭕ O Menang!`;
      if (isBot) {
        playLose();
        setTimeout(
          () =>
            showPopup(
              "😢",
              "Kamu Kalah!",
              "Bot mengalahkanmu kali ini. Coba lagi!",
              "Main Lagi",
              resetTTT,
            ),
          300,
        );
      } else {
        playWin();
        launchConfetti();
        setTimeout(
          () =>
            showPopup(
              "🎉",
              "Pemain O Menang!",
              "Selamat Pemain O!",
              "Main Lagi",
              resetTTT,
            ),
          300,
        );
      }
    }
  }
}

// ===================================================
//   GAME 3: TEBAK ANGKA
// ===================================================
let taSecret, taLives, taMaxLives, taScore, taBest, startNumber, endNumber;

function startTebakAngka(start, end, lives, label) {
  startNumber = start || 0;
  endNumber = end || 50;
  taMaxLives = lives || 7;

  document.getElementById("tebakangka-level-select").style.display = "none";
  document.getElementById("tebakangka-game-area").style.display = "block";
  document.getElementById("ta-level").textContent = label || "-";
  console.log(startNumber)
  document.getElementById("ta-start-number").textContent = startNumber || "0";
  document.getElementById("ta-end-number").textContent = endNumber || "0";

  document.getElementById("ta-hint").textContent = "";
  document.getElementById("ta-hint").className = "ta-hint";
  document.getElementById("ta-input").value = "";
  document.getElementById("ta-best").textContent = taBest;

  resetTebakAngka();
}

function resetTebakAngka() {
  taLives = taMaxLives;
  taSecret = Math.floor(Math.random() * 100) + 1;
  taScore = parseInt(document.getElementById("ta-score").textContent) || 0;
  taBest = getHS("tebak");
  renderTALives();
}

function renderTALives() {
  document.getElementById("ta-lives").textContent =
    "❤️".repeat(taLives) + "🖤".repeat(taMaxLives - taLives);
}

function checkGuess() {
  const inp = document.getElementById("ta-input");
  const val = parseInt(inp.value);
  if (!val || val < 1 || val > 100) {
    inp.classList.add("shake");
    setTimeout(() => inp.classList.remove("shake"), 400);
    return;
  }
  inp.value = "";

  const hint = document.getElementById("ta-hint");
  if (val === taSecret) {
    const pts = taLives * 20 + 50;
    taScore += pts;
    document.getElementById("ta-score").textContent = taScore;
    setHS("tebak", taScore);
    document.getElementById("ta-best").textContent = getHS("tebak");
    hint.textContent = `✅ Benar! Angkanya ${taSecret}! +${pts} pts`;
    hint.className = "ta-hint correct";
    playWin();
    launchConfetti();
    setTimeout(() => {
      showPopup(
        "🎉",
        "Benar!",
        `Angkanya ${taSecret}!\nKamu mendapat +${pts} poin!\nTotal: ${taScore} poin`,
        "Main Lagi",
        startTebakAngka,
      );
    }, 300);
  } else {
    taLives--;
    renderTALives();
    inp.classList.add("shake");
    setTimeout(() => inp.classList.remove("shake"), 400);
    playWrong();
    if (val > taSecret) {
      hint.textContent = "⬇️ Terlalu besar! Coba lebih kecil.";
      hint.className = "ta-hint too-big";
    } else {
      hint.textContent = "⬆️ Terlalu kecil! Coba lebih besar.";
      hint.className = "ta-hint too-small";
    }
    if (taLives <= 0) {
      hint.textContent = `💀 Habis nyawa! Angkanya ${taSecret}`;
      hint.className = "ta-hint too-big";
      playGameOver();
      setTimeout(() => {
        showPopup(
          "😢",
          "Game Over!",
          `Nyawa habis! Angkanya ${taSecret}.\nSkor kamu: ${taScore}`,
          "Main Lagi",
          startTebakAngka,
        );
      }, 400);
    }
  }
}

document.addEventListener("keydown", (e) => {
  if (
    document.getElementById("page-tebakangka").classList.contains("active") &&
    e.key === "Enter"
  )
    checkGuess();
});

// ===================================================
//   GAME 4: ROCK PAPER SCISSORS
// ===================================================
let rpsWin = 0,
  rpsLose = 0,
  rpsDraw = 0;
const rpsMap = { rock: "✊", paper: "✋", scissors: "✌️" };
const rpsNames = { rock: "Batu", paper: "Kertas", scissors: "Gunting" };
const rpsChoices = ["rock", "paper", "scissors"];

function playRPS(choice) {
  initAudio();
  const bot = rpsChoices[Math.floor(Math.random() * 3)];
  const pe = document.getElementById("rps-player-emoji");
  const be = document.getElementById("rps-bot-emoji");
  const res = document.getElementById("rps-result");

  pe.textContent = "🤔";
  be.textContent = "🤔";
  pe.classList.add("rps-battle");
  be.classList.add("rps-battle");
  res.textContent = "";
  res.className = "rps-result";

  setTimeout(() => {
    pe.classList.remove("rps-battle");
    be.classList.remove("rps-battle");
    pe.textContent = rpsMap[choice];
    be.textContent = rpsMap[bot];

    let outcome;
    if (choice === bot) {
      outcome = "draw";
      rpsDraw++;
      res.textContent = "🤝 Seri!";
      res.className = "rps-result draw";
      playDraw();
    } else if (
      (choice === "rock" && bot === "scissors") ||
      (choice === "scissors" && bot === "paper") ||
      (choice === "paper" && bot === "rock")
    ) {
      outcome = "win";
      rpsWin++;
      res.textContent = "🎉 Kamu Menang!";
      res.className = "rps-result win";
      playWin();
    } else {
      outcome = "lose";
      rpsLose++;
      res.textContent = "😢 Kamu Kalah!";
      res.className = "rps-result lose";
      playLose();
      pe.classList.add("rps-battle");
    }

    document.getElementById("rps-win").textContent = rpsWin;
    document.getElementById("rps-lose").textContent = rpsLose;
    document.getElementById("rps-draw").textContent = rpsDraw;
  }, 400);
}

// ===================================================
//   GAME 5: SNAKE GAME
// ===================================================
const SNAKE_SIZE = 20;
let snakeCanvas, snakeCtx;
let snake, food, snakeDir, snakeNextDir, snakeScore, snakeBest;
let snakeInterval = null,
  snakeGameActive = false,
  snakeSpeed = 150;
const SNAKE_COLORS = ["#c77dff", "#a855f7", "#9333ea", "#7e22ce"];

function initSnake() {
  snakeCanvas = document.getElementById("snake-canvas");
  snakeCtx = snakeCanvas.getContext("2d");
  snakeBest = getHS("snake");
  document.getElementById("snake-best").textContent = snakeBest;
}

function startSnake() {
  if (!snakeCanvas) initSnake();
  snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ];
  snakeDir = { x: 1, y: 0 };
  snakeNextDir = { x: 1, y: 0 };
  snakeScore = 0;
  snakeSpeed = 150;
  document.getElementById("snake-score").textContent = 0;
  document.getElementById("snake-overlay").style.display = "none";
  spawnSnakeFood();
  if (snakeInterval) clearInterval(snakeInterval);
  snakeGameActive = true;
  snakeInterval = setInterval(stepSnake, snakeSpeed);
}

function stopSnake() {
  snakeGameActive = false;
  if (snakeInterval) clearInterval(snakeInterval);
}

function spawnSnakeFood() {
  const cols = snakeCanvas.width / SNAKE_SIZE;
  const rows = snakeCanvas.height / SNAKE_SIZE;
  let fx, fy;
  do {
    fx = Math.floor(Math.random() * cols);
    fy = Math.floor(Math.random() * rows);
  } while (snake.some((s) => s.x === fx && s.y === fy));
  food = { x: fx, y: fy, pulse: 0 };
}

function stepSnake() {
  snakeDir = { ...snakeNextDir };
  const head = { x: snake[0].x + snakeDir.x, y: snake[0].y + snakeDir.y };
  const cols = snakeCanvas.width / SNAKE_SIZE;
  const rows = snakeCanvas.height / SNAKE_SIZE;

  if (
    head.x < 0 ||
    head.x >= cols ||
    head.y < 0 ||
    head.y >= rows ||
    snake.some((s) => s.x === head.x && s.y === head.y)
  ) {
    endSnake();
    return;
  }

  snake.unshift(head);
  if (head.x === food.x && head.y === food.y) {
    snakeScore += 10;
    document.getElementById("snake-score").textContent = snakeScore;
    playEat();
    spawnSnakeFood();
    if (snakeScore % 50 === 0) {
      snakeSpeed = Math.max(60, snakeSpeed - 15);
      clearInterval(snakeInterval);
      snakeInterval = setInterval(stepSnake, snakeSpeed);
    }
  } else {
    snake.pop();
  }
  drawSnake();
}

function drawSnake() {
  const ctx = snakeCtx;
  const W = snakeCanvas.width,
    H = snakeCanvas.height;
  ctx.clearRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = "rgba(255,255,255,0.03)";
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += SNAKE_SIZE) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += SNAKE_SIZE) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // Food
  food.pulse = (food.pulse || 0) + 0.1;
  const fX = food.x * SNAKE_SIZE + SNAKE_SIZE / 2;
  const fY = food.y * SNAKE_SIZE + SNAKE_SIZE / 2;
  const fR = (SNAKE_SIZE / 2 - 2) * (1 + Math.sin(food.pulse) * 0.12);
  ctx.beginPath();
  ctx.arc(fX, fY, fR, 0, Math.PI * 2);
  ctx.fillStyle = "#7fffda";
  ctx.shadowBlur = 18;
  ctx.shadowColor = "#7fffda";
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.font = `${SNAKE_SIZE - 4}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🍎", fX, fY);

  // Snake
  snake.forEach((seg, i) => {
    const r = i === 0 ? SNAKE_SIZE / 2 - 1 : SNAKE_SIZE / 2 - 2;
    const x = seg.x * SNAKE_SIZE + SNAKE_SIZE / 2;
    const y = seg.y * SNAKE_SIZE + SNAKE_SIZE / 2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    const t = i / snake.length;
    ctx.fillStyle = i === 0 ? "#ff85c2" : `hsl(${270 - t * 60},80%,65%)`;
    ctx.shadowBlur = i === 0 ? 16 : 8;
    ctx.shadowColor = i === 0 ? "#ff85c2" : "#c77dff";
    ctx.fill();
    ctx.shadowBlur = 0;
    if (i === 0) {
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(x - 3, y - 2, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + 3, y - 2, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function endSnake() {
  snakeGameActive = false;
  clearInterval(snakeInterval);
  setHS("snake", snakeScore);
  snakeBest = getHS("snake");
  document.getElementById("snake-best").textContent = snakeBest;
  playGameOver();
  const overlay = document.getElementById("snake-overlay");
  document.getElementById("snake-overlay-title").textContent = "Game Over!";
  document.getElementById("snake-overlay-msg").textContent =
    `Score: ${snakeScore} | Best: ${snakeBest}`;
  overlay.style.display = "flex";
  overlay.querySelector(".game-btn").onclick = startSnake;
}

function snakeDirChange(dir) {
  const map = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };
  const nd = map[dir];
  if (nd.x !== -snakeDir.x || nd.y !== -snakeDir.y) snakeNextDir = nd;
}

document.addEventListener("keydown", (e) => {
  if (!document.getElementById("page-snake").classList.contains("active"))
    return;
  const map = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    w: "up",
    s: "down",
    a: "left",
    d: "right",
  };
  if (map[e.key]) {
    e.preventDefault();
    snakeDirChange(map[e.key]);
  }
});

// ===================================================
//   GAME 6: CATCH THE OBJECT
// ===================================================
let catchCanvas, catchCtx;
let catchGameActive = false;
let catchInterval = null;
let player, objects, catchScore, catchLives, catchLevel, catchCombo;
let catchKeys = { left: false, right: false };
const GOOD_ITEMS = ["🍎", "🍊", "🍋", "🍇", "🍓", "⭐", "💎", "🌟"];
const BAD_ITEMS = ["💣", "💀"];
let catchHighest = 0;

function initCatch() {
  catchCanvas = document.getElementById("catch-canvas");
  catchCtx = catchCanvas.getContext("2d");
  setupCatchControls();
}

function setupCatchControls() {
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a") catchKeys.left = true;
    if (e.key === "ArrowRight" || e.key === "d") catchKeys.right = true;
  });
  document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a") catchKeys.left = false;
    if (e.key === "ArrowRight" || e.key === "d") catchKeys.right = false;
  });
  // Mobile buttons
  const lBtn = document.getElementById("catch-left-btn");
  const rBtn = document.getElementById("catch-right-btn");
  if (lBtn) {
    lBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      catchKeys.left = true;
    });
    lBtn.addEventListener("touchend", (e) => {
      e.preventDefault();
      catchKeys.left = false;
    });
    lBtn.addEventListener("mousedown", () => {
      catchKeys.left = true;
    });
    lBtn.addEventListener("mouseup", () => {
      catchKeys.left = false;
    });
    rBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      catchKeys.right = true;
    });
    rBtn.addEventListener("touchend", (e) => {
      e.preventDefault();
      catchKeys.right = false;
    });
    rBtn.addEventListener("mousedown", () => {
      catchKeys.right = true;
    });
    rBtn.addEventListener("mouseup", () => {
      catchKeys.right = false;
    });
  }
}

function startCatch() {
  if (!catchCanvas) initCatch();
  const W = catchCanvas.width;
  player = {
    x: W / 2,
    y: catchCanvas.height - 40,
    w: 60,
    h: 20,
    color: "#c77dff",
  };
  objects = [];
  catchScore = 0;
  catchLives = 3;
  catchLevel = 1;
  catchCombo = 0;
  updateCatchUI();
  document.getElementById("catch-overlay").style.display = "none";
  catchGameActive = true;
  if (catchInterval) clearInterval(catchInterval);

  let spawnCounter = 0;
  catchInterval = setInterval(() => {
    if (!catchGameActive) return;
    spawnCounter++;
    if (spawnCounter % Math.max(20, 40 - catchLevel * 3) === 0)
      spawnCatchObject();
    updateCatch();
    drawCatch();
  }, 1000 / 60);
}

function stopCatch() {
  catchGameActive = false;
  if (catchInterval) clearInterval(catchInterval);
}

function spawnCatchObject() {
  const isBad = Math.random() < 0.25 + catchLevel * 0.04;
  const emoji = isBad
    ? BAD_ITEMS[Math.floor(Math.random() * BAD_ITEMS.length)]
    : GOOD_ITEMS[Math.floor(Math.random() * GOOD_ITEMS.length)];
  objects.push({
    x: Math.random() * (catchCanvas.width - 40) + 20,
    y: -30,
    vy: 2 + catchLevel * 0.5 + Math.random() * 1.5,
    emoji,
    isBad,
    exploding: false,
    expFrame: 0,
    size: 32,
  });
}

function updateCatch() {
  const W = catchCanvas.width;
  const speed = 6 + catchLevel * 0.4;
  if (catchKeys.left && player.x - player.w / 2 > 0) player.x -= speed;
  if (catchKeys.right && player.x + player.w / 2 < W) player.x += speed;
  player.x = Math.max(player.w / 2, Math.min(W - player.w / 2, player.x));

  objects.forEach((obj) => {
    if (!obj.exploding) obj.y += obj.vy;
  });

  // Collision detection
  objects.forEach((obj) => {
    if (obj.exploding || obj.y > catchCanvas.height + 40) return;
    const dx = Math.abs(obj.x - player.x);
    const dy = Math.abs(obj.y - (player.y - 10));
    if (dx < player.w / 2 + 16 && dy < player.h / 2 + 16) {
      if (obj.isBad) {
        obj.exploding = true;
        catchLives--;
        catchCombo = 0;
        playBoom();
        if (catchLives <= 0) {
          setTimeout(endCatch, 100);
        }
      } else {
        catchCombo++;
        const pts = 10 * (catchCombo > 3 ? 2 : 1);
        catchScore += pts;
        if (catchScore > catchHighest) catchHighest = catchScore;
        if (catchScore % 100 === 0) {
          catchLevel++;
        }
        playCollect();
        obj.y = catchCanvas.height + 100; // remove
      }
      updateCatchUI();
    }
  });

  // Remove off-screen (missed good items cost nothing; missed bad items disappear)
  objects = objects.filter(
    (obj) =>
      obj.y < catchCanvas.height + 60 && !(obj.exploding && obj.expFrame > 20),
  );
  objects.forEach((obj) => {
    if (obj.exploding) obj.expFrame++;
  });
}

function updateCatchUI() {
  document.getElementById("catch-score").textContent = catchScore;
  document.getElementById("catch-level").textContent = catchLevel;
  document.getElementById("catch-lives-display").textContent =
    "❤️".repeat(Math.max(0, catchLives)) +
    "🖤".repeat(Math.max(0, 3 - catchLives));
}

function drawCatch() {
  const ctx = catchCtx;
  const W = catchCanvas.width,
    H = catchCanvas.height;
  ctx.clearRect(0, 0, W, H);

  // Background
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "rgba(10,8,30,0.95)");
  grad.addColorStop(1, "rgba(30,15,60,0.95)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Stars background
  for (let i = 0; i < 30; i++) {
    ctx.beginPath();
    ctx.arc((i * 73) % W, (i * 97) % H, 1, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${0.2 + Math.sin(Date.now() / 1000 + i) * 0.1})`;
    ctx.fill();
  }

  // Objects
  objects.forEach((obj) => {
    ctx.save();
    ctx.translate(obj.x, obj.y);
    if (obj.exploding) {
      const r = obj.expFrame * 3;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,150,50,${Math.max(0, 0.8 - obj.expFrame * 0.04)})`;
      ctx.shadowBlur = 20;
      ctx.shadowColor = "#ff9600";
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      ctx.shadowBlur = obj.isBad ? 14 : 10;
      ctx.shadowColor = obj.isBad ? "#ff4444" : "#7fffda";
      ctx.font = `${obj.size}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(obj.emoji, 0, 0);
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  });

  // Player (basket)
  ctx.save();
  ctx.translate(player.x, player.y);
  const pg = ctx.createLinearGradient(-player.w / 2, 0, player.w / 2, 0);
  pg.addColorStop(0, "#c77dff");
  pg.addColorStop(1, "#7ec8ff");
  ctx.fillStyle = pg;
  ctx.shadowBlur = 16;
  ctx.shadowColor = "#c77dff";
  ctx.beginPath();
  ctx.roundRect(-player.w / 2, -player.h / 2, player.w, player.h, 8);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.font = "22px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🧺", 0, 2);
  ctx.restore();

  // Combo display
  if (catchCombo > 1) {
    ctx.font = `bold ${Math.min(24, 12 + catchCombo)}px 'Fredoka One', cursive`;
    ctx.fillStyle = "#ffe97f";
    ctx.textAlign = "center";
    ctx.shadowBlur = 12;
    ctx.shadowColor = "#ffe97f";
    ctx.fillText(`COMBO x${catchCombo}! 🔥`, W / 2, 40);
    ctx.shadowBlur = 0;
  }
}

function endCatch() {
  catchGameActive = false;
  clearInterval(catchInterval);
  playGameOver();
  const overlay = document.getElementById("catch-overlay");
  document.getElementById("catch-overlay-title").textContent = "Game Over!";
  document.getElementById("catch-overlay-msg").innerHTML =
    `Score: ${catchScore} | Level: ${catchLevel}<br>Best: ${catchHighest}`;
  overlay.style.display = "flex";
  overlay.querySelector(".game-btn").onclick = startCatch;
}

// ===================================================
//   INIT & PAGE SETUP
// ===================================================
function onPageShown(id) {
  if (id === "memory") {
    document.getElementById("mem-level-select").style.display = "block";
    document.getElementById("mem-game-area").style.display = "none";
    clearInterval(memTimerIv);
  }
  if (id === "tictactoe") {
    document.getElementById("ttt-mode-select").style.display = "block";
    document.getElementById("ttt-game-area").style.display = "none";
    tttScores = { X: 0, O: 0, draw: 0 };
    document.getElementById("ttt-score-x").textContent = 0;
    document.getElementById("ttt-score-o").textContent = 0;
    document.getElementById("ttt-score-draw").textContent = 0;
  }
  if (id === "tebakangka") {
    document.getElementById("tebakangka-level-select").style.display = "block";
    document.getElementById("tebakangka-game-area").style.display = "none";
    // startTebakAngka();
  }
  if (id === "snake") {
    initSnake();
    document.getElementById("snake-overlay").style.display = "flex";
    document.getElementById("snake-overlay-title").textContent = "Snake Game";
    document.getElementById("snake-overlay-msg").textContent =
      "Gunakan tombol panah / WASD untuk bermain";
    document.getElementById("snake-best").textContent = getHS("snake");
    document.querySelector("#snake-overlay .game-btn").onclick = startSnake;
  }
  if (id === "catch") {
    initCatch();
    document.getElementById("catch-overlay").style.display = "flex";
    document.getElementById("catch-overlay-title").textContent =
      "Catch The Object";
    document.getElementById("catch-overlay-msg").innerHTML =
      "Tangkap 🍎 hindari 💣<br>Gunakan ← → atau sentuh layar";
    document.querySelector("#catch-overlay .game-btn").onclick = startCatch;
  }
}

// Override showPage to trigger setup
const _origShowPage = showPage;
window.showPage = function (id) {
  _origShowPage(id);
  onPageShown(id);
};

// ===================================================
//   STARTUP
// ===================================================
window.addEventListener("DOMContentLoaded", () => {
  spawnLoadingParticles();
  spawnFloatingEmojis();
  runLoading();

  // Animate game cards on scroll
  const cards = document.querySelectorAll(".game-card");
  cards.forEach((card, i) => {
    card.style.opacity = "0";
    card.style.transform = "translateY(30px)";
    setTimeout(
      () => {
        card.style.transition =
          "opacity 0.5s ease, transform 0.5s cubic-bezier(0.4,0,0.2,1)";
        card.style.opacity = "1";
        card.style.transform = "translateY(0)";
      },
      200 + i * 80,
    );
  });
});

// Resize canvas on window resize
window.addEventListener("resize", () => {
  if (confettiCanvas) {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }
});
