/* eslint-disable no-undef */

// STATE

const sentSoundUrl = require("url:./assets/audio/sent.mp3");
const sentSound = new Audio(sentSoundUrl);
const suggestionSoundUrl = require("url:./assets/audio/suggestion.wav");
const suggestionSound = new Audio(suggestionSoundUrl);
const confettiSoundUrl = require("url:./assets/audio/confetti.wav");
const confettiSound = new Audio(confettiSoundUrl);
const listenStartSoundUrl = require("url:./assets/audio/listenStart.wav");
const listenStartSound = new Audio(listenStartSoundUrl);
const listenStopSoundUrl = require("url:./assets/audio/listenStop.wav");
const listenStopSound = new Audio(listenStopSoundUrl);

suggestionSound.volume = 0.4;
listenStartSound.volume = 0.1;
listenStopSound.volume = 0.1;
confettiSound.volume = 0.2;

// EXPORT

module.exports = {
  sentSound,
  suggestionSound,
  confettiSound,
  listenStartSound,
  listenStopSound,
};
