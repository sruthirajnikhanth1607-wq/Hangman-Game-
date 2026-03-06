/**
 * File: js/main.js
 * Author: Sruthi Rajnikhanth
 * Date: 2026
 * Description: Controller layer — wires model (game.js) to view (ui.js),
 *              handles all events, and manages localStorage history.
 */

"use strict";

/* ─────────────────────────────────────────────────────────────
 * localStorage helpers
 * ───────────────────────────────────────────────────────────── */
const HISTORY_KEY = "hangman_history";

/**
 * Load saved game history.
 * @returns {Array<{date:string, score:number, won:number}>}
 */
function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) { return []; }
}

/**
 * Append a result to history, capped at 10 entries.
 * @param {number} score
 * @param {number} wonCount
 */
function saveHistory(score, wonCount) {
  const history = loadHistory();
  const date    = new Date().toLocaleDateString("en-CA",
    { month: "short", day: "numeric", year: "numeric" });
  history.unshift({ date, score, won: wonCount });
  if (history.length > 10) history.length = 10;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

/* ─────────────────────────────────────────────────────────────
 * Module state
 * ───────────────────────────────────────────────────────────── */
/** @type {HangmanGame} */
let game;

/** Prevents double-guessing during the pause between rounds. */
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
 * Bootstrap on page load
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

  drawSplash(splashCanvas, () => startBtn.classList.remove("hidden"));

  startBtn.addEventListener("click", startGame);
  helpBtn.addEventListener("click", toggleHelp);
  helpCloseBtn.addEventListener("click", toggleHelp);
  playAgainBtn.addEventListener("click", startGame);

  document.addEventListener("keydown", e => {
    const key = e.key.toUpperCase();
    if (key.length === 1 && key >= "A" && key <= "Z") handleGuess(key);
  });
});

/* ─────────────────────────────────────────────────────────────
 * Game lifecycle
 * ───────────────────────────────────────────────────────────── */

/** Start or restart a full game session. */
function startGame() {
  game        = new HangmanGame();
  roundEnding = false;
  helpPanel.classList.add("hidden");
  showScreen("game-screen");
  beginRound();
}

/** Set up the UI for the current round. */
function beginRound() {
  roundEnding = false;
  const round = game.startNextRound();

  roundMsgEl.textContent = "";
  roundMsgEl.className   = "";

  drawHangman(gameCanvas, 0);
  categoryEl.textContent = `Category: ${round.category}`;
  renderWordDisplay(wordDisplayEl, round.getRevealedLetters());
  updateWrongDisplay(wrongEl, 0);
  updateScoreDisplay(scoreEl, game.score);
  updateRoundDisplay(roundEl, game.currentRoundNumber, ROUNDS_TOTAL);
  buildLetterButtons(letterGridEl, handleGuess);
}

/**
 * Process a letter guess.
 * @param {string} letter - uppercase A–Z
 */
function handleGuess(letter) {
  if (roundEnding) return;
  const round = game.currentRound;
  if (!round || round.isOver()) return;

  // Grab button BEFORE any DOM changes so position is valid for popup
  const btn = letterGridEl.querySelector(`[data-letter="${letter}"]`);
  if (!btn || btn.disabled) return;

  const result = round.guess(letter);
  if (result === "already") return;

  // On correct: show popup and update score immediately
  if (result === "correct") {
    showPointsPopup(btn, POINTS_LETTER);
    game.score += POINTS_LETTER;
    updateScoreDisplay(scoreEl, game.score);
  }

  markLetterButton(letterGridEl, letter, result);

  const newSet = result === "correct" ? new Set([letter]) : new Set();
  renderWordDisplay(wordDisplayEl, round.getRevealedLetters(), newSet);

  drawHangman(gameCanvas, round.wrongCount);
  updateWrongDisplay(wrongEl, round.wrongCount);

  if (round.isOver()) endRound();
}

/** Finalise the round, show message, then advance or end. */
function endRound() {
  roundEnding = true;
  disableAllLetterButtons(letterGridEl);

  const round = game.currentRound;
  const won   = round.isWordSolved();
  const bonus = round.bonusPoints();

  // Add bonus to score and update display immediately
  if (won && bonus > 0) {
    game.score += bonus;
    updateScoreDisplay(scoreEl, game.score);

    // Show bonus popup centred above the word display
    const popup = document.createElement("div");
    popup.classList.add("points-popup");
    popup.textContent = `🌸 Bonus +${bonus} pts!`;
    popup.style.left  = "50%";
    popup.style.top   = `${wordDisplayEl.getBoundingClientRect().top + window.scrollY}px`;
    document.body.appendChild(popup);
    popup.addEventListener("animationend", () => popup.remove());
  }

  // Log round result (letter pts already counted live, bonus already added above)
  game.roundLog.push({ word: round.word, won, points: round.pointsEarned() });
  game.roundIndex++;

  // Round end message
  roundMsgEl.className   = won ? "win" : "lose";
  roundMsgEl.textContent = won
    ? bonus > 0 ? `✓ Word solved! +${bonus} bonus pts 🌸` : `✓ Word solved!`
    : `✗ The word was: ${round.word}`;

  setTimeout(() => {
    if (game.isGameOver()) {
      finishGame();
    } else {
      updateRoundDisplay(roundEl, game.currentRoundNumber, ROUNDS_TOTAL);
      beginRound();
    }
  }, 2200);
}

/** Save history and show the results screen. */
function finishGame() {
  const wonCount = game.roundLog.filter(r => r.won).length;
  saveHistory(game.score, wonCount);
  showResults(game.score, game.roundLog, loadHistory());
}

/* ─────────────────────────────────────────────────────────────
 * Help toggle
 * ───────────────────────────────────────────────────────────── */
function toggleHelp() {
  helpPanel.classList.toggle("hidden");
}