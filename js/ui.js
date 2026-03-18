/**
 * File: js/ui.js
 * Author: Sruthi Rajnikhanth
 * Date: 2026
 * Description: View layer — all canvas drawing and DOM rendering.
 *              Never reads from the DOM to get model state.
 */

"use strict";

/* ─────────────────────────────────────────────────────────────
 * Hangman dialogue
 * ───────────────────────────────────────────────────────────── */

/** Sassy lines for wrong guesses, indexed by wrongCount (1–6). */
const WRONG_LINES = [
  null, // 0 wrong — silence
  "Hmm. Bold choice.",
  "That was not it.",
  "Are you guessing randomly?",
  "I am losing hope here.",
  "One more wrong and that's it.",
  "Well. This is awkward.",
];

/** Lines for correct guesses — picked randomly. */
const CORRECT_LINES = [
  "Oh. Fine.",
  "That one actually counts.",
  "Pure luck, I'm sure.",
  "Nice...",
  "I'll allow it.",
  "Okay, not bad.",
];

/** Lines when the word is solved. */
const WIN_LINES = [
  "Ugh, you got it. 🙄",
  "I let you win, obviously.",
  "Fine. This round goes to you.",
  "You got it. Happy now?",
];

/** Lines when the player loses. */
const LOSE_LINES = [
  "I tried to warn you.",
  "Told you so.",
  "This is entirely your fault.",
  "Better luck next round.",
];

/** Currently displayed speech bubble text (null = none). */
let _bubbleText  = null;
let _bubbleTimer = null;

/**
 * Show or hide the speech bubble DOM element above the hangman canvas.
 * @param {string|null} text
 * @param {number}      ms   — auto-hide after this many ms (default 2200)
 */
function setBubble(text, ms = 2200) {
  _bubbleText = text;
  if (_bubbleTimer) clearTimeout(_bubbleTimer);

  let el = document.getElementById("hangman-bubble");

  if (!text) {
    if (el) el.classList.remove("visible");
    return;
  }

  // Create element if it doesn't exist yet
  if (!el) {
    el = document.createElement("div");
    el.id = "hangman-bubble";
    const wrapper = document.getElementById("canvas-wrapper");
    wrapper.insertBefore(el, wrapper.firstChild);
  }

  el.textContent = text;
  // Force reflow so re-triggering the animation works
  el.classList.remove("visible");
  void el.offsetWidth;
  el.classList.add("visible");

  _bubbleTimer = setTimeout(() => {
    el.classList.remove("visible");
    _bubbleText = null;
  }, ms);
}

/** Pick a random element from an array. */
function _pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* ─────────────────────────────────────────────────────────────
 * Splash canvas animation
 * ───────────────────────────────────────────────────────────── */

/**
 * Draw and animate the splash screen canvas.
 * Calls onComplete when the animation finishes.
 * @param {HTMLCanvasElement} canvas
 * @param {function} onComplete
 */
function drawSplash(canvas, onComplete) {
  const ctx = canvas.getContext("2d");
  const W   = canvas.width;   // 380
  const H   = canvas.height;  // 300

  /* -- background gradient -- */
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0,   "#fffaf6");
  bg.addColorStop(0.5, "#fef4ed");
  bg.addColorStop(1,   "#fdeee4");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  /* -- soft blobs for warmth -- */
  const blob = (x, y, r, col) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0,   col);
    g.addColorStop(1,   "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  };
  blob(50,  50,  90, "rgba(232,165,152,.20)");
  blob(W-45, H-45, 100, "rgba(122,158,126,.13)");
  blob(W-35, 35,  55, "rgba(196,117,106,.09)");

  /* -- gallows in terracotta -- */
  ctx.strokeStyle = "#c4756a";
  ctx.lineWidth   = 2.5;
  ctx.lineCap     = "round";
  ctx.beginPath(); ctx.moveTo(28, H-24); ctx.lineTo(W-28, H-24); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(42, H-24); ctx.lineTo(42, 34); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(42, 34); ctx.lineTo(130, 34); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(130, 34); ctx.lineTo(130, 65); ctx.stroke();

  /* -- ghost figure (very faint) -- */
  ctx.strokeStyle = "rgba(196,117,106,.13)";
  ctx.lineWidth   = 3;
  ctx.beginPath(); ctx.arc(130, 82, 16, 0, Math.PI*2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(130, 98);  ctx.lineTo(130, 148); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(108, 116); ctx.lineTo(152, 116); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(130, 148); ctx.lineTo(108, 184); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(130, 148); ctx.lineTo(152, 184); ctx.stroke();

  /* -- animated title typewriter -- */
  const title      = "HANGMAN";
  const fontSize   = 24;
  const letterGap  = 28;
  const startX     = (W - (title.length - 1) * letterGap) / 2;
  const titleY     = H - 55;
  let   charIndex  = 0;

  ctx.font      = `900 italic ${fontSize}px 'Playfair Display', serif`;
  ctx.textAlign = "left";

  ctx.fillStyle = "rgba(196,117,106,.09)";
  for (let i = 0; i < title.length; i++) {
    ctx.fillText(title[i], startX + i * letterGap, titleY);
  }

  let subAlpha = 0;

  function typeChar() {
    ctx.font         = `900 italic ${fontSize}px 'Playfair Display', serif`;
    ctx.textAlign    = "left";
    ctx.fillStyle    = "#a84e35";
    ctx.shadowColor  = "rgba(196,117,106,.38)";
    ctx.shadowBlur   = 14;
    ctx.fillText(title[charIndex], startX + charIndex * letterGap, titleY);
    ctx.shadowBlur   = 0;
    charIndex++;

    if (charIndex < title.length) {
      setTimeout(typeChar, 105);
    } else {
      fadeSubtitle();
    }
  }

  function fadeSubtitle() {
    subAlpha = Math.min(subAlpha + 0.045, 1);
    ctx.clearRect(0, H - 34, W, 24);
    ctx.font      = `13px 'DM Mono', monospace`;
    ctx.fillStyle = `rgba(158,126,110,${subAlpha})`;
    ctx.textAlign = "center";
    ctx.fillText("a classic word game", W / 2, H - 16);
    if (subAlpha < 1) {
      requestAnimationFrame(fadeSubtitle);
    } else {
      onComplete();
    }
  }

  setTimeout(typeChar, 400);
}

/* ─────────────────────────────────────────────────────────────
 * Game canvas — hangman figure
 * ───────────────────────────────────────────────────────────── */

/**
 * Redraw the hangman figure based on wrong guess count.
 * @param {HTMLCanvasElement} canvas
 * @param {number} wrongCount  0–6
 */
function drawHangman(canvas, wrongCount) {
  const ctx = canvas.getContext("2d");
  const W   = canvas.width;   // 220
  const H   = canvas.height;  // 200

  ctx.clearRect(0, 0, W, H);

  // warm background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#fffaf6");
  bg.addColorStop(1, "#fef2ea");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // soft warm blob top-right
  const g = ctx.createRadialGradient(W*.85, H*.15, 0, W*.85, H*.15, 75);
  g.addColorStop(0, "rgba(232,165,152,.16)"); g.addColorStop(1, "transparent");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  // gallows
  ctx.strokeStyle = "#c4756a";
  ctx.lineWidth   = 2.5;
  ctx.lineCap     = "round";
  ctx.beginPath(); ctx.moveTo(18, H-14); ctx.lineTo(W-18, H-14); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(48, H-14); ctx.lineTo(48, 18); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(48, 18);   ctx.lineTo(145, 18); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(145, 18);  ctx.lineTo(145, 46); ctx.stroke();

  // body colour
  const isLost    = wrongCount >= MAX_WRONG;
  ctx.strokeStyle = isLost ? "#b84040" : "#3d2b1f";
  ctx.lineWidth   = 3;

  const headX = 145;
  const headY = 60;

  const parts = [
    () => { ctx.beginPath(); ctx.arc(headX, headY, 14, 0, Math.PI*2); ctx.stroke(); },
    () => { ctx.beginPath(); ctx.moveTo(145, 74); ctx.lineTo(145, 122); ctx.stroke(); },
    () => { ctx.beginPath(); ctx.moveTo(145, 90); ctx.lineTo(118, 110); ctx.stroke(); },
    () => { ctx.beginPath(); ctx.moveTo(145, 90); ctx.lineTo(172, 110); ctx.stroke(); },
    () => { ctx.beginPath(); ctx.moveTo(145, 122); ctx.lineTo(118, 155); ctx.stroke(); },
    () => { ctx.beginPath(); ctx.moveTo(145, 122); ctx.lineTo(172, 155); ctx.stroke(); },
  ];

  for (let i = 0; i < wrongCount && i < parts.length; i++) parts[i]();

  // X eyes on loss
  if (isLost) {
    ctx.strokeStyle = "#b84040";
    ctx.lineWidth   = 2;
    ctx.beginPath(); ctx.moveTo(138,54); ctx.lineTo(142,58); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(142,54); ctx.lineTo(138,58); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(148,54); ctx.lineTo(152,58); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(152,54); ctx.lineTo(148,58); ctx.stroke();
    ctx.beginPath(); ctx.arc(145, 68, 5, .2*Math.PI, .8*Math.PI); ctx.stroke();
  }

}

/* ─────────────────────────────────────────────────────────────
 * Word display
 * ───────────────────────────────────────────────────────────── */

/**
 * Render letter slots. Newly revealed letters get a pop-in animation.
 * @param {HTMLElement} container
 * @param {string[]}    revealed   array from round.getRevealedLetters()
 * @param {Set<string>} [newlyRevealed]  letters to animate
 */
function renderWordDisplay(container, revealed, newlyRevealed = new Set()) {
  container.innerHTML = "";
  revealed.forEach(ch => {
    const slot = document.createElement("span");
    slot.classList.add("letter-slot");
    slot.textContent = ch;
    if (ch && newlyRevealed.has(ch)) slot.classList.add("reveal");
    container.appendChild(slot);
  });
}

/* ─────────────────────────────────────────────────────────────
 * Letter buttons
 * ───────────────────────────────────────────────────────────── */

/**
 * Build A–Z letter buttons.
 * @param {HTMLElement}          container
 * @param {function(string):void} onGuess
 */
function buildLetterButtons(container, onGuess) {
  container.innerHTML = "";
  for (let code = 65; code <= 90; code++) {
    const letter = String.fromCharCode(code);
    const btn    = document.createElement("button");
    btn.textContent    = letter;
    btn.classList.add("letter-btn");
    btn.dataset.letter = letter;
    btn.addEventListener("click", () => onGuess(letter));
    container.appendChild(btn);
  }
}

/**
 * Mark a letter button as correct or wrong and disable it.
 * @param {HTMLElement}          container
 * @param {string}               letter
 * @param {"correct"|"wrong"}    result
 */
function markLetterButton(container, letter, result) {
  const btn = container.querySelector(`[data-letter="${letter}"]`);
  if (!btn) return;
  btn.disabled = true;
  btn.classList.add(result);
}

/** Disable every letter button. @param {HTMLElement} container */
function disableAllLetterButtons(container) {
  container.querySelectorAll(".letter-btn").forEach(b => { b.disabled = true; });
}

/* ─────────────────────────────────────────────────────────────
 * Floating +pts pop-up
 * ───────────────────────────────────────────────────────────── */

/**
 * Show a floating "+N pts" bubble that rises and fades near the button.
 * @param {HTMLElement} btn
 * @param {number}      pts
 */
function showPointsPopup(btn, pts) {
  const rect   = btn.getBoundingClientRect();
  const popup  = document.createElement("div");
  popup.classList.add("points-popup");
  popup.textContent  = `+${pts} pts`;
  popup.style.left   = `${rect.left + rect.width / 2}px`;
  popup.style.top    = `${rect.top + window.scrollY}px`;
  document.body.appendChild(popup);
  popup.addEventListener("animationend", () => popup.remove());
}

/* ─────────────────────────────────────────────────────────────
 * Status bar helpers
 * ───────────────────────────────────────────────────────────── */

/** @param {HTMLElement} el @param {number} score */
function updateScoreDisplay(el, score) { el.textContent = `Score: ${score}`; }

/** @param {HTMLElement} el @param {number} cur @param {number} tot */
function updateRoundDisplay(el, cur, tot) { el.textContent = `Round ${cur} / ${tot}`; }

/** @param {HTMLElement} el @param {number} wrong */
function updateWrongDisplay(el, wrong) { el.textContent = `❌ ${wrong} / ${MAX_WRONG}`; }

/* ─────────────────────────────────────────────────────────────
 * Screen switching
 * ───────────────────────────────────────────────────────────── */

/** @param {string} id */
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  window.scrollTo(0, 0);
}

/* ─────────────────────────────────────────────────────────────
 * Results screen
 * ───────────────────────────────────────────────────────────── */

/**
 * Populate and display the results screen.
 * @param {number} finalScore
 * @param {Array}  roundLog
 * @param {Array}  history
 */
function showResults(finalScore, roundLog, history) {
  const won = roundLog.filter(r => r.won).length;

  document.getElementById("results-title").textContent =
    won >= 4 ? "You crushed it! 🌸" :
    won >= 3 ? "Well done! 🌿" :
               "Better luck next time 🌷";

  document.getElementById("results-score").textContent =
    `Final score: ${finalScore}  ·  ${won} / ${ROUNDS_TOTAL} rounds won`;

  const msgEl = document.getElementById("results-message");
  msgEl.innerHTML = roundLog.map((r, i) =>
    `Round ${i+1}: <strong>${r.word}</strong> — ${r.won ? "✓ +" + r.points + " pts" : "✗ missed"}`
  ).join("<br>");

  const histEl = document.getElementById("history-list");
  histEl.innerHTML = "";
  if (!history.length) {
    const li = document.createElement("li");
    li.textContent = "No previous games yet.";
    histEl.appendChild(li);
  } else {
    history.forEach(e => {
      const li = document.createElement("li");
      li.textContent = `${e.date}  ·  ${e.score} pts  ·  ${e.won}/${ROUNDS_TOTAL} won`;
      histEl.appendChild(li);
    });
  }

  showScreen("results-screen");
}