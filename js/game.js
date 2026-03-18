/**
 * File: js/game.js
 * Author: CS1XD3 Student
 * Date: 2026
 * Description: Model layer for the Hangman game.
 *              Contains the Round class (single-round state)
 *              and the HangmanGame class (overall session state).
 *              No DOM manipulation here — purely model/logic.
 */

"use strict";

/* ─────────────────────────────────────────────────────────────
 * Constants
 * ───────────────────────────────────────────────────────────── */
const MAX_WRONG     = 6;  // wrong guesses allowed per round
const ROUNDS_TOTAL  = 5;  // rounds per game session
const POINTS_LETTER = 10; // points awarded per correct letter
const POINTS_BONUS  = 50; // bonus for guessing word with ≤ 2 wrong

/* ─────────────────────────────────────────────────────────────
 * Class: Round
 * Tracks the state of a single round of Hangman.
 * ───────────────────────────────────────────────────────────── */
class Round {
  /**
   * @param {{word: string, category: string}} wordEntry
   */
  constructor(wordEntry) {
    /** @type {string} The target word (uppercase) */
    this.word = wordEntry.word;

    /** @type {string} Category hint for this word */
    this.category = wordEntry.category;

    /** @type {Set<string>} Letters the user has guessed */
    this.guessed = new Set();

    /** @type {number} Count of wrong guesses this round */
    this.wrongCount = 0;
  }

  /**
   * Guess a single letter.
   * @param {string} letter - uppercase single character
   * @returns {"already"|"correct"|"wrong"} result of the guess
   */
  guess(letter) {
    if (this.guessed.has(letter)) return "already";
    this.guessed.add(letter);

    if (this.word.includes(letter)) {
      return "correct";
    } else {
      this.wrongCount++;
      return "wrong";
    }
  }

  /**
   * Returns an array where each element is the letter (if guessed)
   * or "" (if not yet revealed).
   * @returns {string[]}
   */
  getRevealedLetters() {
    return this.word.split("").map(ch => this.guessed.has(ch) ? ch : "");
  }

  /**
   * @returns {boolean} true if all letters have been guessed
   */
  isWordSolved() {
    return this.word.split("").every(ch => this.guessed.has(ch));
  }

  /**
   * @returns {boolean} true if the player has used all wrong guesses
   */
  isLost() {
    return this.wrongCount >= MAX_WRONG;
  }

  /**
   * @returns {boolean} true if this round has ended (won or lost)
   */
  isOver() {
    return this.isWordSolved() || this.isLost();
  }

  /**
   * Calculate points earned for this round.
   * @returns {number}
   */
  pointsEarned() {
    if (!this.isWordSolved()) return 0;
    const letterCount = new Set(this.word.split("")).size;
    const base  = letterCount * POINTS_LETTER;
    const bonus = this.wrongCount <= 2 ? POINTS_BONUS : 0;
    return base + bonus;
  }

  /**
   * Returns only the bonus points (letter points are already counted live).
   * @returns {number}
   */
  bonusPoints() {
    if (!this.isWordSolved()) return 0;
    return this.wrongCount <= 2 ? POINTS_BONUS : 0;
  }
}

/* ─────────────────────────────────────────────────────────────
 * Class: HangmanGame
 * Manages the overall game session: rounds, score, word picking.
 * ───────────────────────────────────────────────────────────── */
class HangmanGame {
  constructor() {
    /** @type {number} Accumulated score */
    this.score = 0;

    /** @type {number} Current 0-based round index */
    this.roundIndex = 0;

    /** @type {Round|null} Active round object */
    this.currentRound = null;

    /** @type {string[]} Words used this session (no repeats) */
    this.usedWords = [];

    /** @type {Array<{word:string, won:boolean, points:number}>} Round log */
    this.roundLog = [];
  }

  /**
   * Start a new round by picking a fresh word from WORD_BANK.
   * @returns {Round} the newly created Round
   */
  startNextRound() {
    const available = WORD_BANK.filter(e => !this.usedWords.includes(e.word));
    // Pick random entry
    const entry = available[Math.floor(Math.random() * available.length)];
    this.usedWords.push(entry.word);
    this.currentRound = new Round(entry);
    return this.currentRound;
  }

  /**
   * Finalise the current round: log result only.
   * Score is managed live in main.js (letter pts per guess + bonus at round end).
   */
  finaliseRound() {
    const r   = this.currentRound;
    const won = r.isWordSolved();
    this.roundLog.push({ word: r.word, won, points: r.pointsEarned() });
    this.roundIndex++;
  }

  /**
   * @returns {boolean} true when all rounds have been played
   */
  isGameOver() {
    return this.roundIndex >= ROUNDS_TOTAL;
  }

  /**
   * @returns {number} 0-based current round number (before finalise)
   */
  get currentRoundNumber() {
    return this.roundIndex + 1; // 1-based for display
  }
}