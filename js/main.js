/**
 * File: js/main.js
 * Author: Sruthi Rajnikhanth
 * Date: 2026
 * Description: Controller layer — wires model (game.js) to view (ui.js),
 *              handles all events, and manages localStorage history.
 *              Game state is persisted so a page refresh resumes mid-game.
 */

"use strict";

/* ─────────────────────────────────────────────────────────────
 * localStorage keys
 * ───────────────────────────────────────────────────────────── */
const HISTORY_KEY    = "hangman_history";
const GAME_STATE_KEY = "hangman_game_state";

/* ─────────────────────────────────────────────────────────────
 * History helpers
 * ───────────────────────────────────────────────────────────── */

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) { return []; }
}

function saveHistory(score, wonCount) {
  const history = loadHistory();
  const date    = new Date().toLocaleDateString("en-CA",
    { month: "short", day: "numeric", year: "numeric" });
  history.unshift({ date, score, won: wonCount });
  if (history.length > 10) history.length = 10;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

/* ─────────────────────────────────────────────────────────────
 * Game-state persistence helpers
 * ───────────────────────────────────────────────────────────── */

function saveGameState() {
  if (!game) return;
  const round = game.currentRound;
  const state = {
    score:      game.score,
    roundIndex: game.roundIndex,
    usedWords:  game.usedWords,
    roundLog:   game.roundLog,
    currentRound: round ? {
      word:       round.word,
      category:   round.category,
      guessed:    Array.from(round.guessed),
      wrongCount: round.wrongCount,
    } : null,
  };
  try {
    localStorage.setItem(GAME_STATE_KEY, JSON.stringify(state));
  } catch (_) {}
}

function loadGameState() {
  try {
    const raw = localStorage.getItem(GAME_STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}

function clearGameState() {
  localStorage.removeItem(GAME_STATE_KEY);
}

function restoreGame(state) {
  const g      = new HangmanGame();
  g.score      = state.score;
  g.roundIndex = state.roundIndex;
  g.usedWords  = state.usedWords;
  g.roundLog   = state.roundLog;
  if (state.currentRound) {
    const r      = new Round({ word: state.currentRound.word, category: state.currentRound.category });
    r.guessed    = new Set(state.currentRound.guessed);
    r.wrongCount = state.currentRound.wrongCount;
    g.currentRound = r;
  }
  return g;
}

/* ─────────────────────────────────────────────────────────────
 * Module state
 * ───────────────────────────────────────────────────────────── */
/** @type {HangmanGame} */
let game;
let roundEnding = false;

/* ─────────────────────────────────────────────────────────────
 * Cached DOM references
 * ───────────────────────────────────────────────────────────── */
let splashCanvas, startBtn, gameCanvas,
    scoreEl, roundEl, wrongEl, categoryEl,
    wordDisplayEl, letterGridEl,
    helpBtn, helpPanel, helpCloseBtn,
    roundMsgEl, playAgainBtn;

/* ─────────────────────────────────────────────────────────────
 * Bootstrap
 * ───────────────────────────────────────────────────────────── */
window.addEventListener("load", () => {
  splashCanvas  = document.getElementById("splash-canvas");
  startBtn      = document.getElementById("start-btn");
  gameCanvas    = document.getElementById("game-canvas");
  scoreEl       = document.getElementById("score-display");
  roundEl       = document.getElementById("round-display");
  wrongEl       = document.getElementById("wrong-display");
  categoryEl    = document.getElementById("category-display");
  wordDisplayEl = document.getElementById("word-display");
  letterGridEl  = document.getElementById("letter-buttons");
  helpBtn       = document.getElementById("help-btn");
  helpPanel     = document.getElementById("help-panel");
  helpCloseBtn  = document.getElementById("help-close-btn");
  roundMsgEl    = document.getElementById("round-msg");
  playAgainBtn  = document.getElementById("play-again-btn");

  helpBtn.addEventListener("click", toggleHelp);
  helpCloseBtn.addEventListener("click", toggleHelp);
  playAgainBtn.addEventListener("click", startGame);

  document.addEventListener("keydown", e => {
    const key = e.key.toUpperCase();
    if (key.length === 1 && key >= "A" && key <= "Z") handleGuess(key);
  });

  const saved = loadGameState();
  if (saved && saved.currentRound && saved.roundIndex < ROUNDS_TOTAL) {
    try {
      game = restoreGame(saved);
      showScreen("game-screen");
      resumeRound();
    } catch(e) {
      clearGameState();
      drawSplash(splashCanvas, () => startBtn.classList.remove("hidden"));
      startBtn.addEventListener("click", startGame);
    }
  } else {
    drawSplash(splashCanvas, () => startBtn.classList.remove("hidden"));
    startBtn.addEventListener("click", startGame);
  }
});

/* ─────────────────────────────────────────────────────────────
 * Game lifecycle
 * ───────────────────────────────────────────────────────────── */

function startGame() {
  clearGameState();
  game        = new HangmanGame();
  roundEnding = false;
  helpPanel.classList.add("hidden");
  showScreen("game-screen");
  beginRound();
}

function beginRound() {
  roundEnding = false;
  const round = game.startNextRound();

  setBubble(null); // clear any leftover bubble
  roundMsgEl.textContent = "";
  roundMsgEl.className   = "";

  drawHangman(gameCanvas, 0);
  categoryEl.textContent = `Category: ${round.category}`;
  renderWordDisplay(wordDisplayEl, round.getRevealedLetters());
  updateWrongDisplay(wrongEl, 0);
  updateScoreDisplay(scoreEl, game.score);
  updateRoundDisplay(roundEl, game.currentRoundNumber, ROUNDS_TOTAL);
  buildLetterButtons(letterGridEl, handleGuess);

  saveGameState();
}

function resumeRound() {
  roundEnding = false;
  const round = game.currentRound;

  setBubble(null);
  roundMsgEl.textContent = "";
  roundMsgEl.className   = "";

  drawHangman(gameCanvas, round.wrongCount);
  categoryEl.textContent = `Category: ${round.category}`;
  renderWordDisplay(wordDisplayEl, round.getRevealedLetters());
  updateWrongDisplay(wrongEl, round.wrongCount);
  updateScoreDisplay(scoreEl, game.score);
  updateRoundDisplay(roundEl, game.currentRoundNumber, ROUNDS_TOTAL);

  buildLetterButtons(letterGridEl, handleGuess);
  round.guessed.forEach(letter => {
    const result = round.word.includes(letter) ? "correct" : "wrong";
    markLetterButton(letterGridEl, letter, result);
  });

  if (round.isOver()) endRound();
}

function handleGuess(letter) {
  if (roundEnding) return;
  const round = game.currentRound;
  if (!round || round.isOver()) return;

  const btn = letterGridEl.querySelector(`[data-letter="${letter}"]`);
  if (!btn || btn.disabled) return;

  const result = round.guess(letter);
  if (result === "already") return;

  if (result === "correct") {
    showPointsPopup(btn, POINTS_LETTER);
    game.score += POINTS_LETTER;
    updateScoreDisplay(scoreEl, game.score);

    // Sassy correct-guess line (skip if this was the winning guess — endRound handles that)
    if (!round.isWordSolved()) {
      setBubble(_pick(CORRECT_LINES), 1800);
    }
  } else {
    // Wrong guess — show the indexed snarky line for this wrong count
    const line = WRONG_LINES[round.wrongCount] || _pick(WRONG_LINES.slice(1));
    setBubble(line, 2000);
  }

  markLetterButton(letterGridEl, letter, result);

  const newSet = result === "correct" ? new Set([letter]) : new Set();
  renderWordDisplay(wordDisplayEl, round.getRevealedLetters(), newSet);

  drawHangman(gameCanvas, round.wrongCount);
  updateWrongDisplay(wrongEl, round.wrongCount);

  saveGameState();

  if (round.isOver()) endRound();
}

function endRound() {
  roundEnding = true;
  disableAllLetterButtons(letterGridEl);

  const round = game.currentRound;
  const won   = round.isWordSolved();
  const bonus = round.bonusPoints();

  // Final bubble for win or loss
  setBubble(_pick(won ? WIN_LINES : LOSE_LINES), 2000);
  drawHangman(gameCanvas, round.wrongCount); // redraw immediately to show bubble

  if (won && bonus > 0) {
    game.score += bonus;
    updateScoreDisplay(scoreEl, game.score);

    const popup = document.createElement("div");
    popup.classList.add("points-popup");
    popup.textContent = `🌸 Bonus +${bonus} pts!`;
    popup.style.left  = "50%";
    popup.style.top   = `${wordDisplayEl.getBoundingClientRect().top + window.scrollY}px`;
    document.body.appendChild(popup);
    popup.addEventListener("animationend", () => popup.remove());
  }

  game.roundLog.push({ word: round.word, won, points: round.pointsEarned() });
  game.roundIndex++;

  roundMsgEl.className   = won ? "win" : "lose";
  roundMsgEl.textContent = won
    ? bonus > 0 ? `✓ Word solved! +${bonus} bonus pts 🌸` : `✓ Word solved!`
    : `✗ The word was: ${round.word}`;

  saveGameState();

  setTimeout(() => {
    if (game.isGameOver()) {
      finishGame();
    } else {
      updateRoundDisplay(roundEl, game.currentRoundNumber, ROUNDS_TOTAL);
      beginRound();
    }
  }, 2200);
}

function finishGame() {
  const wonCount = game.roundLog.filter(r => r.won).length;
  saveHistory(game.score, wonCount);
  clearGameState();
  showResults(game.score, game.roundLog, loadHistory());
}

/* ─────────────────────────────────────────────────────────────
 * Help toggle
 * ───────────────────────────────────────────────────────────── */
function toggleHelp() {
  helpPanel.classList.toggle("hidden");
}