/**
 * File: js/words.js
 * Author: CS1XD3 Student
 * Date: 2026
 * Description: Word bank used by the Hangman game.
 *              Each entry has a word and a category hint.
 *              Words are grouped so the game can sample variety.
 */

"use strict";

/** @type {Array<{word: string, category: string}>} */
const WORD_BANK = [
  // Animals
  { word: "ELEPHANT",   category: "Animal" },
  { word: "PENGUIN",    category: "Animal" },
  { word: "CROCODILE",  category: "Animal" },
  { word: "BUTTERFLY",  category: "Animal" },
  { word: "CHIMPANZEE", category: "Animal" },
  { word: "RHINOCEROS", category: "Animal" },
  { word: "PLATYPUS",   category: "Animal" },
  { word: "JAGUAR",     category: "Animal" },

  // Countries
  { word: "BRAZIL",     category: "Country" },
  { word: "CANADA",     category: "Country" },
  { word: "PORTUGAL",   category: "Country" },
  { word: "ARGENTINA",  category: "Country" },
  { word: "INDONESIA",  category: "Country" },
  { word: "ETHIOPIA",   category: "Country" },
  { word: "UKRAINE",    category: "Country" },
  { word: "COLOMBIA",   category: "Country" },

  // Foods
  { word: "AVOCADO",    category: "Food" },
  { word: "CINNAMON",   category: "Food" },
  { word: "BROCCOLI",   category: "Food" },
  { word: "RASPBERRY",  category: "Food" },
  { word: "ARTICHOKE",  category: "Food" },
  { word: "BLUEBERRY",  category: "Food" },
  { word: "MOZZARELLA", category: "Food" },
  { word: "TANGERINE",  category: "Food" },

  // Science
  { word: "GRAVITY",    category: "Science" },
  { word: "MOLECULE",   category: "Science" },
  { word: "HYDROGEN",   category: "Science" },
  { word: "ELECTRON",   category: "Science" },
  { word: "NITROGEN",   category: "Science" },
  { word: "TELESCOPE",  category: "Science" },
  { word: "OSMOSIS",    category: "Science" },
  { word: "CHROMOSOME", category: "Science" },

  // Sports
  { word: "BASEBALL",   category: "Sport" },
  { word: "VOLLEYBALL", category: "Sport" },
  { word: "GYMNASTICS", category: "Sport" },
  { word: "BADMINTON",  category: "Sport" },
  { word: "LACROSSE",   category: "Sport" },
  { word: "FENCING",    category: "Sport" },
  { word: "ARCHERY",    category: "Sport" },
  { word: "WRESTLING",  category: "Sport" },

  // Tech
  { word: "ALGORITHM",  category: "Technology" },
  { word: "DATABASE",   category: "Technology" },
  { word: "BANDWIDTH",  category: "Technology" },
  { word: "COMPILER",   category: "Technology" },
  { word: "KEYBOARD",   category: "Technology" },
  { word: "JAVASCRIPT", category: "Technology" },
  { word: "FIRMWARE",   category: "Technology" },
  { word: "PROTOCOL",   category: "Technology" },
];